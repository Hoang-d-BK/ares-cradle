import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const compile = (path, localRequire, cache = new Map()) => {
  if (cache.has(path)) return cache.get(path).exports;
  const module = { exports: {} };
  cache.set(path, module);
  const source = require('node:fs').readFileSync(path, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
};

function harness({ started = false } = {}) {
  const values = new Map();
  const writes = [];
  globalThis.window = { localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { writes.push([key, value]); values.set(key, value); },
  } };
  globalThis.document = { hidden: false, pointerLockElement: null, querySelector: () => null, exitPointerLock() {} };
  let gameplayStarted = started;
  const cache = new Map();
  const localRequire = (id) => {
    if (id === 'zustand') return { create: (initialize) => {
      let state;
      const set = (update) => { const patch = typeof update === 'function' ? update(state) : update; if (patch) state = { ...state, ...patch }; };
      state = initialize(set, () => state);
      return { getState: () => state, setState: set };
    } };
    if (id === 'react') return { useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot() };
    if (id === '@/modules/session/gameSession') return compile(resolve(root, 'src/modules/session/gameSession.ts'), localRequire, cache);
    if (id === '@/modules/outpost-3d/worldRegions' || id === './worldRegions' || id === '../outpost-3d/worldRegions') return compile(resolve(root, 'src/modules/outpost-3d/worldRegions.ts'), localRequire, cache);
    if (id === '@/modules/character/physicsEngine') return compile(resolve(root, 'src/modules/character/physicsEngine.ts'), localRequire, cache);
    if (id === './expeditionProgress') return compile(resolve(root, 'src/modules/store/expeditionProgress.ts'), localRequire, cache);
    if (id === './explorationProgress') return compile(resolve(root, 'src/modules/store/explorationProgress.ts'), localRequire, cache);
    if (id === '../outpost-3d/scienceCatalog') return compile(resolve(root, 'src/modules/outpost-3d/scienceCatalog.ts'), localRequire, cache);
    if (id === './scienceInteraction' || id === '../outpost-3d/scienceInteraction') return compile(resolve(root, 'src/modules/outpost-3d/scienceInteraction.ts'), localRequire, cache);
    if (id === './naturalSiteDefinitions' || id === '../outpost-3d/naturalSiteDefinitions') return compile(resolve(root, 'src/modules/outpost-3d/naturalSiteDefinitions.ts'), localRequire, cache);
    if (id === '../../game/mission/activities/rules') return compile(resolve(root, 'src/game/mission/activities/rules.ts'), localRequire, cache);
    if (id === '@/services/api') return { missionService: { submitStageResult() {} } };
    if (id === '@/services/api/MockMissionService') return { STAGES_FIXTURES: [null, { sol: 1, initialBatteryKwh: 80, batteryCapacityKwh: 100, initialOxygenPercent: 20.9, initialTemperatureCelsius: 20, initialDustCoverage: 0, events: [], durationSeconds: 60 }] };
    if (id === '@/modules/audio/soundEngine') return { soundEngine: new Proxy({}, { get: () => () => {} }) };
    if (id === '@/modules/story-engine/services/marsWeatherService') return {};
    if (id === './useStoryStore') return { useStoryStore: { getState: () => ({ completeObjective() {}, triggerFieldToast() {} }) } };
    if (id === '@/modules/survival-ui/itemRegistry') return {};
    throw new Error(`Unexpected import in ELON MARS inspection test: ${id}`);
  };
  const session = compile(resolve(root, 'src/modules/session/gameSession.ts'), localRequire, cache);
  if (started) session.startGameplay();
  const storeModule = compile(resolve(root, 'src/modules/store/useOutpostStore.ts'), localRequire, cache);
  const world = compile(resolve(root, 'src/modules/outpost-3d/worldRegions.ts'), localRequire, cache);
  const science = compile(resolve(root, 'src/modules/outpost-3d/scienceCatalog.ts'), localRequire, cache);
  const sites = compile(resolve(root, 'src/modules/outpost-3d/naturalSiteDefinitions.ts'), localRequire, cache);
  const progress = compile(resolve(root, 'src/modules/store/explorationProgress.ts'), localRequire, cache);
  return { started, start() { session.startGameplay(); }, store: storeModule.useOutpostStore, values, writes, world, science, sites, progress };
}

const poseAt = (world, proxy, edge = 0) => {
  const x = proxy.position.x + proxy.radius + edge;
  return [x, world.sampleWorldGround(x, proxy.position.z), proxy.position.z];
};

test('pre-START tick, science inspection, and rover control do not change progress or supplies', () => {
  const h = harness();
  const before = h.store.getState().exploration;
  h.store.getState().tick(1);
  assert.strictEqual(h.store.getState().exploration, before);
  const impactProxy = h.sites.NATURAL_INSPECTION_PROXIES.find(({ scienceId, radius }) => scienceId === 'impact.science-1' && radius < 3);
  h.store.setState({ isManualOpen: false, isPlayerGrounded: true, playerPos: poseAt(h.world, impactProxy) });
  assert.equal(h.store.getState().inspectScientificElement('impact.science-1'), false);
  const console = h.world.WORLD_REGIONS.find(({ id }) => id === 'impact').baseConsole;
  h.store.setState({ playerPos: [console.x, h.world.sampleWorldGround(console.x, console.z), console.z] });
  h.store.getState().toggleDrivingRover();
  assert.equal(h.store.getState().isDrivingRover, false);
  assert.equal(h.writes.length, 0);
  assert.strictEqual(h.store.getState().exploration, before);
});

test('each canonical discovery requires the actual grounded human or assigned rover proxy and awards capped supplies once', () => {
  const h = harness();
  h.start();
  h.store.setState({ exploration: { ...h.store.getState().exploration, survival: { air: 100, meals: 12, energyEU: 100 } } });
  const initial = h.store.getState().exploration;
  for (const region of h.world.WORLD_REGIONS) {
    const elements = h.science.SCIENTIFIC_ELEMENTS.filter(({ regionId }) => regionId === region.id);
    assert.equal(elements.length, 3);
    for (const [index, element] of elements.entries()) {
      const proxies = h.sites.NATURAL_INSPECTION_PROXIES.filter(({ scienceId }) => scienceId === element.id);
      assert.ok(proxies.length > 0, `${element.id} has at least one actual natural proxy`);
      const proxy = proxies.find(({ radius }) => radius < 3) ?? proxies[0];
      const pose = poseAt(h.world, proxy);
      h.store.setState({ isManualOpen: false, isBackpackOpen: false, isDatapadOpen: false, isClassroomOpen: false,
        isBrownoutQuizOpen: false, isCelebrationOpen: false, activeScienceEntryId: null,
        isDrivingRover: false, remoteRegionId: null, isPlayerGrounded: true, playerPos: pose });
      if (element.id === 'impact.science-1') {
        h.store.setState({ playerPos: poseAt(h.world, proxy, 4.5001) });
        assert.equal(h.store.getState().inspectScientificElement(element.id), false, 'outside the 4.5m footprint-edge range fails');
        h.store.setState({ playerPos: pose });
        assert.equal(h.store.getState().inspectScientificElement(element.id), true);
      } else if (element.id === 'impact.science-2') {
        h.store.setState({ isPlayerGrounded: false });
        assert.equal(h.store.getState().inspectScientificElement(element.id), false, 'airborne human cannot inspect');
        h.store.setState({ isPlayerGrounded: true });
        assert.equal(h.store.getState().inspectScientificElement(element.id), true);
      } else {
        assert.equal(h.store.getState().inspectScientificElement(element.id), true);
      }
      assert.ok(h.store.getState().exploration.collected.includes(element.id));
      if (index < 2) assert.equal(h.store.getState().exploration.completedRegions.includes(region.id), false);
      else {
        const awarded = h.store.getState().exploration;
        assert.ok(awarded.rewardedRegions.includes(region.id));
        const count = h.writes.filter(([key]) => key === 'ares-cradle-exploration-v1').length;
        h.store.setState({ activeScienceEntryId: null, playerPos: pose });
        assert.equal(h.store.getState().inspectScientificElement(element.id), true, 'revisit opens the existing note without collecting again');
        assert.equal(h.store.getState().exploration.revision, awarded.revision);
        assert.equal(h.writes.filter(([key]) => key === 'ares-cradle-exploration-v1').length, count);
      }
    }
    const completed = h.store.getState().exploration;
    assert.ok(completed.survival.air <= 100 && completed.survival.meals <= 12 && completed.survival.energyEU <= 100);
    assert.deepEqual(completed.completedRegions, h.world.WORLD_REGIONS.slice(0, h.world.WORLD_REGIONS.indexOf(region) + 1).map(({ id }) => id));
    assert.equal(completed.rewardedRegions.length, h.world.WORLD_REGIONS.indexOf(region) + 1);
  }
  const final = h.store.getState().exploration;
  assert.equal(final.collected.length, 15);
  assert.deepEqual(final.rewardedRegions, h.world.WORLD_REGIONS.map(({ id }) => id));
  const snapshot = JSON.parse(h.values.get('ares-cradle-exploration-v1'));
  assert.deepEqual(snapshot, final);
  const persisted = h.progress.parseExplorationProgress(h.values.get('ares-cradle-exploration-v1'));
  assert.equal(persisted.ok, true);
});

test('assigned rover must be in the current matching region; unknown and invalid site context fail closed', () => {
  const h = harness({ started: true });
  const element = h.science.SCIENTIFIC_ELEMENTS.find(({ id }) => id === 'ice.science-1');
  const proxy = h.sites.NATURAL_INSPECTION_PROXIES.find(({ scienceId, radius }) => scienceId === element.id && radius < 3);
  const pose = poseAt(h.world, proxy);
  h.store.setState({ isManualOpen: false, isDrivingRover: true, remoteRegionId: 'dust', roverPos: pose, isPlayerGrounded: true });
  assert.equal(h.store.getState().inspectScientificElement(element.id), false);
  assert.equal(h.store.getState().inspectScientificElement('unknown.site'), false);
  h.store.setState({ remoteRegionId: 'ice', roverPos: [pose[0], pose[1] + 2.5001, pose[2]] });
  assert.equal(h.store.getState().inspectScientificElement(element.id), false);
  h.store.setState({ roverPos: pose });
  assert.equal(h.store.getState().inspectScientificElement(element.id), true);
});

test('source copy retains exact official NASA evidence limits and source dates', () => {
  const h = harness();
  const elements = h.science.SCIENTIFIC_ELEMENTS;
  assert.equal(elements.length, 15);
  assert.ok(elements.every(({ sourceUrl, sourceObservation, credit, summary, explanation, scienceBoundary }) =>
    new URL(sourceUrl).protocol === 'https:' && ['science.nasa.gov', 'www.nasa.gov'].includes(new URL(sourceUrl).hostname) &&
    [sourceObservation, credit, summary, explanation, scienceBoundary].every((value) => typeof value === 'string' && value.length > 0)));
  const byId = Object.fromEntries(elements.map((entry) => [entry.id, entry]));
  assert.equal(byId['ice.science-1'].sourceDate, 'October 26, 2023');
  assert.equal(byId['ice.science-2'].sourceDate, 'March 2, 2010');
  assert.match(byId['volcano.science-1'].scienceBoundary, /no local composition/i);
  assert.match(byId['volcano.science-3'].scienceBoundary, /No active eruption/i);
  assert.match(byId['lake.science-3'].scienceBoundary, /no confirmed biosignature/i);
  assert.match(byId['ice.science-1'].explanation, /not ready to drink/i);
});

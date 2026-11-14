import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const compileModule = async (relativePath) => {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
};

const contentUrl = await compileModule('../../src/game/mission/content.ts');
const rulesUrl = await compileModule('../../src/game/mission/activities/rules.ts');
const contractUrl = await compileModule('../../src/game/mission/contract.ts');
const stateSource = await readFile(new URL('../../src/game/mission/state.ts', import.meta.url), 'utf8');
const stateCompiled = ts.transpileModule(stateSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText
  .replaceAll("from './content'", `from '${contentUrl}'`)
  .replaceAll("from './activities/rules'", `from '${rulesUrl}'`)
  .replaceAll("from './contract'", `from '${contractUrl}'`);
const stateUrl = `data:text/javascript;base64,${Buffer.from(stateCompiled).toString('base64')}`;
const mission = await import(stateUrl);
const content = await import(contentUrl);

const moveToRegion = (state, region) => mission.missionReducer(state, {
  type: 'MOVE',
  actor: 'leo',
  pose: { x: content.regionById(region).center[0], z: content.regionById(region).center[1], heading: 0 },
});

const gatherAndPay = (state, region) => {
  for (const observation of content.regionById(region).observations.slice(0, 2)) {
    state = mission.missionReducer(state, { type: 'OBSERVE', region, id: observation.id });
  }
  return mission.missionReducer(state, { type: 'PAY_SURVEY', region });
};

test('initial mission validates and round-trips without changing defaults', () => {
  const initial = mission.initialMission();
  assert.deepEqual(mission.validateMission(initial), initial);
});

test('validator rejects forged activity and report flags without solved progress', () => {
  const forged = structuredClone(mission.initialMission());
  forged.surveys.impact.activityDone = true;
  forged.bases.impact.report = true;
  assert.equal(mission.validateMission(forged), null);
});

test('two regions observe and pay once from their own base; repeat payment is idempotent', () => {
  let state = mission.initialMission();
  state = mission.missionReducer(state, { type: 'START', region: 'impact' });
  state = gatherAndPay(state, 'impact');
  state = moveToRegion(state, 'dust');
  state = mission.missionReducer(state, { type: 'UNLOCK', region: 'dust' });
  state = gatherAndPay(state, 'dust');

  for (const region of ['impact', 'dust']) {
    assert.equal(state.surveys[region].observations.length, 2);
    assert.equal(state.surveys[region].paid, true);
    assert.deepEqual(state.bases[region].stock, { energy: 10, meals: 3, water: 4, air: 3 });
    const afterFirstPayment = state;
    state = mission.missionReducer(state, { type: 'PAY_SURVEY', region });
    assert.deepEqual(state, afterFirstPayment, `${region} repeat payment does not charge again`);
  }
});

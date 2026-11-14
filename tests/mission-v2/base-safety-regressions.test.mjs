import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

// Reuse integration-state's TypeScript-transpile/data-URL harness for the real reducer.
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
const source = await readFile(new URL('../../src/game/mission/state.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText
  .replaceAll("from './content'", `from '${contentUrl}'`)
  .replaceAll("from './activities/rules'", `from '${rulesUrl}'`)
  .replaceAll("from './contract'", `from '${contractUrl}'`);
const stateUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
const mission = await import(stateUrl);
const content = await import(contentUrl);
const center = (region) => content.regionById(region).center;
const pose = (region, dx = 0, dz = 0) => ({ x: center(region)[0] + dx, z: center(region)[1] + dz, heading: 0 });
const reduce = (state, event) => mission.missionReducer(state, event);

 test('initial, start and travel use clear base apron poses; rover and Leo can reach the console', () => {
  const initial = mission.initialMission('impact');
  const console = pose('impact', 0, 8);
  for (const [region, p] of Object.entries(initial.rovers)) {
    const [x, z] = center(region);
    assert.ok(Math.abs(p.x - x) >= 9 || Math.abs(p.z - z) >= 7, `${region} rover must be outside the 18x14 base shell`);
  }
  let state = initial;
  assert.ok(Math.hypot(state.leo.x - console.x, state.leo.z - console.z) <= 8, 'Leo spawn must remain within console interaction radius');
  state = reduce(state, { type: 'START', region: 'impact' });
  assert.deepEqual(state.leo, pose('impact', 0, 12));
  state = reduce(state, { type: 'START', region: 'impact' });
  assert.deepEqual(state.leo, pose('impact', 0, 12));
  state = reduce(state, { type: 'TRAVEL', region: 'impact' });
  assert.deepEqual(state.leo, pose('impact', 0, 12));
});

test('BASE_CHECK requires started mission and Leo at unlocked selected base, not a nearby rover', () => {
  let state = mission.initialMission('impact');
  state = reduce(state, { type: 'BASE_CHECK', region: 'impact', check: 'comms' });
  assert.equal(state.bases.impact.checks.comms, false, 'pre-start checks are denied');
  state = reduce(state, { type: 'START', region: 'impact' });
  state = { ...state, bases: { ...state.bases, dust: { ...state.bases.dust, unlocked: true } }, activeRover: 'dust', leo: pose('impact'), rovers: { ...state.rovers, dust: pose('dust', 0, 8) } };
  const before = state;
  state = reduce(state, { type: 'BASE_CHECK', region: 'dust', check: 'airheat' });
  assert.equal(state, before, 'nearby rover must not satisfy Leo-local base check');
  state = { ...state, activeRover: null, leo: pose('dust', 0, 12) };
  state = reduce(state, { type: 'BASE_CHECK', region: 'dust', check: 'airheat' });
  assert.equal(state.bases.dust.checks.airheat, true, 'Leo in activation radius may complete check');
});

test('TRANSFER preserves GO plus unpaid-shift and optional-operation commitments', () => {
  let state = mission.initialMission();
  state = { ...state,
    started: true,
    bases: Object.fromEntries(Object.entries(state.bases).map(([id, base]) => [id, { ...base, unlocked: true }])),
    surveys: { ...state.surveys, impact: { ...state.surveys.impact, supportBaseId: 'impact', paid: true, operation: null } },
  };
  state.bases.impact.stock = { energy: 11, meals: 3, water: 3, air: 3 };
  const before = state;
  state = reduce(state, { type: 'TRANSFER', from: 'impact', to: 'dust', id: 'reserved-optional', stock: { energy: 2, meals: 0, water: 0, air: 0 } });
  assert.equal(state, before, 'paid essential shift must reserve optional 2 EU until the job completes');
  state = { ...before, surveys: { ...before.surveys, impact: { ...before.surveys.impact, paid: false } }, bases: { ...before.bases, impact: { ...before.bases.impact, stock: { energy: 13, meals: 4, water: 4, air: 4 } } } };
  const unpaid = state;
  state = reduce(state, { type: 'TRANSFER', from: 'impact', to: 'dust', id: 'reserved-unpaid', stock: { energy: 2, meals: 0, water: 0, air: 0 } });
  assert.equal(state, unpaid, 'unpaid shift must reserve remaining essential and optional costs beyond GO floor');
});

test('support recovery defers optional work and cannot subsequently buy it', () => {
  let state = mission.initialMission();
  state = reduce(state, { type: 'START', region: 'impact' });
  for (const observation of content.regionById('impact').observations.slice(0, 2)) {
    state = reduce(state, { type: 'OBSERVE', region: 'impact', id: observation.id });
  }
  state = reduce(state, { type: 'PAY_SURVEY', region: 'impact' });
  const complete = { kind: 'impact', version: 1, matches: [
    { signal: 'signal-rim', context: 'frame-rim' },
    { signal: 'signal-basin', context: 'frame-basin' },
    { signal: 'signal-slope', context: 'frame-slope' },
  ] };
  state = reduce(state, { type: 'ACTIVITY_PROGRESS', region: 'impact', progress: complete });
  state = reduce(state, { type: 'ACTIVITY_COMPLETE', region: 'impact' });
  state = { ...state, bases: { ...state.bases, impact: { ...state.bases.impact, stock: { energy: 7, meals: 3, water: 3, air: 3 } } } };
  state = reduce(state, { type: 'SUPPORT', region: 'impact' });
  assert.equal(state.surveys.impact.deferred, 'support-recovery');
  const recovered = state;
  const actualOperationId = content.regionById('impact').operations[0].id;
  state = reduce(state, { type: 'CHOOSE_OPERATION', region: 'impact', operationId: actualOperationId });
  assert.equal(state, recovered, 'support recovery must not restore optional-job authorization');
});

test('post-report SUPPORT recovers GO floor exactly once and cannot exceed maximum stock', () => {
  let state = mission.initialMission();
  state = { ...state, started: true,
    bases: Object.fromEntries(Object.entries(state.bases).map(([id, base]) => [id, { ...base, unlocked: true, report: true }])),
    surveys: Object.fromEntries(Object.entries(state.surveys).map(([id, survey]) => [id, { ...survey, supportBaseId: 'impact', paid: true, deferred: 'support-recovery' }])),
  };
  state.bases.impact.stock = { energy: 7, meals: 3, water: 3, air: 3 };
  state = reduce(state, { type: 'SUPPORT', region: 'impact' });
  assert.equal(state.bases.impact.stock.energy, 8, 'support must repair one-EU post-report HOLD to GO');
  const once = state;
  state = reduce(state, { type: 'SUPPORT', region: 'impact' });
  assert.equal(state, once, 'same need cannot be granted twice');
  const maxed = { ...once, bases: { ...once.bases, impact: { ...once.bases.impact, stock: { energy: 999999, meals: 999999, water: 999999, air: 999999 } } } };
  assert.equal(reduce(maxed, { type: 'SUPPORT', region: 'dust' }), maxed, 'overflow/max-stock support must be rejected without mutation');
});

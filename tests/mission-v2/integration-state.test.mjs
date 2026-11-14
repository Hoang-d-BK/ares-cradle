import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTsModule } from './support/load-ts-module.mjs';

const mission = await loadTsModule('../../src/game/mission/state.ts', import.meta.url);
const content = await loadTsModule('../../src/game/mission/content.ts', import.meta.url);

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

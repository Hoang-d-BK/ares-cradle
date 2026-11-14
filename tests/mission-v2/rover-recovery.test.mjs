import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTsModule } from './support/load-ts-module.mjs';

const mission = await loadTsModule('../../src/game/mission/state.ts', import.meta.url);
const navigation = await loadTsModule('../../src/game/mission/world/worldNavigation.ts', import.meta.url);
const regions = ['impact', 'dust', 'volcano', 'ice', 'lake'];
const obstacle = { x: -261.5, z: -250, heading: 1.25 };
const trapped = { x: -270, z: -250, heading: 1.25 };
const clear = { x: -257.5, z: -250, heading: 2.5 };
const cramped = { x: -259.4, z: -250, heading: 2.5 };

const startedImpact = () => {
  let state = mission.initialMission();
  state = mission.missionReducer(state, { type: 'START', region: 'impact' });
  state = mission.missionReducer(state, { type: 'ENTER_ROVER', region: 'impact' });
  return state;
};

test('bounded recovery preserves heading, determinism, maximum displacement, and world bounds', () => {
  const recovered = navigation.findNearestSafeRoverPose(obstacle);
  assert.ok(recovered);
  assert.equal(recovered.heading, obstacle.heading);
  assert.ok(Math.hypot(recovered.x - obstacle.x, recovered.z - obstacle.z) <= 8);
  assert.equal(navigation.findNearestSafeRoverPose(obstacle)?.x, recovered.x);
  assert.equal(navigation.findNearestSafeRoverPose(obstacle)?.z, recovered.z);
  assert.equal(navigation.canOccupy(recovered.x, recovered.z, 2.25), true);
  assert.equal(navigation.findNearestSafeRoverPose({ ...obstacle, x: NaN }), null);
  assert.equal(navigation.findNearestSafeRoverPose(trapped), null);
  const edge = navigation.findNearestSafeRoverPose({ x: -299, z: 10, heading: 4 });
  if (edge) assert.equal(navigation.canOccupy(edge.x, edge.z, 2.25), true);
});

test('MOVE retains last clear anchor across accepted cramped and no-op moves; HELP is local and idempotent', () => {
  let state = startedImpact();
  state = mission.missionReducer(state, { type: 'MOVE', actor: 'impact', pose: clear });
  state = mission.missionReducer(state, { type: 'MOVE', actor: 'impact', pose: cramped });
  assert.equal(navigation.canOccupy(state.rovers.impact.x, state.rovers.impact.z, 1.35), true);
  assert.equal(navigation.canOccupy(state.rovers.impact.x, state.rovers.impact.z, 2.25), false);
  assert.deepEqual(state.roverSafePoses.impact, clear);
  const crampedAgain = { ...cramped, z: -250.2 };
  state = mission.missionReducer(state, { type: 'MOVE', actor: 'impact', pose: crampedAgain });
  assert.deepEqual(state.roverSafePoses.impact, clear);
  state = mission.missionReducer(state, { type: 'MOVE', actor: 'impact', pose: crampedAgain });
  assert.deepEqual(state.roverSafePoses.impact, clear);

  const stocks = structuredClone(state.bases);
  const surveys = structuredClone(state.surveys);
  const transactions = [...state.transactions];
  const supportIds = [...state.supportIds];
  const leoReturnPose = structuredClone(state.leoReturnPose);
  state = mission.missionReducer(state, { type: 'HELP_ROVER' });
  assert.deepEqual(state.rovers.impact, clear);
  assert.deepEqual(state.roverSafePoses.impact, clear);
  assert.deepEqual(state.bases, stocks);
  assert.deepEqual(state.surveys, surveys);
  assert.deepEqual(state.transactions, transactions);
  assert.deepEqual(state.supportIds, supportIds);
  assert.deepEqual(state.leoReturnPose, leoReturnPose);
  const recovered = structuredClone(state.rovers);
  state = mission.missionReducer(state, { type: 'HELP_ROVER' });
  assert.deepEqual(state.rovers, recovered);
});

test('HELP requires active rover and changes only that rover', () => {
  const idle = mission.initialMission();
  assert.equal(mission.missionReducer(idle, { type: 'HELP_ROVER' }), idle);
  let state = startedImpact();
  state = { ...state, rovers: { ...state.rovers, impact: trapped } };
  const others = Object.fromEntries(regions.filter(id => id !== 'impact').map(id => [id, state.rovers[id]]));
  const beforeSafe = Object.fromEntries(regions.filter(id => id !== 'impact').map(id => [id, state.roverSafePoses[id]]));
  state = mission.missionReducer(state, { type: 'HELP_ROVER' });
  for (const id of regions.filter(id => id !== 'impact')) {
    assert.deepEqual(state.rovers[id], others[id]);
    assert.deepEqual(state.roverSafePoses[id], beforeSafe[id]);
  }
});

test('legacy v2 save normalizes optional history without rewriting rover or evidence', () => {
  const state = mission.initialMission();
  const legacy = structuredClone(state);
  delete legacy.roverSafePoses;
  legacy.rovers.impact = obstacle;
  const normalized = mission.validateMission(legacy);
  assert.ok(normalized);
  assert.deepEqual(normalized.rovers, legacy.rovers);
  assert.deepEqual(normalized.surveys, legacy.surveys);
  assert.deepEqual(normalized.transactions, legacy.transactions);
  assert.deepEqual(normalized.roverSafePoses.impact, { x: -192, z: -158, heading: 0 });
  assert.deepEqual(Object.keys(normalized.roverSafePoses).sort(), [...regions].sort());
  assert.deepEqual(mission.validateMission(normalized), normalized);
  assert.equal(mission.validateMission({ ...legacy, unexpected: true }), null);
});

test('malformed persisted history is rejected rather than restored unsafely', () => {
  const state = mission.initialMission();
  assert.equal(mission.validateMission({ ...state, roverSafePoses: { ...state.roverSafePoses, extra: state.rovers.impact } }), null);
  assert.equal(mission.validateMission({ ...state, roverSafePoses: { ...state.roverSafePoses, ice: obstacle } }), null);
  assert.equal(mission.validateMission({ ...state, roverSafePoses: { ...state.roverSafePoses, dust: { x: Infinity, z: 0, heading: 0 } } }), null);
});

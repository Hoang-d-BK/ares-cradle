import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { loadTsModule } from '../mission-v2/support/load-ts-module.mjs';

const physics = await loadTsModule('../../src/modules/character/physicsEngine.ts', import.meta.url);
const { PHYSICS_CONSTANTS, stepPlayerPhysics } = physics;
const world = await loadTsModule('../../src/modules/outpost-3d/worldRegions.ts', import.meta.url);
const { sampleWorldGround } = world;
const floors = await loadTsModule('../../src/modules/outpost-3d/habitatFloorDefinitions.ts', import.meta.url);
const initial = (x, z, y, vy = 0, isGrounded = false) => ({
  x, y, z, vy, isGrounded, isBlocked: false, blockedByLabel: null,
  blockedObstacleJumpable: false, standingOnLabel: null,
});
const step = (state, dt = 0.05) => stepPlayerPhysics(
  state, { moveX: 0, moveZ: 0, jumpJustPressed: false, dt }, []
);
function fallToSupport(x, z, startY) {
  let state = initial(x, z, startY, -0.1);
  for (let frame = 0; frame < 120 && !state.isGrounded; frame += 1) state = step(state);
  assert.equal(state.isGrounded, true, `actor lands at (${x}, ${z})`);
  return state;
}

test('descending player lands on the actual habitat ramp, deck, and first stair tread', () => {
  const ramp = floors.sampleHabitatFloorSupport(0, 4.8);
  const deck = floors.sampleHabitatFloorSupport(2, -0.2);
  const firstTread = floors.HABITAT_STAIR_TREADS[0];
  const treadX = floors.HABITAT_STAIR_GROUP_POSITION[0] + firstTread.position[0];
  const treadZ = floors.HABITAT_STAIR_GROUP_POSITION[2] + firstTread.position[2];
  const treadTopY = floors.HABITAT_STAIR_GROUP_POSITION[1] + firstTread.position[1] + firstTread.size[1] / 2;
  const tread = floors.sampleHabitatFloorSupport(
    treadX, treadZ, 0, treadTopY + PHYSICS_CONSTANTS.STEP_UP_TOLERANCE
  );
  assert.equal(ramp.id, 'habitat-ramp');
  assert.ok(Math.abs(ramp.topY - (-0.2 + 0.08 / Math.cos(0.18))) < 1e-9);
  assert.equal(deck.id, 'habitat-observation-deck');
  assert.ok(Math.abs(deck.topY - 1.91) < 1e-9);
  assert.equal(tread.id, 'habitat-stair-tread');

  for (const [x, z, support] of [
    [0, 4.8, ramp], [2, -0.2, deck],
  ]) {
    const landed = fallToSupport(x, z, support.topY + 1);
    assert.ok(Math.abs(landed.y - support.topY) < 1e-8, `${support.label} top is exact`);
    assert.equal(landed.standingOnLabel, support.label);
  }
});

test('lower stair tread stays usable beneath the overlapping upper deck', () => {
  const tread = floors.HABITAT_STAIR_TREADS[0];
  const x = floors.HABITAT_STAIR_GROUP_POSITION[0] + tread.position[0];
  const z = floors.HABITAT_STAIR_GROUP_POSITION[2] + tread.position[2];
  const topY = floors.HABITAT_STAIR_GROUP_POSITION[1] + tread.position[1] + tread.size[1] / 2;
  const lowerOnly = floors.sampleHabitatFloorSupport(x, z, 0, topY + PHYSICS_CONSTANTS.STEP_UP_TOLERANCE);
  assert.equal(lowerOnly.id, 'habitat-stair-tread');
  assert.equal(lowerOnly.topY, topY);
  const landed = fallToSupport(x, z, topY + 0.05);
  assert.ok(Math.abs(landed.y - topY) < 1e-8);
});

test('deck has no invisible floor or snap from below its actual top', () => {
  const state = step(initial(2, -0.2, sampleWorldGround(2, -0.2)));
  assert.equal(state.y, sampleWorldGround(2, -0.2));
  assert.equal(state.isGrounded, true);
  assert.equal(state.standingOnLabel, null);
});

test('grounded astronaut boots clear the plinth at rest', async () => {
  const source = await readFile(new URL('../../src/modules/character/AstronautPlayer.tsx', import.meta.url), 'utf8');
  const bodyOffset = Number(source.match(/<group ref=\{bodyScaleRef\} position=\{\[0, ([\d.]+), 0\]\}>/)?.[1]);
  const leg = source.match(/<mesh ref=\{leftLegRef\} position=\{\[[-\d.]+, ([-\d.]+), [-\d.]+\]\}[^>]*>\s*<boxGeometry args=\{\[[-\d.]+, ([\d.]+), [-\d.]+\]\}/);
  assert.ok(Number.isFinite(bodyOffset), 'body contact offset is applied');
  assert.ok(leg, 'reads the actual rendered leg dimensions');
  const restingFootBottom = bodyOffset + Number(leg[1]) - Number(leg[2]) / 2;
  assert.ok(restingFootBottom >= 0 && restingFootBottom <= 0.04,
    `resting boot bottom remains within 4cm of the rendered floor (got ${restingFootBottom}m)`);
  assert.match(source, /groupRef\.current\.position\.y = nextPhysics\.y \+ \(Math\.sin\(state\.clock\.getElapsedTime\(\) \* 2\.5\) \+ 1\) \* 0\.015/,
    'grounded idle bounce never dips the actor root below its physics support');
});

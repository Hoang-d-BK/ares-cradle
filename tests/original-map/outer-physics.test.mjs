import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTsModule } from '../mission-v2/support/load-ts-module.mjs';

const physics = await loadTsModule('../../src/modules/character/physicsEngine.ts', import.meta.url);
const world = await loadTsModule('../../src/modules/outpost-3d/worldRegions.ts', import.meta.url);
const { PHYSICS_CONSTANTS, STATIC_WORLD_COLLIDERS, buildWorldColliders, canRoverOccupy, stepPlayerPhysics } = physics;
const { ROVER_ROUTES, WORLD_BOUNDS, WORLD_GROUND_Y, WORLD_REGIONS, sampleWorldGround } = world;
const sites = await loadTsModule('../../src/modules/outpost-3d/naturalSiteDefinitions.ts', import.meta.url);
const { NATURAL_ROCK_SCATTER } = sites;
const initial = (x, z, y = sampleWorldGround(x, z)) => ({
  x, y, z, vy: 0, isGrounded: true, isBlocked: false, blockedByLabel: null,
  blockedObstacleJumpable: false, standingOnLabel: null,
});
const step = (state, moveX = 0, moveZ = 0, jumpJustPressed = false, dt = 0.05) =>
  stepPlayerPhysics(state, { moveX, moveZ, jumpJustPressed, dt });

test('keeps the first 29 original colliders and replaces outer tech blockers with natural rock footprints', () => {
  assert.equal(STATIC_WORLD_COLLIDERS[0].id, 'habitat-dome-wall');
  assert.equal(STATIC_WORLD_COLLIDERS[28].id, 'mesa-west');
  const originalRover = STATIC_WORLD_COLLIDERS.find(({ id }) => id === 'legacy-mars-rover-exhibit');
  assert.ok(originalRover);
  assert.deepEqual([originalRover.x, originalRover.z, originalRover.radius], [3.8, -2.2, 0.95]);
  for (const collider of STATIC_WORLD_COLLIDERS) {
    assert.ok(!/base-console|radome|gantry|truss|strata-arch|discovery-|branch-/.test(collider.id), collider.id);
  }
  const natural = physics.buildOuterPhysicsAdapter();
  assert.equal(natural.length,
    NATURAL_ROCK_SCATTER.length + sites.NATURAL_LANDMARK_SUPPORTS.length + physics.buildCanonicalScienceColliders().length +
    natural.filter(({ id }) => /^(lava-tube-mouth-rock|ancient-vent-rock)-/.test(id)).length);
  for (const rock of NATURAL_ROCK_SCATTER) {
    const collider = natural.find(({ id }) => id === rock.id);
    assert.ok(collider, `${rock.id} has a collider matching its rendered proxy`);
    assert.deepEqual([collider.x, collider.z], [rock.position.x, rock.position.z]);
    assert.ok(collider.radius === rock.radius * 0.9, `${rock.id} collision footprint matches the bounded rendered hull allowance`);
    assert.ok(collider.topY >= sampleWorldGround(rock.position.x, rock.position.z) + rock.height * 0.68);
    assert.ok(collider.topY <= sampleWorldGround(rock.position.x, rock.position.z) + rock.height * 0.82);
  }
});

test('natural boulders remain locally collidable without forming region-scale walls', () => {
  const rover = STATIC_WORLD_COLLIDERS.find(({ id }) => id === 'legacy-mars-rover-exhibit');
  assert.equal(canRoverOccupy(rover.x, rover.z), false);
  assert.equal(canRoverOccupy(rover.x + rover.radius + PHYSICS_CONSTANTS.ROVER_RADIUS + 0.5, rover.z + 4), true);
  for (const rock of NATURAL_ROCK_SCATTER) {
    assert.equal(canRoverOccupy(rock.position.x, rock.position.z), false, `${rock.id} blocks its visible stone`);
    assert.equal(canRoverOccupy(rock.position.x + rock.radius + 3, rock.position.z), true, `${rock.id} has nearby clear approach`);
  }
  const scarp = sites.NATURAL_LANDMARK_SUPPORTS[0];
  const scarpCollider = physics.buildOuterPhysicsAdapter().find(({ id }) => id === scarp.id);
  assert.equal(canRoverOccupy(scarp.position.x, scarp.position.z), false, 'visible ice scarp has a natural footprint collider');
  const probeOutsideScarp = { x: scarp.position.x + scarp.halfX + 4, z: scarp.position.z };
  assert.equal(canRoverOccupy(probeOutsideScarp.x, probeOutsideScarp.z), true, 'ice scarp leaves a local walkable approach');
  let player = initial(scarp.position.x - scarp.halfX - 1, scarp.position.z);
  const destination = scarp.position.x;
  for (let index = 0; index < 40; index += 1) player = step(player, 4.2, 0, false, 0.05);
  assert.ok(player.x <= destination - PHYSICS_CONSTANTS.PLAYER_RADIUS + 0.02, `player cannot pass through scarp mesh: ${player.x}`);
  assert.ok(scarpCollider.topY > sampleWorldGround(scarp.position.x, scarp.position.z) + 1.9);
  for (const region of WORLD_REGIONS) {
    assert.equal(canRoverOccupy(region.safeParking.x, region.safeParking.z, 1.55), true,
      `${region.id} safe parking remains clear for the rover`);
  }
});

test('parked rover collider encloses authored playable model height and footprint', () => {
  const parked = buildWorldColliders([3.8, -0.32, -2.2], false).at(-1);
  assert.equal(parked.id, 'parked-mars-rover');
  assert.equal(parked.radius, 1.55);
  assert.equal(parked.topY, -0.32 + 1.6);
  assert.equal(buildWorldColliders([3.8, -0.32, -2.2], true), STATIC_WORLD_COLLIDERS);
});

test('samples exact home ground and lands on clear outer terrain without a nearby feature', () => {
  assert.equal(sampleWorldGround(209, 0), WORLD_GROUND_Y);
  assert.equal(sampleWorldGround(210, 0), WORLD_GROUND_Y);
  const x = 240;
  const z = -232;
  assert.equal(canRoverOccupy(x, z), true, 'fixture must be clear of nearby outer colliders');
  const originalGround = sampleWorldGround(x, z);
  assert.notEqual(originalGround, WORLD_GROUND_Y);
  const landed = step(initial(x, z, WORLD_GROUND_Y));
  assert.deepEqual([landed.x, landed.z], [x, z], 'stationary landing probe stays at the clear fixture point');
  assert.equal(landed.y, sampleWorldGround(landed.x, landed.z));
  assert.equal(landed.y, originalGround, 'clear-body landing equals the original sampled ground exactly');
  assert.equal(landed.isGrounded, true);
});

test('walks past the old 78m radius without wrapping at tested radii', () => {
  for (const x of [80, 100, 209, 260]) {
    const state = step(initial(x, 12), 4.2, 0);
    assert.ok(state.x > x, `x=${x} wrapped or stopped at ${state.x}`);
    assert.ok(Math.abs(state.x - (x + 4.2 * 0.05)) < 1e-8);
    assert.equal(state.z, 12);
  }
});

test('clamps actor center by radius at all four world edges without teleporting', () => {
  const radius = PHYSICS_CONSTANTS.PLAYER_RADIUS;
  for (const [start, direction, axis] of [
    [299.5, 1, 'x'], [-299.5, -1, 'x'], [299.5, 1, 'z'], [-299.5, -1, 'z'],
  ]) {
    const state = axis === 'x'
      ? step(initial(start, 0), direction * 4.2, 0)
      : step(initial(0, start), 0, direction * 4.2);
    const value = state[axis];
    assert.equal(value, direction * (WORLD_BOUNDS.maxX - radius));
    assert.equal(state.isBlocked, true);
    assert.equal(state.blockedByLabel, 'World Boundary');
    assert.equal(state[axis === 'x' ? 'vx' : 'vz'], 0);
    assert.ok(Math.abs(value - start) < 1);
  }
});

test('keeps the 1.55m rover clear along every authored route at half-meter samples', () => {
  for (const route of ROVER_ROUTES) {
    for (let segment = 1; segment < route.points.length; segment += 1) {
      const from = route.points[segment - 1];
      const to = route.points[segment];
      const steps = Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.5);
      for (let index = 0; index <= steps; index += 1) {
        const t = index / steps;
        const x = from.x + (to.x - from.x) * t;
        const z = from.z + (to.z - from.z) * t;
        assert.equal(canRoverOccupy(x, z, 1.55), true,
          `${route.regionId} route segment ${segment} blocked at (${x}, ${z})`);
      }
    }
  }
});

test('outer science anchors retain a rover-accessible approach inside 4.5m', () => {
  for (const region of WORLD_REGIONS) {
    for (const [index, anchor] of region.discoveries.entries()) {
      const approach = Array.from({ length: 16 }, (_, direction) => ({
        x: anchor.x + Math.cos(direction * Math.PI / 8) * 4.5,
        z: anchor.z + Math.sin(direction * Math.PI / 8) * 4.5,
      })).find(({ x, z }) => canRoverOccupy(x, z, 1.55));
      assert.ok(approach, `${region.id} discovery ${index + 1} has no clear rover approach within 4.5m`);
    }
  }
  const feature = NATURAL_ROCK_SCATTER.find(({ regionId }) => regionId === 'ice');
  assert.ok(feature);
  assert.equal(canRoverOccupy(feature.position.x, feature.position.z), false);
  assert.equal(canRoverOccupy(301, 0), false);
});

test('keeps the original jump, gravity and double-jump cycle on outer ground', () => {
  assert.equal(PHYSICS_CONSTANTS.JUMP_VELOCITY, 5.6);
  assert.equal(PHYSICS_CONSTANTS.DOUBLE_JUMP_VELOCITY, 5.2);
  assert.equal(PHYSICS_CONSTANTS.MARS_GRAVITY, 9.2);
  let state = step(initial(240, -240), 0, 0, true, 0.02);
  assert.equal(state.isGrounded, false);
  for (let i = 0; i < 10; i += 1) state = step(state, 0, 0, false, 0.03);
  state = step(state, 0, 0, true, 0.02);
  assert.equal(state.didDoubleJump, true);
  assert.equal(state.airJumpsLeft, 0);
  for (let i = 0; i < 80 && !state.isGrounded; i += 1) state = step(state, 0, 0, false, 0.03);
  assert.equal(state.isGrounded, true);
  assert.equal(state.y, sampleWorldGround(state.x, state.z));
});

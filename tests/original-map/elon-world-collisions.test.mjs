import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTsModule } from '../mission-v2/support/load-ts-module.mjs';

const physics = await loadTsModule('../../src/modules/character/physicsEngine.ts', import.meta.url);
const world = await loadTsModule('../../src/modules/outpost-3d/worldRegions.ts', import.meta.url);
const sites = await loadTsModule('../../src/modules/outpost-3d/naturalSiteDefinitions.ts', import.meta.url);
const science = await loadTsModule('../../src/modules/outpost-3d/scienceCatalog.ts', import.meta.url);
const {
  PHYSICS_CONSTANTS,
  STATIC_WORLD_COLLIDERS,
  buildCanonicalScienceColliders,
  buildOuterPhysicsAdapter,
  buildWorldColliders,
  canRoverOccupy,
  stepPlayerPhysics,
} = physics;
const { NATURAL_INSPECTION_PROXIES, NATURAL_LANDMARK_SUPPORTS, NATURAL_ROCK_SCATTER } = sites;
const { SCIENTIFIC_ELEMENTS } = science;
const { WORLD_BOUNDS, WORLD_REGIONS, sampleWorldGround } = world;

const initial = (x, z) => ({
  x, y: sampleWorldGround(x, z), z, vy: 0, isGrounded: true, isBlocked: false,
  blockedByLabel: null, blockedObstacleJumpable: false, standingOnLabel: null,
});
const step = (state, moveX = 0, moveZ = 0, dt = 0.05, colliders = STATIC_WORLD_COLLIDERS) =>
  stepPlayerPhysics(state, { moveX, moveZ, jumpJustPressed: false, dt }, colliders);

function advanceIntoCollider(collider) {
  let state = initial(collider.x - (collider.radius + PHYSICS_CONSTANTS.PLAYER_RADIUS + 0.35), collider.z);
  for (let index = 0; index < 24; index += 1) {
    state = step(state, PHYSICS_CONSTANTS.SPRINT_SPEED, 0, 0.5, [collider]);
  }
  return state;
}

test('canonical science meshes have local capsule footprints; airborne dust illustration stays intangible', () => {
  const colliders = buildCanonicalScienceColliders();
  assert.equal(SCIENTIFIC_ELEMENTS.length, 15);
  assert.equal(colliders.length, 15, 'all canonical outcrops have compact local footprints');
  for (const element of SCIENTIFIC_ELEMENTS) {
    const proxy = NATURAL_INSPECTION_PROXIES.find(({ scienceId, regionId, radius }) =>
      scienceId === element.id && regionId === element.regionId && radius < 3);
    assert.ok(proxy, `${element.id} has its existing canonical local proxy`);
    const collider = colliders.find(({ id }) => id === `solid-${element.id}`);
    assert.ok(collider, `${element.id} solid footprint exists`);
    if (element.kind === 'dust-devil') {
      assert.ok(collider.topY < sampleWorldGround(proxy.position.x, proxy.position.z),
        'airborne dust rings are nonblocking at walking height');
      continue;
    }
    assert.ok(collider.radius <= proxy.radius - PHYSICS_CONSTANTS.PLAYER_RADIUS,
      `${element.id} leaves its actor capsule outside the rendered proxy`);
    const blocked = advanceIntoCollider(collider);
    assert.ok(blocked.isBlocked, `${element.id} blocks actual movement`);
    assert.ok(blocked.x <= collider.x - collider.radius - PHYSICS_CONSTANTS.PLAYER_RADIUS + 0.03,
      `${element.id} stops the astronaut at its physical edge: ${blocked.x}`);
  }
});

test('all twenty scattered boulders collide locally and preserve clear inspection approaches', () => {
  const adapter = buildOuterPhysicsAdapter();
  const rockColliders = adapter.filter(({ id }) => NATURAL_ROCK_SCATTER.some((rock) => rock.id === id));
  assert.equal(NATURAL_ROCK_SCATTER.length, 20);
  assert.equal(rockColliders.length, 20);
  for (const rock of NATURAL_ROCK_SCATTER) {
    const collider = rockColliders.find(({ id }) => id === rock.id);
    assert.ok(collider.radius <= rock.radius, `${rock.id} physical footprint remains within the rendered proxy`);
    const blocked = advanceIntoCollider(collider);
    assert.ok(blocked.isBlocked, `${rock.id} blocks an astronaut capsule`);
    assert.ok(blocked.x <= rock.position.x - collider.radius - PHYSICS_CONSTANTS.PLAYER_RADIUS + 0.03,
      `${rock.id} stops movement at its footprint`);
    assert.equal(canRoverOccupy(rock.position.x, rock.position.z), false, `${rock.id} blocks a rover at its center`);
    assert.equal(canRoverOccupy(rock.position.x + rock.radius + 3, rock.position.z), true,
      `${rock.id} has a nearby clear approach`);
  }
});

test('ice support, vent basalt, lava-tube rim rocks and legacy rover remain physical', () => {
  const colliders = buildOuterPhysicsAdapter();
  const scarp = NATURAL_LANDMARK_SUPPORTS[0];
  assert.ok(colliders.some(({ id }) => id === scarp.id));
  for (const id of ['lava-tube-mouth-rock--1', 'lava-tube-mouth-rock-1', 'ancient-vent-rock--1', 'ancient-vent-rock-1']) {
    const collider = colliders.find((candidate) => candidate.id === id);
    assert.ok(collider, `${id} follows actual exposed basalt geometry`);
    if (collider.type === 'box') {
      const state = initial(collider.x - collider.halfX - 0.5, collider.z);
      let result = state;
      for (let index = 0; index < 20; index += 1) result = step(result, 4.2, 0, 0.05, [collider]);
      assert.ok(result.isBlocked, `${id} blocks a walking capsule`);
    }
  }
  const legacy = STATIC_WORLD_COLLIDERS.find(({ id }) => id === 'legacy-mars-rover-exhibit');
  assert.deepEqual([legacy.x, legacy.z, legacy.radius], [3.8, -2.2, 0.95]);
  assert.equal(buildWorldColliders([3.8, -0.32, -2.2], false).at(-1).radius, 1.55);
});

test('the sampled caldera and crater bowl stay walkable; world bounds remain clamped', () => {
  for (const [x, z] of [[-230, 240], [-247, 261], [-256, -257], [-256, -250]]) {
    assert.equal(canRoverOccupy(x, z), true, `natural sampled ground at (${x}, ${z}) is traversable`);
  }
  for (const [x, z] of [[WORLD_BOUNDS.maxX + 1, 0], [0, WORLD_BOUNDS.minZ - 1]]) {
    assert.equal(canRoverOccupy(x, z), false, `out-of-bounds rover pose (${x}, ${z}) fails closed`);
  }
  for (const region of WORLD_REGIONS) {
    assert.equal(canRoverOccupy(region.safeParking.x, region.safeParking.z, 1.55), true,
      `${region.id} rover parking retains local clearance`);
  }
});

test('wall contact keeps tangential movement and bounded frame steps avoid tunneling', () => {
  const wall = {
    id: 'test-wall', label: 'test wall', type: 'box', x: 2, z: 0,
    halfX: 0.2, halfZ: 4, topY: 1, jumpable: true,
  };
  let state = initial(1, 0);
  for (let index = 0; index < 40; index += 1) state = step(state, 6.6, 2, 100, [wall]);
  assert.ok(state.x <= wall.x - wall.halfX - PHYSICS_CONSTANTS.PLAYER_RADIUS + 0.03,
    `large dt does not tunnel through wall: x=${state.x}`);
  assert.ok(state.z > 1, `wall contact slides along tangent: z=${state.z}`);
  assert.ok(Math.abs(state.x) <= WORLD_BOUNDS.maxX && Math.abs(state.z) <= WORLD_BOUNDS.maxZ);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTsModule } from '../mission-v2/support/load-ts-module.mjs';

const world = await loadTsModule('../../src/modules/outpost-3d/worldRegions.ts', import.meta.url);
const sites = await loadTsModule('../../src/modules/outpost-3d/naturalSiteDefinitions.ts', import.meta.url);
const physics = await loadTsModule('../../src/modules/character/physicsEngine.ts', import.meta.url);

const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

test('authoritative natural proxies preserve all 15 canonical science positions', () => {
  const canonical = sites.NATURAL_INSPECTION_PROXIES.filter(({ label }) => /outcrop|deposit/.test(label));
  assert.equal(sites.NATURAL_INSPECTION_PROXIES.length, 43);
  assert.equal(sites.NATURAL_INSPECTION_PROXIES.filter(({ scienceId }) => scienceId.endsWith('.science-1') || scienceId.endsWith('.science-2') || scienceId.endsWith('.science-3')).length, 43);
  assert.deepEqual(sites.NATURAL_INSPECTION_PROXIES.find(({ label }) => label === 'Cooled lava channel and tube mouth')?.scienceId, 'volcano.science-2');
  assert.deepEqual(sites.NATURAL_INSPECTION_PROXIES.find(({ label }) => label === 'Fissure vent teaching feature')?.scienceId, 'volcano.science-3');
  assert.deepEqual(sites.NATURAL_LANDMARK_SUPPORTS.map(({ id }) => id), ['natural-ice-scarp']);
  for (const region of world.WORLD_REGIONS) {
    for (const [index, position] of region.discoveries.entries()) {
      assert.ok(sites.NATURAL_INSPECTION_PROXIES.some((proxy) => proxy.scienceId === `${region.id}.science-${index + 1}`
        && proxy.regionId === region.id && distance(proxy.position, position) === 0));
    }
  }
  assert.equal(sites.NATURAL_ROCK_SCATTER.length, 20);
  for (const rock of sites.NATURAL_ROCK_SCATTER) {
    const proxy = sites.NATURAL_INSPECTION_PROXIES.find(({ label, position, radius, scienceId }) =>
      label === rock.label && scienceId === rock.scienceId && radius === rock.radius && distance(position, rock.position) === 0);
    assert.ok(proxy, `${rock.id} has its own clickable proxy at the rendered footprint`);
  }
  assert.equal(sites.NATURAL_ROCK_SCATTER.filter(({ scienceId }) => scienceId === 'impact.science-1').length, 2, 'distinct outcrops with the same canonical science ID remain individually targetable');
  assert.equal(sites.PRIMARY_NATURAL_LANDMARKS.length, 5);
  assert.deepEqual(sites.PRIMARY_NATURAL_LANDMARKS.map(({ regionId }) => regionId).sort(), ['dust', 'ice', 'impact', 'lake', 'volcano']);
  assert.ok(sites.PRIMARY_NATURAL_LANDMARKS.every(({ radius }) => radius >= 14 && radius <= 42));
  assert.ok(canonical.length >= 15);
});

test('natural relief is shared with canonical ground and routeable without blanket plateaus', () => {
  const { sampleWorldGround, sampleRegionalLandformHeight, ROVER_ROUTES, WORLD_GROUND_Y, PRESERVED_CORE_RADIUS } = world;
  assert.equal(PRESERVED_CORE_RADIUS, 210);
  assert.equal(WORLD_GROUND_Y, -0.4);
  for (const region of world.WORLD_REGIONS) {
    for (const route of ROVER_ROUTES.filter(({ regionId }) => regionId === region.id)) {
      for (const point of route.points) {
        assert.ok(Number.isFinite(sampleWorldGround(point.x, point.z)));
        assert.ok(Math.abs(sampleRegionalLandformHeight(point.x, point.z)) < 3, `${region.id} route remains gently traversable`);
      }
    }
  }
  const crater = { low: Infinity, high: -Infinity };
  for (let x = -286; x <= -226; x += 2) for (let z = -287; z <= -227; z += 2) {
    const delta = sampleRegionalLandformHeight(x, z);
    crater.low = Math.min(crater.low, delta);
    crater.high = Math.max(crater.high, delta);
  }
  assert.ok(crater.low < -0.8 && crater.high > 0.9, `crater has recessed bowl and raised rim: ${JSON.stringify(crater)}`);
  const volcano = { low: Infinity, high: -Infinity };
  for (let x = -294; x <= -200; x += 2) for (let z = 205; z <= 303; z += 2) {
    const delta = sampleRegionalLandformHeight(x, z);
    volcano.low = Math.min(volcano.low, delta);
    volcano.high = Math.max(volcano.high, delta);
  }
  const calderaFloor = sampleRegionalLandformHeight(-247, 254);
  assert.ok(volcano.high - volcano.low > 1 && volcano.high > calderaFloor,
    `shield, caldera floor, and rim relief: ${JSON.stringify({ ...volcano, calderaFloor })}`);
  for (const region of world.WORLD_REGIONS) {
    for (let dx = -55; dx <= 55; dx += 11) for (let dz = -55; dz <= 55; dz += 11) {
      assert.ok(Number.isFinite(sampleWorldGround(region.center.x + dx, region.center.z + dz)));
    }
  }
});

test('physics no longer includes outer building, console, or blanket discovery walls', () => {
  const originalPrefix = physics.STATIC_WORLD_COLLIDERS.slice(0, 29).map(({ id }) => id);
  const colliders = physics.STATIC_WORLD_COLLIDERS;
  assert.equal(originalPrefix[0], 'habitat-dome-wall');
  assert.equal(originalPrefix[28], 'mesa-west');
  assert.ok(colliders.some(({ id }) => id === 'legacy-mars-rover-exhibit'));
  assert.ok(!colliders.some(({ id }) => /base-console|radome|gantry|truss|strata-arch|discovery-|branch-/.test(id)));
  assert.equal(physics.buildOuterPhysicsAdapter().length,
    sites.NATURAL_ROCK_SCATTER.length + sites.NATURAL_LANDMARK_SUPPORTS.length + physics.buildCanonicalScienceColliders().length + 4);
  for (const rock of sites.NATURAL_ROCK_SCATTER) {
    const collider = physics.buildOuterPhysicsAdapter().find(({ id }) => id === rock.id);
    assert.ok(collider);
    assert.equal(collider.radius, rock.radius * 0.9, 'physical radius contains transformed rock hull');
    assert.ok(collider.topY >= world.sampleWorldGround(rock.position.x, rock.position.z) + rock.height * 0.68);
    assert.ok(collider.topY <= world.sampleWorldGround(rock.position.x, rock.position.z) + rock.height * 0.82);
  }
});

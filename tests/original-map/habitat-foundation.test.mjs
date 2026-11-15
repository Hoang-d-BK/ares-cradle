import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BufferGeometry, CircleGeometry, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import * as THREE from 'three';
import test from 'node:test';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cache = new Map();
const compile = (file) => {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const localRequire = (id) => {
    if (id === 'three') return THREE;
    if (id.startsWith('.')) {
      let child = path.resolve(path.dirname(file), id);
      if (!/\.tsx?$/.test(child)) child += '.ts';
      if (existsSync(child)) return compile(child);
    }
    throw new Error(`Unexpected foundation-test import: ${id}`);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
};
test('rendered foundation and collar are hollow, physics-aligned shells with true pass-throughs', () => {
  const { createHabitatFoundationGeometry } = compile(path.resolve(root, 'src/modules/outpost-3d/habitatFoundationGeometry.ts'));
  const { STATIC_WORLD_COLLIDERS } = compile(path.resolve(root, 'src/modules/character/physicsEngine.ts'));
  const wall = STATIC_WORLD_COLLIDERS.find(({ id }) => id === 'habitat-dome-wall');
  assert.equal(wall?.type, 'ring');
  assert.ok(wall.openings?.length >= 2, 'reuse existing habitat portal definitions');

  const profiles = [
    { bottomY: -0.035, topY: 0.515, outerBottomRadius: 4.12, outerTopRadius: 3.95, innerBottomRadius: 3.6, innerTopRadius: 3.6 },
    { bottomY: 0.47, topY: 0.61, outerBottomRadius: 3.98, outerTopRadius: 3.88, innerBottomRadius: 3.6, innerTopRadius: 3.6 },
  ];
  const meshes = profiles.map((profile) => {
    const geometry = createHabitatFoundationGeometry(profile, wall.openings ?? []);
    assert.ok(geometry instanceof BufferGeometry);
    assert.ok(geometry.getAttribute('position').count > 0);
    assert.ok(Math.abs(geometry.boundingBox.min.y - profile.bottomY) < 1e-5);
    assert.ok(Math.abs(geometry.boundingBox.max.y - profile.topY) < 1e-5);
    return { mesh: new Mesh(geometry, new MeshBasicMaterial({ side: DoubleSide })), y: (profile.bottomY + profile.topY) / 2 };
  });
  const raycaster = new Raycaster();
  const countHits = (x, z, objects) => {
    raycaster.set(new Vector3(x, 2, z), new Vector3(0, -1, 0));
    return raycaster.intersectObjects(objects, false).length;
  };

  for (const { mesh, y } of meshes) {
    assert.equal(countHits(0, 0, [mesh]), 0, 'center remains a real cavity, not a cap');
    const passageY = y < 0.4 ? y : 0.48;
    const southPortal = new Raycaster(new Vector3(0.25, passageY, 1.55), new Vector3(0, 0, 1));
    assert.equal(southPortal.intersectObject(mesh, false).length, 0, 'south approach is visibly open below the collar lip');
    const eastPortal = new Raycaster(new Vector3(0.25, passageY, 0), new Vector3(1, 0, 0));
    assert.equal(eastPortal.intersectObject(mesh, false).length, 0, 'east approach is visibly open below the collar lip');
    const wallAngle = 1.0;
    const wallRay = new Raycaster(new Vector3(Math.sin(wallAngle) * 5, passageY, Math.cos(wallAngle) * 5), new Vector3(-Math.sin(wallAngle), 0, -Math.cos(wallAngle)));
    assert.ok(wallRay.intersectObject(mesh, false).length > 0, 'actual non-portal angular wall sector remains solid');
  }

  const floor = new Mesh(new CircleGeometry(5.2, 32), new MeshBasicMaterial({ side: DoubleSide }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.4;
  floor.updateMatrixWorld(true);
  for (const [label, position] of [['south', new Vector3(0, 0.5, 1.55)], ['east', new Vector3(3.15, 0.5, 0)]]) {
    const floorRay = new Raycaster(position, new Vector3(0, -1, 0));
    const floorHit = floorRay.intersectObject(floor, false)[0];
    assert.ok(floorHit, `${label} home path remains supported by the existing visible plinth floor (${position.toArray()})`);
    assert.ok(Math.abs(floorHit.point.y + 0.4) < 1e-5, 'foundation leaves the existing walk ground at y=-0.4');
    assert.equal(countHits(position.x, position.z, meshes.map(({ mesh }) => mesh)), 0, `${label} path is not occluded by either foundation mesh`);
  }
});

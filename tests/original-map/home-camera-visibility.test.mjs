import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BoxGeometry, CylinderGeometry, DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Vector3 } from 'three';
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
    throw new Error(`Unexpected camera-visibility import: ${id}`);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
};

const profiles = [
  { bottomY: -0.035, topY: 0.515, outerBottomRadius: 4.12, outerTopRadius: 3.95, innerBottomRadius: 3.6, innerTopRadius: 3.6 },
  { bottomY: 0.47, topY: 0.61, outerBottomRadius: 3.98, outerTopRadius: 3.88, innerBottomRadius: 3.6, innerTopRadius: 3.6 },
];
const spawn = [0, -0.4, 1.55];
const actorCenter = new Vector3(...spawn).add(new Vector3(0, 0.55, 0));
const actorPoints = [
  new Vector3(0, 0.02, 0).add(new Vector3(...spawn)),
  actorCenter,
  new Vector3(0, 1.42, 0).add(new Vector3(...spawn)),
];
function loadLiveHome() {
  const { createHabitatFoundationGeometry } = compile(path.resolve(root, 'src/modules/outpost-3d/habitatFoundationGeometry.ts'));
  const { STATIC_WORLD_COLLIDERS } = compile(path.resolve(root, 'src/modules/character/physicsEngine.ts'));
  const wall = STATIC_WORLD_COLLIDERS.find(({ id }) => id === 'habitat-dome-wall');
  assert.equal(wall?.type, 'ring');
  const foundation = profiles.map((profile) => new Mesh(
    createHabitatFoundationGeometry(profile, wall.openings ?? []),
    new MeshBasicMaterial({ side: DoubleSide }),
  ));
  const occluders = foundation.map((mesh) => {
    mesh.updateMatrixWorld(true);
    return mesh;
  });
  const previousContinuousFoundation = new Mesh(new CylinderGeometry(3.95, 4.12, 0.55, 32), new MeshBasicMaterial({ side: DoubleSide }));
  previousContinuousFoundation.position.y = 0.24;
  const previousContinuousCollar = new Mesh(new CylinderGeometry(3.88, 3.98, 0.14, 32), new MeshBasicMaterial({ side: DoubleSide }));
  previousContinuousCollar.position.y = 0.54;
  previousContinuousFoundation.updateMatrixWorld(true);
  previousContinuousCollar.updateMatrixWorld(true);
  const table = new Mesh(new BoxGeometry(2.1, 0.7, 2.1), new MeshBasicMaterial({ side: DoubleSide }));
  table.position.set(0, 0.45, 0);
  table.updateMatrixWorld(true);
  const raycaster = new Raycaster();
  const hasOcclusion = (origin, target, meshes) => {
    const direction = target.clone().sub(origin);
    const distance = direction.length();
    raycaster.set(origin, direction.normalize());
    return raycaster.intersectObjects(meshes, false).some((hit) => hit.distance < distance - 1e-4) ||
      raycaster.intersectObject(table, false).some((hit) => hit.distance < distance - 1e-4);
  };
  const isOccluded = (origin, target) => hasOcclusion(origin, target, occluders);
  const wasOccluded = (origin, target) => hasOcclusion(origin, target, [previousContinuousFoundation, previousContinuousCollar]);
  return { createHabitatFoundationGeometry, colliders: STATIC_WORLD_COLLIDERS, wall, occluders, table, isOccluded, wasOccluded };
}

function visibleActor(camera, isOccluded) {
  camera.updateMatrixWorld(true);
  const inFrame = actorPoints.every((point) => {
    const projected = point.clone().project(camera);
    return projected.z >= -1 && projected.z <= 1 &&
      Math.abs(projected.x) < 0.92 && Math.abs(projected.y) < 0.88;
  });
  const eye = camera.getWorldPosition(new Vector3());
  const clearSight = actorPoints.every((point) => !isOccluded(eye, point));
  return { inFrame, clearSight, visible: inFrame && clearSight };
}

const camera = (yaw, height, distance, focalY = 0.65) => {
  const result = new PerspectiveCamera(45, 16 / 10, 0.1, 100);
  result.position.set(Math.sin(yaw) * distance, actorCenter.y + height, spawn[2] + Math.cos(yaw) * distance);
  result.lookAt(actorCenter.x, focalY, actorCenter.z);
  result.updateProjectionMatrix();
  result.updateMatrixWorld(true);
  return result;
};

test('actual rendered home foundation occludes the previous outside view but allows a full-body indoor orbit', () => {
  const scene = loadLiveHome();
  const previousOutsideView = new PerspectiveCamera(45, 16 / 10, 0.1, 100);
  previousOutsideView.position.set(0, 0.55, 7.5);
  previousOutsideView.lookAt(actorCenter.x, actorCenter.y, actorCenter.z);
  previousOutsideView.updateProjectionMatrix();
  previousOutsideView.updateMatrixWorld(true);
  const oldView = visibleActor(previousOutsideView, scene.wasOccluded);
  assert.equal(oldView.inFrame, true, 'baseline failure is not merely an NDC framing test');
  assert.equal(oldView.clearSight, false, 'actual prechange continuous cylinder and collar intersect the outside sightline');
  assert.equal(visibleActor(previousOutsideView, scene.isOccluded).visible, true,
    'hollow rendered shell and shared south doorway make the retained outside sightline clear');

  for (const [label, yaw, distance, height] of [
    ['south spawn', 0, 2.8, 2.0],
    ['indoor right orbit', -0.35, 2.8, 2.0],
    ['indoor left orbit', 0.35, 2.8, 2.0],
    ['upright framing', -0.28, 2.6, 2.05],
    ['south threshold', 0, 2.45, 2.0],
    ['east threshold', -Math.PI / 2, 2.45, 2.0],
  ]) {
    const bounds = visibleActor(camera(yaw, height, distance), scene.isOccluded);
    assert.deepEqual(bounds, { inFrame: true, clearSight: true, visible: true }, `${label} body is framed and has real LOS`);
  }

  const outside = camera(-Math.PI / 2, 1.7, 6.5);
  assert.equal(visibleActor(outside, scene.isOccluded).visible, true, 'normal exterior chase remains visible');
  for (const entry of [
    { x: 0, y: -0.4, z: 1.55, id: 'south' },
    { x: 3.15, y: -0.4, z: 0, id: 'east' },
  ]) {
    const nearestOpening = scene.wall.openings.reduce((best, current) => {
      const distance = Math.hypot((current.minX + current.maxX) / 2 - entry.x, (current.minZ + current.maxZ) / 2 - entry.z);
      return !best || distance < best.distance ? { opening: current, distance } : best;
    }, null).opening;
    const visible = visibleActor(camera(entry.id === 'south' ? 0 : -Math.PI / 2, 2.0, 2.45), scene.isOccluded);
    assert.deepEqual(visible, { inFrame: true, clearSight: true, visible: true }, `${entry.id} transition viewpoint clears real render and collider geometry`);
    assert.ok(entry.x >= nearestOpening.minX - 0.34 && entry.x <= nearestOpening.maxX + 0.34 &&
      entry.z >= nearestOpening.minZ - 1.8 && entry.z <= nearestOpening.maxZ + 1.8, `${entry.id} transition approaches the shared collider doorway`);
  }
});

test('home camera uses the real actor containment and applies no pose or control writes', () => {
  const rig = readFileSync(path.resolve(root, 'src/modules/character/CameraRig.tsx'), 'utf8');
  const cameraMath = readFileSync(path.resolve(root, 'src/modules/character/thirdPersonCamera.ts'), 'utf8');
  const actor = readFileSync(path.resolve(root, 'src/modules/character/AstronautPlayer.tsx'), 'utf8');
  assert.match(rig, /store\.isInsideHabitat[\s\S]*Math\.hypot\(actor\[0\], actor\[2\]\) < 3\.55/);
  assert.match(rig, /insideHabitat \? 2\.8 : HUMAN_DISTANCE/);
  assert.match(rig, /insideHabitat \? 1\.0 : undefined/);
  assert.match(cameraMath, /movementY \* 0\.0022/);
  assert.match(cameraMath, /movementX \* 0\.0022/);
  assert.doesNotMatch(rig, /setPlayerPos|setRoverPos|requestPointerLock/);
  assert.doesNotMatch(actor, /groupRef\.current\.visible\s*=\s*false/);
  const input = actor.match(/const forwardX = -Math\.sin\(cameraYaw\);[\s\S]*?const rightZ = -Math\.sin\(cameraYaw\);/);
  assert.ok(input, 'camera repair leaves existing camera-relative astronaut controls intact');
});

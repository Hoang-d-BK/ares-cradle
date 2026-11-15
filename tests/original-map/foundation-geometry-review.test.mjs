import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import * as THREE from 'three';
import { loadTsModule } from '../mission-v2/support/load-ts-module.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const domePath = resolve(root, 'src/modules/outpost-3d/HabitatDome.tsx');
const physics = await loadTsModule('../../src/modules/character/physicsEngine.ts', import.meta.url);
const world = await loadTsModule('../../src/modules/outpost-3d/worldRegions.ts', import.meta.url);
const { STATIC_WORLD_COLLIDERS, PHYSICS_CONSTANTS, stepPlayerPhysics } = physics;
const openingCollider = STATIC_WORLD_COLLIDERS.find(({ id }) => id === 'habitat-dome-wall');
assert.equal(openingCollider?.type, 'ring', 'use the live habitat wall collider, not a fixture');

const cache = new Map();
function compileCommonJs(path) {
  if (cache.has(path)) return cache.get(path).exports;
  const module = { exports: {} };
  cache.set(path, module);
  const source = readFileSync(path, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const localRequire = (id) => {
    if (id === 'three') return THREE;
    if (id === 'react') return { useMemo: (callback) => callback(), useRef: (current) => ({ current }) };
    if (id === 'react/jsx-runtime') {
      const element = (type, props) => ({ type, props });
      return { jsx: element, jsxs: element };
    }
    if (id === '@react-three/fiber') return { useFrame() {} };
    if (id === '@/modules/store/useOutpostStore') return { useOutpostStore: (selector) => selector({}) };
    if (id === '@/modules/audio/soundEngine') return { soundEngine: { playSuccessChime() {} } };
    if (id === '@/modules/character/physicsEngine') return { STATIC_WORLD_COLLIDERS };
    if (id.startsWith('.')) {
      let child = resolve(dirname(path), id);
      if (!/\.tsx?$/.test(child)) child += '.ts';
      if (existsSync(child)) return compileCommonJs(child);
    }
    throw new Error(`Unexpected HabitatDome import in geometry review: ${id}`);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

const element = compileCommonJs(domePath).HabitatDome();
const namedMeshes = new Map();
function visit(node) {
  if (Array.isArray(node)) return node.forEach(visit);
  if (!node || typeof node !== 'object') return;
  if (node.type === 'mesh' && node.props?.name) namedMeshes.set(node.props.name, node);
  visit(node.props?.children);
}
visit(element);
function mountedMesh(name) {
  const node = namedMeshes.get(name);
  assert.ok(node?.props?.geometry?.isBufferGeometry, `${name} is mounted with its actual BufferGeometry`);
  const materialNode = node.props.children;
  assert.equal(materialNode?.type, 'meshStandardMaterial', `${name} keeps its standard exterior material`);
  const mesh = new THREE.Mesh(node.props.geometry, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }));
  mesh.updateMatrixWorld(true);
  return { node, material: materialNode.props, mesh, geometry: node.props.geometry };
}
const foundation = mountedMesh('habitat-foundation-wall');
const collar = mountedMesh('habitat-foundation-collar');
const geometryMeshes = [foundation.mesh, collar.mesh];
const raycaster = new THREE.Raycaster();
const hits = (origin, direction) => {
  raycaster.set(new THREE.Vector3(...origin), new THREE.Vector3(...direction).normalize());
  return geometryMeshes.flatMap((mesh) => raycaster.intersectObject(mesh, false));
};

for (const { geometry } of [foundation, collar]) {
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  assert.ok(positions.count > 0 && positions.count % 3 === 0, 'shell has complete, nonempty triangles');
  assert.equal(normals.count, positions.count, 'every rendered vertex has a normal');
  for (let index = 0; index < positions.count; index += 1) {
    assert.ok(Number.isFinite(positions.getX(index)) && Number.isFinite(positions.getY(index)) && Number.isFinite(positions.getZ(index)),
      `vertex ${index} is finite`);
    assert.ok(Number.isFinite(normals.getX(index)) && Number.isFinite(normals.getY(index)) && Number.isFinite(normals.getZ(index)),
      `normal ${index} is finite`);
  }
}

test('mounted hollow meshes preserve source silhouette and material at the original heights', () => {
  assert.deepEqual([foundation.material.color, foundation.material.roughness, foundation.material.metalness], ['#9A3412', 0.9, 0.15]);
  assert.deepEqual([collar.material.color, collar.material.roughness, collar.material.metalness], ['#1E293B', 0.25, 0.85]);
  const samples = [Math.PI, (3 * Math.PI) / 2, Math.PI + Math.PI / 32];
  for (const [y, expectedRadius] of [[0, 4.12 - (0.035 / 0.55) * 0.17], [0.515, 3.95]]) {
    for (const angle of samples) {
      const direction = [Math.sin(angle), 0, Math.cos(angle)];
      const intersections = hits([0, y, 0], direction);
      assert.ok(intersections.length > 0, `non-portal exterior at y=${y}, angle=${angle} remains closed`);
      const outer = intersections.at(-1).distance;
      assert.ok(Math.abs(outer - expectedRadius) < 0.065,
        `outer profile at y=${y}, angle=${angle} stays within 6.5cm of ${expectedRadius}m (got ${outer}m)`);
    }
  }
});

test('actual rendered shells have a walkable hollow center and physics-aligned portals', () => {
  for (let x = -3.2; x <= 3.2; x += 0.4) {
    for (let z = -3.2; z <= 3.2; z += 0.4) {
      if (Math.hypot(x, z) > 3.2) continue;
      assert.equal(hits([x, -0.4, z], [0, 1, 0]).length, 0, `clear floor-to-head ray at (${x}, ${z})`);
    }
  }
  for (const y of [0, 0.3, 0.5]) {
    assert.equal(hits([0, y, 3.0], [0, 0, 1]).length, 0, `south passage clears at y=${y}`);
    assert.equal(hits([3.0, y, 0], [1, 0, 0]).length, 0, `east passage clears at y=${y}`);
  }
  assert.ok(hits([0, 0.2, -3], [0, 0, -1]).length > 0, 'unopened north wall blocks a real geometry ray');

  const walk = (moveX, moveZ, coordinate) => {
    let state = {
      x: 0, y: PHYSICS_CONSTANTS.GROUND_Y, z: 0, vy: 0, isGrounded: true,
      isBlocked: false, blockedByLabel: null, blockedObstacleJumpable: false, standingOnLabel: null,
    };
    for (let frame = 0; frame < 32; frame += 1) {
      state = stepPlayerPhysics(state, { moveX, moveZ, jumpJustPressed: false, dt: 0.05 }, [openingCollider]);
    }
    assert.ok(state[coordinate] > 4.5, `live physics permits a complete portal crossing (${coordinate}=${state[coordinate]})`);
    assert.equal(state.isBlocked, false);
  };
  walk(0, 4.2, 'z');
  walk(4.2, 0, 'x');
});

test('visible plinth top still equals the physics walking floor', () => {
  const terrain = readFileSync(resolve(root, 'src/modules/outpost-3d/MarsTerrain.tsx'), 'utf8');
  const plinth = terrain.match(/<mesh position=\{\[0,\s*(-?\d+(?:\.\d+)?),\s*0\]\} receiveShadow>\s*<cylinderGeometry args=\{\[5\.2,\s*5\.5,\s*(\d+(?:\.\d+)?),\s*32\]\}/);
  assert.ok(plinth, 'actual central plinth markup exists');
  const renderedTop = Number(plinth[1]) + Number(plinth[2]) / 2;
  assert.equal(renderedTop, PHYSICS_CONSTANTS.GROUND_Y);
  assert.equal(world.sampleWorldGround(0, 0), renderedTop);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import * as THREE from 'three';
import { loadTsModule } from '../mission-v2/support/load-ts-module.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const definitionsPath = resolve(root, 'src/modules/outpost-3d/habitatFloorDefinitions.ts');
const domePath = resolve(root, 'src/modules/outpost-3d/HabitatDome.tsx');
const interiorPath = resolve(root, 'src/modules/outpost-3d/HabitatInterior.tsx');
const physicsPath = resolve(root, 'src/modules/character/physicsEngine.ts');
const physics = await loadTsModule('../../src/modules/character/physicsEngine.ts', import.meta.url);
const floors = await loadTsModule('../../src/modules/outpost-3d/habitatFloorDefinitions.ts', import.meta.url);
const { PHYSICS_CONSTANTS, stepPlayerPhysics } = physics;
const { HABITAT_RAMP, HABITAT_STAIR_GROUP_POSITION, HABITAT_STAIR_TREADS,
  HABITAT_OBSERVATION_DECK_LOCAL_POSITION, HABITAT_OBSERVATION_DECK, sampleHabitatFloorSupport } = floors;

const moduleCache = new Map();
function compileComponent(path) {
  if (moduleCache.has(path)) return moduleCache.get(path).exports;
  const module = { exports: {} };
  moduleCache.set(path, module);
  const output = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const element = (type, props) => ({ type, props: props ?? {} });
  const store = {
    emergencyPowerSaver: false, oxygen: 21, temperature: 20, isStormShutterClosed: false,
    roverPos: [0, 0, 0], isRoverDocked: false, setIsRoverDocked() {}, domeEvolutionLevel: 0,
    isInsideHabitat: true,
  };
  const localRequire = (id) => {
    if (id === 'three') return THREE;
    if (id === 'react') return { useMemo: (fn) => fn(), useRef: (current) => ({ current }) };
    if (id === 'react/jsx-runtime') return { jsx: element, jsxs: element };
    if (id === '@react-three/fiber') return { useFrame() {} };
    if (id === '@/modules/store/useOutpostStore') return { useOutpostStore: (selector) => selector(store) };
    if (id === '@/modules/audio/soundEngine') return { soundEngine: { playSuccessChime() {} } };
    if (id === '@/modules/character/physicsEngine') return physics;
    if (id.startsWith('.')) {
      let child = resolve(dirname(path), id);
      if (!/\.tsx?$/.test(child)) child += '.ts';
      return compileComponent(child);
    }
    throw new Error(`Unexpected mounted habitat import: ${id}`);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

function geometryFor(node) {
  if (!node || typeof node !== 'object') return null;
  const args = node.props?.args ?? [];
  if (node.type === 'boxGeometry' && args.length === 3 && args[0] === 2.2 && args[1] === 0.16 && args[2] === 2.8) {
    return { kind: 'ramp', geometry: new THREE.BoxGeometry(...args) };
  }
  if (node.type === 'boxGeometry' && args.length === 3 && args[0] === 0.42 && args[1] === 0.04 && args[2] === 0.16) {
    return { kind: 'tread', geometry: new THREE.BoxGeometry(...args) };
  }
  if (node.type === 'cylinderGeometry' && args.length === 4 && args[0] === 1.1 && args[1] === 1.1 && args[2] === 0.08 && args[3] === 20) {
    return { kind: 'deck', geometry: new THREE.CylinderGeometry(...args) };
  }
  return null;
}

function mountedWalkSurfaces(component) {
  const rootObject = new THREE.Group();
  const surfaces = { ramp: [], tread: [], deck: [] };
  const visit = (node, parent) => {
    if (Array.isArray(node)) return node.forEach((child) => visit(child, parent));
    if (!node || typeof node !== 'object') return;
    if (node.type === 'group' || node.type === 'mesh') {
      const geometryNode = node.type === 'mesh'
        ? (Array.isArray(node.props?.children) ? node.props.children : [node.props?.children]).find((child) => geometryFor(child))
        : null;
      const matched = geometryFor(geometryNode);
      const object = matched ? new THREE.Mesh(matched.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })) : new THREE.Group();
      if (node.props?.position) object.position.fromArray(node.props.position);
      if (node.props?.rotation) object.rotation.fromArray(node.props.rotation);
      parent.add(object);
      if (matched) surfaces[matched.kind].push(object);
      visit(node.props?.children, object);
      return;
    }
    visit(node.props?.children, parent);
  };
  visit(component, rootObject);
  rootObject.updateMatrixWorld(true);
  return surfaces;
}

const mountedDome = mountedWalkSurfaces(compileComponent(domePath).HabitatDome());
const mountedInterior = mountedWalkSurfaces(compileComponent(interiorPath).HabitatInterior());
const actual = {
  ramp: mountedDome.ramp,
  tread: mountedInterior.tread,
  deck: mountedInterior.deck,
};
const raycaster = new THREE.Raycaster();
function actualTop(mesh, x, z, originY = 3) {
  raycaster.set(new THREE.Vector3(x, originY, z), new THREE.Vector3(0, -1, 0));
  const hit = raycaster.intersectObject(mesh, false)[0];
  assert.ok(hit, `mounted ${mesh.userData.surface ?? 'walk surface'} ray intersects at (${x}, ${z})`);
  return hit.point.y;
}
const initial = (x, y, z, vy = 0, isGrounded = false) => ({
  x, y, z, vy, isGrounded, isBlocked: false, blockedByLabel: null,
  blockedObstacleJumpable: false, standingOnLabel: null,
});
const advance = (state, moveX = 0, moveZ = 0, dt = 1 / 60) =>
  stepPlayerPhysics(state, { moveX, moveZ, jumpJustPressed: false, dt }, []);

// Contract: JSX imports the shared dimensions, then the mounted Three.js meshes—not just
// duplicated formulas—must agree with the same geometry consumed by physics.
test('mounted habitat ramp ray heights match the shared walk-support sampler', () => {
  const domeSource = readFileSync(domePath, 'utf8');
  assert.match(domeSource, /import\s*\{[^}]*\bHABITAT_RAMP\b[^}]*\}\s*from\s*['"]\.\/habitatFloorDefinitions['"]/,
    'mounted ramp consumes the shared authored ramp dimensions');
  assert.equal(actual.ramp.length, 1, 'rendered HabitatDome mounts exactly one authored ramp platform');
  for (const z of [3.8, 4.2, 4.8, 5.4, 5.9]) {
    const renderedTop = actualTop(actual.ramp[0], 0, z);
    const support = sampleHabitatFloorSupport(0, z, 0);
    assert.equal(support?.id, 'habitat-ramp');
    assert.ok(Math.abs(renderedTop - support.topY) < 1e-6,
      `ramp top ray at z=${z}: rendered=${renderedTop}, sampled=${support.topY}`);
  }
});

test('a descending body falls onto the actual rendered observation deck', () => {
  const interiorSource = readFileSync(interiorPath, 'utf8');
  assert.match(interiorSource, /import\s*\{[^}]*\bHABITAT_OBSERVATION_DECK_LOCAL_POSITION\b[^}]*\}\s*from\s*['"]\.\/habitatFloorDefinitions['"]/,
    'mounted interior consumes the shared deck placement');
  assert.equal(actual.deck.length, 1, 'rendered HabitatInterior mounts one observation deck plate');
  const [deckX, , deckZ] = HABITAT_OBSERVATION_DECK.position;
  const renderedTop = actualTop(actual.deck[0], deckX, deckZ);
  assert.ok(Math.abs(renderedTop - (HABITAT_OBSERVATION_DECK.position[1] + HABITAT_OBSERVATION_DECK.thickness / 2)) < 1e-6);
  let state = initial(deckX, 2.6, deckZ, 0, false);
  for (let frame = 0; frame < 300 && !state.isGrounded; frame += 1) state = advance(state);
  assert.equal(state.isGrounded, true, 'descending actor lands instead of passing through the deck');
  assert.equal(state.standingOnLabel, 'Habitat Observation Deck');
  assert.ok(Math.abs(state.y - renderedTop) < 1e-6, `physics floor=${state.y}, rendered deck top=${renderedTop}`);
});

test('walking beneath the deck keeps the original home floor and camera height', () => {
  const [deckX, , deckZ] = HABITAT_OBSERVATION_DECK.position;
  const state = advance(initial(deckX, PHYSICS_CONSTANTS.GROUND_Y, deckZ, 0, true));
  assert.equal(state.y, PHYSICS_CONSTANTS.GROUND_Y, 'under-deck actor remains on the ground, not the overhead plate');
  assert.equal(state.standingOnLabel, null, 'overhead deck does not become the actor support');
});

test('the player walks continuously up the mounted ramp without jumping', () => {
  let state = initial(0, PHYSICS_CONSTANTS.GROUND_Y, 6.4, 0, true);
  for (let frame = 0; frame < 32 && state.z > 3.6; frame += 1) {
    const before = state;
    state = advance(state, 0, -4.2, 0.05);
    assert.ok(state.z < before.z, `walk progresses along the ramp at frame ${frame}`);
    assert.ok(state.isGrounded, `ramp walk does not fall through at z=${state.z}, y=${state.y}`);
    assert.equal(state.standingOnLabel, 'Habitat Ramp', `ramp support selected at z=${state.z}`);
    const renderedTop = actualTop(actual.ramp[0], 0, state.z);
    assert.ok(Math.abs(state.y - renderedTop) < 1e-6, `physics/ramp ray agree at z=${state.z}`);
  }
  assert.ok(state.z <= 3.6, `walk traverses ramp span; stopped at z=${state.z}`);
});

test('a descending player lands on the rendered lower tread beneath the overlapping deck', () => {
  const interiorSource = readFileSync(interiorPath, 'utf8');
  assert.match(interiorSource, /import\s*\{[^}]*\bHABITAT_STAIR_TREADS\b[^}]*\}\s*from\s*['"]\.\/habitatFloorDefinitions['"]/,
    'mounted interior consumes the shared authored stair treads');
  assert.equal(actual.tread.length, HABITAT_STAIR_TREADS.length, 'all seven authored stair meshes are mounted');
  const treadIndex = 2;
  const tread = HABITAT_STAIR_TREADS[treadIndex];
  const [groupX, groupY, groupZ] = HABITAT_STAIR_GROUP_POSITION;
  const x = groupX + tread.position[0];
  const z = groupZ + tread.position[2];
  const renderedTop = actualTop(actual.tread[treadIndex], x, z);
  const authoredTop = groupY + tread.position[1] + tread.size[1] / 2;
  assert.ok(Math.abs(renderedTop - authoredTop) < 1e-6, `rendered tread top=${renderedTop}, authored=${authoredTop}`);
  assert.ok(Math.hypot(x - HABITAT_OBSERVATION_DECK.position[0], z - HABITAT_OBSERVATION_DECK.position[2]) < HABITAT_OBSERVATION_DECK.radius,
    'fixture is physically under the circular deck footprint');

  let state = initial(x, renderedTop + 0.02, z, -0.5, false);
  for (let frame = 0; frame < 12 && !state.isGrounded; frame += 1) state = advance(state, 0, 0, 0.05);
  assert.equal(state.isGrounded, true, 'lower tread remains eligible when the higher overlapping deck is above the player');
  assert.equal(state.standingOnLabel, 'Habitat Spiral Stair Tread');
  assert.ok(Math.abs(state.y - renderedTop) < 1e-6, `physics tread floor=${state.y}, rendered tread top=${renderedTop}`);
});

// Keep a digest in the runner output for the maker to distinguish live source revisions while
// iterating; the assertions above remain the only pass/fail contract.
test('reports the reviewed source snapshot digest', (t) => {
  const digest = createHash('sha256')
    .update([definitionsPath, domePath, interiorPath, physicsPath].map((path) => readFileSync(path, 'utf8')).join('\0'))
    .digest('hex');
  t.diagnostic(`source-sha256=${digest}`);
});

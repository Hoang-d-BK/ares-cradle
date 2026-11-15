import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cache = new Map();
let frame;
let hooks = [];
let hookIndex = 0;
let effects = [];
let modal = false;

class EventHub {
  listeners = new Map();
  addEventListener(type, listener) { const set = this.listeners.get(type) ?? new Set(); set.add(listener); this.listeners.set(type, set); }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatch(type, event = {}) { for (const listener of this.listeners.get(type) ?? []) listener(event); }
}
const documentStub = Object.assign(new EventHub(), {
  body: { style: { touchAction: 'pan-y', overscrollBehavior: 'auto' } }, hidden: false, pointerLockElement: null,
  querySelector(selector) { return selector === '[role="dialog"]' && modal ? {} : null; },
  exitPointerLock() { this.pointerLockElement = null; this.dispatch('pointerlockchange'); },
});
const windowStub = new EventHub();
globalThis.document = documentStub;
globalThis.window = windowStub;
const canvas = Object.assign(new EventHub(), {
  title: '', captures: new Set(), setPointerCapture(id) { this.captures.add(id); },
  hasPointerCapture(id) { return this.captures.has(id); }, releasePointerCapture(id) { this.captures.delete(id); },
});
const camera = new THREE.PerspectiveCamera();
const store = {
  cameraYaw: 0, cameraPitch: 0, isPointerLocked: false, isDrivingRover: false, roverHeading: 0,
  roverPos: [4, -0.32, -2], playerPos: [1, -0.4, 2], looks: [],
  setCameraLook(yaw, pitch) { store.cameraYaw = yaw; store.cameraPitch = pitch; store.looks.push([yaw, pitch]); },
  setPointerLocked(value) { store.isPointerLocked = value; }, toggleSkyView() {},
};
const useOutpostStore = (selector) => selector(store);
useOutpostStore.getState = () => store;
let actualPhysics;
let actualWorld;
let useActualWorld = false;
let colliders = [{ type: 'circle', id: 'distant', label: 'distant', x: 100, z: 100, radius: 1, topY: 2, jumpable: false }];
const compile = (path) => {
  if (cache.has(path)) return cache.get(path).exports;
  const module = { exports: {} }; cache.set(path, module);
  const source = readFileSync(path, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const localRequire = (id) => {
    if (id === 'react') {
      const reactHooks = { useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); }, useRef(initial) { const i = hookIndex++; return hooks[i] ?? (hooks[i] = { current: initial }); }, useEffect(callback) { effects.push(callback); } };
      return { ...reactHooks, __esModule: true, default: reactHooks };
    }
    if (id === 'react/jsx-runtime') return { jsx() {}, jsxs() {} };
    if (id === '@react-three/fiber') return { useFrame(callback) { frame = callback; }, useThree() { return { camera, gl: { domElement: canvas } }; } };
    if (id === 'three') return THREE;
    if (id === '@/modules/store/useOutpostStore') return { useOutpostStore };
    if (id === '@/modules/session/gameSession') return compile(resolve(root, 'src/modules/session/gameSession.ts'));
    if (id === './physicsEngine') {
      const physics = compile(resolve(dirname(path), 'physicsEngine.ts'));
      return { ...physics, buildWorldColliders: (...args) => colliders || physics.buildWorldColliders(...args) };
    }
    if (id === '../outpost-3d/naturalSiteDefinitions') {
      return { NATURAL_INSPECTION_PROXIES: [], NATURAL_ROCK_SCATTER: [], NATURAL_LANDMARK_SUPPORTS: [] };
    }
    if (id === '../outpost-3d/worldRegions') {
      return {
        WORLD_BOUNDS: { minX: -300, maxX: 300, minZ: -300, maxZ: 300 },
        sampleWorldGround: (x, z) => useActualWorld ? actualWorld.sampleWorldGround(x, z) : -0.4,
      };
    }
    if (id.startsWith('.')) { let child = resolve(dirname(path), id); if (!/\.tsx?$/.test(child)) child += '.ts'; if (existsSync(child)) return compile(child); }
    throw new Error(`Unexpected import in camera harness: ${id}`);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports); return module.exports;
};
actualWorld = compile(resolve(root, 'src/modules/outpost-3d/worldRegions.ts'));
actualPhysics = compile(resolve(root, 'src/modules/character/physicsEngine.ts'));
colliders = actualPhysics.STATIC_WORLD_COLLIDERS;
compile(resolve(root, 'src/modules/session/gameSession.ts')).startGameplay();
const cameraModule = compile(resolve(root, 'src/modules/character/CameraRig.tsx'));
const math = compile(resolve(root, 'src/modules/character/thirdPersonCamera.ts'));
const mount = () => {
  hooks = []; hookIndex = 0; effects = []; frame = undefined; modal = false; documentStub.hidden = false;
  useActualWorld = false;
  colliders = [{ type: 'circle', id: 'distant', label: 'distant', x: 100, z: 100, radius: 1, topY: 2, jumpable: false }];
  documentStub.pointerLockElement = null; canvas.captures.clear(); store.cameraYaw = 0; store.cameraPitch = 0;
  store.isPointerLocked = false; store.isDrivingRover = false; store.roverHeading = 0; store.looks = [];
  store.playerPos = [1, -0.4, 2]; store.roverPos = [4, -0.32, -2]; camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
  cameraModule.CameraRig(); const cleanups = effects.map((effect) => effect()).filter((cleanup) => typeof cleanup === 'function');
  return { tick(dt = 0.05) { frame({}, dt); }, close() { cleanups.forEach((cleanup) => cleanup()); } };
};
const pointer = (type, pointerId, clientX, clientY, pointerType = 'mouse', button = 0) => canvas.dispatch(type, {
  pointerType, pointerId, button, clientX, clientY, preventDefault() {},
});
const ground = (x, z) => actualWorld.sampleWorldGround(x, z);

test('orbit math gives elevated behind-actor positions and safe terrain/collider sweeps', () => {
  for (const [pivot, distance] of [[{ x: 0, y: 0.86, z: 0 }, 6], [{ x: 12, y: 0.62, z: 9 }, 8]]) {
    const behind = math.chaseCameraPosition(pivot, 0, -0.2, distance);
    assert.ok(behind.z > pivot.z, 'default yaw faces north (-Z), so camera is behind toward +Z');
    assert.ok(behind.y > pivot.y, 'chase camera is elevated');
    assert.ok(Math.hypot(behind.x - pivot.x, behind.y - pivot.y, behind.z - pivot.z) > distance * 0.99);
  }
  assert.ok(math.updateCameraLook(0, 0, 10, 0).yaw < 0, 'mouse right looks right');
  assert.ok(math.updateCameraLook(0, 0, 0, -10).pitch > 0, 'mouse up looks up');
  const humanDefaultPivot = { x: 0, y: actualWorld.sampleWorldGround(1, 1.55) + 0.86, z: 1.55 };
  const humanDefaultBoom = math.chaseCameraPosition(humanDefaultPivot, 0, -0.2, 6);
  assert.ok(Math.hypot(humanDefaultBoom.x - humanDefaultPivot.x, humanDefaultBoom.y - humanDefaultPivot.y,
    humanDefaultBoom.z - humanDefaultPivot.z) > 5.99, 'human default boom retains third-person separation');
  const homeClearance = actualPhysics.STATIC_WORLD_COLLIDERS.filter((c) => c.type !== 'ring' || c.id === 'habitat-dome-wall');
  const clearHumanBoom = math.findCameraPosition(humanDefaultPivot, 0, -0.2, 6, math.MIN_CAMERA_SEPARATION,
    actualWorld.sampleWorldGround, homeClearance);
  assert.ok(Math.hypot(clearHumanBoom.x - humanDefaultPivot.x, clearHumanBoom.y - humanDefaultPivot.y,
    clearHumanBoom.z - humanDefaultPivot.z) > 3.5, 'shared home colliders retain meaningful chase distance');
  const upTarget = math.updateCameraLook(0, -0.2, 0, -300).pitch;
  const boundedLook = math.clampCameraPitchToFrame(humanDefaultBoom, humanDefaultPivot, upTarget, 45, false);
  assert.ok(boundedLook > 0 && boundedLook <= 0.68, 'UP reveals some sky within a practical actor-framed view');
  const allAzimuths = [Math.PI * 0.9, Math.PI * 1.4, -Math.PI * 0.9].map((yaw) => math.chaseCameraPosition({ x: 0, y: 1, z: 0 }, yaw, -0.1, 5));
  assert.ok(allAzimuths.every((point) => Math.hypot(point.x, point.z) > 4.8));
  const sweptGround = (x, z) => 0.8 * Math.exp(-((x - 3) ** 2 + (z - 3) ** 2) / 0.4) - 0.4;
  const roughSweep = math.resolveCameraBoom({ x: 0, y: 0.46, z: 0 }, { x: 0, y: 1.5, z: 5 }, sweptGround, []);
  assert.ok(math.isCameraPointClear(roughSweep, sweptGround, []), 'sweep final point clears sampled rising ground');
  const homeSpawn = { x: 0, y: actualWorld.sampleWorldGround(0, 1.55) + 0.86, z: 1.55 };
  const homeSweep = math.resolveCameraBoom(homeSpawn, { x: 0, y: 2, z: 7.5 }, actualWorld.sampleWorldGround, actualPhysics.STATIC_WORLD_COLLIDERS);
  assert.ok(Math.hypot(homeSweep.x - homeSpawn.x, homeSweep.y - homeSpawn.y, homeSweep.z - homeSpawn.z) > 3.5,
    'home support collider does not trap the camera at the astronaut pivot');
  const blocker = [{ type: 'box', id: 'wall', label: 'wall', x: 0, z: 3, halfX: 2, halfZ: 0.2, topY: 3, jumpable: false }];
  const shortened = math.resolveCameraBoom({ x: 0, y: 1, z: 0 }, { x: 0, y: 2, z: 6 }, ground, blocker);
  assert.ok(shortened.z < 2.6, 'camera sweep shortens before a wall');
  const high = math.resolveCameraBoom({ x: 0, y: 4.66, z: 0 }, { x: 0, y: 5.1, z: 0 }, () => 3.8, []);
  assert.ok(high.y >= 4.08, 'final camera point clears finite raised ground');
});

test('native mouse drag orbits without requesting pointer lock; up/right signs are preserved', () => {
  const app = mount();
  app.tick();
  const start = camera.position.clone();
  pointer('pointerdown', 3, 20, 20);
  pointer('pointermove', 3, 30, 10);
  for (let i = 0; i < 30; i += 1) app.tick();
  assert.ok(camera.position.distanceTo(start) > 0.1);
  assert.ok(store.cameraYaw < 0, 'mouse right rotates displayed view right');
  assert.ok(store.cameraPitch > -0.2, 'mouse up raises the camera orbit');
  assert.equal(store.isPointerLocked, false);
  assert.equal(typeof canvas.requestPointerLock, 'undefined');
  app.close();
});


test('pointer cancel, blur and modal entry release orbit input', () => {
  const app = mount(); app.tick();
  pointer('pointerdown', 4, 10, 10); pointer('pointermove', 4, 20, 0); app.tick();
  pointer('pointercancel', 4, 20, 0);
  pointer('pointermove', 4, -80, -80);
  for (let i = 0; i < 60; i += 1) app.tick();
  const yawAfterCancel = store.cameraYaw;
  for (let i = 0; i < 30; i += 1) app.tick();
  assert.ok(Math.abs(store.cameraYaw - yawAfterCancel) < 0.001, 'lost drag does not accumulate further motion');
  pointer('pointerdown', 5, 10, 10); windowStub.dispatch('blur');
  assert.equal(canvas.hasPointerCapture(5), false);
  pointer('pointerdown', 6, 10, 10); pointer('pointermove', 6, 20, 0); app.tick();
  modal = true;
  for (let i = 0; i < 60; i += 1) app.tick();
  const lookAtModal = [...store.looks.at(-1)];
  pointer('pointermove', 6, 200, 200);
  for (let i = 0; i < 30; i += 1) app.tick();
  assert.ok(Math.abs(store.looks.at(-1)[0] - lookAtModal[0]) < 1e-9);
  assert.ok(Math.abs(store.looks.at(-1)[1] - lookAtModal[1]) < 1e-9);
  app.close();
});


test('rover chase is behind hardware forward and human orbit survives remote mode', () => {
  const app = mount(); app.tick(0.05);
  colliders = actualPhysics.STATIC_WORLD_COLLIDERS;
  useActualWorld = true;
  pointer('pointerdown', 7, 10, 10); pointer('pointermove', 7, 20, 0);
  for (let i = 0; i < 30; i += 1) app.tick(); pointer('pointerup', 7, 20, 0);
  const humanLook = [...store.looks.at(-1)]; const humanPosition = [...store.playerPos];
  store.isDrivingRover = true; store.roverHeading = 0.25;
  for (let i = 0; i < 30; i += 1) app.tick();
  const roverPivot = { x: store.roverPos[0], y: store.roverPos[1] + 1.0, z: store.roverPos[2] };
  const fromPivot = camera.position.clone().sub(new THREE.Vector3(roverPivot.x, roverPivot.y, roverPivot.z));
  const hardwareForward = new THREE.Vector3(Math.sin(0.25), 0, Math.cos(0.25));
  assert.ok(fromPivot.x * hardwareForward.x + fromPivot.z * hardwareForward.z < -5, 'rover camera remains behind chassis forward');
  camera.aspect = 16 / 10;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const roverCenter = new THREE.Vector3(...store.roverPos);
  const mastTip = new THREE.Vector3(-0.32, 2.05, 0.55).applyAxisAngle(new THREE.Vector3(0, 1, 0), store.roverHeading).add(roverCenter).project(camera);
  const roverWheel = new THREE.Vector3(-0.72, 0.12, 0.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), store.roverHeading).add(roverCenter).project(camera);
  assert.ok(mastTip.y < 0.95 && roverWheel.y > -0.95, 'remote chase keeps the rover body and mast inside the frame');
  assert.notDeepEqual(store.looks.at(-1), humanLook);
  store.isDrivingRover = false; for (let i = 0; i < 30; i += 1) app.tick();
  assert.ok(Math.abs(store.cameraYaw - humanLook[0]) < 0.01);
  assert.deepEqual(store.playerPos, humanPosition, 'camera never moves astronaut pose');
  app.close();
});


test('damped camera is revalidated after a large frame and publishes actual look direction', () => {
  const app = mount(); app.tick();
  useActualWorld = true;
  colliders = [
    ...actualPhysics.STATIC_WORLD_COLLIDERS,
    { type: 'box', id: 'test-wall', label: 'test wall', x: 0, z: 3, halfX: 2, halfZ: 0.2, topY: 3, jumpable: false },
  ];
  store.playerPos = [0, -0.4, 0];
  for (let i = 0; i < 5; i += 1) app.tick(1);
  assert.ok(math.isCameraPointClear(camera.position, ground, colliders), 'camera stays outside the obstacle after damping');
  assert.ok(camera.position.distanceTo(new THREE.Vector3(0, 0.46, 0)) > 2.8, 'camera keeps useful separation from the actor');
  assert.ok(Math.abs(store.cameraYaw) < Math.PI);
  assert.ok(store.cameraPitch > -0.68 && store.cameraPitch < 1.05,
    'published pitch remains the real displayed camera direction within orbit bounds');
  app.close();
});

test('live home collider geometry keeps the full astronaut in frame through repeated native-up orbit', () => {
  const app = mount();
  useActualWorld = true;
  colliders = actualPhysics.STATIC_WORLD_COLLIDERS;
  store.playerPos = [0, -0.4, 1.55];
  camera.aspect = 16 / 10;
  camera.updateProjectionMatrix();
  for (let i = 0; i < 90; i += 1) app.tick();
  const projectActorBounds = () => {
    camera.updateMatrixWorld(true);
    const head = new THREE.Vector3(0, 1.42, 0).add(new THREE.Vector3(...store.playerPos)).project(camera);
    const feet = new THREE.Vector3(0, 0.02, 0).add(new THREE.Vector3(...store.playerPos)).project(camera);
    return { head, feet };
  };
  let bounds = projectActorBounds();
  assert.ok(bounds.head.y < 0.9 && bounds.feet.y > -0.9, 'default home view includes astronaut head and boots');
  pointer('pointerdown', 9, 400, 400);
  pointer('pointermove', 9, 400, 100);
  for (let i = 0; i < 90; i += 1) app.tick();
  pointer('pointermove', 9, 400, -200);
  for (let i = 0; i < 90; i += 1) app.tick();
  pointer('pointerup', 9, 400, -200);
  bounds = projectActorBounds();
  assert.ok(Number.isFinite(bounds.head.x) && Number.isFinite(bounds.feet.y), 'full-body projection remains finite');
  assert.ok(bounds.head.y < 0.9 && bounds.feet.y > -0.9, 'repeated UP keeps helmet and boots visible in home colliders');
  assert.ok(camera.position.distanceTo(new THREE.Vector3(0, store.playerPos[1] + 0.2, 1.55)) >= 2.8,
    'home camera remains meaningfully third person after UP');
  assert.ok(store.cameraPitch > -0.2, 'native-up orbit changes the displayed view upward');
  app.close();
});

test('MarsCanvas keeps browser gestures confined to its WebGL canvas', () => {
  const element = (type, props) => ({ type, props });
  class Component { constructor(props) { this.props = props; } }
  const hooks = { Component, useMemo: (callback) => callback(), useEffect() {}, useCallback: (callback) => callback, useRef: (current) => ({ current }) };
  const react = { __esModule: true, default: hooks, ...hooks };
  const component = (name) => ({ name });
  const afterEffectCallbacks = new Set();
  let startupFrame;
  let startupScene;
  let startupRenderer;
  const components = new Map([
    ['react', react], ['react/jsx-runtime', { jsx: element, jsxs: element }],
    ['@react-three/fiber', { Canvas: component('Canvas'), addAfterEffect(callback) { afterEffectCallbacks.add(callback); return () => afterEffectCallbacks.delete(callback); }, useFrame(callback) { startupFrame = callback; }, useThree() { return { scene: startupScene, gl: startupRenderer }; } }],
    ['./sceneReadiness', compile(resolve(root, 'src/modules/outpost-3d/sceneReadiness.ts'))],
    ['./scienceCatalog', compile(resolve(root, 'src/modules/outpost-3d/scienceCatalog.ts'))],
    ['@react-three/drei', { OrbitControls: component('OrbitControls') }],
    ['three', THREE], ['@react-three/postprocessing', { EffectComposer: component('EffectComposer'), Bloom: component('Bloom') }],
    ['leva', { useControls: () => [{}], Leva: component('Leva') }],
    ['@/modules/store/useOutpostStore', { useOutpostStore: (selector) => selector({ graphicsQuality: 'high' }) }],
  ]);
  for (const name of [
    './LightingRig', './MarsTerrain', './OuterRegions', './ScientificElements', '@/modules/mission-control/ScientificInteractionPrompt',
    './HabitatDome', './HabitatInterior', './SolarArray', './BatteryBank', './DustStormParticles', './MarsRover',
    './ResourceDrops', './SpecimenNode', './SpaceSkybox', '@/modules/character/AstronautPlayer',
    '@/modules/character/CameraRig', './PhysicsDebugHitboxes',
  ]) components.set(name, component(name));
  const path = resolve(root, 'src/modules/outpost-3d/MarsCanvas.tsx');
  const source = readFileSync(path, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)((name) => {
    if (!components.has(name)) throw new Error(`Unexpected import in MarsCanvas harness: ${name}`);
    return components.get(name);
  }, module, module.exports);
  window.location = { search: '' }; window.devicePixelRatio = 1;
  const readinessChanges = [];
  const tree = module.exports.MarsCanvas({ onSceneReadinessChange: (readiness) => readinessChanges.push(readiness) });
  const findCanvas = (node) => {
    if (!node || typeof node !== 'object') return null;
    if (node.type.name === 'Canvas') return node;
    const children = node.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) { const found = findCanvas(child); if (found) return found; }
    return null;
  };
  const canvasElement = findCanvas(tree);
  assert.ok(canvasElement, 'the Mars scene renders a Canvas');
  const startupReporter = (() => {
    const visit = (node) => {
      if (!node || typeof node !== 'object') return null;
      if (node.type?.name === 'StartupMilestoneReporter') return node;
      const children = node.props?.children;
      for (const child of Array.isArray(children) ? children : [children]) { const found = visit(child); if (found) return found; }
      return null;
    };
    return visit(tree);
  })();
  assert.ok(startupReporter, 'the mounted scene reports startup milestones');
  startupScene = new THREE.Scene();
  startupScene.add(new THREE.Mesh(new THREE.CircleGeometry(135, 8), new THREE.MeshBasicMaterial()));
  const domElement = Object.assign(new EventHub(), { style: {} });
  let renderedFrame = 0;
  startupRenderer = { domElement, info: { render: { get frame() { return renderedFrame; } } }, getContext: () => ({}), setPixelRatio() {}, setClearColor() {} };
  startupReporter.type(startupReporter.props);
  canvasElement.props.onCreated({ gl: startupRenderer, scene: startupScene });
  assert.equal(domElement.style.touchAction, 'none');
  assert.equal(domElement.style.overscrollBehavior, 'none');
  assert.equal(documentStub.body.style.touchAction, 'pan-y', 'manual-scroll UI keeps document gesture policy');
  assert.equal(documentStub.body.style.overscrollBehavior, 'auto', 'document overscroll behavior remains unchanged');
  assert.deepEqual(readinessChanges, ['idle'], 'canvas registration reports idle before its first rendered frame');
  renderedFrame += 1;
  startupFrame({}, 0);
  for (const callback of [...afterEffectCallbacks]) callback(0);
  assert.deepEqual(readinessChanges, ['idle', 'ready'], 'readiness follows the first observed renderer frame');
});

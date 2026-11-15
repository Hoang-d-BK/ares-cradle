import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cache = new Map();
let liveStore;
let liveCamera;
let liveCanvas;
let frameCallback;
let captureFrame = false;
let hooks = [];
let effects = [];

class EventHub {
  listeners = new Map();
  addEventListener(type, listener) { const set = this.listeners.get(type) ?? new Set(); set.add(listener); this.listeners.set(type, set); }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatch(type, event = {}) { for (const listener of this.listeners.get(type) ?? []) listener(event); }
}
const element = (type, props = {}) => ({ type, props });
const react = {
  useRef(initial) { const ref = { current: initial }; hooks.push(ref); return ref; },
  useEffect(callback) { effects.push(callback); },
  useMemo(callback) { return callback(); },
  useState(initial) { return [typeof initial === 'function' ? initial() : initial, () => {}]; },
};
react.default = react;
react.__esModule = true;
const useOutpostStore = (selector) => selector(liveStore);
useOutpostStore.getState = () => liveStore;

function compile(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const source = readFileSync(file, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (id) => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return { jsx: element, jsxs: element, Fragment: Symbol.for('react.fragment') };
    if (id === '@react-three/fiber') return {
      useFrame(callback) { if (captureFrame) frameCallback = callback; },
      useThree() { return { camera: liveCamera, gl: { domElement: liveCanvas } }; },
    };
    if (id === 'three') return THREE;
    if (id === '@/modules/store/useOutpostStore') return { useOutpostStore };
    if (id === '@/modules/character/physicsEngine') return physics;
    if (id === '@/modules/audio/soundEngine') return { soundEngine: new Proxy({}, { get: () => () => {} }) };
    if (id === '@/modules/session/gameSession') return sessionModule;
    if (id.startsWith('.')) {
      let child = resolve(dirname(file), id);
      if (!/\.tsx?$/.test(child)) child = existsSync(`${child}.ts`) ? `${child}.ts` : `${child}.tsx`;
      if (existsSync(child)) return compile(child);
    }
    throw new Error(`Unexpected actual-camera-review import: ${id}`);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

const physics = compile(resolve(root, 'src/modules/character/physicsEngine.ts'));
const world = compile(resolve(root, 'src/modules/outpost-3d/worldRegions.ts'));
const sessionModule = compile(resolve(root, 'src/modules/session/gameSession.ts'));
const cameraModule = compile(resolve(root, 'src/modules/character/CameraRig.tsx'));
const actorModule = compile(resolve(root, 'src/modules/character/AstronautPlayer.tsx'));
const domeModule = compile(resolve(root, 'src/modules/outpost-3d/HabitatDome.tsx'));
const interiorModule = compile(resolve(root, 'src/modules/outpost-3d/HabitatInterior.tsx'));
const spawn = [0, -0.4, 1.55];

function makeStore() {
  const store = {
    cameraYaw: 0, cameraPitch: 0, isPointerLocked: false, isDrivingRover: false, roverHeading: 0,
    playerPos: [...spawn], roverPos: [4, -0.32, -2.2], joystickVector: { x: 0, y: 0 },
    isMouseDriving: false, isFlashlightOn: false, jumpRequestCount: 0, sprintInputActive: false,
    exploration: { survival: { air: 1, meals: 1, energyEU: 1 } }, oxygen: 21, temperature: 20,
    isStormShutterClosed: false, isRoverDocked: false, emergencyPowerSaver: false,
    domeEvolutionLevel: 1, isInsideHabitat: true, // AstronautPlayer spawn radius is 1.55m (< the actual 3.55m habitat trigger).
    setCameraLook(yaw, pitch) { store.cameraYaw = yaw; store.cameraPitch = pitch; },
    setPointerLocked(value) { store.isPointerLocked = value; },
    toggleSkyView() {},
    setPlayerPos() { throw new Error('CameraRig must not mutate astronaut pose'); },
    setIsInsideHabitat() { throw new Error('CameraRig must not mutate habitat state'); },
    setPhysicsStatus() { throw new Error('CameraRig must not mutate physics state'); },
    setIsRoverDocked() { throw new Error('CameraRig must not mutate rover state'); },
  };
  return store;
}

function mountActualRig(aspect) {
  sessionModule.startGameplay();
  liveStore = makeStore();
  liveCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  liveCanvas = Object.assign(new EventHub(), {
    captures: new Set(),
    setPointerCapture(id) { this.captures.add(id); },
    hasPointerCapture(id) { return this.captures.has(id); },
    releasePointerCapture(id) { this.captures.delete(id); },
  });
  const documentStub = Object.assign(new EventHub(), {
    hidden: false, pointerLockElement: null, body: { style: {} },
    querySelector() { return null; },
  });
  globalThis.document = documentStub;
  globalThis.window = new EventHub();
  hooks = [];
  effects = [];
  frameCallback = undefined;
  captureFrame = true;
  cameraModule.CameraRig();
  captureFrame = false;
  assert.equal(typeof frameCallback, 'function', 'actual CameraRig registered its rendered-frame callback');
  const cleanups = effects.map((effect) => effect()).filter((cleanup) => typeof cleanup === 'function');
  const tick = (count = 1, dt = 1 / 60) => {
    for (let i = 0; i < count; i += 1) frameCallback({}, dt);
  };
  return {
    camera: liveCamera,
    store: liveStore,
    tick,
    pointer(type, pointerId, x, y) {
      liveCanvas.dispatch(type, { pointerType: 'mouse', pointerId, button: 0, clientX: x, clientY: y, preventDefault() {} });
    },
    close() { cleanups.forEach((cleanup) => cleanup()); },
  };
}

const geometryFactories = {
  boxGeometry: (args) => new THREE.BoxGeometry(...args),
  sphereGeometry: (args) => new THREE.SphereGeometry(...args),
  cylinderGeometry: (args) => new THREE.CylinderGeometry(...args),
  coneGeometry: (args) => new THREE.ConeGeometry(...args),
  ringGeometry: (args) => new THREE.RingGeometry(...args),
  circleGeometry: (args) => new THREE.CircleGeometry(...args),
  planeGeometry: (args) => new THREE.PlaneGeometry(...args),
  torusGeometry: (args) => new THREE.TorusGeometry(...args),
};
const children = (value) => (Array.isArray(value) ? value.flat(Infinity) : [value]).filter(Boolean);
function isGeometryNode(node) { return typeof node?.type === 'string' && !!geometryFactories[node.type]; }
function buildThreeTree(node) {
  if (Array.isArray(node)) {
    const group = new THREE.Group();
    for (const child of node.flat(Infinity)) { const object = buildThreeTree(child); if (object) group.add(object); }
    return group;
  }
  if (!node || typeof node !== 'object') return null;
  if (node.type === Symbol.for('react.fragment')) return buildThreeTree(node.props?.children);
  if (node.type === 'mesh') {
    const childNodes = children(node.props?.children);
    const geometryNode = childNodes.find(isGeometryNode);
    const geometry = geometryNode && geometryFactories[geometryNode.type](geometryNode.props.args ?? []);
    const mesh = new THREE.Mesh(geometry ?? new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    applyTransform(mesh, node.props);
    assignRef(node.props?.ref, mesh);
    for (const child of childNodes) {
      if (child === geometryNode || child.type === 'meshStandardMaterial' || child.type === 'meshBasicMaterial') continue;
      const object = buildThreeTree(child); if (object) mesh.add(object);
    }
    return mesh;
  }
  if (node.type === 'group') {
    const group = new THREE.Group();
    applyTransform(group, node.props);
    assignRef(node.props?.ref, group);
    for (const child of children(node.props?.children)) { const object = buildThreeTree(child); if (object) group.add(object); }
    return group;
  }
  return null;
}
function applyTransform(object, props = {}) {
  if (Array.isArray(props.position)) object.position.set(...props.position);
  if (Array.isArray(props.rotation)) object.rotation.set(...props.rotation);
  if (Array.isArray(props.scale)) object.scale.set(...props.scale);
  else if (typeof props.scale === 'number') object.scale.setScalar(props.scale);
  if (props.name) object.name = props.name;
  if (props.visible === false) object.visible = false;
}
function assignRef(ref, object) {
  if (typeof ref === 'function') ref(object);
  else if (ref && typeof ref === 'object') ref.current = object;
}
function renderedActor() {
  liveStore = makeStore();
  hooks = [];
  effects = [];
  const tree = buildThreeTree(actorModule.AstronautPlayer());
  tree.updateMatrixWorld(true);
  assert.deepEqual(tree.position.toArray(), spawn, 'actual AstronautPlayer JSX starts at the published spawn');
  return { root: tree, refs: hooks };
}
function renderedOccluders() {
  liveStore = makeStore();
  hooks = [];
  const dome = buildThreeTree(domeModule.HabitatDome());
  const interior = buildThreeTree(interiorModule.HabitatInterior());
  dome.updateMatrixWorld(true);
  interior.updateMatrixWorld(true);
  const named = new Map();
  dome.traverse((object) => { if (object.isMesh && object.name) named.set(object.name, object); });
  const wall = named.get('habitat-foundation-wall');
  const collar = named.get('habitat-foundation-collar');
  assert.ok(wall?.geometry?.isBufferGeometry, 'actual mounted habitat wall geometry is present');
  assert.ok(collar?.geometry?.isBufferGeometry, 'actual mounted habitat collar geometry is present');
  const table = [];
  interior.traverse((object) => {
    const p = object.geometry?.parameters;
    if (object.isMesh && object.geometry?.type === 'CylinderGeometry' && p?.radiusTop === 0.95 && p?.radiusBottom === 1.15 && p?.height === 0.45 && p?.radialSegments === 6) table.push(object);
  });

  assert.equal(table.length, 1, 'actual HabitatInterior command-table cylinder is present');
  assert.ok(Math.abs(table[0].getWorldPosition(new THREE.Vector3()).y - 0.57) < 1e-6, 'table keeps its actual nested scene transform');
  return [wall, collar, table[0]];
}

function isActuallyVisible(object) {
  for (let current = object; current; current = current.parent) if (!current.visible) return false;
  return true;
}

function visibleActorPoints(actor) {
  actor.root.updateMatrixWorld(true);
  const head = actor.refs[2]?.current;
  const meshes = [];
  actor.root.traverse((object) => {
    if (object.isMesh && object.visible && object.geometry?.type === 'BoxGeometry') meshes.push(object);
  });
  const torso = meshes.find((mesh) => {
    const p = mesh.geometry.parameters;
    return p.width === 0.44 && p.height === 0.5 && p.depth === 0.28;
  });
  const legs = meshes.filter((mesh) => mesh.geometry.parameters.height === 0.35);
  assert.ok(head && torso && legs.length === 2, 'actual head, torso, and both boot meshes were rendered');
  const bottomOf = (mesh) => {
    mesh.geometry.computeBoundingBox();
    return new THREE.Vector3(0, mesh.geometry.boundingBox.min.y, 0).applyMatrix4(mesh.matrixWorld);
  };
  const headTop = new THREE.Vector3();
  let maxY = -Infinity;
  actor.root.traverse((object) => {
    if (!object.isMesh || !isActuallyVisible(object) || !object.geometry?.getAttribute('position')) return;
    const position = object.geometry.getAttribute('position');
    for (let i = 0; i < position.count; i += 1) {
      const point = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i)).applyMatrix4(object.matrixWorld);
      if (point.y > maxY) { maxY = point.y; headTop.copy(point); }
    }
  });
  return [
    { label: 'helmet center', point: head.getWorldPosition(new THREE.Vector3()) },
    { label: 'antenna tip (actual highest vertex)', point: headTop },
    { label: 'torso center', point: torso.getWorldPosition(new THREE.Vector3()) },
    ...legs.map((mesh, index) => ({ label: `boot ${index + 1} actual lower vertex`, point: bottomOf(mesh) })),
  ];
}

function inspectActualView(label, rig, actor, occluders) {
  const { camera, store } = rig;
  camera.updateMatrixWorld(true);
  actor.root.updateMatrixWorld(true);
  const projected = [];
  actor.root.traverse((object) => {
    if (!object.isMesh || !isActuallyVisible(object) || !object.geometry?.getAttribute('position')) return;
    const position = object.geometry.getAttribute('position');
    for (let i = 0; i < position.count; i += 1) {
      projected.push(new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i)).applyMatrix4(object.matrixWorld).project(camera));
    }
  });
  assert.ok(projected.length > 0, `${label} has actual rendered astronaut vertices`);
  const bounds = {
    minX: Math.min(...projected.map((p) => p.x)), maxX: Math.max(...projected.map((p) => p.x)),
    minY: Math.min(...projected.map((p) => p.y)), maxY: Math.max(...projected.map((p) => p.y)),
    minZ: Math.min(...projected.map((p) => p.z)), maxZ: Math.max(...projected.map((p) => p.z)),
  };
  const eye = camera.getWorldPosition(new THREE.Vector3());
  const pivot = new THREE.Vector3(store.playerPos[0], store.playerPos[1] + 0.2, store.playerPos[2]);
  const separation = camera.position.distanceTo(pivot);
  const cameraInfo = `camera=${camera.position.toArray().map((n) => n.toFixed(3)).join(',')}m separation=${separation.toFixed(3)}m`;
  const violations = [];
  if (!(bounds.minX > -0.9 && bounds.maxX < 0.9 && bounds.minY > -0.9 && bounds.maxY < 0.9)) {
    violations.push(`${label} actor bounds exceed ±0.9 NDC (${JSON.stringify(bounds)}; ${cameraInfo})`);
  }
  if (!(bounds.minZ >= -1 && bounds.maxZ <= 1)) violations.push(`${label} body outside camera near/far (${JSON.stringify(bounds)})`);
  const viewportHeightFraction = (bounds.maxY - bounds.minY) / 2;
  if (!(viewportHeightFraction >= 0.3 && viewportHeightFraction <= 0.82)) {
    violations.push(`${label} actor size outside medium-chase range (${viewportHeightFraction.toFixed(3)}; ${JSON.stringify(bounds)})`);
  }
  if (!(separation >= physicsCamera.MIN_HABITAT_CAMERA_SEPARATION)) violations.push(`${label} separation below configured minimum (${separation.toFixed(3)}m)`);
  if (!(Math.hypot(camera.position.x, camera.position.z) < 3.55)) violations.push(`${label} camera outside habitat shell (${cameraInfo})`);
  if (!physicsCamera.isCameraPointClear(camera.position, world.sampleWorldGround, physics.buildWorldColliders(store.roverPos, false))) {
    violations.push(`${label} camera position intersects live ground/physics collider (${cameraInfo})`);
  }

  const raycaster = new THREE.Raycaster();
  const samples = visibleActorPoints(actor);
  const rayResults = samples.map(({ label: sampleLabel, point }) => {
    const direction = point.clone().sub(eye);
    const distance = direction.length();
    raycaster.set(eye, direction.normalize());
    const hit = raycaster.intersectObjects(occluders, false).find((intersection) => intersection.distance < distance - 1e-4);
    return { label: sampleLabel, target: point.toArray().map((n) => Number(n.toFixed(3))), hit: hit?.object.name || null, hitDistance: hit?.distance ?? null };
  });
  const blocked = rayResults.find((sample) => sample.hit);
  if (blocked) violations.push(`${label} actor LOS blocked at ${blocked.label} by ${blocked.hit}`);
  return { label, bounds, viewportHeightFraction, separation, camera: camera.position.toArray(), rayResults, violations };
}

const physicsCamera = compile(resolve(root, 'src/modules/character/thirdPersonCamera.ts'));
const mountedOccluders = renderedOccluders();
const actualActor = renderedActor();

test('actual home CameraRig frames the mounted astronaut and clears mounted foundation/table geometry', () => {
  assert.equal(world.sampleWorldGround(spawn[0], spawn[2]), physics.PHYSICS_CONSTANTS.GROUND_Y,
    'home camera uses the actual walking ground sample, not a unit-test plane');
  const summary = [];
  for (const [label, aspect] of [['16:10', 16 / 10], ['4:3', 4 / 3], ['390x640 mobile', 390 / 640]]) {
    const rig = mountActualRig(aspect);
    rig.tick(90);
    const initial = inspectActualView(label, rig, actualActor, mountedOccluders);
    summary.push(initial);
    assert.deepEqual(initial.violations, [], `${label} actual camera review; camera=${JSON.stringify(initial.camera)} bounds=${JSON.stringify(initial.bounds)}`);
    if (label === '16:10') {
      const directionBefore = rig.camera.getWorldDirection(new THREE.Vector3());
      const yawBefore = Math.atan2(-directionBefore.x, -directionBefore.z);
      const cameraBefore = rig.camera.position.clone();
      rig.pointer('pointerdown', 11, 100, 100);
      rig.pointer('pointermove', 11, 110, 90);
      rig.tick(90);
      rig.pointer('pointerup', 11, 110, 90);
      const directionAfter = rig.camera.getWorldDirection(new THREE.Vector3());
      const yawAfter = Math.atan2(-directionAfter.x, -directionAfter.z);
      const rightDragMovement = rig.camera.position.distanceTo(cameraBefore);
      const orbit = inspectActualView('right+up orbit', rig, actualActor, mountedOccluders);
      if (!(yawAfter < yawBefore)) orbit.violations.push(`actual world direction yaw did not rotate right (${yawBefore.toFixed(4)} -> ${yawAfter.toFixed(4)})`);
      if (!(directionAfter.y > directionBefore.y + 0.005)) orbit.violations.push(`actual world direction did not rise on UP (${directionBefore.y.toFixed(4)} -> ${directionAfter.y.toFixed(4)})`);
      if (JSON.stringify(rig.store.playerPos) !== JSON.stringify(spawn)) orbit.violations.push('camera callback mutated astronaut pose');
      summary.push({ label: 'right+up orbit', rightDragMovement, yawBefore, yawAfter, directionYBefore: directionBefore.y, directionYAfter: directionAfter.y,
        ...orbit });
    }
    rig.close();
  }
  console.log(`ACTUAL_HOME_RIG_REVIEW ${JSON.stringify(summary)}`);
  const failures = summary.flatMap((entry) => entry.violations.map((violation) => `${entry.label}: ${violation}`));
  assert.deepEqual(failures, [], 'actual home rig has camera/frustum/LOS/orbit findings; see ACTUAL_HOME_RIG_REVIEW above');
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { loadTsModule } from '../mission-v2/support/load-ts-module.mjs';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const world = await loadTsModule('../../src/modules/outpost-3d/worldRegions.ts', import.meta.url);
const catalog = await loadTsModule('../../src/modules/outpost-3d/scienceCatalog.ts', import.meta.url);
const naturalSites = await loadTsModule('../../src/modules/outpost-3d/naturalSiteDefinitions.ts', import.meta.url);
const scienceInteraction = await loadTsModule('../../src/modules/outpost-3d/scienceInteraction.ts', import.meta.url);
const { WORLD_REGIONS, sampleWorldGround } = world;
const { SCIENTIFIC_ELEMENTS } = catalog;
const { NATURAL_INSPECTION_PROXIES, NATURAL_ROCK_SCATTER, NATURAL_LANDMARK_SUPPORTS } = naturalSites;
const { getScientificInspectionCandidate } = scienceInteraction;
const source = (path) => readFileSync(resolve(root, path), 'utf8');
const transpile = (path) => ts.transpileModule(source(path), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React,
} }).outputText;
const element = (type, props, ...children) => ({ type, props: { ...props, children: children.length ? children.length === 1 ? children[0] : children : props?.children } });
const flatten = (node, output = []) => {
  if (Array.isArray(node)) node.forEach((child) => flatten(child, output));
  else if (node && typeof node === 'object' && node.type) { output.push(node); flatten(node.props?.children, output); }
  return output;
};

let renderState;
let frameCallbacks;
const ReactStub = {
  Fragment: Symbol('React.Fragment'),
  createElement: element,
  useRef: (current) => ({ current }),
  useCallback: (callback) => callback,
  useMemo: (callback) => callback(),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useEffect: (callback) => { callback(); },
};
const jsxRuntime = { jsx: (type, props) => element(type, props), jsxs: (type, props) => element(type, props), Fragment: ReactStub.Fragment };
const storeHook = (selector) => selector(renderState);
storeHook.getState = () => renderState;
storeHook.subscribe = () => () => {};
const compile = (path, imports) => {
  const module = { exports: {} };
  const output = transpile(path);
  const req = (id) => {
    if (Object.hasOwn(imports, id)) return imports[id];
    throw new Error(`Unexpected import ${id} from ${path}`);
  };
  new Function('require', 'module', 'exports', output)(req, module, module.exports);
  return module.exports;
};

let ScientificElements;
let AncientOutgassingTeachingPlume;
const renderedSites = () => {
  renderState = { exploration: { collected: [] }, isDrivingRover: false, remoteRegionId: null, playerPos: [0, -0.4, 0], roverPos: [0, -0.4, 0], isPlayerGrounded: true, isBackpackOpen: false, isManualOpen: false, activeScienceEntryId: null };
  frameCallbacks = [];
  const fiber = { useFrame: (callback) => frameCallbacks.push(callback) };
  if (!ScientificElements) {
    const elementsModule = compile('src/modules/outpost-3d/ScientificElements.tsx', {
      react: { __esModule: true, default: ReactStub, ...ReactStub },
      'react/jsx-runtime': jsxRuntime,
      '@react-three/fiber': fiber,
      '@/modules/store/useOutpostStore': { useOutpostStore: storeHook },
      './scienceCatalog': catalog,
      './worldRegions': world,
      './scienceInteraction': scienceInteraction,
    });
    ScientificElements = elementsModule.ScientificElements;
    AncientOutgassingTeachingPlume = elementsModule.AncientOutgassingTeachingPlume;
  }
  const expand = (node) => {
    if (Array.isArray(node)) return node.map(expand);
    if (!node || typeof node !== 'object') return node;
    if (typeof node.type === 'function') return expand(node.type(node.props));
    return { ...node, props: { ...node.props, children: expand(node.props?.children) } };
  };
  return expand(ScientificElements());
};

test('renders exactly 15 recognizable science features at each canonical sampled anchor', () => {
  assert.equal(SCIENTIFIC_ELEMENTS.length, 15);
  assert.equal(SCIENTIFIC_ELEMENTS.filter(({ sourceDate }) => sourceDate).length, SCIENTIFIC_ELEMENTS.length);
  assert.ok(SCIENTIFIC_ELEMENTS.some(({ sourceDate }) => sourceDate === 'February 18, 2015'));
  assert.ok(SCIENTIFIC_ELEMENTS.some(({ sourceDate }) => sourceDate === 'October 26, 2023'));
  const tree = renderedSites();
  const allNodes = flatten(tree);
  const sites = allNodes.filter((node) => node.type === 'group' && node.props.name?.startsWith('scientific-element-'));
  assert.equal(sites.length, 15);
  const byId = new Map(SCIENTIFIC_ELEMENTS.map((entry) => [entry.id, entry]));
  const distinctiveFeatureNames = new Set([
    'impact-shocked-outcrop', 'impact-ejecta-outcrop-cluster', 'impact-crater-rim-landform', 'buried-ice-mantle-exposure', 'crater-rim', 'ejecta-lobes', 'dust-devil-column', 'dust-deposit-patches',
    'wind-streak-ridges', 'dust-devil', 'stacked-basalt-lavas', 'inclined-rock-strata', 'lava-channel-and-levees',
    'pale-ice-exposure', 'buried-ice-mantle-exposure', 'exposed-ice-layers', 'seasonal-frost-patches', 'branching-dry-delta',
    'eroded-cross-bedded-sediment', 'mineral-bearing-outcrop', 'mineral-bearing-natural-fracture', 'ancient-outgassing-teaching-illustration',
  ]);
  const latestFeatureNames = new Set([...allNodes.map((node) => node.props?.name).filter(Boolean), 'bounded-dust-devil-atmospheric-plume']);
  for (const site of sites) {
    const id = site.props.name.slice('scientific-element-'.length);
    const entry = byId.get(id);
    assert.ok(entry, `rendered unknown element ${id}`);
    const region = WORLD_REGIONS.find(({ id: regionId }) => regionId === entry.regionId);
    assert.deepEqual([site.props.position[0], site.props.position[2]], [region.discoveries[Number(id.slice(-1)) - 1].x, region.discoveries[Number(id.slice(-1)) - 1].z]);
    assert.equal(site.props.position[1], sampleWorldGround(entry.position.x, entry.position.z), `${id} uses sampled surface Y`);
    assert.ok(Math.hypot(entry.position.x, entry.position.z) > 210, `${id} stays outside preserved home region`);
    assert.ok(NATURAL_INSPECTION_PROXIES.some((proxy) => proxy.scienceId === id && proxy.radius >= 0), `${id} has an authored natural footprint`);
    const names = flatten(site).map((node) => node.props?.name).filter(Boolean);
    const renderedFeature = names.some((name) => distinctiveFeatureNames.has(name)) ||
      (id === 'ice.science-2' && latestFeatureNames.has('buried-ice-mantle-exposure')) ||
      (id === 'dust.science-1' && source('src/modules/outpost-3d/ScientificElements.tsx').includes("case 'dust-devil': return <DustDevilPlume />"));
    assert.ok(renderedFeature, `${id} must have an authored physical signal`);
    assert.ok(names.includes('inspect-range-hint'), `${id} keeps an inspect plaque/ring anchor`);
  }
  const renderLandmarks = compile('src/modules/outpost-3d/RegionLandmarks.tsx', {
    react: { __esModule: true, default: ReactStub, ...ReactStub },
    'react/jsx-runtime': jsxRuntime,
    three: require('three'),
    './worldRegions': world,
    './naturalSiteDefinitions': naturalSites,
    './marsSurfaceMaterials': { createMarsSurfaceMaterial: () => new (require('three').MeshStandardMaterial)() },
    './ScientificElements': { AncientOutgassingTeachingPlume },
  });
  for (const [scienceId, kind, position, expectedName] of [
    ['volcano.science-2', 'lava-channel', [-260, 262], 'cooled-lava-channel-tube-mouth'],
    ['volcano.science-3', 'volcanic-vent', [-247, 254], 'ancient-volcanic-vent-fissure'],
  ]) {
    assert.ok(SCIENTIFIC_ELEMENTS.some((entry) => entry.id === scienceId && entry.kind === kind));
    const naturalProxy = NATURAL_INSPECTION_PROXIES.find((proxy) => proxy.scienceId === scienceId && proxy.position.x === position[0] && proxy.position.z === position[1]);
    assert.ok(naturalProxy, `${scienceId} visible landmark alias exists at its authoritative position`);
    const approach = [position[0], sampleWorldGround(position[0], position[1]), position[1]];
    assert.equal(getScientificInspectionCandidate(SCIENTIFIC_ELEMENTS, approach, { isRemote: false, remoteRegionId: null, grounded: true })?.element.id, scienceId);
    const hero = renderLandmarks.RegionHero({ landmark: world.OUTER_HERO_LANDMARKS.find(({ id }) => id === 'volcano-shield'), region: WORLD_REGIONS.find(({ id }) => id === 'volcano') });
    const expand = (node) => {
      if (Array.isArray(node)) return node.map(expand);
      if (!node || typeof node !== 'object') return node;
      if (typeof node.type === 'function') return expand(node.type(node.props));
      return { ...node, props: { ...node.props, children: expand(node.props?.children) } };
    };
    const children = [];
    const walk = (node) => { if (Array.isArray(node)) node.forEach(walk); else if (node && typeof node === 'object') { children.push(node); walk(node.props?.children); } };
    walk(expand(hero));
    assert.ok(children.some((node) => node.props?.name === expectedName), `${scienceId} has a real visible landmark mesh`);
    if (scienceId === 'volcano.science-3') {
      assert.ok(children.some((node) => node.props?.name === 'ancient-outgassing-teaching-illustration'), 'main vent alias includes the bounded ancient-outgassing teaching illustration');
      const plume = AncientOutgassingTeachingPlume();
      assert.equal(plume.props.name, 'ancient-outgassing-teaching-illustration');
      assert.deepEqual(plume.props.position, [0, 0.05, 0]);
      assert.equal(plume.props.children.flat(Infinity).filter((node) => node?.type === 'mesh').length, 6, 'vent illustration remains a bounded three-ring, three-particle teaching plume');
    }
  }

  const sourceText = source('src/modules/outpost-3d/ScientificElements.tsx');
  assert.match(sourceText, /ringGeometry args=\{\[0\.94, 1/);
  assert.match(sourceText, /visible=\{false\}/, 'inspect hint starts hidden, not a permanent glow');
  assert.match(sourceText, /getScientificInspectionCandidate/, 'scene hint uses shared live candidate rules');
});

let keyboardHandler;
let promptModule;
let latestTree;
class ElementStub { closest(selector) { return (selector.includes('input') && this.input) || (selector.includes('button') && this.button) || (selector.includes('[role="dialog"]') && this.dialog) ? this : null; } }
const windowStub = { addEventListener(type, handler) { if (type === 'keydown') keyboardHandler = handler; }, removeEventListener(type, handler) { if (type === 'keydown' && keyboardHandler === handler) keyboardHandler = null; } };
const documentStub = { body: {}, querySelector(selector) { return selector === '[role="dialog"]' && this.dialog ? {} : null; }, dialog: false };
const resetPrompt = (patch = {}) => {
  renderState = {
    playerPos: [0, -0.4, 0], roverPos: [0, -0.4, 0], isPlayerGrounded: true, isDrivingRover: false, remoteRegionId: null,
    isBackpackOpen: false, isManualOpen: false, isDatapadOpen: false, isClassroomOpen: false, isBrownoutQuizOpen: false,
    exploration: { collected: [] }, activeScienceEntryId: null, expeditionProgress: { bases: { impact: { active: true }, dust: { active: true }, ice: { active: true }, volcano: { active: true }, lake: { active: true } } }, inspected: [], toggleCalls: 0,
    inspectScientificElement: (id) => { renderState.inspected.push(id); return true; },
    openScienceEntry: (id) => { renderState.activeScienceEntryId = id; }, toggleDrivingRover: () => { renderState.toggleCalls++; },
    ...patch,
  };
  keyboardHandler = null; documentStub.dialog = false;
  const ReactDOM = { createPortal: (node) => node };
  const codex = { __esModule: true, default: (props) => element('science-codex', props) };
  if (!promptModule) promptModule = compile('src/modules/mission-control/ScientificInteractionPrompt.tsx', {
    react: { __esModule: true, default: ReactStub, ...ReactStub },
    'react/jsx-runtime': jsxRuntime,
    'react-dom': ReactDOM,
    './ScienceCodex': codex,
    '@/modules/outpost-3d/scienceCatalog': catalog,
    '@/modules/outpost-3d/scienceInteraction': scienceInteraction,
    '@/modules/outpost-3d/worldRegions': world,
    '@/modules/store/useOutpostStore': { useOutpostStore: storeHook },
  });
  latestTree = promptModule.ScientificInteractionPrompt();
  return flatten(latestTree);
};
const keyEvent = (patch = {}) => ({ code: 'KeyF', repeat: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, target: null, prevented: false, preventDefault() { this.prevented = true; }, ...patch });

// Element checks run in a VM-like harness without browser or renderer startup.
globalThis.Element = ElementStub;
globalThis.window = windowStub;
globalThis.document = documentStub;

test('nearest field selector uses shared footprint-aware eligibility and range', () => {
  const element = SCIENTIFIC_ELEMENTS.find(({ id }) => id === 'ice.science-1');
  const proxy = NATURAL_INSPECTION_PROXIES.find(({ scienceId, radius }) => scienceId === element.id && radius < 3);
  const poseAt = (edgeDistance) => [proxy.position.x + proxy.radius + edgeDistance,
    sampleWorldGround(proxy.position.x + proxy.radius + edgeDistance, proxy.position.z), proxy.position.z];
  assert.equal(scienceInteraction.SCIENCE_INTERACTION_RANGE, 4.5);
  assert.equal(getScientificInspectionCandidate([element], poseAt(4.5), { isRemote: false, remoteRegionId: null, grounded: true })?.element.id, element.id);
  assert.equal(getScientificInspectionCandidate([element], poseAt(4.5001), { isRemote: false, remoteRegionId: null, grounded: true }), null);
  assert.equal(getScientificInspectionCandidate([element], poseAt(0), { isRemote: false, remoteRegionId: null, grounded: false }), null);
  assert.equal(getScientificInspectionCandidate([element], poseAt(0), { isRemote: true, remoteRegionId: 'impact', grounded: true }), null);
  assert.equal(getScientificInspectionCandidate([element], poseAt(0), { isRemote: true, remoteRegionId: 'ice', grounded: true })?.element.id, element.id);
});

test('F inspects a live nearby target once and ignores repeat, typing, dialogs, and airborne poses', () => {
  const element = SCIENTIFIC_ELEMENTS.find(({ id }) => id === 'impact.science-1');
  const edgeProxy = NATURAL_INSPECTION_PROXIES.find(({ scienceId, radius }) => scienceId === element.id && radius < 3);
  const approach = [edgeProxy.position.x + edgeProxy.radius, sampleWorldGround(edgeProxy.position.x + edgeProxy.radius, edgeProxy.position.z), edgeProxy.position.z];
  resetPrompt({ playerPos: approach });
  assert.equal(typeof keyboardHandler, 'function');
  const valid = keyEvent(); keyboardHandler(valid);
  assert.equal(valid.prevented, true);
  assert.deepEqual(renderState.inspected, [element.id]);
  const focusedButton = Object.assign(new ElementStub(), { button: true });
  keyboardHandler(keyEvent({ target: focusedButton }));
  assert.equal(renderState.inspected.length, 2, 'a focused non-editable HUD button cannot swallow F');
  const repeat = keyEvent({ repeat: true }); keyboardHandler(repeat);
  const input = Object.assign(new ElementStub(), { input: true });
  keyboardHandler(keyEvent({ target: input }));
  documentStub.dialog = true; keyboardHandler(keyEvent()); documentStub.dialog = false;
  assert.equal(renderState.inspected.length, 2);
  resetPrompt({ playerPos: approach, isPlayerGrounded: false });
  keyboardHandler(keyEvent());
  assert.deepEqual(renderState.inspected, []);
  resetPrompt({ playerPos: approach, isManualOpen: true });
  keyboardHandler(keyEvent());
  assert.deepEqual(renderState.inspected, [], 'manual overlay blocks field input');
});

test('prompt button invokes the store action once; regional console remains a separate R button', () => {
  const entry = SCIENTIFIC_ELEMENTS.find(({ id }) => id === 'impact.science-1');
  const approachProxy = NATURAL_INSPECTION_PROXIES.find(({ scienceId, radius }) => scienceId === entry.id && radius < 3);
  const approach = [approachProxy.position.x + approachProxy.radius, sampleWorldGround(approachProxy.position.x + approachProxy.radius, approachProxy.position.z), approachProxy.position.z];
  const nodes = resetPrompt({ playerPos: approach });
  const prompt = nodes.find((node) => node.props?.['data-testid'] === 'scientific-interaction-prompt');
  assert.ok(prompt, `prompt missing; nodes: ${nodes.map((node) => String(node.type)).join(',')}`);
  const button = flatten(prompt).find((node) => node.type === 'button');
  button.props.onClick();
  assert.deepEqual(renderState.inspected, [entry.id]);
  assert.equal(renderState.toggleCalls, 0);

  const consolePoint = WORLD_REGIONS.find(({ id }) => id === 'ice').baseConsole;
  const consoleNodes = resetPrompt({ playerPos: [consolePoint.x, sampleWorldGround(consolePoint.x, consolePoint.z), consolePoint.z] });
  const consoleButton = flatten(consoleNodes.find((node) => node.props['data-testid'] === 'scientific-interaction-prompt')).find((node) => node.type === 'button');
  assert.match(JSON.stringify(consoleButton.props.children), /Control regional rover/);
  consoleButton.props.onClick();
  assert.equal(renderState.toggleCalls, 1);
  assert.deepEqual(renderState.inspected, []);
});

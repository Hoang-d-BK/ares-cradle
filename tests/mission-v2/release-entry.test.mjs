import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
import { loadTsModule } from './support/load-ts-module.mjs';

const source = await readFile(new URL('../../src/App.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React },
}).outputText;
const readiness = await loadTsModule('../../src/modules/outpost-3d/sceneReadiness.ts', import.meta.url);
const canvas = { name: 'MarsCanvas' };
const entry = { name: 'OriginalEntryFlow' };
const overlay = { name: 'MissionControlOverlay' };
const rover = { name: 'RoverReview' };
const suspense = { name: 'Suspense' };
const loadedModules = [];
const invokedLazyFactories = [];
const hookSlots = [];
let hookCursor = 0;
let gameplayStarted = false;
const React = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.filter(child => child !== false && child !== null && child !== undefined) }),
  lazy: factory => ({ lazyFactory: factory }),
  useState(initial) {
    const index = hookCursor++;
    let slot = hookSlots[index];
    if (!slot) {
      slot = { kind: 'state', value: typeof initial === 'function' ? initial() : initial };
      slot.setter = value => { slot.value = typeof value === 'function' ? value(slot.value) : value; };
      hookSlots[index] = slot;
    }
    if (slot.kind !== 'state') throw new Error(`Unexpected hook order at ${index}`);
    return [slot.value, slot.setter];
  },
  useCallback(callback, dependencies) {
    const index = hookCursor++;
    let slot = hookSlots[index];
    const changed = !slot || !Array.isArray(dependencies) || !Array.isArray(slot.dependencies)
      || dependencies.length !== slot.dependencies.length
      || dependencies.some((value, i) => !Object.is(value, slot.dependencies[i]));
    if (!slot) { slot = { kind: 'callback' }; hookSlots[index] = slot; }
    if (slot.kind !== 'callback') throw new Error(`Unexpected hook order at ${index}`);
    if (changed) { slot.value = callback; slot.dependencies = dependencies; }
    return slot.value;
  },
  useEffect() {},
};
React.Suspense = suspense;
React.default = React;
const module = { exports: {} };
const windowMock = { location: { search: '' } };
vm.runInNewContext(compiled, {
  module, exports: module.exports,
  require(name) {
    loadedModules.push(name);
    if (name === 'react') return React;
    if (name.includes('sceneReadiness')) return readiness;
    if (name.includes('MarsCanvas')) return { __esModule: true, default: canvas };
    if (name.includes('OriginalEntryFlow')) return { __esModule: true, default: entry };
    if (name.includes('MissionControlOverlay')) return { __esModule: true, default: overlay };
    if (name.includes('RoverReview')) return { __esModule: true, default: rover };
    if (name.includes('gameSession')) return {
      useGameplayStarted: () => gameplayStarted,
      startGameplay: () => { gameplayStarted = true; },
    };
    if (name.includes('useOutpostStore')) return { useOutpostStore: (selector) => selector({ setManualOpen() {} }) };
    if (name.includes('MissionGame')) return { __esModule: true, default: { name: 'MissionGame' } };
    if (name.includes('jsx-runtime')) throw new Error('Unexpected automatic JSX runtime');
    throw new Error(`Unexpected import ${name}`);
  },
  window: windowMock,
  URLSearchParams,
});
const App = module.exports.App;
async function render(search) {
  windowMock.location.search = search;
  hookCursor = 0;
  const root = App();
  const lazyElements = [];
  function collect(element) {
    if (!element || typeof element !== 'object') return;
    if (element.type?.lazyFactory) lazyElements.push(element.type);
    for (const child of element.children ?? []) collect(child);
  }
  collect(root);
  for (const elementType of lazyElements) {
    invokedLazyFactories.push(elementType.lazyFactory);
    await elementType.lazyFactory();
  }
  return root;
}

function isStartupGate(root) {
  return root.type === 'main' && root.children[0].type === canvas && root.children[1].type === entry;
}

test('release entry keeps START gated for default, unknown, legacy, and Frontiers queries', async () => {
  for (const query of ['', '?unknown=1', '?legacy=1', '?mission=frontiers', '?mission=frontiers&legacy=1']) {
    hookSlots.length = 0;
    gameplayStarted = false;
    assert.equal(isStartupGate(await render(query)), true, query || 'default query');
  }
  assert.equal(loadedModules.some(name => name.includes('MissionGame')), false);
  assert.equal(invokedLazyFactories.length, 0);
});

test('START requires ready scene and all milestones before exposing the mission HUD', async () => {
  hookSlots.length = 0;
  gameplayStarted = false;
  const initial = await render('');
  assert.equal(isStartupGate(initial), true);
  assert.equal(initial.children[1].props.sceneReadiness, 'idle');
  const callbacks = initial.children[0].props;
  const launch = initial.children[1].props;
  launch.onStart();
  assert.equal(gameplayStarted, false, 'START is blocked before the renderer reports ready');
  callbacks.onSceneReadinessChange('ready');
  callbacks.onStartupMilestonesChange(Object.fromEntries(readiness.STARTUP_MILESTONES.map(({ id }) => [id, true])));
  const ready = await render('');
  ready.children[1].props.onStart();
  assert.equal(gameplayStarted, true);
  const started = await render('');
  assert.equal(started.children[1].type, overlay);
  assert.equal(started.children[2].type, entry);
});

test('rover review retains priority and remains the only lazy game entry', async () => {
  hookSlots.length = 0;
  gameplayStarted = false;
  const root = await render('?review=rover&mission=frontiers');
  assert.equal(root.type, suspense);
  assert.equal(root.props.fallback.props.role, 'status');
  assert.deepEqual(loadedModules.filter(name => name.includes('RoverReview')), ['./game/review/RoverReview']);
  assert.equal(loadedModules.some(name => name.includes('MissionGame')), false);
  assert.equal(invokedLazyFactories.length, 1);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../../src/modules/outpost-3d/sceneReadiness.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const module = { exports: {} };
new Function('module', 'exports', compiled)(module, module.exports);
const { observeSceneReadiness } = module.exports;

function fixture(initialFrame = 0) {
  const listeners = new Map();
  const callbacks = new Set();
  const calls = [];
  let frame = initialFrame;
  const canvas = {
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name, callback) => { if (listeners.get(name) === callback) listeners.delete(name); },
  };
  const cleanup = observeSceneReadiness(canvas, () => frame, (callback) => {
    callbacks.add(callback);
    calls.push('subscribe');
    return () => { callbacks.delete(callback); calls.push('unsubscribe'); };
  }, (readiness) => calls.push(readiness));
  return {
    calls, callbacks, listeners, cleanup,
    renderFrame(next = frame + 1) { frame = next; for (const callback of [...callbacks]) callback(0); },
    loseContext() { listeners.get('webglcontextlost')?.({ preventDefault() { calls.push('prevent-default'); } }); },
    restoreContext() { listeners.get('webglcontextrestored')?.({}); },
  };
}

test('readiness waits for a completed frame after renderer creation', () => {
  const f = fixture(7);
  assert.deepEqual(f.calls, ['idle', 'subscribe']);
  f.renderFrame(7);
  assert.deepEqual(f.calls, ['idle', 'subscribe']);
  f.renderFrame(8);
  assert.deepEqual(f.calls, ['idle', 'subscribe', 'unsubscribe', 'ready']);
  assert.equal(f.callbacks.size, 0);
  f.cleanup();
});

test('context loss reports limited and restoration waits for a new frame', () => {
  const f = fixture();
  f.loseContext();
  assert.deepEqual(f.calls, ['idle', 'subscribe', 'prevent-default', 'unsubscribe', 'limited']);
  f.restoreContext();
  assert.deepEqual(f.calls.slice(-2), ['idle', 'subscribe']);
  f.renderFrame();
  assert.equal(f.calls.at(-1), 'ready');
  f.cleanup();
});

test('frame read errors report limited and stop the frame observer', () => {
  const calls = [];
  const callbacks = new Set();
  let reads = 0;
  const canvas = { addEventListener() {}, removeEventListener() {} };
  const cleanup = observeSceneReadiness(canvas, () => {
    if (reads++ > 0) throw new Error('context lost');
    return 0;
  }, (callback) => { callbacks.add(callback); return () => callbacks.delete(callback); }, (status) => calls.push(status));
  for (const callback of [...callbacks]) callback(0);
  assert.deepEqual(calls, ['idle', 'limited']);
  assert.equal(callbacks.size, 0);
  cleanup();
});

test('cleanup removes listeners and ignores stale after-effects', () => {
  const f = fixture();
  const [callback] = f.callbacks;
  f.cleanup();
  callback(0);
  assert.deepEqual(f.calls, ['idle', 'subscribe', 'unsubscribe']);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.callbacks.size, 0);
});

test('Start exploring is always enabled and the manual shows honest readiness copy', async () => {
  const manual = await readFile(new URL('../../src/modules/mission-control/QuickControlsManual.tsx', import.meta.url), 'utf8');
  assert.match(manual, /Start exploring/);
  assert.doesNotMatch(manual, /disabled=\{[^}]*sceneReadiness/);
  assert.match(manual, /First scene frame observed\. Loading may continue\./);
  assert.match(manual, /3D view unavailable\. You can still start exploring\./);
});

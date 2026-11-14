import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const cache = new Map();
const compileTs = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const compileModule = async (filePath) => {
  if (cache.has(filePath)) return cache.get(filePath).exports;
  const module = { exports: {} };
  cache.set(filePath, module);
  const localRequire = (id) => {
    if (id.endsWith('.json')) return { default: JSON.parse(require('node:fs').readFileSync(resolve(dirname(filePath), id), 'utf8')) };
    const resolved = resolve(dirname(filePath), id.endsWith('.ts') ? id : `${id}.ts`);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const source = require('node:fs').readFileSync(resolved, 'utf8');
    const child = { exports: {} };
    cache.set(resolved, child);
    new Function('require', 'module', 'exports', compileTs(source))((childId) => {
      if (childId.endsWith('.json')) return { default: JSON.parse(require('node:fs').readFileSync(resolve(dirname(resolved), childId), 'utf8')) };
      const nested = resolve(dirname(resolved), childId.endsWith('.ts') ? childId : `${childId}.ts`);
      if (cache.has(nested)) return cache.get(nested).exports;
      throw new Error(`Module not preloaded: ${nested}`);
    }, child, child.exports);
    return child.exports;
  };
  const source = await readFile(pathToFileURL(filePath), 'utf8');
  new Function('require', 'module', 'exports', compileTs(source))(localRequire, module, module.exports);
  return module.exports;
};
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (path) => compileModule(resolve(root, path));
const pack = await load('src/game/mission/contentPack.ts');
const content = await load('src/game/mission/content.ts');
const rules = await load('src/game/mission/activities/rules.ts');
const selectorModule = await load('src/game/mission/presentation/audio/selector.ts');
const controllerModule = await load('src/game/mission/presentation/audio/controller.ts');
void pack;
void content;
void rules;
const { selectMissionAudio } = selectorModule;
const { createMissionAudioController, MISSION_AUDIO_MAX_VOICES } = controllerModule;

const regions = ['impact', 'dust', 'volcano', 'ice', 'lake'];
const initial = () => ({
  started: true,
  activeRover: null,
  leo: { x: 0, z: 0, heading: 0 },
  rovers: Object.fromEntries(regions.map((id) => [id, { x: 0, z: 0, heading: 0 }])),
  surveys: Object.fromEntries(regions.map((id) => [id, {
    observations: [], branches: [], paid: false, supportBaseId: id, activityDone: false,
    activityProgress: null, assist: false, operation: null, deferred: null,
  }])),
  bases: Object.fromEntries(regions.map((id) => [id, { report: false }])),
  settings: { muted: false },
});

class MockParam {
  constructor() { this.calls = []; }
  setValueAtTime(...args) { this.calls.push(['set', ...args]); }
  cancelScheduledValues(...args) { this.calls.push(['cancel', ...args]); }
  exponentialRampToValueAtTime(...args) { this.calls.push(['ramp', ...args]); }
}
class MockOscillator {
  constructor(context) { this.context = context; this.frequency = new MockParam(); this.stops = 0; this.disconnects = 0; }
  connect() {}
  start() { this.started = true; }
  stop() { this.stops++; }
  disconnect() { this.disconnects++; }
}
class MockGain {
  constructor(context) { this.context = context; this.gain = new MockParam(); this.disconnects = 0; }
  connect() {}
  disconnect() { this.disconnects++; }
}
class MockContext {
  constructor() {
    this.currentTime = 1;
    this.state = 'suspended';
    this.destination = {};
    this.oscillators = [];
    this.gains = [];
    this.closeCalls = 0;
    this.resumeInGesture = false;
  }
  createGain() { const gain = new MockGain(this); this.gains.push(gain); return gain; }
  createOscillator() { const oscillator = new MockOscillator(this); this.oscillators.push(oscillator); return oscillator; }
  resume() { this.resumeInGesture = activeGesture; this.state = 'running'; return Promise.resolve(); }
  close() { this.closeCalls++; this.state = 'closed'; return Promise.resolve(); }
}
let activeGesture = false;
const trusted = (isTrusted = true, extra = {}) => ({ isTrusted, ...extra });
const changedPose = (state, x) => ({ ...state, leo: { ...state.leo, x } });
const movedUpdate = (controller, prev, next, paused = false) => controller.update(next, paused);

// Tests exercise the production selector and controller; the mock models only Web Audio node calls.
test('selector cues accepted movement only, and ignores blocked/no movement and teleports', () => {
  const before = initial();
  assert.deepEqual(selectMissionAudio(before, changedPose(before, 0)), { cues: [], movementRemainder: 0 });
  assert.deepEqual(selectMissionAudio(before, changedPose(before, 2)), { cues: [], movementRemainder: 2 });
  assert.deepEqual(selectMissionAudio(before, changedPose(before, 4)), { cues: ['leo-step'], movementRemainder: 0.5 });
  assert.deepEqual(selectMissionAudio(before, changedPose(before, 50)), { cues: [], movementRemainder: 0 });
});

test('selector detects only new valid observations, branches, operations, and reports', () => {
  const before = initial();
  const observation = structuredClone(before);
  observation.surveys.impact.observations = ['impact-h1'];
  assert.deepEqual(selectMissionAudio(before, observation).cues, ['observation']);
  assert.deepEqual(selectMissionAudio(observation, structuredClone(observation)).cues, []);
  const branch = structuredClone(before);
  branch.surveys.dust.branches = ['dust-b1'];
  assert.deepEqual(selectMissionAudio(before, branch).cues, ['branch']);
  const operation = structuredClone(before);
  operation.surveys.ice.operation = 'ice-core-analysis';
  assert.deepEqual(selectMissionAudio(before, operation).cues, ['operation']);
  const report = structuredClone(before);
  report.bases.lake.report = true;
  assert.deepEqual(selectMissionAudio(before, report).cues, ['report']);
});

test('selector recognizes actual new schema-valid lake capture, not selected target churn', () => {
  const before = initial();
  const progress = rules.initialActivityProgress('lake');
  const selected = structuredClone(before);
  selected.surveys.lake.activityProgress = { ...progress, selectedTarget: 'sample-site' };
  assert.deepEqual(selectMissionAudio(before, selected).cues, []);
  const captured = structuredClone(selected);
  captured.surveys.lake.activityProgress.captures['sample-site'].location = { x: 206, z: 182 };
  assert.deepEqual(selectMissionAudio(selected, captured).cues, ['branch']);
  assert.deepEqual(selectMissionAudio(captured, structuredClone(captured)).cues, []);
});

test('only trusted non-modified gesture resumes in event stack and enables finite voice', async () => {
  const state = initial();
  const contexts = [];
  const controller = createMissionAudioController(state, false, { createContext: () => { const c = new MockContext(); contexts.push(c); return c; } });
  controller.update(state, false);
  controller.onGesture(trusted(false));
  assert.equal(contexts.length, 0);
  controller.onGesture(trusted(true, { repeat: true }));
  assert.equal(contexts.length, 0);
  activeGesture = true;
  controller.onGesture(trusted(true));
  activeGesture = false;
  await Promise.resolve();
  assert.equal(contexts[0].resumeInGesture, true);
  movedUpdate(controller, state, changedPose(state, 4));
  assert.equal(contexts[0].oscillators.length, 1);
  assert.equal(contexts[0].oscillators[0].started, true);
  assert.equal(contexts[0].oscillators[0].stops, 1);
  controller.dispose();
});

test('mute stops and closes active output; unmute does not queue or autoplay', async () => {
  const state = initial();
  const contexts = [];
  let clock = 0;
  const controller = createMissionAudioController(state, false, { now: () => clock, createContext: () => { const c = new MockContext(); contexts.push(c); return c; } });
  controller.update(state, false);
  activeGesture = true; controller.onGesture(trusted()); activeGesture = false;
  await Promise.resolve();
  movedUpdate(controller, state, changedPose(state, 4));
  const voice = contexts[0].oscillators[0];
  const muted = { ...state, settings: { muted: true } };
  controller.update(muted, false);
  assert.ok(voice.stops >= 1);
  assert.equal(contexts[0].closeCalls, 1);
  const unmuted = { ...muted, settings: { muted: false } };
  controller.update(unmuted, false);
  movedUpdate(controller, unmuted, changedPose(unmuted, 6));
  assert.equal(contexts.length, 1);
  activeGesture = true; controller.onGesture(trusted()); activeGesture = false;
  await Promise.resolve();
  clock += 141;
  movedUpdate(controller, changedPose(unmuted, 6), changedPose(unmuted, 10));
  assert.equal(contexts.length, 2);
  assert.equal(contexts[1].oscillators.length, 1);
  controller.dispose();
});

test('pause, hidden, blur and disposal stop voices; focus alone never resumes', async () => {
  const state = initial();
  const contexts = [];
  const controller = createMissionAudioController(state, false, { createContext: () => { const c = new MockContext(); contexts.push(c); return c; } });
  controller.update(state, false);
  activeGesture = true; controller.onGesture(trusted()); activeGesture = false;
  await Promise.resolve();
  movedUpdate(controller, state, changedPose(state, 4));
  const voice = contexts[0].oscillators[0];
  controller.update(changedPose(state, 4), true);
  assert.ok(voice.stops >= 1);
  assert.equal(contexts[0].closeCalls, 1);
  controller.update(changedPose(state, 4), false);
  controller.setHidden(true);
  controller.setHidden(false);
  controller.setFocused(false);
  controller.setFocused(true);
  assert.equal(contexts.length, 1);
  controller.onGesture(trusted());
  await Promise.resolve();
  assert.equal(contexts.length, 2);
  controller.dispose();
  controller.dispose();
  assert.equal(contexts[1].closeCalls, 1);
});

test('controller enforces global cooldown and maximum voice count', async () => {
  const state = initial();
  const contexts = [];
  let clock = 0;
  const controller = createMissionAudioController(state, false, { now: () => clock, createContext: () => { const c = new MockContext(); contexts.push(c); return c; } });
  controller.update(state, false);
  activeGesture = true; controller.onGesture(trusted()); activeGesture = false;
  await Promise.resolve();
  const cues = ['impact-h1', 'impact-h2', 'impact-h3'];
  let current = state;
  for (let index = 0; index < cues.length; index++) {
    const next = structuredClone(current);
    next.surveys.impact.observations.push(cues[index]);
    clock += 141;
    controller.update(next, false);
    current = next;
  }
  assert.equal(contexts[0].oscillators.length, MISSION_AUDIO_MAX_VOICES);
  assert.equal(contexts[0].oscillators.every((oscillator) => oscillator.stops === 1), true);
  controller.dispose();
});

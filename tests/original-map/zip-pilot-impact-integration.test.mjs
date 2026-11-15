import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import vm from 'node:vm';

const codex = await readFile(new URL('../../src/modules/mission-control/ScienceCodex.tsx', import.meta.url), 'utf8');
const dialogHook = await readFile(new URL('../../src/modules/mission-control/useExplorationDialog.ts', import.meta.url), 'utf8');
const panel = await readFile(new URL('../../src/modules/mission-control/ImpactPracticePanel.tsx', import.meta.url), 'utf8');
const practiceCss = await readFile(new URL('../../src/modules/mission-control/impactPractice.css', import.meta.url), 'utf8');
const rules = await readFile(new URL('../../src/game/mission/activities/rules.ts', import.meta.url), 'utf8');
const allSource = [codex, dialogHook, panel, practiceCss, rules].join('\n');

class TestHTMLElement {
  constructor(type = 'button', props = {}) { this.type = type; this.props = props; this.children = []; }
  focus() { testDocument.activeElement = this; }
  querySelectorAll() {
    const found = [];
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'button' && !node.props.disabled || node.type === 'a' && node.props.href) found.push(node);
      for (const child of node.children ?? []) visit(child);
    };
    for (const child of this.children) visit(child);
    return found;
  }
}
const testDocument = { activeElement: null };
const listeners = new Map();
const listenerCounts = { add: 0, remove: 0 };
const testWindow = {
  addEventListener(type, callback) {
    listenerCounts.add++;
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(callback);
  },
  removeEventListener(type, callback) {
    listenerCounts.remove++;
    listeners.get(type)?.delete(callback);
  },
};

const React = {
  Fragment: Symbol.for('react.fragment'),
  createElement(type, props, ...children) {
    const elementProps = { ...(props ?? {}) };
    elementProps.children = children.length === 1 ? children[0] : children;
    return { type, props: elementProps, children };
  },
};
React.default = React;
React.__esModule = true;

function compile(source, filename, requireModule) {
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports, React, HTMLElement: TestHTMLElement,
    document: testDocument, window: testWindow,
    require: requireModule,
    Set, Array, Object, String, Number, Math, Error,
  }, { filename });
  return module.exports;
}

function createRenderer(initialProps) {
  const icon = () => null;
  const hookExports = compile(dialogHook, 'useExplorationDialog.ts', (id) => {
    if (id === 'react') return React;
    throw new Error(`Unexpected dialog hook import ${id}`);
  });
  const rulesExports = compile(rules, 'rules.ts', (id) => {
    if (id === '../contract') return {};
    throw new Error(`Unexpected activity rules import ${id}`);
  });
  const panelExports = compile(panel, 'ImpactPracticePanel.tsx', (id) => {
    if (id === 'react') return React;
    if (id === '../../game/mission/activities/rules') return rulesExports;
    if (id === './impactPractice.css') return {};
    throw new Error(`Unexpected impact panel import ${id}`);
  });
  const codexExports = compile(codex, 'ScienceCodex.tsx', (id) => {
    if (id === 'react') return React;
    if (id === 'lucide-react') return { ExternalLink: icon, LockKeyhole: icon, X: icon };
    if (id === './useExplorationDialog') return hookExports;
    if (id === '@/modules/outpost-3d/worldRegions') return { WORLD_REGIONS: [{ id: 'impact', name: 'Impact' }, { id: 'ice', name: 'Ice' }] };
    if (id === './ImpactPracticePanel') return panelExports;
    throw new Error(`Unexpected codex import ${id}`);
  });

  const frames = new Map();
  const rootFrame = { hooks: [], pendingEffects: [], type: codexExports.ScienceCodex };
  frames.set('root', rootFrame);
  let activeFrame;
  let props = initialProps;
  let dirty = false;
  let tree = null;
  let hostTree = null;
  let mountedRefs = [];

  function useState(initial) {
    const frame = activeFrame;
    const index = frame.cursor++;
    if (!(index in frame.hooks)) frame.hooks[index] = { kind: 'state', value: typeof initial === 'function' ? initial() : initial };
    const hook = frame.hooks[index];
    return [hook.value, (next) => {
      const value = typeof next === 'function' ? next(hook.value) : next;
      if (!Object.is(value, hook.value)) { hook.value = value; dirty = true; }
    }];
  }
  function useRef(initial) {
    const frame = activeFrame;
    const index = frame.cursor++;
    if (!(index in frame.hooks)) frame.hooks[index] = { kind: 'ref', value: { current: initial } };
    return frame.hooks[index].value;
  }
  function useEffect(effect, deps) {
    const frame = activeFrame;
    const index = frame.cursor++;
    const hook = frame.hooks[index] ??= { kind: 'effect', deps: undefined, cleanup: undefined };
    const changed = deps === undefined || !hook.deps || deps.length !== hook.deps.length || deps.some((value, i) => !Object.is(value, hook.deps[i]));
    if (changed) {
      hook.deps = deps;
      frame.pendingEffects.push({ hook, effect });
    }
  }
  Object.assign(React, { useState, useRef, useEffect });

  function flatten(values) { return values.flat(Infinity).filter((value) => value !== null && value !== undefined && value !== false && value !== true); }
  function expand(node, path, usedFrames) {
    if (node === null || node === undefined || node === false || node === true) return null;
    if (Array.isArray(node)) return flatten(node.map((child, index) => expand(child, `${path}.${index}`, usedFrames)));
    if (typeof node !== 'object' || !('type' in node)) return node;
    if (node.type === React.Fragment) return flatten(node.children.map((child, index) => expand(child, `${path}.${index}`, usedFrames)));
    if (typeof node.type === 'function') {
      const framePath = path;
      let frame = frames.get(framePath);
      if (!frame || frame.type !== node.type) {
        if (frame) for (const hook of frame.hooks) hook?.cleanup?.();
        frame = { hooks: [], pendingEffects: [], type: node.type };
        frames.set(framePath, frame);
      }
      usedFrames.add(framePath);
      frame.cursor = 0;
      frame.pendingEffects = [];
      const previous = activeFrame;
      activeFrame = frame;
      let rendered;
      try { rendered = node.type({ ...node.props, children: node.props.children }); }
      finally { activeFrame = previous; }
      return expand(rendered, `${path}.render`, usedFrames);
    }
    const children = flatten(node.children.map((child, index) => expand(child, `${path}.${node.props.key ?? index}`, usedFrames)));
    return Object.assign(new TestHTMLElement(node.type, node.props), { children });
  }
  function allNodes(value, result = []) {
    if (Array.isArray(value)) { for (const child of value) allNodes(child, result); return result; }
    if (value && typeof value === 'object' && 'type' in value) { result.push(value); for (const child of value.children ?? []) allNodes(child, result); }
    return result;
  }
  function commit() {
    for (const ref of mountedRefs) if (ref.current === ref.node) ref.ref.current = null;
    mountedRefs = [];
    for (const node of allNodes(hostTree)) {
      if (node.props?.ref && typeof node.props.ref === 'object') {
        node.props.ref.current = node;
        mountedRefs.push({ ref: node.props.ref, node });
      }
    }
  }
  function renderOnce() {
    dirty = false;
    rootFrame.cursor = 0;
    rootFrame.pendingEffects = [];
    const usedFrames = new Set(['root']);
    const previous = activeFrame;
    activeFrame = rootFrame;
    try { tree = codexExports.ScienceCodex(props); }
    finally { activeFrame = previous; }
    hostTree = expand(tree, 'root', usedFrames);
    for (const [path, frame] of frames) {
      if (!usedFrames.has(path)) {
        for (const hook of frame.hooks) hook?.cleanup?.();
        frames.delete(path);
      }
    }
    commit();
  }
  function flushEffects() {
    for (let pass = 0; pass < 20; pass++) {
      const pending = [...frames.values()].flatMap((frame) => frame.pendingEffects.splice(0));
      for (const { hook, effect } of pending) {
        hook.cleanup?.();
        const cleanup = effect();
        hook.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
      }
      if (!dirty) return;
      renderOnce();
    }
    throw new Error('Hook harness did not settle');
  }
  function render({ effects = true } = {}) { renderOnce(); if (effects) flushEffects(); }
  function update(nextProps, options) { props = nextProps; render(options); }
  function nodes(predicate) { return allNodes(hostTree).filter(predicate); }
  function click(node) { assert.equal(typeof node?.props?.onClick, 'function', `expected a clickable node, got ${node?.type}`); node.props.onClick({ target: node, currentTarget: node, preventDefault() {} }); flushEffects(); }
  function key(key, shiftKey = false) {
    const event = { key, shiftKey, prevented: false, preventDefault() { this.prevented = true; } };
    for (const callback of [...(listeners.get('keydown') ?? [])]) callback(event);
    flushEffects();
    return event;
  }
  render();
  return {
    get props() { return props; }, set props(value) { props = value; },
    get tree() { return hostTree; }, nodes, click, key, update, renderOnce, flushEffects,
  };
}

function entry(id, regionId, title) {
  return { id, regionId, title, kind: 'crater', summary: `${title} summary`, explanation: `${title} explanation`, sourceTitle: `${title} source`, sourceUrl: `https://example.test/${id}`, credit: 'Example credit', scienceBoundary: `${title} evidence boundary` };
}
function baseProps(entries, selectedEntryId) {
  return { isOpen: true, entries, collectedIds: entries.filter((item) => item.id !== 'locked-impact').map((item) => item.id), selectedEntryId, activeRegionId: 'impact', onSelect() {}, onClose() {} };
}
const byTestId = (id) => (node) => node.props?.['data-testid'] === id;
function treeText(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(treeText).join('');
  return value?.children ? value.children.map(treeText).join('') : '';
}
const byText = (text) => (node) => node.type === 'button' && treeText(node).includes(text);

// Each renderer has a separate page lifecycle; reset the shared fake browser between cases.
function resetBrowser() {
  testDocument.activeElement = new TestHTMLElement('button', { 'data-testid': 'outside-hud-control' });
  listeners.clear();
  listenerCounts.add = 0;
  listenerCounts.remove = 0;
}

test('practice requires an explicit launch from the selected unlocked impact note', () => {
  resetBrowser();
  const impact = entry('impact-rim', 'impact', 'Rim');
  const ice = entry('ice-layer', 'ice', 'Ice layer');
  const locked = entry('locked-impact', 'impact', 'Hidden rim');
  const entries = [impact, ice, locked];
  const renderer = createRenderer(baseProps(entries, impact.id));
  assert.equal(renderer.nodes(byTestId('impact-practice-panel')).length, 0, 'opening a note never auto-starts practice');
  assert.equal(renderer.nodes(byTestId('start-impact-practice')).length, 1, 'one explicit launch is shown on the unlocked impact note');
  assert.equal(renderer.nodes((node) => node.type === 'section' && node.props.role === 'dialog').length, 1);

  renderer.click(renderer.nodes(byTestId('start-impact-practice'))[0]);
  assert.equal(renderer.nodes(byTestId('impact-practice-panel')).length, 1, 'the explicit launch mounts the real practice panel');
  assert.equal(renderer.nodes((node) => node.type === 'section' && node.props.role === 'dialog').length, 1, 'practice stays inside the existing dialog');
  assert.equal(renderer.nodes(byText('Back to field note')).length, 1);

  renderer.update({ ...renderer.props, selectedEntryId: ice.id });
  assert.equal(renderer.nodes(byTestId('start-impact-practice')).length, 0, 'non-impact notes cannot launch practice');
  renderer.update({ ...renderer.props, selectedEntryId: locked.id });
  assert.equal(renderer.nodes(byTestId('start-impact-practice')).length, 0, 'locked notes cannot launch practice');
  renderer.update({ ...renderer.props, selectedEntryId: impact.id, isOpen: false });
  assert.equal(renderer.nodes(byTestId('start-impact-practice')).length, 0, 'closed codex has no launch control');
});

test('selected-note changes synchronously unmount stale practice and re-entry is fresh', () => {
  resetBrowser();
  const first = entry('impact-rim', 'impact', 'Rim');
  const second = entry('impact-basin', 'impact', 'Basin');
  const locked = entry('locked-impact', 'impact', 'Hidden');
  let renderer;
  const props = { ...baseProps([first, second, locked], first.id), onSelect(id) { renderer.update({ ...renderer.props, selectedEntryId: id }, { effects: false }); } };
  renderer = createRenderer(props);
  renderer.click(renderer.nodes(byTestId('start-impact-practice'))[0]);
  renderer.click(renderer.nodes((node) => node.type === 'button' && treeText(node).includes('Signal A · Rim check'))[0]);
  renderer.click(renderer.nodes((node) => node.type === 'button' && treeText(node).includes('Crater basin overview'))[0]);
  assert.equal(renderer.nodes((node) => node.props?.['aria-label'] === 'Training records, 0 of 3 matched; 1 attempts').length, 1, 'wrong attempts are local to the current practice instance');
  renderer.click(renderer.nodes(byText('Back to field note'))[0]);
  renderer.click(renderer.nodes(byTestId('start-impact-practice'))[0]);
  assert.equal(renderer.nodes((node) => node.props?.['aria-label'] === 'Training records, 0 of 3 matched; 0 attempts').length, 1, 'exit and re-entry starts fresh local practice');

  renderer.update({ ...renderer.props, selectedEntryId: second.id }, { effects: false });
  assert.equal(renderer.nodes(byTestId('impact-practice-panel')).length, 0, 'a different current selection hides stale practice before passive effects');
  renderer.flushEffects();
  renderer.update({ ...renderer.props, selectedEntryId: first.id });
  assert.equal(renderer.nodes(byTestId('impact-practice-panel')).length, 0, 'switching back does not resurrect the prior practice instance');

  renderer.click(renderer.nodes(byTestId('start-impact-practice'))[0]);
  renderer.nodes((node) => node.type === 'button' && treeText(node).includes('Basin'))[0].props.onClick();
  assert.equal(renderer.nodes(byTestId('impact-practice-panel')).length, 0, 'navigation synchronously clears practice for the new note');
  renderer.flushEffects();
  renderer.click(renderer.nodes(byTestId('start-impact-practice'))[0]);
  renderer.update({ ...renderer.props, selectedEntryId: locked.id }, { effects: false });
  assert.equal(renderer.nodes(byTestId('impact-practice-panel')).length, 0, 'a newly locked selection hides practice synchronously');
  renderer.flushEffects();
  renderer.update({ ...renderer.props, selectedEntryId: first.id });
  renderer.click(renderer.nodes(byTestId('start-impact-practice'))[0]);
  renderer.update({ ...renderer.props, selectedEntryId: null }, { effects: false });
  assert.equal(renderer.nodes(byTestId('impact-practice-panel')).length, 0, 'no selected entry hides practice synchronously');
  renderer.flushEffects();
  renderer.update({ ...renderer.props, selectedEntryId: first.id });
  renderer.click(renderer.nodes(byTestId('start-impact-practice'))[0]);
  renderer.update({ ...renderer.props, collectedIds: [second.id, locked.id] }, { effects: false });
  assert.equal(renderer.nodes(byTestId('impact-practice-panel')).length, 0, 'losing unlock eligibility hides practice synchronously');
  renderer.flushEffects();
  assert.equal(renderer.nodes(byTestId('start-impact-practice')).length, 0);
});

test('one shared Escape/focus lifecycle returns to the note, then restores outside focus', () => {
  resetBrowser();
  const outside = testDocument.activeElement;
  const impact = entry('impact-rim', 'impact', 'Rim');
  let closed = 0;
  let renderer;
  const props = { ...baseProps([impact], impact.id), onClose() { closed++; renderer.update({ ...renderer.props, isOpen: false }); } };
  renderer = createRenderer(props);
  assert.equal(testDocument.activeElement.props['aria-label'], 'Close science codex');
  assert.equal(listenerCounts.add, 1);

  renderer.click(renderer.nodes(byTestId('start-impact-practice'))[0]);
  assert.equal(testDocument.activeElement, renderer.nodes(byText('Back to field note'))[0], 'the practice panel focuses its own Back control');
  assert.equal(listenerCounts.add, 1, 'changing note/practice mode does not rebuild the shared dialog lifecycle');
  assert.equal(listenerCounts.remove, 0);

  renderer.key('Escape');
  assert.equal(renderer.nodes(byTestId('impact-practice-panel')).length, 0);
  assert.equal(testDocument.activeElement, renderer.nodes(byTestId('start-impact-practice'))[0], 'Escape returns focus to the launch control');
  assert.equal(closed, 0, 'first Escape exits practice only');
  assert.equal(listenerCounts.add, 1);
  assert.equal(listenerCounts.remove, 0);

  renderer.key('Escape');
  assert.equal(closed, 1, 'next Escape closes the codex');
  assert.equal(renderer.nodes((node) => node.type === 'section' && node.props.role === 'dialog').length, 0);
  assert.equal(testDocument.activeElement, outside, 'closing the codex restores the original outside focus');
  assert.equal(listenerCounts.add, 1);
  assert.equal(listenerCounts.remove, 1);
});

test('closing controls leave practice and close the whole codex', () => {
  resetBrowser();
  const impact = entry('impact-rim', 'impact', 'Rim');
  let closed = 0;
  const renderer = createRenderer({ ...baseProps([impact], impact.id), onClose() { closed++; } });
  renderer.click(renderer.nodes(byTestId('start-impact-practice'))[0]);
  renderer.click(renderer.nodes((node) => node.props?.['aria-label'] === 'Close science codex')[0]);
  assert.equal(closed, 1, 'the close icon invokes the full-close callback even during practice');
  assert.equal(renderer.nodes(byTestId('impact-practice-panel')).length, 0);
});

test('practice panel keeps local rule-driven state and exposes no campaign capabilities', () => {
  assert.match(panel, /export type ImpactPracticePanelProps = \{ onExit: \(\) => void \}/);
  assert.match(panel, /initialActivityProgress\('impact'\)/);
  assert.match(panel, /recordImpactMatch\(progress, selectedSignal, context\)/);
  assert.match(panel, /isActivityComplete\('impact', progress\)/);
  assert.match(panel, /exitRef\.current\?\.focus\(\)/);
  assert.match(panel, /Optional practice · Not saved/);
  assert.match(panel, /Training records are authored examples, not NASA measurements/);
  assert.doesNotMatch(allSource, /useOutpostStore|localStorage|sessionStorage|MissionGame|ActivityPanel|onComplete|onReward|fetch\(|setActiveScienceEntryId|completeActivity|awardResource/);
  assert.match(practiceCss, /min-height: 48px/);
  assert.match(practiceCss, /@media \(max-width: 680px\)/);
  assert.match(practiceCss, /prefers-reduced-motion/);
});

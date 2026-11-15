import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
}).outputText;

const ruleModule = { exports: {} };
new Function('require', 'module', 'exports', compile(read('src/game/mission/activities/rules.ts')))(() => { throw new Error('Unexpected activity rules import'); }, ruleModule, ruleModule.exports);
const rules = ruleModule.exports;

function createHarness() {
  const context = { state: [], refs: [], effects: [], cursor: 0, pendingEffects: [] };
  let active;
  let exitCalls = 0;
  let focusCalls = 0;
  const blockedCapabilities = [];
  const forbiddenGlobals = new Set(['window', 'document', 'localStorage', 'sessionStorage', 'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB', 'postMessage']);
  const element = (type, props, ...children) => ({ type, props: { ...props, children: children.length === 0 ? props?.children : children.length === 1 ? children[0] : children } });
  const React = {
    createElement: element,
    useState(initial) {
      const current = active;
      const index = current.cursor++;
      if (!(index in current.state)) current.state[index] = typeof initial === 'function' ? initial() : initial;
      return [current.state[index], (value) => { current.state[index] = typeof value === 'function' ? value(current.state[index]) : value; }];
    },
    useRef(initial) {
      const current = active;
      const index = current.cursor++;
      if (!(index in current.refs)) current.refs[index] = { current: initial };
      return current.refs[index];
    },
    useEffect(effect, dependencies) {
      const current = active;
      const index = current.cursor++;
      const previous = current.effects[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
        current.effects[index] = dependencies;
        current.pendingEffects.push(effect);
      }
    },
  };
  const expand = (node) => {
    if (Array.isArray(node)) return node.map(expand);
    if (!node || typeof node !== 'object') return node;
    if (typeof node.type === 'function') return expand(node.type(node.props));
    if (node.type === 'button' && node.props.ref && typeof node.props.ref === 'object') node.props.ref.current = { focus: () => { focusCalls += 1; } };
    return { ...node, props: { ...node.props, children: expand(node.props.children) } };
  };
  const jsx = (type, props) => element(type, props);
  const localRequire = (id) => {
    if (id === 'react') return { __esModule: true, default: React, ...React };
    if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: Symbol('Fragment') };
    if (id === '../../game/mission/activities/rules') return rules;
    if (id === './impactPractice.css') return {};
    throw new Error(`Blocked unapproved ImpactPracticePanel import: ${id}`);
  };
  const panelModule = { exports: {} };
  const sandbox = {
    module: panelModule,
    exports: panelModule.exports,
    require: localRequire,
    denyCapability(capability, operation) {
      blockedCapabilities.push(`${operation}:${capability}`);
      throw new Error(`Blocked capability ${operation}: ${capability}`);
    },
  };
  const runtime = vm.createContext(sandbox);
  for (const capability of forbiddenGlobals) {
    vm.runInContext(`Object.defineProperty(globalThis, ${JSON.stringify(capability)}, {
      configurable: true,
      get() { return denyCapability(${JSON.stringify(capability)}, 'read'); },
      set() { return denyCapability(${JSON.stringify(capability)}, 'write'); },
    });`, runtime);
  }
  vm.runInContext(compile(read('src/modules/mission-control/ImpactPracticePanel.tsx')), runtime);
  const Panel = panelModule.exports.ImpactPracticePanel;
  const props = { onExit: () => { exitCalls += 1; } };
  function render() {
    context.cursor = 0;
    context.pendingEffects = [];
    active = context;
    const tree = Panel(props);
    active = undefined;
    const expanded = expand(tree);
    for (const effect of context.pendingEffects) effect();
    return expanded;
  }
  const all = (node, predicate, result = []) => {
    if (Array.isArray(node)) node.forEach((child) => all(child, predicate, result));
    else if (node && typeof node === 'object' && node.type) {
      if (predicate(node)) result.push(node);
      all(node.props.children, predicate, result);
    }
    return result;
  };
  const text = (node) => Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' && 'type' in node ? text(node.props.children) : node == null ? '' : String(node);
  const buttons = (tree) => all(tree, (node) => node.type === 'button');
  const button = (tree, name) => {
    const found = buttons(tree).find((node) => node.props['aria-label'] === name || String(node.props['aria-label'] ?? '').includes(name) || text(node.props.children).includes(name));
    assert.ok(found, `Missing button ${name}; found ${buttons(tree).map((node) => node.props['aria-label'] ?? text(node.props.children)).join(' | ')}`);
    return found;
  };
  return {
    render, all, text, buttons, button,
    probe: (expression) => vm.runInContext(expression, runtime),
    get blockedCapabilities() { return [...blockedCapabilities]; },
    get exitCalls() { return exitCalls; },
    get focusCalls() { return focusCalls; },
  };
}

test('mounts original optional practice, focuses its exit, and wrong attempts preserve correct pairs', () => {
  const harness = createHarness();
  let tree = harness.render();
  assert.equal(harness.focusCalls, 1, 'focuses Back to field note once on mount');
  assert.equal(harness.all(tree, (node) => node.props?.role === 'dialog').length, 0, 'does not create a nested dialog');
  assert.match(harness.text(tree), /Optional practice · Not saved/);
  assert.match(harness.text(tree), /authored examples, not NASA measurements/);
  assert.ok(harness.button(tree, 'Back to field note'));

  harness.button(tree, 'Choose Signal A').props.onClick();
  tree = harness.render();
  harness.button(tree, 'Match with Rim and scattered rock').props.onClick();
  tree = harness.render();
  assert.match(harness.text(tree), /1 of 3 matched/);

  harness.button(tree, 'Choose Signal B').props.onClick();
  tree = harness.render();
  harness.button(tree, 'Match with Sloped surface detail').props.onClick();
  tree = harness.render();
  assert.match(harness.text(tree), /timestamps differ/i);
  assert.match(harness.text(tree), /1 of 3 matched/);
  assert.match(harness.text(tree), /Attempts: 2/);
  assert.deepEqual(harness.blockedCapabilities, [], 'ordinary practice interactions do not try to use denied host or persistence capabilities');
});

test('correct match after a wrong attempt keeps prior work and cannot be duplicated', () => {
  const harness = createHarness();
  let tree = harness.render();
  harness.button(tree, 'Choose Signal A').props.onClick();
  tree = harness.render();
  harness.button(tree, 'Match with Crater basin overview').props.onClick();
  tree = harness.render();
  assert.match(harness.text(tree), /timestamps differ/i);
  harness.button(tree, 'Match with Rim and scattered rock').props.onClick();
  tree = harness.render();
  assert.match(harness.text(tree), /1 of 3 matched/);
  assert.equal(harness.button(tree, 'Choose Signal A').props.disabled, true);
  assert.equal(harness.button(tree, 'Match with Rim and scattered rock').props.disabled, true);
  assert.equal(harness.button(tree, 'Choose Signal B').props['aria-pressed'], false);
  assert.match(harness.text(tree), /Attempts: 2/);
  for (const capability of ['window', 'document', 'localStorage', 'sessionStorage', 'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB', 'postMessage']) {
    assert.throws(() => harness.probe(capability), new RegExp(`Blocked capability read: ${capability}`));
  }
  assert.throws(() => harness.probe('window = {}'), /Blocked capability write: window/);
  assert.ok(harness.blockedCapabilities.includes('read:window'), 'host-world or storage access attempts are denied by the harness');
  assert.ok(harness.blockedCapabilities.includes('write:window'), 'host-world global writes are denied by the harness');
});

test('three real matches derive local completion; reset clears only this mount', () => {
  const harness = createHarness();
  let tree = harness.render();
  const pair = (signal, frame) => {
    harness.button(tree, `Choose Signal ${signal}`).props.onClick();
    tree = harness.render();
    harness.button(tree, `Match with ${frame}`).props.onClick();
    tree = harness.render();
  };
  pair('A', 'Rim and scattered rock');
  pair('B', 'Crater basin overview');
  pair('C', 'Sloped surface detail');
  assert.match(harness.text(tree), /Practice complete · 3 of 3 matched/);
  assert.match(harness.text(tree), /no exploration progress or rewards changed/i);
  assert.equal(harness.button(tree, 'Choose Signal A').props.disabled, true);
  assert.equal(harness.all(tree, (node) => node.type === 'button' && node.props.onComplete).length, 0);

  harness.button(tree, 'Reset practice').props.onClick();
  tree = harness.render();
  assert.doesNotMatch(harness.text(tree), /Practice complete · 3 of 3 matched/);
  assert.match(harness.text(tree), /0 of 3 matched/);
  assert.match(harness.text(tree), /Attempts: 0/);
  assert.equal(harness.button(tree, 'Choose Signal A').props.disabled, false);
  harness.button(tree, 'Back to field note').props.onClick();
  assert.equal(harness.exitCalls, 1, 'exit is the only host callback');

  const reopened = createHarness();
  assert.match(reopened.text(reopened.render()), /0 of 3 matched/);
  assert.match(reopened.text(reopened.render()), /Attempts: 0/);
});

test('component has a frozen single-callback API and no storage, network, or world-mutation imports', () => {
  const source = read('src/modules/mission-control/ImpactPracticePanel.tsx');
  assert.match(source, /export type ImpactPracticePanelProps\s*=\s*\{\s*onExit:\s*\(\)\s*=>\s*void\s*\}/);
  assert.match(source, /initialActivityProgress\('impact'\)/);
  assert.match(source, /recordImpactMatch\(progress, selectedSignal, context\)/);
  assert.match(source, /isActivityComplete\('impact', progress\)/);
  assert.doesNotMatch(source, /useOutpostStore|MissionStore|localStorage|sessionStorage|postMessage|fetch\s*\(|onComplete|onProgress|role=["']dialog|keydown|Escape/);
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
  assert.deepEqual(imports, ['react', '../../game/mission/activities/rules']);
  assert.match(source, /import\s+['"]\.\/impactPractice\.css['"]/);
});

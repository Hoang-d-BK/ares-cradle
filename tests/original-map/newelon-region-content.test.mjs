import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as THREE from 'three';
import ts from 'typescript';
import { loadTsModule } from '../mission-v2/support/load-ts-module.mjs';

const world = await loadTsModule('../../src/modules/outpost-3d/worldRegions.ts', import.meta.url);
const sites = await loadTsModule('../../src/modules/outpost-3d/naturalSiteDefinitions.ts', import.meta.url);
const catalog = await loadTsModule('../../src/modules/outpost-3d/scienceCatalog.ts', import.meta.url);
const source = (path) => readFileSync(new URL(`../../src/modules/outpost-3d/${path}`, import.meta.url), 'utf8');
const landmarksSource = source('RegionLandmarks.tsx');
const jsx = (type, props, key) => ({ type, props: { ...props, key } });
const react = {
  Fragment: Symbol('Fragment'),
  createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.length ? children : props?.children } }),
  useMemo: (factory) => factory(),
  useEffect: () => {},
  useRef: (current) => ({ current }),
};
const landmarksCompiled = ts.transpileModule(landmarksSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React },
}).outputText;
const landmarksModule = { exports: {} };
new Function('require', 'module', 'exports', landmarksCompiled)((id) => {
  if (id === 'react') return { __esModule: true, default: react, ...react };
  if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: react.Fragment };
  if (id === 'three') return THREE;
  if (id === './worldRegions') return world;
  if (id === './naturalSiteDefinitions') return sites;
  if (id === './marsSurfaceMaterials') return { createMarsSurfaceMaterial: () => new THREE.MeshStandardMaterial() };
  if (id === './ScientificElements') return { AncientOutgassingTeachingPlume: () => ({ type: 'group', props: { name: 'ancient-outgassing-teaching-illustration' } }) };
  throw new Error(`Unexpected RegionLandmarks import: ${id}`);
}, landmarksModule, landmarksModule.exports);

const expand = (node) => {
  if (Array.isArray(node)) return node.map(expand);
  if (!node || typeof node !== 'object') return node;
  if (typeof node.type === 'function') return expand(node.type(node.props));
  return { ...node, props: { ...node.props, children: expand(node.props?.children) } };
};
const nodes = (node, result = []) => {
  if (Array.isArray(node)) node.forEach((child) => nodes(child, result));
  else if (node && typeof node === 'object') {
    result.push(node);
    nodes(node.props?.children, result);
  }
  return result;
};

test('five outer regions retain canonical science, rocks, and visible natural landforms', () => {
  assert.equal(world.WORLD_REGIONS.length, 5);
  assert.equal(sites.NATURAL_INSPECTION_PROXIES.length, 43);
  assert.equal(sites.NATURAL_ROCK_SCATTER.length, 20);
  assert.equal(world.OUTER_HERO_LANDMARKS.length, 5);
  assert.equal(catalog.SCIENTIFIC_ELEMENTS.length, 15);
  const outerSource = source('OuterRegions.tsx');
  assert.match(outerSource, /OUTER_HERO_LANDMARKS\.filter\(\(landmark\) => landmark\.regionId === region\.id\)/);
  assert.match(landmarksSource, /name="natural-boulder-field"/);
  assert.match(landmarksSource, /name="wind-shaped-dune-ridges"/);

  for (const region of world.WORLD_REGIONS) {
    const canonical = catalog.SCIENTIFIC_ELEMENTS.filter(({ regionId }) => regionId === region.id);
    assert.equal(canonical.length, 3, `${region.id} keeps its three canonical science elements`);
    for (const [index, entry] of canonical.entries()) {
      assert.equal(entry.id, `${region.id}.science-${index + 1}`);
      assert.deepEqual(entry.position, region.discoveries[index]);
      assert.ok(sites.NATURAL_INSPECTION_PROXIES.some((proxy) => proxy.scienceId === entry.id
        && proxy.regionId === region.id && proxy.position.x === entry.position.x && proxy.position.z === entry.position.z));
    }
    assert.equal(sites.NATURAL_ROCK_SCATTER.filter(({ regionId }) => regionId === region.id).length, 4,
      `${region.id} has four rendered, bounded boulder specimens`);

    const landmark = world.OUTER_HERO_LANDMARKS.find(({ regionId }) => regionId === region.id);
    assert.ok(landmark, `${region.id} has a named natural hero landform`);
    const tree = expand(landmarksModule.exports.RegionHero({ landmark, region }));
    const names = nodes(tree).map((node) => node.props?.name).filter(Boolean);
    assert.ok(names.includes('natural-boulder-field'), `${region.id} renders a visible natural boulder group`);
    if (region.id === 'ice') assert.ok(names.includes('ice-bearing-mantle-scarp'));
    if (region.id === 'volcano') assert.ok(names.includes('cooled-basalt-flow-lobes') && names.includes('cooled-lava-channel-tube-mouth'));
    if (region.id === 'lake') assert.ok(names.includes('exposed-natural-cross-bedding'));
    if (region.id === 'dust') assert.ok(names.includes('wind-shaped-dune-ridges'));
  }
});

test('home branding and original radius-210 core geometry remain intact', () => {
  assert.equal(world.HOME_REGION.name, 'ELON MARS');
  const terrain = readFileSync(new URL('../../src/modules/outpost-3d/MarsTerrain.tsx', import.meta.url), 'utf8');
  assert.match(terrain, /circleGeometry args=\{\[135, 64\]\}/);
  assert.match(terrain, /ringGeometry args=\{\[134, 210, 64\]\}/);
});

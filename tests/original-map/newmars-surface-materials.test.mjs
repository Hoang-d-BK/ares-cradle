import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTsModule } from '../mission-v2/support/load-ts-module.mjs';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';

const threeModule = await import('three');
const surfacesSource = await readFile(new URL('../../src/modules/outpost-3d/marsSurfaceMaterials.ts', import.meta.url), 'utf8');
const surfacesCompiled = ts.transpileModule(surfacesSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const surfacesModule = { exports: {} };
new Function('require', 'module', 'exports', surfacesCompiled)((specifier) => {
  if (specifier === 'three') return threeModule;
  throw new Error(`Unexpected import: ${specifier}`);
}, surfacesModule, surfacesModule.exports);
const surfaces = surfacesModule.exports;

test('Mars surface family is deterministic, cached, offline, and has real varied maps', () => {
  const { MARS_SURFACE_TEXTURES, createMarsSurfaceMaterial, addWorldSurfaceUVs, addPlanarSurfaceUVs, naturalSeed } = surfaces;
  assert.equal(MARS_SURFACE_TEXTURES.albedo, surfaces.MARS_SURFACE_TEXTURES.albedo);
  for (const name of ['albedo', 'normal', 'roughness', 'bump', 'detail']) {
    const texture = MARS_SURFACE_TEXTURES[name];
    assert.ok(texture instanceof threeModule.DataTexture, `${name} is an actual DataTexture`);
    const data = texture.image.data;
    assert.equal(texture.format, threeModule.RGBAFormat, `${name} uses a WebGL-sized RGBA upload format`);
    assert.equal(data.length, 256 * 256 * 4, `${name} has complete four-channel pixels`);
    for (let pixel = 0; pixel < 256 * 256; pixel += 1) assert.equal(data[pixel * 4 + 3], 255, `${name} alpha is opaque`);
    const samples = [];
    for (let y = 12; y < 236; y += 23) for (let x = 12; x < 236; x += 23) samples.push(data[(y * 256 + x) * 4]);
    assert.ok(new Set(samples).size > 12, `${name} has multiscale spatial variation`);
    assert.equal(texture.wrapS, threeModule.RepeatWrapping);
    assert.equal(texture.wrapT, threeModule.RepeatWrapping);
  }
  const roughness = MARS_SURFACE_TEXTURES.roughness.image.data;
  const green = Array.from({ length: 256 * 256 }, (_, index) => roughness[index * 4 + 1]);
  assert.ok(new Set(green).size > 12, 'roughness green channel carries spatial variation');
  assert.ok(green.every((value, index) => value === roughness[index * 4] && value === roughness[index * 4 + 2]), 'scalar roughness is replicated across RGB for the existing shader sample');
  assert.equal(MARS_SURFACE_TEXTURES.albedo.colorSpace, threeModule.NoColorSpace, 'procedural material values remain in linear space');
  for (const name of ['normal', 'roughness', 'bump', 'detail']) assert.equal(MARS_SURFACE_TEXTURES[name].colorSpace, threeModule.NoColorSpace, `${name} remains linear data`);
  const material = createMarsSurfaceMaterial({ color: '#8a5a42', vertexColors: true });
  assert.equal(material.map, MARS_SURFACE_TEXTURES.albedo);
  assert.equal(material.normalMap, null, 'shared shader explicitly combines triplanar normal and height detail');
  assert.equal(material.roughnessMap, MARS_SURFACE_TEXTURES.roughness);
  assert.equal(typeof material.onBeforeCompile, 'function');
  assert.equal(material.customProgramCacheKey(), 'mars-world-triplanar-v2');
  const shader = { uniforms: {}, vertexShader: '#include <common>\n#include <worldpos_vertex>', fragmentShader: '#include <common>\n#include <map_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>' };
  material.onBeforeCompile(shader, {});
  assert.ok(shader.vertexShader.includes('instanceMatrix') && shader.vertexShader.includes('vMarsWorldPosition'));
  assert.ok(shader.fragmentShader.includes('marsTriSample') && shader.fragmentShader.includes('roughnessMap'));
  assert.ok(shader.fragmentShader.includes('marsHeightMap') && shader.uniforms.marsNormalMap && shader.uniforms.marsDetailMap);
  assert.ok(shader.fragmentShader.includes('marsDetail.r *'), 'detail map is sampled in the compiled albedo branch');
  assert.ok(shader.fragmentShader.includes('vMarsWorldNormal'));
  assert.equal(material.vertexColors, true);
  const geometry = new threeModule.BufferGeometry();
  addWorldSurfaceUVs(geometry, new Float32Array([0, 0, 0, 18, 0, 36]));
  assert.deepEqual(Array.from(geometry.getAttribute('uv').array), [0, 0, 1, 2]);
  const planar = new threeModule.CircleGeometry(2, 8);
  addPlanarSurfaceUVs(planar, 2);
  assert.ok(planar.getAttribute('uv').array.some((value) => value !== 0));
  assert.equal(naturalSeed(-12, 9, 17), naturalSeed(-12, 9, 17));
  material.dispose();
  geometry.dispose();
  planar.dispose();
});

test('surface material implementation does not request external assets', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../../src/modules/outpost-3d/marsSurfaceMaterials.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /fetch\(|https?:\/\//);
});

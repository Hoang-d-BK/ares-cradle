import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../../src/game/mission/contentPack.ts', import.meta.url), 'utf8');
const bundled = JSON.parse(await readFile(new URL('../../public/mission-data/pack-v2.json', import.meta.url), 'utf8'));
const importLine = "import bundledPack from '../../../public/mission-data/pack-v2.json';";
let moduleNumber = 0;
const loadModule = async (fetchImpl) => {
  const priorFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  const replaced = source.replace(importLine, `const bundledPack = ${JSON.stringify(bundled)};`);
  const output = ts.transpileModule(`${replaced}\n// isolated module ${moduleNumber++}`, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
  return { ...module, restoreFetch: () => { globalThis.fetch = priorFetch; } };
};
const response = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });

test('bundled JSON is validated at import and exposes compatible five-region content', async () => {
  const module = await loadModule(async () => response(bundled));
  assert.deepEqual(module.REGIONS.map(({ id }) => id), ['impact', 'dust', 'volcano', 'ice', 'lake']);
  assert.equal(module.REGIONS.reduce((sum, region) => sum + region.observations.length, 0), 15);
  assert.equal(module.REGIONS.reduce((sum, region) => sum + region.branches.length, 0), 10);
  assert.equal(module.REGIONS.reduce((sum, region) => sum + region.operations.length, 0), 10);
  assert.equal(module.SOURCES.length, 9);
  assert.deepEqual(module.REGIONS[0].center, [-200, -170]);
  assert.deepEqual(module.REGIONS[0].operations.map(({ id }) => id), ['impact-protected', 'impact-accessible']);
  assert.deepEqual(module.REGIONS[0].sourceIds, ['nasa-insight-impacts', 'nasa-mars-rock-samples']);
  assert.equal((await module.prepareMissionContent()).source, 'local');
  module.restoreFetch();
});

test('compatible local pack initializes once and failure preserves bundled fallback', async () => {
  let calls = 0;
  const module = await loadModule(async (url) => {
    calls += 1;
    assert.equal(url, '/mission-data/pack-v2.json');
    return response(bundled);
  });
  const first = await module.prepareMissionContent();
  const second = await module.prepareMissionContent();
  assert.deepEqual(first, { source: 'local' });
  assert.deepEqual(second, first);
  assert.equal(calls, 1);
  module.restoreFetch();

  const fallback = await loadModule(async () => response({}, false, 404));
  const failed = await fallback.prepareMissionContent();
  assert.equal(failed.source, 'bundled');
  assert.match(failed.warning, /404/);
  assert.equal(fallback.REGIONS.length, 5);
  fallback.restoreFetch();
});

test('unsupported schema, unsafe asset URLs, and incompatible content IDs fall back', async () => {
  const mutations = [
    (pack) => { pack.schemaVersion = 3; },
    (pack) => { pack.campaignId = 'future-campaign'; },
    (pack) => { pack.packHash = 'different-label'; },
    (pack) => { pack.balance.baseStock.energy = -1; },
    (pack) => { pack.balance.goFloor.energy = 9; },
    (pack) => { pack.regions[0].id = 'unknown'; },
    (pack) => { pack.regions[1].id = pack.regions[0].id; },
    (pack) => { pack.regions.pop(); },
    (pack) => { pack.regions[0].observations[0].id = 'unknown-observation'; },
    (pack) => { pack.regions[0].branches[0].id = 'unknown-branch'; },
    (pack) => { pack.regions[0].operations[0].id = 'unknown-operation'; },
    (pack) => { pack.regions[0].center[0] += 1; },
    (pack) => { pack.regions[0].observations[0].position[0] += 1; },
    (pack) => { pack.sources[0].url = 'https://evil.example/assets/mission.json'; },
    (pack) => { pack.dialogue.intro[0] = '<script>bad</script>'; },
  ];
  for (const [index, mutate] of mutations.entries()) {
    const changed = structuredClone(bundled);
    mutate(changed);
    const module = await loadModule(async () => response(changed));
    const result = await module.prepareMissionContent();
    assert.equal(result.source, 'bundled', `mutation ${index} must be rejected`);
    assert.ok(result.warning);
    assert.deepEqual(module.REGIONS.map(({ id }) => id), ['impact', 'dust', 'volcano', 'ice', 'lake']);
    module.restoreFetch();
  }
  assert.equal(mutations.length, 15);
});

test('a fetch implementation that ignores abort still times out to bundled content', async () => {
  const module = await loadModule(() => new Promise(() => {}));
  const start = Date.now();
  const result = await module.prepareMissionContent();
  assert.ok(Date.now() - start < 3000);
  assert.equal(result.source, 'bundled');
  assert.match(result.warning, /timed out/);
  module.restoreFetch();
});

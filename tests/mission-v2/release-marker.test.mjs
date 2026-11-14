import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

const pluginSource = await readFile(new URL('../../scripts/mission-qa/offline-build-plugin.ts', import.meta.url), 'utf8');
const pluginCode = ts.transpileModule(pluginSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { createDeploymentMarker, offlineBuildPlugin } = await import(`data:text/javascript;base64,${Buffer.from(pluginCode).toString('base64')}`);
const sha = 'a'.repeat(40);
const git = (head = { code: 0, stdout: `${sha}\n` }, diff = { code: 0, stdout: '' }) => async args => args[0] === 'rev-parse' && args[1] === '--show-toplevel' ? { code: 0, stdout: `${path.resolve('.')}\n` } : args[0] === 'rev-parse' ? head : diff;

test('deployment provenance verifies only clean matching commit evidence', async () => {
  const clean = await createDeploymentMarker({ root: '.', mode: 'production', env: { VERCEL_GIT_COMMIT_SHA: sha }, git: git(), builtAt: '2026-11-14T00:00:00.000Z' });
  assert.deepEqual(clean, { schemaVersion: 1, campaignId: 'ares-cradle', mode: 'production', builtAt: '2026-11-14T00:00:00.000Z', gitCommit: sha, provenanceSource: 'vercel+git', verified: true, trackedChanges: false });
  assert.equal((await createDeploymentMarker({ root: '.', mode: 'production', env: {}, git: git(undefined, { code: 1, stdout: '' }) })).verified, false);
  assert.equal((await createDeploymentMarker({ root: '.', mode: 'production', env: {}, git: git(undefined, { code: 1, stdout: '' }) })).trackedChanges, true);
  const envOnly = await createDeploymentMarker({ root: '.', mode: 'production', env: { VERCEL_GIT_COMMIT_SHA: sha }, git: async () => ({ code: -1, stdout: '' }) });
  assert.equal(envOnly.gitCommit, sha);
  assert.equal(envOnly.verified, false);
  assert.equal(envOnly.provenanceSource, 'vercel-env-only');
  const invalid = await createDeploymentMarker({ root: '.', mode: 'production', env: { VERCEL_GIT_COMMIT_SHA: 'not-a-sha' }, git: git() });
  assert.equal(invalid.verified, false);
  assert.equal(invalid.provenanceSource, 'invalid-vercel-env');
  const mismatch = await createDeploymentMarker({ root: '.', mode: 'production', env: { VERCEL_GIT_COMMIT_SHA: 'b'.repeat(40) }, git: git() });
  assert.equal(mismatch.verified, false);
  assert.equal(mismatch.provenanceSource, 'vercel-git-mismatch');
  const timeout = await createDeploymentMarker({ root: '.', mode: 'production', env: {}, git: async () => { throw new Error('timeout'); } });
  assert.equal(timeout.gitCommit, null);
  assert.equal(timeout.verified, false);
  assert.equal(timeout.trackedChanges, null);
  assert.equal(timeout.provenanceSource, 'unknown');
  const untrackedOnly = await createDeploymentMarker({ root: '.', mode: 'production', env: {}, git: git() });
  assert.equal(untrackedOnly.verified, true, 'git diff ignores untracked build/test artifacts');
  const outsideRepo = await createDeploymentMarker({ root: '.', mode: 'production', env: {}, git: async args => args[1] === '--show-toplevel' ? { code: 0, stdout: `${path.resolve('..')}\n` } : { code: 0, stdout: `${sha}\n` } });
  assert.equal(outsideRepo.gitCommit, null, 'ancestor repository does not prove archive/build-root provenance');
  assert.equal(outsideRepo.verified, false);
});

test('generated marker replaces public placeholder before offline inventory and cache hash', async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'ares-marker-'));
  const output = path.join(parent, 'dist');
  await mkdir(output, { recursive: true });
  try {
    await writeFile(path.join(output, 'index.html'), '<main>fixture</main>');
    await writeFile(path.join(output, 'deployment-check.json'), '{"probe":"stale-public-copy"}');
    const plugin = offlineBuildPlugin();
    plugin.configResolved({ root: parent, build: { outDir: 'dist' }, base: '/', mode: 'test' });
    const emitted = [];
    await plugin.generateBundle.call({ emitFile: asset => emitted.push(asset) });
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].fileName, 'deployment-check.json');
    const markerFromEmission = JSON.parse(emitted[0].source);
    assert.deepEqual(Object.keys(markerFromEmission).sort(), ['builtAt', 'campaignId', 'gitCommit', 'mode', 'provenanceSource', 'schemaVersion', 'trackedChanges', 'verified'].sort());
    await plugin.writeBundle();
    const markerBytes = await readFile(path.join(output, 'deployment-check.json'));
    const marker = JSON.parse(markerBytes);
    assert.equal(marker.probe, undefined);
    const worker = await readFile(path.join(output, 'service-worker.js'), 'utf8');
    const manifest = JSON.parse(worker.match(/const PRECACHE_MANIFEST = (.*);\nconst CACHE_NAME/s)[1]);
    assert.ok(manifest.files.includes('deployment-check.json'));
    const hash = createHash('sha256').update('static-ignore-vary-v1').update('\0');
    let totalBytes = 0;
    for (const file of manifest.files) {
      const bytes = await readFile(path.join(output, file));
      totalBytes += bytes.byteLength;
      hash.update(file).update('\0').update(bytes).update('\0');
    }
    assert.equal(manifest.cacheName, `ares-v2-ares-cradle-${hash.digest('hex').slice(0, 20)}`);
    assert.equal(manifest.bytes, totalBytes);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

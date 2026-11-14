import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const pluginSource = await readFile(new URL('../../scripts/mission-qa/offline-build-plugin.ts', import.meta.url), 'utf8');
const pluginCode = ts.transpileModule(pluginSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { offlineBuildPlugin } = await import(`data:text/javascript;base64,${Buffer.from(pluginCode).toString('base64')}`);

test('generated worker honors exact pinned-cache policy offline', async () => {
  const parent = path.resolve(process.cwd(), 'scratch/2026-11/week-46/2026-11-14_offline-cache-fix');
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, 'fixture-'));
  assert.equal(path.dirname(path.resolve(root)), parent, 'fixture must be inside the authorized scratch directory');
  try {
    const out = path.join(root, 'dist');
    await mkdir(path.join(out, 'assets'), { recursive: true });
    await mkdir(path.join(out, 'fonts'), { recursive: true });
    const files = new Map([
      ['index.html', '<!doctype html><html><body><div id="root"></div></body></html>'],
      ['assets/app.js', 'window.fixture="cached module";'],
      ['assets/app.css', 'body{color:#123}'],
      ['mission-data.json', '{"mission":"fixture"}'],
      ['fonts/fixture.woff2', 'fixture-font-bytes'],
    ]);
    for (const [name, body] of files) await writeFile(path.join(out, name), body);
    const plugin = offlineBuildPlugin();
    plugin.configResolved({ root, build: { outDir: 'dist' }, base: '/' });
    await plugin.writeBundle();
    const source = await readFile(path.join(out, 'service-worker.js'), 'utf8');
    const manifest = JSON.parse(source.match(/const PRECACHE_MANIFEST = (.*);\nconst CACHE_NAME/s)[1]);
    const hash = createHash('sha256').update('static-ignore-vary-v1').update('\0');
    for (const name of manifest.files) hash.update(name).update('\0').update(files.get(name)).update('\0');
    assert.equal(manifest.cacheName, `ares-v2-ares-cradle-${hash.digest('hex').slice(0, 20)}`);
    const legacy = createHash('sha256');
    for (const name of manifest.files) legacy.update(name).update('\0').update(files.get(name)).update('\0');
    assert.notEqual(manifest.cacheName, `ares-v2-ares-cradle-${legacy.digest('hex').slice(0, 20)}`);
    assert.deepEqual(manifest.files, [...files.keys()].sort());

    const listeners = new Map(), cached = new Map(), matchCalls = [], networkCalls = [];
    const cache = {
      async addAll(urls) {
        for (const url of urls) {
          const name = new URL(url).pathname.slice(1), body = files.get(name);
          const type = name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : name.endsWith('.json') ? 'application/json' : name.endsWith('.woff2') ? 'font/woff2' : 'text/html';
          cached.set(url, new Response(body, { headers: { 'content-type': type } }));
        }
      },
      async match(req, options = {}) { const key = typeof req === 'string' ? req : req.url; matchCalls.push({ url: key, options }); return options.ignoreVary ? cached.get(key) : options.ignoreVary === false ? undefined : cached.get(key); },
    };
    const caches = { async open() { return cache; }, async keys() { return [manifest.cacheName]; }, async delete() { return true; } };
    const fetch = async req => { networkCalls.push(req.url); throw new TypeError('Failed to fetch'); };
    const self = { location: { origin: 'http://127.0.0.1:3002' }, registration: { scope: 'http://127.0.0.1:3002/' }, addEventListener(name, fn) { listeners.set(name, fn); } };
    vm.runInNewContext(source, { self, caches, fetch, URL, Response, Promise, Set });
    const install = { promise: null, waitUntil(p) { this.promise = p; } };
    listeners.get('install')(install);
    await install.promise;

    const request = (url, { method = 'GET', mode = 'cors' } = {}) => ({ url, method, mode });
    const dispatch = req => { const e = { request: req, response: null, respondWith(p) { this.response = Promise.resolve(p); } }; listeners.get('fetch')(e); return e; };
    const asset = 'http://127.0.0.1:3002/assets/app.js';
    const hit = dispatch(request(asset));
    assert.ok(hit.response);
    const js = await hit.response;
    assert.equal(js.headers.get('content-type'), 'text/javascript');
    assert.equal(await js.text(), 'window.fixture="cached module";');
    assert.equal(matchCalls[0].options.ignoreVary, true);
    assert.deepEqual(networkCalls, []);
    assert.equal(dispatch(request(`${asset}?unlisted=1`)).response, null);
    for (const req of [
      request('http://127.0.0.1:3002/api/status'), request('http://127.0.0.1:3002/auth/session'),
      request('http://example.test/assets/app.js'), request(asset, { method: 'POST' }),
      request('http://127.0.0.1:3002/mission-data.json', { mode: 'navigate' }),
      request('http://127.0.0.1:3002/fonts/fixture.woff2', { mode: 'navigate' }),
      request(asset, { mode: 'navigate' }), request('http://127.0.0.1:3002/file.html', { mode: 'navigate' }),
    ]) assert.equal(dispatch(req).response, null, req.url);
    assert.equal(matchCalls.length, 1, 'unlisted and bypassed requests never consult cache');
    const nav = dispatch(request('http://127.0.0.1:3002/mission/impact', { mode: 'navigate' }));
    assert.ok(nav.response);
    const html = await nav.response;
    assert.equal(html.headers.get('content-type'), 'text/html');
    assert.match(await html.text(), /<div id="root"><\/div>/);
    assert.equal(matchCalls.at(-1).options.ignoreVary, undefined, 'navigation index matching remains unchanged');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

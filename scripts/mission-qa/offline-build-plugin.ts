import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';

const POLICY_VERSION = 'static-ignore-vary-v1';
const SHA_RE = /^[a-f\d]{40}$/i;
const CAMPAIGN_ID = 'ares-cradle';

type GitResult = { code: number; stdout: string };
type DeploymentMarker = {
  schemaVersion: 1;
  campaignId: string;
  mode: string;
  builtAt: string;
  gitCommit: string | null;
  provenanceSource: string;
  verified: boolean;
  trackedChanges: boolean | null;
};

function runGit(args: string[], cwd: string): Promise<GitResult> {
  return new Promise(resolve => {
    execFileCallback('git', args, { cwd, timeout: 1500, windowsHide: true }, (error, stdout) => {
      const code = error ? (typeof error.code === 'number' ? error.code : -1) : 0;
      resolve({ code, stdout: String(stdout) });
    });
  });
}

export async function createDeploymentMarker(options: {
  root: string;
  mode: string;
  env?: NodeJS.ProcessEnv;
  git?: (args: string[], cwd: string) => Promise<GitResult>;
  builtAt?: string;
}): Promise<DeploymentMarker> {
  const envValue = (options.env ?? process.env).VERCEL_GIT_COMMIT_SHA;
  const envCommit = typeof envValue === 'string' && SHA_RE.test(envValue) ? envValue.toLowerCase() : null;
  let gitCommit: string | null = null;
  let trackedChanges: boolean | null = null;
  let verifiedGitHead = false;
  const git = options.git ?? runGit;
  try {
    const top = await git(['rev-parse', '--show-toplevel'], options.root);
    if (top.code === 0 && path.relative(path.resolve(options.root), path.resolve(top.stdout.trim())) === '') {
      const [head, diff] = await Promise.all([
        git(['rev-parse', '--verify', 'HEAD'], options.root),
        git(['diff', '--quiet', 'HEAD', '--'], options.root),
      ]);
      if (head.code === 0 && SHA_RE.test(head.stdout.trim())) {
        gitCommit = head.stdout.trim().toLowerCase();
        verifiedGitHead = true;
        if (diff.code === 0) trackedChanges = false;
        else if (diff.code === 1) trackedChanges = true;
      }
    }
  } catch { /* Git provenance is optional; unknown must remain explicit. */ }

  const invalidEnv = envValue !== undefined && envCommit === null;
  const mismatch = envCommit !== null && gitCommit !== null && envCommit !== gitCommit;
  if (gitCommit === null && envCommit !== null) gitCommit = envCommit;
  const provenanceSource = invalidEnv ? 'invalid-vercel-env'
    : mismatch ? 'vercel-git-mismatch'
      : envCommit !== null && trackedChanges !== null ? 'vercel+git'
        : envCommit !== null ? 'vercel-env-only'
          : gitCommit !== null ? 'git-head' : 'unknown';
  const verified = verifiedGitHead && gitCommit !== null && trackedChanges === false && !invalidEnv && !mismatch;
  return {
    schemaVersion: 1,
    campaignId: CAMPAIGN_ID,
    mode: options.mode,
    builtAt: options.builtAt ?? new Date().toISOString(),
    gitCommit,
    provenanceSource,
    verified,
    trackedChanges,
  };
}

async function listFiles(directory: string, relative = ''): Promise<string[]> {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const child = path.posix.join(relative.split(path.sep).join('/'), entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(directory, child));
    else if (entry.isFile() && !child.endsWith('.map') && child !== 'service-worker.js') files.push(child);
  }
  return files;
}

export function offlineBuildPlugin(): Plugin {
  let outputDirectory = '';
  let root = '';
  let base = '/';
  let mode = 'unknown';
  let markerContents: string | null = null;
  return {
    name: 'ares-offline-build',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outputDirectory = path.resolve(config.root, config.build.outDir);
      base = config.base;
      mode = config.mode;
    },
    async generateBundle() {
      const marker = await createDeploymentMarker({ root, mode });
      markerContents = `${JSON.stringify(marker, null, 2)}\n`;
      this.emitFile({ type: 'asset', fileName: 'deployment-check.json', source: markerContents });
    },
    async writeBundle() {
      if (markerContents !== null) await writeFile(path.join(outputDirectory, 'deployment-check.json'), markerContents, 'utf8');
      const files = (await listFiles(outputDirectory)).sort();
      if (!files.includes('index.html')) throw new Error('Offline build requires emitted index.html');

      const hash = createHash('sha256').update(POLICY_VERSION).update('\0');
      let totalBytes = 0;
      for (const file of files) {
        const contents = await readFile(path.join(outputDirectory, file));
        totalBytes += contents.byteLength;
        hash.update(file).update('\0').update(contents).update('\0');
      }
      const cacheName = `ares-v2-ares-cradle-${hash.digest('hex').slice(0, 20)}`;
      const manifest = { cacheName, files, count: files.length, bytes: totalBytes };
      const worker = `// Generated from the exact production output inventory; do not edit.
const PRECACHE_MANIFEST = ${JSON.stringify(manifest)};
const CACHE_NAME = PRECACHE_MANIFEST.cacheName;
const PRECACHE_URLS = new Set(PRECACHE_MANIFEST.files.map(file => new URL(file, self.registration.scope).href));
const INDEX_URL = new URL('index.html', self.registration.scope).href;
const OWN_CACHE_PREFIX = 'ares-v2-ares-cradle-';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll([...PRECACHE_URLS])));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(
    names.filter(name => name.startsWith(OWN_CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name))
  )));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scopePath = new URL(self.registration.scope).pathname;
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(scopePath)) return;

  if (request.mode === 'navigate') {
    const relativePath = url.pathname.slice(scopePath.length).replace(/^\\/+/, '');
    if (/(^|\\/)(api|auth|login|signin|oauth|callback|assets|fonts|mission-data)(\\/|$)/i.test(relativePath) || /(?:^|\\/)\\.?[^/]+\\.[^/]+$/.test(relativePath)) return;
    event.respondWith(fetch(request).catch(async () => (await caches.open(CACHE_NAME)).match(INDEX_URL) || Response.error()));
    return;
  }

  if (!PRECACHE_URLS.has(url.href)) return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => (await cache.match(request, { ignoreVary: true })) || fetch(request)));
});
`;
      await writeFile(path.join(outputDirectory, 'service-worker.js'), worker, 'utf8');
      console.info(`[ares-offline] generated ${cacheName}: ${files.length} files, ${totalBytes} bytes; Vite base=${base}`);
    }
  };
}

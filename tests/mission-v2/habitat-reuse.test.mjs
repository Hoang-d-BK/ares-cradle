import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const destinationPath = path.join(repoRoot, 'src/game/art/realism/RealHabitatCraft.tsx');
const destination = readFileSync(destinationPath);
const destinationText = destination.toString('utf8');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedSha256 = '674b18b8b56e6a3da843be62d6fca1e6d07ec07eb678b9a8178fc9a2c1e41646';

test('release habitat matches the approved source SHA-256', () => {
  assert.equal(sha256(destination), expectedSha256);
});

test('release habitat matches an explicitly supplied external source when requested', t => {
  const sourcePath = process.env.HABITAT_SOURCE;
  if (!sourcePath) return t.skip('HABITAT_SOURCE not provided; destination SHA-256 is always checked');
  const source = readFileSync(sourcePath);
  assert.equal(sha256(source), expectedSha256);
  assert.deepEqual(destination, source);
});

test('copied habitat retains props, source geometry markers and +Z entry contract', () => {
  for (const marker of [
    "export interface RealHabitatCraftProps",
    'const SHELL_RADIUS = 3.45;',
    'const BASE_Y = 0.28;',
    'name="RealHabitatCraft"',
    'name="entry-vestibule"',
    'name="closed-hatch"',
    'position={[0, 1.25, 3.79]}',
    'name="landing-and-threshold" position={[0, 0.21, 3.87]}',
    'name="access-ramp"',
  ]) assert.ok(destinationText.includes(marker), `missing source geometry/API marker: ${marker}`);
  assert.match(destinationText, /export function RealHabitatCraft\(\{ position = \[0, 0, 0\], heading = 0, lit = false \}/);
  assert.match(destinationText, /rotation=\{\[0, yaw, 0\]\}/);
});

test('all referenced shared release materials are exported without edits', () => {
  assert.match(destinationText, /import \{ realMaterials as m \} from '\.\/materials';/);
  const materialSource = readFileSync(path.join(repoRoot, 'src/game/art/realism/materials.ts'), 'utf8');
  const referenced = [...destinationText.matchAll(/\bm\.([A-Za-z][A-Za-z0-9_]*)/g)].map(match => match[1]);
  const exported = new Set([...materialSource.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9_]*): new MeshStandardMaterial/gm)].map(match => match[1]));
  assert.deepEqual([...new Set(referenced)].sort().filter(key => !exported.has(key)), []);
  assert.match(materialSource, /export const realMaterials =/);
});

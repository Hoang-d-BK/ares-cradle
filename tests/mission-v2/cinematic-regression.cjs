'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('C:/Hackathon/node_modules/typescript');

const sourcePath = path.resolve(__dirname, '../../src/game/mission/presentation/cinematics/timeline.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const compiledModule = { exports: {} };
vm.runInNewContext(compiled, { module: compiledModule, exports: compiledModule.exports, Math, Number }, { filename: sourcePath });
const { getMissionCinematicFrame: frame, MISSION_CINEMATIC_DURATION: durations } = compiledModule.exports;

assert.deepEqual({ ...durations }, { intro: 40, arrival: 28, departure: 24 });
assert.ok(durations.intro >= 35 && durations.intro <= 45);

for (const kind of ['intro', 'arrival', 'departure']) {
  const first = frame(kind, 8.25);
  const same = frame(kind, 8.25);
  assert.deepEqual({ ...first }, { ...same });
  assert.equal(frame(kind, -10).elapsedSeconds, 0);
  assert.equal(frame(kind, Infinity).elapsedSeconds, 0);
  assert.equal(frame(kind, 1e6).elapsedSeconds, durations[kind]);
  for (const elapsed of [0, durations[kind] / 2, durations[kind]]) {
    const sample = frame(kind, elapsed);
    for (const value of [sample.progress, sample.altitudeGameUnits, sample.verticalSpeedGameUnitsPerSecond,
      sample.horizontalOffset, sample.thrust, sample.legsDeployed, sample.rampOpen]) assert.ok(Number.isFinite(value));
    assert.equal(sample.telemetryLabel, 'SCENARIO · GAME UNITS');
  }
}

const phases = [0.1, 0.4, 0.65, 0.9].map((p) => frame('intro', p * durations.intro).phase);
assert.deepEqual(phases, ['approach', 'powered-descent', 'touchdown', 'ramp']);
assert.equal(frame('intro', 0.65 * durations.intro).rampOpen, 0);
assert.equal(frame('intro', 0.65 * durations.intro, true).rampOpen, 0);
assert.equal(frame('intro', 0.74 * durations.intro, true).rampOpen, 0);
assert.equal(frame('intro', 0.9 * durations.intro, true).rampOpen, 1);

const departurePhases = [0.08, 0.25, 0.6, 0.9].map((p) => frame('departure', p * durations.departure).phase);
assert.deepEqual(departurePhases, ['time-shift', 'ramp-close', 'ascent', 'away']);
assert.equal(frame('departure', 0.08 * durations.departure).rampOpen, 1);
assert.equal(frame('departure', 0.9 * durations.departure).rampOpen, 0);
assert.ok(frame('departure', 0.9 * durations.departure).horizontalOffset > frame('departure', 0.6 * durations.departure).horizontalOffset);

console.log('PASS cinematic regression: durations, bounded deterministic telemetry, descent/ramp order (normal + reduced motion), and departure sequence');

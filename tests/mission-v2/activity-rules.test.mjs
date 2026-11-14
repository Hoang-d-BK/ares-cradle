import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const sourceUrl = new URL('../../src/game/mission/activities/rules.ts', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const rules = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

function dustSolutions(boardIndex) {
  const board = rules.DUST_BOARDS[boardIndex];
  const rotations = Array(9).fill(null);
  for (const tile of board.tiles) rotations[tile.cell] = 0;
  const solutions = [];
  function search(tileIndex) {
    if (tileIndex === board.tiles.length) {
      if (rules.runDustModel(boardIndex, rotations).complete) solutions.push([...rotations]);
      return;
    }
    const cell = board.tiles[tileIndex].cell;
    for (let rotation = 0; rotation < 4; rotation += 1) {
      rotations[cell] = rotation;
      search(tileIndex + 1);
    }
  }
  search(0);
  return solutions;
}

test('all progress validators reject malformed, cross-region, extra-field, and duplicate data', () => {
  for (const region of ['impact', 'dust', 'volcano', 'ice', 'lake']) {
    const initial = rules.initialActivityProgress(region);
    assert.equal(rules.isActivityProgressValid(region, initial), true, `${region} accepts its initial snapshot`);
    assert.equal(rules.isActivityProgressValid(region, null), false, `${region} rejects null`);
    assert.equal(rules.isActivityProgressValid(region, { ...initial, unexpected: true }), false, `${region} rejects undeclared fields`);
    const wrongKind = { ...initial, kind: 'complete' };
    assert.equal(rules.isActivityProgressValid(region, wrongKind), false, `${region} rejects a forged kind`);
    assert.equal(rules.isActivityProgressValid(region, rules.initialActivityProgress('dust')), region === 'dust', `${region} rejects progress from another activity`);
  }

  assert.equal(rules.isActivityProgressValid('impact', { kind: 'impact', version: 1, matches: [{ signal: 'signal-rim', context: 'frame-rim' }, { signal: 'signal-rim', context: 'frame-rim' }] }), false);
  assert.equal(rules.isActivityProgressValid('impact', { kind: 'impact', version: 1, matches: [{ signal: 'signal-rim', context: 'frame-basin' }] }), false);
  assert.equal(rules.isActivityProgressValid('dust', { kind: 'dust', version: 1, rotations: [[0, null, null], [], []] }), false);
  assert.equal(rules.isActivityProgressValid('volcano', { kind: 'volcano', version: 1, order: ['foundation', 'foundation', 'shelf', 'cap'] }), false);
  assert.equal(rules.isActivityProgressValid('ice', { kind: 'ice', version: 1, site: 'unknown', percent: 50, checked: true, labeled: true, sealed: true }), false);
  assert.equal(rules.isActivityProgressValid('ice', { kind: 'ice', version: 1, site: 'flat-bench', percent: 75, checked: true, labeled: true, sealed: true }), false);
  const lake = rules.initialActivityProgress('lake');
  lake.captures['layer-outcrop'].wide = { x: 0, z: 0, heading: 0 };
  assert.equal(rules.isActivityProgressValid('lake', lake), false, 'Lake evidence must be spatially plausible');
});

test('impact accepts correct signal/image/context pairs, preserves them, and allows retry', () => {
  let state = rules.initialActivityProgress('impact');
  let result = rules.recordImpactMatch(state, 'signal-rim', 'frame-basin');
  assert.equal(result.accepted, false);
  assert.match(result.message, /timestamps differ/i);
  assert.deepEqual(result.progress.matches, []);

  result = rules.recordImpactMatch(state, 'signal-rim', 'frame-rim');
  assert.equal(result.accepted, true);
  state = result.progress;
  assert.equal(rules.isActivityComplete('impact', state), false);
  result = rules.recordImpactMatch(state, 'signal-rim', 'frame-rim');
  assert.equal(result.accepted, false, 'duplicate pair cannot be counted twice');
  assert.equal(result.progress.matches.length, 1);

  for (const [signal, frame] of [['signal-basin', 'frame-basin'], ['signal-slope', 'frame-slope']]) {
    result = rules.recordImpactMatch(state, signal, frame);
    assert.equal(result.accepted, true);
    state = result.progress;
  }
  assert.equal(rules.isActivityComplete('impact', state), true);
  assert.equal(rules.isActivityComplete('impact', { kind: 'impact', version: 1, matches: [] , complete: true }), false);
});

test('each dust board has multiple valid rotations; model accepts every valid route', () => {
  for (let boardIndex = 0; boardIndex < rules.DUST_BOARDS.length; boardIndex += 1) {
    const solutions = dustSolutions(boardIndex);
    assert.ok(solutions.length >= 2, `board ${boardIndex + 1} should allow several valid routes/rotations`);
    for (const rotation of solutions) assert.equal(rules.runDustModel(boardIndex, rotation).complete, true);
  }

  const start = rules.initialActivityProgress('dust');
  const first = rules.runDustModel(0, start.rotations[0]);
  assert.equal(first.complete, false);
  assert.equal(first.reason, 'misaligned');
  let progress = start;
  for (let boardIndex = 0; boardIndex < rules.DUST_BOARDS.length; boardIndex += 1) {
    const solution = dustSolutions(boardIndex)[0];
    for (const tile of rules.DUST_BOARDS[boardIndex].tiles) {
      const wanted = solution[tile.cell];
      const current = progress.rotations[boardIndex][tile.cell];
      const steps = (wanted - current + 4) % 4;
      for (let count = 0; count < steps; count += 1) progress = rules.rotateDustTile(progress, boardIndex, tile.cell);
    }
    assert.equal(rules.runDustModel(boardIndex, progress.rotations[boardIndex]).complete, true);
  }
  assert.equal(rules.isActivityComplete('dust', progress), true);
  assert.deepEqual(rules.rotateDustTile(progress, 0, rules.DUST_BOARDS[0].tiles[0].cell), progress, 'solved boards remain intact on retry');

  const sensorBoard = rules.DUST_BOARDS[1];
  const blocked = Array(9).fill(null);
  for (const tile of sensorBoard.tiles) blocked[tile.cell] = 0;
  blocked[3] = 1;
  blocked[4] = 3;
  const stopped = rules.runDustModel(1, blocked);
  assert.equal(stopped.complete, false);
  assert.equal(stopped.reason, 'sensor');
  assert.ok(stopped.path.includes(1));
});

test('volcano layer relations accept any valid ordering and reject wrong answers', () => {
  const validA = { kind: 'volcano', version: 1, order: ['foundation', 'channel', 'shelf', 'cap'] };
  const validB = { kind: 'volcano', version: 1, order: ['foundation', 'shelf', 'channel', 'cap'] };
  const invalid = { kind: 'volcano', version: 1, order: ['cap', 'channel', 'foundation', 'shelf'] };
  assert.equal(rules.isActivityComplete('volcano', validA), true);
  assert.equal(rules.isActivityComplete('volcano', validB), true, 'unconstrained middle layers may swap');
  assert.equal(rules.isActivityComplete('volcano', invalid), false);
  const repaired = rules.moveVolcanoLayer(invalid, 'foundation', -1);
  assert.deepEqual(new Set(repaired.order), new Set(['foundation', 'channel', 'shelf', 'cap']));
  assert.equal(rules.isActivityComplete('volcano', repaired), false, 'one useful move need not solve all relations');
});

test('ice needs a chosen site, in-range check, label, and seal; retries preserve valid site', () => {
  let state = rules.initialActivityProgress('ice');
  assert.equal(rules.checkIceDrill(state).accepted, false, 'cannot advance without a site');
  state = rules.chooseIceSite(state, 'stable-scarp');
  state = { ...state, percent: 25 };
  let result = rules.checkIceDrill(state);
  assert.equal(result.accepted, false);
  assert.match(result.message, /30–70%/);
  assert.equal(result.progress.site, 'stable-scarp');

  state = { ...result.progress, percent: 50 };
  result = rules.checkIceDrill(state);
  assert.equal(result.accepted, true);
  state = result.progress;
  assert.equal(rules.isActivityComplete('ice', state), false);
  const labeled = rules.labelIceCore(state);
  assert.equal(labeled.accepted, true);
  assert.equal(rules.isActivityComplete('ice', labeled.progress), false);
  const sealed = rules.sealIceCore(labeled.progress);
  assert.equal(sealed.accepted, true);
  assert.equal(rules.isActivityComplete('ice', sealed.progress), true);
  assert.equal(rules.sealIceCore(state).accepted, false, 'cannot skip required labeling');
  assert.equal(rules.chooseIceSite(sealed.progress, 'flat-bench').site, 'stable-scarp', 'sealed sample cannot be overwritten on retry');
});

test('lake needs live pose, proximity, actual heading/framing, and all three evidence kinds per target', () => {
  let state = rules.initialActivityProgress('lake');
  const first = rules.LAKE_SURVEY_TARGETS[0];
  let result = rules.recordLakeEvidence(state, first.id, 'wide', undefined);
  assert.equal(result.accepted, false);
  assert.match(result.message, /live rover/i);
  assert.equal(rules.isActivityComplete('lake', state), false);

  const far = { roverPose: { x: first.x, z: first.z - 40, heading: 0 }, camera: { heading: 0, framing: 'wide' } };
  result = rules.recordLakeEvidence(state, first.id, 'wide', far);
  assert.equal(result.accepted, false);
  assert.match(result.message, /within 34/);
  const facingAway = { roverPose: { x: first.x, z: first.z - 6, heading: 0 }, camera: { heading: Math.PI, framing: 'wide' } };
  result = rules.recordLakeEvidence(state, first.id, 'wide', facingAway);
  assert.equal(result.accepted, false);
  assert.match(result.message, /Turn the rover camera/);
  const wrongFraming = { roverPose: { x: first.x, z: first.z - 6, heading: 0 }, camera: { heading: 0, framing: 'close' } };
  result = rules.recordLakeEvidence(state, first.id, 'wide', wrongFraming);
  assert.equal(result.accepted, false);
  assert.match(result.message, /Wide framing/);

  for (const target of rules.LAKE_SURVEY_TARGETS) {
    const wideContext = { roverPose: { x: target.x, z: target.z - 6, heading: 0 }, camera: { heading: 0, framing: 'wide' } };
    const wide = rules.recordLakeEvidence(state, target.id, 'wide', wideContext);
    assert.equal(wide.accepted, true);
    state = wide.progress;
    const closeContext = { ...wideContext, camera: { heading: 0, framing: 'close' } };
    const close = rules.recordLakeEvidence(state, target.id, 'close', closeContext);
    assert.equal(close.accepted, true);
    state = close.progress;
    assert.equal(rules.isActivityComplete('lake', state), false, 'wide and close frames cannot substitute for position');
    const location = rules.recordLakeEvidence(state, target.id, 'location', wideContext);
    assert.equal(location.accepted, true);
    state = location.progress;
  }
  assert.equal(rules.isActivityComplete('lake', state), true);
  const invalidFrame = { ...state, captures: { ...state.captures, 'layer-outcrop': { ...state.captures['layer-outcrop'], close: { x: first.x, z: first.z - 6, heading: 0, framing: 'wide' } } } };
  assert.equal(rules.isActivityComplete('lake', invalidFrame), false, 'far close-frame evidence cannot complete');
});

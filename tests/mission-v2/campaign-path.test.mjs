import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const compileModule = async (relativePath) => {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
};

const contentUrl = await compileModule('../../src/game/mission/content.ts');
const rulesUrl = await compileModule('../../src/game/mission/activities/rules.ts');
const contractUrl = await compileModule('../../src/game/mission/contract.ts');
const stateSource = await readFile(new URL('../../src/game/mission/state.ts', import.meta.url), 'utf8');
const stateCompiled = ts.transpileModule(stateSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
})
  .outputText
  .replaceAll("from './content'", `from '${contentUrl}'`)
  .replaceAll("from './activities/rules'", `from '${rulesUrl}'`)
  .replaceAll("from './contract'", `from '${contractUrl}'`);
const missionUrl = `data:text/javascript;base64,${Buffer.from(stateCompiled).toString('base64')}`;
const mission = await import(missionUrl);
const content = await import(contentUrl);
const rules = await import(rulesUrl);

const initialStock = { energy: 12, meals: 4, water: 5, air: 4 };
const essentialStock = { energy: 10, meals: 3, water: 4, air: 3 };
const paidOperationStock = { energy: 10, meals: 3, water: 4, air: 3 };
const clone = (value) => JSON.parse(JSON.stringify(value));

function makeDriver(startRegion, order) {
  let state = mission.initialMission(startRegion);
  const trace = [];
  const dispatch = (event, label = event.type) => {
    const before = state;
    const next = mission.missionReducer(before, event);
    assert.notEqual(next.saveRevision, before.saveRevision, `${label} must be a legal state transition; event=${JSON.stringify(event)} message=${before.message}`);
    const serialized = JSON.stringify(next);
    const restored = mission.validateMission(JSON.parse(serialized));
    assert.ok(restored, `${label}: JSON round-trip state rejected; event=${JSON.stringify(event)} message=${next.message}`);
    assert.deepEqual(restored, next, `${label}: JSON round-trip changed state`);
    state = restored;
    trace.push({ label, event, revision: state.saveRevision, message: state.message });
    return state;
  };
  const assertNoOp = (event, label) => {
    const before = state;
    const next = mission.missionReducer(before, event);
    assert.deepEqual(next, before, `${label} should be idempotent/no-op; event=${JSON.stringify(event)} message=${before.message}`);
    state = next;
  };
  const moveLeoTo = (region) => {
    const [x, z] = content.regionById(region).center;
    dispatch({ type: 'MOVE', actor: 'leo', pose: { x, z, heading: 0 } }, `MOVE Leo ${region} center`);
  };
  const ensureRegion = (region) => {
    if (state.activeRover !== null) dispatch({ type: 'EXIT_ROVER' });
    if (state.bases[region].unlocked) {
      dispatch({ type: 'TRAVEL', region }, `TRAVEL ${region}`);
    } else {
      moveLeoTo(region);
      dispatch({ type: 'UNLOCK', region }, `UNLOCK ${region}`);
    }
  };
  const surveyAndPay = (region) => {
    ensureRegion(region);
    for (const observation of content.regionById(region).observations.slice(0, 2)) {
      dispatch({ type: 'OBSERVE', region, id: observation.id }, `OBSERVE ${region}/${observation.id}`);
    }
    const beforePay = clone(state.bases[state.surveys[region].supportBaseId].stock);
    if (JSON.stringify(beforePay) === JSON.stringify(initialStock)) {
      dispatch({ type: 'PAY_SURVEY', region });
      assert.deepEqual(state.bases[state.surveys[region].supportBaseId].stock, essentialStock, `${region} essential payment from its own initial base`);
    } else {
      dispatch({ type: 'PAY_SURVEY', region });
    }
    const support = state.surveys[region].supportBaseId;
    if (JSON.stringify(beforePay) === JSON.stringify(initialStock)) {
      assert.deepEqual(state.bases[support].stock, essentialStock, `${region} starts with 12/4/5/4 and essential cost leaves 10/3/4/3`);
    }
  };

  return {
    get state() { return state; },
    trace,
    dispatch,
    assertNoOp,
    ensureRegion,
    surveyAndPay,
  };
}

function findDustSolution(boardIndex) {
  const board = rules.DUST_BOARDS[boardIndex];
  const rotations = Array(9).fill(null);
  const visit = (tileIndex) => {
    if (tileIndex === board.tiles.length) return rules.runDustModel(boardIndex, rotations).complete ? [...rotations] : null;
    const cell = board.tiles[tileIndex].cell;
    for (let rotation = 0; rotation < 4; rotation += 1) {
      rotations[cell] = rotation;
      const result = visit(tileIndex + 1);
      if (result) return result;
    }
    return null;
  };
  const result = visit(0);
  assert.ok(result, `no valid dust route found for board ${board.id}`);
  return result;
}

function solveActivity(region) {
  let progress = rules.initialActivityProgress(region);
  switch (region) {
    case 'impact':
      for (const [signal, frame] of [['signal-rim', 'frame-rim'], ['signal-basin', 'frame-basin'], ['signal-slope', 'frame-slope']]) {
        const result = rules.recordImpactMatch(progress, signal, frame);
        assert.equal(result.accepted, true, `impact helper rejected ${signal}/${frame}`);
        progress = result.progress;
      }
      break;
    case 'dust':
      for (let boardIndex = 0; boardIndex < rules.DUST_BOARDS.length; boardIndex += 1) {
        const target = findDustSolution(boardIndex);
        for (const tile of rules.DUST_BOARDS[boardIndex].tiles) {
          const turns = (target[tile.cell] - progress.rotations[boardIndex][tile.cell] + 4) % 4;
          for (let n = 0; n < turns; n += 1) {
            progress = rules.rotateDustTile(progress, boardIndex, tile.cell);
            if (rules.runDustModel(boardIndex, progress.rotations[boardIndex]).complete) break;
          }
        }
        assert.equal(rules.runDustModel(boardIndex, progress.rotations[boardIndex]).complete, true, `dust board ${boardIndex} is a valid route; target=${JSON.stringify(target)} actual=${JSON.stringify(progress.rotations[boardIndex])} run=${JSON.stringify(rules.runDustModel(boardIndex, progress.rotations[boardIndex]))}`);
      }
      break;
    case 'volcano': {
      const target = ['foundation', 'shelf', 'channel', 'cap'];
      for (let position = 0; position < target.length; position += 1) {
        while (progress.order[position] !== target[position]) {
          const from = progress.order.indexOf(target[position]);
          progress = rules.moveVolcanoLayer(progress, target[position], from > position ? -1 : 1);
        }
      }
      assert.ok(rules.volcanoRelations(progress.order).every((relation) => relation.satisfied), 'volcano layer ordering respects every observed relation');
      break;
    }
    case 'ice':
      progress = rules.chooseIceSite(progress, 'stable-scarp');
      for (let n = 0; n < 10; n += 1) progress = rules.stepIceDrill(progress, 1);
      assert.equal(progress.percent, 50);
      {
        const checked = rules.checkIceDrill(progress);
        assert.equal(checked.accepted, true);
        progress = rules.labelIceCore(checked.progress).progress;
        progress = rules.sealIceCore(progress).progress;
      }
      break;
    case 'lake':
      // Lake evidence is recorded later from reducer-reached rover poses.
      break;
  }
  return progress;
}

function captureLakeFromRover(driver) {
  const { dispatch } = driver;
  const leoBeforeEntry = clone(driver.state.leo);
  let state = driver.state;
  dispatch({ type: 'ENTER_ROVER', region: 'lake' });
  let progress = rules.initialActivityProgress('lake');
  for (const target of rules.LAKE_SURVEY_TARGETS) {
    const pose = { x: target.x, z: target.z - 6, heading: 0 };
    dispatch({ type: 'MOVE', actor: 'lake', pose }, `MOVE lake rover to ${target.id} approach`);
    for (const kind of ['wide', 'close', 'location']) {
      state = driver.state;
      const actualPose = state.rovers.lake;
      const context = { roverPose: { ...actualPose }, camera: { heading: 0, framing: kind === 'close' ? 'close' : 'wide' } };
      const result = rules.recordLakeEvidence(progress, target.id, kind, context);
      assert.equal(result.accepted, true, `lake helper rejected ${target.id}/${kind} from reducer rover pose: ${result.message}`);
      progress = result.progress;
      dispatch({ type: 'ACTIVITY_PROGRESS', region: 'lake', progress }, `ACTIVITY_PROGRESS lake/${target.id}/${kind}`);
    }
  }
  dispatch({ type: 'EXIT_ROVER' });
  assert.deepEqual(driver.state.leo, leoBeforeEntry, 'EXIT_ROVER restores the exact saved Leo pose');
  assert.equal(driver.state.activeRover, null);
  return progress;
}

function runCampaign(startRegion, order) {
  const driver = makeDriver(startRegion, order);
  const { dispatch, assertNoOp } = driver;
  dispatch({ type: 'START', region: startRegion });
  assert.deepEqual(driver.state.bases[startRegion].stock, initialStock, `${startRegion} start base initial stock`);

  for (const region of order) {
    driver.surveyAndPay(region);
    let progress;
    if (region === 'lake') {
      progress = captureLakeFromRover(driver);
      assert.equal(rules.isActivityComplete('lake', progress), true);
      assert.equal(driver.state.activeRover, null, 'Lake rover was exited after collecting evidence');
    } else {
      progress = solveActivity(region);
    }
    dispatch({ type: 'ACTIVITY_PROGRESS', region, progress }, `ACTIVITY_PROGRESS ${region} solved-by-helper`);
    dispatch({ type: 'ACTIVITY_COMPLETE', region }, `ACTIVITY_COMPLETE ${region}`);
    assert.equal(driver.state.surveys[region].activityDone, true, `${region} activity completed only through shared activity predicate`);
    const support = driver.state.surveys[region].supportBaseId;
    const beforeOperation = clone(driver.state.bases[support].stock);
    const operationId = content.regionById(region).operations[0].id;
    dispatch({ type: 'CHOOSE_OPERATION', region, operationId }, `CHOOSE_OPERATION ${region}/${operationId}`);
    assert.equal(driver.state.surveys[region].operation, operationId);
    assert.deepEqual(driver.state.bases[support].stock, {
      energy: beforeOperation.energy - 2 + (operationId === 'dust-clean-panels' ? 2 : 0),
      meals: beforeOperation.meals,
      water: beforeOperation.water + (operationId === 'dust-water-treatment' || operationId === 'ice-water-treatment' ? 2 : 0),
      air: beforeOperation.air,
    }, `${region} operation stock charge/output receipt`);
    assertNoOp({ type: 'ACTIVITY_COMPLETE', region }, `repeat ${region} activity completion`);
    assertNoOp({ type: 'CHOOSE_OPERATION', region, operationId }, `repeat ${region} operation`);
    dispatch({ type: 'COMPLETE_REPORT', region }, `COMPLETE_REPORT ${region}`);
    assert.equal(driver.state.bases[region].report, true);
    const afterReport = driver.state;
    assertNoOp({ type: 'COMPLETE_REPORT', region }, `repeat ${region} report`);
    assert.deepEqual(driver.state, afterReport, `${region} repeated report must not change any stock, transaction, or report`);
  }

  assert.equal(mission.reportCount(driver.state), 5, `${startRegion} path must finish all five reports`);
  assert.deepEqual(driver.state.bases.dust.stock, paidOperationStock, 'dust clean-panels output offsets its two-EU operation charge after essential cost');
  for (const region of order) {
    const stock = driver.state.bases[region].stock;
    assert.ok(Object.values(stock).every((amount) => amount >= 0), `${region} stock must never go negative`);
  }

  // Verify only unlocked travel works and it preserves the visited evidence and stocks.
  const evidenceBeforeTravel = clone(driver.state.surveys.lake.activityProgress);
  const stocksBeforeTravel = clone(driver.state.bases);
  dispatch({ type: 'TRAVEL', region: startRegion });
  dispatch({ type: 'TRAVEL', region: 'lake' });
  assert.deepEqual(driver.state.surveys.lake.activityProgress, evidenceBeforeTravel, 'fast travel preserves activity evidence');
  assert.deepEqual(driver.state.bases, stocksBeforeTravel, 'fast travel preserves every base stock');

  // A legitimate HOLD is recorded before readiness checks are completed.
  dispatch({ type: 'RESEARCH', goal: 'geologic-history' });
  dispatch({ type: 'ARRIVAL_BASE', region: 'dust' });
  dispatch({ type: 'TRAVEL', region: 'dust' });
  assert.equal(mission.readiness(driver.state, 'dust').go, false, 'first readiness review must be HOLD for missing base checks');
  dispatch({ type: 'SEND_PROPOSAL' });
  const holdRevision = driver.state.saveRevision;
  dispatch({ type: 'RECEIVE_RESPONSE', revision: holdRevision });
  assert.equal(driver.state.arrival, 'sent', 'exact-revision HOLD response leaves proposal pending');
  assert.match(driver.state.message, /HOLD/i);
  for (const check of ['airheat', 'shelter', 'comms']) dispatch({ type: 'BASE_CHECK', region: 'dust', check }, `BASE_CHECK dust/${check}`);
  const stale = driver.state.saveRevision - 1;
  assertNoOp({ type: 'RECEIVE_RESPONSE', revision: stale }, 'stale proposal response');
  dispatch({ type: 'SEND_PROPOSAL' });
  dispatch({ type: 'RECEIVE_RESPONSE', revision: driver.state.saveRevision });
  assert.equal(driver.state.arrival, 'approved', 'fresh exact-saveRevision response approves GO');
  dispatch({ type: 'ARRIVE' });
  assert.equal(driver.state.arrival, 'arrived');
  const explorationBeforeDepart = clone(driver.state.surveys);
  dispatch({ type: 'DEPART' });
  assert.equal(driver.state.arrival, 'departed');
  assert.deepEqual(driver.state.surveys, explorationBeforeDepart, 'departure preserves open exploration');
  return { state: driver.state, trace: driver.trace };
}

test('full five-region legal reducer campaign works in two start bases and region orders', () => {
  const cases = [
    { start: 'impact', order: ['impact', 'dust', 'volcano', 'ice', 'lake'] },
    { start: 'lake', order: ['lake', 'ice', 'volcano', 'dust', 'impact'] },
  ];
  const results = cases.map(({ start, order }) => runCampaign(start, order));
  for (let index = 0; index < results.length; index += 1) {
    const { state, trace } = results[index];
    assert.equal(state.arrival, 'departed');
    assert.equal(mission.validateMission(JSON.parse(JSON.stringify(state))) !== null, true);
    assert.ok(trace.some(({ label }) => label.startsWith('COMPLETE_REPORT lake')), `case ${index + 1} reached the final report through reducer events`);
  }
});

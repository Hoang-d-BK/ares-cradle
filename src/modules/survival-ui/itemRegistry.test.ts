import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEM_CATALOG,
  MVP_EQUIPMENT_IDS,
  evaluateItemTransaction,
  evaluateCargoTransfer,
  doesSpecimenMatchObjective,
  ItemExecutionContext
} from './itemRegistry';

function createBaseContext(overrides: Partial<ItemExecutionContext> = {}): ItemExecutionContext {
  return {
    inventory: {
      flashlight: 1,
      sonic_wiper: 3,
      space_tape: 2,
      backup_battery: 1,
      space_apple: 2,
      water_canister: 1,
      mineral_shard: 2,
      thermal_blanket: 1,
      soil_analyzer: 1,
      sample_container: 1,
      gasket_set: 1,
      rover_repair_kit: 1,
      relay_beacon: 1
    },
    roverInventory: {},
    batteryKwh: 30,
    batteryCapacityKwh: 60,
    oxygen: 19.2,
    temperature: 14.0,
    dustCoverage: 0.45,
    thrusterEnergy: 60,
    isInsideHabitat: true,
    isDrivingRover: false,
    playerPos: [0, -0.4, 1.5],
    roverPos: [3.8, -0.32, -2.2],
    hasActiveLeakEvent: false,
    unlockedSols: [1, 5],
    ...overrides
  };
}

test('24-item catalog exists and all 12 MVP equipment items are active', () => {
  assert.equal(Object.keys(ITEM_CATALOG).length, 24);
  assert.equal(MVP_EQUIPMENT_IDS.length, 12);
  for (const id of MVP_EQUIPMENT_IDS) {
    assert.ok(ITEM_CATALOG[id], `Missing catalog item: ${id}`);
    assert.equal(ITEM_CATALOG[id].mvpActive, true);
  }
});

test('reusable tools (flashlight, soil_analyzer) never consume item count', () => {
  const ctx = createBaseContext();

  const flashTx = evaluateItemTransaction('flashlight', ctx);
  assert.equal(flashTx.result.ok, true);
  if (flashTx.result.ok) {
    assert.equal(flashTx.result.consumed, 0);
  }
  assert.equal(flashTx.nextInventory.flashlight, 1);
  assert.equal(flashTx.toggleFlashlight, true);

  const scanTx = evaluateItemTransaction('soil_analyzer', ctx);
  assert.equal(scanTx.result.ok, true);
  if (scanTx.result.ok) {
    assert.equal(scanTx.result.consumed, 0);
  }
  assert.equal(scanTx.nextInventory.soil_analyzer, 1);
});

test('backup_battery uses batteryKwh as source of truth, clamps to capacity, and rejects when full', () => {
  // 1. Partial charge: 50 / 60 kWh -> adds +10 kWh (clamped to 60), derives 100%
  const nearFullCtx = createBaseContext({
    batteryKwh: 50,
    batteryCapacityKwh: 60
  });
  const tx1 = evaluateItemTransaction('backup_battery', nearFullCtx);
  assert.equal(tx1.result.ok, true);
  assert.equal(tx1.nextBatteryKwh, 60);
  assert.equal(tx1.nextBatteryPercent, 100);
  assert.equal(tx1.nextInventory.backup_battery, 0);

  // 2. Already full: 60 / 60 kWh -> rejects with NO_EFFECT and does NOT consume item
  const fullCtx = createBaseContext({
    batteryKwh: 60,
    batteryCapacityKwh: 60
  });
  const tx2 = evaluateItemTransaction('backup_battery', fullCtx);
  assert.equal(tx2.result.ok, false);
  if (!tx2.result.ok) {
    assert.equal(tx2.result.code, 'NO_EFFECT');
  }
  assert.equal(tx2.nextInventory.backup_battery, 1);
});

test('space_apple restores EVA stamina inside pressurized cabin without altering habitat O2 or temperature', () => {
  const ctx = createBaseContext({
    oxygen: 18.5,
    temperature: 11.2,
    thrusterEnergy: 40,
    isInsideHabitat: true
  });
  const tx = evaluateItemTransaction('space_apple', ctx);
  assert.equal(tx.result.ok, true);
  assert.equal(tx.nextThrusterEnergy, 100);
  assert.equal(tx.nextOxygen, 18.5);
  assert.equal(tx.nextTemperature, 11.2);
  assert.equal(tx.nextInventory.space_apple, 1);

  // Rejects when out in unpressurized Martian atmosphere far from base/rover
  const outsideCtx = createBaseContext({
    isInsideHabitat: false,
    isDrivingRover: false,
    playerPos: [25, -0.4, 25]
  });
  const txOut = evaluateItemTransaction('space_apple', outsideCtx);
  assert.equal(txOut.result.ok, false);
  if (!txOut.result.ok) {
    assert.equal(txOut.result.code, 'INVALID_TARGET');
  }
  assert.equal(txOut.nextInventory.space_apple, 2);
});

test('space_tape and sonic_wiper validate target conditions and never consume stock on failure', () => {
  // No leak & nominal O2 -> space_tape rejected with NO_EFFECT
  const nominalCtx = createBaseContext({
    oxygen: 20.9,
    hasActiveLeakEvent: false
  });
  const tapeFail = evaluateItemTransaction('space_tape', nominalCtx);
  assert.equal(tapeFail.result.ok, false);
  assert.equal(tapeFail.nextInventory.space_tape, 2);

  // Active leak -> space_tape succeeds, resolves leak, decrements stock by 1
  const leakCtx = createBaseContext({
    oxygen: 18.0,
    hasActiveLeakEvent: true
  });
  const tapeOk = evaluateItemTransaction('space_tape', leakCtx);
  assert.equal(tapeOk.result.ok, true);
  assert.equal(tapeOk.resolveLeakEvents, true);
  assert.equal(tapeOk.nextInventory.space_tape, 1);

  // Clean panels -> sonic_wiper rejected with NO_EFFECT
  const cleanPanelsCtx = createBaseContext({
    dustCoverage: 0.0
  });
  const wiperFail = evaluateItemTransaction('sonic_wiper', cleanPanelsCtx);
  assert.equal(wiperFail.result.ok, false);
  assert.equal(wiperFail.nextInventory.sonic_wiper, 3);
});

test('cargo transfer preserves item sum and enforces rover proximity', () => {
  const personal = { backup_battery: 2 };
  const rover = { backup_battery: 1 };

  // Within range (player near rover)
  const okTransfer = evaluateCargoTransfer({
    itemId: 'backup_battery',
    direction: 'to_rover',
    personalInventory: personal,
    roverInventory: rover,
    playerPos: [3.5, -0.4, -2.0],
    roverPos: [3.8, -0.32, -2.2],
    isDrivingRover: false
  });
  assert.equal(okTransfer.ok, true);
  assert.equal(okTransfer.nextPersonalInventory.backup_battery, 1);
  assert.equal(okTransfer.nextRoverInventory.backup_battery, 2);

  // Out of range (player 30m away)
  const farTransfer = evaluateCargoTransfer({
    itemId: 'backup_battery',
    direction: 'to_rover',
    personalInventory: personal,
    roverInventory: rover,
    playerPos: [30, -0.4, 30],
    roverPos: [3.8, -0.32, -2.2],
    isDrivingRover: false
  });
  assert.equal(farTransfer.ok, false);
  assert.equal(farTransfer.nextPersonalInventory.backup_battery, 2);
  assert.equal(farTransfer.nextRoverInventory.backup_battery, 1);
});

test('specimen objective matching checks targetSpecimenId prefix', () => {
  assert.equal(doesSpecimenMatchObjective('specimen-regolith-1', 'specimen-regolith'), true);
  assert.equal(doesSpecimenMatchObjective('specimen-regolith-2', 'specimen-regolith'), true);
  assert.equal(doesSpecimenMatchObjective('specimen-hematite-1', 'specimen-regolith'), false);
});

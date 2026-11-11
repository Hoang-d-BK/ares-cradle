import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PHYSICS_CONSTANTS,
  PhysicsState,
  stepPlayerPhysics,
  STATIC_WORLD_COLLIDERS
} from './physicsEngine';

function createInitialState(x = 1.8, z = 2.5, y = PHYSICS_CONSTANTS.GROUND_Y): PhysicsState {
  return {
    x,
    y,
    z,
    vy: 0,
    isGrounded: true,
    isBlocked: false,
    blockedByLabel: null,
    blockedObstacleJumpable: false,
    standingOnLabel: null
  };
}

test('walking into Central Command Table on foot is blocked horizontally', () => {
  // Start just north of Central Command Table (radius 1.05 at (0,0), player radius 0.34 -> minDist 1.39)
  let state = createInitialState(0, 1.45);
  // Attempt to walk straight into the table (-Z direction)
  state = stepPlayerPhysics(state, {
    moveX: 0,
    moveZ: -3.6,
    jumpJustPressed: false,
    dt: 0.05
  });

  assert.equal(state.isBlocked, true);
  assert.equal(state.blockedByLabel, 'Central Command Table');
  assert.ok(state.z >= 1.38, `Expected player to be stopped outside table radius, got z=${state.z}`);
});

test('walking into Habitat Perimeter Wall outside doorway is blocked, but South Ramp opening is passable', () => {
  // 1. Try walking through North wall (x = 0, z = -3.2 -> moving toward -4.2)
  let northState = createInitialState(0, -3.25);
  for (let i = 0; i < 6; i++) {
    northState = stepPlayerPhysics(northState, {
      moveX: 0,
      moveZ: -3.6,
      jumpJustPressed: false,
      dt: 0.04
    });
  }
  assert.equal(northState.isBlocked, true);
  assert.equal(northState.blockedByLabel, 'Habitat Perimeter Wall');
  assert.ok(northState.z > -3.3, `Expected North wall to block player inside dome, got z=${northState.z}`);

  // 2. Walk through South Ramp doorway (x = 0, z = 3.2 -> moving toward +4.5)
  let southState = createInitialState(0, 3.2);
  for (let i = 0; i < 10; i++) {
    southState = stepPlayerPhysics(southState, {
      moveX: 0,
      moveZ: 3.6,
      jumpJustPressed: false,
      dt: 0.04
    });
  }
  assert.equal(southState.isBlocked, false);
  assert.ok(southState.z > 4.2, `Expected South doorway to allow exiting dome, got z=${southState.z}`);
});

test('pressing Space jumps over/onto an obstacle that blocked walking on foot', () => {
  // Start next to Central Command Table (topY = 0.42)
  let state = createInitialState(0, 1.45);

  // Trigger Space jump
  state = stepPlayerPhysics(state, {
    moveX: 0,
    moveZ: 0,
    jumpJustPressed: true,
    dt: 0.02
  });

  assert.equal(state.isGrounded, false);
  assert.ok(state.vy > 5.0);

  // Ascend until above table topY (0.42) while moving forward toward (0, 0)
  for (let i = 0; i < 18; i++) {
    state = stepPlayerPhysics(state, {
      moveX: 0,
      moveZ: -2.5,
      jumpJustPressed: false,
      dt: 0.03
    });
  }

  // Player should have cleared the edge horizontally and moved over the table
  assert.ok(state.z < 1.0, `Expected jumping player to move over table, got z=${state.z}`);

  // Continue stepping until player lands on top of the Central Command Table
  for (let i = 0; i < 30; i++) {
    state = stepPlayerPhysics(state, {
      moveX: 0,
      moveZ: 0,
      jumpJustPressed: false,
      dt: 0.03
    });
    if (state.isGrounded) break;
  }

  assert.equal(state.isGrounded, true);
  assert.equal(state.y, 0.42);
  assert.equal(state.standingOnLabel, 'Central Command Table');
});

test('walking off the edge of an elevated obstacle falls back to Martian ground (-0.4)', () => {
  // Start standing on top of Central Command Table (y = 0.42)
  let state: PhysicsState = {
    x: 0,
    y: 0.42,
    z: 0.8,
    vy: 0,
    isGrounded: true,
    isBlocked: false,
    blockedByLabel: null,
    blockedObstacleJumpable: false,
    standingOnLabel: 'Central Command Table'
  };

  // Walk South off the table and let gravity bring the player down
  for (let i = 0; i < 35; i++) {
    state = stepPlayerPhysics(
      state,
      {
        moveX: 0,
        moveZ: 3.0,
        jumpJustPressed: false,
        dt: 0.03
      },
      STATIC_WORLD_COLLIDERS
    );
  }

  assert.equal(state.isGrounded, true);
  assert.equal(state.y, PHYSICS_CONSTANTS.GROUND_Y);
  assert.equal(state.standingOnLabel, null);
});

test('mid-air Space press triggers EVA jetpack double-jump and smooth inertia accelerates cleanly', () => {
  let state = createInitialState(0, 3.0);

  // First ground jump
  state = stepPlayerPhysics(state, {
    moveX: 0,
    moveZ: 0,
    jumpJustPressed: true,
    dt: 0.02,
    useSmoothInertia: true
  });
  assert.equal(state.isGrounded, false);
  assert.equal(state.airJumpsLeft, 1);

  // Step 10 frames into the air
  for (let i = 0; i < 10; i++) {
    state = stepPlayerPhysics(state, {
      moveX: 0,
      moveZ: 4.5,
      jumpJustPressed: false,
      dt: 0.03,
      useSmoothInertia: true
    });
  }

  const vyBeforeDoubleJump = state.vy;
  // Trigger mid-air EVA jetpack double-jump
  state = stepPlayerPhysics(state, {
    moveX: 0,
    moveZ: 4.5,
    jumpJustPressed: true,
    dt: 0.02,
    useSmoothInertia: true
  });

  assert.equal(state.didDoubleJump, true);
  assert.equal(state.airJumpsLeft, 0);
  assert.ok(state.vy > vyBeforeDoubleJump, 'Expected double-jump to boost vertical velocity upward');
});


import type { ObstacleCollider } from './physicsEngine';
import { WORLD_BOUNDS } from '../outpost-3d/worldRegions';

export const CAMERA_CLEARANCE = 0.28;
export const CAMERA_RADIUS = 0.2;
export const MIN_CAMERA_SEPARATION = 2.8;
export const MIN_ROVER_CAMERA_SEPARATION = 3.6;
export const MIN_HABITAT_CAMERA_SEPARATION = 1.75;
const MAX_PITCH = 0.68;
const MIN_PITCH = -0.68;
const SWEEP_STEP = 0.18;
const BOOM_HEIGHT = 0.75;

export const wrapCameraYaw = (yaw: number) =>
  ((yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

export const clampCameraPitch = (pitch: number) => Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch));

export const updateCameraLook = (yaw: number, pitch: number, movementX: number, movementY: number) => ({
  yaw: wrapCameraYaw(yaw - movementX * 0.0022),
  pitch: clampCameraPitch(pitch - movementY * 0.0022),
});

export interface CameraPoint {
  x: number;
  y: number;
  z: number;
}

function inRingOpening(x: number, z: number, collider: Extract<ObstacleCollider, { type: 'ring' }>): boolean {
  return Boolean(collider.openings?.some((opening) =>
    x >= opening.minX + CAMERA_RADIUS && x <= opening.maxX - CAMERA_RADIUS &&
    z >= opening.minZ + CAMERA_RADIUS && z <= opening.maxZ - CAMERA_RADIUS
  ));
}

export function isCameraPointClear(
  point: CameraPoint,
  sampleGround: (x: number, z: number) => number,
  colliders: readonly ObstacleCollider[]
): boolean {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z) ||
      point.x < WORLD_BOUNDS.minX + CAMERA_RADIUS || point.x > WORLD_BOUNDS.maxX - CAMERA_RADIUS ||
      point.z < WORLD_BOUNDS.minZ + CAMERA_RADIUS || point.z > WORLD_BOUNDS.maxZ - CAMERA_RADIUS) return false;
  const ground = sampleGround(point.x, point.z);
  if (!Number.isFinite(ground) || point.y < ground + CAMERA_CLEARANCE) return false;

  for (const collider of colliders) {
    if (!Number.isFinite(collider.topY) || point.y > collider.topY + CAMERA_CLEARANCE) continue;
    if (collider.type === 'circle' && Math.hypot(point.x - collider.x, point.z - collider.z) <= collider.radius + CAMERA_RADIUS) {
      return false;
    }
    if (collider.type === 'box') {
      const dx = point.x - collider.x;
      const dz = point.z - collider.z;
      const cos = Math.cos(collider.rotationY ?? 0);
      const sin = Math.sin(collider.rotationY ?? 0);
      const localX = dx * cos + dz * sin;
      const localZ = -dx * sin + dz * cos;
      if (Math.abs(localX) <= collider.halfX + CAMERA_RADIUS && Math.abs(localZ) <= collider.halfZ + CAMERA_RADIUS) return false;
    }
    if (collider.type === 'ring' && collider.id !== 'habitat-dome-wall' && !inRingOpening(point.x, point.z, collider)) {
      const distance = Math.hypot(point.x - collider.x, point.z - collider.z);
      if (distance >= collider.innerRadius - CAMERA_RADIUS && distance <= collider.outerRadius + CAMERA_RADIUS) return false;
    }
  }
  return true;
}

/** Shortens the pivot-to-camera sweep at terrain or shared world collider boundaries. */
export function resolveCameraBoom(
  pivot: CameraPoint,
  desired: CameraPoint,
  sampleGround: (x: number, z: number) => number,
  colliders: readonly ObstacleCollider[]
): CameraPoint {
  const distance = Math.hypot(desired.x - pivot.x, desired.y - pivot.y, desired.z - pivot.z);
  if (!Number.isFinite(distance)) return pivot;
  const steps = Math.max(1, Math.ceil(distance / SWEEP_STEP));
  let safe: CameraPoint | null = null;
  let foundClearPoint = isCameraPointClear(pivot, sampleGround, colliders);
  if (foundClearPoint) safe = pivot;
  for (let index = 1; index <= steps; index += 1) {
    const t = index / steps;
    const point = {
      x: pivot.x + (desired.x - pivot.x) * t,
      y: pivot.y + (desired.y - pivot.y) * t,
      z: pivot.z + (desired.z - pivot.z) * t,
    };
    if (!isCameraPointClear(point, sampleGround, colliders)) {
      if (!foundClearPoint) continue;
      break;
    }
    foundClearPoint = true;
    safe = point;
  }
  return safe ?? pivot;
}

/**
 * Builds an elevated boom independent of the view angle. Positive mouse-up pitch therefore
 * looks toward the horizon instead of dropping the camera through the actor and terrain.
 */
export function chaseCameraPosition(
  pivot: CameraPoint,
  yaw: number,
  _pitch: number,
  distance: number,
  boomHeight = BOOM_HEIGHT,
): CameraPoint {
  const safeDistance = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  const safeHeight = Number.isFinite(boomHeight) ? Math.min(safeDistance, Math.max(0, boomHeight)) : BOOM_HEIGHT;
  const horizontal = Math.sqrt(Math.max(0, safeDistance * safeDistance - safeHeight * safeHeight));
  return {
    x: pivot.x + Math.sin(yaw) * horizontal,
    y: pivot.y + safeHeight,
    z: pivot.z + Math.cos(yaw) * horizontal,
  };
}

/** Chooses the clearest practical orbit without letting a blocked boom collapse into the actor. */
export function findCameraPosition(
  pivot: CameraPoint,
  yaw: number,
  pitch: number,
  distance: number,
  minimumSeparation: number,
  sampleGround: (x: number, z: number) => number,
  colliders: readonly ObstacleCollider[],
  isCandidateAllowed: (point: CameraPoint) => boolean = () => true,
  boomHeight = BOOM_HEIGHT,
): CameraPoint {
  const offsets = [0, 0.45, -0.45, 0.9, -0.9, 1.35, -1.35, 1.8, -1.8, Math.PI];
  let best = pivot;
  let bestScore = -Infinity;
  for (const offset of offsets) {
    const desired = chaseCameraPosition(pivot, wrapCameraYaw(yaw + offset), pitch, distance, boomHeight);
    const candidate = resolveCameraBoom(pivot, desired, sampleGround, colliders);
    const separation = Math.hypot(candidate.x - pivot.x, candidate.y - pivot.y, candidate.z - pivot.z);
    if (!isCandidateAllowed(candidate)) continue;
    const score = Math.min(separation / Math.max(distance, 1e-6), 1) * 2 - Math.abs(offset) * 0.4;
    if (separation >= minimumSeparation && score > bestScore) {
      best = candidate;
      bestScore = score;
      if (offset === 0 && separation >= distance - SWEEP_STEP * 1.5) return candidate;
    } else if (bestScore === -Infinity && separation > Math.hypot(best.x - pivot.x, best.y - pivot.y, best.z - pivot.z)) {
      best = candidate;
    }
  }
  return best;
}

/** Limits view pitch only as much as needed to keep the actor's vertical bounds in frame. */
export function clampCameraPitchToFrame(
  camera: CameraPoint,
  pivot: CameraPoint,
  desiredPitch: number,
  verticalFovDegrees: number,
  isRover: boolean
): number {
  const horizontal = Math.hypot(camera.x - pivot.x, camera.z - pivot.z);
  if (!Number.isFinite(horizontal) || horizontal < 1e-4) return clampCameraPitch(desiredPitch);
  const highest = isRover ? 1.7 : 1.4;
  const lowest = isRover ? -0.35 : -0.4;
  const headAngle = Math.atan2(pivot.y + highest - camera.y, horizontal);
  const feetAngle = Math.atan2(pivot.y + lowest - camera.y, horizontal);
  const halfFov = Math.max(0.05, (verticalFovDegrees * Math.PI) / 360 - 0.025);
  const minimum = headAngle - halfFov;
  const maximum = feetAngle + halfFov;
  return clampCameraPitch(Math.max(minimum, Math.min(maximum, desiredPitch)));
}

export function cameraLookFromPosition(position: CameraPoint, pivot: CameraPoint, fallbackYaw: number) {
  const x = position.x - pivot.x;
  const y = position.y - pivot.y;
  const z = position.z - pivot.z;
  const horizontal = Math.hypot(x, z);
  return {
    yaw: horizontal > 1e-6 ? wrapCameraYaw(Math.atan2(x, z)) : wrapCameraYaw(fallbackYaw),
    pitch: clampCameraPitch(Math.atan2(-y, horizontal)),
  };
}

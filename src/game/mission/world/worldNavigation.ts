import { WORLD_LIMIT, type RegionId, type Pose } from '../contract';

export const WORLD_BOUNDS = Object.freeze({ minX: -WORLD_LIMIT, maxX: WORLD_LIMIT, minZ: -WORLD_LIMIT, maxZ: WORLD_LIMIT });
export const REGION_CENTERS: Readonly<Record<RegionId, [number, number]>> = Object.freeze({
  impact: [-200, -170],
  dust: [0, 0],
  volcano: [-210, 180],
  ice: [210, -180],
  lake: [200, 170],
});
export const REGION_ORDER: readonly RegionId[] = ['impact', 'dust', 'volcano', 'ice', 'lake'];

export type RouteSegment = readonly [RegionId, RegionId];
export const MAIN_ROUTES: readonly RouteSegment[] = [
  ['impact', 'dust'],
  ['dust', 'volcano'],
  ['dust', 'ice'],
  ['dust', 'lake'],
  ['impact', 'volcano'],
  ['ice', 'lake'],
];

export interface StaticCollider {
  readonly center: readonly [number, number];
  readonly radius: number;
}

/** Sparse fixed obstacles leave every base approach and main route open. */
export const STATIC_COLLIDERS: readonly StaticCollider[] = [
  { center: [-270, -250], radius: 9 },
  { center: [-270, 260], radius: 11 },
  { center: [270, -260], radius: 10 },
  { center: [280, 255], radius: 12 },
  { center: [-95, 270], radius: 8 },
  { center: [90, -270], radius: 9 },
];

const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;
const gaussian = (distance: number, width: number) => Math.exp(-(distance * distance) / (2 * width * width));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * One deterministic height field shared by terrain rendering, actors and rover wheels.
 * It is intentionally finite and bounded: no state or actor can alter the surface.
 */
export function sampleGround(x: number, z: number): number {
  const px = finite(x), pz = finite(z);
  const broad = 0.7 * Math.sin(px * 0.018) + 0.55 * Math.cos(pz * 0.021) + 0.28 * Math.sin((px + pz) * 0.043);

  const impactDistance = Math.hypot(px + 200, pz + 170);
  const impactCrater = -5.2 * gaussian(impactDistance, 33) + 4.4 * gaussian(impactDistance - 47, 9);
  const impactRim = 0.8 * Math.sin(impactDistance * 0.21) * gaussian(impactDistance - 48, 15);

  const dustDistance = Math.hypot(px, pz);
  const dustMask = gaussian(dustDistance, 130);
  const dunes = (2.4 * Math.sin(px * 0.052 + pz * 0.016) + 0.9 * Math.sin(px * 0.021 - pz * 0.038)) * dustMask;

  const volcanoDistance = Math.hypot(px + 210, pz - 180);
  const basaltMask = gaussian(volcanoDistance, 125);
  const basaltRidges = (1.7 * Math.max(0, Math.sin((px + pz) * 0.038)) + 0.8 * Math.sin(px * 0.072)) * basaltMask;
  const lavaChannel = -1.2 * gaussian(Math.abs(px + 205 - (pz - 180) * 0.28), 9) * gaussian(volcanoDistance, 120);

  const iceDistance = Math.hypot(px - 210, pz + 180);
  const iceMask = gaussian(iceDistance, 132);
  const icePlateau = 2.6 * iceMask + 1.1 * Math.sin((px - 210) * 0.028) * iceMask;
  const iceWall = 3.4 * gaussian(px - 238, 12) * gaussian(pz + 180, 72);

  const lakeDistance = Math.hypot(px - 200, pz - 170);
  const lakeMask = gaussian(lakeDistance, 138);
  const basin = -2.6 * gaussian(lakeDistance, 64) + 0.7 * Math.sin(lakeDistance * 0.18) * lakeMask;
  const sediment = 0.5 * Math.sin((px - pz) * 0.031) * lakeMask;

  return clamp(broad + impactCrater + impactRim + dunes + basaltRidges + lavaChannel + icePlateau + iceWall + basin + sediment, -12, 14);
}

export function regionCenter(region: RegionId): [number, number] {
  return [...REGION_CENTERS[region]];
}

export function isFinitePose(pose: Pose | null | undefined): pose is Pose {
  return Boolean(pose && Number.isFinite(pose.x) && Number.isFinite(pose.z) && Number.isFinite(pose.heading));
}

export function inWorldBounds(x: number, z: number, margin = 0): boolean {
  return Number.isFinite(x) && Number.isFinite(z)
    && x >= WORLD_BOUNDS.minX + margin && x <= WORLD_BOUNDS.maxX - margin
    && z >= WORLD_BOUNDS.minZ + margin && z <= WORLD_BOUNDS.maxZ - margin;
}

export function segmentDistance(x: number, z: number, a: readonly [number, number], b: readonly [number, number]): number {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const denominator = dx * dx + dz * dz || 1;
  const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / denominator, 0, 1);
  return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
}

export function routeEndpoints(route: RouteSegment): [[number, number], [number, number]] {
  return [regionCenter(route[0]), regionCenter(route[1])];
}

export function isOnMainRoute(x: number, z: number, width = 14): boolean {
  return MAIN_ROUTES.some(route => {
    const [from, to] = routeEndpoints(route);
    return segmentDistance(x, z, from, to) <= width;
  });
}

export function collidesStatic(x: number, z: number, radius = 0.65): boolean {
  return STATIC_COLLIDERS.some(collider => Math.hypot(x - collider.center[0], z - collider.center[1]) < collider.radius + radius);
}

export function canOccupy(x: number, z: number, radius = 0.65): boolean {
  return inWorldBounds(x, z, radius) && !collidesStatic(x, z, radius);
}

const ROVER_HELP_CLEARANCE_RADIUS = 2.25;
const ROVER_HELP_MAX_DISTANCE = 8;

/** Bounded deterministic recovery for the currently controlled rover. */
export function findNearestSafeRoverPose(current: Pose, lastSafe: Pose | null = null): Pose | null {
  if (!isFinitePose(current)) return null;

  const withinBound = (pose: Pose): boolean =>
    isFinitePose(pose)
    && Math.hypot(pose.x - current.x, pose.z - current.z) <= ROVER_HELP_MAX_DISTANCE
    && canOccupy(pose.x, pose.z, ROVER_HELP_CLEARANCE_RADIUS);

  if (canOccupy(current.x, current.z, ROVER_HELP_CLEARANCE_RADIUS)) return null;
  if (lastSafe !== null && withinBound(lastSafe)
    && Math.hypot(lastSafe.x - current.x, lastSafe.z - current.z) > 0.01) {
    return { x: lastSafe.x, z: lastSafe.z, heading: current.heading };
  }

  let nearest: Pose | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  const step = 0.5;
  const steps = Math.floor(ROVER_HELP_MAX_DISTANCE / step);
  for (let ix = -steps; ix <= steps; ix += 1) {
    for (let iz = -steps; iz <= steps; iz += 1) {
      const x = current.x + ix * step;
      const z = current.z + iz * step;
      const distance = Math.hypot(x - current.x, z - current.z);
      if (distance > ROVER_HELP_MAX_DISTANCE || distance >= nearestDistance) continue;
      if (!canOccupy(x, z, ROVER_HELP_CLEARANCE_RADIUS)) continue;
      nearest = { x, z, heading: current.heading };
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function constrainMove(from: Pose, to: Pose, radius = 0.65): Pose {
  if (!isFinitePose(from)) {
    const x = clamp(finite(to.x), WORLD_BOUNDS.minX + radius, WORLD_BOUNDS.maxX - radius);
    const z = clamp(finite(to.z), WORLD_BOUNDS.minZ + radius, WORLD_BOUNDS.maxZ - radius);
    return { x, z, heading: finite(to.heading) };
  }
  if (!isFinitePose(to)) return { ...from };

  const distance = Math.hypot(to.x - from.x, to.z - from.z);
  const scale = distance > 4 ? 4 / distance : 1;
  const targetX = from.x + (to.x - from.x) * scale;
  const targetZ = from.z + (to.z - from.z) * scale;
  const steps = Math.max(1, Math.ceil(Math.hypot(targetX - from.x, targetZ - from.z) / 0.45));
  let x = from.x;
  let z = from.z;
  for (let step = 1; step <= steps; step += 1) {
    const candidateX = from.x + (targetX - from.x) * step / steps;
    const candidateZ = from.z + (targetZ - from.z) * step / steps;
    if (!canOccupy(candidateX, candidateZ, radius)) break;
    x = candidateX;
    z = candidateZ;
  }
  return { x, z, heading: finite(to.heading, from.heading) };
}

/** Alias used by movement and tests to make the safety behavior explicit. */
export const lastSafeMove = constrainMove;

export function nearestRegion(x: number, z: number): RegionId {
  return REGION_ORDER.reduce((closest, region) => {
    const [cx, cz] = regionCenter(region);
    const [bx, bz] = regionCenter(closest);
    return Math.hypot(x - cx, z - cz) < Math.hypot(x - bx, z - bz) ? region : closest;
  }, REGION_ORDER[0]);
}

/** Pure route proof for focused tests; no renderer or campaign state involved. */
export function mainRoutesConnected(): boolean {
  return MAIN_ROUTES.every(route => {
    const [from, to] = routeEndpoints(route);
    const count = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 4));
    for (let index = 0; index <= count; index += 1) {
      const t = index / count;
      if (!canOccupy(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, 1.4)) return false;
    }
    return true;
  });
}

export function poseOnGround(pose: Pose): Pose & { y: number } {
  return { ...pose, y: sampleGround(pose.x, pose.z) };
}
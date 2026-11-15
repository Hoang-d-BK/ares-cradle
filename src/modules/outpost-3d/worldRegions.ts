/**
 * Canonical game-unit data for the additive world beyond MarsTerrain's radius-210 ring.
 * Ground height is the actor/rover contact height; render vertices offset it to meet the
 * existing -0.56 horizon ring without changing that original geometry.
 */
export const WORLD_BOUNDS = { minX: -300, maxX: 300, minZ: -300, maxZ: 300 } as const;
export const PRESERVED_CORE_RADIUS = 210;
export const WORLD_GROUND_Y = -0.4;
export const OUTER_TERRAIN_RENDER_OFFSET = -0.16;
export const ROUTE_CLEARANCE = 8;
const OUTER_RELIEF_START_RADIUS = 224;

export type WorldPoint = Readonly<{ x: number; z: number }>;
export type RegionId = 'impact' | 'ice' | 'volcano' | 'lake' | 'dust';
export type RegionPalette = Readonly<{ terrain: string; rock: string; accent: string }>;

export interface OuterRegion {
  readonly id: RegionId;
  readonly name: string;
  readonly center: WorldPoint;
  readonly palette: RegionPalette;
  readonly relief: number;
  readonly discoveries: readonly [WorldPoint, WorldPoint, WorldPoint];
  readonly branches: readonly [WorldPoint, WorldPoint];
  readonly baseConsole: WorldPoint;
  readonly safeParking: WorldPoint;
}

export const HOME_REGION = {
  id: 'home',
  name: 'ELON MARS',
  center: { x: 0, z: 0 },
  palette: { terrain: '#943109', rock: '#752405', accent: '#1E293B' },
} as const;

const point = (x: number, z: number): WorldPoint => ({ x, z });

/** Five additive outer sectors; the original radius-210 world remains untouched. */
export const WORLD_REGIONS: readonly OuterRegion[] = [
  {
    id: 'impact', name: 'Impact Basin', center: point(-240, -240),
    palette: { terrain: '#85503F', rock: '#484A49', accent: '#B78166' }, relief: 1.8,
    discoveries: [point(-272, -240), point(-240, -276), point(-218, -255)],
    branches: [point(-270, -229), point(-225, -275)],
    baseConsole: point(-240, -240), safeParking: point(-223, -246),
  },
  {
    id: 'ice', name: 'Sheltered Ice Shelf', center: point(240, -240),
    palette: { terrain: '#59696D', rock: '#788B8E', accent: '#83AEB5' }, relief: 1.55,
    discoveries: [point(272, -240), point(240, -276), point(218, -255)],
    branches: [point(270, -229), point(225, -275)],
    baseConsole: point(240, -240), safeParking: point(223, -246),
  },
  {
    id: 'volcano', name: 'Basalt Ridges', center: point(-240, 240),
    palette: { terrain: '#35383A', rock: '#202326', accent: '#8A5944' }, relief: 2.5,
    discoveries: [point(-272, 240), point(-240, 276), point(-218, 255)],
    branches: [point(-270, 229), point(-225, 275)],
    baseConsole: point(-240, 240), safeParking: point(-223, 246),
  },
  {
    id: 'lake', name: 'Ancient Lake Margin', center: point(240, 240),
    palette: { terrain: '#755346', rock: '#423B38', accent: '#829A9B' }, relief: 1.5,
    discoveries: [point(272, 240), point(240, 276), point(218, 255)],
    branches: [point(270, 229), point(225, 275)],
    baseConsole: point(240, 240), safeParking: point(223, 246),
  },
  {
    id: 'dust', name: 'Wind-Swept Basin', center: point(0, -255),
    palette: { terrain: '#81503B', rock: '#514039', accent: '#9B725D' }, relief: 1.25,
    discoveries: [point(30, -255), point(-32, -263), point(22, -285)],
    branches: [point(-38, -245), point(39, -273)],
    baseConsole: point(0, -255), safeParking: point(18, -242),
  },
];

export interface RoverRoute {
  readonly regionId: RegionId;
  readonly entryPoint: WorldPoint;
  /** Ordered game-unit waypoints from the existing ring to a console approach point. */
  readonly points: readonly WorldPoint[];
}

/** All five routes begin just beyond the preserved ring and stop 10m before each console. */
export const ROVER_ROUTES: readonly RoverRoute[] = [
  { regionId: 'impact', entryPoint: point(-150, -150), points: [point(-150, -150), point(-180, -180), point(-210, -210), point(-230, -240)] },
  { regionId: 'ice', entryPoint: point(150, -150), points: [point(150, -150), point(180, -180), point(210, -210), point(247.98635510047293, -233.98184976847952)] },
  { regionId: 'volcano', entryPoint: point(-150, 150), points: [point(-150, 150), point(-180, 180), point(-210, 210), point(-230, 240)] },
  { regionId: 'lake', entryPoint: point(150, 150), points: [point(150, 150), point(180, 180), point(210, 210), point(233.98184976847952, 247.98635510047293)] },
  { regionId: 'dust', entryPoint: point(0, -212), points: [point(0, -212), point(0, -232), point(1.219, -245.075)] },
];

export type OuterHeroId = 'impact-crater' | 'ice-scarp' | 'volcano-shield' | 'lake-bluff' | 'dust-dunes';

/** A visible natural landform; footprint fields describe its authored extent, not a wall. */
export interface OuterHeroLandmark {
  readonly id: OuterHeroId;
  readonly regionId: RegionId;
  readonly position: WorldPoint;
  readonly yaw: number;
  readonly halfX: number;
  readonly halfZ: number;
  readonly topOffset: number;
}

/** Region renderer and natural feature data share these five non-colliding form bounds. */
export const OUTER_HERO_LANDMARKS: readonly OuterHeroLandmark[] = [
  { id: 'impact-crater', regionId: 'impact', position: point(-256, -257), yaw: 0, halfX: 25, halfZ: 25, topOffset: 5 },
  { id: 'ice-scarp', regionId: 'ice', position: point(256, -258), yaw: -0.18, halfX: 24, halfZ: 12, topOffset: 5 },
  { id: 'volcano-shield', regionId: 'volcano', position: point(-247, 254), yaw: 0, halfX: 42, halfZ: 38, topOffset: 12 },
  { id: 'lake-bluff', regionId: 'lake', position: point(270, 280), yaw: -0.42, halfX: 19, halfZ: 12, topOffset: 8 },
  { id: 'dust-dunes', regionId: 'dust', position: point(0, -255), yaw: 0.24, halfX: 36, halfZ: 31, topOffset: 4 },
];

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const pointSegmentDistance = (point: WorldPoint, a: WorldPoint, b: WorldPoint): number => {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared === 0 ? 0 : clamp01(((point.x - a.x) * dx + (point.z - a.z) * dz) / lengthSquared);
  return Math.hypot(point.x - a.x - t * dx, point.z - a.z - t * dz);
};

/** Distance from a point to the nearest segment in any authored rover route. */
export function distanceToRoverRoutes(position: WorldPoint): number {
  let nearest = Infinity;
  for (const route of ROVER_ROUTES) {
    for (let index = 1; index < route.points.length; index += 1) {
      nearest = Math.min(nearest, pointSegmentDistance(position, route.points[index - 1], route.points[index]));
    }
  }
  return nearest;
}

/** The point-based visibility rule used by authored field sites. */
export function isWorldPointRouteClear(position: WorldPoint, clearance = ROUTE_CLEARANCE): boolean {
  return distanceToRoverRoutes(position) >= clearance;
}

function segmentIntersectsRectangle(
  a: WorldPoint,
  b: WorldPoint,
  halfX: number,
  halfZ: number,
): boolean {
  let low = 0;
  let high = 1;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  for (const [p, q] of [
    [-dx, a.x + halfX], [dx, halfX - a.x],
    [-dz, a.z + halfZ], [dz, halfZ - a.z],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) low = Math.max(low, t);
    else high = Math.min(high, t);
    if (low > high) return false;
  }
  return true;
}

function segmentRectangleDistance(a: WorldPoint, b: WorldPoint, halfX: number, halfZ: number): number {
  if (segmentIntersectsRectangle(a, b, halfX, halfZ)) return 0;
  const pointRectangleDistance = (position: WorldPoint): number => Math.hypot(
    Math.max(0, Math.abs(position.x) - halfX), Math.max(0, Math.abs(position.z) - halfZ),
  );
  const corners = [
    point(-halfX, -halfZ), point(halfX, -halfZ), point(halfX, halfZ), point(-halfX, halfZ),
  ];
  let nearest = Math.min(pointRectangleDistance(a), pointRectangleDistance(b));
  for (const corner of corners) nearest = Math.min(nearest, pointSegmentDistance(corner, a, b));
  return nearest;
}

/** World-unit shortest distance between a named landmark footprint and route centerlines. */
export function distanceFromOuterHeroToRoutes(landmark: OuterHeroLandmark): number {
  const { x, z } = landmark.position;
  const angle = landmark.yaw;
  const toLocal = (position: WorldPoint): WorldPoint => {
    const dx = position.x - x;
    const dz = position.z - z;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: dx * cos - dz * sin, z: dx * sin + dz * cos };
  };
  let nearest = Infinity;
  for (const route of ROVER_ROUTES) {
    for (let index = 1; index < route.points.length; index += 1) {
      nearest = Math.min(nearest, segmentRectangleDistance(
        toLocal(route.points[index - 1]), toLocal(route.points[index]), landmark.halfX, landmark.halfZ,
      ));
    }
  }
  return nearest;
}

/** Renderer and physics share the same full, measured hero footprint. */
export function isOuterHeroRouteClear(landmark: OuterHeroLandmark, clearance = ROUTE_CLEARANCE): boolean {
  return distanceFromOuterHeroToRoutes(landmark) >= clearance;
}

export function getOuterHeroVerticalPlacement(landmark: OuterHeroLandmark, ground: number): { y: number; topY: number } {
  return { y: ground, topY: ground + landmark.topOffset };
}

export interface OuterCircleCollider {
  readonly id: string;
  readonly regionId: RegionId;
  readonly kind: 'discovery' | 'branch';
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

/** Additive, engine-neutral landmark footprints; Y is always sampled from the ground. */
export const ADDITIVE_OUTER_COLLIDERS: readonly OuterCircleCollider[] = WORLD_REGIONS.flatMap((region) => [
  ...region.discoveries.map((position, index) => ({
    id: `${region.id}.discovery-${index + 1}`, regionId: region.id, kind: 'discovery' as const,
    x: position.x, z: position.z, radius: 2.5,
  })),
  ...region.branches.map((position, index) => ({
    id: `${region.id}.branch-${index + 1}`, regionId: region.id, kind: 'branch' as const,
    x: position.x, z: position.z, radius: 2.5,
  })),
]);

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const smoothstep = (value: number): number => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const polylineDistance = (x: number, z: number, points: readonly (readonly [number, number])[]): number => {
  let nearest = Infinity;
  for (let index = 1; index < points.length; index += 1) {
    nearest = Math.min(nearest, pointSegmentDistance(
      point(x, z), point(points[index - 1][0], points[index - 1][1]), point(points[index][0], points[index][1]),
    ));
  }
  return nearest;
};
const boundedPoint = (x: number, z: number): WorldPoint => ({
  x: clamp(x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
  z: clamp(z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ),
});

/**
 * Single contact-height authority for render adapters, Leo, and rover movement.
 * Returns the exact legacy contact plane through the radius-210 core and flat apron,
 * then blends into broad, deterministic relief with a zero-slope seam. Out-of-bounds samples clamp;
 * invalid coordinates safely resolve to the legacy plane (never wrap or teleport).
 */
const NATURAL_RELIEF_APPROACHES: readonly WorldPoint[] = [
  point(-256, -257), point(256, -258), point(-247, 254), point(270, 280), point(0, -255),
  point(-260, 254), point(-242, -257), point(276, 280), point(-8, -255),
];
const NATURAL_APPROACH_FLAT_RADIUS = 8;
const NATURAL_APPROACH_BLEND_RADIUS = 44;

/**
 * Shared, gently walkable relief for the five natural sectors. Route/anchor weights ease
 * large slopes without flattening a 24m installation apron or erasing the forms at approach.
 */
export function sampleRegionalLandformHeight(x: number, z: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 0;
  const bounded = boundedPoint(x, z);
  if (Math.hypot(bounded.x, bounded.z) <= OUTER_RELIEF_START_RADIUS) return 0;

  const fade = smoothstep(clamp((Math.hypot(bounded.x, bounded.z) - OUTER_RELIEF_START_RADIUS) / 36, 0, 1));
  const gaussian = (dx: number, dz: number, widthX: number, widthZ: number): number =>
    Math.exp(-0.5 * (dx * dx / (widthX * widthX) + dz * dz / (widthZ * widthZ)));
  let routeEase = 1;
  for (const route of ROVER_ROUTES) {
    for (let index = 1; index < route.points.length; index += 1) {
      const distance = pointSegmentDistance(bounded, route.points[index - 1], route.points[index]);
      routeEase = Math.min(routeEase, smoothstep(distance / 12));
    }
  }

  // Impact basin: recessed bowl, raised rim, then broken ejecta lobes around the perimeter.
  const impactX = bounded.x + 256;
  const impactZ = bounded.z + 257;
  const craterRadius = Math.hypot(impactX, impactZ);
  const craterBowl = -2.6 * gaussian(impactX, impactZ, 12, 12);
  const craterRim = 3.8 * gaussian(craterRadius - 18, 0, 3.4, 1);
  const ejecta = 1.35 * gaussian(craterRadius - 28, 0, 8, 1)
    * (0.65 + 0.35 * Math.cos(Math.atan2(impactZ, impactX) * 5 + 0.4));

  // Dust field: cross-wind ripples and a lee-side drift with low, routeable relief.
  const dustX = bounded.x;
  const dustZ = bounded.z + 255;
  const duneField = gaussian(dustX, dustZ, 47, 40);
  const windPhase = (dustZ + 0.24 * dustX) * 0.17;
  const dunes = (1.55 * Math.sin(windPhase) + 0.3 * Math.sin(windPhase * 2 - 0.6)) * duneField;
  const leeDrift = 1.15 * gaussian(bounded.x - 13, bounded.z + 278, 18, 7);
  const streakCut = -0.55 * gaussian(bounded.x + 13, bounded.z + 251, 25, 4);

  // Ice-bearing mantle: broad shoulder, exposed tilted scarp, and a lower talus apron.
  const iceX = bounded.x - 256;
  const iceZ = bounded.z + 258;
  const icePatch = gaussian(iceX, iceZ, 38, 30);
  const iceBand = iceZ + 0.18 * iceX + 3.5;
  const iceShoulder = 2.2 * gaussian(iceX + 5, iceZ - 2, 25, 12);
  const iceScarp = 2.25 * Math.tanh(iceBand / 3.6) * icePatch;
  const iceTalus = -0.8 * gaussian(iceX - 2, iceZ + 5, 25, 8);

  // Shield volcano, broad cooled-flow lobes, shallow caldera and low rim.
  const volcanoX = bounded.x + 247;
  const volcanoZ = bounded.z - 254;
  const volcanoRadius = Math.hypot(volcanoX, volcanoZ * 0.88);
  const shield = 6.2 * gaussian(volcanoX, volcanoZ, 31, 27);
  const caldera = -10 * gaussian(volcanoX, volcanoZ, 5.8, 5.8);
  const calderaRim = 2.2 * gaussian(volcanoRadius - 8.2, 0, 2.6, 1);
  const flowLobes = 1.45 * gaussian(bounded.x + 270, bounded.z - 282, 29, 8)
    + 1.1 * gaussian(bounded.x + 226, bounded.z - 237, 24, 7);
  const lavaLevee = 0.75 * gaussian(volcanoRadius - 34, 0, 3.8, 1);

  // Lake margin: low, eroded sediment bluff; broad cross-bedded terraces and dry channels.
  const lakeX = bounded.x - 270;
  const lakeZ = bounded.z - 280;
  const bluff = 5.5 * gaussian(lakeX, lakeZ, 11, 14);
  const bedding = 0.65 * Math.sin((lakeX * 0.42 + lakeZ * 0.18) * 0.7)
    * gaussian(lakeX, lakeZ, 24, 22);
  const channelA = polylineDistance(lakeX, lakeZ, [[-34, 15], [-21, 9], [-8, 3], [7, -2], [23, -12]]);
  const channelB = polylineDistance(lakeX, lakeZ, [[-19, -23], [-8, -13], [4, -5], [17, 2], [34, 7]]);
  const dryChannels = -1.15 * Math.exp(-(channelA * channelA) / (2 * 3.5 * 3.5))
    -0.85 * Math.exp(-(channelB * channelB) / (2 * 3.8 * 3.8));

  const forms = craterBowl + craterRim + ejecta + dunes + leeDrift + streakCut + iceShoulder + iceScarp + iceTalus
    + shield + caldera + calderaRim + flowLobes + lavaLevee + bluff + bedding + dryChannels;
  const gentleSlopeLimit = 1.7;
  const gentleForms = gentleSlopeLimit * Math.tanh(forms / gentleSlopeLimit);
  return fade * routeEase * gentleForms;
}

export function sampleWorldGround(x: number, z: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return WORLD_GROUND_Y;
  const bounded = boundedPoint(x, z);
  const radius = Math.hypot(bounded.x, bounded.z);
  if (radius <= PRESERVED_CORE_RADIUS) return WORLD_GROUND_Y;

  const fade = smoothstep(clamp((radius - OUTER_RELIEF_START_RADIUS) / 36, 0, 1));
  let relief = 0.72
    + 0.18 * Math.sin(bounded.x * 0.022) * Math.cos(bounded.z * 0.021)
    + 0.12 * Math.sin((bounded.x - bounded.z) * 0.028);
  for (const region of WORLD_REGIONS) {
    const dx = bounded.x - region.center.x;
    const dz = bounded.z - region.center.z;
    relief += region.relief * Math.exp(-(dx * dx + dz * dz) / (2 * 55 * 55));
  }

  const impactX = bounded.x + 256;
  const impactZ = bounded.z + 257;
  const craterRadius = Math.hypot(impactX, impactZ);
  relief -= 0.82 * Math.exp(-(impactX * impactX + impactZ * impactZ) / (2 * 12 * 12));
  relief += 0.92 * Math.exp(-((craterRadius - 18) ** 2) / (2 * 3.2 * 3.2));
  for (const [x, z] of [[-278, -264], [-241, -276], [-270, -235]] as const) {
    const dx = bounded.x - x;
    const dz = bounded.z - z;
    relief += 0.34 * Math.exp(-(dx * dx / 140 + dz * dz / 70));
  }

  const iceX = bounded.x - 256;
  const iceZ = bounded.z + 258;
  const iceBand = iceZ + 0.18 * iceX + 3.5;
  const icePatch = Math.exp(-(iceX * iceX + iceZ * iceZ) / (2 * 36 * 36));
  relief += 0.46 * Math.exp(-(iceBand * iceBand) / (2 * 2.6 * 2.6)) * icePatch;
  relief += 0.2 * Math.exp(-((iceBand - 4.6) ** 2) / (2 * 1.7 * 1.7)) * icePatch;

  const volcanoX = bounded.x + 247;
  const volcanoZ = bounded.z - 254;
  const terraceRadius = Math.hypot(volcanoX, volcanoZ * 0.78);
  for (const [radius, height, width] of [[9, 0.3, 2.5], [15, 0.42, 2.1], [22, 0.34, 2.8]] as const) {
    relief += height * Math.exp(-((terraceRadius - radius) ** 2) / (2 * width * width));
  }

  const lakeX = bounded.x - 240;
  const lakeZ = bounded.z - 240;
  const lakePatch = Math.exp(-(lakeX * lakeX + lakeZ * lakeZ) / (2 * 42 * 42));
  const channels = [
    [[-27, -20], [-12, -14], [-1, -5], [12, 7], [27, 20]],
    [[-24, 13], [-12, 10], [1, 4], [14, 0], [28, -3]],
    [[-4, -27], [2, -15], [4, -3], [8, 11], [8, 27]],
  ] as const;
  for (const channel of channels) {
    const distance = polylineDistance(lakeX, lakeZ, channel);
    relief -= 0.36 * Math.exp(-(distance * distance) / (2 * 3.1 * 3.1)) * lakePatch;
  }

  const dustX = bounded.x;
  const dustZ = bounded.z + 255;
  const dunePatch = Math.exp(-(dustX * dustX / (2 * 49 * 49) + dustZ * dustZ / (2 * 42 * 42)));
  relief += 0.08 * Math.sin((dustZ + 0.24 * dustX) * 0.08) * dunePatch;
  relief += 0.12 * Math.exp(-((dustZ - 14) ** 2) / (2 * 14 * 14)) * Math.exp(-dustX * dustX / (2 * 38 * 38));
  const rawHeight = WORLD_GROUND_Y + fade * relief + sampleRegionalLandformHeight(bounded.x, bounded.z);
  // Keep authored walk/camera step slopes below the existing 8cm collision step.
  if (radius > PRESERVED_CORE_RADIUS && radius > OUTER_RELIEF_START_RADIUS) {
    const step = 2;
    const rawHeightAt = (sampleX: number, sampleZ: number): number => {
      const sample = boundedPoint(sampleX, sampleZ);
      const sampleRadius = Math.hypot(sample.x, sample.z);
      if (sampleRadius <= PRESERVED_CORE_RADIUS) return WORLD_GROUND_Y;
      const sampleFade = smoothstep(clamp((sampleRadius - OUTER_RELIEF_START_RADIUS) / 36, 0, 1));
      let baseRelief = 0.72 + 0.18 * Math.sin(sample.x * 0.022) * Math.cos(sample.z * 0.021)
        + 0.12 * Math.sin((sample.x - sample.z) * 0.028);
      for (const region of WORLD_REGIONS) {
        const dx = sample.x - region.center.x;
        const dz = sample.z - region.center.z;
        baseRelief += region.relief * Math.exp(-(dx * dx + dz * dz) / (2 * 55 * 55));
      }
      const ix = sample.x + 256, iz = sample.z + 257, ir = Math.hypot(ix, iz);
      baseRelief -= 0.82 * Math.exp(-(ix * ix + iz * iz) / (2 * 12 * 12));
      baseRelief += 0.92 * Math.exp(-((ir - 18) ** 2) / (2 * 3.2 * 3.2));
      for (const [rockX, rockZ] of [[-278, -264], [-241, -276], [-270, -235]] as const) {
        const dx = sample.x - rockX, dz = sample.z - rockZ;
        baseRelief += 0.34 * Math.exp(-(dx * dx / 140 + dz * dz / 70));
      }
      const sx = sample.x - 256, sz = sample.z + 258, band = sz + 0.18 * sx + 3.5;
      const iceWeight = Math.exp(-(sx * sx + sz * sz) / (2 * 36 * 36));
      baseRelief += 0.46 * Math.exp(-(band * band) / (2 * 2.6 * 2.6)) * iceWeight;
      baseRelief += 0.2 * Math.exp(-((band - 4.6) ** 2) / (2 * 1.7 * 1.7)) * iceWeight;
      const vx = sample.x + 247, vz = sample.z - 254, vr = Math.hypot(vx, vz * 0.78);
      for (const [r, h, width] of [[9, 0.3, 2.5], [15, 0.42, 2.1], [22, 0.34, 2.8]] as const) {
        baseRelief += h * Math.exp(-((vr - r) ** 2) / (2 * width * width));
      }
      const lx = sample.x - 240, lz = sample.z - 240;
      const lakeWeight = Math.exp(-(lx * lx + lz * lz) / (2 * 42 * 42));
      for (const channel of [
        [[-27, -20], [-12, -14], [-1, -5], [12, 7], [27, 20]],
        [[-24, 13], [-12, 10], [1, 4], [14, 0], [28, -3]],
        [[-4, -27], [2, -15], [4, -3], [8, 11], [8, 27]],
      ] as const) {
        const distance = polylineDistance(lx, lz, channel);
        baseRelief -= 0.36 * Math.exp(-(distance * distance) / (2 * 3.1 * 3.1)) * lakeWeight;
      }
      const dx = sample.x, dz = sample.z + 255;
      const patch = Math.exp(-(dx * dx / (2 * 49 * 49) + dz * dz / (2 * 42 * 42)));
      baseRelief += 0.08 * Math.sin((dz + 0.24 * dx) * 0.08) * patch;
      baseRelief += 0.12 * Math.exp(-((dz - 14) ** 2) / (2 * 14 * 14)) * Math.exp(-dx * dx / (2 * 38 * 38));
      return WORLD_GROUND_Y + sampleFade * baseRelief + sampleRegionalLandformHeight(sample.x, sample.z);
    };
    const maximumSlope = 0.08 / step;
    let boundedHeight = Math.min(rawHeight, rawHeightAt(bounded.x - step, bounded.z) + maximumSlope * step,
      rawHeightAt(bounded.x + step, bounded.z) + maximumSlope * step,
      rawHeightAt(bounded.x, bounded.z - step) + maximumSlope * step,
      rawHeightAt(bounded.x, bounded.z + step) + maximumSlope * step);
    let approachEase = 1;
    for (const approach of NATURAL_RELIEF_APPROACHES) {
      const distance = Math.hypot(bounded.x - approach.x, bounded.z - approach.z);
      approachEase = Math.min(approachEase, smoothstep((distance - NATURAL_APPROACH_FLAT_RADIUS) / NATURAL_APPROACH_BLEND_RADIUS));
    }
    const softenedHeight = WORLD_GROUND_Y + (boundedHeight - WORLD_GROUND_Y) * approachEase;
    return Math.max(softenedHeight, WORLD_GROUND_Y - 1.4);
  }
  return rawHeight;
}

/** Unit upward normal (Y-up) from the same canonical contact-height sampler. */
export function sampleWorldNormal(x: number, z: number): readonly [number, number, number] {
  const step = 0.5;
  const dx = (sampleWorldGround(x + step, z) - sampleWorldGround(x - step, z)) / (2 * step);
  const dz = (sampleWorldGround(x, z + step) - sampleWorldGround(x, z - step)) / (2 * step);
  const length = Math.hypot(dx, 1, dz);
  return [-dx / length, 1 / length, -dz / length];
}

/** Home owns the preserved disc/ring; outer points classify to their nearest sector. */
export function getRegionByPosition(x: number, z: number): typeof HOME_REGION | OuterRegion {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return HOME_REGION;
  const bounded = boundedPoint(x, z);
  if (Math.hypot(bounded.x, bounded.z) <= PRESERVED_CORE_RADIUS) return HOME_REGION;
  return WORLD_REGIONS.reduce((nearest, region) => {
    const distance = Math.hypot(bounded.x - region.center.x, bounded.z - region.center.z);
    const nearestDistance = Math.hypot(bounded.x - nearest.center.x, bounded.z - nearest.center.z);
    return distance < nearestDistance ? region : nearest;
  }, WORLD_REGIONS[0]);
}

export interface OuterTerrainGrid {
  readonly positions: Float32Array;
  readonly indices: Uint32Array;
  readonly segments: number;
  readonly spacing: number;
}

/** Deterministic, bounded regular grid with an overlapping flat apron at the legacy seam. */
export function createOuterTerrainGrid(requestedStep = 8): OuterTerrainGrid {
  const step = Number.isFinite(requestedStep) ? clamp(requestedStep, 4, 24) : 8;
  const segments = Math.ceil((WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX) / step);
  const spacing = (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX) / segments;
  const width = segments + 1;
  const positions = new Float32Array(width * width * 3);
  for (let row = 0; row < width; row += 1) {
    const z = WORLD_BOUNDS.minZ + row * spacing;
    for (let column = 0; column < width; column += 1) {
      const x = WORLD_BOUNDS.minX + column * spacing;
      const offset = (row * width + column) * 3;
      positions[offset] = x;
      const radius = Math.hypot(x, z);
      positions[offset + 1] = radius <= PRESERVED_CORE_RADIUS
        ? -0.57
        : sampleWorldGround(x, z) + OUTER_TERRAIN_RENDER_OFFSET;
      positions[offset + 2] = z;
    }
  }

  const indices: number[] = [];
  const outsideCore = (vertex: number): boolean => {
    const offset = vertex * 3;
    return Math.hypot(positions[offset], positions[offset + 2]) > PRESERVED_CORE_RADIUS;
  };
  for (let row = 0; row < segments; row += 1) {
    for (let column = 0; column < segments; column += 1) {
      const a = row * width + column;
      const b = a + 1;
      const d = a + width;
      const c = d + 1;
      if (outsideCore(a) || outsideCore(d) || outsideCore(b)) indices.push(a, d, b);
      if (outsideCore(b) || outsideCore(d) || outsideCore(c)) indices.push(b, d, c);
    }
  }
  return { positions, indices: new Uint32Array(indices), segments, spacing };
}

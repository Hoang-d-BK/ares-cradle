import type { RegionId, WorldPoint } from './worldRegions';

/**
 * Natural inspection proxies are the shared anchors for rendered landmarks, map symbols,
 * and science approach-distance calculations. Radius describes visible ground footprint;
 * interaction reach is owned by scienceInteraction.ts. Canonical science IDs remain stable.
 */
export interface NaturalInspectionProxy {
  readonly scienceId: string;
  readonly regionId: RegionId;
  readonly position: WorldPoint;
  readonly radius: number;
  readonly label: string;
}

const site = (scienceId: string, regionId: RegionId, x: number, z: number, radius: number, label: string): NaturalInspectionProxy => ({
  scienceId,
  regionId,
  position: Object.freeze({ x, z }),
  radius,
  label,
});

/** All fifteen original collection anchors plus visible, region-defining natural landmarks. */
const NATURAL_INSPECTION_PROXY_BASE: readonly NaturalInspectionProxy[] = [
  // Canonical specimens: positions exactly match WORLD_REGIONS.discoveries and the existing ledger.
  site('impact.science-1', 'impact', -272, -240, 1.8, 'Impact-shocked outcrop'),
  site('impact.science-2', 'impact', -240, -276, 1.8, 'Crater rim outcrop'),
  site('impact.science-3', 'impact', -218, -255, 1.8, 'Ejecta outcrop'),
  site('ice.science-1', 'ice', 272, -240, 1.8, 'Buried-ice scarp outcrop'),
  site('ice.science-2', 'ice', 240, -276, 1.8, 'Frosted layer outcrop'),
  site('ice.science-3', 'ice', 218, -255, 1.8, 'Fractured regolith comparison patch'),
  site('volcano.science-1', 'volcano', -272, 240, 1.8, 'Basalt flow outcrop'),
  site('volcano.science-2', 'volcano', -240, 276, 1.8, 'Cooled lava-channel outcrop'),
  site('volcano.science-3', 'volcano', -218, 255, 1.8, 'Ancient vent fissure outcrop'),
  site('lake.science-1', 'lake', 272, 240, 1.8, 'Dry-delta sediment outcrop'),
  site('lake.science-2', 'lake', 240, 276, 1.8, 'Layered sediment outcrop'),
  site('lake.science-3', 'lake', 218, 255, 1.8, 'Mineral-vein outcrop'),
  site('dust.science-1', 'dust', 30, -255, 1.8, 'Dust-devil deposit'),
  site('dust.science-2', 'dust', -32, -263, 1.8, 'Wind-sorted dust deposit'),
  site('dust.science-3', 'dust', 22, -285, 1.8, 'Wind-streak outcrop'),

  // Primary visible natural landforms, each explicitly bound to an existing science entry.
  site('impact.science-2', 'impact', -256, -257, 20, 'Impact crater rim and bowl'),
  site('ice.science-1', 'ice', 256, -258, 15, 'Buried-ice mantle scarp'),
  site('volcano.science-1', 'volcano', -247, 254, 24, 'Shield volcano and caldera'),
  site('volcano.science-2', 'volcano', -260, 262, 11, 'Cooled lava channel and tube mouth'),
  site('volcano.science-3', 'volcano', -247, 254, 4, 'Fissure vent teaching feature'),
  site('lake.science-2', 'lake', 270, 280, 17, 'Bedded sedimentary bluff'),
  site('lake.science-1', 'lake', 240, 240, 14, 'Dry braided delta apron'),
  site('dust.science-2', 'dust', 0, -255, 31, 'Wind-rippled dune field'),
];

/** Bounded natural boulder instances and their matching physical footprints. */
export interface NaturalRockProxy {
  readonly id: string;
  readonly regionId: RegionId;
  readonly position: WorldPoint;
  readonly radius: number;
  readonly height: number;
  readonly seed: number;
  readonly scienceId: string;
  readonly label: string;
}

type NaturalRockSeed = Omit<NaturalRockProxy, 'scienceId' | 'label'> & Partial<Pick<NaturalRockProxy, 'scienceId' | 'label'>>;

const NATURAL_ROCK_SCATTER_BASE: readonly NaturalRockSeed[] = [
  { id: 'impact-rock-1', regionId: 'impact', scienceId: 'impact.science-1', label: 'Impact-shocked boulder specimen', position: Object.freeze({ x: -281, z: -252 }), radius: 1.15, height: 0.9, seed: 11 },
  { id: 'impact-rock-2', regionId: 'impact', scienceId: 'impact.science-2', label: 'Crater ejecta boulder specimen', position: Object.freeze({ x: -281, z: -272 }), radius: 1.5, height: 1.15, seed: 23 },
  { id: 'impact-rock-3', regionId: 'impact', position: Object.freeze({ x: -238, z: -291 }), radius: 1.1, height: 0.8, seed: 37 },
  { id: 'impact-rock-4', regionId: 'impact', position: Object.freeze({ x: -231, z: -267 }), radius: 0.85, height: 0.72, seed: 41 },
  { id: 'ice-rock-1', regionId: 'ice', position: Object.freeze({ x: 281, z: -251 }), radius: 1.1, height: 0.85, seed: 17 },
  { id: 'ice-rock-2', regionId: 'ice', position: Object.freeze({ x: 281, z: -272 }), radius: 1.45, height: 1.1, seed: 29 },
  { id: 'ice-rock-3', regionId: 'ice', position: Object.freeze({ x: 237, z: -292 }), radius: 0.95, height: 0.75, seed: 43 },
  { id: 'ice-rock-4', regionId: 'ice', position: Object.freeze({ x: 230, z: -268 }), radius: 0.8, height: 0.65, seed: 53 },
  { id: 'volcano-rock-1', regionId: 'volcano', position: Object.freeze({ x: -278, z: 278 }), radius: 1.45, height: 1.1, seed: 19 },
  { id: 'volcano-rock-2', regionId: 'volcano', position: Object.freeze({ x: -277, z: 225 }), radius: 1.2, height: 0.95, seed: 31 },
  { id: 'volcano-rock-3', regionId: 'volcano', position: Object.freeze({ x: -218, z: 279 }), radius: 1.1, height: 0.85, seed: 47 },
  { id: 'volcano-rock-4', regionId: 'volcano', position: Object.freeze({ x: -221, z: 270 }), radius: 0.82, height: 0.7, seed: 59 },
  { id: 'lake-rock-1', regionId: 'lake', position: Object.freeze({ x: 282, z: 289 }), radius: 1.25, height: 0.9, seed: 13 },
  { id: 'lake-rock-2', regionId: 'lake', position: Object.freeze({ x: 286, z: 269 }), radius: 1.05, height: 0.85, seed: 27 },
  { id: 'lake-rock-3', regionId: 'lake', position: Object.freeze({ x: 258, z: 298 }), radius: 1.35, height: 1.05, seed: 39 },
  { id: 'lake-rock-4', regionId: 'lake', position: Object.freeze({ x: 229, z: 271 }), radius: 0.78, height: 0.65, seed: 61 },
  { id: 'dust-rock-1', regionId: 'dust', position: Object.freeze({ x: 27, z: -266 }), radius: 1.3, height: 0.92, seed: 7 },
  { id: 'dust-rock-2', regionId: 'dust', position: Object.freeze({ x: -29, z: -268 }), radius: 1.45, height: 1, seed: 21 },
  { id: 'dust-rock-3', regionId: 'dust', position: Object.freeze({ x: 39, z: -280 }), radius: 1.15, height: 0.88, seed: 33 },
  { id: 'dust-rock-4', regionId: 'dust', scienceId: 'dust.science-3', label: 'Wind-streak comparison boulder', position: Object.freeze({ x: -40, z: -244 }), radius: 0.9, height: 0.72, seed: 49 },
];

const ROCK_SCIENCE_BINDINGS: Readonly<Record<string, Pick<NaturalRockProxy, 'scienceId' | 'label'>>> = {
  'impact-rock-1': { scienceId: 'impact.science-1', label: 'Impact-shocked boulder specimen' },
  'impact-rock-2': { scienceId: 'impact.science-2', label: 'Crater ejecta boulder specimen' },
  'impact-rock-3': { scienceId: 'impact.science-3', label: 'Ejecta basalt boulder' },
  'impact-rock-4': { scienceId: 'impact.science-1', label: 'Impact-shocked ejecta fragment' },
  'ice-rock-1': { scienceId: 'ice.science-1', label: 'Mantled ice-scarp comparison rock' },
  'ice-rock-2': { scienceId: 'ice.science-2', label: 'Frosted ice-layer comparison rock' },
  'ice-rock-3': { scienceId: 'ice.science-3', label: 'Fractured regolith comparison rock' },
  'ice-rock-4': { scienceId: 'ice.science-2', label: 'Pale mantle comparison rock' },
  'volcano-rock-1': { scienceId: 'volcano.science-1', label: 'Basalt shield boulder' },
  'volcano-rock-2': { scienceId: 'volcano.science-2', label: 'Cooled lava-channel boulder' },
  'volcano-rock-3': { scienceId: 'volcano.science-3', label: 'Ancient vent comparison boulder' },
  'volcano-rock-4': { scienceId: 'volcano.science-2', label: 'Basalt flow-fragment comparison' },
  'lake-rock-1': { scienceId: 'lake.science-1', label: 'Dry-delta sediment fragment' },
  'lake-rock-2': { scienceId: 'lake.science-2', label: 'Bedded sediment comparison rock' },
  'lake-rock-3': { scienceId: 'lake.science-3', label: 'Mineral-bearing comparison rock' },
  'lake-rock-4': { scienceId: 'lake.science-2', label: 'Eroded bedding fragment' },
  'dust-rock-1': { scienceId: 'dust.science-1', label: 'Dust-devil deposit rock' },
  'dust-rock-2': { scienceId: 'dust.science-2', label: 'Wind-sorted dust rock' },
  'dust-rock-3': { scienceId: 'dust.science-3', label: 'Wind-streak outcrop fragment' },
  'dust-rock-4': { scienceId: 'dust.science-3', label: 'Wind-streak comparison boulder' },
};

export const NATURAL_ROCK_SCATTER: readonly NaturalRockProxy[] = Object.freeze(NATURAL_ROCK_SCATTER_BASE.map((rock) => {
  const binding = ROCK_SCIENCE_BINDINGS[rock.id];
  if (!binding) throw new Error(`Missing science binding for natural rock ${rock.id}`);
  return { ...rock, ...binding };
}));

export const NATURAL_LANDMARK_SUPPORTS = Object.freeze([
  { id: 'natural-ice-scarp', regionId: 'ice' as const, scienceId: 'ice.science-1', position: Object.freeze({ x: 256, z: -258 }), halfX: 10.8, halfZ: 6.2, rotationY: -0.18, height: 2.15, label: 'Exposed ice-bearing scarp' },
] as const);

export const NATURAL_INSPECTION_PROXIES: readonly NaturalInspectionProxy[] = Object.freeze([
  ...NATURAL_INSPECTION_PROXY_BASE,
  ...NATURAL_ROCK_SCATTER.map((rock) => site(rock.scienceId, rock.regionId, rock.position.x, rock.position.z, rock.radius, rock.label)),
]);

/** Largest shared visible proxy per sector for concise map symbol/label selection. */
export const PRIMARY_NATURAL_LANDMARKS: readonly NaturalInspectionProxy[] = Object.freeze(
  (['impact', 'ice', 'volcano', 'lake', 'dust'] as const).map((regionId) => {
    const candidates = NATURAL_INSPECTION_PROXIES.filter((proxy) => proxy.regionId === regionId);
    return candidates.reduce((largest, proxy) => proxy.radius > largest.radius ? proxy : largest);
  }),
);

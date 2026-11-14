import type { RegionDefinition, RegionId } from './contract';
import { REGIONS } from './contentPack';
export { REGIONS, SOURCES, prepareMissionContent } from './contentPack';

export const REGION_IDS: RegionId[] = ['impact', 'dust', 'volcano', 'ice', 'lake'];

export const regionById = (id: RegionId): RegionDefinition =>
  REGIONS.find((region) => region.id === id) ?? REGIONS[0];

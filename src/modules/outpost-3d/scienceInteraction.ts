import type { ScientificElement } from './scienceCatalog';
import { NATURAL_INSPECTION_PROXIES, type NaturalInspectionProxy } from './naturalSiteDefinitions';
import { getRegionByPosition, sampleWorldGround, type RegionId } from './worldRegions';

export const SCIENCE_INTERACTION_RANGE = 4.5;
export const SCIENCE_GROUNDED_HEIGHT_TOLERANCE = 2.5;

export type SciencePose = readonly [number, number, number];

export interface ScienceActorOptions {
  readonly isRemote: boolean;
  readonly remoteRegionId: RegionId | null;
  readonly grounded: boolean;
}

export interface ScientificInspectionCandidate {
  readonly element: ScientificElement;
  readonly proxy: NaturalInspectionProxy;
  /** Horizontal distance to the visible footprint edge, not to an invisible point. */
  readonly distance: number;
}

export type ScientificInspectionError = 'invalid-context' | 'not-grounded' | 'wrong-region' | 'too-far-from-element' | 'unknown-element';

function validActorContext(pose: SciencePose, options: ScienceActorOptions): ScientificInspectionError | null {
  if (!Array.isArray(pose) || pose.length !== 3 || !pose.every(Number.isFinite) || !options ||
      typeof options.isRemote !== 'boolean' || typeof options.grounded !== 'boolean' ||
      (options.remoteRegionId !== null && !['impact', 'ice', 'volcano', 'lake', 'dust'].includes(options.remoteRegionId))) {
    return 'invalid-context';
  }
  if (options.isRemote ? options.remoteRegionId === null : options.remoteRegionId !== null) return 'invalid-context';
  if (!options.grounded) return 'not-grounded';
  const [x, y, z] = pose;
  const sampledGround = sampleWorldGround(x, z);
  if (!Number.isFinite(sampledGround) || Math.abs(y - sampledGround) > SCIENCE_GROUNDED_HEIGHT_TOLERANCE) return 'not-grounded';
  const actualRegion = getRegionByPosition(x, z).id;
  if (actualRegion === 'home' || (options.isRemote && options.remoteRegionId !== actualRegion)) return 'wrong-region';
  return null;
}

function isCloserProxy(
  candidate: Omit<ScientificInspectionCandidate, 'element'>,
  current: Omit<ScientificInspectionCandidate, 'element'>,
  pose: SciencePose,
): boolean {
  if (candidate.distance !== current.distance) return candidate.distance < current.distance;
  if (candidate.distance === 0 && candidate.proxy.radius !== current.proxy.radius) {
    return candidate.proxy.radius < current.proxy.radius;
  }
  const candidateCenterDistance = Math.hypot(pose[0] - candidate.proxy.position.x, pose[2] - candidate.proxy.position.z);
  const currentCenterDistance = Math.hypot(pose[0] - current.proxy.position.x, pose[2] - current.proxy.position.z);
  return candidateCenterDistance < currentCenterDistance;
}

function preferSpecificNearbyProxy(
  candidate: Omit<ScientificInspectionCandidate, 'element'>,
  current: Omit<ScientificInspectionCandidate, 'element'>,
  pose: SciencePose,
): boolean {
  const candidateIsLocal = candidate.proxy.radius < current.proxy.radius && current.distance === 0 &&
    candidate.distance <= SCIENCE_INTERACTION_RANGE;
  const currentIsLocal = current.proxy.radius < candidate.proxy.radius && candidate.distance === 0 &&
    current.distance <= SCIENCE_INTERACTION_RANGE;
  if (candidateIsLocal || currentIsLocal) return candidateIsLocal;
  return isCloserProxy(candidate, current, pose);
}

function nearestProxy(element: ScientificElement, pose: SciencePose): Omit<ScientificInspectionCandidate, 'element'> | null {
  let nearest: Omit<ScientificInspectionCandidate, 'element'> | null = null;
  for (const proxy of NATURAL_INSPECTION_PROXIES) {
    if (proxy.scienceId !== element.id || proxy.regionId !== element.regionId ||
        !Number.isFinite(proxy.radius) || proxy.radius < 0) continue;
    const centerDistance = Math.hypot(pose[0] - proxy.position.x, pose[2] - proxy.position.z);
    const result = { proxy, distance: Math.max(0, centerDistance - proxy.radius) };
    if (!nearest || preferSpecificNearbyProxy(result, nearest, pose)) nearest = result;
  }
  return nearest;
}

export function validateScientificInspection(
  element: ScientificElement | undefined,
  pose: SciencePose,
  options: ScienceActorOptions,
): ScientificInspectionError | null {
  if (!element) return 'unknown-element';
  const contextError = validActorContext(pose, options);
  if (contextError) return contextError;
  if (getRegionByPosition(pose[0], pose[2]).id !== element.regionId ||
      (options.isRemote && options.remoteRegionId !== element.regionId)) return 'wrong-region';
  const nearest = nearestProxy(element, pose);
  if (!nearest || nearest.distance > SCIENCE_INTERACTION_RANGE + 1e-9) return 'too-far-from-element';
  return null;
}

export function canInspectScientificElement(
  element: ScientificElement | undefined,
  pose: SciencePose,
  options: ScienceActorOptions,
): boolean {
  return validateScientificInspection(element, pose, options) === null;
}

/** One shared live selector for the HTML prompt, F-key route, scene hints, and store. */
export function getScientificInspectionCandidate(
  elements: readonly ScientificElement[],
  pose: SciencePose,
  options: ScienceActorOptions,
): ScientificInspectionCandidate | null {
  if (!Array.isArray(elements) || validActorContext(pose, options)) return null;
  const actualRegion = getRegionByPosition(pose[0], pose[2]).id;
  let nearest: ScientificInspectionCandidate | null = null;
  for (const element of elements) {
    if (element.regionId !== actualRegion || (options.isRemote && element.regionId !== options.remoteRegionId)) continue;
    const result = nearestProxy(element, pose);
    if (!result) continue;
    if (!nearest || preferSpecificNearbyProxy(result, nearest, pose)) nearest = { element, ...result };
  }
  return nearest && nearest.distance <= SCIENCE_INTERACTION_RANGE + 1e-9 ? nearest : null;
}

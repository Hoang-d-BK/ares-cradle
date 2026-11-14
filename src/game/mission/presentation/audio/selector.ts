/** Pure selector for quiet device-feedback sonification, not Mars/environment audio. */
import { REGION_IDS, regionById } from '../../content';
import type { MissionState, Pose, RegionId } from '../../contract';
import { isActivityProgressValid, type LakeProgress } from '../../activities/rules';

export type MissionAudioCue = 'leo-step' | 'rover-step' | 'observation' | 'branch' | 'operation' | 'report';
export const MISSION_AUDIO_STEP_DISTANCE = 3.5;

export interface MissionAudioSelection {
  cues: MissionAudioCue[];
  movementRemainder: number;
}

const validPose = (pose: Pose | undefined): pose is Pose =>
  pose !== undefined && Number.isFinite(pose.x) && Number.isFinite(pose.z);

const actorDistance = (prev: MissionState, next: MissionState): number => {
  if (prev.activeRover !== next.activeRover) return 0;
  const before = prev.activeRover === null ? prev.leo : prev.rovers[prev.activeRover];
  const after = next.activeRover === null ? next.leo : next.rovers[next.activeRover];
  if (!validPose(before) || !validPose(after)) return 0;
  const distance = Math.hypot(after.x - before.x, after.z - before.z);
  // Ignore fast-travel/teleport jumps; accepted walking and rover steps are much smaller.
  return Number.isFinite(distance) && distance <= 8 ? distance : 0;
};

const validEvidenceList = (region: RegionId, value: unknown, kind: 'observations' | 'branches'): value is string[] => {
  if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) return false;
  const allowed = new Set(regionById(region)[kind].map((item) => item.id));
  return value.every((id) => allowed.has(id)) && new Set(value).size === value.length;
};

const hasNewEvidence = (prev: MissionState, next: MissionState, kind: 'observations' | 'branches'): boolean => {
  for (const region of REGION_IDS) {
    const before = prev.surveys?.[region]?.[kind];
    const after = next.surveys?.[region]?.[kind];
    if (!validEvidenceList(region, before, kind) || !validEvidenceList(region, after, kind)) continue;
    const oldIds = new Set(before);
    if (after.some((id) => !oldIds.has(id))) return true;
  }
  return false;
};

const hasNewOperation = (prev: MissionState, next: MissionState): boolean =>
  REGION_IDS.some((region) => {
    const before = prev.surveys?.[region]?.operation;
    const after = next.surveys?.[region]?.operation;
    return before === null && typeof after === 'string' && regionById(region).operations.some((item) => item.id === after);
  });

const hasNewLakeCapture = (prev: MissionState, next: MissionState): boolean => {
  for (const region of REGION_IDS) {
    if (region !== 'lake' || prev.surveys?.[region]?.activityProgress === next.surveys?.[region]?.activityProgress) continue;
    const before = prev.surveys?.[region]?.activityProgress;
    const after = next.surveys?.[region]?.activityProgress;
    if (!isActivityProgressValid(region, before) || !isActivityProgressValid(region, after)) continue;
    const oldProgress = before as LakeProgress;
    const newProgress = after as LakeProgress;
    for (const target of Object.keys(newProgress.captures) as Array<keyof LakeProgress['captures']>) {
      const oldEvidence = oldProgress.captures[target];
      const newEvidence = newProgress.captures[target];
      if (oldEvidence && newEvidence && (
        (oldEvidence.wide === null && newEvidence.wide !== null) ||
        (oldEvidence.close === null && newEvidence.close !== null) ||
        (oldEvidence.location === null && newEvidence.location !== null)
      )) return true;
    }
  }
  return false;
};

const hasNewReport = (prev: MissionState, next: MissionState): boolean =>
  REGION_IDS.some((region) => prev.bases?.[region]?.report === false && next.bases?.[region]?.report === true);

/** Detects only accepted pose/evidence/operation/report transitions; never replays baseline state. */
export function selectMissionAudio(
  prev: MissionState,
  next: MissionState,
  movementRemainder = 0,
): MissionAudioSelection {
  const remainder = Number.isFinite(movementRemainder) && movementRemainder >= 0
    ? movementRemainder % MISSION_AUDIO_STEP_DISTANCE
    : 0;
  const totalDistance = remainder + actorDistance(prev, next);
  const moved = totalDistance >= MISSION_AUDIO_STEP_DISTANCE;
  const nextRemainder = moved ? totalDistance % MISSION_AUDIO_STEP_DISTANCE : totalDistance;

  let cue: MissionAudioCue | undefined;
  if (hasNewReport(prev, next)) cue = 'report';
  else if (hasNewOperation(prev, next)) cue = 'operation';
  else if (hasNewEvidence(prev, next, 'observations')) cue = 'observation';
  else if (hasNewEvidence(prev, next, 'branches') || hasNewLakeCapture(prev, next)) cue = 'branch';
  else if (moved) cue = next.activeRover === null ? 'leo-step' : 'rover-step';

  return { cues: cue ? [cue] : [], movementRemainder: nextRemainder };
}

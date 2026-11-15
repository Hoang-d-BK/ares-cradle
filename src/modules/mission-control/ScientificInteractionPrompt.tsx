import React, { useCallback, useEffect, useMemo } from 'react';
import { SCIENTIFIC_ELEMENTS, type ScientificElement } from '@/modules/outpost-3d/scienceCatalog';
import { getScientificInspectionCandidate, SCIENCE_INTERACTION_RANGE, type ScienceActorOptions } from '@/modules/outpost-3d/scienceInteraction';
import { WORLD_REGIONS, getRegionByPosition, type RegionId } from '@/modules/outpost-3d/worldRegions';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

export { SCIENCE_INTERACTION_RANGE };
export const REGIONAL_SCOUT_RANGE = 18;

type Pose = readonly [number, number, number];

/** Backward-compatible wrapper; all live candidate rules live in scienceInteraction.ts. */
export function nearestScientificElement(
  elements: readonly ScientificElement[],
  pose: Pose,
  options: ScienceActorOptions,
): ScientificElement | null {
  return getScientificInspectionCandidate(elements, pose, options)?.element ?? null;
}

export function isScientificKeyTarget(target: EventTarget | null): boolean {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return false;
  return Boolean(target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]'));
}

function hasBlockingOverlay(): boolean {
  const state = useOutpostStore.getState();
  const storeBlocks = Boolean(state.isBackpackOpen || state.isManualOpen || state.isDatapadOpen || state.isClassroomOpen ||
    state.isBrownoutQuizOpen || state.isCelebrationOpen || state.isVictory || state.isGameOver || state.activeScienceEntryId !== null);
  return storeBlocks || (typeof document !== 'undefined' && Boolean(document.querySelector('[role="dialog"]')));
}

function liveCandidate() {
  const state = useOutpostStore.getState();
  const pose = state.isDrivingRover ? state.roverPos : state.playerPos;
  return getScientificInspectionCandidate(SCIENTIFIC_ELEMENTS, pose, {
    isRemote: state.isDrivingRover,
    remoteRegionId: state.remoteRegionId,
    grounded: state.isDrivingRover || state.isPlayerGrounded,
  });
}

function nearestConsole(pose: Pose, isRemote: boolean, remoteRegionId: RegionId | null, grounded: boolean, activeBases: readonly RegionId[]) {
  if (isRemote || !grounded || remoteRegionId !== null || activeBases.length === 0) return null;
  const actualRegion = getRegionByPosition(pose[0], pose[2]).id;
  if (actualRegion === 'home') return null;
  let result: (typeof WORLD_REGIONS)[number] | null = null;
  let best = REGIONAL_SCOUT_RANGE;
  for (const region of WORLD_REGIONS) {
    if (region.id !== actualRegion || !activeBases.includes(region.id)) continue;
    const distance = Math.hypot(pose[0] - region.baseConsole.x, pose[2] - region.baseConsole.z);
    if (distance <= best) { best = distance; result = region; }
  }
  return result;
}

/** One shared field route for nearby HTML controls and the F-key action. */
export const ScientificInteractionPrompt: React.FC = () => {
  const playerPos = useOutpostStore((state) => state.playerPos);
  const roverPos = useOutpostStore((state) => state.roverPos);
  const grounded = useOutpostStore((state) => state.isPlayerGrounded);
  const isRemote = useOutpostStore((state) => state.isDrivingRover);
  const remoteRegionId = useOutpostStore((state) => state.remoteRegionId);
  const isBackpackOpen = useOutpostStore((state) => state.isBackpackOpen);
  const isManualOpen = useOutpostStore((state) => state.isManualOpen);
  const isDatapadOpen = useOutpostStore((state) => state.isDatapadOpen);
  const isClassroomOpen = useOutpostStore((state) => state.isClassroomOpen);
  const isBrownoutQuizOpen = useOutpostStore((state) => state.isBrownoutQuizOpen);
  const activeScienceEntryId = useOutpostStore((state) => state.activeScienceEntryId);
  const expeditionProgress = useOutpostStore((state) => state.expeditionProgress);
  const activeBases = useMemo(() => WORLD_REGIONS.filter((region) => expeditionProgress.bases[region.id].active).map(({ id }) => id), [expeditionProgress]);
  const pose = isRemote ? roverPos : playerPos;
  const nearest = useMemo(() => getScientificInspectionCandidate(SCIENTIFIC_ELEMENTS, pose, {
    isRemote,
    remoteRegionId,
    grounded: isRemote || grounded,
  }), [pose, isRemote, remoteRegionId, grounded]);
  const consoleRegion = useMemo(() => nearestConsole(pose, isRemote, remoteRegionId, isRemote || grounded, activeBases), [pose, isRemote, remoteRegionId, grounded, activeBases]);
  const modalOpen = isBackpackOpen || isManualOpen || isDatapadOpen || isClassroomOpen || isBrownoutQuizOpen ||
    activeScienceEntryId !== null || hasBlockingOverlay();

  const inspect = useCallback((id: string) => {
    if (hasBlockingOverlay()) return;
    const candidate = liveCandidate();
    if (!candidate || candidate.element.id !== id) return;
    useOutpostStore.getState().inspectScientificElement(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'KeyF' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.defaultPrevented || isScientificKeyTarget(event.target) || hasBlockingOverlay()) return;
      const candidate = liveCandidate();
      if (!candidate) return;
      event.preventDefault();
      useOutpostStore.getState().inspectScientificElement(candidate.element.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return <>
    {!modalOpen && (nearest || (!isRemote && consoleRegion)) && <div
      data-testid="scientific-interaction-prompt"
      className="pointer-events-auto fixed bottom-[19rem] left-1/2 z-[55] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 lg:bottom-[13rem]"
      role="status"
    >
      {nearest ? <button type="button" data-testid="inspect-science-button" aria-label={`Inspect ${nearest.proxy.label} with F`} onClick={() => inspect(nearest.element.id)} className="min-h-12 min-w-[min(92vw,20rem)] rounded-lg border border-[#d4c29d]/65 bg-[#171a1c]/98 px-4 py-2 text-left text-base font-medium text-[#f1e1d3] shadow-[0_5px_18px_rgba(0,0,0,.45)] hover:border-[#d4c29d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 touch-manipulation">
        <span className="mr-2 inline-flex h-7 min-w-7 items-center justify-center rounded border border-[#d4c29d]/60 bg-[#302a22] px-1 font-semibold text-[#f0d7a4]">F</span>
        Inspect — <span className="font-semibold">{nearest.proxy.label}</span>
      </button> : <button type="button" onClick={() => useOutpostStore.getState().toggleDrivingRover()} className="min-h-12 min-w-[min(92vw,18rem)] rounded-lg border border-[#d4c29d]/45 bg-[#171a1c]/98 px-4 py-2 text-left text-base text-[#f1e1d3] shadow-[0_5px_18px_rgba(0,0,0,.4)] hover:border-[#d4c29d]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 touch-manipulation">
        <span className="mr-2 inline-flex h-7 min-w-7 items-center justify-center rounded border border-[#d4c29d]/55 bg-[#302a22] px-1 font-semibold text-[#f0d7a4]">R</span>
        Control regional rover <span className="font-semibold">{consoleRegion!.name}</span>
      </button>}
    </div>}
  </>;
};

export default ScientificInteractionPrompt;

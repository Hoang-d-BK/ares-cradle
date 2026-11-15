import React, { useEffect, useState } from 'react';
import { getRegionByPosition, WORLD_REGIONS, type RegionId } from '@/modules/outpost-3d/worldRegions';
import { SCIENTIFIC_ELEMENTS } from '@/modules/outpost-3d/scienceCatalog';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import BackpackModal from '@/modules/survival-ui/BackpackModal';
import ClassroomModal from '@/modules/survival-ui/ClassroomModal';
import VirtualJoystick from '@/modules/character/VirtualJoystick';
import LabShowcaseModal from '@/modules/showcase/LabShowcaseModal';
import MinimapRadar from '@/modules/story-engine/components/MinimapRadar';
import ExplorationHUD from './ExplorationHUD';
import QuickControlsManual from './QuickControlsManual';
import ExplorationMap from './ExplorationMap';
import ScienceCodex from './ScienceCodex';
import type { SceneReadiness } from '@/modules/outpost-3d/sceneReadiness';

export interface MissionControlOverlayProps {
  sceneReadiness?: SceneReadiness;
}

export const MissionControlOverlay: React.FC<MissionControlOverlayProps> = ({ sceneReadiness = 'idle' }) => {
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isTouchOrMobile, setIsTouchOrMobile] = useState<boolean>(() => typeof window !== 'undefined' && (
    window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches
  ));

  useEffect(() => {
    const width = window.matchMedia('(max-width: 1023px)');
    const pointer = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouchOrMobile(window.innerWidth < 1024 || width.matches || pointer.matches);
    update();
    window.addEventListener('resize', update);
    width.addEventListener('change', update);
    pointer.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      width.removeEventListener('change', update);
      pointer.removeEventListener('change', update);
    };
  }, []);

  const exploration = useOutpostStore((state) => state.exploration);
  const explorationWarning = useOutpostStore((state) => state.explorationWarning);
  const explorationNotice = useOutpostStore((state) => state.explorationNotice);
  const dismissExplorationNotice = useOutpostStore((state) => state.dismissExplorationNotice);
  const activeScienceEntryId = useOutpostStore((state) => state.activeScienceEntryId);
  const openScienceEntry = useOutpostStore((state) => state.openScienceEntry);
  const isManualOpen = useOutpostStore((state) => state.isManualOpen);
  const setManualOpen = useOutpostStore((state) => state.setManualOpen);
  const playerPos = useOutpostStore((state) => state.playerPos);
  const roverPos = useOutpostStore((state) => state.roverPos);
  const remoteRegionId = useOutpostStore((state) => state.remoteRegionId);
  const isDrivingRover = useOutpostStore((state) => state.isDrivingRover);
  const cameraYaw = useOutpostStore((state) => state.cameraYaw);
  const activeWaypointRegionId = useOutpostStore((state) => state.activeWaypointRegionId);
  const setWaypointRegion = useOutpostStore((state) => state.setWaypointRegion);
  const openBackpack = useOutpostStore((state) => state.openBackpack);
  const isClassroomOpen = useOutpostStore((state) => state.isClassroomOpen);
  const closeClassroom = useOutpostStore((state) => state.closeClassroom);
  const isPhysicsDebugVisible = useOutpostStore((state) => state.isPhysicsDebugVisible);
  const togglePhysicsDebug = useOutpostStore((state) => state.togglePhysicsDebug);
  const hudColorTheme = useOutpostStore((state) => state.hudColorTheme);
  const cycleHudColorTheme = useOutpostStore((state) => state.cycleHudColorTheme);
  const manualOpen = useOutpostStore((state) => state.isManualOpen);

  useEffect(() => { document.documentElement.setAttribute('data-hud-theme', hudColorTheme); }, [hudColorTheme]);
  useEffect(() => { if (activeScienceEntryId) setIsCodexOpen(true); }, [activeScienceEntryId]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]') || manualOpen) return;
      const key = event.key.toLowerCase();
      if (key === 'm') { event.preventDefault(); setIsMapOpen((open) => !open); }
      else if (key === 'g') { event.preventDefault(); setIsCodexOpen((open) => !open); }
      else if (key === '?' || (key === '/' && event.shiftKey)) { event.preventDefault(); setManualOpen(true); }
      else if (event.key === 'F2') { event.preventDefault(); setIsShowcaseOpen((open) => !open); }
      else if (key === 'b') { togglePhysicsDebug(); }
      else if (key === 't') { cycleHudColorTheme(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setManualOpen, togglePhysicsDebug, cycleHudColorTheme, manualOpen]);

  const currentPosition = isDrivingRover && remoteRegionId ? roverPos : playerPos;
  const [x, , z] = currentPosition;
  const actualRegion = isDrivingRover && remoteRegionId ? remoteRegionId : getRegionByPosition(x, z).id;
  const region = actualRegion === 'home' ? undefined : WORLD_REGIONS.find((candidate) => candidate.id === actualRegion);
  const goalRegion = WORLD_REGIONS.find((candidate) => candidate.id === activeWaypointRegionId);
  const regionEntries = SCIENTIFIC_ELEMENTS.filter((entry) => entry.regionId === activeWaypointRegionId);
  const foundInGoal = regionEntries.filter((entry) => exploration.collected.includes(entry.id)).length;
  const currentRegionEntries = SCIENTIFIC_ELEMENTS.filter((entry) => entry.regionId === actualRegion);
  const currentRegionFound = currentRegionEntries.filter((entry) => exploration.collected.includes(entry.id)).length;
  const task = actualRegion === activeWaypointRegionId
    ? currentRegionFound < currentRegionEntries.length ? `Explore ${region?.name ?? 'the field'}` : `Surveyed ${region?.name ?? 'the field'}`
    : `Visit ${goalRegion?.name ?? 'the waypoint'}`;
  const taskProgress = actualRegion === activeWaypointRegionId
    ? { current: currentRegionFound, required: currentRegionEntries.length }
    : { current: foundInGoal, required: regionEntries.length };
  const distance = goalRegion ? Math.hypot(x - goalRegion.baseConsole.x, z - goalRegion.baseConsole.z) : undefined;
  const notice = explorationNotice ?? explorationWarning;
  const activeRegionId = (actualRegion === 'home' ? activeWaypointRegionId : actualRegion) as RegionId;

  const startExploring = () => setManualOpen(false);

  return (
    <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
      <ExplorationHUD
        task={task}
        taskProgress={taskProgress}
        regionName={region?.name ?? 'ELON MARS'}
        distance={distance}
        air={exploration.survival.air}
        meals={exploration.survival.meals}
        energyEU={exploration.survival.energyEU}
        onBackpack={openBackpack}
        onMap={() => setIsMapOpen(true)}
        onCodex={() => setIsCodexOpen(true)}
        onHelp={() => setManualOpen(true)}
        remote={isDrivingRover}
        onExitRemote={() => useOutpostStore.getState().toggleDrivingRover()}
        notice={notice}
        onDismissNotice={() => { if (explorationNotice) dismissExplorationNotice(); }}
      />
      {!isManualOpen && <MinimapRadar />}
      {isTouchOrMobile && !isDrivingRover && !isManualOpen && <div className="pointer-events-auto absolute bottom-16 right-3"><VirtualJoystick /></div>}
      {isPhysicsDebugVisible && <div data-testid="physics-hitbox-legend" className="pointer-events-auto absolute left-3 top-16 rounded-md border border-cyan-100/20 bg-[#131719]/90 px-2 py-1 text-xs text-cyan-100">Physics debug · [{playerPos.map((value) => value.toFixed(1)).join(', ')}]</div>}

      <QuickControlsManual isOpen={isManualOpen} onStart={startExploring} onClose={() => setManualOpen(false)} sceneReadiness={sceneReadiness} />
      <ExplorationMap isOpen={isMapOpen} playerPos={currentPosition} cameraYaw={cameraYaw} activeRegionId={actualRegion} activeWaypointRegionId={activeWaypointRegionId} onSetWaypoint={setWaypointRegion} onClose={() => setIsMapOpen(false)} />
      <ScienceCodex
        isOpen={isCodexOpen}
        entries={SCIENTIFIC_ELEMENTS}
        collectedIds={exploration.collected}
        selectedEntryId={activeScienceEntryId}
        activeRegionId={activeRegionId}
        onSelect={openScienceEntry}
        onClose={() => { setIsCodexOpen(false); openScienceEntry(null); }}
      />

      <BackpackModal />
      <ClassroomModal isOpen={isClassroomOpen} onClose={closeClassroom} />
      <LabShowcaseModal isOpen={isShowcaseOpen} onClose={() => setIsShowcaseOpen(false)} />
    </div>
  );
};

export default MissionControlOverlay;

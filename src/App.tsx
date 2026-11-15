import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import {
  EMPTY_STARTUP_MILESTONES,
  STARTUP_MILESTONES,
  type SceneReadiness,
  type StartupMilestones,
} from '@/modules/outpost-3d/sceneReadiness';
import MarsCanvas from '@/modules/outpost-3d/MarsCanvas';
import MissionControlOverlay from '@/modules/mission-control/MissionControlOverlay';
import OriginalEntryFlow from '@/modules/mission-control/OriginalEntryFlow';
import { startGameplay, useGameplayStarted } from '@/modules/session/gameSession';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

const RoverReview = lazy(() => import('./game/review/RoverReview'));

export const App: React.FC = () => {
  const [sceneReadiness, setSceneReadiness] = useState<SceneReadiness>('idle');
  const [milestones, setMilestones] = useState<StartupMilestones>(EMPTY_STARTUP_MILESTONES);
  const [showEntry, setShowEntry] = useState(true);
  const [entryClosing, setEntryClosing] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const gameplayStarted = useGameplayStarted();
  const setManualOpen = useOutpostStore((state) => state.setManualOpen);
  const handleSceneReadinessChange = useCallback((readiness: SceneReadiness) => {
    setSceneReadiness((current) => current === readiness ? current : readiness);
  }, []);
  const handleMilestonesChange = useCallback((next: StartupMilestones) => {
    setMilestones((current) => current === next || STARTUP_MILESTONES.every(({ id }) => current[id] === next[id]) ? current : next);
  }, []);
  const handleStart = useCallback(() => {
    if (sceneReadiness !== 'ready' || !STARTUP_MILESTONES.every(({ id }) => milestones[id])) return;
    startGameplay();
    setManualOpen(false);
    setControlsOpen(false);
  }, [milestones, sceneReadiness, setManualOpen]);

  useEffect(() => {
    if (!gameplayStarted) return;
    setEntryClosing(true);
    const timeout = window.setTimeout(() => setShowEntry(false), 240);
    return () => window.clearTimeout(timeout);
  }, [gameplayStarted]);

  const query = new URLSearchParams(window.location.search);
  if (query.get('review') === 'rover') {
    return <Suspense fallback={<p role="status">Loading field rover…</p>}><RoverReview /></Suspense>;
  }
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-mars-charcoal bg-grid-telemetry font-sans">
      {/* 3D Diorama Canvas */}
      <MarsCanvas
        onSceneReadinessChange={handleSceneReadinessChange}
        onStartupMilestonesChange={handleMilestonesChange}
      />

      {/* Hallmark Mission Control Tactical HUD */}
      {gameplayStarted && <MissionControlOverlay sceneReadiness={sceneReadiness} />}
      {showEntry && (
        <OriginalEntryFlow
          milestones={milestones}
          sceneReadiness={sceneReadiness}
          controlsOpen={controlsOpen}
          onStart={handleStart}
          onRetry={() => window.location.reload()}
          onOpenControls={() => setControlsOpen(true)}
          onCloseControls={() => setControlsOpen(false)}
          onStartFromGuide={handleStart}
          isClosing={entryClosing && !controlsOpen}
        />
      )}
    </main>
  );
};

export default App;

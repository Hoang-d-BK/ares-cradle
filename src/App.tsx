import React, { useCallback, useEffect, useState } from 'react';
import MarsCanvas from '@/modules/outpost-3d/MarsCanvas';
import MissionControlOverlay from '@/modules/mission-control/MissionControlOverlay';
import { OpeningStep } from '@/modules/outpost-3d/OpeningSequence3D';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { TactileHUD } from '@/game/mission/ui/TactileHUD';
import { MissionModalManager } from '@/game/mission/ui/MissionModalManager';
import { soundEngine } from '@/modules/audio/soundEngine';

export const App: React.FC = () => {
  const [openingStep, setOpeningStep] = useState<OpeningStep>('landing');
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getIsMuted());

  const setRoverPos = useOutpostStore((state) => state.setRoverPos);
  const setPlayerPos = useOutpostStore((state) => state.setPlayerPos);
  const toggleDrivingRover = useOutpostStore((state) => state.toggleDrivingRover);
  const startSimulation = useOutpostStore((state) => state.startSimulation);
  const pauseSimulation = useOutpostStore((state) => state.pauseSimulation);

  useEffect(() => {
    pauseSimulation();
  }, [pauseSimulation]);

  const positionRoverAtLander = useCallback(() => {
    setRoverPos([0, -0.32, 8.5]);
    setPlayerPos([0, -0.4, 8.5]);
  }, [setPlayerPos, setRoverPos]);

  const advanceOpening = useCallback(() => {
    if (openingStep === 'briefing') {
      setPlayerPos([0, -0.4, 8.5]);
      toggleDrivingRover();
      setOpeningStep('complete');
      startSimulation();
    }
  }, [openingStep, setPlayerPos, startSimulation, toggleDrivingRover]);

  const skipOpening = useCallback(() => {
    positionRoverAtLander();
    setOpeningStep('briefing');
  }, [positionRoverAtLander]);

  const handleToggleSound = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-mars-charcoal bg-grid-telemetry font-sans">
      {/* 3D Diorama Canvas */}
      <MarsCanvas
        openingStep={openingStep}
        onLanded={() => setOpeningStep((step) => (step === 'landing' ? 'briefing' : step))}
      />

      {/* Opening Cinematic and Briefing Overlay */}
      {openingStep !== 'complete' && (
        <MissionControlOverlay
          openingStep={openingStep}
          onOpeningAdvance={advanceOpening}
          onOpeningSkip={skipOpening}
        />
      )}

      {/* Five Frontiers Tactile Junior Mission Control HUD */}
      {openingStep === 'complete' && (
        <>
          <TactileHUD onToggleSound={handleToggleSound} isMuted={isMuted} />
          <MissionModalManager />
        </>
      )}
    </main>
  );
};

export default App;

import React from 'react';
import MarsCanvas from '@/modules/outpost-3d/MarsCanvas';
import MissionControlOverlay from '@/modules/mission-control/MissionControlOverlay';

export const App: React.FC = () => {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-mars-charcoal bg-grid-telemetry font-sans">
      {/* 3D Diorama Canvas */}
      <MarsCanvas />

      {/* Hallmark Mission Control Tactical HUD */}
      <MissionControlOverlay />
    </main>
  );
};

export default App;

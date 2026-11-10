import React, { useRef } from 'react';

export interface AsteroidSmashArcadeProps {
  className?: string;
  sourceUrl?: string;
  onGameOver?: (score: number) => void;
}

/**
 * Retro Space Defense Arcade Mini-Game
 * Features 2D Canvas shooting physics, asteroid splits, and emergency Space Quiz lifelines
 */
export const AsteroidSmashArcade: React.FC<AsteroidSmashArcadeProps> = ({
  className = 'w-full h-[600px] rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl relative',
  sourceUrl = '/AsteroidSmash/index.html',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className={`relative bg-black ${className}`}>
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          <span className="font-mono text-xs font-bold tracking-wider text-amber-300 uppercase">
            Ares Defense: Asteroid Smash Training Simulation
          </span>
        </div>
        <span className="text-[11px] font-mono text-gray-400">
          [M] Mute • [Arrow Keys / WASD] Move • [Space] Fire
        </span>
      </div>

      <iframe
        ref={iframeRef}
        src={sourceUrl}
        className="w-full h-full border-0"
        title="Asteroid Smash Arcade Simulation"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default AsteroidSmashArcade;

import React, { useRef, useState } from 'react';

export interface SolarSystemOrreryProps {
  className?: string;
  sourceUrl?: string;
  onAsteroidSelect?: (asteroid: any) => void;
}

/**
 * Solar System & NASA Live Orrery Component
 * Embeds real-time Three.js planetary orbits and Keplerian asteroid tracking
 */
export const SolarSystemOrrery: React.FC<SolarSystemOrreryProps> = ({
  className = 'w-full h-[600px] rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl relative',
  sourceUrl = '/NASA-Live-Orrery/index.html',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!iframeRef.current) return;
    if (!isFullscreen) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative bg-black ${className}`}>
      {/* Tactical Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-mono text-xs font-bold tracking-wider text-cyan-300 uppercase">
            NASA Live Planetary Orrery & Asteroid Tracker
          </span>
        </div>
        <button
          onClick={toggleFullscreen}
          className="px-2.5 py-1 text-[11px] font-mono bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 rounded transition-colors"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      <iframe
        ref={iframeRef}
        src={sourceUrl}
        className="w-full h-full border-0"
        title="NASA Solar System Live Orrery"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default SolarSystemOrrery;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useStoryStore } from '@/modules/store/useStoryStore';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';

export const MinimapRadar: React.FC = () => {
  // Zoom scales: 25m (close), 50m (medium), 80m (full exploration radius)
  const [zoomIndex, setZoomIndex] = useState<number>(1);
  const zoomScales = [25, 50, 80];
  const currentScale = zoomScales[zoomIndex];

  const playerPos = useOutpostStore((state) => state.playerPos);
  const isDrivingRover = useOutpostStore((state) => state.isDrivingRover);
  const roverPos = useOutpostStore((state) => state.roverPos);
  const cameraYaw = useOutpostStore((state) => state.cameraYaw);

  const activeWaypointAnchorId = useStoryStore((state) => state.activeWaypointAnchorId);
  const anchors = useStoryStore((state) => state.anchors);

  const currentPos = isDrivingRover ? roverPos : playerPos;
  const [px, , pz] = currentPos;

  // Active target waypoint position
  const targetAnchor = anchors.find((a) => a.id === activeWaypointAnchorId) || anchors[0];
  const [tx, , tz] = targetAnchor ? targetAnchor.position : [0, 0, 0];

  // Base is at origin [0, 0]
  const bx = 0;
  const bz = 0;

  // Distances
  const distToBase = Math.hypot(px - bx, pz - bz);
  const distToTarget = Math.hypot(px - tx, pz - tz);

  // Radar circle size
  const radarRadius = 50; // px

  // Function to project world coordinates [wx, wz] relative to player [px, pz]
  const projectToRadar = (wx: number, wz: number) => {
    const dx = wx - px;
    const dz = wz - pz;
    // Normalized distance (clamp to edge if outside scale)
    const dist = Math.hypot(dx, dz);
    const clampedDist = Math.min(dist, currentScale);
    const ratio = clampedDist / currentScale;

    // Angle relative to world North (-Z)
    const angle = Math.atan2(dx, -dz);
    // Relative to camera view
    const relAngle = angle - cameraYaw;

    const screenX = Math.sin(relAngle) * ratio * radarRadius;
    const screenY = -Math.cos(relAngle) * ratio * radarRadius;

    return { x: screenX, y: screenY, isOutside: dist > currentScale };
  };

  const baseBlip = projectToRadar(bx, bz);
  const targetBlip = projectToRadar(tx, tz);

  const cycleZoom = (delta: number) => {
    soundEngine.playClick(1000);
    setZoomIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next >= zoomScales.length) return zoomScales.length - 1;
      return next;
    });
  };

  return (
    <div className="fixed top-3 right-3 z-30 pointer-events-auto flex flex-col items-end select-none font-mono">
      {/* Radar Outer Shell */}
      <div className="relative w-28 h-28 rounded-full bg-slate-950/90 border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(0,0,0,0.8),0_0_12px_rgba(0,240,255,0.25)] backdrop-blur-md flex items-center justify-center overflow-hidden">
        
        {/* Radar Concentric Distance Rings */}
        <div className="absolute inset-2 rounded-full border border-cyan-500/20" />
        <div className="absolute inset-6 rounded-full border border-cyan-500/30 border-dashed" />
        <div className="absolute inset-10 rounded-full border border-cyan-500/40" />

        {/* Crosshair Axes */}
        <div className="absolute w-full h-[1px] bg-cyan-500/20" />
        <div className="absolute h-full w-[1px] bg-cyan-500/20" />

        {/* Radar Sweep Effect */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(0,240,255,0.25)_360deg)] pointer-events-none"
        />

        {/* Base Camp Blip (Cyan) */}
        <div
          style={{
            transform: `translate(${baseBlip.x}px, ${baseBlip.y}px)`,
          }}
          className="absolute z-10 w-4 h-4 -ml-2 -mt-2 flex items-center justify-center text-[10px] text-cyan-300 transition-transform duration-100"
          title={`Base Camp (${distToBase.toFixed(0)}m)`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white shadow-[0_0_8px_#00F0FF] flex items-center justify-center text-[8px] font-bold text-black">
            ⌂
          </span>
        </div>

        {/* Active Mission Target Blip (Amber Pulsing) */}
        <div
          style={{
            transform: `translate(${targetBlip.x}px, ${targetBlip.y}px)`,
          }}
          className="absolute z-10 w-4 h-4 -ml-2 -mt-2 flex items-center justify-center text-[10px] text-amber-300 transition-transform duration-100"
          title={`Target: ${targetAnchor?.label || 'Objective'} (${distToTarget.toFixed(0)}m)`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-[0_0_8px_#F59E0B] animate-ping" />
          <span className="absolute w-2 h-2 rounded-full bg-amber-400" />
        </div>

        {/* Center Player / Rover Arrow (Fixed at Center, Points Forward) */}
        <div className="absolute z-20 w-3 h-3 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-white shadow-[0_0_6px_#FFFFFF]" />
        </div>

        {/* North Compass Indicator on Rim */}
        <div
          style={{ transform: `rotate(${-cameraYaw * (180 / Math.PI)}deg)` }}
          className="absolute inset-0 pointer-events-none flex items-start justify-center pt-0.5"
        >
          <span className="text-[8px] font-bold text-rose-400">N</span>
        </div>

        {/* Scale Legend Pill at Bottom of Radar */}
        <div className="absolute bottom-1 z-20 px-1.5 py-0.2 bg-slate-900/90 rounded text-[8px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
          {currentScale}M
        </div>
      </div>

      {/* Radar Controls & Telemetry Readout */}
      <div className="mt-1 flex items-center gap-1.5 text-[9px] font-mono text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
        <span>X:{px.toFixed(0)} Z:{pz.toFixed(0)}</span>
        <div className="flex items-center gap-0.5 pl-1 border-l border-slate-700">
          <button
            onClick={() => cycleZoom(-1)}
            disabled={zoomIndex === 0}
            className="p-0.5 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => cycleZoom(1)}
            disabled={zoomIndex === zoomScales.length - 1}
            className="p-0.5 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinimapRadar;

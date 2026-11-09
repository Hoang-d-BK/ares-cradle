import React, { useMemo } from 'react';
import { Radar } from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Phase 16: Mars Weather & Dust Storm Mini-Radar HUD
 * Learned from NASA Global Finalist (SimulationPage.js & NEOAnalysis.js blast/hazard concentric rings)
 * Features:
 * - 120px circular radar display with 360° sweeping beam
 * - 3 Concentric Hazard Rings:
 *   1. Outer Ring (25-35 km): Early Warning Zone (Amber dashed)
 *   2. Middle Ring (10-25 km): Approach Zone (-30% Solar Attenuation)
 *   3. Inner Core (0-10 km): Landfall Eye (-60% Solar Attenuation & Thermal Loss)
 * - Dynamic blip tracking Stage 2 dust storm progress and real-time atmospheric dust
 */
export const StormRadarHUD: React.FC<{ className?: string }> = ({ className = '' }) => {
  const activeEvents = useOutpostStore((state) => state.activeEvents);
  const activeStageId = useOutpostStore((state) => state.activeStageId);
  const solTime = useOutpostStore((state) => state.solTime);
  const dustCoverage = useOutpostStore((state) => state.dustCoverage);

  // Determine storm proximity and zone
  const stormStatus = useMemo(() => {
    const stormEvent = activeEvents.find((e) => e.type === 'dust_storm');

    if (activeStageId === 2) {
      if (solTime < 8) {
        // Early Warning Zone: 32 km away
        const dist = 35 - solTime * 1.5;
        return {
          zone: 'early_warning',
          distanceKm: Math.max(25, dist).toFixed(0),
          label: 'EARLY WARNING',
          color: '#FFB020',
          attenuation: '-10%',
          blipRadius: 46, // Outer ring
          angle: 0.85
        };
      } else if (solTime < 16) {
        // Approach Zone: 16 km away
        const dist = 25 - (solTime - 8) * 1.5;
        return {
          zone: 'approach',
          distanceKm: Math.max(10, dist).toFixed(0),
          label: 'APPROACHING (-30%)',
          color: '#FF773D',
          attenuation: '-30%',
          blipRadius: 30, // Middle ring
          angle: 1.1
        };
      } else if (solTime <= 40) {
        // Landfall Core: Storm over base
        return {
          zone: 'landfall',
          distanceKm: '0',
          label: 'LANDFALL EYE (-60%)',
          color: '#EF4444',
          attenuation: '-60%',
          blipRadius: 8, // Inner core
          angle: 1.4
        };
      } else {
        // Departing
        return {
          zone: 'departing',
          distanceKm: '28',
          label: 'STORM DISSIPATING',
          color: '#10B981',
          attenuation: '-5%',
          blipRadius: 44,
          angle: 2.8
        };
      }
    }

    if (stormEvent?.active) {
      return {
        zone: 'landfall',
        distanceKm: '0',
        label: 'STORM ACTIVE',
        color: '#EF4444',
        attenuation: '-60%',
        blipRadius: 8,
        angle: 1.2
      };
    }

    if (dustCoverage > 0.4) {
      return {
        zone: 'dust_motes',
        distanceKm: '18',
        label: 'HEAVY DUST DRAFT',
        color: '#FFB020',
        attenuation: `-${(dustCoverage * 50).toFixed(0)}%`,
        blipRadius: 32,
        angle: 2.1
      };
    }

    return {
      zone: 'nominal',
      distanceKm: '> 50',
      label: 'ATMOSPHERE NOMINAL',
      color: '#00F0FF',
      attenuation: '0%',
      blipRadius: null,
      angle: 0
    };
  }, [activeEvents, activeStageId, solTime, dustCoverage]);

  // Compute SVG blip position
  const blipPos = useMemo(() => {
    if (!stormStatus.blipRadius) return null;
    const cx = 60;
    const cy = 60;
    const x = cx + Math.cos(stormStatus.angle) * stormStatus.blipRadius;
    const y = cy + Math.sin(stormStatus.angle) * stormStatus.blipRadius;
    return { x, y };
  }, [stormStatus]);

  return (
    <div
      className={`hud-panel hud-corner-brackets p-2 sm:p-2.5 rounded-sm border border-mars-border bg-slate-950/90 shadow-2xl flex flex-col items-center select-none pointer-events-auto ${className}`}
      title="Martian Meteorological Hazard Radar"
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-mars-border/80 pb-1 mb-1.5 text-[9px] font-mono font-bold tracking-wider text-slate-300">
        <div className="flex items-center gap-1 text-mars-cyan">
          <Radar className="w-3.5 h-3.5 animate-pulse" />
          <span>STORM RADAR</span>
        </div>
        <span
          className="px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase"
          style={{
            color: stormStatus.color,
            backgroundColor: `${stormStatus.color}20`,
            borderColor: `${stormStatus.color}50`
          }}
        >
          {stormStatus.distanceKm === '0' ? 'EYE 0 KM' : `${stormStatus.distanceKm} KM`}
        </span>
      </div>

      {/* 120px Circular Radar Scope */}
      <div className="relative w-[120px] h-[120px] flex items-center justify-center rounded-full overflow-hidden border border-mars-border-bright bg-slate-900/90 shadow-inner">
        {/* Radial Background Grid Lines */}
        <div className="absolute inset-0 bg-grid-telemetry opacity-40 pointer-events-none" />

        {/* 3 Concentric Hazard Rings (Learned from SimulationPage.js) */}
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 120 120">
          {/* Ring 1: Outer Early Warning (Radius 48px) */}
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="#FFB020"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            opacity="0.45"
          />

          {/* Ring 2: Middle Approach Zone (Radius 30px) */}
          <circle
            cx="60"
            cy="60"
            r="30"
            fill="none"
            stroke="#FF773D"
            strokeWidth="1.4"
            opacity="0.6"
          />

          {/* Ring 3: Inner Core Landfall Eye (Radius 12px) */}
          <circle
            cx="60"
            cy="60"
            r="12"
            fill={stormStatus.zone === 'landfall' ? 'rgba(239, 68, 68, 0.25)' : 'none'}
            stroke="#EF4444"
            strokeWidth="1.6"
            opacity="0.85"
          />

          {/* Center Base Crosshairs */}
          <line x1="60" y1="4" x2="60" y2="116" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="0.8" />
          <line x1="4" y1="60" x2="116" y2="60" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="0.8" />
          <circle cx="60" cy="60" r="2.5" fill="#00F0FF" />

          {/* Dynamic Inbound Storm Hazard Blip */}
          {blipPos && (
            <g>
              {/* Outer Pulsing Shockwave Ring */}
              <circle
                cx={blipPos.x}
                cy={blipPos.y}
                r="7"
                fill="none"
                stroke={stormStatus.color}
                strokeWidth="1.2"
                className="animate-ping"
                style={{ transformOrigin: `${blipPos.x}px ${blipPos.y}px` }}
              />
              {/* Solid Threat Core Dot */}
              <circle
                cx={blipPos.x}
                cy={blipPos.y}
                r="3.5"
                fill={stormStatus.color}
                style={{ filter: `drop-shadow(0 0 4px ${stormStatus.color})` }}
              />
            </g>
          )}
        </svg>

        {/* 360° Continuous Sweeping Radar Beam */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none animate-spin"
          style={{
            animationDuration: '3.2s',
            background: 'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(0, 240, 255, 0.35) 360deg)'
          }}
        />

        {/* Legend Ring Distances Watermark */}
        <span className="absolute top-1 text-[7px] font-mono text-slate-500 font-bold">35KM</span>
        <span className="absolute top-6 text-[7px] font-mono text-slate-500 font-bold">20KM</span>
      </div>

      {/* Footer Readout Status */}
      <div className="w-full mt-1.5 flex flex-col items-center text-center">
        <span
          className="text-[10px] font-display font-bold tracking-wider uppercase truncate"
          style={{ color: stormStatus.color }}
        >
          {stormStatus.label}
        </span>
        <div className="flex items-center gap-2 text-[8px] font-mono text-slate-400 mt-0.5">
          <span>ATTEN: <strong className="text-slate-200">{stormStatus.attenuation}</strong></span>
          <span>|</span>
          <span>REGOLITH: <strong className="text-mars-amber">{(dustCoverage * 100).toFixed(0)}%</strong></span>
        </div>
      </div>
    </div>
  );
};

export default StormRadarHUD;

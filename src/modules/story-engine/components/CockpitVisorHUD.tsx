import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset, 
  Truck, 
  Backpack, 
  BookOpen, 
  FlaskConical, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Users,
  Flashlight,
  Box
} from 'lucide-react';
import { useStoryStore } from '@/modules/store/useStoryStore';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';
import { SolPhase } from '@/modules/simulation-engine/types';

interface CockpitVisorHUDProps {
  onOpenShowcase: () => void;
  onOpenCodex: () => void;
}

const phaseIcons: Record<SolPhase, React.ComponentType<{ className?: string }>> = {
  Morning: Sunrise,
  Noon: Sun,
  Sunset: Sunset,
  Night: Moon
};

const phaseColors: Record<SolPhase, { text: string; bg: string }> = {
  Morning: { text: 'text-amber-400', bg: 'bg-amber-400/15' },
  Noon: { text: 'text-yellow-300', bg: 'bg-yellow-300/15' },
  Sunset: { text: 'text-orange-400', bg: 'bg-orange-400/15' },
  Night: { text: 'text-cyan-400', bg: 'bg-cyan-400/15' }
};

/**
 * Unified Non-Overlapping Command Visor HUD
 * Spans smoothly across top from left edge to before the Minimap Radar.
 * 100% English, anti-clutter, zero layout collisions.
 */
export const CockpitVisorHUD: React.FC<CockpitVisorHUDProps> = ({
  onOpenShowcase,
  onOpenCodex
}) => {
  const currentChapter = useStoryStore((state) => state.getCurrentChapter());
  const carriedVials = useStoryStore((state) => state.carriedVials);
  const stemScore = useStoryStore((state) => state.stemScore);
  const anchors = useStoryStore((state) => state.anchors);
  const activeWaypointAnchorId = useStoryStore((state) => state.activeWaypointAnchorId);
  const setChapterSelectOpen = useStoryStore((state) => state.setChapterSelectOpen);
  const setLabStationOpen = useStoryStore((state) => state.setLabStationOpen);

  // Outpost Store Telemetry & Action Toggles
  const isInsideHabitat = useOutpostStore((state) => state.isInsideHabitat);
  const astronautPos = useOutpostStore((state) => state.playerPos);
  const cameraYaw = useOutpostStore((state) => state.cameraYaw);
  const solTime = useOutpostStore((state) => state.solTime);
  const solPhase = useOutpostStore((state) => state.solPhase);
  const isDrivingRover = useOutpostStore((state) => state.isDrivingRover);
  const toggleDrivingRover = useOutpostStore((state) => state.toggleDrivingRover);
  const isFlashlightOn = useOutpostStore((state) => state.isFlashlightOn);
  const toggleFlashlight = useOutpostStore((state) => state.toggleFlashlight);
  const toggleBackpack = useOutpostStore((state) => state.toggleBackpack);
  const toggleClassroom = useOutpostStore((state) => state.toggleClassroom);
  const cleanDust = useOutpostStore((state) => state.cleanDust);
  const dustCoverage = useOutpostStore((state) => state.dustCoverage);
  const isMuted = useOutpostStore((state) => state.isMuted);
  const toggleMute = useOutpostStore((state) => state.toggleMute);
  const isPhysicsDebugVisible = useOutpostStore((state) => state.isPhysicsDebugVisible);
  const togglePhysicsDebug = useOutpostStore((state) => state.togglePhysicsDebug);
  const hudColorTheme = useOutpostStore((state) => state.hudColorTheme);
  const setHudColorTheme = useOutpostStore((state) => state.setHudColorTheme);
  const graphicsQuality = useOutpostStore((state) => state.graphicsQuality);
  const setGraphicsQuality = useOutpostStore((state) => state.setGraphicsQuality);

  const cycleGraphicsQuality = () => {
    const order: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    const next = order[(order.indexOf(graphicsQuality) + 1) % order.length];
    setGraphicsQuality(next);
  };

  // Active waypoint target calculation
  const targetAnchor = anchors.find((a) => a.id === activeWaypointAnchorId) || anchors[0];
  const [targetX, , targetZ] = targetAnchor.position;
  const [playerX, , playerZ] = astronautPos;

  const dx = targetX - playerX;
  const dz = targetZ - playerZ;
  const distanceMeters = Math.hypot(dx, dz).toFixed(1);

  // Bearing angle calculation relative to camera forward view
  const angleRad = Math.atan2(dx, -dz);
  const relativeAngle = angleRad - cameraYaw;
  const angleDeg = (relativeAngle * (180 / Math.PI) + 360) % 360;

  // Martian 24h clock derived from cyclic 60s Sol duration
  const cycleTime = ((solTime % 60) + 60) % 60;
  const martianHours = Math.floor((cycleTime / 60) * 24) % 24;
  const martianMinutes = Math.floor((((cycleTime / 60) * 24) % 1) * 60);
  const timeString = `${martianHours.toString().padStart(2, '0')}:${martianMinutes.toString().padStart(2, '0')}`;

  const PhaseIcon = phaseIcons[solPhase] || Sun;
  const phaseTheme = phaseColors[solPhase] || phaseColors.Noon;

  const activeObjective = currentChapter.objectives.find((o) => !o.completed);
  const solNumber = currentChapter.sol || 1;

  // Dynamic Palette Theme mapping (reacts to user-selected hudColorTheme)
  const solTheme = React.useMemo(() => {
    if (hudColorTheme === 'cerenkov-cyan') {
      return {
        border: 'border-cyan-400/55',
        glow: 'shadow-[0_0_22px_rgba(0,240,255,0.28)]',
        text: 'text-cyan-200',
        badgeBg: 'bg-cyan-500/20 hover:bg-cyan-500/35',
        ping: 'bg-cyan-400'
      };
    }
    if (hudColorTheme === 'biodome-emerald') {
      return {
        border: 'border-emerald-400/55',
        glow: 'shadow-[0_0_22px_rgba(16,185,129,0.28)]',
        text: 'text-emerald-200',
        badgeBg: 'bg-emerald-500/20 hover:bg-emerald-500/35',
        ping: 'bg-emerald-400'
      };
    }
    if (hudColorTheme === 'phobos-plasma') {
      return {
        border: 'border-purple-400/55',
        glow: 'shadow-[0_0_22px_rgba(192,132,252,0.3)]',
        text: 'text-purple-200',
        badgeBg: 'bg-purple-500/20 hover:bg-purple-500/35',
        ping: 'bg-fuchsia-400'
      };
    }
    return {
      border: 'border-amber-400/55',
      glow: 'shadow-[0_0_22px_rgba(255,176,32,0.28)]',
      text: 'text-amber-200',
      badgeBg: 'bg-amber-500/20 hover:bg-amber-500/35',
      ping: 'bg-amber-400'
    };
  }, [hudColorTheme, solNumber]);

  return (
    <header className="fixed top-2.5 left-3 right-36 z-30 pointer-events-auto flex items-center justify-between gap-2 font-mono select-none text-xs">
      {/* ========================================================
          1. LEFT CLUSTER: Sol Progression, Time, Waypoint & Vials
          ======================================================== */}
      <div className={`flex items-center gap-1.5 sm:gap-2 shrink-0 hud-theme-shell border ${solTheme.border} ${solTheme.glow} rounded-xl px-2.5 py-1.5`}>
        {/* Sol Stage Indicator */}
        <button
          onClick={() => {
            soundEngine.playClick(1000);
            setChapterSelectOpen(true);
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${solTheme.badgeBg} border ${solTheme.border} ${solTheme.text} font-bold transition-all cursor-pointer active:scale-95 text-xs`}
          title="Mission Log & Chapter Select (Passkey: ARES2026)"
        >
          <span>🚀</span>
          <span>SOL {currentChapter.sol}/20</span>
        </button>

        {/* Diurnal Time & Phase */}
        <div
          className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg border border-current/20 ${phaseTheme.bg} ${phaseTheme.text} font-bold text-[11px]`}
          title={`Martian Time: ${timeString} (${solPhase})`}
        >
          <PhaseIcon className="w-3.5 h-3.5" />
          <span>{timeString}</span>
        </div>

        {/* Waypoint Compass & Distance */}
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/60 border border-gray-800 text-[11px]"
          title={`Target Waypoint: ${targetAnchor.label} (${distanceMeters}m)`}
        >
          <div className="relative w-4 h-4 rounded-full border border-cyan-500/50 flex items-center justify-center bg-cyan-950/40">
            <motion.div
              style={{ transform: `rotate(${angleDeg}deg)` }}
              className="w-0.5 h-3 bg-gradient-to-t from-transparent via-cyan-400 to-amber-400 rounded-full origin-center"
            />
          </div>
          <span className="text-cyan-300 font-bold max-w-[90px] md:max-w-[120px] xl:max-w-[160px] truncate">
            {targetAnchor.label}
          </span>
          <span className="text-[10px] text-gray-400">{distanceMeters}m</span>
        </div>

        {/* Sample Vials Rack */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 border border-gray-800"
          title="Carried Specimen Vials (3 max)"
        >
          <span className="text-xs">🧪</span>
          <span className="text-[10px] text-gray-300 font-bold">{carriedVials.length}/3</span>
        </div>

        {/* Habitat Lab Prompt (When Inside Dome) */}
        {isInsideHabitat && (
          <button
            onClick={() => {
              soundEngine.playClick(1300);
              setLabStationOpen(true);
            }}
            className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold text-[10px] cursor-pointer"
            title="Open Bio-Dome Laboratory"
          >
            <span>🔬</span>
            <span>LAB</span>
          </button>
        )}

        {/* STEM Score */}
        <div 
          className="hidden xl:flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded-lg border border-gray-800"
          title="Total STEM Score"
        >
          <span className="text-gray-400">PTS:</span>
          <span>{stemScore}</span>
        </div>
      </div>

      {/* ========================================================
          2. CENTER CLUSTER: 100% English Mission Guidance
          ======================================================== */}
      <div className="flex-1 max-w-sm md:max-w-md lg:max-w-lg mx-1 min-w-0 flex items-center justify-center">
        <div className={`w-full px-3 py-1.5 rounded-xl hud-theme-shell border ${solTheme.border} ${solTheme.glow} flex items-center gap-2 text-xs truncate`}>
          <span className={`w-2 h-2 rounded-full ${solTheme.ping} shrink-0`} />
          <span className={`font-bold ${solTheme.text} shrink-0 text-[11px]`}>
            {activeObjective?.id?.includes('return-base') ? 'RETURN:' : 'MISSION:'}
          </span>
          <span className="truncate text-slate-100 font-medium text-[11px]">
            {activeObjective?.label || 'All objectives complete! Return to Habitat Base to conclude Sol.'}
          </span>
        </div>
      </div>

      {/* ========================================================
          3. RIGHT CLUSTER: Tactical Action Icon Tray + Palette Switcher
          ======================================================== */}
      <div className={`flex items-center gap-1 shrink-0 hud-theme-shell border ${solTheme.border} ${solTheme.glow} rounded-xl p-1`}>
        {/* Rover [R] Toggle */}
        <button
          onClick={() => {
            soundEngine.playClick(1300);
            toggleDrivingRover();
          }}
          className={`p-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer touch-manipulation ${
            isDrivingRover
              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
          title="Drive Exploration Rover [R]"
          aria-label="Rover"
        >
          <Truck className="w-4 h-4" />
          <span className="text-[9px] font-bold text-cyan-400/80">R</span>
        </button>

        {/* Flashlight Torch [F] Toggle */}
        <button
          onClick={() => {
            soundEngine.playClick(1200);
            toggleFlashlight();
          }}
          className={`p-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer touch-manipulation ${
            isFlashlightOn
              ? 'bg-amber-500/25 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
          title="Toggle EVA Flashlight Torch [F]"
          aria-label="Flashlight"
        >
          <Flashlight className={`w-4 h-4 ${isFlashlightOn ? 'text-amber-300' : 'text-gray-400'}`} />
          <span className="text-[9px] font-bold text-amber-400/80">F</span>
        </button>

        {/* Backpack [E] Inventory */}
        <button
          onClick={() => {
            soundEngine.playClick(900);
            toggleBackpack();
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center gap-1"
          title="Survival Backpack Inventory [E]"
          aria-label="Backpack"
        >
          <Backpack className="w-4 h-4 text-cyan-400" />
          <span className="text-[9px] font-bold text-cyan-400/80">E</span>
        </button>

        {/* Mars Codex [G] */}
        <button
          onClick={() => {
            soundEngine.playClick(1100);
            onOpenCodex();
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center gap-1"
          title="Mars Codex & Celestial Orrery [G]"
          aria-label="Codex"
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="text-[9px] font-bold text-amber-400/80">G</span>
        </button>

        {/* UI Showcase / Lab [F2] */}
        <button
          onClick={() => {
            soundEngine.playClick(1100);
            onOpenShowcase();
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center gap-1"
          title="Tactical UI/UX Workbench [F2]"
          aria-label="Showcase"
        >
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          <span className="text-[9px] font-bold text-emerald-400/80">F2</span>
        </button>

        {/* Physics Hitboxes & Bounding Boxes Toggle [B] */}
        <button
          onClick={togglePhysicsDebug}
          data-testid="visor-hitbox-toggle"
          className={`p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center gap-1 ${
            isPhysicsDebugVisible
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.45)]'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
          title="Toggle 3D Physics Hitboxes & Bounding Boxes [B]"
          aria-label="Toggle Hitboxes"
        >
          <Box className={`w-4 h-4 ${isPhysicsDebugVisible ? 'text-cyan-300' : 'text-cyan-400'}`} />
          <span className="text-[9px] font-bold text-cyan-300">B</span>
        </button>

        {/* Clean Solar Dust Wiper */}
        <button
          onClick={() => cleanDust(0.25)}
          className={`p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center gap-1 ${
            dustCoverage > 0.2
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
          }`}
          title={`Clean Solar Array Dust (${Math.round(dustCoverage * 100)}%)`}
          aria-label="Wipe Dust"
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
          {dustCoverage > 0.2 && (
            <span className="text-[9px] font-bold text-amber-300">
              {Math.round(dustCoverage * 100)}%
            </span>
          )}
        </button>

        {/* Classroom Room-PIN */}
        <button
          onClick={() => {
            soundEngine.playClick(1050);
            toggleClassroom();
          }}
          className="hidden sm:flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all active:scale-95 cursor-pointer touch-manipulation"
          title="Classroom Session & Room PIN"
          aria-label="Classroom"
        >
          <Users className="w-4 h-4 text-purple-400" />
        </button>

        {/* 4-Swatch Creative Color Palette Selector [T] */}
        <div
          data-testid="visor-palette-swatches"
          className="hidden md:flex items-center gap-1 px-1.5 py-1 rounded-lg bg-black/50 border border-white/10"
          title="Switch Aerospace HUD Color Palette [T]"
        >
          {(
            [
              { id: 'solar-amber', color: '#FFB020', label: 'Solar Amber' },
              { id: 'cerenkov-cyan', color: '#00F0FF', label: 'Cryo Cyan' },
              { id: 'biodome-emerald', color: '#10B981', label: 'Bio Emerald' },
              { id: 'phobos-plasma', color: '#C084FC', label: 'Phobos Plasma' }
            ] as const
          ).map((swatch) => (
            <button
              key={swatch.id}
              type="button"
              onClick={() => setHudColorTheme(swatch.id)}
              data-testid={`palette-swatch-${swatch.id}`}
              style={{ backgroundColor: swatch.color }}
              className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                hudColorTheme === swatch.id
                  ? 'scale-125 ring-2 ring-white shadow-[0_0_8px_currentColor]'
                  : 'opacity-65 hover:opacity-100 hover:scale-110'
              }`}
              title={`Theme: ${swatch.label} [T]`}
              aria-label={`Select ${swatch.label} Theme`}
            />
          ))}
        </div>

        {/* 3-Tier Graphics Quality Toggle (LOW / MED / HIGH) */}
        <button
          type="button"
          onClick={cycleGraphicsQuality}
          data-testid="visor-quality-toggle"
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 border border-white/10 hover:border-cyan-400/50 text-[9px] font-bold text-cyan-300 cursor-pointer"
          title="Switch 3D Graphics Quality Tier (Low / Medium / High)"
        >
          <span>GFX:</span>
          <span className="uppercase text-amber-300">
            {graphicsQuality === 'medium' ? 'MED' : graphicsQuality.toUpperCase()}
          </span>
        </button>

        {/* Sound Mute Toggle */}
        <button
          onClick={toggleMute}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all active:scale-95 cursor-pointer touch-manipulation"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label="Mute"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </header>
  );
};

export default CockpitVisorHUD;

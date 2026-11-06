import React from 'react';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset, 
  Sparkles, 
  Target, 
  Volume2, 
  VolumeX,
  Backpack,
  Users 
} from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { SolPhase } from '@/modules/simulation-engine/types';

const springPhysics = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 28,
  mass: 0.8
};

const phaseIcons: Record<SolPhase, React.ComponentType<{ className?: string }>> = {
  Morning: Sunrise,
  Noon: Sun,
  Sunset: Sunset,
  Night: Moon
};

const phaseColors: Record<SolPhase, { text: string; bg: string }> = {
  Morning: { text: 'text-mars-amber', bg: 'bg-mars-amber/10' },
  Noon: { text: 'text-yellow-300', bg: 'bg-yellow-300/10' },
  Sunset: { text: 'text-mars-rust', bg: 'bg-mars-rust/10' },
  Night: { text: 'text-mars-cyan', bg: 'bg-mars-cyan/10' }
};

export const StageBanner: React.FC = () => {
  const currentSol = useOutpostStore((state) => state.currentSol);
  const solTime = useOutpostStore((state) => state.solTime);
  const solPhase = useOutpostStore((state) => state.solPhase);
  const stageConfig = useOutpostStore((state) => state.stageConfig);
  const activeStageId = useOutpostStore((state) => state.activeStageId);
  const setStage = useOutpostStore((state) => state.setStage);
  const solarIntake = useOutpostStore((state) => state.solarIntake);
  const dustCoverage = useOutpostStore((state) => state.dustCoverage);
  const cleanDust = useOutpostStore((state) => state.cleanDust);
  const battery = useOutpostStore((state) => state.battery);
  const isMuted = useOutpostStore((state) => state.isMuted);
  const toggleMute = useOutpostStore((state) => state.toggleMute);
  const toggleBackpack = useOutpostStore((state) => state.toggleBackpack);
  const toggleClassroom = useOutpostStore((state) => state.toggleClassroom);
  const marsWeather = useOutpostStore((state) => state.marsWeather);

  const PhaseIcon = phaseIcons[solPhase] || Sun;
  const phaseTheme = phaseColors[solPhase] || phaseColors.Noon;

  // Compute simulated Martian 24h clock from 60s real Sol duration
  const martianHours = Math.floor((solTime / 60) * 24);
  const martianMinutes = Math.floor((((solTime / 60) * 24) % 1) * 60);
  const timeString = `${martianHours.toString().padStart(2, '0')}:${martianMinutes.toString().padStart(2, '0')}`;

  const isBrownout = battery <= 0;
  const isStressed = battery < 20 || dustCoverage > 0.4;

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5 pointer-events-auto w-full select-none">
      {/* Left: Sol Time & Diurnal Phase Deck */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPhysics}
        className="hud-panel hud-corner-brackets p-3 rounded-sm flex flex-wrap items-center gap-3.5 shadow-lg"
      >
        {/* Sol Mission Clock */}
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-mars-cyan animate-pulse" />
          <div>
            <div className="text-[9px] uppercase font-mono tracking-widest text-slate-400">
              Martian Clock
            </div>
            <div className="font-display font-bold text-base tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>SOL {currentSol.toString().padStart(2, '0')}</span>
              <span className="text-mars-cyan font-mono text-sm">{timeString}</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:block h-6 w-[1px] bg-mars-border" />

        {/* Stage Selector Pills (Teacher / Cadet Demo Switcher) */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((stageId) => (
            <button
              key={stageId}
              onClick={() => setStage(stageId)}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded transition-colors touch-manipulation active:scale-95 ${
                activeStageId === stageId
                  ? 'bg-mars-cyan text-slate-950 shadow-[0_0_8px_#00F0FF]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              SOL {stageId === 1 ? '1' : stageId === 2 ? '5' : '12'}
            </button>
          ))}
        </div>

        <div className="hidden sm:block h-6 w-[1px] bg-mars-border" />

        {/* Diurnal Phase Badge */}
        <div className="flex items-center gap-1.5">
          <PhaseIcon className={`w-4 h-4 ${phaseTheme.text}`} />
          <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-current/20 ${phaseTheme.bg} ${phaseTheme.text} uppercase`}>
            {solPhase}
          </span>
        </div>

        <div className="hidden sm:block h-6 w-[1px] bg-mars-border" />

        {/* Instant Solar Intake Readout */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <Sun className="w-3.5 h-3.5 text-mars-amber" />
          <span className="text-slate-400">SOLAR:</span>
          <span className="text-mars-amber font-semibold">{solarIntake.toFixed(1)} kW</span>
        </div>

        {/* NASA InSight Telemetry Badge */}
        {marsWeather && (
          <>
            <div className="hidden lg:block h-6 w-[1px] bg-mars-border" />
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-mars-surface border border-mars-cyan/30 text-mars-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-mars-cyan animate-pulse" />
              <span>NASA: {marsWeather.temperatureMin}°C | {marsWeather.windSpeed}m/s</span>
            </div>
          </>
        )}

        <div className="hidden sm:block h-6 w-[1px] bg-mars-border" />

        {/* Grid Health Status */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isBrownout
                ? 'bg-mars-crimson animate-ping shadow-[0_0_8px_#EF4444]'
                : isStressed
                ? 'bg-mars-amber shadow-[0_0_8px_#FFB020]'
                : 'bg-mars-emerald shadow-[0_0_8px_#10B981]'
            }`}
          />
          <span
            className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
              isBrownout
                ? 'text-mars-crimson'
                : isStressed
                ? 'text-mars-amber'
                : 'text-emerald-400'
            }`}
          >
            {isBrownout ? 'GRID BROWNOUT' : isStressed ? 'GRID STRESSED' : 'GRID NOMINAL'}
          </span>
        </div>
      </motion.div>

      {/* Center/Right: Objective, Audio Control & Dust Wiper Trigger */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {/* Mission Objective Card */}
        {stageConfig && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPhysics, delay: 0.05 }}
            className="hud-panel px-3 py-2 rounded-sm hidden lg:flex items-center gap-2 border-mars-cyan/30"
          >
            <Target className="w-3.5 h-3.5 text-mars-cyan shrink-0" />
            <div className="text-left">
              <div className="text-[9px] uppercase font-mono tracking-widest text-slate-400">
                Directive
              </div>
              <div className="text-[11px] font-display font-semibold text-slate-200 truncate max-w-xs">
                {stageConfig.targetObjective}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tactile Backpack Button [E] */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPhysics, delay: 0.07 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.94 }}
          onClick={toggleBackpack}
          className="btn-tactile px-3 py-2 rounded flex items-center gap-1.5 text-xs font-display font-bold tracking-wider border border-mars-cyan/40 text-mars-cyan shadow-[0_0_8px_rgba(0,240,255,0.2)]"
          title="Open Cadet Field Backpack [Hotkey: E]"
        >
          <Backpack className="w-4 h-4" />
          <span className="hidden sm:inline">BACKPACK [E]</span>
        </motion.button>

        {/* Tactile Classroom Room-PIN Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPhysics, delay: 0.08 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.94 }}
          onClick={toggleClassroom}
          className="btn-tactile px-3 py-2 rounded flex items-center gap-1.5 text-xs font-display font-bold tracking-wider border border-mars-amber/40 text-mars-amber shadow-[0_0_8px_rgba(255,176,32,0.2)]"
          title="Classroom Battle Session [Room PIN]"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">CLASSROOM [PIN]</span>
        </motion.button>

        {/* Audio Mute/Unmute Toggle Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPhysics, delay: 0.08 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="btn-tactile p-2.5 rounded flex items-center justify-center text-slate-300 border border-mars-border"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-slate-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-mars-cyan" />
          )}
        </motion.button>

        {/* Tactile Solar Array Dust Wiper Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPhysics, delay: 0.1 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => cleanDust()}
          className={`btn-tactile px-3.5 py-2.5 rounded flex items-center gap-2 text-xs font-display font-bold tracking-wider border ${
            dustCoverage > 0.3
              ? 'border-mars-amber text-amber-200 bg-amber-950/40 shadow-[0_0_10px_rgba(255,176,32,0.3)] animate-bounce'
              : 'border-mars-border text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-mars-cyan" />
          <span>WIPE SOLAR PANELS ({(dustCoverage * 100).toFixed(0)}%)</span>
        </motion.button>
      </div>
    </header>
  );
};

export default StageBanner;

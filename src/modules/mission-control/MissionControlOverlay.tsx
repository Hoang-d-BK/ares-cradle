import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Heart, Thermometer, ChevronUp, ChevronDown } from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';

import ResourceDial, { ResourceStatus } from './ResourceDial';
import PowerDistributor from './PowerDistributor';
import StageBanner from './StageBanner';
import EventModal from './EventModal';
import DebriefModal from './DebriefModal';
import BackpackModal from '@/modules/survival-ui/BackpackModal';
import RewardCelebration from '@/modules/survival-ui/RewardCelebration';
import AstroBotCompanion from '@/modules/survival-ui/AstroBotCompanion';
import ClassroomModal from '@/modules/survival-ui/ClassroomModal';
import BrownoutQuizModal from '@/modules/survival-ui/BrownoutQuizModal';
import StormRadarHUD from '@/modules/survival-ui/StormRadarHUD';
import VirtualJoystick from '@/modules/character/VirtualJoystick';

const springPhysics = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 28,
  mass: 0.8
};

const statusPillStyles: Record<ResourceStatus, { text: string; bg: string; border: string; glow: string }> = {
  safe: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.2)]'
  },
  warning: {
    text: 'text-amber-400',
    bg: 'bg-amber-950/70',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_8px_rgba(255,176,32,0.2)]'
  },
  critical: {
    text: 'text-rose-400',
    bg: 'bg-rose-950/70',
    border: 'border-rose-500/50',
    glow: 'shadow-[0_0_10px_rgba(244,63,94,0.35)]'
  }
};

export const MissionControlOverlay: React.FC = () => {
  const [isHudCollapsed, setIsHudCollapsed] = useState(true);

  const battery = useOutpostStore((state) => state.battery);
  const batteryKwh = useOutpostStore((state) => state.batteryKwh);
  const batteryCapacityKwh = useOutpostStore((state) => state.batteryCapacityKwh);
  const oxygen = useOutpostStore((state) => state.oxygen);
  const temperature = useOutpostStore((state) => state.temperature);
  const initMarsWeather = useOutpostStore((state) => state.initMarsWeather);
  const isClassroomOpen = useOutpostStore((state) => state.isClassroomOpen);
  const closeClassroom = useOutpostStore((state) => state.closeClassroom);

  // Initialize real-time NASA Elysium Planitia weather telemetry
  useEffect(() => {
    initMarsWeather();
  }, [initMarsWeather]);

  // Determine color status for primary telemetry
  const batteryStatus: ResourceStatus = 
    battery > 40 ? 'safe' : battery > 15 ? 'warning' : 'critical';

  const oxygenStatus: ResourceStatus = 
    oxygen > 19.5 ? 'safe' : oxygen > 16.0 ? 'warning' : 'critical';

  const tempStatus: ResourceStatus = 
    temperature >= 10 && temperature <= 25
      ? 'safe'
      : temperature >= 0 && temperature <= 32
      ? 'warning'
      : 'critical';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-5 overflow-hidden z-20">
      {/* Top Banner: Sol Clock, Phase, Directives & Dust Cleaner */}
      <StageBanner />

      {/* Phase 16: Mars Weather & Dust Storm Concentric Mini-Radar */}
      <div className="absolute top-20 right-3 sm:right-5 pointer-events-auto z-20 hidden md:block">
        <StormRadarHUD />
      </div>

      {/* Floating Bottom Mission Control HUD: Compact Minimalist Bar vs Expanded Deck */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col items-center pb-1 select-none">
        <AnimatePresence mode="wait">
          {isHudCollapsed ? (
            /* Compact Mode: Minimalist Telemetry Pill Bar (Non-intrusive) */
            <motion.div
              key="compact-hud"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={springPhysics}
              className="hud-panel p-1.5 sm:p-2 rounded-md shadow-2xl flex items-center justify-between gap-2 sm:gap-3 pointer-events-auto border border-mars-border"
            >
              {/* 3 Status Pills: Battery, Oxygen, Thermal */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Battery Indicator */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-xs font-bold ${statusPillStyles[batteryStatus].bg} ${statusPillStyles[batteryStatus].border} ${statusPillStyles[batteryStatus].text} ${statusPillStyles[batteryStatus].glow}`}
                  title={`Battery Grid: ${battery.toFixed(1)}% (${batteryKwh.toFixed(1)} / ${batteryCapacityKwh.toFixed(0)} kWh)`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px] uppercase font-sans text-slate-300">BATTERY</span>
                  <span>{battery.toFixed(1)}%</span>
                </div>

                {/* Oxygen Indicator */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-xs font-bold ${statusPillStyles[oxygenStatus].bg} ${statusPillStyles[oxygenStatus].border} ${statusPillStyles[oxygenStatus].text} ${statusPillStyles[oxygenStatus].glow}`}
                  title={`Oxygen Level: ${oxygen.toFixed(1)}%`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px] uppercase font-sans text-slate-300">O2</span>
                  <span>{oxygen.toFixed(1)}%</span>
                </div>

                {/* Temperature Indicator */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-xs font-bold ${statusPillStyles[tempStatus].bg} ${statusPillStyles[tempStatus].border} ${statusPillStyles[tempStatus].text} ${statusPillStyles[tempStatus].glow}`}
                  title={`Habitat Temperature: ${temperature.toFixed(1)}°C`}
                >
                  <Thermometer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px] uppercase font-sans text-slate-300">TEMP</span>
                  <span>{temperature > 0 ? '+' : ''}{temperature.toFixed(1)}°C</span>
                </div>
              </div>

              <div className="h-5 w-[1px] bg-mars-border" />

              {/* Expand Toggle Button */}
              <button
                onClick={() => {
                  soundEngine.playClick(900);
                  setIsHudCollapsed(false);
                }}
                className="btn-tactile px-2.5 sm:px-3 py-1 rounded flex items-center gap-1.5 text-xs font-display font-bold tracking-wider border border-mars-cyan/40 text-mars-cyan bg-slate-900/80 hover:bg-slate-800"
                title="Expand Full Telemetry Dials & Power Router"
                data-testid="expand-hud-button"
              >
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline">ROUTER & GAUGES</span>
              </button>
            </motion.div>
          ) : (
            /* Expanded Mode: Full 3-Dial Deck & Power Distributor */
            <motion.div
              key="expanded-hud"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={springPhysics}
              className="w-full flex flex-col gap-2 pointer-events-auto"
            >
              {/* Header Bar with Collapse Button */}
              <div className="flex items-center justify-between px-3 py-1 bg-slate-950/85 border border-mars-border rounded-sm backdrop-blur-sm shadow-md">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  TELEMETRY GAUGES & POWER ROUTER
                </span>
                <button
                  onClick={() => {
                    soundEngine.playClick(650);
                    setIsHudCollapsed(true);
                  }}
                  className="btn-tactile px-2.5 py-0.5 rounded flex items-center gap-1 text-[11px] font-display font-bold tracking-wider border border-slate-700 text-slate-300 hover:text-white"
                  title="Collapse to Minimalist Compact Bar"
                  data-testid="collapse-hud-button"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>COLLAPSE HUD [⌄]</span>
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3.5 items-stretch">
                {/* Core Resource Telemetry Gauges (3-Dial Deck) */}
                <div className="hud-panel p-2 sm:p-3.5 rounded-sm flex-1 grid grid-cols-3 gap-1.5 sm:gap-2.5 shadow-2xl">
                  {/* Battery Telemetry Dial */}
                  <ResourceDial
                    label="Battery Grid"
                    value={battery}
                    displayValue={battery.toFixed(1)}
                    unit="%"
                    subtext={`${batteryKwh.toFixed(1)} / ${batteryCapacityKwh.toFixed(0)} kWh`}
                    percentage={battery}
                    status={batteryStatus}
                    icon={Zap}
                  />

                  {/* Oxygen Saturation Dial */}
                  <ResourceDial
                    label="Oxygen Level"
                    value={oxygen}
                    displayValue={oxygen.toFixed(1)}
                    unit="%"
                    subtext="SAFE LIMIT: >19.5%"
                    percentage={(oxygen / 25) * 100}
                    status={oxygenStatus}
                    icon={Heart}
                  />

                  {/* Habitat Temperature Dial */}
                  <ResourceDial
                    label="Thermal Balance"
                    value={temperature}
                    displayValue={`${temperature > 0 ? '+' : ''}${temperature.toFixed(1)}`}
                    unit="°C"
                    subtext="TARGET: +20.0°C"
                    percentage={Math.max(0, Math.min(100, ((temperature + 40) / 75) * 100))}
                    status={tempStatus}
                    icon={Thermometer}
                  />
                </div>

                {/* Tactile Power Router & Priority Deck */}
                <div className="hud-panel p-1 rounded-sm lg:w-96 shadow-2xl">
                  <PowerDistributor />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>

      {/* Emergency Event Pop-up Modal */}
      <EventModal />

      {/* Mission Debrief & Educational Scorecard Modal */}
      <DebriefModal />

      {/* Tactile Minecraft Backpack Inventory Modal */}
      <BackpackModal />

      {/* Canvas Confetti Reward Celebration */}
      <RewardCelebration />

      {/* Task 10.2: Chipi-Bot AI Companion with NASA Lore Dialogue */}
      <AstroBotCompanion />

      {/* Task 12.2: Touch Virtual Joystick (Always active for touch / mobile / testing) */}
      <div className="absolute bottom-28 left-4 sm:bottom-32 sm:left-6 pointer-events-auto z-30">
        <VirtualJoystick />
      </div>

      {/* Phase 15.1: Mini-Quiz STEM Cứu Nguy Khi Sụt Nguồn */}
      <BrownoutQuizModal />

      {/* Task 11.1 & 11.2: Classroom Room-PIN & Live Leaderboard Modal */}
      <ClassroomModal isOpen={isClassroomOpen} onClose={closeClassroom} />
    </div>
  );
};

export default MissionControlOverlay;

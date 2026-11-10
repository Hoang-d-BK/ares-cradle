import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Heart, 
  Thermometer, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  HelpCircle,
  X
} from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { useStoryStore } from '@/modules/store/useStoryStore';
import { soundEngine } from '@/modules/audio/soundEngine';

type ActiveMetric = 'battery' | 'oxygen' | 'temperature' | 'power' | 'shutter' | null;

export const HorizontalDatapadHUD: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>(null);

  const battery = useOutpostStore((state) => state.battery);
  const batteryKwh = useOutpostStore((state) => state.batteryKwh);
  const batteryCapacityKwh = useOutpostStore((state) => state.batteryCapacityKwh);
  const solarIntake = useOutpostStore((state) => state.solarIntake);
  const oxygen = useOutpostStore((state) => state.oxygen);
  const temperature = useOutpostStore((state) => state.temperature);
  const dustCoverage = useOutpostStore((state) => state.dustCoverage);
  const cleanDust = useOutpostStore((state) => state.cleanDust);

  const powerPriorityOxygen = useOutpostStore((state) => state.powerPriorityOxygen);
  const powerPriorityHeaters = useOutpostStore((state) => state.powerPriorityHeaters);
  const setPowerAllocation = useOutpostStore((state) => state.setPowerAllocation);

  const isStormShutterClosed = useOutpostStore((state) => state.isStormShutterClosed);
  const toggleStormShutter = useOutpostStore((state) => state.toggleStormShutter);
  const isDrivingRover = useOutpostStore((state) => state.isDrivingRover);

  // Status colors
  const batteryStatus = battery > 40 ? 'safe' : battery > 15 ? 'warning' : 'critical';
  const oxygenStatus = oxygen > 19.5 ? 'safe' : oxygen > 16.0 ? 'warning' : 'critical';
  const tempStatus = temperature >= 10 && temperature <= 25 ? 'safe' : temperature >= 0 ? 'warning' : 'critical';

  const statusColorMap = {
    safe: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    warning: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    critical: 'text-rose-400 border-rose-500/50 bg-rose-950/50 animate-pulse'
  };

  const handleTileClick = (metric: ActiveMetric) => {
    soundEngine.playClick(1050);
    setActiveMetric((prev) => (prev === metric ? null : metric));
  };

  const currentChapter = useStoryStore((state) => state.getCurrentChapter());
  const solNumber = currentChapter?.sol || 1;
  const solBorder = solNumber >= 20 
    ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.18)]' 
    : solNumber >= 12 
    ? 'border-teal-500/40 shadow-[0_0_20px_rgba(20,184,166,0.18)]' 
    : solNumber >= 9 
    ? 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.18)]' 
    : solNumber >= 5 
    ? 'border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.18)]' 
    : 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.18)]';

  // If driving rover, keep the bottom clear for the Cockpit Driving Deck
  if (isDrivingRover) return null;

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none font-mono">
      {/* ========================================================
          1. ANCHORED MICRO-LESSON POPOVER CARD (Above the Clicked Tile)
          ======================================================== */}
      <AnimatePresence>
        {activeMetric && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="mb-2 w-[340px] sm:w-[420px] rounded-2xl bg-slate-950/95 border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(0,0,0,0.8),0_0_15px_rgba(0,240,255,0.25)] p-4 text-slate-100 backdrop-blur-md"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <span className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                NASA ENGINEERING LESSON
              </span>
              <button
                onClick={() => setActiveMetric(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Metric-Specific Content & Action */}
            {activeMetric === 'battery' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-300">BATTERY GRID: {battery.toFixed(1)}%</span>
                  <span className="text-[10px] text-slate-400">{batteryKwh.toFixed(1)} / {batteryCapacityKwh.toFixed(0)} kWh</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">
                  Solar arrays generate power during daylight. Dust deposits block sunlight, cutting power generation drastically!
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">Solar Input: +{solarIntake.toFixed(1)} kW</span>
                  <button
                    onClick={() => {
                      cleanDust();
                      soundEngine.playSuccessChime();
                    }}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Wipe Dust ({(dustCoverage * 100).toFixed(0)}%)
                  </button>
                </div>
              </div>
            )}

            {activeMetric === 'oxygen' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-300">HABITAT O₂: {oxygen.toFixed(1)}%</span>
                  <span className="text-[10px] text-emerald-400 font-bold">NOMINAL: 20.9%</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">
                  Sabatier scrubbers extract pure O₂ from Martian CO₂ air. Levels below 16.0% cause hypoxia for astronauts!
                </p>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Priority Allocation: {powerPriorityOxygen}%</span>
                  <span className="text-emerald-400">Scrubber: ACTIVE</span>
                </div>
              </div>
            )}

            {activeMetric === 'temperature' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-cyan-300">HABITAT TEMP: {temperature > 0 ? '+' : ''}{temperature.toFixed(1)}°C</span>
                  <span className="text-[10px] text-slate-400">EXTERIOR: -60°C</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">
                  Mars ambient temperature drops to -60°C at night. Base thermal radiators require continuous power to stay warm.
                </p>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Heater Priority: {powerPriorityHeaters}%</span>
                  <span className="text-cyan-400">Thermal Coils: ACTIVE</span>
                </div>
              </div>
            )}

            {activeMetric === 'power' && (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Sliders className="w-3 h-3" />
                    POWER ROUTER BALANCE
                  </span>
                  <span className="text-[11px] text-cyan-300">{powerPriorityOxygen}% O₂ / {powerPriorityHeaters}% HEAT</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">
                  Slide to ration energy between life support oxygen generators and habitat thermal heaters.
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={powerPriorityOxygen}
                  onChange={(e) => {
                    const o2Val = parseInt(e.target.value);
                    setPowerAllocation(o2Val, 100 - o2Val);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>
            )}

            {activeMetric === 'shutter' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-orange-300">STORM BLAST SHUTTER</span>
                  <span className="text-[10px] font-bold text-cyan-400">
                    {isStormShutterClosed ? 'BUNKER CLOSED' : 'DOME EXPOSED'}
                  </span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">
                  Lower interlocking titanium petals to protect the aerogel observation glass during intense Martian sandstorms.
                </p>
                <button
                  onClick={toggleStormShutter}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isStormShutterClosed
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isStormShutterClosed ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      DISENGAGE SHUTTER (OPEN DOME)
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      ENGAGE SHUTTER (SEAL BUNKER)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Little Anchor Pointer Notch at Bottom of Popover */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-950 border-r-2 border-b-2 border-cyan-500/50 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          2. MINIMALIST HORIZONTAL HUD BAR (Non-Overlapping)
          ======================================================== */}
      <div className={`flex items-center gap-1.5 sm:gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-950/90 border ${solBorder} backdrop-blur-md text-xs`}>
        
        {/* Tile 1: Battery Grid */}
        <button
          onClick={() => handleTileClick('battery')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
            activeMetric === 'battery'
              ? 'ring-2 ring-cyan-400 bg-cyan-950/80'
              : statusColorMap[batteryStatus]
          }`}
          title="Click to view Battery Telemetry & Science Lesson"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="font-bold">{battery.toFixed(0)}%</span>
        </button>

        {/* Tile 2: Habitat Oxygen */}
        <button
          onClick={() => handleTileClick('oxygen')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
            activeMetric === 'oxygen'
              ? 'ring-2 ring-cyan-400 bg-cyan-950/80'
              : statusColorMap[oxygenStatus]
          }`}
          title="Click to view Oxygen Telemetry & Science Lesson"
        >
          <Heart className="w-3.5 h-3.5" />
          <span className="font-bold">{oxygen.toFixed(1)}%</span>
        </button>

        {/* Tile 3: Habitat Temperature */}
        <button
          onClick={() => handleTileClick('temperature')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
            activeMetric === 'temperature'
              ? 'ring-2 ring-cyan-400 bg-cyan-950/80'
              : statusColorMap[tempStatus]
          }`}
          title="Click to view Thermal Telemetry & Science Lesson"
        >
          <Thermometer className="w-3.5 h-3.5" />
          <span className="font-bold">{temperature > 0 ? '+' : ''}{temperature.toFixed(0)}°C</span>
        </button>

        {/* Tile 4: Power Router Balance */}
        <button
          onClick={() => handleTileClick('power')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-700 bg-slate-900/80 text-cyan-300 hover:border-cyan-500/60 transition-all cursor-pointer ${
            activeMetric === 'power' ? 'ring-2 ring-cyan-400' : ''
          }`}
          title="Click to adjust Power Router ratio"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px] font-bold">ROUTER</span>
        </button>

        {/* Tile 5: Storm Shutter Status */}
        <button
          onClick={() => handleTileClick('shutter')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
            isStormShutterClosed
              ? 'border-amber-500/50 bg-amber-950/60 text-amber-300'
              : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:text-slate-200'
          } ${activeMetric === 'shutter' ? 'ring-2 ring-cyan-400' : ''}`}
          title="Click to manage Storm Shutter Mode"
        >
          {isStormShutterClosed ? (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline text-[11px] font-bold">
            {isStormShutterClosed ? 'SEALED' : 'SHUTTER'}
          </span>
        </button>

      </div>
    </div>
  );
};

export default HorizontalDatapadHUD;

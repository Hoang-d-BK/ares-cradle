import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tablet, 
  X, 
  Zap, 
  Heart, 
  Thermometer, 
  ShieldAlert, 
  ShieldCheck, 
  BatteryCharging, 
  Flashlight, 
  Wind, 
  Sparkles
} from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';

const tabletSpring = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 28,
  mass: 0.85
};

export const AstronautDatapad: React.FC = () => {
  const isDatapadOpen = useOutpostStore((state) => state.isDatapadOpen);
  const toggleDatapad = useOutpostStore((state) => state.toggleDatapad);
  const closeDatapad = useOutpostStore((state) => state.closeDatapad);

  const battery = useOutpostStore((state) => state.battery);
  const batteryKwh = useOutpostStore((state) => state.batteryKwh);
  const batteryCapacityKwh = useOutpostStore((state) => state.batteryCapacityKwh);
  const oxygen = useOutpostStore((state) => state.oxygen);
  const temperature = useOutpostStore((state) => state.temperature);
  const dustCoverage = useOutpostStore((state) => state.dustCoverage);
  const cleanDust = useOutpostStore((state) => state.cleanDust);

  const powerPriorityOxygen = useOutpostStore((state) => state.powerPriorityOxygen);
  const powerPriorityHeaters = useOutpostStore((state) => state.powerPriorityHeaters);
  const setPowerAllocation = useOutpostStore((state) => state.setPowerAllocation);
  const emergencyPowerSaver = useOutpostStore((state) => state.emergencyPowerSaver);
  const toggleEmergencySaver = useOutpostStore((state) => state.toggleEmergencySaver);

  const isStormShutterClosed = useOutpostStore((state) => state.isStormShutterClosed);
  const toggleStormShutter = useOutpostStore((state) => state.toggleStormShutter);
  const isRoverDocked = useOutpostStore((state) => state.isRoverDocked);
  const isFlashlightOn = useOutpostStore((state) => state.isFlashlightOn);
  const toggleFlashlight = useOutpostStore((state) => state.toggleFlashlight);

  // Keyboard shortcut [Tab] or [P] to toggle Datapad
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'KeyP' || e.code === 'Tab') {
        e.preventDefault();
        toggleDatapad();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleDatapad]);

  return (
    <>
      {/* Floating Datapad Opener Pill (Corner Trigger) */}
      <motion.button
        onClick={toggleDatapad}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-30 pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.25)] backdrop-blur-md font-mono text-xs font-bold transition-colors"
        title="Toggle Astronaut Datapad [Tab / P]"
      >
        <Tablet className="w-4 h-4 text-cyan-300 animate-pulse" />
        <span className="tracking-wide">DATAPAD [P]</span>
        {isRoverDocked && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        )}
      </motion.button>

      {/* Main Sliding Space Tablet Modal */}
      <AnimatePresence>
        {isDatapadOpen && (
          <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-end p-2 sm:p-6 overflow-hidden">
            {/* Backdrop Dimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDatapad}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto"
            />

            {/* Astronaut Tablet Shell */}
            <motion.div
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={tabletSpring}
              className="relative w-full max-w-md h-[92vh] max-h-[720px] bg-slate-900/95 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8),0_0_15px_rgba(0,240,255,0.2)] flex flex-col pointer-events-auto overflow-hidden text-slate-100"
            >
              {/* Tablet Top Bezel & Screws */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-cyan-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
                  <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
                    ARES CADET DATAPAD // MK-IV
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded"
                    title={`Battery Storage: ${batteryKwh.toFixed(1)} / ${batteryCapacityKwh.toFixed(0)} kWh`}
                  >
                    BAT: {battery.toFixed(0)}% ({batteryKwh.toFixed(0)} kWh)
                  </span>
                  <button
                    onClick={closeDatapad}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Datapad Screen Content */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-sm">
                
                {/* 1. Outpost Power Distribution (O2 vs Heaters) */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      POWER ROUTER ALLOCATION
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400">
                      {powerPriorityOxygen}% O2 / {powerPriorityHeaters}% HEAT
                    </span>
                  </div>

                  {/* Dual Allocation Slider */}
                  <div className="space-y-1.5">
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
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span className="text-emerald-400">🫁 100% Oxygen (Scrubbers)</span>
                      <span className="text-amber-400">🔥 100% Thermal (Heaters)</span>
                    </div>
                  </div>

                  {/* Emergency Power Saver Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-xs text-slate-300">Emergency Power Saver (-15% Drain)</span>
                    <button
                      onClick={toggleEmergencySaver}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                        emergencyPowerSaver
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {emergencyPowerSaver ? 'ENGAGED' : 'OFFLINE'}
                    </button>
                  </div>
                </div>

                {/* 2. Storm Shutter Bunker Mode (Dust Storm Blast Shield) */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-orange-400" />
                      STORM SHUTTER BLAST SHIELDS
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isStormShutterClosed
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {isStormShutterClosed ? 'BUNKER SEALED' : 'DOME EXPOSED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Lowers interlocking regolith titanium petals over aerogel glass during dust storms.
                  </p>
                  <button
                    onClick={toggleStormShutter}
                    className={`w-full py-2 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isStormShutterClosed
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                    }`}
                  >
                    {isStormShutterClosed ? (
                      <>
                        <ShieldAlert className="w-4 h-4 text-amber-200" />
                        DISENGAGE STORM SHIELD (OPEN DOME)
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        ENGAGE STORM BLAST PETALS (CLOSE DOME)
                      </>
                    )}
                  </button>
                </div>

                {/* 3. Rover Induction Dock Status */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                      ROVER RAMP INDUCTION DOCK
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isRoverDocked
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isRoverDocked ? 'LOCKED & CHARGING' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Drive Rover up the front ramp pad to establish magnetic lock and recharge.
                  </p>
                </div>

                {/* 4. Equipment Quick Controls: Flashlight & Sonic Wiper */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* EVA Flashlight */}
                  <button
                    onClick={toggleFlashlight}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isFlashlightOn
                        ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Flashlight className="w-4 h-4" />
                    <span className="font-mono text-xs font-bold">FLASHLIGHT [F]</span>
                    <span className="text-[10px] font-sans text-slate-400">
                      {isFlashlightOn ? 'BEAM ACTIVE' : 'OFFLINE'}
                    </span>
                  </button>

                  {/* Dust Cleaning */}
                  <button
                    onClick={() => {
                      soundEngine.playClick(1100);
                      cleanDust();
                    }}
                    className="p-3 rounded-xl border bg-slate-950/70 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:text-amber-300 flex flex-col items-center justify-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-mono text-xs font-bold">WIPE PANELS</span>
                    <span className="text-[10px] font-sans text-slate-400">
                      Dust: {(dustCoverage * 100).toFixed(0)}%
                    </span>
                  </button>
                </div>

                {/* 5. Habitat Vitals Snapshot */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-[10px] text-slate-400">O2 PURITY</div>
                      <div className="font-bold text-emerald-400">{oxygen.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-[10px] text-slate-400">HABITAT TEMP</div>
                      <div className="font-bold text-cyan-300">
                        {temperature > 0 ? '+' : ''}{temperature.toFixed(1)}°C
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Tablet Bottom Bezel & Navigation Indicator */}
              <div className="px-4 py-2 bg-slate-950 border-t border-cyan-500/30 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>PRESS [TAB] OR [P] TO MINIMIZE</span>
                <span className="text-cyan-400">SYS OK</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AstronautDatapad;

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sliders, 
  Wind, 
  Thermometer, 
  ShieldAlert, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

const springPhysics = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 28,
  mass: 0.8
};

export const PowerDistributor: React.FC = () => {
  const powerPriorityOxygen = useOutpostStore((state) => state.powerPriorityOxygen);
  const powerPriorityHeaters = useOutpostStore((state) => state.powerPriorityHeaters);
  const setPowerAllocation = useOutpostStore((state) => state.setPowerAllocation);
  const emergencyPowerSaver = useOutpostStore((state) => state.emergencyPowerSaver);
  const toggleEmergencySaver = useOutpostStore((state) => state.toggleEmergencySaver);
  const netPower = useOutpostStore((state) => state.netPower);
  const solarIntake = useOutpostStore((state) => state.solarIntake);

  const isCharging = netPower >= 0;

  const handlePreset = (o2: number) => {
    setPowerAllocation(o2, 100 - o2);
  };

  return (
    <div className="flex flex-col justify-between p-4 bg-slate-900/60 border border-mars-border rounded-sm gap-3 select-none">
      {/* Header: Title & Net Power Telemetry */}
      <div className="flex items-center justify-between border-b border-mars-border/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-mars-cyan" />
          <span className="text-xs font-display font-bold tracking-wider text-slate-100 uppercase">
            Power Router Deck
          </span>
        </div>

        {/* Real-time Net Balance Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-mars-border">
          <span className="text-[10px] font-mono text-slate-400">
            SOLAR <span className="text-mars-amber font-semibold">{solarIntake.toFixed(1)} kW</span> |
          </span>
          <Zap className="w-3 h-3 text-mars-amber" />
          <span className="text-[10px] font-mono text-slate-400">NET:</span>
          <span
            className={`text-xs font-mono font-bold flex items-center ${
              isCharging ? 'text-mars-emerald' : 'text-mars-crimson'
            }`}
          >
            {isCharging ? (
              <ArrowUpRight className="w-3.5 h-3.5 inline" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 inline" />
            )}
            {Math.abs(netPower).toFixed(1)} kW
          </span>
        </div>
      </div>

      {/* Allocation Percentages & Subsystem Indicators */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-mars-cyan">
          <Wind className="w-3.5 h-3.5" />
          <span className="font-semibold">OXYGEN: {powerPriorityOxygen}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-mars-rust">
          <Thermometer className="w-3.5 h-3.5" />
          <span className="font-semibold">HEATERS: {powerPriorityHeaters}%</span>
        </div>
      </div>

      {/* Tactile Power Priority Slider */}
      <div className="relative flex items-center gap-2 py-1.5">
        <Wind className="w-4 h-4 text-mars-cyan shrink-0" />
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={powerPriorityOxygen}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPowerAllocation(val, 100 - val);
            }}
            className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-mars-cyan focus:outline-none border border-mars-border touch-none"
          />
        </div>
        <Thermometer className="w-4 h-4 text-mars-rust shrink-0" />
      </div>

      {/* Quick Tactile Preset Buttons for Young Cadets */}
      <div className="grid grid-cols-3 gap-1.5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => handlePreset(50)}
          className={`py-1.5 text-[10px] font-mono font-medium rounded border transition-colors touch-manipulation active:scale-95 ${
            powerPriorityOxygen === 50
              ? 'bg-mars-cyan/20 border-mars-cyan text-mars-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]'
              : 'bg-slate-950 border-mars-border text-slate-400 hover:text-slate-200'
          }`}
        >
          50/50 BALANCED
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => handlePreset(75)}
          className={`py-1.5 text-[10px] font-mono font-medium rounded border transition-colors touch-manipulation active:scale-95 ${
            powerPriorityOxygen === 75
              ? 'bg-mars-cyan/20 border-mars-cyan text-mars-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]'
              : 'bg-slate-950 border-mars-border text-slate-400 hover:text-slate-200'
          }`}
        >
          75/25 O₂ SURGE
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => handlePreset(25)}
          className={`py-1.5 text-[10px] font-mono font-medium rounded border transition-colors touch-manipulation active:scale-95 ${
            powerPriorityOxygen === 25
              ? 'bg-mars-rust/20 border-mars-rust text-mars-rust shadow-[0_0_8px_rgba(193,68,14,0.3)]'
              : 'bg-slate-950 border-mars-border text-slate-400 hover:text-slate-200'
          }`}
        >
          25/75 HEAT SHIELD
        </motion.button>
      </div>

      {/* Emergency Power Saver Push Toggle */}
      <motion.button
        transition={springPhysics}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleEmergencySaver}
        className={`w-full py-2.5 px-3 rounded text-xs font-display font-bold flex items-center justify-center gap-2 border transition-all ${
          emergencyPowerSaver
            ? 'btn-tactile-rust border-mars-amber shadow-[0_0_12px_rgba(255,176,32,0.4)]'
            : 'btn-tactile border-mars-border-bright text-slate-200'
        }`}
      >
        <ShieldAlert className={`w-4 h-4 ${emergencyPowerSaver ? 'text-amber-300 animate-pulse' : 'text-slate-400'}`} />
        <span>
          {emergencyPowerSaver
            ? 'EMERGENCY PROTOCOL ACTIVE (-15% DRAIN)'
            : 'ENGAGE EMERGENCY POWER SAVER'}
        </span>
      </motion.button>
    </div>
  );
};

export default PowerDistributor;

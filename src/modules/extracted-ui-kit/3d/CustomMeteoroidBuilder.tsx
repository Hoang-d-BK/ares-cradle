import React, { useState } from 'react';
import { calculateImpactTelemetry, AsteroidParams, ImpactTelemetry } from '../maps/impactCalculations';

export interface CustomMeteoroidBuilderProps {
  onSimulate?: (params: AsteroidParams, telemetry: ImpactTelemetry) => void;
  className?: string;
}

const COMPOSITIONS = [
  { value: 'Rocky', label: '🪨 Rocky Regolith', density: 3000, desc: 'Silicate stone asteroid' },
  { value: 'Metallic', label: '⚙️ Metallic Core', density: 7800, desc: 'Dense iron-nickel alloy' },
  { value: 'Carbonaceous', label: '⚫ Carbonaceous', density: 1500, desc: 'Primitive carbon-rich matrix' },
  { value: 'Icy', label: '❄️ Subsurface Ice', density: 900, desc: 'Frozen volatiles & water ice' },
] as const;

export const CustomMeteoroidBuilder: React.FC<CustomMeteoroidBuilderProps> = ({
  onSimulate,
  className = 'w-full max-w-xl p-6 rounded-2xl bg-gray-950/80 backdrop-blur-xl border border-amber-500/30 text-gray-100 shadow-2xl',
}) => {
  const [params, setParams] = useState<AsteroidParams>({
    diameter: 300, // meters
    speed: 17,     // km/s
    angle: 45,     // degrees
    composition: 'Rocky',
  });

  const telemetry = calculateImpactTelemetry(params);

  const handleSimulateClick = () => {
    if (onSimulate) {
      onSimulate(params, telemetry);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-5">
        <div>
          <span className="text-xs font-mono tracking-widest text-amber-400 uppercase">
            Tactile Specimen Workbench
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white">Custom Meteoroid Fabricator</h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
          ☄️
        </div>
      </div>

      {/* Composition Selector */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase text-gray-400 mb-2">
            Material Composition
          </label>
          <div className="grid grid-cols-2 gap-2">
            {COMPOSITIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => setParams({ ...params, composition: c.value })}
                className={`p-3 rounded-xl text-left border transition-all text-xs font-mono ${
                  params.composition === c.value
                    ? 'border-amber-400 bg-amber-500/15 text-amber-200 shadow-[0_0_15px_rgba(255,126,41,0.25)]'
                    : 'border-gray-800 bg-gray-900/50 hover:bg-gray-800/80 text-gray-300'
                }`}
              >
                <div className="font-semibold text-sm mb-0.5">{c.label}</div>
                <div className="text-[10px] text-gray-400">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Diameter Slider */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-gray-400">Diameter</span>
            <span className="text-amber-400 font-bold">{params.diameter} meters</span>
          </div>
          <input
            type="range"
            min={10}
            max={2000}
            step={10}
            value={params.diameter}
            onChange={(e) => setParams({ ...params, diameter: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Velocity Slider */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-gray-400">Entry Velocity</span>
            <span className="text-amber-400 font-bold">{params.speed} km/s</span>
          </div>
          <input
            type="range"
            min={11}
            max={72}
            step={1}
            value={params.speed}
            onChange={(e) => setParams({ ...params, speed: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Real-Time Predicted Yield Badge */}
        <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 grid grid-cols-3 gap-2 text-center font-mono">
          <div>
            <div className="text-[10px] text-gray-400">Yield Energy</div>
            <div className="text-sm font-bold text-amber-400">{telemetry.energyMegatons} MT</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Crater Dia.</div>
            <div className="text-sm font-bold text-cyan-400">{telemetry.craterDiameterMeters} m</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400">Seismic Mag.</div>
            <div className="text-sm font-bold text-red-400">M {telemetry.seismicMagnitude}</div>
          </div>
        </div>

        <button
          onClick={handleSimulateClick}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold font-mono text-sm tracking-wide shadow-[0_0_20px_rgba(255,126,41,0.4)] transition-all active:scale-[0.98]"
        >
          Compute Planetary Impact Orbit
        </button>
      </div>
    </div>
  );
};

export default CustomMeteoroidBuilder;

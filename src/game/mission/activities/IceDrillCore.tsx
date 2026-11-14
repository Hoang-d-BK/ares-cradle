import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../state/store';
import { Snowflake, CheckCircle2, AlertCircle, Gauge, Tag } from 'lucide-react';

export const IceDrillCore: React.FC = () => {
  const completeMinigame = useMissionStore((s) => s.completeMinigame);
  const surveys = useMissionStore((s) => s.surveys);
  const perks = surveys.ice.unlockedPerkIds;

  const hasBandPerk = perks.includes('perk_ice_band');
  const hasMnemonicPerk = perks.includes('perk_ice_mnemonic');

  const minSafe = hasBandPerk ? 20 : 30;
  const maxSafe = hasBandPerk ? 80 : 70;

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [motorPower, setMotorPower] = useState<number>(50);
  const [drillProgress, setDrillProgress] = useState<number>(0);
  const [isDrilling, setIsDrilling] = useState<boolean>(false);
  const [isSealed, setIsSealed] = useState<boolean>(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Dynamic fluctuation during extraction
  useEffect(() => {
    if (!isDrilling || activeStep !== 2) return;

    const interval = setInterval(() => {
      setMotorPower((prev) => {
        // Natural drift
        const delta = (Math.random() - 0.48) * 8;
        const next = Math.max(0, Math.min(100, Math.round(prev + delta)));

        // Check if in safe corridor
        if (next >= minSafe && next <= maxSafe) {
          setDrillProgress((p) => {
            const nextP = p + 5;
            if (nextP >= 100) {
              setIsDrilling(false);
              setActiveStep(3);
              return 100;
            }
            return nextP;
          });
          setWarning(null);
        } else {
          setWarning(`Motor speed (${next}%) out of optimal cryogenic stability corridor (${minSafe}–${maxSafe}%)! Adjust throttle.`);
        }

        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isDrilling, activeStep, minSafe, maxSafe]);

  const handleStep1 = () => {
    setActiveStep(2);
    setDrillProgress(10);
    setIsDrilling(true);
  };

  const handleAdjustThrottle = (delta: number) => {
    setMotorPower((prev) => Math.max(0, Math.min(100, prev + delta)));
  };

  const handleSeal = () => {
    setIsSealed(true);
    setTimeout(() => {
      completeMinigame('ice');
    }, 900);
  };

  return (
    <div className="flex flex-col h-full bg-[#1C2026] text-[#F4F1EA] p-6 rounded-lg font-sans border-2 border-[#00D2FF]/40 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F4F1EA]/10 pb-4 mb-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#00D2FF] uppercase font-bold">Scientific Activity — Sealed Ice Cliff</span>
          <h2 className="text-2xl font-bold text-[#F4F1EA]">Cryogenic Core Extraction Protocol</h2>
          <p className="text-sm text-[#F4F1EA]/70">
            Penetrate lag mantle, extract a banded permafrost core in the stability window ({minSafe}%–{maxSafe}%), and seal container.
          </p>
        </div>
        <Snowflake className="w-8 h-8 text-[#00D2FF]" />
      </div>

      {/* Perks Badge if unlocked */}
      {(hasBandPerk || hasMnemonicPerk) && (
        <div className="flex gap-2 mb-4">
          {hasBandPerk && (
            <span className="px-2 py-1 bg-[#00D2FF]/20 border border-[#00D2FF] text-[#00D2FF] text-xs font-mono rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Wide Stability Corridor ({minSafe}%–{maxSafe}%) Active
            </span>
          )}
          {hasMnemonicPerk && (
            <span className="px-2 py-1 bg-[#FFB800]/20 border border-[#FFB800] text-[#FFB800] text-xs font-mono rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Advance → Check → Seal Protocol Active
            </span>
          )}
        </div>
      )}

      {/* 3 Step Sequence Indicator */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div
          className={`p-3 rounded border text-center font-mono text-xs ${
            activeStep >= 1 ? 'border-[#00D2FF] bg-[#00D2FF]/10 text-[#00D2FF] font-bold' : 'border-[#F4F1EA]/10 opacity-50'
          }`}
        >
          1. Advance Bit (1m Mantle)
        </div>
        <div
          className={`p-3 rounded border text-center font-mono text-xs ${
            activeStep >= 2 ? 'border-[#00D2FF] bg-[#00D2FF]/10 text-[#00D2FF] font-bold' : 'border-[#F4F1EA]/10 opacity-50'
          }`}
        >
          2. Extract Core ({drillProgress}%)
        </div>
        <div
          className={`p-3 rounded border text-center font-mono text-xs ${
            activeStep >= 3 ? 'border-[#00D2FF] bg-[#00D2FF]/10 text-[#00D2FF] font-bold' : 'border-[#F4F1EA]/10 opacity-50'
          }`}
        >
          3. Tag & Seal Canister
        </div>
      </div>

      {/* Interactive Main Body */}
      <div className="flex-1 flex flex-col justify-center items-center max-w-xl mx-auto w-full space-y-6">
        {activeStep === 1 && (
          <div className="text-center space-y-4">
            <p className="text-sm text-[#F4F1EA]/80">
              The rover drill arm is aligned with the glacial wall. Press below to drill through the dry lag regolith mantle.
            </p>
            <button
              type="button"
              onClick={handleStep1}
              className="px-8 py-3 bg-[#00D2FF] hover:bg-[#33dcff] text-black font-bold uppercase rounded tracking-wider shadow-lg"
            >
              Advance Drill Bit into Cliff
            </button>
          </div>
        )}

        {activeStep === 2 && (
          <div className="w-full space-y-5 bg-[#16191E] p-6 rounded-xl border border-[#F4F1EA]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-[#00D2FF]" />
                <span className="font-mono text-sm font-bold text-[#F4F1EA]">Motor Throttle Speed</span>
              </div>
              <span className="font-mono text-lg font-bold text-[#00D2FF]">{motorPower}%</span>
            </div>

            {/* Gauge Stability Bar */}
            <div className="space-y-1">
              <div className="relative h-6 bg-black/60 rounded-full overflow-hidden border border-[#F4F1EA]/30">
                {/* Safe zone highlight */}
                <div
                  className="absolute top-0 bottom-0 bg-green-500/30 border-x border-green-400"
                  style={{ left: `${minSafe}%`, width: `${maxSafe - minSafe}%` }}
                />
                {/* Pointer indicator */}
                <div
                  className="absolute top-0 bottom-0 w-2 bg-[#FF5A1F] shadow-lg -ml-1 transition-all duration-150"
                  style={{ left: `${motorPower}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#F4F1EA]/60">
                <span>0%</span>
                <span className="text-green-400">Target: {minSafe}%–{maxSafe}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Throttle Controls */}
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => handleAdjustThrottle(-10)}
                className="px-4 py-2 bg-[#252A33] hover:bg-[#323945] rounded font-mono text-sm font-bold border border-[#F4F1EA]/20"
              >
                - 10% RPM
              </button>
              <button
                type="button"
                onClick={() => handleAdjustThrottle(-3)}
                className="px-4 py-2 bg-[#252A33] hover:bg-[#323945] rounded font-mono text-sm font-bold border border-[#F4F1EA]/20"
              >
                - 3% RPM
              </button>
              <button
                type="button"
                onClick={() => handleAdjustThrottle(3)}
                className="px-4 py-2 bg-[#252A33] hover:bg-[#323945] rounded font-mono text-sm font-bold border border-[#F4F1EA]/20"
              >
                + 3% RPM
              </button>
              <button
                type="button"
                onClick={() => handleAdjustThrottle(10)}
                className="px-4 py-2 bg-[#252A33] hover:bg-[#323945] rounded font-mono text-sm font-bold border border-[#F4F1EA]/20"
              >
                + 10% RPM
              </button>
            </div>

            {/* Core Extraction Progress Bar */}
            <div className="space-y-1 pt-2 border-t border-[#F4F1EA]/10">
              <div className="flex justify-between text-xs font-mono">
                <span>Core Depth Extracted</span>
                <span>{drillProgress}% / 100%</span>
              </div>
              <div className="h-3 bg-black/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00D2FF] transition-all duration-200"
                  style={{ width: `${drillProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="w-full text-center space-y-4 bg-[#16191E] p-6 rounded-xl border border-green-500/40">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <h3 className="text-xl font-bold text-[#F4F1EA]">Pristine Cryo Core Extracted!</h3>
            <div className="p-3 bg-black/40 rounded border border-[#F4F1EA]/10 text-xs font-mono text-left space-y-1">
              <p className="flex items-center gap-2 text-[#00D2FF]">
                <Tag className="w-3 h-3" /> Core ID: MARS-ICE-C4-082
              </p>
              <p>Depth: 1.35m beneath surface lag mantle</p>
              <p>Purity: 92% H2O solid crystalline ice</p>
              <p>Banding: 4 distinct annual micro-dust cycles</p>
            </div>

            <button
              type="button"
              disabled={isSealed}
              onClick={handleSeal}
              className="px-8 py-3 bg-[#00D2FF] hover:bg-[#33dcff] text-black font-bold uppercase rounded tracking-wider shadow-lg"
            >
              {isSealed ? 'Cryogenic Seal Locked!' : 'Apply Barcode & Seal Canister'}
            </button>
          </div>
        )}

        {warning && (
          <div className="p-3 bg-yellow-950/80 border border-yellow-500 text-yellow-200 text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-yellow-400" />
            <span>{warning}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-[#F4F1EA]/10 flex items-center justify-between text-xs text-[#F4F1EA]/60 font-mono">
        <span>Scientific rule: Raw permafrost ice is for paleoclimate research; potable water requires ECLSS purification.</span>
      </div>
    </div>
  );
};

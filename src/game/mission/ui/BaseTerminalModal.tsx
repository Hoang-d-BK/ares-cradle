import React, { useState } from 'react';
import { useMissionStore } from '../state/store';
import { RegionId, SafetyCheckId, BaseResources } from '../contract';
import { X, Zap, Utensils, Droplets, Wind, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

interface BaseTerminalModalProps {
  onClose: () => void;
}

export const BaseTerminalModal: React.FC<BaseTerminalModalProps> = ({ onClose }) => {
  const currentRegion = useMissionStore((s) => s.currentRegion);
  const supportBaseId = useMissionStore((s) => s.supportBaseId);
  const bases = useMissionStore((s) => s.bases);
  const setSupportBase = useMissionStore((s) => s.setSupportBase);
  const runSafetyCheck = useMissionStore((s) => s.runSafetyCheck);
  const transferCargo = useMissionStore((s) => s.transferCargo);
  const surveys = useMissionStore((s) => s.surveys);
  const setModal = useMissionStore((s) => s.setModal);
  const startShift = useMissionStore((s) => s.startShift);

  const activeBase = bases[supportBaseId] || bases[currentRegion];
  const currentSurvey = surveys[activeBase.id];

  // Cargo Transfer state
  const [targetBaseId, setTargetBaseId] = useState<RegionId>('dust');
  const [transferResource, setTransferResource] = useState<keyof BaseResources>('energy');
  const [transferAmount, setTransferAmount] = useState<number>(1);
  const [transferNotice, setTransferNotice] = useState<string | null>(null);

  const handleRunCheck = (checkId: SafetyCheckId) => {
    runSafetyCheck(activeBase.id, checkId);
  };

  const handleExecuteTransfer = () => {
    if (activeBase.id === targetBaseId) {
      setTransferNotice('Cannot transfer to the same base outpost.');
      return;
    }
    const success = transferCargo(activeBase.id, targetBaseId, transferResource, transferAmount);
    if (success) {
      setTransferNotice(`Successfully moved ${transferAmount} ${transferResource} to ${bases[targetBaseId].name}.`);
    } else {
      setTransferNotice(`Insufficient ${transferResource} at ${activeBase.name}.`);
    }
  };

  const allChecksPassed = activeBase.safetyChecks.diagnostics &&
                          activeBase.safetyChecks.shelter &&
                          activeBase.safetyChecks.comms;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-[#1C2026] border-2 border-[#00D2FF]/40 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#F4F1EA]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#F4F1EA]/10 bg-[#16191E]">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00D2FF]" />
            <div>
              <h2 className="text-xl font-bold font-mono tracking-wider text-[#F4F1EA] uppercase">
                {activeBase.name} — Command Terminal
              </h2>
              <p className="text-xs text-[#F4F1EA]/70">
                Outpost inventory, shift operations, safety readiness checks, and cargo logistics.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-[#F4F1EA]/10 rounded-lg text-[#F4F1EA]/70 hover:text-[#F4F1EA] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Base Selection Tabs */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(bases) as RegionId[]).map((id) => {
              const b = bases[id];
              const isSelected = b.id === activeBase.id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!b.isDiscovered}
                  onClick={() => setSupportBase(id)}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-[#00D2FF] text-black border-[#00D2FF] shadow-md'
                      : b.isDiscovered
                      ? 'bg-[#16191E] text-[#F4F1EA]/80 border-[#F4F1EA]/20 hover:border-[#F4F1EA]/40'
                      : 'bg-black/30 text-gray-600 border-transparent cursor-not-allowed'
                  }`}
                >
                  {b.name} {isSelected && '★'}
                </button>
              );
            })}
          </div>

          {/* 1. Inventory Status Grid (Invariant I09) */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase text-[#00D2FF] tracking-wider font-bold">
              1. Base Inventory Resupply Buffer
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#16191E] rounded-lg border border-[#F4F1EA]/10">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-5 h-5 text-[#FFB800]" />
                  <span className="text-xs font-mono text-[#F4F1EA]/50">Min: 8 EU</span>
                </div>
                <span className="text-2xl font-bold font-mono text-[#F4F1EA] block">
                  {activeBase.resources.energy} EU
                </span>
                <span className="text-[11px] text-[#F4F1EA]/60 font-mono">Reserve Power Grid</span>
              </div>

              <div className="p-4 bg-[#16191E] rounded-lg border border-[#F4F1EA]/10">
                <div className="flex items-center justify-between mb-2">
                  <Utensils className="w-5 h-5 text-orange-400" />
                  <span className="text-xs font-mono text-[#F4F1EA]/50">Min: 3 Meals</span>
                </div>
                <span className="text-2xl font-bold font-mono text-[#F4F1EA] block">
                  {activeBase.resources.meals} Meals
                </span>
                <span className="text-[11px] text-[#F4F1EA]/60 font-mono">Packaged Rations</span>
              </div>

              <div className="p-4 bg-[#16191E] rounded-lg border border-[#F4F1EA]/10">
                <div className="flex items-center justify-between mb-2">
                  <Droplets className="w-5 h-5 text-[#00D2FF]" />
                  <span className="text-xs font-mono text-[#F4F1EA]/50">Min: 3 Units</span>
                </div>
                <span className="text-2xl font-bold font-mono text-[#F4F1EA] block">
                  {activeBase.resources.water} Portions
                </span>
                <span className="text-[11px] text-[#F4F1EA]/60 font-mono">Tested Potable Water</span>
              </div>

              <div className="p-4 bg-[#16191E] rounded-lg border border-[#F4F1EA]/10">
                <div className="flex items-center justify-between mb-2">
                  <Wind className="w-5 h-5 text-cyan-300" />
                  <span className="text-xs font-mono text-[#F4F1EA]/50">Min: 3 Packs</span>
                </div>
                <span className="text-2xl font-bold font-mono text-[#F4F1EA] block">
                  {activeBase.resources.airPacks} Packs
                </span>
                <span className="text-[11px] text-[#F4F1EA]/60 font-mono">Consumable Air Tanks</span>
              </div>
            </div>
          </div>

          {/* 2. Regional Survey Shift Operations (I03 & I09) */}
          <div className="p-4 bg-[#16191E] rounded-lg border border-[#F4F1EA]/10 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <h3 className="uppercase text-[#FF5A1F] tracking-wider font-bold">
                2. Regional Survey Shift Operations (I03 & I09)
              </h3>
              <span className="text-[#F4F1EA]/60">
                Focal Points: {currentSurvey?.focalPointsDone.length || 0}/3 Logged
              </span>
            </div>

            {(!currentSurvey || currentSurvey.focalPointsDone.length < 2) && (
              <p className="text-[#F4F1EA]/70">
                ⚠️ Requires at least 2 focal point observations ({currentSurvey?.focalPointsDone.length || 0}/2) before starting the science activity. Explore regional landmarks on foot or via rover sortie.
              </p>
            )}

            {currentSurvey && currentSurvey.focalPointsDone.length >= 2 && !currentSurvey.essentialShiftPaid && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#FF5A1F]/10 border border-[#FF5A1F]/30 rounded">
                <div>
                  <span className="font-bold text-[#FF5A1F] block">Sufficient Evidence Collected!</span>
                  <span className="text-[#F4F1EA]/80">Shift Cost: 2 EU, 1 Meal, 1 Water, 1 Air Pack</span>
                </div>
                <button
                  type="button"
                  onClick={() => startShift(activeBase.id)}
                  className="px-4 py-2 bg-[#FF5A1F] hover:bg-[#ff723f] text-black font-bold uppercase rounded shadow"
                >
                  Commit Essential Shift Pack
                </button>
              </div>
            )}

            {currentSurvey && currentSurvey.essentialShiftPaid && !currentSurvey.minigameCompleted && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#00D2FF]/10 border border-[#00D2FF]/30 rounded">
                <div>
                  <span className="font-bold text-[#00D2FF] block">Shift Paid — Instruments Ready</span>
                  <span className="text-[#F4F1EA]/80">Launch the region's specialized scientific activity.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setModal('minigame');
                  }}
                  className="px-4 py-2 bg-[#00D2FF] hover:bg-[#34dcff] text-black font-bold uppercase rounded shadow"
                >
                  Launch Science Minigame
                </button>
              </div>
            )}

            {currentSurvey && currentSurvey.minigameCompleted && !currentSurvey.secondaryJobSelected && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded">
                <div>
                  <span className="font-bold text-[#FFB800] block">Science Activity Passed!</span>
                  <span className="text-[#F4F1EA]/80">Select one 2-EU engineering priority upgrade for this outpost.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setModal('decision');
                  }}
                  className="px-4 py-2 bg-[#FFB800] hover:bg-[#ffc833] text-black font-bold uppercase rounded shadow"
                >
                  Select Engineering Job (2 EU)
                </button>
              </div>
            )}

            {currentSurvey && currentSurvey.reportCompleted && (
              <div className="p-3 bg-green-950/40 border border-green-500 rounded text-green-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Regional Scientific Survey Report is fully certified and filed!</span>
              </div>
            )}
          </div>

          {/* 3. Mandatory Visual Safety Checks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase text-[#00D2FF] tracking-wider font-bold">
                3. Mandatory Safety Readiness Checks (Zero Cost)
              </h3>
              {allChecksPassed && (
                <span className="text-xs text-green-400 font-bold flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All Checks Certified
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Check 1 */}
              <div className={`p-4 rounded border flex flex-col justify-between ${
                activeBase.safetyChecks.diagnostics ? 'border-green-500 bg-green-950/20' : 'border-[#F4F1EA]/20 bg-[#16191E]'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#F4F1EA]">1. Life Support Diagnostics</span>
                    {activeBase.safetyChecks.diagnostics && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  </div>
                  <p className="text-xs text-[#F4F1EA]/70">
                    Verify oxygen loop valves, pressure seal buffers, and cabin temperature homeostasis.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={activeBase.safetyChecks.diagnostics}
                  onClick={() => handleRunCheck('diagnostics')}
                  className={`mt-4 py-2 px-3 rounded text-xs font-mono font-bold uppercase transition-all ${
                    activeBase.safetyChecks.diagnostics
                      ? 'bg-green-700/40 text-green-300 cursor-default'
                      : 'bg-[#FF5A1F] hover:bg-[#ff723f] text-black shadow'
                  }`}
                >
                  {activeBase.safetyChecks.diagnostics ? 'Passed ✓' : 'Run Diagnostics'}
                </button>
              </div>

              {/* Check 2 */}
              <div className={`p-4 rounded border flex flex-col justify-between ${
                activeBase.safetyChecks.shelter ? 'border-green-500 bg-green-950/20' : 'border-[#F4F1EA]/20 bg-[#16191E]'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#F4F1EA]">2. Triple-Berth Shelter</span>
                    {activeBase.safetyChecks.shelter && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  </div>
                  <p className="text-xs text-[#F4F1EA]/70">
                    Confirm 3 pressurized bunk modules and regolith radiation shielding for Leo + Ares-1.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={activeBase.safetyChecks.shelter}
                  onClick={() => handleRunCheck('shelter')}
                  className={`mt-4 py-2 px-3 rounded text-xs font-mono font-bold uppercase transition-all ${
                    activeBase.safetyChecks.shelter
                      ? 'bg-green-700/40 text-green-300 cursor-default'
                      : 'bg-[#FF5A1F] hover:bg-[#ff723f] text-black shadow'
                  }`}
                >
                  {activeBase.safetyChecks.shelter ? 'Verified ✓' : 'Verify Shelter'}
                </button>
              </div>

              {/* Check 3 */}
              <div className={`p-4 rounded border flex flex-col justify-between ${
                activeBase.safetyChecks.comms ? 'border-green-500 bg-green-950/20' : 'border-[#F4F1EA]/20 bg-[#16191E]'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#F4F1EA]">3. Deep-Space Comms Loop</span>
                    {activeBase.safetyChecks.comms && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  </div>
                  <p className="text-xs text-[#F4F1EA]/70">
                    Ping local relay mast and verify direct-to-Earth carrier signal frequency.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={activeBase.safetyChecks.comms}
                  onClick={() => handleRunCheck('comms')}
                  className={`mt-4 py-2 px-3 rounded text-xs font-mono font-bold uppercase transition-all ${
                    activeBase.safetyChecks.comms
                      ? 'bg-green-700/40 text-green-300 cursor-default'
                      : 'bg-[#FF5A1F] hover:bg-[#ff723f] text-black shadow'
                  }`}
                >
                  {activeBase.safetyChecks.comms ? 'Verified ✓' : 'Ping Comms Loop'}
                </button>
              </div>
            </div>
          </div>

          {/* 4. Inter-Base Cargo Transfer */}
          <div className="p-4 bg-[#16191E] rounded-lg border border-[#F4F1EA]/10 space-y-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#00D2FF]" />
              <h3 className="text-xs font-mono uppercase text-[#00D2FF] tracking-wider font-bold">
                4. Inter-Outpost Cargo Transfer
              </h3>
            </div>
            <p className="text-xs text-[#F4F1EA]/70">
              Move supplies between outposts to balance inventories before the Ares-1 arrival review.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[10px] font-mono text-[#F4F1EA]/60 uppercase block mb-1">Resource</label>
                <select
                  value={transferResource}
                  onChange={(e) => setTransferResource(e.target.value as keyof BaseResources)}
                  className="w-full bg-[#252A33] border border-[#F4F1EA]/20 rounded p-2 text-xs font-mono"
                >
                  <option value="energy">Energy (EU)</option>
                  <option value="meals">Meals (Rations)</option>
                  <option value="water">Clean Water (Units)</option>
                  <option value="airPacks">Air Packs (Tanks)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#F4F1EA]/60 uppercase block mb-1">Amount</label>
                <input
                  type="number"
                  min={1}
                  max={activeBase.resources[transferResource]}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#252A33] border border-[#F4F1EA]/20 rounded p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#F4F1EA]/60 uppercase block mb-1">Destination Outpost</label>
                <select
                  value={targetBaseId}
                  onChange={(e) => setTargetBaseId(e.target.value as RegionId)}
                  className="w-full bg-[#252A33] border border-[#F4F1EA]/20 rounded p-2 text-xs font-mono"
                >
                  {(Object.keys(bases) as RegionId[])
                    .filter((id) => bases[id].isDiscovered && id !== activeBase.id)
                    .map((id) => (
                      <option key={id} value={id}>
                        {bases[id].name}
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExecuteTransfer}
                className="py-2.5 px-4 bg-[#00D2FF] hover:bg-[#32dcff] text-black font-bold font-mono text-xs uppercase rounded transition-all shadow"
              >
                Transfer Cargo
              </button>
            </div>

            {transferNotice && (
              <p className="text-xs font-mono text-[#FFB800] mt-2">
                ℹ️ {transferNotice}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#16191E] border-t border-[#F4F1EA]/10 flex items-center justify-between text-xs font-mono">
          {activeBase.resources.energy < 2 || activeBase.resources.meals < 1 || activeBase.resources.water < 1 || activeBase.resources.airPacks < 1 ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                setModal('recovery');
              }}
              className="px-3 py-1.5 border border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800]/10 rounded flex items-center gap-1.5 animate-pulse"
            >
              ⚠️ Request Emergency Resupply (I04 Safety Net)
            </button>
          ) : (
            <span className="text-[#F4F1EA]/50">
              Outpost operating within standard supply thresholds.
            </span>
          )}
          <span className="text-[#F4F1EA]/60">
            Ares-1 arrival requires ≥8 EU, ≥3 Meals, ≥3 Water, ≥3 Air, and all 3 certified checks.
          </span>
        </div>
      </div>
    </div>
  );
};

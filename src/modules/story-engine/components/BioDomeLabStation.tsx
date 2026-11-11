import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStoryStore } from '@/modules/store/useStoryStore';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { HolographicArtifactViewer, ArtifactSpecimen } from '@/modules/extracted-ui-kit';
import { soundEngine } from '@/modules/audio/soundEngine';

export const BioDomeLabStation: React.FC = () => {
  const isLabStationOpen = useStoryStore((state) => state.isLabStationOpen);
  const setLabStationOpen = useStoryStore((state) => state.setLabStationOpen);
  const carriedVials = useStoryStore((state) => state.carriedVials);
  const emptyVialsIntoLab = useStoryStore((state) => state.emptyVialsIntoLab);
  const unlockDataCapsule = useStoryStore((state) => state.unlockDataCapsule);
  const openScienceCard = useStoryStore((state) => state.openScienceCard);
  const dataCapsules = useStoryStore((state) => state.dataCapsules);
  const addWater = useOutpostStore((state) => state.addWater);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [unlockedCapsuleIds, setUnlockedCapsuleIds] = useState<string[]>([]);

  // Escape key closes lab station
  useEffect(() => {
    if (!isLabStationOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLabStationOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLabStationOpen, setLabStationOpen]);

  if (!isLabStationOpen) return null;

  const getExpectedYieldLabel = (category: string, specimenId: string) => {
    if (category === 'ice') return '+1 Water Canister (25L) & +3.5% Habitat O₂';
    if (category === 'atmosphere') return '+4.0% MOXIE O₂ Synthesis & Catalyst Data';
    if (category === 'food') return '+1 Hydroponic Ration Pack & Crop Telemetry';
    if (specimenId.includes('hematite')) return '+1 Sorted Hematite Ore & Groundwater Capsule';
    return '+1 Sorted Regolith Ore & +1.2°C Thermal Cladding';
  };

  const handleRefine = () => {
    if (carriedVials.length === 0 || isAnalyzing) return;

    soundEngine.playAirlock(); // Centrifuge hiss/hum
    setIsAnalyzing(true);
    setAnalysisReport(null);

    setTimeout(() => {
      setIsAnalyzing(false);
      const processed = emptyVialsIntoLab();

      let waterCanistersAdded = 0;
      let mineralShardsAdded = 0;
      let rationsAdded = 0;
      let o2Added = 0;
      let tempAdded = 0;
      const newlyUnlockedIds: string[] = [];

      processed.forEach((vial) => {
        if (vial.category === 'ice') {
          waterCanistersAdded += 1;
          o2Added += 3.5;
        } else if (vial.category === 'atmosphere') {
          o2Added += 4.0;
        } else if (vial.category === 'food') {
          rationsAdded += 1;
        } else {
          // mineral (regolith / hematite)
          mineralShardsAdded += 1;
          tempAdded += 1.2;
        }

        if (vial.capsuleId) {
          unlockDataCapsule(vial.capsuleId);
          if (!newlyUnlockedIds.includes(vial.capsuleId)) {
            newlyUnlockedIds.push(vial.capsuleId);
          }
        }
      });

      if (waterCanistersAdded > 0) {
        addWater(waterCanistersAdded);
      }

      useOutpostStore.setState((s) => ({
        inventory: {
          ...s.inventory,
          mineral_shard: (s.inventory.mineral_shard ?? 0) + mineralShardsAdded,
          space_apple: (s.inventory.space_apple ?? 0) + rationsAdded
        },
        oxygen: Math.min(20.9, s.oxygen + o2Added),
        temperature: Math.min(21.5, s.temperature + tempAdded)
      }));

      // Build truthful, category-accurate report
      const yieldParts: string[] = [];
      if (mineralShardsAdded > 0) {
        yieldParts.push(`+${mineralShardsAdded} Sorted Regolith/Hematite Ore (+${tempAdded.toFixed(1)}°C thermal cladding)`);
      }
      if (waterCanistersAdded > 0) {
        yieldParts.push(`+${waterCanistersAdded} Purified Water Canister (${waterCanistersAdded * 25}L H₂O)`);
      }
      if (o2Added > 0) {
        yieldParts.push(`+${o2Added.toFixed(1)}% Habitat O₂ via electrolysis`);
      }
      if (rationsAdded > 0) {
        yieldParts.push(`+${rationsAdded} Hydroponic Calorie Ration Pack`);
      }

      soundEngine.playSuccessChime();
      setUnlockedCapsuleIds(newlyUnlockedIds);
      setAnalysisReport(
        `Spectrometry & ISRU Processing Complete (${processed.length} ${processed.length === 1 ? 'vial' : 'vials'}): Yielded ${yieldParts.join(', ')}. Unlocked ${newlyUnlockedIds.length} NASA Science Data ${newlyUnlockedIds.length === 1 ? 'Capsule' : 'Capsules'}.`
      );
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/88 font-mono select-none pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-station-title"
    >
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0 cursor-pointer" onClick={() => setLabStationOpen(false)} />

      <motion.div
        data-testid="biodome-lab-modal"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        className="hud-panel hud-corner-brackets relative z-10 w-full max-w-4xl max-h-[90vh] rounded-xl bg-[#111820] border border-cyan-500/50 shadow-2xl p-4 sm:p-6 text-[#EDF1EC] overflow-hidden flex flex-col pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="lab-station-title"
                  className="text-base sm:text-lg font-display font-bold text-white tracking-wide uppercase"
                >
                  Bio-Dome 3-Slot Chemical Sample Analyzer
                </h2>
                <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded font-bold">
                  ISRU SPECTROMETRY & REFINERY
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Analyze sealed field specimens to unlock NASA planetary science capsules and refine category-specific ISRU resources.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick(800);
              setLabStationOpen(false);
            }}
            data-testid="close-lab-btn"
            className="btn-tactile px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* 3 Interactive Specimen Trays */}
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-widest">
            Carried Field Specimen Vials ({carriedVials.length}/3 Sealed Tubes)
          </div>

          {carriedVials.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#151F2A] border border-dashed border-slate-700 text-center space-y-2">
              <span className="text-3xl block opacity-60">🧪</span>
              <div className="text-sm font-bold text-slate-200">
                All 3 Sample Analyzer Trays are Empty
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
                Explore the Martian surface (Solar Array Perimeter, Crater Alpha, North Glacier Trench, MOXIE Tower) to collect sealed specimens, then bring them here to analyze!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {carriedVials.map((vial, idx) => {
                const artifact: ArtifactSpecimen = {
                  id: vial.specimenId,
                  name: vial.name,
                  category: vial.category,
                  icon: vial.icon,
                  discoverySol: vial.solCollected ?? 1,
                  missionLore: vial.quickFact,
                  refinementYield: getExpectedYieldLabel(vial.category, vial.specimenId),
                  purityScore: 96
                };
                return (
                  <HolographicArtifactViewer
                    key={`${vial.specimenId}-${idx}`}
                    artifact={artifact}
                    onSoundTrigger={() => soundEngine.playClick(1200)}
                    onInspect={() => {
                      const capsule = dataCapsules.find((c) => c.id === vial.capsuleId);
                      if (capsule) openScienceCard(capsule);
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Honest Analysis Report Banner */}
          {analysisReport && (
            <motion.div
              data-testid="lab-analysis-report"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-100 text-xs font-sans leading-relaxed space-y-2"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg">✅</span>
                <span>{analysisReport}</span>
              </div>
              {unlockedCapsuleIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {unlockedCapsuleIds.map((capId) => {
                    const cap = dataCapsules.find((c) => c.id === capId);
                    if (!cap) return null;
                    return (
                      <button
                        key={capId}
                        type="button"
                        onClick={() => openScienceCard(cap)}
                        className="btn-tactile px-3 py-1 rounded text-xs font-mono text-cyan-200 border-cyan-400"
                      >
                        📖 Read Science Capsule: {cap.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            {carriedVials.length > 0
              ? `Ready to process ${carriedVials.length} sealed ${carriedVials.length === 1 ? 'specimen' : 'specimens'}`
              : 'Awaiting field specimens'}
          </span>

          <button
            type="button"
            data-testid="lab-refine-btn"
            onClick={handleRefine}
            disabled={carriedVials.length === 0 || isAnalyzing}
            className="btn-tactile-rust px-6 py-2.5 rounded-lg font-display font-bold text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer"
          >
            {isAnalyzing
              ? 'Spectrometer Analyzing... ⚡'
              : `Analyze & Refine ${carriedVials.length} ${carriedVials.length === 1 ? 'Sample' : 'Samples'} 🧪`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BioDomeLabStation;

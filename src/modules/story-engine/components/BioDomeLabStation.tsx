import React, { useState } from 'react';
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
  const restoreFullOxygen = useOutpostStore((state) => state.restoreFullOxygen);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);

  if (!isLabStationOpen) return null;

  const handleRefine = () => {
    if (carriedVials.length === 0 || isAnalyzing) return;

    soundEngine.playAirlock(); // Centrifuge hiss/hum
    setIsAnalyzing(true);
    setAnalysisReport(null);

    setTimeout(() => {
      setIsAnalyzing(false);
      const processed = emptyVialsIntoLab();

      // Convert resources
      processed.forEach((vial) => {
        if (vial.category === 'ice') {
          addWater(50);
          restoreFullOxygen();
        }
        if (vial.capsuleId) {
          unlockDataCapsule(vial.capsuleId);
        }
      });

      soundEngine.playSuccessChime();
      setAnalysisReport(
        `Analysis Complete! Processed ${processed.length} field specimens. Refined +50L Purified Water, restored 100% Oxygen, and unlocked ${processed.length} NASA Data Capsules.`
      );
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl font-mono select-none pointer-events-auto">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0 cursor-pointer" onClick={() => setLabStationOpen(false)} />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative z-10 w-full max-w-4xl max-h-[90vh] rounded-3xl bg-gray-950/95 border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(0,240,255,0.3)] p-4 sm:p-6 text-white overflow-hidden flex flex-col pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide uppercase">
                  Bio-Dome 3-Slot Chemical Sample Analyzer
                </h2>
                <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-bold">
                  AUTONOMOUS REFINERY
                </span>
              </div>
              <p className="text-xs text-gray-400 font-sans">
                Insert collected Martian field samples to refine life support water, oxygen, and structural alloys.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick(800);
              setLabStationOpen(false);
            }}
            className="w-8 h-8 rounded-xl bg-gray-900 border border-gray-700 hover:border-white text-gray-300 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 3 Interactive Specimen Trays */}
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
            Carried Field Specimen Trays ({carriedVials.length}/3 Filled)
          </div>

          {carriedVials.length === 0 ? (
            <div className="p-8 rounded-2xl bg-gray-900/40 border border-dashed border-gray-700 text-center space-y-2">
              <span className="text-4xl block opacity-40">🧪</span>
              <div className="text-sm font-bold text-gray-400">All 3 Sample Trays are Empty</div>
              <p className="text-xs text-gray-500 max-w-md mx-auto font-sans">
                Explore the Martian surface (Crater Alpha, North Glacier, Regolith Ridge) to collect geological specimens. Bring them back here to refine!
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
                  discoverySol: 1,
                  missionLore: vial.quickFact,
                  refinementYield: vial.category === 'ice' ? '+50L H2O & Full O2' : '+25 Alloy Plates',
                  purityScore: 96,
                };
                return (
                  <HolographicArtifactViewer
                    key={idx}
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

          {/* Analysis Report Banner */}
          {analysisReport && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 text-cyan-200 text-xs font-sans leading-relaxed flex items-center gap-3"
            >
              <span className="text-xl">✅</span>
              <span>{analysisReport}</span>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {carriedVials.length > 0 ? 'Specimens ready for refinement' : 'Awaiting field specimens'}
          </span>

          <button
            onClick={handleRefine}
            disabled={carriedVials.length === 0 || isAnalyzing}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
          >
            {isAnalyzing ? 'Centrifuge Refining... ⚡' : 'Refine Samples Into Survival Resources 🧪'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BioDomeLabStation;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  AlertOctagon, 
  RotateCcw, 
  ArrowRight, 
  Zap, 
  Heart, 
  Thermometer, 
  GraduationCap 
} from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

export const DebriefModal: React.FC = () => {
  const isVictory = useOutpostStore((state) => state.isVictory);
  const isGameOver = useOutpostStore((state) => state.isGameOver);
  const debriefReport = useOutpostStore((state) => state.debriefReport);
  const failureReason = useOutpostStore((state) => state.failureReason);
  const activeStageId = useOutpostStore((state) => state.activeStageId);
  const setStage = useOutpostStore((state) => state.setStage);
  const resetCurrentStage = useOutpostStore((state) => state.resetCurrentStage);

  if (!isVictory && !isGameOver) return null;

  const handleNextStage = () => {
    if (activeStageId < 3) {
      setStage(activeStageId + 1);
    } else {
      setStage(1);
    }
  };

  const score = debriefReport?.score ?? (isVictory ? 90 : 35);
  const tradeOffSummary = debriefReport?.tradeOffSummary || (
    isVictory 
      ? 'Optimal power allocation maintained throughout the Martian Sol.'
      : failureReason || 'Life support systems collapsed due to unmanaged power drain.'
  );
  const takeaway = debriefReport?.educationalTakeaway || (
    isVictory
      ? 'On Mars, energy cannot be wasted: every Watt allocated to life support requires conscious rationing during nighttime or storms.'
      : 'Engineering requires anticipation: charging batteries before the sun sets and clearing dust panels is essential for colony survival.'
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -15 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`hud-panel max-w-lg w-full p-6 rounded border-2 shadow-2xl ${
            isVictory
              ? 'border-mars-emerald bg-slate-950/95 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
              : 'border-mars-crimson bg-slate-950/95 shadow-[0_0_40px_rgba(239,68,68,0.3)]'
          }`}
        >
          {/* Header Banner */}
          <div className="flex items-center gap-3 border-b border-mars-border pb-4 mb-4">
            <div
              className={`p-3 rounded-full ${
                isVictory ? 'bg-emerald-500/20 text-mars-emerald' : 'bg-red-500/20 text-mars-crimson'
              }`}
            >
              {isVictory ? <Trophy className="w-8 h-8" /> : <AlertOctagon className="w-8 h-8" />}
            </div>

            <div className="flex-1">
              <span
                className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${
                  isVictory
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40'
                    : 'border-red-500/40 text-red-400 bg-red-950/40'
                }`}
              >
                {isVictory ? 'MISSION ACCOMPLISHED' : 'MISSION ABORTED'}
              </span>
              <h2 className="text-xl font-display font-bold tracking-wide text-slate-100 mt-1">
                {isVictory ? 'Cadet Debriefing: Sol Conquered' : 'Life Support Failure'}
              </h2>
            </div>

            {/* Score Badge */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono uppercase text-slate-400">Score</span>
              <span
                className={`font-mono text-2xl font-bold ${
                  isVictory ? 'text-mars-emerald' : 'text-mars-crimson'
                }`}
              >
                {score}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
          </div>

          {/* Core Telemetry Performance Readout */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded bg-slate-900 border border-slate-800 mb-4">
            <div className="flex flex-col items-center border-r border-slate-800 pr-2">
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase">
                <Zap className="w-3 h-3 text-mars-amber" />
                <span>Battery</span>
              </div>
              <span className="font-mono text-base font-bold text-slate-100 mt-0.5">
                {debriefReport ? debriefReport.finalBatteryPercent.toFixed(1) : '0.0'}%
              </span>
            </div>

            <div className="flex flex-col items-center border-r border-slate-800 pr-2">
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase">
                <Heart className="w-3 h-3 text-mars-cyan" />
                <span>Oxygen</span>
              </div>
              <span className="font-mono text-base font-bold text-slate-100 mt-0.5">
                {debriefReport ? debriefReport.finalOxygenPercent.toFixed(1) : '0.0'}%
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase">
                <Thermometer className="w-3 h-3 text-mars-rust" />
                <span>Thermal</span>
              </div>
              <span className="font-mono text-base font-bold text-slate-100 mt-0.5">
                {debriefReport ? debriefReport.finalTemperatureCelsius.toFixed(1) : '0.0'}°C
              </span>
            </div>
          </div>

          {/* Trade-off Explanation & Takeaway */}
          <div className="space-y-2.5 mb-5">
            <div className="p-3 rounded bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase block mb-1">
                ENGINEERING TRADE-OFF ANALYSIS
              </span>
              <p className="text-xs font-sans text-slate-200 leading-relaxed">
                {tradeOffSummary}
              </p>
            </div>

            <div className="p-3 rounded bg-slate-900/70 border border-slate-800 flex items-start gap-2.5">
              <GraduationCap className="w-4 h-4 text-mars-cyan shrink-0 mt-0.5" />
              <div className="text-xs font-mono text-slate-300">
                <span className="text-mars-cyan font-semibold uppercase block mb-0.5">
                  SPACE STEM LESSON:
                </span>
                {takeaway}
              </div>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={resetCurrentStage}
              className="btn-tactile py-2.5 px-4 rounded text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RETRY MISSION</span>
            </motion.button>

            {isVictory ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleNextStage}
                className="btn-tactile-rust py-2.5 px-4 rounded text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{activeStageId < 3 ? 'NEXT STAGE' : 'RESTART SOL 1'}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setStage(activeStageId)}
                className="btn-tactile-rust py-2.5 px-4 rounded text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <span>RE-ENGAGE CONTROLS</span>
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DebriefModal;

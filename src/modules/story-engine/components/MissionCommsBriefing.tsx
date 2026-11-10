import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/modules/store/useStoryStore';
import { KineticTextSpring } from '@/modules/extracted-ui-kit';
import { soundEngine } from '@/modules/audio/soundEngine';

export const MissionCommsBriefing: React.FC = () => {
  const isBriefingOpen = useStoryStore((state) => state.isBriefingOpen);
  const setBriefingOpen = useStoryStore((state) => state.setBriefingOpen);
  const currentChapter = useStoryStore((state) => state.getCurrentChapter());

  const [frameIndex, setFrameIndex] = useState(0);
  const frames = currentChapter.comicPrologue;
  const currentFrame = frames[frameIndex] || frames[0];

  if (!isBriefingOpen) return null;

  const handleNext = () => {
    soundEngine.playClick(1000);
    if (frameIndex + 1 < frames.length) {
      setFrameIndex(frameIndex + 1);
    } else {
      setFrameIndex(0);
      setBriefingOpen(false);
      soundEngine.playSuccessChime();
    }
  };

  const handleSkip = () => {
    soundEngine.playClick(800);
    setFrameIndex(0);
    setBriefingOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-mono select-none pointer-events-auto">
      {/* Backdrop click/tap to advance */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={handleNext}
        title="Tap backdrop to advance"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="relative z-10 w-full max-w-xl rounded-3xl bg-gray-950/95 border-2 border-amber-500/50 shadow-[0_0_50px_rgba(255,126,41,0.35)] p-5 sm:p-6 text-white overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest">
              MISSION COMMS TRANSMISSION • SOL {currentChapter.sol}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] sm:text-xs text-gray-400">
              FRAME {frameIndex + 1} / {frames.length}
            </span>
            <button
              onClick={handleSkip}
              className="min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl bg-gray-900 border border-gray-700 hover:border-amber-400 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all active:scale-95 cursor-pointer touch-manipulation"
              title="Close / Skip Briefing"
              aria-label="Close Briefing"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sol Title */}
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            SOL {currentChapter.sol}: {currentChapter.title.toUpperCase()}
          </h2>
          <p className="text-xs text-amber-300 font-sans">{currentChapter.subtitle}</p>
        </div>

        {/* Comic Dialogue Frame (Tap to advance) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={frameIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={handleNext}
            className="p-4 sm:p-5 rounded-2xl bg-gray-900/70 border border-amber-500/30 flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6 cursor-pointer touch-manipulation hover:bg-gray-900/90 transition-colors"
            title="Tap dialogue to advance"
          >
            {/* Speaker Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 p-0.5 shadow-lg shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-gray-950 flex items-center justify-center text-2xl sm:text-3xl">
                {currentFrame.avatar}
              </div>
            </div>

            {/* Dialogue */}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>{currentFrame.title}</span>
                <span className="text-[9px] text-gray-400 font-normal">Tap to continue ▾</span>
              </div>
              <div className="text-xs sm:text-sm font-sans text-gray-100 leading-relaxed">
                <KineticTextSpring
                  key={`frame-${frameIndex}`}
                  text={currentFrame.dialogue}
                  mode="word"
                  delay={0.1}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action Controls - 48px touch targets */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={handleSkip}
            className="min-h-[48px] px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer touch-manipulation flex items-center"
          >
            Skip Briefing
          </button>

          <button
            onClick={handleNext}
            className="min-h-[48px] px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,126,41,0.5)] transition-all active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
          >
            {frameIndex + 1 < frames.length ? 'Next Signal ➔' : 'Launch Sol Expedition 🚀'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MissionCommsBriefing;

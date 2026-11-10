import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export interface BadgeCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeTitle: string;
  badgeSubtitle?: string;
  badgeIcon?: string;
  scoreAwarded?: number;
  missionSol?: number;
  onSoundTrigger?: () => void;
}

/**
 * NASA Badge & STEM Score Celebration Modal
 * Engineered for Dopamine Feedback & Gamified Learning for Cadets (Ages 7-12)
 * Features canvas confetti burst, rolling point tally, and 3D floating badge.
 */
export const BadgeCelebrationModal: React.FC<BadgeCelebrationModalProps> = ({
  isOpen,
  onClose,
  badgeTitle,
  badgeSubtitle = 'Scientific Discovery Validated by Earth Command',
  badgeIcon = '🏅',
  scoreAwarded = 250,
  missionSol = 1,
  onSoundTrigger,
}) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setDisplayScore(0);
      return;
    }

    if (onSoundTrigger) {
      onSoundTrigger();
    }

    // Fire dual golden/cyan confetti cannons
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#FFB020', '#00F0FF', '#FF7E29', '#FFFFFF'],
      });
    } catch (_) {}

    // Rolling points tally
    let current = 0;
    const step = Math.max(1, Math.floor(scoreAwarded / 25));
    const interval = setInterval(() => {
      current += step;
      if (current >= scoreAwarded) {
        setDisplayScore(scoreAwarded);
        clearInterval(interval);
      } else {
        setDisplayScore(current);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [isOpen, scoreAwarded]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="relative w-full max-w-sm rounded-3xl p-6 bg-gray-950/95 border-2 border-amber-500/50 shadow-[0_0_50px_rgba(255,126,41,0.35)] text-center text-white font-mono overflow-hidden"
          >
            {/* Top Amber Radiance */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/25 blur-3xl pointer-events-none rounded-full" />

            {/* Sol Tag */}
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300 font-bold tracking-widest uppercase mb-3">
              SOL {missionSol} DISCOVERY ACCOMPLISHED
            </div>

            {/* Floating 3D Badge Halo */}
            <motion.div
              animate={{ y: [-6, 6, -6], rotate: [-3, 3, -3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 mx-auto my-3 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 p-1 shadow-[0_0_30px_rgba(255,176,32,0.5)] flex items-center justify-center"
            >
              <div className="w-full h-full rounded-xl bg-gray-950 flex items-center justify-center text-5xl">
                {badgeIcon}
              </div>
            </motion.div>

            {/* Title & Subtitle */}
            <h2 className="text-xl font-black tracking-tight text-white mb-1 uppercase drop-shadow">
              {badgeTitle}
            </h2>
            <p className="text-xs text-gray-400 font-sans leading-relaxed mb-4 px-2">
              {badgeSubtitle}
            </p>

            {/* Score Tally Readout */}
            <div className="p-3 rounded-2xl bg-black/60 border border-amber-500/30 flex items-center justify-between mb-5 font-mono">
              <span className="text-xs text-gray-400">STEM CADET SCORE</span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-amber-400">+{displayScore}</span>
                <span className="text-xs text-amber-500">PTS</span>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-black font-bold font-mono text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(255,126,41,0.5)] transition-all cursor-pointer"
            >
              Continue Mission ➔
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BadgeCelebrationModal;

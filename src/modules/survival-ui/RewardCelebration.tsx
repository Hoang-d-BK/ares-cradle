import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Star, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Checkpoint Milestone Reward Celebration with Canvas Confetti Explosion
 * Reserved exclusively for Sol Completion & Habitat Base Milestone Checkpoints.
 */
export const RewardCelebration: React.FC = () => {
  const isCelebrationOpen = useOutpostStore((state) => state.isCelebrationOpen);
  const celebrationData = useOutpostStore((state) => state.celebrationData);
  const dismissCelebration = useOutpostStore((state) => state.dismissCelebration);

  const fireConfetti = useCallback(() => {
    const colors = ['#00F0FF', '#FFB020', '#C1440E', '#10B981', '#FFFFFF'];

    confetti({
      particleCount: 65,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.7 },
      colors
    });

    confetti({
      particleCount: 65,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.7 },
      colors
    });

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors
      });
    }, 200);
  }, []);

  useEffect(() => {
    if (isCelebrationOpen) {
      document.exitPointerLock?.();
      fireConfetti();
    }
  }, [isCelebrationOpen, fireConfetti]);

  useEffect(() => {
    if (!isCelebrationOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        dismissCelebration();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCelebrationOpen, dismissCelebration]);

  if (!isCelebrationOpen || !celebrationData) return null;

  const stars = celebrationData.stars || 3;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        {/* Backdrop dismiss */}
        <div 
          className="absolute inset-0 cursor-pointer" 
          onClick={dismissCelebration} 
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="hud-panel hud-corner-brackets relative z-10 w-full max-w-md p-6 rounded-md border-2 border-mars-amber/50 bg-mars-charcoal/95 shadow-[0_0_35px_rgba(255,176,32,0.3)] text-center select-none"
        >
          {/* Explicit Close [X] Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissCelebration();
            }}
            className="absolute top-3 right-3 p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-20 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Trophy Crest */}
          <div className="mx-auto w-16 h-16 mb-3 rounded-full bg-mars-amber/15 border-2 border-mars-amber/40 flex items-center justify-center text-mars-amber shadow-[0_0_15px_rgba(255,176,32,0.4)]">
            <Trophy className="w-8 h-8 animate-bounce" />
          </div>

          {/* 3-Star Rating Deck */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3].map((starIdx) => (
              <motion.div
                key={starIdx}
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                  delay: starIdx * 0.12
                }}
              >
                <Star
                  className={`w-7 h-7 ${
                    starIdx <= stars
                      ? 'text-mars-amber fill-mars-amber filter drop-shadow-[0_0_8px_rgba(255,176,32,0.8)]'
                      : 'text-slate-600'
                  }`}
                />
              </motion.div>
            ))}
          </div>

          {/* Title & Description */}
          <h2 className="font-display font-extrabold text-2xl tracking-wider text-slate-100 uppercase mb-2">
            {celebrationData.title}
          </h2>
          <p className="text-xs font-mono text-slate-300 leading-relaxed mb-6 px-4">
            {celebrationData.subtitle}
          </p>

          {/* Achievement Checklist Pill */}
          <div className="mb-6 p-2.5 rounded bg-mars-surface border border-mars-border flex items-center justify-center gap-2 text-xs font-mono text-mars-emerald">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Martian Engineering Protocol Validated</span>
          </div>

          {/* Tactile Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissCelebration();
            }}
            className="btn-tactile-rust w-full py-3 px-4 rounded text-sm font-display font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>CONTINUE EXPEDITION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RewardCelebration;

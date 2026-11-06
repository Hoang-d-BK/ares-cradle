import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';
import chipiDialogue from '@/modules/story-engine/data/chipiDialogue.json';

const botSpringPhysics = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 24
};

/**
 * Task 10.2: AstroBotCompanion (Chipi-Bot)
 * Curious, comedic AI companion explaining NASA science lore in < 10 words.
 * Full compliance with Hallmark tokens & tactile spring physics.
 */
export const AstroBotCompanion: React.FC = () => {
  const activeEvents = useOutpostStore((state) => state.activeEvents);
  const solPhase = useOutpostStore((state) => state.solPhase);
  const oxygen = useOutpostStore((state) => state.oxygen);
  const battery = useOutpostStore((state) => state.battery);
  const isVictory = useOutpostStore((state) => state.isVictory);
  const isGameOver = useOutpostStore((state) => state.isGameOver);

  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);

  // Determine current context category
  const currentCategory = useMemo((): keyof typeof chipiDialogue => {
    if (isVictory) return 'victory';
    if (oxygen < 17.0) return 'low_oxygen';
    if (battery < 20.0) return 'low_battery';
    const isStormActive = activeEvents.some(
      (e) => e.active && !e.resolved && e.type === 'dust_storm'
    );
    if (isStormActive) return 'dust_storm';
    if (solPhase === 'Night') return 'night';
    return 'idle';
  }, [isVictory, oxygen, battery, activeEvents, solPhase]);

  // Current active speech bubble text
  const currentLine = useMemo(() => {
    const list = chipiDialogue[currentCategory] || chipiDialogue.idle;
    return list[dialogueIndex % list.length];
  }, [currentCategory, dialogueIndex]);

  // Periodic subtle speech update
  useEffect(() => {
    const timer = setInterval(() => {
      setDialogueIndex((prev) => prev + 1);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // When context switches (e.g. storm arrives), reset index to first relevant alert
  useEffect(() => {
    setDialogueIndex(0);
    setIsBubbleVisible(true);
  }, [currentCategory]);

  const handleBotClick = () => {
    soundEngine.playClick(1500);
    setDialogueIndex((prev) => prev + 1);
    setIsBubbleVisible(true);
  };

  if (isGameOver) return null;

  return (
    <aside
      aria-label="Chipi-Bot Companion"
      className="fixed bottom-24 right-4 z-30 flex flex-col items-end pointer-events-auto select-none"
    >
      {/* Dynamic Pop-up Speech Bubble */}
      <AnimatePresence mode="wait">
        {isBubbleVisible && (
          <motion.div
            key={currentLine}
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={botSpringPhysics}
            className="hud-panel hud-corner-brackets max-w-xs mb-2 p-2.5 rounded-sm border border-mars-cyan/40 bg-mars-surface/95 shadow-xl"
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono font-bold text-mars-cyan uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5 text-mars-cyan animate-pulse" />
              <span>Chipi-Bot • NASA Lore</span>
            </div>
            <p className="text-xs font-display font-semibold text-slate-100 leading-snug">
              {currentLine}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Animated Robot Head Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleBotClick}
        title="Tap Chipi-Bot for NASA Science Wisdom"
        className="btn-tactile p-3 rounded-full flex items-center justify-center border-2 border-mars-cyan/60 bg-mars-charcoal text-mars-cyan shadow-hud-glow relative"
      >
        <Bot className="w-6 h-6" />
        {/* Antenna Beacon Sparkle */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mars-cyan opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-mars-cyan" />
        </span>
      </motion.button>
    </aside>
  );
};

export default AstroBotCompanion;

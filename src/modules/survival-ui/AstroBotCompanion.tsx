import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X } from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';
import chipiDialogue from '@/modules/story-engine/data/chipiDialogue.json';

const botSpringPhysics = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 24
};

/**
 * Smart Offline Keyword Science Engine (Inspired by UniversalChatbot.js from NASA-Meteor-Rizzlers)
 * Always guarantees concise (< 20 words), engaging STEM answers for cadets aged 7-12.
 */
export function getSmartBotAnswer(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('dust') || q.includes('storm')) {
    return 'Airborne dust blocks sunlight and coats solar panels! Wipe panels often to maintain electrical current.';
  }
  if (q.includes('night') || q.includes('cold') || q.includes('freeze') || q.includes('heat')) {
    return 'Martian nights drop to -60°C! Turn on Emergency Saver and maintain a balanced 50/50 allocation.';
  }
  if (q.includes('oxygen') || q.includes('o2') || q.includes('air') || q.includes('breathe')) {
    return 'Oxygen generators need continuous electricity. Never let O₂ drop below 19.5% nominal!';
  }
  if (q.includes('sabatier') || q.includes('water')) {
    return 'NASA Sabatier reactors react Martian CO₂ with H₂ to produce breathable O₂ and drinkable water.';
  }
  if (q.includes('phobos') || q.includes('deimos') || q.includes('moon') || q.includes('sky')) {
    return 'Phobos orbits Mars 3 times per Sol! Deimos is slower. Press V to stargaze at both!';
  }
  if (q.includes('rover') || q.includes('drive') || q.includes('vehicle')) {
    return 'Press R or tap ROVER to drive across Mars, explore craters, and inspect outpost foundations!';
  }
  if (q.includes('battery') || q.includes('power') || q.includes('energy') || q.includes('brownout')) {
    return 'Store battery power during noon sunlight. If brownout strikes at night, answer the emergency quiz!';
  }
  return "I'm Chipi-Bot! Ask me about solar power, O₂ life support, night freeze, or Mars moons!";
}

const QUICK_PROMPTS = [
  'Why do dust storms drop solar power?',
  'How to survive freezing night without losing O₂?',
  'What is the Sabatier reactor?',
  'Tell me about Phobos and Deimos moons!'
];

/**
 * Phase 15.2: Multi-Tier AI AstroBot Companion (Chipi-Bot)
 * Combines periodic funny lore (< 10 words) with an interactive Q&A Drawer
 * powered by a robust Smart Offline Keyword Engine.
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'cadet' | 'chipi'; text: string }>>([
    {
      sender: 'chipi',
      text: "Greetings Cadet! I'm Chipi-Bot. Ask me any Mars science question!"
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Context category for passive bubble
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

  const currentLine = useMemo(() => {
    const list = chipiDialogue[currentCategory] || chipiDialogue.idle;
    return list[dialogueIndex % list.length];
  }, [currentCategory, dialogueIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDialogueIndex((prev) => prev + 1);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setDialogueIndex(0);
    setIsBubbleVisible(true);
  }, [currentCategory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleBotClick = () => {
    soundEngine.playClick(1500);
    setIsChatOpen((prev) => !prev);
    setIsBubbleVisible(false);
  };

  const handleSendMessage = (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    soundEngine.playClick(1200);
    const answer = getSmartBotAnswer(trimmed);

    setChatLog((prev) => [
      ...prev,
      { sender: 'cadet', text: trimmed },
      { sender: 'chipi', text: answer }
    ]);
    setInputText('');
  };

  if (isGameOver) return null;

  return (
    <aside
      aria-label="Chipi-Bot Companion"
      className="fixed bottom-24 right-4 z-30 flex flex-col items-end pointer-events-auto select-none"
    >
      {/* Interactive Q&A Assistant Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={botSpringPhysics}
            className="hud-panel hud-corner-brackets w-80 sm:w-96 mb-3 p-3.5 rounded-md border border-mars-cyan bg-slate-950/95 shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-mars-border pb-2 mb-2.5">
              <div className="flex items-center gap-1.5 text-mars-cyan">
                <Bot className="w-4 h-4" />
                <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-100">
                  CHIPI-BOT • SCIENCE ADVISOR
                </span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                title="Close chat drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Message Scroll History */}
            <div className="max-h-52 overflow-y-auto flex flex-col gap-2 p-1.5 mb-2.5 scrollbar-thin">
              {chatLog.map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs p-2 rounded max-w-[88%] font-display leading-relaxed ${
                    msg.sender === 'cadet'
                      ? 'bg-slate-800 text-slate-200 self-end text-right border border-slate-700'
                      : 'bg-mars-surface border border-mars-cyan/40 text-slate-100 self-start'
                  }`}
                >
                  {msg.sender === 'chipi' && (
                    <span className="text-[9px] font-mono font-bold text-mars-cyan uppercase block mb-0.5">
                      Chipi-Bot:
                    </span>
                  )}
                  {msg.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Recommendation Pills */}
            <div className="flex flex-wrap gap-1 mb-2.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-[10px] font-display font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-mars-cyan hover:text-mars-cyan transition-colors truncate max-w-full"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                placeholder="Ask Chipi-Bot a Mars question..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-900 border border-mars-border rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-mars-cyan"
              />
              <button
                type="submit"
                className="btn-tactile p-1.5 rounded text-mars-cyan border border-mars-cyan/50 hover:bg-mars-cyan/10"
                title="Send question"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Pop-up Passive Speech Bubble (When Chat Drawer is Closed) */}
      <AnimatePresence mode="wait">
        {!isChatOpen && isBubbleVisible && (
          <motion.div
            key={currentLine}
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={botSpringPhysics}
            className="hud-panel hud-corner-brackets max-w-xs mb-2 p-2.5 rounded-sm border border-mars-cyan/40 bg-mars-surface/95 shadow-xl cursor-pointer"
            onClick={handleBotClick}
            title="Click to ask Chipi-Bot"
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono font-bold text-mars-cyan uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5 text-mars-cyan" />
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
        title="Tap Chipi-Bot for Interactive Mars Q&A"
        className="btn-tactile p-3 rounded-full flex items-center justify-center border-2 border-mars-cyan/60 bg-mars-charcoal text-mars-cyan shadow-hud-glow relative"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mars-cyan border border-slate-950" />
        </span>
      </motion.button>
    </aside>
  );
};

export default AstroBotCompanion;

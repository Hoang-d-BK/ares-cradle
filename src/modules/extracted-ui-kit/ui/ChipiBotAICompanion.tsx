import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChatMessage {
  id: string;
  sender: 'cadet' | 'chipi';
  text: string;
  timestamp: Date;
}

export interface ChipiBotAICompanionProps {
  apiKey?: string;
  activeObjective?: string;
  energyPercent?: number;
  o2Percent?: number;
  className?: string;
  onAskChipi?: (query: string) => void;
}

const OFFLINE_KNOWLEDGE_BASE: Record<string, string> = {
  power: '⚡ Solar panels accumulate dust over time! Use your Sonic Wiper [E] or wipe them up-close to restore 100% output.',
  oxygen: '🫁 Sabatier scrubbers need power to convert Martian CO₂. If O₂ drops below 19.5%, reallocate battery power immediately!',
  ice: '❄️ Permafrost ice cores are buried in the North Glacier Trench. Drill them to refine fresh water in the Bio-Dome Lab!',
  rover: '🚜 Press [R] near the outpost garage to mount the exploration rover! It has an extra battery pack for long EVA missions.',
  ares: '🚀 Ares-1 crewed transport touches down at Sol 20. We must secure power, water, and O₂ reserves before they arrive!',
};

export const ChipiBotAICompanion: React.FC<ChipiBotAICompanionProps> = ({
  apiKey,
  activeObjective = 'Establish Outpost Power Grid',
  energyPercent = 100,
  o2Percent = 100,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'chipi',
      text: "Beep-boop! I'm Chipi-Bot, your advance scout companion on Mars. What do you need help with, Cadet?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');

    const cadetMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'cadet',
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cadetMsg]);
    setIsTyping(true);

    // AI or heuristic response
    let replyText = '';
    const lower = userText.toLowerCase();

    if (apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are Chipi-Bot, an upbeat, helpful robotic assistant accompanying Cadet Leo on Mars in the Ares Cradle simulator. Keep responses under 30 words, scientific yet friendly for 7-12 year olds. Current Status: Objective: ${activeObjective}, Battery: ${energyPercent}%, O2: ${o2Percent}%. Cadet asks: "${userText}"`,
                    },
                  ],
                },
              ],
            }),
          }
        );
        const data = await res.json();
        replyText =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Chipi telemetry transmission interrupted. Check power router!';
      } catch (e) {
        replyText = 'Comms latency high! Here is my cached log: balance battery power between thermal and scrubbers.';
      }
    } else {
      // Offline heuristic knowledge
      await new Promise((r) => setTimeout(r, 600));
      const matchedKey = Object.keys(OFFLINE_KNOWLEDGE_BASE).find((k) => lower.includes(k));
      replyText =
        matchedKey
          ? OFFLINE_KNOWLEDGE_BASE[matchedKey]
          : `Roger Cadet! For "${userText}", keep an eye on active objective "${activeObjective}" and monitor Sol battery levels!`;
    }

    setIsTyping(false);
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now() + 1),
        sender: 'chipi',
        text: replyText,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 ${className}`}>
      {/* Floating Toggle Icon */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(255,126,41,0.5)] border border-amber-300"
        >
          <span className="text-lg">🤖</span>
          <span>Chipi-Bot</span>
          <span className="w-2 h-2 rounded-full bg-green-900 animate-ping"></span>
        </motion.button>
      )}

      {/* Chat Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 sm:w-96 h-[460px] rounded-2xl bg-gray-950/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden text-gray-100 font-mono"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-950/60 to-gray-900 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <div className="text-xs font-bold text-amber-400">CHIPI-BOT AI v3.0</div>
                  <div className="text-[10px] text-gray-400">Tactical Scout Companion</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="px-3 py-1.5 bg-black/60 border-b border-gray-800 flex justify-between text-[10px] text-gray-400">
              <span>⚡ Batt: {energyPercent}%</span>
              <span>🫁 O₂: {o2Percent}%</span>
              <span className="text-amber-400 truncate max-w-[120px]">🎯 {activeObjective}</span>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'cadet' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl ${
                      m.sender === 'cadet'
                        ? 'bg-amber-600 text-black font-semibold'
                        : 'bg-gray-900 border border-amber-500/20 text-gray-200'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-xl bg-gray-900 text-amber-400 text-xs italic animate-pulse">
                    Chipi-Bot analyzing telemetry...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-2.5 bg-black/80 border-t border-gray-800 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Chipi about Mars survival..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleSend}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChipiBotAICompanion;

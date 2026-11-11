import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStoryStore } from '@/modules/store/useStoryStore';
import { SolarSystemOrrery } from '@/modules/extracted-ui-kit';
import { soundEngine } from '@/modules/audio/soundEngine';

export interface FieldGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FieldGuideModal: React.FC<FieldGuideModalProps> = ({ isOpen, onClose }) => {
  const dataCapsules = useStoryStore((state) => state.dataCapsules);
  const openScienceCard = useStoryStore((state) => state.openScienceCard);

  const [activeTab, setActiveTab] = useState<'codex' | 'telescope'>('codex');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        if (!isOpen) {
          // handled by parent
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Pillars' },
    { id: 'energy', label: '⚡ Energy' },
    { id: 'water', label: '💧 Water' },
    { id: 'atmosphere', label: '🫁 Atmosphere' },
    { id: 'food', label: '🌱 Food' },
    { id: 'geology', label: '🪨 Geology' },
  ];

  const filtered = dataCapsules.filter((c) =>
    selectedCategory === 'all' ? true : c.category === selectedCategory
  );

  const unlockedCount = dataCapsules.filter((c) => c.unlocked).length;
  const progressPercent = Math.round((unlockedCount / dataCapsules.length) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mars Field Guide and Codex"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 font-mono select-none pointer-events-auto"
    >
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative z-10 w-full max-w-4xl h-[88vh] rounded-3xl bg-gray-950/95 border-2 border-amber-500/50 shadow-[0_0_60px_rgba(255,126,41,0.3)] p-4 sm:p-6 text-white overflow-hidden flex flex-col pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide uppercase">
                  Mars Field Guide & Codex (5 Pillars)
                </h2>
                <span className="px-2 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold">
                  {progressPercent}% COMPLETE
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Review unlocked NASA science discoveries. Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-amber-300">G</kbd> to toggle.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick(800);
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-gray-900 border border-gray-700 hover:border-white text-gray-300 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Top Tab Mode (Codex vs Celestial Telescope) */}
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEngine.playClick(1000);
                setActiveTab('codex');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'codex'
                  ? 'bg-amber-500/20 border border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(255,126,41,0.25)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📚 NASA Data Capsules ({unlockedCount}/{dataCapsules.length})
            </button>
            <button
              onClick={() => {
                soundEngine.playClick(1100);
                setActiveTab('telescope');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'telescope'
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔭 Orbital Telescope (Live Orrery)
            </button>
          </div>

          {/* Progress Bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-28 h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-amber-400 font-bold">{unlockedCount} / {dataCapsules.length}</span>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'codex' ? (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundEngine.playClick(900);
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-white text-black font-black'
                      : 'bg-gray-900 border border-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Capsules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {filtered.map((capsule) => {
                const isUnlocked = capsule.unlocked;

                return (
                  <div
                    key={capsule.id}
                    onClick={() => {
                      if (isUnlocked) {
                        soundEngine.playClick(1200);
                        openScienceCard(capsule);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                      isUnlocked
                        ? 'bg-gray-900/70 border-gray-700 hover:border-amber-400 hover:bg-gray-900 cursor-pointer shadow-lg'
                        : 'bg-black/40 border-gray-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{capsule.icon}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isUnlocked
                              ? 'bg-green-950 border border-green-500/40 text-green-400'
                              : 'bg-gray-800 text-gray-500'
                          }`}
                        >
                          {isUnlocked ? 'DISCOVERED' : 'LOCKED IN FIELD'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">
                        {capsule.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-sans line-clamp-2">
                        {isUnlocked ? capsule.quickFact : 'Collect and refine field specimens to unlock this knowledge capsule.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-400">
                      <span>{capsule.nasaMission}</span>
                      <span>{isUnlocked ? 'Inspect ➔' : '🔒'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden rounded-2xl border border-cyan-500/30">
            <SolarSystemOrrery className="w-full h-full" />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FieldGuideModal;

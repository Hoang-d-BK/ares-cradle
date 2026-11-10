import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStoryStore } from '@/modules/store/useStoryStore';
import { soundEngine } from '@/modules/audio/soundEngine';

export const ChapterSelectModal: React.FC = () => {
  const isChapterSelectOpen = useStoryStore((state) => state.isChapterSelectOpen);
  const setChapterSelectOpen = useStoryStore((state) => state.setChapterSelectOpen);
  const chapters = useStoryStore((state) => state.chapters);
  const currentChapterIndex = useStoryStore((state) => state.currentChapterIndex);
  const unlockedSols = useStoryStore((state) => state.unlockedSols);
  const startSol = useStoryStore((state) => state.startSol);
  const unlockAllSolsWithCode = useStoryStore((state) => state.unlockAllSolsWithCode);

  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyMsg, setPasskeyMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isChapterSelectOpen) return null;

  const handleApplyPasskey = () => {
    const success = unlockAllSolsWithCode(passkeyInput);
    if (success) {
      setPasskeyMsg({ text: 'All 5 Sols Unlocked for Judge Testing! (ARES2026)' });
      setPasskeyInput('');
    } else {
      setPasskeyMsg({ text: 'Invalid Passkey. Use ARES2026 to unlock all chapters.', error: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl font-mono select-none pointer-events-auto">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0 cursor-pointer" onClick={() => setChapterSelectOpen(false)} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-2xl rounded-3xl bg-gray-950/95 border-2 border-amber-500/50 shadow-[0_0_50px_rgba(255,126,41,0.35)] p-4 sm:p-6 text-white overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🚀</span>
            <div>
              <h2 className="text-base font-black text-white tracking-wide uppercase">
                Ares Cradle • Mission Log & Chapter Selector
              </h2>
              <p className="text-[11px] text-gray-400 font-sans">
                Jump to any Sol scenario. Enter judge passkey to bypass sequential locks.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick(800);
              setChapterSelectOpen(false);
            }}
            className="w-8 h-8 rounded-xl bg-gray-900 border border-gray-700 hover:border-white text-gray-300 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 5-Sol Chapter Grid */}
        <div className="space-y-2.5 my-4">
          {chapters.map((chapter, idx) => {
            const isUnlocked = unlockedSols.includes(chapter.sol);
            const isCurrent = currentChapterIndex === idx;

            return (
              <div
                key={chapter.sol}
                onClick={() => {
                  if (isUnlocked) {
                    soundEngine.playClick(1100);
                    startSol(chapter.sol);
                    setChapterSelectOpen(false);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(255,126,41,0.3)]'
                    : isUnlocked
                    ? 'bg-gray-900/60 border-gray-700 hover:border-amber-400 cursor-pointer'
                    : 'bg-black/40 border-gray-800 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-black/60 border border-amber-500/30 flex items-center justify-center text-sm font-bold text-amber-300">
                    {chapter.sol}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase">
                        SOL {chapter.sol}: {chapter.title}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.2 rounded text-[9px] bg-amber-400 text-black font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 font-sans">{chapter.subtitle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-sans hidden sm:inline">
                    {chapter.environmentalEvent}
                  </span>
                  <span className="text-sm">{isUnlocked ? '➔' : '🔒'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Judge Passkey Bar */}
        <div className="p-3.5 rounded-2xl bg-black/70 border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-amber-400 font-bold">JUDGE PASSKEY:</span>
            <input
              type="text"
              value={passkeyInput}
              onChange={(e) => setPasskeyInput(e.target.value)}
              placeholder="Enter ARES2026..."
              className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400 w-36"
            />
            <button
              onClick={handleApplyPasskey}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              Unlock
            </button>
          </div>

          {passkeyMsg && (
            <span className={`text-[11px] ${passkeyMsg.error ? 'text-red-400' : 'text-green-400'}`}>
              {passkeyMsg.text}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ChapterSelectModal;

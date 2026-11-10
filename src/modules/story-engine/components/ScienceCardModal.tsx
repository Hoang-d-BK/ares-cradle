import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStoryStore } from '@/modules/store/useStoryStore';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';
import MediaSlotPlaceholder from './MediaSlotPlaceholder';

export const ScienceCardModal: React.FC = () => {
  const isScienceCardOpen = useStoryStore((state) => state.isScienceCardOpen);
  const closeScienceCard = useStoryStore((state) => state.closeScienceCard);
  const activeCapsule = useStoryStore((state) => state.activeCapsule);
  const submitCapsuleQuiz = useStoryStore((state) => state.submitCapsuleQuiz);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  if (!isScienceCardOpen || !activeCapsule) return null;

  const handleAnswer = (optionIdx: number) => {
    setSelectedOption(optionIdx);
    const correct = submitCapsuleQuiz(activeCapsule.id, optionIdx);
    if (correct) {
      soundEngine.playSuccessChime();
      const currentLevel = useOutpostStore.getState().domeEvolutionLevel;
      useOutpostStore.getState().setDomeEvolutionLevel(Math.min(5, currentLevel + 1));
      useOutpostStore.getState().setRoverUpgradeLevel(Math.min(5, currentLevel + 1));
      setQuizFeedback({
        isCorrect: true,
        text: `Correct! +150 STEM Points. Bio-Dome & Rover upgraded! ${activeCapsule.checkQuestion.explanation}`,
      });
    } else {
      setQuizFeedback({
        isCorrect: false,
        text: `Incorrect. Try again! ${activeCapsule.checkQuestion.explanation}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl font-mono select-none pointer-events-auto">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0 cursor-pointer" onClick={closeScienceCard} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-3xl max-h-[92vh] rounded-3xl bg-gray-950/95 border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(0,240,255,0.3)] p-4 sm:p-6 text-white overflow-hidden flex flex-col pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{activeCapsule.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide uppercase">
                  {activeCapsule.title}
                </h2>
                <span className="px-2 py-0.5 text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-bold">
                  NASA DATA CAPSULE
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Mission: {activeCapsule.nasaMission} • Credit: {activeCapsule.credit}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick(800);
              closeScienceCard();
            }}
            className="w-8 h-8 rounded-xl bg-gray-900 border border-gray-700 hover:border-white text-gray-300 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Secret NASA Footage & Holographic Uplink */}
          <MediaSlotPlaceholder
            title={activeCapsule.title}
            quickFact={activeCapsule.quickFact}
            nasaMission={activeCapsule.nasaMission}
            videoUrl={activeCapsule.media?.videoUrl}
            heroImage={activeCapsule.media?.heroImage}
          />

          {/* Tier 1: Quick Fact */}
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200">
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">
              TIER 1 • QUICK FIELD FACT
            </div>
            <p className="text-xs sm:text-sm font-sans font-semibold leading-relaxed">
              {activeCapsule.quickFact}
            </p>
          </div>

          {/* Tier 2: Deep Exploration */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              TIER 2 • SCIENTIFIC EXPLORATION
            </div>
            <p className="text-xs font-sans text-gray-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-gray-800">
              {activeCapsule.explore}
            </p>
          </div>

          {/* Tier 3: Comparative NASA Specs (Mars vs Earth) */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              TIER 3 • NASA COMPARATIVE DATA SPECS (MARS VS. EARTH)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeCapsule.nasaData.map((spec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-1"
                >
                  <div className="text-[10px] text-gray-400 font-bold">{spec.metric}</div>
                  <div className="text-xs font-bold text-amber-400">Mars: {spec.marsValue}</div>
                  <div className="text-[11px] text-cyan-300">Earth: {spec.earthValue}</div>
                  <div className="text-[9px] text-gray-500">Unit: {spec.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* STEM Check Question Quiz */}
          <div className="p-4 rounded-2xl bg-gray-900/80 border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                STEM CHALLENGE CHECK QUESTION (+150 PTS)
              </span>
              <span className="text-xs">❓</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white font-sans">
              {activeCapsule.checkQuestion.question}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeCapsule.checkQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`p-3 rounded-xl border text-left text-xs font-sans transition-all cursor-pointer ${
                    selectedOption === idx
                      ? idx === activeCapsule.checkQuestion.correctIndex
                        ? 'bg-green-950 border-green-500 text-green-200'
                        : 'bg-red-950 border-red-500 text-red-200'
                      : 'bg-black/50 border-gray-700 hover:border-gray-500 text-gray-200'
                  }`}
                >
                  <span className="font-mono font-bold mr-2">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span>{option}</span>
                </button>
              ))}
            </div>

            {quizFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-sans leading-relaxed ${
                  quizFeedback.isCorrect
                    ? 'bg-green-950/60 text-green-300 border border-green-500/40'
                    : 'bg-red-950/60 text-red-300 border border-red-500/40'
                }`}
              >
                {quizFeedback.text}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ScienceCardModal;

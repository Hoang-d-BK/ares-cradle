import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';
import TactileButton from '@/modules/mission-control/TactileButton';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const BROWNOUT_STEM_QUESTIONS: QuizQuestion[] = [
  {
    id: 'sabatier',
    question: 'Emergency Sabatier Alert: How do Mars habitats produce water and oxygen?',
    options: [
      'Combining Carbon Dioxide (CO₂) and Hydrogen (H₂)',
      'Digging liquid oceans beneath Olympus Mons',
      'Burning Martian red dust rocks with lasers',
      'Importing cloud vapor from Earth daily'
    ],
    correctIndex: 0,
    explanation: 'NASA Sabatier reactors react atmospheric CO₂ with H₂ to produce breathable O₂ and water!'
  },
  {
    id: 'solar_dust',
    question: 'Dust Storm Crisis: Why do Martian dust storms drop solar panel power so rapidly?',
    options: [
      'Airborne dust scatters and blocks incoming sunlight',
      'The dust freezes electrical copper wiring instantly',
      'Mars spins 10 times faster during dust storms',
      'Martian gravity doubles and pulls panels down'
    ],
    correctIndex: 0,
    explanation: 'Fine airborne dust scatters sunlight, reducing photovoltaic solar yield by up to 60%!'
  },
  {
    id: 'thermal_night',
    question: 'Night Survival: How can Cadets keep base alive during frigid -60°C nights?',
    options: [
      'Engage Emergency Saver and keep balanced 50/50 power allocation',
      'Turn off all oxygen generators until morning dawn',
      'Crank heaters to 100% and let the battery drain to 0',
      'Open the airlock hatch to let outside winds warm the dome'
    ],
    correctIndex: 0,
    explanation: 'Emergency Saver preserves 15% base battery while balanced allocation maintains life support!'
  }
];

export const BrownoutQuizModal: React.FC = () => {
  const isBrownoutQuizOpen = useOutpostStore((state) => state.isBrownoutQuizOpen);
  const handleBrownoutQuizSuccess = useOutpostStore((state) => state.handleBrownoutQuizSuccess);
  const closeBrownoutQuiz = useOutpostStore((state) => state.closeBrownoutQuiz);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const activeQuestion = BROWNOUT_STEM_QUESTIONS[questionIndex % BROWNOUT_STEM_QUESTIONS.length];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset quiz countdown
  useEffect(() => {
    if (!isBrownoutQuizOpen) return;

    setTimeLeft(10);
    setSelectedOption(null);
    setFeedback(null);

    // Pick random question on open
    const randIdx = Math.floor(Math.random() * BROWNOUT_STEM_QUESTIONS.length);
    setQuestionIndex(randIdx);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Expired timer -> Fail brownout
          setFeedback('wrong');
          setTimeout(() => {
            closeBrownoutQuiz();
          }, 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBrownoutQuizOpen, closeBrownoutQuiz]);

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || feedback !== null) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(idx);

    if (idx === activeQuestion.correctIndex) {
      setFeedback('correct');
      soundEngine.playSuccessChime();
      setTimeout(() => {
        handleBrownoutQuizSuccess();
      }, 1800);
    } else {
      setFeedback('wrong');
      soundEngine.playFailureTone();
      setTimeout(() => {
        closeBrownoutQuiz();
      }, 1600);
    }
  };

  if (!isBrownoutQuizOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Emergency Brownout STEM Quiz"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 select-none pointer-events-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 24
          }}
          className="hud-panel hud-corner-brackets w-full max-w-lg p-5 sm:p-6 rounded-md border-2 border-mars-amber shadow-[0_0_35px_rgba(255,176,32,0.35)] bg-slate-900/95"
        >
          {/* Header: Emergency Alert Banner */}
          <div className="flex items-center justify-between border-b border-mars-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-mars-amber animate-pulse" />
              <div>
                <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-wide">
                  EMERGENCY BROWNOUT STEM QUIZ
                </h3>
                <p className="text-[10px] font-mono text-mars-amber tracking-widest uppercase">
                  SOLVE TO ACTIVATE BACKUP BATTERY (+20% kWh)
                </p>
              </div>
            </div>

            {/* Countdown Clock Display */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-950 border border-mars-amber/50 font-mono text-sm font-bold text-mars-amber">
              <Clock className="w-4 h-4 animate-spin" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Time Progress Bar */}
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-4 border border-mars-border">
            <motion.div
              className="h-full bg-gradient-to-r from-mars-amber to-mars-rust"
              animate={{ width: `${(timeLeft / 10) * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>

          {/* STEM Question Text */}
          <div className="mb-4">
            <span className="text-[10px] font-mono text-mars-cyan uppercase tracking-wider block mb-1">
              MISSION CONTROL EMERGENCY CHALLENGE
            </span>
            <p className="text-sm sm:text-base font-display font-semibold text-slate-100 leading-snug">
              {activeQuestion.question}
            </p>
          </div>

          {/* Multiple Choice Answers */}
          <div className="flex flex-col gap-2 mb-4">
            {activeQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === activeQuestion.correctIndex;

              let btnBorder = 'border-mars-border hover:border-mars-cyan';
              let btnBg = 'bg-slate-950/70 text-slate-200';

              if (feedback !== null) {
                if (isCorrect) {
                  btnBorder = 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
                  btnBg = 'bg-emerald-950/80 text-emerald-200';
                } else if (isSelected && !isCorrect) {
                  btnBorder = 'border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
                  btnBg = 'bg-rose-950/80 text-rose-200';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={selectedOption !== null}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-3 text-left rounded border text-xs sm:text-sm font-display font-medium transition-[border-color,background-color,transform] flex items-center justify-between active:scale-[0.98] ${btnBorder} ${btnBg}`}
                >
                  <span>{opt}</span>
                  {feedback !== null && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {feedback !== null && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Result Feedback Banner */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded border text-xs font-display font-semibold flex items-center gap-2 ${
                feedback === 'correct'
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.3)]'
                  : 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-[0_0_14px_rgba(239,68,68,0.3)]'
              }`}
            >
              {feedback === 'correct' ? (
                <>
                  <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold uppercase block text-emerald-400">CORRECT! +20% EMERGENCY POWER ONLINE</span>
                    <span>{activeQuestion.explanation}</span>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <span className="font-bold uppercase block text-rose-400">INCORRECT OR TIMEOUT!</span>
                    <span>Outpost systems failed to recover from total brownout.</span>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Close/Forfeit Option */}
          {!feedback && (
            <div className="mt-4 flex justify-end">
              <TactileButton
                variant="ghost"
                size="sm"
                onClick={closeBrownoutQuiz}
                className="text-slate-400 text-[11px]"
              >
                Skip to Debrief
              </TactileButton>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BrownoutQuizModal;

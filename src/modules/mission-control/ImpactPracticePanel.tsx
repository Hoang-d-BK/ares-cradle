import { useEffect, useRef, useState } from 'react';
import {
  type ImpactContextId,
  type ImpactProgress,
  type ImpactSignalId,
  IMPACT_CONTEXTS,
  IMPACT_SIGNALS,
  initialActivityProgress,
  isActivityComplete,
  recordImpactMatch,
} from '../../game/mission/activities/rules';
import './impactPractice.css';

export type ImpactPracticePanelProps = { onExit: () => void };

type Feedback = { tone: 'neutral' | 'good' | 'caution'; text: string };

function Trace({ path, title }: { path: string; title: string }) {
  return <svg className="impact-practice__trace" viewBox="0 0 50 48" role="img" aria-label={`${title} authored training waveform`}>
    <path d="M2 12H48M2 24H48M2 36H48M14 3V45M26 3V45M38 3V45" />
    <path className="impact-practice__trace-line" d={path} />
  </svg>;
}

function Terrain({ illustration, title }: { illustration: 'rim' | 'basin' | 'slope'; title: string }) {
  const paths = {
    rim: 'M8 76 Q28 66 45 55 Q62 42 73 22 Q84 5 96 19 Q112 39 126 46 Q148 58 172 74',
    basin: 'M8 35 Q38 38 53 60 Q71 84 91 76 Q111 68 122 48 Q139 25 172 32',
    slope: 'M10 78 L48 68 L76 48 L106 42 L132 23 L172 12 M78 51 L87 60 M111 38 L120 47',
  };
  return <svg className="impact-practice__terrain" viewBox="0 0 182 96" role="img" aria-label={`${title}, authored training schematic`}>
    <path className="impact-practice__terrain-grid" d="M5 78H177M26 10V80M62 10V80M98 10V80M134 10V80M170 10V80" />
    <path className="impact-practice__terrain-line" d={paths[illustration]} />
    <circle cx="92" cy="80" r="3.5" />
    <text x="8" y="92">TRAINING SCHEMATIC</text>
  </svg>;
}

export function ImpactPracticePanel({ onExit }: ImpactPracticePanelProps) {
  const [progress, setProgress] = useState<ImpactProgress>(() => {
    const initial = initialActivityProgress('impact');
    if (initial.kind !== 'impact') throw new Error('Impact activity rules returned an unexpected progress type.');
    return initial;
  });
  const [selectedSignal, setSelectedSignal] = useState<ImpactSignalId | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({ tone: 'neutral', text: 'Choose a signal, then compare an unmatched training frame and its timestamp.' });
  const exitRef = useRef<HTMLButtonElement>(null);
  const complete = isActivityComplete('impact', progress);

  useEffect(() => { exitRef.current?.focus(); }, []);

  function chooseContext(context: ImpactContextId) {
    if (!selectedSignal || complete) return;
    const result = recordImpactMatch(progress, selectedSignal, context);
    setAttempts((count) => count + 1);
    setFeedback({ tone: result.accepted ? 'good' : 'caution', text: result.message });
    if (result.accepted) {
      setProgress(result.progress);
      setSelectedSignal(null);
    }
  }

  function resetPractice() {
    const initial = initialActivityProgress('impact');
    if (initial.kind !== 'impact') throw new Error('Impact activity rules returned an unexpected progress type.');
    setProgress(initial);
    setSelectedSignal(null);
    setAttempts(0);
    setFeedback({ tone: 'neutral', text: 'Practice reset. Choose a signal to begin again.' });
  }

  return <section className="impact-practice" data-testid="impact-practice-panel" aria-labelledby="impact-practice-title">
    <header className="impact-practice__header">
      <div>
        <h2 id="impact-practice-title">Compare impact evidence</h2>
        <p className="impact-practice__intro">Compare timestamps and waveform shape with each authored training frame. A match links records; it does not identify a rock or prove an impact origin.</p>
      </div>
      <button ref={exitRef} className="impact-practice__button impact-practice__exit" type="button" onClick={onExit}>Back to field note</button>
    </header>

    <p className="impact-practice__notice">Optional practice · Not saved. Training records are authored examples, not NASA measurements. Signal matching is not a rock-origin test.</p>

    <div className="impact-practice__lesson" aria-label="How to compare the records">
      <span className="impact-practice__lesson-mark" aria-hidden="true">i</span>
      <p>Use the timestamp first, then compare the waveform clues. Signal shape and loudness alone cannot establish what made a mark.</p>
    </div>

    <div className="impact-practice__summary" aria-label={`Training records, ${progress.matches.length} of 3 matched; ${attempts} attempts`}>
      <span>Training records</span><strong>{progress.matches.length} of 3 matched</strong><span>Attempts: {attempts}</span>
    </div>

    <div className="impact-practice__columns">
      <section className="impact-practice__list" aria-labelledby="impact-signals-heading">
        <h3 id="impact-signals-heading">Signals</h3>
        <p className="impact-practice__hint">Choose one signal to compare.</p>
        <ul>
          {IMPACT_SIGNALS.map((signal, index) => {
            const match = progress.matches.find((item) => item.signal === signal.id);
            const context = match && IMPACT_CONTEXTS.find((item) => item.id === match.context);
            return <li key={signal.id} className="impact-practice__record">
              <button className="impact-practice__signal" type="button" aria-label={`Choose Signal ${String.fromCharCode(65 + index)}${match ? `, paired with ${context?.title}` : ''}`} aria-pressed={selectedSignal === signal.id} disabled={Boolean(match) || complete} onClick={() => {
                setSelectedSignal(signal.id);
                setFeedback({ tone: 'neutral', text: `${signal.title}: ${signal.clue} Compare its timestamp with a training frame.` });
              }}>
                <Trace path={signal.trace} title={signal.title} />
                <span className="impact-practice__record-copy"><strong>{signal.title}</strong><span>{signal.timestamp}</span><span>{signal.clue}</span>{context && <span className="impact-practice__paired">Paired with {context.title}</span>}</span>
                {match && <span className="impact-practice__check" aria-label="Matched">Matched</span>}
              </button>
            </li>;
          })}
        </ul>
      </section>

      <section className="impact-practice__list" aria-labelledby="impact-frames-heading">
        <h3 id="impact-frames-heading">Training frames</h3>
        <p className="impact-practice__hint">{selectedSignal ? 'Choose the frame from the same recorded time.' : 'Choose a signal first; unmatched frames will become available.'}</p>
        <ul>
          {IMPACT_CONTEXTS.map((context) => {
            const match = progress.matches.find((item) => item.context === context.id);
            const pairedSignal = match && IMPACT_SIGNALS.find((item) => item.id === match.signal);
            return <li key={context.id} className="impact-practice__record">
              <button className="impact-practice__frame" type="button" aria-label={`Match with ${context.title} · ${context.timestamp}${pairedSignal ? `, paired with ${pairedSignal.title}` : ''}`} disabled={!selectedSignal || Boolean(match) || complete} onClick={() => chooseContext(context.id)}>
                <Terrain illustration={context.illustration} title={context.title} />
                <span className="impact-practice__record-copy"><strong>{context.title}</strong><span>{context.timestamp}</span><span>{context.note}</span>{pairedSignal && <span className="impact-practice__paired">Paired with {pairedSignal.title}</span>}</span>
                {match && <span className="impact-practice__check" aria-label="Matched">Matched</span>}
              </button>
            </li>;
          })}
        </ul>
      </section>
    </div>

    <p className={`impact-practice__feedback is-${feedback.tone}`} role="status" aria-live="polite">{feedback.text}</p>

    {complete && <section className="impact-practice__complete" aria-labelledby="impact-practice-complete-title">
      <h3 id="impact-practice-complete-title">Practice complete · 3 of 3 matched</h3>
      <p>Practice complete — no exploration progress or rewards changed.</p>
    </section>}

    <footer className="impact-practice__footer">
      <p>Evidence matching can compare records, but it cannot identify a meteorite by appearance or signal loudness.</p>
      <button className="impact-practice__button" type="button" onClick={resetPractice}>Reset practice</button>
    </footer>
  </section>;
}

export default ImpactPracticePanel;

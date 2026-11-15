import React from 'react';
import type { SceneReadiness, StartupMilestones } from '@/modules/outpost-3d/sceneReadiness';
import QuickControlsManual from './QuickControlsManual';
import './originalEntryFlow.css';

export interface OriginalEntryFlowProps {
  milestones: StartupMilestones;
  sceneReadiness: SceneReadiness;
  controlsOpen: boolean;
  onStart: () => void;
  onRetry: () => void;
  onOpenControls: () => void;
  onCloseControls: () => void;
  onStartFromGuide: () => void;
  isClosing?: boolean;
}

const MILESTONES: ReadonlyArray<{ id: keyof StartupMilestones; label: string }> = [
  { id: 'renderer', label: '3D renderer initialized' },
  { id: 'first-frame', label: 'First Mars frame rendered' },
  { id: 'terrain', label: 'Mars terrain geometry drawn' },
  { id: 'science-catalog', label: '15 NASA science records and sources checked' },
];

export const OriginalEntryFlow: React.FC<OriginalEntryFlowProps> = ({
  milestones, sceneReadiness, controlsOpen, onStart, onRetry, onOpenControls, onCloseControls, onStartFromGuide, isClosing = false,
}) => {
  const readyCount = MILESTONES.filter(({ id }) => milestones[id]).length;
  const ready = readyCount === MILESTONES.length;
  const failed = sceneReadiness === 'limited';
  const canStart = ready && sceneReadiness === 'ready';

  return (
    <section className={`original-entry${isClosing ? ' is-closing' : ''}`} aria-label="Elon Mars launch gate">
      <div className="original-entry__sky" aria-hidden="true" />
      <div className="original-entry__horizon" aria-hidden="true">
        <svg viewBox="0 0 1000 190" preserveAspectRatio="none">
          <path d="M0 134 C110 130 162 108 264 120 S427 142 532 114 694 86 775 116 894 131 1000 99V190H0Z" />
          <path d="M0 151 C146 141 186 153 317 138 S490 123 620 151 811 150 1000 128V190H0Z" />
          <path d="M0 164H1000" />
          <circle cx="778" cy="56" r="2" /><circle cx="825" cy="39" r="1.5" /><circle cx="900" cy="68" r="1.5" />
          <path d="M700 164v-32l20-12 20 12v32M705 132l15 13 15-13M712 164v-17h16v17" />
        </svg>
      </div>

      <div className="original-entry__layout">
        <main className="original-entry__welcome">
          <p className="original-entry__wordmark">ELON MARS</p>
          <div className="original-entry__rule" />
          <h1>{canStart ? 'A new world, ready to explore.' : failed ? 'The surface needs attention.' : 'Loading Mars…'}</h1>
          <p className="original-entry__description">
            {failed
              ? 'The field view could not finish initializing. Retry the 3D setup or open the controls guide.'
              : ready
                ? 'Take a first look across the Martian horizon. Your field tools are ready when you are.'
                : 'Preparing the real field scene and checking its local science records.'}
          </p>
          <div className="original-entry__actions">
            {canStart ? (
              <button type="button" className="original-entry__start" onClick={onStart}>
                <span>START</span><span className="original-entry__arrow" aria-hidden="true">→</span>
              </button>
            ) : failed ? (
              <button type="button" className="original-entry__retry" onClick={onRetry}>Retry 3D setup</button>
            ) : (
              <p className="original-entry__loading" role="status">LOADING <span aria-hidden="true">·</span> {readyCount} of {MILESTONES.length} readiness checks complete</p>
            )}
            <button type="button" className="original-entry__guide" onClick={controlsOpen ? onCloseControls : onOpenControls}>
              {controlsOpen ? 'Close controls guide' : 'Controls guide'}
            </button>
          </div>
          <p className="original-entry__assurance">No account needed <span aria-hidden="true">·</span> Field records stay on this device</p>
        </main>

        <aside className="original-entry__readiness" aria-label="Startup checks">
          <div className="original-entry__readiness-heading">
            <div><h2>Field readiness</h2><p>Local setup checks</p></div>
            <span className={`original-entry__status ${failed ? 'is-limited' : ready ? 'is-ready' : ''}`}>
              {failed ? 'Limited' : ready ? 'Ready' : 'Loading'}
            </span>
          </div>
          <div
            className="original-entry__progress"
            role="progressbar"
            aria-label="Completed startup checks"
            aria-valuemin={0}
            aria-valuemax={MILESTONES.length}
            aria-valuenow={readyCount}
            aria-valuetext={`${readyCount} of ${MILESTONES.length} named startup checks complete`}
          >
            <span style={{ width: `${(readyCount / MILESTONES.length) * 100}%` }} />
          </div>
          <ol className="original-entry__checks">
            {MILESTONES.map(({ id, label }) => (
              <li key={id} className={milestones[id] ? 'is-complete' : ''}>
                <span className="original-entry__check" aria-hidden="true">{milestones[id] ? '✓' : ''}</span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
          {failed && <p className="original-entry__error" role="alert">3D view unavailable. You can still read the field guide and start exploring.</p>}
        </aside>
      </div>

      <QuickControlsManual
        isOpen={controlsOpen}
        onStart={onStartFromGuide}
        onClose={onCloseControls}
        sceneReadiness={sceneReadiness}
      />
    </section>
  );
};

export default OriginalEntryFlow;

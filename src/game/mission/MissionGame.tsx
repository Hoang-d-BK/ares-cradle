import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Check, ChevronRight, CircleHelp, Map as MapIcon, Pause, Play, Radio, RotateCcw, ShieldCheck, X } from 'lucide-react';
import type { MissionEvent, MissionState, RegionId, Stock } from './contract';
import { REGIONS, SOURCES } from './content';
import { currentRegion, readiness, reportCount } from './state';
import { useMissionStore } from './store';
import MissionWorld, { type MissionWorldProps } from './world/MissionWorld';
import { ActivityPanel } from './activities/ActivityPanel';
import type { LakeSurveyContext } from './activities/rules';
import { MissionCinematic } from './presentation/cinematics/MissionCinematic';
import './mission.css';

type WorldInput = NonNullable<MissionWorldProps['input']>;
type InteractionTarget = Parameters<MissionWorldProps['onInteract']>[0];
const World = MissionWorld;
const Activity = ActivityPanel;

const regionById = (id: RegionId) => REGIONS.find((region) => region.id === id) ?? REGIONS[0];
const essentialCost: Stock = { energy: 2, meals: 1, water: 1, air: 1 };
const operationCost = 2;
const mapConnections: Array<[RegionId, RegionId]> = [
  ['impact', 'dust'],
  ['dust', 'volcano'],
  ['dust', 'ice'],
  ['dust', 'lake'],
  ['impact', 'volcano'],
  ['ice', 'lake'],
];
const goalOptions = [
  { id: 'geologic-history', title: 'Read the planet\'s layers', detail: 'Connect landforms, impact clues, and ancient flows.' },
  { id: 'water-and-operations', title: 'Prepare a water pathway', detail: 'Use the ice and dust evidence to plan careful treatment.' },
  { id: 'ancient-environment', title: 'Build a field evidence archive', detail: 'Keep context, tools, and locations together for later study.' },
] as const;

function IconButton({ label, active, children, onClick }: { label: string; active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" className={`mission-icon-button${active ? ' is-active' : ''}`} aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

function StockStrip({ stock, compact = false }: { stock: Stock; compact?: boolean }) {
  return <div className={`stock-strip${compact ? ' is-compact' : ''}`} aria-label="Current station stock">
    <div className="stock-group"><span className="stock-label">Energy</span><strong>{stock.energy}<small> EU</small></strong></div>
    <div className="stock-group"><span className="stock-label">Meals</span><strong>{stock.meals}</strong></div>
    <div className="stock-group"><span className="stock-label">Water</span><strong>{stock.water}</strong></div>
    <div className="stock-group"><span className="stock-label">Air kits</span><strong>{stock.air}</strong></div>
  </div>;
}

function StartScreen({ selected, onSelect, onStart, loadWarning, storageError }: { selected: RegionId; onSelect: (region: RegionId) => void; onStart: () => void; loadWarning: string | null; storageError: string | null }) {
  return <main className="mission-shell mission-start-screen">
    <section className="start-copy" aria-labelledby="mission-title">
      <p className="start-kicker">ARES CRADLE · FIELD PREPARATION</p>
      <h1 id="mission-title">Five frontiers.<br /><em>One place to prepare.</em></h1>
      <p className="start-lede">Cadet Leo and Sol are mapping a future Mars worksite before the Ares-1 crew arrives. Choose where to begin. Every region can be completed in any order.</p>
      <div className="start-rule" />
      <p className="start-question">Where should Leo land first?</p>
      <div className="start-region-list">
        {REGIONS.map((region) => <button key={region.id} type="button" className={`start-region${selected === region.id ? ' is-selected' : ''}`} onClick={() => onSelect(region.id)}>
          <span className="region-swatch" style={{ backgroundColor: region.color }} aria-hidden="true" />
          <span><strong>{region.name}</strong><small>{region.subtitle}</small></span>
          {selected === region.id && <Check size={20} aria-hidden="true" />}
        </button>)}
      </div>
      <button type="button" className="primary-action start-action" onClick={onStart}>Begin field mission <ChevronRight size={21} aria-hidden="true" /></button>
      {(loadWarning || storageError) && <p className="start-footnote warning-copy">{loadWarning ?? storageError}</p>}
      <p className="start-footnote">A fictional future mission using real science references. Game units are not mission requirements.</p>
    </section>
    <aside className="start-visual" aria-label="Mission overview">
      <div className="orbit-line orbit-line-one" />
      <div className="orbit-line orbit-line-two" />
      <div className="planet-mark"><span>ARES</span><strong>CRADLE</strong></div>
      <div className="start-coordinate">600 × 600<br /><span>field grid / game units</span></div>
      <div className="start-visual-note"><Radio size={18} /><span>Sol relay online<br /><b>five stations in view</b></span></div>
    </aside>
  </main>;
}

function MissionHeader({ region, reports, onMap, onNotebook, onPause }: { region: ReturnType<typeof regionById>; reports: number; onMap: () => void; onNotebook: () => void; onPause: () => void }) {
  return <header className="mission-header">
    <div className="brand-lockup"><span className="brand-mark">A</span><div><strong>ARES CRADLE</strong><small>FIELD PREPARATION</small></div></div>
    <div className="mission-objective"><span>Current sector</span><strong>{region.name}</strong><small>{reports}/5 reports filed</small></div>
    <nav className="header-tools" aria-label="Mission tools">
      <IconButton label="Open map" onClick={onMap}><MapIcon size={20} /></IconButton>
      <IconButton label="Open notebook" onClick={onNotebook}><BookOpen size={20} /></IconButton>
      <IconButton label="Pause mission" onClick={onPause}><Pause size={19} /></IconButton>
    </nav>
  </header>;
}

function MapPanel({ state, selectedRegion, onSelect, onTravel, onClose }: { state: MissionState; selectedRegion: RegionId; onSelect: (region: RegionId) => void; onTravel: (region: RegionId) => void; onClose: () => void }) {
  const point = (id: RegionId) => {
    const [x, z] = regionById(id).center;
    return { x: ((x + 300) / 600) * 100, y: ((z + 300) / 600) * 100 };
  };
  return <ModalFrame title="Field map" eyebrow="Connected terrain / five stations" onClose={onClose} wide>
    <div className="map-layout">
      <div className="map-plot" role="img" aria-label="Map showing five Mars regions and their connected routes">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="map-boundary" d="M6 9 L22 3 L47 8 L74 4 L95 17 L92 42 L97 70 L83 95 L55 91 L27 97 L5 80 L8 50 Z" />
          <path className="map-ridge" d="M8 56 C25 43 31 60 47 49 S72 33 91 46" />
          <path className="map-ridge map-ridge-secondary" d="M24 12 C35 25 29 40 41 52 S63 74 79 91" />
          {mapConnections.map(([from, to]) => {
            const a = point(from); const b = point(to);
            const unlocked = state.bases[from].unlocked && state.bases[to].unlocked;
            return <line key={`${from}-${to}`} className={`map-route${unlocked ? ' is-open' : ''}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
          {REGIONS.map((region) => {
            const location = point(region.id); const base = state.bases[region.id]; const active = region.id === selectedRegion;
            return <g key={region.id} className={`map-node${active ? ' is-selected' : ''}${base.unlocked ? ' is-unlocked' : ''}`} onClick={() => onSelect(region.id)}>
              <circle className="map-node-ring" cx={location.x} cy={location.y} r={active ? 5.7 : 4.7} />
              <circle className="map-node-core" cx={location.x} cy={location.y} r="2.4" fill={region.color} />
              <text x={location.x + 5} y={location.y - 4}>{region.name}</text>
            </g>;
          })}
        </svg>
        <div className="map-scale">FIELD GRID<br /><strong>600 × 600</strong> game units</div>
      </div>
      <div className="map-sidebar">
        <div className="panel-heading"><span>Selected station</span><h2>{regionById(selectedRegion).name}</h2><p>{regionById(selectedRegion).question}</p></div>
        <div className="map-status-list">
          {REGIONS.map((region) => <button type="button" key={region.id} className={`map-status-row${selectedRegion === region.id ? ' is-selected' : ''}`} onClick={() => onSelect(region.id)}>
            <span className="region-swatch" style={{ backgroundColor: region.color }} aria-hidden="true" />
            <span><strong>{region.name}</strong><small>{state.bases[region.id].unlocked ? 'Checkpoint active' : 'Checkpoint nearby'}</small></span>
            {state.bases[region.id].unlocked && <Check size={18} aria-label="Unlocked" />}
          </button>)}
        </div>
        <button type="button" className="primary-action map-travel-action" disabled={!state.bases[selectedRegion].unlocked || currentRegion(state.leo) === selectedRegion} onClick={() => onTravel(selectedRegion)}>Travel to selected station <ChevronRight size={20} /></button>
        <p className="map-note">Travel is free between activated stations. Leo leaves any rover before a transfer; stock and evidence stay with their stations.</p>
      </div>
    </div>
  </ModalFrame>;
}

function NotebookPanel({ onClose }: { onClose: () => void }) {
  return <ModalFrame title="Field notebook" eyebrow="Science references / fictional scenario" onClose={onClose} wide>
    <div className="notebook-layout">
      <section className="notebook-intro"><p className="notebook-quote">“A useful clue deserves careful study. It does not prove more than the evidence can show.”</p><p>The Ares Cradle world is fictional. NASA and other public references below support the science ideas only; they do not endorse this game, its story, or its game-unit values.</p><div className="notebook-divider" /><h3>How to read a record</h3><p><strong>Observation</strong> is what the tool captured. <strong>Interpretation</strong> is an idea that fits the evidence. <strong>Conclusion</strong> waits for enough context.</p></section>
      <section className="source-list" aria-label="Science sources"><h3>Reference desk</h3>{SOURCES.map((source) => <article key={source.id} className="source-entry"><div><strong>{source.title}</strong><p>{source.note}</p></div><a href={source.url} target="_blank" rel="noreferrer">Open source <ChevronRight size={16} /></a></article>)}</section>
    </div>
  </ModalFrame>;
}

function ModalFrame({ title, eyebrow, children, onClose, wide = false }: { title: string; eyebrow: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`mission-modal${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div className="modal-header"><div><span>{eyebrow}</span><h2 id="modal-title">{title}</h2></div><IconButton label="Close panel" onClick={onClose}><X size={21} /></IconButton></div>
    <div className="modal-body">{children}</div>
  </section></div>;
}

function ObservationPanel({ region, observationId, observed, onObserve, onClose }: { region: ReturnType<typeof regionById>; observationId: string; observed: boolean; onObserve: () => void; onClose: () => void }) {
  const observation = region.observations.find((item) => item.id === observationId);
  const [toolUsed, setToolUsed] = useState(observed);
  if (!observation) return null;
  return <ModalFrame title={observation.title} eyebrow={`${region.name} / observation tool`} onClose={onClose}>
    <div className="observation-panel"><div className="tool-illustration" aria-hidden="true"><Radio size={44} /><span>{observation.tool}</span></div><p className="panel-lede">Use the {observation.tool.toLowerCase()} for a short field action. The record saves after the tool confirms a useful view.</p><div className="evidence-row"><span>Clue</span><strong>{observation.clue}</strong></div>{observed ? <div className="success-note"><Check size={20} /> Observation already recorded. You can return to the field.</div> : <><button type="button" className="primary-action" disabled={!toolUsed} onClick={onObserve}>Save observation <Check size={20} /></button><button type="button" className="secondary-action" onClick={() => setToolUsed(true)} disabled={toolUsed}>{toolUsed ? 'Tool action ready' : `Run ${observation.tool.toLowerCase()}`}</button><p className="helper-copy">A note alone never counts as an observation.</p></>}</div>
  </ModalFrame>;
}

function BranchPanel({ region, branchId, recorded, onRecord, onClose }: { region: ReturnType<typeof regionById>; branchId: string; recorded: boolean; onRecord: () => void; onClose: () => void }) {
  const branch = region.branches.find((item) => item.id === branchId);
  const [toolUsed, setToolUsed] = useState(recorded);
  if (!branch) return null;
  return <ModalFrame title={branch.title} eyebrow={`${region.name} / optional branch`} onClose={onClose}>
    <div className="observation-panel"><div className="tool-illustration branch-mark" aria-hidden="true"><CircleHelp size={44} /><span>Optional field note</span></div><p className="panel-lede">Take one short comparison action to add this branch to Sol’s relay notes.</p><div className="evidence-row"><span>Clue</span><strong>{branch.clue}</strong></div>{recorded ? <div className="success-note"><Check size={20} /> Branch record saved. Its assist can be used during this region’s activity.</div> : <><button type="button" className="primary-action" disabled={!toolUsed} onClick={onRecord}>Save branch record <Check size={20} /></button><button type="button" className="secondary-action" onClick={() => setToolUsed(true)} disabled={toolUsed}>{toolUsed ? 'Comparison ready' : 'Run comparison'}</button></>}</div>
  </ModalFrame>;
}

function stockAfter(stock: Stock, cost: Stock): Stock { return { energy: Math.max(0, stock.energy - cost.energy), meals: Math.max(0, stock.meals - cost.meals), water: Math.max(0, stock.water - cost.water), air: Math.max(0, stock.air - cost.air) }; }

function StockPreview({ before, after, label }: { before: Stock; after: Stock; label: string }) {
  return <div className="stock-preview"><div><span>{label}</span><small>Before → after</small></div><strong>{before.energy} → {after.energy} EU</strong><strong>{before.meals} → {after.meals} meals</strong><strong>{before.water} → {after.water} water</strong><strong>{before.air} → {after.air} air</strong></div>;
}

function BasePanel({ state, regionId, onPay, onActivity, onLakeActivity, onChooseOperation, onReport, onSupport, onClose }: { state: MissionState; regionId: RegionId; onPay: () => void; onActivity: () => void; onLakeActivity: () => void; onChooseOperation: (id: string) => void; onReport: () => void; onSupport: () => void; onClose: () => void }) {
  const region = regionById(regionId); const base = state.bases[regionId]; const survey = state.surveys[regionId];
  const afterEssential = stockAfter(base.stock, essentialCost);
  const enoughEssential = base.stock.energy >= 2 && base.stock.meals >= 1 && base.stock.water >= 1 && base.stock.air >= 1;
  const observationsReady = survey.observations.length >= 2;
  const reportReady = survey.activityDone && survey.operation !== null;
  return <ModalFrame title={`${region.name} station`} eyebrow="Base console / stock stays local" onClose={onClose}>
    <div className="base-panel"><div className="base-summary"><div><span>Station status</span><strong>{base.unlocked ? 'Checkpoint active' : 'Activation requested'}</strong></div><div><span>Evidence</span><strong>{survey.observations.length}/3 observations</strong></div><div><span>Report</span><strong>{base.report ? 'Filed' : reportReady ? 'Ready to file' : 'In progress'}</strong></div></div><StockStrip stock={base.stock} />
      {!survey.paid && <section className="base-section"><div className="section-title"><div><span>Planned field activity</span><h3>{observationsReady ? 'Ready for the essential pack' : 'Record two observations first'}</h3></div><span className="cost-tag">2 EU · 1 meal · 1 water · 1 air</span></div><p className="helper-copy">This payment is a single confirmed transaction. Opening panels, reading notes, pausing, and retrying never consume stock.</p><StockPreview before={base.stock} after={afterEssential} label="Essential pack" />{!enoughEssential && <div className="warning-note"><ShieldCheck size={19} /><span>Stock is short for this pack. Request one station support lot; your observations stay safe.</span></div>}{enoughEssential ? <button type="button" className="primary-action" disabled={!observationsReady} onClick={onPay}>Confirm essential pack <ChevronRight size={20} /></button> : <button type="button" className="secondary-action" onClick={onSupport}>Request station support <ShieldCheck size={19} /></button>}</section>}
      {survey.paid && !survey.activityDone && <section className="base-section activity-gate"><div className="section-title"><div><span>Evidence threshold met</span><h3>Run the {region.name} activity</h3></div><Check size={22} /></div><p>Sol has kept your partial progress. Open the activity when you are ready to solve it; mistakes explain what to adjust.</p><button type="button" className="primary-action" onClick={onActivity}>Open activity <ChevronRight size={20} /></button>{regionId === 'lake' && <button type="button" className="secondary-action" onClick={onLakeActivity}>{state.activeRover === 'lake' ? 'Open rover field activity' : 'Enter lake rover field activity'} <ChevronRight size={20} /></button>}</section>}
      {survey.activityDone && !survey.operation && <section className="base-section"><div className="section-title"><div><span>One operation / choose before report</span><h3>Make the tradeoff visible</h3></div></div><p className="helper-copy">Both options cost 2 EU. Selecting one records the other as Deferred. Preview first; the domain validates the final transaction.</p><div className="operation-list">{region.operations.map((operation) => <button type="button" key={operation.id} className="operation-choice" disabled={base.stock.energy < operationCost} onClick={() => onChooseOperation(operation.id)}><span><strong>{operation.title}</strong><small>{operation.benefit}</small><em>Deferred alternative: {operation.deferred}</em></span><b>2 EU <ChevronRight size={18} /></b></button>)}</div></section>}
      {survey.operation && <section className="base-section operation-result"><div className="section-title"><div><span>Selected operation</span><h3>{region.operations.find((operation) => operation.id === survey.operation)?.title ?? survey.operation}</h3></div><Check size={22} /></div><p>{region.operations.find((operation) => operation.id === survey.operation)?.benefit}</p><p className="deferred-line">Alternate plan: <strong>Deferred</strong></p>{!base.report && <button type="button" className="primary-action" disabled={!reportReady} onClick={onReport}>Submit region report <Check size={20} /></button>}{base.report && <div className="success-note"><Check size={20} /> Report filed. The station remains available for free exploration.</div>}</section>}
      {state.message && <p className="panel-message" role="status">{state.message}</p>}
    </div>
  </ModalFrame>;
}

function ActivityModal({ state, regionId, surveyContext, framing, onFraming, onProgress, onComplete, onClose }: { state: MissionState; regionId: RegionId; surveyContext?: LakeSurveyContext; framing: 'wide' | 'close'; onFraming: (framing: 'wide' | 'close') => void; onProgress: (progress: unknown) => void; onComplete: () => void; onClose: () => void }) {
  const survey = state.surveys[regionId];
  return <ModalFrame title={`${regionById(regionId).name} activity`} eyebrow="Solve the model / partial progress saves" onClose={onClose} wide>
    <div className="activity-modal-head"><p>Use the evidence you recorded. Sol checks the activity rules, not a completion flag.</p>{regionId === 'lake' && <div className="camera-toggle" role="group" aria-label="Lake rover camera framing"><span>Live rover framing</span><button type="button" className={framing === 'wide' ? 'is-active' : ''} onClick={() => onFraming('wide')}>Wide</button><button type="button" className={framing === 'close' ? 'is-active' : ''} onClick={() => onFraming('close')}>Close</button></div>}</div><div className="activity-surface"><Activity region={regionId} progress={survey.activityProgress} assisted={survey.assist} onProgress={onProgress} onComplete={onComplete} surveyContext={regionId === 'lake' ? surveyContext : undefined} /></div>{survey.assist && <p className="assist-note"><CircleHelp size={17} /> An optional branch assist is available. It can guide steps without changing the result.</p>}
  </ModalFrame>;
}

function FinalePanel({ state, onDispatch, onStartCinematic, onClose }: { state: MissionState; onDispatch: (event: MissionEvent) => void; onStartCinematic: (kind: 'arrival' | 'departure') => void; onClose: () => void }) {
  const selectedBase = state.arrivalBase;
  const base = selectedBase ? state.bases[selectedBase] : null;
  const readinessResult = selectedBase ? readiness(state, selectedBase) : { go: false, missing: ['Choose an arrival base'] };
  const respondedFromRevision = useRef<number | null>(null);
  useEffect(() => {
    if (state.arrival !== 'sent' || state.saveRevision === (respondedFromRevision.current ?? -2) + 1) return;
    const sentSnapshotRevision = state.saveRevision;
    const timer = window.setTimeout(() => {
      respondedFromRevision.current = sentSnapshotRevision;
      onDispatch({ type: 'RECEIVE_RESPONSE', revision: sentSnapshotRevision });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [onDispatch, state.arrival, state.saveRevision]);
  return <ModalFrame title="Ares-1 readiness" eyebrow={`${reportCount(state)}/5 reports / final review`} onClose={onClose} wide>
    <div className="finale-panel"><section className="finale-hero"><span>Mission question</span><h3>What should this place be ready to do?</h3><p>Pick a research goal, choose one station for arrival, and run three free system checks. The GO decision uses the visible stock floor: 8 EU / 3 meals / 3 water / 3 air.</p></section><div className="finale-columns"><section><div className="section-title"><div><span>01 · Research goal</span><h3>Choose one thread</h3></div></div><div className="goal-list">{goalOptions.map((goal) => <button type="button" key={goal.id} className={`goal-choice${state.researchGoal === goal.id ? ' is-selected' : ''}`} onClick={() => onDispatch({ type: 'RESEARCH', goal: goal.id })}><span><strong>{goal.title}</strong><small>{goal.detail}</small></span>{state.researchGoal === goal.id && <Check size={18} />}</button>)}</div></section><section><div className="section-title"><div><span>02 · Arrival base</span><h3>Keep five stations eligible</h3></div></div><div className="arrival-list">{REGIONS.map((region) => <button type="button" key={region.id} className={`arrival-choice${selectedBase === region.id ? ' is-selected' : ''}`} onClick={() => onDispatch({ type: 'ARRIVAL_BASE', region: region.id })}><span className="region-swatch" style={{ backgroundColor: region.color }} /><span><strong>{region.name}</strong><small>{state.bases[region.id].stock.energy} EU · {state.bases[region.id].stock.meals} meals · {state.bases[region.id].stock.water} water · {state.bases[region.id].stock.air} air</small></span>{selectedBase === region.id && <Check size={18} />}</button>)}</div></section></div>{base && selectedBase && <section className="readiness-section"><div className="section-title"><div><span>03 · Free system checks at {regionById(selectedBase).name}</span><h3>{readinessResult.go ? 'Ready to send' : 'Check the base before sending'}</h3></div><span className={`readiness-badge${readinessResult.go ? ' is-go' : ''}`}>{readinessResult.go ? 'GO' : 'HOLD'}</span></div><div className="check-list">{([['airheat', 'Air & heat', 'Outdoor air stays outside; the habitat control is checked.'], ['shelter', 'Shelter', 'The worksite has a protected place to operate.'], ['comms', 'Comms', 'Sol can relay the station record to Mira.']] as const).map(([check, title, detail]) => <button type="button" key={check} className={`system-check${base.checks[check] ? ' is-checked' : ''}`} onClick={() => onDispatch({ type: 'BASE_CHECK', region: selectedBase, check })}><span>{base.checks[check] ? <Check size={19} /> : <span className="check-empty" />}</span><span><strong>{title}</strong><small>{detail}</small></span></button>)}</div>{!readinessResult.go && readinessResult.missing.length > 0 && <div className="warning-note"><ShieldCheck size={19} /><span>HOLD: {readinessResult.missing.join(' · ')}</span></div>}{state.arrival === 'none' && <button type="button" className="primary-action" disabled={!state.researchGoal || !readinessResult.go} onClick={() => onDispatch({ type: 'SEND_PROPOSAL' })}>Send proposal to Mira <Radio size={20} /></button>}{state.arrival === 'sent' && <div className="delay-state"><Radio size={21} /><div><strong>Mira response in transit</strong><span>Snapshot revision {state.saveRevision} · communication delay is labeled, not instant.</span></div></div>}{state.arrival === 'approved' && <><div className="success-note"><Check size={20} /> Mira approved the arrival plan.</div><button type="button" className="primary-action" onClick={() => onStartCinematic('arrival')}>Begin Ares-1 arrival <ChevronRight size={20} /></button></>}{state.arrival === 'arrived' && <><div className="success-note"><Check size={20} /> Ares-1 has arrived at the selected base.</div><button type="button" className="primary-action" onClick={() => onStartCinematic('departure')}>Begin later departure <Play size={20} /></button></>}{state.arrival === 'departed' && <div className="success-note"><Check size={20} /> Finale complete. All evidence, stock, and practice access remain available.</div>}</section>}</div>
  </ModalFrame>;
}

function PausePanel({ state, dispatch, onClose }: { state: MissionState; dispatch: (event: MissionEvent) => void; onClose: () => void }) {
  return <ModalFrame title="Mission paused" eyebrow="No stock drain / state is safe" onClose={onClose}><div className="pause-panel"><p className="panel-lede">The world is stopped. Opening this panel, waiting, skipping the intro, and retrying an activity never charges stock or repeats a reward.</p><div className="settings-list"><label><span><strong>Reduced motion</strong><small>Use static transitions and calmer world movement.</small></span><input type="checkbox" checked={state.settings.reducedMotion} onChange={(event) => dispatch({ type: 'SETTING', key: 'reducedMotion', value: event.target.checked })} /></label><label><span><strong>Mute mission audio</strong><small>Audio integration stays optional; this preference is saved.</small></span><input type="checkbox" checked={state.settings.muted} onChange={(event) => dispatch({ type: 'SETTING', key: 'muted', value: event.target.checked })} /></label><label><span><strong>Larger text</strong><small>Increase mission UI text and control spacing.</small></span><input type="checkbox" checked={state.settings.largeText} onChange={(event) => dispatch({ type: 'SETTING', key: 'largeText', value: event.target.checked })} /></label></div><div className="quality-setting"><span><strong>World quality</strong><small>Lower quality keeps the field readable on smaller devices.</small></span><div><button type="button" className={state.settings.quality === 'low' ? 'is-active' : ''} onClick={() => dispatch({ type: 'SETTING', key: 'quality', value: 'low' })}>Low</button><button type="button" className={state.settings.quality === 'high' ? 'is-active' : ''} onClick={() => dispatch({ type: 'SETTING', key: 'quality', value: 'high' })}>High</button></div></div><button type="button" className="primary-action" onClick={onClose}>Return to field <Play size={20} /></button></div></ModalFrame>;
}

function TouchControls({ disabled, onInput, onInteract }: { disabled: boolean; onInput: (input: WorldInput | undefined) => void; onInteract: () => void }) {
  const hold = (input: WorldInput) => ({ onPointerDown: () => onInput(input), onPointerUp: () => onInput(undefined), onPointerCancel: () => onInput(undefined), onPointerLeave: () => onInput(undefined) });
  return <div className={`touch-controls${disabled ? ' is-disabled' : ''}`} aria-label="Touch movement controls"><div className="dpad"><button type="button" aria-label="Move up" disabled={disabled} {...hold({ x: 0, z: -1 })}>↑</button><div><button type="button" aria-label="Move left" disabled={disabled} {...hold({ x: -1, z: 0 })}>←</button><button type="button" aria-label="Move down" disabled={disabled} {...hold({ x: 0, z: 1 })}>↓</button><button type="button" aria-label="Move right" disabled={disabled} {...hold({ x: 1, z: 0 })}>→</button></div></div><button type="button" className="interact-touch" disabled={disabled} onClick={onInteract}><span>Use</span><small>E</small></button></div>;
}

export default function MissionGame() {
  const { state, dispatch, storageError, loadWarning } = useMissionStore();
  const [startRegion, setStartRegion] = useState<RegionId>('impact');
  const [panel, setPanel] = useState<{ kind: 'map' | 'notebook' | 'base' | 'observation' | 'branch' | 'activity' | 'finale'; region?: RegionId; id?: string } | null>(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [cinematic, setCinematic] = useState<'intro' | 'arrival' | 'departure' | null>(null);
  const [input, setInput] = useState<WorldInput | undefined>(undefined);
  const [interactRequested, setInteractRequested] = useState(0);
  const [lakeFraming, setLakeFraming] = useState<'wide' | 'close'>('wide');
  const [lakeSurveyContext, setLakeSurveyContext] = useState<LakeSurveyContext | undefined>(undefined);
  const [lakeAim, setLakeAim] = useState(0);
  const [selectedMapRegion, setSelectedMapRegion] = useState<RegionId>('impact');

  const closePanel = useCallback(() => setPanel(null), []);
  const finishCinematic = useCallback((kind: 'intro' | 'arrival' | 'departure') => {
    if (kind === 'intro') dispatch({ type: 'INTRO_DONE' });
    if (kind === 'arrival') dispatch({ type: 'ARRIVE' });
    if (kind === 'departure') dispatch({ type: 'DEPART' });
    setCinematic(null);
    setPanel(null);
    setPauseOpen(false);
    setInput(undefined);
  }, [cinematic, dispatch]);
  const startCinematic = useCallback((kind: 'arrival' | 'departure') => {
    if (kind === 'arrival' && state.arrival !== 'approved') return;
    if (kind === 'departure' && state.arrival !== 'arrived') return;
    setPanel(null);
    setPauseOpen(false);
    setInput(undefined);
    setCinematic(kind);
  }, [state.arrival]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (cinematic || (state.started && !state.introSeen)) return;
      if (panel) { setPanel(null); return; }
      if (!pauseOpen) setPauseOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cinematic, panel, pauseOpen, state.introSeen, state.started]);

  const currentId = state.started ? currentRegion(state.leo) : startRegion;
  const current = regionById(currentId);
  const currentSurvey = state.surveys[currentId];
  const currentBase = state.bases[currentId];
  const reports = reportCount(state);
  const handleInteract = useCallback((target: InteractionTarget) => {
    if (target.kind === 'base') {
      if (!state.bases[target.region].unlocked) dispatch({ type: 'UNLOCK', region: target.region });
      setPanel({ kind: 'base', region: target.region });
      setSelectedMapRegion(target.region);
      return;
    }
    if (!target.id) return;
    setPanel({ kind: target.kind, region: target.region, id: target.id });
  }, [dispatch, state.bases]);
  const handleTravel = useCallback((region: RegionId) => {
    if (state.activeRover !== null) dispatch({ type: 'EXIT_ROVER' });
    dispatch({ type: 'TRAVEL', region });
    setSelectedMapRegion(region);
    setPanel(null);
  }, [dispatch, state.activeRover]);
  const sendActivityProgress = useCallback((progress: unknown) => { if (panel?.region) dispatch({ type: 'ACTIVITY_PROGRESS', region: panel.region, progress }); }, [dispatch, panel?.region]);
  const completeActivity = useCallback(() => { if (panel?.region) dispatch({ type: 'ACTIVITY_COMPLETE', region: panel.region }); }, [dispatch, panel?.region]);
  const startLakeActivity = useCallback(() => {
    if (state.activeRover !== 'lake') {
      if (state.activeRover !== null || currentRegion(state.leo) !== 'lake' || !state.bases.lake.unlocked) return;
      dispatch({ type: 'ENTER_ROVER', region: 'lake' });
      return;
    }
    setLakeSurveyContext(undefined);
    setLakeAim(state.rovers.lake.heading);
    setPanel({ kind: 'activity', region: 'lake' });
  }, [dispatch, state.activeRover, state.bases.lake.unlocked, state.leo, state.rovers.lake.heading]);

  if (!state.started) return <StartScreen selected={startRegion} onSelect={setStartRegion} onStart={() => dispatch({ type: 'START', region: startRegion })} loadWarning={loadWarning} storageError={storageError} />;
  if (cinematic) {
    const baseCenter = cinematic === 'intro'
      ? regionById(state.startRegion).center
      : state.arrivalBase ? regionById(state.arrivalBase).center : regionById(state.startRegion).center;
    return <MissionCinematic kind={cinematic} baseCenter={baseCenter} reducedMotion={state.settings.reducedMotion} onComplete={() => finishCinematic(cinematic)} />;
  }
  if (!state.introSeen) return <MissionCinematic kind="intro" baseCenter={regionById(state.startRegion).center} reducedMotion={state.settings.reducedMotion} onComplete={() => finishCinematic('intro')} />;

  const lakeFieldOpen = panel?.kind === 'activity' && panel.region === 'lake' && state.activeRover === 'lake';
  const worldPaused = pauseOpen || (panel !== null && !lakeFieldOpen) || cinematic !== null;
  const contextAction = state.activeRover === currentId
    ? { label: 'Return to Leo', onClick: () => dispatch({ type: 'EXIT_ROVER' }) }
    : currentBase.unlocked
      ? { label: `Control ${current.name} rover`, onClick: () => dispatch({ type: 'ENTER_ROVER', region: currentId }) }
      : { label: `Open ${current.name} station`, onClick: () => setPanel({ kind: 'base', region: currentId }) };

  return <main className={`mission-shell mission-game${state.settings.largeText ? ' is-large-text' : ''}${state.settings.reducedMotion ? ' is-reduced-motion' : ''}`}>
    <div className="mission-stage"><World state={state} dispatch={dispatch} onInteract={handleInteract} paused={worldPaused} input={input} interactRequested={interactRequested} surveyCamera={lakeFieldOpen ? { heading: lakeAim, framing: lakeFraming } : undefined} onSurveyCameraChange={lakeFieldOpen ? setLakeSurveyContext : undefined} /></div>
    <MissionHeader region={current} reports={reports} onMap={() => setPanel({ kind: 'map' })} onNotebook={() => setPanel({ kind: 'notebook' })} onPause={() => setPauseOpen(true)} />
    <div className="mission-alerts" aria-live="polite">{loadWarning && <div className="mission-alert warning-note"><ShieldCheck size={18} /><span><strong>Save warning:</strong> {loadWarning} Your previous bytes were kept; this session will not overwrite them.</span></div>}{storageError && <div className="mission-alert warning-note"><ShieldCheck size={18} /><span><strong>Save unavailable:</strong> {storageError} You can keep exploring, but the last good snapshot remains protected.</span></div>}{state.message && <div className="mission-toast" role="status">{state.message}</div>}</div>
    <aside className="mission-hud mission-hud-left"><div className="hud-card"><span>Current objective</span><strong>{current.question}</strong><small>{currentSurvey.observations.length}/3 observations · {currentSurvey.activityDone ? 'activity solved' : 'activity pending'}</small></div><StockStrip stock={currentBase.stock} compact /></aside>
    <aside className="mission-hud mission-hud-right"><div className="control-hint"><span>Move</span><strong>WASD / arrows</strong><small>Shift to sprint · E to interact · R to switch actor</small></div><TouchControls disabled={worldPaused} onInput={setInput} onInteract={() => setInteractRequested((value) => value + 1)} /></aside>
    <div className="mission-context-action"><button type="button" className="context-action" disabled={worldPaused} onClick={contextAction.onClick}><span>{contextAction.label}</span><ChevronRight size={19} /></button></div>
    <div className="mission-bottom-status"><span><span className="status-dot" /> Local mission pack · v{state.contentVersion}</span><span>Leo · Sol relay</span></div>

    {panel?.kind === 'map' && <MapPanel state={state} selectedRegion={selectedMapRegion} onSelect={setSelectedMapRegion} onTravel={handleTravel} onClose={closePanel} />}
    {panel?.kind === 'notebook' && <NotebookPanel onClose={closePanel} />}
    {panel?.kind === 'base' && panel.region && <BasePanel state={state} regionId={panel.region} onPay={() => dispatch({ type: 'PAY_SURVEY', region: panel.region! })} onActivity={() => panel.region === 'lake' ? startLakeActivity() : setPanel({ kind: 'activity', region: panel.region })} onLakeActivity={startLakeActivity} onChooseOperation={(operationId) => dispatch({ type: 'CHOOSE_OPERATION', region: panel.region!, operationId })} onReport={() => dispatch({ type: 'COMPLETE_REPORT', region: panel.region! })} onSupport={() => dispatch({ type: 'SUPPORT', region: panel.region! })} onClose={closePanel} />}
    {panel?.kind === 'observation' && panel.region && panel.id && <ObservationPanel region={regionById(panel.region)} observationId={panel.id} observed={state.surveys[panel.region].observations.includes(panel.id)} onObserve={() => dispatch({ type: 'OBSERVE', region: panel.region!, id: panel.id! })} onClose={closePanel} />}
    {panel?.kind === 'branch' && panel.region && panel.id && <BranchPanel region={regionById(panel.region)} branchId={panel.id} recorded={state.surveys[panel.region].branches.includes(panel.id)} onRecord={() => dispatch({ type: 'BRANCH', region: panel.region!, id: panel.id! })} onClose={closePanel} />}
    {panel?.kind === 'activity' && panel.region === 'lake' && lakeFieldOpen && <aside className="lake-field-panel" aria-label="Lake rover field activity"><div className="lake-field-header"><strong>Lake survey field console</strong><button type="button" className="lake-field-close" onClick={closePanel}>Close field activity</button></div><p>Drive the rover; adjust real camera aim and framing. Movement and partial captures stay live.</p><div className="lake-field-controls" role="group" aria-label="Camera aim and framing"><button type="button" onClick={() => setLakeAim((heading) => heading - 0.15)}>Aim left</button><button type="button" onClick={() => setLakeAim((heading) => heading + 0.15)}>Aim right</button><button type="button" className={lakeFraming === 'wide' ? 'is-active' : ''} onClick={() => setLakeFraming('wide')}>Wide</button><button type="button" className={lakeFraming === 'close' ? 'is-active' : ''} onClick={() => setLakeFraming('close')}>Close</button></div><Activity region="lake" progress={state.surveys.lake.activityProgress} assisted={state.surveys.lake.assist} onProgress={sendActivityProgress} onComplete={completeActivity} surveyContext={lakeSurveyContext} /></aside>}{panel?.kind === 'activity' && panel.region && panel.region !== 'lake' && <ActivityModal state={state} regionId={panel.region} framing={lakeFraming} onFraming={setLakeFraming} onProgress={sendActivityProgress} onComplete={completeActivity} onClose={closePanel} />}
    {panel?.kind === 'finale' && <FinalePanel state={state} onDispatch={dispatch} onStartCinematic={startCinematic} onClose={closePanel} />}
    {pauseOpen && !panel && <PausePanel state={state} dispatch={dispatch} onClose={() => setPauseOpen(false)} />}
    {reports === 5 && (state.arrival === 'none' || state.arrival === 'arrived') && !panel && <button type="button" className="readiness-launch" onClick={() => setPanel({ kind: 'finale' })}><span><RotateCcw size={18} /> Mission review ready</span><strong>Open Ares-1 readiness <ChevronRight size={18} /></strong></button>}
  </main>;
}

export { MissionGame };
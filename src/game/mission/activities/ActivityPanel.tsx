import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Camera, Check, Drill, Image, Layers3, MapPin, Search, Wind } from 'lucide-react';
import type { RegionId } from '../contract';
import {
  DUST_BOARDS,
  ICE_SITES,
  IMPACT_CONTEXTS,
  IMPACT_SIGNALS,
  LAKE_SURVEY_TARGETS,
  VOLCANO_LAYERS,
  checkIceDrill,
  chooseIceSite,
  dustTilePorts,
  initialActivityProgress,
  isActivityComplete,
  labelIceCore,
  moveVolcanoLayer,
  normalizeActivityProgress,
  recordImpactMatch,
  recordLakeEvidence,
  rotateDustTile,
  runDustModel,
  sealIceCore,
  selectLakeTarget,
  stepIceDrill,
  volcanoRelations,
  type ActivityProgress,
  type DustProgress,
  type IceProgress,
  type ImpactProgress,
  type LakeCaptureKind,
  type LakeProgress,
  type LakeSurveyContext,
  type VolcanoProgress,
} from './rules';

export type ActivityPanelProps = {
  region: RegionId;
  progress: unknown;
  assisted: boolean;
  onProgress: (progress: unknown) => void;
  onComplete: () => void;
  /** Live values from the active rover and camera; never infer these from a UI checkbox. */
  surveyContext?: LakeSurveyContext;
};

type Feedback = { tone: 'neutral' | 'good' | 'caution'; text: string };

const shell: CSSProperties = {
  color: '#F4F1EA', background: '#1C2026', border: '1px solid #58616C', padding: 24,
  fontFamily: 'Barlow, Inter, system-ui, sans-serif', fontSize: 18, lineHeight: 1.45,
};
const heading: CSSProperties = { margin: '0 0 8px', fontSize: 28, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.02em' };
const quiet: CSSProperties = { color: '#D4D8DA', margin: 0 };
const row: CSSProperties = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 };
const grid: CSSProperties = { display: 'grid', gap: 12 };
const surface: CSSProperties = { background: '#262D34', border: '1px solid #68717A', padding: 16 };
const accent: CSSProperties = { color: '#FF8A55' };
const buttonBase: CSSProperties = {
  minHeight: 48, padding: '10px 14px', borderWidth: 1, borderStyle: 'solid', borderColor: '#A7B0B8', borderRadius: 4,
  background: '#303941', color: '#FFFFFF', font: 'inherit', fontWeight: 650, cursor: 'pointer',
};
const buttonSelected: CSSProperties = { ...buttonBase, background: '#F4F1EA', color: '#1C2026', borderColor: '#F4F1EA' };
const buttonGood: CSSProperties = { ...buttonBase, background: '#D9F2E6', color: '#143525', borderColor: '#D9F2E6' };
const buttonWarn: CSSProperties = { ...buttonBase, background: '#4A3027', color: '#FFE1D4', borderColor: '#FF9B74' };
const focusStyle = { outline: '3px solid #79D9E9', outlineOffset: 3 } as const;
const resetButtonFocus = { outline: '', outlineOffset: '' } as const;

function ActionButton({ children, selected = false, good = false, warn = false, disabled = false, onClick, label }: {
  children: React.ReactNode;
  selected?: boolean;
  good?: boolean;
  warn?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} style={{ ...(good ? buttonGood : warn ? buttonWarn : selected ? buttonSelected : buttonBase), ...(disabled ? { opacity: 0.55, cursor: 'not-allowed' } : {}) }} onFocus={(event) => { Object.assign(event.currentTarget.style, focusStyle); }} onBlur={(event) => { Object.assign(event.currentTarget.style, resetButtonFocus); }}>{children}</button>;
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  const color = feedback.tone === 'good' ? '#A9E7C4' : feedback.tone === 'caution' ? '#FFD09C' : '#D4D8DA';
  return <p role="status" aria-live="polite" style={{ ...quiet, marginTop: 14, color, minHeight: '1.5em' }}>{feedback.text}</p>;
}

function Sparkline({ path }: { path: string }) {
  return <svg viewBox="0 0 50 48" role="img" aria-label="Training signal trace" style={{ width: 86, height: 74, flex: '0 0 auto', color: '#FF8A55' }}>
    <rect x="1" y="2" width="48" height="44" fill="#14191E" stroke="#727D86" />
    <path d="M3 13H47M3 24H47M3 35H47M15 3V45M27 3V45M39 3V45" stroke="#374149" strokeWidth=".5" />
    <path d={path} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
  </svg>;
}

function TerrainIllustration({ kind }: { kind: 'rim' | 'basin' | 'slope' }) {
  const outlines: Record<typeof kind, string> = {
    rim: 'M8 82 Q24 62 42 70 Q58 78 74 40 Q89 8 105 34 Q121 63 141 54 Q159 48 174 76',
    basin: 'M8 38 Q36 42 50 72 Q74 97 100 72 Q117 40 142 42 Q158 42 174 36',
    slope: 'M10 86 L50 70 L74 48 L98 42 L126 20 L172 12 M82 59 L90 68 M108 34 L116 42',
  };
  return <svg viewBox="0 0 182 104" role="img" aria-label="Authored training terrain illustration, not a NASA image" style={{ width: '100%', height: 110, display: 'block', background: '#171D22', border: '1px solid #68717A' }}>
    <path d="M5 85H177M25 5V86M60 5V86M95 5V86M130 5V86M165 5V86" stroke="#354149" strokeWidth="1" />
    <path d={outlines[kind]} fill="none" stroke="#DB9871" strokeWidth="4" strokeLinecap="round" />
    <circle cx="90" cy="88" r="4" fill="#75D9E8" />
    <text x="7" y="100" fill="#D4D8DA" fontSize="8">SCHEMATIC · TRAINING FRAME</text>
  </svg>;
}

function ActivityFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={shell} aria-labelledby="activity-title">
    <div style={{ ...row, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
      <div style={{ maxWidth: 760 }}><h2 id="activity-title" style={heading}>{title}</h2>{children}</div>
      <span aria-label="Five-minute field activity" style={{ ...surface, padding: '8px 12px', fontWeight: 650, color: '#FFF' }}>Field activity · about 5 min</span>
    </div>
  </section>;
}

function commit(region: RegionId, next: ActivityProgress, onProgress: (progress: unknown) => void, onComplete: () => void) {
  onProgress(next);
  if (isActivityComplete(region, next)) onComplete();
}

function ImpactActivity({ progress, assisted, onProgress, onComplete }: ActivityPanelProps) {
  const value = useMemo(() => normalizeActivityProgress('impact', progress) as ImpactProgress, [progress]);
  const [selectedSignal, setSelectedSignal] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback>({ tone: 'neutral', text: 'Choose a signal, then compare its training frame and timestamp.' });
  return <ActivityFrame title="Match the impact records">
    <p style={quiet}>Match each signal with the image captured at the same time. These training records help compare clues; they do not prove where a rock came from.</p>
    {assisted && <p style={{ ...quiet, ...surface, marginTop: 12 }}>Start with the timestamps. A matching pair shares the same Sol time.</p>}
    <div style={{ ...grid, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', marginTop: 18 }}>
      <div style={grid}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Signals · {value.matches.length}/3 paired</h3>
        {IMPACT_SIGNALS.map((signal) => {
          const match = value.matches.find((item) => item.signal === signal.id);
          return <button key={signal.id} type="button" disabled={!!match} aria-pressed={selectedSignal === signal.id} onClick={() => { setSelectedSignal(signal.id); setFeedback({ tone: 'neutral', text: `${signal.title}: ${signal.clue}` }); }} style={{ ...(selectedSignal === signal.id ? buttonSelected : buttonBase), display: 'flex', width: '100%', alignItems: 'center', gap: 12, textAlign: 'left' }}>
            <Sparkline path={signal.trace} />
            <span><strong style={{ display: 'block' }}>{signal.title}</strong><span>{match ? `Paired with ${IMPACT_CONTEXTS.find((context) => context.id === match.context)?.title}` : signal.timestamp}</span></span>
            {match && <Check aria-hidden="true" style={{ marginLeft: 'auto' }} />}
          </button>;
        })}
      </div>
      <div style={grid}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Training image context</h3>
        <div style={{ ...grid, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          {IMPACT_CONTEXTS.map((context) => {
            const used = value.matches.some((match) => match.context === context.id);
            return <button key={context.id} type="button" disabled={used || !selectedSignal} onClick={() => {
              if (!selectedSignal) return;
              const result = recordImpactMatch(value, selectedSignal as 'signal-rim' | 'signal-basin' | 'signal-slope', context.id);
              setFeedback({ tone: result.accepted ? 'good' : 'caution', text: result.message });
              if (result.accepted) {
                setSelectedSignal('');
                commit('impact', result.progress, onProgress, onComplete);
              }
            }} style={{ ...(used ? buttonGood : buttonBase), minHeight: 176, display: 'grid', gridTemplateRows: '110px auto', gap: 6, textAlign: 'left' }}>
              <TerrainIllustration kind={context.illustration} />
              <span><strong style={{ display: 'block' }}>{context.title}</strong>{context.timestamp}</span>
            </button>;
          })}
        </div>
      </div>
    </div>
    <FeedbackLine feedback={feedback} />
  </ActivityFrame>;
}

function DustActivity({ progress, assisted, onProgress, onComplete }: ActivityPanelProps) {
  const value = useMemo(() => normalizeActivityProgress('dust', progress) as DustProgress, [progress]);
  const [boardIndex, setBoardIndex] = useState(0);
  const [run, setRun] = useState<ReturnType<typeof runDustModel> | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ tone: 'neutral', text: 'Select a tile and rotate it, or use the arrow buttons. Then run the model.' });
  const board = DUST_BOARDS[boardIndex];
  const result = run ?? runDustModel(boardIndex, value.rotations[boardIndex]);
  function rotate(cell: number) {
    const next = rotateDustTile(value, boardIndex, cell);
    setRun(null);
    setFeedback({ tone: 'neutral', text: `Tile ${cell + 1} rotated 90°. Run the model to check the path.` });
    onProgress(next);
  }
  function execute() {
    const nextRun = runDustModel(boardIndex, value.rotations[boardIndex]);
    setRun(nextRun);
    if (nextRun.complete) {
      setFeedback({ tone: 'good', text: `Path reaches the sampler through ${nextRun.path.length} connected tiles. This board is solved.` });
      if (boardIndex < DUST_BOARDS.length - 1) {
        // Completion for the current board is derived from saved rotations; boards are separately persisted.
      }
      if (isActivityComplete('dust', value)) onComplete();
    } else {
      const stop = nextRun.stoppedAt === null ? 'the inlet' : `tile ${nextRun.stoppedAt + 1}`;
      const hint = nextRun.reason === 'sensor' ? 'A marked sensor zone blocks this route.' : nextRun.reason === 'misaligned' ? 'The path breaks where neighboring arrows do not meet.' : nextRun.reason === 'gap' ? 'The path reaches an empty tile.' : 'The route has no connected exit.';
      setFeedback({ tone: 'caution', text: `The stream stopped at ${stop}. ${hint} Keep solved boards and change this layout.` });
    }
  }
  return <ActivityFrame title="Route the dust model">
    <p style={quiet}>Rotate 3×3 tiles to carry a model stream from the inlet to the sampler. Marked sensor squares cannot be crossed. More than one valid route can work.</p>
    {assisted && <p style={{ ...quiet, ...surface, marginTop: 12 }}>Follow the stream one tile at a time. The Run model action stops at the first break, gap, or sensor.</p>}
    <div style={{ ...row, marginTop: 16 }} aria-label="Dust model boards">
      {DUST_BOARDS.map((item, index) => <ActionButton key={item.id} selected={boardIndex === index} good={runDustModel(index, value.rotations[index]).complete} onClick={() => { setBoardIndex(index); setRun(null); setFeedback({ tone: 'neutral', text: DUST_BOARDS[index].instruction }); }}>
        Board {index + 1}: {runDustModel(index, value.rotations[index]).complete ? 'Solved' : 'Open'}
      </ActionButton>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 360px) minmax(220px, 1fr)', gap: 20, marginTop: 18, alignItems: 'start' }}>
      <div aria-label={`${board.title} 3 by 3 model grid`} role="group" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(64px, 1fr))', gap: 6, maxWidth: 360 }}>
        {Array.from({ length: 9 }, (_, cell) => {
          const tile = board.tiles.find((item) => item.cell === cell);
          const pathIndex = result.path.indexOf(cell);
          const obstacle = board.obstacles.includes(cell);
          const ports = tile ? dustTilePorts(tile.shape, value.rotations[boardIndex][cell] ?? 0) : [];
          return <button key={cell} type="button" disabled={!tile || isActivityComplete('dust', value) && runDustModel(boardIndex, value.rotations[boardIndex]).complete} aria-label={tile ? `Tile ${cell + 1}, ${tile.shape}, rotation ${(value.rotations[boardIndex][cell] ?? 0) * 90} degrees. Rotate 90 degrees.` : obstacle ? `Sensor obstacle at square ${cell + 1}` : `Empty square ${cell + 1}`} onClick={() => tile && rotate(cell)} style={{ ...buttonBase, position: 'relative', minHeight: 82, padding: 6, overflow: 'hidden', background: obstacle ? '#58392D' : pathIndex >= 0 ? '#31534A' : '#222B31', borderColor: obstacle ? '#FFC193' : pathIndex >= 0 ? '#A9E7C4' : '#68717A' }}>
            {obstacle ? <span style={{ display: 'grid', gap: 4, justifyItems: 'center' }}><Wind aria-hidden="true" /><small>Sensor</small></span> : tile ? <>
              <span aria-hidden="true" style={{ position: 'absolute', inset: 8 }}>
                {ports.map((port) => <span key={port} style={{ position: 'absolute', left: port === 1 ? '48%' : port === 3 ? 0 : '43%', top: port === 0 ? 0 : port === 2 ? '48%' : '43%', width: port % 2 ? '52%' : '14%', height: port % 2 ? '14%' : '52%', background: '#75D9E8', borderRadius: 8, transform: port === 0 ? 'translateY(-2px)' : port === 2 ? 'translateY(2px)' : port === 3 ? 'translateX(-2px)' : 'translateX(2px)' }} />)}
              </span>
              <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 13 }}>{cell + 1}</span>
            </> : <span aria-hidden="true" style={{ color: '#929CA4' }}>—</span>}
          </button>;
        })}
      </div>
      <div style={{ ...grid, ...surface }}>
        <div style={{ ...row, gap: 8 }}><strong>{board.title}</strong><span style={accent}>Inlet · square {board.source.cell + 1}</span></div>
        <p style={quiet}>{board.instruction}</p>
        <div style={row}>
          <ActionButton onClick={execute}><Wind size={20} aria-hidden="true" /> Run model</ActionButton>
          <span aria-label={result.complete ? 'Route reaches sampler' : `Stream stops: ${result.reason}`}><strong>{result.complete ? 'Sampler connected' : `Stream stops: ${result.reason}`}</strong></span>
        </div>
        <div style={{ ...row, gap: 8 }}><span>Keyboard: select a tile, press Enter to rotate. Or choose any active tile with the buttons above.</span></div>
      </div>
    </div>
    <FeedbackLine feedback={feedback} />
  </ActivityFrame>;
}

function VolcanoActivity({ progress, assisted, onProgress, onComplete }: ActivityPanelProps) {
  const value = useMemo(() => normalizeActivityProgress('volcano', progress) as VolcanoProgress, [progress]);
  const [checked, setChecked] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ tone: 'neutral', text: 'Move layers with the Up and Down buttons, then check every edge relation.' });
  const relations = volcanoRelations(value.order);
  return <ActivityFrame title="Read the cooled flow layers">
    <p style={quiet}>Arrange four model layers from oldest at the bottom to newest at the top. Every relation is supported by an overlap edge; no absolute ages are shown.</p>
    {assisted && <p style={{ ...quiet, ...surface, marginTop: 12 }}>Check one overlap at a time. The layer that lies underneath is older; a top cap can cover more than one flow.</p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(260px, 1fr)', gap: 20, marginTop: 18 }}>
      <ol aria-label="Layer order, oldest at bottom" style={{ ...grid, display: 'flex', flexDirection: 'column-reverse', listStyle: 'none', margin: 0, padding: 0 }}>
        {value.order.map((layerId, index) => {
          const layer = VOLCANO_LAYERS.find((candidate) => candidate.id === layerId)!;
          return <li key={layer.id} style={{ ...surface, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 8, borderColor: layer.color }}>
            <span><strong style={{ display: 'block' }}>{layer.name}</strong><span>{layer.clue}</span></span>
            <span style={row}>
              <ActionButton label={`Move ${layer.name} up, newer`} disabled={index === value.order.length - 1} onClick={() => { const next = moveVolcanoLayer(value, layer.id, 1); setChecked(false); onProgress(next); setFeedback({ tone: 'neutral', text: `Moved ${layer.name}. Check the overlap relations again.` }); }}><ArrowUp aria-hidden="true" /> Up</ActionButton>
              <ActionButton label={`Move ${layer.name} down, older`} disabled={index === 0} onClick={() => { const next = moveVolcanoLayer(value, layer.id, -1); setChecked(false); onProgress(next); setFeedback({ tone: 'neutral', text: `Moved ${layer.name}. Check the overlap relations again.` }); }}><ArrowDown aria-hidden="true" /> Down</ActionButton>
            </span>
          </li>;
        })}
      </ol>
      <div style={{ ...grid, ...surface }}>
        <strong>Overlap evidence · bottom to top</strong>
        {relations.map((relation) => <p key={`${relation.older}-${relation.newer}`} style={{ ...quiet, color: checked ? relation.satisfied ? '#A9E7C4' : '#FFD09C' : '#F4F1EA' }}>
          <span aria-hidden="true" style={{ display: 'inline-block', width: 28 }}>{checked ? relation.satisfied ? '✓' : '↻' : '•'}</span>{relation.evidence}
        </p>)}
        <ActionButton onClick={() => {
          const solved = isActivityComplete('volcano', value);
          setChecked(true);
          setFeedback(solved ? { tone: 'good', text: 'All four overlap relations fit. This is a relative order, not a date.' } : { tone: 'caution', text: 'Some edges do not fit yet. Correct relations stay marked while you adjust the order.' });
          if (solved) onComplete();
        }}><Layers3 size={20} aria-hidden="true" /> Check layer order</ActionButton>
        <p style={quiet}>Bottom is older · top is newer. Up and Down also work by keyboard focus plus Enter.</p>
      </div>
    </div>
    <FeedbackLine feedback={feedback} />
  </ActivityFrame>;
}

function IceActivity({ progress, assisted, onProgress, onComplete }: ActivityPanelProps) {
  const value = useMemo(() => normalizeActivityProgress('ice', progress) as IceProgress, [progress]);
  const [feedback, setFeedback] = useState<Feedback>({ tone: 'neutral', text: 'Choose a marked site, set the drill reading, then check, label, and seal the core.' });
  function update(next: IceProgress, message: string, tone: Feedback['tone'] = 'neutral') {
    setFeedback({ tone, text: message });
    commit('ice', next, onProgress, onComplete);
  }
  const drillDisabled = value.site === null || value.sealed;
  return <ActivityFrame title="Take and protect an ice core">
    <p style={quiet}>Choose a permitted site, set the drill reading inside 30–70%, then check the reading, add the location/layer label, and seal the box.</p>
    {assisted && <p style={{ ...quiet, ...surface, marginTop: 12 }}>Step assist: Advance to a safe 50% reading. You still choose Check, Label, and Seal.</p>}
    <div style={{ ...grid, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', marginTop: 18 }}>
      <section style={{ ...surface, ...grid }} aria-labelledby="ice-sites-title">
        <h3 id="ice-sites-title" style={{ margin: 0, fontSize: 20 }}>Sampling site</h3>
        {ICE_SITES.map((site) => <ActionButton key={site.id} selected={value.site === site.id} disabled={value.sealed} onClick={() => {
          const next = chooseIceSite(value, site.id);
          setFeedback({ tone: 'neutral', text: `${site.name} selected. Set the drill within the permitted 30–70% band.` });
          onProgress(next);
        }}><MapPin size={18} aria-hidden="true" /> {site.name}</ActionButton>)}
        <p style={quiet}>{ICE_SITES.find((site) => site.id === value.site)?.note ?? 'The site is recorded with the core label.'}</p>
      </section>
      <section style={{ ...surface, ...grid }} aria-labelledby="ice-drill-title">
        <h3 id="ice-drill-title" style={{ margin: 0, fontSize: 20 }}>Drill control</h3>
        <div style={{ ...row, justifyContent: 'space-between' }}>
          <ActionButton label="Decrease drill reading by 5 percent" disabled={drillDisabled} onClick={() => onProgress(stepIceDrill(value, -1))}><ArrowLeft aria-hidden="true" /> −5%</ActionButton>
          <strong aria-live="polite" style={{ fontSize: 32, fontVariantNumeric: 'tabular-nums' }}>{value.percent}%</strong>
          <ActionButton label="Increase drill reading by 5 percent" disabled={drillDisabled} onClick={() => onProgress(stepIceDrill(value, 1))}><ArrowRight aria-hidden="true" /> +5%</ActionButton>
        </div>
        <label htmlFor="ice-drill-range">Reading · permitted band 30–70%</label>
        <input id="ice-drill-range" type="range" min={0} max={100} step={5} value={value.percent} disabled={drillDisabled} onChange={(event) => onProgress({ ...value, percent: Number(event.currentTarget.value), checked: false, labeled: false, sealed: false })} style={{ width: '100%', minHeight: 48, accentColor: '#FF8A55' }} />
        <div style={{ ...row, gap: 6, justifyContent: 'space-between', fontSize: 16 }}><span>0%</span><span style={{ ...accent, fontWeight: 700 }}>30–70% accepted</span><span>100%</span></div>
        {assisted && <ActionButton disabled={value.site === null || value.sealed} onClick={() => { onProgress({ ...value, percent: 50, checked: false, labeled: false, sealed: false }); setFeedback({ tone: 'neutral', text: 'Reading advanced to 50%. Check it to record a valid drill step.' }); }}><Drill size={18} aria-hidden="true" /> Advance to 50%</ActionButton>}
        <ActionButton disabled={value.site === null || value.sealed || value.checked} onClick={() => { const result = checkIceDrill(value); update(result.progress, result.message, result.accepted ? 'good' : 'caution'); }}>Check reading</ActionButton>
        <ActionButton disabled={!value.checked || value.labeled || value.sealed} onClick={() => { const result = labelIceCore(value); update(result.progress, result.message, result.accepted ? 'good' : 'caution'); }}>Add site + layer label</ActionButton>
        <ActionButton disabled={!value.labeled || value.sealed} onClick={() => { const result = sealIceCore(value); update(result.progress, result.message, result.accepted ? 'good' : 'caution'); }}><Check size={18} aria-hidden="true" /> Seal core box</ActionButton>
        <p style={quiet}>This game-control percentage is not a real drill speed or force.</p>
      </section>
    </div>
    <FeedbackLine feedback={feedback} />
  </ActivityFrame>;
}

function lakeTargetBearing(context: LakeSurveyContext, target: (typeof LAKE_SURVEY_TARGETS)[number]) {
  return (Math.atan2(target.x - context.roverPose.x, target.z - context.roverPose.z) * 180 / Math.PI + 360) % 360;
}
function lakeTargetDistance(context: LakeSurveyContext, target: (typeof LAKE_SURVEY_TARGETS)[number]) {
  return Math.hypot(target.x - context.roverPose.x, target.z - context.roverPose.z);
}
function LakeActivity({ progress, assisted, onProgress, onComplete, surveyContext }: ActivityPanelProps) {
  const value = useMemo(() => normalizeActivityProgress('lake', progress) as LakeProgress, [progress]);
  const [feedback, setFeedback] = useState<Feedback>({ tone: 'neutral', text: 'Use the live rover and camera to make three observations for each target.' });
  const selected = LAKE_SURVEY_TARGETS.find((target) => target.id === value.selectedTarget)!;
  const evidence = value.captures[selected.id];
  function record(kind: LakeCaptureKind) {
    const result = recordLakeEvidence(value, selected.id, kind, surveyContext);
    setFeedback({ tone: result.accepted ? 'good' : 'caution', text: result.message });
    if (result.accepted) commit('lake', result.progress, onProgress, onComplete);
  }
  const incomplete = LAKE_SURVEY_TARGETS.reduce((count, target) => {
    const item = value.captures[target.id];
    return count + (item.wide === null ? 1 : 0) + (item.close === null ? 1 : 0) + (item.location === null ? 1 : 0);
  }, 0);
  return <ActivityFrame title="Build a rover context record">
    <p style={quiet}>Each of three targets needs a wide frame, a close frame, and a location fix. Captures count only when the live rover is close enough and its camera faces the selected target.</p>
    {assisted && <p style={{ ...quiet, ...surface, marginTop: 12 }}>Frame guide: wide ≤34 units; close ≤12; location fix ≤8. Aim within 20° of the target.</p>}
    <div style={{ ...grid, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 18, marginTop: 18 }}>
      <div style={grid}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Survey targets · {9 - incomplete}/9 records</h3>
        {LAKE_SURVEY_TARGETS.map((target) => {
          const item = value.captures[target.id];
          const count = Number(item.wide !== null) + Number(item.close !== null) + Number(item.location !== null);
          return <ActionButton key={target.id} selected={value.selectedTarget === target.id} good={count === 3} onClick={() => { onProgress(selectLakeTarget(value, target.id)); setFeedback({ tone: 'neutral', text: `${target.name}: face the target, then record each missing item from the live rover.` }); }}>
            <MapPin aria-hidden="true" /> {target.name} · {count}/3
          </ActionButton>;
        })}
        <div style={{ ...surface, ...grid }}>
          <strong>{selected.description}</strong>
          <span>Rover range: {surveyContext ? `${lakeTargetDistance(surveyContext, selected).toFixed(1)} units` : 'Live pose not connected'}</span>
          <span>Camera aim: {surveyContext ? `${(lakeTargetBearing(surveyContext, selected)).toFixed(0)}° target bearing` : 'Live camera not connected'}</span>
          <span>Camera mode: {surveyContext?.camera.framing ?? 'not connected'}</span>
        </div>
      </div>
      <div style={{ ...surface, ...grid }}>
        <div style={{ ...row, justifyContent: 'space-between' }}><h3 style={{ margin: 0, fontSize: 20 }}>Record live evidence</h3><Search aria-hidden="true" /></div>
        <p style={quiet}>These controls record the supplied rover pose and camera heading. They cannot create a frame when world evidence is missing.</p>
        <div style={row}>
          <ActionButton good={evidence.wide !== null} disabled={!surveyContext || evidence.wide !== null} onClick={() => record('wide')}><Image aria-hidden="true" /> Wide frame</ActionButton>
          <ActionButton good={evidence.close !== null} disabled={!surveyContext || evidence.close !== null} onClick={() => record('close')}><Camera aria-hidden="true" /> Close frame</ActionButton>
          <ActionButton good={evidence.location !== null} disabled={!surveyContext || evidence.location !== null} onClick={() => record('location')}><MapPin aria-hidden="true" /> Record location</ActionButton>
        </div>
        {!surveyContext && <p style={{ ...quiet, color: '#FFD09C' }}>Waiting for the live world adapter: rover x/z/heading and camera heading/framing. No evidence has been recorded.</p>}
        {surveyContext && <p style={quiet}>Current framing: <strong>{surveyContext.camera.framing}</strong>. The world adapter must change actual camera framing and heading.</p>}
        <div style={{ ...grid, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 4 }}>
          {(['wide', 'close', 'location'] as const).map((kind) => <p key={kind} style={{ ...quiet, color: evidence[kind] ? '#A9E7C4' : '#D4D8DA' }}>{evidence[kind] ? '✓' : '○'} {kind === 'location' ? 'Location fix' : `${kind} frame`}</p>)}
        </div>
      </div>
    </div>
    <FeedbackLine feedback={feedback} />
  </ActivityFrame>;
}

export function ActivityPanel(props: ActivityPanelProps) {
  const safeProgress = normalizeActivityProgress(props.region, props.progress) ?? initialActivityProgress(props.region);
  switch (props.region) {
    case 'impact': return <ImpactActivity {...props} progress={safeProgress} />;
    case 'dust': return <DustActivity {...props} progress={safeProgress} />;
    case 'volcano': return <VolcanoActivity {...props} progress={safeProgress} />;
    case 'ice': return <IceActivity {...props} progress={safeProgress} />;
    case 'lake': return <LakeActivity {...props} progress={safeProgress} />;
  }
}

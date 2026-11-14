import type { RegionId } from '../contract';

export type ActivityRegion = RegionId;
export type ImpactSignalId = 'signal-rim' | 'signal-basin' | 'signal-slope';
export type ImpactContextId = 'frame-rim' | 'frame-basin' | 'frame-slope';
export type ImpactMatch = { signal: ImpactSignalId; context: ImpactContextId };
export type ImpactProgress = { kind: 'impact'; version: 1; matches: ImpactMatch[] };

export const IMPACT_SIGNALS: ReadonlyArray<{
  id: ImpactSignalId;
  title: string;
  timestamp: string;
  clue: string;
  trace: string;
}> = [
  { id: 'signal-rim', title: 'Signal A · Rim check', timestamp: 'Sol 04 · 10:12', clue: 'A short training pulse marks the first scan.', trace: 'M2 27 H12 L16 9 L22 40 L29 19 L34 27 H47' },
  { id: 'signal-basin', title: 'Signal B · Basin scan', timestamp: 'Sol 11 · 08:40', clue: 'A broad, low pulse marks the regional pass.', trace: 'M2 26 H10 Q17 26 20 20 Q24 13 30 20 Q34 26 40 26 H47' },
  { id: 'signal-slope', title: 'Signal C · Slope scan', timestamp: 'Sol 11 · 09:05', clue: 'Two close peaks mark the later surface pass.', trace: 'M2 27 H12 L17 15 L21 27 L26 11 L31 27 H47' },
];

export const IMPACT_CONTEXTS: ReadonlyArray<{
  id: ImpactContextId;
  title: string;
  timestamp: string;
  note: string;
  illustration: 'rim' | 'basin' | 'slope';
}> = [
  { id: 'frame-rim', title: 'Rim and scattered rock', timestamp: 'Sol 04 · 10:12', note: 'Wide training frame · fresh rim edge', illustration: 'rim' },
  { id: 'frame-basin', title: 'Crater basin overview', timestamp: 'Sol 11 · 08:40', note: 'Wide training frame · basin floor', illustration: 'basin' },
  { id: 'frame-slope', title: 'Sloped surface detail', timestamp: 'Sol 11 · 09:05', note: 'Close training frame · slope marks', illustration: 'slope' },
];

const IMPACT_ANSWER: Readonly<Record<ImpactSignalId, ImpactContextId>> = {
  'signal-rim': 'frame-rim',
  'signal-basin': 'frame-basin',
  'signal-slope': 'frame-slope',
};

export type DustTileShape = 'straight' | 'elbow';
export type DustTileDefinition = { cell: number; shape: DustTileShape };
export type DustBoardDefinition = {
  id: string;
  title: string;
  instruction: string;
  source: { cell: number; edge: number };
  goal: { cell: number; edge: number };
  obstacles: number[];
  tiles: DustTileDefinition[];
};
export type DustProgress = { kind: 'dust'; version: 1; rotations: Array<Array<number | null>> };
export type DustRun = {
  complete: boolean;
  path: number[];
  stoppedAt: number | null;
  reason: 'connected' | 'misaligned' | 'gap' | 'sensor' | 'dead-end';
};

// Directions are N/E/S/W = 0/1/2/3. Source and goal edges point out of their cell.
export const DUST_BOARDS: ReadonlyArray<DustBoardDefinition> = [
  {
    id: 'clear-line',
    title: 'Clear line',
    instruction: 'Join the inlet to the sampler with a continuous path.',
    source: { cell: 3, edge: 3 },
    goal: { cell: 5, edge: 1 },
    obstacles: [1],
    tiles: [
      { cell: 3, shape: 'straight' },
      { cell: 4, shape: 'straight' },
      { cell: 5, shape: 'straight' },
    ],
  },
  {
    id: 'sensor-route',
    title: 'Sensor detour',
    instruction: 'Route around the marked sensor zone; do not cross it.',
    source: { cell: 3, edge: 3 },
    goal: { cell: 8, edge: 1 },
    obstacles: [1, 6],
    tiles: [
      { cell: 3, shape: 'straight' },
      { cell: 4, shape: 'elbow' },
      { cell: 7, shape: 'elbow' },
      { cell: 8, shape: 'straight' },
    ],
  },
  {
    id: 'low-channel',
    title: 'Low channel',
    instruction: 'Carry the stream below the blocked channel, then into the sampler.',
    source: { cell: 3, edge: 3 },
    goal: { cell: 8, edge: 1 },
    obstacles: [2, 4],
    tiles: [
      { cell: 3, shape: 'elbow' },
      { cell: 6, shape: 'elbow' },
      { cell: 7, shape: 'straight' },
      { cell: 8, shape: 'straight' },
    ],
  },
];

export type LayerId = 'foundation' | 'channel' | 'shelf' | 'cap';
export type VolcanoProgress = { kind: 'volcano'; version: 1; order: LayerId[] };
export const VOLCANO_LAYERS: ReadonlyArray<{ id: LayerId; name: string; clue: string; color: string }> = [
  { id: 'foundation', name: 'Foundation flow', clue: 'The lowest exposed flow supports the other edges.', color: '#9b6047' },
  { id: 'channel', name: 'Channel flow', clue: 'Its edge cuts across the foundation flow.', color: '#bf7050' },
  { id: 'shelf', name: 'Ridge-side flow', clue: 'A separate edge also rests above the foundation.', color: '#d48a60' },
  { id: 'cap', name: 'Top cap', clue: 'The cap covers both upper flow edges.', color: '#edb47c' },
];
export const VOLCANO_RELATIONS: ReadonlyArray<{ older: LayerId; newer: LayerId; evidence: string }> = [
  { older: 'foundation', newer: 'channel', evidence: 'The channel edge lies on the foundation flow.' },
  { older: 'foundation', newer: 'shelf', evidence: 'The ridge-side edge lies on the foundation flow.' },
  { older: 'channel', newer: 'cap', evidence: 'The cap covers the channel flow.' },
  { older: 'shelf', newer: 'cap', evidence: 'The cap covers the ridge-side flow.' },
];

export const ICE_SITES = [
  { id: 'layer-window', name: 'Layer window', note: 'A clear edge shows the bands in context.' },
  { id: 'stable-scarp', name: 'Stable scarp', note: 'A broad, steady face for a short core.' },
  { id: 'flat-bench', name: 'Flat bench', note: 'A level approach beside the exposed ice.' },
] as const;
export type IceSiteId = (typeof ICE_SITES)[number]['id'];
export type IceProgress = {
  kind: 'ice';
  version: 1;
  site: IceSiteId | null;
  percent: number;
  checked: boolean;
  labeled: boolean;
  sealed: boolean;
};

export const LAKE_SURVEY_TARGETS = [
  { id: 'layer-outcrop', name: 'Layered outcrop', x: 202, z: 170, description: 'A stepped rock face with visible bands.' },
  { id: 'comparison-surface', name: 'Comparison surface', x: 211, z: 171, description: 'A nearby surface for a careful comparison.' },
  { id: 'sample-site', name: 'Sample-site marker', x: 206, z: 182, description: 'A marked place to record a sample context.' },
] as const;
export type LakeTargetId = (typeof LAKE_SURVEY_TARGETS)[number]['id'];
export type LakeCapture = { x: number; z: number; heading: number; framing: 'wide' | 'close' };
export type LakeLocationFix = { x: number; z: number };
export type LakeTargetEvidence = { wide: LakeCapture | null; close: LakeCapture | null; location: LakeLocationFix | null };
export type LakeProgress = {
  kind: 'lake';
  version: 1;
  selectedTarget: LakeTargetId;
  captures: Record<LakeTargetId, LakeTargetEvidence>;
};
export type LakeSurveyContext = {
  roverPose: { x: number; z: number; heading: number };
  camera: { heading: number; framing: 'wide' | 'close' };
};
export type LakeCaptureKind = keyof LakeTargetEvidence;

export type ActivityProgress = ImpactProgress | DustProgress | VolcanoProgress | IceProgress | LakeProgress;

const ownKeysAre = (value: Record<string, unknown>, expected: string[]): boolean => {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
};
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isInt = (value: unknown, low: number, high: number): value is number => Number.isInteger(value) && (value as number) >= low && (value as number) <= high;
const isLayerId = (value: unknown): value is LayerId => VOLCANO_LAYERS.some((layer) => layer.id === value);
const isImpactSignal = (value: unknown): value is ImpactSignalId => IMPACT_SIGNALS.some((signal) => signal.id === value);
const isImpactContext = (value: unknown): value is ImpactContextId => IMPACT_CONTEXTS.some((context) => context.id === value);
const isIceSite = (value: unknown): value is IceSiteId => ICE_SITES.some((site) => site.id === value);
const isLakeTargetId = (value: unknown): value is LakeTargetId => LAKE_SURVEY_TARGETS.some((target) => target.id === value);

export function initialActivityProgress(region: ActivityRegion): ActivityProgress {
  switch (region) {
    case 'impact':
      return { kind: 'impact', version: 1, matches: [] };
    case 'dust':
      return {
        kind: 'dust',
        version: 1,
        rotations: DUST_BOARDS.map((board) => {
          const cells: Array<number | null> = Array(9).fill(null);
          for (const tile of board.tiles) cells[tile.cell] = 0;
          return cells;
        }),
      };
    case 'volcano':
      return { kind: 'volcano', version: 1, order: ['cap', 'channel', 'foundation', 'shelf'] };
    case 'ice':
      return { kind: 'ice', version: 1, site: null, percent: 0, checked: false, labeled: false, sealed: false };
    case 'lake':
      return {
        kind: 'lake',
        version: 1,
        selectedTarget: LAKE_SURVEY_TARGETS[0].id,
        captures: Object.fromEntries(LAKE_SURVEY_TARGETS.map((target) => [target.id, { wide: null, close: null, location: null }])) as Record<LakeTargetId, LakeTargetEvidence>,
      };
  }
}

function validImpactProgress(value: unknown): value is ImpactProgress {
  if (!isRecord(value) || !ownKeysAre(value, ['kind', 'version', 'matches']) || value.kind !== 'impact' || value.version !== 1 || !Array.isArray(value.matches) || value.matches.length > 3) return false;
  const signals = new Set<string>();
  const contexts = new Set<string>();
  for (const item of value.matches) {
    if (!isRecord(item) || !ownKeysAre(item, ['signal', 'context']) || !isImpactSignal(item.signal) || !isImpactContext(item.context)) return false;
    if (signals.has(item.signal) || contexts.has(item.context) || IMPACT_ANSWER[item.signal] !== item.context) return false;
    signals.add(item.signal);
    contexts.add(item.context);
  }
  return true;
}

function validDustProgress(value: unknown): value is DustProgress {
  if (!isRecord(value) || !ownKeysAre(value, ['kind', 'version', 'rotations']) || value.kind !== 'dust' || value.version !== 1 || !Array.isArray(value.rotations) || value.rotations.length !== DUST_BOARDS.length) return false;
  return value.rotations.every((row, boardIndex) => {
    if (!Array.isArray(row) || row.length !== 9) return false;
    const active = new Set(DUST_BOARDS[boardIndex].tiles.map((tile) => tile.cell));
    return row.every((rotation, cell) => active.has(cell) ? isInt(rotation, 0, 3) : rotation === null);
  });
}

function validVolcanoProgress(value: unknown): value is VolcanoProgress {
  if (!isRecord(value) || !ownKeysAre(value, ['kind', 'version', 'order']) || value.kind !== 'volcano' || value.version !== 1 || !Array.isArray(value.order) || value.order.length !== VOLCANO_LAYERS.length) return false;
  return value.order.every(isLayerId) && new Set(value.order).size === VOLCANO_LAYERS.length;
}

function validIceProgress(value: unknown): value is IceProgress {
  if (!isRecord(value) || !ownKeysAre(value, ['kind', 'version', 'site', 'percent', 'checked', 'labeled', 'sealed']) || value.kind !== 'ice' || value.version !== 1) return false;
  if (value.site !== null && !isIceSite(value.site)) return false;
  if (!isInt(value.percent, 0, 100) || value.percent % 5 !== 0 || typeof value.checked !== 'boolean' || typeof value.labeled !== 'boolean' || typeof value.sealed !== 'boolean') return false;
  if (value.checked && (value.site === null || value.percent < 30 || value.percent > 70)) return false;
  if (value.labeled && !value.checked) return false;
  if (value.sealed && !value.labeled) return false;
  return true;
}

function wrapAngle(angle: number): number {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}
function angleDistance(a: number, b: number): number {
  const full = Math.PI * 2;
  return Math.abs((((a - b + Math.PI) % full) + full) % full - Math.PI);
}
function distanceToTarget(x: number, z: number, target: { x: number; z: number }): number {
  return Math.hypot(target.x - x, target.z - z);
}
function targetBearing(x: number, z: number, target: { x: number; z: number }): number {
  return wrapAngle(Math.atan2(target.x - x, target.z - z));
}
function validLakeCapture(value: unknown, target: (typeof LAKE_SURVEY_TARGETS)[number], kind: 'wide' | 'close'): value is LakeCapture {
  if (!isRecord(value) || !ownKeysAre(value, ['x', 'z', 'heading', 'framing']) || !isFiniteNumber(value.x) || !isFiniteNumber(value.z) || !isFiniteNumber(value.heading) || value.framing !== kind) return false;
  const distance = distanceToTarget(value.x, value.z, target);
  const range = kind === 'wide' ? 34 : 12;
  const alignment = angleDistance(wrapAngle(value.heading), targetBearing(value.x, value.z, target));
  return distance <= range && alignment <= (20 * Math.PI / 180);
}
function validLakeLocation(value: unknown, target: (typeof LAKE_SURVEY_TARGETS)[number]): value is LakeLocationFix {
  return isRecord(value) && ownKeysAre(value, ['x', 'z']) && isFiniteNumber(value.x) && isFiniteNumber(value.z) && distanceToTarget(value.x, value.z, target) <= 8;
}

function validLakeProgress(value: unknown): value is LakeProgress {
  if (!isRecord(value) || !ownKeysAre(value, ['kind', 'version', 'selectedTarget', 'captures']) || value.kind !== 'lake' || value.version !== 1 || !isLakeTargetId(value.selectedTarget) || !isRecord(value.captures) || !ownKeysAre(value.captures, LAKE_SURVEY_TARGETS.map((target) => target.id))) return false;
  for (const target of LAKE_SURVEY_TARGETS) {
    const record = value.captures[target.id];
    if (!isRecord(record) || !ownKeysAre(record, ['wide', 'close', 'location'])) return false;
    const { wide, close, location } = record;
    if (wide !== null && !validLakeCapture(wide, target, 'wide')) return false;
    if (close !== null && !validLakeCapture(close, target, 'close')) return false;
    if (location !== null && !validLakeLocation(location, target)) return false;
  }
  return true;
}

export function isActivityProgressValid(region: ActivityRegion, value: unknown): value is ActivityProgress {
  switch (region) {
    case 'impact': return validImpactProgress(value);
    case 'dust': return validDustProgress(value);
    case 'volcano': return validVolcanoProgress(value);
    case 'ice': return validIceProgress(value);
    case 'lake': return validLakeProgress(value);
  }
}

export function normalizeActivityProgress(region: ActivityRegion, value: unknown): ActivityProgress {
  switch (region) {
    case 'impact': return validImpactProgress(value) ? value : initialActivityProgress(region);
    case 'dust': return validDustProgress(value) ? value : initialActivityProgress(region);
    case 'volcano': return validVolcanoProgress(value) ? value : initialActivityProgress(region);
    case 'ice': return validIceProgress(value) ? value : initialActivityProgress(region);
    case 'lake': return validLakeProgress(value) ? value : initialActivityProgress(region);
  }
}

export function isActivityComplete(region: ActivityRegion, progress: unknown): boolean {
  switch (region) {
    case 'impact': return validImpactProgress(progress) && progress.matches.length === IMPACT_SIGNALS.length;
    case 'dust': return validDustProgress(progress) && DUST_BOARDS.every((_, index) => runDustModel(index, progress.rotations[index]).complete);
    case 'volcano': return validVolcanoProgress(progress) && volcanoRelations(progress.order).every((relation) => relation.satisfied);
    case 'ice': return validIceProgress(progress) && progress.site !== null && progress.checked && progress.labeled && progress.sealed;
    case 'lake': return validLakeProgress(progress) && LAKE_SURVEY_TARGETS.every(({ id }) => {
      const evidence = progress.captures[id];
      return evidence.wide !== null && evidence.close !== null && evidence.location !== null;
    });
  }
}

export function recordImpactMatch(progress: unknown, signal: ImpactSignalId, context: ImpactContextId): { progress: ImpactProgress; accepted: boolean; message: string } {
  const current = normalizeActivityProgress('impact', progress) as ImpactProgress;
  if (current.matches.some((match) => match.signal === signal || match.context === context)) {
    return { progress: current, accepted: false, message: 'That record is already paired. Choose an unmatched signal and frame.' };
  }
  if (IMPACT_ANSWER[signal] !== context) {
    return { progress: current, accepted: false, message: 'The timestamps differ. Keep the correct pairs and try another frame.' };
  }
  const next: ImpactProgress = { ...current, matches: [...current.matches, { signal, context }] };
  const message = next.matches.length === IMPACT_SIGNALS.length ? 'All three training records match. The event still needs more evidence for a scientific claim.' : 'Pair saved. The other correct pairs are preserved.';
  return { progress: next, accepted: true, message };
}

function basePorts(shape: DustTileShape): number[] {
  return shape === 'straight' ? [0, 2] : [0, 1];
}
export function dustTilePorts(shape: DustTileShape, rotation: number): number[] {
  return basePorts(shape).map((edge) => (edge + rotation) % 4);
}
function neighbor(cell: number, edge: number): number | null {
  const row = Math.floor(cell / 3);
  const col = cell % 3;
  if (edge === 0) return row > 0 ? cell - 3 : null;
  if (edge === 1) return col < 2 ? cell + 1 : null;
  if (edge === 2) return row < 2 ? cell + 3 : null;
  return col > 0 ? cell - 1 : null;
}

export function runDustModel(boardIndex: number, rotations: Array<number | null>): DustRun {
  const board = DUST_BOARDS[boardIndex];
  if (!board || rotations.length !== 9) return { complete: false, path: [], stoppedAt: null, reason: 'dead-end' };
  const tileByCell = new Map(board.tiles.map((tile) => [tile.cell, tile]));
  const sourceTile = tileByCell.get(board.source.cell);
  if (!sourceTile || !dustTilePorts(sourceTile.shape, rotations[board.source.cell] ?? 0).includes(board.source.edge)) {
    return { complete: false, path: [board.source.cell], stoppedAt: board.source.cell, reason: 'misaligned' };
  }
  type Step = { cell: number; enteredFrom: number; path: number[] };
  const queue: Step[] = [{ cell: board.source.cell, enteredFrom: board.source.edge, path: [board.source.cell] }];
  const visited = new Set<string>();
  let best: DustRun = { complete: false, path: [board.source.cell], stoppedAt: board.source.cell, reason: 'dead-end' };
  while (queue.length > 0) {
    const step = queue.shift()!;
    const key = `${step.cell}:${step.enteredFrom}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const tile = tileByCell.get(step.cell);
    if (!tile) continue;
    const ports = dustTilePorts(tile.shape, rotations[step.cell] ?? 0);
    if (!ports.includes(step.enteredFrom)) continue;
    if (step.cell === board.goal.cell && ports.includes(board.goal.edge)) return { complete: true, path: step.path, stoppedAt: null, reason: 'connected' };
    let advanced = false;
    for (const edge of ports) {
      if (edge === step.enteredFrom) continue;
      const nextCell = neighbor(step.cell, edge);
      if (nextCell === null) continue;
      if (board.obstacles.includes(nextCell)) {
        const candidate: DustRun = { complete: false, path: [...step.path, nextCell], stoppedAt: nextCell, reason: 'sensor' };
        if (candidate.path.length >= best.path.length) best = candidate;
        continue;
      }
      const nextTile = tileByCell.get(nextCell);
      if (!nextTile) {
        const candidate: DustRun = { complete: false, path: step.path, stoppedAt: nextCell, reason: 'gap' };
        if (candidate.path.length >= best.path.length) best = candidate;
        continue;
      }
      const nextPorts = dustTilePorts(nextTile.shape, rotations[nextCell] ?? 0);
      const incoming = (edge + 2) % 4;
      if (!nextPorts.includes(incoming)) {
        const candidate: DustRun = { complete: false, path: [...step.path, nextCell], stoppedAt: nextCell, reason: 'misaligned' };
        if (candidate.path.length >= best.path.length) best = candidate;
        continue;
      }
      advanced = true;
      queue.push({ cell: nextCell, enteredFrom: incoming, path: [...step.path, nextCell] });
    }
    if (!advanced) {
      const candidate: DustRun = { complete: false, path: step.path, stoppedAt: step.cell, reason: 'dead-end' };
      if (candidate.path.length >= best.path.length) best = candidate;
    }
  }
  return best;
}

export function rotateDustTile(progress: unknown, boardIndex: number, cell: number): DustProgress {
  const current = normalizeActivityProgress('dust', progress) as DustProgress;
  const board = DUST_BOARDS[boardIndex];
  if (!board || !board.tiles.some((tile) => tile.cell === cell) || runDustModel(boardIndex, current.rotations[boardIndex]).complete) return current;
  const rotations = current.rotations.map((row) => [...row]);
  rotations[boardIndex][cell] = ((rotations[boardIndex][cell] ?? 0) + 1) % 4;
  return { ...current, rotations };
}

export function volcanoRelations(order: readonly LayerId[]): Array<{ older: LayerId; newer: LayerId; satisfied: boolean; evidence: string }> {
  const rank = new Map(order.map((id, index) => [id, index]));
  return VOLCANO_RELATIONS.map((relation) => ({ ...relation, satisfied: (rank.get(relation.older) ?? Infinity) < (rank.get(relation.newer) ?? -Infinity) }));
}
export function moveVolcanoLayer(progress: unknown, layer: LayerId, delta: -1 | 1): VolcanoProgress {
  const current = normalizeActivityProgress('volcano', progress) as VolcanoProgress;
  const from = current.order.indexOf(layer);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= current.order.length) return current;
  const order = [...current.order];
  [order[from], order[to]] = [order[to], order[from]];
  return { ...current, order };
}

export function chooseIceSite(progress: unknown, site: IceSiteId): IceProgress {
  const current = normalizeActivityProgress('ice', progress) as IceProgress;
  if (!isIceSite(site) || current.sealed) return current;
  if (site === current.site) return current;
  return { kind: 'ice', version: 1, site, percent: 0, checked: false, labeled: false, sealed: false };
}
export function stepIceDrill(progress: unknown, direction: -1 | 1): IceProgress {
  const current = normalizeActivityProgress('ice', progress) as IceProgress;
  if (current.site === null || current.sealed) return current;
  return { ...current, percent: Math.max(0, Math.min(100, current.percent + direction * 5)), checked: false, labeled: false, sealed: false };
}
export function checkIceDrill(progress: unknown): { progress: IceProgress; accepted: boolean; message: string } {
  const current = normalizeActivityProgress('ice', progress) as IceProgress;
  if (current.site === null) return { progress: current, accepted: false, message: 'Choose a marked sampling site before checking the drill.' };
  if (current.percent < 30 || current.percent > 70) return { progress: { ...current, checked: false, labeled: false, sealed: false }, accepted: false, message: `The drill reading is ${current.percent}%. Adjust it to the allowed 30–70% band, then check again.` };
  return { progress: { ...current, checked: true, labeled: false, sealed: false }, accepted: true, message: `Reading accepted at ${current.percent}%. Add the site and layer label.` };
}
export function labelIceCore(progress: unknown): { progress: IceProgress; accepted: boolean; message: string } {
  const current = normalizeActivityProgress('ice', progress) as IceProgress;
  if (!current.checked || current.site === null) return { progress: current, accepted: false, message: 'Check an in-range drill reading before labeling the core.' };
  return { progress: { ...current, labeled: true, sealed: false }, accepted: true, message: 'Site and layer label saved. Seal the core box to finish.' };
}
export function sealIceCore(progress: unknown): { progress: IceProgress; accepted: boolean; message: string } {
  const current = normalizeActivityProgress('ice', progress) as IceProgress;
  if (!current.labeled) return { progress: current, accepted: false, message: 'Add the site and layer label before sealing the core.' };
  const next: IceProgress = { ...current, sealed: true };
  return { progress: next, accepted: true, message: 'Core box sealed. The sample is ready for its separate analysis step.' };
}

function lakeContextIsValid(context: unknown): context is LakeSurveyContext {
  if (!isRecord(context) || !isRecord(context.roverPose) || !isRecord(context.camera)) return false;
  const pose = context.roverPose;
  const camera = context.camera;
  return isFiniteNumber(pose.x) && isFiniteNumber(pose.z) && isFiniteNumber(pose.heading) && isFiniteNumber(camera.heading) && (camera.framing === 'wide' || camera.framing === 'close');
}
function lakeCaptureMessage(kind: LakeCaptureKind, context: LakeSurveyContext, target: (typeof LAKE_SURVEY_TARGETS)[number]): string | null {
  const distance = distanceToTarget(context.roverPose.x, context.roverPose.z, target);
  const alignment = angleDistance(wrapAngle(context.camera.heading), targetBearing(context.roverPose.x, context.roverPose.z, target));
  if (kind === 'wide' && context.camera.framing !== 'wide') return 'Set the live camera to Wide framing before recording this view.';
  if (kind === 'close' && context.camera.framing !== 'close') return 'Set the live camera to Close framing before recording this view.';
  if (kind === 'wide' && distance > 34) return 'Move within 34 game units of the target for a wide frame.';
  if (kind === 'close' && distance > 12) return 'Move within 12 game units for a close frame.';
  if ((kind === 'wide' || kind === 'close') && alignment > (20 * Math.PI / 180)) return 'Turn the rover camera toward the target; the view is not aligned yet.';
  if (kind === 'location' && distance > 8) return 'Move within 8 game units to record the target location.';
  return null;
}
export function selectLakeTarget(progress: unknown, targetId: LakeTargetId): LakeProgress {
  const current = normalizeActivityProgress('lake', progress) as LakeProgress;
  if (!isLakeTargetId(targetId)) return current;
  return { ...current, selectedTarget: targetId };
}
export function recordLakeEvidence(progress: unknown, targetId: LakeTargetId, kind: LakeCaptureKind, context: unknown): { progress: LakeProgress; accepted: boolean; message: string } {
  const current = normalizeActivityProgress('lake', progress) as LakeProgress;
  const target = LAKE_SURVEY_TARGETS.find((candidate) => candidate.id === targetId);
  if (!target || !lakeContextIsValid(context)) return { progress: current, accepted: false, message: 'Live rover position and camera heading are not available. No frame was recorded.' };
  const blocked = lakeCaptureMessage(kind, context, target);
  if (blocked) return { progress: current, accepted: false, message: blocked };
  const evidence = current.captures[targetId];
  const nextCapture = kind === 'location'
    ? { x: context.roverPose.x, z: context.roverPose.z }
    : { x: context.roverPose.x, z: context.roverPose.z, heading: wrapAngle(context.camera.heading), framing: kind };
  const next: LakeProgress = {
    ...current,
    selectedTarget: targetId,
    captures: {
      ...current.captures,
      [targetId]: { ...evidence, [kind]: nextCapture },
    },
  };
  const done = isActivityComplete('lake', next);
  return { progress: next, accepted: true, message: done ? 'Three complete target records saved: wide, close, and location at each site.' : `${kind === 'location' ? 'Location fix' : `${kind} frame`} recorded from the live rover view.` };
}

import { REGIONS, REGION_IDS, regionById } from './content';
import { isActivityComplete, isActivityProgressValid } from './activities/rules';
import {
  addStock,
  BASE_ACTIVATION_DISTANCE,
  CONTENT_VERSION,
  copyPose,
  copyStock,
  ESSENTIAL_COST,
  GO_FLOOR,
  isFiniteNumber,
  isMissionSettingValue,
  isPose,
  isRecord,
  isRegionId,
  isResearchGoal,
  isSafeNonNegativeInteger,
  isStock,
  MISSION_CAMPAIGN_ID,
  MISSION_SCHEMA_VERSION,
  OPERATION_COST_EU,
  MissionEvent,
  MissionSettings,
  BaseState,
  MissionState,
  PACK_HASH,
  Pose,
  poseWithinWorld,
  RegionId,
  RULES_VERSION,
  Stock,
  SurveyState,
  stockAtLeast,
  stockCanPay,
  subtractStock,
} from './contract';

const INITIAL_STOCK: Stock = { energy: 12, meals: 4, water: 5, air: 4 };
const OBSERVATION_DISTANCE = 48;
const BRANCH_DISTANCE = 48;
const MAX_MESSAGE_LENGTH = 800;
const SETTING_KEYS: Array<keyof MissionSettings> = ['reducedMotion', 'muted', 'largeText', 'quality'];

const isJsonValue = (value: unknown, depth = 0): boolean => {
  if (depth > 16) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item, depth + 1));
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => isJsonValue(item, depth + 1));
};

const cloneJson = <T>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

const uniqueStrings = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === 'string' && item.length > 0 && item.length <= 160) &&
  new Set(value).size === value.length;

const exactRegionKeys = (value: unknown): value is Record<RegionId, unknown> =>
  isRecord(value) &&
  Object.keys(value).length === REGION_IDS.length &&
  REGION_IDS.every((id) => Object.prototype.hasOwnProperty.call(value, id));

const finiteHeading = (value: unknown): value is number => isFiniteNumber(value) && Math.abs(value) <= 1000000;

const validPose = (value: unknown): value is Pose =>
  isPose(value) && poseWithinWorld(value) && finiteHeading(value.heading);

const validMessage = (value: unknown): value is string => typeof value === 'string' && value.length <= MAX_MESSAGE_LENGTH;

const distanceSquared = (a: [number, number], b: [number, number]): number => {
  const dx = a[0] - b[0];
  const dz = a[1] - b[1];
  return dx * dx + dz * dz;
};

const posePoint = (pose: Pose): [number, number] => [pose.x, pose.z];

const isNear = (pose: Pose, point: [number, number], maxDistance: number): boolean =>
  distanceSquared(posePoint(pose), point) <= maxDistance * maxDistance;

type BaseStateLike = BaseState;

const baseFor = (state: MissionState, base: RegionId | BaseStateLike): BaseStateLike =>
  typeof base === 'string' ? state.bases[base] : base;

const validCheckState = (value: unknown): value is BaseStateLike['checks'] =>
  isRecord(value) &&
  typeof value.airheat === 'boolean' &&
  typeof value.shelter === 'boolean' &&
  typeof value.comms === 'boolean';

const validBase = (value: unknown): value is BaseStateLike => {
  if (!isRecord(value) || typeof value.unlocked !== 'boolean' || !isStock(value.stock)) return false;
  if (!validCheckState(value.checks)) return false;
  if (value.operation !== null && typeof value.operation !== 'string') return false;
  return typeof value.report === 'boolean';
};

const validSurvey = (value: unknown): value is MissionState['surveys'][RegionId] => {
  if (!isRecord(value)) return false;
  if (!uniqueStrings(value.observations) || !uniqueStrings(value.branches)) return false;
  if (typeof value.paid !== 'boolean' || !isRegionId(value.supportBaseId)) return false;
  if (typeof value.activityDone !== 'boolean' || !isJsonValue(value.activityProgress)) return false;
  if (typeof value.assist !== 'boolean') return false;
  if (value.operation !== null && typeof value.operation !== 'string') return false;
  if (value.deferred !== null && typeof value.deferred !== 'string') return false;
  return true;
};

const validSettings = (value: unknown): value is MissionSettings => {
  if (!isRecord(value)) return false;
  return SETTING_KEYS.every((key) => isMissionSettingValue(key, value[key]));
};

const validStringArray = (value: unknown): value is string[] => uniqueStrings(value);

const hasExactRootKeys = (value: Record<string, unknown>): boolean => {
  const keys = [
    'schemaVersion',
    'campaignId',
    'contentVersion',
    'rulesVersion',
    'packHash',
    'saveRevision',
    'started',
    'startRegion',
    'leo',
    'rovers',
    'activeRover',
    'leoReturnPose',
    'bases',
    'surveys',
    'transactions',
    'supportIds',
    'researchGoal',
    'arrivalBase',
    'arrival',
    'introSeen',
    'settings',
    'message',
  ];
  return Object.keys(value).length === keys.length && keys.every((key) => key in value);
};

const validOperationsFor = (region: RegionId): Set<string> =>
  new Set(regionById(region).operations.map((item) => item.id));

const normalizeMission = (value: Record<string, unknown>): MissionState | null => {
  if (!hasExactRootKeys(value)) return null;
  if (value.schemaVersion !== MISSION_SCHEMA_VERSION || value.campaignId !== MISSION_CAMPAIGN_ID) return null;
  if (typeof value.contentVersion !== 'string' || typeof value.rulesVersion !== 'string' || typeof value.packHash !== 'string') return null;
  if (!isSafeNonNegativeInteger(value.saveRevision) || typeof value.started !== 'boolean' || !isRegionId(value.startRegion)) return null;
  if (!validPose(value.leo) || !exactRegionKeys(value.rovers)) return null;
  const rawRovers = value.rovers;
  if (!REGION_IDS.every((id) => validPose(rawRovers[id]))) return null;
  if (value.activeRover !== null && !isRegionId(value.activeRover)) return null;
  if (value.leoReturnPose !== null && !validPose(value.leoReturnPose)) return null;
  if (!exactRegionKeys(value.bases) || !exactRegionKeys(value.surveys)) return null;
  const rawBases = value.bases;
  const rawSurveys = value.surveys;
  if (!REGION_IDS.every((id) => validBase(rawBases[id]))) return null;
  if (!REGION_IDS.every((id) => validSurvey(rawSurveys[id]))) return null;
  if (!validStringArray(value.transactions) || !validStringArray(value.supportIds)) return null;
  if (value.researchGoal !== null && (typeof value.researchGoal !== 'string' || !isResearchGoal(value.researchGoal))) return null;
  if (value.arrivalBase !== null && !isRegionId(value.arrivalBase)) return null;
  if (value.arrival !== 'none' && value.arrival !== 'sent' && value.arrival !== 'approved' && value.arrival !== 'arrived' && value.arrival !== 'departed') return null;
  if (typeof value.introSeen !== 'boolean' || !validSettings(value.settings) || !validMessage(value.message)) return null;

  for (const id of REGION_IDS) {
    const base = rawBases[id];
    const survey = rawSurveys[id];
    if (!validBase(base) || !validSurvey(survey)) return null;
    if (base.operation !== null && !validOperationsFor(id).has(base.operation)) return null;
    if (survey.operation !== null && !validOperationsFor(id).has(survey.operation)) return null;
    if (survey.deferred !== null && !validOperationsFor(id).has(survey.deferred) && survey.deferred !== 'support-recovery') return null;
    const definition = regionById(id);
    if (!survey.observations.every((item) => definition.observations.some((observation) => observation.id === item))) return null;
    if (!survey.branches.every((item) => definition.branches.some((candidate) => candidate.id === item))) return null;
    if (survey.activityProgress !== null && !isActivityProgressValid(id, survey.activityProgress)) return null;
    if (survey.paid !== value.transactions.includes(`survey:${id}:essential`) || (survey.paid && survey.observations.length < 2)) return null;
    if (survey.activityDone && (!survey.paid || survey.activityProgress === null || !isActivityComplete(id, survey.activityProgress))) return null;
    if (survey.operation !== null) {
      const chargeId = `operation:${id}:${survey.operation}`;
      const outputId = `operation-output:${id}:${survey.operation}`;
      if (!survey.activityDone || !survey.paid || !value.transactions.includes(chargeId) || !value.transactions.includes(outputId)) return null;
      const supportBase = rawBases[survey.supportBaseId];
      if (!validBase(supportBase) || supportBase.operation !== survey.operation) return null;
    }
    if (survey.deferred !== null && survey.operation !== null && survey.deferred === survey.operation) return null;
    if (base.report && (!survey.activityDone || survey.observations.length < 2 || (survey.operation === null && !value.supportIds.some((item) => item.startsWith(`support:${id}:`))))) return null;
  }

  return cloneJson(value) as unknown as MissionState;
};

const changed = (state: MissionState, patch: Partial<MissionState>): MissionState => ({
  ...state,
  ...patch,
  saveRevision: state.saveRevision + 1,
});

const withBase = (state: MissionState, id: RegionId, base: BaseStateLike): MissionState => ({
  ...state,
  bases: { ...state.bases, [id]: base },
});

const withSurvey = (state: MissionState, id: RegionId, survey: MissionState['surveys'][RegionId]): MissionState => ({
  ...state,
  surveys: { ...state.surveys, [id]: survey },
});

const baseDistance = (state: MissionState, region: RegionId): number =>
  Math.sqrt(distanceSquared(posePoint(state.leo), regionById(region).center));

const currentActorPose = (state: MissionState): Pose =>
  state.activeRover === null ? state.leo : state.rovers[state.activeRover];

const baseApronPose = (region: RegionId, dx = 0): Pose => {
  const center = regionById(region).center;
  return { x: center[0] + dx, z: center[1] + 12, heading: 0 };
};

const safeAddStock = (a: Stock, b: Stock): Stock | null => {
  const next = addStock(a, b);
  return isStock(next) ? next : null;
};

const protectedStockFor = (state: MissionState, region: RegionId): Stock => {
  const reserve = { ...GO_FLOOR };
  for (const id of REGION_IDS) {
    const survey = state.surveys[id];
    if (survey.supportBaseId !== region || state.bases[id].report) continue;
    if (!survey.paid) {
      reserve.energy += ESSENTIAL_COST.energy;
      reserve.meals += ESSENTIAL_COST.meals;
      reserve.water += ESSENTIAL_COST.water;
      reserve.air += ESSENTIAL_COST.air;
      if (survey.deferred !== 'support-recovery') reserve.energy += OPERATION_COST_EU;
    } else if (survey.operation === null && survey.deferred !== 'support-recovery') {
      reserve.energy += OPERATION_COST_EU;
    }
  }
  return reserve;
};

const actorInRegion = (state: MissionState, region: RegionId): boolean => {
  if (state.activeRover !== null && state.activeRover !== region) return false;
  return currentRegion(state.activeRover === null ? state.leo : state.rovers[region]) === region;
};

const canInteractAtRegion = (state: MissionState, region: RegionId): boolean =>
  state.bases[region].unlocked && actorInRegion(state, region);

const observationById = (region: RegionId, id: string) =>
  regionById(region).observations.find((item) => item.id === id);

const branchById = (region: RegionId, id: string) => regionById(region).branches.find((item) => item.id === id);

const pushUnique = (items: string[], value: string): string[] =>
  items.includes(value) ? items : [...items, value];

const transactionSeen = (state: MissionState, id: string): boolean => state.transactions.includes(id);

const operationFor = (region: RegionId, operationId: string) =>
  regionById(region).operations.find((operation) => operation.id === operationId);

const currentSupportBase = (state: MissionState, region: RegionId): RegionId =>
  state.surveys[region].supportBaseId;

export const REGION_CENTERS: Record<RegionId, [number, number]> = Object.fromEntries(
  REGIONS.map((region) => [region.id, region.center]),
) as Record<RegionId, [number, number]>;

export const currentRegion = (pose: Pose): RegionId => {
  if (!validPose(pose)) return 'impact';
  let nearest: RegionId = REGION_IDS[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const region of REGIONS) {
    const distance = distanceSquared(posePoint(pose), region.center);
    if (distance < nearestDistance) {
      nearest = region.id;
      nearestDistance = distance;
    }
  }
  return nearest;
};

export const initialMission = (start: RegionId = 'impact'): MissionState => {
  const startRegion = isRegionId(start) ? start : 'impact';
  const rovers = Object.fromEntries(
    REGIONS.map((region) => [region.id, baseApronPose(region.id, 8)]),
  ) as Record<RegionId, Pose>;
  const bases = Object.fromEntries(
    REGION_IDS.map((id) => [
      id,
      {
        unlocked: false,
        stock: copyStock(INITIAL_STOCK),
        checks: { airheat: false, shelter: false, comms: false },
        operation: null,
        report: false,
      },
    ]),
  ) as Record<RegionId, BaseStateLike>;
  const survey = (id: RegionId): SurveyState => ({
    observations: [],
    branches: [],
    paid: false,
    supportBaseId: id,
    activityDone: false,
    activityProgress: null,
    assist: false,
    operation: null,
    deferred: null,
  });
  const surveys: Record<RegionId, SurveyState> = {
    impact: survey('impact'),
    dust: survey('dust'),
    volcano: survey('volcano'),
    ice: survey('ice'),
    lake: survey('lake'),
  };
  return {
    schemaVersion: MISSION_SCHEMA_VERSION,
    campaignId: MISSION_CAMPAIGN_ID,
    contentVersion: CONTENT_VERSION,
    rulesVersion: RULES_VERSION,
    packHash: PACK_HASH,
    saveRevision: 0,
    started: false,
    startRegion,
    leo: baseApronPose(startRegion),
    rovers,
    activeRover: null,
    leoReturnPose: null,
    bases,
    surveys,
    transactions: [],
    supportIds: [],
    researchGoal: null,
    arrivalBase: null,
    arrival: 'none',
    introSeen: false,
    settings: { reducedMotion: false, muted: false, largeText: false, quality: 'high' },
    message: 'Choose a station to begin.',
  };
};

export const readiness = (
  state: MissionState,
  base: RegionId | BaseStateLike,
): { go: boolean; missing: string[] } => {
  const selected = typeof base === 'string' && isRegionId(base) ? baseFor(state, base) : base;
  const missing: string[] = [];
  if (reportCount(state) < REGION_IDS.length) missing.push('reports');
  if (selected.stock.energy < GO_FLOOR.energy) missing.push('energy');
  if (selected.stock.meals < GO_FLOOR.meals) missing.push('meals');
  if (selected.stock.water < GO_FLOOR.water) missing.push('water');
  if (selected.stock.air < GO_FLOOR.air) missing.push('air');
  if (!selected.checks.airheat) missing.push('airheat');
  if (!selected.checks.shelter) missing.push('shelter');
  if (!selected.checks.comms) missing.push('comms');
  return { go: missing.length === 0, missing };
};

export const reportCount = (state: MissionState): number =>
  REGION_IDS.reduce((total, id) => total + (state.bases[id].report ? 1 : 0), 0);

export const canStartActivity = (state: MissionState, region: RegionId): boolean => {
  if (!isRegionId(region) || !state.started || !state.bases[region].unlocked) return false;
  const survey = state.surveys[region];
  return !survey.activityDone && survey.paid && survey.observations.length >= 2 && actorInRegion(state, region);
};

export const operationSummary = (state: MissionState, region: RegionId): string => {
  if (!isRegionId(region)) return 'No operation selected.';
  const survey = state.surveys[region];
  if (survey.operation !== null) {
    return operationFor(region, survey.operation)?.title ?? 'Operation complete.';
  }
  if (survey.deferred === 'support-recovery') return 'Optional operation deferred during support recovery.';
  if (survey.deferred !== null) return `Deferred: ${operationFor(region, survey.deferred)?.title ?? survey.deferred}`;
  return 'Choose one optional operation.';
};

const activityDoneBySharedRule = (region: RegionId, progress: unknown): boolean => {
  if (!isJsonValue(progress)) return false;
  return isActivityComplete(region, progress);
};

const applySupport = (state: MissionState, region: RegionId): MissionState => {
  const survey = state.surveys[region];
  const supportBaseId = survey.supportBaseId;
  const base = state.bases[supportBaseId];
  const reportsReady = reportCount(state) === REGION_IDS.length;
  const stage = reportsReady ? 'readiness' : !survey.paid ? 'essential' : 'optional';
  const supportId = `support:${region}:${supportBaseId}:${stage}`;
  if (state.supportIds.includes(supportId)) return state;

  const committed = reportsReady ? GO_FLOOR : protectedStockFor(state, supportBaseId);
  const needed: Stock = {
    energy: Math.max(0, committed.energy - base.stock.energy),
    meals: Math.max(0, committed.meals - base.stock.meals),
    water: Math.max(0, committed.water - base.stock.water),
    air: Math.max(0, committed.air - base.stock.air),
  };
  if (needed.energy === 0 && needed.meals === 0 && needed.water === 0 && needed.air === 0) return state;
  const stock = safeAddStock(base.stock, needed);
  if (stock === null) return state;
  const nextBase = { ...base, stock };
  const qualifiesForReport = survey.activityDone && survey.observations.length >= 2 && survey.operation === null;
  const nextSurvey = qualifiesForReport ? { ...survey, deferred: 'support-recovery' } : survey;
  let next = withBase(state, supportBaseId, nextBase);
  next = withSurvey(next, region, nextSurvey);
  return changed(next, {
    supportIds: [...state.supportIds, supportId],
    transactions: [...state.transactions, supportId],
    message: 'Support restored the exact deficit. Your evidence is safe.',
  });
};

export const missionReducer = (state: MissionState, event: MissionEvent): MissionState => {
  if (!isRecord(event) || typeof event.type !== 'string') return state;

  switch (event.type) {
    case 'START': {
      if (state.started || !isRegionId(event.region)) return state;
      const region = regionById(event.region);
      const base = state.bases[event.region];
      const next = withBase(state, event.region, { ...base, unlocked: true });
      return changed(next, {
        started: true,
        startRegion: event.region,
        leo: baseApronPose(event.region),
        message: `Mission started at ${region.name}.`,
      });
    }
    case 'MOVE': {
      if (!state.started || !isRecord(event.pose) || !validPose(event.pose)) return state;
      if (event.actor === 'leo') {
        if (state.activeRover !== null) return state;
        return changed(state, { leo: copyPose(event.pose), message: `Leo moved to ${currentRegion(event.pose)}.` });
      }
      if (!isRegionId(event.actor) || state.activeRover !== event.actor) return state;
      return changed(state, {
        rovers: { ...state.rovers, [event.actor]: copyPose(event.pose) },
        message: `${event.actor} rover moved.`,
      });
    }
    case 'UNLOCK': {
      if (!state.started || !isRegionId(event.region) || state.bases[event.region].unlocked) return state;
      if (state.activeRover !== null || currentRegion(state.leo) !== event.region || baseDistance(state, event.region) > BASE_ACTIVATION_DISTANCE) return state;
      return changed(state, {
        bases: { ...state.bases, [event.region]: { ...state.bases[event.region], unlocked: true } },
        message: `${regionById(event.region).name} base activated.`,
      });
    }
    case 'OBSERVE': {
      if (!state.started || !isRegionId(event.region) || typeof event.id !== 'string' || !canInteractAtRegion(state, event.region)) return state;
      const target = observationById(event.region, event.id);
      if (target === undefined || !isNear(currentActorPose(state), target.position, OBSERVATION_DISTANCE)) return state;
      const survey = state.surveys[event.region];
      if (survey.observations.includes(event.id)) return state;
      const nextSurvey = { ...survey, observations: pushUnique(survey.observations, event.id) };
      return changed(withSurvey(state, event.region, nextSurvey), {
        message: `Observation saved: ${target.title}.`,
      });
    }
    case 'BRANCH': {
      if (!state.started || !isRegionId(event.region) || typeof event.id !== 'string' || !canInteractAtRegion(state, event.region)) return state;
      const target = branchById(event.region, event.id);
      if (target === undefined || !isNear(currentActorPose(state), target.position, BRANCH_DISTANCE)) return state;
      const survey = state.surveys[event.region];
      if (survey.branches.includes(event.id)) return state;
      const branches = pushUnique(survey.branches, event.id);
      const assist = survey.observations.length >= 3 && branches.length >= 2;
      return changed(withSurvey(state, event.region, { ...survey, branches, assist }), {
        message: assist ? 'Exploration assist unlocked for this activity.' : `Branch saved: ${target.title}.`,
      });
    }
    case 'ENTER_ROVER': {
      if (!state.started || !isRegionId(event.region) || state.activeRover !== null || !canInteractAtRegion(state, event.region)) return state;
      return changed(state, {
        activeRover: event.region,
        leoReturnPose: copyPose(state.leo),
        message: `${event.region} rover control active.`,
      });
    }
    case 'EXIT_ROVER': {
      if (state.activeRover === null || state.leoReturnPose === null) return state;
      return changed(state, {
        leo: copyPose(state.leoReturnPose),
        activeRover: null,
        leoReturnPose: null,
        message: 'Leo returned to the exact saved pose.',
      });
    }
    case 'TRAVEL': {
      if (!state.started || !isRegionId(event.region) || state.activeRover !== null || !state.bases[event.region].unlocked) return state;
      return changed(state, {
        leo: baseApronPose(event.region),
        message: `Fast travel complete. ${regionById(event.region).name} stock and evidence were preserved.`,
      });
    }
    case 'PAY_SURVEY': {
      if (!state.started || !isRegionId(event.region)) return state;
      const survey = state.surveys[event.region];
      if (survey.paid || survey.observations.length < 2) return state;
      const supportBaseId = currentSupportBase(state, event.region);
      const base = state.bases[supportBaseId];
      const transactionId = `survey:${event.region}:essential`;
      if (transactionSeen(state, transactionId) || !stockCanPay(base.stock, ESSENTIAL_COST)) return state;
      const nextBase = { ...base, stock: subtractStock(base.stock, ESSENTIAL_COST) };
      const next = withBase(state, supportBaseId, nextBase);
      return changed(withSurvey(next, event.region, { ...survey, paid: true }), {
        transactions: [...state.transactions, transactionId],
        message: `Essential survey package paid from ${supportBaseId}: 2 EU, 1 meal, 1 water, 1 air.`,
      });
    }
    case 'ACTIVITY_PROGRESS': {
      if (!isRegionId(event.region) || !state.surveys[event.region].paid || !isJsonValue(event.progress)) return state;
      const survey = state.surveys[event.region];
      return changed(withSurvey(state, event.region, { ...survey, activityProgress: cloneJson(event.progress) }), {
        message: 'Activity progress saved.',
      });
    }
    case 'ACTIVITY_COMPLETE': {
      if (!isRegionId(event.region) || !canStartActivity(state, event.region)) return state;
      const survey = state.surveys[event.region];
      if (!activityDoneBySharedRule(event.region, survey.activityProgress)) return state;
      return changed(withSurvey(state, event.region, { ...survey, activityDone: true }), {
        message: 'Activity solved. Choose one optional operation.',
      });
    }
    case 'CHOOSE_OPERATION': {
      if (!isRegionId(event.region) || typeof event.operationId !== 'string') return state;
      const survey = state.surveys[event.region];
      if (!survey.paid || !survey.activityDone || survey.operation !== null || survey.deferred === 'support-recovery') return state;
      const operation = operationFor(event.region, event.operationId);
      if (operation === undefined) return state;
      const supportBaseId = currentSupportBase(state, event.region);
      const base = state.bases[supportBaseId];
      const chargeId = `operation:${event.region}:${operation.id}`;
      const outputId = `operation-output:${event.region}:${operation.id}`;
      if (transactionSeen(state, chargeId) || transactionSeen(state, outputId) || !stockCanPay(base.stock, { energy: 2, meals: 0, water: 0, air: 0 })) return state;
      let nextStock = subtractStock(base.stock, { energy: 2, meals: 0, water: 0, air: 0 });
      if (operation.id === 'dust-clean-panels') nextStock = addStock(nextStock, { energy: 2, meals: 0, water: 0, air: 0 });
      if (operation.id === 'dust-water-treatment' || operation.id === 'ice-water-treatment') nextStock = addStock(nextStock, { energy: 0, meals: 0, water: 2, air: 0 });
      const nextBase = { ...base, stock: nextStock, operation: operation.id };
      const alternate = regionById(event.region).operations.find((candidate) => candidate.id !== operation.id)?.id ?? null;
      let next = withBase(state, supportBaseId, nextBase);
      next = withSurvey(next, event.region, { ...survey, operation: operation.id, deferred: alternate });
      return changed(next, {
        transactions: [...state.transactions, chargeId, outputId],
        message: `${operation.title} complete. ${operation.benefit}`,
      });
    }
    case 'COMPLETE_REPORT': {
      if (!isRegionId(event.region)) return state;
      const survey = state.surveys[event.region];
      if (state.bases[event.region].report || survey.observations.length < 2 || !survey.activityDone) return state;
      const supportLogged = state.supportIds.some((id) => id.startsWith(`support:${event.region}:`));
      if (survey.operation === null && !supportLogged) return state;
      return changed(withBase(state, event.region, { ...state.bases[event.region], report: true }), {
        message: `${regionById(event.region).name} report complete.`,
      });
    }
    case 'BASE_CHECK': {
      if (!isRegionId(event.region) || (event.check !== 'airheat' && event.check !== 'shelter' && event.check !== 'comms')) return state;
      const base = state.bases[event.region];
      if (!state.started || state.activeRover !== null || !base.unlocked || base.checks[event.check] || currentRegion(state.leo) !== event.region || baseDistance(state, event.region) > BASE_ACTIVATION_DISTANCE) return state;
      return changed(withBase(state, event.region, { ...base, checks: { ...base.checks, [event.check]: true } }), {
        message: `${event.check} base check complete.`,
      });
    }
    case 'SUPPORT': {
      if (!isRegionId(event.region) || !state.started || !state.bases[event.region].unlocked) return state;
      return applySupport(state, event.region);
    }
    case 'TRANSFER': {
      if (!isRegionId(event.from) || !isRegionId(event.to) || event.from === event.to || typeof event.id !== 'string' || event.id.length === 0 || event.id.length > 160 || transactionSeen(state, event.id) || !isStock(event.stock) || !Object.values(event.stock).some((amount) => amount > 0)) return state;
      const source = state.bases[event.from];
      const destination = state.bases[event.to];
      const reserve = protectedStockFor(state, event.from);
      if (!state.started || !source.unlocked || !destination.unlocked || !isStock(safeAddStock(reserve, event.stock)) || !stockAtLeast(source.stock, safeAddStock(reserve, event.stock)!)) return state;
      const nextSource = { ...source, stock: subtractStock(source.stock, event.stock) };
      const destinationStock = safeAddStock(destination.stock, event.stock);
      if (destinationStock === null) return state;
      const nextDestination = { ...destination, stock: destinationStock };
      let next = withBase(state, event.from, nextSource);
      next = withBase(next, event.to, nextDestination);
      return changed(next, {
        transactions: [...state.transactions, event.id],
        message: `Transfer ${event.id} completed without hidden fees.`,
      });
    }
    case 'RESEARCH': {
      if (reportCount(state) < REGION_IDS.length || typeof event.goal !== 'string' || !isResearchGoal(event.goal)) return state;
      return changed(state, { researchGoal: event.goal, message: `Research goal selected: ${event.goal}.` });
    }
    case 'ARRIVAL_BASE': {
      if (reportCount(state) < REGION_IDS.length || !isRegionId(event.region) || !state.bases[event.region].unlocked) return state;
      return changed(state, { arrivalBase: event.region, arrival: 'none', message: `${regionById(event.region).name} selected for Ares-1 arrival.` });
    }
    case 'SEND_PROPOSAL': {
      if (reportCount(state) < REGION_IDS.length || state.researchGoal === null || state.arrivalBase === null || state.arrival === 'arrived' || state.arrival === 'departed') return state;
      return changed(state, { arrival: 'sent', message: 'Proposal sent to Mira. Awaiting the labeled response.' });
    }
    case 'RECEIVE_RESPONSE': {
      if (!isSafeNonNegativeInteger(event.revision) || state.arrival !== 'sent' || event.revision !== state.saveRevision || state.arrivalBase === null) return state;
      const result = readiness(state, state.arrivalBase);
      return changed(state, {
        arrival: result.go ? 'approved' : 'sent',
        message: result.go ? 'Mira approved the proposal. The base is GO.' : `Mira returned HOLD: ${result.missing.join(', ')}.`,
      });
    }
    case 'ARRIVE': {
      if (state.arrival !== 'approved' || state.arrivalBase === null || !readiness(state, state.arrivalBase).go) return state;
      return changed(state, { arrival: 'arrived', message: 'Ares-1 has arrived. Exploration remains open.' });
    }
    case 'DEPART': {
      if (state.arrival !== 'arrived') return state;
      return changed(state, { arrival: 'departed', message: 'Ares-1 departed later. Leo remains free to explore and practice.' });
    }
    case 'INTRO_DONE':
      return state.introSeen ? state : changed(state, { introSeen: true, message: 'Mission controls ready.' });
    case 'SETTING':
      if (!SETTING_KEYS.includes(event.key) || !isMissionSettingValue(event.key, event.value)) return state;
      return changed(state, { settings: { ...state.settings, [event.key]: event.value } });
    default:
      return state;
  }
};

export const validateMission = (value: unknown): MissionState | null => {
  if (!isRecord(value)) return null;
  return normalizeMission(value);
};

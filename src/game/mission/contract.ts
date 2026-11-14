export type RegionId = 'impact' | 'dust' | 'volcano' | 'ice' | 'lake';

export type Pose = {
  x: number;
  z: number;
  heading: number;
};

export type Stock = {
  energy: number;
  meals: number;
  water: number;
  air: number;
};

export type BaseChecks = {
  airheat: boolean;
  shelter: boolean;
  comms: boolean;
};

export type RegionDefinition = {
  id: RegionId;
  name: string;
  subtitle: string;
  question: string;
  center: [number, number];
  color: string;
  observations: Array<{
    id: string;
    title: string;
    clue: string;
    position: [number, number];
    tool: string;
  }>;
  branches: Array<{
    id: string;
    title: string;
    clue: string;
    position: [number, number];
  }>;
  operations: Array<{
    id: string;
    title: string;
    benefit: string;
    deferred: string;
  }>;
  sourceIds: string[];
};

export type BaseState = {
  unlocked: boolean;
  stock: Stock;
  checks: BaseChecks;
  operation: string | null;
  report: boolean;
};

export type SurveyState = {
  observations: string[];
  branches: string[];
  paid: boolean;
  supportBaseId: RegionId;
  activityDone: boolean;
  activityProgress: unknown;
  assist: boolean;
  operation: string | null;
  deferred: string | null;
};

export type MissionSettings = {
  reducedMotion: boolean;
  muted: boolean;
  largeText: boolean;
  quality: 'low' | 'high';
};

export type ArrivalStatus = 'none' | 'sent' | 'approved' | 'arrived' | 'departed';

export type MissionState = {
  schemaVersion: 2;
  campaignId: 'five-frontiers';
  contentVersion: string;
  rulesVersion: string;
  packHash: string;
  saveRevision: number;
  started: boolean;
  startRegion: RegionId;
  leo: Pose;
  rovers: Record<RegionId, Pose>;
  activeRover: RegionId | null;
  leoReturnPose: Pose | null;
  bases: Record<RegionId, BaseState>;
  surveys: Record<RegionId, SurveyState>;
  transactions: string[];
  supportIds: string[];
  researchGoal: string | null;
  arrivalBase: RegionId | null;
  arrival: ArrivalStatus;
  introSeen: boolean;
  settings: MissionSettings;
  message: string;
};

export type MissionEvent =
  | { type: 'START'; region: RegionId }
  | { type: 'MOVE'; actor: 'leo' | RegionId; pose: Pose }
  | { type: 'UNLOCK'; region: RegionId }
  | { type: 'OBSERVE'; region: RegionId; id: string }
  | { type: 'BRANCH'; region: RegionId; id: string }
  | { type: 'ENTER_ROVER'; region: RegionId }
  | { type: 'EXIT_ROVER' }
  | { type: 'TRAVEL'; region: RegionId }
  | { type: 'PAY_SURVEY'; region: RegionId }
  | { type: 'ACTIVITY_PROGRESS'; region: RegionId; progress: unknown }
  | { type: 'ACTIVITY_COMPLETE'; region: RegionId }
  | { type: 'CHOOSE_OPERATION'; region: RegionId; operationId: string }
  | { type: 'COMPLETE_REPORT'; region: RegionId }
  | { type: 'BASE_CHECK'; region: RegionId; check: keyof BaseChecks }
  | { type: 'SUPPORT'; region: RegionId }
  | { type: 'TRANSFER'; from: RegionId; to: RegionId; stock: Stock; id: string }
  | { type: 'RESEARCH'; goal: string }
  | { type: 'ARRIVAL_BASE'; region: RegionId }
  | { type: 'SEND_PROPOSAL' }
  | { type: 'RECEIVE_RESPONSE'; revision: number }
  | { type: 'ARRIVE' }
  | { type: 'DEPART' }
  | { type: 'INTRO_DONE' }
  | {
      type: 'SETTING';
      key: keyof MissionSettings;
      value: boolean | 'low' | 'high';
    };

export const CONTENT_VERSION = '2.0.0';
export const RULES_VERSION = '2.0.0';
export const PACK_HASH = 'ares-cradle-pack-v2';
export const MISSION_SCHEMA_VERSION = 2;
export const MISSION_CAMPAIGN_ID = 'five-frontiers';
export const MISSION_STORAGE_KEY = 'ares-cradle-mission-v2';
export const BASE_ACTIVATION_DISTANCE = 28;
export const WORLD_LIMIT = 300;
export const GO_FLOOR: Stock = { energy: 8, meals: 3, water: 3, air: 3 };
export const ESSENTIAL_COST: Stock = { energy: 2, meals: 1, water: 1, air: 1 };
export const OPERATION_COST_EU = 2;

export const RESEARCH_GOALS = [
  'geologic-history',
  'water-and-operations',
  'ancient-environment',
] as const;

export type ResearchGoal = (typeof RESEARCH_GOALS)[number];

export const isRegionId = (value: unknown): value is RegionId =>
  value === 'impact' || value === 'dust' || value === 'volcano' || value === 'ice' || value === 'lake';

export const isPose = (value: unknown): value is Pose => {
  if (!isRecord(value)) return false;
  return isFiniteNumber(value.x) && isFiniteNumber(value.z) && isFiniteNumber(value.heading);
};

export const isStock = (value: unknown): value is Stock => {
  if (!isRecord(value)) return false;
  return (
    isSafeNonNegativeInteger(value.energy) &&
    isSafeNonNegativeInteger(value.meals) &&
    isSafeNonNegativeInteger(value.water) &&
    isSafeNonNegativeInteger(value.air)
  );
};

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const isSafeNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const copyPose = (pose: Pose): Pose => ({ ...pose });
export const copyStock = (stock: Stock): Stock => ({ ...stock });

export const stockAtLeast = (stock: Stock, floor: Stock): boolean =>
  stock.energy >= floor.energy &&
  stock.meals >= floor.meals &&
  stock.water >= floor.water &&
  stock.air >= floor.air;

export const stockCanPay = (stock: Stock, cost: Stock): boolean =>
  stock.energy >= cost.energy &&
  stock.meals >= cost.meals &&
  stock.water >= cost.water &&
  stock.air >= cost.air;

export const subtractStock = (stock: Stock, cost: Stock): Stock => ({
  energy: stock.energy - cost.energy,
  meals: stock.meals - cost.meals,
  water: stock.water - cost.water,
  air: stock.air - cost.air,
});

export const addStock = (stock: Stock, amount: Stock): Stock => ({
  energy: stock.energy + amount.energy,
  meals: stock.meals + amount.meals,
  water: stock.water + amount.water,
  air: stock.air + amount.air,
});

export const poseWithinWorld = (pose: Pose): boolean =>
  isPose(pose) &&
  Math.abs(pose.x) <= WORLD_LIMIT &&
  Math.abs(pose.z) <= WORLD_LIMIT &&
  Math.abs(pose.heading) <= Number.MAX_SAFE_INTEGER;

export const isResearchGoal = (value: string): value is ResearchGoal =>
  (RESEARCH_GOALS as readonly string[]).includes(value);

export const isMissionSettingValue = (
  key: keyof MissionSettings,
  value: unknown,
): value is boolean | 'low' | 'high' => {
  if (key === 'quality') return value === 'low' || value === 'high';
  return typeof value === 'boolean';
};

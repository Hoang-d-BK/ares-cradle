import bundledPack from '../../../public/mission-data/pack-v2.json';
import type { RegionDefinition, RegionId } from './contract';

export type MissionSource = {
  id: string;
  title: string;
  url: string;
  note: string;
};

type PackRegion = RegionDefinition & { tool: string };
type MissionPack = {
  schemaVersion: 2;
  campaignId: 'five-frontiers';
  contentVersion: '2.0.0';
  rulesVersion: '2.0.0';
  packHash: 'ares-cradle-pack-v2';
  language: 'en';
  balance: {
    worldSize: [600, 600];
    baseStock: { energy: 12; meals: 4; water: 5; air: 4 };
    essentialCost: { energy: 2; meals: 1; water: 1; air: 1 };
    optionalOperationEnergy: 2;
    goFloor: { energy: 8; meals: 3; water: 3; air: 3 };
    requiredReports: 5;
    requiredBaseChecks: ['airheat', 'shelter', 'comms'];
  };
  regions: PackRegion[];
  sources: MissionSource[];
  researchGoals: Array<{ id: string; title: string; summary: string }>;
  dialogue: { intro: string[]; support: string; hold: string; go: string; arrival: string };
};
type ValidationResult = { pack?: MissionPack; error?: string };

const REGION_IDS: readonly RegionId[] = ['impact', 'dust', 'volcano', 'ice', 'lake'];
const bundledData: unknown = bundledPack;
const sourceIds = new Set([
  'nasa-insight-impacts', 'nasa-martian-dust', 'nasa-lava-flow', 'nasa-glacial-ice',
  'nasa-dry-ice', 'nasa-iss-water-recovery', 'nasa-potential-biosignature',
  'nasa-mars-rock-samples', 'nasa-space-communications',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 1000 && !/[<>\u0000-\u001f]/.test(value);
const isPair = (value: unknown): value is [number, number] =>
  Array.isArray(value) && value.length === 2 && value.every((part) => typeof part === 'number' && Number.isFinite(part));
const hasKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  keys.every((key) => hasOwn(value, key)) && Object.keys(value).every((key) => keys.includes(key));
const validIdList = (value: unknown, allowed: ReadonlySet<string>) =>
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && allowed.has(item)) && new Set(value).size === value.length;
const sameStrings = (actual: unknown, expected: readonly string[]) =>
  Array.isArray(actual) && actual.length === expected.length && actual.every((item, index) => item === expected[index]);

const validatePack = (value: unknown): ValidationResult => {
  if (!isRecord(value)) return { error: 'pack root must be an object' };
  if (value.schemaVersion !== 2 || value.campaignId !== 'five-frontiers' || value.contentVersion !== '2.0.0' || value.rulesVersion !== '2.0.0' || value.language !== 'en') {
    return { error: 'unsupported schema, campaign, language, or content/rules version' };
  }
  if (value.packHash !== 'ares-cradle-pack-v2') return { error: 'packHash label is incompatible' };
  if (!hasKeys(value, ['schemaVersion', 'campaignId', 'contentVersion', 'rulesVersion', 'packHash', 'language', 'balance', 'regions', 'sources', 'researchGoals', 'dialogue'])) {
    return { error: 'unexpected or missing pack fields' };
  }
  if (!Array.isArray(value.researchGoals) || value.researchGoals.length !== 3 || value.researchGoals.some((goal) => !isRecord(goal) || !hasKeys(goal, ['id', 'title', 'summary']) || !isText(goal.id) || !isText(goal.title) || !isText(goal.summary)) ||
      !isRecord(value.dialogue) || !hasKeys(value.dialogue, ['intro', 'support', 'hold', 'go', 'arrival']) || !Array.isArray(value.dialogue.intro) || value.dialogue.intro.length !== 3 ||
      !value.dialogue.intro.every(isText) || !isText(value.dialogue.support) || !isText(value.dialogue.hold) || !isText(value.dialogue.go) || !isText(value.dialogue.arrival)) return { error: 'campaign metadata is malformed' };
  const balance = value.balance;
  if (!isRecord(balance) || !hasKeys(balance, ['worldSize', 'baseStock', 'essentialCost', 'optionalOperationEnergy', 'goFloor', 'requiredReports', 'requiredBaseChecks'])) {
    return { error: 'balance fields are malformed' };
  }
  const sameNumbers = (actual: unknown, expected: readonly number[]) =>
    Array.isArray(actual) && actual.length === expected.length && actual.every((item, index) => item === expected[index]);
  const sameStock = (actual: unknown, expected: Record<string, number>) =>
    isRecord(actual) && Object.keys(actual).length === Object.keys(expected).length && Object.entries(expected).every(([key, amount]) => actual[key] === amount);
  if (!sameNumbers(balance.worldSize, [600, 600]) ||
      !sameStock(balance.baseStock, { energy: 12, meals: 4, water: 5, air: 4 }) ||
      !sameStock(balance.essentialCost, { energy: 2, meals: 1, water: 1, air: 1 }) ||
      balance.optionalOperationEnergy !== 2 ||
      !sameStock(balance.goFloor, { energy: 8, meals: 3, water: 3, air: 3 }) ||
      balance.requiredReports !== 5 ||
      !sameStrings(balance.requiredBaseChecks, ['airheat', 'shelter', 'comms'])) {
    return { error: 'mission balance contract does not match save/gameplay rules' };
  }
  if (!Array.isArray(value.regions) || value.regions.length !== REGION_IDS.length) return { error: 'exactly five regions are required' };
  if (!Array.isArray(value.sources) || value.sources.length !== sourceIds.size) return { error: 'source catalog is incomplete' };
  const sources = value.sources;
  const seenSources = new Set<string>();
  const expectedSources = isRecord(bundledData) && Array.isArray(bundledData.sources) ? bundledData.sources : [];
  for (const source of sources) {
    const expected = expectedSources.find((item) => isRecord(item) && item.id === source?.id);
    if (!isRecord(source) || !isRecord(expected) || !hasKeys(source, ['id', 'title', 'url', 'note']) ||
        !isText(source.id) || !isText(source.title) || !isText(source.note) ||
        typeof source.url !== 'string' || !/^https:\/\//.test(source.url) || source.url !== expected.url || source.title !== expected.title || source.note !== expected.note ||
        !sourceIds.has(source.id) || seenSources.has(source.id)) {
      return { error: 'source catalog entry is invalid' };
    }
    seenSources.add(source.id);
  }
  const seenRegions = new Set<string>();
  for (const region of value.regions) {
    if (!isRecord(region) || !hasKeys(region, ['id', 'name', 'subtitle', 'question', 'center', 'color', 'tool', 'observations', 'branches', 'operations', 'sourceIds'])) {
      return { error: 'region shape is malformed' };
    }
    if (typeof region.id !== 'string' || !REGION_IDS.includes(region.id as RegionId) || seenRegions.has(region.id)) return { error: 'unknown or duplicate region id' };
    const reference = isRecord(bundledData) && Array.isArray(bundledData.regions)
      ? bundledData.regions.find((item) => isRecord(item) && item.id === region.id)
      : undefined;
    if (!isRecord(reference) || !sameNumbers(region.center, reference.center as number[]) || !isText(region.name) || region.name !== reference.name ||
        region.subtitle !== reference.subtitle || region.question !== reference.question || region.color !== reference.color || region.tool !== reference.tool) return { error: 'region identity, metadata, or coordinates changed' };
    seenRegions.add(region.id);
    if (!isText(region.name) || !isText(region.subtitle) || !isText(region.question) || !isText(region.tool) ||
        typeof region.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(region.color) || !isPair(region.center)) return { error: 'region metadata is invalid' };
    if (!Array.isArray(region.observations) || region.observations.length !== 3 ||
        !Array.isArray(region.branches) || region.branches.length !== 2 ||
        !Array.isArray(region.operations) || region.operations.length !== 2) return { error: 'region content counts are incompatible' };
    const referenceObservations = reference.observations;
    const referenceBranches = reference.branches;
    const referenceOperations = reference.operations;
    if (!Array.isArray(referenceObservations) || !Array.isArray(referenceBranches) || !Array.isArray(referenceOperations)) return { error: 'bundled content reference is invalid' };
    for (const [index, observation] of region.observations.entries()) {
      const expected = referenceObservations[index];
      if (!isRecord(observation) || !isRecord(expected) || !hasKeys(observation, ['id', 'title', 'clue', 'position', 'tool']) ||
          !isText(observation.id) || observation.id !== expected.id || !isText(observation.title) || observation.title !== expected.title || !isText(observation.clue) || !isText(observation.tool) || observation.tool !== expected.tool ||
          !sameNumbers(observation.position, expected.position as number[])) return { error: 'observation entry is invalid or incompatible' };
    }
    for (const [index, branch] of region.branches.entries()) {
      const expected = referenceBranches[index];
      if (!isRecord(branch) || !isRecord(expected) || !hasKeys(branch, ['id', 'title', 'clue', 'position']) ||
          !isText(branch.id) || branch.id !== expected.id || !isText(branch.title) || branch.title !== expected.title || !isText(branch.clue) ||
          !sameNumbers(branch.position, expected.position as number[])) return { error: 'branch entry is invalid or incompatible' };
    }
    for (const [index, operation] of region.operations.entries()) {
      const expected = referenceOperations[index];
      if (!isRecord(operation) || !isRecord(expected) || !hasKeys(operation, ['id', 'title', 'benefit', 'deferred']) ||
          !isText(operation.id) || operation.id !== expected.id || !isText(operation.title) || operation.title !== expected.title || !isText(operation.benefit) || !isText(operation.deferred)) return { error: 'operation entry is invalid or incompatible' };
    }
    if (!validIdList(region.sourceIds, sourceIds) || !isRecord(reference) || !sameStrings(region.sourceIds, reference.sourceIds as string[])) return { error: 'region source references are invalid' };
  }
  if (REGION_IDS.some((id) => !seenRegions.has(id))) return { error: 'a required region is missing' };
  return { pack: value as unknown as MissionPack };
};

const initial = validatePack(bundledData);
if (!initial.pack) throw new Error(`Bundled mission pack is invalid: ${initial.error ?? 'unknown validation error'}`);

const initialPack = initial.pack;
const toRegionDefinitions = (pack: MissionPack): RegionDefinition[] => pack.regions.map((region) => ({
  ...region,
  center: [...region.center] as [number, number],
  observations: region.observations.map((item) => ({ ...item, position: [...item.position] as [number, number] })),
  branches: region.branches.map((item) => ({ ...item, position: [...item.position] as [number, number] })),
  operations: region.operations.map((item) => ({ ...item })),
  sourceIds: [...region.sourceIds],
}));

export let REGIONS: RegionDefinition[] = toRegionDefinitions(initialPack);
export let SOURCES: readonly MissionSource[] = initialPack.sources.map((source) => ({ ...source }));

export type PrepareMissionContentResult = { source: 'local' | 'bundled'; warning?: string };
let preparation: Promise<PrepareMissionContentResult> | undefined;

const loadLocalPack = async (): Promise<unknown> => {
  if (typeof fetch !== 'function' || typeof AbortController !== 'function') throw new Error('fetch or AbortController is unavailable');
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('local pack request timed out after 2500ms'));
    }, 2500);
  });
  try {
    const request = fetch('/mission-data/pack-v2.json', { signal: controller.signal });
    const response = await Promise.race([request, timeout]);
    if (!response.ok) throw new Error(`local pack request failed (${response.status})`);
    return await Promise.race([response.json() as Promise<unknown>, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

export const prepareMissionContent = (): Promise<PrepareMissionContentResult> => {
  if (preparation) return preparation;
  preparation = (async () => {
    try {
      const result = validatePack(await loadLocalPack());
      if (!result.pack) return { source: 'bundled', warning: `Using bundled mission content: ${result.error ?? 'local pack is invalid'}.` };
      REGIONS = toRegionDefinitions(result.pack);
      SOURCES = result.pack.sources.map((source) => ({ ...source }));
      return { source: 'local' };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'local pack could not be loaded';
      return { source: 'bundled', warning: `Using bundled mission content: ${reason}.` };
    }
  })();
  return preparation;
};

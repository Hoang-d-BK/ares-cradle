import { create } from 'zustand';
import {
  isRecord,
  MISSION_SCHEMA_VERSION,
  MISSION_STORAGE_KEY,
  MissionEvent,
  MissionState,
} from './contract';
import { initialMission, missionReducer, validateMission } from './state';

const BACKUP_MEMORY_LIMIT = 2_000_000;
const PRESERVED_STORAGE_KEY = `${MISSION_STORAGE_KEY}:preserved`;

let persistenceBlocked = false;

export type MissionStore = {
  state: MissionState;
  dispatch: (event: MissionEvent) => void;
  storageError: string | null;
  loadWarning: string | null;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

let preservedRawSave: string | null = null;

const getStorage = (): StorageLike | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const snapshot = (state: MissionState): string => {
  const encoded = JSON.stringify(state);
  if (typeof encoded !== 'string' || encoded.length > BACKUP_MEMORY_LIMIT) {
    throw new Error('Mission save is too large.');
  }
  return encoded;
};

const initialLoad = (): Pick<MissionStore, 'state' | 'loadWarning' | 'storageError'> => {
  const state = initialMission();
  const storage = getStorage();
  if (storage === null) {
    return { state, loadWarning: null, storageError: null };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(MISSION_STORAGE_KEY);
  } catch (error) {
    return {
      state,
      loadWarning: 'Saved mission could not be read. A new mission is ready; the existing save was not changed.',
      storageError: error instanceof Error ? error.message : 'Mission storage read failed.',
    };
  }
  if (raw === null) {
    try {
      const preserved = storage.getItem(PRESERVED_STORAGE_KEY);
      if (preserved !== null) {
        preservedRawSave = preserved;
        persistenceBlocked = true;
        return {
          state,
          loadWarning: 'A preserved mission save is available but not auto-restored; explicit recovery is required.',
          storageError: null,
        };
      }
    } catch {
      return { state, loadWarning: 'Mission storage could not be inspected; progress can continue in memory.', storageError: null };
    }
    return { state, loadWarning: null, storageError: null };
  }

  preservedRawSave = raw;
  try {
    if (storage.getItem(PRESERVED_STORAGE_KEY) === null) storage.setItem(PRESERVED_STORAGE_KEY, raw);
  } catch {
    // A blocked backup must not make the original save writable.
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    persistenceBlocked = true;
    return {
      state,
      loadWarning: 'Saved mission is corrupt. The original bytes were preserved and were not overwritten.',
      storageError: null,
    };
  }

  if (isRecord(parsed) && typeof parsed.schemaVersion === 'number' && parsed.schemaVersion > MISSION_SCHEMA_VERSION) {
    persistenceBlocked = true;
    return {
      state,
      loadWarning: `Saved mission uses schema ${parsed.schemaVersion}. This build uses schema ${MISSION_SCHEMA_VERSION}; the original save was preserved.`,
      storageError: null,
    };
  }

  const validated = validateMission(parsed);
  if (validated === null) {
    persistenceBlocked = true;
    return {
      state,
      loadWarning: 'Saved mission failed validation. The original bytes were preserved and were not overwritten.',
      storageError: null,
    };
  }
  return { state: validated, loadWarning: null, storageError: null };
};

export const getPreservedMissionSave = (): string | null => preservedRawSave;

const loaded = initialLoad();

export const useMissionStore = create<MissionStore>((set) => ({
  state: loaded.state,
  storageError: loaded.storageError,
  loadWarning: loaded.loadWarning,
  dispatch: (event) =>
    set((current) => {
      const next = missionReducer(current.state, event);
      if (next === current.state) return current;

      const storage = getStorage();
      if (storage === null) {
        return {
          ...current,
          state: next,
          storageError: 'Mission storage is unavailable; progress continues in memory and is not saved.',
        };
      }

      if (persistenceBlocked) {
        return {
          ...current,
          state: next,
          storageError: 'Mission save is blocked because the original save is corrupt or from a future schema; progress continues in memory.',
        };
      }

      let encoded: string;
      try {
        encoded = snapshot(next);
        storage.setItem(MISSION_STORAGE_KEY, encoded);
      } catch (error) {
        return {
          ...current,
          state: next,
          storageError: `Mission save failed; progress continues in memory and is not saved. ${error instanceof Error ? error.message : 'The last saved mission was kept.'}`,
        };
      }

      preservedRawSave = encoded;
      return { ...current, state: next, storageError: null };
    }),
}));

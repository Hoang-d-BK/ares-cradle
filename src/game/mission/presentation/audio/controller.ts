/** Quiet, short device-feedback sonification; these cues are not Mars/environment audio. */
import type { MissionState } from '../../contract';
import { selectMissionAudio, type MissionAudioCue } from './selector';

export const MISSION_AUDIO_COOLDOWN_MS = 140;
export const MISSION_AUDIO_MAX_VOICES = 3;
const VOICE_SECONDS = 0.09;
const VOICE_PEAK = 0.018;
const MASTER_GAIN = 0.5;
const FREQUENCIES: Record<MissionAudioCue, number> = {
  'leo-step': 220,
  'rover-step': 165,
  observation: 660,
  branch: 520,
  operation: 390,
  report: 780,
};

type AudioEvent = Event & {
  repeat?: boolean;
  key?: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

export interface MissionAudioController {
  update(state: MissionState, paused: boolean): void;
  onGesture(event: AudioEvent): void;
  setFocused(focused: boolean): void;
  setHidden(hidden: boolean): void;
  dispose(): void;
}

export interface MissionAudioOptions {
  createContext?: () => AudioContext;
  now?: () => number;
  initiallyFocused?: boolean;
  initiallyHidden?: boolean;
}

/** Owns only finite one-shot voices and opens audio only from a trusted gesture. */
export function createMissionAudioController(
  initialState: MissionState,
  initiallyPaused: boolean,
  options: MissionAudioOptions = {},
): MissionAudioController {
  const createContext = options.createContext ?? (() => new AudioContext());
  const now = options.now ?? (() => performance.now());
  let state = initialState;
  let paused = initiallyPaused;
  let focused = options.initiallyFocused ?? true;
  let hidden = options.initiallyHidden ?? false;
  let disposed = false;
  let allowed = false;
  let movementRemainder = 0;
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let generation = 0;
  let resumePending = false;
  let lastPlayedAt = Number.NEGATIVE_INFINITY;
  const voices = new Set<OscillatorNode>();

  const canPlay = (): boolean =>
    !disposed && state.started && !state.settings.muted && !paused && focused && !hidden;

  const stopVoices = (): void => {
    for (const oscillator of voices) {
      oscillator.onended = null;
      try { oscillator.stop(); } catch { /* Already ended. */ }
      try { oscillator.disconnect(); } catch { /* Already disconnected. */ }
      const gain = (oscillator as OscillatorNode & { __missionGain?: GainNode }).__missionGain;
      try { gain?.disconnect(); } catch { /* Already disconnected. */ }
    }
    voices.clear();
  };

  const closeContext = (): void => {
    generation++;
    resumePending = false;
    stopVoices();
    const oldContext = context;
    const oldMaster = master;
    context = null;
    master = null;
    if (oldMaster) {
      try {
        oldMaster.gain.cancelScheduledValues(oldContext?.currentTime ?? 0);
        oldMaster.gain.setValueAtTime(0, oldContext?.currentTime ?? 0);
        oldMaster.disconnect();
      } catch { /* Device may already be closed. */ }
    }
    if (oldContext && oldContext.state !== 'closed') {
      try { void oldContext.close().catch(() => {}); } catch { /* Device may be unavailable. */ }
    }
  };

  const silence = (): void => {
    if (master && context && context.state !== 'closed') {
      try {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setValueAtTime(0, context.currentTime);
      } catch { /* Context may be closing. */ }
    }
    closeContext();
  };

  const play = (cue: MissionAudioCue): void => {
    if (!canPlay() || !context || context.state !== 'running' || !master || voices.size >= MISSION_AUDIO_MAX_VOICES) return;
    const at = now();
    if (!Number.isFinite(at) || at - lastPlayedAt < MISSION_AUDIO_COOLDOWN_MS) return;
    let oscillator: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    try {
      oscillator = context.createOscillator();
      gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(FREQUENCIES[cue], context.currentTime);
      gain.gain.setValueAtTime(VOICE_PEAK, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + VOICE_SECONDS * 0.8);
      gain.gain.setValueAtTime(0, context.currentTime + VOICE_SECONDS);
      oscillator.connect(gain);
      gain.connect(master);
      (oscillator as OscillatorNode & { __missionGain?: GainNode }).__missionGain = gain;
      voices.add(oscillator);
      oscillator.onended = () => {
        voices.delete(oscillator!);
        try { oscillator!.disconnect(); } catch { /* Already disconnected. */ }
        try { gain?.disconnect(); } catch { /* Already disconnected. */ }
      };
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + VOICE_SECONDS);
      lastPlayedAt = at;
    } catch {
      if (oscillator) voices.delete(oscillator);
      try { oscillator?.stop(); } catch { /* Not started. */ }
      try { oscillator?.disconnect(); } catch { /* Already disconnected. */ }
      try { gain?.disconnect(); } catch { /* Already disconnected. */ }
    }
  };

  const beginFromGesture = (): void => {
    if (!canPlay() || resumePending) return;
    try {
      if (context?.state === 'running') return;
      if (!context || context.state === 'closed') {
        context = createContext();
        master = context.createGain();
        master.gain.setValueAtTime(0, context.currentTime);
        master.connect(context.destination);
      }
      const current = context;
      const token = ++generation;
      resumePending = true;
      // This call must stay synchronous in the trusted DOM-event stack.
      const resumed = current.resume();
      void resumed.then(() => {
        if (disposed || token !== generation || current !== context) return;
        resumePending = false;
        if (canPlay() && current.state === 'running' && master) {
          master.gain.cancelScheduledValues(current.currentTime);
          master.gain.setValueAtTime(MASTER_GAIN, current.currentTime);
        } else {
          silence();
        }
      }).catch(() => {
        if (current === context && token === generation) silence();
      });
    } catch {
      silence();
    }
  };

  return {
    update(nextState, nextPaused) {
      if (disposed) return;
      const wasAllowed = allowed;
      const previousState = state;
      state = nextState;
      paused = nextPaused;
      allowed = canPlay();
      if (!allowed) {
        movementRemainder = 0;
        silence();
        return;
      }
      if (!wasAllowed) {
        // Establish a fresh baseline after mute/pause/focus changes; never replay queued events.
        movementRemainder = 0;
        return;
      }
      const selection = selectMissionAudio(previousState, nextState, movementRemainder);
      movementRemainder = selection.movementRemainder;
      for (const cue of selection.cues) play(cue);
    },
    onGesture(event) {
      const keyEvent = event as AudioEvent;
      if (!event.isTrusted || keyEvent.repeat || keyEvent.altKey || keyEvent.ctrlKey || keyEvent.metaKey || keyEvent.shiftKey) return;
      if (keyEvent.key === 'Alt' || keyEvent.key === 'Control' || keyEvent.key === 'Meta' || keyEvent.key === 'Shift') return;
      beginFromGesture();
    },
    setFocused(value) {
      if (disposed || focused === value) return;
      focused = value;
      if (!focused) {
        allowed = false;
        movementRemainder = 0;
        silence();
      }
    },
    setHidden(value) {
      if (disposed || hidden === value) return;
      hidden = value;
      if (hidden) {
        allowed = false;
        movementRemainder = 0;
        silence();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      allowed = false;
      movementRemainder = 0;
      silence();
    },
  };
}

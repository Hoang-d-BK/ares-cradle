export type MissionCinematicKind = 'intro' | 'arrival' | 'departure';
export type MissionCinematicPhase =
  | 'approach'
  | 'powered-descent'
  | 'touchdown'
  | 'ramp'
  | 'time-shift'
  | 'ramp-close'
  | 'ascent'
  | 'away';

export const MISSION_CINEMATIC_DURATION: Readonly<Record<MissionCinematicKind, number>> = {
  intro: 40,
  arrival: 28,
  departure: 24,
};

export interface MissionCinematicFrame {
  kind: MissionCinematicKind;
  phase: MissionCinematicPhase;
  elapsedSeconds: number;
  durationSeconds: number;
  progress: number;
  caption: string;
  altitudeGameUnits: number;
  verticalSpeedGameUnitsPerSecond: number;
  horizontalOffset: number;
  thrust: number;
  legsDeployed: number;
  rampOpen: number;
  /** Scenario/game-unit values; these are not real flight telemetry. */
  telemetryLabel: 'SCENARIO · GAME UNITS';
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

function safeElapsed(kind: MissionCinematicKind, elapsedSeconds: number): number {
  const elapsed = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
  return Math.min(MISSION_CINEMATIC_DURATION[kind], Math.max(0, elapsed));
}

function departureProgress(kind: MissionCinematicKind, progress: number) {
  if (kind !== 'departure') return null;
  if (progress < 0.17) return { phase: 'time-shift' as const, local: progress / 0.17 };
  if (progress < 0.4) return { phase: 'ramp-close' as const, local: (progress - 0.17) / 0.23 };
  if (progress < 0.78) return { phase: 'ascent' as const, local: (progress - 0.4) / 0.38 };
  return { phase: 'away' as const, local: (progress - 0.78) / 0.22 };
}

function descentPhase(progress: number) {
  if (progress < 0.24) return { phase: 'approach' as const, local: progress / 0.24 };
  if (progress < 0.55) return { phase: 'powered-descent' as const, local: (progress - 0.24) / 0.31 };
  if (progress < 0.75) return { phase: 'touchdown' as const, local: (progress - 0.55) / 0.2 };
  return { phase: 'ramp' as const, local: (progress - 0.75) / 0.25 };
}

function descentAltitude(progress: number): number {
  const phase = descentPhase(progress);
  if (phase.phase === 'approach') return lerp(9, 5.2, smooth(phase.local));
  if (phase.phase === 'powered-descent') return lerp(5.2, 0.42, smooth(phase.local));
  if (phase.phase === 'touchdown') return lerp(0.42, 0, smooth(phase.local));
  return 0;
}

function departureAltitude(progress: number): number {
  const phase = departureProgress('departure', progress)!;
  if (phase.phase === 'time-shift' || phase.phase === 'ramp-close') return 0;
  if (phase.phase === 'ascent') return lerp(0.35, 10, smooth(phase.local));
  return lerp(10, 20, smooth(phase.local));
}

function captionFor(kind: MissionCinematicKind, phase: MissionCinematicPhase): string {
  if (kind === 'departure') {
    if (phase === 'time-shift') return 'Later — 12 sols after arrival. The crew prepares to leave the surface.';
    if (phase === 'ramp-close') return 'The ramp closes and the cabin is secured for departure.';
    if (phase === 'ascent') return 'Engines ignite. The crew lander rises from Mars.';
    return 'The lander climbs and moves away across the Martian horizon. The journey continues.';
  }
  if (phase === 'approach') return 'A fictional future crew lander slows on approach to the selected base.';
  if (phase === 'powered-descent') return 'Powered descent. Landing legs deploy as the surface draws close.';
  if (phase === 'touchdown') return 'Touchdown. The lander settles on the surface.';
  if (kind === 'intro') return 'Mars air is not safe to breathe. Prepare before field work.';
  return 'The ramp is open. The arriving crew can begin only after parent approval.';
}

/** Pure, bounded, deterministic keyframe and caption source for scene, UI and telemetry. */
export function getMissionCinematicFrame(
  kind: MissionCinematicKind,
  elapsedSeconds: number,
  reducedMotion = false,
): MissionCinematicFrame {
  const durationSeconds = MISSION_CINEMATIC_DURATION[kind];
  const elapsed = safeElapsed(kind, elapsedSeconds);
  const progress = elapsed / durationSeconds;
  const phaseData = departureProgress(kind, progress) ?? descentPhase(progress);
  const { phase, local } = phaseData;
  const eased = smooth(local);
  let altitudeGameUnits: number;
  let horizontalOffset = 0;
  let thrust = 0;
  let legsDeployed = 0;
  let rampOpen = 0;

  if (kind === 'departure') {
    altitudeGameUnits = departureAltitude(progress);
    horizontalOffset = phase === 'away' ? lerp(0, 14, eased) : phase === 'ascent' ? lerp(0, 1.2, eased) : 0;
    thrust = phase === 'ascent' ? lerp(0.35, 1, eased) : phase === 'away' ? lerp(0.75, 0.2, eased) : 0;
    legsDeployed = phase === 'ascent' ? lerp(1, 0.12, eased) : phase === 'away' ? 0.06 : 1;
    rampOpen = phase === 'time-shift' ? 1 : phase === 'ramp-close' ? 1 - eased : 0;
  } else {
    altitudeGameUnits = descentAltitude(progress);
    const descent = descentPhase(progress);
    legsDeployed = descent.phase === 'approach' ? lerp(0.08, 0.2, smooth(descent.local))
      : descent.phase === 'powered-descent' ? lerp(0.2, 1, smooth(descent.local)) : 1;
    rampOpen = descent.phase === 'ramp' ? smooth(descent.local) : 0;
    thrust = descent.phase === 'powered-descent' ? lerp(0.65, 0.9, Math.sin(Math.PI * descent.local))
      : descent.phase === 'touchdown' ? lerp(0.25, 0, smooth(descent.local)) : 0;
  }

  if (reducedMotion) {
    if (kind === 'departure') {
      if (phase === 'time-shift') { altitudeGameUnits = 0; legsDeployed = 1; rampOpen = 1; thrust = 0; horizontalOffset = 0; }
      else if (phase === 'ramp-close') { altitudeGameUnits = 0; legsDeployed = 1; rampOpen = 0; thrust = 0; horizontalOffset = 0; }
      else if (phase === 'ascent') { altitudeGameUnits = 5; legsDeployed = 0.55; rampOpen = 0; thrust = 0.8; horizontalOffset = 0.5; }
      else { altitudeGameUnits = 15; legsDeployed = 0.06; rampOpen = 0; thrust = 0.45; horizontalOffset = 7; }
    } else if (phase === 'approach') {
      altitudeGameUnits = 7; legsDeployed = 0.12; rampOpen = 0; thrust = 0;
    } else if (phase === 'powered-descent') {
      altitudeGameUnits = 2.8; legsDeployed = 0.72; rampOpen = 0; thrust = 0.75;
    } else if (phase === 'touchdown') {
      altitudeGameUnits = 0.2; legsDeployed = 1; rampOpen = 0; thrust = 0;
    } else {
      altitudeGameUnits = 0; legsDeployed = 1; rampOpen = 1; thrust = 0;
    }
  }

  const sample = Math.min(0.05, durationSeconds / 100);
  const before = Math.max(0, elapsed - sample);
  const after = Math.min(durationSeconds, elapsed + sample);
  const altitudeAt = (seconds: number) => {
    const p = seconds / durationSeconds;
    return kind === 'departure' ? departureAltitude(p) : descentAltitude(p);
  };
  const verticalSpeedGameUnitsPerSecond = after === before ? 0 : (altitudeAt(after) - altitudeAt(before)) / (after - before);

  return {
    kind,
    phase,
    elapsedSeconds: elapsed,
    durationSeconds,
    progress,
    caption: captionFor(kind, phase),
    altitudeGameUnits,
    verticalSpeedGameUnitsPerSecond,
    horizontalOffset,
    thrust,
    legsDeployed,
    rampOpen,
    telemetryLabel: 'SCENARIO · GAME UNITS',
  };
}

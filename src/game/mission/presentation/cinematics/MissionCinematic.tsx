import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Euler, Quaternion, Vector3, type Group } from 'three';
import { getMissionCinematicFrame, MISSION_CINEMATIC_DURATION, type MissionCinematicKind } from './timeline';
import './cinematics.css';

export { getMissionCinematicFrame, MISSION_CINEMATIC_DURATION } from './timeline';
export type { MissionCinematicFrame, MissionCinematicKind, MissionCinematicPhase } from './timeline';

export interface MissionCinematicProps {
  kind: MissionCinematicKind;
  baseCenter: [number, number];
  reducedMotion: boolean;
  onComplete: () => void;
}

const BODY = '#B7B7AE';
const GROUND_Y = -0.1;
const RAMP_LENGTH = 1.5;
const RAMP_THICKNESS = 0.12;
const RAMP_OPEN_ANGLE = 0.55;
const RAMP_HINGE_Z = 1.08;
const LEG_FOOT_SIZE: Point3 = [0.48, 0.12, 0.34];
const LEG_DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const ENGINE_CENTER_Y = 0.12;
const ENGINE_HEIGHT = 0.32;
const LOWER_DETAIL_CENTER_Y = 0.13;
const LOWER_DETAIL_HEIGHT = 0.18;
const HULL_LOWEST_Y = Math.min(1.35 - 2.65 / 2, 0.26 - 0.34 / 2, ENGINE_CENTER_Y - ENGINE_HEIGHT / 2, LOWER_DETAIL_CENTER_Y - LOWER_DETAIL_HEIGHT / 2);

type Point3 = [number, number, number];
type Quaternion4 = [number, number, number, number];
type LanderLegPose = { hinge: Point3; foot: Point3; strutCenter: Point3; strutLength: number; strutQuaternion: Quaternion4; footRotationY: number };
const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

function toQuaternion(rotation: Point3 | Quaternion4): Quaternion {
  return rotation.length === 4
    ? new Quaternion(...rotation)
    : new Quaternion().setFromEuler(new Euler(...rotation, 'XYZ'));
}

function transformLocalPoint(local: Point3, origin: Point3, rotation: Point3 | Quaternion4): Point3 {
  return new Vector3(...local).applyQuaternion(toQuaternion(rotation)).add(new Vector3(...origin)).toArray() as Point3;
}

function boxCorners(center: Point3, size: Point3, rotation: Point3 | Quaternion4): Point3[] {
  const quaternion = toQuaternion(rotation), origin = new Vector3(...center);
  return [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) =>
    new Vector3(x * size[0] / 2, y * size[1] / 2, z * size[2] / 2).applyQuaternion(quaternion).add(origin).toArray() as Point3)));
}

/** Local mesh transforms and true box corners; shared by the rendered lander and numeric regression. */
export function getLanderGeometryPose(legsDeployed: number, rampOpen: number) {
  const legs = clamp01(legsDeployed), ramp = clamp01(rampOpen);
  const legPoses: LanderLegPose[] = LEG_DIRECTIONS.map(([dx, dz]) => {
    const hinge: Point3 = [dx * 0.62, 0.22, dz * 0.62];
    const foot: Point3 = [dx * (0.82 + 0.53 * legs), 0.18 - 0.22 * legs, dz * (0.82 + 0.53 * legs)];
    const strutEnd: Point3 = [foot[0], foot[1] + LEG_FOOT_SIZE[1] / 2, foot[2]];
    const delta = new Vector3(strutEnd[0] - hinge[0], strutEnd[1] - hinge[1], strutEnd[2] - hinge[2]);
    const strutLength = delta.length();
    const strutQuaternion = strutLength > 0 && Number.isFinite(strutLength)
      ? new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize())
      : new Quaternion();
    return {
      hinge,
      foot,
      strutCenter: [(hinge[0] + strutEnd[0]) / 2, (hinge[1] + strutEnd[1]) / 2, (hinge[2] + strutEnd[2]) / 2] as Point3,
      strutLength,
      strutQuaternion: strutQuaternion.toArray() as Quaternion4,
      footRotationY: dx === 0 ? Math.PI / 2 : 0,
    };
  });
  // Fixed X-axis hull hinge; the closed panel stands upright and swings toward +Z/down.
  const rampAngleX = Math.PI + (Math.PI - RAMP_OPEN_ANGLE) * ramp;
  const hingeY = GROUND_Y + RAMP_LENGTH * Math.cos(RAMP_OPEN_ANGLE) + RAMP_THICKNESS * 0.5 * Math.sin(RAMP_OPEN_ANGLE);
  const rampHinge: Point3 = [0, hingeY, RAMP_HINGE_Z];
  const rampRotation: Point3 = [rampAngleX, 0, 0];
  const rampCenter = transformLocalPoint([0, -RAMP_LENGTH / 2, 0], rampHinge, rampRotation);
  const rampCorners = boxCorners(rampCenter, [0.82, RAMP_LENGTH, RAMP_THICKNESS], rampRotation);
  const trimCenter = transformLocalPoint([0, -0.58, 0.09], rampHinge, rampRotation);
  const trimCorners = boxCorners(trimCenter, [0.68, 0.82, 0.02], rampRotation);
  const feetCorners = legPoses.flatMap(({ foot, footRotationY }) => boxCorners(foot, LEG_FOOT_SIZE, [0, footRotationY, 0]));
  const strutCorners = legPoses.flatMap(({ strutCenter, strutLength, strutQuaternion }) => boxCorners(strutCenter, [0.13, strutLength, 0.14], strutQuaternion));
  const solidCorners = [...rampCorners, ...trimCorners, ...feetCorners, ...strutCorners];
  const rampTip = transformLocalPoint([0, -RAMP_LENGTH, 0], rampHinge, rampRotation);
  return {
    legs: legPoses, rampAngleX, rampHinge, rampCenter, trimCenter, rampTip,
    rampCorners, trimCorners, feetCorners, strutCorners,
    hullLowestY: HULL_LOWEST_Y,
    solidLowestY: Math.min(HULL_LOWEST_Y, ...solidCorners.map((corner) => corner[1])),
    footBottomY: legPoses.map(({ foot }) => foot[1] - LEG_FOOT_SIZE[1] / 2),
  };
}

function Lander({ kind, elapsed, reducedMotion, baseCenter }: {
  kind: MissionCinematicKind; elapsed: number; reducedMotion: boolean; baseCenter: [number, number];
}) {
  const group = useRef<Group>(null);
  const frame = getMissionCinematicFrame(kind, elapsed, reducedMotion);
  const geometry = getLanderGeometryPose(frame.legsDeployed, frame.rampOpen);
  const thrustMaterial = useMemo(() => ({ color: '#F49A5C', emissive: '#C64E22', emissiveIntensity: 0.7 }), []);
  useFrame(() => {
    if (!group.current) return;
    group.current.position.set(baseCenter[0] + frame.horizontalOffset, frame.altitudeGameUnits, baseCenter[1]);
    group.current.rotation.z = 0;
    group.current.rotation.x = 0;
  });
  const plumeLength = 0.35 + frame.thrust * 1.15;
  return <group ref={group}>
    {/* Clearly fictional, original future crew lander; no flight/NASA markings. */}
    <mesh position={[0, 1.35, 0]} castShadow receiveShadow><cylinderGeometry args={[0.7, 0.92, 2.65, 12]} /><meshStandardMaterial color={BODY} roughness={0.84} /></mesh>
    <mesh position={[0, 2.25, 0]} castShadow><coneGeometry args={[0.7, 0.9, 12]} /><meshStandardMaterial color="#C7C6BC" roughness={0.78} /></mesh>
    <mesh position={[0, 0.26, 0]} castShadow><cylinderGeometry args={[0.95, 0.72, 0.34, 12]} /><meshStandardMaterial color="#777D7A" metalness={0.2} roughness={0.72} /></mesh>
    {geometry.legs.map((leg, index) => <group key={index}>
      <mesh position={[LEG_DIRECTIONS[index][0] * 0.62, 0.22, LEG_DIRECTIONS[index][1] * 0.62]} castShadow><sphereGeometry args={[0.12, 8, 6]} /><meshStandardMaterial color="#7C827F" metalness={0.32} roughness={0.62} /></mesh>
      <mesh position={leg.strutCenter} quaternion={leg.strutQuaternion} castShadow><boxGeometry args={[0.13, leg.strutLength, 0.14]} /><meshStandardMaterial color="#7C827F" metalness={0.32} roughness={0.62} /></mesh>
      <mesh position={leg.foot} rotation={[0, leg.footRotationY, 0]} castShadow><boxGeometry args={LEG_FOOT_SIZE} /><meshStandardMaterial color="#777D7A" roughness={0.76} /></mesh>
    </group>)}
    {/* Aft engine clears the settled ground; plume is visual and does not scale the hull. */}
    <mesh position={[0, ENGINE_CENTER_Y, 0]}><cylinderGeometry args={[0.32, 0.4, ENGINE_HEIGHT, 12]} /><meshStandardMaterial color="#42484A" metalness={0.45} roughness={0.5} /></mesh>
    {frame.thrust > 0.08 && <mesh position={[0, 0.02 - plumeLength / 2, 0]}><coneGeometry args={[0.38 * frame.thrust, plumeLength, 12]} /><meshStandardMaterial {...thrustMaterial} transparent opacity={0.55 + frame.thrust * 0.25} /></mesh>}
    {/* Front X-hinge deploys only after touchdown and closes before departure thrust. */}
    <group position={geometry.rampHinge} rotation={[geometry.rampAngleX, 0, 0]}>
      <mesh position={[0, -RAMP_LENGTH / 2, 0]} castShadow><boxGeometry args={[0.82, RAMP_LENGTH, RAMP_THICKNESS]} /><meshStandardMaterial color="#96988F" roughness={0.82} /></mesh>
      <mesh position={[0, -0.58, 0.09]}><boxGeometry args={[0.68, 0.82, 0.02]} /><meshStandardMaterial color="#4A5558" roughness={0.88} /></mesh>
    </group>
    <mesh position={[0, LOWER_DETAIL_CENTER_Y, 0.15]}><boxGeometry args={[0.6, LOWER_DETAIL_HEIGHT, 0.04]} /><meshStandardMaterial color="#D2CDBA" roughness={0.95} /></mesh>
  </group>;
}

function Ground({ baseCenter }: { baseCenter: [number, number] }) {
  return <group position={[baseCenter[0], 0, baseCenter[1]]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow><planeGeometry args={[200, 200, 1, 1]} /><meshStandardMaterial color="#8B5847" roughness={1} /></mesh>
    {Array.from({ length: 26 }, (_, index) => {
      const angle = index * 2.399963, radius = 2.8 + ((index * 17) % 19) * 0.72;
      const size = 0.12 + (index % 4) * 0.09;
      return <mesh key={index} position={[Math.cos(angle) * radius, -0.04 + size * 0.35, Math.sin(angle) * radius]} rotation={[0, angle, 0]} castShadow>
        <dodecahedronGeometry args={[size, 0]} /><meshStandardMaterial color={index % 3 === 0 ? '#A87458' : '#765247'} roughness={1} />
      </mesh>;
    })}
    {[[-16, -7], [-12, 12], [17, 9], [22, -13], [0, -24]].map(([x, z], index) => <mesh key={index} position={[x, 0.55 + (index % 2), z]} scale={[3 + index % 3, 1 + index % 2, 1]} castShadow>
      <dodecahedronGeometry args={[3.8, 1]} /><meshStandardMaterial color="#804F43" roughness={1} />
    </mesh>)}
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[4.2, 4.35, 64]} /><meshBasicMaterial color="#CF9A74" /></mesh>
  </group>;
}

function Scene({ kind, elapsed, reducedMotion, baseCenter }: {
  kind: MissionCinematicKind; elapsed: number; reducedMotion: boolean; baseCenter: [number, number];
}) {
  const frame = getMissionCinematicFrame(kind, elapsed, reducedMotion);
  const { camera } = useThree();
  const targetX = baseCenter[0] + (reducedMotion ? 0 : frame.horizontalOffset * 0.35);
  useFrame(() => {
    // This belongs only to this Canvas; derived positions avoid accumulated camera drift.
    const follow = reducedMotion ? 0 : 1;
    camera.position.set(baseCenter[0] + 13 + frame.horizontalOffset * 0.12 * follow, 10 + frame.altitudeGameUnits * 0.38 * follow, baseCenter[1] + 18);
    camera.lookAt(targetX, 2 + frame.altitudeGameUnits * 0.28 * follow, baseCenter[1]);
  });
  return <>
    <color attach="background" args={['#252B32']} />
    <fog attach="fog" args={['#252B32', 30, 105]} />
    <ambientLight intensity={1.25} />
    <directionalLight position={[baseCenter[0] + 18, 26, baseCenter[1] + 20]} intensity={2.4} castShadow />
    <hemisphereLight args={['#B6C7D1', '#6D4540', 0.62]} />
    <Ground baseCenter={baseCenter} />
    <Lander kind={kind} elapsed={elapsed} reducedMotion={reducedMotion} baseCenter={baseCenter} />
    <group position={[targetX, 0, baseCenter[1] - 8]}>
      <mesh position={[-1.35, 0.55, 0]} castShadow><boxGeometry args={[1.2, 1.1, 0.9]} /><meshStandardMaterial color="#515A5B" roughness={0.9} /></mesh>
      <mesh position={[1.35, 0.55, 0]} castShadow><boxGeometry args={[1.2, 1.1, 0.9]} /><meshStandardMaterial color="#515A5B" roughness={0.9} /></mesh>
      <mesh position={[0, 0.08, 0]}><boxGeometry args={[4.2, 0.15, 2.0]} /><meshStandardMaterial color="#A6A294" roughness={0.9} /></mesh>
    </group>
  </>;
}

export function MissionCinematic({ kind, baseCenter, reducedMotion, onComplete }: MissionCinematicProps) {
  const [elapsed, setElapsed] = useState(0);
  const skipRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(0);
  const completeRef = useRef(false);
  const callbackRef = useRef(onComplete);
  const previousKind = useRef(kind);
  callbackRef.current = onComplete;
  const duration = MISSION_CINEMATIC_DURATION[kind];
  const frame = getMissionCinematicFrame(kind, elapsed, reducedMotion);

  const complete = useCallback(() => {
    if (completeRef.current) return;
    completeRef.current = true;
    callbackRef.current();
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    skipRef.current?.focus();
    // Capture focus before focusing the dialog control; restore it on every unmount path.
    if (previousFocus !== document.body && previousFocus !== skipRef.current) shellRef.current?.setAttribute('data-restore-focus', 'true');
    const shell = shellRef.current;
    const restoreTarget = previousFocus;
    let raf = 0;
    let cancelled = false;
    if (previousKind.current !== kind) {
      previousKind.current = kind;
      completeRef.current = false;
      setElapsed(0);
    }
    startRef.current = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const seconds = Math.min(duration, Math.max(0, (now - startRef.current) / 1000));
      setElapsed(seconds);
      if (seconds >= duration) complete();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (restoreTarget && restoreTarget.isConnected) restoreTarget.focus();
      shell?.removeAttribute('data-restore-focus');
    };
  }, [kind, duration, complete]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); complete(); return; }
    if (event.key !== 'Tab' || !shellRef.current) return;
    const focusable = Array.from(shellRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return <div className="mission-cinematic" ref={shellRef} role="dialog" aria-modal="true" aria-labelledby="cinematic-title" onKeyDown={handleKeyDown}>
    <div className="mission-cinematic__scene" aria-hidden="true">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [baseCenter[0] + 13, 10, baseCenter[1] + 18], fov: 42, near: 0.1, far: 260 }}>
        <Scene kind={kind} elapsed={elapsed} reducedMotion={reducedMotion} baseCenter={baseCenter} />
      </Canvas>
    </div>
    <div className="mission-cinematic__vignette" aria-hidden="true" />
    <header className="mission-cinematic__header">
      <div>
        <h1 id="cinematic-title">{kind === 'intro' ? 'A new landing site' : kind === 'arrival' ? 'Crew arrival' : 'Departure'}</h1>
        <p>FICTIONAL FUTURE CREW LANDER · SCENARIO</p>
      </div>
      <button className="mission-cinematic__skip" type="button" ref={skipRef} onClick={complete}>Skip scene <span aria-hidden="true">Esc</span></button>
    </header>
    <section className="mission-cinematic__caption" aria-live="polite" aria-atomic="true">
      <p>{frame.caption}</p>
      <div className="mission-cinematic__telemetry" aria-label={`${frame.telemetryLabel}; scenario values, not real flight telemetry`}>
        <span>{frame.telemetryLabel}</span>
        <span>ALT {frame.altitudeGameUnits.toFixed(1)} u</span>
        <span>V/S {frame.verticalSpeedGameUnitsPerSecond.toFixed(1)} u/s</span>
      </div>
      <div className="mission-cinematic__progress" role="progressbar" aria-label="Cinematic progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(frame.progress * 100)}><span style={{ transform: `scaleX(${frame.progress})` }} /></div>
    </section>
  </div>;
}

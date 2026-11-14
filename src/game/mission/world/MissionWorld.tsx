import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { BaseState, MissionEvent, MissionState, Pose, RegionDefinition, RegionId, SurveyState } from '../contract';
import { REGIONS } from '../content';
import { LAKE_SURVEY_TARGETS } from '../activities/rules';
import { RealRoverCraft } from '../../art/realism/RealRoverCraft';
import { FieldCamp } from './FieldCamp';
import { SolCompanion } from './SolCompanion';
import {
  MAIN_ROUTES,
  REGION_CENTERS,
  REGION_ORDER,
  WORLD_BOUNDS,
  canOccupy,
  constrainMove,
  poseOnGround,
  sampleGround,
  type RouteSegment,
} from './worldNavigation';

export interface MissionWorldInput {
  x: number;
  z: number;
  sprint?: boolean;
}

export type MissionInteractionTarget =
  | { kind: 'base'; region: RegionId }
  | { kind: 'observation'; region: RegionId; id: string }
  | { kind: 'branch'; region: RegionId; id: string };

export interface MissionWorldProps {
  state: MissionState;
  dispatch: (event: MissionEvent) => void;
  onInteract: (target: MissionInteractionTarget) => void;
  paused: boolean;
  input?: MissionWorldInput;
  interactRequested?: number;
  surveyCamera?: { heading: number; framing: 'wide' | 'close' };
  onSurveyCameraChange?: (context: { roverPose: Pose; camera: { heading: number; framing: 'wide' | 'close' } }) => void;
}

const REGION_TONES: Record<RegionId, string> = {
  impact: '#8f5d4c',
  dust: '#aa8061',
  volcano: '#664d4a',
  ice: '#7894a0',
  lake: '#817d64',
};
const MOVE_EPSILON = 0.002;
const INTERACT_RADIUS = 8;
const LEO_RADIUS = 0.65;
const ROVER_RADIUS = 1.35;
const EMPTY_BASE: BaseState = {
  unlocked: false,
  stock: { energy: 12, meals: 4, water: 5, air: 4 },
  checks: { airheat: false, shelter: false, comms: false },
  operation: null,
  report: false,
};
const EMPTY_SURVEY: SurveyState = {
  observations: [],
  branches: [],
  paid: false,
  supportBaseId: 'dust',
  activityDone: false,
  activityProgress: null,
  assist: false,
  operation: null,
  deferred: null,
};

function finitePose(pose: Pose | undefined, fallback: Pose): Pose {
  if (!pose || !Number.isFinite(pose.x) || !Number.isFinite(pose.z) || !Number.isFinite(pose.heading)) return fallback;
  return pose;
}

function distance2D(a: Pose, b: readonly [number, number]): number {
  return Math.hypot(a.x - b[0], a.z - b[1]);
}

function operationFlags(operation: string | null | undefined) {
  const value = (operation ?? '').toLowerCase();
  return {
    protected: value.includes('protect') || value.includes('accessible') || value.includes('sample'),
    cleanPanels: value.includes('clean') || value.includes('panel'),
    water: value.includes('water'),
    thermal: value.includes('thermal') || value.includes('heat'),
    core: value.includes('core') || value.includes('analysis'),
    transmit: value.includes('transmit') || value.includes('full') || value.includes('summary'),
  };
}

function buildTerrainGeometry() {
  const segments = 72;
  const width = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
  const depth = WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const color = new THREE.Color();

  const colorForPoint = (x: number, z: number, y: number) => {
    const region = REGION_ORDER.reduce((closest, candidate) => {
      const [cx, cz] = REGION_CENTERS[candidate];
      const [bx, bz] = REGION_CENTERS[closest];
      return Math.hypot(x - cx, z - cz) < Math.hypot(x - bx, z - bz) ? candidate : closest;
    }, REGION_ORDER[0]);
    color.set(REGION_TONES[region]);
    color.offsetHSL(0, 0, THREE.MathUtils.clamp(y * 0.018, -0.12, 0.1));
    return color;
  };

  for (let row = 0; row <= segments; row += 1) {
    const z = WORLD_BOUNDS.minZ + (depth * row) / segments;
    for (let column = 0; column <= segments; column += 1) {
      const x = WORLD_BOUNDS.minX + (width * column) / segments;
      const y = sampleGround(x, z);
      positions.push(x, y, z);
      const pointColor = colorForPoint(x, z, y);
      colors.push(pointColor.r, pointColor.g, pointColor.b);
    }
  }
  for (let row = 0; row < segments; row += 1) {
    for (let column = 0; column < segments; column += 1) {
      const topLeft = row * (segments + 1) + column;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + segments + 1;
      const bottomRight = bottomLeft + 1;
      indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function CameraDirector({ state, surveyCamera, onSurveyCameraChange }: Pick<MissionWorldProps, 'state' | 'surveyCamera' | 'onSurveyCameraChange'>) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const callbackRef = useRef(onSurveyCameraChange);
  const lastReport = useRef({ time: -1, x: Number.NaN, z: Number.NaN, heading: Number.NaN, framing: '' });
  const previousCameraMode = useRef<boolean | undefined>(undefined);
  const cameraInitialized = useRef(false);
  callbackRef.current = onSurveyCameraChange;
  useFrame(({ clock }, delta) => {
    const roverPose = state.activeRover === 'lake' ? state.rovers.lake : undefined;
    const pose = roverPose ?? (state.activeRover ? state.rovers[state.activeRover] : state.leo);
    const fieldCamera = roverPose ? surveyCamera : undefined;
    const modeChanged = previousCameraMode.current !== Boolean(fieldCamera);
    previousCameraMode.current = Boolean(fieldCamera);
    target.set(pose.x, sampleGround(pose.x, pose.z) + 1, pose.z);
    if (fieldCamera) {
      const distance = 7;
      desired.set(pose.x - Math.sin(fieldCamera.heading) * distance, target.y + 2.4, pose.z - Math.cos(fieldCamera.heading) * distance);
      if (camera instanceof THREE.PerspectiveCamera) camera.fov = fieldCamera.framing === 'wide' ? 45 : 22;
    } else {
      desired.set(pose.x, target.y + 5, pose.z + 9);
      if (camera instanceof THREE.PerspectiveCamera) camera.fov = 54;
    }
    camera.updateProjectionMatrix();
    const smoothing = 1 - Math.exp(-Math.min(delta, 0.05) * 3.5);
    if (!cameraInitialized.current || modeChanged || camera.position.distanceToSquared(desired) > 10000) camera.position.copy(desired);
    else camera.position.lerp(desired, smoothing);
    cameraInitialized.current = true;
    if (fieldCamera) {
      direction.set(Math.sin(fieldCamera.heading), 0, Math.cos(fieldCamera.heading));
      target.addScaledVector(direction, 12);
      target.y = sampleGround(pose.x, pose.z) + 1;
    }
    camera.lookAt(target);
    if (roverPose && fieldCamera && callbackRef.current) {
      camera.getWorldDirection(direction);
      const heading = Math.atan2(direction.x, direction.z);
      const now = clock.elapsedTime;
      const previous = lastReport.current;
      if (now - previous.time >= 0.12 || Math.hypot(roverPose.x - previous.x, roverPose.z - previous.z) >= 0.35 || Math.abs(heading - previous.heading) >= 0.025 || previous.framing !== fieldCamera.framing) {
        lastReport.current = { time: now, x: roverPose.x, z: roverPose.z, heading, framing: fieldCamera.framing };
        callbackRef.current({ roverPose: { ...roverPose }, camera: { heading, framing: fieldCamera.framing } });
      }
    }
  });
  return null;
}

function Terrain() {
  const geometry = useMemo(buildTerrainGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow frustumCulled>
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0.03} />
    </mesh>
  );
}

function RouteLines() {
  const routes = useMemo(() => MAIN_ROUTES.map((route) => {
    const [from, to] = [REGION_CENTERS[route[0]], REGION_CENTERS[route[1]]];
    const count = Math.max(2, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 18));
    return {
      route,
      points: Array.from({ length: count + 1 }, (_, index) => {
        const t = index / count;
        const x = from[0] + (to[0] - from[0]) * t;
        const z = from[1] + (to[1] - from[1]) * t;
        return [x, sampleGround(x, z) + 0.18, z] as [number, number, number];
      }),
    };
  }), []);
  return (
    <group name="connected-main-routes">
      {routes.map(({ route, points }) => <Line key={`${route[0]}-${route[1]}`} points={points} color="#b7c7c2" transparent opacity={0.58} lineWidth={1.15} />)}
    </group>
  );
}

function InstancedRockField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5b4b48', roughness: 1, metalness: 0 }), []);
  const placements = useMemo(() => {
    const offsets: readonly [number, number, number][] = [
      [-42, -34, 2.2], [-30, 39, 3.6], [36, -38, 2.8], [43, 31, 4.1],
      [-56, 10, 1.8], [55, -9, 2.7], [-15, 56, 2.4], [13, -55, 3.2],
      [-76, -12, 3.1], [74, 14, 2.6], [-66, 48, 2.3], [66, -49, 3.5],
      [-105, -8, 2.2], [104, 6, 2.8], [-8, 104, 2.6], [12, -104, 2.1],
      [-234, -140, 2.8], [-171, -212, 2.4], [-240, 196, 3.3], [-174, 236, 2.5],
      [244, -213, 2.8], [176, -144, 2.2], [230, 208, 3.4], [165, 224, 2.6],
      [-47, 172, 2.7], [45, 168, 2.4], [-44, -184, 2.2], [46, -175, 2.9],
    ];
    return offsets.map(([x, z, scale]) => [x, sampleGround(x, z) + scale * 0.38, z, scale] as const);
  }, []);
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const matrix = new THREE.Matrix4();
    placements.forEach(([x, y, z, scale], index) => {
      matrix.makeRotationY((index * 1.73) % Math.PI);
      matrix.scale(new THREE.Vector3(scale, scale * 0.65, scale * 0.8));
      matrix.setPosition(x, y, z);
      meshRef.current?.setMatrixAt(index, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [placements]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  return <instancedMesh ref={meshRef} args={[geometry, material, placements.length]} castShadow receiveShadow />;
}

function ImpactLandform({ center }: { center: readonly [number, number] }) {
  const y = sampleGround(center[0] - 12, center[1] - 4);
  return (
    <group name="impact-crater-and-radar" position={[center[0] - 10, y, center[1] - 4]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[39, 3.2, 8, 32]} />
        <meshStandardMaterial color="#664a44" roughness={1} />
      </mesh>
      <mesh position={[-31, 6, -8]} rotation={[0.1, 0.25, -0.13]} castShadow>
        <torusGeometry args={[8, 0.55, 6, 18, Math.PI * 1.28]} />
        <meshStandardMaterial color="#a87964" roughness={0.9} metalness={0.05} />
      </mesh>
      <group position={[30, 0, -28]} rotation={[0, -0.34, 0]}>
        <mesh position={[-4, 9, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[9, 0.62, 8, 22, Math.PI * 1.18]} />
          <meshStandardMaterial color="#7f9899" roughness={0.76} metalness={0.24} />
        </mesh>
        <mesh position={[0, 3, 0]} castShadow><boxGeometry args={[1.1, 6, 1.1]} /><meshStandardMaterial color="#344950" metalness={0.6} roughness={0.55} /></mesh>
      </group>
    </group>
  );
}

function DustLandform({ center }: { center: readonly [number, number] }) {
  const y = sampleGround(center[0] + 20, center[1] - 18);
  return (
    <group name="dust-dunes-and-wind-tower" position={[center[0] + 20, y, center[1] - 18]}>
      <mesh position={[-34, 2.5, 18]} rotation={[0, 0.17, 0]} castShadow>
        <capsuleGeometry args={[8, 46, 7, 14]} />
        <meshStandardMaterial color="#b58a68" roughness={1} />
      </mesh>
      <mesh position={[21, 1.9, -28]} rotation={[0, -0.34, 0]} castShadow>
        <capsuleGeometry args={[7, 38, 7, 14]} />
        <meshStandardMaterial color="#9c725a" roughness={1} />
      </mesh>
      <group position={[34, 0, 24]}>
        <mesh position={[0, 7, 0]} castShadow><cylinderGeometry args={[0.42, 0.62, 14, 8]} /><meshStandardMaterial color="#37474b" metalness={0.55} roughness={0.55} /></mesh>
        <mesh position={[0, 14.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><boxGeometry args={[1.4, 10, 1.4]} /><meshStandardMaterial color="#d5b67c" metalness={0.2} roughness={0.7} /></mesh>
        {[[-4.2, 0], [4.2, 0], [0, 4.2], [0, -4.2]].map(([x, z]) => <mesh key={`${x}-${z}`} position={[x, 14.2, z]} rotation={[0, Math.atan2(x, z), 0]}><boxGeometry args={[0.3, 0.3, 8]} /><meshStandardMaterial color="#d5b67c" roughness={0.7} /></mesh>)}
      </group>
    </group>
  );
}

function VolcanoLandform({ center }: { center: readonly [number, number] }) {
  const y = sampleGround(center[0] + 8, center[1] + 5);
  return (
    <group name="basalt-terraces-and-survey-bridge" position={[center[0] + 8, y, center[1] + 5]}>
      {[[-38, 3, 13, 26, 6], [-4, 5, 17, 32, 8], [32, 2.5, 12, 23, 5]].map(([x, h, z, width, depth], index) => (
        <mesh key={index} position={[x, h / 2, z]} rotation={[0, (index - 1) * 0.22, (index % 2 ? 0.06 : -0.04)]} castShadow>
          <boxGeometry args={[width, h, depth]} /><meshStandardMaterial color={index === 1 ? '#493d3b' : '#554948'} roughness={0.98} />
        </mesh>
      ))}
      <group position={[22, 9, -27]} rotation={[0, -0.2, 0]}>
        <mesh position={[-8, 0, 0]} castShadow><boxGeometry args={[1.4, 18, 1.4]} /><meshStandardMaterial color="#777b70" roughness={0.72} metalness={0.2} /></mesh>
        <mesh position={[8, 0, 0]} castShadow><boxGeometry args={[1.4, 18, 1.4]} /><meshStandardMaterial color="#777b70" roughness={0.72} metalness={0.2} /></mesh>
        <mesh position={[0, 6, 0]} castShadow><boxGeometry args={[19, 1.4, 2.2]} /><meshStandardMaterial color="#ac7759" roughness={0.78} metalness={0.18} /></mesh>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[5.5, 0.22, 5, 16]} /><meshStandardMaterial color="#cb7655" emissive="#3c1711" emissiveIntensity={0.26} roughness={0.7} /></mesh>
      </group>
    </group>
  );
}

function IceLandform({ center }: { center: readonly [number, number] }) {
  const y = sampleGround(center[0] - 10, center[1] + 8);
  return (
    <group name="ice-wall-and-core-drill" position={[center[0] - 10, y, center[1] + 8]}>
      <mesh position={[22, 13, 0]} rotation={[0, 0.22, -0.12]} castShadow>
        <boxGeometry args={[18, 28, 82]} /><meshStandardMaterial color="#8bb2bb" roughness={0.55} metalness={0.04} />
      </mesh>
      <mesh position={[0, 4, -32]} rotation={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[28, 9, 22]} /><meshStandardMaterial color="#a9d9df" roughness={0.5} />
      </mesh>
      <group position={[-30, 0, 24]} rotation={[0, 0.18, 0]}>
        <mesh position={[0, 7, 0]} rotation={[0, 0, 0.18]} castShadow><boxGeometry args={[1.1, 15, 1.1]} /><meshStandardMaterial color="#47595d" metalness={0.6} roughness={0.55} /></mesh>
        <mesh position={[0, 14, 0]} rotation={[0, 0, 0.18]} castShadow><boxGeometry args={[18, 0.8, 0.8]} /><meshStandardMaterial color="#708b8e" metalness={0.4} roughness={0.6} /></mesh>
        <mesh position={[7, 6, 0]} rotation={[0, 0, -0.32]} castShadow><cylinderGeometry args={[0.22, 0.22, 15, 8]} /><meshStandardMaterial color="#cfedf0" metalness={0.5} roughness={0.32} /></mesh>
        <mesh position={[7, 0, 0]}><cylinderGeometry args={[2.5, 2.5, 0.4, 16]} /><meshStandardMaterial color="#577b82" roughness={0.72} /></mesh>
      </group>
    </group>
  );
}

function LakeLandform({ center }: { center: readonly [number, number] }) {
  const y = sampleGround(center[0] + 5, center[1] - 8);
  return (
    <group name="sediment-basin-and-data-gateway" position={[center[0] + 5, y, center[1] - 8]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow><ringGeometry args={[45, 52, 32]} /><meshStandardMaterial color="#776f59" roughness={1} /></mesh>
      <group position={[-29, 1, 30]}>
        <mesh position={[-8, 7, 0]} castShadow><boxGeometry args={[1.3, 16, 1.3]} /><meshStandardMaterial color="#526a6d" metalness={0.4} roughness={0.65} /></mesh>
        <mesh position={[8, 7, 0]} castShadow><boxGeometry args={[1.3, 16, 1.3]} /><meshStandardMaterial color="#526a6d" metalness={0.4} roughness={0.65} /></mesh>
        <mesh position={[0, 14, 0]} castShadow><boxGeometry args={[18, 1.2, 2]} /><meshStandardMaterial color="#7d9b96" metalness={0.36} roughness={0.58} /></mesh>
        <mesh position={[0, 14, 0.6]}><boxGeometry args={[11, 0.5, 0.15]} /><meshStandardMaterial color="#b8d9d2" emissive="#304e4c" emissiveIntensity={0.22} /></mesh>
      </group>
    </group>
  );
}

function RegionLandforms({ region, center }: { region: RegionId; center: readonly [number, number] }) {
  switch (region) {
    case 'impact': return <ImpactLandform center={center} />;
    case 'dust': return <DustLandform center={center} />;
    case 'volcano': return <VolcanoLandform center={center} />;
    case 'ice': return <IceLandform center={center} />;
    case 'lake': return <LakeLandform center={center} />;
  }
}

function LakeSurveyMarkers() {
  return <group name="lake-survey-targets">{LAKE_SURVEY_TARGETS.map((target) => <group key={target.id} position={[target.x, sampleGround(target.x, target.z), target.z]}>
    <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.08, 0.14, 1.4, 8]} /><meshStandardMaterial color="#4d625f" metalness={0.35} roughness={0.72} /></mesh>
    <mesh position={[0, 1.55, 0]}><octahedronGeometry args={[0.42, 0]} /><meshStandardMaterial color="#79dbe2" emissive="#24747c" emissiveIntensity={0.65} /></mesh>
    <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.75, 0.9, 24]} /><meshBasicMaterial color="#79dbe2" transparent opacity={0.75} /></mesh>
  </group>)}</group>;
}

function ObservationMarker({ position, kind, active }: { position: readonly [number, number]; kind: 'observation' | 'branch'; active: boolean }) {
  const x = position[0];
  const z = position[1];
  const y = sampleGround(x, z);
  const color = kind === 'observation' ? '#e3b56a' : '#85b3af';
  return (
    <group position={[x, y, z]} name={`${kind}-marker`}>
      <mesh position={[0, 0.68, 0]} castShadow><cylinderGeometry args={[0.09, 0.14, 1.35, 8]} /><meshStandardMaterial color="#44575a" metalness={0.45} roughness={0.55} /></mesh>
      <mesh position={[0, 1.48, 0]}><octahedronGeometry args={[0.38, 0]} /><meshStandardMaterial color={active ? '#d8f3dc' : color} emissive={active ? '#62be86' : color} emissiveIntensity={active ? 0.9 : 0.18} roughness={0.4} /></mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.65, 0.76, 16]} /><meshBasicMaterial color={color} transparent opacity={0.38} /></mesh>
    </group>
  );
}

function InteractionMarkers({ state }: { state: MissionState }) {
  return (
    <group name="survey-markers">
      {REGIONS.map((region: RegionDefinition) => {
        const survey = state.surveys[region.id] ?? EMPTY_SURVEY;
        return (
          <group key={region.id}>
            {region.observations.map(observation => <ObservationMarker key={observation.id} position={observation.position} kind="observation" active={survey.observations.includes(observation.id)} />)}
            {region.branches.map(branch => <ObservationMarker key={branch.id} position={branch.position} kind="branch" active={survey.branches.includes(branch.id)} />)}
          </group>
        );
      })}
    </group>
  );
}

function LeoAstronaut({ pose, paused, roverControlled }: { pose: Pose; paused: boolean; roverControlled: boolean }) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const previousPosition = useRef<[number, number] | null>(null);
  const phase = useRef(0);

  useFrame((_, delta) => {
    if (!rootRef.current || !bodyRef.current || !leftLegRef.current || !rightLegRef.current || !leftArmRef.current || !rightArmRef.current) return;
    const safeDelta = Math.min(Math.max(Number.isFinite(delta) ? delta : 0, 0), 0.05);
    const previous = previousPosition.current;
    const acceptedDelta = previous ? Math.hypot(pose.x - previous[0], pose.z - previous[1]) : 0;
    previousPosition.current = [pose.x, pose.z];
    const walking = !paused && !roverControlled && acceptedDelta > MOVE_EPSILON;
    if (walking) phase.current += acceptedDelta * 8.2;
    const swing = walking ? Math.sin(phase.current) * 0.42 : 0;
    const smoothing = 1 - Math.exp(-16 * safeDelta);
    rootRef.current.position.set(pose.x, sampleGround(pose.x, pose.z), pose.z);
    rootRef.current.rotation.y = pose.heading;
    leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -swing, smoothing);
    rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, swing, smoothing);
    leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, swing * 0.66, smoothing);
    rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -swing * 0.66, smoothing);
    bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, walking ? -0.08 : 0, smoothing);
  });

  return (
    <group ref={rootRef} name="leo-sol-recognizable" dispose={null}>
      <group ref={bodyRef}>
        <group position={[0, 1.44, 0]}>
          <mesh castShadow><boxGeometry args={[0.48, 0.43, 0.43]} /><meshStandardMaterial color="#e9e9dc" roughness={0.48} metalness={0.08} /></mesh>
          <mesh position={[0, 0.02, -0.226]} castShadow><boxGeometry args={[0.34, 0.23, 0.06]} /><meshStandardMaterial color="#d99b48" roughness={0.2} metalness={0.72} /></mesh>
          <mesh position={[0.25, 0.17, 0]}><cylinderGeometry args={[0.014, 0.014, 0.25, 6]} /><meshStandardMaterial color="#536d6d" metalness={0.68} roughness={0.24} /></mesh>
        </group>
        <mesh position={[0, 1, 0]} castShadow><boxGeometry args={[0.49, 0.52, 0.32]} /><meshStandardMaterial color="#e4e8de" roughness={0.48} metalness={0.06} /></mesh>
        <mesh position={[0, 1.02, -0.17]}><boxGeometry args={[0.18, 0.12, 0.018]} /><meshStandardMaterial color="#a85d3b" roughness={0.42} /></mesh>
        <group position={[0, 1.03, 0.24]}><mesh castShadow><boxGeometry args={[0.4, 0.48, 0.22]} /><meshStandardMaterial color="#c4cdc3" roughness={0.4} metalness={0.24} /></mesh><mesh position={[-0.11, 0, 0.13]}><cylinderGeometry args={[0.048, 0.048, 0.39, 8]} /><meshStandardMaterial color="#76928b" roughness={0.38} /></mesh><mesh position={[0.11, 0, 0.13]}><cylinderGeometry args={[0.048, 0.048, 0.39, 8]} /><meshStandardMaterial color="#76928b" roughness={0.38} /></mesh></group>
        <group ref={leftArmRef} position={[-0.31, 1.08, 0]}><mesh position={[0, -0.2, 0]} castShadow><boxGeometry args={[0.17, 0.43, 0.19]} /><meshStandardMaterial color="#e9e9dc" roughness={0.48} /></mesh><mesh position={[0, -0.43, -0.015]}><boxGeometry args={[0.18, 0.13, 0.17]} /><meshStandardMaterial color="#d5dbd0" roughness={0.6} /></mesh></group>
        <group ref={rightArmRef} position={[0.31, 1.08, 0]}><mesh position={[0, -0.2, 0]} castShadow><boxGeometry args={[0.17, 0.43, 0.19]} /><meshStandardMaterial color="#e9e9dc" roughness={0.48} /></mesh><mesh position={[0, -0.43, -0.015]}><boxGeometry args={[0.18, 0.13, 0.17]} /><meshStandardMaterial color="#d5dbd0" roughness={0.6} /></mesh></group>
        <group ref={leftLegRef} position={[-0.14, 0.68, 0]}><mesh position={[0, -0.23, 0]} castShadow><boxGeometry args={[0.2, 0.48, 0.23]} /><meshStandardMaterial color="#d8ddd2" roughness={0.55} /></mesh><mesh position={[0, -0.58, -0.07]} castShadow><boxGeometry args={[0.28, 0.17, 0.4]} /><meshStandardMaterial color="#506663" roughness={0.56} metalness={0.16} /></mesh></group>
        <group ref={rightLegRef} position={[0.14, 0.68, 0]}><mesh position={[0, -0.23, 0]} castShadow><boxGeometry args={[0.2, 0.48, 0.23]} /><meshStandardMaterial color="#d8ddd2" roughness={0.55} /></mesh><mesh position={[0, -0.58, -0.07]} castShadow><boxGeometry args={[0.28, 0.17, 0.4]} /><meshStandardMaterial color="#506663" roughness={0.56} metalness={0.16} /></mesh></group>
      </group>
    </group>
  );
}

function RoverVisual({ pose, wheelTravel, steering, survey, active }: {
  pose: Pose;
  wheelTravel: number;
  steering: number;
  survey: SurveyState;
  active: boolean;
}) {
  const flags = operationFlags(survey.operation);
  const armPose = active || flags.core || flags.transmit ? 'inspect' : 'stowed';
  const mastYaw = flags.transmit ? 0.68 : survey.observations.length > 0 ? 0.18 + survey.observations.length * 0.08 : 0;
  const grounded = poseOnGround(pose);
  return (
    <RealRoverCraft
      position={[grounded.x, grounded.y, grounded.z]}
      heading={grounded.heading}
      wheelTravel={wheelTravel}
      steering={steering}
      rocker={[0, 0]}
      bogie={[0, 0]}
      mastYaw={mastYaw}
      armPose={armPose}
    />
  );
}

function nearestInteraction(pose: Pose): MissionInteractionTarget | null {
  let closest: MissionInteractionTarget | null = null;
  let best = INTERACT_RADIUS;
  for (const region of REGIONS) {
    const center = REGION_CENTERS[region.id];
    const consolePosition: readonly [number, number] = [center[0], center[1] + 8];
    const baseDistance = distance2D(pose, consolePosition);
    if (baseDistance < best) {
      best = baseDistance;
      closest = { kind: 'base', region: region.id };
    }
    for (const observation of region.observations) {
      const distance = distance2D(pose, observation.position);
      if (distance < best) {
        best = distance;
        closest = { kind: 'observation', region: region.id, id: observation.id };
      }
    }
    for (const branch of region.branches) {
      const distance = distance2D(pose, branch.position);
      if (distance < best) {
        best = distance;
        closest = { kind: 'branch', region: region.id, id: branch.id };
      }
    }
  }
  return closest;
}

function editableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('button, input, textarea, select, [role="dialog"], [contenteditable="true"], [data-mission-panel]'));
}

function MissionWorldScene({ state, dispatch, onInteract, paused, input, interactRequested, surveyCamera, onSurveyCameraChange }: MissionWorldProps) {
  const heldKeys = useRef(new Set<string>());
  const inputRef = useRef<MissionWorldInput | undefined>(input);
  const onInteractRef = useRef(onInteract);
  const dispatchRef = useRef(dispatch);
  const stateRef = useRef(state);
  const pausedRef = useRef(paused);
  const lastInteractionRequest = useRef<number | undefined>(interactRequested);
  const roverTravel = useRef<Record<RegionId, number>>({ impact: 0, dust: 0, volcano: 0, ice: 0, lake: 0 });
  const previousRoverPositions = useRef<Partial<Record<RegionId, [number, number]>>>({});
  const steering = useRef<Record<RegionId, number>>({ impact: 0, dust: 0, volcano: 0, ice: 0, lake: 0 });
  const interactAction = useRef<() => void>(() => undefined);
  const roverAction = useRef<() => void>(() => undefined);

  inputRef.current = input;
  onInteractRef.current = onInteract;
  dispatchRef.current = dispatch;
  stateRef.current = state;
  pausedRef.current = paused;

  const activePose = useCallback((): Pose => {
    const current = stateRef.current;
    if (current.activeRover) {
      const center = REGION_CENTERS[current.activeRover];
      return finitePose(current.rovers[current.activeRover], { x: center[0], z: center[1], heading: 0 });
    }
    return finitePose(current.leo, { x: REGION_CENTERS.dust[0], z: REGION_CENTERS.dust[1], heading: 0 });
  }, []);

  interactAction.current = () => {
    if (pausedRef.current) return;
    const target = nearestInteraction(activePose());
    if (target) onInteractRef.current(target);
  };

  roverAction.current = () => {
    if (pausedRef.current) return;
    const current = stateRef.current;
    if (current.activeRover) {
      dispatchRef.current({ type: 'EXIT_ROVER' });
      return;
    }
    const leo = finitePose(current.leo, { x: 0, z: 0, heading: 0 });
    const candidate = REGION_ORDER.map(region => {
      const center = REGION_CENTERS[region];
      const rover = finitePose(current.rovers[region], { x: center[0] + 8, z: center[1] + 8, heading: 0 });
      return { region, distance: distance2D(leo, [rover.x, rover.z]) };
    }).sort((a, b) => a.distance - b.distance)[0];
    if (candidate && candidate.distance <= INTERACT_RADIUS) dispatchRef.current({ type: 'ENTER_ROVER', region: candidate.region });
  };

  useEffect(() => {
    const clear = () => heldKeys.current.clear();
    const keyDown = (event: KeyboardEvent) => {
      if (editableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) {
        event.preventDefault();
        heldKeys.current.add(key);
      } else if (key === 'e' && !event.repeat) {
        event.preventDefault();
        interactAction.current();
      } else if (key === 'r' && !event.repeat) {
        event.preventDefault();
        roverAction.current();
      }
    };
    const keyUp = (event: KeyboardEvent) => heldKeys.current.delete(event.key.toLowerCase());
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', clear);
    window.addEventListener('focus', clear);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', clear);
      window.removeEventListener('focus', clear);
    };
  }, []);

  useEffect(() => {
    if (interactRequested === undefined || interactRequested === lastInteractionRequest.current) return;
    lastInteractionRequest.current = interactRequested;
    interactAction.current();
  }, [interactRequested]);

  useFrame((_, delta) => {
    const safeDelta = Math.min(Math.max(Number.isFinite(delta) ? delta : 0, 0), 0.05);
    for (const region of REGION_ORDER) {
      const pose = finitePose(stateRef.current.rovers[region], { x: REGION_CENTERS[region][0] + 8, z: REGION_CENTERS[region][1] + 8, heading: 0 });
      const previous = previousRoverPositions.current[region];
      if (previous) roverTravel.current[region] += Math.hypot(pose.x - previous[0], pose.z - previous[1]);
      previousRoverPositions.current[region] = [pose.x, pose.z];
    }
    if (pausedRef.current || safeDelta <= 0) return;
    const current = stateRef.current;
    const controlledRover = current.activeRover;
    const keyboard = heldKeys.current;
    const controlledInput = inputRef.current;
    let x = Number.isFinite(controlledInput?.x) ? controlledInput?.x ?? 0 : 0;
    let z = Number.isFinite(controlledInput?.z) ? controlledInput?.z ?? 0 : 0;
    let sprint = Boolean(controlledInput?.sprint);
    if (Math.hypot(x, z) < 0.001) {
      x = (keyboard.has('d') || keyboard.has('arrowright') ? 1 : 0) - (keyboard.has('a') || keyboard.has('arrowleft') ? 1 : 0);
      z = (keyboard.has('s') || keyboard.has('arrowdown') ? 1 : 0) - (keyboard.has('w') || keyboard.has('arrowup') ? 1 : 0);
      sprint = keyboard.has('shift');
    }
    const magnitude = Math.hypot(x, z);
    if (!Number.isFinite(magnitude) || magnitude < 0.001) return;
    const normalizedX = x / magnitude;
    const normalizedZ = z / magnitude;
    const pose = controlledRover
      ? finitePose(current.rovers[controlledRover], { x: REGION_CENTERS[controlledRover][0] + 8, z: REGION_CENTERS[controlledRover][1] + 8, heading: 0 })
      : finitePose(current.leo, { x: REGION_CENTERS.dust[0], z: REGION_CENTERS.dust[1], heading: 0 });
    const speed = controlledRover ? (sprint ? 14 : 9) : (sprint ? 7.5 : 4.5);
    const heading = Math.atan2(normalizedX, normalizedZ);
    const next = constrainMove(pose, { x: pose.x + normalizedX * speed * safeDelta, z: pose.z + normalizedZ * speed * safeDelta, heading }, controlledRover ? ROVER_RADIUS : LEO_RADIUS);
    if (!canOccupy(next.x, next.z, controlledRover ? ROVER_RADIUS : LEO_RADIUS)) return;
    const travel = Math.hypot(next.x - pose.x, next.z - pose.z);
    if (travel <= MOVE_EPSILON) return;
    if (controlledRover) {
      steering.current[controlledRover] = THREE.MathUtils.clamp(normalizedX * 0.28, -0.4, 0.4);
      dispatchRef.current({ type: 'MOVE', actor: controlledRover, pose: next });
    } else {
      dispatchRef.current({ type: 'MOVE', actor: 'leo', pose: next });
    }
  });

  const leoPose = finitePose(state.leo, { x: REGION_CENTERS.dust[0], z: REGION_CENTERS.dust[1], heading: 0 });
  const companionPose: Pose = { x: leoPose.x + 1.3, z: leoPose.z + 1.6, heading: leoPose.heading };

  return (
    <group name="mission-world" dispose={null}>
      <CameraDirector state={state} surveyCamera={surveyCamera} onSurveyCameraChange={onSurveyCameraChange} />
      <color attach="background" args={['#080e16']} />
      <fog attach="fog" args={['#080e16', 340, 680]} />
      <ambientLight intensity={0.72} color="#b5c6d4" />
      <directionalLight castShadow={state.settings.quality === 'high'} color="#d5e5ff" intensity={1.8} position={[65, 110, -45]} shadow-mapSize={state.settings.quality === 'high' ? [2048, 2048] : undefined} shadow-camera-left={-320} shadow-camera-right={320} shadow-camera-top={320} shadow-camera-bottom={-320} />
      <Terrain />
      <RouteLines />
      <InstancedRockField />
      <LakeSurveyMarkers />
      {REGIONS.map((region: RegionDefinition) => <RegionLandforms key={region.id} region={region.id} center={region.center} />)}
      {REGION_ORDER.map(region => {
        const center = REGION_CENTERS[region];
        const ground = sampleGround(center[0], center[1]);
        const habitatOffset: [number, number, number] | undefined = region === 'lake'
          ? [-15, sampleGround(center[0] - 15, center[1] - 12) - ground, -12]
          : undefined;
        return <FieldCamp
          key={region}
          region={region}
          position={[center[0], ground, center[1]]}
          habitatOffset={habitatOffset}
          base={state.bases[region] ?? EMPTY_BASE}
          survey={state.surveys[region] ?? EMPTY_SURVEY}
        />;
      })}
      <InteractionMarkers state={state} />
      {REGION_ORDER.map(region => {
        const center = REGION_CENTERS[region];
        const pose = finitePose(state.rovers[region], { x: center[0] + 8, z: center[1] + 8, heading: 0 });
        return <RoverVisual key={region} pose={pose} wheelTravel={roverTravel.current[region]} steering={steering.current[region]} survey={state.surveys[region] ?? EMPTY_SURVEY} active={state.activeRover === region} />;
      })}
      <LeoAstronaut pose={leoPose} paused={paused} roverControlled={state.activeRover !== null} />
      <SolCompanion pose={companionPose} groundY={sampleGround(companionPose.x, companionPose.z)} heading={leoPose.heading} paused={paused} />
    </group>
  );
}

export function MissionWorld(props: MissionWorldProps) {
  const highQuality = props.state.settings.quality === 'high';
  return (
    <Canvas
      shadows={highQuality}
      dpr={highQuality ? [1, 1.5] : 1}
      camera={{ position: [0, 115, 155], fov: 54, near: 0.1, far: 900 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <MissionWorldScene {...props} />
    </Canvas>
  );
}

export default MissionWorld;
export { REGION_CENTERS, MAIN_ROUTES, sampleGround, constrainMove, nearestInteraction };
export type { RouteSegment };
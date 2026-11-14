import type {} from '@react-three/fiber';
import * as THREE from 'three';
import { realMaterials as m } from './materials';
import { WHEEL_RADIUS, finiteHeading, finitePosition, getSuspensionAngles, getWheelRotation } from './roverMotion';

export interface RealRoverCraftProps {
  position?: [number, number, number];
  heading?: number;
  /** Signed cumulative accepted travel in authored units, not speed or elapsed time. */
  wheelTravel?: number;
  steering?: number;
  rocker?: [number, number];
  bogie?: [number, number];
  mastYaw?: number;
  armPose?: 'stowed' | 'inspect';
}
type Point = [number, number, number];
function Link({ from, to, radius = 0.035, material = m.frame }: {
  from: Point; to: Point; radius?: number; material?: THREE.MeshStandardMaterial;
}) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), direction = b.clone().sub(a);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={a.add(b).multiplyScalar(0.5)} quaternion={quaternion} material={material} castShadow>
    <cylinderGeometry args={[radius, radius, direction.length(), 8]} />
  </mesh>;
}
function Joint({ position = [0, 0, 0], radius = 0.105 }: { position?: Point; radius?: number }) {
  return <mesh position={position} rotation={[0, 0, Math.PI / 2]} material={m.dark} castShadow><cylinderGeometry args={[radius, radius, 0.11, 10]} /></mesh>;
}

/** One shared grouser mesh per wheel: 48 shallow, gently curved transverse metal ribs. */
function grouserGeometry() {
  const positions: number[] = [];
  const normal = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
  for (let rib = 0; rib < 48; rib++) {
    const baseAngle = rib * Math.PI / 24;
    for (let segment = 0; segment < 4; segment++) {
      const point = (s: number) => {
        const x = -0.095 + 0.19 * s, angle = baseAngle + 0.065 * Math.cos((s - 0.5) * Math.PI);
        return new THREE.Vector3(x, 0.2665 * Math.cos(angle), 0.2665 * Math.sin(angle));
      };
      const a = point(segment / 4), b = point((segment + 1) / 4), direction = b.clone().sub(a);
      const rotation = new THREE.Quaternion().setFromUnitVectors(yAxis, direction.clone().normalize());
      const piece = new THREE.BoxGeometry(0.007, direction.length() + 0.001, 0.007).toNonIndexed();
      const data = piece.getAttribute('position'), midpoint = a.add(b).multiplyScalar(0.5);
      for (let i = 0; i < data.count; i++) positions.push(...normal.fromBufferAttribute(data, i).applyQuaternion(rotation).add(midpoint).toArray());
      piece.dispose();
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals();
  return geometry;
}
const grousers = grouserGeometry();
const band = new THREE.CylinderGeometry(WHEEL_RADIUS - 0.008, WHEEL_RADIUS - 0.008, 0.19, 32, 1, true);
band.rotateZ(Math.PI / 2);

function Wheel({ position, steering = 0, roll }: { position: Point; steering?: number; roll: number }) {
  return <group name="steering-knuckle" position={position} rotation={[0, steering, 0]}>
    <group name="rolling-wheel" rotation={[roll, 0, 0]}>
      <mesh geometry={band} material={m.wheelMetal} castShadow receiveShadow />
      <mesh geometry={grousers} material={m.frame} castShadow />
      {[-1, 1].map(face => <group key={face} position={[face * 0.098, 0, 0]}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={m.frame} castShadow><torusGeometry args={[0.244, 0.011, 5, 32]} /></mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.shellShade} castShadow><cylinderGeometry args={[0.075, 0.075, 0.026, 10]} /></mesh>
        {Array.from({ length: 6 }, (_, i) => {
          const a = i * Math.PI / 3;
          const from: Point = [0, 0.075 * Math.cos(a), 0.075 * Math.sin(a)];
          const bend: Point = [0, 0.16 * Math.cos(a + 0.32), 0.16 * Math.sin(a + 0.32)];
          const to: Point = [0, 0.24 * Math.cos(a + 0.13), 0.24 * Math.sin(a + 0.13)];
          return <group key={i}><Link from={from} to={bend} radius={0.009} /><Link from={bend} to={to} radius={0.009} /></group>;
        })}
        <mesh position={[face * 0.022, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.dark}><cylinderGeometry args={[0.043, 0.043, 0.032, 8]} /></mesh>
      </group>)}
    </group>
  </group>;
}
function Suspension({ side, rocker, bogie, steering, roll }: {
  side: number; rocker: number; bogie: number; steering: number; roll: number;
}) {
  const front: Point = [side * 0.13, -0.42, 0.87];
  const pivot: Point = [0, -0.1, -0.43];
  const middle: Point = [side * 0.13, -0.32, 0.28], rear: Point = [side * 0.13, -0.32, -0.62];
  return <group name={side < 0 ? 'suspension-minus-x' : 'suspension-plus-x'} position={[side * 1.02, 0.69, 0.15]} rotation={[rocker, 0, 0]}>
    <Joint radius={0.12} />
    <Link from={[-side * 0.31, 0, 0]} to={[0, 0, 0]} radius={0.055} />
    <Link from={[0, 0, 0]} to={front} radius={0.05} />
    <Link from={[0, 0, 0]} to={pivot} radius={0.047} />
    <Joint position={front} radius={0.075} />
    <Wheel position={front} steering={steering} roll={roll} />
    <group name="bogie-pivot" position={pivot} rotation={[bogie, 0, 0]}>
      <Joint radius={0.095} />
      <Link from={[0, 0, 0]} to={middle} radius={0.043} /><Link from={[0, 0, 0]} to={rear} radius={0.043} />
      <Wheel position={middle} roll={roll} /><Wheel position={rear} steering={-steering} roll={roll} />
    </group>
  </group>;
}
function Camera({ position, radius = 0.052 }: { position: Point; radius?: number }) {
  return <group position={position} rotation={[Math.PI / 2, 0, 0]}>
    <mesh material={m.dark} castShadow><cylinderGeometry args={[radius + 0.018, radius + 0.018, 0.07, 12]} /></mesh>
    <mesh position={[0, 0.043, 0]} material={m.optics}><cylinderGeometry args={[radius, radius, 0.016, 12]} /></mesh>
  </group>;
}
function Arm({ inspect }: { inspect: boolean }) {
  return <group name="tool-arm" position={[0.48, 0.77, 0.99]}>
    <mesh material={m.dark} castShadow><boxGeometry args={[0.27, 0.25, 0.26]} /></mesh>
    <group name="shoulder" rotation={[inspect ? -0.2 : 0.12, 0, inspect ? -0.13 : 0.2]}>
      <Joint radius={0.13} />
      <Link from={[0, 0, 0]} to={[0, 0, 0.77]} radius={0.055} material={m.shellShade} />
      <Link from={[0.055, 0.06, 0.04]} to={[0.055, 0.06, 0.73]} radius={0.015} material={m.dark} />
      <group name="elbow" position={[0, 0, 0.77]} rotation={[inspect ? 0.65 : 2.7, 0, 0]}>
        <Joint radius={0.115} /><Link from={[0, 0, 0]} to={[0, 0, 0.72]} radius={0.047} material={m.shellShade} />
        <group name="wrist-and-turret" position={[0, 0, 0.72]} rotation={[inspect ? 0.2 : -0.25, 0, 0]}>
          <Joint radius={0.09} />
          <mesh rotation={[Math.PI / 2, 0, 0]} material={m.shellShade} castShadow><cylinderGeometry args={[0.235, 0.235, 0.25, 10]} /></mesh>
          <mesh position={[0, 0, 0.145]} material={m.dark} castShadow><boxGeometry args={[0.29, 0.29, 0.06]} /></mesh>
          <mesh position={[-0.13, -0.09, 0.18]} material={m.frame} castShadow><cylinderGeometry args={[0.055, 0.055, 0.21, 10]} /></mesh>
          <mesh position={[0.12, 0.07, 0.19]} material={m.foil}><boxGeometry args={[0.13, 0.14, 0.08]} /></mesh>
          <Camera position={[0.08, -0.09, 0.21]} radius={0.035} />
        </group>
      </group>
    </group>
  </group>;
}

/** Procedural Perseverance-informed hardware, not a flight-hardware replica. */
export function RealRoverCraft({
  position = [0, 0, 0], heading = 0, wheelTravel = 0, steering = 0,
  rocker = [0, 0], bogie = [0, 0], mastYaw = 0, armPose = 'stowed',
}: RealRoverCraftProps) {
  const angles = getSuspensionAngles(rocker, bogie, steering), roll = getWheelRotation(wheelTravel);
  return <group name="RealRoverCraft" position={finitePosition(position)} rotation={[0, finiteHeading(heading), 0]}>
    <group name="layered-equipment-deck">
      <mesh position={[0, 0.6, 0]} material={m.dark} castShadow><boxGeometry args={[1.35, 0.14, 1.95]} /></mesh>
      <mesh position={[0, 0.84, 0]} material={m.shell} castShadow receiveShadow><boxGeometry args={[1.5, 0.37, 2.02]} /></mesh>
      <mesh position={[0, 1.045, -0.03]} material={m.dark} castShadow><boxGeometry args={[1.62, 0.07, 2.14]} /></mesh>
      <mesh position={[0, 1.095, -0.03]} material={m.shellShade} castShadow><boxGeometry args={[1.5, 0.035, 2.03]} /></mesh>
      {[-1, 1].map(side => <group key={side}>
        <mesh position={[side * 0.756, 0.84, -0.08]} material={m.foil} castShadow><boxGeometry args={[0.022, 0.23, 1.14]} /></mesh>
        {[-0.6, 0.4].map(z => <mesh key={z} position={[side * 0.773, 0.84, z]} material={m.frame}><boxGeometry args={[0.026, 0.32, 0.035]} /></mesh>)}
        <Link from={[side * 0.64, 1.15, -0.65]} to={[side * 0.64, 1.15, 0.55]} radius={0.018} />
        <mesh position={[side * 0.54, 0.79, 1.025]} material={m.dark} castShadow><boxGeometry args={[0.2, 0.17, 0.07]} /></mesh>
        <Camera position={[side * 0.54, 0.8, 1.08]} radius={0.035} />
      </group>)}
      <mesh position={[0.2, 1.17, -0.21]} material={m.shell} castShadow><boxGeometry args={[0.48, 0.12, 0.52]} /></mesh>
      <mesh position={[-0.1, 1.14, -0.65]} material={m.dark} castShadow><boxGeometry args={[0.42, 0.07, 0.33]} /></mesh>
    </group>
    {[-1, 1].map((side, i) => <Suspension key={side} side={side} rocker={angles.rocker[i]} bogie={angles.bogie[i]} steering={angles.steering} roll={roll} />)}
    <group name="mast-and-separated-camera-tiers" position={[-0.39, 1.12, 0.52]}>
      <mesh position={[0, 0.04, 0]} material={m.dark} castShadow><cylinderGeometry args={[0.13, 0.15, 0.08, 10]} /></mesh>
      <mesh position={[0, 0.43, 0]} material={m.shellShade} castShadow><cylinderGeometry args={[0.044, 0.055, 0.77, 10]} /></mesh>
      <Link from={[-0.06, 0.1, -0.04]} to={[-0.06, 0.78, -0.04]} radius={0.014} material={m.dark} />
      <group name="targeted-camera-head" position={[0, 0.87, 0]} rotation={[0, finiteHeading(mastYaw), 0]}>
        <mesh position={[0, 0.115, 0]} material={m.shell} castShadow><boxGeometry args={[0.36, 0.25, 0.24]} /></mesh>
        <mesh position={[0, 0.115, 0.13]} material={m.dark}><boxGeometry args={[0.29, 0.19, 0.04]} /></mesh>
        <Camera position={[0.045, 0.13, 0.17]} radius={0.073} />
        {[-1, 1].map(side => <group key={side}>
          <mesh position={[side * 0.2, -0.09, 0.015]} material={m.shellShade} castShadow><boxGeometry args={[0.2, 0.14, 0.22]} /></mesh>
          <Camera position={[side * 0.2, -0.09, 0.15]} radius={0.049} />
          <mesh position={[side * 0.37, -0.065, 0.01]} material={m.shell} castShadow><boxGeometry args={[0.1, 0.12, 0.14]} /></mesh>
          <Camera position={[side * 0.37, -0.065, 0.11]} radius={0.026} />
        </group>)}
      </group>
    </group>
    <Arm inspect={armPose === 'inspect'} />
    <group name="aft-thermal-core" position={[0, 0.93, -1.34]}>
      <Link from={[0, -0.2, 0.37]} to={[0, -0.2, 0]} radius={0.07} />
      <group rotation={[0.25, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.dark} castShadow><cylinderGeometry args={[0.18, 0.18, 0.54, 12]} /></mesh>
        {Array.from({ length: 8 }, (_, i) => <group key={i} rotation={[0, 0, i * Math.PI / 4]}>
          <mesh position={[0, 0.27, 0]} material={m.frame} castShadow><boxGeometry args={[0.022, 0.25, 0.51]} /></mesh>
        </group>)}
        {[-0.29, 0.29].map(z => <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} material={m.foil} castShadow><cylinderGeometry args={[0.185, 0.185, 0.026, 12]} /></mesh>)}
      </group>
    </group>
    <group name="fixed-high-gain-antenna" position={[0.42, 1.13, -0.66]}>
      <Link from={[0, 0, 0]} to={[0, 0.22, 0]} radius={0.028} />
      <group position={[0, 0.26, 0]} rotation={[0.4, 0, -0.18]}>
        <mesh material={m.foil} castShadow><cylinderGeometry args={[0.235, 0.235, 0.035, 6]} /></mesh>
        <Link from={[0, 0.02, 0]} to={[0, 0.19, 0]} radius={0.012} />
        <mesh position={[0, 0.2, 0]} material={m.dark}><sphereGeometry args={[0.025, 8, 6]} /></mesh>
      </group>
    </group>
  </group>;
}

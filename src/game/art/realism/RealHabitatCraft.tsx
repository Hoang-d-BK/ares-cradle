import type {} from '@react-three/fiber';
import * as THREE from 'three';
import { realMaterials as m } from './materials';

export interface RealHabitatCraftProps {
  position?: [number, number, number];
  heading?: number;
  /** Small observation pane only; no habitat systems or progression authority. */
  lit?: boolean;
}

type Point = [number, number, number];
const SHELL_RADIUS = 3.45;
const BASE_Y = 0.28;

/** Clip actual geodesic triangles at the equator; never bury a full polyhedron. */
function upperShell() {
  const source = new THREE.IcosahedronGeometry(SHELL_RADIUS, 2);
  const attribute = source.getAttribute('position');
  const positions: number[] = [];
  const edgeMap = new Map<string, [THREE.Vector3, THREE.Vector3]>();
  const vertexKey = (v: THREE.Vector3) => v.toArray().map(n => n.toFixed(5)).join(',');
  const addTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    const normal = b.clone().sub(a).cross(c.clone().sub(a));
    if (normal.lengthSq() < 1e-12) return; // Equator vertices can repeat after clipping.
    if (normal.dot(a.clone().add(b).add(c)) < 0) positions.push(...a.toArray(), ...c.toArray(), ...b.toArray());
    else positions.push(...a.toArray(), ...b.toArray(), ...c.toArray());
  };
  for (let i = 0; i < attribute.count; i += 3) {
    const triangle = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(attribute, i + j));
    const polygon: THREE.Vector3[] = [];
    for (let j = 0; j < 3; j++) {
      const a = triangle[j], b = triangle[(j + 1) % 3];
      if (a.y >= 0) polygon.push(a.clone());
      if ((a.y >= 0) !== (b.y >= 0)) polygon.push(a.clone().lerp(b, -a.y / (b.y - a.y)).setY(0));
    }
    if (polygon.length < 3) continue;
    for (let j = 1; j < polygon.length - 1; j++) addTriangle(polygon[0], polygon[j], polygon[j + 1]);
    for (let j = 0; j < polygon.length; j++) {
      const a = polygon[j], b = polygon[(j + 1) % polygon.length];
      if (a.distanceToSquared(b) < 1e-10) continue;
      const keys = [vertexKey(a), vertexKey(b)].sort();
      edgeMap.set(keys.join('|'), [a.clone(), b.clone()]);
    }
  }
  source.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();

  // One shared low-sided seam mesh; thin construction joints, not a wireframe overlay.
  const seamPositions: number[] = [];
  for (const [start, end] of edgeMap.values()) {
    const a = start.clone().multiplyScalar(1.001), b = end.clone().multiplyScalar(1.001);
    const direction = b.clone().sub(a);
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    const tube = new THREE.CylinderGeometry(0.014, 0.014, direction.length(), 5, 1, true).toNonIndexed();
    const data = tube.getAttribute('position');
    const centre = a.add(b).multiplyScalar(0.5);
    for (let i = 0; i < data.count; i++) seamPositions.push(...new THREE.Vector3().fromBufferAttribute(data, i).applyQuaternion(rotation).add(centre).toArray());
    tube.dispose();
  }
  const seams = new THREE.BufferGeometry();
  seams.setAttribute('position', new THREE.Float32BufferAttribute(seamPositions, 3));
  seams.computeVertexNormals();
  return { geometry, seams };
}
const shell = upperShell();

function Beam({ from, to, radius = 0.035, material = m.frame }: {
  from: Point; to: Point; radius?: number; material?: THREE.MeshStandardMaterial;
}) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), direction = b.clone().sub(a);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={a.add(b).multiplyScalar(0.5)} quaternion={quaternion} material={material} castShadow>
    <cylinderGeometry args={[radius, radius, direction.length(), 6]} />
  </mesh>;
}
const coordinate = (value: number) => Number.isFinite(value) ? Math.max(-1e6, Math.min(1e6, value)) : 0;

/** HI-SEAS-informed shell; vestibule/access are fictional game adaptations, not a replica. */
export function RealHabitatCraft({ position = [0, 0, 0], heading = 0, lit = false }: RealHabitatCraftProps) {
  const root: Point = [coordinate(position[0]), coordinate(position[1]), coordinate(position[2])];
  const yaw = Number.isFinite(heading) ? heading % (Math.PI * 2) : 0;
  const run = 2.05, drop = 0.2, slope = Math.atan2(drop, run);
  const panelDirection = new THREE.Vector3(0.48, 0.44, 0.76).normalize();
  const paneQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), panelDirection);
  const panePosition = panelDirection.clone().multiplyScalar(SHELL_RADIUS + 0.018).add(new THREE.Vector3(0, BASE_Y, 0));
  return <group name="RealHabitatCraft" position={root} rotation={[0, yaw, 0]}>
    <group name="compact-foundation">
      <mesh position={[0, 0.105, 0]} material={m.shellShade} castShadow receiveShadow><cylinderGeometry args={[3.49, 3.57, 0.21, 24]} /></mesh>
      <mesh position={[0, 0.24, 0]} material={m.seam} castShadow><cylinderGeometry args={[3.46, 3.49, 0.08, 24]} /></mesh>
      {Array.from({ length: 8 }, (_, i) => <group key={i} rotation={[0, i * Math.PI / 4, 0]}>
        <mesh position={[0, 0.065, 3.43]} material={m.frame} castShadow receiveShadow><boxGeometry args={[0.32, 0.13, 0.4]} /></mesh>
      </group>)}
    </group>
    <group name="geodesic-shell" position={[0, BASE_Y, 0]}>
      <mesh geometry={shell.geometry} material={m.shell} castShadow receiveShadow />
      <mesh geometry={shell.seams} material={m.seam} castShadow />
    </group>
    <group name="small-observation-opening" position={panePosition} quaternion={paneQuaternion}>
      <mesh material={m.seam} castShadow><circleGeometry args={[0.37, 20]} /></mesh>
      <mesh position={[0, 0, 0.013]} material={m.frame} castShadow><torusGeometry args={[0.305, 0.036, 6, 20]} /></mesh>
      <mesh position={[0, 0, 0.018]} material={lit ? m.amber : m.glass}><circleGeometry args={[0.27, 20]} /></mesh>
    </group>

    <group name="entry-vestibule">
      <mesh position={[0, 1.3, 3.22]} material={m.shellShade} castShadow receiveShadow><boxGeometry args={[1.84, 2.12, 1.12]} /></mesh>
      <mesh position={[0, 2.39, 3.29]} material={m.shell} castShadow><boxGeometry args={[1.98, 0.09, 1.3]} /></mesh>
      {[-0.81, 0.81].map(x => <mesh key={x} position={[x, 1.27, 3.82]} material={m.frame} castShadow><boxGeometry args={[0.17, 2.06, 0.18]} /></mesh>)}
      <mesh position={[0, 2.26, 3.82]} material={m.frame} castShadow><boxGeometry args={[1.75, 0.17, 0.18]} /></mesh>
      <mesh name="closed-hatch" position={[0, 1.25, 3.79]} material={m.shell} castShadow><boxGeometry args={[1.42, 1.91, 0.09]} /></mesh>
      <mesh position={[0, 1.25, 3.846]} material={m.seam}><boxGeometry args={[1.29, 1.78, 0.015]} /></mesh>
      <mesh position={[0, 1.25, 3.862]} material={m.shell}><boxGeometry args={[1.22, 1.71, 0.015]} /></mesh>
      <mesh position={[0, 1.72, 3.88]} material={m.seam}><boxGeometry args={[0.5, 0.36, 0.018]} /></mesh>
      <mesh position={[0, 1.72, 3.893]} material={lit ? m.amber : m.glass}><boxGeometry args={[0.42, 0.28, 0.014]} /></mesh>
      <Beam from={[0.46, 1.02, 3.91]} to={[0.46, 1.31, 3.91]} radius={0.024} material={m.dark} />
      {[0.68, 1.87].map(y => <mesh key={y} position={[-0.74, y, 3.93]} material={m.dark}><boxGeometry args={[0.1, 0.19, 0.09]} /></mesh>)}
      <mesh position={[0, 2.4, 3.96]} material={m.dark} castShadow><boxGeometry args={[0.62, 0.09, 0.2]} /></mesh>
      <mesh position={[0, 2.365, 4.07]} material={m.amber}><boxGeometry args={[0.45, 0.025, 0.025]} /></mesh>
      <mesh name="landing-and-threshold" position={[0, 0.21, 3.87]} material={m.frame} castShadow receiveShadow><boxGeometry args={[1.88, 0.06, 0.78]} /></mesh>
    </group>
    <group name="access-ramp">
      <mesh position={[0, 0.12, 4.26 + run / 2]} rotation={[slope, 0, 0]} material={m.dark} castShadow receiveShadow><boxGeometry args={[1.68, 0.04, Math.hypot(run, drop)]} /></mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const z = 0.16 + i * 0.21;
        return <mesh key={i} position={[0, 0.247 - drop * z / run, 4.26 + z]} rotation={[slope, 0, 0]} material={m.frame} receiveShadow><boxGeometry args={[1.57, 0.012, 0.028]} /></mesh>;
      })}
      {[-0.88, 0.88].map(x => <group key={x}>
        <mesh position={[x, 0.13, 5.285]} rotation={[slope, 0, 0]} material={m.frame} castShadow><boxGeometry args={[0.045, 0.06, Math.hypot(run, drop)]} /></mesh>
        {[0, 1.03, run].map(z => {
          const top = 0.24 - drop * z / run;
          return <group key={z}>
            <Beam from={[x, Math.max(0.02, top - 0.04), 4.26 + z]} to={[x, top + 0.68, 4.26 + z]} radius={0.022} />
            {z < run && <mesh position={[x, Math.max(0.02, top / 2), 4.26 + z]} material={m.frame} receiveShadow><boxGeometry args={[0.12, Math.max(0.04, top), 0.12]} /></mesh>}
          </group>;
        })}
        <Beam from={[x, 0.92, 4.26]} to={[x, 0.72, 6.31]} radius={0.027} />
      </group>)}
    </group>
    <group name="connected-service-equipment" position={[-3.63, 0, -0.45]}>
      <mesh position={[0, 0.07, 0]} material={m.frame} receiveShadow><boxGeometry args={[0.95, 0.14, 0.8]} /></mesh>
      <mesh position={[0, 0.65, 0]} material={m.shellShade} castShadow><boxGeometry args={[0.78, 1.02, 0.65]} /></mesh>
      <mesh position={[0, 1.19, 0]} material={m.shell} castShadow><boxGeometry args={[0.89, 0.08, 0.74]} /></mesh>
      <mesh position={[0, 0.66, 0.335]} material={m.dark}><boxGeometry args={[0.6, 0.74, 0.025]} /></mesh>
      {[0, 1, 2, 3].map(i => <mesh key={i} position={[0, 0.45 + i * 0.14, 0.36]} material={m.frame}><boxGeometry args={[0.51, 0.022, 0.045]} /></mesh>)}
      <Beam from={[0.4, 0.33, 0]} to={[0.8, 0.33, 0]} radius={0.035} />
      <Beam from={[0.8, 0.33, 0]} to={[0.8, 0.4, 0]} radius={0.035} />
    </group>
    <group name="fixed-local-dish" position={[-2.4, 0, -2.65]}>
      <mesh position={[0, 0.06, 0]} material={m.frame} receiveShadow><cylinderGeometry args={[0.27, 0.36, 0.12, 8]} /></mesh>
      <Beam from={[0, 0.12, 0]} to={[0, 2.1, 0]} radius={0.037} />
      <group position={[0, 2.12, 0]} rotation={[0.7, 0, -0.2]}>
        <mesh material={m.shell} castShadow><cylinderGeometry args={[0.48, 0.08, 0.12, 12]} /></mesh>
        <Beam from={[0, 0.06, 0]} to={[0, 0.36, 0]} radius={0.015} />
        <mesh position={[0, 0.37, 0]} material={m.dark}><sphereGeometry args={[0.04, 8, 6]} /></mesh>
      </group>
    </group>
  </group>;
}

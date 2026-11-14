import { realMaterials as m } from '../../art/realism/materials';
import type { Pose } from '../contract';

export interface SolCompanionProps {
  pose: Pose;
  groundY: number;
  heading?: number;
  paused: boolean;
}

/** Approximate static local body envelope: 1.2 wide × 1.25 tall × 1.1 deep. */
export const SOL_COMPANION_LOCAL_ENVELOPE = Object.freeze({ minX: -0.62, maxX: 0.62, minY: 0, maxY: 1.25, minZ: -0.55, maxZ: 0.55 });

/** Static, pose-owned companion; no autonomous motion or state writes. */
export function SolCompanion({ pose, groundY, heading }: SolCompanionProps) {
  const x = Number.isFinite(pose.x) ? pose.x : 0;
  const z = Number.isFinite(pose.z) ? pose.z : 0;
  const y = Number.isFinite(groundY) ? groundY : 0;
  const yaw = Number.isFinite(heading ?? pose.heading) ? (heading ?? pose.heading) : 0;
  return <group name="SolCompanion" position={[x, y, z]} rotation={[0, yaw, 0]}>
    <group name="dusty-two-wheel-rover">
      {/* Two large side wheels sit on the supplied ground plane. */}
      {[-0.43, 0.43].map((wheelX) => <group key={wheelX} position={[wheelX, 0.29, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.wheelMetal} castShadow receiveShadow>
          <cylinderGeometry args={[0.29, 0.29, 0.16, 10]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.seam}>
          <cylinderGeometry args={[0.12, 0.12, 0.172, 8]} />
        </mesh>
      </group>)}
      <mesh name="low-rover-chassis" position={[0, 0.48, 0]} material={m.dark} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.22, 0.78]} />
      </mesh>
      <mesh name="dusty-equipment-deck" position={[0, 0.67, -0.02]} material={m.shellShade} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.2, 0.58]} />
      </mesh>
      <mesh name="front-camera-mast" position={[0, 0.94, 0.2]} material={m.frame} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.42, 6]} />
      </mesh>
      <group name="camera-head" position={[0, 1.13, 0.2]}>
        <mesh material={m.shell} castShadow><boxGeometry args={[0.34, 0.2, 0.24]} /></mesh>
        <mesh name="forward-optics" position={[0, -0.005, 0.127]} material={m.optics}>
          <circleGeometry args={[0.073, 10]} />
        </mesh>
        <mesh position={[-0.115, 0.1, 0]} material={m.amber}><sphereGeometry args={[0.025, 6, 4]} /></mesh>
        <mesh position={[0.115, 0.1, 0]} material={m.amber}><sphereGeometry args={[0.025, 6, 4]} /></mesh>
      </group>
      <mesh name="rear-instrument-pack" position={[0, 0.77, -0.3]} material={m.foil} castShadow>
        <boxGeometry args={[0.38, 0.22, 0.22]} />
      </mesh>
    </group>
  </group>;
}

export default SolCompanion;

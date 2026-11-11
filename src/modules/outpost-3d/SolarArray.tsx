import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Phase 13.1: Photovoltaic Solar Array with Active Heliotropic Sun Tracking
 * Calculates solar incidence angle based on real Sol hour (0h-24h).
 * Actively pivots the array perpendicular to the solar vector to maximize absorption.
 */
export const SolarArray: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const panelsRef = useRef<THREE.Group>(null);
  const dustMeshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [cleanFeedback, setCleanFeedback] = useState(0);

  const dustCoverage = useOutpostStore((state) => state.dustCoverage);
  const cleanDust = useOutpostStore((state) => state.cleanDust);
  const solTime = useOutpostStore((state) => state.solTime);
  const solPhase = useOutpostStore((state) => state.solPhase);

  useFrame((_, delta) => {
    // Synchronized with SIM_CONSTANTS: 0 to 32s is daytime, 32 to 60s is night
    const cycleTime = ((solTime % 60) + 60) % 60;
    if (panelsRef.current) {
      if (cycleTime < 32) {
        const dayProgress = cycleTime / 32; // 0.0 (sunrise) to 1.0 (sunset)
        // Heliotropic tilt: Track sun azimuth from East (-0.65 rad) to West (+0.65 rad)
        const targetAzimuth = -0.65 + dayProgress * 1.30;
        
        // Solar elevation zenith pitch: flat at noon, tilted at sunrise/sunset
        const elevationProgress = Math.sin(dayProgress * Math.PI);
        const targetPitch = -0.25 - (1 - elevationProgress) * 0.35;

        panelsRef.current.rotation.y = THREE.MathUtils.lerp(
          panelsRef.current.rotation.y,
          targetAzimuth,
          delta * 2.5
        );
        panelsRef.current.rotation.x = THREE.MathUtils.lerp(
          panelsRef.current.rotation.x,
          targetPitch,
          delta * 2.5
        );
      } else {
        // Nighttime safe stow position
        panelsRef.current.rotation.y = THREE.MathUtils.lerp(panelsRef.current.rotation.y, 0, delta * 1.0);
        panelsRef.current.rotation.x = THREE.MathUtils.lerp(panelsRef.current.rotation.x, -0.2, delta * 1.0);
      }
    }

    // Decay cleaning click haptic bounce
    if (cleanFeedback > 0) {
      setCleanFeedback((prev) => Math.max(0, prev - delta * 4));
      if (groupRef.current) {
        groupRef.current.position.y = 0 + Math.sin(cleanFeedback * Math.PI) * 0.12;
      }
    } else if (groupRef.current) {
      groupRef.current.position.y = 0;
    }

    // Dynamic dust layer opacity and color
    if (dustMeshRef.current && (dustMeshRef.current.material as THREE.MeshStandardMaterial)) {
      const mat = dustMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, Math.min(0.92, dustCoverage * 0.95), delta * 5.0);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    cleanDust();
    setCleanFeedback(1.0);
  };

  const isNight = solPhase === 'Night';

  return (
    <group
      ref={groupRef}
      position={[-4.5, 0, 1.4]}
      rotation={[0, 0.3, 0]}
    >
      {/* Heavy Base Anchor Footing */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.12, 16]} />
        <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Main Mast & Motor Pivot Housing */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 1.4, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Motor Gearbox Cylinder */}
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 16]} />
        <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Rotating Solar Panel Assembly */}
      <group
        ref={panelsRef}
        position={[0, 1.05, 0]}
        rotation={[-0.38, 0, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Support Cross-Truss Frame */}
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[3.8, 0.08, 0.15]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[0.15, 0.08, 2.0]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Photovoltaic Silicon Substrate (Wing Left) */}
        <mesh position={[-0.95, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.75, 0.05, 1.85]} />
          <meshStandardMaterial
            color="#091326"
            metalness={0.95}
            roughness={0.12}
            emissive="#00F0FF"
            emissiveIntensity={hovered ? 0.35 : isNight ? 0.02 : 0.12}
          />
        </mesh>

        {/* Photovoltaic Silicon Substrate (Wing Right) */}
        <mesh position={[0.95, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.75, 0.05, 1.85]} />
          <meshStandardMaterial
            color="#091326"
            metalness={0.95}
            roughness={0.12}
            emissive="#00F0FF"
            emissiveIntensity={hovered ? 0.35 : isNight ? 0.02 : 0.12}
          />
        </mesh>

        {/* Accumulative Regolith Dust Layer */}
        <mesh
          ref={dustMeshRef}
          position={[0, 0.035, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[3.65, 1.85]} />
          <meshStandardMaterial
            color="#C1440E"
            roughness={1.0}
            metalness={0.0}
            transparent
            opacity={dustCoverage * 0.9}
            depthWrite={false}
          />
        </mesh>

        {/* Efficiency Grid Cells Accent Lines */}
        <gridHelper
          args={[3.7, 12, '#00F0FF', '#1E293B']}
          position={[0, 0.032, 0]}
        />
      </group>
    </group>
  );
};

export default SolarArray;

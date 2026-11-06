import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

export const SolarArray: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const panelsRef = useRef<THREE.Group>(null);
  const dustMeshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [cleanFeedback, setCleanFeedback] = useState(0);

  const dustCoverage = useOutpostStore((state) => state.dustCoverage);
  const cleanDust = useOutpostStore((state) => state.cleanDust);
  const solTime = useOutpostStore((state) => state.solTime);

  useFrame((_, delta) => {
    // Sun tracking tilt during daytime (0 to 32s)
    if (panelsRef.current) {
      if (solTime < 32) {
        const dayProgress = solTime / 32;
        // Tilt subtly from east (-0.5 rad) to west (+0.5 rad)
        const targetTilt = -0.45 + dayProgress * 0.9;
        panelsRef.current.rotation.y = THREE.MathUtils.lerp(
          panelsRef.current.rotation.y,
          targetTilt,
          delta * 2.0
        );
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
        onPointerDown={handleClick}
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
            emissiveIntensity={hovered ? 0.35 : 0.08}
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
            emissiveIntensity={hovered ? 0.35 : 0.08}
          />
        </mesh>

        {/* Interactive Dynamic Dust Accumulator Layer */}
        <mesh
          ref={dustMeshRef}
          position={[0, 0.035, 0]}
        >
          <boxGeometry args={[3.7, 0.01, 1.88]} />
          <meshStandardMaterial
            color="#9E360B"
            roughness={0.98}
            metalness={0.02}
            transparent
            opacity={dustCoverage * 0.9}
          />
        </mesh>

        {/* Silicon Grid Divider Lines (Fine Engineering Polish) */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.06, 0.02, 1.88]} />
          <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[3.7, 0.02, 0.06]} />
          <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Floating Tactical Click Helper for Young Cadets */}
      {dustCoverage > 0.3 && (
        <group position={[0, 2.3, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial
              color="#00F0FF"
              emissive="#00F0FF"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default SolarArray;

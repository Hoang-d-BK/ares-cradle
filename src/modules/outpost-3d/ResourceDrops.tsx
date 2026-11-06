import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';

interface CrystalDef {
  id: number;
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}

const CRYSTAL_NODES: CrystalDef[] = [
  { id: 1, position: [-2.8, -0.25, 4.2], scale: [0.35, 0.65, 0.35], color: '#00F0FF' },
  { id: 2, position: [-2.5, -0.3, 4.5], scale: [0.25, 0.45, 0.25], color: '#00F0FF' },
  { id: 3, position: [5.2, -0.25, 1.8], scale: [0.4, 0.75, 0.4], color: '#FFB020' },
  { id: 4, position: [5.5, -0.3, 2.1], scale: [0.22, 0.42, 0.22], color: '#FFB020' },
  { id: 5, position: [-5.2, -0.25, -2.5], scale: [0.38, 0.7, 0.38], color: '#00F0FF' },
  { id: 6, position: [2.2, -0.25, -4.8], scale: [0.32, 0.6, 0.32], color: '#00F0FF' }
];

/**
 * Task 9.1: Low-Poly Energy Crystals & Mineral Drops
 * Style: Kenney Space Kit CC0 / Minecraft Glow Crystals
 * Material: meshStandardMaterial with flatShading: true & Emissive Radiant Glow
 */
export const ResourceDrops: React.FC = () => {
  const crystalGroupRef = useRef<THREE.Group>(null);
  const triggerCelebration = useOutpostStore((state) => state.triggerCelebration);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (crystalGroupRef.current) {
      crystalGroupRef.current.children.forEach((child, idx) => {
        // Individual crystal levitation & pulse
        child.position.y = (CRYSTAL_NODES[idx]?.position[1] ?? -0.25) + Math.sin(t * 2 + idx) * 0.04;
        child.rotation.y = t * 0.5 + idx * 0.8;
      });
    }
  });

  const handleCollect = (e: any, crystal: CrystalDef) => {
    e.stopPropagation();
    soundEngine.playClick(1400);
    triggerCelebration(
      'ENERGY CRYSTAL HARVESTED!',
      `Cadet Leo extracted raw Martian piezo-electric crystal (+${crystal.color === '#00F0FF' ? 'Power' : 'Mineral'}).`,
      3
    );
  };

  return (
    <group ref={crystalGroupRef} dispose={null}>
      {CRYSTAL_NODES.map((crystal) => (
        <group
          key={crystal.id}
          position={crystal.position}
          onClick={(e) => handleCollect(e, crystal)}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Main Crystal Spire (Octahedron / Bipyramid) */}
          <mesh scale={crystal.scale} castShadow receiveShadow>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={crystal.color}
              emissive={crystal.color}
              emissiveIntensity={1.3}
              roughness={0.15}
              metalness={0.2}
              flatShading
            />
          </mesh>

          {/* Sub-Crystal Shards Base */}
          <mesh position={[0.1, -0.1, 0.05]} scale={[0.15, 0.25, 0.15]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={crystal.color}
              emissive={crystal.color}
              emissiveIntensity={0.9}
              flatShading
            />
          </mesh>

          {/* Bioluminescent Radiant Glow Light */}
          <pointLight
            position={[0, 0.2, 0]}
            color={crystal.color}
            intensity={1.2}
            distance={3.5}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
};

export default ResourceDrops;

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { useStoryStore } from '@/modules/store/useStoryStore';
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
 * Low-Poly Energy Crystals & Mineral Drops
 * Non-blocking instant harvest with sleek top-center toast feedback.
 */
export const ResourceDrops: React.FC = () => {
  const crystalGroupRef = useRef<THREE.Group>(null);
  const [collectedIds, setCollectedIds] = useState<number[]>([]);
  const astronautPos = useOutpostStore((state) => state.playerPos);

  const collectCrystal = (crystal: CrystalDef) => {
    if (collectedIds.includes(crystal.id)) return;

    soundEngine.playCrystalPickup();
    setCollectedIds((prev) => [...prev, crystal.id]);

    if (crystal.color === '#00F0FF') {
      useOutpostStore.setState((s) => ({
        battery: Math.min(100, s.battery + 10),
        batteryKwh: Math.min(s.batteryCapacityKwh, s.batteryKwh + 5)
      }));
      useStoryStore.getState().triggerFieldToast({
        title: 'Piezo-Crystal Harvested',
        fact: '+10% Auxiliary Battery Power',
        icon: '⚡',
        badge: 'POWER HARVESTED'
      });
    } else {
      useOutpostStore.setState((s) => ({
        inventory: {
          ...s.inventory,
          mineral_shard: (s.inventory['mineral_shard'] || 0) + 1
        }
      }));
      useStoryStore.getState().triggerFieldToast({
        title: 'Martian Hematite Harvested',
        fact: '+1 Structural Mineral Specimen',
        icon: '💎',
        badge: 'MINERAL HARVESTED'
      });
    }
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const [px, , pz] = astronautPos;

    if (crystalGroupRef.current) {
      crystalGroupRef.current.children.forEach((child, idx) => {
        const crystal = CRYSTAL_NODES[idx];
        if (!crystal || collectedIds.includes(crystal.id)) return;

        // Individual crystal levitation & pulse
        child.position.y = (crystal.position[1] ?? -0.25) + Math.sin(t * 2 + idx) * 0.04;
        child.rotation.y = t * 0.5 + idx * 0.8;

        // Proximity auto-pickup within 1.8m
        const dist = Math.hypot(px - crystal.position[0], pz - crystal.position[2]);
        if (dist < 1.8) {
          collectCrystal(crystal);
        }
      });
    }
  });

  const handlePointerDown = (e: any, crystal: CrystalDef) => {
    e.stopPropagation();
    const [px, , pz] = astronautPos;
    const dist = Math.hypot(px - crystal.position[0], pz - crystal.position[2]);
    if (dist <= 3.8) {
      collectCrystal(crystal);
    }
  };

  return (
    <group ref={crystalGroupRef} dispose={null}>
      {CRYSTAL_NODES.map((crystal) => {
        if (collectedIds.includes(crystal.id)) return null;

        return (
          <group
            key={crystal.id}
            position={crystal.position}
            onClick={(e) => handlePointerDown(e, crystal)}
            onPointerDown={(e) => handlePointerDown(e, crystal)}
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
        );
      })}
    </group>
  );
};

export default ResourceDrops;

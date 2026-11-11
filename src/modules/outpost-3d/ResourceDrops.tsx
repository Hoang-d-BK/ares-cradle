import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { useStoryStore } from '@/modules/store/useStoryStore';
import { soundEngine } from '@/modules/audio/soundEngine';

interface FieldCacheNode {
  id: string;
  position: [number, number, number];
  kind: 'battery_cache' | 'mineral_outcrop';
  label: string;
}

const FIELD_CACHE_NODES: FieldCacheNode[] = [
  { id: 'cache-pwr-1', position: [-2.8, -0.34, 4.2], kind: 'battery_cache', label: 'Aux Li-S Power Cell' },
  { id: 'cache-min-1', position: [-2.4, -0.35, 4.6], kind: 'mineral_outcrop', label: 'Basalt-Ferric Outcrop' },
  { id: 'cache-min-2', position: [5.2, -0.34, 1.8], kind: 'mineral_outcrop', label: 'Hematite Regolith Nodule' },
  { id: 'cache-pwr-2', position: [5.5, -0.34, 2.2], kind: 'battery_cache', label: 'Field Power Cartridge' },
  { id: 'cache-pwr-3', position: [-5.2, -0.34, -2.5], kind: 'battery_cache', label: 'Solar Relay Power Pack' },
  { id: 'cache-min-3', position: [2.2, -0.34, -4.8], kind: 'mineral_outcrop', label: 'Sintered Iron-Oxide Rock' }
];

/**
 * Grounded Martian Field Supply Caches & Geological Mineral Outcrops
 * - Replaces fantasy neon crystals with industrial Li-S power cases & natural ferric outcrops
 * - Uses stable ID map (nodeRefs.current[node.id]) instead of children array index
 * - Uses synchronous Set ref to prevent double-pickup on click + pointerDown
 * - Uses batteryKwh as single source of truth (or adds backup_battery if grid is full)
 */
export const ResourceDrops: React.FC = () => {
  const nodeRefs = useRef<Record<string, THREE.Group | null>>({});
  const collectedSetRef = useRef<Set<string>>(new Set());
  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const astronautPos = useOutpostStore((state) => state.playerPos);

  const collectCache = (node: FieldCacheNode) => {
    if (collectedSetRef.current.has(node.id)) return;
    collectedSetRef.current.add(node.id);

    soundEngine.playCrystalPickup();
    setCollectedIds(Array.from(collectedSetRef.current));

    if (node.kind === 'battery_cache') {
      const store = useOutpostStore.getState();
      const addedKwh = store.addBatteryKwh(6.0);

      if (addedKwh >= 0.5) {
        const addedPct = Math.round((addedKwh / Math.max(1, store.batteryCapacityKwh)) * 100);
        useStoryStore.getState().triggerFieldToast({
          title: 'Recovered Field Power Cell',
          fact: `+${addedKwh.toFixed(1)} kWh (+${addedPct}%) transferred to Outpost Battery Grid.`,
          icon: '🔋',
          badge: 'POWER CACHE RECOVERED'
        });
      } else {
        // Grid is already full -> store as a spare backup_battery cartridge in backpack
        useOutpostStore.setState((s) => ({
          inventory: {
            ...s.inventory,
            backup_battery: (s.inventory.backup_battery ?? 0) + 1
          }
        }));
        useStoryStore.getState().triggerFieldToast({
          title: 'Stored Reserve Battery Cartridge',
          fact: 'Outpost grid is full—stored +1 Solid-State Li-S Power Cartridge in EVA Backpack.',
          icon: '🔋',
          badge: 'ADDED TO BACKPACK'
        });
      }
    } else {
      useOutpostStore.setState((s) => ({
        inventory: {
          ...s.inventory,
          mineral_shard: (s.inventory.mineral_shard ?? 0) + 1
        }
      }));
      useStoryStore.getState().triggerFieldToast({
        title: 'Collected Sorted Regolith Ore',
        fact: '+1 Sorted Regolith & Hematite Ore (2.5 kg) stored in EVA Backpack for lab sintering.',
        icon: '🪨',
        badge: 'MINERAL ORE STORED'
      });
    }
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const [px, , pz] = astronautPos;

    for (let i = 0; i < FIELD_CACHE_NODES.length; i++) {
      const node = FIELD_CACHE_NODES[i];
      if (collectedSetRef.current.has(node.id)) continue;

      const group = nodeRefs.current[node.id];
      if (group) {
        // Subtle beacon indicator pulse on ring, grounded mesh stays flush on terrain
        group.rotation.y = Math.sin(t * 0.6 + i) * 0.08;
      }

      // Proximity auto-pickup within 1.65m
      const dist = Math.hypot(px - node.position[0], pz - node.position[2]);
      if (dist < 1.65) {
        collectCache(node);
      }
    }
  });

  const handleInteract = (e: any, node: FieldCacheNode) => {
    e.stopPropagation();
    const [px, , pz] = astronautPos;
    const dist = Math.hypot(px - node.position[0], pz - node.position[2]);
    if (dist <= 3.8) {
      collectCache(node);
    }
  };

  return (
    <group name="FieldSupplyCachesLayer" dispose={null}>
      {FIELD_CACHE_NODES.map((node) => {
        if (collectedIds.includes(node.id)) return null;

        return (
          <group
            key={node.id}
            ref={(el) => {
              nodeRefs.current[node.id] = el;
            }}
            position={node.position}
            onClick={(e) => handleInteract(e, node)}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            {node.kind === 'battery_cache' ? (
              /* Composite 3-Part Industrial Aerospace Li-S Power Cartridge Case */
              <group position={[0, 0.14, 0]}>
                {/* Main Anodized Graphite Case */}
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[0.36, 0.24, 0.26]} />
                  <meshStandardMaterial color="#1E293B" roughness={0.35} metalness={0.65} />
                </mesh>
                {/* Safety Amber Seal Band */}
                <mesh position={[0, 0.02, 0]} castShadow>
                  <boxGeometry args={[0.38, 0.06, 0.28]} />
                  <meshStandardMaterial color="#D97706" roughness={0.3} metalness={0.5} />
                </mesh>
                {/* Top Status LED Strip */}
                <mesh position={[0, 0.13, 0]}>
                  <boxGeometry args={[0.18, 0.02, 0.08]} />
                  <meshStandardMaterial
                    color="#38BDF8"
                    emissive="#38BDF8"
                    emissiveIntensity={0.85}
                  />
                </mesh>
              </group>
            ) : (
              /* Composite Natural Martian Ferric-Basalt Mineral Outcrop */
              <group position={[0, 0.12, 0]}>
                <mesh castShadow receiveShadow rotation={[0.2, 0.4, 0.1]}>
                  <dodecahedronGeometry args={[0.24, 0]} />
                  <meshStandardMaterial
                    color="#8F3412"
                    roughness={0.88}
                    metalness={0.18}
                    flatShading
                  />
                </mesh>
                <mesh position={[0.16, -0.04, 0.08]} castShadow receiveShadow>
                  <dodecahedronGeometry args={[0.14, 0]} />
                  <meshStandardMaterial
                    color="#475569"
                    roughness={0.55}
                    metalness={0.65}
                    flatShading
                  />
                </mesh>
              </group>
            )}

            {/* Subtle Ground Scan Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[0.32, 0.37, 20]} />
              <meshBasicMaterial
                color={node.kind === 'battery_cache' ? '#38BDF8' : '#F59E0B'}
                transparent
                opacity={0.45}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export default ResourceDrops;

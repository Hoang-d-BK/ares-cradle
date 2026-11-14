import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural Rock Boulder Definition
interface BoulderProps {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color?: string;
}

interface RadarBeaconProps {
  position: [number, number, number];
  label: string;
  beaconColor: string;
}

/**
 * Radar Beacon Relay Station
 * Emits pulsating radio telemetry strobe across Martian expanse
 */
const RadarBeacon: React.FC<RadarBeaconProps> = ({ position, label: _label, beaconColor }) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const strobeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = Math.sin(t * 3.5) * 0.5 + 0.5;
    if (lightRef.current) {
      lightRef.current.intensity = pulse * 3.0 + 0.5;
    }
    if (strobeRef.current) {
      (strobeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 1.5 + 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Base Foundation Platform */}
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.25, 12]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Lattice Mast Tower */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.18, 4.8, 8]} />
        <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Top Telemetry Dish */}
      <mesh position={[0, 4.8, 0]} rotation={[0.4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.1, 0.18, 12]} />
        <meshStandardMaterial color="#E2E8F0" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Flashing Strobe Beacon */}
      <mesh ref={strobeRef} position={[0, 5.2, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial
          color={beaconColor}
          emissive={beaconColor}
          emissiveIntensity={1.0}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color={beaconColor}
        intensity={2.0}
        distance={28}
        decay={2}
        position={[0, 5.2, 0]}
      />

      {/* Solar Power Panel for Beacon */}
      <mesh position={[0.8, 0.5, 0]} rotation={[0.3, 0.5, 0]} castShadow>
        <boxGeometry args={[0.8, 0.04, 0.5]} />
        <meshStandardMaterial color="#0284C7" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  );
};

/**
 * Expanded Miniature Planetoid Martian Surface & 5 Geological NASA Biomes
 * Scaled to radius 135m (horizon dunes to 210m)
 * Biomes:
 * 1. Central Outpost Core (Center r=0-25m)
 * 2. Jezero Crater Basin (North at Z=-65m) with subterranean ice deposits
 * 3. Valles Mineral Valley (East at X=+70m) with hematite towers
 * 4. Red Sand Dune Sea (South at Z=+70m) with rippled dunes
 * 5. Observation Lookout Mesa (West at X=-70m) with elevated plateau
 */
export const MarsTerrain: React.FC = () => {
  // Procedural rock field across all 5 biomes
  const rocks: BoulderProps[] = useMemo(() => {
    return [
      // Central Outpost Perimeter Rocks
      { position: [-7.5, -0.2, -3.2], scale: [0.7, 0.4, 0.6], rotation: [0.2, 0.8, 0.1] },
      { position: [-6.8, -0.3, -2.1], scale: [0.4, 0.3, 0.5], rotation: [0.5, 0.2, 0.4] },
      { position: [6.2, -0.2, -4.5], scale: [0.9, 0.6, 0.8], rotation: [0.1, 1.2, 0.3] },
      { position: [8.1, -0.3, -1.8], scale: [0.5, 0.3, 0.6], rotation: [0.7, 0.4, 0.2] },
      { position: [-4.2, -0.3, 6.5], scale: [0.8, 0.5, 0.7], rotation: [0.3, 0.6, 0.5] },
      { position: [3.5, -0.3, 7.2], scale: [0.6, 0.4, 0.5], rotation: [0.9, 0.1, 0.8] },

      // North: Jezero Crater Impact Boulders
      { position: [-12, -0.2, -58], scale: [3.2, 1.8, 2.8], rotation: [0.2, 1.1, 0.3], color: '#334155' },
      { position: [14, -0.2, -62], scale: [2.8, 1.5, 2.4], rotation: [0.5, 0.4, 0.2], color: '#1E293B' },
      { position: [-4, -0.2, -75], scale: [3.8, 2.2, 3.2], rotation: [0.1, 0.7, 0.5], color: '#334155' },
      { position: [8, -0.2, -78], scale: [2.5, 1.4, 2.2], rotation: [0.4, 0.3, 0.8], color: '#475569' },

      // East: Valles Mineral Valley Monoliths
      { position: [62, 0.6, -8], scale: [2.8, 4.5, 2.5], rotation: [0.1, 0.3, 0.1], color: '#78350F' },
      { position: [68, 0.8, 6], scale: [3.5, 5.2, 3.0], rotation: [0.2, 0.8, 0.1], color: '#92400E' },
      { position: [75, 0.4, -14], scale: [2.2, 3.8, 2.0], rotation: [0.3, 0.5, 0.2], color: '#78350F' },
      { position: [80, 0.7, 12], scale: [3.2, 4.8, 2.8], rotation: [0.1, 0.2, 0.3], color: '#B45309' },

      // South: Red Dunes Expanse Formations
      { position: [-15, -0.1, 65], scale: [4.2, 1.2, 3.5], rotation: [0.4, 0.6, 0.1], color: '#C2410C' },
      { position: [18, -0.1, 68], scale: [3.8, 1.4, 3.2], rotation: [0.2, 0.3, 0.5], color: '#EA580C' },
      { position: [-6, 0.1, 80], scale: [5.2, 1.6, 4.0], rotation: [0.5, 0.8, 0.2], color: '#C2410C' },
      { position: [12, 0.1, 85], scale: [4.5, 1.5, 3.8], rotation: [0.3, 0.4, 0.7], color: '#EA580C' },

      // West: Lookout Mesa Plateau Outcrops
      { position: [-64, 0.5, -12], scale: [3.5, 2.8, 3.0], rotation: [0.2, 0.4, 0.1], color: '#6B7280' },
      { position: [-70, 0.8, 8], scale: [4.2, 3.4, 3.8], rotation: [0.3, 0.7, 0.2], color: '#4B5563' },
      { position: [-78, 0.6, -18], scale: [3.8, 2.9, 3.2], rotation: [0.1, 0.5, 0.4], color: '#374151' },
      { position: [-82, 0.4, 15], scale: [4.5, 3.1, 4.0], rotation: [0.4, 0.2, 0.6], color: '#4B5563' },
    ];
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================
          1. PRIMARY 600x600 MARTIAN REGOLITH EXPANSE (Invariant I01)
          ======================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]} receiveShadow>
        <planeGeometry args={[680, 680, 32, 32]} />
        <meshStandardMaterial
          color="#852E0A"
          roughness={0.94}
          metalness={0.06}
        />
      </mesh>

      {/* Regional Distinctive Biome Ground Patches */}
      {/* Sector 1: Echo Crater (Impact Basalt & Shock Ejecta) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-200, -0.50, -170]} receiveShadow>
        <circleGeometry args={[110, 36]} />
        <meshStandardMaterial color="#3F4652" roughness={0.92} metalness={0.15} />
      </mesh>

      {/* Sector 3: Black Rock Terrace (Volcanic Cooling Sheets) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-210, -0.50, 180]} receiveShadow>
        <circleGeometry args={[105, 36]} />
        <meshStandardMaterial color="#232830" roughness={0.95} metalness={0.2} />
      </mesh>

      {/* Sector 4: Sealed Ice Cliff (Subsurface Cryogenic Glacial Apron) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[210, -0.50, -180]} receiveShadow>
        <circleGeometry args={[110, 36]} />
        <meshStandardMaterial color="#5CAAB8" roughness={0.85} metalness={0.18} />
      </mesh>

      {/* Sector 5: Ancient Lake Shore (Sedimentary Jezero Delta Mudstone) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[200, -0.50, 170]} receiveShadow>
        <circleGeometry args={[105, 36]} />
        <meshStandardMaterial color="#544336" roughness={0.92} metalness={0.08} />
      </mesh>

      {/* Distant Horizon Curved Dunes Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow>
        <ringGeometry args={[335, 480, 64]} />
        <meshStandardMaterial
          color="#5C1C05"
          roughness={0.98}
          metalness={0.02}
        />
      </mesh>

      {/* ========================================================
          2. CENTRAL OUTPOST FOUNDATION PLINTH (Base Core)
          ======================================================== */}
      <mesh position={[0, -0.46, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 5.5, 0.12, 32]} />
        <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Inner Immediate Craters around Habitat */}
      <group position={[6.5, -0.48, -4.8]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[2.2, 0.25, 8, 24]} />
          <meshStandardMaterial color="#7A2808" roughness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.06]}>
          <circleGeometry args={[2.1, 24]} />
          <meshStandardMaterial color="#5E1E05" roughness={0.98} />
        </mesh>
      </group>

      <group position={[-6.2, -0.48, 5.0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[1.5, 0.18, 8, 20]} />
          <meshStandardMaterial color="#7A2808" roughness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.04]}>
          <circleGeometry args={[1.4, 20]} />
          <meshStandardMaterial color="#5E1E05" roughness={0.98} />
        </mesh>
      </group>

      {/* ========================================================
          3. BIOME NORTH: JEZERO CRATER IMPACT BASIN & PERMAFROST
          ======================================================== */}
      <group position={[0, -0.48, -65]}>
        {/* Massive Jezero Crater Rim */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[18, 1.8, 12, 48]} />
          <meshStandardMaterial color="#334155" roughness={0.92} metalness={0.2} />
        </mesh>
        {/* Dark Basaltic Basin Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.15]}>
          <circleGeometry args={[17.5, 48]} />
          <meshStandardMaterial color="#0F172A" roughness={0.88} metalness={0.3} />
        </mesh>
        {/* Sub-Surface Reflective Water Ice Veins */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.5, 0, -0.12]}>
          <circleGeometry args={[6.5, 24]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#0284C7"
            emissiveIntensity={0.25}
            roughness={0.15}
            metalness={0.8}
          />
        </mesh>
        {/* North Radar Beacon */}
        <RadarBeacon position={[0, 0, 0]} label="Jezero Station" beaconColor="#00F0FF" />
      </group>

      {/* ========================================================
          4. BIOME EAST: VALLES MINERAL VALLEY & HEMATITE TOWERS
          ======================================================== */}
      <group position={[70, -0.48, 0]}>
        {/* Valley Ground Depression */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[16, 1.4, 10, 36]} />
          <meshStandardMaterial color="#78350F" roughness={0.95} />
        </mesh>
        {/* Hematite Iron Ground Bed */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.08]}>
          <circleGeometry args={[15.5, 36]} />
          <meshStandardMaterial color="#B45309" roughness={0.85} metalness={0.4} />
        </mesh>
        {/* Tall Natural Rock Arches / Monoliths */}
        <mesh position={[-6, 2.5, 0]} castShadow>
          <boxGeometry args={[2.5, 5.0, 1.8]} />
          <meshStandardMaterial color="#78350F" roughness={0.9} />
        </mesh>
        <mesh position={[6, 2.8, -2]} castShadow>
          <boxGeometry args={[2.2, 5.6, 2.0]} />
          <meshStandardMaterial color="#92400E" roughness={0.88} />
        </mesh>
        {/* East Radar Beacon */}
        <RadarBeacon position={[0, 0, 0]} label="Valles Mineral Hub" beaconColor="#FFB020" />
      </group>

      {/* ========================================================
          5. BIOME SOUTH: RED DUNES EXPANSE (Curved Sand Ridges)
          ======================================================== */}
      <group position={[0, -0.48, 70]}>
        {/* Curving Sand Ridge Arcs */}
        <mesh rotation={[-Math.PI / 2, 0, 0.4]} position={[0, 0.2, 0]} receiveShadow>
          <torusGeometry args={[20, 2.2, 8, 36]} />
          <meshStandardMaterial color="#C2410C" roughness={0.98} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, -0.3]} position={[5, 0.4, 4]} receiveShadow>
          <torusGeometry args={[14, 1.8, 8, 32]} />
          <meshStandardMaterial color="#EA580C" roughness={0.98} />
        </mesh>
        {/* South Radar Beacon */}
        <RadarBeacon position={[0, 0, 0]} label="Dune Sea Relay" beaconColor="#10B981" />
      </group>

      {/* ========================================================
          6. BIOME WEST: OBSERVATION LOOKOUT MESA & PLATEAU
          ======================================================== */}
      <group position={[-70, -0.48, 0]}>
        {/* Elevated Mesa Base */}
        <mesh position={[0, 0.6, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[14, 16, 1.4, 28]} />
          <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.85} />
        </mesh>
        {/* Observation Crater */}
        <mesh position={[4, 1.35, -3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[4.5, 0.6, 8, 20]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        {/* West Radar Beacon on Mesa */}
        <RadarBeacon position={[0, 1.3, 0]} label="Lookout Plateau" beaconColor="#A855F7" />
      </group>

      {/* ========================================================
          7. GEOLOGICAL BOULDERS & MINERAL SPECIMEN BED
          ======================================================== */}
      {rocks.map((rock, idx) => (
        <mesh
          key={idx}
          position={rock.position}
          scale={rock.scale}
          rotation={rock.rotation}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={rock.color || '#852A07'}
            roughness={0.92}
            metalness={0.12}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
};

export default MarsTerrain;

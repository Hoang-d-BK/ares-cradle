import React, { useMemo } from 'react';

// Procedural Rock Boulder Definition
interface BoulderProps {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

/**
 * Phase 13: Expanded Martian Surface & Geological Features
 * Enlarged perimeter (radius 38) supporting rover exploration,
 * multiple impact craters, mineral ridges, and boundary dunes.
 */
export const MarsTerrain: React.FC = () => {
  // Deterministic procedural rock positions for base perimeter and outer exploration zone
  const rocks: BoulderProps[] = useMemo(() => {
    return [
      { position: [-7.5, -0.2, -3.2], scale: [0.7, 0.4, 0.6], rotation: [0.2, 0.8, 0.1] },
      { position: [-6.8, -0.3, -2.1], scale: [0.4, 0.3, 0.5], rotation: [0.5, 0.2, 0.4] },
      { position: [6.2, -0.2, -4.5], scale: [0.9, 0.6, 0.8], rotation: [0.1, 1.2, 0.3] },
      { position: [8.1, -0.3, -1.8], scale: [0.5, 0.3, 0.6], rotation: [0.7, 0.4, 0.2] },
      { position: [-4.2, -0.3, 6.5], scale: [0.8, 0.5, 0.7], rotation: [0.3, 0.6, 0.5] },
      { position: [3.5, -0.3, 7.2], scale: [0.6, 0.4, 0.5], rotation: [0.9, 0.1, 0.8] },
      { position: [7.8, -0.3, 4.2], scale: [0.7, 0.5, 0.6], rotation: [0.4, 0.9, 0.2] },
      { position: [-8.4, -0.2, 2.8], scale: [1.1, 0.7, 0.9], rotation: [0.2, 0.4, 0.6] },
      // Outer exploration rim boulders
      { position: [-14.5, -0.2, -12.0], scale: [1.4, 0.8, 1.2], rotation: [0.3, 1.1, 0.4] },
      { position: [16.2, -0.2, -14.5], scale: [1.6, 0.9, 1.3], rotation: [0.5, 0.6, 0.2] },
      { position: [-18.0, -0.2, 11.5], scale: [1.8, 1.0, 1.5], rotation: [0.1, 0.8, 0.7] },
      { position: [15.5, -0.2, 16.0], scale: [1.3, 0.7, 1.1], rotation: [0.4, 0.3, 0.9] },
      { position: [0.0, -0.2, 22.0], scale: [2.1, 1.2, 1.8], rotation: [0.6, 0.5, 0.1] },
      { position: [-22.0, -0.2, -2.5], scale: [1.9, 1.1, 1.6], rotation: [0.2, 1.4, 0.5] }
    ];
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Primary Martian Surface Disc (Expanded to 38 radius for Rover Expedition) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <circleGeometry args={[38, 64]} />
        <meshStandardMaterial
          color="#943109"
          roughness={0.92}
          metalness={0.08}
        />
      </mesh>

      {/* Exterior Dune Ridge Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]} receiveShadow>
        <ringGeometry args={[37.5, 48, 48]} />
        <meshStandardMaterial
          color="#752405"
          roughness={0.98}
          metalness={0.05}
        />
      </mesh>

      {/* Impact Crater Alpha (North-East Outpost Perimeter) */}
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

      {/* Impact Crater Beta (South-West Outpost Perimeter) */}
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

      {/* Distant Crater Gamma (Deep Exploration Zone North-West) */}
      <group position={[-15.0, -0.48, -16.0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[4.2, 0.45, 10, 32]} />
          <meshStandardMaterial color="#6B2205" roughness={0.96} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.08]}>
          <circleGeometry args={[4.0, 32]} />
          <meshStandardMaterial color="#4A1603" roughness={0.98} />
        </mesh>
      </group>

      {/* Outpost Engineering Foundation Pad (Central Plinth) */}
      <mesh position={[0, -0.46, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 5.5, 0.12, 32]} />
        <meshStandardMaterial
          color="#1E293B"
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Perimeter Tactical Warning Trim on Foundation */}
      <mesh position={[0, -0.39, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.0, 5.15, 32]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={0.25}
          roughness={0.3}
        />
      </mesh>

      {/* Inter-Module Service Conduit Track */}
      <mesh position={[-2.2, -0.39, 0.8]} rotation={[-Math.PI / 2, 0, -0.4]}>
        <planeGeometry args={[0.3, 4.2]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[2.1, -0.39, 0.5]} rotation={[-Math.PI / 2, 0, 0.6]}>
        <planeGeometry args={[0.3, 3.8]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Procedural Low-Poly Boulders */}
      {rocks.map((rock, idx) => (
        <mesh
          key={idx}
          position={rock.position}
          scale={rock.scale}
          rotation={rock.rotation}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color="#5C1D06"
            roughness={0.95}
            metalness={0.1}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
};

export default MarsTerrain;

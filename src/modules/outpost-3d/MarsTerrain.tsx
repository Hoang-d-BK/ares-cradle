import React, { useMemo } from 'react';

// Procedural Rock Boulder Definition
interface BoulderProps {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

export const MarsTerrain: React.FC = () => {
  // Deterministic procedural rock positions around the Martian outpost perimeter
  const rocks: BoulderProps[] = useMemo(() => {
    return [
      { position: [-7.5, -0.2, -3.2], scale: [0.7, 0.4, 0.6], rotation: [0.2, 0.8, 0.1] },
      { position: [-6.8, -0.3, -2.1], scale: [0.4, 0.3, 0.5], rotation: [0.5, 0.2, 0.4] },
      { position: [6.2, -0.2, -4.5], scale: [0.9, 0.6, 0.8], rotation: [0.1, 1.2, 0.3] },
      { position: [8.1, -0.3, -1.8], scale: [0.5, 0.3, 0.6], rotation: [0.7, 0.4, 0.2] },
      { position: [-4.2, -0.3, 6.5], scale: [0.8, 0.5, 0.7], rotation: [0.3, 0.6, 0.5] },
      { position: [3.5, -0.3, 7.2], scale: [0.6, 0.4, 0.5], rotation: [0.9, 0.1, 0.8] },
      { position: [7.8, -0.3, 4.2], scale: [0.7, 0.5, 0.6], rotation: [0.4, 0.9, 0.2] },
      { position: [-8.4, -0.2, 2.8], scale: [1.1, 0.7, 0.9], rotation: [0.2, 0.4, 0.6] }
    ];
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Primary Martian Surface Disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial
          color="#943109"
          roughness={0.92}
          metalness={0.08}
        />
      </mesh>

      {/* Exterior Dune Ridge Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]} receiveShadow>
        <ringGeometry args={[21.5, 26, 48]} />
        <meshStandardMaterial
          color="#752405"
          roughness={0.98}
          metalness={0.05}
        />
      </mesh>

      {/* Impact Crater Alpha (North-East) */}
      <group position={[6.5, -0.48, -4.8]}>
        {/* Crater Rim Elevation */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[2.2, 0.25, 8, 24]} />
          <meshStandardMaterial color="#7A2808" roughness={0.95} />
        </mesh>
        {/* Crater Floor Basin */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.06]}>
          <circleGeometry args={[2.1, 24]} />
          <meshStandardMaterial color="#5E1E05" roughness={0.98} />
        </mesh>
      </group>

      {/* Impact Crater Beta (South-West) */}
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

      {/* Low-Poly Martian Boulders & Minerals */}
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
            color={idx % 2 === 0 ? '#632107' : '#471604'}
            roughness={0.9}
            metalness={0.15}
          />
        </mesh>
      ))}
    </group>
  );
};

export default MarsTerrain;

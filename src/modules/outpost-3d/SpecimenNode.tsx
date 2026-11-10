import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { useStoryStore } from '@/modules/store/useStoryStore';
import { SpecimenDrop } from '@/modules/story-engine/types';

interface SpecimenNodeProps {
  specimen: SpecimenDrop;
}

export const SpecimenNode: React.FC<SpecimenNodeProps> = ({ specimen }) => {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const astronautPos = useOutpostStore((state) => state.playerPos);
  const currentChapterIndex = useStoryStore((state) => state.currentChapterIndex);
  const chapters = useStoryStore((state) => state.chapters);
  const collectSpecimen = useStoryStore((state) => state.collectSpecimen);

  const activeSol = chapters[currentChapterIndex]?.sol || 1;
  const isAvailable = specimen.solAvailable <= activeSol && !specimen.collected;

  useFrame((state) => {
    if (!meshRef.current || !isAvailable) return;

    // Levitation and rotation
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = specimen.position[1] + Math.sin(t * 2.5) * 0.08 + 0.1;
    meshRef.current.rotation.y = t * 0.8;

    // Proximity check (< 2.0m)
    const [px, , pz] = astronautPos;
    const [sx, , sz] = specimen.position;
    const dist = Math.hypot(px - sx, pz - sz);

    if (materialRef.current) {
      if (dist < 2.0) {
        // Proximity glow pulse
        const pulse = Math.sin(t * 5.0) * 0.35 + 0.75;
        materialRef.current.emissiveIntensity = pulse;
      } else {
        materialRef.current.emissiveIntensity = 0.2;
      }
    }
  });

  if (!isAvailable) return null;

  const handleClick = (e: any) => {
    e.stopPropagation();
    const [px, , pz] = astronautPos;
    const [sx, , sz] = specimen.position;
    const dist = Math.hypot(px - sx, pz - sz);

    if (dist <= 3.5) {
      collectSpecimen(specimen.id);
    }
  };

  return (
    <group
      ref={meshRef}
      position={specimen.position}
      onClick={handleClick}
      onPointerDown={handleClick}
      dispose={null}
    >
      {/* 3D Geometry per category */}
      {specimen.category === 'mineral' && (
        <group scale={[0.6, 0.6, 0.6]}>
          <mesh castShadow receiveShadow>
            <dodecahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial
              ref={materialRef}
              color="#FF7E29"
              emissive="#FF7E29"
              emissiveIntensity={0.2}
              roughness={0.4}
              metalness={0.7}
              flatShading
            />
          </mesh>
          {/* Micro satellite spherules */}
          <mesh position={[0.25, 0.2, 0.15]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#4A5568" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-0.2, -0.15, -0.2]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color="#4A5568" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {specimen.category === 'ice' && (
        <group scale={[0.65, 0.75, 0.65]}>
          <mesh castShadow receiveShadow>
            <octahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial
              ref={materialRef}
              color="#00F0FF"
              emissive="#00F0FF"
              emissiveIntensity={0.3}
              transparent
              opacity={0.85}
              roughness={0.15}
              metalness={0.2}
              flatShading
            />
          </mesh>
        </group>
      )}

      {/* Ground Projection Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[0.4, 0.46, 24]} />
        <meshBasicMaterial
          color={specimen.category === 'mineral' ? '#FF7E29' : '#00F0FF'}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
};

export const SpecimenNodesCollection: React.FC = () => {
  const specimens = useStoryStore((state) => state.specimens);
  return (
    <group name="StorySpecimensLayer">
      {specimens.map((specimen) => (
        <SpecimenNode key={specimen.id} specimen={specimen} />
      ))}
    </group>
  );
};

export default SpecimenNodesCollection;

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Task 9.1: Low-Poly Astronaut Model (Cadet Leo)
 * Style: Kenney Space Kit CC0 / Minecraft Chibi Explorer
 * Material: meshStandardMaterial with flatShading: true
 */
export const AstronautModel: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number] }> = ({
  position = [1.8, -0.4, 2.5],
  rotation = [0, -0.6, 0]
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Subtle breathing / idle sway
    if (groupRef.current) {
      groupRef.current.position.y = (position[1] ?? -0.4) + Math.sin(t * 2) * 0.02;
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 1.2) * 0.1;
      headRef.current.rotation.x = Math.sin(t * 0.8) * 0.05;
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.08;
      rightArmRef.current.rotation.x = -Math.sin(t * 2) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} dispose={null}>
      {/* Head & Helmet */}
      <group ref={headRef} position={[0, 0.95, 0]}>
        {/* White Spacesuit Helmet Box */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.1} flatShading />
        </mesh>

        {/* Reflective Gold Mars Visor */}
        <mesh position={[0, 0.02, 0.18]} castShadow>
          <boxGeometry args={[0.34, 0.22, 0.1]} />
          <meshStandardMaterial
            color="#FFB020"
            metalness={0.92}
            roughness={0.15}
            emissive="#FFB020"
            emissiveIntensity={0.25}
            flatShading
          />
        </mesh>

        {/* Helmet Comm Antenna */}
        <mesh position={[0.22, 0.15, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.25, 6]} />
          <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.2} flatShading />
        </mesh>
        <mesh position={[0.22, 0.28, 0]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.6} flatShading />
        </mesh>
      </group>

      {/* Torso & Mission Suit */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.5, 0.28]} />
        <meshStandardMaterial color="#F1F5F9" roughness={0.4} metalness={0.1} flatShading />
      </mesh>

      {/* Mission Badge on Chest */}
      <mesh position={[0, 0.62, 0.145]}>
        <boxGeometry args={[0.16, 0.1, 0.02]} />
        <meshStandardMaterial
          color="#C1440E"
          emissive="#C1440E"
          emissiveIntensity={0.3}
          flatShading
        />
      </mesh>

      {/* Primary Life Support System (PLSS Backpack) */}
      <group position={[0, 0.58, -0.22]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.36, 0.46, 0.2]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.3} metalness={0.4} flatShading />
        </mesh>
        {/* Oxygen Cylinders */}
        <mesh position={[-0.1, 0, -0.08]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.38, 8]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.3} flatShading />
        </mesh>
        <mesh position={[0.1, 0, -0.08]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.38, 8]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.3} flatShading />
        </mesh>
      </group>

      {/* Left Arm & Glove */}
      <mesh ref={leftArmRef} position={[-0.3, 0.52, 0]} castShadow>
        <boxGeometry args={[0.14, 0.42, 0.16]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.4} metalness={0.1} flatShading />
      </mesh>

      {/* Right Arm & Glove (Holding Specimen Scanner) */}
      <group ref={rightArmRef} position={[0.3, 0.52, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.42, 0.16]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.4} metalness={0.1} flatShading />
        </mesh>
        {/* Handheld Tricorder Scanner */}
        <mesh position={[0, -0.24, 0.12]}>
          <boxGeometry args={[0.08, 0.14, 0.12]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} flatShading />
        </mesh>
        <mesh position={[0, -0.22, 0.18]}>
          <boxGeometry args={[0.06, 0.08, 0.02]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.9} flatShading />
        </mesh>
      </group>

      {/* Left Leg & Boot */}
      <mesh position={[-0.13, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.36, 0.2]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.5} metalness={0.2} flatShading />
      </mesh>

      {/* Right Leg & Boot */}
      <mesh position={[0.13, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.36, 0.2]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.5} metalness={0.2} flatShading />
      </mesh>
    </group>
  );
};

export default AstronautModel;

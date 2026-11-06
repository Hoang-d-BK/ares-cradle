import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Task 9.1: Low-Poly Mars Rover Exploration Unit
 * Style: Kenney Space Kit CC0 / Low-Poly Rocker-Bogie Rover
 * Material: meshStandardMaterial with flatShading: true
 */
export const MarsRover: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number] }> = ({
  position = [3.8, -0.32, -2.2],
  rotation = [0, 0.85, 0]
}) => {
  const mastRef = useRef<THREE.Group>(null);
  const dishRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Panning Mastcam scanning Martian horizon
    if (mastRef.current) {
      mastRef.current.rotation.y = Math.sin(t * 0.7) * 0.35;
    }

    // High gain antenna slow rotation
    if (dishRef.current) {
      dishRef.current.rotation.y += delta * 0.6;
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      dispose={null}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Rover Main Chassis Body */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.36, 0.95]} />
        <meshStandardMaterial
          color={hovered ? '#F8FAFC' : '#E2E8F0'}
          roughness={0.3}
          metalness={0.4}
          flatShading
        />
      </mesh>

      {/* Equipment Bay Top Deck */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.06, 0.82]} />
        <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.8} flatShading />
      </mesh>

      {/* Rear RTG (Radioisotope Thermoelectric Generator) */}
      <group position={[-0.7, 0.52, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.45, 10]} />
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.6} flatShading />
        </mesh>
        {/* Heat dissipation fins */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.35, 6]} />
          <meshStandardMaterial color="#C1440E" roughness={0.3} metalness={0.7} flatShading />
        </mesh>
      </group>

      {/* Panning Mastcam (Perseverance / Curiosity Style Camera Tower) */}
      <group ref={mastRef} position={[0.45, 0.65, 0.25]}>
        {/* Vertical Pylon */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.9, 8]} />
          <meshStandardMaterial color="#64748B" metalness={0.85} roughness={0.2} flatShading />
        </mesh>
        {/* Dual Stereoscopic Camera Head */}
        <mesh position={[0, 0.92, 0]} castShadow>
          <boxGeometry args={[0.24, 0.14, 0.18]} />
          <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} flatShading />
        </mesh>
        {/* Left Lens */}
        <mesh position={[-0.07, 0.92, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 8]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.8} flatShading />
        </mesh>
        {/* Right Lens */}
        <mesh position={[0.07, 0.92, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 8]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.8} flatShading />
        </mesh>
      </group>

      {/* High-Gain Antenna Dish */}
      <group position={[-0.35, 0.65, -0.25]}>
        <mesh ref={dishRef} position={[0, 0.3, 0]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.04, 0.08, 12]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.3} flatShading />
        </mesh>
      </group>

      {/* Front Robotic Arm with Turret Core Drill */}
      <group position={[0.7, 0.35, -0.2]}>
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.3, 0.08, 0.08]} />
          <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.2} flatShading />
        </mesh>
        <mesh position={[0.32, -0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.16, 8]} />
          <meshStandardMaterial color="#FFB020" emissive="#FFB020" emissiveIntensity={0.4} flatShading />
        </mesh>
      </group>

      {/* 6 Rugged Rocker-Bogie Low-Poly Wheels */}
      {[
        // Front pair
        { x: 0.55, z: 0.56 },
        { x: 0.55, z: -0.56 },
        // Middle pair
        { x: 0, z: 0.62 },
        { x: 0, z: -0.62 },
        // Rear pair
        { x: -0.55, z: 0.56 },
        { x: -0.55, z: -0.56 }
      ].map((wheel, idx) => (
        <group key={idx} position={[wheel.x, 0.16, wheel.z]}>
          {/* Wheel Rim & Tire */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.14, 12]} />
            <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} flatShading />
          </mesh>
          {/* Tread Grip Rim */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.19, 0.19, 0.06, 8]} />
            <meshStandardMaterial color="#C1440E" roughness={0.8} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default MarsRover;

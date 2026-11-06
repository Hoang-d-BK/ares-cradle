import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Task 9.2: NASA Official Hologram Blueprint (nasa/NASA-3D-Resources)
 * Displays slowly rotating 3D wireframe hologram of NASA InSight Lander / Perseverance Rover
 * inside the observation glass of HabitatInterior.
 */
export const HabitatInterior: React.FC<{ position?: [number, number, number] }> = ({
  position = [0, 0.85, 0]
}) => {
  const hologramRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const [modelType, setModelType] = useState<'insight' | 'perseverance'>('insight');
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Slow atmospheric hologram rotation
    if (hologramRef.current) {
      hologramRef.current.rotation.y += delta * 0.45;
      // Gentle floating bob
      hologramRef.current.position.y = 0.55 + Math.sin(t * 1.8) * 0.04;
    }

    // Holographic emitter beam flicker
    if (beamRef.current && (beamRef.current.material as THREE.MeshStandardMaterial)) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.15 + Math.sin(t * 6.0) * 0.05;
    }
  });

  const toggleModel = (e: any) => {
    e.stopPropagation();
    setModelType((prev) => (prev === 'insight' ? 'perseverance' : 'insight'));
  };

  return (
    <group position={position} dispose={null}>
      {/* Heavy Scientific Pedestal Base */}
      <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.75, 0.3, 16]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.8} flatShading />
      </mesh>

      {/* Hologram Projector Ring Emitter */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.58, 24]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={1.5}
          roughness={0.2}
        />
      </mesh>

      {/* Vertical Holographic Light Column Beam */}
      <mesh ref={beamRef} position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.55, 0.45, 1.2, 16, 1, true]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={0.8}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Interactive 3D Hologram Assembly (Click to toggle NASA model) */}
      <group
        ref={hologramRef}
        position={[0, 0.55, 0]}
        onClick={toggleModel}
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
        {modelType === 'insight' ? (
          /* ==============================================================
             NASA InSight Mars Lander Wireframe Blueprint (NASA-3D-Resources)
             ============================================================== */
          <group scale={[0.55, 0.55, 0.55]}>
            {/* Hexagonal Main Equipment Deck */}
            <mesh>
              <cylinderGeometry args={[0.7, 0.75, 0.25, 6]} />
              <meshStandardMaterial
                color="#00F0FF"
                emissive="#00F0FF"
                emissiveIntensity={hovered ? 2.0 : 1.2}
                wireframe
              />
            </mesh>

            {/* InSight Twin Deployed Circular Solar Wings */}
            <mesh position={[-1.25, 0.05, 0]} rotation={[0, 0, 0.1]}>
              <cylinderGeometry args={[0.5, 0.5, 0.02, 10]} />
              <meshStandardMaterial
                color="#00F0FF"
                emissive="#00F0FF"
                emissiveIntensity={hovered ? 2.0 : 1.2}
                wireframe
              />
            </mesh>
            <mesh position={[1.25, 0.05, 0]} rotation={[0, 0, -0.1]}>
              <cylinderGeometry args={[0.5, 0.5, 0.02, 10]} />
              <meshStandardMaterial
                color="#00F0FF"
                emissive="#00F0FF"
                emissiveIntensity={hovered ? 2.0 : 1.2}
                wireframe
              />
            </mesh>

            {/* SEIS Seismometer Dome (Seismic Experiment for Interior Structure) */}
            <mesh position={[0.25, 0.22, 0.25]}>
              <sphereGeometry args={[0.2, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial
                color="#FFB020"
                emissive="#FFB020"
                emissiveIntensity={1.5}
                wireframe
              />
            </mesh>

            {/* HP3 Heat Flow and Physical Properties Probe */}
            <mesh position={[-0.3, 0.2, -0.2]}>
              <boxGeometry args={[0.18, 0.25, 0.18]} />
              <meshStandardMaterial
                color="#00F0FF"
                emissive="#00F0FF"
                emissiveIntensity={1.2}
                wireframe
              />
            </mesh>

            {/* UHF Helical Telemetry Antenna Mast */}
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.02, 0.03, 0.6, 8]} />
              <meshStandardMaterial
                color="#00F0FF"
                emissive="#00F0FF"
                emissiveIntensity={1.5}
                wireframe
              />
            </mesh>
          </group>
        ) : (
          /* ==============================================================
             NASA Perseverance Mars Rover Wireframe Blueprint
             ============================================================== */
          <group scale={[0.5, 0.5, 0.5]}>
            {/* Rover Chassis Body */}
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[1.2, 0.4, 0.8]} />
              <meshStandardMaterial
                color="#00F0FF"
                emissive="#00F0FF"
                emissiveIntensity={hovered ? 2.0 : 1.2}
                wireframe
              />
            </mesh>

            {/* Mastcam-Z Tower */}
            <mesh position={[0.4, 0.7, 0.2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
              <meshStandardMaterial
                color="#00F0FF"
                emissive="#00F0FF"
                emissiveIntensity={1.5}
                wireframe
              />
            </mesh>
            <mesh position={[0.4, 1.05, 0.2]}>
              <boxGeometry args={[0.2, 0.12, 0.16]} />
              <meshStandardMaterial
                color="#FFB020"
                emissive="#FFB020"
                emissiveIntensity={1.6}
                wireframe
              />
            </mesh>

            {/* Rear MMRTG Nuclear Battery */}
            <mesh position={[-0.6, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 0.4, 8]} />
              <meshStandardMaterial
                color="#C1440E"
                emissive="#C1440E"
                emissiveIntensity={1.4}
                wireframe
              />
            </mesh>

            {/* 6 Wireframe Wheels */}
            {[
              [-0.45, -0.05, 0.5],
              [0, -0.05, 0.55],
              [0.45, -0.05, 0.5],
              [-0.45, -0.05, -0.5],
              [0, -0.05, -0.55],
              [0.45, -0.05, -0.5]
            ].map(([x, y, z], idx) => (
              <mesh key={idx} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.12, 10]} />
                <meshStandardMaterial
                  color="#00F0FF"
                  emissive="#00F0FF"
                  emissiveIntensity={1.2}
                  wireframe
                />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* Hologram Central Light Source */}
      <pointLight
        position={[0, 0.65, 0]}
        color="#00F0FF"
        intensity={hovered ? 2.5 : 1.6}
        distance={4.5}
        decay={2}
      />
    </group>
  );
};

export default HabitatInterior;

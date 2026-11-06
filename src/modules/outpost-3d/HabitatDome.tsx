import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

export const HabitatDome: React.FC = () => {
  const outerDomeRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

  const emergencySaver = useOutpostStore((state) => state.emergencyPowerSaver);
  const oxygen = useOutpostStore((state) => state.oxygen);
  const temperature = useOutpostStore((state) => state.temperature);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    // Subtle atmospheric rotation of inner core
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.08;
    }

    // Determine bioluminescent life support glow color & state
    let targetColor = '#00F0FF'; // Nominal Cyan
    let pulseFrequency = 1.8;

    if (oxygen < 16.0 || temperature < -20.0) {
      targetColor = '#EF4444'; // Lethal Red
      pulseFrequency = 6.0;    // Rapid emergency alarm pulse
    } else if (emergencySaver || temperature < 5.0) {
      targetColor = '#FFB020'; // Caution Amber
      pulseFrequency = 2.5;
    }

    // Bioluminescent breathing pulse
    const pulseFactor = 0.5 + Math.sin(elapsed * pulseFrequency) * 0.25;

    if (coreRef.current && (coreRef.current.material as THREE.MeshStandardMaterial)) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissive.set(targetColor);
      mat.emissiveIntensity = pulseFactor;
    }

    if (pointLightRef.current) {
      pointLightRef.current.color.set(targetColor);
      pointLightRef.current.intensity = pulseFactor * 2.2;
    }

    // Telemetry antenna beacon strobe
    if (beaconRef.current && (beaconRef.current.material as THREE.MeshStandardMaterial)) {
      const beaconMat = beaconRef.current.material as THREE.MeshStandardMaterial;
      const strobe = Math.sin(elapsed * 4.0) > 0.4 ? 1.0 : 0.1;
      beaconMat.emissiveIntensity = strobe;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Pressurized Geodesic Dome */}
      <mesh ref={outerDomeRef} position={[0, 1.25, 0]} castShadow receiveShadow>
        <sphereGeometry args={[2.3, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#475569"
          metalness={0.75}
          roughness={0.15}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Structural Compression Ring Collar */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[2.32, 2.38, 0.2, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Inner Bioluminescent Hydroponics & Life Habitat Core */}
      <mesh ref={coreRef} position={[0, 0.85, 0]}>
        <cylinderGeometry args={[1.5, 1.7, 1.5, 24]} />
        <meshStandardMaterial
          color="#0F172A"
          emissive="#00F0FF"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Pressurized Airlock Access Module */}
      <group position={[2.2, 0.35, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.55, 0.55, 1.3, 16]} />
          <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Exterior Airlock Hatch */}
        <mesh position={[0, -0.66, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.06, 16]} />
          <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Hatch Status LED Indicator */}
        <mesh position={[0.3, -0.68, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={1.0}
          />
        </mesh>
      </group>

      {/* Telemetry Mast & Communications Dish */}
      <group position={[-1.6, 1.8, -1.2]}>
        {/* Mast Pylon */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 1.6, 8]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Communication Dish */}
        <mesh position={[0, 1.3, 0]} rotation={[0.4, 0.3, 0.2]}>
          <cylinderGeometry args={[0.35, 0.05, 0.1, 16]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Apex Blinking Telemetry Strobe */}
        <mesh ref={beaconRef} position={[0, 1.45, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#EF4444"
            emissiveIntensity={1.0}
          />
        </mesh>
      </group>

      {/* Local Ambient Life Support Glow Light */}
      <pointLight
        ref={pointLightRef}
        position={[0, 1.4, 0]}
        intensity={1.8}
        color="#00F0FF"
        distance={7.5}
        decay={2}
      />
    </group>
  );
};

export default HabitatDome;

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Phase 13.2: Habitat Dome with Atmospheric Corona Glow (THREE.BackSide)
 * Changes color reactively according to life support state:
 * - Nominal (+20°C, O₂ >= 19.5%): Gentle Cyan (#00F0FF)
 * - Deep Freeze (< 5°C down to -60°C): Ice Blue (#4FD0E3)
 * - Critical Hypoxia (O₂ < 19.5%): Rapid Pulsing Crimson (#EF4444)
 */
export const HabitatDome: React.FC = () => {
  const outerDomeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.MeshBasicMaterial>(null);
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

    // Determine reactive atmospheric colors
    // Nominal Cyan (#00F0FF) -> Ice Blue (#4FD0E3) -> Crimson (#EF4444)
    let targetColor = '#00F0FF';
    let pulseFrequency = 1.8;
    let baseOpacity = 0.15;

    if (oxygen < 19.5) {
      targetColor = '#EF4444'; // Lethal/Danger Crimson
      pulseFrequency = 6.0;    // Rapid emergency alarm pulse
      baseOpacity = 0.22;
    } else if (temperature < 5.0) {
      targetColor = '#4FD0E3'; // Ice Blue Freezing
      pulseFrequency = 2.0;
      baseOpacity = 0.18;
    } else if (emergencySaver) {
      targetColor = '#FFB020'; // Amber Conservation Mode
      pulseFrequency = 2.5;
    }

    // Breathing pulse calculation
    const pulseFactor = 0.5 + Math.sin(elapsed * pulseFrequency) * 0.25;

    // Atmospheric BackSide Corona glow update
    if (atmosphereRef.current) {
      atmosphereRef.current.color.lerp(new THREE.Color(targetColor), delta * 4.0);
      atmosphereRef.current.opacity = baseOpacity + (oxygen < 19.5 ? Math.sin(elapsed * 6.0) * 0.08 : 0);
    }

    if (coreRef.current && (coreRef.current.material as THREE.MeshStandardMaterial)) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissive.lerp(new THREE.Color(targetColor), delta * 4.0);
      mat.emissiveIntensity = pulseFactor;
    }

    if (pointLightRef.current) {
      pointLightRef.current.color.lerp(new THREE.Color(targetColor), delta * 4.0);
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
      {/* Outer Pressurized Geodesic Dome Observation Glass */}
      <mesh ref={outerDomeRef} position={[0, 1.25, 0]} castShadow receiveShadow>
        <sphereGeometry args={[2.3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#64748B"
          metalness={0.8}
          roughness={0.1}
          transparent
          opacity={0.38}
          flatShading
        />
      </mesh>

      {/* Atmospheric Interior BackSide Corona Glow (Phase 13.2) */}
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[2.28, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          ref={atmosphereRef}
          side={THREE.BackSide}
          color="#00F0FF"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Structural Geodesic Frame Struts */}
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[2.31, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.9}
          roughness={0.2}
          wireframe
        />
      </mesh>

      {/* Structural Compression Ring Collar */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[2.32, 2.38, 0.2, 24]} />
        <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} flatShading />
      </mesh>

      {/* Inner Laboratory Foundation Deck */}
      <mesh ref={coreRef} position={[0, 0.35, 0]}>
        <cylinderGeometry args={[1.7, 1.9, 0.5, 20]} />
        <meshStandardMaterial
          color="#0F172A"
          emissive="#00F0FF"
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.4}
          flatShading
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
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 1.6, 8]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.3, 0]} rotation={[0.4, 0.3, 0.2]}>
          <cylinderGeometry args={[0.35, 0.05, 0.1, 16]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.3} />
        </mesh>
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
        color="#00F0FF"
        intensity={1.2}
        distance={7}
        decay={2}
        position={[0, 1.2, 0]}
      />
    </group>
  );
};

export default HabitatDome;

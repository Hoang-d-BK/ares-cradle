import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

const LED_COUNT = 6;

export const BatteryBank: React.FC = () => {
  const ledRefs = useRef<(THREE.Mesh | null)[]>([]);
  const pointLightRef = useRef<THREE.PointLight>(null);

  const battery = useOutpostStore((state) => state.battery);
  const netPower = useOutpostStore((state) => state.netPower);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const isCharging = netPower > 0;
    const isBrownout = battery <= 0;

    // Determine color based on overall battery health
    let activeColor = '#10B981'; // Nominal Emerald
    if (battery < 20.0) {
      activeColor = '#EF4444';   // Critical Crimson
    } else if (battery < 50.0) {
      activeColor = '#FFB020';   // Warning Amber
    }

    // Update each LED segment
    ledRefs.current.forEach((mesh, index) => {
      if (!mesh || !(mesh.material as THREE.MeshStandardMaterial)) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;

      const segmentThreshold = ((index + 1) / LED_COUNT) * 100;
      const isLit = battery >= segmentThreshold - (100 / LED_COUNT) * 0.5;

      if (isBrownout) {
        // Strobe emergency hazard flash
        const flash = Math.sin(elapsed * 5.0) > 0 ? 0.9 : 0.05;
        mat.emissive.set('#EF4444');
        mat.emissiveIntensity = flash;
      } else if (isLit) {
        mat.emissive.set(activeColor);
        if (isCharging) {
          // Flowing charge wave animation
          const wave = Math.sin(elapsed * 4.0 - index * 0.8);
          mat.emissiveIntensity = 0.5 + Math.max(0, wave) * 0.7;
        } else {
          // Steady battery discharge glow
          mat.emissiveIntensity = 0.75;
        }
      } else {
        // Unlit dark segment
        mat.emissive.set('#000000');
        mat.emissiveIntensity = 0;
      }
    });

    if (pointLightRef.current) {
      pointLightRef.current.color.set(isBrownout ? '#EF4444' : activeColor);
      pointLightRef.current.intensity = isBrownout
        ? Math.sin(elapsed * 5.0) > 0 ? 0.8 : 0.1
        : (battery / 100) * 1.2;
    }
  });

  return (
    <group position={[3.8, 0, -1.6]} rotation={[0, -0.4, 0]}>
      {/* Battery Container Substation Vault */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.1, 2.2]} />
        <meshStandardMaterial
          color="#1E293B"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Armored Roof & Cooling Heat Sink Fins */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[1.45, 0.12, 2.05]} />
        <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
      </mesh>
      {[-0.5, -0.25, 0, 0.25, 0.5].map((xOffset, i) => (
        <mesh key={i} position={[xOffset, 1.14, 0]}>
          <boxGeometry args={[0.04, 0.08, 1.9]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}

      {/* Front Telemetry Display Bezel */}
      <mesh position={[-0.81, 0.45, 0]}>
        <boxGeometry args={[0.04, 0.75, 1.6]} />
        <meshStandardMaterial color="#0B0F19" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Dynamic LED Charge Indicator Segments */}
      <group position={[-0.83, 0.45, 0]}>
        {Array.from({ length: LED_COUNT }).map((_, index) => {
          const zPos = -0.55 + index * 0.22;
          return (
            <mesh
              key={index}
              ref={(el) => { ledRefs.current[index] = el; }}
              position={[0, 0, zPos]}
            >
              <boxGeometry args={[0.02, 0.45, 0.14]} />
              <meshStandardMaterial
                color="#0F172A"
                emissive="#10B981"
                emissiveIntensity={0.6}
                roughness={0.2}
              />
            </mesh>
          );
        })}
      </group>

      {/* High-Voltage Heavy Gauge Conduits */}
      <mesh position={[-0.4, -0.25, 0.8]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 12]} />
        <meshStandardMaterial color="#FFB020" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Local Battery Status Radiance */}
      <pointLight
        ref={pointLightRef}
        position={[-1.2, 0.6, 0]}
        intensity={0.8}
        color="#10B981"
        distance={4.5}
        decay={2}
      />
    </group>
  );
};

export default BatteryBank;

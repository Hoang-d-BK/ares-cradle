import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

const PARTICLE_COUNT = 900;

export const DustStormParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const activeEvents = useOutpostStore((state) => state.activeEvents);
  const graphicsQuality = useOutpostStore((state) => state.graphicsQuality);

  const activeParticleBudget =
    graphicsQuality === 'low' ? 240 : graphicsQuality === 'medium' ? 540 : PARTICLE_COUNT;

  const isStormActive = activeEvents.some(
    (e) => e.active && !e.resolved && e.type === 'dust_storm'
  );

  // Initialize random particle positions & velocities
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      // Spread across a 36m x 10m x 36m volume centered on outpost
      pos[idx] = (Math.random() - 0.5) * 36;
      pos[idx + 1] = Math.random() * 8 + 0.1;
      pos[idx + 2] = (Math.random() - 0.5) * 36;

      // Base random drift velocity
      vel[idx] = (Math.random() - 0.5) * 0.4;
      vel[idx + 1] = -Math.random() * 0.2;
      vel[idx + 2] = (Math.random() - 0.5) * 0.4;
    }

    return [pos, vel];
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const geo = pointsRef.current.geometry;
    geo.setDrawRange(0, activeParticleBudget);
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    // Wind speed surges dramatically during a dust storm
    const windSpeed = isStormActive ? 14.0 : 0.8;
    const windDirectionX = isStormActive ? -1.0 : -0.3;
    const windDirectionZ = isStormActive ? 0.6 : 0.2;

    for (let i = 0; i < activeParticleBudget; i++) {
      const idx = i * 3;

      // Update position along wind trajectory
      posArray[idx] += (windDirectionX * windSpeed + velocities[idx]) * delta;
      posArray[idx + 1] += (velocities[idx + 1] - (isStormActive ? 0.3 : 0.05)) * delta;
      posArray[idx + 2] += (windDirectionZ * windSpeed + velocities[idx + 2]) * delta;

      // Wrap particles continuously across diorama boundaries
      if (posArray[idx] < -18) posArray[idx] = 18;
      if (posArray[idx] > 18) posArray[idx] = -18;
      if (posArray[idx + 1] < 0.05) posArray[idx + 1] = 8.0;
      if (posArray[idx + 1] > 8.5) posArray[idx + 1] = 0.1;
      if (posArray[idx + 2] < -18) posArray[idx + 2] = 18;
      if (posArray[idx + 2] > 18) posArray[idx + 2] = -18;
    }

    posAttr.needsUpdate = true;

    // Smoothly interpolate material properties
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    const targetSize = isStormActive ? 0.18 : 0.06;
    const targetOpacity = isStormActive ? 0.75 : 0.22;

    mat.size = THREE.MathUtils.lerp(mat.size, targetSize, delta * 3.0);
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 3.0);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#D95A2B"
        transparent
        opacity={0.22}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default DustStormParticles;

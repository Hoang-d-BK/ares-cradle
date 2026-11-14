import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type OpeningStep = 'landing' | 'briefing' | 'complete';

interface OpeningSequence3DProps {
  step: OpeningStep;
  onLanded: () => void;
}

/** Short, skippable landing vignette built from lightweight procedural geometry. */
export const OpeningSequence3D: React.FC<OpeningSequence3DProps> = ({ step, onLanded }) => {
  const lander = useRef<THREE.Group>(null);
  const ramp = useRef<THREE.Group>(null);
  const plume = useRef<THREE.Points>(null);
  const landedOnce = useRef(false);
  const landingStart = useRef<number | null>(null);
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const { camera } = useThree();

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const elapsed = state.clock.getElapsedTime();
    if (step !== 'complete') {
      if (!reducedMotion.current) {
        const shot = elapsed < 2.4
          ? { position: new THREE.Vector3(12, 22, 34), target: new THREE.Vector3(0, 18, 8) }
          : elapsed < 4.8
            ? { position: new THREE.Vector3(7, 10, 22), target: new THREE.Vector3(0, 4, 9) }
            : { position: new THREE.Vector3(10, 7, 19), target: new THREE.Vector3(0, 3, 9) };
        camera.position.lerp(shot.position, safeDelta * 1.6);
        camera.lookAt(shot.target);
      } else {
        camera.lookAt(0, 3, 8);
      }
    }

    if (step === 'landing' && lander.current) {
      if (landingStart.current === null) landingStart.current = elapsed;
      const progress = reducedMotion.current
        ? 1
        : THREE.MathUtils.clamp((elapsed - landingStart.current) / 5.5, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      lander.current.position.y = THREE.MathUtils.lerp(22, 1.9, eased);
      lander.current.rotation.z = reducedMotion.current ? 0 : Math.sin(elapsed * 2.3) * (1 - progress) * 0.025;
      lander.current.rotation.x = reducedMotion.current ? 0 : Math.sin(elapsed * 1.4) * (1 - progress) * 0.018;
      if (plume.current) plume.current.visible = progress > 0.28;
      if (progress >= 1 && !landedOnce.current) {
        landedOnce.current = true;
        onLanded();
      }
    }

    if (step !== 'landing' && lander.current) {
      lander.current.position.y = THREE.MathUtils.lerp(lander.current.position.y, 1.9, safeDelta * 3);
      lander.current.rotation.set(0, 0, 0);
      if (plume.current) plume.current.visible = false;
    }

    if (ramp.current) {
      const target = step === 'briefing' || step === 'complete' ? -0.72 : 0;
      ramp.current.rotation.x = reducedMotion.current
        ? target
        : THREE.MathUtils.lerp(ramp.current.rotation.x, target, safeDelta * 2.2);
    }
  });

  const plumePositions = useMemo(() => {
    const positions = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 3.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 1.8 - 0.4;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);

  return (
    <group>
      <group ref={lander} position={[0, 22, 9]}>
        {/* CRADLE-01 cargo lander */}
        <mesh castShadow>
          <cylinderGeometry args={[1.15, 1.35, 3.4, 8]} />
          <meshStandardMaterial color="#d6d5cb" metalness={0.58} roughness={0.4} flatShading />
        </mesh>
        <mesh position={[0, 1.78, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[1.15, 1.1, 8]} />
          <meshStandardMaterial color="#9ba6ae" metalness={0.45} roughness={0.36} flatShading />
        </mesh>
        <mesh position={[0, 0.15, 1.17]}>
          <boxGeometry args={[0.72, 0.42, 0.08]} />
          <meshStandardMaterial color="#f59e0b" emissive="#c1440e" emissiveIntensity={0.45} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (Math.PI / 2) * i, 0]}>
            <mesh position={[0, -1.35, 1.05]} rotation={[0.25, 0, 0]} castShadow>
              <boxGeometry args={[0.16, 1.9, 0.16]} />
              <meshStandardMaterial color="#65717b" metalness={0.78} roughness={0.3} />
            </mesh>
            <mesh position={[0, -2.25, 1.05]} castShadow>
              <boxGeometry args={[0.7, 0.12, 0.48]} />
              <meshStandardMaterial color="#414c55" metalness={0.72} roughness={0.38} />
            </mesh>
          </group>
        ))}
        <group ref={ramp} position={[0, -1.2, 1.35]}>
          <mesh position={[0, -0.65, 1.05]} rotation={[-0.04, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.12, 2.4]} />
            <meshStandardMaterial color="#59636b" metalness={0.65} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.58, 2.2]}>
            <boxGeometry args={[2.1, 0.06, 0.12]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.24} />
          </mesh>
        </group>
        <points ref={plume} position={[0, -2.2, 0]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[plumePositions, 3]} />
          </bufferGeometry>
          <pointsMaterial color="#f1a36b" size={0.24} transparent opacity={0.48} depthWrite={false} />
        </points>
        <pointLight position={[0, -1.9, 0]} color="#ff9c4a" intensity={4} distance={9} />
      </group>
      {/* Landing marker and cargo footprint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.43, 9]}>
        <ringGeometry args={[2.5, 2.64, 48]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, -0.37, 9]}>
        <cylinderGeometry args={[1.9, 2.2, 0.12, 24]} />
        <meshStandardMaterial color="#303b45" metalness={0.7} roughness={0.45} />
      </mesh>
    </group>
  );
};

export default OpeningSequence3D;

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Task 10.3: Celestial Skybox & Orbiting Phobos Moon (Trụ Cột 3)
 * Simulates the Martian night sky with twinkling background stars
 * and an irregularly shaped low-poly potato moon (Phobos) orbiting via Keplerian approximation.
 */
export const SpaceSkybox: React.FC = () => {
  const phobosGroupRef = useRef<THREE.Group>(null);
  const phobosMeshRef = useRef<THREE.Mesh>(null);
  const solTime = useOutpostStore((state) => state.solTime);
  const solPhase = useOutpostStore((state) => state.solPhase);

  // Procedural potato shape deformation for Phobos
  const phobosGeometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.85, 1);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();

    // Asymmetric elongation and crater-like noise
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // Elongate along X axis (Phobos triaxial ellipsoid: 27 x 22 x 18 km)
      v.x *= 1.35;
      v.y *= 1.05;
      v.z *= 0.85;

      // Subtle surface deformation
      const noise = Math.sin(v.x * 4.0) * Math.cos(v.y * 3.5) * 0.08;
      v.addScaledVector(v.clone().normalize(), noise);

      pos.setXYZ(i, v.x, v.y, v.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((_, delta) => {
    // Phobos orbital mechanics: fast orbit west-to-east
    // In our 60s Sol cycle, Phobos completes nearly 3 fast passes
    const orbitalSpeed = 0.22;
    const currentAngle = solTime * orbitalSpeed;

    const orbitRadiusX = 16.5;
    const orbitRadiusZ = 14.0;
    const orbitHeight = 9.5;

    if (phobosGroupRef.current) {
      phobosGroupRef.current.position.x = Math.cos(currentAngle) * orbitRadiusX;
      phobosGroupRef.current.position.z = Math.sin(currentAngle) * orbitRadiusZ - 2.0;
      phobosGroupRef.current.position.y = orbitHeight + Math.sin(currentAngle * 2) * 1.5;
    }

    // Slow axial rotation as it tumbles along orbit
    if (phobosMeshRef.current) {
      phobosMeshRef.current.rotation.y += delta * 0.4;
      phobosMeshRef.current.rotation.x += delta * 0.2;
    }
  });

  const isNight = solPhase === 'Night' || solPhase === 'Sunset';

  return (
    <group dispose={null}>
      {/* Background Deep Space Starfield */}
      <Stars
        radius={45}
        depth={25}
        count={isNight ? 1800 : 700}
        factor={3.5}
        saturation={0.1}
        fade
        speed={0.4}
      />

      {/* Orbiting Low-Poly Potato Moon (Phobos) */}
      <group ref={phobosGroupRef} position={[15, 9.5, 0]}>
        <mesh
          ref={phobosMeshRef}
          geometry={phobosGeometry}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#5C5349"
            roughness={0.92}
            metalness={0.08}
            flatShading
          />
        </mesh>

        {/* Stickney Giant Impact Crater Accent */}
        <mesh position={[0.55, 0.2, 0.2]} scale={[0.3, 0.1, 0.3]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#3D362F"
            roughness={0.98}
            flatShading
          />
        </mesh>

        {/* Subtle Solar Reflected Moonlight */}
        <pointLight
          color="#D4D4D8"
          intensity={isNight ? 0.35 : 0.1}
          distance={6}
          decay={2}
        />
      </group>
    </group>
  );
};

export default SpaceSkybox;

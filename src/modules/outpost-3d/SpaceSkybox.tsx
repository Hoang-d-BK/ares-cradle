import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Procedural Canvas Texture Generator (Learned from NASA-Live-Orrery/solar-system.js)
 * Guarantees crisp 60 FPS celestial and surface textures without external asset requests or CORS issues.
 */
export function createProceduralMoonTexture(moonType: 'phobos' | 'deimos'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Base celestial regolith color
  const baseColor = moonType === 'phobos' ? '#5A524A' : '#6B665E';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Gradient lighting simulation
  const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Procedural impact craters and dust striations
  const craterCount = moonType === 'phobos' ? 35 : 22;
  for (let i = 0; i < craterCount; i++) {
    const cx = (Math.sin(i * 123.45) * 0.5 + 0.5) * 512;
    const cy = (Math.cos(i * 678.90) * 0.5 + 0.5) * 512;
    const cr = 4 + (Math.sin(i * 45.67) * 0.5 + 0.5) * 16;

    // Crater rim shadow & highlight
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(25, 22, 19, 0.55)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, cr * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180, 170, 160, 0.2)';
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Phase 13.1: NASA 3D Orbital & Atmospheric Visuals
 * Real Martian Keplerian Orbits:
 * - Phobos: 7.66h orbital period (approx ~3.13 passes per 24h Martian Sol), orbits West-to-East rapidly.
 * - Deimos: 30.35h orbital period (approx ~0.79 pass per Sol), slower high-altitude orbit.
 * - Procedural canvas textures ensure 60 FPS performance on Chromebooks & offline mode.
 */
export const SpaceSkybox: React.FC = () => {
  const phobosGroupRef = useRef<THREE.Group>(null);
  const phobosMeshRef = useRef<THREE.Mesh>(null);
  const deimosGroupRef = useRef<THREE.Group>(null);
  const deimosMeshRef = useRef<THREE.Mesh>(null);

  const solTime = useOutpostStore((state) => state.solTime);
  const solPhase = useOutpostStore((state) => state.solPhase);
  const isSkyViewActive = useOutpostStore((state) => state.isSkyViewActive);

  // Procedural canvas textures for both moons
  const phobosTexture = useMemo(() => createProceduralMoonTexture('phobos'), []);
  const deimosTexture = useMemo(() => createProceduralMoonTexture('deimos'), []);

  // Procedural irregular potato geometry for Phobos (27 x 22 x 18 km)
  const phobosGeometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.85, 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x *= 1.35;
      v.y *= 1.05;
      v.z *= 0.82;
      const noise = Math.sin(v.x * 4.2) * Math.cos(v.y * 3.6) * 0.09;
      v.addScaledVector(v.clone().normalize(), noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Procedural irregular geometry for Deimos (15 x 12 x 11 km)
  const deimosGeometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.48, 1);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x *= 1.25;
      v.y *= 0.95;
      v.z *= 0.88;
      const noise = Math.sin(v.x * 3.5) * Math.cos(v.z * 3.2) * 0.06;
      v.addScaledVector(v.clone().normalize(), noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((_, delta) => {
    // 60-second game Sol corresponds to 24.6h Martian Sol
    // Phobos (7.66h period): completes 24.6 / 7.66 = 3.21 revolutions per 60s
    const phobosSpeed = (Math.PI * 2 * 3.21) / 60;
    const phobosAngle = solTime * phobosSpeed;

    const phobosRadiusX = 18.0;
    const phobosRadiusZ = 15.0;
    const phobosBaseHeight = 10.5;

    if (phobosGroupRef.current) {
      phobosGroupRef.current.position.x = Math.cos(phobosAngle) * phobosRadiusX;
      phobosGroupRef.current.position.z = Math.sin(phobosAngle) * phobosRadiusZ - 1.5;
      phobosGroupRef.current.position.y = phobosBaseHeight + Math.sin(phobosAngle * 1.5) * 1.8;
    }

    if (phobosMeshRef.current) {
      phobosMeshRef.current.rotation.y += delta * 0.4;
      phobosMeshRef.current.rotation.x += delta * 0.15;
    }

    // Deimos (30.35h period): completes 24.6 / 30.35 = 0.81 revolutions per 60s
    const deimosSpeed = (Math.PI * 2 * 0.81) / 60;
    const deimosAngle = solTime * deimosSpeed + 1.8; // Offset initial phase

    const deimosRadiusX = 26.0;
    const deimosRadiusZ = 23.0;
    const deimosBaseHeight = 14.5;

    if (deimosGroupRef.current) {
      deimosGroupRef.current.position.x = Math.cos(deimosAngle) * deimosRadiusX;
      deimosGroupRef.current.position.z = Math.sin(deimosAngle) * deimosRadiusZ + 2.0;
      deimosGroupRef.current.position.y = deimosBaseHeight + Math.cos(deimosAngle) * 2.2;
    }

    if (deimosMeshRef.current) {
      deimosMeshRef.current.rotation.y += delta * 0.2;
      deimosMeshRef.current.rotation.z += delta * 0.1;
    }
  });

  const isNight = solPhase === 'Night' || solPhase === 'Sunset';

  return (
    <group dispose={null}>
      {/* Background Starfield */}
      <Stars
        radius={isSkyViewActive ? 60 : 45}
        depth={30}
        count={isNight ? 2200 : 800}
        factor={3.8}
        saturation={0.15}
        fade
        speed={0.3}
      />

      {/* Orbiting Phobos (Potato Moon Alpha) */}
      <group ref={phobosGroupRef} position={[18, 10.5, 0]}>
        <mesh
          ref={phobosMeshRef}
          geometry={phobosGeometry}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={phobosTexture}
            color="#C4B5A5"
            roughness={0.92}
            metalness={0.08}
            flatShading
          />
        </mesh>

        {/* Stickney Giant Impact Crater */}
        <mesh position={[0.55, 0.2, 0.2]} scale={[0.32, 0.12, 0.32]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#3D362F"
            roughness={0.98}
            flatShading
          />
        </mesh>

        {/* Solar Reflected Moonlight */}
        <pointLight
          color="#E2E8F0"
          intensity={isNight ? 0.45 : 0.1}
          distance={8}
          decay={2}
        />
      </group>

      {/* Orbiting Deimos (Outer Potato Moon Beta) */}
      <group ref={deimosGroupRef} position={[-25, 14.5, 5]}>
        <mesh
          ref={deimosMeshRef}
          geometry={deimosGeometry}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={deimosTexture}
            color="#A8A29E"
            roughness={0.94}
            metalness={0.05}
            flatShading
          />
        </mesh>

        <pointLight
          color="#CBD5E1"
          intensity={isNight ? 0.25 : 0.05}
          distance={6}
          decay={2}
        />
      </group>

      {/* ========================================================
          VISIBLE SOLAR SYSTEM CELESTIAL BODIES (For Stargazing)
          ======================================================== */}
      {/* 1. Earth & The Moon (The Pale Blue Dot) */}
      <group position={[48, 30, -55]}>
        <mesh>
          <sphereGeometry args={[0.75, 20, 16]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#0284C7"
            emissiveIntensity={1.2}
            roughness={0.2}
          />
        </mesh>
        {/* Earth Atmosphere Blue Corona */}
        <mesh scale={[1.15, 1.15, 1.15]}>
          <sphereGeometry args={[0.75, 16, 12]} />
          <meshBasicMaterial color="#60A5FA" transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>
        {/* Orbiting Moon */}
        <mesh position={[1.6, 0.4, 0.2]}>
          <sphereGeometry args={[0.2, 12, 10]} />
          <meshStandardMaterial color="#E2E8F0" emissive="#CBD5E1" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* 2. Jupiter (Great Gas Giant) */}
      <group position={[-52, 38, -42]}>
        <mesh>
          <sphereGeometry args={[1.6, 24, 16]} />
          <meshStandardMaterial
            color="#F59E0B"
            emissive="#D97706"
            emissiveIntensity={0.9}
            roughness={0.4}
          />
        </mesh>
        {/* Striped Cloud Belt Rings */}
        {[-0.4, 0, 0.4].map((by, bIdx) => (
          <mesh key={`jbelt-${bIdx}`} position={[0, by, 0]}>
            <cylinderGeometry args={[1.61, 1.61, 0.22, 24, 1, true]} />
            <meshBasicMaterial color="#B45309" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>

      {/* 3. Saturn & Golden Rings */}
      <group position={[58, 34, 38]} rotation={[0.45, 0.2, 0.35]}>
        {/* Planet Core */}
        <mesh>
          <sphereGeometry args={[1.2, 20, 16]} />
          <meshStandardMaterial
            color="#FEF08A"
            emissive="#CA8A04"
            emissiveIntensity={0.8}
            roughness={0.5}
          />
        </mesh>
        {/* Golden Equatorial Planetary Rings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.6, 2.8, 32]} />
          <meshStandardMaterial
            color="#FDE047"
            emissive="#CA8A04"
            emissiveIntensity={0.6}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>
    </group>
  );
};

export default SpaceSkybox;

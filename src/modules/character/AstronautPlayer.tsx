import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Task 12.2: Interactive Astronaut Player (Cadet Leo)
 * Architecture 3.1 & 3.2:
 * - Controls: WASD, Arrow keys, VirtualJoystick
 * - Dynamic rotation: Math.atan2(moveX, moveZ)
 * - Walking leg/arm swing & footstep bounce
 * - Dual space airlock proximity detection
 */
export const AstronautPlayer: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const keysPressed = useRef<Record<string, boolean>>({});
  const walkCycle = useRef(0);

  const joystickVector = useOutpostStore((state) => state.joystickVector);
  const setPlayerPos = useOutpostStore((state) => state.setPlayerPos);
  const isInsideHabitat = useOutpostStore((state) => state.isInsideHabitat);
  const setIsInsideHabitat = useOutpostStore((state) => state.setIsInsideHabitat);

  // Keyboard Event Listeners for WASD and Arrow Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressed.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const safeDelta = Math.min(delta, 0.1);
    const speed = 3.6; // m/s

    // Calculate movement vector from Keyboard
    let kbX = 0;
    let kbZ = 0;

    if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) kbZ -= 1;
    if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) kbZ += 1;
    if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) kbX -= 1;
    if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) kbX += 1;

    // Combine Keyboard and Virtual Joystick
    let totalX = kbX + joystickVector.x;
    let totalZ = kbZ + joystickVector.y;

    const length = Math.sqrt(totalX * totalX + totalZ * totalZ);
    const isMoving = length > 0.05;

    if (isMoving) {
      // Normalize direction vector
      const normX = totalX / (length > 1 ? length : 1);
      const normZ = totalZ / (length > 1 ? length : 1);

      // Move player position
      groupRef.current.position.x += normX * speed * safeDelta;
      groupRef.current.position.z += normZ * speed * safeDelta;

      // Restrict boundaries within Martian outpost area (radius 14m)
      const distFromCenter = Math.sqrt(
        groupRef.current.position.x * groupRef.current.position.x +
        groupRef.current.position.z * groupRef.current.position.z
      );
      if (distFromCenter > 14) {
        groupRef.current.position.x = (groupRef.current.position.x / distFromCenter) * 14;
        groupRef.current.position.z = (groupRef.current.position.z / distFromCenter) * 14;
      }

      // Smooth rotation toward movement vector
      const targetAngle = Math.atan2(normX, normZ);
      // Interpolate angle without winding flip
      let diff = targetAngle - groupRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      groupRef.current.rotation.y += diff * 12 * safeDelta;

      // Animate walking limbs
      walkCycle.current += safeDelta * 10;
      const swing = Math.sin(walkCycle.current);

      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = swing * 0.45;
        rightLegRef.current.rotation.x = -swing * 0.45;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -swing * 0.4;
        rightArmRef.current.rotation.x = swing * 0.4;
      }
      // Bobbing head & body bounce
      groupRef.current.position.y = -0.4 + Math.abs(Math.sin(walkCycle.current)) * 0.06;
    } else {
      // Idle pose reset
      groupRef.current.position.y = -0.4 + Math.sin(walkCycle.current) * 0.02;
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x *= 0.85;
        rightLegRef.current.rotation.x *= 0.85;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x *= 0.85;
        rightArmRef.current.rotation.x *= 0.85;
      }
    }

    // Sync position to store
    setPlayerPos([
      groupRef.current.position.x,
      groupRef.current.position.y,
      groupRef.current.position.z
    ]);

    // Airlock Proximity Check (Airlock door at [2.2, 0.35, 0], Dome radius ~ 2.2m)
    const px = groupRef.current.position.x;
    const pz = groupRef.current.position.z;
    const rad = Math.sqrt(px * px + pz * pz);

    // If inside dome radius or near airlock entry
    const isInside = rad < 1.95;
    if (isInside !== isInsideHabitat) {
      setIsInsideHabitat(isInside);
    }
  });

  return (
    <group ref={groupRef} position={[1.8, -0.4, 2.5]} dispose={null}>
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

      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.29, 0.55, 0]} castShadow>
        <boxGeometry args={[0.14, 0.42, 0.16]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.4} metalness={0.1} flatShading />
      </mesh>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.29, 0.55, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.42, 0.16]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.4} metalness={0.1} flatShading />
        </mesh>
      </group>

      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.13, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.35, 0.18]} />
        <meshStandardMaterial color="#64748B" roughness={0.5} flatShading />
      </mesh>

      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.13, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.35, 0.18]} />
        <meshStandardMaterial color="#64748B" roughness={0.5} flatShading />
      </mesh>
    </group>
  );
};

export default AstronautPlayer;

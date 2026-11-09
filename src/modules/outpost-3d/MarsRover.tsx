import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';

/**
 * Phase 13.1: Interactive Playable Low-Poly Mars Rover
 * Features:
 * - Direct driving mode via WASD / Arrow Keys or Virtual Joystick
 * - Rocker-Bogie 6-wheel spin animations proportional to speed
 * - Dual front illumination spotlights for night exploration
 * - Click or press 'R' to mount/dismount rover and explore the red planet
 */
export const MarsRover: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mastRef = useRef<THREE.Group>(null);
  const dishRef = useRef<THREE.Mesh>(null);
  const wheelsRef = useRef<THREE.Group[]>([]);
  const [hovered, setHovered] = useState(false);

  const isDrivingRover = useOutpostStore((state) => state.isDrivingRover);
  const toggleDrivingRover = useOutpostStore((state) => state.toggleDrivingRover);
  const roverPos = useOutpostStore((state) => state.roverPos);
  const setRoverPos = useOutpostStore((state) => state.setRoverPos);
  const setPlayerPos = useOutpostStore((state) => state.setPlayerPos);
  const joystickVector = useOutpostStore((state) => state.joystickVector);

  const keysPressed = useRef<Record<string, boolean>>({});
  const heading = useRef(0.85); // radians
  const currentSpeed = useRef(0);

  // Keyboard controls for rover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressed.current[e.code] = true;

      // Toggle drive with 'KeyR'
      if (e.code === 'KeyR') {
        toggleDrivingRover();
      }
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
  }, [toggleDrivingRover]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    // Mastcam scanning
    if (mastRef.current) {
      mastRef.current.rotation.y = Math.sin(t * 0.7) * 0.35;
    }

    // High gain antenna rotation
    if (dishRef.current) {
      dishRef.current.rotation.y += safeDelta * 0.6;
    }

    if (!groupRef.current) return;

    if (isDrivingRover) {
      // Driving physics: WASD / Arrow Keys
      let forward = 0;
      let steer = 0;

      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) forward += 1;
      if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) forward -= 1;
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) steer += 1;
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) steer -= 1;

      // Add joystick input
      forward -= joystickVector.y;
      steer -= joystickVector.x;

      // Steering turn rate
      if (Math.abs(steer) > 0.05) {
        heading.current += steer * 2.2 * safeDelta;
      }

      // Acceleration / Deceleration
      const maxSpeed = 5.2; // m/s
      const targetSpeed = forward * maxSpeed;
      currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetSpeed, safeDelta * 4.0);

      // Move in heading direction
      const dx = Math.sin(heading.current) * currentSpeed.current * safeDelta;
      const dz = Math.cos(heading.current) * currentSpeed.current * safeDelta;

      let newX = groupRef.current.position.x + dx;
      let newZ = groupRef.current.position.z + dz;

      // Boundary clamp within expanded exploration radius 34m
      const dist = Math.sqrt(newX * newX + newZ * newZ);
      if (dist > 34) {
        newX = (newX / dist) * 34;
        newZ = (newZ / dist) * 34;
      }

      groupRef.current.position.x = newX;
      groupRef.current.position.z = newZ;
      groupRef.current.rotation.y = heading.current;

      // Update store positions
      setRoverPos([newX, -0.32, newZ]);
      setPlayerPos([newX, -0.32, newZ]);

      // Spin wheels based on forward motion
      const wheelRotation = currentSpeed.current * safeDelta * 5.0;
      wheelsRef.current.forEach((wheelGroup) => {
        if (wheelGroup) {
          wheelGroup.rotation.x += wheelRotation;
        }
      });
    } else {
      // Parked mode at store position
      groupRef.current.position.x = roverPos[0];
      groupRef.current.position.y = roverPos[1];
      groupRef.current.position.z = roverPos[2];
    }
  });

  const handleRoverClick = (e: any) => {
    e.stopPropagation();
    soundEngine.playClick(1400);
    toggleDrivingRover();
  };

  return (
    <group
      ref={groupRef}
      position={roverPos}
      rotation={[0, heading.current, 0]}
      dispose={null}
      onClick={handleRoverClick}
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
      {/* Rover Main Chassis Body */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.36, 0.95]} />
        <meshStandardMaterial
          color={isDrivingRover ? '#00F0FF' : hovered ? '#F8FAFC' : '#E2E8F0'}
          emissive={isDrivingRover ? '#00F0FF' : '#000000'}
          emissiveIntensity={isDrivingRover ? 0.2 : 0}
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
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.35, 6]} />
          <meshStandardMaterial color="#C1440E" roughness={0.3} metalness={0.7} flatShading />
        </mesh>
      </group>

      {/* Panning Mastcam */}
      <group ref={mastRef} position={[0.45, 0.65, 0.25]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.9, 8]} />
          <meshStandardMaterial color="#64748B" metalness={0.85} roughness={0.2} flatShading />
        </mesh>
        <mesh position={[0, 0.92, 0]} castShadow>
          <boxGeometry args={[0.24, 0.14, 0.18]} />
          <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} flatShading />
        </mesh>
        <mesh position={[-0.07, 0.92, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 8]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.8} flatShading />
        </mesh>
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

      {/* Front Dual Headlights (Illuminates the Red Planet Surface) */}
      <group position={[0.72, 0.45, 0]}>
        <pointLight color="#00F0FF" intensity={isDrivingRover ? 2.5 : 0.6} distance={9} decay={2} position={[0.2, 0, 0.3]} />
        <pointLight color="#00F0FF" intensity={isDrivingRover ? 2.5 : 0.6} distance={9} decay={2} position={[0.2, 0, -0.3]} />
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
        { x: 0.55, z: 0.56 },
        { x: 0.55, z: -0.56 },
        { x: 0, z: 0.62 },
        { x: 0, z: -0.62 },
        { x: -0.55, z: 0.56 },
        { x: -0.55, z: -0.56 }
      ].map((wheel, idx) => (
        <group
          key={idx}
          ref={(el) => {
            if (el) wheelsRef.current[idx] = el;
          }}
          position={[wheel.x, 0.16, wheel.z]}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.14, 12]} />
            <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} flatShading />
          </mesh>
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

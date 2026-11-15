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
/**
 * NASA Research Bases across Mars Simulation Grid
 */
const FOUR_BASES = [
  { id: 'hub', x: 0, z: 0, rot: 0 },
  { id: 'ice', x: 0, z: -28, rot: 0 },
  { id: 'lake', x: 26, z: 15, rot: -(2 * Math.PI) / 3 },
  { id: 'dust', x: -26, z: 15, rot: (2 * Math.PI) / 3 },
  { id: 'impact', x: -200, z: -170, rot: 0 },
  { id: 'volcano', x: -210, z: 180, rot: 0 },
];

/**
 * High-Precision Multi-Layer Physical Collision System:
 * - Stand securely on grounded deck floor (y = -0.32)
 * - 3 Walk-in Entrance Ramps (Front +Z, Right +X, Left -X) with railing clamps
 * - Central Command & Specimen Research Station Desk Collisions (radius clamp at 1.55m)
 * - Interior Heavy Life Support & Scientific Workstation AABB clamps
 * - Hard radial dome wall collision prevents clipping through outer glass
 * - Parked Rover & Martian Regolith Boulder avoidance in world coordinates
 */
function resolvePlayerPhysics(px: number, pz: number) {
  let nearest = FOUR_BASES[0];
  let minDist = Infinity;
  for (const b of FOUR_BASES) {
    const d = Math.hypot(px - b.x, pz - b.z);
    if (d < minDist) {
      minDist = d;
      nearest = b;
    }
  }

  // Outside base zone entirely - apply world obstacles only
  if (minDist > 14.0) {
    let finalX = px;
    let finalZ = pz;

    // 1. Parked Rover Collision
    const storeState = useOutpostStore.getState();
    if (!storeState.isDrivingRover) {
      const [rx, , rz] = storeState.roverPos;
      const dRover = Math.hypot(finalX - rx, finalZ - rz);
      if (dRover < 1.65) {
        const s = 1.65 / Math.max(0.001, dRover);
        finalX = rx + (finalX - rx) * s;
        finalZ = rz + (finalZ - rz) * s;
      }
    }

    return { x: finalX, z: finalZ, floorY: -0.4, isInside: false };
  }

  const wx = px - nearest.x;
  const wz = pz - nearest.z;
  const cosT = Math.cos(nearest.rot);
  const sinT = Math.sin(nearest.rot);
  let lx = wx * cosT - wz * sinT;
  let lz = wx * sinT + wz * cosT;
  let r = Math.hypot(lx, lz);

  // 3 Entrance Ramp Corridors (Portal 0: Front +Z, Portal 1: Right +X, Portal 2: Left -X)
  const inFrontRamp = Math.abs(lx) <= 1.25 && lz >= 4.5 && lz <= 7.95;
  const inRightRamp = Math.abs(lz) <= 1.25 && lx >= 4.5 && lx <= 7.95;
  const inLeftRamp  = Math.abs(lz) <= 1.25 && lx <= -4.5 && lx >= -7.95;

  let floorY = -0.4;
  let isInside = false;

  if (r <= 4.65) {
    // Inside base dome deck (grounded level at y=-0.32)
    floorY = -0.32;
    isInside = true;

    // 1. Central Command / Research Station Table & Hologram Core (Radius = 1.55m)
    // Prevents Cadet Leo from walking through central desk & hologram in all 4 bases
    if (r < 1.55) {
      const safeR = r > 0.001 ? r : 0.001;
      lx = (lx / safeR) * 1.55;
      lz = (lz / safeR) * 1.55;
      r = 1.55;
    }

    // 2. Interior Workstations & Machinery
    if (nearest.id === 'hub') {
      // Hydroponic Farm (North at lz = -3.1, width = 2.4, depth = 0.5)
      if (Math.abs(lx) < 1.45 && lz < -2.65 && lz > -3.45) {
        lz = -2.65;
      }
      // Sabatier Oxygen Generator (North-West at [-2.2, -2.0], radius = 0.95)
      const dSab = Math.hypot(lx - (-2.2), lz - (-2.0));
      if (dSab < 0.95) {
        const s = 0.95 / Math.max(0.001, dSab);
        lx = -2.2 + (lx - (-2.2)) * s;
        lz = -2.0 + (lz - (-2.0)) * s;
      }
      // Chemical Specimen Workbench (North-East at [2.2, -2.0], radius = 0.95)
      const dChem = Math.hypot(lx - 2.2, lz - (-2.0));
      if (dChem < 0.95) {
        const s = 0.95 / Math.max(0.001, dChem);
        lx = 2.2 + (lx - 2.2) * s;
        lz = -2.0 + (lz - (-2.0)) * s;
      }
      // Command Chairs at [-0.8, -1.2] and [0.8, -1.2]
      for (const cx of [-0.8, 0.8]) {
        const dChair = Math.hypot(lx - cx, lz - (-1.2));
        if (dChair < 0.38) {
          const s = 0.38 / Math.max(0.001, dChair);
          lx = cx + (lx - cx) * s;
          lz = -1.2 + (lz - (-1.2)) * s;
        }
      }
    } else {
      // Regional Outpost: Flight Telemetry Consoles (North at lz = -2.8, width = 2.8, depth = 0.85)
      if (Math.abs(lx) < 1.60 && lz < -2.25 && lz > -3.35) {
        lz = -2.25;
      }
      // Regional Crew Chairs at [-0.7, -1.8] and [0.7, -1.8]
      for (const cx of [-0.7, 0.7]) {
        const dChair = Math.hypot(lx - cx, lz - (-1.8));
        if (dChair < 0.38) {
          const s = 0.38 / Math.max(0.001, dChair);
          lx = cx + (lx - cx) * s;
          lz = -1.8 + (lz - (-1.8)) * s;
        }
      }
    }

    // 3. Hard wall collision from inside: cannot walk through dome glass except via 3 doorways
    r = Math.hypot(lx, lz);
    if (r > 4.52) {
      const atFrontDoor = Math.abs(lx) <= 1.10 && lz > 4.2;
      const atRightDoor = Math.abs(lz) <= 1.10 && lx > 4.2;
      const atLeftDoor  = Math.abs(lz) <= 1.10 && lx < -4.2;
      if (!atFrontDoor && !atRightDoor && !atLeftDoor) {
        lx = (lx / r) * 4.52;
        lz = (lz / r) * 4.52;
      }
    }
  } else if (inFrontRamp) {
    const rampProgress = Math.max(0, Math.min(1, (7.95 - lz) / (7.95 - 4.6)));
    floorY = -0.4 + rampProgress * 0.08;
    lx = Math.max(-1.12, Math.min(1.12, lx));
    if (rampProgress > 0.45) isInside = true;
  } else if (inRightRamp) {
    const rampProgress = Math.max(0, Math.min(1, (7.95 - lx) / (7.95 - 4.6)));
    floorY = -0.4 + rampProgress * 0.08;
    lz = Math.max(-1.12, Math.min(1.12, lz));
    if (rampProgress > 0.45) isInside = true;
  } else if (inLeftRamp) {
    const rampProgress = Math.max(0, Math.min(1, (7.95 - (-lx)) / (7.95 - 4.6)));
    floorY = -0.4 + rampProgress * 0.08;
    lz = Math.max(-1.12, Math.min(1.12, lz));
    if (rampProgress > 0.45) isInside = true;
  } else {
    floorY = -0.4;
    // Hard wall collision from outside: solid foundation seals base; cannot penetrate under/into base dome
    if (r < 5.05) {
      lx = (lx / r) * 5.05;
      lz = (lz / r) * 5.05;
    }

    // Exterior Utility Yard Equipment Collisions
    if (nearest.id === 'hub') {
      // Solar Array at [-9.5, -6.5]
      const dSolar = Math.hypot(lx - (-9.5), lz - (-6.5));
      if (dSolar < 2.2) {
        const s = 2.2 / Math.max(0.001, dSolar);
        lx = -9.5 + (lx - (-9.5)) * s;
        lz = -6.5 + (lz - (-6.5)) * s;
      }
      // Battery Bank at [-7.2, -6.5]
      const dBat = Math.hypot(lx - (-7.2), lz - (-6.5));
      if (dBat < 1.3) {
        const s = 1.3 / Math.max(0.001, dBat);
        lx = -7.2 + (lx - (-7.2)) * s;
        lz = -6.5 + (lz - (-6.5)) * s;
      }
    } else {
      // Regional Landmark at [-6.8, -6.5]
      const dMark = Math.hypot(lx - (-6.8), lz - (-6.5));
      if (dMark < 1.6) {
        const s = 1.6 / Math.max(0.001, dMark);
        lx = -6.8 + (lx - (-6.8)) * s;
        lz = -6.5 + (lz - (-6.5)) * s;
      }
    }
  }

  let finalX = nearest.x + lx * cosT + lz * sinT;
  let finalZ = nearest.z - lx * sinT + lz * cosT;

  // World-Space Parked Rover Collision Check
  const storeState = useOutpostStore.getState();
  if (!storeState.isDrivingRover) {
    const [rx, , rz] = storeState.roverPos;
    const dRover = Math.hypot(finalX - rx, finalZ - rz);
    if (dRover < 1.65) {
      const s = 1.65 / Math.max(0.001, dRover);
      finalX = rx + (finalX - rx) * s;
      finalZ = rz + (finalZ - rz) * s;
    }
  }

  // World-Space CRADLE-01 Cargo Lander Collision
  const dLander = Math.hypot(finalX - 0, finalZ - 16.5);
  if (dLander < 2.0) {
    const s = 2.0 / Math.max(0.001, dLander);
    finalX = 0 + (finalX - 0) * s;
    finalZ = 16.5 + (finalZ - 16.5) * s;
  }

  // World-Space Martian Boulders Collision Check (Around Central Outpost)
  const BOULDERS = [
    { x: -7.5, z: -3.2, r: 0.8 },
    { x: -6.8, z: -2.1, r: 0.6 },
    { x: 6.2, z: -4.5, r: 0.9 },
    { x: 8.1, z: -1.8, r: 0.7 },
    { x: -4.2, z: 6.5, r: 0.8 },
    { x: 3.5, z: 7.2, r: 0.7 },
  ];
  for (const b of BOULDERS) {
    const db = Math.hypot(finalX - b.x, finalZ - b.z);
    if (db < b.r) {
      const s = b.r / Math.max(0.001, db);
      finalX = b.x + (finalX - b.x) * s;
      finalZ = b.z + (finalZ - b.z) * s;
    }
  }

  return { x: finalX, z: finalZ, floorY, isInside };
}

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
  const isDrivingRover = useOutpostStore((state) => state.isDrivingRover);
  const cameraYaw = useOutpostStore((state) => state.cameraYaw);
  const isMouseDriving = useOutpostStore((state) => state.isMouseDriving);
  const isFlashlightOn = useOutpostStore((state) => state.isFlashlightOn);
  const toggleFlashlight = useOutpostStore((state) => state.toggleFlashlight);

  // Local Object3D target attached to torch hierarchy so the beam always points forward
  const [flashlightTarget] = React.useState(() => {
    const obj = new THREE.Object3D();
    obj.position.set(0, -0.3, 14);
    return obj;
  });

  // Keyboard Event Listeners for WASD, Arrow Keys and [F] for Flashlight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressed.current[e.code] = true;

      if (e.code === 'KeyF') {
        toggleFlashlight();
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
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isDrivingRover) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    // Sync external position change (e.g. Fast Travel or base change)
    const storePlayerPos = useOutpostStore.getState().playerPos;
    const diffFromStore = Math.hypot(
      groupRef.current.position.x - storePlayerPos[0],
      groupRef.current.position.z - storePlayerPos[2]
    );
    if (diffFromStore > 3.0) {
      groupRef.current.position.set(storePlayerPos[0], storePlayerPos[1], storePlayerPos[2]);
    }

    const safeDelta = Math.min(delta, 0.1);
    const speed = 4.2; // m/s comfortable walking speed

    // Camera-relative direction vectors (yaw = 0 points towards -Z)
    const forwardX = -Math.sin(cameraYaw);
    const forwardZ = -Math.cos(cameraYaw);
    const rightX = Math.cos(cameraYaw);
    const rightZ = -Math.sin(cameraYaw);

    let inputForward = 0;
    let inputRight = 0;

    if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp'] || isMouseDriving) {
      inputForward += 1;
    }
    if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
      inputForward -= 1;
    }
    if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
      inputRight += 1;
    }
    if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
      inputRight -= 1;
    }

    // Combine with Virtual Joystick
    inputForward -= joystickVector.y;
    inputRight += joystickVector.x;

    let moveX = forwardX * inputForward + rightX * inputRight;
    let moveZ = forwardZ * inputForward + rightZ * inputRight;

    const length = Math.hypot(moveX, moveZ);
    const isMoving = length > 0.05;

    if (isMoving) {
      const normX = moveX / (length > 1 ? length : 1);
      const normZ = moveZ / (length > 1 ? length : 1);

      // Move player position
      let newX = groupRef.current.position.x + normX * speed * safeDelta;
      let newZ = groupRef.current.position.z + normZ * speed * safeDelta;

      // 600x600 Martian Grid boundary clamping (Invariant I01)
      newX = Math.max(-295, Math.min(295, newX));
      newZ = Math.max(-295, Math.min(295, newZ));

      // Physical Base Collisions & Walk-in Entrance Ramps (4 Bases: Hub [0,0], Ice [0,-28], Lake [26,15], Dust [-26,15])
      const resolved = resolvePlayerPhysics(newX, newZ);
      newX = resolved.x;
      newZ = resolved.z;
      const targetFloor = resolved.floorY;

      if (resolved.isInside !== isInsideHabitat) {
        setIsInsideHabitat(resolved.isInside);
      }

      groupRef.current.position.x = newX;
      groupRef.current.position.z = newZ;

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
        if (isFlashlightOn) {
          rightArmRef.current.rotation.x = -0.35 + Math.sin(walkCycle.current) * 0.05;
        } else {
          rightArmRef.current.rotation.x = swing * 0.4;
        }
      }
      // Bobbing head & body bounce relative to current floor height
      groupRef.current.position.y = targetFloor + Math.abs(Math.sin(walkCycle.current)) * 0.06;
    } else {
      // Re-evaluate target floor in idle pose
      const resolved = resolvePlayerPhysics(groupRef.current.position.x, groupRef.current.position.z);
      const targetFloor = resolved.floorY;

      if (resolved.isInside !== isInsideHabitat) {
        setIsInsideHabitat(resolved.isInside);
      }

      // Idle pose reset relative to current floor height
      groupRef.current.position.y = targetFloor + Math.sin(walkCycle.current) * 0.02;
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x *= 0.85;
        rightLegRef.current.rotation.x *= 0.85;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x *= 0.85;
        if (isFlashlightOn) {
          rightArmRef.current.rotation.x = -0.35;
        } else {
          rightArmRef.current.rotation.x *= 0.85;
        }
      }
    }

    // Sync position to store
    setPlayerPos([
      groupRef.current.position.x,
      groupRef.current.position.y,
      groupRef.current.position.z
    ]);
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 8.5]} dispose={null}>
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

      {/* Right Arm & Handheld Flashlight */}
      <group ref={rightArmRef} position={[0.29, 0.55, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.42, 0.16]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.4} metalness={0.1} flatShading />
        </mesh>
        {/* Handheld Flashlight Torch */}
        {isFlashlightOn && (
          <group position={[0, -0.18, 0.14]} rotation={[0.2, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.18, 10]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.038, 0.038, 0.02, 10]} />
              <meshBasicMaterial color="#E0F2FE" />
            </mesh>
            {/* Scene Graph Local Target ensures light beam always points forward as Leo moves & turns */}
            <primitive object={flashlightTarget} />
            <spotLight
              target={flashlightTarget}
              color="#FFFDF0"
              intensity={8.0}
              distance={26}
              angle={0.55}
              penumbra={0.45}
              position={[0, 0, 0.1]}
              castShadow
            />
            {/* Close-range ground ambient illumination */}
            <pointLight
              color="#FFFDF0"
              intensity={1.2}
              distance={3.5}
              position={[0, 0, 0.15]}
            />
          </group>
        )}
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

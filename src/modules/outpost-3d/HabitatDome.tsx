import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { soundEngine } from '@/modules/audio/soundEngine';

/**
 * Reusable Entrance Ramp & Airlock Portal Component for HabitatDome
 */
interface RampPortalProps {
  angle: number;
  themeColor: string;
  leftDoorRef: React.RefObject<any>;
  rightDoorRef: React.RefObject<any>;
}

const RampPortal: React.FC<RampPortalProps> = ({
  angle,
  themeColor,
  leftDoorRef,
  rightDoorRef,
}) => {
  return (
    <group rotation={[0, angle, 0]}>
      {/* Walk-in Entrance Ramp (From y=-0.40, z=7.95 to y=0.52, z=4.75) */}
      <group position={[0, 0.06, 6.35]}>
        <mesh rotation={[0.2796, 0, 0]} receiveShadow>
          <boxGeometry args={[2.4, 0.12, 3.33]} />
          <meshStandardMaterial color="#1E293B" roughness={0.6} metalness={0.5} />
        </mesh>

        {/* Transverse Anti-Slip Traction Treads */}
        {[-1.2, -0.6, 0.0, 0.6, 1.2].map((tZ, idx) => (
          <mesh key={`ramp-tread-${idx}`} position={[0, 0.07, tZ]} rotation={[0.2796, 0, 0]}>
            <boxGeometry args={[2.2, 0.02, 0.14]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
        ))}

        {/* Safety Guide Railings with Cyan LED Strips */}
        {[-1.24, 1.24].map((rx, rIdx) => (
          <group key={`ramp-rail-${rIdx}`} position={[rx, 0, 0]}>
            <mesh position={[0, 0.07, 0]} rotation={[0.2796, 0, 0]}>
              <boxGeometry args={[0.08, 0.04, 3.33]} />
              <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={1.2} />
            </mesh>
            {[-1.3, -0.4, 0.5, 1.3].map((pz, pIdx) => (
              <mesh
                key={`post-${pIdx}`}
                position={[0, 0.35 + pz * Math.sin(0.2796), pz * Math.cos(0.2796)]}
              >
                <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
                <meshStandardMaterial color="#64748B" metalness={0.9} />
              </mesh>
            ))}
            <mesh position={[0, 0.45, 0]} rotation={[0.2796, 0, 0]}>
              <boxGeometry args={[0.06, 0.06, 3.33]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Ground Transition Threshold Pad */}
        <mesh position={[0, -0.42, 1.75]} receiveShadow>
          <boxGeometry args={[2.8, 0.06, 0.55]} />
          <meshStandardMaterial color="#C1440E" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.38, 1.9]}>
          <boxGeometry args={[2.6, 0.01, 0.1]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Pressurized Airlock Portal Frame & Sliding Blast Doors */}
      <group position={[0, 0.52, 4.80]}>
        <mesh position={[-1.25, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.35, 2.5, 0.45]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[-1.1, 1.25, 0.23]}>
          <boxGeometry args={[0.04, 2.4, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={1.0} />
        </mesh>

        <mesh position={[1.25, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.35, 2.5, 0.45]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[1.1, 1.25, 0.23]}>
          <boxGeometry args={[0.04, 2.4, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={1.0} />
        </mesh>

        <mesh position={[0, 2.55, 0]} castShadow>
          <boxGeometry args={[2.85, 0.35, 0.45]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 2.42, 0.23]}>
          <boxGeometry args={[2.4, 0.04, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={1.0} />
        </mesh>

        <mesh position={[0, 2.56, 0.24]}>
          <boxGeometry args={[1.4, 0.16, 0.02]} />
          <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.8} />
        </mesh>

        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[2.15, 0.02, 0.45]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
        </mesh>

        <mesh ref={leftDoorRef} position={[-0.55, 1.15, 0.02]} castShadow>
          <boxGeometry args={[1.15, 2.25, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>

        <mesh ref={rightDoorRef} position={[0.55, 1.15, 0.02]} castShadow>
          <boxGeometry args={[1.15, 2.25, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * NASA Mars Habitat Central Base Camp (Ares Cradle v3.0 Expanded 4.80m Base)
 * - Spacious 4.80m Geodesic Aerogel Observation Glass Dome (R_foundation=4.95m, R_deck=4.75m at y=0.52)
 * - 3 Walk-in Entrance Ramps (Front +Z, Right +X, Left -X) with automated sliding doors
 * - Rotating Deep-Space Satellite Dish Comms Array & Laser Column
 * - 4-Petal Interlocking Storm Shutter Shield Mode
 * - Rover Charging Bay with Magnetic Induction Dock
 * - Perimeter Safety Floodlights & Reactive Atmospheric Corona
 */
export const HabitatDome: React.FC = () => {
  const outerDomeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.MeshBasicMaterial>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const dishRef = useRef<THREE.Group>(null);
  const shutterAngle = useRef(0);
  const shuttersRef = useRef<THREE.Group[]>([]);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const dockPadRef = useRef<THREE.Mesh>(null);

  // 3 Portals Door Refs
  const frontLeftDoorRef = useRef<THREE.Mesh>(null);
  const frontRightDoorRef = useRef<THREE.Mesh>(null);
  const rightLeftDoorRef = useRef<THREE.Mesh>(null);
  const rightRightDoorRef = useRef<THREE.Mesh>(null);
  const leftLeftDoorRef = useRef<THREE.Mesh>(null);
  const leftRightDoorRef = useRef<THREE.Mesh>(null);

  const hadDockedAlert = useRef(false);

  const emergencySaver = useOutpostStore((state) => state.emergencyPowerSaver);
  const oxygen = useOutpostStore((state) => state.oxygen);
  const temperature = useOutpostStore((state) => state.temperature);
  const isStormShutterClosed = useOutpostStore((state) => state.isStormShutterClosed);
  const roverPos = useOutpostStore((state) => state.roverPos);
  const playerPos = useOutpostStore((state) => state.playerPos);
  const isRoverDocked = useOutpostStore((state) => state.isRoverDocked);
  const setIsRoverDocked = useOutpostStore((state) => state.setIsRoverDocked);
  const domeEvolutionLevel = useOutpostStore((state) => state.domeEvolutionLevel);

  // Dedicated Rover Charging Bay on Mars terrain beside Front Ramp
  const dockTargetX = 4.2;
  const dockTargetZ = 5.6;

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    // 1. Deep Space Satellite Dish continuous celestial tracking
    if (dishRef.current) {
      dishRef.current.rotation.y = elapsed * 0.18;
      dishRef.current.rotation.x = Math.sin(elapsed * 0.3) * 0.12 + 0.35;
    }

    // 2. Telemetry Beacon Strobe
    if (beaconRef.current && (beaconRef.current.material as THREE.MeshStandardMaterial)) {
      const beaconMat = beaconRef.current.material as THREE.MeshStandardMaterial;
      const strobe = Math.sin(elapsed * 5.0) > 0.3 ? 1.4 : 0.05;
      beaconMat.emissiveIntensity = strobe;
    }

    // 3. Rover Docking Proximity Sensor
    const distToDock = Math.hypot(roverPos[0] - dockTargetX, roverPos[2] - dockTargetZ);
    const inDockZone = distToDock < 1.8;

    if (inDockZone !== isRoverDocked) {
      setIsRoverDocked(inDockZone);
      if (inDockZone && !hadDockedAlert.current) {
        hadDockedAlert.current = true;
        soundEngine.playSuccessChime();
      } else if (!inDockZone) {
        hadDockedAlert.current = false;
      }
    }

    // Dock coil glowing animation
    if (dockPadRef.current && (dockPadRef.current.material as THREE.MeshStandardMaterial)) {
      const mat = dockPadRef.current.material as THREE.MeshStandardMaterial;
      if (inDockZone) {
        const pulse = Math.sin(elapsed * 6.0) * 0.4 + 0.8;
        mat.emissive.set('#10B981');
        mat.emissiveIntensity = pulse;
      } else {
        const breathe = Math.sin(elapsed * 2.0) * 0.2 + 0.4;
        mat.emissive.set('#00F0FF');
        mat.emissiveIntensity = breathe;
      }
    }

    // 4. Automated Sliding Doors for All 3 Portals
    const updateDoorPair = (
      dist: number,
      leftRef: React.RefObject<THREE.Mesh | null>,
      rightRef: React.RefObject<THREE.Mesh | null>
    ) => {
      const isOpen = dist < 3.8;
      const targetOffset = isOpen ? 1.35 : 0.55;
      if (leftRef.current) {
        leftRef.current.position.x = THREE.MathUtils.lerp(
          leftRef.current.position.x,
          -targetOffset,
          safeDelta * 6
        );
      }
      if (rightRef.current) {
        rightRef.current.position.x = THREE.MathUtils.lerp(
          rightRef.current.position.x,
          targetOffset,
          safeDelta * 6
        );
      }
    };

    // Portal 0: Front (+Z at x=0, z=4.80)
    const distFront = Math.hypot(playerPos[0] - 0, playerPos[2] - 4.80);
    updateDoorPair(distFront, frontLeftDoorRef, frontRightDoorRef);

    // Portal 1: Right (+X at x=4.80, z=0)
    const distRight = Math.hypot(playerPos[0] - 4.80, playerPos[2] - 0);
    updateDoorPair(distRight, rightLeftDoorRef, rightRightDoorRef);

    // Portal 2: Left (-X at x=-4.80, z=0)
    const distLeft = Math.hypot(playerPos[0] - (-4.80), playerPos[2] - 0);
    updateDoorPair(distLeft, leftLeftDoorRef, leftRightDoorRef);

    // 5. Storm Shutter Servo Actuation
    const targetAngle = isStormShutterClosed ? 0.92 : 0.0;
    shutterAngle.current = THREE.MathUtils.lerp(shutterAngle.current, targetAngle, safeDelta * 2.8);

    shuttersRef.current.forEach((shutter) => {
      if (!shutter) return;
      shutter.rotation.x = shutterAngle.current;
    });

    // 6. Reactive Atmospheric Color
    let targetColor = '#00F0FF';
    let pulseFrequency = 1.8;
    let baseOpacity = 0.12;

    if (oxygen < 19.5) {
      targetColor = '#EF4444';
      pulseFrequency = 6.0;
      baseOpacity = 0.22;
    } else if (temperature < 5.0) {
      targetColor = '#4FD0E3';
      pulseFrequency = 2.0;
      baseOpacity = 0.16;
    } else if (isStormShutterClosed || emergencySaver) {
      targetColor = '#FFB020';
      pulseFrequency = 2.5;
    }

    const pulseFactor = 0.5 + Math.sin(elapsed * pulseFrequency) * 0.25;

    if (atmosphereRef.current) {
      atmosphereRef.current.color.lerp(new THREE.Color(targetColor), safeDelta * 4.0);
      atmosphereRef.current.opacity = baseOpacity + (oxygen < 19.5 ? Math.sin(elapsed * 6.0) * 0.08 : 0);
    }

    if (pointLightRef.current) {
      pointLightRef.current.color.lerp(new THREE.Color(targetColor), safeDelta * 4.0);
      pointLightRef.current.intensity = pulseFactor * 2.2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================
          1. 3D-PRINTED SINTERED FOUNDATION WALLS & INTERIOR FLOOR (R=4.95m)
          ======================================================== */}
      {/* Heavy Sintered Composite Foundation Ring */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.92, 5.12, 0.55, 36]} />
        <meshStandardMaterial color="#1E293B" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Perimeter Cyan Glowing Accent Strip */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[4.94, 4.94, 0.06, 36]} />
        <meshStandardMaterial color="#00D2FF" emissive="#00D2FF" emissiveIntensity={0.9} />
      </mesh>

      {/* Solid Pressurized Interior Floor Deck (Cadet Leo stands on this at y=0.52) */}
      <mesh position={[0, 0.50, 0]} receiveShadow>
        <cylinderGeometry args={[4.75, 4.75, 0.04, 36]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Interior Deck Guidance Rings at y=0.522 */}
      <mesh position={[0, 0.522, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 1.86, 36]} />
        <meshBasicMaterial color="#00D2FF" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.522, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.4, 3.46, 36]} />
        <meshBasicMaterial color="#00D2FF" transparent opacity={0.3} />
      </mesh>

      {/* ========================================================
          2. THREE WALK-IN ENTRANCE RAMPS (Front +Z, Right +X, Left -X)
          ======================================================== */}
      {/* Portal 0: Front (+Z, angle 0) */}
      <RampPortal
        angle={0}
        themeColor="#00D2FF"
        leftDoorRef={frontLeftDoorRef}
        rightDoorRef={frontRightDoorRef}
      />

      {/* Portal 1: Right (+X, angle -Math.PI / 2) */}
      <RampPortal
        angle={-Math.PI / 2}
        themeColor="#00D2FF"
        leftDoorRef={rightLeftDoorRef}
        rightDoorRef={rightRightDoorRef}
      />

      {/* Portal 2: Left (-X, angle Math.PI / 2) */}
      <RampPortal
        angle={Math.PI / 2}
        themeColor="#00D2FF"
        leftDoorRef={leftLeftDoorRef}
        rightDoorRef={leftRightDoorRef}
      />

      {/* ========================================================
          3. SPACIOUS AEROGEL GEODESIC DOME & CORONA GLOW (R=4.85m)
          ======================================================== */}
      {/* Outer Pressurized Aerogel Observation Glass */}
      <mesh ref={outerDomeRef} position={[0, 0.52, 0]} castShadow receiveShadow>
        <sphereGeometry args={[4.85, 36, 22, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#94A3B8"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.22}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Atmospheric Interior BackSide Corona Glow */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[4.82, 36, 22, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          ref={atmosphereRef}
          side={THREE.BackSide}
          color="#00F0FF"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Geodesic Structural Lattice Frame */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[4.86, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#334155" metalness={0.92} roughness={0.2} wireframe />
      </mesh>

      {/* ========================================================
          4. STORM SHUTTER SHIELD SYSTEM (4 Interlocking Petals)
          Angled at 45°, 135°, 225°, 315° to keep all 3 entrances 100% open
          ======================================================== */}
      {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((baseRot, idx) => (
        <group key={`shutter-pivot-${idx}`} rotation={[0, baseRot, 0]}>
          <group
            ref={(el) => {
              if (el) shuttersRef.current[idx] = el;
            }}
            position={[0, 0.6, 4.86]}
          >
            <mesh position={[0, 1.25, 0]} castShadow>
              <boxGeometry args={[2.8, 2.3, 0.12]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} />
            </mesh>
            <mesh position={[0, 1.25, 0.07]}>
              <boxGeometry args={[2.6, 0.22, 0.01]} />
              <meshStandardMaterial
                color="#F59E0B"
                emissive="#F59E0B"
                emissiveIntensity={isStormShutterClosed ? 1.0 : 0.2}
              />
            </mesh>
          </group>
        </group>
      ))}

      {/* ========================================================
          5. ROVER CHARGING BAY & INDUCTION DOCK (Adjacent to Front Ramp)
          ======================================================== */}
      <group position={[dockTargetX, -0.32, dockTargetZ]}>
        <mesh position={[0, 0.04, 0]} receiveShadow>
          <boxGeometry args={[2.4, 0.12, 3.0]} />
          <meshStandardMaterial color="#1E293B" roughness={0.8} metalness={0.3} />
        </mesh>

        {[-1.22, 1.22].map((rx, rIdx) => (
          <mesh key={`dock-rail-${rIdx}`} position={[rx, 0.14, 0]}>
            <boxGeometry args={[0.08, 0.18, 3.0]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        <mesh
          ref={dockPadRef}
          position={[0, 0.11, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.45, 0.95, 24]} />
          <meshStandardMaterial
            color="#0F172A"
            emissive="#00F0FF"
            emissiveIntensity={0.6}
            metalness={0.8}
          />
        </mesh>

        {[-0.7, 0, 0.7].map((cz, cIdx) => (
          <mesh key={`dock-chev-${cIdx}`} position={[0, 0.115, cz]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.9, 0.12]} />
            <meshBasicMaterial
              color={isRoverDocked ? '#10B981' : '#F59E0B'}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}

        <mesh position={[1.3, 0.6, -1.0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
          <meshStandardMaterial color="#64748B" metalness={0.8} />
        </mesh>
        <mesh position={[1.3, 1.2, -1.0]}>
          <boxGeometry args={[0.22, 0.28, 0.15]} />
          <meshStandardMaterial
            color={isRoverDocked ? '#10B981' : '#F59E0B'}
            emissive={isRoverDocked ? '#10B981' : '#F59E0B'}
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>

      {/* ========================================================
          6. ROTATING SATELLITE DISH & COMMS MAST
          ======================================================== */}
      <group position={[-3.4, 0.45, -3.4]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.14, 3.2, 8]} />
          <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 3.25, 0]}>
          <boxGeometry args={[0.4, 0.32, 0.4]} />
          <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.2} />
        </mesh>
        <group ref={dishRef} position={[0, 3.48, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.95, 0.16, 0.24, 24]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.55, 8]} />
            <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh ref={beaconRef} position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={1.2} />
          </mesh>
        </group>
      </group>

      {/* ========================================================
          7. PERIMETER SAFETY FLOODLIGHTS
          ======================================================== */}
      {[
        { x: 5.5, z: -4.2 },
        { x: -5.5, z: -4.2 },
        { x: -5.6, z: 4.2 },
        { x: 5.6, z: 4.2 }
      ].map((pos, pIdx) => (
        <group key={`flood-${pIdx}`} position={[pos.x, -0.4, pos.z]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 1.0, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.02, 0]}>
            <boxGeometry args={[0.18, 0.1, 0.18]} />
            <meshStandardMaterial color="#E2E8F0" emissive="#FEF08A" emissiveIntensity={1.2} />
          </mesh>
          <pointLight
            color="#FFFBEB"
            intensity={0.7}
            distance={7.5}
            decay={2}
            position={[0, 1.02, 0]}
          />
        </group>
      ))}

      {/* Main Internal Life Support Point Light */}
      <pointLight
        ref={pointLightRef}
        color="#00F0FF"
        intensity={1.5}
        distance={10}
        decay={2}
        position={[0, 1.8, 0]}
      />

      {/* Visual Evolution Level 3+: Circulating Glowing Water Conduits Ring */}
      {domeEvolutionLevel >= 3 && (
        <group position={[0, 0.45, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[4.82, 0.04, 8, 36]} />
            <meshStandardMaterial
              color="#00D2FF"
              emissive="#00D2FF"
              emissiveIntensity={1.8}
              roughness={0.1}
            />
          </mesh>
        </group>
      )}

      {/* Visual Evolution Level 5: Ares-1 Sky Laser Landing Beacon Column */}
      {domeEvolutionLevel >= 5 && (
        <group position={[0, 5.2, 0]}>
          <mesh position={[0, 16, 0]}>
            <cylinderGeometry args={[0.08, 0.25, 32, 12]} />
            <meshBasicMaterial color="#00D2FF" transparent opacity={0.65} />
          </mesh>
          <pointLight color="#00F0FF" intensity={3.5} distance={18} decay={2} />
        </group>
      )}
    </group>
  );
};

export default HabitatDome;

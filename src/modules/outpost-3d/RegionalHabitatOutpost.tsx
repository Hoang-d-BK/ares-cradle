import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

export interface RegionalHabitatProps {
  id: 'ice' | 'lake' | 'dust';
  name: string;
  position: [number, number, number];
  rotationY: number;
  themeColor: string;
  landmarkType: 'drill' | 'arch' | 'tower';
}

/**
 * Reusable Entrance Ramp & Airlock Portal Component
 * - Slope: dirt y=-0.40 to deck y=0.52 (length 3.2m, width 2.4m, ~16° grade)
 * - Transverse non-slip treads & safety railings with glowing LED guide channels
 * - Ground transition threshold with amber hazard caution strip
 * - Pressurized arch frame with automated sliding blast doors
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
      {/* 1. WALK-IN ENTRANCE RAMP (From y=-0.40, z=7.95 to y=0.52, z=4.75) */}
      <group position={[0, 0.06, 6.35]}>
        {/* Main Ramp Surface (Length 3.33m along 0.2796 rad slope) */}
        <mesh rotation={[0.2796, 0, 0]} receiveShadow>
          <boxGeometry args={[2.4, 0.12, 3.33]} />
          <meshStandardMaterial color="#1E293B" roughness={0.6} metalness={0.5} />
        </mesh>

        {/* Transverse Anti-Slip Traction Treads */}
        {[-1.2, -0.6, 0.0, 0.6, 1.2].map((tZ, idx) => (
          <mesh key={`tread-${idx}`} position={[0, 0.07, tZ]} rotation={[0.2796, 0, 0]}>
            <boxGeometry args={[2.2, 0.02, 0.14]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
        ))}

        {/* Safety Guide Handrails with Glowing LED Strips */}
        {[-1.24, 1.24].map((rx, rIdx) => (
          <group key={`ramp-rail-${rIdx}`} position={[rx, 0, 0]}>
            {/* Base Glowing LED Channel */}
            <mesh position={[0, 0.07, 0]} rotation={[0.2796, 0, 0]}>
              <boxGeometry args={[0.08, 0.04, 3.33]} />
              <meshStandardMaterial
                color={themeColor}
                emissive={themeColor}
                emissiveIntensity={1.2}
              />
            </mesh>
            {/* Vertical Support Posts */}
            {[-1.3, -0.4, 0.5, 1.3].map((pz, pIdx) => (
              <mesh
                key={`post-${pIdx}`}
                position={[0, 0.35 + pz * Math.sin(0.2796), pz * Math.cos(0.2796)]}
              >
                <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
                <meshStandardMaterial color="#64748B" metalness={0.9} />
              </mesh>
            ))}
            {/* Top Tubular Handrail */}
            <mesh position={[0, 0.45, 0]} rotation={[0.2796, 0, 0]}>
              <boxGeometry args={[0.06, 0.06, 3.33]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Ground Transition Threshold Pad at Martian Dirt Level */}
        <mesh position={[0, -0.42, 1.75]} receiveShadow>
          <boxGeometry args={[2.8, 0.06, 0.55]} />
          <meshStandardMaterial color="#C1440E" roughness={0.8} />
        </mesh>
        {/* Warning Hazard Caution Line */}
        <mesh position={[0, -0.38, 1.9]}>
          <boxGeometry args={[2.6, 0.01, 0.1]} />
          <meshStandardMaterial
            color="#F59E0B"
            emissive="#F59E0B"
            emissiveIntensity={1.0}
          />
        </mesh>
      </group>

      {/* 2. PRESSURIZED AIRLOCK PORTAL FRAME & SLIDING BLAST DOORS (At z=4.80, y=0.52) */}
      <group position={[0, 0.52, 4.80]}>
        {/* Left Arch Jamb Pillar */}
        <mesh position={[-1.25, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.35, 2.5, 0.45]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[-1.1, 1.25, 0.23]}>
          <boxGeometry args={[0.04, 2.4, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={1.0} />
        </mesh>

        {/* Right Arch Jamb Pillar */}
        <mesh position={[1.25, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.35, 2.5, 0.45]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[1.1, 1.25, 0.23]}>
          <boxGeometry args={[0.04, 2.4, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={1.0} />
        </mesh>

        {/* Top Header Lintel */}
        <mesh position={[0, 2.55, 0]} castShadow>
          <boxGeometry args={[2.85, 0.35, 0.45]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 2.42, 0.23]}>
          <boxGeometry args={[2.4, 0.04, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={1.0} />
        </mesh>

        {/* Airlock Status Screen */}
        <mesh position={[0, 2.56, 0.24]}>
          <boxGeometry args={[1.4, 0.16, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={0.8} />
        </mesh>

        {/* Threshold Floor Plate */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[2.15, 0.02, 0.45]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Left Sliding Door Panel */}
        <mesh ref={leftDoorRef} position={[-0.55, 1.15, 0.02]} castShadow>
          <boxGeometry args={[1.15, 2.25, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Right Sliding Door Panel */}
        <mesh ref={rightDoorRef} position={[0.55, 1.15, 0.02]} castShadow>
          <boxGeometry args={[1.15, 2.25, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Ergonomic Crew Swivel Chair Component
 */
const CrewSeat: React.FC<{ position: [number, number, number]; rotationY: number; accentColor: string }> = ({
  position,
  rotationY,
  accentColor,
}) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base Caster Pedestal */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.22, 0.3, 8]} />
        <meshStandardMaterial color="#1E293B" metalness={0.9} />
      </mesh>
      {/* Seat Cushion */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.55, 0.08, 0.52]} />
        <meshStandardMaterial color="#0F172A" roughness={0.4} />
      </mesh>
      {/* High Backrest with Lumbar & Headrest */}
      <mesh position={[0, 0.72, -0.22]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.52, 0.65, 0.08]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} />
      </mesh>
      {/* Accent Lumbar Stripe */}
      <mesh position={[0, 0.65, -0.17]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.42, 0.05, 0.02]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} />
      </mesh>
      {/* Left Armrest */}
      <mesh position={[-0.30, 0.50, -0.05]}>
        <boxGeometry args={[0.06, 0.22, 0.38]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Right Armrest */}
      <mesh position={[0.30, 0.50, -0.05]}>
        <boxGeometry args={[0.06, 0.22, 0.38]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
    </group>
  );
};

/**
 * RegionalHabitatOutpost - Next-Gen Mars Research Base Architecture (v3.0)
 * - Expanded scale: R_base = 4.80m, R_foundation = 4.95m, R_deck = 4.75m at y=0.52
 * - 3 Walk-in Entrance Ramps (Front +Z, Right +X, Left -X) with automated sliding doors
 * - Complete interior: Curved flight telemetry consoles, ergonomic crew seating,
 *   spiral staircase with elevated observation cupola deck & stargazing telescope
 * - Themed scientific specimen core & exterior regional landmark
 */
export const RegionalHabitatOutpost: React.FC<RegionalHabitatProps> = ({
  id,
  position,
  rotationY,
  themeColor,
  landmarkType,
}) => {
  // 3 Portals Door Refs
  const frontLeftDoorRef = useRef<THREE.Mesh>(null);
  const frontRightDoorRef = useRef<THREE.Mesh>(null);
  const rightLeftDoorRef = useRef<THREE.Mesh>(null);
  const rightRightDoorRef = useRef<THREE.Mesh>(null);
  const leftLeftDoorRef = useRef<THREE.Mesh>(null);
  const leftRightDoorRef = useRef<THREE.Mesh>(null);

  const interiorCoreRef = useRef<THREE.Group>(null);
  const landmarkRef = useRef<THREE.Group>(null);

  const playerPos = useOutpostStore((state) => state.playerPos);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    // Calculate player position in base local coordinates
    const wx = playerPos[0] - position[0];
    const wz = playerPos[2] - position[2];
    const cosR = Math.cos(-rotationY);
    const sinR = Math.sin(-rotationY);
    const lx = wx * cosR - wz * sinR;
    const lz = wx * sinR + wz * cosR;

    // Helper for door sliding animation
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

    // Portal 0: Front (+Z at lx=0, lz=4.80)
    const distFront = Math.hypot(lx - 0, lz - 4.80);
    updateDoorPair(distFront, frontLeftDoorRef, frontRightDoorRef);

    // Portal 1: Right (+X at lx=4.80, lz=0)
    const distRight = Math.hypot(lx - 4.80, lz - 0);
    updateDoorPair(distRight, rightLeftDoorRef, rightRightDoorRef);

    // Portal 2: Left (-X at lx=-4.80, lz=0)
    const distLeft = Math.hypot(lx - (-4.80), lz - 0);
    updateDoorPair(distLeft, leftLeftDoorRef, leftRightDoorRef);

    // Gentle rotation for interior specimen core
    if (interiorCoreRef.current) {
      interiorCoreRef.current.rotation.y = elapsed * 0.45;
      interiorCoreRef.current.position.y = 1.05 + Math.sin(elapsed * 1.6) * 0.04;
    }

    // Dynamic landmark motion
    if (landmarkRef.current) {
      if (landmarkType === 'drill') {
        landmarkRef.current.rotation.y = elapsed * 2.2;
      } else if (landmarkType === 'arch') {
        landmarkRef.current.rotation.y = Math.sin(elapsed * 0.5) * 0.35;
      } else if (landmarkType === 'tower') {
        landmarkRef.current.rotation.y = elapsed * 3.2; // Fast anemometer cup spin
      }
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* ========================================================
          1. SINTERED FOUNDATION RING & INTERIOR FLOOR DECK (y=0.52)
          ======================================================== */}
      {/* Foundation Base Cylinder (R=4.95m) */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.92, 5.12, 0.55, 36]} />
        <meshStandardMaterial color="#1E293B" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Perimeter Themed Glowing Accent Strip */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[4.94, 4.94, 0.06, 36]} />
        <meshStandardMaterial
          color={themeColor}
          emissive={themeColor}
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* Interior Floor Deck (R=4.75m at y=0.50) */}
      <mesh position={[0, 0.50, 0]} receiveShadow>
        <cylinderGeometry args={[4.75, 4.75, 0.04, 36]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Interior Guidance Rings */}
      <mesh position={[0, 0.522, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 1.86, 36]} />
        <meshBasicMaterial color={themeColor} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.522, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.4, 3.46, 36]} />
        <meshBasicMaterial color={themeColor} transparent opacity={0.3} />
      </mesh>

      {/* ========================================================
          2. THREE WALK-IN ENTRANCE RAMPS (Front +Z, Right +X, Left -X)
          ======================================================== */}
      {/* Portal 0: Front (+Z, angle 0) */}
      <RampPortal
        angle={0}
        themeColor={themeColor}
        leftDoorRef={frontLeftDoorRef}
        rightDoorRef={frontRightDoorRef}
      />

      {/* Portal 1: Right (+X, angle -Math.PI / 2) */}
      <RampPortal
        angle={-Math.PI / 2}
        themeColor={themeColor}
        leftDoorRef={rightLeftDoorRef}
        rightDoorRef={rightRightDoorRef}
      />

      {/* Portal 2: Left (-X, angle Math.PI / 2) */}
      <RampPortal
        angle={Math.PI / 2}
        themeColor={themeColor}
        leftDoorRef={leftLeftDoorRef}
        rightDoorRef={leftRightDoorRef}
      />

      {/* ========================================================
          3. EXPANDED GEODESIC OBSERVATION GLASS DOME (R=4.85m)
          ======================================================== */}
      {/* Outer Aerogel Dome - Crystal Clear */}
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <sphereGeometry args={[4.85, 48, 28, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#E0F2FE"
          metalness={0.05}
          roughness={0.02}
          transparent
          opacity={0.06}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Atmospheric Interior BackSide Glow */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[4.82, 36, 22, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          side={THREE.BackSide}
          color={themeColor}
          transparent
          opacity={0.02}
          depthWrite={false}
        />
      </mesh>

      {/* Dome Structural Lattice Frame - Slender Clean Ribs */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[4.86, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#64748B"
          metalness={0.8}
          roughness={0.3}
          wireframe
          transparent
          opacity={0.16}
        />
      </mesh>

      {/* Protective Storm Shutters at non-door quadrant sectors */}
      {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map(
        (baseRot, idx) => (
          <group key={`shutter-${idx}`} rotation={[0, baseRot, 0]}>
            <group position={[0, 0.6, 4.86]}>
              <mesh position={[0, 1.25, 0]} castShadow>
                <boxGeometry args={[2.8, 2.3, 0.12]} />
                <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} />
              </mesh>
              <mesh position={[0, 1.25, 0.07]}>
                <boxGeometry args={[2.6, 0.22, 0.01]} />
                <meshStandardMaterial
                  color={themeColor}
                  emissive={themeColor}
                  emissiveIntensity={0.35}
                />
              </mesh>
            </group>
          </group>
        )
      )}

      {/* ========================================================
          4. INTERIOR: FLIGHT TELEMETRY CONSOLE & CREW SEATING
          ======================================================== */}
      {/* Flight Control Consoles (North Wall Arc at z=-2.8) */}
      <group position={[0, 0.52, -2.8]}>
        {/* Main Curved Console Desk */}
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.76, 0.85]} />
          <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Triple Holographic Telemetry Monitors */}
        {[-0.85, 0, 0.85].map((mx, mIdx) => (
          <group key={`monitor-${mIdx}`} position={[mx, 0.92, -0.15]} rotation={[-0.25, mx * -0.15, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.72, 0.42, 0.03]} />
              <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[0.68, 0.38, 0.01]} />
              <meshStandardMaterial
                color={themeColor}
                emissive={themeColor}
                emissiveIntensity={1.3}
                roughness={0.1}
              />
            </mesh>
          </group>
        ))}

        {/* Illuminated Switchboard & Keyboard Deck */}
        <mesh position={[0, 0.78, 0.18]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[2.4, 0.02, 0.35]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} />
        </mesh>
      </group>

      {/* Ergonomic Crew Swivel Chairs (Facing Console) */}
      <CrewSeat position={[-0.7, 0.52, -1.8]} rotationY={0} accentColor={themeColor} />
      <CrewSeat position={[0.7, 0.52, -1.8]} rotationY={0} accentColor={themeColor} />

      {/* ========================================================
          6. THEMED INTERIOR SPECIMEN CORE (Center x=0, z=0)
          ======================================================== */}
      <group position={[0, 0.52, 0]}>
        {/* Hexagonal Research Station Desk */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.0, 1.2, 0.45, 6]} />
          <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Specimen Hologram Core */}
        <group ref={interiorCoreRef} position={[0, 1.15, 0]}>
          {id === 'ice' && (
            /* Cryogenic Ice Core Sample */
            <group>
              <mesh>
                <cylinderGeometry args={[0.18, 0.18, 0.75, 16]} />
                <meshStandardMaterial
                  color="#A5F3FC"
                  emissive="#00D2FF"
                  emissiveIntensity={0.9}
                  transparent
                  opacity={0.88}
                />
              </mesh>
              <mesh rotation={[0.4, 0, 0]}>
                <ringGeometry args={[0.36, 0.40, 24]} />
                <meshBasicMaterial color="#00D2FF" side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}

          {id === 'lake' && (
            /* Delta Witness Sediment Tubes */
            <group>
              <mesh>
                <octahedronGeometry args={[0.32]} />
                <meshStandardMaterial
                  color="#2A9D8F"
                  emissive="#2A9D8F"
                  emissiveIntensity={1.0}
                  wireframe
                />
              </mesh>
              {[-0.18, 0, 0.18].map((vx, vIdx) => (
                <mesh key={`tube-${vIdx}`} position={[vx, -0.28, 0]}>
                  <cylinderGeometry args={[0.035, 0.035, 0.35, 8]} />
                  <meshStandardMaterial color="#F4A261" emissive="#F4A261" emissiveIntensity={0.8} />
                </mesh>
              ))}
            </group>
          )}

          {id === 'dust' && (
            /* Aeolian Dust Collector & Electrostatic Particle Analyzer */
            <group>
              <mesh>
                <dodecahedronGeometry args={[0.30]} />
                <meshStandardMaterial
                  color="#F59E0B"
                  emissive="#F59E0B"
                  emissiveIntensity={1.1}
                  roughness={0.2}
                />
              </mesh>
              <mesh rotation={[0.6, 0.4, 0]}>
                <torusGeometry args={[0.45, 0.02, 8, 24]} />
                <meshBasicMaterial color="#FFB800" />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* ========================================================
          7. EXTERIOR REGIONAL LANDMARK (Beside Outpost)
          ======================================================== */}
      <group position={[-6.8, 0, 1.5]}>
        {landmarkType === 'drill' && (
          /* Glacial Core Drill Rig */
          <group>
            <mesh position={[0, 2.8, 0]} castShadow>
              <boxGeometry args={[1.4, 5.6, 1.4]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} wireframe />
            </mesh>
            <group ref={landmarkRef} position={[0, 2.0, 0]}>
              <mesh>
                <cylinderGeometry args={[0.18, 0.18, 4.2, 12]} />
                <meshStandardMaterial color="#00D2FF" emissive="#00D2FF" emissiveIntensity={0.9} />
              </mesh>
            </group>
            <mesh position={[0, 5.8, 0]}>
              <boxGeometry args={[1.8, 0.45, 1.8]} />
              <meshStandardMaterial color="#0F172A" />
            </mesh>
          </group>
        )}

        {landmarkType === 'arch' && (
          /* Telemetry Transceiver Arch */
          <group ref={landmarkRef} rotation={[0, Math.PI / 4, 0]}>
            <mesh position={[0, 3.5, 0]}>
              <torusGeometry args={[3.2, 0.28, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#2A9D8F" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[-3.2, 1.75, 0]}>
              <cylinderGeometry args={[0.18, 0.28, 3.5, 8]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} />
            </mesh>
            <mesh position={[3.2, 1.75, 0]}>
              <cylinderGeometry args={[0.18, 0.28, 3.5, 8]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} />
            </mesh>
          </group>
        )}

        {landmarkType === 'tower' && (
          /* Wind Basin Aeolian Anemometer Tower */
          <group>
            <mesh position={[0, 3.2, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.8, 6.4, 4]} />
              <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} wireframe />
            </mesh>
            <mesh position={[0, 6.5, 0]}>
              <sphereGeometry args={[0.35, 12, 12]} />
              <meshStandardMaterial color="#0F172A" />
            </mesh>
            {/* Spinning Anemometer Cups */}
            <group ref={landmarkRef} position={[0, 6.9, 0]}>
              {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((cupAngle, cIdx) => (
                <group key={`cup-${cIdx}`} rotation={[0, cupAngle, 0]}>
                  <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.9, 6]} />
                    <meshStandardMaterial color="#64748B" />
                  </mesh>
                  <mesh position={[0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <sphereGeometry args={[0.14, 8, 8, 0, Math.PI]} />
                    <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.8} />
                  </mesh>
                </group>
              ))}
            </group>
          </group>
        )}
      </group>

      {/* Outpost Beacon Light */}
      <pointLight position={[0, 5.5, 0]} color={themeColor} intensity={1.4} distance={18} />
    </group>
  );
};

export default RegionalHabitatOutpost;

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

export interface RegionalHabitatProps {
  id: 'ice' | 'lake' | 'impact' | 'volcano';
  name: string;
  position: [number, number, number];
  rotationY: number;
  themeColor: string;
  landmarkType: 'drill' | 'arch' | 'radar' | 'bridge';
}

/**
 * RegionalHabitatOutpost - Modular Mars Research Base
 * - Sintered composite foundation ring & floor deck at y=0.52
 * - Walk-in entrance ramp with anti-slip treads & safety rails
 * - Automated sliding airlock doors responsive to player proximity in local space
 * - Pressurized Aerogel geodesic observation glass dome
 * - Themed interior research workstation
 * - External regional landmark
 */
export const RegionalHabitatOutpost: React.FC<RegionalHabitatProps> = ({
  id,
  position,
  rotationY,
  themeColor,
  landmarkType,
}) => {
  const leftDoorRef = useRef<THREE.Mesh>(null);
  const rightDoorRef = useRef<THREE.Mesh>(null);
  const interiorCoreRef = useRef<THREE.Group>(null);
  const landmarkRef = useRef<THREE.Group>(null);

  const playerPos = useOutpostStore((state) => state.playerPos);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1);

    // Calculate player position in local outpost coordinates
    const wx = playerPos[0] - position[0];
    const wz = playerPos[2] - position[2];
    const cosR = Math.cos(-rotationY);
    const sinR = Math.sin(-rotationY);
    const lx = wx * cosR - wz * sinR;
    const lz = wx * sinR + wz * cosR;

    // Door proximity sensor (airlock door at lz=3.75, lx=0)
    const distToDoor = Math.hypot(lx - 0, lz - 4.5);
    const doorOpen = distToDoor < 3.8;
    const targetOffset = doorOpen ? 1.25 : 0.45;

    if (leftDoorRef.current) {
      leftDoorRef.current.position.x = THREE.MathUtils.lerp(
        leftDoorRef.current.position.x,
        -targetOffset,
        safeDelta * 6
      );
    }
    if (rightDoorRef.current) {
      rightDoorRef.current.position.x = THREE.MathUtils.lerp(
        rightDoorRef.current.position.x,
        targetOffset,
        safeDelta * 6
      );
    }

    // Gentle rotation for interior specimen core
    if (interiorCoreRef.current) {
      interiorCoreRef.current.rotation.y = elapsed * 0.4;
      interiorCoreRef.current.position.y = 1.05 + Math.sin(elapsed * 1.6) * 0.03;
    }

    // Dynamic landmark motion
    if (landmarkRef.current) {
      if (landmarkType === 'drill') {
        landmarkRef.current.rotation.y = elapsed * 1.8;
      } else if (landmarkType === 'radar') {
        landmarkRef.current.rotation.y = elapsed * 0.25;
      }
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* ========================================================
          1. SINTERED FOUNDATION RING & INTERIOR FLOOR DECK (y=0.52)
          ======================================================== */}
      {/* Foundation Base Cylinder */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.92, 4.10, 0.55, 32]} />
        <meshStandardMaterial color="#1E293B" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Perimeter Themed Glowing Accent Strip */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[3.94, 3.94, 0.06, 32]} />
        <meshStandardMaterial
          color={themeColor}
          emissive={themeColor}
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* Interior Floor Deck */}
      <mesh position={[0, 0.50, 0]} receiveShadow>
        <cylinderGeometry args={[3.80, 3.80, 0.04, 32]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Interior Guidance Rings */}
      <mesh position={[0, 0.522, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.55, 32]} />
        <meshBasicMaterial color={themeColor} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.522, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.7, 2.75, 32]} />
        <meshBasicMaterial color={themeColor} transparent opacity={0.3} />
      </mesh>

      {/* ========================================================
          2. WALK-IN ENTRANCE RAMP (From y=-0.4, z=6.4 to y=0.52, z=3.6)
          ======================================================== */}
      <group position={[0, 0.06, 5.0]}>
        {/* Main Ramp Surface */}
        <mesh rotation={[0.3172, 0, 0]} receiveShadow>
          <boxGeometry args={[2.2, 0.12, 2.95]} />
          <meshStandardMaterial color="#1E293B" roughness={0.6} metalness={0.5} />
        </mesh>

        {/* Transverse Anti-Slip Treads */}
        {[-1.0, -0.5, 0.0, 0.5, 1.0].map((tZ, idx) => (
          <mesh key={`tread-${idx}`} position={[0, 0.07, tZ]} rotation={[0.3172, 0, 0]}>
            <boxGeometry args={[2.0, 0.02, 0.12]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
        ))}

        {/* Safety Guide Rails with Themed LED Strips */}
        {[-1.14, 1.14].map((rx, rIdx) => (
          <group key={`ramp-rail-${rIdx}`} position={[rx, 0, 0]}>
            <mesh position={[0, 0.07, 0]} rotation={[0.3172, 0, 0]}>
              <boxGeometry args={[0.08, 0.04, 2.95]} />
              <meshStandardMaterial
                color={themeColor}
                emissive={themeColor}
                emissiveIntensity={1.2}
              />
            </mesh>
            {[-1.1, 0, 1.1].map((pz, pIdx) => (
              <mesh
                key={`post-${pIdx}`}
                position={[0, 0.35 + pz * Math.sin(0.3172), pz * Math.cos(0.3172)]}
              >
                <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
                <meshStandardMaterial color="#64748B" metalness={0.9} />
              </mesh>
            ))}
            <mesh position={[0, 0.42, 0]} rotation={[0.3172, 0, 0]}>
              <boxGeometry args={[0.05, 0.05, 2.95]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Ground Transition Threshold Pad */}
        <mesh position={[0, -0.42, 1.55]} receiveShadow>
          <boxGeometry args={[2.5, 0.05, 0.5]} />
          <meshStandardMaterial color="#C1440E" roughness={0.8} />
        </mesh>
        {/* Warning Hazard Line */}
        <mesh position={[0, -0.39, 1.7]}>
          <boxGeometry args={[2.4, 0.01, 0.08]} />
          <meshStandardMaterial
            color={themeColor}
            emissive={themeColor}
            emissiveIntensity={0.9}
          />
        </mesh>
      </group>

      {/* ========================================================
          3. PRESSURIZED AIRLOCK PORTAL & AUTOMATED SLIDING DOORS
          ======================================================== */}
      <group position={[0, 0.52, 3.75]}>
        {/* Left Arch Jamb */}
        <mesh position={[-1.05, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 2.2, 0.4]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[-0.92, 1.1, 0.21]}>
          <boxGeometry args={[0.04, 2.1, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={0.9} />
        </mesh>

        {/* Right Arch Jamb */}
        <mesh position={[1.05, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 2.2, 0.4]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0.92, 1.1, 0.21]}>
          <boxGeometry args={[0.04, 2.1, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={0.9} />
        </mesh>

        {/* Top Header Lintel */}
        <mesh position={[0, 2.25, 0]} castShadow>
          <boxGeometry args={[2.4, 0.3, 0.4]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 2.15, 0.21]}>
          <boxGeometry args={[2.0, 0.04, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={0.9} />
        </mesh>

        {/* Outpost Identification Screen */}
        <mesh position={[0, 2.26, 0.22]}>
          <boxGeometry args={[1.2, 0.16, 0.02]} />
          <meshStandardMaterial color={themeColor} emissive={themeColor} emissiveIntensity={0.8} />
        </mesh>

        {/* Threshold Floor Plate */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[1.8, 0.02, 0.4]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Left Sliding Door Panel */}
        <mesh ref={leftDoorRef} position={[-0.45, 1.05, 0.02]} castShadow>
          <boxGeometry args={[0.95, 2.05, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Right Sliding Door Panel */}
        <mesh ref={rightDoorRef} position={[0.45, 1.05, 0.02]} castShadow>
          <boxGeometry args={[0.95, 2.05, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* ========================================================
          4. GEODESIC OBSERVATION GLASS DOME
          ======================================================== */}
      {/* Outer Aerogel Dome */}
      <mesh position={[0, 0.58, 0]} castShadow receiveShadow>
        <sphereGeometry args={[3.85, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#94A3B8"
          metalness={0.88}
          roughness={0.1}
          transparent
          opacity={0.32}
          flatShading
        />
      </mesh>

      {/* Atmospheric Interior BackSide Glow */}
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[3.82, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          side={THREE.BackSide}
          color={themeColor}
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </mesh>

      {/* Dome Structural Lattice Frame */}
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[3.86, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#334155" metalness={0.92} roughness={0.2} wireframe />
      </mesh>

      {/* 4-Petal Protective Storm Shutters (Angled at 45° to keep +Z entrance open) */}
      {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map(
        (baseRot, idx) => (
          <group key={`shutter-${idx}`} rotation={[0, baseRot, 0]}>
            <group position={[0, 0.6, 3.86]}>
              <mesh position={[0, 1.1, 0]} castShadow>
                <boxGeometry args={[2.7, 2.1, 0.12]} />
                <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} />
              </mesh>
              <mesh position={[0, 1.1, 0.07]}>
                <boxGeometry args={[2.55, 0.2, 0.01]} />
                <meshStandardMaterial
                  color={themeColor}
                  emissive={themeColor}
                  emissiveIntensity={0.3}
                />
              </mesh>
            </group>
          </group>
        )
      )}

      {/* ========================================================
          5. THEMED INTERIOR RESEARCH WORKSTATION (Sitting on y=0.52)
          ======================================================== */}
      <group position={[0, 0.52, 0]}>
        {/* Hexagonal Research Station Desk */}
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.9, 1.05, 0.42, 6]} />
          <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Angled Terminal Screens */}
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
          <group key={`screen-${idx}`} rotation={[0, angle, 0]} position={[0, 0.35, 0]}>
            <mesh position={[0, 0.14, 0.75]} rotation={[-0.45, 0, 0]}>
              <boxGeometry args={[0.42, 0.24, 0.02]} />
              <meshStandardMaterial
                color={themeColor}
                emissive={themeColor}
                emissiveIntensity={1.2}
                roughness={0.1}
              />
            </mesh>
            <mesh position={[0, 0.14, 0.74]} rotation={[-0.45, 0, 0]}>
              <boxGeometry args={[0.46, 0.28, 0.02]} />
              <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Specimen Hologram Core */}
        <group ref={interiorCoreRef} position={[0, 1.05, 0]}>
          {id === 'ice' && (
            /* Cryogenic Ice Core Sample */
            <group>
              <mesh>
                <cylinderGeometry args={[0.16, 0.16, 0.65, 12]} />
                <meshStandardMaterial
                  color="#A5F3FC"
                  emissive="#00D2FF"
                  emissiveIntensity={0.8}
                  transparent
                  opacity={0.85}
                />
              </mesh>
              <mesh rotation={[0.4, 0, 0]}>
                <ringGeometry args={[0.32, 0.35, 24]} />
                <meshBasicMaterial color="#00D2FF" side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}

          {id === 'lake' && (
            /* Delta Witness Sediment Tubes */
            <group>
              <mesh>
                <octahedronGeometry args={[0.28]} />
                <meshStandardMaterial
                  color="#2A9D8F"
                  emissive="#2A9D8F"
                  emissiveIntensity={0.9}
                  wireframe
                />
              </mesh>
              {[-0.15, 0, 0.15].map((vx, vIdx) => (
                <mesh key={`tube-${vIdx}`} position={[vx, -0.25, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
                  <meshStandardMaterial color="#F4A261" emissive="#F4A261" emissiveIntensity={0.7} />
                </mesh>
              ))}
            </group>
          )}

          {id === 'impact' && (
            /* Meteorite Shock Melt Chondrite Core */
            <group>
              <mesh>
                <dodecahedronGeometry args={[0.26]} />
                <meshStandardMaterial
                  color="#FF5A1F"
                  emissive="#FF5A1F"
                  emissiveIntensity={1.0}
                  roughness={0.3}
                />
              </mesh>
              <mesh rotation={[0.6, 0.4, 0]}>
                <torusGeometry args={[0.38, 0.02, 8, 24]} />
                <meshBasicMaterial color="#FFB800" />
              </mesh>
            </group>
          )}

          {id === 'volcano' && (
            /* Geothermal Basalt Pressure Core */
            <group>
              <mesh>
                <icosahedronGeometry args={[0.28]} />
                <meshStandardMaterial
                  color="#E63946"
                  emissive="#E63946"
                  emissiveIntensity={1.1}
                  wireframe
                />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshStandardMaterial color="#FFB703" emissive="#FB8500" emissiveIntensity={1.5} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* ========================================================
          6. EXTERIOR REGIONAL LANDMARK (Positioned beside outpost)
          ======================================================== */}
      <group position={[-5.8, 0, 1.2]}>
        {landmarkType === 'drill' && (
          /* Glacial Core Drill Rig */
          <group>
            <mesh position={[0, 2.5, 0]} castShadow>
              <boxGeometry args={[1.2, 5.0, 1.2]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} wireframe />
            </mesh>
            <group ref={landmarkRef} position={[0, 1.8, 0]}>
              <mesh>
                <cylinderGeometry args={[0.15, 0.15, 3.6, 12]} />
                <meshStandardMaterial color="#00D2FF" emissive="#00D2FF" emissiveIntensity={0.8} />
              </mesh>
            </group>
            <mesh position={[0, 5.2, 0]}>
              <boxGeometry args={[1.6, 0.4, 1.6]} />
              <meshStandardMaterial color="#0F172A" />
            </mesh>
          </group>
        )}

        {landmarkType === 'arch' && (
          /* Telemetry Transceiver Arch */
          <group rotation={[0, Math.PI / 4, 0]}>
            <mesh position={[0, 3.2, 0]}>
              <torusGeometry args={[2.8, 0.24, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#2A9D8F" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[-2.8, 1.6, 0]}>
              <cylinderGeometry args={[0.15, 0.25, 3.2, 8]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} />
            </mesh>
            <mesh position={[2.8, 1.6, 0]}>
              <cylinderGeometry args={[0.15, 0.25, 3.2, 8]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} />
            </mesh>
          </group>
        )}

        {landmarkType === 'radar' && (
          /* Planetary Radar Array Dome */
          <group>
            <mesh position={[0, 1.2, 0]} castShadow>
              <cylinderGeometry args={[1.2, 1.5, 2.4, 12]} />
              <meshStandardMaterial color="#1E293B" metalness={0.7} />
            </mesh>
            <group ref={landmarkRef} position={[0, 2.6, 0]}>
              <mesh rotation={[Math.PI / 3, 0, 0]} castShadow>
                <cylinderGeometry args={[1.6, 0.2, 0.4, 16]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.8} />
              </mesh>
              <mesh position={[0, 0.6, 0.8]} rotation={[Math.PI / 3, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
                <meshStandardMaterial color="#FF5A1F" emissive="#FF5A1F" emissiveIntensity={1.2} />
              </mesh>
            </group>
          </group>
        )}

        {landmarkType === 'bridge' && (
          /* Lava Channel Truss Bridge Overpass */
          <group>
            <mesh position={[0, 1.2, 0]} castShadow>
              <boxGeometry args={[7.0, 0.35, 1.8]} />
              <meshStandardMaterial color="#1E293B" roughness={0.7} />
            </mesh>
            {[-3.2, 3.2].map((bx, bIdx) => (
              <mesh key={`b-support-${bIdx}`} position={[bx, 0.6, 0]}>
                <boxGeometry args={[0.3, 1.2, 1.8]} />
                <meshStandardMaterial color="#E63946" emissive="#E63946" emissiveIntensity={0.6} />
              </mesh>
            ))}
            <mesh position={[0, 1.45, 0]}>
              <boxGeometry args={[6.6, 0.05, 0.1]} />
              <meshStandardMaterial color="#E63946" emissive="#E63946" emissiveIntensity={1.0} />
            </mesh>
          </group>
        )}
      </group>

      {/* Outpost Beacon Light */}
      <pointLight position={[0, 5.0, 0]} color={themeColor} intensity={1.2} distance={15} />
    </group>
  );
};

export default RegionalHabitatOutpost;

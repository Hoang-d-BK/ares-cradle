import React, { useMemo } from 'react';
import { Edges, Html } from '@react-three/drei';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import {
  PHYSICS_CONSTANTS,
  ObstacleCollider,
  buildWorldColliders
} from '@/modules/character/physicsEngine';

/**
 * 3D Physics Hitbox & Bounding Box Visualizer for MarsCanvas
 * Renders exact collision volumes for:
 * - Circle Colliders (cylindrical bounding cages + top jump platform ring)
 * - Oriented Box Colliders (OBB 3D wireframes + translucent bounding volumes)
 * - Hollow Ring Colliders (Habitat Dome perimeter wall inner/outer rings + emerald doorway pass-through cutouts)
 * - Live Player / Active Rover Collision Capsule
 *
 * Color Coding:
 * - Cyan (#00F0FF): Active solid obstacle / wall collider
 * - Amber/Orange (#F59E0B): Obstacle currently blocking horizontal movement
 * - Emerald (#10B981): Elevated obstacle player is standing on OR pass-through doorway opening
 */
export const PhysicsDebugHitboxes: React.FC = () => {
  const isPhysicsDebugVisible = useOutpostStore((state) => state.isPhysicsDebugVisible);
  const playerPos = useOutpostStore((state) => state.playerPos);
  const roverPos = useOutpostStore((state) => state.roverPos);
  const isDrivingRover = useOutpostStore((state) => state.isDrivingRover);
  const isPlayerGrounded = useOutpostStore((state) => state.isPlayerGrounded);
  const isPlayerBlocked = useOutpostStore((state) => state.isPlayerBlocked);
  const blockedByLabel = useOutpostStore((state) => state.blockedByLabel);
  const standingOnLabel = useOutpostStore((state) => state.standingOnLabel);

  const colliders = useMemo(
    () => buildWorldColliders(roverPos, isDrivingRover),
    [roverPos, isDrivingRover]
  );

  if (!isPhysicsDebugVisible) return null;

  const activePos = isDrivingRover ? roverPos : playerPos;
  const activeRadius = isDrivingRover
    ? PHYSICS_CONSTANTS.ROVER_RADIUS
    : PHYSICS_CONSTANTS.PLAYER_RADIUS;
  const activeHeight = isDrivingRover ? 1.05 : 1.35;

  const playerCapsuleColor = isPlayerBlocked
    ? '#F59E0B'
    : !isPlayerGrounded
    ? '#00F0FF'
    : '#10B981';

  return (
    <group name="physics-debug-hitboxes">
      {/* 1. Live Player / Active Rover Collision Cylinder Hitbox */}
      <group position={[activePos[0], activePos[1] + activeHeight * 0.5, activePos[2]]}>
        <mesh>
          <cylinderGeometry args={[activeRadius, activeRadius, activeHeight, 24, 1, false]} />
          <meshBasicMaterial
            color={playerCapsuleColor}
            transparent
            opacity={0.18}
            depthWrite={false}
          />
          <Edges scale={1.002} threshold={12} color={playerCapsuleColor} />
        </mesh>
        {/* Foot Contact Ring */}
        <mesh
          position={[0, -activeHeight * 0.5 + 0.015, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[activeRadius - 0.03, activeRadius + 0.02, 28]} />
          <meshBasicMaterial color={playerCapsuleColor} side={2} depthWrite={false} />
        </mesh>
      </group>

      {/* 2. World Wall & Obstacle Colliders */}
      {colliders.map((col: ObstacleCollider) => {
        const groundY = PHYSICS_CONSTANTS.GROUND_Y;
        const height = Math.max(0.18, col.topY - groundY);
        const centerY = groundY + height * 0.5;

        const isColliding = isPlayerBlocked && blockedByLabel === col.label;
        const isStandingOn = isPlayerGrounded && standingOnLabel === col.label;

        const strokeColor = isColliding
          ? '#F59E0B'
          : isStandingOn
          ? '#10B981'
          : '#00F0FF';
        const fillOpacity = isColliding ? 0.32 : isStandingOn ? 0.26 : 0.12;

        // Show floating 3D telemetry tag for nearby colliders (within 13m of player) or active collision
        const distToPlayer = Math.hypot(activePos[0] - col.x, activePos[2] - col.z);
        const showLabel = distToPlayer <= 13.5 || isColliding || isStandingOn;

        if (col.type === 'circle') {
          return (
            <group key={col.id} position={[col.x, centerY, col.z]}>
              {/* Translucent Cylinder Volume + Wireframe Edges */}
              <mesh>
                <cylinderGeometry args={[col.radius, col.radius, height, 28]} />
                <meshBasicMaterial
                  color={strokeColor}
                  transparent
                  opacity={fillOpacity}
                  depthWrite={false}
                />
                <Edges scale={1.002} threshold={15} color={strokeColor} />
              </mesh>

              {/* Top Jumpable Landing Surface Ring */}
              <mesh
                position={[0, height * 0.5 + 0.01, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[Math.max(0.05, col.radius - 0.05), col.radius, 32]} />
                <meshBasicMaterial color={strokeColor} side={2} depthWrite={false} />
              </mesh>

              {showLabel && (
                <Html
                  position={[0, height * 0.5 + 0.28, 0]}
                  center
                  distanceFactor={14}
                  zIndexRange={[10, 0]}
                >
                  <div
                    className={`pointer-events-none select-none whitespace-nowrap px-1.5 py-0.5 rounded border font-mono text-[9px] font-bold shadow-md ${
                      isColliding
                        ? 'bg-amber-950/95 border-amber-400 text-amber-200'
                        : isStandingOn
                        ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                        : 'bg-slate-950/90 border-cyan-500/60 text-cyan-200'
                    }`}
                  >
                    {col.label} · R:{col.radius.toFixed(2)}m · Top:{col.topY.toFixed(2)}m
                  </div>
                </Html>
              )}
            </group>
          );
        }

        if (col.type === 'box') {
          return (
            <group
              key={col.id}
              position={[col.x, centerY, col.z]}
              rotation={[0, col.rotationY || 0, 0]}
            >
              {/* Oriented Bounding Box (OBB) Volume + Wireframe Edges */}
              <mesh>
                <boxGeometry args={[col.halfX * 2, height, col.halfZ * 2]} />
                <meshBasicMaterial
                  color={strokeColor}
                  transparent
                  opacity={fillOpacity}
                  depthWrite={false}
                />
                <Edges scale={1.003} threshold={15} color={strokeColor} />
              </mesh>

              {showLabel && (
                <Html
                  position={[0, height * 0.5 + 0.28, 0]}
                  center
                  distanceFactor={14}
                  zIndexRange={[10, 0]}
                >
                  <div
                    className={`pointer-events-none select-none whitespace-nowrap px-1.5 py-0.5 rounded border font-mono text-[9px] font-bold shadow-md ${
                      isColliding
                        ? 'bg-amber-950/95 border-amber-400 text-amber-200'
                        : isStandingOn
                        ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                        : 'bg-slate-950/90 border-cyan-500/60 text-cyan-200'
                    }`}
                  >
                    {col.label} · {(col.halfX * 2).toFixed(1)}×{(col.halfZ * 2).toFixed(1)}m · Top:{col.topY.toFixed(2)}m
                  </div>
                </Html>
              )}
            </group>
          );
        }

        if (col.type === 'ring') {
          return (
            <group key={col.id} position={[col.x, groundY, col.z]}>
              {/* Outer Wall Cylinder Boundary */}
              <mesh position={[0, height * 0.5, 0]}>
                <cylinderGeometry
                  args={[col.outerRadius, col.outerRadius, height, 48, 1, true]}
                />
                <meshBasicMaterial
                  color={strokeColor}
                  wireframe
                  transparent
                  opacity={0.55}
                  depthWrite={false}
                />
              </mesh>

              {/* Inner Wall Cylinder Boundary */}
              <mesh position={[0, height * 0.5, 0]}>
                <cylinderGeometry
                  args={[col.innerRadius, col.innerRadius, height, 48, 1, true]}
                />
                <meshBasicMaterial
                  color={strokeColor}
                  wireframe
                  transparent
                  opacity={0.55}
                  depthWrite={false}
                />
              </mesh>

              {/* Top Ring Wall Cap */}
              <mesh position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[col.innerRadius, col.outerRadius, 48]} />
                <meshBasicMaterial
                  color={strokeColor}
                  transparent
                  opacity={fillOpacity + 0.08}
                  side={2}
                  depthWrite={false}
                />
              </mesh>

              {/* Ground Ring Footprint */}
              <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[col.innerRadius, col.outerRadius, 48]} />
                <meshBasicMaterial
                  color={strokeColor}
                  transparent
                  opacity={0.25}
                  side={2}
                  depthWrite={false}
                />
              </mesh>

              {/* Pass-Through Doorway Cutout Bounding Boxes (Emerald Green) */}
              {col.openings?.map((op, idx) => {
                const opWidth = op.maxX - op.minX;
                const opDepth = op.maxZ - op.minZ;
                const opCenterX = (op.minX + op.maxX) * 0.5 - col.x;
                const opCenterZ = (op.minZ + op.maxZ) * 0.5 - col.z;
                return (
                  <group
                    key={`${col.id}-opening-${idx}`}
                    position={[opCenterX, height * 0.5, opCenterZ]}
                  >
                    <mesh>
                      <boxGeometry args={[opWidth, height + 0.06, opDepth]} />
                      <meshBasicMaterial
                        color="#10B981"
                        transparent
                        opacity={0.14}
                        depthWrite={false}
                      />
                      <Edges scale={1.002} threshold={15} color="#10B981" />
                    </mesh>
                    {showLabel && (
                      <Html
                        position={[0, height * 0.5 + 0.25, 0]}
                        center
                        distanceFactor={14}
                        zIndexRange={[10, 0]}
                      >
                        <div className="pointer-events-none select-none whitespace-nowrap px-1.5 py-0.5 rounded bg-emerald-950/95 border border-emerald-400 text-emerald-200 font-mono text-[9px] font-bold shadow-md">
                          PASSABLE DOORWAY #{idx + 1}
                        </div>
                      </Html>
                    )}
                  </group>
                );
              })}

              {showLabel && (
                <Html
                  position={[0, height + 0.35, -col.innerRadius]}
                  center
                  distanceFactor={15}
                  zIndexRange={[10, 0]}
                >
                  <div
                    className={`pointer-events-none select-none whitespace-nowrap px-1.5 py-0.5 rounded border font-mono text-[9px] font-bold shadow-md ${
                      isColliding
                        ? 'bg-amber-950/95 border-amber-400 text-amber-200'
                        : 'bg-slate-950/90 border-cyan-500/60 text-cyan-200'
                    }`}
                  >
                    {col.label} · Ring {col.innerRadius.toFixed(1)}–{col.outerRadius.toFixed(1)}m · Top:{col.topY.toFixed(2)}m
                  </div>
                </Html>
              )}
            </group>
          );
        }

        return null;
      })}
    </group>
  );
};

export default PhysicsDebugHitboxes;

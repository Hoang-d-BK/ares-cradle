import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Enhanced Third-Person Dynamic Orbit Camera Rig
 * - Full 360° mouse drag orbital observation
 * - Smooth camera follow behind Cadet Leo and Mars Rover
 * - Mouse scroll wheel zoom (4m to 25m)
 * - Drives character/rover forward when holding Left Mouse Button
 * - Touch pan/orbit for mobile & touch screens
 */
/**
 * Outpost base locations across the Mars simulation grid
 * Elevated foundations sit at y=0.52m with radius ~4.95m
 */
const BASE_CENTERS: [number, number][] = [
  [0, 0],
  [0, -28],
  [26, 15],
  [-26, 15],
  [-200, -170],
  [-210, 180],
  [210, -180],
  [200, 170]
];

export const CameraRig: React.FC = () => {
  const { camera, gl } = useThree();
  const playerPos = useOutpostStore((state) => state.playerPos);
  const roverPos = useOutpostStore((state) => state.roverPos);
  const isInsideHabitat = useOutpostStore((state) => state.isInsideHabitat);
  const isDrivingRover = useOutpostStore((state) => state.isDrivingRover);
  const isSkyViewActive = useOutpostStore((state) => state.isSkyViewActive);
  const toggleSkyView = useOutpostStore((state) => state.toggleSkyView);
  const setCameraYaw = useOutpostStore((state) => state.setCameraYaw);
  const setIsMouseDriving = useOutpostStore((state) => state.setIsMouseDriving);

  // Orbit Angles (radians)
  // yaw = 0 points towards -Z (North)
  const yaw = useRef(0);
  const pitch = useRef(0.48); // ~27 degrees elevation
  const distance = useRef(10.5); // meters

  // Dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasMovedSignificantly = useRef(false);

  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetCamPos = useRef(new THREE.Vector3(0, 6.5, 9.5));

  // 'KeyV' shortcut to toggle Orrery Sky View
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'KeyV') {
        toggleSkyView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSkyView]);

  // Mouse & Touch Orbit Event Handlers
  useEffect(() => {
    const dom = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      // Don't capture if clicking an interactive HUD element
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.pointer-events-auto')) {
        return;
      }

      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      hasMovedSignificantly.current = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      if (Math.hypot(dx, dy) > 4) {
        hasMovedSignificantly.current = true;
      }

      const rotSpeed = 0.0055;
      yaw.current -= dx * rotSpeed;

      // Keep yaw within [0, 2*PI]
      yaw.current = (yaw.current % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

      // Clamped pitch: [0.08, 1.25] rad (~4.6° to ~71.6°) strictly prevents camera from dipping below floor level / under base
      pitch.current = Math.max(0.08, Math.min(1.25, pitch.current - dy * rotSpeed));

      dragStart.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.012;
      distance.current = Math.max(3.8, Math.min(26.0, distance.current + zoomDelta));
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent right-click context menu so it can orbit freely
    };

    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('contextmenu', handleContextMenu);

    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl.domElement, setIsMouseDriving]);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const lerpSpeed = safeDelta * 5.0;

    // Broadcast current camera yaw to outpost store
    setCameraYaw(yaw.current);

    if (isSkyViewActive) {
      // Orrery Sky View: Tilt upward toward moons and starfield
      targetLookAt.current.set(0, 16.0, -10.0);
      targetCamPos.current.set(0, 2.2, 5.5);
    } else {
      // Active target entity (Rover if driving, Cadet Leo otherwise)
      const targetPos = isDrivingRover ? roverPos : playerPos;
      const targetHeightOffset = isDrivingRover ? 0.6 : 0.8;

      if (isInsideHabitat) {
        // Interior Dome View: Intimate distance inside the 4.8m dome, crystal-clear panoramic view
        const domeDist = Math.min(distance.current, 2.6);
        const safePitch = Math.max(0.10, Math.min(0.60, pitch.current));
        targetLookAt.current.set(targetPos[0], targetPos[1] + 0.85, targetPos[2]);
        targetCamPos.current.set(
          targetPos[0] + domeDist * Math.cos(safePitch) * Math.sin(yaw.current),
          Math.max(1.10, targetPos[1] + domeDist * Math.sin(safePitch) + 0.55),
          targetPos[2] + domeDist * Math.cos(safePitch) * Math.cos(yaw.current)
        );
      } else {
        // Exterior 360° Orbit View
        targetLookAt.current.set(
          targetPos[0],
          targetPos[1] + targetHeightOffset,
          targetPos[2]
        );
        const curDist = isDrivingRover ? Math.max(distance.current, 7.5) : distance.current;

        const camX = targetPos[0] + curDist * Math.cos(pitch.current) * Math.sin(yaw.current);
        const camZ = targetPos[2] + curDist * Math.cos(pitch.current) * Math.cos(yaw.current);

        // Clearance calculation: base foundations sit elevated at y = 0.52m with radius ~4.95m.
        // If the camera is anywhere near an outpost boundary (R < 6.8m), enforce minimum height of 0.95m
        // so the camera can NEVER dip under the base foundation or into the crawlspace.
        const isNearBase = BASE_CENTERS.some(
          ([bx, bz]) => Math.hypot(camX - bx, camZ - bz) < 6.8
        );
        const minAllowedY = isNearBase ? 0.95 : Math.max(0.65, targetPos[1] + 0.45);
        const rawCamY = targetPos[1] + curDist * Math.sin(pitch.current) + targetHeightOffset;

        targetCamPos.current.set(camX, Math.max(minAllowedY, rawCamY), camZ);
      }
    }

    camera.position.lerp(targetCamPos.current, lerpSpeed);
    currentLookAt.current.lerp(targetLookAt.current, lerpSpeed);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

export default CameraRig;

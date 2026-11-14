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

      // Stargazing pitch: allow tilting up into the sky (-0.48 rad) up to top-down view (1.35 rad)
      pitch.current = Math.max(-0.48, Math.min(1.35, pitch.current - dy * rotSpeed));

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
        // Interior Dome View: Closer intimate distance
        const domeDist = Math.min(distance.current, 5.5);
        targetLookAt.current.set(targetPos[0], targetPos[1] + 0.6, targetPos[2]);
        targetCamPos.current.set(
          targetPos[0] + domeDist * Math.cos(pitch.current) * Math.sin(yaw.current),
          targetPos[1] + domeDist * Math.sin(pitch.current) + 0.4,
          targetPos[2] + domeDist * Math.cos(pitch.current) * Math.cos(yaw.current)
        );
      } else {
        // Exterior 360° Orbit View with Stargazing elevation
        const lookUpElevation = pitch.current < 0 ? -pitch.current * 4.8 : 0;
        targetLookAt.current.set(
          targetPos[0],
          targetPos[1] + targetHeightOffset + lookUpElevation,
          targetPos[2]
        );
        const curDist = isDrivingRover ? Math.max(distance.current, 7.5) : distance.current;

        targetCamPos.current.set(
          targetPos[0] + curDist * Math.cos(pitch.current) * Math.sin(yaw.current),
          Math.max(0.15, targetPos[1] + curDist * Math.sin(pitch.current) + targetHeightOffset),
          targetPos[2] + curDist * Math.cos(pitch.current) * Math.cos(yaw.current)
        );
      }
    }

    camera.position.lerp(targetCamPos.current, lerpSpeed);
    currentLookAt.current.lerp(targetLookAt.current, lerpSpeed);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

export default CameraRig;

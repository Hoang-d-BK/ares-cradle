import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Phase 13: Dynamic Multi-Mode Camera Rig
 * Modes:
 * 1. Orrery Sky View (V key): Stargazing angle tilted upward at Phobos, Deimos, and stars
 * 2. Rover Chase Camera: Dynamic trailing camera locked to rover velocity and position
 * 3. Interior Dome: Intimate observation angle inside habitat dome
 * 4. Exterior 45° Isometric: Nominal cadet navigation across Martian outpost
 */
export const CameraRig: React.FC = () => {
  const { camera } = useThree();
  const playerPos = useOutpostStore((state) => state.playerPos);
  const roverPos = useOutpostStore((state) => state.roverPos);
  const isInsideHabitat = useOutpostStore((state) => state.isInsideHabitat);
  const isDrivingRover = useOutpostStore((state) => state.isDrivingRover);
  const isSkyViewActive = useOutpostStore((state) => state.isSkyViewActive);
  const toggleSkyView = useOutpostStore((state) => state.toggleSkyView);

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

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const lerpSpeed = safeDelta * 4.5;

    if (isSkyViewActive) {
      // Orrery Sky View: Tilt upward toward moons and starfield
      targetLookAt.current.set(0, 16.0, -10.0);
      targetCamPos.current.set(0, 2.2, 5.5);
    } else if (isDrivingRover) {
      // Rover Dynamic Chase Camera
      targetLookAt.current.set(roverPos[0], roverPos[1] + 0.4, roverPos[2]);
      targetCamPos.current.set(
        roverPos[0],
        roverPos[1] + 5.2,
        roverPos[2] + 7.8
      );
    } else if (isInsideHabitat) {
      // Interior Dome View
      targetLookAt.current.set(playerPos[0] * 0.4, 0.8, playerPos[2] * 0.4);
      targetCamPos.current.set(
        playerPos[0] * 0.5,
        1.8,
        playerPos[2] * 0.5 + 2.8
      );
    } else {
      // Exterior 45° Isometric View
      targetLookAt.current.set(playerPos[0], 0.4, playerPos[2]);
      targetCamPos.current.set(
        playerPos[0],
        playerPos[1] + 6.8,
        playerPos[2] + 9.6
      );
    }

    camera.position.lerp(targetCamPos.current, lerpSpeed);
    currentLookAt.current.lerp(targetLookAt.current, lerpSpeed);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

export default CameraRig;

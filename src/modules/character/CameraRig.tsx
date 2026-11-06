import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

/**
 * Task 12.2: Camera Rig with 45° Isometric Follow & Interior/Exterior Seamless Switching
 * Architecture 3.1:
 * - Exterior: Position offset [0, 6.5, 9.5], 45° Isometric angle, lerp factor 0.08
 * - Interior: Close observation angle [0, 1.6, 2.2] inside dome looking outward
 */
export const CameraRig: React.FC = () => {
  const { camera } = useThree();
  const playerPos = useOutpostStore((state) => state.playerPos);
  const isInsideHabitat = useOutpostStore((state) => state.isInsideHabitat);

  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetCamPos = useRef(new THREE.Vector3(0, 6.5, 9.5));

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const lerpSpeed = safeDelta * 4.5; // Smooth cinematic damping

    if (isInsideHabitat) {
      // Interior Dome View: Intimate camera angle inside habitat dome
      targetLookAt.current.set(playerPos[0] * 0.4, 0.8, playerPos[2] * 0.4);
      targetCamPos.current.set(
        playerPos[0] * 0.5,
        1.8,
        playerPos[2] * 0.5 + 2.8
      );
    } else {
      // Exterior 45° Isometric View: Follow player across Martian terrain
      targetLookAt.current.set(playerPos[0], 0.4, playerPos[2]);
      targetCamPos.current.set(
        playerPos[0],
        playerPos[1] + 6.8,
        playerPos[2] + 9.6
      );
    }

    // Lerp camera position
    camera.position.lerp(targetCamPos.current, lerpSpeed);

    // Lerp lookAt target
    currentLookAt.current.lerp(targetLookAt.current, lerpSpeed);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

export default CameraRig;

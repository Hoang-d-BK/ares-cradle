import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { getGameplayStarted } from '@/modules/session/gameSession';
import { buildWorldColliders } from './physicsEngine';
import { sampleWorldGround } from '../outpost-3d/worldRegions';
import {
  cameraLookFromPosition,
  clampCameraPitch,
  clampCameraPitchToFrame,
  findCameraPosition,
  MIN_CAMERA_SEPARATION,
  MIN_HABITAT_CAMERA_SEPARATION,
  MIN_ROVER_CAMERA_SEPARATION,
  resolveCameraBoom,
  updateCameraLook,
  wrapCameraYaw,
} from './thirdPersonCamera';

const LOOK_SMOOTHING = 14;
const HUMAN_DISTANCE = 6;
const ROVER_DISTANCE = 7.2;
const HUMAN_PIVOT_HEIGHT = 0.2;
const ROVER_PIVOT_HEIGHT = 0.35;
const DEFAULT_ELEVATION_PITCH = -0.2;

type DragState = { pointerId: number; x: number; y: number };

const modalIsOpen = () =>
  typeof document !== 'undefined' && !!document.querySelector('[role="dialog"]');

/** Third-person chase/orbit camera shared by the astronaut and remote rover. */
export const CameraRig: React.FC = () => {
  const { camera, gl } = useThree();
  const setCameraLook = useOutpostStore((state) => state.setCameraLook);
  const cameraYaw = useOutpostStore((state) => state.cameraYaw);
  const cameraPitch = useOutpostStore((state) => state.cameraPitch);
  const setPointerLocked = useOutpostStore((state) => state.setPointerLocked);
  const toggleSkyView = useOutpostStore((state) => state.toggleSkyView);

  const initialPitch = Math.abs(cameraPitch) < 0.001 ? DEFAULT_ELEVATION_PITCH : cameraPitch;
  const targetYaw = useRef(cameraYaw);
  const targetPitch = useRef(initialPitch);
  const actualYaw = useRef(cameraYaw);
  const actualPitch = useRef(initialPitch);
  const humanLook = useRef({ yaw: cameraYaw, pitch: initialPitch });
  const remoteYawOffset = useRef(0);
  const actualPosition = useRef(new THREE.Vector3());
  const cameraInitialized = useRef(false);
  const drag = useRef<DragState | null>(null);
  const releaseDragRef = useRef<() => void>(() => {});
  const wasRemote = useRef(useOutpostStore.getState().isDrivingRover);

  useEffect(() => {
    const releaseDrag = () => {
      const active = drag.current;
      drag.current = null;
      if (active && gl.domElement.hasPointerCapture?.(active.pointerId)) {
        try { gl.domElement.releasePointerCapture(active.pointerId); } catch { /* Capture can already be lost. */ }
      }
    };
    releaseDragRef.current = releaseDrag;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.code === 'Escape') {
        releaseDrag();
        setPointerLocked(false);
        return;
      }
      if (event.code === 'KeyV' && !modalIsOpen() && getGameplayStarted()) toggleSkyView();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!getGameplayStarted() || modalIsOpen() || document.hidden) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      try { gl.domElement.setPointerCapture?.(event.pointerId); } catch { /* Continue with native canvas drag. */ }
      drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const handlePointerMove = (event: PointerEvent) => {
      const active = drag.current;
      if (!active || active.pointerId !== event.pointerId) return;
      if (modalIsOpen() || document.hidden) {
        releaseDrag();
        return;
      }
      const movementX = event.clientX - active.x;
      const movementY = event.clientY - active.y;
      const look = updateCameraLook(targetYaw.current, targetPitch.current, movementX, movementY);
      active.x = event.clientX;
      active.y = event.clientY;
      if (useOutpostStore.getState().isDrivingRover) {
        remoteYawOffset.current = wrapCameraYaw(remoteYawOffset.current - movementX * 0.0022);
      }
      targetYaw.current = look.yaw;
      targetPitch.current = look.pitch;
    };
    const handlePointerEnd = (event: PointerEvent) => {
      if (drag.current?.pointerId === event.pointerId) releaseDrag();
    };
    const releaseForBlur = () => {
      releaseDrag();
      setPointerLocked(false);
    };
    const handleVisibilityChange = () => { if (document.hidden) releaseForBlur(); };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    gl.domElement.addEventListener('pointermove', handlePointerMove);
    gl.domElement.addEventListener('pointerup', handlePointerEnd);
    gl.domElement.addEventListener('pointercancel', handlePointerEnd);
    gl.domElement.addEventListener('lostpointercapture', handlePointerEnd);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', releaseForBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    setPointerLocked(false);
    return () => {
      releaseDrag();
      releaseDragRef.current = () => {};
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      gl.domElement.removeEventListener('pointerup', handlePointerEnd);
      gl.domElement.removeEventListener('pointercancel', handlePointerEnd);
      gl.domElement.removeEventListener('lostpointercapture', handlePointerEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', releaseForBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setPointerLocked(false);
    };
  }, [gl.domElement, setPointerLocked, toggleSkyView]);

  useFrame((_, delta) => {
    const store = useOutpostStore.getState();
    const remote = store.isDrivingRover;
    if (modalIsOpen() || document.hidden || remote !== wasRemote.current) {
      releaseDragRef.current();
      if (store.isPointerLocked) setPointerLocked(false);
    }

    if (remote !== wasRemote.current) {
      if (remote) {
        humanLook.current = { yaw: targetYaw.current, pitch: targetPitch.current };
        remoteYawOffset.current = 0;
        targetYaw.current = wrapCameraYaw(store.roverHeading + Math.PI);
        targetPitch.current = DEFAULT_ELEVATION_PITCH;
      } else {
        targetYaw.current = humanLook.current.yaw;
        targetPitch.current = humanLook.current.pitch;
        actualYaw.current = humanLook.current.yaw;
        actualPitch.current = humanLook.current.pitch;
      }
      wasRemote.current = remote;
    }

    if (remote) targetYaw.current = wrapCameraYaw(store.roverHeading + Math.PI + remoteYawOffset.current);
    targetPitch.current = clampCameraPitch(targetPitch.current);

    const safeDelta = Math.min(Math.max(delta, 0), 0.05);
    const smoothing = 1 - Math.exp(-LOOK_SMOOTHING * safeDelta);
    actualYaw.current = wrapCameraYaw(actualYaw.current + wrapCameraYaw(targetYaw.current - actualYaw.current) * smoothing);
    actualPitch.current = THREE.MathUtils.lerp(actualPitch.current, targetPitch.current, smoothing);
    actualPitch.current = clampCameraPitch(actualPitch.current);

    const actor = remote ? store.roverPos : store.playerPos;
    const pivot = {
      x: actor[0],
      y: actor[1] + (remote ? ROVER_PIVOT_HEIGHT : HUMAN_PIVOT_HEIGHT),
      z: actor[2],
    };
    const colliders = buildWorldColliders(store.roverPos, remote);
    const insideHabitat = !remote && !!store.isInsideHabitat &&
      Math.hypot(actor[0], actor[2]) < 3.55;
    const distance = remote ? ROVER_DISTANCE : insideHabitat ? 2.8 : HUMAN_DISTANCE;
    const minimumSeparation = remote ? MIN_ROVER_CAMERA_SEPARATION
      : insideHabitat ? MIN_HABITAT_CAMERA_SEPARATION : MIN_CAMERA_SEPARATION;
    const candidateVisible = (candidate: { x: number; y: number; z: number }) =>
      !insideHabitat || (Math.hypot(candidate.x, candidate.z) < 3.55 &&
        Math.hypot(candidate.x - pivot.x, candidate.y - pivot.y, candidate.z - pivot.z) > 1e-4);
    const safeTarget = findCameraPosition(
      pivot,
      actualYaw.current,
      actualPitch.current,
      distance,
      minimumSeparation,
      sampleWorldGround,
      colliders,
      candidateVisible,
      insideHabitat ? 1.0 : undefined,
    );
    const obstructionShortened = Math.hypot(
      safeTarget.x - actualPosition.current.x,
      safeTarget.y - actualPosition.current.y,
      safeTarget.z - actualPosition.current.z
    ) > 1.5;
    if (!cameraInitialized.current || obstructionShortened) {
      actualPosition.current.set(safeTarget.x, safeTarget.y, safeTarget.z);
      cameraInitialized.current = true;
    } else {
      actualPosition.current.lerp(new THREE.Vector3(safeTarget.x, safeTarget.y, safeTarget.z), smoothing);
      const dampedSafe = resolveCameraBoom(pivot, actualPosition.current, sampleWorldGround, colliders);
      actualPosition.current.set(dampedSafe.x, dampedSafe.y, dampedSafe.z);
    }

    // Camera damping can pass a remote target through the world: validate the final point and
    // its last-metre segment, then snap to a clear candidate if damping left it too close.
    const finalSafe = resolveCameraBoom(pivot, actualPosition.current, sampleWorldGround, colliders);
    actualPosition.current.set(finalSafe.x, finalSafe.y, finalSafe.z);
    const finalSeparation = actualPosition.current.distanceTo(new THREE.Vector3(pivot.x, pivot.y, pivot.z));
    if (finalSeparation < minimumSeparation) {
      actualPosition.current.set(safeTarget.x, safeTarget.y, safeTarget.z);
    }

    camera.position.copy(actualPosition.current);
    const desiredViewPitch = clampCameraPitchToFrame(
      camera.position,
      pivot,
      actualPitch.current,
      camera instanceof THREE.PerspectiveCamera ? camera.fov : 45,
      remote,
    );
    const boomLook = cameraLookFromPosition(actualPosition.current, pivot, actualYaw.current);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(desiredViewPitch, boomLook.yaw, 0, 'YXZ');
    const displayedDirection = camera.getWorldDirection(new THREE.Vector3());
    const displayedPitch = Math.atan2(displayedDirection.y, Math.hypot(displayedDirection.x, displayedDirection.z));
    actualPitch.current = displayedPitch;
    setCameraLook(boomLook.yaw, displayedPitch);

    if (!remote) humanLook.current = { yaw: targetYaw.current, pitch: targetPitch.current };
  });

  return null;
};

export default CameraRig;

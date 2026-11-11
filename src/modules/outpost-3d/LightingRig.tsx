import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

export const LightingRig: React.FC = () => {
  const { scene } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  const solTime = useOutpostStore((state) => state.solTime);
  const activeEvents = useOutpostStore((state) => state.activeEvents);
  const graphicsQuality = useOutpostStore((state) => state.graphicsQuality);

  const isStormActive = activeEvents.some(
    (e) => e.active && !e.resolved && e.type === 'dust_storm'
  );

  // Targets for smooth lerp transitions
  const targetDirColor = useRef(new THREE.Color('#FFE8D6'));
  const targetAmbientColor = useRef(new THREE.Color('#FFD1BA'));
  const targetFogColor = useRef(new THREE.Color('#0B0E14'));

  useFrame((_, delta) => {
    // Synchronize with SIM_CONSTANTS.SOL_DURATION_SECONDS (60s cycle: 0-32s day, 32-60s night)
    const cycleTime = ((solTime % 60) + 60) % 60;
    const isDay = cycleTime < 32;
    const dayProgress = Math.min(1, cycleTime / 32);

    let targetDirIntensity = 0;
    let targetAmbientIntensity = 0.32;

    if (isStormActive) {
      // Dust storm: reddish-brown diffusion, heavy fog
      targetDirIntensity = 0.45;
      targetAmbientIntensity = 0.6;
      targetDirColor.current.set('#FF7A30');
      targetAmbientColor.current.set('#782E0C');
      targetFogColor.current.set('#4A1504');
    } else if (isDay) {
      // Daytime: bright Martian sunlight arc
      const sunHeight = Math.sin(dayProgress * Math.PI);
      targetDirIntensity = Math.max(0.15, sunHeight * 1.9);
      targetAmbientIntensity = 0.38 + sunHeight * 0.15;

      if (dayProgress < 0.2) {
        // Morning dawn
        targetDirColor.current.set('#FFB380');
        targetAmbientColor.current.set('#8C3D1D');
        targetFogColor.current.set('#1A0E0B');
      } else if (dayProgress > 0.8) {
        // Sunset dusk
        targetDirColor.current.set('#FF6E30');
        targetAmbientColor.current.set('#66220E');
        targetFogColor.current.set('#1A0808');
      } else {
        // High noon
        targetDirColor.current.set('#FFF0E2');
        targetAmbientColor.current.set('#E28359');
        targetFogColor.current.set('#0E121A');
      }
    } else {
      // Nighttime: Phobos moonlight + readable outpost fill
      targetDirIntensity = 0.18;
      targetAmbientIntensity = 0.22;
      targetDirColor.current.set('#6B8DB5');
      targetAmbientColor.current.set('#1E293B');
      targetFogColor.current.set('#07090E');
    }

    if (dirLightRef.current) {
      dirLightRef.current.castShadow = graphicsQuality !== 'low';
    }

    const lerpSpeed = Math.min(1, delta * 3.5);

    // Lerp Directional Light
    if (dirLightRef.current) {
      dirLightRef.current.intensity = THREE.MathUtils.lerp(
        dirLightRef.current.intensity,
        targetDirIntensity,
        lerpSpeed
      );
      dirLightRef.current.color.lerp(targetDirColor.current, lerpSpeed);

      // Orbital arc for the sun during daylight
      if (isDay) {
        const angle = dayProgress * Math.PI;
        const targetX = Math.cos(angle) * 16;
        const targetY = Math.max(1, Math.sin(angle) * 14 + 1);
        dirLightRef.current.position.x = THREE.MathUtils.lerp(dirLightRef.current.position.x, targetX, lerpSpeed);
        dirLightRef.current.position.y = THREE.MathUtils.lerp(dirLightRef.current.position.y, targetY, lerpSpeed);
      }
    }

    // Lerp Ambient Light
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(
        ambientLightRef.current.intensity,
        targetAmbientIntensity,
        lerpSpeed
      );
      ambientLightRef.current.color.lerp(targetAmbientColor.current, lerpSpeed);
    }

    // Lerp Scene Fog
    if (scene.fog && 'color' in scene.fog) {
      (scene.fog as THREE.FogExp2).color.lerp(targetFogColor.current, lerpSpeed);
      const targetDensity = isStormActive ? 0.075 : isDay ? 0.03 : 0.045;
      (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(
        (scene.fog as THREE.FogExp2).density,
        targetDensity,
        lerpSpeed
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.4} color="#FFD1BA" />
      <directionalLight
        ref={dirLightRef}
        position={[12, 14, 7]}
        intensity={1.8}
        color="#FFE8D6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={35}
        shadow-bias={-0.001}
      />
    </>
  );
};

export default LightingRig;

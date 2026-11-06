import React, { useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { 
  EffectComposer, 
  Bloom, 
  Noise, 
  Vignette, 
  ChromaticAberration 
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useControls, Leva } from 'leva';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

import LightingRig from './LightingRig';
import MarsTerrain from './MarsTerrain';
import HabitatDome from './HabitatDome';
import HabitatInterior from './HabitatInterior';
import SolarArray from './SolarArray';
import BatteryBank from './BatteryBank';
import DustStormParticles from './DustStormParticles';
import MarsRover from './MarsRover';
import ResourceDrops from './ResourceDrops';
import SpaceSkybox from './SpaceSkybox';
import AstronautPlayer from '@/modules/character/AstronautPlayer';
import CameraRig from '@/modules/character/CameraRig';

/**
 * High-performance frame driver connecting R3F render loop with the domain simulation tick.
 */
function SimulationLoopDriver() {
  const tick = useOutpostStore((state) => state.tick);
  const isSimulating = useOutpostStore((state) => state.isSimulating);

  useFrame((_, delta) => {
    if (isSimulating) {
      // Clamp delta to avoid massive leaps on tab defocus
      const safeDelta = Math.min(0.1, delta);
      tick(safeDelta);
    }
  });

  return null;
}

/**
 * Task 9.3: GPU Post-Processing Pipeline
 * - Bloom for energy crystals, LEDs and habitat dome
 * - Noise & Vignette (red/orange) dynamically surging with dust storms
 * - Chromatic Aberration during power brownouts / voltage dips
 */
function PostProcessingPipeline({ isDebug }: { isDebug: boolean }) {
  const activeEvents = useOutpostStore((state) => state.activeEvents);
  const dustCoverage = useOutpostStore((state) => state.dustCoverage);
  const battery = useOutpostStore((state) => state.battery);
  const emergencyPowerSaver = useOutpostStore((state) => state.emergencyPowerSaver);
  const solPhase = useOutpostStore((state) => state.solPhase);

  const isStormActive = activeEvents.some(
    (e) => e.active && !e.resolved && e.type === 'dust_storm'
  );
  const isBrownout = battery <= 0;

  // Real-time calculated dynamic baseline
  const calcBloom = solPhase === 'Night' || solPhase === 'Sunset' ? 1.6 : 0.9;
  const calcNoise = isStormActive ? 0.35 : dustCoverage > 0.3 ? 0.2 : 0.05;
  const calcVignette = isStormActive ? 0.8 : dustCoverage > 0.3 ? 0.55 : 0.38;
  const calcAberration = isBrownout ? 0.006 : emergencyPowerSaver ? 0.0025 : 0.0008;

  // Interactive GUI for developer calibration (Active when URL has ?debug=true)
  const [controls] = useControls(
    'Mars Post-Processing & Storm Shader',
    () => ({
      bloomIntensity: { value: calcBloom, min: 0, max: 3.5, step: 0.1 },
      noiseOpacity: { value: calcNoise, min: 0, max: 1.0, step: 0.02 },
      vignetteDarkness: { value: calcVignette, min: 0, max: 1.5, step: 0.05 },
      chromaticAberration: { value: calcAberration, min: 0, max: 0.02, step: 0.001 }
    }),
    { collapsed: false }
  );

  const bloomIntensity = isDebug ? controls.bloomIntensity : calcBloom;
  const noiseOpacity = isDebug ? controls.noiseOpacity : calcNoise;
  const vignetteDarkness = isDebug ? controls.vignetteDarkness : calcVignette;
  const aberrationAmount = isDebug ? controls.chromaticAberration : calcAberration;

  const aberrationOffset = useMemo(
    () => new THREE.Vector2(aberrationAmount, aberrationAmount),
    [aberrationAmount]
  );

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        luminanceThreshold={0.22}
        luminanceSmoothing={0.8}
        intensity={bloomIntensity}
        mipmapBlur
      />
      <Noise
        opacity={noiseOpacity}
        blendFunction={BlendFunction.OVERLAY}
      />
      <Vignette
        eskil={false}
        offset={0.22}
        darkness={vignetteDarkness}
      />
      <ChromaticAberration
        offset={aberrationOffset}
        radialModulation={false}
        modulationOffset={0}
      />
    </EffectComposer>
  );
}

/**
 * Camera Controller with Leva GUI integration when ?debug=true
 */
function DynamicCameraController({ isDebug }: { isDebug: boolean }) {
  const { camera } = useThree();

  const [camControls] = useControls(
    'Camera Rig Controls',
    () => ({
      fov: { value: 45, min: 30, max: 75, step: 1 },
      posY: { value: 6.5, min: 3, max: 15, step: 0.5 },
      posZ: { value: 13, min: 6, max: 25, step: 0.5 }
    }),
    { collapsed: false }
  );

  useEffect(() => {
    if (isDebug && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persCam = camera as THREE.PerspectiveCamera;
      persCam.fov = camControls.fov;
      persCam.updateProjectionMatrix();
    }
  }, [isDebug, camControls.fov, camera]);

  return null;
}

/**
 * Primary 3D Viewport for Ares Cradle (v2.0).
 * Hallmark-grade interactive Mars diorama designed for tactile clarity and 60 FPS performance.
 * Integrates CC0 Low-Poly Astronaut, Mars Rover, Energy Crystals, NASA InSight Hologram,
 * and GPU Post-Processing Shader Pipeline.
 */
export const MarsCanvas: React.FC = () => {
  // Query flag check for ?debug=true
  const isDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === 'true';
  }, []);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
      {/* Leva GUI Control Deck - Visible only with ?debug=true query flag */}
      <Leva
        hidden={!isDebug}
        titleBar={{ title: 'Ares Cradle v2.0 • Post-Processing Debug Deck' }}
        theme={{
          colors: {
            elevation1: '#0B0E14',
            elevation2: '#121620',
            elevation3: '#1A2130',
            accent1: '#00F0FF',
            highlight1: '#FFB020',
            highlight2: '#C1440E'
          }
        }}
      />

      <Canvas
        camera={{ position: [0, 6.5, 13], fov: 45 }}
        dpr={[1, 2]} // Memory Hygiene: clamp device pixel ratio to max 2
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        onCreated={({ gl, scene }) => {
          // Strict memory hygiene: clamp pixel ratio and clean clear color
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          gl.setClearColor(new THREE.Color('#0B0E14'));
          scene.fog = new THREE.FogExp2('#0B0E14', 0.035);
        }}
      >
        {/* Real-time simulation tick processor */}
        <SimulationLoopDriver />

        {/* Dynamic Camera Controller with Leva tuning */}
        <DynamicCameraController isDebug={isDebug} />

        {/* Dynamic Mars Sun, Atmosphere & Storm Lighting */}
        <LightingRig />

        {/* Task 10.3: Celestial Skybox with Twinkling Stars & Orbiting Phobos Moon */}
        <SpaceSkybox />

        {/* Mars Surface, Craters, Foundation & Mineral Rocks */}
        <MarsTerrain />

        {/* Pressurized Habitat with Reactive Bioluminescent Core */}
        <HabitatDome />

        {/* Task 9.2: NASA InSight Lander / Rover Wireframe Hologram Blueprint inside Observation Glass */}
        <HabitatInterior />

        {/* Task 12.2: Interactive Astronaut Player (Cadet Leo with WASD + Joystick) */}
        <AstronautPlayer />

        {/* Task 9.1: Low-Poly Mars Rover Unit (Kenney Space Kit Style) */}
        <MarsRover />

        {/* Task 9.1: Low-Poly Floating Radiant Energy Crystals */}
        <ResourceDrops />

        {/* Tactile Solar Array with Interactive Dust Wiping */}
        <SolarArray />

        {/* Modular Energy Storage with Dynamic LED Charge Bar */}
        <BatteryBank />

        {/* Dynamic Atmospheric Dust Motes & Storm Particle System */}
        <DustStormParticles />

        {/* Task 9.3: GPU Post-Processing Pipeline (Bloom, Noise, Vignette, ChromaticAberration) */}
        <PostProcessingPipeline isDebug={isDebug} />

        {/* Task 12.2: Smooth 45° Isometric Camera Rig with Interior/Exterior Switching */}
        {!isDebug && <CameraRig />}

        {/* Safe OrbitControls for Developer Leva Tuning Deck */}
        {isDebug && (
          <OrbitControls
            enablePan={false}
            maxPolarAngle={Math.PI / 2.05}
            minPolarAngle={Math.PI / 6}
            minDistance={6}
            maxDistance={22}
            dampingFactor={0.08}
          />
        )}
      </Canvas>
    </div>
  );
};

export default MarsCanvas;

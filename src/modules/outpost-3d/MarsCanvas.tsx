import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useOutpostStore } from '@/modules/store/useOutpostStore';

import LightingRig from './LightingRig';
import MarsTerrain from './MarsTerrain';
import HabitatDome from './HabitatDome';
import SolarArray from './SolarArray';
import BatteryBank from './BatteryBank';
import DustStormParticles from './DustStormParticles';

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
 * Primary 3D Viewport for Ares Cradle.
 * Hallmark-grade interactive Mars diorama designed for tactile clarity and 60 FPS performance.
 */
export const MarsCanvas: React.FC = () => {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
      <Canvas
        camera={{ position: [0, 6.5, 13], fov: 45 }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color('#0B0E14'));
          scene.fog = new THREE.FogExp2('#0B0E14', 0.035);
        }}
      >
        {/* Real-time simulation tick processor */}
        <SimulationLoopDriver />

        {/* Dynamic Mars Sun, Atmosphere & Storm Lighting */}
        <LightingRig />

        {/* Mars Surface, Craters, Foundation & Mineral Rocks */}
        <MarsTerrain />

        {/* Pressurized Habitat with Reactive Bioluminescent Core */}
        <HabitatDome />

        {/* Tactile Solar Array with Interactive Dust Wiping */}
        <SolarArray />

        {/* Modular Energy Storage with Dynamic LED Charge Bar */}
        <BatteryBank />

        {/* Dynamic Atmospheric Dust Motes & Storm Particle System */}
        <DustStormParticles />

        {/* Safe OrbitControls restricted for young cadets (prevents upside-down camera) */}
        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 6}
          minDistance={6}
          maxDistance={22}
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
};

export default MarsCanvas;

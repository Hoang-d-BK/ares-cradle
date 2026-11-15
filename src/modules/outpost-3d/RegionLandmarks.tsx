import React, { useMemo } from 'react';
import * as THREE from 'three';
import { WORLD_REGIONS, sampleWorldGround, type OuterHeroLandmark, type OuterRegion } from './worldRegions';
import { NATURAL_ROCK_SCATTER, type NaturalRockProxy } from './naturalSiteDefinitions';
import { createMarsSurfaceMaterial } from './marsSurfaceMaterials';
import { AncientOutgassingTeachingPlume } from './ScientificElements';

export function createNaturalBoulderGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const wave = 1 + 0.055 * Math.sin(x * 9.3 + z * 4.7) * Math.cos(y * 7.2 - x * 3.1);
    positions.setXYZ(i, x * wave, y * wave, z * wave);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

const BOULDER_GEOMETRY = createNaturalBoulderGeometry();

export function getNaturalBoulderInstanceMatrix(rock: NaturalRockProxy): THREE.Matrix4 {
  const dummy = new THREE.Object3D();
  dummy.position.set(rock.position.x, sampleWorldGround(rock.position.x, rock.position.z) + rock.height * 0.3, rock.position.z);
  dummy.rotation.set((rock.seed % 7) * 0.04, rock.seed * 0.19, (rock.seed % 5) * 0.055);
  // Leave clear space inside the physics footprint despite the perturbed unit hull.
  dummy.scale.set(rock.radius * 0.54, rock.height * 0.36, rock.radius * (0.78 + (rock.seed % 4) * 0.055) * 0.54);
  dummy.updateMatrix();
  return dummy.matrix.clone();
}

const ROCK_MATERIALS = Object.fromEntries(WORLD_REGIONS.map(({ id, palette }) => [id, createMarsSurfaceMaterial({
  color: palette.rock,
  roughness: 0.96,
  bumpScale: 0.16,
})]));
const LAYER_MATERIALS = Object.fromEntries(WORLD_REGIONS.map(({ id, palette }) => [id, createMarsSurfaceMaterial({
  color: palette.accent,
  roughness: 0.94,
  bumpScale: 0.09,
})]));

function VolcanicChannelAndVent({ landmark, region }: { landmark: OuterHeroLandmark; region: OuterRegion }) {
  const channel = { x: -260, z: 262 };
  const vent = { x: -247, z: 254 };
  const channelY = sampleWorldGround(channel.x, channel.z);
  const ventY = sampleWorldGround(vent.x, vent.z);
  return <>
    <group name="cooled-lava-channel-tube-mouth" position={[channel.x, channelY, channel.z]} rotation={[0, landmark.yaw, 0]}>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[5.2, 3.4, 1]}>
        <circleGeometry args={[1, 32]} /><meshBasicMaterial color="#101314" />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[5.8, 3.9, 1]}>
        <torusGeometry args={[1, 0.12, 8, 40]} /><primitive object={ROCK_MATERIALS[region.id]} attach="material" />
      </mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 5.8, 0.38, 0]} rotation={[0.04, side * 0.08, 0.03]} scale={[2.2, 0.45, 6.5]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 1]} /><primitive object={ROCK_MATERIALS[region.id]} attach="material" />
      </mesh>)}
    </group>
    <group name="ancient-volcanic-vent-fissure" position={[vent.x, ventY, vent.z]} rotation={[0, landmark.yaw + 0.42, 0]}>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.2, 0.7, 1]}>
        <circleGeometry args={[1, 24]} /><meshBasicMaterial color="#121516" />
      </mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 1.1, 0.32, 0]} rotation={[0.04, side * 0.12, 0.05]} scale={[1.3, 0.42, 2.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 1]} /><primitive object={LAYER_MATERIALS[region.id]} attach="material" />
      </mesh>)}
      <AncientOutgassingTeachingPlume />
    </group>
  </>;
}

function NaturalBoulderField({ region }: { region: OuterRegion }) {
  const rocks = useMemo(() => NATURAL_ROCK_SCATTER.filter((rock) => rock.regionId === region.id), [region.id]);
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const matrices = useMemo(() => rocks.map(getNaturalBoulderInstanceMatrix), [rocks]);
  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  return <group name="natural-boulder-field">
    <instancedMesh ref={meshRef} args={[BOULDER_GEOMETRY, ROCK_MATERIALS[region.id], rocks.length]} castShadow receiveShadow />
  </group>;
}

/** Low, route-clear transverse ridges make the dust-sector dune field legible at a distance. */
function DustDuneRidges({ landmark, region }: { landmark: OuterHeroLandmark; region: OuterRegion }) {
  const ridges = useMemo(() => [-1, 1].map((side) => {
    const x = landmark.position.x + side * 24;
    const z = landmark.position.z + side * 2.5;
    return { x, z, y: sampleWorldGround(x, z), side };
  }), [landmark]);
  return <group name="wind-shaped-dune-ridges">
    {ridges.map(({ x, z, y, side }) => <mesh key={side} position={[x, y + 0.18, z]} rotation={[0, side * 0.035, 0]} scale={[16, 0.55, 2.8]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 2]} />
      <primitive object={LAYER_MATERIALS[region.id]} attach="material" />
    </mesh>)}
  </group>;
}

/** Exposed natural bedding on an eroded bluff. Its base follows the shared ground sampler. */
function SedimentaryBluff({ landmark, region }: { landmark: OuterHeroLandmark; region: OuterRegion }) {
  const bands = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const x = landmark.position.x - 4.2 + index * 1.3;
    const z = landmark.position.z + 0.2 * Math.sin(index * 0.72);
    return { x, z, y: sampleWorldGround(x, z), width: 8.5 - index * 0.37, index };
  }), [landmark]);
  return <group name="exposed-natural-cross-bedding">
    {bands.map(({ x, z, y, width, index }) => <mesh key={index} position={[x, y + 0.16 + index * 0.18, z]} rotation={[0.03, landmark.yaw, 0.01]} scale={[width, 0.11, 0.48]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 1]} />
      <primitive object={LAYER_MATERIALS[region.id]} attach="material" />
    </mesh>)}
  </group>;
}

/** A rough, asymmetric scarp cap above the sampler-authored icy mantle slope. */
function IceScarpOutcrop({ landmark, region }: { landmark: OuterHeroLandmark; region: OuterRegion }) {
  const y = sampleWorldGround(landmark.position.x, landmark.position.z);
  return <group name="ice-bearing-mantle-scarp" position={[landmark.position.x, y, landmark.position.z]} rotation={[0, landmark.yaw, 0]}>
    <mesh position={[0, 0.55, 0]} rotation={[0.04, 0.18, -0.12]} scale={[9.8, 1.6, 5.2]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 2]} />
      <primitive object={ROCK_MATERIALS[region.id]} attach="material" />
    </mesh>
    <mesh position={[-1.1, 1.02, 1.58]} rotation={[0.09, 0.18, -0.12]} scale={[6.4, 0.095, 1.2]}>
      <dodecahedronGeometry args={[1, 1]} />
      <primitive object={LAYER_MATERIALS[region.id]} attach="material" />
    </mesh>
    <mesh position={[1.7, 0.77, 1.2]} rotation={[0.1, 0.1, 0.13]} scale={[4.3, 0.065, 0.85]}>
      <dodecahedronGeometry args={[1, 1]} />
      <primitive object={LAYER_MATERIALS[region.id]} attach="material" />
    </mesh>
  </group>;
}

/** Cooled basalt flow plates flank the actual broad shield and shallow shared-ground caldera. */
function BasaltFlowOutcrops({ landmark, region }: { landmark: OuterHeroLandmark; region: OuterRegion }) {
  const flows = useMemo(() => [-1, 1, 2].map((side, index) => {
    const x = landmark.position.x + side * (17 + index * 3.4);
    const z = landmark.position.z + (index - 1) * 10;
    return { x, z, y: sampleWorldGround(x, z), side, index };
  }), [landmark]);
  return <group name="cooled-basalt-flow-lobes">
    {flows.map(({ x, z, y, side, index }) => <mesh key={index} position={[x, y + 0.14, z]} rotation={[0.015, landmark.yaw + side * 0.13, 0.025]} scale={[13 - index, 0.2, 3.8 - index * 0.3]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 1]} />
      <primitive object={ROCK_MATERIALS[region.id]} attach="material" />
    </mesh>)}
  </group>;
}

/** The five old engineered hero assembly IDs are gone; each root now names geology. */
export const RegionHero: React.FC<{ landmark: OuterHeroLandmark; region: OuterRegion }> = ({ landmark, region }) => <group
  name={`natural-${landmark.id}`}
>
  {region.id === 'ice' && <IceScarpOutcrop landmark={landmark} region={region} />}
  {region.id === 'volcano' && <>
    <BasaltFlowOutcrops landmark={landmark} region={region} />
    <VolcanicChannelAndVent landmark={landmark} region={region} />
  </>}
  {region.id === 'lake' && <SedimentaryBluff landmark={landmark} region={region} />}
  {region.id === 'dust' && <DustDuneRidges landmark={landmark} region={region} />}
  <NaturalBoulderField region={region} />
</group>;

/** Base-console coordinates remain logical relay/map anchors, never rendered field statues. */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useOutpostStore } from '@/modules/store/useOutpostStore';
import { SCIENTIFIC_ELEMENTS, type ScientificElement } from './scienceCatalog';
import { sampleWorldGround } from './worldRegions';
import { getScientificInspectionCandidate } from './scienceInteraction';

const MAT = {
  rock: '#55433a',
  dark: '#27292a',
  dust: '#ad7857',
  ice: '#a9c5c7',
  frost: '#d6e0dc',
};

const ROCK = { color: MAT.rock, roughness: 0.96, flatShading: true };
const DARK_ROCK = { color: MAT.dark, roughness: 0.94, flatShading: true };
const DUST = { color: MAT.dust, roughness: 1, flatShading: true };

function IceMantleExposure() {
  return <group name="buried-ice-mantle-exposure">
    <mesh position={[0, 0.11, 0]} rotation={[0.04, 0.2, -0.1]} scale={[0.91, 0.27, 0.62]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.78, 1]} /><meshStandardMaterial color="#6e7776" roughness={0.98} flatShading />
    </mesh>
    <mesh position={[0.02, 0.31, 0.08]} rotation={[0.06, 0.17, -0.13]} scale={[0.7, 0.075, 0.43]}>
      <dodecahedronGeometry args={[0.76, 1]} /><meshStandardMaterial color="#b1c0bd" roughness={0.72} transparent opacity={0.76} />
    </mesh>
    <mesh position={[-0.1, 0.47, 0.1]} rotation={[0.08, 0.2, -0.18]} scale={[0.53, 0.075, 0.34]} castShadow>
      <icosahedronGeometry args={[0.7, 1]} /><meshStandardMaterial color="#8da4a4" roughness={0.68} transparent opacity={0.82} />
    </mesh>
    <mesh position={[0.06, 0.51, 0.21]} rotation={[0.02, 0.2, -0.18]} scale={[0.37, 0.026, 0.035]}>
      <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#536160" roughness={1} />
    </mesh>
  </group>;
}

export function AncientOutgassingTeachingPlume() {
  const plume = useRef<import('three').Group>(null);
  useFrame(({ clock }) => {
    if (!plume.current || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const t = clock.elapsedTime * 0.025;
    plume.current.position.set(Math.sin(t) * 0.16, 0, Math.cos(t * 0.7) * 0.12);
  });
  return <group name="ancient-outgassing-teaching-illustration" ref={plume} position={[0, 0.05, 0]}>
    {[0, 1, 2].map((index) => <mesh key={index} position={[0.04 * (index - 1), 0.22 + index * 0.24, 0]} rotation={[Math.PI / 2, 0, index * 0.48]} scale={[0.38 + index * 0.1, 0.38 + index * 0.1, 0.1]}>
      <torusGeometry args={[0.58, 0.09, 5, 16, Math.PI * 1.55]} />
      <meshBasicMaterial color="#9b9287" transparent opacity={0.12} depthWrite={false} side={2} />
    </mesh>)}
    {[-0.2, 0.18, 0.31].map((x, index) => <mesh key={index} position={[x, 0.28 + index * 0.21, -0.12 + index * 0.1]} scale={[0.075, 0.12, 0.07]}>
      <icosahedronGeometry args={[1, 0]} /><meshBasicMaterial color="#a49a8e" transparent opacity={0.1} depthWrite={false} />
    </mesh>)}
  </group>;
}

function NaturalMineralVein() {
  return <group name="mineral-bearing-natural-fracture">
    <mesh position={[0, 0.16, 0]} rotation={[0.1, 0.17, -0.14]} scale={[0.72, 0.3, 0.62]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.72, 1]} /><meshStandardMaterial color="#56473d" roughness={0.98} flatShading />
    </mesh>
    {[-0.21, 0, 0.19].map((offset, index) => <mesh key={index} position={[offset, 0.35, 0.17 - index * 0.12]} rotation={[0.02, 0.2, -0.25 + index * 0.18]} scale={[0.045, 0.035, 0.41 - index * 0.07]}>
      <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={['#aa8766', '#cfb28c', '#8b7262'][index]} roughness={0.93} />
    </mesh>)}
  </group>;
}

function DustDevilPlume() {
  const plume = useRef<import('three').Group>(null);
  useFrame(({ clock }) => {
    if (!plume.current || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const t = clock.elapsedTime * 0.035;
    plume.current.position.set(Math.sin(t) * 0.42, 0, Math.cos(t * 0.7) * 0.28);
    plume.current.rotation.y = t * 0.2;
  });
  return <group name="bounded-dust-devil-atmospheric-plume" ref={plume} position={[0, 0.05, 0]}>
    {[0, 1, 2].map((index) => <mesh key={index} position={[0, 0.65 + index * 0.42, 0]} scale={[0.44 + index * 0.11, 0.045, 0.34 + index * 0.09]} rotation={[-Math.PI / 2, 0, index * 0.73]}>
      <ringGeometry args={[0.52, 0.86, 20, 1, 0.1 + index * 0.11, Math.PI * 1.38]} />
      <meshBasicMaterial color="#a18a74" transparent opacity={0.13} depthWrite={false} side={2} />
    </mesh>)}
  </group>;
}

function Feature({ element }: { element: ScientificElement }) {
  switch (element.kind) {
    case 'impact-rock': return <group name="impact-shocked-outcrop">
      <mesh position={[-0.42, 0.28, 0.02]} rotation={[0.12, 0.25, -0.12]} scale={[0.66, 0.48, 0.52]} castShadow receiveShadow><dodecahedronGeometry args={[0.7, 0]} /><meshStandardMaterial {...ROCK} /></mesh>
      <mesh position={[0.34, 0.2, 0.16]} rotation={[0.28, -0.2, 0.08]} scale={[0.48, 0.34, 0.42]} castShadow receiveShadow><icosahedronGeometry args={[0.62, 0]} /><meshStandardMaterial color="#8a6953" roughness={0.96} flatShading /></mesh>
      <mesh position={[0.05, 0.12, -0.42]} scale={[0.3, 0.2, 0.24]} castShadow><dodecahedronGeometry args={[0.6, 0]} /><meshStandardMaterial {...DARK_ROCK} /></mesh>
      <mesh position={[-0.38, 0.61, 0.02]} rotation={[0.3, 0.2, 0.15]} scale={[0.25, 0.11, 0.16]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#c09a75" roughness={1} /></mesh>
    </group>;
    case 'crater': return <group name="impact-ejecta-outcrop-cluster">
      {[-1, 0, 1].map((side) => <React.Fragment key={side}>
        <mesh position={[side * 0.48, 0.11, -0.28]} rotation={[0.08, side * 0.13, -0.08 * side]} scale={[0.4, 0.12, 0.82]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.73, 1]} /><meshStandardMaterial color={side === 0 ? '#a17a5d' : '#645043'} roughness={0.98} flatShading />
        </mesh>
        <mesh position={[side * 0.39, 0.07, 0.38]} rotation={[0.06, -side * 0.08, 0.07 * side]} scale={[0.31, 0.085, 0.62]}>
          <icosahedronGeometry args={[0.67, 1]} /><meshStandardMaterial color="#886b53" roughness={0.99} />
        </mesh>
      </React.Fragment>)}
      <mesh position={[-0.12, 0.22, 0.02]} rotation={[0.12, 0.16, -0.14]} scale={[0.38, 0.28, 0.32]} castShadow>
        <dodecahedronGeometry args={[0.75, 0]} /><meshStandardMaterial {...DARK_ROCK} />
      </mesh>
    </group>;
    case 'ejecta': return <group name="ejecta-lobes">
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.85, 1]}><circleGeometry args={[0.82, 20]} /><meshStandardMaterial color="#574437" roughness={1} /></mesh>
      {[-1, 0, 1].map((side) => <React.Fragment key={side}>
        <mesh position={[side * 0.5, 0.14, -0.62]} rotation={[0.12, side * 0.12, side * -0.16]} scale={[0.34, 0.16, 0.72]} castShadow><dodecahedronGeometry args={[0.65, 0]} /><meshStandardMaterial color={side === 0 ? '#9b7358' : MAT.rock} roughness={0.98} flatShading /></mesh>
        <mesh position={[side * 0.43, 0.08, 0.56]} rotation={[0, side * 0.1, side * 0.22]} scale={[0.25, 0.12, 0.48]}><icosahedronGeometry args={[0.65, 0]} /><meshStandardMaterial {...DUST} /></mesh>
      </React.Fragment>)}
    </group>;
    case 'dust-devil': return <DustDevilPlume />;
    case 'dust-deposit': return <group name="dust-deposit-patches">
      {[[0, 0, 0.72, 0.5], [-0.48, 0.025, 0.58, 0.36], [0.52, 0.035, 0.52, 0.31]].map(([x, z, sx, sz], i) => <mesh key={i} position={[x, 0.035 + i * 0.012, z]} rotation={[-Math.PI / 2, 0, (i - 1) * 0.18]} scale={[sx, sz, 1]}><circleGeometry args={[1, 18]} /><meshStandardMaterial color={i === 1 ? '#c6a080' : '#a97858'} roughness={1} /></mesh>)}
      <mesh position={[0.08, 0.07, -0.43]} rotation={[-Math.PI / 2, 0, -0.16]} scale={[0.53, 0.18, 1]}><circleGeometry args={[1, 16]} /><meshStandardMaterial color="#514139" roughness={1} /></mesh>
    </group>;
    case 'wind-streak': return <group name="wind-streak-ridges">
      <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.33, 1.0, 1]}><circleGeometry args={[1, 18]} /><meshStandardMaterial color="#453a34" roughness={1} /></mesh>
      {[-0.38, 0, 0.38].map((x, i) => <mesh key={i} position={[x, 0.09, 0.08]} rotation={[0, 0, (i - 1) * -0.06]} scale={[0.12, 0.06, 0.92]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={i === 1 ? '#c19a79' : '#95745d'} roughness={1} /></mesh>)}
    </group>;
    case 'basalt': return <group name="stacked-basalt-lavas">
      <mesh position={[0, 0.28, 0]} rotation={[0.05, 0.22, -0.04]} scale={[0.92, 0.44, 0.72]} castShadow><dodecahedronGeometry args={[0.72, 0]} /><meshStandardMaterial color="#292c2d" roughness={0.96} flatShading /></mesh>
      <mesh position={[-0.05, 0.56, 0.02]} rotation={[0.08, -0.1, 0.05]} scale={[0.78, 0.18, 0.61]} castShadow><dodecahedronGeometry args={[0.7, 0]} /><meshStandardMaterial color="#444442" roughness={0.94} flatShading /></mesh>
      <mesh position={[0.1, 0.75, -0.02]} rotation={[0.08, 0.16, 0.02]} scale={[0.55, 0.11, 0.43]} castShadow><dodecahedronGeometry args={[0.62, 0]} /><meshStandardMaterial color="#363738" roughness={0.94} flatShading /></mesh>
    </group>;
    case 'strata': return <group name="exposed-natural-cross-bedding">
      <mesh position={[0, 0.37, 0]} rotation={[0.08, -0.13, -0.1]} scale={[0.88, 0.52, 0.72]} castShadow receiveShadow><dodecahedronGeometry args={[0.72, 1]} /><meshStandardMaterial color="#504137" roughness={0.98} flatShading /></mesh>
      {[-0.18, -0.04, 0.1, 0.23].map((y, i) => <mesh key={i} position={[0.02, 0.36 + y, 0.22]} rotation={[0.05, 0.12, -0.11 + i * 0.035]} scale={[0.64 - i * 0.075, 0.035, 0.3 - i * 0.025]}><dodecahedronGeometry args={[0.82, 1]} /><meshStandardMaterial color={['#9b7458', '#655043', '#b58c6c', '#74604e'][i]} roughness={0.98} /></mesh>)}
    </group>;
    case 'lava-channel': return <group name="lava-channel-and-levees">
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0.1]} scale={[0.37, 1.05, 1]}><circleGeometry args={[1, 18]} /><meshStandardMaterial color="#1e2122" roughness={0.95} /></mesh>
      {[-0.43, 0.43].map((x, i) => <mesh key={i} position={[x, 0.15, 0]} rotation={[0, 0, i ? -0.1 : 0.1]} scale={[0.19, 0.2, 0.96]} castShadow><dodecahedronGeometry args={[0.78, 0]} /><meshStandardMaterial color={i ? '#51443c' : '#393a39'} roughness={0.95} flatShading /></mesh>)}
      {[-0.55, 0.48].map((z, i) => <mesh key={i} position={[i ? 0.18 : -0.15, 0.08, z]} scale={[0.24, 0.14, 0.23]}><dodecahedronGeometry args={[0.7, 0]} /><meshStandardMaterial {...DARK_ROCK} /></mesh>)}
    </group>;
    case 'ice': return <group name="pale-ice-exposure">
      <mesh position={[0, 0.18, 0]} scale={[0.72, 0.2, 0.58]}><dodecahedronGeometry args={[0.75, 0]} /><meshStandardMaterial color="#768487" roughness={0.92} flatShading /></mesh>
      <mesh position={[-0.13, 0.48, 0.02]} rotation={[0.12, 0.2, -0.16]} scale={[0.42, 0.54, 0.34]} castShadow><octahedronGeometry args={[0.82, 0]} /><meshStandardMaterial color={MAT.ice} roughness={0.28} metalness={0.06} transparent opacity={0.88} flatShading /></mesh>
      <mesh position={[0.4, 0.24, 0.15]} rotation={[0.2, 0.5, 0.1]} scale={[0.3, 0.3, 0.27]}><octahedronGeometry args={[0.7, 0]} /><meshStandardMaterial color="#c4d6d3" roughness={0.32} transparent opacity={0.84} flatShading /></mesh>
    </group>;
    case 'ice-layer': return <IceMantleExposure />;
    case 'frost': return <group name="seasonal-frost-patches">
      {[[0, 0, 0.66, 0.45], [-0.38, 0.32, 0.43, 0.31], [0.42, -0.3, 0.4, 0.28], [-0.26, -0.42, 0.31, 0.23]].map(([x, z, sx, sz], i) => <mesh key={i} position={[x, 0.055 + i * 0.012, z]} rotation={[-Math.PI / 2, 0, i * 0.2]} scale={[sx, sz, 1]}><circleGeometry args={[1, 16]} /><meshStandardMaterial color={i % 2 ? '#cad8d4' : MAT.frost} transparent opacity={0.72} roughness={0.45} /></mesh>)}
      <mesh position={[0.08, 0.11, 0.05]} rotation={[0.1, 0.2, 0.08]} scale={[0.31, 0.16, 0.24]}><dodecahedronGeometry args={[0.72, 0]} /><meshStandardMaterial {...ROCK} /></mesh>
    </group>;
    case 'delta': return <group name="branching-dry-delta">
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.95, 0.76, 1]}><circleGeometry args={[1, 18]} /><meshStandardMaterial color="#9c7155" roughness={1} /></mesh>
      <mesh position={[0, 0.12, -0.12]} rotation={[0, 0, 0.08]} scale={[0.22, 0.12, 0.8]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#54453b" roughness={1} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 0.35, 0.14, 0.32]} rotation={[0, 0, side * -0.44]} scale={[0.18, 0.1, 0.55]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#59483d" roughness={1} /></mesh>)}
      {[-0.4, 0.38].map((x, i) => <mesh key={i} position={[x, 0.1, -0.56]} rotation={[0, 0, i ? 0.18 : -0.18]} scale={[0.14, 0.08, 0.38]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#b58a69" roughness={1} /></mesh>)}
    </group>;
    case 'sediment': return <group name="eroded-cross-bedded-sediment">
      <mesh position={[0, 0.38, 0]} rotation={[0.08, 0.18, -0.1]} scale={[0.84, 0.5, 0.7]} castShadow><dodecahedronGeometry args={[0.78, 0]} /><meshStandardMaterial color="#5b493e" roughness={1} flatShading /></mesh>
      {[-0.18, -0.02, 0.14, 0.3].map((y, i) => <mesh key={i} position={[0, 0.26 + y, 0.17]} rotation={[0, 0.1, -0.22 + i * 0.08]} scale={[0.66 - i * 0.035, 0.045, 0.32]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={['#b08461', '#765846', '#c49a74', '#8b6a50'][i]} roughness={1} /></mesh>)}
    </group>;
    case 'sample-cache': return <group name="mineral-bearing-fractured-bedrock">
      {[-0.4, -0.12, 0.22, 0.46].map((x, index) => <mesh key={index} position={[x, 0.16 + (index % 2) * 0.06, (index - 1.5) * 0.18]} rotation={[0.08 * index, 0.31 * index, 0.1 - 0.08 * index]} scale={[0.34, 0.22 + (index % 2) * 0.09, 0.27]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.75, 1]} /><meshStandardMaterial color={['#5a4940', '#725847', '#58483e', '#927252'][index]} roughness={0.98} flatShading />
      </mesh>)}
    </group>;
    case 'volcanic-vent': return <AncientOutgassingTeachingPlume />;
    case 'mineral-outcrop': return <NaturalMineralVein />;
  }
}

function ScientificSite({ element }: { element: ScientificElement }) {
  const hintRef = useRef<import('three').Group>(null);
  useFrame(() => {
    const state = useOutpostStore.getState();
    const remote = state.isDrivingRover;
    const actor = remote ? state.roverPos : state.playerPos;
    const modalOpen = state.isBackpackOpen || state.isManualOpen || state.isDatapadOpen || state.isClassroomOpen ||
      state.isBrownoutQuizOpen || state.activeScienceEntryId !== null ||
      (typeof document !== 'undefined' && Boolean(document.querySelector('[role="dialog"]')));
    const candidate = modalOpen ? null : getScientificInspectionCandidate(SCIENTIFIC_ELEMENTS, actor, {
      isRemote: remote,
      remoteRegionId: state.remoteRegionId,
      grounded: remote || state.isPlayerGrounded,
    });
    if (hintRef.current) {
      const selected = candidate?.element.id === element.id ? candidate : null;
      hintRef.current.visible = selected !== null;
      if (selected) hintRef.current.position.set(
        selected.proxy.position.x - element.position.x,
        sampleWorldGround(selected.proxy.position.x, selected.proxy.position.z) - sampleWorldGround(element.position.x, element.position.z) + 0.025,
        selected.proxy.position.z - element.position.z,
      );
    }
  });

  return <group name={`scientific-element-${element.id}`} position={[element.position.x, sampleWorldGround(element.position.x, element.position.z), element.position.z]}>
    <Feature element={element} />
    <group name="inspect-range-hint" ref={hintRef} visible={false} position={[0, 0.025, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.94, 1, 32]} /><meshBasicMaterial color="#d3b47b" transparent opacity={0.13} depthWrite={false} /></mesh>
    </group>
  </group>;
}

/** Fifteen small, source-linked geology/atmosphere teaching features at canonical discovery anchors. */
export const ScientificElements: React.FC = () => <group name="scientific-elements">
  {SCIENTIFIC_ELEMENTS.map((element) => <ScientificSite key={element.id} element={element} />)}
</group>;

export default ScientificElements;

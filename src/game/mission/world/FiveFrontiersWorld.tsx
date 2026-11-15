import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useMissionStore } from '../state/store';
import { RegionId } from '../contract';
import RegionalHabitatOutpost from '@/modules/outpost-3d/RegionalHabitatOutpost';

/**
 * Four Surrounding NASA Research Outposts arranged at R=25m around central base [0,0,0]
 * Inward-facing doors forming the central Mars Plaza
 */
export const SURROUNDING_BASES = [
  {
    id: 'ice' as const,
    name: 'Sealed Ice Cliff',
    position: [0, 0, -28] as [number, number, number],
    rotationY: 0, // Faces South (+Z) towards central hub
    themeColor: '#00D2FF',
    landmarkType: 'drill' as const,
  },
  {
    id: 'lake' as const,
    name: 'Ancient Lake Shore',
    position: [26, 0, 15] as [number, number, number],
    rotationY: -(2 * Math.PI) / 3, // Inward facing
    themeColor: '#2A9D8F',
    landmarkType: 'arch' as const,
  },
  {
    id: 'dust' as const,
    name: 'Wind Basin Outpost',
    position: [-26, 0, 15] as [number, number, number],
    rotationY: (2 * Math.PI) / 3, // Inward facing
    themeColor: '#F59E0B',
    landmarkType: 'tower' as const,
  },
];

const REGIONS = [
  {
    id: 'dust' as RegionId,
    name: 'Wind Basin',
    coords: [-26, 0, 15] as [number, number, number],
    color: '#FFB800',
    landmark: 'Wind Tower',
    focalPoints: [
      { id: 'D1', title: 'Sand Streaks Wake', offset: [6, 0, -6] as [number, number, number] },
      { id: 'D2', title: 'Dusted Solar Mast', offset: [-6, 0, 6] as [number, number, number] },
      { id: 'D3', title: 'Dust Devil Tracks', offset: [6, 0, 6] as [number, number, number] },
    ],
    branches: [
      { id: 'D_opt1', title: 'Dune Crest Post', perkId: 'perk_dust_arrows', offset: [-8, 0, -6] as [number, number, number] },
      { id: 'D_opt2', title: 'Space Weather Lab', perkId: 'perk_dust_preview', offset: [8, 0, -6] as [number, number, number] },
    ]
  },
  {
    id: 'ice' as RegionId,
    name: 'Sealed Ice Cliff',
    coords: [0, 0, -28] as [number, number, number],
    color: '#00D2FF',
    landmark: 'Glacier Core Rig',
    focalPoints: [
      { id: 'I1', title: 'Protective Debris Mantle', offset: [-6, 0, 6] as [number, number, number] },
      { id: 'I2', title: 'SHARAD Radar Reflection', offset: [6, 0, -6] as [number, number, number] },
      { id: 'I3', title: 'Water Ice vs CO2 Frost', offset: [-7, 0, 8] as [number, number, number] },
    ],
    branches: [
      { id: 'I_opt1', title: 'Water Reclamation Station', perkId: 'perk_ice_band', offset: [8, 0, 6] as [number, number, number] },
      { id: 'I_opt2', title: 'Rehydration Nutrition Lab', perkId: 'perk_ice_mnemonic', offset: [-8, 0, -6] as [number, number, number] },
    ]
  },
  {
    id: 'lake' as RegionId,
    name: 'Ancient Lake Shore',
    coords: [26, 0, 15] as [number, number, number],
    color: '#2A9D8F',
    landmark: 'Telemetry Arch',
    focalPoints: [
      { id: 'L1', title: 'Delta Mudstone Cross-Bedding', offset: [-6, 0, -6] as [number, number, number] },
      { id: 'L2', title: 'Robotic Arm Diagnostics', offset: [6, 0, 6] as [number, number, number] },
      { id: 'L3', title: 'Witness Tube Audit', offset: [8, 0, -6] as [number, number, number] },
    ],
    branches: [
      { id: 'L_opt1', title: 'Dry Meander Overlook', perkId: 'perk_lake_filter', offset: [8, 0, 6] as [number, number, number] },
      { id: 'L_opt2', title: 'Sample Caching Protocols', perkId: 'perk_lake_check', offset: [-8, 0, 4] as [number, number, number] },
    ]
  }
];

/**
 * FiveFrontiersWorld - Manages 3D landmarks, outposts, and interactive points
 */
export const FiveFrontiersWorld: React.FC = () => {
  const currentRegion = useMissionStore((s) => s.currentRegion);
  const bases = useMissionStore((s) => s.bases);
  const surveys = useMissionStore((s) => s.surveys);
  const discoverBase = useMissionStore((s) => s.discoverBase);
  const recordObservation = useMissionStore((s) => s.recordObservation);
  const recordBranch = useMissionStore((s) => s.recordBranch);
  const setNotification = useMissionStore((s) => s.setNotification);
  const activeControl = useMissionStore((s) => s.activeControl);
  const leoPose = useMissionStore((s) => s.leoPose);
  const roverPoses = useMissionStore((s) => s.roverPoses);

  // Proximity polling in frame loop
  useFrame(() => {
    const playerPos = activeControl === 'rover'
      ? roverPoses[currentRegion] || [0, 0, 0]
      : leoPose;

    // Check distance to outposts for discovery
    for (const reg of REGIONS) {
      const dx = playerPos[0] - reg.coords[0];
      const dz = playerPos[2] - reg.coords[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 45 && !bases[reg.id]?.isDiscovered) {
        discoverBase(reg.id);
      }
    }
  });

  return (
    <group name="FiveFrontiersWorld">
      {/* Wind Basin Landmark Silhouette (Central base at [0,0,0]) */}
      <group position={[14, 0, -14]}>
        <mesh position={[0, 4, 0]}>
          <cylinderGeometry args={[0.15, 0.4, 8, 6]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.5} />
        </mesh>
        <mesh position={[0, 8.2, 0]}>
          <sphereGeometry args={[0.45, 8, 8]} />
          <meshStandardMaterial color="#FFB800" />
        </mesh>
      </group>

      {/* 4 Surrounding NASA Research Outposts forming the Mars Plaza (R=25m) */}
      {SURROUNDING_BASES.map((b) => (
        <RegionalHabitatOutpost
          key={b.id}
          id={b.id}
          name={b.name}
          position={b.position}
          rotationY={b.rotationY}
          themeColor={b.themeColor}
          landmarkType={b.landmarkType}
        />
      ))}

      {/* Campaign Focal Points & Exploration Beacons */}
      {REGIONS.map((reg) => {
        const survey = surveys[reg.id];

        return (
          <group key={`beacons-${reg.id}`} position={reg.coords}>
            {/* Focal Points Beacons */}
            {reg.focalPoints.map((fp) => {
              const isLogged = survey?.focalPointsDone.includes(fp.id);
              return (
                <group
                  key={fp.id}
                  position={fp.offset}
                  onClick={(e) => {
                    e.stopPropagation();
                    const playerPos = activeControl === 'rover'
                      ? roverPoses[currentRegion] || [0, 0, 0]
                      : leoPose;
                    const beaconX = reg.coords[0] + fp.offset[0];
                    const beaconZ = reg.coords[2] + fp.offset[2];
                    const dist = Math.hypot(playerPos[0] - beaconX, playerPos[2] - beaconZ);
                    if (dist > 28) {
                      setNotification(`Target [${fp.title}] is out of sensor range (${Math.round(dist)}m away). Navigate closer to survey.`);
                      return;
                    }
                    recordObservation(reg.id, fp.id);
                  }}
                >
                  <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.15, 0.25, 1, 8]} />
                    <meshStandardMaterial color="#1C2026" />
                  </mesh>
                  <mesh position={[0, 1.2, 0]}>
                    <octahedronGeometry args={[0.35]} />
                    <meshBasicMaterial color={isLogged ? '#48BB78' : reg.color} />
                  </mesh>
                  <pointLight position={[0, 1.5, 0]} color={reg.color} intensity={0.4} distance={6} />
                </group>
              );
            })}

            {/* Optional Branches Beacons */}
            {reg.branches.map((br) => {
              const isDone = survey?.optionalBranchesDone.includes(br.id);
              return (
                <group
                  key={br.id}
                  position={br.offset}
                  onClick={(e) => {
                    e.stopPropagation();
                    const playerPos = activeControl === 'rover'
                      ? roverPoses[currentRegion] || [0, 0, 0]
                      : leoPose;
                    const branchX = reg.coords[0] + br.offset[0];
                    const branchZ = reg.coords[2] + br.offset[2];
                    const dist = Math.hypot(playerPos[0] - branchX, playerPos[2] - branchZ);
                    if (dist > 28) {
                      setNotification(`Branch site [${br.title}] is out of range (${Math.round(dist)}m away). Approach site to map advantage.`);
                      return;
                    }
                    recordBranch(reg.id, br.id, br.perkId);
                  }}
                >
                  <mesh position={[0, 0.4, 0]}>
                    <cylinderGeometry args={[0.1, 0.2, 0.8, 8]} />
                    <meshStandardMaterial color="#1C2026" />
                  </mesh>
                  <mesh position={[0, 1.0, 0]}>
                    <dodecahedronGeometry args={[0.25]} />
                    <meshBasicMaterial color={isDone ? '#38B2AC' : '#ECC94B'} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

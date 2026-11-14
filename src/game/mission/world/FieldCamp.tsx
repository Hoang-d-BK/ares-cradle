import * as THREE from 'three';
import { RealHabitatCraft } from '../../art/realism/RealHabitatCraft';
import { realMaterials as m } from '../../art/realism/materials';
import type { BaseState, RegionId, SurveyState } from '../contract';

/** Conservative authored zero-offset local bounds, including modules, craft, access ramp and console; not an offset-world collider. */
export const FIELDCAMP_LOCAL_ENVELOPE = Object.freeze({ minX: -5.85, maxX: 6.2, minY: 0, maxY: 3.75, minZ: -3.75, maxZ: 8.3 });
/** Accessible approach follows the craft's existing ramp, from apron toward the hatch. */
export const FIELDCAMP_RAMP_WALKUP = Object.freeze({ from: [0, 6.31] as const, to: [0, 4.26] as const, halfWidth: 0.84 });
/** Local fiducial for parent interaction placement; sign faces +Z. */
export const FIELDCAMP_CONSOLE_ANCHOR = Object.freeze({ position: [0, 0, 8] as const, facing: 0 });

const box = (position: [number, number, number], size: [number, number, number], material: THREE.Material, name?: string, key?: number) => (
  <mesh key={key} name={name} position={position} material={material} castShadow receiveShadow><boxGeometry args={size} /></mesh>
);
const cylinder = (position: [number, number, number], radius: number, height: number, material: THREE.Material, rotation: [number, number, number] = [0, 0, 0]) => (
  <mesh position={position} rotation={rotation} material={material} castShadow receiveShadow><cylinderGeometry args={[radius, radius, height, 8]} /></mesh>
);

// A single flat geometry spells a physical OPS sign without a remote font dependency.
function makeOpsGlyphs() {
  const vertices: number[] = [];
  const rect = (x: number, y: number, w: number, h: number) => {
    const z = 0;
    vertices.push(x,y,z, x+w,y,z, x+w,y+h,z, x,y,z, x+w,y+h,z, x,y+h,z);
  };
  const stroke = (x: number, y: number, dx: number, dy: number, t = 0.018) => {
    if (Math.abs(dx) >= Math.abs(dy)) rect(x, y-t/2, dx, t);
    else rect(x-t/2, y, t, dy);
  };
  // O, P, S in compact 2D line strokes, all on one buffer/mesh.
  const ox = -0.21, px = -0.07, sx = 0.07, y0 = -0.065, y1 = 0.065;
  stroke(ox,y0,0,y1-y0); stroke(ox+0.09,y0,0,y1-y0); stroke(ox,y0,0.09,0); stroke(ox,y1,0.09,0);
  stroke(px,y0,0,y1-y0); stroke(px,y1,0.09,0); stroke(px,y0+0.06,0.09,0); stroke(px+0.09,y0+0.06,0,y1-y0-0.06);
  stroke(sx,y1,0.09,0); stroke(sx,y0+0.06,0.09,0); stroke(sx,y0,0.09,0); stroke(sx,y0+0.06,0,y1-y0-0.06); stroke(sx+0.09,y0+0.06,0,y1-y0-0.06);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}
const opsGlyphs = makeOpsGlyphs();

function OpsConsole() {
  return <group name="labelled-OPS-console" position={FIELDCAMP_CONSOLE_ANCHOR.position}>
    {box([0, 0.56, 0], [0.86, 1.12, 0.32], m.dark, 'console-pedestal')}
    {box([0, 1.2, 0.18], [0.96, 0.42, 0.08], m.frame, 'console-sign')}
    <mesh name="visible-OPS-lettering" geometry={opsGlyphs} position={[-0.09, 1.2, 0.225]} material={m.amber} />
    {box([0, 0.83, 0.19], [0.62, 0.18, 0.035], m.glass, 'console-display')}
    {[-0.2, 0, 0.2].map((x) => <mesh key={x} position={[x, 0.52, 0.19]} material={m.amber}><sphereGeometry args={[0.035, 6, 4]} /></mesh>)}
  </group>;
}

function OperationModule({ region, operation }: { region: RegionId; operation: string | null }) {
  switch (region) {
    case 'impact':
      return <group name="impact-sample-store" position={[4.8, 0, -1.7]}>
        {box([0, 0.72, 0], [1.14, 1.44, 0.54], m.frame)}
        {[-0.38, 0, 0.38].map((x) => operation === 'impact-protected'
          ? <group key={x}>{box([x, 0.76, 0.3], [0.27, 1.18, 0.13], m.shellShade)}{box([x, 0.76, 0.38], [0.19, 1.06, 0.04], m.dark)}</group>
          : <group key={x}>{box([x, 0.48, 0.3], [0.25, 0.08, 0.18], m.shellShade)}{cylinder([x, 0.72, 0.31], 0.07, 0.34, m.foil, [Math.PI/2,0,0])}</group>)}
        {[0.25, 0.95, 1.4].map((y) => box([0, y, 0.02], [1.05, 0.045, 0.52], m.shellShade, undefined, y))}
      </group>;
    case 'dust':
      return <group name="dust-solar-and-water-operations" position={[4.8, 0, 0.15]} rotation={[0, -0.25, 0]}>
        <group name="solar-array" position={[0, 1.08, 0]} rotation={[0.18, 0, -0.3]}>
          {[-0.56, 0.56].map((x) => <group key={x} position={[x, 0, 0]}>
            {box([0, 0, 0], [0.94, 0.055, 0.62], m.frame)}
            {box([0, 0.035, 0], [0.83, 0.018, 0.49], m.glass, 'solar-cell-panel')}
            {[-0.23, 0, 0.23].map((z) => box([0, 0.049, z], [0.82, 0.008, 0.012], m.seam, undefined, z))}
          </group>)}
          {[-0.7, 0.7].map((x) => <mesh key={x} position={[x, -0.47, 0]} material={m.frame}><cylinderGeometry args={[0.025, 0.035, 0.92, 6]} /></mesh>)}
        </group>
        {operation === 'dust-water-treatment' && <group name="recovered-water-treatment" position={[0, 0, 0.78]}>
          {[-0.22, 0.22].map((x) => <group key={x}>{cylinder([x,0.55,0],0.13,0.9,m.shellShade)}{cylinder([x,0.55,0.15],0.07,0.06,m.frame)}</group>)}
          {box([0, 0.14, 0], [0.74, 0.18, 0.42], m.dark)}
        </group>}
        {operation === 'dust-clean-panels' && <group name="panel-cleaning-tool" position={[0,0,0.78]}>
          {box([0,0.35,0],[0.52,0.12,0.28],m.shellShade)}
          {cylinder([0,0.58,0],0.025,0.42,m.frame)}
          {box([0,0.8,0],[0.34,0.12,0.11],m.foil)}
        </group>}
      </group>;
    case 'volcano':
      return <group name="thermal-work-bay" position={[4.8, 0, 1.42]}>
        {[-0.44, 0.44].map((x) => <group key={x}>{box([x, 0.86, 0], [0.18, 1.72, 0.52], m.foil, 'thermal-insulation-panel')}{box([x, 0.86, 0.28], [0.08, 1.76, 0.035], m.frame)}</group>)}
        {operation === 'volcano-active'
          ? <group name="supplemental-heater">{box([0,0.48,0.08],[0.58,0.72,0.4],m.dark)}{cylinder([0,0.92,0.31],0.18,0.08,m.amber,[Math.PI/2,0,0])}{cylinder([0,0.92,0.36],0.12,0.05,m.seam,[Math.PI/2,0,0])}</group>
          : <group name="passive-insulation-bay">{box([0,0.22,0.05],[0.82,0.18,0.62],m.shellShade)}{box([0,0.37,0.05],[0.68,0.035,0.48],m.foil)}</group>}
      </group>;
    case 'ice':
      return <group name="ice-core-and-water-station" position={[4.8, 0, -0.35]}>
        {box([0,0.72,0],[0.9,1.44,0.42],m.frame)}
        {operation === 'ice-water-treatment'
          ? <group name="ice-recovered-water-treatment">{[-0.22,0.22].map((x) => <group key={x}>{cylinder([x,0.72,0.27],0.14,0.85,m.glass)}{cylinder([x,1.18,0.27],0.08,0.08,m.frame)}</group>)}{box([0,0.2,0.05],[0.72,0.16,0.3],m.dark)}</group>
          : <group name="labelled-core-rack">{[-0.25,0,0.25].map((x) => <group key={x}>{cylinder([x,0.78,0.28],0.075,0.98,m.foil)}{box([x,1.32,0.28],[0.16,0.08,0.04],m.shell)}</group>)}</group>}
        {[0.25,0.46,1.38].map((y) => box([0,y,0.02],[0.82,0.04,0.36],m.shellShade,undefined,y))}
      </group>;
    case 'lake':
      return <group name="lake-transmission-and-inspection-bay" position={[-4.8, 0, 1.15]}>
        {box([0,0.72,0],[0.94,1.44,0.48],m.shellShade)}
        {operation === 'lake-full-transmit'
          ? <group name="full-science-transmitter">{box([0,0.78,0.27],[0.68,0.9,0.08],m.dark)}{[-0.2,0,0.2].map((x) => box([x,0.78,0.32],[0.035,0.72,0.025],m.amber,undefined,x))}{cylinder([0,1.42,0.1],0.3,0.12,m.frame)}</group>
          : <group name="short-transmission-rover-check">{box([0,0.86,0.27],[0.64,0.42,0.08],m.glass)}{[-0.2,0,0.2].map((x) => box([x,0.43,0.3],[0.12,0.18,0.04],m.foil,undefined,x))}</group>}
        {box([0,0.12,0],[1.08,0.18,0.58],m.frame)}
      </group>;
  }
}

export interface FieldCampProps {
  region: RegionId;
  position: [number, number, number];
  heading?: number;
  habitatOffset?: [number, number, number];
  base: BaseState;
  survey: SurveyState;
}

/** Modular field station around the copied craft; inputs are read-only render data. */
export function FieldCamp({ region, position, heading = 0, habitatOffset = [0, 0, 0], base, survey }: FieldCampProps) {
  const selectedOperation = survey.operation ?? base.operation;
  const yaw = Number.isFinite(heading) ? heading : 0;
  const safePosition: [number, number, number] = position.map((n) => Number.isFinite(n) ? n : 0) as [number, number, number];
  const safeHabitatOffset: [number, number, number] = habitatOffset.map((n) => Number.isFinite(n) ? n : 0) as [number, number, number];
  return <group name="FieldCamp" position={safePosition} rotation={[0, yaw, 0]}>
    <group name="habitat-and-operation-offset" position={safeHabitatOffset}>
      <RealHabitatCraft position={[0,0,0]} heading={0} lit={false} />
      <OperationModule region={region} operation={selectedOperation} />
    </group>
    <OpsConsole />
  </group>;
}

export default FieldCamp;

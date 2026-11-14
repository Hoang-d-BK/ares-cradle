import { MeshStandardMaterial } from 'three';

/** V2 authored materials only. Shared immutable instances; no v1 palette mutation. */
export const realMaterials = {
  shell: new MeshStandardMaterial({
    name: 'Real craft / pale matte shell', color: '#deded5', roughness: 0.8, metalness: 0.06, flatShading: true,
  }),
  shellShade: new MeshStandardMaterial({
    name: 'Real craft / recessed panel', color: '#afb6b3', roughness: 0.76, metalness: 0.14, flatShading: true,
  }),
  frame: new MeshStandardMaterial({
    name: 'Real craft / satin structure', color: '#7f8b90', roughness: 0.54, metalness: 0.58, flatShading: true,
  }),
  dark: new MeshStandardMaterial({
    name: 'Real craft / graphite equipment', color: '#30383d', roughness: 0.72, metalness: 0.25, flatShading: true,
  }),
  wheelMetal: new MeshStandardMaterial({
    name: 'Real craft / machined dark wheel metal', color: '#515b60', roughness: 0.61, metalness: 0.76, flatShading: true,
  }),
  foil: new MeshStandardMaterial({
    name: 'Real craft / muted thermal foil', color: '#b3a074', roughness: 0.48, metalness: 0.62, flatShading: true,
  }),
  optics: new MeshStandardMaterial({
    name: 'Real craft / recessed optics', color: '#172c35', roughness: 0.16, metalness: 0.3,
  }),
  amber: new MeshStandardMaterial({
    name: 'Real craft / small warm practical', color: '#d7b679', roughness: 0.48, metalness: 0.12,
    emissive: '#b07235', emissiveIntensity: 0.25,
  }),
  glass: new MeshStandardMaterial({
    name: 'Real craft / dark observation pane', color: '#314b55', roughness: 0.26, metalness: 0.22,
  }),
  seam: new MeshStandardMaterial({
    name: 'Real craft / matte seams and seals', color: '#6e797b', roughness: 0.88, metalness: 0.08, flatShading: true,
  }),
} as const;

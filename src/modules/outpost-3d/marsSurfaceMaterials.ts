import * as THREE from 'three';

/** Original deterministic, offline surface texture family. No remote assets or runtime fetches. */
const SIZE = 256;
const TAU = Math.PI * 2;
const fract = (value: number) => value - Math.floor(value);

function periodicField(x: number, y: number, ax: number, ay: number, phase: number): number {
  return Math.sin(TAU * (ax * x + ay * y) + phase);
}

function hashLattice(x: number, y: number, periodX: number, periodY: number): number {
  const wrappedX = ((x % periodX) + periodX) % periodX;
  const wrappedY = ((y % periodY) + periodY) % periodY;
  return fract(Math.sin(wrappedX * 127.1 + wrappedY * 311.7) * 43758.5453);
}

function periodicNoise(u: number, v: number, cellsX: number, cellsY: number): number {
  const x = u * cellsX, y = v * cellsY;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const sx = x - x0, sy = y - y0;
  const fx = sx * sx * (3 - 2 * sx), fy = sy * sy * (3 - 2 * sy);
  const a = hashLattice(x0, y0, cellsX, cellsY);
  const b = hashLattice(x0 + 1, y0, cellsX, cellsY);
  const c = hashLattice(x0, y0 + 1, cellsX, cellsY);
  const d = hashLattice(x0 + 1, y0 + 1, cellsX, cellsY);
  const low = a + (b - a) * fx;
  const high = c + (d - c) * fx;
  return low + (high - low) * fy - 0.5;
}

function createTexture(channels: 1 | 3, sample: (u: number, v: number) => readonly number[]): THREE.DataTexture {
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const values = sample(x / SIZE, y / SIZE);
      const offset = (y * SIZE + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const value = channels === 1 ? values[0] : values[channel];
        data[offset + channel] = Math.max(0, Math.min(255, Math.round(value * 255)));
      }
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

const textureCache = new Map<string, THREE.DataTexture>();
function cachedTexture(name: string, make: () => THREE.DataTexture): THREE.DataTexture {
  const cached = textureCache.get(name);
  if (cached) return cached;
  const texture = make();
  textureCache.set(name, texture);
  return texture;
}

/** World-space scale is authored by terrain UVs at 1 UV per 18 metres. */
export const MARS_SURFACE_TEXTURES = Object.freeze({
  albedo: cachedTexture('regolith-albedo-v3', () => createTexture(3, (u, v) => {
    const broad = periodicNoise(u, v, 4, 3) * 0.2 + periodicNoise(u, v, 11, 9) * 0.1;
    const fractureField = periodicNoise(u, v, 13, 11) + periodicField(u, v, 5, 3, 0.7) * 0.12;
    const fracture = Math.pow(Math.max(0, fractureField - 0.2), 3) * 0.22;
    const gravel = Math.abs(periodicNoise(u, v, 41, 35)) * 0.11 + periodicNoise(u, v, 109, 91) * 0.07;
    const value = Math.max(0.48, Math.min(1.34, 0.9 + broad + gravel - fracture));
    return [value * 1.04, value, value * 0.96];
  })),
  normal: cachedTexture('regolith-normal-v2', () => createTexture(3, (u, v) => {
    const h = (x: number, y: number) => periodicNoise(x, y, 17, 13) * 0.1
      + periodicNoise(x, y, 51, 39) * 0.035 + Math.abs(periodicNoise(x, y, 113, 97)) * 0.022;
    const center = h(u, v);
    const du = (h(u + 1 / SIZE, v) - center) * 5;
    const dv = (h(u, v + 1 / SIZE) - center) * 5;
    const length = Math.hypot(du, dv, 1);
    return [0.5 - du / length * 0.5, 0.5 - dv / length * 0.5, 0.5 + 1 / length * 0.5];
  })),
  roughness: cachedTexture('regolith-roughness-v2', () => createTexture(1, (u, v) => {
    const variation = periodicNoise(u, v, 7, 5) * 0.18 + periodicNoise(u, v, 37, 29) * 0.13
      + Math.abs(periodicNoise(u, v, 97, 83)) * 0.1;
    const value = Math.max(0.48, Math.min(0.99, 0.83 + variation));
    return [value];
  })),
  bump: cachedTexture('regolith-bump-v2', () => createTexture(1, (u, v) => {
    const broad = periodicNoise(u, v, 5, 4) * 0.22;
    const fractures = Math.pow(Math.max(0, periodicNoise(u, v, 13, 9) - 0.18), 2) * 0.28;
    const ripples = periodicNoise(u, v, 29, 17) * 0.12;
    const grain = periodicNoise(u, v, 83, 71) * 0.08 + Math.abs(periodicNoise(u, v, 149, 127)) * 0.06;
    return [Math.max(0.02, Math.min(0.98, 0.5 + broad + ripples + grain - fractures))];
  })),
  detail: cachedTexture('regolith-detail-v2', () => createTexture(3, (u, v) => {
    const broad = periodicNoise(u, v, 9, 7);
    const grain = periodicNoise(u, v, 57, 43);
    const fine = periodicNoise(u, v, 137, 119);
    return [0.5 + broad * 0.2, 0.5 + grain * 0.28, 0.5 + fine * 0.32];
  })),
});

/** Reuse the same map set on regolith, basalt, ice-bearing debris, and sediment. */
export function createMarsSurfaceMaterial(options: {
  color?: THREE.ColorRepresentation;
  roughness?: number;
  metalness?: number;
  bumpScale?: number;
  vertexColors?: boolean;
} = {}): THREE.MeshStandardMaterial {
  const { color = '#ffffff', roughness = 0.94, metalness = 0.02, bumpScale = 0.22, vertexColors = false } = options;
  const material = new THREE.MeshStandardMaterial({
    color,
    vertexColors,
    map: MARS_SURFACE_TEXTURES.albedo,
    roughnessMap: MARS_SURFACE_TEXTURES.roughness,
    roughness,
    metalness,
  });
  material.customProgramCacheKey = () => 'mars-world-triplanar-v2';
  material.onBeforeCompile = (shader) => {
    shader.uniforms.marsHeightMap = { value: MARS_SURFACE_TEXTURES.bump };
    shader.uniforms.marsNormalMap = { value: MARS_SURFACE_TEXTURES.normal };
    shader.uniforms.marsDetailMap = { value: MARS_SURFACE_TEXTURES.detail };
    shader.uniforms.marsBumpScale = { value: bumpScale };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMarsWorldPosition;\nvarying vec3 vMarsWorldNormal;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
vec4 marsWorldPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
marsWorldPosition = batchingMatrix * marsWorldPosition;
#endif
#ifdef USE_INSTANCING
marsWorldPosition = instanceMatrix * marsWorldPosition;
#endif
marsWorldPosition = modelMatrix * marsWorldPosition;
vMarsWorldPosition = marsWorldPosition.xyz;
vec3 marsWorldNormal = objectNormal;
#ifdef USE_INSTANCING
mat3 marsInstanceNormalMatrix = mat3( instanceMatrix );
marsWorldNormal /= vec3( dot( marsInstanceNormalMatrix[ 0 ], marsInstanceNormalMatrix[ 0 ] ), dot( marsInstanceNormalMatrix[ 1 ], marsInstanceNormalMatrix[ 1 ] ), dot( marsInstanceNormalMatrix[ 2 ], marsInstanceNormalMatrix[ 2 ] ) );
marsWorldNormal = marsInstanceNormalMatrix * marsWorldNormal;
#endif
vMarsWorldNormal = normalize( mat3( modelMatrix ) * marsWorldNormal );`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vMarsWorldPosition;
varying vec3 vMarsWorldNormal;
uniform sampler2D marsHeightMap;
uniform sampler2D marsNormalMap;
uniform sampler2D marsDetailMap;
uniform float marsBumpScale;
vec3 marsTriWeights( vec3 n ) { vec3 w = pow( abs( n ), vec3( 4.0 ) ); return w / max( dot( w, vec3( 1.0 ) ), 0.0001 ); }
vec3 marsTriSample( sampler2D tex, vec3 p, vec3 n ) {
  vec3 w = marsTriWeights( n );
  vec3 s = texture2D( tex, p.zy / 18.0 ).rgb;
  vec3 t = texture2D( tex, p.xz / 18.0 ).rgb;
  vec3 u = texture2D( tex, p.xy / 18.0 ).rgb;
  return s * w.x + t * w.y + u * w.z;
}
float marsTriHeight( vec3 p, vec3 n ) { return marsTriSample( marsHeightMap, p, n ).r; }`)
      .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec3 marsAlbedo = marsTriSample( map, vMarsWorldPosition, normalize( vMarsWorldNormal ) );
  vec3 marsDetail = marsTriSample( marsDetailMap, vMarsWorldPosition, normalize( vMarsWorldNormal ) );
  diffuseColor.rgb *= marsAlbedo * ( 0.96 + marsDetail.r * 0.08 );
#endif`)
      .replace('#include <roughnessmap_fragment>', `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
  vec3 marsRoughness = marsTriSample( roughnessMap, vMarsWorldPosition, normalize( vMarsWorldNormal ) );
  roughnessFactor *= marsRoughness.g;
#endif`)
      .replace('#include <normal_fragment_maps>', `vec3 marsSurfaceNormal = normalize( vMarsWorldNormal ) * faceDirection;
float marsHeight = marsTriHeight( vMarsWorldPosition, marsSurfaceNormal );
vec3 marsViewDx = dFdx( -vViewPosition );
vec3 marsViewDy = dFdy( -vViewPosition );
float marsHeightDx = dFdx( marsHeight );
float marsHeightDy = dFdy( marsHeight );
vec3 marsMapNormal = marsTriSample( marsNormalMap, vMarsWorldPosition, normalize( vMarsWorldNormal ) ) * 2.0 - 1.0;
vec3 marsTangentX = normalize( marsViewDx - normal * dot( marsViewDx, normal ) );
vec3 marsTangentY = normalize( marsViewDy - normal * dot( marsViewDy, normal ) );
float marsSlopeX = marsHeightDx / max( length( marsViewDx ), 0.0001 );
float marsSlopeY = marsHeightDy / max( length( marsViewDy ), 0.0001 );
normal = normalize( normal - marsBumpScale * ( marsSlopeX * marsTangentX + marsSlopeY * marsTangentY ) + marsMapNormal.x * marsTangentX * 0.28 + marsMapNormal.y * marsTangentY * 0.28 );`);
  };
  return material;
}

/** Set planar world-coordinate UVs at the shared 18m repeat scale. */
export function addWorldSurfaceUVs(geometry: THREE.BufferGeometry, positions: Float32Array): void {
  const uvs = new Float32Array((positions.length / 3) * 2);
  for (let index = 0; index < positions.length; index += 3) {
    const uvIndex = (index / 3) * 2;
    uvs[uvIndex] = positions[index] / 18;
    uvs[uvIndex + 1] = positions[index + 2] / 18;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

/** World-scaled planar UVs for the existing flat core disc/ring, without changing vertices. */
export function addPlanarSurfaceUVs(geometry: THREE.BufferGeometry, spacing = 18): void {
  const positions = geometry.getAttribute('position');
  const uvs = new Float32Array(positions.count * 2);
  for (let index = 0; index < positions.count; index += 1) {
    uvs[index * 2] = positions.getX(index) / spacing;
    uvs[index * 2 + 1] = positions.getY(index) / spacing;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

/** Stable seed mixer used for bounded natural scatter, independent of frame order. */
export function naturalSeed(x: number, z: number, salt = 0): number {
  const value = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return fract(value);
}

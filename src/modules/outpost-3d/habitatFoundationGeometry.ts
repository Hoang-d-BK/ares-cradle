import * as THREE from 'three';

type FoundationProfile = {
  bottomY: number;
  topY: number;
  outerBottomRadius: number;
  outerTopRadius: number;
  innerBottomRadius: number;
  innerTopRadius: number;
  radialSegments?: number;
};

type RingOpening = { minX: number; maxX: number; minZ: number; maxZ: number };

type OpeningAngle = { center: number; halfWidth: number };

const TAU = Math.PI * 2;
const wrapAngle = (angle: number) => ((angle % TAU) + TAU) % TAU;
const shortestAngle = (angle: number) => ((angle + Math.PI) % TAU + TAU) % TAU - Math.PI;

function getOpeningAngles(openings: readonly RingOpening[]): OpeningAngle[] {
  return openings.map((opening) => {
    const centerX = (opening.minX + opening.maxX) / 2;
    const centerZ = (opening.minZ + opening.maxZ) / 2;
    const center = Math.atan2(centerX, centerZ);
    const corners = [
      [opening.minX, opening.minZ], [opening.minX, opening.maxZ],
      [opening.maxX, opening.minZ], [opening.maxX, opening.maxZ],
    ];
    const halfWidth = Math.max(...corners.map(([x, z]) => Math.abs(shortestAngle(Math.atan2(x, z) - center))));
    return { center, halfWidth };
  });
}

function getSegmentAngles(segments: number, openings: readonly OpeningAngle[]): number[] {
  const angles = Array.from({ length: segments + 1 }, (_, index) => index * TAU / segments);
  for (const opening of openings) {
    angles.push(wrapAngle(opening.center - opening.halfWidth), wrapAngle(opening.center + opening.halfWidth));
  }
  angles.sort((a, b) => a - b);
  return angles.filter((angle, index) => index === 0 || angle - angles[index - 1] > 1e-8);
}

/** Builds the existing tapered habitat profile as a hollow shell with physics-aligned portals. */
export function createHabitatFoundationGeometry(
  profile: FoundationProfile,
  openings: readonly RingOpening[],
): THREE.BufferGeometry {
  const segments = Math.max(8, Math.floor(profile.radialSegments ?? 32));
  const openingAngles = getOpeningAngles(openings);
  const angles = getSegmentAngles(segments, openingAngles);
  const positions: number[] = [];

  const point = (radius: number, y: number, angle: number): THREE.Vector3 =>
    new THREE.Vector3(radius * Math.sin(angle), y, radius * Math.cos(angle));
  const triangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, normal: THREE.Vector3) => {
    const winding = b.clone().sub(a).cross(c.clone().sub(a)).dot(normal) < 0 ? [a, c, b] : [a, b, c];
    for (const vertex of winding) positions.push(vertex.x, vertex.y, vertex.z);
  };
  const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, normal: THREE.Vector3) => {
    triangle(a, b, c, normal);
    triangle(a, c, d, normal);
  };
  const isOpening = (angle: number) => openingAngles.some((opening) =>
    Math.abs(shortestAngle(angle - opening.center)) < opening.halfWidth - 1e-8,
  );

  for (let index = 0; index < angles.length - 1; index += 1) {
    const start = angles[index];
    const end = angles[index + 1];
    const middle = (start + end) / 2;
    if (isOpening(middle)) continue;

    const outerBottomStart = point(profile.outerBottomRadius, profile.bottomY, start);
    const outerBottomEnd = point(profile.outerBottomRadius, profile.bottomY, end);
    const outerTopStart = point(profile.outerTopRadius, profile.topY, start);
    const outerTopEnd = point(profile.outerTopRadius, profile.topY, end);
    const innerBottomStart = point(profile.innerBottomRadius, profile.bottomY, start);
    const innerBottomEnd = point(profile.innerBottomRadius, profile.bottomY, end);
    const innerTopStart = point(profile.innerTopRadius, profile.topY, start);
    const innerTopEnd = point(profile.innerTopRadius, profile.topY, end);
    const radial = new THREE.Vector3(Math.sin(middle), 0, Math.cos(middle));

    quad(outerBottomStart, outerBottomEnd, outerTopEnd, outerTopStart, radial);
    quad(innerBottomStart, innerTopStart, innerTopEnd, innerBottomEnd, radial.clone().negate());
    quad(innerTopStart, outerTopStart, outerTopEnd, innerTopEnd, new THREE.Vector3(0, 1, 0));
    quad(innerBottomStart, innerBottomEnd, outerBottomEnd, outerBottomStart, new THREE.Vector3(0, -1, 0));
  }

  for (const opening of openingAngles) {
    if (opening.halfWidth >= Math.PI / 2) continue;
    for (const angle of [wrapAngle(opening.center - opening.halfWidth), wrapAngle(opening.center + opening.halfWidth)]) {
      if (!openingAngles.some((other) => other !== opening &&
        Math.abs(shortestAngle(angle - other.center)) < other.halfWidth - 1e-8)) {
        const startSide = Math.abs(shortestAngle(angle - (opening.center - opening.halfWidth))) < 1e-7;
        const tangent = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
        const expectedNormal = startSide ? tangent.negate() : tangent;
        quad(
          point(profile.outerBottomRadius, profile.bottomY, angle),
          point(profile.innerBottomRadius, profile.bottomY, angle),
          point(profile.innerTopRadius, profile.topY, angle),
          point(profile.outerTopRadius, profile.topY, angle),
          expectedNormal,
        );
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

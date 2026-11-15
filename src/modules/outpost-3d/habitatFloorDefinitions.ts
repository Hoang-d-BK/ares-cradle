/** Shared rendered dimensions and world positions for authored habitat walk surfaces. */
export const HABITAT_RAMP = {
  groupPosition: [0, -0.15, 4.8] as const,
  meshPosition: [0, -0.05, 0] as const,
  rotationX: 0.18,
  size: [2.2, 0.16, 2.8] as const,
};

export const HABITAT_STAIR_GROUP_POSITION = [1.4, 0.45, -1] as const;
export const HABITAT_OBSERVATION_DECK_LOCAL_POSITION = [0.6, 1.42, 0.8] as const;
export const HABITAT_STAIR_TREADS = Array.from({ length: 7 }, (_, stepIdx) => {
  const angle = (stepIdx / 7) * Math.PI * 1.3;
  return {
    position: [Math.cos(angle) * 0.45, 0.15 + stepIdx * 0.18, Math.sin(angle) * 0.45] as const,
    rotationY: -angle,
    size: [0.42, 0.04, 0.16] as const,
  };
});

export const HABITAT_OBSERVATION_DECK = {
  position: [2, 1.87, -0.2] as const,
  radius: 1.1,
  thickness: 0.08,
};

export type HabitatFloorSupport = { id: string; label: string; topY: number };

/** Samples the authored walkable tops; these surfaces stay separate from obstacle footprints. */
export function sampleHabitatFloorSupport(x: number, z: number, margin = 0, maxTopY = Infinity): HabitatFloorSupport | null {
  if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(margin) || Number.isNaN(maxTopY)) return null;
  let support: HabitatFloorSupport | null = null;

  const [rampX, rampY, rampZ] = HABITAT_RAMP.groupPosition;
  const rampCenterY = rampY + HABITAT_RAMP.meshPosition[1];
  const rampCenterZ = rampZ + HABITAT_RAMP.meshPosition[2];
  const rampTopY = rampCenterY + HABITAT_RAMP.size[1] / 2 / Math.cos(HABITAT_RAMP.rotationX) -
    (z - rampCenterZ) * Math.tan(HABITAT_RAMP.rotationX);
  const rampLocalZ = -(rampTopY - rampCenterY) * Math.sin(HABITAT_RAMP.rotationX) +
    (z - rampCenterZ) * Math.cos(HABITAT_RAMP.rotationX);
  if (rampTopY <= maxTopY &&
      Math.abs(x - rampX - HABITAT_RAMP.meshPosition[0]) <= HABITAT_RAMP.size[0] / 2 + margin &&
      Math.abs(rampLocalZ) <= HABITAT_RAMP.size[2] / 2 + margin) {
    support = { id: 'habitat-ramp', label: 'Habitat Ramp', topY: rampTopY };
  }

  const [deckX, deckY, deckZ] = HABITAT_OBSERVATION_DECK.position;
  if (deckY + HABITAT_OBSERVATION_DECK.thickness / 2 <= maxTopY &&
      Math.hypot(x - deckX, z - deckZ) <= HABITAT_OBSERVATION_DECK.radius + margin &&
      deckY + HABITAT_OBSERVATION_DECK.thickness / 2 > (support?.topY ?? -Infinity)) {
    support = {
      id: 'habitat-observation-deck',
      label: 'Habitat Observation Deck',
      topY: deckY + HABITAT_OBSERVATION_DECK.thickness / 2,
    };
  }

  for (const tread of HABITAT_STAIR_TREADS) {
    const [groupX, groupY, groupZ] = HABITAT_STAIR_GROUP_POSITION;
    const treadX = groupX + tread.position[0];
    const treadY = groupY + tread.position[1] + tread.size[1] / 2;
    const treadZ = groupZ + tread.position[2];
    const dx = x - treadX;
    const dz = z - treadZ;
    const cos = Math.cos(-tread.rotationY);
    const sin = Math.sin(-tread.rotationY);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    if (treadY <= maxTopY &&
        Math.abs(localX) <= tread.size[0] / 2 + margin &&
        Math.abs(localZ) <= tread.size[2] / 2 + margin &&
        treadY > (support?.topY ?? -Infinity)) {
      support = { id: 'habitat-stair-tread', label: 'Habitat Spiral Stair Tread', topY: treadY };
    }
  }

  return support;
}

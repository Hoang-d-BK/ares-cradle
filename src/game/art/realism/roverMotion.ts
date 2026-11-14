/** Procedural presentation math. No physics, no accumulated clock. */
export const WHEEL_RADIUS = 0.27;
export const CIRCUMFERENCE = 2 * Math.PI * WHEEL_RADIUS;

export function clamp(value: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : 0;
}

export function getWheelRotation(travel: number) {
  // Positive-X roll for positive +Z travel.
  // travel is signed cumulative distance.
  return Number.isFinite(travel) ? (travel % CIRCUMFERENCE) / WHEEL_RADIUS : 0;
}

export function getSuspensionAngles(
  rocker: [number, number], bogie: [number, number], steering = 0,
) {
  // Bounded suspension limits
  return {
    rocker: [clamp(rocker[0], -0.28, 0.28), clamp(rocker[1], -0.28, 0.28)] as [number, number],
    bogie: [clamp(bogie[0], -0.4, 0.4), clamp(bogie[1], -0.4, 0.4)] as [number, number],
    steering: clamp(steering, -0.4, 0.4),
  };
}

export function finiteHeading(value: number) {
  return Number.isFinite(value) ? value % (2 * Math.PI) : 0;
}

export function finitePosition(position: [number, number, number]): [number, number, number] {
  return [clamp(position[0], -1e6, 1e6), clamp(position[1], -1e6, 1e6), clamp(position[2], -1e6, 1e6)];
}

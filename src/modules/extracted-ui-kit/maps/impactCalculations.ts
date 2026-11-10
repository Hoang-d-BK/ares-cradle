/**
 * Physics & Impact Telemetry Calculation Engine
 * Reconstructed from NASA Asteroid Impact model
 * Zero-backend, pure client-side mathematical formulas
 */

export interface AsteroidParams {
  diameter: number; // in meters (or converted from feet)
  speed: number;    // in km/s (or converted from mph)
  angle: number;    // degrees (default 45)
  composition: 'Rocky' | 'Comet' | 'Iron' | 'Metallic' | 'Carbonaceous' | 'Icy';
}

export interface ImpactTelemetry {
  massKg: number;
  energyMegatons: number;
  craterDiameterMeters: number;
  craterDepthMeters: number;
  fireballRadiusKm: number;
  shockwaveRadiusKm: number;
  seismicMagnitude: number;
  thermalRadiusKm: number;
  overpressureRadiusKm: number;
  estimatedCasualties: number;
}

const DENSITY_MAP: Record<string, number> = {
  Rocky: 3000,
  Comet: 1000,
  Iron: 8000,
  Metallic: 7800,
  Carbonaceous: 1500,
  Icy: 900,
};

export function calculateImpactTelemetry(params: AsteroidParams): ImpactTelemetry {
  const { diameter, speed, composition } = params;
  const radius = diameter / 2;
  const velocityMs = speed * 1000;
  const density = DENSITY_MAP[composition] || 3000;
  const MEGATON_JOULES = 4.184e15;

  // Mass (spherical approximation): V = (4/3) * pi * r^3
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  const massKg = density * volume;

  // Kinetic Energy: E = 0.5 * m * v^2
  const energyJoules = 0.5 * massKg * Math.pow(velocityMs, 2);
  const energyMegatons = energyJoules / MEGATON_JOULES;

  // Crater diameter scaling: k * d^0.78 * v^0.44
  const k = 1.8;
  const craterDiameterMeters = k * Math.pow(diameter, 0.78) * Math.pow(velocityMs, 0.44);
  const craterDepthMeters = craterDiameterMeters * 0.3;

  // Secondary blast phenomena
  const fireballRadiusKm = Math.pow(Math.max(energyMegatons, 0.001), 0.4) * 0.5;
  const shockwaveRadiusKm = Math.pow(Math.max(energyMegatons, 0.001), 0.33) * 2.0;
  const seismicMagnitude = Math.max(0, Math.log10(Math.max(energyJoules, 1)) - 4.8);

  const thermalRadiusKm = fireballRadiusKm * 1.5;
  const overpressureRadiusKm = shockwaveRadiusKm * 1.2;

  // Casualty estimation approximation
  const vaporized = Math.floor(Math.PI * Math.pow(fireballRadiusKm * 1000, 2) * 0.1);
  const severeInjuries = Math.floor(Math.PI * Math.pow(shockwaveRadiusKm * 1000, 2) * 0.05);
  const estimatedCasualties = vaporized + severeInjuries;

  return {
    massKg,
    energyMegatons: Number(energyMegatons.toFixed(2)),
    craterDiameterMeters: Math.round(craterDiameterMeters),
    craterDepthMeters: Math.round(craterDepthMeters),
    fireballRadiusKm: Number(fireballRadiusKm.toFixed(2)),
    shockwaveRadiusKm: Number(shockwaveRadiusKm.toFixed(2)),
    seismicMagnitude: Number(seismicMagnitude.toFixed(1)),
    thermalRadiusKm: Number(thermalRadiusKm.toFixed(2)),
    overpressureRadiusKm: Number(overpressureRadiusKm.toFixed(2)),
    estimatedCasualties,
  };
}

/**
 * Ares Cradle - Deterministic Simulation Engine Formulas
 * Implements physics and resource equilibrium for Mars Outpost (Ages 7-12).
 */

import {
  ResourceState,
  PowerAllocationState,
  SolPhase,
  GameEvent
} from './types';

// Constants for Mars Environment & Outpost Systems
export const SIM_CONSTANTS = {
  SOL_DURATION_SECONDS: 60,
  DAY_DURATION_SECONDS: 32, // Sol time 0-32s is daytime, 32-60s is night
  MARS_AMBIENT_DEFAULT_C: -60.0,
  TARGET_TEMPERATURE_C: 20.0,
  TARGET_OXYGEN_PERCENT: 20.9,
  CRITICAL_OXYGEN_THRESHOLD: 16.0,
  WARNING_OXYGEN_THRESHOLD: 19.5,
  FREEZING_TEMP_THRESHOLD: 0.0,
  CRITICAL_TEMP_THRESHOLD: -20.0,
  
  // Thermal equilibrium constants (k_heat * 8kW = k_loss * 80°C = 2.0°C/s)
  K_LOSS: 0.025,
  K_HEAT: 0.25,

  // Oxygen equilibrium constants (k_oxy * 8kW = CrewConsumption 0.15%/s)
  CREW_O2_CONSUMPTION: 0.15,
  K_OXY: 0.01875,

  // Battery time scale factor: connects real seconds to simulated Mars energy drain
  BATTERY_DRAIN_SCALE: 0.25,

  // Clamping boundaries
  MAX_TEMPERATURE_C: 40.0,
  MIN_TEMPERATURE_C: -60.0,
  MAX_OXYGEN_PERCENT: 25.0,
  MIN_OXYGEN_PERCENT: 0.0,
  MIN_BATTERY_KWH: 0.0,
} as const;

/**
 * Calculates sunlight intensity factor (0.0 to 1.0) based on Sol clock (0 - 60s).
 * Daytime is 0 to 32s (sinusoidal bell curve peak at ~16s). Night is 32 to 60s (0.0).
 */
export function calculateSunlightFactor(solTime: number): number {
  if (isNaN(solTime) || solTime < 0) return 0;
  const t = solTime % SIM_CONSTANTS.SOL_DURATION_SECONDS;
  if (t >= SIM_CONSTANTS.DAY_DURATION_SECONDS) {
    return 0;
  }
  return Math.max(0, Math.sin((Math.PI * t) / SIM_CONSTANTS.DAY_DURATION_SECONDS));
}

/**
 * Determines current Sol diurnal phase: Morning, Noon, Sunset, Night.
 */
export function determineSolPhase(solTime: number): SolPhase {
  if (isNaN(solTime) || solTime < 0) return 'Morning';
  const t = solTime % SIM_CONSTANTS.SOL_DURATION_SECONDS;
  if (t < 10) return 'Morning';
  if (t < 22) return 'Noon';
  if (t < 32) return 'Sunset';
  return 'Night';
}

export interface SimulationStepParams {
  currentState: ResourceState;
  allocations: PowerAllocationState;
  solTime: number;
  baseSolarMaxKw: number;
  habBaseLoadKw: number;
  controllablePowerKw: number;
  ambientTemperatureCelsius: number;
  activeEvents: GameEvent[];
  deltaSeconds: number;
}

export interface SimulationStepResult {
  nextState: ResourceState;
  effectiveSolarKw: number;
  effectiveOxygenPowerKw: number;
  effectiveThermalPowerKw: number;
  effectiveBaseLoadKw: number;
  isBrownout: boolean;
  warnings: string[];
}

/**
 * Executes a deterministic single-step physics simulation calculation.
 * Guarantees zero division safety and strict boundary clamping.
 */
export function calculateSimulationStep(params: SimulationStepParams): SimulationStepResult {
  const {
    currentState,
    allocations,
    baseSolarMaxKw,
    habBaseLoadKw,
    controllablePowerKw,
    ambientTemperatureCelsius,
    activeEvents,
    deltaSeconds
  } = params;

  // Safe delta time guard
  const dt = Math.max(0, isNaN(deltaSeconds) ? 0 : deltaSeconds);
  const warnings: string[] = [];

  // 1. Process active environmental event effects
  let weatherSolarMultiplier = 1.0;
  let activeLeakRate = 0.0;
  let eventDustIncrease = 0.0;
  let effectiveAmbientTemp = ambientTemperatureCelsius || SIM_CONSTANTS.MARS_AMBIENT_DEFAULT_C;

  for (const event of activeEvents) {
    if (event.active && !event.resolved) {
      if (event.effects.solarEfficiencyMultiplier !== undefined) {
        weatherSolarMultiplier *= Math.max(0, event.effects.solarEfficiencyMultiplier);
      }
      if (event.effects.leakRateMultiplier !== undefined) {
        activeLeakRate += Math.max(0, event.effects.leakRateMultiplier);
      }
      if (event.effects.dustAccumulationRate !== undefined) {
        eventDustIncrease += Math.max(0, event.effects.dustAccumulationRate) * dt;
      }
      if (event.effects.ambientTempShift !== undefined) {
        effectiveAmbientTemp += event.effects.ambientTempShift;
      }
    }
  }

  // 2. Solar Generation Calculation
  const cleanDustCoverage = Math.max(0, Math.min(1.0, currentState.dustCoverage + eventDustIncrease));
  const sunlightFactor = calculateSunlightFactor(params.solTime);
  
  // P_solar = P_solar_max * (1 - Dust) * SunlightFactor * WeatherMultiplier
  const calculatedSolarKw = Math.max(
    0,
    baseSolarMaxKw * (1.0 - cleanDustCoverage) * sunlightFactor * weatherSolarMultiplier
  );

  // 3. Power Consumption & Base Load
  // Emergency power saver reduces base habitability load by 15%
  const effectiveBaseLoadKw = allocations.emergencySaverActive
    ? habBaseLoadKw * 0.85
    : habBaseLoadKw;

  // Determine power allocation split between Oxygen and Heaters
  const totalPriority = Math.max(0, allocations.powerPriorityOxygen) + Math.max(0, allocations.powerPriorityHeaters);
  const oxygenRatio = totalPriority > 0 ? allocations.powerPriorityOxygen / totalPriority : 0.5;
  const heaterRatio = totalPriority > 0 ? allocations.powerPriorityHeaters / totalPriority : 0.5;

  let requestedControllableKw = Math.max(0, controllablePowerKw);
  let effectiveOxygenPowerKw = requestedControllableKw * oxygenRatio;
  let effectiveThermalPowerKw = requestedControllableKw * heaterRatio;

  // 4. Net Power & Battery Storage (Instantaneous Balance)
  const totalPowerRequested = effectiveBaseLoadKw + effectiveOxygenPowerKw + effectiveThermalPowerKw;
  let netPowerBalance = calculatedSolarKw - totalPowerRequested;

  // Check Brownout: if battery is depleted (or depletes during this step) and net power is negative
  let isBrownout = false;
  const capacity = Math.max(0.001, currentState.batteryCapacityKwh);
  const prospectiveBattery = currentState.batteryKwh + netPowerBalance * dt * SIM_CONSTANTS.BATTERY_DRAIN_SCALE;

  if (prospectiveBattery <= 0) {
    if (netPowerBalance < 0) {
      isBrownout = true;
      warnings.push('CRITICAL BROWNOUT: Battery depleted! Subsystems throttled to current solar output.');

      // Scale down subsystems to available solar power
      if (calculatedSolarKw <= effectiveBaseLoadKw) {
        effectiveOxygenPowerKw = 0;
        effectiveThermalPowerKw = 0;
        netPowerBalance = calculatedSolarKw - effectiveBaseLoadKw;
      } else {
        const remainingSolar = calculatedSolarKw - effectiveBaseLoadKw;
        effectiveOxygenPowerKw = remainingSolar * oxygenRatio;
        effectiveThermalPowerKw = remainingSolar * heaterRatio;
        netPowerBalance = 0;
      }
    }
  }

  // Battery Update: B_{t+1} = clamp(0, B_cap, prospectiveBattery)
  const nextBatteryKwh = Math.max(
    SIM_CONSTANTS.MIN_BATTERY_KWH,
    Math.min(capacity, prospectiveBattery)
  );
  const nextBatteryPercent = Math.max(0, Math.min(100, (nextBatteryKwh / capacity) * 100));

  // 5. Thermal Update: T_{t+1} = T_t + (k_heat * P_thermal - k_loss * (T_t - T_ambient)) * dt
  const tempDifferential = currentState.temperatureCelsius - effectiveAmbientTemp;
  const heatAdded = SIM_CONSTANTS.K_HEAT * effectiveThermalPowerKw;
  const heatLost = SIM_CONSTANTS.K_LOSS * tempDifferential;
  const deltaTemp = (heatAdded - heatLost) * dt;
  const nextTemperature = Math.max(
    SIM_CONSTANTS.MIN_TEMPERATURE_C,
    Math.min(SIM_CONSTANTS.MAX_TEMPERATURE_C, currentState.temperatureCelsius + deltaTemp)
  );

  // 6. Oxygen Update: O2_{t+1} = O2_t + (k_oxy * P_oxygen - CrewConsumption - LeakRate) * dt
  const oxygenGenerated = SIM_CONSTANTS.K_OXY * effectiveOxygenPowerKw;
  const totalOxygenDrain = SIM_CONSTANTS.CREW_O2_CONSUMPTION + activeLeakRate;
  const deltaOxygen = (oxygenGenerated - totalOxygenDrain) * dt;
  const nextOxygen = Math.max(
    SIM_CONSTANTS.MIN_OXYGEN_PERCENT,
    Math.min(SIM_CONSTANTS.MAX_OXYGEN_PERCENT, currentState.oxygenPercent + deltaOxygen)
  );

  // Health Warning Checks
  if (nextOxygen < SIM_CONSTANTS.WARNING_OXYGEN_THRESHOLD) {
    warnings.push(`OXYGEN WARNING: Levels dropped to ${nextOxygen.toFixed(1)}%!`);
  }
  if (nextTemperature < SIM_CONSTANTS.FREEZING_TEMP_THRESHOLD) {
    warnings.push(`TEMPERATURE WARNING: Freezing habitat at ${nextTemperature.toFixed(1)}°C!`);
  }
  if (nextBatteryPercent <= 15.0 && nextBatteryPercent > 0) {
    warnings.push(`BATTERY WARNING: Critical reserve at ${nextBatteryPercent.toFixed(1)}%!`);
  }

  const nextState: ResourceState = {
    solarKw: calculatedSolarKw,
    batteryKwh: nextBatteryKwh,
    batteryCapacityKwh: capacity,
    batteryPercent: nextBatteryPercent,
    oxygenPercent: nextOxygen,
    temperatureCelsius: nextTemperature,
    dustCoverage: cleanDustCoverage,
    netPowerKw: netPowerBalance
  };

  return {
    nextState,
    effectiveSolarKw: calculatedSolarKw,
    effectiveOxygenPowerKw,
    effectiveThermalPowerKw,
    effectiveBaseLoadKw,
    isBrownout,
    warnings
  };
}

/**
 * Calculates cadet performance score and summary at mission completion.
 */
export function calculateDebriefReport(
  stageId: number,
  stageTitle: string,
  state: ResourceState,
  survivedSols: number,
  success: boolean,
  failureReason?: string
): { score: number; tradeOffSummary: string; educationalTakeaway: string } {
  // Score formula gives credit to battery conservation, oxygen abundance, and thermal stability
  const batteryScore = Math.max(0, state.batteryPercent) * 0.4;
  const o2Score = Math.max(0, (state.oxygenPercent / 20.9) * 100) * 0.35;
  const tempComfortScore = Math.max(0, 100 - Math.abs(state.temperatureCelsius - 20) * 3) * 0.25;
  
  const rawScore = success ? Math.round(batteryScore + o2Score + tempComfortScore) : Math.round((batteryScore + o2Score) * 0.4);
  const score = Math.max(0, Math.min(100, rawScore));

  let tradeOffSummary = '';
  let educationalTakeaway = '';

  if (success) {
    tradeOffSummary = `Stage ${stageId} (${stageTitle}) Complete: You successfully survived ${survivedSols} Sol(s)! Maintained ${state.oxygenPercent.toFixed(1)}% O₂ and ${state.temperatureCelsius.toFixed(1)}°C while preserving ${state.batteryPercent.toFixed(1)}% battery.`;
    educationalTakeaway = 'On Mars, energy cannot be wasted: every Watt allocated to life support requires conscious rationing during nighttime or storms.';
  } else {
    tradeOffSummary = `Stage ${stageId} (${stageTitle}) Compromised: ${failureReason || 'Critical outpost life support failure'}. Final reserves: ${state.batteryPercent.toFixed(1)}% battery, ${state.oxygenPercent.toFixed(1)}% O₂, ${state.temperatureCelsius.toFixed(1)}°C.`;
    educationalTakeaway = 'Engineering requires anticipation: charging batteries before the sun sets and clearing dust panels is essential for colony survival.';
  }

  return {
    score,
    tradeOffSummary,
    educationalTakeaway
  };
}

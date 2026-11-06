/**
 * Ares Cradle - Domain Simulation Engine Types
 * Extraterrestrial Outpost Simulator (Ages 7-12)
 */

export type SolPhase = 'Morning' | 'Noon' | 'Sunset' | 'Night';

export interface ResourceState {
  solarKw: number;              // Instantaneous solar array power output (kW)
  batteryKwh: number;           // Current stored battery energy (kWh)
  batteryCapacityKwh: number;   // Maximum battery capacity (kWh)
  batteryPercent: number;       // 0 to 100%
  oxygenPercent: number;        // Current habitat oxygen level (0 to 25%, nominal ~20.9%)
  temperatureCelsius: number;   // Habitat interior temperature (-60°C to +35°C, nominal ~20°C)
  dustCoverage: number;         // 0.0 to 1.0 (0% to 100% dust accumulation on panels)
  netPowerKw: number;           // Instantaneous net power balance (solar - total consumption)
}

export interface PowerAllocationState {
  powerPriorityOxygen: number;   // 0 to 100% of controllable power
  powerPriorityHeaters: number;  // 0 to 100% of controllable power
  emergencySaverActive: boolean; // Preserves 15% base battery by throttling non-essential systems
}

export type GameEventType = 'dust_storm' | 'hull_leak' | 'solar_flare' | 'extreme_cold';

export interface GameEventEffects {
  dustAccumulationRate?: number;    // Dust increase per second
  leakRateMultiplier?: number;       // Oxygen leak rate per second
  solarEfficiencyMultiplier?: number;// Factor reducing max solar output (e.g. 0.4 = 60% loss)
  ambientTempShift?: number;         // Shift in Mars ambient temperature (°C)
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  hint: string;
  severity: 'info' | 'warning' | 'critical';
  type: GameEventType;
  triggerSolTime: number;            // Sol second (0 to 60) when event begins
  durationSeconds: number;          // How long the event persists
  active: boolean;
  resolved: boolean;
  effects: GameEventEffects;
}

export interface StageConfig {
  id: number;
  title: string;
  sol: number;
  durationSeconds: number;          // Typically 60s per Sol
  description: string;
  targetObjective: string;
  
  // Initial conditions
  initialBatteryKwh: number;
  batteryCapacityKwh: number;
  initialOxygenPercent: number;
  initialTemperatureCelsius: number;
  initialDustCoverage: number;

  // Power baselines
  baseSolarMaxKw: number;
  habBaseLoadKw: number;
  controllablePowerKw: number;
  ambientTemperatureCelsius: number; // Mars exterior ambient (default -60°C)

  events: GameEvent[];
}

export interface DebriefReport {
  stageId: number;
  stageTitle: string;
  success: boolean;
  score: number;
  survivedSols: number;
  finalBatteryPercent: number;
  finalOxygenPercent: number;
  finalTemperatureCelsius: number;
  tradeOffSummary: string;
  educationalTakeaway: string;
  failureReason?: string;
}

export interface SubmissionResponse {
  received: boolean;
  score: number;
  message: string;
}

export interface LeaderboardEntry {
  cadetName: string;
  score: number;
  solAchieved: number;
  timestamp: string;
}

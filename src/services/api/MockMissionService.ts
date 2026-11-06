/**
 * Ares Cradle - Mock Mission Service Adapter (Client-Side Active Demo)
 * Provides comprehensive mission scenarios for Sol 1, Sol 5, and Sol 12.
 */

import {
  IMissionService,
  StageConfig,
  DebriefReport,
  SubmissionResponse,
  LeaderboardEntry
} from './IMissionService';

export const STAGES_FIXTURES: Record<number, StageConfig> = {
  1: {
    id: 1,
    title: 'Sol 1: The Frigid Night',
    sol: 1,
    durationSeconds: 60,
    description: 'Survive the 12-hour Martian night without battery brownout.',
    targetObjective: 'Maintain battery > 0% until sunrise (+20°C target).',
    initialBatteryKwh: 85,
    batteryCapacityKwh: 100,
    initialOxygenPercent: 20.9,
    initialTemperatureCelsius: 20.0,
    initialDustCoverage: 0.10,
    baseSolarMaxKw: 45.0,
    habBaseLoadKw: 4.0,
    controllablePowerKw: 16.0,
    ambientTemperatureCelsius: -60.0,
    events: [
      {
        id: 'evt-sol1-cold',
        title: 'Martian Sunset: Sub-Zero Plunge',
        description: 'Sun has dipped below the crater rim. External temperature drops to -65°C.',
        hint: 'Throttle heaters just enough to stay above freezing while conserving battery for oxygen scrubbers.',
        severity: 'warning',
        type: 'extreme_cold',
        triggerSolTime: 32,
        durationSeconds: 28,
        active: false,
        resolved: false,
        effects: {
          ambientTempShift: -5.0
        }
      }
    ]
  },
  2: {
    id: 2,
    title: 'Sol 5: Red Dust Approaching',
    sol: 5,
    durationSeconds: 60,
    description: 'Maintain base stability during an unexpected Martian dust storm.',
    targetObjective: 'Active solar array wiping & throttle non-critical systems.',
    initialBatteryKwh: 70,
    batteryCapacityKwh: 100,
    initialOxygenPercent: 20.9,
    initialTemperatureCelsius: 19.5,
    initialDustCoverage: 0.20,
    baseSolarMaxKw: 45.0,
    habBaseLoadKw: 4.5,
    controllablePowerKw: 16.0,
    ambientTemperatureCelsius: -55.0,
    events: [
      {
        id: 'evt-sol5-storm',
        title: 'Dust Storm Inbound: 60% Solar Attenuation',
        description: 'Atmospheric opacity spikes. Solar panels are rapidly covered in fine Martian regolith.',
        hint: 'Click the Solar Array to wipe away dust and enable the Emergency Power Saver to preserve battery.',
        severity: 'critical',
        type: 'dust_storm',
        triggerSolTime: 16,
        durationSeconds: 24,
        active: false,
        resolved: false,
        effects: {
          solarEfficiencyMultiplier: 0.40,
          dustAccumulationRate: 0.015
        }
      }
    ]
  },
  3: {
    id: 3,
    title: 'Sol 12: Hull Micro-Fracture',
    sol: 12,
    durationSeconds: 60,
    description: 'Manage an oxygen leak until maintenance drones seal the breach.',
    targetObjective: 'Surge oxygen generator power while balancing thermal comfort.',
    initialBatteryKwh: 60,
    batteryCapacityKwh: 100,
    initialOxygenPercent: 20.5,
    initialTemperatureCelsius: 18.0,
    initialDustCoverage: 0.15,
    baseSolarMaxKw: 45.0,
    habBaseLoadKw: 5.0,
    controllablePowerKw: 18.0,
    ambientTemperatureCelsius: -60.0,
    events: [
      {
        id: 'evt-sol12-leak',
        title: 'Depressurization Alarm: Hull Micro-Fracture',
        description: 'Micro-meteorite impact created a seal leak in Module Bravo! Oxygen escaping at 2x rate.',
        hint: 'Divert priority slider toward Oxygen (70%+) to compensate until repair drones finish sealing.',
        severity: 'critical',
        type: 'hull_leak',
        triggerSolTime: 12,
        durationSeconds: 28,
        active: false,
        resolved: false,
        effects: {
          leakRateMultiplier: 0.22
        }
      }
    ]
  }
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { cadetName: 'Cadet Leo (Olympus Base)', score: 96, solAchieved: 12, timestamp: 'Sol 12 18:40' },
  { cadetName: 'Cadet Maya (Valles Marineris)', score: 92, solAchieved: 12, timestamp: 'Sol 12 16:15' },
  { cadetName: 'Cadet Alex (Gale Crater)', score: 88, solAchieved: 5, timestamp: 'Sol 5 21:00' },
  { cadetName: 'Cadet Sam (Elysium Planitia)', score: 84, solAchieved: 5, timestamp: 'Sol 5 19:30' }
];

export class MockMissionService implements IMissionService {
  async getStageConfig(stageId: number): Promise<StageConfig> {
    const config = STAGES_FIXTURES[stageId];
    if (!config) {
      throw new Error(`Stage ${stageId} configuration not found in Mock fixtures`);
    }
    // Return cloned object to ensure immutable state mutations
    return Promise.resolve(JSON.parse(JSON.stringify(config)));
  }

  async getAllStages(): Promise<StageConfig[]> {
    return Promise.resolve(Object.values(STAGES_FIXTURES).map(cfg => JSON.parse(JSON.stringify(cfg))));
  }

  async submitStageResult(result: DebriefReport): Promise<SubmissionResponse> {
    return Promise.resolve({
      received: true,
      score: result.score,
      message: result.success
        ? `Stage ${result.stageId} debrief verified. Mission grade recorded!`
        : `Stage ${result.stageId} aborted due to critical life support failure.`
    });
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return Promise.resolve([...MOCK_LEADERBOARD]);
  }
}

export const missionService = new MockMissionService();

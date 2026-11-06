/**
 * Ares Cradle - Reactive Outpost Store (Zustand)
 * Drives 3D Canvas, Tactile HUD, and Game Simulation Loop.
 */

import { create } from 'zustand';
import {
  ResourceState,
  PowerAllocationState,
  SolPhase,
  StageConfig,
  GameEvent,
  DebriefReport
} from '@/modules/simulation-engine/types';
import {
  calculateSimulationStep,
  calculateDebriefReport,
  determineSolPhase,
  SIM_CONSTANTS
} from '@/modules/simulation-engine/formulas';
import { missionService } from '@/services/api';
import { STAGES_FIXTURES } from '@/services/api/MockMissionService';
import { soundEngine } from '@/modules/audio/soundEngine';

export interface OutpostStoreState {
  // Sol Clock & Diurnal Cycle
  solTime: number;              // Current second in Sol (0 to 60)
  currentSol: number;           // Sol number (1, 5, 12)
  solPhase: SolPhase;           // 'Morning' | 'Noon' | 'Sunset' | 'Night'
  
  // Primary Telemetry Resources
  battery: number;              // 0 to 100%
  batteryKwh: number;           // kWh
  batteryCapacityKwh: number;   // Max kWh
  oxygen: number;               // 0 to 25% (nominal ~20.9%)
  temperature: number;          // °C (nominal ~20°C)
  solarIntake: number;          // Instantaneous kW generated
  dustCoverage: number;         // 0.0 to 1.0 (0% to 100%)
  netPower: number;             // Instantaneous net kW

  // Player Allocations & Controls
  powerPriorityOxygen: number;  // 0 to 100%
  powerPriorityHeaters: number; // 0 to 100%
  emergencyPowerSaver: boolean; // Preserves 15% base battery drain

  // Mission State & Events
  activeStageId: number;
  stageConfig: StageConfig;
  activeEvents: GameEvent[];
  isSimulating: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  failureReason: string | null;
  debriefReport: DebriefReport | null;
  activeWarnings: string[];
  isMuted: boolean;

  // Actions
  tick: (deltaSeconds?: number) => void;
  tickTelemetry: (delta: number) => void;
  setPowerAllocation: (oxygen: number, heaters: number) => void;
  setPowerPriorities: (oxygen: number, heaters: number) => void;
  toggleEmergencySaver: () => void;
  cleanDust: (amount?: number | unknown) => void;
  setStage: (stageId: number) => Promise<void>;
  resetCurrentStage: () => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  toggleMute: () => void;
}

const defaultStageConfig = STAGES_FIXTURES[1];

export const useOutpostStore = create<OutpostStoreState>((set, get) => ({
  // Initial state derived from Stage 1
  solTime: 0.0,
  currentSol: defaultStageConfig.sol,
  solPhase: 'Morning',
  
  battery: (defaultStageConfig.initialBatteryKwh / defaultStageConfig.batteryCapacityKwh) * 100,
  batteryKwh: defaultStageConfig.initialBatteryKwh,
  batteryCapacityKwh: defaultStageConfig.batteryCapacityKwh,
  oxygen: defaultStageConfig.initialOxygenPercent,
  temperature: defaultStageConfig.initialTemperatureCelsius,
  solarIntake: 0.0,
  dustCoverage: defaultStageConfig.initialDustCoverage,
  netPower: 0.0,

  powerPriorityOxygen: 50,
  powerPriorityHeaters: 50,
  emergencyPowerSaver: false,

  activeStageId: 1,
  stageConfig: defaultStageConfig,
  activeEvents: JSON.parse(JSON.stringify(defaultStageConfig.events)),
  isSimulating: true,
  isGameOver: false,
  isVictory: false,
  failureReason: null,
  debriefReport: null,
  activeWarnings: [],
  isMuted: false,

  toggleMute: () => {
    const isNowMuted = soundEngine.toggleMute();
    set({ isMuted: isNowMuted });
  },

  setPowerAllocation: (oxygen: number, heaters: number) => {
    const clampedO2 = Math.max(0, Math.min(100, oxygen));
    const clampedHeat = Math.max(0, Math.min(100, heaters));
    soundEngine.playClick(850);
    set({
      powerPriorityOxygen: clampedO2,
      powerPriorityHeaters: clampedHeat
    });
  },

  // Backwards compatibility alias
  setPowerPriorities: (oxygen: number, heaters: number) => {
    get().setPowerAllocation(oxygen, heaters);
  },

  toggleEmergencySaver: () => {
    soundEngine.playClick(620);
    set((state) => ({ emergencyPowerSaver: !state.emergencyPowerSaver }));
  },

  cleanDust: (amount?: number | unknown) => {
    const dec = typeof amount === 'number' ? amount : 0.25;
    soundEngine.playClick(1200);
    set((state) => ({
      dustCoverage: Math.max(0, state.dustCoverage - dec)
    }));
  },

  setStage: async (stageId: number) => {
    try {
      const config = await missionService.getStageConfig(stageId);
      soundEngine.playClick(1100);
      set({
        activeStageId: stageId,
        stageConfig: config,
        currentSol: config.sol,
        solTime: 0.0,
        solPhase: 'Morning',
        batteryKwh: config.initialBatteryKwh,
        batteryCapacityKwh: config.batteryCapacityKwh,
        battery: (config.initialBatteryKwh / config.batteryCapacityKwh) * 100,
        oxygen: config.initialOxygenPercent,
        temperature: config.initialTemperatureCelsius,
        dustCoverage: config.initialDustCoverage,
        activeEvents: JSON.parse(JSON.stringify(config.events)),
        isSimulating: true,
        isGameOver: false,
        isVictory: false,
        failureReason: null,
        debriefReport: null,
        activeWarnings: []
      });
      soundEngine.startPowerHum();
    } catch (err) {
      console.error(`Failed to load stage ${stageId}:`, err);
    }
  },

  resetCurrentStage: () => {
    const { activeStageId } = get();
    get().setStage(activeStageId);
  },

  startSimulation: () => {
    soundEngine.startPowerHum();
    set({ isSimulating: true });
  },
  pauseSimulation: () => {
    soundEngine.stopPowerHum();
    set({ isSimulating: false });
  },

  tick: (deltaSeconds = 0.1) => {
    const state = get();
    if (!state.isSimulating || state.isGameOver || state.isVictory) return;

    const dt = Math.max(0, deltaSeconds);
    const nextSolTime = state.solTime + dt;
    const stageDuration = state.stageConfig.durationSeconds || SIM_CONSTANTS.SOL_DURATION_SECONDS;

    // 1. Update and check Game Events status based on solTime
    const updatedEvents = state.activeEvents.map((evt) => {
      const shouldBeActive =
        nextSolTime >= evt.triggerSolTime &&
        nextSolTime < evt.triggerSolTime + evt.durationSeconds;
      const isResolved = nextSolTime >= evt.triggerSolTime + evt.durationSeconds;

      return {
        ...evt,
        active: shouldBeActive,
        resolved: isResolved
      };
    });

    // Sound alert trigger when an event begins
    const hasNewlyActivatedEvent = updatedEvents.some(
      (e) => e.active && !state.activeEvents.find((prev) => prev.id === e.id)?.active
    );
    if (hasNewlyActivatedEvent) {
      soundEngine.playAlarm();
    }

    // 2. Prepare Resource and Allocation objects for simulation step
    const currentResourceState: ResourceState = {
      solarKw: state.solarIntake,
      batteryKwh: state.batteryKwh,
      batteryCapacityKwh: state.batteryCapacityKwh,
      batteryPercent: state.battery,
      oxygenPercent: state.oxygen,
      temperatureCelsius: state.temperature,
      dustCoverage: state.dustCoverage,
      netPowerKw: state.netPower
    };

    const powerAllocations: PowerAllocationState = {
      powerPriorityOxygen: state.powerPriorityOxygen,
      powerPriorityHeaters: state.powerPriorityHeaters,
      emergencySaverActive: state.emergencyPowerSaver
    };

    // 3. Compute simulation step
    const stepResult = calculateSimulationStep({
      currentState: currentResourceState,
      allocations: powerAllocations,
      solTime: nextSolTime,
      baseSolarMaxKw: state.stageConfig.baseSolarMaxKw,
      habBaseLoadKw: state.stageConfig.habBaseLoadKw,
      controllablePowerKw: state.stageConfig.controllablePowerKw,
      ambientTemperatureCelsius: state.stageConfig.ambientTemperatureCelsius,
      activeEvents: updatedEvents,
      deltaSeconds: dt
    });

    const { nextState, warnings } = stepResult;
    const nextPhase = determineSolPhase(nextSolTime);

    // 4. Evaluate Critical Failure conditions
    let isGameOver = false;
    let failureReason: string | null = null;

    if (nextState.oxygenPercent < 15.0) {
      isGameOver = true;
      failureReason = 'Hypoxia alert: Habitat oxygen dropped below lethal threshold (15%)!';
    } else if (nextState.temperatureCelsius < -30.0) {
      isGameOver = true;
      failureReason = 'Freezing emergency: Habitat heaters failed to prevent deep freeze (-30°C)!';
    } else if (nextState.batteryPercent <= 0 && nextPhase === 'Night') {
      // Extended brownout in freezing dark
      if (nextState.temperatureCelsius < 0) {
        isGameOver = true;
        failureReason = 'Total outpost brownout during the frigid Martian night!';
      }
    }

    // 5. Evaluate Stage Victory condition (Survived full Sol duration)
    let isVictory = false;
    let debriefReport: DebriefReport | null = null;

    if (!isGameOver && nextSolTime >= stageDuration) {
      isVictory = true;
      soundEngine.playSuccessChime();
      soundEngine.stopPowerHum();
      const debriefMath = calculateDebriefReport(
        state.activeStageId,
        state.stageConfig.title,
        nextState,
        state.stageConfig.sol,
        true
      );
      debriefReport = {
        stageId: state.activeStageId,
        stageTitle: state.stageConfig.title,
        success: true,
        score: debriefMath.score,
        survivedSols: state.stageConfig.sol,
        finalBatteryPercent: nextState.batteryPercent,
        finalOxygenPercent: nextState.oxygenPercent,
        finalTemperatureCelsius: nextState.temperatureCelsius,
        tradeOffSummary: debriefMath.tradeOffSummary,
        educationalTakeaway: debriefMath.educationalTakeaway
      };
      missionService.submitStageResult(debriefReport);
    } else if (isGameOver) {
      soundEngine.playFailureTone();
      soundEngine.stopPowerHum();
      const debriefMath = calculateDebriefReport(
        state.activeStageId,
        state.stageConfig.title,
        nextState,
        state.stageConfig.sol,
        false,
        failureReason || undefined
      );
      debriefReport = {
        stageId: state.activeStageId,
        stageTitle: state.stageConfig.title,
        success: false,
        score: debriefMath.score,
        survivedSols: state.stageConfig.sol,
        finalBatteryPercent: nextState.batteryPercent,
        finalOxygenPercent: nextState.oxygenPercent,
        finalTemperatureCelsius: nextState.temperatureCelsius,
        tradeOffSummary: debriefMath.tradeOffSummary,
        educationalTakeaway: debriefMath.educationalTakeaway,
        failureReason: failureReason || undefined
      };
      missionService.submitStageResult(debriefReport);
    }

    // Update store state
    set({
      solTime: nextSolTime % stageDuration,
      solPhase: nextPhase,
      battery: nextState.batteryPercent,
      batteryKwh: nextState.batteryKwh,
      batteryCapacityKwh: nextState.batteryCapacityKwh,
      oxygen: nextState.oxygenPercent,
      temperature: nextState.temperatureCelsius,
      solarIntake: nextState.solarKw,
      dustCoverage: nextState.dustCoverage,
      netPower: nextState.netPowerKw,
      activeEvents: updatedEvents,
      activeWarnings: warnings,
      isGameOver,
      isVictory,
      failureReason,
      debriefReport
    });
  },

  // Backwards compatibility alias
  tickTelemetry: (delta: number) => {
    get().tick(delta);
  }
}));

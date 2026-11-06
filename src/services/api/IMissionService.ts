/**
 * Ares Cradle - Modular Service Adapter Interface Contract
 * Enables zero-overhead switching between MockClientMissionService (Demo)
 * and DjangoRestMissionService (Full-stack roadmap).
 */

import {
  StageConfig,
  DebriefReport,
  SubmissionResponse,
  LeaderboardEntry
} from '@/modules/simulation-engine/types';

// Re-export domain types for service consumers
export type {
  StageConfig,
  DebriefReport,
  SubmissionResponse,
  LeaderboardEntry
};

// Legacy alias for compatibility with early components
export type StageDebriefData = DebriefReport;

export interface IMissionService {
  /**
   * Retrieves configuration, baselines, and events for a mission stage.
   */
  getStageConfig(stageId: number): Promise<StageConfig>;

  /**
   * Retrieves all available mission scenarios for the stage selection carousel.
   */
  getAllStages(): Promise<StageConfig[]>;

  /**
   * Submits cadet final debrief data for grading and teacher telemetry.
   */
  submitStageResult(result: DebriefReport): Promise<SubmissionResponse>;

  /**
   * Retrieves top cadet rankings and scores.
   */
  getLeaderboard(): Promise<LeaderboardEntry[]>;
}

/**
 * Ares Cradle - Django REST Framework Service Adapter
 * Connects frontend domain simulation with Django 5.x REST API backend.
 */

import {
  IMissionService,
  StageConfig,
  DebriefReport,
  SubmissionResponse,
  LeaderboardEntry
} from './IMissionService';

export class DjangoMissionService implements IMissionService {
  private baseUrl: string;
  private currentSessionId: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) || 'http://127.0.0.1:8000';
  }

  /**
   * Initializes or retrieves an active cadet session UUID from the Django backend.
   */
  public async ensureSession(cadetName = 'Cadet Leo', currentStage = 1): Promise<string> {
    if (this.currentSessionId) return this.currentSessionId;

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/sessions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadetName, currentStage })
      });
      if (res.ok) {
        const data = await res.json();
        this.currentSessionId = data.id;
        return data.id;
      }
    } catch (err) {
      console.warn('[DjangoMissionService] Session init failed, fallback generated:', err);
    }

    // Fallback client-generated session id
    this.currentSessionId = `session-${Date.now()}`;
    return this.currentSessionId;
  }

  async getStageConfig(stageId: number): Promise<StageConfig> {
    const res = await fetch(`${this.baseUrl}/api/v1/stages/${stageId}/`);
    if (!res.ok) {
      throw new Error(`[DjangoMissionService] Failed to fetch stage ${stageId}: HTTP ${res.status}`);
    }
    return res.json();
  }

  async getAllStages(): Promise<StageConfig[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/stages/`);
    if (!res.ok) {
      throw new Error(`[DjangoMissionService] Failed to fetch stages: HTTP ${res.status}`);
    }
    return res.json();
  }

  async submitStageResult(result: DebriefReport): Promise<SubmissionResponse> {
    const sessionId = await this.ensureSession('Cadet Leo', result.stageId);
    const url = sessionId && !sessionId.startsWith('session-')
      ? `${this.baseUrl}/api/v1/sessions/${sessionId}/complete/`
      : `${this.baseUrl}/api/v1/sessions/complete/`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageId: result.stageId,
        stageTitle: result.stageTitle,
        success: result.success,
        score: result.score,
        survivedSols: result.survivedSols,
        finalBatteryPercent: result.finalBatteryPercent,
        finalOxygenPercent: result.finalOxygenPercent,
        finalTemperatureCelsius: result.finalTemperatureCelsius,
        tradeOffSummary: result.tradeOffSummary,
        educationalTakeaway: result.educationalTakeaway,
        failureReason: result.failureReason || null
      })
    });

    if (!res.ok) {
      throw new Error(`[DjangoMissionService] Failed to submit debrief: HTTP ${res.status}`);
    }
    return res.json();
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/leaderboard/`);
    if (!res.ok) {
      throw new Error(`[DjangoMissionService] Failed to fetch leaderboard: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Optional telemetry turn recording endpoint for teachers.
   */
  async recordTurn(telemetry: Record<string, unknown>): Promise<void> {
    if (!this.currentSessionId) return;
    try {
      await fetch(`${this.baseUrl}/api/v1/sessions/${this.currentSessionId}/turn/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry)
      });
    } catch (_) {}
  }
}

export default DjangoMissionService;

/**
 * Ares Cradle - Autonomous Hybrid Fallback API Client (Pillar 4)
 * Connects frontend with Django REST backend (Room-PIN & Telemetry Leaderboard).
 * Autonomous Fallback: If Django backend is offline, automatically diverts to localStorage
 * with ZERO red console errors, ensuring 100% uptime on static Vercel deployment.
 */

export interface ClassroomRoom {
  pin: string;
  teacherName: string;
  difficultyModifier: number;
  isActive: boolean;
  createdAt: string;
  isFallback?: boolean;
}

export interface StudentSurvivalLogPayload {
  sessionPin: string;
  cadetName: string;
  solsSurvived: number;
  powerSavedKwh: number;
  crystalsHarvested: number;
  brownoutCount: number;
  score: number;
}

export interface RoomLeaderboardEntry {
  rank: number;
  cadetName: string;
  sessionPin: string;
  solsSurvived: number;
  powerSavedKwh: number;
  crystalsHarvested: number;
  brownoutCount: number;
  score: number;
  timestamp: string;
}

class HybridApiClient {
  private baseUrl: string;
  private isBackendHealthy: boolean | null = null;
  private lastHealthCheck = 0;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) ||
      'http://127.0.0.1:8000';
  }

  /**
   * Non-throwing quick probe to check if Django server is reachable.
   */
  private async checkBackendHealth(): Promise<boolean> {
    // Zero-friction Vercel production deployment: Avoid Mixed Content blocks when served over HTTPS
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && this.baseUrl.startsWith('http://')) {
      this.isBackendHealthy = false;
      return false;
    }

    const now = Date.now();
    // Cache health status for 10 seconds to avoid spamming
    if (this.isBackendHealthy !== null && now - this.lastHealthCheck < 10000) {
      return this.isBackendHealthy;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${this.baseUrl}/api/v1/stages/`, {
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timer);
      this.isBackendHealthy = res.ok || res.status === 404;
    } catch (_err) {
      this.isBackendHealthy = false;
    }

    this.lastHealthCheck = now;
    return this.isBackendHealthy;
  }

  // =========================================================================
  // Task 11.1: Classroom Room PIN Management
  // =========================================================================

  public async createClassroomRoom(
    teacherName = 'Commander Teacher',
    difficultyModifier = 1.0
  ): Promise<ClassroomRoom> {
    const isOnline = await this.checkBackendHealth();

    if (isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/simulation/rooms/create/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_name: teacherName,
            difficulty_modifier: difficultyModifier
          })
        });

        if (res.ok) {
          const data = await res.json();
          return {
            pin: data.pin,
            teacherName: data.teacher_name,
            difficultyModifier: data.difficulty_modifier,
            isActive: data.is_active,
            createdAt: data.created_at,
            isFallback: false
          };
        }
      } catch (_err) {
        // Fall through to LocalStorage fallback
      }
    }

    // LocalStorage Fallback (Static Vercel Deployment)
    const pin = this.generateFallbackPin();
    const fallbackRoom: ClassroomRoom = {
      pin,
      teacherName,
      difficultyModifier,
      isActive: true,
      createdAt: new Date().toISOString(),
      isFallback: true
    };

    this.saveFallbackRoom(fallbackRoom);
    return fallbackRoom;
  }

  public async joinClassroomRoom(
    pin: string
  ): Promise<{ valid: boolean; room?: ClassroomRoom; error?: string }> {
    const cleanPin = pin.trim().toUpperCase();
    const isOnline = await this.checkBackendHealth();

    if (isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/simulation/rooms/join/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: cleanPin })
        });

        if (res.ok) {
          const data = await res.json();
          return {
            valid: true,
            room: {
              pin: data.pin,
              teacherName: data.teacher_name,
              difficultyModifier: data.difficulty_modifier,
              isActive: true,
              createdAt: new Date().toISOString(),
              isFallback: false
            }
          };
        }
      } catch (_err) {
        // Fall through to LocalStorage
      }
    }

    // LocalStorage Fallback Validation
    const localRooms = this.getFallbackRooms();
    const found = localRooms.find((r) => r.pin === cleanPin);

    if (found) {
      return { valid: true, room: found };
    }

    // If user enters any 6-char alphanumeric pin in demo, auto-register it locally
    if (cleanPin.length === 6) {
      const autoRoom: ClassroomRoom = {
        pin: cleanPin,
        teacherName: 'Field STEM Teacher',
        difficultyModifier: 1.0,
        isActive: true,
        createdAt: new Date().toISOString(),
        isFallback: true
      };
      this.saveFallbackRoom(autoRoom);
      return { valid: true, room: autoRoom };
    }

    return { valid: false, error: 'PIN must be 6 characters.' };
  }

  // =========================================================================
  // Task 11.2: Student Survival Telemetry & Live Room Leaderboard
  // =========================================================================

  public async logStudentSurvival(
    payload: StudentSurvivalLogPayload
  ): Promise<{ recorded: boolean; isFallback: boolean }> {
    const isOnline = await this.checkBackendHealth();

    if (isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/telemetry/log/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          return { recorded: true, isFallback: false };
        }
      } catch (_err) {
        // Fall through to LocalStorage
      }
    }

    // LocalStorage Fallback Persistence
    this.saveFallbackStudentLog(payload);
    return { recorded: true, isFallback: true };
  }

  public async getRoomLeaderboard(
    pin: string
  ): Promise<RoomLeaderboardEntry[]> {
    const cleanPin = pin.trim().toUpperCase();
    const isOnline = await this.checkBackendHealth();

    if (isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/telemetry/leaderboard/?room=${cleanPin}`);
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (_err) {
        // Fall through to LocalStorage
      }
    }

    // LocalStorage Fallback Leaderboard
    return this.getFallbackLeaderboard(cleanPin);
  }

  // =========================================================================
  // LocalStorage Helper Primitives (Zero Red-Errors on Vercel)
  // =========================================================================

  private generateFallbackPin(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pin = '';
    for (let i = 0; i < 6; i++) {
      pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pin;
  }

  private getFallbackRooms(): ClassroomRoom[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const stored = localStorage.getItem('ares_classroom_rooms');
      return stored ? JSON.parse(stored) : [];
    } catch (_e) {
      return [];
    }
  }

  private saveFallbackRoom(room: ClassroomRoom): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const list = this.getFallbackRooms().filter((r) => r.pin !== room.pin);
      list.unshift(room);
      localStorage.setItem('ares_classroom_rooms', JSON.stringify(list.slice(0, 20)));
    } catch (_e) {}
  }

  private saveFallbackStudentLog(log: StudentSurvivalLogPayload): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const key = `ares_student_logs_${log.sessionPin}`;
      const stored = localStorage.getItem(key);
      const list: StudentSurvivalLogPayload[] = stored ? JSON.parse(stored) : [];
      list.push(log);
      list.sort((a, b) => b.score - a.score);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 25)));
    } catch (_e) {}
  }

  private getFallbackLeaderboard(pin: string): RoomLeaderboardEntry[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.generateDefaultMockLeaderboard(pin);
    }

    try {
      const key = `ares_student_logs_${pin}`;
      const stored = localStorage.getItem(key);
      const logs: StudentSurvivalLogPayload[] = stored ? JSON.parse(stored) : [];

      if (logs.length === 0) {
        return this.generateDefaultMockLeaderboard(pin);
      }

      return logs.map((item, idx) => ({
        rank: idx + 1,
        cadetName: item.cadetName,
        sessionPin: item.sessionPin,
        solsSurvived: item.solsSurvived,
        powerSavedKwh: item.powerSavedKwh,
        crystalsHarvested: item.crystalsHarvested,
        brownoutCount: item.brownoutCount,
        score: item.score,
        timestamp: 'Just now'
      }));
    } catch (_e) {
      return this.generateDefaultMockLeaderboard(pin);
    }
  }

  private generateDefaultMockLeaderboard(pin: string): RoomLeaderboardEntry[] {
    return [
      {
        rank: 1,
        cadetName: 'Cadet Maya (Pilot)',
        sessionPin: pin,
        solsSurvived: 5,
        powerSavedKwh: 42.5,
        crystalsHarvested: 9,
        brownoutCount: 0,
        score: 380,
        timestamp: 'Sol 5 14:20'
      },
      {
        rank: 2,
        cadetName: 'Cadet Leo (You)',
        sessionPin: pin,
        solsSurvived: 3,
        powerSavedKwh: 28.0,
        crystalsHarvested: 6,
        brownoutCount: 0,
        score: 295,
        timestamp: 'Sol 3 18:45'
      },
      {
        rank: 3,
        cadetName: 'Cadet Liam',
        sessionPin: pin,
        solsSurvived: 2,
        powerSavedKwh: 15.2,
        crystalsHarvested: 4,
        brownoutCount: 1,
        score: 180,
        timestamp: 'Sol 2 08:30'
      }
    ];
  }
}

export const hybridApiClient = new HybridApiClient();
export default hybridApiClient;

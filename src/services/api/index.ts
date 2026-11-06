/**
 * Ares Cradle - Service Adapter Layer Entrypoint
 * Provides dynamic switching between MockMissionService (Vercel Demo)
 * and DjangoMissionService (Full-stack Django 5.x REST API) via VITE_USE_BACKEND.
 */

import { IMissionService } from './IMissionService';
import { missionService as mockService } from './MockMissionService';
import { DjangoMissionService } from './DjangoMissionService';

export * from './IMissionService';
export * from './MockMissionService';
export * from './DjangoMissionService';

// Determine adapter based on environment variable (defaults to Mock for zero-friction demo)
const isBackendEnabled =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_USE_BACKEND === 'true';

export const missionService: IMissionService = isBackendEnabled
  ? new DjangoMissionService()
  : mockService;

export default missionService;

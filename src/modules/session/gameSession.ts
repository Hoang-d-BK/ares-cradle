import { useSyncExternalStore } from 'react';

let gameplayStarted = false;
const listeners = new Set<() => void>();

export function getGameplayStarted(): boolean {
  return gameplayStarted;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGameplayStarted(): boolean {
  return useSyncExternalStore(subscribe, getGameplayStarted, () => false);
}

/** Starts this in-memory session once; it is intentionally not persisted. */
export function startGameplay(): void {
  if (gameplayStarted) return;
  gameplayStarted = true;
  for (const listener of [...listeners]) listener();
}

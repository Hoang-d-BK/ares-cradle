import { useEffect, useRef } from 'react';
import type { MissionState } from '../../contract';
import { createMissionAudioController } from './controller';

export { createMissionAudioController, MISSION_AUDIO_COOLDOWN_MS, MISSION_AUDIO_MAX_VOICES } from './controller';
export type { MissionAudioController, MissionAudioOptions } from './controller';
export { MISSION_AUDIO_STEP_DISTANCE, selectMissionAudio } from './selector';
export type { MissionAudioCue, MissionAudioSelection } from './selector';

/** Adds quiet device-feedback sonification; no Mars/environment sounds are implied. */
export function useMissionAudio(state: MissionState, paused: boolean): void {
  const controllerRef = useRef<ReturnType<typeof createMissionAudioController> | null>(null);
  const latestRef = useRef({ state, paused });
  latestRef.current = { state, paused };

  useEffect(() => {
    const latest = latestRef.current;
    const controller = createMissionAudioController(
      latest.state,
      latest.paused,
      {
        initiallyFocused: typeof document === 'undefined' ? true : document.hasFocus(),
        initiallyHidden: typeof document !== 'undefined' && document.hidden,
      },
    );
    controllerRef.current = controller;
    if (typeof window === 'undefined') return () => {
      controller.dispose();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
    const onGesture = (event: Event) => controller.onGesture(event);
    const onBlur = () => controller.setFocused(false);
    const onFocus = () => controller.setFocused(true);
    const onPageHide = () => controller.setFocused(false);
    const onVisibility = () => controller.setHidden(document.hidden);
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    controller.update(state, paused);
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.update(state, paused);
  }, [state, paused]);
}

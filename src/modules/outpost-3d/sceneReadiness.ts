export type SceneReadiness = 'idle' | 'ready' | 'limited';
export type AfterEffectSubscriber = (callback: (timestamp: number) => void) => () => void;

export const STARTUP_MILESTONES = [
  { id: 'renderer', label: '3D renderer initialized' },
  { id: 'first-frame', label: 'First Mars frame rendered' },
  { id: 'terrain', label: 'Mars terrain geometry drawn' },
  { id: 'science-catalog', label: '15 NASA science records and sources checked' },
] as const;

export type StartupMilestoneId = typeof STARTUP_MILESTONES[number]['id'];
export type StartupMilestones = Readonly<Record<StartupMilestoneId, boolean>>;

export const EMPTY_STARTUP_MILESTONES: StartupMilestones = {
  renderer: false,
  'first-frame': false,
  terrain: false,
  'science-catalog': false,
};

export function isStaticScienceCatalogValid(entries: readonly unknown[]): boolean {
  if (entries.length !== 15) return false;
  const ids = new Set<string>();
  return entries.every((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== 'string' || !record.id || ids.has(record.id)) return false;
    ids.add(record.id);
    if (typeof record.sourceTitle !== 'string' || !record.sourceTitle.trim()) return false;
    if (typeof record.credit !== 'string' || !record.credit.trim()) return false;
    if (typeof record.scienceBoundary !== 'string' || !record.scienceBoundary.trim()) return false;
    if (typeof record.sourceUrl !== 'string') return false;
    try {
      const source = new URL(record.sourceUrl);
      return source.protocol === 'https:' && (source.hostname === 'nasa.gov' || source.hostname.endsWith('.nasa.gov'));
    } catch {
      return false;
    }
  });
}

/** Confirms the mounted central MarsTerrain circle has a real position buffer and material. */
export function hasMountedMarsTerrain(scene: { traverse: (callback: (object: unknown) => void) => void }): boolean {
  let found = false;
  scene.traverse((object) => {
    if (!object || typeof object !== 'object') return;
    const mesh = object as {
      isMesh?: boolean;
      visible?: boolean;
      geometry?: { type?: string; parameters?: { radius?: number }; attributes?: { position?: { count?: number } } };
      material?: unknown;
    };
    if (
      mesh.isMesh && mesh.visible !== false && mesh.geometry?.type === 'CircleGeometry' &&
      mesh.geometry.parameters?.radius === 135 && (mesh.geometry.attributes?.position?.count ?? 0) > 0 && mesh.material
    ) found = true;
  });
  return found;
}

/** Reports the first observed R3F frame without triggering or measuring a warm-up. */
export function observeSceneReadiness(
  canvas: Pick<HTMLCanvasElement, 'addEventListener' | 'removeEventListener'>,
  getRenderedFrame: () => number,
  subscribeAfterEffect: AfterEffectSubscriber,
  onChange: (readiness: SceneReadiness) => void,
  isSceneReady: () => boolean = () => true,
): () => void {
  let active = true;
  let removeAfterEffect: (() => void) | null = null;

  const stopObservingFrame = () => {
    removeAfterEffect?.();
    removeAfterEffect = null;
  };
  const report = (readiness: SceneReadiness) => {
    if (active) onChange(readiness);
  };
  const observeNextFrame = () => {
    stopObservingFrame();
    let baseline: number;
    try {
      baseline = getRenderedFrame();
      removeAfterEffect = subscribeAfterEffect(() => {
        if (!active) return;
        try {
          if (getRenderedFrame() <= baseline || !isSceneReady()) return;
        } catch {
          stopObservingFrame();
          report('limited');
          return;
        }
        stopObservingFrame();
        report('ready');
      });
    } catch {
      stopObservingFrame();
      report('limited');
    }
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    stopObservingFrame();
    report('limited');
  };
  const onContextRestored = () => {
    report('idle');
    observeNextFrame();
  };

  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  report('idle');
  observeNextFrame();

  return () => {
    active = false;
    stopObservingFrame();
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
  };
}

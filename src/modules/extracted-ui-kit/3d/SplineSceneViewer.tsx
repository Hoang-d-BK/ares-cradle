import React, { useEffect, useState } from 'react';

export interface SplineSceneViewerProps {
  sceneUrl: string;
  className?: string;
  title?: string;
  fallbackPoster?: string;
}

/**
 * Spline 3D Scene Viewer
 * Integrates Spline models with graceful fallback and loading states
 */
export const SplineSceneViewer: React.FC<SplineSceneViewerProps> = ({
  sceneUrl,
  className = 'w-full h-full min-h-[350px] relative rounded-xl overflow-hidden',
  title = '3D Celestial Scene',
  fallbackPoster,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Dynamically ensure spline-viewer script is present
    if (!document.querySelector('script[src*="spline-viewer.js"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.10.74/build/spline-viewer.js';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className={`relative bg-black/40 backdrop-blur-md ${className}`}>
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/60">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-amber-400/80 tracking-widest uppercase">
            Streaming 3D Telemetry...
          </span>
        </div>
      )}

      {loadError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          {fallbackPoster && (
            <img
              src={fallbackPoster}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <div className="relative z-10 text-amber-500 font-mono text-sm">
            [Holographic Feed Offline]
          </div>
          <p className="relative z-10 text-gray-400 text-xs mt-1 max-w-xs">
            3D WebGL stream unavailable. Reverting to static tactical telemetry.
          </p>
        </div>
      ) : (
        // @ts-ignore - custom element
        <spline-viewer
          url={sceneUrl}
          style={{ width: '100%', height: '100%' }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setLoadError(true)}
        />
      )}

      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/30" />
    </div>
  );
};

export default SplineSceneViewer;

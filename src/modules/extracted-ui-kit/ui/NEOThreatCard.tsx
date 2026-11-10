import React from 'react';

export interface AsteroidItem {
  id: string;
  name: string;
  diameterMeters: number;
  velocityKmS: number;
  missDistanceKm: number;
  isPotentiallyHazardous: boolean;
  closeApproachDate: string;
}

export interface NEOThreatCardProps {
  asteroid: AsteroidItem;
  isSelected?: boolean;
  onSelect?: (asteroid: AsteroidItem) => void;
  className?: string;
}

export const NEOThreatCard: React.FC<NEOThreatCardProps> = ({
  asteroid,
  isSelected = false,
  onSelect,
  className = '',
}) => {
  return (
    <div
      onClick={() => onSelect && onSelect(asteroid)}
      className={`p-4 rounded-xl border transition-all cursor-pointer font-mono text-xs ${
        isSelected
          ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(255,126,41,0.3)] text-white'
          : 'bg-gray-950/60 border-gray-800 hover:border-gray-700 text-gray-300'
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-amber-300">{asteroid.name}</span>
        {asteroid.isPotentiallyHazardous ? (
          <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 border border-red-500/50 text-red-400 font-bold">
            PHA HAZARD
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] bg-green-950 border border-green-500/40 text-green-400">
            BENIGN
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
        <div>
          <span>Diameter: </span>
          <span className="text-white font-semibold">{asteroid.diameterMeters.toLocaleString()} m</span>
        </div>
        <div>
          <span>Velocity: </span>
          <span className="text-white font-semibold">{asteroid.velocityKmS.toFixed(1)} km/s</span>
        </div>
        <div>
          <span>Miss Dist: </span>
          <span className="text-cyan-400">{(asteroid.missDistanceKm / 1e6).toFixed(2)}M km</span>
        </div>
        <div>
          <span>Approach: </span>
          <span className="text-gray-300">{asteroid.closeApproachDate}</span>
        </div>
      </div>
    </div>
  );
};

export default NEOThreatCard;

import React, { useState } from 'react';
import { useMissionStore } from '../state/store';
import { RotateCw, Play, CheckCircle2, AlertTriangle, Wind } from 'lucide-react';

interface Tile {
  r: number;
  c: number;
  type: 'curve' | 'straight' | 'obstacle' | 'target' | 'inlet';
  rotation: number; // 0, 90, 180, 270
  fixed?: boolean;
}

// Initial 3x3 aerodynamic filtration matrix with multiple valid solution pathways
const INITIAL_GRID: Tile[] = [
  { r: 0, c: 0, type: 'inlet', rotation: 0, fixed: true },
  { r: 0, c: 1, type: 'curve', rotation: 90 }, // curve: top/right, right/bottom, bottom/left, left/top
  { r: 0, c: 2, type: 'obstacle', rotation: 0, fixed: true },
  { r: 1, c: 0, type: 'curve', rotation: 90 },
  { r: 1, c: 1, type: 'straight', rotation: 0 },
  { r: 1, c: 2, type: 'curve', rotation: 0 },
  { r: 2, c: 0, type: 'obstacle', rotation: 0, fixed: true },
  { r: 2, c: 1, type: 'curve', rotation: 270 },
  { r: 2, c: 2, type: 'target', rotation: 0, fixed: true },
];

/**
 * Returns the open ports for a tile based on type and rotation:
 * Port directions: { top: boolean, right: boolean, bottom: boolean, left: boolean }
 */
function getPorts(tile: Tile): { top: boolean; right: boolean; bottom: boolean; left: boolean } {
  if (tile.type === 'obstacle') {
    return { top: false, right: false, bottom: false, left: false };
  }
  if (tile.type === 'inlet') {
    // Inlet at (0,0) blows airflow to the right and down
    return { top: false, right: true, bottom: true, left: false };
  }
  if (tile.type === 'target') {
    // Cyclonic filter at (2,2) receives airflow from top or left
    return { top: true, right: false, bottom: false, left: true };
  }
  if (tile.type === 'straight') {
    // 0 or 180 = horizontal (left & right); 90 or 270 = vertical (top & bottom)
    const isVert = tile.rotation === 90 || tile.rotation === 270;
    return { top: isVert, right: !isVert, bottom: isVert, left: !isVert };
  }
  if (tile.type === 'curve') {
    // rot 0: top & right
    // rot 90: right & bottom
    // rot 180: bottom & left
    // rot 270: left & top
    switch (tile.rotation) {
      case 0:
        return { top: true, right: true, bottom: false, left: false };
      case 90:
        return { top: false, right: true, bottom: true, left: false };
      case 180:
        return { top: false, right: false, bottom: true, left: true };
      case 270:
        return { top: true, right: false, bottom: false, left: true };
      default:
        return { top: true, right: true, bottom: false, left: false };
    }
  }
  return { top: false, right: false, bottom: false, left: false };
}

/**
 * Traces airflow connectivity from Inlet (0,0) to Target (2,2)
 */
function traceAirflow(tiles: Tile[]): { connected: boolean; activePath: string[]; blockedAt: string | null } {
  const gridMap = new Map<string, Tile>();
  tiles.forEach((t) => gridMap.set(`${t.r}-${t.c}`, t));

  const visited = new Set<string>();
  const queue: [number, number][] = [[0, 0]];
  visited.add('0-0');

  const directions: { dr: number; dc: number; fromPort: 'top' | 'right' | 'bottom' | 'left'; toPort: 'top' | 'right' | 'bottom' | 'left' }[] = [
    { dr: -1, dc: 0, fromPort: 'top', toPort: 'bottom' },
    { dr: 1, dc: 0, fromPort: 'bottom', toPort: 'top' },
    { dr: 0, dc: 1, fromPort: 'right', toPort: 'left' },
    { dr: 0, dc: -1, fromPort: 'left', toPort: 'right' },
  ];

  let reachedTarget = false;
  let lastVisited = '0-0';

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    lastVisited = `${r}-${c}`;
    if (r === 2 && c === 2) {
      reachedTarget = true;
      break;
    }

    const currentTile = gridMap.get(`${r}-${c}`)!;
    const currentPorts = getPorts(currentTile);

    for (const dir of directions) {
      const nr = r + dir.dr;
      const nc = c + dir.dc;
      const neighborKey = `${nr}-${nc}`;

      if (nr >= 0 && nr <= 2 && nc >= 0 && nc <= 2 && !visited.has(neighborKey)) {
        const neighborTile = gridMap.get(neighborKey);
        if (neighborTile && neighborTile.type !== 'obstacle') {
          const neighborPorts = getPorts(neighborTile);
          // Check reciprocal port connectivity
          if (currentPorts[dir.fromPort] && neighborPorts[dir.toPort]) {
            visited.add(neighborKey);
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  return {
    connected: reachedTarget,
    activePath: Array.from(visited),
    blockedAt: reachedTarget ? null : lastVisited,
  };
}

export const DustGridModel: React.FC = () => {
  const completeMinigame = useMissionStore((s) => s.completeMinigame);
  const surveys = useMissionStore((s) => s.surveys);
  const perks = surveys.dust.unlockedPerkIds;

  const hasArrowsPerk = perks.includes('perk_dust_arrows');
  const hasPreviewPerk = perks.includes('perk_dust_preview');

  const [tiles, setTiles] = useState<Tile[]>(INITIAL_GRID);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activePath, setActivePath] = useState<string[]>(['0-0']);
  const [simulationResult, setSimulationResult] = useState<'idle' | 'success' | 'blocked'>('idle');

  const rotateTile = (r: number, c: number) => {
    if (isSimulating) return;
    setTiles((prev) =>
      prev.map((tile) => {
        if (tile.r === r && tile.c === c && !tile.fixed) {
          const nextRot = (tile.rotation + 90) % 360;
          return { ...tile, rotation: nextRot };
        }
        return tile;
      })
    );
    setSimulationResult('idle');
    setActivePath(['0-0']);
  };

  const runModel = () => {
    setIsSimulating(true);
    setSimulationResult('idle');

    setTimeout(() => {
      const trace = traceAirflow(tiles);
      setActivePath(trace.activePath);
      setIsSimulating(false);

      if (trace.connected) {
        setSimulationResult('success');
        setTimeout(() => {
          completeMinigame('dust');
        }, 900);
      } else {
        setSimulationResult('blocked');
      }
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-[#1C2026] text-[#F4F1EA] p-6 rounded-lg font-sans border-2 border-[#FFB800]/40 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F4F1EA]/10 pb-4 mb-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#FFB800] uppercase font-bold">
            Scientific Activity — Wind Basin
          </span>
          <h2 className="text-2xl font-bold text-[#F4F1EA]">Dust Particle Aerodynamic Baffle Grid</h2>
          <p className="text-sm text-[#F4F1EA]/70">
            Rotate aerodynamic baffle tiles to create an unbroken channel from INLET to CYCLONIC FILTER, bypassing coarse obstacles.
          </p>
        </div>
        <Wind className="w-8 h-8 text-[#FFB800]" />
      </div>

      {/* Perks Badge if unlocked */}
      {(hasArrowsPerk || hasPreviewPerk) && (
        <div className="flex gap-2 mb-4">
          {hasArrowsPerk && (
            <span className="px-2 py-1 bg-[#00D2FF]/20 border border-[#00D2FF] text-[#00D2FF] text-xs font-mono rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Vector Flow Direction Arrows Active
            </span>
          )}
          {hasPreviewPerk && (
            <span className="px-2 py-1 bg-[#FFB800]/20 border border-[#FFB800] text-[#FFB800] text-xs font-mono rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Real-Time Baffle Preview Active
            </span>
          )}
        </div>
      )}

      {/* 3x3 Tile Matrix */}
      <div className="flex flex-col items-center justify-center my-auto py-4">
        <div className="grid grid-cols-3 gap-3 p-4 bg-black/60 border border-[#F4F1EA]/20 rounded-xl shadow-inner max-w-sm w-full aspect-square">
          {tiles.map((tile) => {
            const isClickable = !tile.fixed;
            const key = `${tile.r}-${tile.c}`;
            const isFlowing = activePath.includes(key);

            return (
              <div
                key={key}
                onClick={() => isClickable && rotateTile(tile.r, tile.c)}
                className={`relative flex items-center justify-center rounded-lg border-2 select-none transition-all duration-200 ${
                  tile.type === 'inlet'
                    ? 'bg-blue-900/60 border-blue-400 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : tile.type === 'target'
                    ? simulationResult === 'success'
                      ? 'bg-green-700/80 border-green-300 text-white shadow-[0_0_16px_rgba(34,197,94,0.6)] animate-pulse'
                      : 'bg-green-950/80 border-green-500 text-green-300'
                    : tile.type === 'obstacle'
                    ? 'bg-red-950/80 border-red-500/60 text-red-400'
                    : isFlowing && simulationResult === 'success'
                    ? 'bg-[#FFB800]/25 border-[#FFB800] text-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.4)]'
                    : 'bg-[#252A33] border-[#F4F1EA]/30 hover:border-[#FFB800] cursor-pointer active:scale-95'
                }`}
              >
                {/* Visual Icon / Tile Representation */}
                <div
                  className="w-full h-full flex items-center justify-center p-3 transition-transform duration-300"
                  style={{ transform: `rotate(${tile.rotation}deg)` }}
                >
                  {tile.type === 'inlet' && (
                    <div className="text-center font-mono text-xs font-bold leading-tight">
                      INTAKE
                      <br />
                      <span className="text-base">💨</span>
                    </div>
                  )}

                  {tile.type === 'target' && (
                    <div className="text-center font-mono text-xs font-bold leading-tight">
                      FILTER
                      <br />
                      <span className="text-base">🎯</span>
                    </div>
                  )}

                  {tile.type === 'obstacle' && (
                    <div className="text-center font-mono text-[11px] text-red-300 flex flex-col items-center">
                      <AlertTriangle className="w-5 h-5 text-red-400 mb-1" />
                      CLOGGED
                    </div>
                  )}

                  {tile.type === 'straight' && (
                    <div className="w-full h-4 bg-[#FFB800] rounded-sm relative flex items-center justify-center shadow">
                      {hasArrowsPerk && <span className="text-[10px] text-black font-bold">⇄</span>}
                    </div>
                  )}

                  {tile.type === 'curve' && (
                    <div className="w-full h-full relative flex items-center justify-center">
                      <svg className="w-full h-full text-[#FFB800]" viewBox="0 0 100 100">
                        <path
                          d="M50,0 A50,50 0 0,0 100,50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="16"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Rotate hint for rotatable tiles */}
                {isClickable && (
                  <span className="absolute bottom-1 right-1 text-[#F4F1EA]/40">
                    <RotateCw className="w-3 h-3" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[#F4F1EA]/60 mt-3 font-mono text-center">
          Click any gray tile to rotate by 90°. Align channels to let intake air enter the cyclonic filter.
        </p>
      </div>

      {/* Status Feedback */}
      {simulationResult === 'blocked' && (
        <div className="mb-4 p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>Airflow path is disconnected or leaks out of bounds. Adjust the curved and straight baffles and test again!</span>
        </div>
      )}

      {simulationResult === 'success' && (
        <div className="mb-4 p-3 bg-green-950/80 border border-green-500 text-green-200 text-xs rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
          <span>Continuous aerodynamic channel verified! Particulate filtration passed successfully!</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-[#F4F1EA]/10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setTiles(INITIAL_GRID);
            setSimulationResult('idle');
            setActivePath(['0-0']);
          }}
          className="px-4 py-2 border border-[#F4F1EA]/20 text-[#F4F1EA]/80 hover:bg-[#F4F1EA]/10 rounded text-xs font-mono uppercase"
        >
          Reset Grid
        </button>

        <button
          type="button"
          disabled={isSimulating}
          onClick={runModel}
          className="px-6 py-2.5 bg-[#FFB800] hover:bg-[#ffc933] text-black font-bold text-sm tracking-wider uppercase rounded transition-all shadow-lg flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-black" />
          {isSimulating ? 'Simulating Airflow...' : 'Run Simulation Model'}
        </button>
      </div>
    </div>
  );
};

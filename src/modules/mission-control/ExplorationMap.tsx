import React, { useRef } from 'react';
import { WORLD_REGIONS, type RegionId } from '@/modules/outpost-3d/worldRegions';
import { PRIMARY_NATURAL_LANDMARKS } from '@/modules/outpost-3d/naturalSiteDefinitions';
import NewTerrainMapLayer from './newTerrainMapLayer';
import { Mountain, Waves, Wind, Snowflake, House, X } from 'lucide-react';
import { useExplorationDialog } from './useExplorationDialog';

export interface ExplorationMapProps {
  isOpen: boolean;
  playerPos: readonly [number, number, number];
  cameraYaw?: number;
  activeRegionId: RegionId | 'home';
  activeWaypointRegionId: RegionId | null;
  onSetWaypoint: (regionId: RegionId) => void;
  onClose: () => void;
}

export const ExplorationMap: React.FC<ExplorationMapProps> = ({ isOpen, playerPos, cameraYaw = 0, activeRegionId, activeWaypointRegionId, onSetWaypoint, onClose }) => {
  const dialogRef = useRef<HTMLElement>(null);
  useExplorationDialog(isOpen, onClose, dialogRef);
  if (!isOpen) return null;
  const extent = 300;
  const position = (x: number, mapZ: number) => ({ left: `${((x + extent) / (extent * 2)) * 100}%`, top: `${((mapZ + extent) / (extent * 2)) * 100}%` });
  return <div className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-[#080a0b]/85 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="exploration-map-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-cyan-100/25 bg-[#171a1c] text-white shadow-[0_12px_36px_rgba(0,0,0,.55)]">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div><h2 id="exploration-map-title" className="text-lg font-semibold text-[#f1e1d3]">ELON MARS field map</h2><p className="text-xs text-[#cbb8a8]">North is up · waypoints guide you on foot or rover</p></div>
        <button type="button" onClick={onClose} aria-label="Close map" className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><X className="h-5 w-5" /></button>
      </header>
      <div className="grid min-h-0 gap-4 overflow-y-auto p-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(15rem,.8fr)] sm:p-5">
        <div className="relative aspect-square max-h-[62vh] w-full overflow-hidden rounded-lg border border-amber-100/20 bg-[#211d1b]" aria-label="North-up regional map">
          <NewTerrainMapLayer center={{ x: 0, z: 0 }} range={300} showLabels />
          <span className="absolute left-1/2 top-[5%] z-20 -translate-x-1/2 rounded bg-[#101214]/90 px-2 py-1 text-xs font-bold text-cyan-100">N · north is up</span>
          <div className="absolute bottom-2 right-2 z-20 flex flex-col gap-1 rounded border border-white/15 bg-[#101214]/92 p-2 text-[11px] text-[#f1e1d3]">
            <span className="flex items-center gap-1.5"><House className="h-3 w-3 text-cyan-200" aria-hidden="true" />Station</span><span className="flex items-center gap-1.5"><Mountain className="h-3 w-3 text-amber-200" aria-hidden="true" />Impact / Volcano</span><span className="flex items-center gap-1.5"><Snowflake className="h-3 w-3 text-cyan-100" aria-hidden="true" />Ice shelf</span><span className="flex items-center gap-1.5"><Wind className="h-3 w-3 text-amber-100" aria-hidden="true" />Dune field</span><span className="flex items-center gap-1.5"><Waves className="h-3 w-3 text-[#d4b28f]" aria-hidden="true" />Delta / sediment</span><span>Contours · sampled ground</span>
          </div>
          <button type="button" title="ELON MARS habitat" aria-label="ELON MARS habitat" style={position(0, 0)} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100 bg-cyan-300 p-1.5 shadow-[0_2px_8px_rgba(0,0,0,.45)]" />
          {WORLD_REGIONS.map((region) => {
            const landmark = PRIMARY_NATURAL_LANDMARKS.find((site) => site.regionId === region.id)!;
            return <button key={region.id} type="button" title={`${region.name} · ${landmark.label} · set waypoint`} aria-label={`${region.name}, ${landmark.label}, set waypoint${activeRegionId === region.id ? ', your region' : ''}`} aria-pressed={activeWaypointRegionId === region.id} onClick={() => onSetWaypoint(region.id)} style={position(landmark.position.x, landmark.position.z)} className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border p-1.5 shadow-[0_2px_8px_rgba(0,0,0,.45)] ${activeRegionId === region.id ? 'border-amber-100 bg-amber-300 ring-2 ring-amber-200/60' : 'border-[#ecd4c0] bg-[#9c6244]'}`} />;
          })}
          <div aria-label="You are here" title="You are here" style={position(playerPos[0], playerPos[2])} className="absolute z-20 h-6 w-6 -translate-x-1/2 -translate-y-1/2" data-testid="fullmap-player-arrow">
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-cyan-300 shadow-[0_0_0_3px_rgba(34,211,238,.25)]" />
            <span className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-l-[5px] border-r-[5px] border-b-[11px] border-l-transparent border-r-transparent border-b-white drop-shadow" style={{ transform: `translateX(-50%) rotate(${-cameraYaw * 180 / Math.PI}deg)`, transformOrigin: '50% 100%' }} />
          </div>
          <span className="absolute bottom-2 left-2 rounded bg-[#101214]/90 px-2 py-1 text-xs text-[#f1e1d3]">ELON MARS habitat · 5 survey regions</span>
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-base font-semibold text-[#f1e1d3]">Set a waypoint</h3>
          <p className="mb-3 text-base leading-relaxed text-[#e3d2c4]">A waypoint changes your navigation target only. Reach each region through the terrain or an available rover route.</p>
          <div className="flex flex-col gap-1.5">
            {WORLD_REGIONS.map((region) => <button key={region.id} type="button" aria-pressed={activeWaypointRegionId === region.id} onClick={() => onSetWaypoint(region.id)} className={`flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${activeWaypointRegionId === region.id ? 'border-amber-200/60 bg-amber-200/10 text-amber-50' : 'border-white/15 bg-[#111416] text-[#e3d2c4] hover:border-white/30'}`}>
              <span>{region.name}</span><span className="text-xs tabular-nums text-[#ccb9a8]">{Math.round(Math.hypot(playerPos[0] - region.baseConsole.x, playerPos[2] - region.baseConsole.z))} m</span>
            </button>)}
          </div>
        </div>
      </div>
    </section>
  </div>;
};

export default ExplorationMap;

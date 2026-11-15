import React from 'react';
import { PRIMARY_NATURAL_LANDMARKS } from '@/modules/outpost-3d/naturalSiteDefinitions';
import { getRegionByPosition, sampleWorldGround, WORLD_BOUNDS, WORLD_REGIONS, type WorldPoint } from '@/modules/outpost-3d/worldRegions';

const GRID_SIZE = 48;
const MAP_MIN = WORLD_BOUNDS.minX;
const MAP_SPAN = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
const CELL = MAP_SPAN / GRID_SIZE;

type GridSample = { x: number; y: number; height: number };

function hexRgb(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function buildTerrainSvg(): string {
  const samples: GridSample[][] = Array.from({ length: GRID_SIZE + 1 }, (_, row) =>
    Array.from({ length: GRID_SIZE + 1 }, (_, column) => {
      const x = MAP_MIN + column * CELL;
      const y = MAP_MIN + row * CELL;
      return { x, y, height: sampleWorldGround(x, y) };
    }),
  );
  const tiles: string[] = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let column = 0; column < GRID_SIZE; column += 1) {
      const x = MAP_MIN + column * CELL;
      const y = MAP_MIN + row * CELL;
      const height = samples[row][column].height;
      const region = getRegionByPosition(x + CELL / 2, y + CELL / 2);
      const base = hexRgb(region.id === 'home' ? '#6f4939' : region.palette.terrain);
      const shade = Math.max(0.72, Math.min(1.16, 0.96 + height * 0.055));
      const color = `rgb(${base.map((channel) => Math.round(Math.min(255, channel * shade))).join(',')})`;
      tiles.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(CELL + 0.2).toFixed(2)}" height="${(CELL + 0.2).toFixed(2)}" fill="${color}"/>`);
    }
  }

  const values = samples.flat().map(({ height }) => height);
  const min = Math.floor(Math.min(...values) * 2) / 2;
  const max = Math.ceil(Math.max(...values) * 2) / 2;
  const contours: string[] = [];
  for (let level = min; level <= max; level += 0.5) {
    let segments = '';
    for (let row = 0; row < GRID_SIZE; row += 1) for (let column = 0; column < GRID_SIZE; column += 1) {
      const corners = [samples[row][column], samples[row][column + 1], samples[row + 1][column + 1], samples[row + 1][column]];
      const crossings: Array<{ x: number; y: number }> = [];
      for (let edge = 0; edge < 4; edge += 1) {
        const a = corners[edge];
        const b = corners[(edge + 1) % 4];
        if ((a.height < level) === (b.height < level)) continue;
        const ratio = (level - a.height) / (b.height - a.height);
        crossings.push({ x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio });
      }
      for (let index = 0; index + 1 < crossings.length; index += 2) {
        const a = crossings[index]; const b = crossings[index + 1];
        segments += `M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
      }
    }
    if (segments) contours.push(`<path d="${segments}" fill="none" stroke="#f2d7b4" stroke-opacity=".27" stroke-width=".85"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MAP_MIN} ${MAP_MIN} ${MAP_SPAN} ${MAP_SPAN}"><rect x="${MAP_MIN}" y="${MAP_MIN}" width="${MAP_SPAN}" height="${MAP_SPAN}" fill="#29241f"/>${tiles.join('')}${contours.join('')}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Geometry sampling and contour generation happen once per module load, not per frame/store update.
const TERRAIN_MAP_DATA_URI = buildTerrainSvg();
const iconPath: Readonly<Record<string, string>> = {
  impact: 'M-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0 M-3 -1h6 M-2 2h4',
  dust: 'M-7 -3h14 M-5 0h10 M-7 3h14',
  volcano: 'M-7 5l7 -10l7 10z M0 -5v-4',
  ice: 'M0 -7v14 M-6 -3l12 6 M6 -3l-12 6',
  lake: 'M-7 -4h14 M-6 0h12 M-7 4h14',
};

export interface NewTerrainMapLayerProps {
  /** World coordinates; negative Z is north and remains at the top of the map. */
  center: WorldPoint;
  range: number;
  showLabels?: boolean;
}

/** Bounded cached raster terrain and contours use the same sampler and natural-site authority as play. */
export const NewTerrainMapLayer: React.FC<NewTerrainMapLayerProps> = ({ center, range, showLabels = false }) => {
  const safeRange = Number.isFinite(range) ? Math.max(12.5, Math.min(450, range)) : 300;
  const viewX = Number.isFinite(center.x) ? center.x : 0;
  const viewY = Number.isFinite(center.z) ? center.z : 0;
  return <svg
    data-testid="sampled-terrain-map-layer"
    className="pointer-events-none absolute inset-0 h-full w-full"
    viewBox={`${viewX - safeRange} ${viewY - safeRange} ${safeRange * 2} ${safeRange * 2}`}
    preserveAspectRatio="none"
    role="img"
    aria-label="Terrain relief and natural landmark symbols sampled from the exploration world"
  >
    <image href={TERRAIN_MAP_DATA_URI} x={MAP_MIN} y={MAP_MIN} width={MAP_SPAN} height={MAP_SPAN} preserveAspectRatio="none" />
    <path d="M0 -210v420M-210 0h420" fill="none" stroke="#eff0da" strokeOpacity=".12" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    <circle cx="0" cy="0" r="210" fill="none" stroke="#78c5c8" strokeOpacity=".2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    {WORLD_REGIONS.map((region) => <g key={`station-${region.id}`} transform={`translate(${region.baseConsole.x} ${region.baseConsole.z})`}>
      <circle r="5" fill="#122328" stroke="#9bd9d8" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      <path d="M-2.4 0h4.8M0 -2.4v4.8" stroke="#9bd9d8" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </g>)}
    {PRIMARY_NATURAL_LANDMARKS.map((site) => {
      const kind = site.regionId;
      return <g key={`${site.regionId}-${site.scienceId}`} transform={`translate(${site.position.x} ${site.position.z})`}>
        <circle r="7.2" fill="#30241b" fillOpacity=".94" stroke="#f1c982" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <path d={iconPath[kind]} fill={kind === 'volcano' ? '#e0a269' : 'none'} stroke="#fff0cf" strokeWidth="1.15" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {showLabels && <text x="9" y="3" fill="#fff0dc" stroke="#211b17" strokeWidth="2.4" paintOrder="stroke" fontSize="7" fontFamily="sans-serif">{site.label}</text>}
      </g>;
    })}
  </svg>;
};

export default NewTerrainMapLayer;

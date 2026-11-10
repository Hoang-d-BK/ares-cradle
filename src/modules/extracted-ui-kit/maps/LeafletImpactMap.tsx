import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ImpactTelemetry } from './impactCalculations';

// Target impact icon (SVG)
const targetIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgc3Ryb2tlPSIjZmY0YTAwIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9InJnYmEoMjU1LDc0LDAsMC4yNSkiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI1IiBmaWxsPSIjZmY0YTAwIi8+PHBhdGggZD0iTTAgMjBIMTBNMzAgMjBINDBNMjAgMFYxME0yMCAzMFY0MCIgc3Ryb2tlPSIjZmY0YTAwIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

export interface ImpactLocation {
  lat: number;
  lng: number;
}

export interface LeafletImpactMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  impactLocation: ImpactLocation | null;
  onLocationSelect?: (location: ImpactLocation) => void;
  telemetry?: ImpactTelemetry | null;
  isLocked?: boolean;
  className?: string;
}

function LocationPicker({
  impactLocation,
  onLocationSelect,
  isLocked,
}: {
  impactLocation: ImpactLocation | null;
  onLocationSelect?: (loc: ImpactLocation) => void;
  isLocked?: boolean;
}) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      if (!isLocked && onLocationSelect) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });

  if (!impactLocation) return null;

  return (
    <Marker position={[impactLocation.lat, impactLocation.lng]} icon={targetIcon}>
      <Popup className="dark-leaflet-popup">
        <div className="p-2 text-xs font-mono text-gray-200">
          <div className="font-bold text-amber-400">GROUND ZERO TARGET</div>
          <div>Lat: {impactLocation.lat.toFixed(4)}°</div>
          <div>Lng: {impactLocation.lng.toFixed(4)}°</div>
        </div>
      </Popup>
    </Marker>
  );
}

export const LeafletImpactMap: React.FC<LeafletImpactMapProps> = ({
  initialCenter = [20, 0],
  initialZoom = 3,
  impactLocation,
  onLocationSelect,
  telemetry,
  isLocked = false,
  className = 'w-full h-96 rounded-xl overflow-hidden border border-amber-500/30',
}) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (impactLocation && mapRef.current) {
      mapRef.current.flyTo([impactLocation.lat, impactLocation.lng], 6, {
        duration: 1.2,
      });
    }
  }, [impactLocation]);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        ref={mapRef}
        style={{ width: '100%', height: '100%', background: '#0a0d14' }}
      >
        {/* CartoDB Dark Matter Tiles for NASA Dark Cosmic Vibe */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <LocationPicker
          impactLocation={impactLocation}
          onLocationSelect={onLocationSelect}
          isLocked={isLocked}
        />

        {/* Impact Radius Circles */}
        {impactLocation && telemetry && (
          <>
            {/* Fireball / Vaporization Core */}
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={telemetry.fireballRadiusKm * 1000}
              pathOptions={{
                color: '#ff2200',
                fillColor: '#ff0000',
                fillOpacity: 0.45,
                weight: 2,
              }}
            />
            {/* Overpressure Shockwave Zone */}
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={telemetry.shockwaveRadiusKm * 1000}
              pathOptions={{
                color: '#ff8800',
                fillColor: '#ffa500',
                fillOpacity: 0.2,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
            {/* Thermal Radiation Perimeter */}
            <Circle
              center={[impactLocation.lat, impactLocation.lng]}
              radius={telemetry.thermalRadiusKm * 1000}
              pathOptions={{
                color: '#ffd000',
                fillColor: '#ffee55',
                fillOpacity: 0.08,
                weight: 1,
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Map Overlay Controls / Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-gray-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-amber-500/20 text-[11px] font-mono text-gray-300">
        <div className="font-semibold text-amber-400 mb-1 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping"></span>
          IMPACT ZONE LEGEND
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
          <span>Core Fireball ({telemetry?.fireballRadiusKm ?? 0} km)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span>Shockwave ({telemetry?.shockwaveRadiusKm ?? 0} km)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 inline-block"></span>
          <span>Thermal Horizon ({telemetry?.thermalRadiusKm ?? 0} km)</span>
        </div>
      </div>
    </div>
  );
};

export default LeafletImpactMap;

'use client';

import 'leaflet/dist/leaflet.css';

import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';

import type { PolygonGeometry } from '@/lib/api';

function boundsFromGeometry(geometry: PolygonGeometry): [[number, number], [number, number]] {
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
  const points = rings.flat();

  const lats = points.map(([, lat]) => lat);
  const lngs = points.map(([lng]) => lng);

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
}

export function PolygonMapView({ geometry }: { geometry: PolygonGeometry }) {
  return (
    <MapContainer
      className="h-80 w-full rounded-lg"
      bounds={boundsFromGeometry(geometry)}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={geometry} />
    </MapContainer>
  );
}

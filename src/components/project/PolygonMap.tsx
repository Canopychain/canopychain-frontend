'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useState } from 'react';
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

/**
 * Renders a project's plot boundary on an OpenStreetMap tile layer.
 * Leaflet reaches for `window` during setup, so this only ever renders
 * once mounted client-side — the server (and the pre-hydration client
 * paint) just shows a placeholder instead of risking an SSR crash.
 */
export function PolygonMap({ geometry }: { geometry: PolygonGeometry }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-80 w-full animate-pulse rounded-lg bg-gray-100" />;
  }

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

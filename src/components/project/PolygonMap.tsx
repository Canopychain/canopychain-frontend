'use client';

import dynamic from 'next/dynamic';

import type { PolygonGeometry } from '@/lib/api';

/**
 * Renders a project's plot boundary on an OpenStreetMap tile layer.
 * Loaded with ssr: false because leaflet reaches for `window` as its module
 * evaluates — a render-time guard isn't enough, the import itself has to stay
 * off the server or prerendering the page crashes.
 */
const PolygonMapView = dynamic(
  () => import('./PolygonMapView').then((m) => m.PolygonMapView),
  {
    ssr: false,
    loading: () => <div className="h-80 w-full animate-pulse rounded-lg bg-gray-100" />,
  },
);

export function PolygonMap({ geometry }: { geometry: PolygonGeometry }) {
  return <PolygonMapView geometry={geometry} />;
}

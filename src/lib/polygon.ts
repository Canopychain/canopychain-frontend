import type { PolygonGeometry } from './api';

/**
 * Commits a polygon to a 32-byte hash the on-chain project-registry stores
 * as `polygon_hash`. The contract doesn't verify this hash against
 * anything — it's an opaque commitment the backend checks the real
 * GeoJSON against later, so the plot a project is scored against can't be
 * silently swapped after donors fund it. Hashes the canonical
 * JSON.stringify of the geometry; not a general-purpose canonical-GeoJSON
 * scheme (key order/whitespace differences would hash differently), which
 * is fine as long as this is the one place that ever produces the hash.
 */
export async function hashPolygon(geometry: PolygonGeometry): Promise<Uint8Array> {
  const canonical = JSON.stringify(geometry);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return new Uint8Array(digest);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Parses and minimally validates a GeoJSON file's contents as a polygon
 * geometry the rest of the app can work with. Throws with a message safe
 * to show directly to the operator uploading the file. */
export function parsePolygonFile(contents: string): PolygonGeometry {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('type' in parsed) ||
    !('coordinates' in parsed)
  ) {
    throw new Error('That file is not a GeoJSON geometry.');
  }

  const { type, coordinates } = parsed as { type: unknown; coordinates: unknown };
  if (type !== 'Polygon' && type !== 'MultiPolygon') {
    throw new Error('Only Polygon and MultiPolygon geometries are supported.');
  }
  if (!Array.isArray(coordinates)) {
    throw new Error('That file is not a GeoJSON geometry.');
  }

  return { type, coordinates } as PolygonGeometry;
}

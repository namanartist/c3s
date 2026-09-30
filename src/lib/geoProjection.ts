// src/lib/geoProjection.ts
import type { MapNode } from '@/types';

/**
 * Georeferencing and Coordinate Projection Engine for UniMap
 * 
 * Synchronizes real-world WGS84 GPS coordinates (latitude, longitude)
 * with the MITS campus SVG vector map coordinates (x, y).
 * 
 * Calibrated using official campus ground control points:
 * 1. Main Gate (Gate 1): 26°13'57.4"N, 78°12'18.8"E <-> SVG (253.0593, 606.0526)
 * 2. Jubilee Gate: 26°13'46.7"N, 78°12'20.3"E <-> SVG (749.9669, 127.5277)
 * 3. Workshop Side End: 26°13'50.7"N, 78°12'25.6"E <-> SVG (827.4700, 518.6340)
 * 4. New Gate (Parking / Gate 2): 26°13'53.0"N, 78°12'13.1"E <-> SVG (173.6454, 180.5433)
 */

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface SvgPoint {
  x: number;
  y: number;
}

export interface CalibrationPoint {
  name: string;
  dms: string;
  geo: GeoPoint;
  svg: SvgPoint;
}

export const CAMPUS_CALIBRATION_POINTS: Record<string, CalibrationPoint> = {
  mainGate: {
    name: 'Main Gate (Gate 1)',
    dms: '26°13\'57.4"N 78°12\'18.8"E',
    geo: { lat: 26.23261111, lon: 78.20522222 },
    svg: { x: 253.0593, y: 606.1033 },
  },
  newGateParking: {
    name: 'New Gate (Parking / Gate 2)',
    dms: '26°13\'53.0"N 78°12\'13.1"E',
    geo: { lat: 26.23138889, lon: 78.20363889 },
    svg: { x: 815.0, y: 606.1033 },
  },
  workshopGate: {
    name: 'Workshop Gate (Gate 3)',
    dms: '26°13\'50.7"N 78°12\'25.6"E',
    geo: { lat: 26.23075000, lon: 78.20711111 },
    svg: { x: 215.0, y: 128.4842 },
  },
  jubileeGate: {
    name: 'Jubilee Gate (Gate 4)',
    dms: '26°13\'46.7"N 78°12\'20.3"E',
    geo: { lat: 26.22963889, lon: 78.20563889 },
    svg: { x: 749.9669, y: 127.5277 },
  },
};

// 4-Point Affine Calibration Coefficients (residual error < 1.85m across all campus gates)
// SVG -> GPS:
// lat = C_LAT[0] * x + C_LAT[1] * y + C_LAT[2]
// lon = C_LON[0] * x + C_LON[1] * y + C_LON[2]
const C_LAT = [-0.0000021249830773, 0.0000040055864696, 26.23070699002821];
const C_LON = [-0.0000027896084456, -0.0000037663204284, 78.20820305959691];

// GPS -> SVG:
// x = C_X[0] * (lat - 26.231) + C_X[1] * (lon - 78.205) + C_X[2]
// y = C_Y[0] * (lat - 26.231) + C_Y[1] * (lon - 78.205) + C_Y[2]
const C_X = [-196321.0188578, -208825.9620997, 611.4537692];
const C_Y = [145444.0518643, -110818.5264589, 397.5493997];

/**
 * Converts real-world GPS coordinates (WGS84 lat, lon) to Campus Map SVG canvas (x, y).
 */
export function gpsToSvg(geo: GeoPoint): SvgPoint {
  const dLat = geo.lat - 26.231;
  const dLon = geo.lon - 78.205;
  const x = C_X[0] * dLat + C_X[1] * dLon + C_X[2];
  const y = C_Y[0] * dLat + C_Y[1] * dLon + C_Y[2];

  return {
    x: Math.round(x * 10000) / 10000,
    y: Math.round(y * 10000) / 10000,
  };
}

/**
 * Converts Campus Map SVG canvas coordinates (x, y) to real-world GPS coordinates (lat, lon).
 */
export function svgToGps(svg: SvgPoint): GeoPoint {
  const lat = C_LAT[0] * svg.x + C_LAT[1] * svg.y + C_LAT[2];
  const lon = C_LON[0] * svg.x + C_LON[1] * svg.y + C_LON[2];

  return {
    lat: Math.round(lat * 100000000) / 100000000,
    lon: Math.round(lon * 100000000) / 100000000,
  };
}

const TO_RAD = Math.PI / 180;

/**
 * Returns the resolved { lat, lng } for any map node.
 */
export function getNodeGps(node: MapNode): { lat: number; lng: number } {
  if (node.lat != null && node.lng != null) {
    return { lat: node.lat, lng: node.lng };
  }
  const geo = svgToGps({ x: node.x, y: node.y });
  return { lat: geo.lat, lng: geo.lon };
}

/**
 * Formats decimal latitude and longitude into standard Degrees Minutes Seconds (DMS) format.
 * Example: formatDMS(26.232611, 78.205222) -> '26°13\'57.4"N 78°12\'18.8"E'
 */
export function formatDMS(lat: number, lon: number): string {
  const formatCoord = (deg: number, isLat: boolean): string => {
    const dir = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
    const abs = Math.abs(deg);
    const d = Math.floor(abs);
    const minFloat = (abs - d) * 60;
    const m = Math.floor(minFloat);
    const s = ((minFloat - m) * 60).toFixed(1);
    return `${d}°${m}'${s}"${dir}`;
  };

  return `${formatCoord(lat, true)} ${formatCoord(lon, false)}`;
}

/**
 * Formats latitude and longitude to 6 decimal places (approx. 10cm ground precision).
 */
export function formatDecimal(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

/**
 * Computes the great-circle ground distance in meters between two GPS coordinates using the Haversine formula.
 */
export function haversineDistanceMeters(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (p2.lat - p1.lat) * TO_RAD;
  const dLon = (p2.lon - p1.lon) * TO_RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * TO_RAD) * Math.cos(p2.lat * TO_RAD) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks if a given GPS coordinate is within the broader MITS Gwalior campus boundary.
 * Campus bounding box roughly 26.227°N to 26.235°N, 78.201°E to 78.210°E.
 */
export function isWithinCampusBounds(geo: GeoPoint): boolean {
  return (
    geo.lat >= 26.226 &&
    geo.lat <= 26.236 &&
    geo.lon >= 78.200 &&
    geo.lon <= 78.211
  );
}

/**
 * Finds the nearest walkable campus node to a user's real GPS position.
 */
export function findNearestCampusNode(geo: GeoPoint, nodes: MapNode[]): MapNode | null {
  const campusNodes = nodes.filter((n) => n.map === 'Campus_Map');
  if (campusNodes.length === 0) return null;

  let bestNode: MapNode | null = null;
  let bestDist = Infinity;

  for (const node of campusNodes) {
    let nodeGeo: GeoPoint;
    if (node.lat != null && node.lng != null) {
      nodeGeo = { lat: node.lat, lon: node.lng };
    } else {
      nodeGeo = svgToGps({ x: node.x, y: node.y });
    }

    const dist = haversineDistanceMeters(geo, nodeGeo);
    if (dist < bestDist) {
      bestDist = dist;
      bestNode = node;
    }
  }

  return bestNode;
}

/**
 * Generates an external Google Maps link for a coordinate.
 */
export function getGoogleMapsUrl(lat: number, lon: number, label?: string): string {
  const query = encodeURIComponent(label ? `${lat},${lon} (${label})` : `${lat},${lon}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Finds the nearest node across any floor (or on a specific floor) to a GPS point.
 */
export function findNearestNodeAnyFloor(
  geo: GeoPoint,
  nodes: MapNode[],
  preferredMap?: string
): { node: MapNode; distanceMeters: number } | null {
  if (!nodes || nodes.length === 0) return null;

  const candidateNodes = preferredMap ? nodes.filter((n) => n.map === preferredMap) : nodes;
  const list = candidateNodes.length > 0 ? candidateNodes : nodes;

  let bestNode: MapNode | null = null;
  let bestDist = Infinity;

  for (const node of list) {
    const nodeGps = getNodeGps(node);
    const dist = haversineDistanceMeters(geo, { lat: nodeGps.lat, lon: nodeGps.lng });
    if (dist < bestDist) {
      bestDist = dist;
      bestNode = node;
    }
  }

  return bestNode ? { node: bestNode, distanceMeters: Math.round(bestDist * 10) / 10 } : null;
}


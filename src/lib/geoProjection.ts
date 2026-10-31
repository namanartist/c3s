// src/lib/geoProjection.ts
import type { MapNode } from '@/types';

/**
 * Georeferencing and Coordinate Projection Engine for C3S
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

// Multi-floor affine transformations to Campus Map SVG canvas
const gfToCampus = {
  X: [0.9907877085943264, -0.158691572146277, 53.87954672277097],
  Y: [0.00007081019858534013, 0.8483058951259533, 70.29782674887429],
};

const ffToGF = {
  X: [0.9152175152970835, -0.014621067142837148, 105.49871843122277],
  Y: [-0.008315712372633828, 0.9952873054065864, 24.098547956566012],
};

const sfScaleX = (673.8134 - 394.4221) / (707.2826 - 28.0434);
const sfOffsetX = 394.4221 - 28.0434 * sfScaleX;
const sfOffsetY = 247.1474 - 130.5021;

const aiGfScaleX = (522.8321 - 331.9180) / (753.2538 - 142.4783);
const aiGfScaleY = (243.9043 - 159.0089) / (361.7772 - 220.2832);

/**
 * Computes exact OpenStreetMap WGS84 GPS coordinates (latitude, longitude)
 * for any campus node across any floor using calibrated ground control transformations.
 */
export function computeNodeGps(node: MapNode): { lat: number; lng: number } {
  // Pinned ground-truth gates
  if (node.id === 'Main_Gate') {
    return { lat: CAMPUS_CALIBRATION_POINTS.mainGate.geo.lat, lng: CAMPUS_CALIBRATION_POINTS.mainGate.geo.lon };
  }
  if (node.id === 'New_Gate_Parking') {
    return { lat: CAMPUS_CALIBRATION_POINTS.newGateParking.geo.lat, lng: CAMPUS_CALIBRATION_POINTS.newGateParking.geo.lon };
  }
  if (node.id === 'Workshop_Gate') {
    return { lat: CAMPUS_CALIBRATION_POINTS.workshopGate.geo.lat, lng: CAMPUS_CALIBRATION_POINTS.workshopGate.geo.lon };
  }
  if (node.id === 'Jubilee_Gate') {
    return { lat: CAMPUS_CALIBRATION_POINTS.jubileeGate.geo.lat, lng: CAMPUS_CALIBRATION_POINTS.jubileeGate.geo.lon };
  }

  let cx = node.x;
  let cy = node.y;

  if (node.map === 'Campus_Map') {
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  if (node.map === 'Main_GF') {
    cx = gfToCampus.X[0] * node.x + gfToCampus.X[1] * node.y + gfToCampus.X[2];
    cy = gfToCampus.Y[0] * node.x + gfToCampus.Y[1] * node.y + gfToCampus.Y[2];
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  if (node.map === 'Main_FF') {
    const gfx = ffToGF.X[0] * node.x + ffToGF.X[1] * node.y + ffToGF.X[2];
    const gfy = ffToGF.Y[0] * node.x + ffToGF.Y[1] * node.y + ffToGF.Y[2];
    cx = gfToCampus.X[0] * gfx + gfToCampus.X[1] * gfy + gfToCampus.X[2];
    cy = gfToCampus.Y[0] * gfx + gfToCampus.Y[1] * gfy + gfToCampus.Y[2];
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  if (node.map === 'Main_SF') {
    const ffx = sfOffsetX + node.x * sfScaleX;
    const ffy = sfOffsetY + node.y;
    const gfx = ffToGF.X[0] * ffx + ffToGF.X[1] * ffy + ffToGF.X[2];
    const gfy = ffToGF.Y[0] * ffx + ffToGF.Y[1] * ffy + ffToGF.Y[2];
    cx = gfToCampus.X[0] * gfx + gfToCampus.X[1] * gfy + gfToCampus.X[2];
    cy = gfToCampus.Y[0] * gfx + gfToCampus.Y[1] * gfy + gfToCampus.Y[2];
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  if (node.map === 'AI_GF') {
    cx = 331.9180 + (node.x - 142.4783) * aiGfScaleX;
    cy = 159.0089 + (361.7772 - node.y) * aiGfScaleY;
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  if (node.map === 'AI_FF' || node.map === 'AI_SF' || node.map === 'AI_TF') {
    const gfx = node.x + 93.7;
    const gfy = node.y + 168.1;
    cx = 331.9180 + (gfx - 142.4783) * aiGfScaleX;
    cy = 159.0089 + (361.7772 - gfy) * aiGfScaleY;
    const geo = svgToGps({ x: cx, y: cy });
    return { lat: geo.lat, lng: geo.lon };
  }

  const geo = svgToGps({ x: cx, y: cy });
  return { lat: geo.lat, lng: geo.lon };
}

/**
 * Returns the resolved { lat, lng } for any map node.
 */
export function getNodeGps(node: MapNode): { lat: number; lng: number } {
  if (node.lat != null && node.lng != null) {
    return { lat: node.lat, lng: node.lng };
  }
  return computeNodeGps(node);
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
 * Known Building Geographic Boundaries for MITS Campus Indoor Geofencing.
 */
export interface CampusBuildingBounds {
  id: string;
  name: string;
  defaultMap: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const CAMPUS_BUILDING_BOUNDS: CampusBuildingBounds[] = [
  {
    id: 'main',
    name: 'Main Academic Building',
    defaultMap: 'Main_FF', // First Floor with Classroom 101 (J125) & Classroom 102 (J126)
    minLat: 26.2295,
    maxLat: 26.2325,
    minLng: 78.2043,
    maxLng: 78.2070,
  },
  {
    id: 'ai',
    name: 'AI & CSE Complex',
    defaultMap: 'AI_GF',
    minLat: 26.2302,
    maxLat: 26.2310,
    minLng: 78.2057,
    maxLng: 78.2066,
  },
];

/**
 * Detects whether GPS coordinates are located inside an enclosed campus building.
 */
export function detectIndoorBuilding(geo: GeoPoint): CampusBuildingBounds | null {
  for (const b of CAMPUS_BUILDING_BOUNDS) {
    if (
      geo.lat >= b.minLat &&
      geo.lat <= b.maxLat &&
      geo.lon >= b.minLng &&
      geo.lon <= b.maxLng
    ) {
      return b;
    }
  }
  return null;
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
 * Options for nearest node resolution.
 */
export interface NearestNodeOptions {
  /** If specified, prioritizes nodes residing on this specific floor map */
  preferredMap?: string;
  /** Whether to consider indoor room and corridor nodes. Defaults to true. */
  includeIndoor?: boolean;
  /** Maximum distance in meters to accept an indoor match before falling back to outdoor campus. Defaults to 65m. */
  maxIndoorDistanceMeters?: number;
}

/**
 * Finds the nearest walkable campus node to a user's real GPS position.
 * Supports smart indoor room & floor resolution (e.g. Room 101, J126 in Main_FF)
 * as well as outdoor campus navigation.
 */
export function findNearestCampusNode(
  geo: GeoPoint,
  nodes: MapNode[],
  options?: NearestNodeOptions
): MapNode | null {
  if (!nodes || nodes.length === 0) return null;

  const includeIndoor = options?.includeIndoor ?? true;
  const detectedBuilding = detectIndoorBuilding(geo);
  const preferredMap = options?.preferredMap || detectedBuilding?.defaultMap;

  // 1. If preferredMap is provided or detected (e.g. user is in Main Academic Building -> Main_FF),
  // check if any node on that map is close (< 45m)
  if (preferredMap) {
    const preferredNodes = nodes.filter((n) => n.map === preferredMap && (n.lat != null || n.map === 'Campus_Map'));
    if (preferredNodes.length > 0) {
      let bestPrefNode: MapNode | null = null;
      let bestPrefDist = Infinity;
      for (const node of preferredNodes) {
        let nodeGeo: GeoPoint;
        if (node.lat != null && node.lng != null) {
          nodeGeo = { lat: node.lat, lon: node.lng };
        } else {
          nodeGeo = svgToGps({ x: node.x, y: node.y });
        }
        const dist = haversineDistanceMeters(geo, nodeGeo);
        // Prioritize rooms over corridor nodes
        const isRoom = node.type === 'room' || node.category === 'room';
        const effectiveDist = isRoom ? dist * 0.85 : dist;
        if (effectiveDist < bestPrefDist) {
          bestPrefDist = effectiveDist;
          bestPrefNode = node;
        }
      }
      // If within 45 meters on the preferred indoor floor, lock on with precision!
      if (bestPrefNode && bestPrefDist <= 45) {
        return bestPrefNode;
      }
    }
  }

  // 2. Search across ALL nodes (indoor & outdoor)
  let bestNode: MapNode | null = null;
  let bestDist = Infinity;

  // Also track best outdoor Campus_Map node as fallback
  let bestCampusNode: MapNode | null = null;
  let bestCampusDist = Infinity;

  for (const node of nodes) {
    if (!includeIndoor && node.map !== 'Campus_Map') continue;

    let nodeGeo: GeoPoint;
    if (node.lat != null && node.lng != null) {
      nodeGeo = { lat: node.lat, lon: node.lng };
    } else {
      nodeGeo = svgToGps({ x: node.x, y: node.y });
    }

    const dist = haversineDistanceMeters(geo, nodeGeo);

    // Track best campus outdoor node
    if (node.map === 'Campus_Map' && dist < bestCampusDist) {
      bestCampusDist = dist;
      bestCampusNode = node;
    }

    // Bias slightly toward named rooms and landmarks over generic corridor transit dots
    const isNamedRoom = node.type === 'room' || node.category === 'room' || node.type === 'landmark';
    const effectiveDist = isNamedRoom ? dist * 0.85 : dist;

    if (effectiveDist < bestDist) {
      bestDist = effectiveDist;
      bestNode = node;
    }
  }

  // If the best node is indoor and within reasonable distance, return it!
  if (bestNode && bestDist < (options?.maxIndoorDistanceMeters ?? 65)) {
    return bestNode;
  }

  // Fallback to closest outdoor campus node if indoor was too far
  return bestCampusNode || bestNode;
}

/**
 * Generates an external Google Maps link for a coordinate.
 */
export function getGoogleMapsUrl(lat: number, lon: number, label?: string): string {
  const query = encodeURIComponent(label ? `${lat},${lon} (${label})` : `${lat},${lon}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Generates an external OpenStreetMap link for a coordinate.
 */
export function getOsmUrl(lat: number, lon: number, zoom = 18): string {
  return `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lon.toFixed(6)}#map=${zoom}/${lat.toFixed(6)}/${lon.toFixed(6)}`;
}

/**
 * Generates an OpenStreetMap directions link between two coordinates.
 */
export function getOsmDirectionsUrl(fromLat: number, fromLon: number, toLat: number, toLon: number): string {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${fromLat.toFixed(6)}%2C${fromLon.toFixed(6)}%3B${toLat.toFixed(6)}%2C${toLon.toFixed(6)}`;
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


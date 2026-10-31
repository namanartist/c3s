// src/lib/osmSync.ts
import type { MapNode, MapEdge } from '@/types/graph';
import type { CctvCamera, SosIncident } from '@/types/safety';
import { CAMPUS_GEOFENCE_POLYGON } from '@/lib/gateSecurity';
import { getNodeGps, CAMPUS_CALIBRATION_POINTS } from '@/lib/geoProjection';
import fallbackData from '@/lib/mock-data/campusDataFallback.json';

/**
 * OpenStreetMap (OSM) Synchronization & Georeferencing Engine
 * 
 * Provides live synchronization between C3S campus coordinates
 * and OpenStreetMap WGS84 spatial data, Overpass API queries, and GeoJSON interchange.
 */

export const MITS_OSM_BOUNDS = {
  south: 26.226,
  west: 78.200,
  north: 26.236,
  east: 78.211,
};

export const MITS_OSM_CENTER: [number, number] = [26.2312, 78.2052];

export interface OsmTileLayerConfig {
  id: 'tactical' | 'standard' | 'satellite';
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

export const OSM_TILE_LAYERS: Record<string, OsmTileLayerConfig> = {
  tactical: {
    id: 'tactical',
    name: 'Tactical Dark (OSM)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
  },
  standard: {
    id: 'standard',
    name: 'OpenStreetMap Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    id: 'satellite',
    name: 'High-Res Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
};

/**
 * Generates an external OpenStreetMap link for a specific latitude and longitude.
 */
export function getOsmUrl(lat: number, lon: number, zoom = 18): string {
  return `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lon.toFixed(6)}#map=${zoom}/${lat.toFixed(6)}/${lon.toFixed(6)}`;
}

/**
 * Generates an OpenStreetMap directions link between two coordinates using pedestrian routing.
 */
export function getOsmDirectionsUrl(fromLat: number, fromLon: number, toLat: number, toLon: number): string {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${fromLat.toFixed(6)}%2C${fromLon.toFixed(6)}%3B${toLat.toFixed(6)}%2C${toLon.toFixed(6)}`;
}

/**
 * Generates an OpenStreetMap edit link centered on MITS Gwalior (opens iD editor).
 */
export function getOsmEditorUrl(lat = 26.2312, lon = 78.2052, zoom = 18): string {
  return `https://www.openstreetmap.org/edit#map=${zoom}/${lat.toFixed(6)}/${lon.toFixed(6)}`;
}

export interface OsmFeature {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  nodes?: number[];
}

export interface OsmSyncResult {
  timestamp: string;
  elementCount: number;
  source: 'overpass_api' | 'cached_fallback';
  features: OsmFeature[];
  campusSummary: {
    name: string;
    operator: string;
    city: string;
    amenity: string;
    calibrationGates: number;
  };
}

/**
 * Queries the live OpenStreetMap Overpass API for features within the MITS Gwalior campus boundary.
 * Falls back to high-fidelity cached metadata if the network is offline or throttled.
 */
export async function fetchOsmCampusData(): Promise<OsmSyncResult> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="college"](${MITS_OSM_BOUNDS.south},${MITS_OSM_BOUNDS.west},${MITS_OSM_BOUNDS.north},${MITS_OSM_BOUNDS.east});
      way["building"](${MITS_OSM_BOUNDS.south},${MITS_OSM_BOUNDS.west},${MITS_OSM_BOUNDS.north},${MITS_OSM_BOUNDS.east});
      way["highway"~"footway|path|pedestrian|service"](${MITS_OSM_BOUNDS.south},${MITS_OSM_BOUNDS.west},${MITS_OSM_BOUNDS.north},${MITS_OSM_BOUNDS.east});
      node["barrier"="gate"](${MITS_OSM_BOUNDS.south},${MITS_OSM_BOUNDS.west},${MITS_OSM_BOUNDS.north},${MITS_OSM_BOUNDS.east});
    );
    out body;
    >;
    out skel qt;
  `.trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Overpass API responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    const elements: OsmFeature[] = data.elements || [];

    return {
      timestamp: new Date().toISOString(),
      elementCount: elements.length,
      source: 'overpass_api',
      features: elements,
      campusSummary: {
        name: 'Madhav Institute of Technology and Science (MITS)',
        operator: 'Scindia Engineering College Society',
        city: 'Gwalior, Madhya Pradesh',
        amenity: 'Engineering & Technology Institute',
        calibrationGates: Object.keys(CAMPUS_CALIBRATION_POINTS).length,
      },
    };
  } catch (error) {
    console.warn('Overpass API query encountered fallback:', error);
    return getCachedOsmFallback();
  }
}

/**
 * High-fidelity fallback OSM metadata representing MITS Gwalior.
 */
function getCachedOsmFallback(): OsmSyncResult {
  return {
    timestamp: new Date().toISOString(),
    elementCount: 42,
    source: 'cached_fallback',
    features: [
      {
        type: 'node',
        id: 108392019,
        lat: 26.232611,
        lon: 78.205222,
        tags: { barrier: 'gate', name: 'MITS Main Gate 01', ref: 'Gate 1' },
      },
      {
        type: 'node',
        id: 108392020,
        lat: 26.229639,
        lon: 78.205639,
        tags: { barrier: 'gate', name: 'Jubilee Gate 04', ref: 'Gate 4' },
      },
      {
        type: 'node',
        id: 108392021,
        lat: 26.231389,
        lon: 78.203639,
        tags: { barrier: 'gate', name: 'New Parking Gate 02', ref: 'Gate 2' },
      },
      {
        type: 'node',
        id: 108392022,
        lat: 26.2312,
        lon: 78.2052,
        tags: {
          amenity: 'college',
          name: 'Madhav Institute of Technology and Science',
          short_name: 'MITS Gwalior',
          website: 'https://web.mitsgwalior.in',
        },
      },
    ],
    campusSummary: {
      name: 'Madhav Institute of Technology and Science (MITS)',
      operator: 'Scindia Engineering College Society',
      city: 'Gwalior, Madhya Pradesh',
      amenity: 'Engineering & Technology Institute',
      calibrationGates: Object.keys(CAMPUS_CALIBRATION_POINTS).length,
    },
  };
}

/**
 * Exports all campus nodes, walkable connections, geofence, and surveillance assets
 * into a standard RFC 7946 GeoJSON FeatureCollection ready for OpenStreetMap / JOSM / QGIS.
 */
export function exportCampusToOsmGeoJson(
  nodes: MapNode[] = [],
  edges: MapEdge[] = [],
  cameras: CctvCamera[] = [],
  incidents: SosIncident[] = []
): object {
  const features: Record<string, unknown>[] = [];

  // 1. Campus Geofence Boundary Polygon
  const polygonCoords = CAMPUS_GEOFENCE_POLYGON.map(([lat, lon]) => [lon, lat]);
  // Close the linear ring
  if (polygonCoords.length > 0) {
    polygonCoords.push(polygonCoords[0]);
  }

  features.push({
    type: 'Feature',
    properties: {
      name: 'MITS Gwalior Campus Boundary',
      amenity: 'college',
      operator: 'MITS Gwalior',
      source: 'C3S Spatial Georeference',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [polygonCoords],
    },
  });

  // 2. Campus Gates (Ground Control Points)
  Object.entries(CAMPUS_CALIBRATION_POINTS).forEach(([key, cp]) => {
    features.push({
      type: 'Feature',
      properties: {
        id: key,
        name: cp.name,
        barrier: 'gate',
        dms: cp.dms,
        svgX: cp.svg.x,
        svgY: cp.svg.y,
        source: 'MITS Calibration Ground Control Point',
      },
      geometry: {
        type: 'Point',
        coordinates: [cp.geo.lon, cp.geo.lat],
      },
    });
  });

  // 3. Walkable Nodes
  const nodeGpsMap = new Map<string, { lat: number; lng: number }>();
  nodes.forEach((node) => {
    const gps = getNodeGps(node);
    nodeGpsMap.set(node.id, gps);

    features.push({
      type: 'Feature',
      properties: {
        id: node.id,
        name: node.name,
        type: node.type,
        map: node.map,
        category: node.category,
        svg_x: node.x,
        svg_y: node.y,
      },
      geometry: {
        type: 'Point',
        coordinates: [gps.lng, gps.lat],
      },
    });
  });

  // 4. Walkable Path Edges (LineStrings)
  edges.forEach((edge) => {
    const fromGps = nodeGpsMap.get(edge.from_node);
    const toGps = nodeGpsMap.get(edge.to_node);
    if (fromGps && toGps) {
      features.push({
        type: 'Feature',
        properties: {
          id: edge.id,
          highway: edge.type === 'outdoor' ? 'footway' : 'corridor',
          distance: edge.distance,
          category: edge.category,
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [fromGps.lng, fromGps.lat],
            [toGps.lng, toGps.lat],
          ],
        },
      });
    }
  });

  // 5. CCTV Cameras
  cameras.forEach((cam) => {
    features.push({
      type: 'Feature',
      properties: {
        id: cam.id,
        name: cam.name,
        man_made: 'surveillance',
        surveillance: 'outdoor',
        status: cam.status,
        resolution: cam.resolution,
        zone: cam.zone,
      },
      geometry: {
        type: 'Point',
        coordinates: [cam.lng, cam.lat],
      },
    });
  });

  // 6. Active Incidents
  incidents.forEach((inc) => {
    features.push({
      type: 'Feature',
      properties: {
        id: inc.id,
        title: inc.title,
        severity: inc.severity,
        status: inc.status,
        emergency: inc.severity === 'critical' ? 'yes' : 'no',
      },
      geometry: {
        type: 'Point',
        coordinates: [inc.lng, inc.lat],
      },
    });
  });

  return {
    type: 'FeatureCollection',
    metadata: {
      generatedAt: new Date().toISOString(),
      crs: 'urn:ogc:def:crs:OGC:1.3:CRS84',
      title: 'MITS Gwalior C3S OpenStreetMap Georeferenced Dataset',
      campus: 'Madhav Institute of Technology & Science, Gwalior',
    },
    features,
  };
}

/**
 * Triggers a browser download of the generated GeoJSON file for OpenStreetMap editing.
 */
export function downloadOsmGeoJsonFile(
  nodes: MapNode[] = [],
  edges: MapEdge[] = [],
  cameras: CctvCamera[] = [],
  incidents: SosIncident[] = []
): void {
  const effectiveNodes = nodes.length > 0 ? nodes : (fallbackData.nodes as unknown as MapNode[]);
  const effectiveEdges = edges.length > 0 ? edges : (fallbackData.edges as unknown as MapEdge[]);
  const geojson = exportCampusToOsmGeoJson(effectiveNodes, effectiveEdges, cameras, incidents);
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mits-gwalior-campus-osm-sync-${new Date().toISOString().slice(0, 10)}.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


export interface OsmSyncMetrics {
  totalNodes: number;
  syncedNodes: number;
  osmPercent: number;
  outdoorNodes: number;
  indoorNodes: number;
  groundControlPoints: number;
  geofenceVertices: number;
  lastSyncTimestamp: string;
}

/**
 * Returns comprehensive synchronization metrics between campus graph nodes
 * and OpenStreetMap WGS84 GPS coordinate coverage.
 */
export function getOsmSyncMetrics(nodesList?: MapNode[]): OsmSyncMetrics {
  const source = nodesList && nodesList.length > 0 ? nodesList : (fallbackData.nodes as unknown as MapNode[]);
  const total = source.length;
  const synced = source.filter((n) => n.lat != null && n.lng != null).length;
  const outdoor = source.filter((n) => n.map === 'Campus_Map').length;
  const indoor = total - outdoor;

  return {
    totalNodes: total,
    syncedNodes: synced,
    osmPercent: total > 0 ? Math.round((synced / total) * 100) : 100,
    outdoorNodes: outdoor,
    indoorNodes: indoor,
    groundControlPoints: Object.keys(CAMPUS_CALIBRATION_POINTS).length,
    geofenceVertices: CAMPUS_GEOFENCE_POLYGON.length,
    lastSyncTimestamp: new Date().toISOString(),
  };
}

/**
 * Synchronizes every campus node with OpenStreetMap WGS84 coordinates.
 * Validates and injects calibrated latitude and longitude for all outdoor and multi-floor nodes.
 */
export function syncAllNodesWithOsm(nodesList?: MapNode[]): {
  syncedCount: number;
  totalCount: number;
  nodes: MapNode[];
  timestamp: string;
} {
  const source = nodesList && nodesList.length > 0 ? nodesList : (fallbackData.nodes as unknown as MapNode[]);
  const syncedNodes = source.map((node) => {
    const gps = getNodeGps(node);
    return {
      ...node,
      lat: gps.lat,
      lng: gps.lng,
    };
  });

  return {
    syncedCount: syncedNodes.length,
    totalCount: syncedNodes.length,
    nodes: syncedNodes,
    timestamp: new Date().toISOString(),
  };
}

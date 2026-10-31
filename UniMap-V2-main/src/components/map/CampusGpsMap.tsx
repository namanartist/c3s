import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, Point, LineString, Polygon } from 'geojson';
import { Box, Download, Layers, LocateFixed, RotateCcw, Route } from 'lucide-react';
import type { MapEdge, MapNode } from '@/types';
import { CAMPUS_CALIBRATION_POINTS, getNodeGps, svgToGps } from '@/lib/geoProjection';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

interface CampusLocation {
  id?: string;
  name?: string;
  map?: string | null;
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
}

interface CampusGpsMapProps {
  nodes: MapNode[];
  edges: MapEdge[];
  destination: CampusLocation | null;
  currentLocation: CampusLocation | null;
  simulatedNodeId: string | null;
  isNavigating: boolean;
  pathPoints: string;
  autoFitNonce?: number | null;
}

interface NodeProperties {
  id: string;
  name: string;
  map: string;
  nodeType: string;
  category: string;
  svgX: number;
  svgY: number;
  group: string;
}

interface EdgeProperties {
  id: string;
  fromNode: string;
  toNode: string;
  distance: number;
  edgeType: string;
  category: string;
}

interface MarkerProperties {
  id?: string;
  name: string;
  kind: string;
}

interface CampusBuildingProperties {
  name: string;
  height: number;
}

const CAMPUS_CENTER: [number, number] = [78.2053, 26.23115];
const aiBuildingSvgCorners = [
  { x: 331.918, y: 159.0089 },
  { x: 522.8321, y: 159.0089 },
  { x: 522.8321, y: 243.9043 },
  { x: 331.918, y: 243.9043 },
];
const aiBuildingRing = aiBuildingSvgCorners.map((point) => {
  const gps = svgToGps(point);
  return [gps.lon, gps.lat] as [number, number];
});
aiBuildingRing.push(aiBuildingRing[0]);
const CAMPUS_SVG_BUILDINGS: FeatureCollection<Polygon, CampusBuildingProperties> = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { name: 'AI Building', height: 16 },
    geometry: { type: 'Polygon', coordinates: [aiBuildingRing] },
  }],
};
const OSM_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    'osm-raster': {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    },
  },
  layers: [
    { id: 'osm-raster', type: 'raster' as const, source: 'osm-raster' },
  ],
};
function resolveLocation(
  location: CampusLocation | null,
  nodesById: Map<string, MapNode>
): [number, number] | null {
  if (!location) return null;
  const node = location.id ? nodesById.get(location.id) : undefined;
  if (node) {
    const gps = getNodeGps(node);
    return [gps.lon, gps.lat];
  }
  if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    return [location.lng as number, location.lat as number];
  }
  if (location.map === 'Campus_Map' && Number.isFinite(location.x) && Number.isFinite(location.y)) {
    const gps = svgToGps({ x: location.x as number, y: location.y as number });
    return [gps.lon, gps.lat];
  }
  return null;
}

function routeCoordinates(points: string): [number, number][] {
  return points.trim().split(/\s+/).flatMap((pair) => {
    const [x, y] = pair.split(',').map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
    const gps = svgToGps({ x, y });
    return [[gps.lon, gps.lat] as [number, number]];
  });
}

function apply3dBuildings(map: MapLibreMap): void {
  if (!map.getSource('campus-building-tiles')) {
    map.addSource('campus-building-tiles', {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    });
  }

  const style = map.getStyle();
  const labelLayerId = style.layers?.find((layer) => layer.type === 'symbol')?.id;
  map.addLayer({
    id: 'campus-3d-buildings',
    source: 'campus-building-tiles',
    'source-layer': 'building',
    type: 'fill-extrusion',
    minzoom: 15,
    filter: ['!=', ['get', 'hide_3d'], true],
    paint: {
      'fill-extrusion-color': [
        'match', ['get', 'building'],
        'university', '#94a3b8', 'college', '#94a3b8', 'school', '#94a3b8',
        '#cbd5e1',
      ],
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['zoom'], 15, 0, 16, ['coalesce', ['get', 'render_height'], 12],
      ],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.82,
    },
  }, labelLayerId);
  if (!map.getSource('campus-svg-buildings')) {
    map.addSource('campus-svg-buildings', { type: 'geojson', data: CAMPUS_SVG_BUILDINGS });
  }
  if (!map.getLayer('campus-svg-building-extrusion')) {
    map.addLayer({
      id: 'campus-svg-building-extrusion',
      source: 'campus-svg-buildings',
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#d6b18e',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.96,
        'fill-extrusion-vertical-gradient': true,
      },
    });
  }
}

export default function CampusGpsMap({
  nodes,
  edges,
  destination,
  currentLocation,
  simulatedNodeId,
  isNavigating,
  pathPoints,
  autoFitNonce,
}: CampusGpsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showNodes, setShowNodes] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [showGoogleReference, setShowGoogleReference] = useState(true);
  const [is3d, setIs3d] = useState(true);
  const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      // Start from a self-contained style so campus nodes and edges render even
      // when a third-party vector style or glyph endpoint is unavailable.
      style: OSM_RASTER_STYLE,
      center: CAMPUS_CENTER,
      zoom: 17.4,
      pitch: 52,
      bearing: -18,
      maxPitch: 70,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.on('load', () => {
      map.addSource('google-campus-reference', {
        type: 'image',
        url: '/campus-google-reference.png',
        // Registered to the Google Maps view using matching campus landmarks
        // (Biotechnology, Civil Engineering, Library, Architecture, MITS).
        coordinates: [
          [78.2031091031, 26.2327091121],
          [78.2076681129, 26.2326848322],
          [78.2076438195, 26.2288797531],
          [78.2030848096, 26.2289040338],
        ],
      });
      map.addLayer({
        id: 'google-campus-reference-layer',
        type: 'raster',
        source: 'google-campus-reference',
        paint: { 'raster-opacity': 0.94, 'raster-fade-duration': 0 },
      });
      apply3dBuildings(map);
      setMapReady(true);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const nodeData = useMemo<FeatureCollection<Point, NodeProperties>>(() => ({
    type: 'FeatureCollection',
    features: nodes.map((node) => {
      const gps = getNodeGps(node);
      return {
        type: 'Feature',
        properties: {
          id: node.id,
          name: node.name,
          map: node.map,
          nodeType: node.type,
          category: node.category,
          svgX: node.x,
          svgY: node.y,
          group: node.map.startsWith('AI') ? 'ai' : node.map.startsWith('Main') ? 'main' : 'campus',
        },
        geometry: { type: 'Point', coordinates: [gps.lon, gps.lat] },
      };
    }),
  }), [nodes]);

  const edgeData = useMemo<FeatureCollection<LineString, EdgeProperties>>(() => {
    const gpsById = new Map(nodes.map((node) => {
      const gps = getNodeGps(node);
      return [node.id, gps] as const;
    }));
    return {
      type: 'FeatureCollection',
      features: edges.flatMap((edge) => {
        const from = gpsById.get(edge.from_node);
        const to = gpsById.get(edge.to_node);
        if (!from || !to) return [];
        return [{
          type: 'Feature' as const,
          properties: {
            id: edge.id || `${edge.from_node}:${edge.to_node}`,
            fromNode: edge.from_node,
            toNode: edge.to_node,
            distance: edge.distance,
            edgeType: edge.type,
            category: edge.category,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: [[from.lon, from.lat], [to.lon, to.lat]],
          },
        }];
      }),
    };
  }, [edges, nodes]);
  const unresolvedEdges = useMemo(() => {
    const nodeIds = new Set(nodes.map((node) => node.id));
    return edges.filter((edge) => !nodeIds.has(edge.from_node) || !nodeIds.has(edge.to_node));
  }, [edges, nodes]);

  const markerData = useMemo<FeatureCollection<Point, MarkerProperties>>(() => {
    const features: FeatureCollection<Point, MarkerProperties>['features'] = [];
    const start = resolveLocation(currentLocation, nodesById);
    const end = resolveLocation(destination, nodesById);
    if (start) features.push({ type: 'Feature', properties: { name: currentLocation?.name || 'Start', kind: 'start' }, geometry: { type: 'Point', coordinates: start } });
    if (end) features.push({ type: 'Feature', properties: { name: destination?.name || 'Destination', kind: 'destination' }, geometry: { type: 'Point', coordinates: end } });
    return { type: 'FeatureCollection', features };
  }, [currentLocation, destination, nodesById]);

  const calibrationData = useMemo<FeatureCollection<Point, MarkerProperties>>(() => ({
    type: 'FeatureCollection',
    features: Object.entries(CAMPUS_CALIBRATION_POINTS).map(([key, point]) => ({
      type: 'Feature',
      properties: { id: key, name: point.name, kind: 'control' },
      geometry: { type: 'Point', coordinates: [point.geo.lon, point.geo.lat] },
    })),
  }), []);

  const routeData = useMemo<FeatureCollection<LineString>>(() => {
    const coordinates = isNavigating ? routeCoordinates(pathPoints) : [];
    return {
      type: 'FeatureCollection',
      features: coordinates.length > 1 ? [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates },
      }] : [],
    };
  }, [isNavigating, pathPoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const addSource = (id: string, data: FeatureCollection) => {
      if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data });
    };
    addSource('campus-nodes', nodeData);
    addSource('campus-edges', edgeData);
    addSource('campus-markers', markerData);
    addSource('campus-route', routeData);
    addSource('campus-calibration', calibrationData);
    if (!map.getLayer('campus-edges-line')) {
      map.addLayer({
        id: 'campus-edges-line', type: 'line', source: 'campus-edges',
        paint: { 'line-color': ['match', ['get', 'edgeType'], 'outdoor', '#0284c7', '#818cf8'], 'line-width': ['match', ['get', 'edgeType'], 'outdoor', 3, 1.5], 'line-opacity': 0.7, 'line-dasharray': [2, 1] },
      });
    }
    if (!map.getLayer('campus-nodes-circle')) {
      map.addLayer({
        id: 'campus-nodes-circle', type: 'circle', source: 'campus-nodes',
        paint: {
          'circle-radius': ['match', ['get', 'nodeType'], 'gate', 7, 'entrance', 5, 3.5],
          'circle-color': ['match', ['get', 'group'], 'ai', '#10b981', 'main', '#8b5cf6', '#0ea5e9'],
          'circle-stroke-color': '#f8fafc', 'circle-stroke-width': 1.5,
        },
      });
      map.addLayer({
        id: 'campus-nodes-label', type: 'symbol', source: 'campus-nodes', minzoom: 19,
        layout: { 'text-field': ['get', 'name'], 'text-size': 10, 'text-offset': [0, 1.15], 'text-anchor': 'top', 'text-optional': true },
        paint: { 'text-color': '#0f172a', 'text-halo-color': '#fff', 'text-halo-width': 1.3 },
      });
    }
    if (!map.getLayer('campus-route-line')) {
      map.addLayer({ id: 'campus-route-line', type: 'line', source: 'campus-route', paint: { 'line-color': '#f97316', 'line-width': 6, 'line-opacity': 0.95 } });
    }
    if (!map.getLayer('campus-route-points')) {
      map.addLayer({
        id: 'campus-route-points', type: 'circle', source: 'campus-markers',
        paint: { 'circle-radius': 8, 'circle-color': ['match', ['get', 'kind'], 'start', '#10b981', '#f97316'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
      });
      map.addLayer({
        id: 'campus-route-labels', type: 'symbol', source: 'campus-markers',
        layout: { 'text-field': ['get', 'name'], 'text-offset': [0, 1.2], 'text-size': 12, 'text-anchor': 'top' },
        paint: { 'text-color': '#0f172a', 'text-halo-color': '#fff', 'text-halo-width': 1.4 },
      });
    }
    if (!map.getLayer('campus-calibration-points')) {
      map.addLayer({
        id: 'campus-calibration-points', type: 'circle', source: 'campus-calibration',
        paint: { 'circle-radius': 6, 'circle-color': '#f97316', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
      });
      map.addLayer({
        id: 'campus-calibration-labels', type: 'symbol', source: 'campus-calibration',
        layout: { 'text-field': ['get', 'name'], 'text-offset': [0, 1.3], 'text-size': 11, 'text-anchor': 'top' },
        paint: { 'text-color': '#7c2d12', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
      });
    }
    (map.getSource('campus-nodes') as GeoJSONSource).setData(nodeData);
    (map.getSource('campus-edges') as GeoJSONSource).setData(edgeData);
    (map.getSource('campus-markers') as GeoJSONSource).setData(markerData);
    (map.getSource('campus-route') as GeoJSONSource).setData(routeData);
    (map.getSource('campus-calibration') as GeoJSONSource).setData(calibrationData);
    map.setLayoutProperty('campus-nodes-circle', 'visibility', showNodes ? 'visible' : 'none');
    map.setLayoutProperty('campus-nodes-label', 'visibility', showNodes ? 'visible' : 'none');
    map.setLayoutProperty('campus-edges-line', 'visibility', showEdges ? 'visible' : 'none');
    map.setLayoutProperty('google-campus-reference-layer', 'visibility', showGoogleReference ? 'visible' : 'none');
    map.setLayoutProperty('campus-3d-buildings', 'visibility', is3d ? 'visible' : 'none');
    map.setLayoutProperty('campus-svg-building-extrusion', 'visibility', is3d ? 'visible' : 'none');
    map.easeTo({ pitch: is3d ? 52 : 0, bearing: is3d ? -18 : 0, duration: 450 });
  }, [calibrationData, edgeData, is3d, mapReady, markerData, nodeData, routeData, showEdges, showGoogleReference, showNodes]);

  useEffect(() => {
    if (!simulatedNodeId) return;
    const node = nodesById.get(simulatedNodeId);
    if (!node) return;
    const gps = getNodeGps(node);
    mapRef.current?.easeTo({ center: [gps.lon, gps.lat], duration: 700 });
  }, [nodesById, simulatedNodeId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !isNavigating || !pathPoints || autoFitNonce == null) return;
    const coordinates = routeCoordinates(pathPoints);
    if (coordinates.length < 2) return;
    const bounds = coordinates.reduce(
      (current, coordinate) => current.extend(coordinate),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
    );
    map.fitBounds(bounds, { padding: 72, maxZoom: 19, duration: 650 });
  }, [autoFitNonce, isNavigating, mapReady, pathPoints]);

  const focusPoint = (point: CalibrationPointLike) => {
    mapRef.current?.flyTo({ center: [point.lon, point.lat], zoom: 19, duration: 650 });
  };

  const downloadGeoJson = () => {
    const nodeFeatures = nodeData.features;
    const edgeFeatures = edgeData.features;
    const controlFeatures = calibrationData.features;
    const collection: FeatureCollection & { metadata: Record<string, unknown> } = {
      type: 'FeatureCollection',
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        mappedEdges: edgeData.features.length,
        unresolvedEdges: unresolvedEdges.map(({ id, from_node, to_node, category }) => ({
          id: id || `${from_node}:${to_node}`,
          from_node,
          to_node,
          category,
        })),
      },
      features: [...nodeFeatures, ...edgeFeatures, ...controlFeatures],
    };
    const downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(collection, null, 2)], { type: 'application/geo+json' }));
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = `unimap-campus-${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  return (
    <div className="absolute inset-0 bg-[#dbe5ec]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-label="3D campus map with Google Maps reference overlay"
      />
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
        <button onClick={() => setShowGoogleReference((value) => !value)} aria-pressed={showGoogleReference} className={`rounded-xl border px-3 py-2 text-xs font-bold shadow-lg backdrop-blur ${showGoogleReference ? 'border-emerald-300/40 bg-slate-950/90 text-emerald-100' : 'border-slate-700 bg-slate-950/80 text-slate-300'}`}>
          <Layers className="mr-1 inline h-4 w-4" />Google reference
        </button>
        <button onClick={() => setShowNodes((value) => !value)} aria-pressed={showNodes} className={`rounded-xl border px-3 py-2 text-xs font-bold shadow-lg backdrop-blur ${showNodes ? 'border-cyan-300/40 bg-slate-950/90 text-cyan-100' : 'border-slate-700 bg-slate-950/80 text-slate-300'}`}>
          <Layers className="mr-1 inline h-4 w-4" />Nodes {nodes.length}
        </button>
        <button onClick={() => setShowEdges((value) => !value)} aria-pressed={showEdges} className={`rounded-xl border px-3 py-2 text-xs font-bold shadow-lg backdrop-blur ${showEdges ? 'border-blue-300/40 bg-slate-950/90 text-blue-100' : 'border-slate-700 bg-slate-950/80 text-slate-300'}`}>
          <Route className="mr-1 inline h-4 w-4" />Edges {edges.length}
        </button>
        <button onClick={() => setIs3d((value) => !value)} aria-pressed={is3d} className={`rounded-xl border px-3 py-2 text-xs font-bold shadow-lg backdrop-blur ${is3d ? 'border-orange-300/50 bg-orange-600/95 text-white' : 'border-slate-700 bg-slate-950/90 text-slate-100'}`}>
          <Box className="mr-1 inline h-4 w-4" />{is3d ? '3D buildings' : '2D map'}
        </button>
      </div>
      <div className="absolute right-14 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap justify-end gap-1.5">
        {Object.entries(CAMPUS_CALIBRATION_POINTS).map(([key, point]) => (
          <button key={key} onClick={() => focusPoint(point.geo)} title={point.name} className="rounded-xl border border-slate-700 bg-slate-950/90 px-2.5 py-2 text-[11px] font-bold text-slate-100 shadow-lg">
            {point.name.replace('Edge near mechanical workshop', 'Workshop').replace('New parking gate', 'Parking').replace(' gate', '')}
          </button>
        ))}
        <button onClick={() => mapRef.current?.flyTo({ center: CAMPUS_CENTER, zoom: 17.4, pitch: is3d ? 52 : 0, bearing: is3d ? -18 : 0 })} title="Recenter campus" className="rounded-xl border border-slate-700 bg-slate-950/90 p-2 text-slate-100 shadow-lg">
          <LocateFixed className="h-4 w-4" />
        </button>
        <button onClick={() => mapRef.current?.easeTo({ center: CAMPUS_CENTER, zoom: 17.4, pitch: is3d ? 52 : 0, bearing: is3d ? -18 : 0, duration: 450 })} title="Reset map" className="rounded-xl border border-slate-700 bg-slate-950/90 p-2 text-slate-100 shadow-lg">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button onClick={downloadGeoJson} title="Download all campus nodes and edges as GeoJSON" className="rounded-xl border border-slate-700 bg-slate-950/90 p-2 text-slate-100 shadow-lg">
          <Download className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-slate-950/90 px-3 py-2 text-[10px] font-medium text-slate-100 shadow-lg backdrop-blur">
        {nodes.length} nodes · {edgeData.features.length}/{edges.length} edges placed · Google reference / OpenStreetMap
        {unresolvedEdges.length > 0 && <span className="ml-2 text-amber-300">{unresolvedEdges.length} missing endpoint nodes</span>}
      </div>
    </div>
  );
}

interface CalibrationPointLike {
  lat: number;
  lon: number;
}

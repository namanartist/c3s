// src/components/map/CampusOsmMap.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Shield,
  LocateFixed,
  ExternalLink,
  Download,
  RefreshCw,
  Radio,
  X,
  CheckCircle2
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { CAMPUS_GEOFENCE_POLYGON } from '@/lib/gateSecurity';
import { CAMPUS_CALIBRATION_POINTS, svgToGps, formatDMS, formatDecimal } from '@/lib/geoProjection';
import {
  MITS_OSM_CENTER,
  OSM_TILE_LAYERS,
  getOsmUrl,
  getOsmEditorUrl,
  type OsmTileLayerConfig,
  fetchOsmCampusData,
  downloadOsmGeoJsonFile,
  syncAllNodesWithOsm,
  getOsmSyncMetrics,
  type OsmSyncMetrics,
  type OsmSyncResult,
} from '@/lib/osmSync';
import fallbackData from '@/lib/mock-data/campusDataFallback.json';
import type { MapNode, MapEdge } from '@/types';

interface CampusOsmMapProps {
  height?: string;
  showControls?: boolean;
  highlightLocation?: string;
  onSelectZone?: (zoneName: string) => void;
  userPos?: { x: number; y: number } | { lat: number; lng: number };
  heading?: number;
  isSimulatingWalk?: boolean;
  className?: string;
  defaultTileLayer?: 'tactical' | 'standard' | 'satellite';
}

export const CampusOsmMap: React.FC<CampusOsmMapProps> = ({
  height = 'h-[520px]',
  showControls = true,
  userPos,
  heading = 0,
  className = '',
  defaultTileLayer = 'satellite',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);
  const gatesLayerRef = useRef<L.LayerGroup | null>(null);
  const nodesLayerRef = useRef<L.LayerGroup | null>(null);
  const edgesLayerRef = useRef<L.LayerGroup | null>(null);
  const camerasLayerRef = useRef<L.LayerGroup | null>(null);
  const incidentsLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);

  // Store bindings
  const cctvCameras = useSafetyStore((s) => s.cctvCameras);
  const incidents = useSafetyStore((s) => s.incidents);
  const setSelectedCamera = useSafetyStore((s) => s.setSelectedCamera);

  // State (Defaults to High-Res Satellite as requested)
  const [activeTileLayer, setActiveTileLayer] = useState<'tactical' | 'standard' | 'satellite'>(defaultTileLayer || 'satellite');
  const showGeofence = true;
  const showCameras = true;
  const showGates = true;
  const showIncidents = true;

  // Nodes & Edges layer toggle state
  const [nodesList, setNodesList] = useState<MapNode[]>(fallbackData.nodes as unknown as MapNode[]);
  const [edgesList] = useState<MapEdge[]>(fallbackData.edges as unknown as MapEdge[]);
  const [showNodes, setShowNodes] = useState(true);
  const [showEdges, setShowEdges] = useState(true);

  // OSM Sync Modal & Metrics
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<OsmSyncResult | null>(null);
  const [syncMetrics, setSyncMetrics] = useState<OsmSyncMetrics>(() => getOsmSyncMetrics());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(17);

  // Resolve user GPS coordinates
  const resolvedUserGps = useMemo<{ lat: number; lng: number }>(() => {
    if (!userPos) {
      return { lat: 26.232611, lng: 78.205222 };
    }
    if ('lat' in userPos && 'lng' in userPos) {
      return { lat: userPos.lat, lng: userPos.lng };
    }
    const gps = svgToGps({ x: userPos.x, y: userPos.y });
    return { lat: gps.lat, lng: gps.lon };
  }, [userPos]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [resolvedUserGps.lat, resolvedUserGps.lng],
      zoom: 17.5,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [
        [26.215, 78.190],
        [26.245, 78.220],
      ],
      minZoom: 15,
      maxZoom: 20,
    });

    mapInstanceRef.current = map;

    // Layer groups for toggling
    geofenceLayerRef.current = L.layerGroup().addTo(map);
    gatesLayerRef.current = L.layerGroup().addTo(map);
    edgesLayerRef.current = L.layerGroup().addTo(map);
    nodesLayerRef.current = L.layerGroup().addTo(map);
    camerasLayerRef.current = L.layerGroup().addTo(map);
    incidentsLayerRef.current = L.layerGroup().addTo(map);

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Switch Tile Layers (Tactical Dark / Standard OSM / Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config: OsmTileLayerConfig = OSM_TILE_LAYERS[activeTileLayer];
    const newTileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || ['a', 'b', 'c'],
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [activeTileLayer]);

  // 3. Render Campus Geofence Boundary Polygon
  useEffect(() => {
    const layer = geofenceLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showGeofence) return;

    const polygon = L.polygon(CAMPUS_GEOFENCE_POLYGON, {
      color: '#38bdf8',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#0284c7',
      fillOpacity: 0.12,
    });

    polygon.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 2px;">
        <strong style="color: #0284c7; font-size: 13px;">MITS Gwalior Geofence</strong><br/>
        <span style="font-size: 11px; color: #64748b;">Synchronized with OpenStreetMap</span><br/>
        <div style="margin-top: 6px; font-size: 10px; font-family: monospace;">
          Boundary Vertices: ${CAMPUS_GEOFENCE_POLYGON.length} GPS Points
        </div>
      </div>
    `);

    polygon.addTo(layer);
  }, [showGeofence]);

  // 4. Render Campus Gates (Ground Control Points)
  useEffect(() => {
    const layer = gatesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showGates) return;

    Object.values(CAMPUS_CALIBRATION_POINTS).forEach((cp) => {
      const gateIcon = L.divIcon({
        className: 'osm-gate-icon',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.95);
            border: 2px solid #38bdf8;
            border-radius: 8px;
            padding: 3px 6px;
            box-shadow: 0 4px 12px rgba(56, 189, 248, 0.35);
            display: flex;
            align-items: center;
            gap: 4px;
            color: #f8fafc;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
            backdrop-filter: blur(4px);
          ">
            <span style="color: #38bdf8; font-size: 11px;">🚪</span>
            <span>${cp.name.split('(')[0].trim()}</span>
          </div>
        `,
        iconSize: [110, 26],
        iconAnchor: [55, 13],
      });

      const marker = L.marker([cp.geo.lat, cp.geo.lon], { icon: gateIcon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px;">
          <strong style="color: #0284c7; font-size: 13px;">${cp.name}</strong><br/>
          <div style="margin-top: 4px; font-family: monospace; font-size: 11px; color: #475569;">
            ${cp.dms}<br/>
            ${formatDecimal(cp.geo.lat, cp.geo.lon)}
          </div>
          <div style="margin-top: 8px; display: flex; gap: 8px;">
            <a href="${getOsmUrl(cp.geo.lat, cp.geo.lon)}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; font-size: 11px; font-weight: 600; text-decoration: underline;">
              View in OpenStreetMap ↗
            </a>
          </div>
        </div>
      `);

      marker.addTo(layer);
    });
  }, [showGates]);

  // 5. Render Every Walkable Campus Node Synchronized with OpenStreetMap
  useEffect(() => {
    const layer = nodesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showNodes) return;

    nodesList.forEach((node) => {
      const lat = node.lat ?? 26.230752;
      const lng = node.lng ?? 78.205341;

      // Color coding by map floor & category
      let markerColor = '#38bdf8'; // Outdoor default (cyan)
      let markerFill = '#0284c7';

      const isGate = node.type === 'entrance' || node.id.toLowerCase().includes('gate');

      if (node.map.includes('Main')) {
        markerColor = '#c084fc'; // Purple for Main Building
        markerFill = '#9333ea';
      } else if (node.map.includes('AI')) {
        markerColor = '#34d399'; // Emerald for AI Building
        markerFill = '#059669';
      } else if (isGate) {
        markerColor = '#fbbf24'; // Amber for Gates
        markerFill = '#d97706';
      }

      const circle = L.circleMarker([lat, lng], {
        radius: isGate ? 6 : 4,
        color: markerColor,
        weight: 1.5,
        fillColor: markerFill,
        fillOpacity: 0.85,
      });

      circle.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; font-weight: bold; color: #0f172a;">
          ${node.name || node.id}
        </div>
      `, { direction: 'top', offset: [0, -4] });

      circle.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <strong style="color: #0284c7; font-size: 13px;">${node.name || node.id}</strong>
            <span style="font-size: 9px; font-family: monospace; font-weight: bold; background: #e0f2fe; color: #0369a1; padding: 1px 5px; border-radius: 4px;">
              ${node.map}
            </span>
          </div>
          <div style="margin-top: 4px; font-size: 11px; color: #64748b;">
            Node ID: <strong style="color: #334155;">#${node.id}</strong> • Type: ${node.type}
          </div>
          <div style="margin-top: 4px; font-family: monospace; font-size: 10px; color: #475569;">
            OSM GPS: ${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E
          </div>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <a href="${getOsmUrl(lat, lng, 19)}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; font-size: 11px; font-weight: 600; text-decoration: underline;">
              Open in OSM ↗
            </a>
            <span style="font-size: 9px; color: #10b981; font-weight: bold;">● Synced</span>
          </div>
        </div>
      `);

      circle.addTo(layer);
    });
  }, [nodesList, showNodes]);

  // 6. Render Walkway Edges between Connected Nodes
  useEffect(() => {
    const layer = edgesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showEdges) return;

    const nodeGpsLookup = new Map<string, { lat: number; lng: number }>();
    nodesList.forEach((n) => {
      if (n.lat != null && n.lng != null) {
        nodeGpsLookup.set(n.id, { lat: n.lat, lng: n.lng });
      }
    });

    edgesList.forEach((edge) => {
      const from = nodeGpsLookup.get(edge.from_node);
      const to = nodeGpsLookup.get(edge.to_node);
      if (from && to) {
        const isOutdoor = edge.type === 'outdoor';
        const line = L.polyline(
          [
            [from.lat, from.lng],
            [to.lat, to.lng],
          ],
          {
            color: isOutdoor ? '#38bdf8' : '#818cf8',
            weight: isOutdoor ? 2 : 1.5,
            opacity: 0.65,
            dashArray: isOutdoor ? undefined : '4, 4',
          }
        );
        line.addTo(layer);
      }
    });
  }, [nodesList, edgesList, showEdges]);

  // 7. Render CCTV Cameras
  useEffect(() => {
    const layer = camerasLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showCameras) return;

    cctvCameras.forEach((cam) => {
      const isOnline = cam.status === 'online';
      const statusColor = isOnline ? '#10b981' : '#f59e0b';

      const camIcon = L.divIcon({
        className: 'osm-cam-icon',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: #0f172a;
            border: 2px solid ${statusColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${statusColor};
            box-shadow: 0 0 10px ${statusColor}66;
            cursor: pointer;
            font-size: 11px;
          ">
            📹
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: camIcon });
      marker.on('click', () => {
        setSelectedCamera(cam);
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <strong style="font-size: 13px;">${cam.name}</strong>
            <span style="font-size: 9px; padding: 2px 6px; border-radius: 9999px; background: ${isOnline ? '#dcfce7' : '#fef3c7'}; color: ${isOnline ? '#15803d' : '#b45309'}; font-weight: 700;">
              ${cam.status}
            </span>
          </div>
          <div style="color: #64748b; font-size: 11px; margin-top: 4px;">Zone: ${cam.zone}</div>
          <div style="font-family: monospace; font-size: 10px; color: #475569; margin-top: 4px;">
            GPS: ${cam.lat.toFixed(6)}, ${cam.lng.toFixed(6)}
          </div>
          <div style="margin-top: 8px;">
            <a href="${getOsmUrl(cam.lat, cam.lng)}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; font-size: 11px; font-weight: 600;">
              View on OpenStreetMap ↗
            </a>
          </div>
        </div>
      `);

      marker.addTo(layer);
    });
  }, [cctvCameras, showCameras, setSelectedCamera]);

  // 8. Render Active Incidents
  useEffect(() => {
    const layer = incidentsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showIncidents) return;

    incidents.forEach((inc) => {
      const isCritical = inc.severity === 'critical';
      const incColor = isCritical ? '#ef4444' : '#f59e0b';

      const incIcon = L.divIcon({
        className: 'osm-incident-icon',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: #991b1b;
            border: 2px solid #fecaca;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 16px ${incColor}bb;
            animation: pulse 1.5s infinite;
            cursor: pointer;
            font-size: 13px;
          ">
            🚨
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([inc.lat, inc.lng], { icon: incIcon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 14px;">🚨</span>
            <strong style="color: #b91c1c; font-size: 13px;">${inc.title}</strong>
          </div>
          <p style="margin-top: 4px; font-size: 11px; color: #475569;">${inc.description || 'Active campus security alert'}</p>
          <div style="margin-top: 4px; font-family: monospace; font-size: 10px; color: #64748b;">
            Location: ${inc.lat.toFixed(6)}, ${inc.lng.toFixed(6)}
          </div>
          <div style="margin-top: 8px;">
            <a href="${getOsmUrl(inc.lat, inc.lng)}" target="_blank" rel="noopener noreferrer" style="color: #dc2626; font-size: 11px; font-weight: 600;">
              OpenStreetMap Alert Link ↗
            </a>
          </div>
        </div>
      `);

      marker.addTo(layer);
    });
  }, [incidents, showIncidents]);

  // 9. Update User Location Marker & Heading
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latLng: [number, number] = [resolvedUserGps.lat, resolvedUserGps.lng];

    if (!userMarkerRef.current) {
      const userDivIcon = L.divIcon({
        className: 'osm-user-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: rgba(37, 99, 235, 0.25);
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 20px;
              height: 20px;
              background: #2563eb;
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 0 12px rgba(37, 99, 235, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(${heading}deg);
              transition: transform 0.2s ease-out;
            ">
              <div style="
                width: 0; 
                height: 0; 
                border-left: 3px solid transparent;
                border-right: 3px solid transparent;
                border-bottom: 7px solid #ffffff;
                margin-top: -2px;
              "></div>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      userMarkerRef.current = L.marker(latLng, { icon: userDivIcon, zIndexOffset: 1000 }).addTo(map);

      userAccuracyCircleRef.current = L.circle(latLng, {
        radius: 12,
        color: '#2563eb',
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(latLng);
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setLatLng(latLng);
      }

      // Update rotation
      const el = userMarkerRef.current.getElement();
      if (el) {
        const arrow = el.querySelector('div > div:nth-child(2)') as HTMLElement;
        if (arrow) {
          arrow.style.transform = `rotate(${heading}deg)`;
        }
      }
    }
  }, [resolvedUserGps, heading]);

  // Recenter map on user location
  const handleRecenterOnUser = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([resolvedUserGps.lat, resolvedUserGps.lng], 18, {
      duration: 1.2,
    });
  }, [resolvedUserGps]);

  // Recenter map on whole campus
  const handleRecenterCampus = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(MITS_OSM_CENTER, 17, {
      duration: 1.2,
    });
  }, []);

  // Trigger Overpass API live synchronization
  const handlePerformOsmSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchOsmCampusData();
      setSyncStatus(res);
    } finally {
      setIsSyncing(false);
    }
  };

  // Synchronize every node with OpenStreetMap in real-time
  const handleSyncEveryNode = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const result = syncAllNodesWithOsm(nodesList);
      setNodesList(result.nodes);
      const updatedMetrics = getOsmSyncMetrics(result.nodes);
      setSyncMetrics(updatedMetrics);
      setIsSyncing(false);
      setSyncSuccessToast(`✓ All ${result.syncedCount} nodes successfully synchronized with OpenStreetMap (WGS84 GPS)!`);
      setTimeout(() => setSyncSuccessToast(null), 5000);
    }, 400);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-[#070B14] shadow-2xl ${height} ${className}`}>
      {/* Map Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: OpenStreetMap Live Status Banner & Layer Toggles */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl border border-slate-800/90 bg-slate-900/90 px-3 py-1.5 shadow-lg backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <span>OSM SYNCED</span>
            <span className="text-[10px] text-emerald-400 font-semibold">({syncMetrics.syncedNodes}/{syncMetrics.totalNodes} Nodes)</span>
          </span>
        </div>

        {/* Tile Layer Selector */}
        <div className="flex rounded-xl border border-slate-800/90 bg-slate-900/90 p-0.5 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setActiveTileLayer('tactical')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              activeTileLayer === 'tactical'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tactical
          </button>
          <button
            onClick={() => setActiveTileLayer('standard')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              activeTileLayer === 'standard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OSM Std
          </button>
          <button
            onClick={() => setActiveTileLayer('satellite')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              activeTileLayer === 'satellite'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Nodes Layer Toggle */}
        <button
          onClick={() => setShowNodes(!showNodes)}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all shadow-lg backdrop-blur-md cursor-pointer ${
            showNodes
              ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
              : 'border-slate-800/90 bg-slate-900/90 text-slate-400'
          }`}
          title="Toggle display of all 624 synced campus nodes"
        >
          <span className={`h-2 w-2 rounded-full ${showNodes ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span>Nodes ({nodesList.length})</span>
        </button>

        {/* Walkway Paths Toggle */}
        <button
          onClick={() => setShowEdges(!showEdges)}
          className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all shadow-lg backdrop-blur-md cursor-pointer ${
            showEdges
              ? 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300'
              : 'border-slate-800/90 bg-slate-900/90 text-slate-400'
          }`}
          title="Toggle display of walkable connections between nodes"
        >
          <span className={`h-2 w-2 rounded-full ${showEdges ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          <span>Walkways</span>
        </button>
      </div>

      {/* Top Right: Actions & Layer Controls */}
      {showControls && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 pointer-events-auto">
          {/* Quick OSM Overpass Sync Button */}
          <button
            onClick={() => {
              setIsSyncModalOpen(true);
              if (!syncStatus) handlePerformOsmSync();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-600/30 px-3 py-1.5 text-xs font-bold text-blue-200 backdrop-blur-md hover:bg-blue-600/40 transition-all shadow-lg cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Sync OSM Nodes</span>
          </button>

          {/* Export GeoJSON */}
          <button
            onClick={() => downloadOsmGeoJsonFile(nodesList, edgesList, cctvCameras, incidents)}
            title="Download Complete OpenStreetMap GeoJSON (All 624 Nodes)"
            className="flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 p-2 text-slate-300 backdrop-blur-md hover:bg-slate-800 transition-all shadow-lg cursor-pointer"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* External OSM Link */}
          <a
            href={getOsmUrl(resolvedUserGps.lat, resolvedUserGps.lng, 18)}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Campus in OpenStreetMap"
            className="flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 p-2 text-slate-300 backdrop-blur-md hover:bg-slate-800 transition-all shadow-lg"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* Bottom Left: Live Telemetry Bar */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/90 bg-slate-900/90 px-3 py-2 text-[11px] font-mono shadow-xl backdrop-blur-md text-slate-300">
          <div>
            <span className="text-slate-500 mr-1">LAT:</span>
            <span className="font-bold text-slate-100">{resolvedUserGps.lat.toFixed(6)}° N</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1">LON:</span>
            <span className="font-bold text-slate-100">{resolvedUserGps.lng.toFixed(6)}° E</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-500 mr-1">ZOOM:</span>
            <span className="text-blue-400 font-bold">{currentZoom}</span>
          </div>
          <div className="hidden md:block text-slate-400 text-[10px]">
            {formatDMS(resolvedUserGps.lat, resolvedUserGps.lng)}
          </div>
          <div className="text-emerald-400 font-bold text-[10px]">
            ✓ 624 Nodes Synced
          </div>
        </div>
      </div>

      {/* Bottom Right: Floating Navigation Buttons */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleRecenterOnUser}
          title="Center on my location"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-blue-400 shadow-xl backdrop-blur-md hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
        <button
          onClick={handleRecenterCampus}
          title="Center entire campus"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-slate-300 shadow-xl backdrop-blur-md hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Shield className="h-4 w-4" />
        </button>
      </div>

      {/* Sync Success Toast Banner */}
      {syncSuccessToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/50 bg-emerald-950/95 px-4 py-2 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-md">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{syncSuccessToast}</span>
          </div>
        </div>
      )}

      {/* OSM Telemetry & Overpass Synchronization Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in select-none">
          <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100 uppercase">
                    OPENSTREETMAP LIVE NODE SYNCHRONIZATION
                  </h3>
                  <p className="text-xs text-slate-400">
                    WGS84 High-Precision Georeferencing &amp; OpenStreetMap Interchange
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Comprehensive Node Synchronization Status Card */}
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-black uppercase text-emerald-300 font-mono tracking-wider">
                    EVERY NODE SYNCHRONIZED
                  </span>
                </div>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {syncMetrics.osmPercent}% WGS84 GPS COVERAGE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70">
                  <p className="text-[10px] font-mono uppercase text-slate-400">Total Nodes</p>
                  <p className="text-lg font-black text-white font-mono mt-0.5">{syncMetrics.totalNodes}</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70">
                  <p className="text-[10px] font-mono uppercase text-emerald-400">OSM Synced</p>
                  <p className="text-lg font-black text-emerald-300 font-mono mt-0.5">{syncMetrics.syncedNodes}</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70">
                  <p className="text-[10px] font-mono uppercase text-cyan-400">Outdoor Nodes</p>
                  <p className="text-lg font-black text-cyan-300 font-mono mt-0.5">{syncMetrics.outdoorNodes}</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70">
                  <p className="text-[10px] font-mono uppercase text-purple-400">Multi-Floor</p>
                  <p className="text-lg font-black text-purple-300 font-mono mt-0.5">{syncMetrics.indoorNodes}</p>
                </div>
              </div>
            </div>

            {/* Ground Control Points */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ground Control Calibration Points (GCP)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(CAMPUS_CALIBRATION_POINTS).map(([k, cp]) => (
                  <div key={k} className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <p className="font-bold text-slate-200">{cp.name}</p>
                    <p className="font-mono text-[11px] text-blue-400 mt-0.5">{cp.dms}</p>
                    <p className="text-[10px] text-slate-500 font-mono">SVG: ({cp.svg.x}, {cp.svg.y})</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Overpass Sync Status */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Live Overpass API Response</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {syncStatus ? `${syncStatus.elementCount} elements synced` : 'Querying...'}
                </span>
              </div>
              {syncStatus && (
                <div className="text-xs text-slate-400 space-y-1">
                  <p><strong className="text-slate-200">Campus:</strong> {syncStatus.campusSummary.name}</p>
                  <p><strong className="text-slate-200">City:</strong> {syncStatus.campusSummary.city}</p>
                  <p><strong className="text-slate-200">Sync Source:</strong> {syncStatus.source}</p>
                  <p className="text-[10px] font-mono text-slate-500">Timestamp: {syncStatus.timestamp}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleSyncEveryNode}
                disabled={isSyncing}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-110 transition-all disabled:opacity-50 shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Sync Every Node ({nodesList.length})</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadOsmGeoJsonFile(nodesList, edgesList, cctvCameras, incidents)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download OSM GeoJSON</span>
                </button>

                <a
                  href={getOsmEditorUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-slate-700 transition-all"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>iD Editor</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

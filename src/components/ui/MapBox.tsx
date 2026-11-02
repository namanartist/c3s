// src/components/ui/MapBox.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ZoomIn, ZoomOut, RotateCcw, Building2, ChevronUp, Navigation, LocateFixed, Radio, ShieldCheck, Footprints, X, MapPin, Layers, Compass, Flame } from 'lucide-react';
import { useSpring, animated, to } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import type { FloorMap, Building, MapNode } from '@/types';
import MainCover from '@/assets/Main_Cover.webp';
import AICover from '@/assets/AI_Cover.webp';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { formatDMS, getOsmUrl } from '@/lib/geoProjection';
import { useSafetyStore } from '@/store/safetyStore';
import { SafetyThemeControls } from '@/components/safety/SafetyThemeControls';
import { IncidentCard } from '@/components/safety/IncidentCard';
import { SosModal } from '@/components/safety/SosModal';
import { ProctorMapOverlay } from '@/components/safety/ProctorMapOverlay';
import { GateMapOverlay } from '@/components/safety/GateMapOverlay';
import { CameraDetailModal } from '@/components/safety/CameraDetailModal';
import { NodeDetailDrawer } from '@/components/map/NodeDetailDrawer';
import { getMapLocationTags } from '@/lib/mapLabels';
import { CAMPUS_HEATMAP_ZONES, getHeatColor } from '@/lib/campusHeatmap';

interface Point {
  x: number;
  y: number;
}

interface SvgViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

interface Bbox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

const fallbackMapViewBoxes: Record<string, SvgViewBox> = {
  // Matches the currently published CampusMap_ehqegc.svg. The loaded SVG is
  // still authoritative, but this prevents a first-render alignment jump.
  Campus_Map: { minX: 0, minY: 0, width: 1092.2019, height: 670.0992 },
  Main_GF: { minX: 0, minY: 0, width: 848.4096, height: 609.5946 },
  Main_FF: { minX: 0, minY: 0, width: 696.4, height: 576.6927 },
  Main_SF: { minX: 0, minY: 0, width: 743.9135, height: 482.3806 },
  AI_GF: { minX: 0, minY: 0, width: 842, height: 595 },
  AI_FF: { minX: 0, minY: 0, width: 705.6, height: 283.32 },
  AI_SF: { minX: 0, minY: 0, width: 719.4, height: 220.32 },
  AI_TF: { minX: 0, minY: 0, width: 719.4, height: 220.32 },
};

/**
 * Extracts the source SVG coordinate system so overlays use the exact same
 * canvas as the map. This keeps all nodes aligned if a hosted floor map is
 * regenerated with a new viewBox.
 */
function parseSvgViewBox(svgContent: string): SvgViewBox | null {
  const match = svgContent.match(/<svg\b[^>]*\bviewBox\s*=\s*["']([^"']+)["']/i);
  if (!match) return null;

  const values = match[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number);

  if (
    values.length !== 4 ||
    values.some((value) => !Number.isFinite(value)) ||
    values[2] <= 0 ||
    values[3] <= 0
  ) {
    return null;
  }

  return {
    minX: values[0],
    minY: values[1],
    width: values[2],
    height: values[3],
  };
}

function parsePoints(pointsString: string): Point[] {
  if (!pointsString || typeof pointsString !== 'string') return [];
  return pointsString
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [xStr, yStr] = pair.split(',');
      const x = Number(xStr);
      const y = Number(yStr);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    })
    .filter((p): p is Point => p !== null);
}

function computeBbox(points: Point[]): Bbox | null {
  if (!points || points.length === 0) return null;
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

interface MapBoxProps {
  mapId: string | null;
  destination: any | null;
  currentLocation: any | null;
  isNavigating: boolean;
  pathPoints: string;
  autoFitNonce?: number | null;
  floors: FloorMap[];
  buildings: Building[];
  nodes: MapNode[];
  proctorMode: boolean;
  onMapChange?: (mapId: string) => void;
}

export default function MapBox({
  mapId,
  destination,
  currentLocation,
  isNavigating,
  pathPoints,
  autoFitNonce,
  floors,
  buildings,
  nodes,
  proctorMode,
  onMapChange,
}: MapBoxProps) {
  const prefersReducedMotion = useReducedMotion();
  const {
    isSimulating,
    simulatedNodeId,
    nodesMap,
    edges,
    compassHeading,
    userGpsCoords,
    userSvgCoords,
    isGpsActive,
    isOutsideCampus,
    gpsError,
    enableGps,
    disableGps,
    gpsAccuracy,
    handleCurrentLocationSelect,
    handleDestinationSelect,
  } = useCampusNavigation();

  // Galis & Rasta (Pathways and Nodes Network) State
  const [showGalisNetwork, setShowGalisNetwork] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedMapNode, setSelectedMapNode] = useState<MapNode | null>(null);

  const [canZoomIn, setCanZoomIn] = useState(true);
  const [canZoomOut, setCanZoomOut] = useState(true);
  const [isBuildingDropdownOpen, setIsBuildingDropdownOpen] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [svgViewBox, setSvgViewBox] = useState<SvgViewBox | null>(null);

  const [{ x, y, zoom }, springApi] = useSpring(() => ({
    x: 0,
    y: 0,
    zoom: 1,
    onChange: (result: any) => {
      const val = typeof result === 'object' && result !== null && 'value' in result ? result.value.zoom : undefined;
      if (typeof val === 'number') {
        const nextCanZoomIn = val < 5;
        const nextCanZoomOut = val > 0.5;
        setCanZoomIn((prev) => (prev !== nextCanZoomIn ? nextCanZoomIn : prev));
        setCanZoomOut((prev) => (prev !== nextCanZoomOut ? nextCanZoomOut : prev));
      }
    },
    config: { tension: 220, friction: 28 }
  }));

  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const getZoomTarget = useCallback((nextZ: number) => {
    const el = containerRef.current;
    if (!el) return { x: x.get(), y: y.get() };
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const currentZ = zoom.get();
    const currentX = x.get();
    const currentY = y.get();

    let mx = 0;
    let my = 0;

    const simulatedNode = isSimulating && simulatedNodeId ? nodesMap[simulatedNodeId] : null;
    const hasSimulated = simulatedNode && simulatedNode.map === mapId && simulatedNode.x !== undefined && simulatedNode.y !== undefined;
    const hasDest = destination && destination.map === mapId && destination.x !== undefined && destination.y !== undefined;
    const hasStart = currentLocation && currentLocation.map === mapId && currentLocation.x !== undefined && currentLocation.y !== undefined;

    if (hasSimulated) {
      mx = simulatedNode.x;
      my = simulatedNode.y;
    } else if (hasDest) {
      mx = destination.x;
      my = destination.y;
    } else if (hasStart) {
      mx = currentLocation.x;
      my = currentLocation.y;
    } else {
      mx = (cx - currentX) / currentZ;
      my = (cy - currentY) / currentZ;
    }

    const nextX = currentX - mx * (nextZ - currentZ);
    const nextY = currentY - my * (nextZ - currentZ);

    return { x: nextX, y: nextY };
  }, [x, y, zoom, destination, currentLocation, mapId, isSimulating, simulatedNodeId, nodesMap]);

  const handleZoomIn = useCallback(() => {
    const currentZ = zoom.get();
    const nextZ = Math.min(currentZ * 1.3, 5);
    const target = getZoomTarget(nextZ);
    console.log('Zooming In to:', target.x, target.y, nextZ);
    springApi.start({ x: target.x, y: target.y, zoom: nextZ, config: { tension: 180, friction: 26 } });
  }, [zoom, getZoomTarget, springApi]);

  const handleZoomOut = useCallback(() => {
    const currentZ = zoom.get();
    const nextZ = Math.max(currentZ / 1.3, 0.5);
    const target = getZoomTarget(nextZ);
    console.log('Zooming Out to:', target.x, target.y, nextZ);
    springApi.start({ x: target.x, y: target.y, zoom: nextZ, config: { tension: 180, friction: 26 } });
  }, [zoom, getZoomTarget, springApi]);

  const handleResetZoom = useCallback(() => {
    console.log('Resetting Zoom.');
    springApi.start({ x: 0, y: 0, zoom: 1 });
  }, [springApi]);

  const [autoFollowUser, setAutoFollowUser] = useState(false);

  const handleCenterOnStudent = useCallback(() => {
    if (!isGpsActive) {
      enableGps();
    }
    if (mapId !== 'Campus_Map' && onMapChange) {
      onMapChange('Campus_Map');
    }
    setAutoFollowUser(true);
    if (!userSvgCoords) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const targetZ = 2.2; // Auto-zoom in on current location
    springApi.start({
      x: cx - userSvgCoords.x * targetZ,
      y: cy - userSvgCoords.y * targetZ,
      zoom: targetZ,
      config: { tension: 180, friction: 26 },
    });
  }, [userSvgCoords, springApi, isGpsActive, enableGps, mapId, onMapChange]);

  // Smoothly auto-follow user position as they move when auto-follow is active
  useEffect(() => {
    if (!autoFollowUser || !userSvgCoords) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const currentZ = Math.max(1.8, zoom.get());
    springApi.start({
      x: cx - userSvgCoords.x * currentZ,
      y: cy - userSvgCoords.y * currentZ,
      config: { tension: 160, friction: 28 },
    });
  }, [autoFollowUser, userSvgCoords, springApi, zoom]);

  useEffect(() => {
    if (!isNavigating) {
      springApi.start({ x: 0, y: 0, zoom: 1 });
    }
  }, [mapId, isNavigating, springApi]);

  useGesture(
    {
      onDrag: ({ active, offset: [dx, dy], velocity: [vx, vy], direction: [dirX, dirY], pinching, touches }) => {
        if (pinching || touches > 1) return;
        if (active) {
          setAutoFollowUser(false);
          springApi.start({ x: dx, y: dy, immediate: true });
        } else {
          const speed = Math.sqrt(vx * vx + vy * vy);
          if (speed > 0.15) {
            const momentumScale = Math.min(250, speed * 150);
            const targetX = dx + dirX * momentumScale;
            const targetY = dy + dirY * momentumScale;
            springApi.start({
              x: targetX,
              y: targetY,
              immediate: false,
              config: { tension: 150, friction: 32, velocity: [vx * dirX, vy * dirY] }
            });
          } else {
            springApi.start({
              x: dx,
              y: dy,
              immediate: false,
              config: { tension: 180, friction: 26 }
            });
          }
        }
      },
      onPinch: ({ active, offset: [dScale], origin: [ox, oy], first, memo }) => {
        const el = containerRef.current;
        if (!el) return memo;
        const rect = el.getBoundingClientRect();

        if (first) {
          return {
            origin: [ox, oy],
            pan: [x.get(), y.get()],
            zoom: zoom.get(),
          };
        }

        const initialOriginX = memo?.origin?.[0] ?? ox;
        const initialOriginY = memo?.origin?.[1] ?? oy;
        const initialPanX = memo?.pan?.[0] ?? x.get();
        const initialPanY = memo?.pan?.[1] ?? y.get();
        const initialZoom = memo?.zoom ?? zoom.get();

        const nextZoom = Math.max(0.5, Math.min(5, dScale));

        const px = initialOriginX - rect.left;
        const py = initialOriginY - rect.top;

        const deltaOx = ox - initialOriginX;
        const deltaOy = oy - initialOriginY;

        const nextX = initialPanX + deltaOx - (px - initialPanX) * (nextZoom / Math.max(0.001, initialZoom) - 1);
        const nextY = initialPanY + deltaOy - (py - initialPanY) * (nextZoom / Math.max(0.001, initialZoom) - 1);

        springApi.start({
          x: nextX,
          y: nextY,
          zoom: nextZoom,
          immediate: active,
          config: { tension: 180, friction: 26 }
        });

        return memo;
      },
      onWheel: ({ event, delta: [, dy] }) => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          const el = containerRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const cx = event.clientX - rect.left;
          const cy = event.clientY - rect.top;

          const currentZ = zoom.get();
          const currentX = x.get();
          const currentY = y.get();

          const factor = dy > 0 ? 0.90 : 1.10;
          const nextZoom = Math.max(0.5, Math.min(5, currentZ * factor));

          const mx = (cx - currentX) / currentZ;
          const my = (cy - currentY) / currentZ;

          const nextX = currentX - mx * (nextZoom - currentZ);
          const nextY = currentY - my * (nextZoom - currentZ);

          springApi.start({
            x: nextX,
            y: nextY,
            zoom: nextZoom,
            immediate: false,
            config: { tension: 180, friction: 26 }
          });
        }
      }
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
      drag: {
        from: () => [x.get(), y.get()],
        filterTaps: true,
      },
      pinch: {
        from: () => [zoom.get(), 0],
        scaleBounds: { min: 0.5, max: 5 },
      }
    }
  );

  const lastAutoFitRef = useRef<number | null | undefined>(null);

  const showFloorPlan = !!mapId;
  const shouldShowDestination = !!destination && destination.map === mapId;
  const shouldShowCurrentLocation = !isSimulating && !!currentLocation && currentLocation.map === mapId;

  // Springs to animate pin entry scaling without causing React component re-renders
  const destSpring = useSpring({
    scale: shouldShowDestination ? 1 : 0,
    config: { tension: 300, friction: 20 }
  });

  const currentLocSpring = useSpring({
    scale: shouldShowCurrentLocation ? 1 : 0,
    config: { tension: 300, friction: 20 }
  });

  // Active map nodes & edges for Galis & Rasta network
  const currentMapNodes = useMemo(() => {
    if (!mapId) return [];
    return nodes.filter((n) => n.map === mapId);
  }, [nodes, mapId]);

  // Dynamic Zoom-Responsive Location Tags (Uncluttered LOD + Spread Expansion)
  const mapLocationTags = useMemo(() => {
    return getMapLocationTags(nodes, mapId);
  }, [nodes, mapId]);

  const currentMapEdges = useMemo(() => {
    if (!mapId) return [];
    const edgeList: Array<{ id: string; x1: number; y1: number; x2: number; y2: number; type?: string }> = [];
    edges.forEach((edge, idx) => {
      const fromNode = nodesMap[edge.from_node];
      const toNode = nodesMap[edge.to_node];
      if (fromNode && toNode && fromNode.map === mapId && toNode.map === mapId) {
        edgeList.push({
          id: `edge_${idx}_${edge.from_node}_${edge.to_node}`,
          x1: fromNode.x,
          y1: fromNode.y,
          x2: toNode.x,
          y2: toNode.y,
          type: edge.type,
        });
      }
    });
    return edgeList;
  }, [edges, nodesMap, mapId]);

  const activeTheme = useSafetyStore((s) => s.activeTheme);
  const is3dMode = useSafetyStore((s) => s.is3dMode);
  const pitch = useSafetyStore((s) => s.pitch);
  const incidents = useSafetyStore((s) => s.incidents);
  const selectedIncident = useSafetyStore((s) => s.selectedIncident);
  const setSelectedIncident = useSafetyStore((s) => s.setSelectedIncident);
  const safetyAmenities = useSafetyStore((s) => s.safetyAmenities);
  const showSafetyAmenities = useSafetyStore((s) => s.showSafetyAmenities);
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);
  const cctvCameras = useSafetyStore((s) => s.cctvCameras);
  const setSelectedCamera = useSafetyStore((s) => s.setSelectedCamera);
  const activeDashboard = useSafetyStore((s) => s.activeDashboard);
  const selectedNodeForDetail = useSafetyStore((s) => s.selectedNodeForDetail);
  const setSelectedNodeForDetail = useSafetyStore((s) => s.setSelectedNodeForDetail);
  const advanceResponderStatus = useSafetyStore((s) => s.advanceResponderStatus);

  const activeMapIncidents = useMemo(() => {
    return incidents.filter((i) => {
      if (i.map !== mapId) return false;
      if (i.status === 'resolved') return false;
      // Always show if it's the active destination or selected incident
      if (destination?.incidentId === i.id || destination?.isIncident || selectedIncident?.id === i.id) return true;
      // Show for security/proctor roles or SOC dashboard mode
      if (proctorMode || activeDashboard !== 'nav') return true;
      // Hide unrelated incidents from non-proctor public users
      return false;
    });
  }, [incidents, mapId, activeDashboard, proctorMode, destination, selectedIncident]);

  const activeMapAmenities = useMemo(() => {
    return showSafetyAmenities ? safetyAmenities.filter((a) => a.map === mapId) : [];
  }, [safetyAmenities, mapId, showSafetyAmenities]);

  const activeMapCameras = useMemo(() => {
    return (showSafetyAmenities || activeDashboard === 'soc')
      ? cctvCameras.filter((c) => c.map === mapId)
      : [];
  }, [cctvCameras, mapId, showSafetyAmenities, activeDashboard]);

  // Clickable interactive nodes for "Open Node" feature
  const activeMapNodes = useMemo(() => {
    return nodes.filter(
      (n) => n.map === mapId && (n.type === 'room' || (n.type as string) === 'entry' || (n.type as string) === 'stairs')
    );
  }, [nodes, mapId]);

  // Dispatched & En Route Responders on this map
  const activeEnRouteResponders = useMemo(() => {
    return incidents
      .filter((inc) => inc.map === mapId && inc.status === 'responding' && inc.responderStatus === 'enroute')
      .map((inc) => {
        const respNode = inc.responderNodeId ? nodesMap[inc.responderNodeId] : null;
        const fromX = respNode?.x ?? (inc.x > 500 ? inc.x - 180 : inc.x + 180);
        const fromY = respNode?.y ?? (inc.y > 300 ? inc.y - 120 : inc.y + 120);
        return {
          incidentId: inc.id,
          title: inc.title,
          responderName: inc.responderAssigned || 'QRF Tactical Unit',
          fromX,
          fromY,
          toX: inc.x,
          toY: inc.y,
          eta: inc.responderEta || '2 mins',
        };
      });
  }, [incidents, mapId, nodesMap]);

  // Resolve Map SVG URL: Prefer local offline /maps/${mapId}.svg first!
  const mapSrc = useMemo(() => {
    if (!mapId) return '';
    const floorMeta = floors.find((f) => f.map === mapId);
    if (floorMeta?.svgUrl && !floorMeta.svgUrl.includes('cloudinary.com')) {
      return floorMeta.svgUrl;
    }
    return `/maps/${mapId}.svg`;
  }, [mapId, floors]);

  useEffect(() => {
    if (!mapSrc) {
      setSvgContent('');
      setSvgViewBox(null);
      return;
    }

    let isCurrentRequest = true;

    fetch(mapSrc)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!isCurrentRequest) return;
        if (!text.includes('<svg')) throw new Error('Not an SVG response');
        setSvgContent(text);
        setSvgViewBox(parseSvgViewBox(text));
      })
      .catch((err) => {
        console.warn(`Primary SVG fetch from ${mapSrc} failed, falling back to local /maps/${mapId}.svg:`, err);
        fetch(`/maps/${mapId}.svg`)
          .then((res) => res.text())
          .then((text) => {
            if (!isCurrentRequest) return;
            if (text.includes('<svg')) {
              setSvgContent(text);
              setSvgViewBox(parseSvgViewBox(text));
            }
          })
          .catch((localErr) => console.error('Local SVG map fallback failed:', localErr));
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [mapSrc, mapId]);

  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (svgEl) {
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
      svgEl.setAttribute('width', '100%');
      svgEl.setAttribute('height', '100%');
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svgEl.setAttribute('shape-rendering', 'geometricPrecision');
      svgEl.setAttribute('text-rendering', 'geometricPrecision');
      svgEl.setAttribute('image-rendering', 'crisp-edges');
      svgEl.style.removeProperty('backface-visibility');
      svgEl.style.removeProperty('-webkit-backface-visibility');

      const elements = svgEl.querySelectorAll('path, line, polyline, rect, polygon, circle');
      elements.forEach((el) => {
        el.setAttribute('shape-rendering', 'geometricPrecision');
      });

      const textEls = svgEl.querySelectorAll('text, tspan');
      textEls.forEach((el) => {
        el.setAttribute('text-rendering', 'geometricPrecision');
        el.setAttribute('shape-rendering', 'geometricPrecision');
      });
    }
  }, [svgContent]);

  const viewBoxConfig =
    svgViewBox ??
    (mapId ? fallbackMapViewBoxes[mapId] : null) ??
    fallbackMapViewBoxes.Main_GF;
  const svgMinX = viewBoxConfig.minX;
  const svgMinY = viewBoxConfig.minY;
  const svgWidth = viewBoxConfig.width;
  const svgHeight = viewBoxConfig.height;

  const pathBbox = useMemo(() => {
    if (!pathPoints) return null;
    const pts = parsePoints(pathPoints);
    return computeBbox(pts);
  }, [pathPoints]);

  const lastNavigationFitKeyRef = useRef<string>('');

  // Auto-focus and zoom closely in on the current node and active path when navigation starts
  useEffect(() => {
    if (!isNavigating) {
      lastNavigationFitKeyRef.current = '';
      return;
    }

    const currentFitKey = `${autoFitNonce}_${mapId}_${currentLocation?.id || ''}_${destination?.id || ''}_${pathPoints.slice(0, 40)}`;
    if (lastNavigationFitKeyRef.current === currentFitKey) return;

    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (!(w > 0 && h > 0)) return;

    const baseScale = Math.min(w / svgWidth, h / svgHeight) || 1;
    const offsetX = (w - svgWidth * baseScale) / 2;
    const offsetY = (h - svgHeight * baseScale) / 2;

    const isDesktop = w >= 768;
    const pad = Math.max(30, Math.min(w, h) * 0.08);
    const availW = isDesktop ? Math.max(1, w - 410 - 2 * pad) : Math.max(1, w - 2 * pad);
    const availH = Math.max(1, h - 2 * pad);
    const cx = isDesktop ? (w + 410) / 2 : w / 2;
    const cy = h / 2;

    const pts = parsePoints(pathPoints);
    const hasCurrentNode = currentLocation && currentLocation.map === mapId && currentLocation.x !== undefined && currentLocation.y !== undefined;

    // Focus on current node and the initial path leading out
    let focusBbox: Bbox | null = null;
    if (hasCurrentNode && pts.length > 0) {
      // Current node + the next 4 path waypoints
      const leadingPoints: Point[] = [
        { x: currentLocation.x, y: currentLocation.y },
        ...pts.slice(0, Math.min(5, pts.length))
      ];
      focusBbox = computeBbox(leadingPoints);
    } else if (hasCurrentNode) {
      // Just the current node with a focused boundary box
      focusBbox = {
        minX: currentLocation.x - 30,
        maxX: currentLocation.x + 30,
        minY: currentLocation.y - 30,
        maxY: currentLocation.y + 30,
        width: 60,
        height: 60,
      };
    } else if (pts.length > 0) {
      // Start of path + leading 5 points
      const leadingPoints = pts.slice(0, Math.min(6, pts.length));
      focusBbox = computeBbox(leadingPoints);
    } else if (pathBbox) {
      focusBbox = pathBbox;
    }

    if (!focusBbox) return;

    const minX = (focusBbox.minX - svgMinX) * baseScale + offsetX;
    const maxX = (focusBbox.maxX - svgMinX) * baseScale + offsetX;
    const minY = (focusBbox.minY - svgMinY) * baseScale + offsetY;
    const maxY = (focusBbox.maxY - svgMinY) * baseScale + offsetY;

    const bboxW = Math.max(20, maxX - minX);
    const bboxH = Math.max(20, maxY - minY);

    // Zoom closely in on the current node and path (tactical navigation zoom: 1.85x to 3.2x)
    const fitZoom = Math.min(availW / bboxW, availH / bboxH);
    const nextZoom = Math.max(1.85, Math.min(3.2, fitZoom));

    const bboxCenterX = (minX + maxX) / 2;
    const bboxCenterY = (minY + maxY) / 2;

    const nextPanX = cx - bboxCenterX * nextZoom;
    const nextPanY = cy - bboxCenterY * nextZoom;

    lastNavigationFitKeyRef.current = currentFitKey;
    lastAutoFitRef.current = autoFitNonce;
    springApi.start({
      x: nextPanX,
      y: nextPanY,
      zoom: nextZoom,
      config: { tension: 170, friction: 26 }
    });
  }, [autoFitNonce, isNavigating, pathPoints, pathBbox, currentLocation, destination, mapId, svgMinX, svgMinY, svgHeight, svgWidth, springApi]);

  // Camera pans to follow the simulated node during simulation!
  useEffect(() => {
    if (!isSimulating || !simulatedNodeId || !nodesMap) return;
    const node = nodesMap[simulatedNodeId];
    if (!node || node.map !== mapId) return;

    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (!(w > 0 && h > 0)) return;

    const baseScale = Math.min(w / svgWidth, h / svgHeight) || 1;
    const offsetX = (w - svgWidth * baseScale) / 2;
    const offsetY = (h - svgHeight * baseScale) / 2;

    const nodeViewportX = (node.x - svgMinX) * baseScale + offsetX;
    const nodeViewportY = (node.y - svgMinY) * baseScale + offsetY;

    const isDesktop = w >= 768;
    const cx = isDesktop ? (w + 410) / 2 : w / 2;
    const cy = h / 2;

    const currentZoom = zoom.get();
    const nextPanX = cx - nodeViewportX * currentZoom;
    const nextPanY = cy - nodeViewportY * currentZoom;

    springApi.start({ x: nextPanX, y: nextPanY });
  }, [simulatedNodeId, isSimulating, mapId, nodesMap, svgMinX, svgMinY, svgWidth, svgHeight, springApi]);

  const simulatedNode = useMemo(() => {
    if (!isSimulating || !simulatedNodeId || !nodesMap) return null;
    return nodesMap[simulatedNodeId] || null;
  }, [isSimulating, simulatedNodeId, nodesMap]);

  // Resolve current building floors
  const activeFloorMeta = useMemo(() => floors.find((f) => f.map === mapId), [floors, mapId]);
  const activeBuildingId = activeFloorMeta?.building || null;

  const activeBuildingName = useMemo(() => {
    if (mapId === 'Campus_Map') return 'Campus Map';
    const b = buildings.find((x) => x.id === activeBuildingId);
    return b ? b.name : 'Campus Map';
  }, [mapId, buildings, activeBuildingId]);

  const buildingFloors = useMemo(() => {
    if (!activeBuildingId || activeBuildingId === 'campus') return [];
    return floors
      .filter((f) => f.building === activeBuildingId)
      .sort((a, b) => a.floor - b.floor);
  }, [floors, activeBuildingId]);

  const handleSelectBuilding = useCallback(
    (buildingId: string | 'campus') => {
      setIsBuildingDropdownOpen(false);
      if (buildingId === 'campus') {
        onMapChange?.('Campus_Map');
      } else {
        const bFloors = floors.filter((f) => f.building === buildingId).sort((a, b) => a.floor - b.floor);
        if (bFloors.length > 0) {
          onMapChange?.(bFloors[0].map);
        }
      }
    },
    [floors, onMapChange]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full relative"
    >
      <div
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden touch-none transition-colors duration-500 ${activeTheme === 'dark'
            ? 'bg-[#0b0f19]'
            : activeTheme === 'satellite'
              ? 'bg-[#152317]'
              : activeTheme === 'safety'
                ? 'bg-[#0f172a]'
                : activeTheme === '3d'
                  ? 'bg-[#f4f1ea]'
                  : 'bg-[#fcfaf6]'
          }`}
        style={{
          perspective: is3dMode || activeTheme === '3d' ? '1200px' : undefined,
          perspectiveOrigin: '50% 50%'
        }}
      >
        {showFloorPlan && mapSrc ? (
          <animated.div
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none z-0"
            style={{
              transform: to([x, y, zoom], (px, py, z) => {
                if (is3dMode || activeTheme === '3d') {
                  return `perspective(1200px) rotateX(${pitch || 42}deg) translate(${px}px, ${py}px) scale(${z})`;
                }
                return `translate(${px}px, ${py}px) scale(${z})`;
              }),
              transformOrigin: '50% 50%',
              imageRendering: 'crisp-edges',
              filter:
                activeTheme === 'dark'
                  ? 'invert(0.9) hue-rotate(180deg) contrast(1.15) brightness(1.05)'
                  : activeTheme === 'safety'
                    ? 'invert(0.8) hue-rotate(160deg) contrast(1.15)'
                    : undefined,
              transition: 'filter 0.3s ease'
            }}
          >
            <div className="relative w-full h-full">
              {svgContent ? (
                <div
                  ref={svgContainerRef}
                  className="w-full h-full pointer-events-none select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  Loading Map...
                </div>
              )}

              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox={`${svgMinX} ${svgMinY} ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="xMidYMid meet"
                style={{
                  mixBlendMode: 'normal',
                  shapeRendering: 'geometricPrecision',
                  textRendering: 'geometricPrecision',
                  imageRendering: 'crisp-edges',
                }}
              >
                <defs>
                  <radialGradient id="compassBeamGradient" cx="50%" cy="100%" r="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {proctorMode && <ProctorMapOverlay nodes={nodes} mapId={mapId} zoom={zoom} />}
                <GateMapOverlay mapId={mapId} zoom={zoom} />

                {/* Real-Time Campus Headmap / Density Heatmap Overlay */}
                {showHeatmap && mapId === 'Campus_Map' && (
                  <g className="campus-headmap-overlay pointer-events-none">
                    {CAMPUS_HEATMAP_ZONES.map((zone) => {
                      const colors = getHeatColor(zone.density);
                      return (
                        <g key={zone.id}>
                          {/* Ambient Dispersion Glow */}
                          <circle
                            cx={zone.x}
                            cy={zone.y}
                            r={zone.radius * 1.4}
                            fill={colors.glow}
                            className="animate-pulse"
                            style={{ animationDuration: '3s' }}
                          />
                          {/* Intense Density Core */}
                          <circle
                            cx={zone.x}
                            cy={zone.y}
                            r={zone.radius * 0.75}
                            fill={colors.fill}
                            stroke={colors.border}
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          {/* Headcount Beacon */}
                          <circle cx={zone.x} cy={zone.y} r="10" fill="#0f172a" stroke={colors.primary} strokeWidth="2" />
                          <text x={zone.x} y={zone.y + 3.5} fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                            {zone.headcount}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* SVG Galis & Rasta (Pathways and Pedestrian Corridors) Network */}
                {showGalisNetwork && (
                  <g className="galis-rasta-network pointer-events-none">
                    {/* Galis & Rasta Vector Edge Segments */}
                    {currentMapEdges.map((edge) => (
                      <line
                        key={edge.id}
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        stroke={
                          edge.type === 'staircase' || edge.type === 'elevator'
                            ? '#a855f7'
                            : edge.type === 'entry_to_entry'
                            ? '#10b981'
                            : '#38bdf8'
                        }
                        strokeWidth="1.6"
                        strokeDasharray={edge.type === 'entry_to_entry' ? '4 3' : '3 3'}
                        opacity={0.4}
                        strokeLinecap="round"
                      />
                    ))}

                    {/* Interactive Walkable Waypoints & Landmark Nodes */}
                    {currentMapNodes.map((n) => {
                      const isSelected = selectedMapNode?.id === n.id;
                      const isStart = currentLocation?.id === n.id;
                      const isDest = destination?.id === n.id;
                      const isHighlighted = isSelected || isStart || isDest;
                      const isGaliOrCorridor = n.category === 'corridor' || n.category === 'pathway' || n.category === 'entry';
                      const isStairs = n.category === 'stairs' || n.category === 'lift';

                      return (
                        <animated.g
                          key={`gali_node_${n.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMapNode(n);
                          }}
                          className="pointer-events-auto cursor-pointer"
                          style={{
                            transform: to([zoom], (z) => `translate(${n.x}px, ${n.y}px) scale(${1 / z})`),
                          }}
                        >
                          {/* Pulsing ring on selected/active node */}
                          {isHighlighted && (
                            <circle
                              cx="0"
                              cy="0"
                              r={16}
                              fill="none"
                              stroke={isStart ? '#10b981' : isDest ? '#f97316' : '#38bdf8'}
                              strokeWidth="2"
                              strokeDasharray="4 2"
                              opacity={0.8}
                            />
                          )}
                          <circle
                            cx="0"
                            cy="0"
                            r={isHighlighted ? 7 : isGaliOrCorridor ? 4.5 : isStairs ? 4.5 : 3.5}
                            fill={
                              isStart
                                ? '#10b981'
                                : isDest
                                ? '#f97316'
                                : isSelected
                                ? '#38bdf8'
                                : isStairs
                                ? '#a855f7'
                                : isGaliOrCorridor
                                ? '#0284c7'
                                : '#64748b'
                            }
                            stroke="#ffffff"
                            strokeWidth={isHighlighted ? 2 : 1}
                            opacity={isHighlighted ? 1 : 0.75}
                          />
                        </animated.g>
                      );
                    })}
                  </g>
                )}
                {(isNavigating || (currentLocation && destination)) && pathPoints && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <polyline
                      points={pathPoints}
                      stroke="#ff602e"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.2}
                    />
                    {prefersReducedMotion ? (
                      <polyline
                        points={pathPoints}
                        stroke="#ff602e"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : (
                      <motion.polyline
                        points={pathPoints}
                        stroke="#ff602e"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                  </motion.g>
                )}

                {/* Dynamic Zoom-Responsive Location Tags (Uncluttered LOD + Spread Expansion) */}
                {mapLocationTags.map((tag) => {
                  const isStart = currentLocation?.id === tag.id;
                  const isDest = destination?.id === tag.id;
                  const isSelected = selectedMapNode?.id === tag.id;
                  const isPriority = isStart || isDest || isSelected;

                  const pillWidth = Math.max(46, Math.min(94, tag.shortLabel.length * 5.6 + 20));
                  const halfW = pillWidth / 2;

                  return (
                    <animated.g
                      key={`loc_tag_${tag.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMapNode(tag.node);
                        setSelectedNodeForDetail(tag.node);
                      }}
                      className="pointer-events-auto cursor-pointer group"
                      style={{
                        transform: to([zoom], (z) => {
                          if (!isPriority) {
                            if (tag.tier === 2 && z < 1.25) return 'scale(0)';
                            if (tag.tier === 3 && z < 2.0) return 'scale(0)';
                          }

                          // Dynamic Distance Expansion on Zoom:
                          const spreadFactor = Math.max(0, z - 1) * 8.5;
                          const currentX = tag.x + tag.spreadX * spreadFactor;
                          const currentY = tag.y + tag.spreadY * spreadFactor;

                          const scale = isPriority
                            ? 1.05 / Math.pow(z, 0.35)
                            : Math.min(1.0, Math.max(0.65, 1 / Math.pow(z, 0.42)));

                          return `translate(${currentX}px, ${currentY}px) scale(${scale})`;
                        }),
                      }}
                    >
                      {/* Highlighted Pulse Ring */}
                      {isPriority && (
                        <circle
                          cx="0"
                          cy="0"
                          r={halfW + 5}
                          fill="none"
                          stroke={isStart ? '#10b981' : isDest ? '#f97316' : '#3b82f6'}
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          opacity={0.8}
                        />
                      )}

                      {/* Pill Badge Container */}
                      <g transform="translate(0, -6)">
                        {/* Soft Drop Shadow */}
                        <rect
                          x={-halfW}
                          y="-10"
                          width={pillWidth}
                          height="20"
                          rx="10"
                          fill="#0F172A"
                          opacity="0.14"
                          transform="translate(0, 1.5)"
                        />
                        {/* Capsule Background */}
                        <rect
                          x={-halfW}
                          y="-10"
                          width={pillWidth}
                          height="20"
                          rx="10"
                          fill={isPriority ? (isStart ? '#065F46' : isDest ? '#9A3412' : '#0F172A') : tag.bg}
                          stroke={isPriority ? '#FFFFFF' : tag.border}
                          strokeWidth={isPriority ? 1.8 : 1.2}
                        />
                        {/* Category Indicator Dot */}
                        <circle
                          cx={-halfW + 8}
                          cy="0"
                          r="2.8"
                          fill={isPriority ? '#FFFFFF' : tag.color}
                        />
                        {/* Label text */}
                        <text
                          x={-halfW + 15}
                          y="2.8"
                          fill={isPriority ? '#FFFFFF' : tag.textColor}
                          fontSize="7.5"
                          fontWeight="800"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          letterSpacing="0.2"
                          className="select-none pointer-events-none"
                        >
                          {tag.shortLabel}
                        </text>
                      </g>
                    </animated.g>
                  );
                })}

                {shouldShowDestination && destination.x !== undefined && destination.y !== undefined && (
                  <animated.g
                    style={{
                      transform: to([zoom, destSpring.scale], (z, s) => `translate(${destination.x}px, ${destination.y}px) scale(${s / z})`),
                    }}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r={destination.isIncident ? 14 : 8}
                      fill={destination.isIncident ? "#ef4444" : "#ff602e"}
                      opacity="0.3"
                    />
                    {!prefersReducedMotion ? (
                      <motion.circle
                        cx="0"
                        cy="0"
                        r={destination.isIncident ? 14 : 8}
                        fill={destination.isIncident ? "#ef4444" : "#ff602e"}
                        opacity="0.3"
                        animate={{
                          scale: destination.isIncident ? [1, 2.5, 1] : [1, 2, 1],
                          opacity: destination.isIncident ? [0.6, 0, 0.6] : [0.3, 0, 0.3]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: destination.isIncident ? 1.2 : 2
                        }}
                      />
                    ) : null}
                    <circle
                      cx="0"
                      cy="0"
                      r={destination.isIncident ? 5 : 3}
                      fill={destination.isIncident ? "#dc2626" : "#ff602e"}
                    />
                    <text
                      x="0"
                      y="-18"
                      textAnchor="middle"
                      fontSize="10"
                      fill={destination.isIncident ? "#dc2626" : "#7c2d12"}
                      fontWeight="bold"
                      className="pointer-events-auto select-none"
                    >
                      {destination.name}
                    </text>
                  </animated.g>
                )}

                {shouldShowCurrentLocation && currentLocation.x !== undefined && currentLocation.y !== undefined && (
                  <animated.g
                    style={{
                      transform: to([zoom, currentLocSpring.scale], (z, s) => `translate(${currentLocation.x}px, ${currentLocation.y}px) scale(${s / z})`),
                    }}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="8"
                      fill="#10b981"
                      opacity="0.3"
                    />
                    {!prefersReducedMotion ? (
                      <motion.circle
                        cx="0"
                        cy="0"
                        r="8"
                        fill="#10b981"
                        opacity="0.3"
                        animate={{
                          scale: [1, 2, 1],
                          opacity: [0.3, 0, 0.3]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5
                        }}
                      />
                    ) : null}
                    <circle
                      cx="0"
                      cy="0"
                      r="3"
                      fill="#10b981"
                    />
                    <text
                      x="0"
                      y="-18"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#059669"
                      fontWeight="bold"
                      className="pointer-events-auto select-none"
                    >
                      You are here
                    </text>
                  </animated.g>
                )}

                {/* High-Precision Apple/Google Maps Location Puck */}
                {userSvgCoords && (mapId === 'Campus_Map' || (currentLocation && currentLocation.map === mapId)) && (
                  <animated.g
                    style={{
                      transform: to([zoom], (z) => `translate(${userSvgCoords.x}px, ${userSvgCoords.y}px) scale(${1 / z})`),
                    }}
                  >
                    {/* GPS Accuracy Halo Circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r={Math.min(65, Math.max(12, (gpsAccuracy ?? 5) * 2))}
                      fill="#38bdf8"
                      opacity="0.14"
                      stroke="#0284c7"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                    />
                    {/* Animated Pulsing Ring */}
                    {!prefersReducedMotion && (
                      <motion.circle
                        cx="0"
                        cy="0"
                        r="16"
                        fill="#38bdf8"
                        animate={{ scale: [0.8, 1.8, 0.8], opacity: [0.35, 0, 0.35] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      />
                    )}
                    {/* Directional Heading Cone (Flashlight Beam) */}
                    <g transform={`rotate(${compassHeading || 0})`}>
                      <path
                        d="M 0 0 L -16 -34 A 38 38 0 0 1 16 -34 Z"
                        fill="url(#compassBeamGradient)"
                      />
                    </g>
                    {/* Central High-Precision Blue Puck */}
                    <circle cx="0" cy="0" r="7.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                    <circle cx="0" cy="0" r="3" fill="#ffffff" />
                    <text
                      x="0"
                      y="17"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#0369a1"
                      fontWeight="bold"
                      className="pointer-events-none select-none font-sans"
                    >
                      You are here
                    </text>
                  </animated.g>
                )}

                {/* Live SOS Incident Beacons */}
                {activeMapIncidents.map((inc) => (
                  <animated.g
                    key={inc.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIncident(inc);
                    }}
                    className="pointer-events-auto cursor-pointer"
                    style={{
                      transform: to([zoom], (z) => `translate(${inc.x}px, ${inc.y}px) scale(${1 / z})`),
                    }}
                  >
                    {/* Danger Radar Rings */}
                    <circle cx="0" cy="0" r="28" fill={inc.category === 'fire' ? '#ea580c' : '#ef4444'} opacity="0.15" />
                    {!prefersReducedMotion && (
                      <motion.circle
                        cx="0"
                        cy="0"
                        r="28"
                        fill={inc.category === 'fire' ? '#ea580c' : '#ef4444'}
                        animate={{ scale: [0.6, 2.2, 0.6], opacity: [0.4, 0, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                      />
                    )}
                    <circle cx="0" cy="0" r="11" fill={inc.category === 'fire' ? '#ea580c' : '#dc2626'} stroke="#ffffff" strokeWidth="2.5" />
                    <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">!</text>
                    <text
                      x="0"
                      y="-16"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#b91c1c"
                      fontWeight="900"
                      className="pointer-events-none select-none font-sans"
                    >
                      🚨 {inc.title.substring(0, 24)}
                    </text>
                  </animated.g>
                ))}

                {/* Safety Amenities (Guard Posts, Emergency Phones, First Aid) */}
                {activeMapAmenities.map((amenity) => {
                  const isGuard = amenity.type === 'guard_post';
                  const isAid = amenity.type === 'first_aid';
                  const color = isGuard ? '#2563eb' : isAid ? '#059669' : '#d97706';
                  return (
                    <animated.g
                      key={amenity.id}
                      className="pointer-events-auto select-none"
                      style={{
                        transform: to([zoom], (z) => `translate(${amenity.x}px, ${amenity.y}px) scale(${1 / z})`),
                      }}
                    >
                      <circle cx="0" cy="0" r="8" fill={color} stroke="#ffffff" strokeWidth="2" opacity="0.9" />
                      <circle cx="0" cy="0" r="3" fill="#ffffff" />
                      <text
                        x="0"
                        y="14"
                        textAnchor="middle"
                        fontSize="8"
                        fill={color}
                        fontWeight="bold"
                        className="pointer-events-none select-none font-sans"
                      >
                        {isGuard ? '🛡️ Guard' : isAid ? '🏥 First Aid' : '📞 SOS Box'}
                      </text>
                    </animated.g>
                  );
                })}

                {/* CCTV Camera Surveillance Markers */}
                {activeMapCameras.map((cam) => (
                  <animated.g
                    key={cam.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCamera(cam);
                    }}
                    className="pointer-events-auto cursor-pointer"
                    style={{
                      transform: to([zoom], (z) => `translate(${cam.x}px, ${cam.y}px) scale(${1 / z})`),
                    }}
                  >
                    <path
                      d="M 0 0 L -14 -24 A 28 28 0 0 1 14 -24 Z"
                      transform={`rotate(${cam.bearingDeg})`}
                      fill="#3b82f6"
                      opacity="0.2"
                    />
                    <circle cx="0" cy="0" r="7" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                    <circle cx="0" cy="0" r="2.5" fill={cam.status === 'alert' ? '#ef4444' : '#10b981'} />
                    <text
                      x="0"
                      y="13"
                      textAnchor="middle"
                      fontSize="7"
                      fill="#1e40af"
                      fontWeight="bold"
                      className="pointer-events-none select-none font-sans"
                    >
                      📹 {cam.id.replace('cam_', 'CAM ')}
                    </text>
                  </animated.g>
                ))}

                {/* Dispatched & En Route Responders to Incidents */}
                {activeEnRouteResponders.map((resp) => (
                  <g key={`enroute_${resp.incidentId}`}>
                    {/* Animated Dashed Routing Polyline */}
                    <line
                      x1={resp.fromX}
                      y1={resp.fromY}
                      x2={resp.toX}
                      y2={resp.toY}
                      stroke="#0284c7"
                      strokeWidth="5"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                    <line
                      x1={resp.fromX}
                      y1={resp.fromY}
                      x2={resp.toX}
                      y2={resp.toY}
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeDasharray="8 6"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                    {/* Responder Start / Current Puck */}
                    <animated.g
                      style={{
                        transform: to([zoom], (z) => `translate(${resp.fromX}px, ${resp.fromY}px) scale(${1 / z})`),
                      }}
                    >
                      <circle cx="0" cy="0" r="16" fill="#0284c7" opacity="0.2" />
                      <circle cx="0" cy="0" r="8.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="0" cy="0" r="3" fill="#ffffff" />
                      <text
                        x="0"
                        y="-15"
                        textAnchor="middle"
                        fontSize="9"
                        fill="#0284c7"
                        fontWeight="900"
                        className="select-none font-sans"
                      >
                        👮 {resp.responderName} (EN ROUTE)
                      </text>
                    </animated.g>
                  </g>
                ))}

                {isSimulating && simulatedNode && simulatedNode.map === mapId && (
                  <animated.g
                    style={{
                      transform: to([zoom], (z) => `translate(${simulatedNode.x}px, ${simulatedNode.y}px) scale(${1 / z})`),
                    }}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="10"
                      fill="#3b82f6"
                      opacity="0.3"
                    />
                    {!prefersReducedMotion ? (
                      <motion.circle
                        cx="0"
                        cy="0"
                        r="15"
                        fill="#3b82f6"
                        opacity="0.2"
                        animate={{
                          scale: [0.8, 1.6, 0.8],
                          opacity: [0.3, 0.05, 0.3]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5
                        }}
                      />
                    ) : null}
                    <g
                      transform={`rotate(${compassHeading})`}
                    >
                      <polygon
                        points="0,-8 6,6 0,2 -6,6"
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </g>
                    <text
                      x="0"
                      y="-22"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#1d4ed8"
                      fontWeight="bold"
                      className="pointer-events-auto select-none"
                    >
                      Simulating Walk
                    </text>
                  </animated.g>
                )}
              </svg>
            </div>
          </animated.div>
        ) : (
          <div className="absolute inset-0 p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 h-full">
              {buildings.map((building, idx) => {
                const buildingImage = building.id === 'main' ? MainCover : building.id === 'ai' ? AICover : '';
                return (
                  <motion.div
                    key={building.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    className="relative rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all overflow-hidden"
                  >
                    {buildingImage ? (
                      <img
                        src={buildingImage}
                        alt={`${building.name}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-100" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent" />
                    <div className="absolute top-2 left-2">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <p className="text-xs truncate">{building.name}</p>
                      <p className="text-xs opacity-90">{building.floors} floors</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Map Controls overlay */}
        {mapId && (
          <div className="absolute right-4 bottom-6 z-20 flex flex-col items-end gap-3 pointer-events-none select-none">
            {/* Building & Floor Selector (Horizontal Pill Bar) */}
            <div className="flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/90 dark:border-white/10 p-1.5 gap-1.5 pointer-events-auto relative transition-colors">
              {/* Building Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsBuildingDropdownOpen(!isBuildingDropdownOpen)}
                  className="px-3 h-9 rounded-xl flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-none">{activeBuildingName}</span>
                  <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isBuildingDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBuildingDropdownOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-white/10 p-1.5 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95 transition-colors">
                    <button
                      onClick={() => handleSelectBuilding('campus')}
                      className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        mapId === 'Campus_Map'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      🗺️ Campus Master Map
                    </button>
                    {buildings.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBuilding(b.id)}
                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          activeBuildingId === b.id
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {b.id === 'main' ? '🏛️' : '💻'} {b.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Floor Buttons (Segmented Pills) */}
              {buildingFloors.length > 0 && (
                <>
                  <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/10" />
                  <div className="flex items-center gap-1">
                    {buildingFloors.map((f) => {
                      const isActive = f.map === mapId;
                      const label = f.floor === 0 ? 'GF' : `F${f.floor}`;
                      return (
                        <button
                          key={f.map}
                          onClick={() => onMapChange?.(f.map)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title={f.label}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Zoom & Recenter Control Stack */}
            <div className="flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/90 dark:border-white/10 p-1.5 gap-1 pointer-events-auto transition-colors">
              <button
                onClick={handleZoomIn}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                disabled={!canZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={handleZoomOut}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                disabled={!canZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="w-4.5 h-4.5" />
              </button>

              <div className="h-[1px] bg-slate-200 dark:bg-white/10 mx-1" />

              <button
                onClick={handleResetZoom}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                title="Reset Zoom & Center"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-[1px] bg-slate-200 dark:bg-white/10 mx-1" />

              <button
                type="button"
                onClick={() => {
                  if (isGpsActive) {
                    disableGps();
                    setAutoFollowUser(false);
                  } else {
                    enableGps();
                    if (mapId !== 'Campus_Map' && onMapChange) {
                      onMapChange('Campus_Map');
                    }
                    setAutoFollowUser(true);
                  }
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isGpsActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                title={isGpsActive ? 'Disable Live GPS Tracking' : 'Enable Live GPS Tracking'}
              >
                <Navigation className={`w-4 h-4 ${isGpsActive ? 'fill-white' : ''}`} />
              </button>

              <button
                onClick={() => {
                  if (autoFollowUser) {
                    setAutoFollowUser(false);
                  } else {
                    handleCenterOnStudent();
                  }
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  autoFollowUser
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-white/10 hover:text-cyan-700 dark:hover:text-cyan-300'
                }`}
                title={autoFollowUser ? 'Auto-Follow & Zoom Active (Tap to Pause)' : 'Center on My Location & Auto-Zoom'}
              >
                <LocateFixed className={`w-4.5 h-4.5 ${autoFollowUser ? 'text-white animate-pulse' : 'text-cyan-600'}`} />
              </button>

              <div className="h-[1px] bg-slate-200 dark:bg-white/10 mx-1" />

              <button
                type="button"
                onClick={() => setShowGalisNetwork((prev) => !prev)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  showGalisNetwork
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                title={showGalisNetwork ? 'Hide Walkways & Galis Network' : 'Show Walkways & Galis Network'}
              >
                <Footprints className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowHeatmap((prev) => !prev)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  showHeatmap
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-white/10 hover:text-amber-600 dark:hover:text-amber-400'
                }`}
                title={showHeatmap ? 'Hide Campus Headmap & Crowd Density' : 'Show Campus Headmap & Crowd Density'}
              >
                <Flame className="w-4 h-4" />
              </button>

              <div className="h-[1px] bg-slate-200 dark:bg-white/10 mx-1" />

              <button
                type="button"
                onClick={() => setSosModalOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all cursor-pointer animate-pulse"
                title="Broadcast SOS Emergency Alert"
              >
                <span className="text-[9px] font-black tracking-wider">SOS</span>
              </button>
            </div>
          </div>
        )}

        {/* Live GPS Status & Perimeter Alert Banner */}
        {isGpsActive && isOutsideCampus && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-amber-500/40 bg-slate-900/90 px-4 py-2 text-xs font-bold text-amber-300 shadow-2xl backdrop-blur-md pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Outside MITS campus perimeter • Snapped to Main Gate (Gate 1)</span>
          </div>
        )}

        {isGpsActive && gpsError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-rose-500/40 bg-slate-900/90 px-4 py-2 text-xs font-bold text-rose-300 shadow-2xl backdrop-blur-md pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Active En Route Responder Floating Banner */}
        {activeEnRouteResponders.length > 0 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-full border border-cyan-500/40 bg-slate-900/90 px-4 py-2 text-xs font-bold text-cyan-300 shadow-2xl backdrop-blur-md animate-pulse">
            <Radio className="h-4 w-4 text-cyan-400 animate-spin" />
            <span>
              {activeEnRouteResponders[0].responderName} EN ROUTE • ETA: {activeEnRouteResponders[0].eta}
            </span>
            <button
              onClick={() => advanceResponderStatus(activeEnRouteResponders[0].incidentId, 'on_scene')}
              className="rounded-full bg-cyan-500 px-2.5 py-0.5 text-[10px] font-black text-slate-950 hover:bg-cyan-400 cursor-pointer"
            >
              MARK ON-SCENE
            </button>
          </div>
        )}

        {/* Safety Theme & 3D Layer Controls */}
        {proctorMode && <SafetyThemeControls />}

        {/* Selected Incident Floating Drawer (only for security / operator dashboards) */}
        {activeDashboard !== 'nav' && <IncidentCard />}

        {/* SOS Emergency Broadcast Modal (Universal) */}
        <SosModal />

        {/* Tactical Node Selection Action Card (Start / Go Here) */}
        {selectedMapNode && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl p-4 pointer-events-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {selectedMapNode.name || selectedMapNode.id}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {selectedMapNode.map ? selectedMapNode.map.replace('_', ' ') : 'Campus'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase shrink-0">
                      {selectedMapNode.category || selectedMapNode.type || 'Path'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedMapNode(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <button
                onClick={() => {
                  handleCurrentLocationSelect(selectedMapNode);
                  setSelectedMapNode(null);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Start Here
              </button>
              <button
                onClick={() => {
                  handleDestinationSelect(selectedMapNode);
                  setSelectedMapNode(null);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#ff602e] hover:bg-[#ff7b52] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-orange-500/20 active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5 fill-white" />
                Go Here
              </button>
            </div>
          </motion.div>
        )}

        {/* Interactive Node Details Drawer ("Open Node") */}
        <NodeDetailDrawer />

        {/* CCTV Camera Live Surveillance & Crowd Telemetry Modal */}
        <CameraDetailModal />

        {/* Real-world GPS Georeference Badge */}
        {mapId === 'Campus_Map' && (
          <div className="absolute bottom-5 left-5 z-20 pointer-events-auto hidden sm:flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 px-3.5 py-2 rounded-2xl shadow-xl text-[11px] font-medium text-slate-800 dark:text-slate-200 select-none transition-colors">
            <div className={`w-2 h-2 rounded-full ${isGpsActive ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-mono font-semibold">
              {userGpsCoords
                ? formatDMS(userGpsCoords.lat, userGpsCoords.lon)
                : "26°13'57.4\"N 78°12'18.8\"E"}
            </span>
            <span className="text-[10px] text-gray-400">
              {userGpsCoords ? '(Live GPS)' : '(Main Gate)'}
            </span>
            <a
              href={getOsmUrl(
                userGpsCoords ? userGpsCoords.lat : 26.232611,
                userGpsCoords ? userGpsCoords.lon : 78.205222
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5"
              title="Open in OpenStreetMap"
            >
              <span>OSM</span>
              <span className="text-[9px]">↗</span>
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

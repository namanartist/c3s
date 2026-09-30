// src/components/ui/MapBox.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ZoomIn, ZoomOut, RotateCcw, Building2, ChevronUp, Navigation, LocateFixed, Radio, ShieldCheck } from 'lucide-react';
import { useSpring, animated, to } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import type { FloorMap, Building, MapNode } from '@/types';
import MainCover from '@/assets/Main_Cover.webp';
import AICover from '@/assets/AI_Cover.webp';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { formatDMS } from '@/lib/geoProjection';
import { useSafetyStore } from '@/store/safetyStore';
import { SafetyThemeControls } from '@/components/safety/SafetyThemeControls';
import { IncidentCard } from '@/components/safety/IncidentCard';
import { SosModal } from '@/components/safety/SosModal';
import { ProctorMapOverlay } from '@/components/safety/ProctorMapOverlay';
import { GateMapOverlay } from '@/components/safety/GateMapOverlay';
import { StudentGateScannerModal } from '@/components/safety/StudentGateScannerModal';
import { CameraDetailModal } from '@/components/safety/CameraDetailModal';
import { NodeDetailDrawer } from '@/components/map/NodeDetailDrawer';

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
    compassHeading,
    userGpsCoords,
    userSvgCoords,
    isGpsActive,
    enableGps,
    disableGps,
    gpsAccuracy,
  } = useCampusNavigation();

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
    setAutoFollowUser(true);
  }, [userSvgCoords, springApi]);

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

  const activeTheme = useSafetyStore((s) => s.activeTheme);
  const is3dMode = useSafetyStore((s) => s.is3dMode);
  const pitch = useSafetyStore((s) => s.pitch);
  const incidents = useSafetyStore((s) => s.incidents);
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
    // Hide SOS incidents from public users in standard navigation mode
    if (activeDashboard === 'nav' && !proctorMode) return [];
    return incidents.filter((i) => i.map === mapId && i.status !== 'resolved');
  }, [incidents, mapId, activeDashboard, proctorMode]);

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
      svgEl.style.backfaceVisibility = 'hidden';
      svgEl.style.webkitBackfaceVisibility = 'hidden';

      const elements = svgEl.querySelectorAll('path, line, polyline, rect');
      elements.forEach((el) => {
        const val = el.getAttribute('shape-rendering');
        if (val === 'crispEdges' || val === 'optimizeSpeed') {
          el.removeAttribute('shape-rendering');
        }
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
    if (!isNavigating || !pathPoints) return null;
    const pts = parsePoints(pathPoints);
    return computeBbox(pts);
  }, [isNavigating, pathPoints]);

  useEffect(() => {
    if (!isNavigating) return;
    if (!pathBbox) return;
    if (autoFitNonce == null) return;
    if (lastAutoFitRef.current === autoFitNonce) return;

    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (!(w > 0 && h > 0)) return;

    const baseScale = Math.min(w / svgWidth, h / svgHeight) || 1;
    const offsetX = (w - svgWidth * baseScale) / 2;
    const offsetY = (h - svgHeight * baseScale) / 2;

    const minX = (pathBbox.minX - svgMinX) * baseScale + offsetX;
    const maxX = (pathBbox.maxX - svgMinX) * baseScale + offsetX;
    const minY = (pathBbox.minY - svgMinY) * baseScale + offsetY;
    const maxY = (pathBbox.maxY - svgMinY) * baseScale + offsetY;

    const bboxW = Math.max(1, maxX - minX);
    const bboxH = Math.max(1, maxY - minY);
    const pad = Math.max(24, Math.min(w, h) * 0.06);

    const isDesktop = w >= 768;
    const availW = isDesktop ? Math.max(1, w - 410 - 2 * pad) : Math.max(1, w - 2 * pad);
    const availH = Math.max(1, h - 2 * pad);

    const nextZoom = Math.max(0.5, Math.min(5, Math.min(availW / bboxW, availH / bboxH)));

    const bboxCenterX = (minX + maxX) / 2;
    const bboxCenterY = (minY + maxY) / 2;
    const cx = isDesktop ? (w + 410) / 2 : w / 2;
    const cy = h / 2;

    const nextPanX = cx - bboxCenterX * nextZoom;
    const nextPanY = cy - bboxCenterY * nextZoom;

    lastAutoFitRef.current = autoFitNonce;
    springApi.start({ x: nextPanX, y: nextPanY, zoom: nextZoom });
  }, [autoFitNonce, isNavigating, pathBbox, svgMinX, svgMinY, svgHeight, svgWidth, springApi]);

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
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              filter:
                activeTheme === 'dark'
                  ? 'invert(0.88) hue-rotate(180deg) contrast(1.2)'
                  : activeTheme === 'safety'
                    ? 'invert(0.8) hue-rotate(160deg) contrast(1.15)'
                    : undefined,
              transition: 'filter 0.4s ease'
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
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
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
                {isNavigating && pathPoints && (
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

                {shouldShowDestination && destination.x !== undefined && destination.y !== undefined && (
                  <animated.g
                    style={{
                      transform: to([zoom, destSpring.scale], (z, s) => `translate(${destination.x}px, ${destination.y}px) scale(${s / z})`),
                    }}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="8"
                      fill="#ff602e"
                      opacity="0.3"
                    />
                    {!prefersReducedMotion ? (
                      <motion.circle
                        cx="0"
                        cy="0"
                        r="8"
                        fill="#ff602e"
                        opacity="0.3"
                        animate={{
                          scale: [1, 2, 1],
                          opacity: [0.3, 0, 0.3]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2
                        }}
                      />
                    ) : null}
                    <circle
                      cx="0"
                      cy="0"
                      r="3"
                      fill="#ff602e"
                    />
                    <text
                      x="0"
                      y="-18"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#7c2d12"
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
                {userSvgCoords && (
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

                {/* Interactive Campus Nodes ("Open Node" Feature) */}
                {activeMapNodes.map((n) => {
                  const isSelected = selectedNodeForDetail?.id === n.id;
                  return (
                    <animated.g
                      key={`interactive_node_${n.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeForDetail(n);
                      }}
                      className="pointer-events-auto cursor-pointer"
                      style={{
                        transform: to([zoom], (z) => `translate(${n.x}px, ${n.y}px) scale(${1 / z})`),
                      }}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r={isSelected ? 10 : 6}
                        fill={isSelected ? '#38bdf8' : '#0284c7'}
                        opacity={isSelected ? 0.95 : 0.3}
                        stroke={isSelected ? '#ffffff' : '#38bdf8'}
                        strokeWidth={isSelected ? 2.5 : 1}
                      />
                      {isSelected && (
                        <circle
                          cx="0"
                          cy="0"
                          r="16"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                      )}
                    </animated.g>
                  );
                })}

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
            <div className="flex items-center bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/90 p-1.5 gap-1.5 pointer-events-auto relative">
              {/* Building Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsBuildingDropdownOpen(!isBuildingDropdownOpen)}
                  className="px-3 h-9 rounded-xl flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-none">{activeBuildingName}</span>
                  <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isBuildingDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBuildingDropdownOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-1.5 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => handleSelectBuilding('campus')}
                      className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        mapId === 'Campus_Map'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
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
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
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
                  <div className="h-5 w-[1px] bg-slate-200" />
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
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
            <div className="flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/90 p-1.5 gap-1 pointer-events-auto">
              <button
                onClick={handleZoomIn}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                disabled={!canZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={handleZoomOut}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                disabled={!canZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="w-4.5 h-4.5" />
              </button>

              <div className="h-[1px] bg-slate-200 mx-1" />

              <button
                onClick={handleResetZoom}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                title="Reset Zoom & Center"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-[1px] bg-slate-200 mx-1" />

              <button
                onClick={isGpsActive ? disableGps : enableGps}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isGpsActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
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
                    : 'text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
                title={autoFollowUser ? 'Auto-Follow & Zoom Active (Tap to Pause)' : 'Center on My Location & Auto-Zoom'}
              >
                <LocateFixed className={`w-4.5 h-4.5 ${autoFollowUser ? 'text-white animate-pulse' : 'text-cyan-600'}`} />
              </button>

              <div className="h-[1px] bg-slate-200 mx-1" />

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

        {/* Interactive Node Details Drawer ("Open Node") */}
        <NodeDetailDrawer />

        {/* Student C3S Gate Check-In/Check-Out Scanner Modal */}
        <StudentGateScannerModal />

        {/* CCTV Camera Live Surveillance & Crowd Telemetry Modal */}
        <CameraDetailModal />

        {/* Real-world GPS Georeference Badge */}
        {mapId === 'Campus_Map' && (
          <div className="absolute bottom-5 left-5 z-20 pointer-events-auto hidden sm:flex items-center gap-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-black/5 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-md text-[11px] font-medium text-gray-700 dark:text-gray-200 select-none">
            <div className={`w-2 h-2 rounded-full ${isGpsActive ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-mono font-semibold">
              {userGpsCoords
                ? formatDMS(userGpsCoords.lat, userGpsCoords.lon)
                : "26°13'57.4\"N 78°12'18.8\"E"}
            </span>
            <span className="text-[10px] text-gray-400">
              {userGpsCoords ? '(Live GPS)' : '(Main Gate)'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

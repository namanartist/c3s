// src/components/ui/MapBox.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ZoomIn, ZoomOut, RotateCcw, Building2, ChevronUp } from 'lucide-react';
import { useSpring, animated, to } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import type { FloorMap, Building } from '@/types';
import MainCover from '@/assets/Main_Cover.webp';
import AICover from '@/assets/AI_Cover.webp';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';

interface Point {
  x: number;
  y: number;
}

interface Bbox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

const mapViewBoxes: Record<string, { width: number; height: number }> = {
  Campus_Map: { width: 1088.7814, height: 659.5655 },
  Main_GF: { width: 848.4096, height: 609.5946 },
  Main_FF: { width: 696.4, height: 576.6927 },
  Main_SF: { width: 743.9135, height: 482.3806 },
  AI_GF: { width: 842, height: 595 },
  AI_FF: { width: 705.6, height: 283.32 },
  AI_SF: { width: 719.4, height: 220.32 },
};

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
  onMapChange,
}: MapBoxProps) {
  const prefersReducedMotion = useReducedMotion();
  const {
    isSimulating,
    simulatedNodeId,
    nodesMap,
    compassHeading,
  } = useCampusNavigation();

  const [canZoomIn, setCanZoomIn] = useState(true);
  const [canZoomOut, setCanZoomOut] = useState(true);
  const [isBuildingDropdownOpen, setIsBuildingDropdownOpen] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');

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

  // Resolve Cloudinary Map URL dynamically from the floors data array
  const mapSrc = useMemo(() => {
    if (!mapId) return '';
    const floorMeta = floors.find((f) => f.map === mapId);
    return floorMeta?.svgUrl || '';
  }, [mapId, floors]);

  useEffect(() => {
    if (!mapSrc) {
      setSvgContent('');
      return;
    }
    fetch(mapSrc)
      .then((res) => res.text())
      .then((text) => {
        setSvgContent(text);
      })
      .catch((err) => console.error('Failed to fetch SVG map:', err));
  }, [mapSrc]);

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

  const viewBoxConfig = (mapId ? mapViewBoxes[mapId] : null) ?? mapViewBoxes.Main_GF;
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

    const minX = pathBbox.minX * baseScale + offsetX;
    const maxX = pathBbox.maxX * baseScale + offsetX;
    const minY = pathBbox.minY * baseScale + offsetY;
    const maxY = pathBbox.maxY * baseScale + offsetY;

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
  }, [autoFitNonce, isNavigating, pathBbox, svgHeight, svgWidth, springApi]);

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

    const nodeViewportX = node.x * baseScale + offsetX;
    const nodeViewportY = node.y * baseScale + offsetY;

    const isDesktop = w >= 768;
    const cx = isDesktop ? (w + 410) / 2 : w / 2;
    const cy = h / 2;

    const currentZoom = zoom.get();
    const nextPanX = cx - nodeViewportX * currentZoom;
    const nextPanY = cy - nodeViewportY * currentZoom;

    springApi.start({ x: nextPanX, y: nextPanY });
  }, [simulatedNodeId, isSimulating, mapId, nodesMap, svgWidth, svgHeight, springApi]);

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
        className="relative w-full h-full bg-[#fcfaf6] overflow-hidden"
      >
        {showFloorPlan && mapSrc ? (
          <animated.div
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none z-0"
            style={{
              transform: to([x, y, zoom], (px, py, z) => `translate(${px}px, ${py}px) scale(${z})`),
              transformOrigin: '0 0',
              willChange: 'auto',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
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
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="xMidYMid meet"
                style={{
                  mixBlendMode: 'normal',
                  shapeRendering: 'geometricPrecision',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
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
          <div className="absolute left-4 top-[40%] -translate-y-1/2 z-20 flex flex-col items-start gap-3 md:bottom-6 md:right-6 md:top-auto md:translate-y-0 md:left-auto md:flex-row md:items-end pointer-events-none select-none">
            {/* Building & Floor Selector */}
            <div className="flex flex-col items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/[0.04] p-1.5 gap-1.5 pointer-events-auto relative md:flex-row">
              {/* Building Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsBuildingDropdownOpen(!isBuildingDropdownOpen)}
                  className="w-10 md:w-auto px-0 md:px-3.5 h-10 rounded-xl flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-[#ff602e] transition-all duration-200"
                >
                  <Building2 className="w-4 h-4 text-[#ff602e] shrink-0" />
                  <span className="truncate max-w-[85px] md:max-w-none hidden md:inline">{activeBuildingName}</span>
                  <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0 hidden md:inline" />
                </button>

                {isBuildingDropdownOpen && (
                  <div className="absolute left-full top-0 ml-2 bottom-auto mb-0 md:bottom-full md:mb-2 md:left-auto md:right-0 md:top-auto md:ml-0 w-40 bg-white rounded-xl shadow-xl border border-black/[0.04] p-1.5 flex flex-col gap-0.5 z-30">
                    <button
                      onClick={() => handleSelectBuilding('campus')}
                      className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                        mapId === 'Campus_Map'
                          ? 'bg-orange-50 text-[#ff602e]'
                          : 'text-gray-700 hover:bg-orange-50 hover:text-[#ff602e]'
                      }`}
                    >
                      Campus Map
                    </button>
                    {buildings.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBuilding(b.id)}
                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                          activeBuildingId === b.id
                            ? 'bg-orange-50 text-[#ff602e]'
                            : 'text-gray-700 hover:bg-orange-50 hover:text-[#ff602e]'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Floor Buttons (Horizontal / Vertical) */}
              {buildingFloors.length > 0 && (
                <>
                  <div className="h-[1px] w-6 bg-gray-200 md:h-6 md:w-[1px]" />
                  <div className="flex flex-col md:flex-row items-center gap-1">
                    {buildingFloors.map((f) => {
                      const isActive = f.map === mapId;
                      const label = f.floor === 0 ? 'G' : `F${f.floor}`;
                      return (
                        <button
                          key={f.map}
                          onClick={() => onMapChange?.(f.map)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            isActive
                              ? 'bg-[#ff602e] text-white shadow-md shadow-orange-500/20'
                              : 'text-gray-700 hover:bg-orange-50 hover:text-[#ff602e]'
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
            <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-black/[0.04] p-1.5 gap-1.5 pointer-events-auto">
              <button
                onClick={handleZoomIn}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-700 hover:bg-orange-50 hover:text-[#ff602e] transition-all duration-200"
                disabled={!canZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>

              <button
                onClick={handleZoomOut}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-700 hover:bg-orange-50 hover:text-[#ff602e] transition-all duration-200"
                disabled={!canZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>

              <div className="h-[1px] bg-gray-100 mx-1" />

              <button
                onClick={handleResetZoom}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-700 hover:bg-orange-50 hover:text-[#ff602e] transition-all duration-200"
                title="Reset Zoom & Center"
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

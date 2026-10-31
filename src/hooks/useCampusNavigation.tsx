// src/hooks/useCampusNavigation.tsx
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { fetchNodes, fetchEdges, fetchBuildings, fetchFloors } from '@/lib/api';
import { computeMultiMapRouteAsync, buildNodesMap, buildGlobalGraph } from '@/lib/multiMapNavigation';
import type { NavigationStep } from '@/lib/multiMapNavigation';
import { buildUndirectedEdgeIndex } from '@/lib/navigation_instructions';
import { buildNavigationStepViewModel } from '@/pages/Map/services/navigationStepService';
import type { MapNode, MapEdge, Building, FloorMap } from '@/types';
import { parseRoomName } from '@/lib/roomParser';
import { gpsToSvg, findNearestCampusNode, isWithinCampusBounds, haversineDistanceMeters } from '@/lib/geoProjection';
import type { SosIncident } from '@/types/safety';
import { useSafetyStore } from '@/store/safetyStore';

// Module-level caches to avoid multiple fetch requests on StrictMode double-mounting
let cachedNodes: MapNode[] | null = null;
let cachedEdges: MapEdge[] | null = null;
let cachedBuildings: Building[] | null = null;
let cachedFloors: FloorMap[] | null = null;
let fetchPromise: Promise<[MapNode[], MapEdge[], Building[], FloorMap[]]> | null = null;

export interface CampusNavigationContextType {
  nodes: MapNode[];
  edges: MapEdge[];
  buildings: Building[];
  floors: FloorMap[];
  loading: boolean;
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  isBottomSheetExpanded: boolean;
  setIsBottomSheetExpanded: (expanded: boolean) => void;
  activeSearchField: 'start' | 'dest' | null;
  setActiveSearchField: (field: 'start' | 'dest' | null) => void;
  mobileSearchQuery: string;
  setMobileSearchQuery: (query: string) => void;
  destination: any;
  currentLocation: any;
  isNavigating: boolean;
  isComputingRoute: boolean;
  pathPoints: string;
  navigationDirections: any[];
  navigationSteps: NavigationStep[];
  activeStepIndex: number;
  autoFitNonce: number;
  selectedMapId: string | null;
  activeMapId: string;
  filteredSuggestions: any[];
  handleDestinationSelect: (location: any) => void;
  handleDestinationClear: () => void;
  handleCurrentLocationSelect: (location: any) => void;
  handleCurrentLocationClear: () => void;
  handleResetNavigation: () => void;
  handleSwapLocations: () => void;
  handleStartNavigation: () => Promise<void>;
  handleExitNavigation: () => void;
  setActiveStepIndex: React.Dispatch<React.SetStateAction<number>>;
  setSelectedMapId: React.Dispatch<React.SetStateAction<string | null>>;
  campusLocations: any[];
  nodesMap: Record<string, MapNode>;
  routeDistance: number;
  routeDuration: number;
  accessibleOnly: boolean;
  setAccessibleOnly: (val: boolean) => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  simulatedNodeId: string | null;
  compassHeading: number;
  userGpsCoords: { lat: number; lon: number } | null;
  userSvgCoords: { x: number; y: number } | null;
  gpsAccuracy: number | null;
  isGpsActive: boolean;
  isGpsLocating: boolean;
  isOutsideCampus: boolean;
  gpsError: string | null;
  enableGps: () => void;
  disableGps: () => void;
  useGpsAsStartLocation: () => void;
  routeToSosIncident: (incident: SosIncident) => void;
}

const CampusNavigationContext = createContext<CampusNavigationContextType | undefined>(undefined);

export function CampusNavigationProvider({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Database datasets
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<FloorMap[]>([]);
  const [loading, setLoading] = useState(true);

  // Mobile UI States
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<'start' | 'dest' | null>(null);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation state
  const [destination, setDestination] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isComputingRoute, setIsComputingRoute] = useState(false);
  const [pathPoints, setPathPoints] = useState('');
  const [navigationDirections, setNavigationDirections] = useState<any[]>([]);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [autoFitNonce, setAutoFitNonce] = useState(0);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  
  // Dynamic Route Metrics
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);

  // New accessibility and live tracking/compass states
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedNodeId, setSimulatedNodeId] = useState<string | null>(null);
  const [simulatedPathIndex, setSimulatedPathIndex] = useState<number>(0);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [fullRoutePath, setFullRoutePath] = useState<string[]>([]);

  // Real GPS tracking states
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [userSvgCoords, setUserSvgCoords] = useState<{ x: number; y: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [isOutsideCampus, setIsOutsideCampus] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const unmountedRef = useRef(false);
  const routeAbortRef = useRef<AbortController | null>(null);
  const currentLocationRef = useRef(currentLocation);
  const userGpsCoordsRef = useRef(userGpsCoords);

  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    userGpsCoordsRef.current = userGpsCoords;
  }, [userGpsCoords]);

  // Load datasets from backend APIs
  useEffect(() => {
    let active = true;

    if (cachedNodes && cachedEdges && cachedBuildings && cachedFloors) {
      setNodes(cachedNodes);
      setEdges(cachedEdges);
      setBuildings(cachedBuildings);
      setFloors(cachedFloors);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = Promise.all([
        fetchNodes(),
        fetchEdges(),
        fetchBuildings(),
        fetchFloors()
      ]).then((data) => {
        cachedNodes = data[0];
        cachedEdges = data[1];
        cachedBuildings = data[2];
        cachedFloors = data[3];
        return data;
      });
    }

    fetchPromise.then(([fetchedNodes, fetchedEdges, fetchedBuildings, fetchedFloors]) => {
      if (!active) return;
      setNodes(fetchedNodes);
      setEdges(fetchedEdges);
      setBuildings(fetchedBuildings);
      setFloors(fetchedFloors);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load map data from APIs", err);
      if (active) setLoading(false);
      fetchPromise = null;
    });

    return () => {
      active = false;
      unmountedRef.current = true;
      routeAbortRef.current?.abort();
      routeAbortRef.current = null;
    };
  }, []);

  // Compute lookup structures
  const nodesMap = useMemo(() => buildNodesMap(nodes), [nodes]);
  const graph = useMemo(() => buildGlobalGraph(edges, { accessibleOnly }), [edges, accessibleOnly]);
  const edgeIndex = useMemo(() => buildUndirectedEdgeIndex(edges), [edges]);

  // Compute searchable location objects
  const campusLocations = useMemo(() => {
    const mapsById = Object.fromEntries(floors.map((m) => [m.map, m]));
    const buildingsById = Object.fromEntries(buildings.map((b) => [b.id, b]));

    return nodes
      .filter((n) => (n.type as string) !== 'corridor' && (n.type as string) !== 'junction' && (n.type as string) !== 'intersection')
      .map((n) => {
        const parsed = parseRoomName(n.id);
        const mapMeta = n.map ? mapsById[n.map] : null;
        const buildingMeta = mapMeta && mapMeta.building ? buildingsById[mapMeta.building] : null;

        const name = n.name || parsed.name;
        // Generate comprehensive search tokens and aliases (including room 101, room 102/j126, colloquium)
        const idLower = String(n.id || '').toLowerCase();
        const nameLower = String(name || '').toLowerCase();
        const strippedId = idLower.replace(/^(room_|node_|cabin_)/, '');
        const roomAlias = nameLower
          .replace(/classroom\s*/gi, 'room ')
          .replace(/classroom\s*/gi, 'room no. ')
          .replace(/classroom\s*/gi, 'room no ')
          .replace(/classroom\s*/gi, 'rm ');
        const digits = nameLower.match(/\d+/g)?.join(' ') || '';

        const searchName = `${nameLower} ${idLower} ${strippedId} ${roomAlias} ${digits} ${n.map ? n.map.toLowerCase() : ''}`.trim();

        return {
          id: n.id,
          name,
          searchName,
          map: n.map || null,
          building: buildingMeta?.name || (mapMeta?.building === 'campus' ? 'Campus' : 'MITS - DU'),
          floor: typeof mapMeta?.floor === 'number' ? mapMeta.floor : null,
          category: parsed.category,
          x: n.x,
          y: n.y,
          lat: n.lat,
          lng: n.lng,
        };
      });
  }, [nodes, floors, buildings]);

  const handleDestinationSelect = useCallback((location: any) => {
    if (isNavigating || isComputingRoute) {
      routeAbortRef.current?.abort();
      setIsNavigating(false);
      setIsComputingRoute(false);
      setPathPoints('');
      setNavigationDirections([]);
    }
    setDestination(location);
    setSelectedMapId(null);
  }, [isNavigating, isComputingRoute]);

  const handleResetNavigation = useCallback(() => {
    routeAbortRef.current?.abort();
    routeAbortRef.current = null;
    setIsNavigating(false);
    setIsComputingRoute(false);
    setDestination(null);
    setCurrentLocation(null);
    setPathPoints('');
    setNavigationDirections([]);
    setNavigationSteps([]);
    setActiveStepIndex(0);
    setAutoFitNonce((n) => n + 1);
    setSelectedMapId(null);
    setRouteDistance(0);
    setRouteDuration(0);
  }, []);

  const handleDestinationClear = useCallback(() => {
    setDestination(null);
    setSelectedMapId(null);
    if (isNavigating || isComputingRoute) {
      handleResetNavigation();
    }
  }, [isNavigating, isComputingRoute, handleResetNavigation]);

  const handleCurrentLocationSelect = useCallback((location: any) => {
    if (isNavigating || isComputingRoute) {
      routeAbortRef.current?.abort();
      setIsNavigating(false);
      setIsComputingRoute(false);
      setPathPoints('');
      setNavigationDirections([]);
    }
    setCurrentLocation(location);
    if (location?.map) {
      setSelectedMapId(location.map);
    }
  }, [isNavigating, isComputingRoute]);

  const handleCurrentLocationClear = useCallback(() => {
    setCurrentLocation(null);
    setSelectedMapId(null);
    if (isNavigating || isComputingRoute) {
      setIsNavigating(false);
      setIsComputingRoute(false);
      setPathPoints('');
      setNavigationDirections([]);
      setNavigationSteps([]);
      setActiveStepIndex(0);
    }
  }, [isNavigating, isComputingRoute]);

  const handleSwapLocations = useCallback(() => {
    const temp = currentLocation;
    setCurrentLocation(destination);
    setDestination(temp);
    setSelectedMapId(null);
    if (isNavigating || isComputingRoute) {
      setPathPoints('');
      setNavigationDirections([]);
      setNavigationSteps([]);
      setIsNavigating(false);
    }
  }, [currentLocation, destination, isNavigating, isComputingRoute]);

  const activateStep = useCallback(
    (step: NavigationStep) => {
      const { pathPoints, navigationDirections } = buildNavigationStepViewModel(
        step,
        nodesMap,
        edgeIndex
      );
      setPathPoints(pathPoints);
      setNavigationDirections(navigationDirections);
    },
    [nodesMap, edgeIndex]
  );

  // Auto-compute route steps and dynamic metrics
  useEffect(() => {
    if (!currentLocation || !destination) {
      setPathPoints('');
      setNavigationDirections([]);
      setNavigationSteps([]);
      setRouteDistance(0);
      setRouteDuration(0);
      return;
    }

    let active = true;
    setIsComputingRoute(true);
    routeAbortRef.current?.abort();
    const controller = new AbortController();
    routeAbortRef.current = controller;

    const runRouting = async () => {
      try {
        const result = await computeMultiMapRouteAsync(
          nodes,
          edges,
          currentLocation.id,
          destination.id,
          {
            signal: controller.signal,
            yieldEvery: 2000,
            includeFullPath: true,
            nodesMap,
            graph,
            accessibleOnly,
          }
        );

        if (!active || controller.signal.aborted) return;

        if (!result || !result.steps || result.steps.length === 0) {
          setPathPoints('');
          setNavigationDirections([
            {
              direction: 'straight',
              instruction: 'No path found between these locations',
              distance: '',
            },
          ]);
          setNavigationSteps([]);
          setRouteDistance(0);
          setRouteDuration(0);
          setFullRoutePath([]);
          return;
        }

        // Calculate total distance & duration using edge index
        let totalDist = 0;
        let stairsCount = 0;
        let liftCount = 0;

        if (result.fullPath && result.fullPath.length > 1) {
          for (let i = 1; i < result.fullPath.length; i++) {
            const from = result.fullPath[i - 1];
            const to = result.fullPath[i];
            const edge = edgeIndex.get(`${from}|${to}`);
            if (edge) {
              totalDist += edge.distance ?? (edge as any).weight ?? 0;
              if (edge.type === 'stairs') stairsCount++;
              if (edge.type === 'lift') liftCount++;
            }
          }
        }

        let estTime = totalDist / 1.4; // 1.4 m/s walking speed
        estTime += stairsCount * 20;
        estTime += liftCount * 30;

        setRouteDistance(totalDist);
        setRouteDuration(estTime);
        setNavigationSteps(result.steps);
        setFullRoutePath(result.fullPath || []);
      } catch (err) {
        console.error("Automatic route calculation failed:", err);
      } finally {
        if (active && routeAbortRef.current === controller) {
          setIsComputingRoute(false);
        }
      }
    };

    runRouting();

    return () => {
      active = false;
      controller.abort();
    };
  }, [currentLocation?.id, destination?.id, nodes, edges, nodesMap, graph, edgeIndex, accessibleOnly]);

  const activeStep = useMemo(() => navigationSteps[activeStepIndex] || null, [navigationSteps, activeStepIndex]);
  const activeMapId = useMemo(() => 
    selectedMapId ||
    (activeStep?.map) ||
    currentLocation?.map ||
    destination?.map ||
    'Campus_Map',
    [selectedMapId, activeStep, currentLocation, destination]
  );

  // Effect 1: Update SVG/instructions when activeStepIndex or navigationSteps change
  useEffect(() => {
    if (navigationSteps[activeStepIndex]) {
      activateStep(navigationSteps[activeStepIndex]);
      setSelectedMapId(null); // Clear manual map override to snap to the step's map!
      setAutoFitNonce((n) => n + 1);
    }
  }, [activeStepIndex, navigationSteps, activateStep]);

  // Effect 2: Update activeStepIndex if the user manually switches activeMapId
  useEffect(() => {
    if (navigationSteps.length > 0) {
      const currentMapOfStep = navigationSteps[activeStepIndex]?.map;
      if (currentMapOfStep !== activeMapId) {
        const matchingStepIdx = navigationSteps.findIndex(s => s.map === activeMapId);
        if (matchingStepIdx !== -1) {
          setActiveStepIndex(matchingStepIdx);
        }
      }
    }
  }, [activeMapId, navigationSteps, activeStepIndex]);

  // Effect 3: Simulation interval
  useEffect(() => {
    if (!isNavigating || !isSimulating || fullRoutePath.length === 0) {
      setSimulatedNodeId(null);
      setSimulatedPathIndex(0);
      return;
    }

    setSimulatedNodeId(fullRoutePath[0]);
    setSimulatedPathIndex(0);

    const interval = setInterval(() => {
      setSimulatedPathIndex((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= fullRoutePath.length) {
          clearInterval(interval);
          setIsSimulating(false);
          return prevIdx;
        }
        const nodeId = fullRoutePath[nextIdx];
        setSimulatedNodeId(nodeId);

        // Find which step this node belongs to and update activeStepIndex!
        const stepIndex = navigationSteps.findIndex((s) => s.path_nodes.includes(nodeId));
        if (stepIndex !== -1) {
          setActiveStepIndex(stepIndex);
        }

        // Calculate heading/compass direction to next node
        if (nextIdx < fullRoutePath.length - 1) {
          const currNode = nodesMap[nodeId];
          const nextNode = nodesMap[fullRoutePath[nextIdx + 1]];
          if (currNode && nextNode) {
            const dx = nextNode.x - currNode.x;
            const dy = currNode.y - nextNode.y; // Invert SVG y-axis to match cartesian y-up
            const angleRad = Math.atan2(dx, dy);
            const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;
            setCompassHeading(Math.round(angleDeg));
          }
        }

        return nextIdx;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isNavigating, isSimulating, fullRoutePath, navigationSteps, nodesMap]);

  // Effect 4: Real Device Orientation & Geolocation watch
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const heading = (e as any).webkitCompassHeading ?? (360 - (e.alpha ?? 0));
      if (heading != null) {
        setCompassHeading(Math.round(heading));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Handle and project live GPS positions
  const handlePositionUpdate = useCallback((pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    setUserGpsCoords({ lat, lon });
    setGpsAccuracy(pos.coords.accuracy ?? 10);
    setGpsError(null);

    const inside = isWithinCampusBounds({ lat, lon });
    setIsOutsideCampus(!inside);

    const nearest = findNearestCampusNode({ lat, lon }, nodes, {
      preferredMap: selectedMapId || undefined,
      includeIndoor: true,
    });

    if (inside) {
      if (nearest && nearest.map && nearest.map !== 'Campus_Map' && (!selectedMapId || selectedMapId === nearest.map)) {
        // User is indoors on a building floor (e.g. Main_FF Room 101/J126)
        setUserSvgCoords({ x: nearest.x, y: nearest.y });
      } else {
        const raw = gpsToSvg({ lat, lon });
        setUserSvgCoords({
          x: Math.max(30, Math.min(1060, raw.x)),
          y: Math.max(30, Math.min(640, raw.y)),
        });
      }
    } else {
      // User is outside campus bounds: snap position to the closest campus entrance gate
      const fallback = nodes.find((n) => n.id === 'Main_Gate') || nodes[0];
      const target = nearest || fallback;
      if (target) {
        setUserSvgCoords({ x: target.x, y: target.y });
      }
    }
  }, [nodes, selectedMapId]);

  // Live GPS Geolocation Watch with High Accuracy & Resilient Fallback
  useEffect(() => {
    if (!isGpsActive) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    let activeWatchId: number | null = null;
    let isCancelled = false;

    const onPos = (pos: GeolocationPosition) => {
      if (isCancelled) return;
      handlePositionUpdate(pos);
    };

    const startWatching = (highAccuracy: boolean) => {
      if (isCancelled) return;
      if (activeWatchId !== null) {
        navigator.geolocation.clearWatch(activeWatchId);
      }

      activeWatchId = navigator.geolocation.watchPosition(
        onPos,
        (err) => {
          if (isCancelled) return;
          console.warn(`Geolocation watch (${highAccuracy ? 'high' : 'low'} accuracy) error:`, err.code, err.message);

          if (err.code === 1) { // PERMISSION_DENIED
            setGpsError('Location permission denied. Please allow location access in your browser settings.');
            return;
          }

          // If high accuracy timed out or is unavailable, fallback to low accuracy
          if (highAccuracy && (err.code === 2 || err.code === 3)) {
            startWatching(false);
            return;
          }

          // If low accuracy also fails, provide calibrated entrance fallback
          const fallbackNode = nodes.find((n) => n.id === 'Main_Gate') || nodes[0];
          if (fallbackNode) {
            setUserSvgCoords({ x: fallbackNode.x, y: fallbackNode.y });
          }
          setGpsError(err.code === 3 ? 'Location signal timed out. Using campus entrance.' : 'Location signal unavailable.');
        },
        {
          enableHighAccuracy: highAccuracy,
          maximumAge: highAccuracy ? 5000 : 30000,
          timeout: highAccuracy ? 8000 : 15000,
        }
      );
    };

    // Immediate initial fix to prevent waiting for watchPosition interval
    navigator.geolocation.getCurrentPosition(
      onPos,
      () => {
        // Fallback silently if immediate fix fails; watchPosition will handle it
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );

    // Start with high accuracy, auto-fall back on failure
    startWatching(true);

    return () => {
      isCancelled = true;
      if (activeWatchId !== null) {
        navigator.geolocation.clearWatch(activeWatchId);
      }
    };
  }, [isGpsActive, handlePositionUpdate, nodes]);

  const enableGps = useCallback(() => {
    setIsGpsActive(true);
    setGpsError(null);
  }, []);

  const disableGps = useCallback(() => {
    setIsGpsActive(false);
    setUserGpsCoords(null);
    setUserSvgCoords(null);
    setGpsAccuracy(null);
    setIsOutsideCampus(false);
    setGpsError(null);
  }, []);

  const useGpsAsStartLocation = useCallback(() => {
    setIsGpsLocating(true);
    setGpsError(null);

    const applyNodeSelection = (lat: number, lon: number, accuracy?: number) => {
      setUserGpsCoords({ lat, lon });
      if (accuracy) setGpsAccuracy(accuracy);
      setIsGpsActive(true);
      setIsGpsLocating(false);

      const inside = isWithinCampusBounds({ lat, lon });
      setIsOutsideCampus(!inside);

      const nearest = findNearestCampusNode({ lat, lon }, nodes, {
        preferredMap: selectedMapId || undefined,
        includeIndoor: true,
      });
      const targetNode = nearest || nodes.find((n) => n.id === 'Main_Gate') || nodes[0];

      if (inside) {
        if (targetNode && targetNode.map && targetNode.map !== 'Campus_Map') {
          setUserSvgCoords({ x: targetNode.x, y: targetNode.y });
          setSelectedMapId(targetNode.map);
        } else {
          const raw = gpsToSvg({ lat, lon });
          setUserSvgCoords({
            x: Math.max(30, Math.min(1060, raw.x)),
            y: Math.max(30, Math.min(640, raw.y)),
          });
        }
      } else if (targetNode) {
        setUserSvgCoords({ x: targetNode.x, y: targetNode.y });
      }

      if (targetNode) {
        const isIndoorRoom = targetNode.map && targetNode.map !== 'Campus_Map';
        handleCurrentLocationSelect({
          id: targetNode.id,
          name: inside
            ? isIndoorRoom
              ? `📍 ${targetNode.name || targetNode.id} (${targetNode.map.replace('_', ' ')})`
              : `📍 Current Location (${targetNode.name || targetNode.id})`
            : `📍 Nearest Entrance: ${targetNode.name || 'Main Gate'}`,
          searchName: (targetNode.name || '').toLowerCase(),
          map: targetNode.map,
          building: (targetNode as any).building || (targetNode.map?.startsWith('Main') ? 'Main Academic Building' : 'Campus'),
          floor: (targetNode as any).floor ?? (targetNode.map?.includes('FF') ? 1 : targetNode.map?.includes('SF') ? 2 : 0),
          category: 'Current Location',
          x: targetNode.x,
          y: targetNode.y,
          lat,
          lng: lon,
        });
      }
    };

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const fallbackNode = nodes.find((n) => n.id === 'Main_Gate') || nodes[0];
      if (fallbackNode) {
        applyNodeSelection(26.232611, 78.205222, 10);
      }
      setIsGpsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyNodeSelection(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        console.warn('High-accuracy start location error, trying network fallback:', err.message);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            applyNodeSelection(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
          },
          (err2) => {
            console.warn('Geolocation fallback failed, snapping to Main Gate:', err2.message);
            setIsGpsLocating(false);
            const fallbackNode = nodes.find((n) => n.id === 'Main_Gate') || nodes[0];
            if (fallbackNode) {
              applyNodeSelection(26.232611, 78.205222, 15);
            }
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, [nodes, handleCurrentLocationSelect]);

  // Dynamic remaining metrics
  const dynamicDistance = useMemo(() => {
    if (!isNavigating || !simulatedNodeId || fullRoutePath.length === 0) {
      return routeDistance;
    }
    let dist = 0;
    for (let i = simulatedPathIndex + 1; i < fullRoutePath.length; i++) {
      const from = fullRoutePath[i - 1];
      const to = fullRoutePath[i];
      const edge = edgeIndex.get(`${from}|${to}`);
      if (edge) {
        dist += edge.distance ?? (edge as any).weight ?? 0;
      }
    }
    return dist;
  }, [isNavigating, simulatedNodeId, simulatedPathIndex, fullRoutePath, routeDistance, edgeIndex]);

  const dynamicDuration = useMemo(() => {
    if (!isNavigating || !simulatedNodeId || fullRoutePath.length === 0) {
      return routeDuration;
    }
    let dist = 0;
    let stairsCount = 0;
    let liftCount = 0;
    for (let i = simulatedPathIndex + 1; i < fullRoutePath.length; i++) {
      const from = fullRoutePath[i - 1];
      const to = fullRoutePath[i];
      const edge = edgeIndex.get(`${from}|${to}`);
      if (edge) {
        dist += edge.distance ?? (edge as any).weight ?? 0;
        if (edge.type === 'stairs') stairsCount++;
        if (edge.type === 'lift') liftCount++;
      }
    }
    let estTime = dist / 1.4;
    estTime += stairsCount * 20;
    estTime += liftCount * 30;
    return estTime;
  }, [isNavigating, simulatedNodeId, simulatedPathIndex, fullRoutePath, routeDuration, edgeIndex]);

  const routeToSosIncident = useCallback(
    (incident: SosIncident) => {
      if (!nodes || nodes.length === 0) return;

      // 0. Ensure active dashboard is 'nav' and navigation drawer is revealed
      useSafetyStore.getState().setActiveDashboard('nav');
      setSidebarOpen(true);

      // 1. Find the exact nearest graph node from the location of SOS
      let bestDestNode: MapNode | null = null;

      // A. If the incident explicitly references a graph node ID
      const incNodeId = incident.nodeId || (incident as any).sosNodeId;
      if (incNodeId && nodesMap[incNodeId]) {
        bestDestNode = nodesMap[incNodeId];
      }

      // B. If incident has map coordinates (x, y), find nearest node on that map
      if (!bestDestNode && incident.x != null && !isNaN(incident.x) && incident.y != null && !isNaN(incident.y)) {
        const sameMapNodes = incident.map ? nodes.filter((n) => n.map === incident.map) : [];
        const pool = sameMapNodes.length > 0 ? sameMapNodes : nodes;

        let minEuclideanDist = Infinity;
        for (const n of pool) {
          const d = Math.hypot(n.x - incident.x, n.y - incident.y);
          if (d < minEuclideanDist) {
            minEuclideanDist = d;
            bestDestNode = n;
          }
        }
      }

      // C. If incident has GPS coordinates (lat, lng), find nearest node by real geo-distance
      if (!bestDestNode && incident.lat != null && incident.lng != null) {
        let minGeoDist = Infinity;
        for (const n of nodes) {
          if (n.lat != null && n.lng != null) {
            const d = haversineDistanceMeters(
              { lat: incident.lat, lon: incident.lng },
              { lat: n.lat, lon: n.lng }
            );
            if (d < minGeoDist) {
              minGeoDist = d;
              bestDestNode = n;
            }
          }
        }
      }

      // D. Fallback by name / location text (e.g. "Academic Block", "Conclave")
      if (!bestDestNode && (incident.title || incident.description)) {
        const searchText = `${incident.title} ${incident.description || ''}`.toLowerCase();
        bestDestNode = nodes.find(
          (n) => n.name && searchText.includes(n.name.toLowerCase())
        ) || null;
      }

      // E. Safe fallback node
      if (!bestDestNode) {
        bestDestNode = nodes.find((n) => n.id === 'Conclave') || nodes[0];
      }

      // 2. Resolve start location (current selection, user GPS, or Main Gate)
      let startNode: any = null;
      const curLoc = currentLocationRef.current;
      const userGps = userGpsCoordsRef.current;

      if (curLoc && nodesMap[curLoc.id] && curLoc.id !== bestDestNode.id) {
        startNode = curLoc;
      } else if (userGps) {
        let minStartGeoDist = Infinity;
        for (const n of nodes) {
          if (n.lat != null && n.lng != null && n.id !== bestDestNode.id) {
            const d = haversineDistanceMeters(
              { lat: userGps.lat, lon: userGps.lon },
              { lat: n.lat, lon: n.lng }
            );
            if (d < minStartGeoDist) {
              minStartGeoDist = d;
              startNode = n;
            }
          }
        }
      }

      if (!startNode || startNode.id === bestDestNode.id) {
        const mainGate = nodesMap['Main_Gate'] || nodes.find((n) => n.id === 'Main_Gate');
        if (mainGate && mainGate.id !== bestDestNode.id) {
          startNode = mainGate;
        } else {
          startNode = nodes.find((n) => n.id !== bestDestNode.id) || nodes[0];
        }
      }

      const destLocation = {
        id: bestDestNode.id,
        name: `🚨 ${incident.title}`,
        searchName: incident.title.toLowerCase(),
        map: bestDestNode.map,
        floor: incident.floor ?? (bestDestNode as any).floor ?? 0,
        building: (bestDestNode as any).building || 'Incident Spot',
        category: 'Incident',
        x: bestDestNode.x,
        y: bestDestNode.y,
        lat: incident.lat || bestDestNode.lat,
        lng: incident.lng || bestDestNode.lng,
        isIncident: true,
        incidentId: incident.id,
      };

      const startLocation = {
        id: startNode.id,
        name: startNode.name || 'Your Location',
        searchName: (startNode.name || '').toLowerCase(),
        map: startNode.map,
        floor: (startNode as any).floor ?? 0,
        building: (startNode as any).building || 'Campus',
        category: (startNode as any).category || 'Location',
        x: startNode.x,
        y: startNode.y,
        lat: startNode.lat,
        lng: startNode.lng,
      };

      routeAbortRef.current?.abort();
      setDestination(destLocation);
      setCurrentLocation(startLocation);
      setSelectedMapId(startLocation.map || destLocation.map);
      setIsNavigating(true);
      setActiveStepIndex(0);
      setAutoFitNonce((n) => n + 1);
    },
    [nodes, nodesMap]
  );

  const handleStartNavigation = useCallback(async () => {
    if (!destination) return;
    if (!currentLocation) {
      let startNode: any = null;
      if (userGpsCoords) {
        startNode = findNearestCampusNode({ lat: userGpsCoords.lat, lon: userGpsCoords.lon }, nodes);
      }
      if (!startNode || startNode.id === destination.id) {
        startNode = nodesMap['Main_Gate'] || nodes.find((n) => n.id === 'Main_Gate') || nodes[0];
      }
      if (startNode) {
        setCurrentLocation(startNode);
      }
    }
    setIsNavigating(true);
    setActiveStepIndex(0);
    setAutoFitNonce((n) => n + 1);
  }, [destination, currentLocation, userGpsCoords, nodes, nodesMap]);

  const handleExitNavigation = useCallback(() => {
    setIsNavigating(false);
    setIsSimulating(false);
    setSimulatedNodeId(null);
    setActiveStepIndex(0);
    setAutoFitNonce((n) => n + 1);
    setSelectedMapId(null);
  }, []);

  const filteredSuggestions = useMemo(() => {
    const rawQ = mobileSearchQuery.trim().toLowerCase();
    if (!rawQ) return campusLocations.slice(0, 10);
    const cleanQ = rawQ
      .replace(/^(i am in|i'm in|im in|my location is|current location is)\s*/i, '')
      .replace(/room\s*no\.?|room\s*number|room\s*no|room|rm|classroom/gi, '')
      .replace(/[-\s]/g, '')
      .trim();

    return campusLocations.filter((loc) => {
      const searchStr = (loc.searchName ?? loc.name.toLowerCase()).toLowerCase();
      if (searchStr.includes(rawQ)) return true;
      if (cleanQ && searchStr.replace(/[-\s]/g, '').includes(cleanQ)) return true;
      return false;
    });
  }, [mobileSearchQuery, campusLocations]);

  const contextValue = useMemo(() => ({
    nodes,
    edges,
    buildings,
    floors,
    loading,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    isMenuOpen,
    setIsMenuOpen,
    isBottomSheetExpanded,
    setIsBottomSheetExpanded,
    activeSearchField,
    setActiveSearchField,
    mobileSearchQuery,
    setMobileSearchQuery,
    destination,
    currentLocation,
    isNavigating,
    isComputingRoute,
    pathPoints,
    navigationDirections,
    navigationSteps,
    activeStepIndex,
    autoFitNonce,
    selectedMapId,
    activeMapId,
    filteredSuggestions,
    handleDestinationSelect,
    handleDestinationClear,
    handleCurrentLocationSelect,
    handleCurrentLocationClear,
    handleResetNavigation,
    handleSwapLocations,
    handleStartNavigation,
    handleExitNavigation,
    setActiveStepIndex,
    setSelectedMapId,
    campusLocations,
    nodesMap,
    routeDistance: dynamicDistance,
    routeDuration: dynamicDuration,
    accessibleOnly,
    setAccessibleOnly,
    isSimulating,
    setIsSimulating,
    simulatedNodeId,
    compassHeading,
    userGpsCoords,
    userSvgCoords,
    gpsAccuracy,
    isGpsActive,
    isGpsLocating,
    isOutsideCampus,
    gpsError,
    enableGps,
    disableGps,
    useGpsAsStartLocation,
    routeToSosIncident,
  }), [
    nodes,
    edges,
    buildings,
    floors,
    loading,
    isMobile,
    sidebarOpen,
    isMenuOpen,
    isBottomSheetExpanded,
    activeSearchField,
    mobileSearchQuery,
    destination,
    currentLocation,
    isNavigating,
    isComputingRoute,
    pathPoints,
    navigationDirections,
    navigationSteps,
    activeStepIndex,
    autoFitNonce,
    selectedMapId,
    activeMapId,
    filteredSuggestions,
    handleDestinationSelect,
    handleDestinationClear,
    handleCurrentLocationSelect,
    handleCurrentLocationClear,
    handleResetNavigation,
    handleSwapLocations,
    handleStartNavigation,
    handleExitNavigation,
    campusLocations,
    nodesMap,
    dynamicDistance,
    dynamicDuration,
    accessibleOnly,
    isSimulating,
    simulatedNodeId,
    compassHeading,
    userGpsCoords,
    userSvgCoords,
    gpsAccuracy,
    isGpsActive,
    isGpsLocating,
    isOutsideCampus,
    gpsError,
    enableGps,
    disableGps,
    useGpsAsStartLocation,
    routeToSosIncident,
  ]);

  return (
    <CampusNavigationContext.Provider value={contextValue}>
      {children}
    </CampusNavigationContext.Provider>
  );
}

export function useCampusNavigation() {
  const context = useContext(CampusNavigationContext);
  if (context === undefined) {
    return {
      nodes: [],
      edges: [],
      buildings: [],
      floors: [],
      loading: false,
      isMobile: false,
      sidebarOpen: true,
      setSidebarOpen: () => {},
      isMenuOpen: false,
      setIsMenuOpen: () => {},
      isBottomSheetExpanded: false,
      setIsBottomSheetExpanded: () => {},
      activeSearchField: null,
      setActiveSearchField: () => {},
      mobileSearchQuery: '',
      setMobileSearchQuery: () => {},
      destination: null,
      currentLocation: null,
      isNavigating: false,
      isComputingRoute: false,
      pathPoints: '',
      navigationDirections: [],
      navigationSteps: [],
      activeStepIndex: 0,
      autoFitNonce: 0,
      selectedMapId: null,
      activeMapId: 'Campus_Map',
      filteredSuggestions: [],
      handleDestinationSelect: () => {},
      handleDestinationClear: () => {},
      handleCurrentLocationSelect: () => {},
      handleCurrentLocationClear: () => {},
      handleResetNavigation: () => {},
      handleSwapLocations: () => {},
      handleStartNavigation: async () => {},
      handleExitNavigation: () => {},
      setActiveStepIndex: () => {},
      setSelectedMapId: () => {},
      campusLocations: [],
      nodesMap: {},
      routeDistance: 0,
      routeDuration: 0,
      isMultiFloor: false,
      floorChangeNotice: null,
      isVoiceEnabled: false,
      toggleVoice: () => {},
      isAccessibleOnly: false,
      toggleAccessibleOnly: () => {},
      accessibleOnly: false,
      isSimulating: false,
      simulatedNodeId: null,
      compassHeading: 0,
      userGpsCoords: { lat: 26.230752, lon: 78.205341 },
      userSvgCoords: { x: 500, y: 350 },
      gpsAccuracy: 2.5,
      isGpsActive: true,
      isGpsLocating: false,
      isOutsideCampus: false,
      gpsError: null,
      enableGps: () => {},
      disableGps: () => {},
      useGpsAsStartLocation: () => {},
      routeToSosIncident: () => {},
    } as unknown as CampusNavigationContextType;
  }
  return context;
}

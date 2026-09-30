// src/hooks/useCampusNavigation.tsx
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { fetchNodes, fetchEdges, fetchBuildings, fetchFloors } from '@/lib/api';
import { computeMultiMapRouteAsync, buildNodesMap, buildGlobalGraph } from '@/lib/multiMapNavigation';
import type { NavigationStep } from '@/lib/multiMapNavigation';
import { buildUndirectedEdgeIndex } from '@/lib/navigation_instructions';
import { buildNavigationStepViewModel } from '@/pages/Map/services/navigationStepService';
import type { MapNode, MapEdge, Building, FloorMap } from '@/types';
import { parseRoomName } from '@/lib/roomParser';

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

  const unmountedRef = useRef(false);
  const routeAbortRef = useRef<AbortController | null>(null);

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
        const searchName = String(name || '').toLowerCase();

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
    setSelectedMapId(null);
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
    if (!isNavigating || isSimulating) return;

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
  }, [isNavigating, isSimulating]);

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

  const handleStartNavigation = useCallback(async () => {
    if (!destination || !currentLocation) return;
    setIsNavigating(true);
    setActiveStepIndex(0);
    setAutoFitNonce((n) => n + 1);
  }, [destination, currentLocation]);

  const handleExitNavigation = useCallback(() => {
    setIsNavigating(false);
    setIsSimulating(false);
    setSimulatedNodeId(null);
    setActiveStepIndex(0);
    setAutoFitNonce((n) => n + 1);
    setSelectedMapId(null);
  }, []);

  const filteredSuggestions = useMemo(() => {
    const q = mobileSearchQuery.trim().toLowerCase();
    if (!q) return campusLocations.slice(0, 10);
    return campusLocations.filter(loc =>
      (loc.searchName ?? loc.name.toLowerCase()).includes(q)
    );
  }, [mobileSearchQuery, campusLocations]);

  const contextValue = useMemo(() => ({
    nodes,
    edges,
    buildings,
    floors,
    loading,
    isMobile,
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
  }), [
    nodes,
    edges,
    buildings,
    floors,
    loading,
    isMobile,
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
    throw new Error('useCampusNavigation must be used within a CampusNavigationProvider');
  }
  return context;
}

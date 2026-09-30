// src/hooks/usePathfinding.ts
import { useEffect, useState, useRef } from 'react';
import { useMapStore } from '@/store/mapStore';
import { dijkstra } from '@/lib/dijkstra';
import { buildGlobalGraph } from '@/lib/multiMapNavigation';
import { buildRoute } from '@/lib/routeBuilder';
import { DEFAULT_ROUTE_OPTIONS } from '@/constants';
import type { Route } from '@/types';

/** React hook that runs Dijkstra's pathfinding algorithm when both source and destination are selected. */
export function usePathfinding(): {
  route: Route | null;
  isComputing: boolean;
} {
  const graph = useMapStore(state => state.graph);
  const selectedFrom = useMapStore(state => state.selectedFrom);
  const selectedTo = useMapStore(state => state.selectedTo);
  const currentRoute = useMapStore(state => state.currentRoute);
  const setCurrentRoute = useMapStore(state => state.setCurrentRoute);
  const setError = useMapStore(state => state.setError);

  const [isComputing, setIsComputing] = useState(false);

  const adjacencyGraphRef = useRef<any>(null);
  const prevEdgesRef = useRef<any>(null);

  useEffect(() => {
    if (!selectedFrom || !selectedTo) {
      setCurrentRoute(null);
      return;
    }

    if (!graph) {
      return;
    }

    setIsComputing(true);

    const timer = setTimeout(() => {
      try {
        if (selectedFrom.id === selectedTo.id) {
          setError(null);
          const route = buildRoute(graph, [selectedFrom.id], DEFAULT_ROUTE_OPTIONS);
          setCurrentRoute(route);
          return;
        }

        let adjacencyGraph = adjacencyGraphRef.current;
        if (!adjacencyGraph || prevEdgesRef.current !== graph.edges) {
          adjacencyGraph = buildGlobalGraph(graph.edges);
          adjacencyGraphRef.current = adjacencyGraph;
          prevEdgesRef.current = graph.edges;
        }

        const nodeIds = dijkstra(
          adjacencyGraph,
          selectedFrom.id,
          selectedTo.id
        );

        if (!nodeIds) {
          setError('No route found');
          setCurrentRoute(null);
        } else {
          const route = buildRoute(graph, nodeIds, DEFAULT_ROUTE_OPTIONS);
          if (!route) {
            setError('No route found');
            setCurrentRoute(null);
          } else {
            setError(null);
            setCurrentRoute(route);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error computing route';
        setError(message);
        setCurrentRoute(null);
      } finally {
        setIsComputing(false);
      }
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [graph, selectedFrom, selectedTo, setCurrentRoute, setError]);

  return {
    route: currentRoute,
    isComputing,
  };
}


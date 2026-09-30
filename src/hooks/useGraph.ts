// src/hooks/useGraph.ts
import { useEffect } from 'react';
import { useMapStore } from '@/store/mapStore';
import { fetchNodes, fetchEdges, fetchBuildings, fetchFloors } from '@/lib/api';

// Module-level caches to avoid multiple fetch requests on double mount
let globalGraphPromise: Promise<any> | null = null;
let globalFloorsPromise: Promise<any> | null = null;

/** React hook that initiates graph data loading on mount and stores it in the Zustand store. */
export function useGraph(): {
  isLoading: boolean;
  error: string | null;
  isGraphLoaded: boolean;
} {
  const isLoading = useMapStore((state) => state.isLoading);
  const error = useMapStore((state) => state.error);
  const isGraphLoaded = useMapStore((state) => state.isGraphLoaded);
  const setGraph = useMapStore((state) => state.setGraph);
  const setFloors = useMapStore((state) => state.setFloors);
  const setLoading = useMapStore((state) => state.setLoading);
  const setError = useMapStore((state) => state.setError);

  useEffect(() => {
    if (isGraphLoaded) {
      return;
    }

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        if (!globalGraphPromise) {
          globalGraphPromise = Promise.all([
            fetchNodes(),
            fetchEdges(),
            fetchBuildings(),
          ]);
        }

        const [nodes, edges, buildings] = await globalGraphPromise;
        const graph = { nodes, edges, buildings };
        setGraph(graph);
        useMapStore.setState({ isGraphLoaded: true });

        if (!globalFloorsPromise) {
          globalFloorsPromise = fetchFloors();
        }

        const floors = await globalFloorsPromise;
        setFloors(floors);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch graph data';
        setError(message);
        globalGraphPromise = null;
        globalFloorsPromise = null;
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isGraphLoaded, setGraph, setFloors, setLoading, setError]);

  return {
    isLoading,
    error,
    isGraphLoaded,
  };
}


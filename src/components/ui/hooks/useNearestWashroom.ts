// src/components/ui/hooks/useNearestWashroom.ts
import { useEffect, useRef, useState } from 'react';
import { dijkstraDistancesAsync } from '@/lib/dijkstraDistances';
import type { DijkstraGraph } from '@/lib/dijkstra';

export interface WashroomLocation {
  id: string;
  name: string;
  searchName: string;
  map: string | null;
  building: string;
  floor: number | null;
  category: string;
  x: number;
  y: number;
}

interface UseNearestWashroomParams {
  currentLocation: { id: string } | null;
  isWashroomSelectionMode: boolean;
  filteredLocations: WashroomLocation[];
  graph: DijkstraGraph;
}

/**
 * Computes nearest washroom asynchronously and cancels stale requests.
 */
export default function useNearestWashroom({
  currentLocation,
  isWashroomSelectionMode,
  filteredLocations,
  graph,
}: UseNearestWashroomParams): { nearestWashroom: WashroomLocation | null } {
  const [nearestWashroom, setNearestWashroom] = useState<WashroomLocation | null>(null);

  const requestIdRef = useRef<number>(0);
  const distancesCacheRef = useRef<Map<string, Record<string, number>>>(new Map());

  const maxCacheSize = 4;

  useEffect(() => {
    return () => {
      distancesCacheRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!currentLocation || !isWashroomSelectionMode || filteredLocations.length === 0) {
      setNearestWashroom(null);
      return;
    }

    const startId = currentLocation.id;
    const targetNodeIds = filteredLocations.map((loc) => loc.id);
    const targetSignature = targetNodeIds.join('|');
    const cacheKey = `${startId}|${targetSignature}`;

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    (async () => {
      try {
        let distances = distancesCacheRef.current.get(cacheKey);
        if (!distances) {
          distances = await dijkstraDistancesAsync(graph, startId, {
            signal: controller.signal,
            yieldEvery: 2000,
            targetNodeIds,
          });
          if (controller.signal.aborted || requestId !== requestIdRef.current) return;
          distancesCacheRef.current.set(cacheKey, distances);

          if (distancesCacheRef.current.size > maxCacheSize) {
            const oldestKey = distancesCacheRef.current.keys().next().value;
            if (oldestKey != null) distancesCacheRef.current.delete(oldestKey);
          }
        }

        if (distancesCacheRef.current.has(cacheKey)) {
          distancesCacheRef.current.delete(cacheKey);
          distancesCacheRef.current.set(cacheKey, distances);
        }

        let best: WashroomLocation | null = null;
        let bestDist = Infinity;
        for (const loc of filteredLocations) {
          const d = distances?.[loc.id];
          if (d != null && d < bestDist) {
            bestDist = d;
            best = loc;
          }
        }

        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        setNearestWashroom(bestDist < Infinity ? best : null);
      } catch (e) {
        if (!controller.signal.aborted) setNearestWashroom(null);
      }
    })();

    return () => controller.abort();
  }, [currentLocation?.id, isWashroomSelectionMode, filteredLocations, graph]);

  return { nearestWashroom };
}

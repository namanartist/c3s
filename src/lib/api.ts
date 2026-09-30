// src/lib/api.ts
import type { MapNode, MapEdge, Building, FloorMap } from '@/types';
import fallbackData from '@/lib/mock-data/campusDataFallback.json';

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

/** Generic helper to fetch array data from the backend APIs with offline fallback. */
export async function apiFetch<T>(path: string): Promise<T[]> {
  const getFallback = (): T[] => {
    if (path.includes('nodes')) return (fallbackData.nodes as unknown as T[]);
    if (path.includes('edges')) return (fallbackData.edges as unknown as T[]);
    if (path.includes('buildings')) return (fallbackData.buildings as unknown as T[]);
    if (path.includes('floors')) return (fallbackData.floors as unknown as T[]);
    return [];
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`API request ${path} returned status ${response.status}, loading fallback.`);
      return getFallback();
    }
    const json = (await response.json()) as { data?: T[] };
    if (Array.isArray(json.data) && json.data.length > 0) {
      return json.data;
    }
    return getFallback();
  } catch (error) {
    console.warn(`Failed to fetch from ${path}, activating high-reliability fallback:`, error);
    return getFallback();
  }
}

/** Fetches nodes list from the serverless API. */
export async function fetchNodes(): Promise<MapNode[]> {
  return apiFetch<MapNode>('/api/nodes');
}

/** Fetches edges list from the serverless API. */
export async function fetchEdges(): Promise<MapEdge[]> {
  return apiFetch<MapEdge>('/api/edges');
}

/** Fetches buildings list from the serverless API. */
export async function fetchBuildings(): Promise<Building[]> {
  return apiFetch<Building>('/api/buildings');
}

/** Fetches floors list from the serverless API. */
export async function fetchFloors(): Promise<FloorMap[]> {
  return apiFetch<FloorMap>('/api/floors');
}

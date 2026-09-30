// src/lib/api.ts
import type { MapNode, MapEdge, Building, FloorMap } from '@/types';

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '';

/** Generic helper to fetch array data from the backend APIs. */
export async function apiFetch<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      return [];
    }
    const json = (await response.json()) as { data?: T[] };
    return json.data ?? [];
  } catch (error) {
    console.error(`Failed to fetch from ${path}:`, error);
    return [];
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

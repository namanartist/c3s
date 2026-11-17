// src/lib/api.ts
import type { MapNode, MapEdge, Building, FloorMap } from '@/types';
import fallbackData from '@/lib/mock-data/campusDataFallback.json';

const rawApiBase = import.meta.env.VITE_API_BASE_URL;
// Default to relative '' when unset or set to stale localhost:3000 so Vite /api proxy (port 3001) is used
export const API_BASE: string = (!rawApiBase || rawApiBase.includes('localhost:3000')) ? '' : rawApiBase;

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

/**
 * Creates or updates an SOS incident in the MongoDB database via /api/sos.
 */
export async function createSosIncident(incident: any): Promise<{ success: boolean; incident?: any }> {
  try {
    const res = await fetch(`${API_BASE}/api/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    });
    if (!res.ok) {
      console.warn(`[api] /api/sos returned status ${res.status}`);
      return { success: false };
    }
    const data = await res.json();
    return { success: true, incident: data.incident };
  } catch (err) {
    console.warn('[api] Failed to persist SOS incident to database:', err);
    return { success: false };
  }
}

/**
 * Fetches recent SOS incidents from the MongoDB database.
 */
export async function fetchSosIncidents(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/sos`);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

/**
 * Updates an SOS incident's status or responder assignment in MongoDB.
 */
export async function updateSosIncident(
  id: string,
  action: 'resolve' | 'responding' | 'accept' | 'update',
  responder?: string
): Promise<boolean> {
  try {
    const targetUrl = action === 'update' ? `${API_BASE}/api/sos` : `${API_BASE}/api/sos/${id}/${action}`;
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, responder })
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Persists student / staff check-in or check-out movements to the database.
 */
export async function recordGateMovement(data: {
  userId?: string;
  userName?: string;
  userRole?: string;
  department?: string;
  movement: 'CHECK-IN' | 'CHECK-OUT';
  gateName: string;
  gateId?: string;
  method?: string;
}): Promise<any> {
  try {
    const endpoint = data.movement === 'CHECK-IN' ? '/api/gate/check-in' : '/api/gate/check-out';
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[api] Gate movement recording failed:', err);
    return null;
  }
}

/**
 * Fetches gate history from the database.
 */
export async function fetchGateHistory(userId?: string): Promise<any[]> {
  try {
    const url = userId ? `${API_BASE}/api/gate/history?userId=${encodeURIComponent(userId)}` : `${API_BASE}/api/gate/history`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

/**
 * Loads the persisted user settings from MongoDB via /api/settings.
 * Returns the merged settings object (falls back to defaults when the DB is unavailable).
 */
export async function fetchSettings(userId?: string): Promise<{
  settings: Record<string, unknown> | null;
  source: 'mongodb' | 'default';
  updatedAt?: string;
}> {
  try {
    const url = userId
      ? `${API_BASE}/api/settings?userId=${encodeURIComponent(userId)}`
      : `${API_BASE}/api/settings`;
    const res = await fetch(url, { headers: { 'X-User-Id': userId ?? 'global' } });
    if (!res.ok) return { settings: null, source: 'default' };
    const json = (await res.json()) as {
      data?: Record<string, unknown>;
      source?: 'mongodb' | 'default';
      updatedAt?: string;
    };
    return { settings: json?.data ?? null, source: json?.source ?? 'default', updatedAt: json?.updatedAt };
  } catch {
    return { settings: null, source: 'default' };
  }
}

/**
 * Persists user settings to MongoDB via /api/settings (PUT).
 * Callers should pass the full merged settings object.
 */
export async function saveSettings(
  settings: Record<string, unknown>,
  userId?: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId ?? 'global' },
      body: JSON.stringify({ ...settings, userId: userId ?? 'global' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Pings the database to retrieve health and connected collection status.
 */
export async function fetchDbStatus(): Promise<{ success: boolean; connected: boolean; database?: string; collections?: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/db-status`);
    if (!res.ok) return { success: false, connected: false };
    return await res.json();
  } catch {
    return { success: false, connected: false };
  }
}

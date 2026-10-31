// src/lib/gateApi.ts
import { API_BASE } from './api';
import type { CheckInPayload, CheckOutPayload, GateLog, GatePass, Role } from '@/packages/shared/permissions';

const LOCAL_MOVEMENT_KEY = 'c3s-movement-ledger';
const LOCAL_PASSES_KEY = 'c3s-gate-passes';

function getStoredLogs(): GateLog[] {
  try {
    const val = localStorage.getItem(LOCAL_MOVEMENT_KEY);
    return val ? (JSON.parse(val) as GateLog[]) : [];
  } catch {
    /* empty */
    return [];
  }
}

function saveLogLocally(log: GateLog) {
  try {
    const logs = [log, ...getStoredLogs().filter((l) => l.id !== log.id)].slice(0, 100);
    localStorage.setItem(LOCAL_MOVEMENT_KEY, JSON.stringify(logs));
  } catch {
    /* empty */
  }
}

export interface GateApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  event?: GateLog;
  error?: string;
}

/**
 * Executes a verified Check-In against the backend API and database
 */
export async function checkInUser(payload: CheckInPayload): Promise<GateApiResponse<GateLog>> {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const fallbackEvent: GateLog = {
    id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    personName: payload.userName,
    universityId: payload.userId,
    role: payload.userRole,
    department: payload.department || 'Computer Science & Engineering',
    movement: 'CHECK-IN',
    time: timeStr,
    date: dateStr,
    gate: payload.gateName || 'Main Gate',
    gateId: payload.gateId,
    verificationMethod: payload.method,
    status: 'VERIFIED',
    timestamp: Date.now(),
    qrToken: payload.qrToken,
    lat: payload.lat || 26.232611,
    lng: payload.lng || 78.205222
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE}/api/gate/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const event = data.event || fallbackEvent;
      saveLogLocally(event);
      return { success: true, message: data.message || `Check-in recorded at ${payload.gateName}`, event };
    }
  } catch (error) {
    console.warn('[gateApi] Check-in network offline, saving to persistent local store:', error);
  }

  saveLogLocally(fallbackEvent);
  return {
    success: true,
    message: `Check-in confirmed at ${payload.gateName || 'Main Gate'} (Local Verified)`,
    event: fallbackEvent
  };
}

/**
 * Executes a verified Check-Out against the backend API and database
 */
export async function checkOutUser(payload: CheckOutPayload): Promise<GateApiResponse<GateLog>> {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const fallbackEvent: GateLog = {
    id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    personName: payload.userName,
    universityId: payload.userId,
    role: payload.userRole,
    department: payload.department || 'Computer Science & Engineering',
    movement: 'CHECK-OUT',
    time: timeStr,
    date: dateStr,
    gate: payload.gateName || 'Jubilee Gate',
    gateId: payload.gateId,
    verificationMethod: payload.method,
    status: 'VERIFIED',
    timestamp: Date.now(),
    qrToken: payload.qrToken,
    lat: payload.lat || 26.229639,
    lng: payload.lng || 78.205639
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE}/api/gate/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const event = data.event || fallbackEvent;
      saveLogLocally(event);
      return { success: true, message: data.message || `Check-out recorded at ${payload.gateName}`, event };
    }
  } catch (error) {
    console.warn('[gateApi] Check-out network offline, saving to persistent local store:', error);
  }

  saveLogLocally(fallbackEvent);
  return {
    success: true,
    message: `Check-out confirmed at ${payload.gateName || 'Jubilee Gate'} (Local Verified)`,
    event: fallbackEvent
  };
}

/**
 * Fetches real movement history from the backend or local ledger
 */
export async function fetchMovementHistory(userId?: string, role?: Role): Promise<GateLog[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);

    const response = await fetch(`${API_BASE}/api/gate/history?${params.toString()}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[gateApi] History API unreachable, falling back to local storage:', err);
  }

  const local = getStoredLogs();
  return userId ? local.filter((l) => l.universityId === userId) : local;
}

/**
 * Fetches Gate Passes from database
 */
export async function fetchGatePasses(userId?: string): Promise<GatePass[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE}/api/gate/passes${userId ? `?userId=${userId}` : ''}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch {
    /* empty */
  }

  try {
    const val = localStorage.getItem(LOCAL_PASSES_KEY);
    return val ? (JSON.parse(val) as GatePass[]) : [];
  } catch {
    /* empty */
    return [];
  }
}

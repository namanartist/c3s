// src/lib/realtimeSosMesh.ts
import { API_BASE } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { SosIncident } from '@/types/safety';

const REALTIME_CHANNEL_NAME = 'c3s-campus-sos-sync';

// Active Supabase broadcast channel
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

try {
  realtimeChannel = supabase.channel(REALTIME_CHANNEL_NAME);
  realtimeChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('[RealtimeSosMesh]: Connected to Supabase real-time SOS broadcast mesh.');
    }
  });
} catch (e) {
  console.warn('[RealtimeSosMesh]: Could not initialize Supabase Realtime channel:', e);
}

/**
 * Broadcasts an SOS incident to ALL connected devices (mobile, laptop, SOC workstations).
 * Uses dual dispatch:
 * 1. Supabase Realtime WebSocket broadcast (sub-second worldwide sync)
 * 2. Local LAN API POST (/api/sos) via Vite proxy for local offline network sync
 */
export async function broadcastSosIncident(incident: SosIncident): Promise<void> {
  // 1. Broadcast via Supabase Realtime WebSocket
  try {
    if (realtimeChannel) {
      await realtimeChannel.send({
        type: 'broadcast',
        event: 'sos-incident',
        payload: incident
      });
    }
  } catch (err) {
    console.warn('[RealtimeSosMesh]: Supabase broadcast dispatch non-fatal error:', err);
  }

  // 2. Dispatch to Local LAN Server API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    await fetch(`${API_BASE}/api/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch {
    // Non-fatal LAN fallback when offline or running client-only
  }
}

/**
 * Subscribes the current device to real-time incoming SOS incidents from ANY other IP device.
 * Employs dual listeners:
 * 1. Supabase Realtime broadcast listener
 * 2. High-frequency 1500ms polling to /api/sos for local LAN mesh
 */
export function startRealtimeSosSync(
  onRemoteIncident: (incident: SosIncident) => void
): () => void {
  const knownSignatures = new Map<string, string>();
  let isSubscribed = true;

  // 1. Supabase Realtime Listener
  let unsubSupabase = () => {};
  try {
    if (realtimeChannel) {
      realtimeChannel.on('broadcast', { event: 'sos-incident' }, ({ payload }) => {
        if (!isSubscribed || !payload || !payload.id) return;
        const signature = `${payload.id}_${payload.status}_${payload.timestamp}`;
        if (knownSignatures.get(payload.id) === signature) return;
        knownSignatures.set(payload.id, signature);
        onRemoteIncident(payload as SosIncident);
      });
    }
  } catch (err) {
    console.warn('[RealtimeSosMesh]: Could not attach Supabase Realtime broadcast listener:', err);
  }

  // 2. High-Frequency LAN API Polling (1.5s interval)
  const pollServer = async () => {
    if (!isSubscribed) return;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${API_BASE}/api/sos`, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const items: any[] = Array.isArray(json.data) ? json.data : [];

        for (const raw of items) {
          if (!raw.id) continue;
          const signature = `${raw.id}_${raw.status}_${raw.timestamp}`;
          if (knownSignatures.get(raw.id) !== signature) {
            knownSignatures.set(raw.id, signature);

            const mapped: SosIncident = {
              id: raw.id,
              category: raw.category || 'security',
              severity: raw.severity || 'critical',
              title: raw.title || '🚨 Campus SOS Incident',
              description: raw.description || 'Emergency SOS trigger received.',
              map: raw.map || 'Campus_Map',
              floor: raw.floor ?? 0,
              x: raw.x ?? 500,
              y: raw.y ?? 350,
              lat: raw.lat ?? 26.230752,
              lng: raw.lng ?? 78.205341,
              timestamp: raw.timestamp || Date.now(),
              status: raw.status || 'active',
              reportedBy: raw.reportedBy || 'Student Distress Signal',
              responderAssigned: raw.assignedResponder || raw.responderAssigned,
              notifiedResponders: raw.notifiedResponders || ['Guard 02', 'Faculty Warden', 'Chief Proctor'],
              evidence: raw.evidence || {
                photoUrl: raw.photoUrl,
                videoUrl: raw.videoUrl
              }
            };

            onRemoteIncident(mapped);
          }
        }
      }
    } catch {
      // Network or offline fallback - non fatal
    }
  };

  // Initial poll
  pollServer();
  const intervalId = setInterval(pollServer, 1500);

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
    unsubSupabase();
  };
}


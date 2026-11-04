// src/lib/aiSurveillanceClient.ts
/**
 * Client library connecting frontend dashboard to the Python/FastAPI AI Surveillance Backend.
 * Supports incident management, live camera telemetry, evidence retrieval, and WebSocket alerts.
 */

import { API_BASE } from '@/lib/api';

export interface AiSurveillanceIncident {
  id: string;
  camera_id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  location: string;
  duration_seconds: number;
  status: 'ALERT_SENT' | 'CONFIRMED' | 'RESOLVED' | 'FALSE_POSITIVE';
  reported_by: string;
  notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AiEvidenceRecord {
  id: string;
  incident_id: string;
  media_type: 'ORIGINAL_SNAPSHOT' | 'ANNOTATED_SNAPSHOT' | 'VIDEO_CLIP';
  file_path: string;
  file_size_bytes: number;
  sha256_hash: string;
  pre_buffer_seconds: number;
  post_buffer_seconds: number;
  is_tamper_verified: boolean;
  created_at: string;
}

export interface AiIncidentDetailResponse {
  incident: AiSurveillanceIncident;
  evidence: AiEvidenceRecord[];
  audit_trail: Array<{
    actor_id: string;
    actor_role: string;
    action: string;
    details: any;
    created_at: string;
  }>;
}

const AI_BACKEND_URL = (import.meta.env.VITE_AI_BACKEND_URL as string) || 'http://localhost:8000';

class AiSurveillanceApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AI_BACKEND_URL;
  }

  /**
   * Fetches live list of AI-detected incidents.
   */
  async getIncidents(statusFilter?: string): Promise<AiSurveillanceIncident[]> {
    try {
      const url = new URL(`${this.baseUrl}/api/incidents/`);
      if (statusFilter) url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.data || [];
    } catch {
      // Graceful fallback to empty array if Python backend is offline
      return [];
    }
  }

  /**
   * Fetches complete evidence and audit history for an incident.
   */
  async getIncidentDetail(incidentId: string): Promise<AiIncidentDetailResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/incidents/${incidentId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Confirms a genuine incident.
   */
  async confirmIncident(incidentId: string, actorId: string, notes?: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/incidents/${incidentId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor_id: actorId, actor_role: 'PROCTOR', notes }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Flags an incident as false positive.
   */
  async markFalsePositive(incidentId: string, actorId: string, notes?: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/incidents/${incidentId}/false-positive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor_id: actorId, actor_role: 'PROCTOR', notes }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Resolves an incident.
   */
  async resolveIncident(incidentId: string, actorId: string, resolutionNotes: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor_id: actorId, actor_role: 'PROCTOR', resolution_notes: resolutionNotes }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Opens WebSocket connection for instant streaming of incoming SOS incidents.
   */
  connectAlertsWebSocket(onAlert: (alert: any) => void): () => void {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/ws/alerts';
    let ws: WebSocket | null = null;
    let isClosedIntentionally = false;

    const initWs = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onAlert(data);
          } catch {}
        };
        ws.onclose = () => {
          if (!isClosedIntentionally) {
            setTimeout(initWs, 3000); // Reconnect
          }
        };
      } catch {}
    };

    initWs();

    return () => {
      isClosedIntentionally = true;
      if (ws) ws.close();
    };
  }
}

export const aiSurveillanceClient = new AiSurveillanceApiClient();


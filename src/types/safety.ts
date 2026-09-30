// src/types/safety.ts

export type DashboardMode = 'nav' | 'soc' | 'analytics' | 'patrol' | 'gate';
export type UserRole = 'student' | 'faculty' | 'guard' | 'proctor' | 'admin' | 'gate_keeper' | 'other';

export interface IncidentEvidence {
  recordingUrl?: string;
  recordingMimeType?: string;
  recordedAt?: number;
  recordedDurationSeconds?: number;
  photoUrl?: string;
  videoUrl?: string;
  aiClassification?: {
    category: IncidentCategory;
    severity: IncidentSeverity;
    confidence: number;
    title?: string;
    summary?: string;
    reasoning?: string;
    recommendedAction?: string;
    dispatchUnits?: string[];
    detectedHazards?: string[];
    modelUsed?: string;
  };
}

export type IncidentCategory = 'medical' | 'security' | 'fire' | 'harassment' | 'infrastructure';
export type IncidentSeverity = 'critical' | 'high' | 'medium';
export type IncidentStatus = 'active' | 'responding' | 'resolved';
export type IncidentDeliveryState = 'queued' | 'relayed' | 'synced';
export type ResponderWorkflowStatus = 'unassigned' | 'dispatched' | 'enroute' | 'on_scene' | 'resolved';

export interface SosIncident {
  id: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  map: string;
  floor: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  timestamp: number;
  status: IncidentStatus;
  reportedBy?: string;
  phone?: string;
  responderAssigned?: string;
  responderStatus?: ResponderWorkflowStatus;
  responderEta?: string;
  responderNodeId?: string;
  notifiedResponders?: string[];
  evidence?: IncidentEvidence;
  deliveryState?: IncidentDeliveryState;
  relayHops?: number;
  lastRelayedAt?: number;
}

export type MapTheme = 'standard' | 'satellite' | '3d' | 'dark' | 'safety';

export interface SafetyAmenity {
  id: string;
  type: 'guard_post' | 'emergency_phone' | 'first_aid' | 'fire_extinguisher' | 'cctv';
  name: string;
  map: string;
  floor: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  phone?: string;
}

export type CrowdDensity = 'low' | 'moderate' | 'high' | 'critical';

export interface CctvCamera {
  id: string;
  name: string;
  location: string;
  map: string;
  floor: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'alert';
  resolution: string;
  fps: number;
  ptz: boolean;
  zone: string;
  bearingDeg: number;
  coverageAngleDeg: number;
  lastMotionDetected?: string;
  crowdLabel?: string;
  crowdCount?: number;
  crowdDensity?: CrowdDensity;
  confidence?: number;
  latencyMs?: number;
  streamUrl?: string;
}

export interface PatrolUnit {
  id: string;
  name: string;
  badge: string;
  officer: string;
  phone: string;
  radioChannel: string;
  status: 'on_duty' | 'dispatched' | 'patrolling' | 'standby';
  map: string;
  floor: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  battery: number;
  currentAssignment?: string;
}

export interface CampusAlert {
  id: string;
  type: 'lockdown' | 'evacuation' | 'weather' | 'all_clear';
  active: boolean;
  title: string;
  message: string;
  issuedAt: number;
  issuedBy: string;
}

export interface EmergencyContact {
  title: string;
  role: string;
  phone: string;
  icon: string;
  available: string;
}

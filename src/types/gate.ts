// src/types/gate.ts

export type GateId = 'GATE-MAIN' | 'GATE-JUBILEE' | 'GATE-PARKING';

export interface CampusGate {
  id: GateId;
  code: string;
  name: string;
  alternateName?: string;
  location: string;
  map: string;
  floor: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  status: 'active' | 'restricted' | 'maintenance';
  gateKeeperName: string;
  phone: string;
  assignedKeeperRole: string;
  checkInsToday: number;
  checkOutsToday: number;
  currentOccupancy: number;
  qrVersion: number;
  lastQrRotatedAt: number;
}

export interface GateQrToken {
  gateId: GateId;
  gateName: string;
  dateStr: string; // YYYY-MM-DD
  version: number;
  token: string;
  expiresAt: number; // Midnight timestamp
  signature: string;
  issuedAt: number;
}

export type MovementStatus = 'OUTSIDE' | 'INSIDE';

export type MovementType = 'CHECK-IN' | 'CHECK-OUT';

export interface MovementEvent {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  gateId: GateId;
  gateName: string;
  type: MovementType;
  timestamp: number;
  method: 'QR_SCAN' | 'SECURITY_OVERRIDE' | 'MANUAL_ENTRY';
  overrideReason?: string;
  authorizedBy?: string;
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracy?: number;
  geofenceStatus?: GeofenceStatus;
}

export type GeofenceStatus = 'INSIDE_CAMPUS' | 'NEAR_BOUNDARY' | 'OUTSIDE_CAMPUS' | 'UNKNOWN';

export interface LocationConsistencyAlert {
  id: string;
  userId: string;
  userName: string;
  movementStatus: MovementStatus;
  geofenceStatus: GeofenceStatus;
  lat: number;
  lng: number;
  timestamp: number;
  message: string;
  acknowledged: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actor: string;
  role: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'QR_GENERATED'
    | 'QR_REGENERATED'
    | 'CHECK_IN'
    | 'CHECK_OUT'
    | 'INVALID_QR_ATTEMPT'
    | 'INVALID_MOVEMENT_ATTEMPT'
    | 'SECURITY_OVERRIDE'
    | 'GPS_ACCESSED'
    | 'CONSISTENCY_ALERT'
    | 'SOS_TRIGGERED'
    | 'CAMERA_ACCESSED';
  resource: string;
  result: 'SUCCESS' | 'REJECTED' | 'WARNING';
  details: string;
  ip?: string;
  device?: string;
}

export interface GateOccupancyStats {
  totalCampusInside: number;
  totalCheckInsToday: number;
  totalCheckOutsToday: number;
  byGate: Record<GateId, {
    name: string;
    checkIns: number;
    checkOuts: number;
    netInside: number;
  }>;
}

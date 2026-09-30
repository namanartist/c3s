// src/store/gateStore.ts
import { create } from 'zustand';
import type {
  CampusGate,
  GateId,
  GateQrToken,
  MovementEvent,
  MovementStatus,
  MovementType,
  GeofenceStatus,
  LocationConsistencyAlert,
  AuditLogEntry,
  GateOccupancyStats
} from '@/types/gate';
import {
  generateDailyGateQr,
  validateGateQrToken,
  validateMovementTransition,
  checkCampusGeofence,
  getDailyDateString
} from '@/lib/gateSecurity';

const MOVEMENT_STATUS_KEY = 'c3s-user-movement-status';
const MOVEMENT_LEDGER_KEY = 'c3s-movement-ledger';
const AUDIT_LOG_KEY = 'c3s-audit-logs';

const INITIAL_GATES: Record<GateId, CampusGate> = {
  'GATE-MAIN': {
    id: 'GATE-MAIN',
    code: 'GATE-01',
    name: 'Main Gate (Gate 1)',
    alternateName: 'North Highway Entrance',
    location: 'Main Campus North Entry Road',
    map: 'Campus_Map',
    floor: 0,
    x: 253.0593,
    y: 606.1033,
    lat: 26.232611,
    lng: 78.205222,
    status: 'active',
    gateKeeperName: 'Head Guard Rajesh Sharma',
    phone: '+91 751-2409301',
    assignedKeeperRole: 'GATE_KEEPER',
    checkInsToday: 1622,
    checkOutsToday: 1490,
    currentOccupancy: 132,
    qrVersion: 1,
    lastQrRotatedAt: Date.now() - 1000 * 60 * 60 * 8
  },
  'GATE-JUBILEE': {
    id: 'GATE-JUBILEE',
    code: 'GATE-04',
    name: 'Jubilee Gate (Gate 4)',
    alternateName: 'Hostel & Residential Axis',
    location: 'South Perimeter Road near Boy\'s Hostels',
    map: 'Campus_Map',
    floor: 0,
    x: 749.9669,
    y: 127.5277,
    lat: 26.229639,
    lng: 78.205639,
    status: 'active',
    gateKeeperName: 'Guard Mahendra Patel',
    phone: '+91 751-2409304',
    assignedKeeperRole: 'GATE_KEEPER',
    checkInsToday: 412,
    checkOutsToday: 388,
    currentOccupancy: 24,
    qrVersion: 1,
    lastQrRotatedAt: Date.now() - 1000 * 60 * 60 * 8
  },
  'GATE-PARKING': {
    id: 'GATE-PARKING',
    code: 'GATE-02',
    name: 'New Parking Gate (Gate 2)',
    alternateName: 'Student Parking & Two-Wheeler Transit',
    location: 'West Campus Vehicular Parking Lot',
    map: 'Campus_Map',
    floor: 0,
    x: 815.0,
    y: 606.1033,
    lat: 26.231389,
    lng: 78.203639,
    status: 'active',
    gateKeeperName: 'Guard Vikram Singh',
    phone: '+91 751-2409302',
    assignedKeeperRole: 'GATE_KEEPER',
    checkInsToday: 447,
    checkOutsToday: 421,
    currentOccupancy: 26,
    qrVersion: 1,
    lastQrRotatedAt: Date.now() - 1000 * 60 * 60 * 8
  }
};

const BASE_CAMPUS_RESIDENTS = 2299; // Base campus resident count + net gate delta = 2,481

function readStoredStatus(): MovementStatus {
  try {
    const val = localStorage.getItem(MOVEMENT_STATUS_KEY);
    return val === 'INSIDE' ? 'INSIDE' : 'OUTSIDE';
  } catch {
    return 'OUTSIDE';
  }
}

function readStoredLedger(): MovementEvent[] {
  try {
    const val = localStorage.getItem(MOVEMENT_LEDGER_KEY);
    return val ? (JSON.parse(val) as MovementEvent[]) : [];
  } catch {
    return [];
  }
}

function readStoredAudit(): AuditLogEntry[] {
  try {
    const val = localStorage.getItem(AUDIT_LOG_KEY);
    return val ? (JSON.parse(val) as AuditLogEntry[]) : [];
  } catch {
    return [];
  }
}

export interface GateState {
  gates: Record<GateId, CampusGate>;
  dailyTokens: Record<GateId, GateQrToken>;
  activeGateId: GateId;
  movementStatus: MovementStatus;
  userMovementHistory: MovementEvent[];
  allMovements: MovementEvent[];
  auditLogs: AuditLogEntry[];

  // GPS & Geofence tracking
  isLocationActive: boolean;
  gpsCoords: { lat: number; lng: number; accuracy: number; timestamp: number } | null;
  locationPermission: 'granted' | 'denied' | 'prompt';
  locationStatus: GeofenceStatus;
  consistencyAlert: LocationConsistencyAlert | null;

  // Scanner modal state
  scannerModalOpen: boolean;
  activeScanResult: { success: boolean; message: string; event?: MovementEvent } | null;

  // Actions
  setActiveGate: (gateId: GateId) => void;
  setScannerModalOpen: (open: boolean) => void;
  clearScanResult: () => void;
  getGateQr: (gateId: GateId) => GateQrToken;
  rotateGateQr: (gateId: GateId, actor: string, reason?: string) => GateQrToken;

  // Core Movement Operations
  executeGateScan: (
    qrString: string,
    user: { identifier: string; name: string; role: string },
    forcedType?: MovementType
  ) => { success: boolean; message: string; event?: MovementEvent };

  staffEmergencyOverride: (
    gateId: GateId,
    type: MovementType,
    reason: string,
    user: { identifier: string; name: string; role: string },
    authorizedBy: string
  ) => MovementEvent;

  // Location Lifecycle
  updateGpsLocation: (coords: { lat: number; lng: number; accuracy: number }) => void;
  setLocationPermission: (permission: 'granted' | 'denied' | 'prompt') => void;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  dismissConsistencyAlert: () => void;

  // Computed Helpers
  getOccupancyStats: () => GateOccupancyStats;
  appendAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
}

export const useGateStore = create<GateState>((set, get) => {
  // Generate initial daily tokens for the 3 gates
  const initialTokens: Record<GateId, GateQrToken> = {
    'GATE-MAIN': generateDailyGateQr('GATE-MAIN', 1),
    'GATE-JUBILEE': generateDailyGateQr('GATE-JUBILEE', 1),
    'GATE-PARKING': generateDailyGateQr('GATE-PARKING', 1)
  };

  const storedStatus = readStoredStatus();
  const storedLedger = readStoredLedger();
  const storedAudit = readStoredAudit();

  return {
    gates: INITIAL_GATES,
    dailyTokens: initialTokens,
    activeGateId: 'GATE-MAIN',
    movementStatus: storedStatus,
    userMovementHistory: storedLedger,
    allMovements: storedLedger,
    auditLogs: storedAudit,

    isLocationActive: storedStatus === 'INSIDE',
    gpsCoords: null,
    locationPermission: 'prompt',
    locationStatus: 'UNKNOWN',
    consistencyAlert: null,

    scannerModalOpen: false,
    activeScanResult: null,

    setActiveGate: (gateId) => set({ activeGateId: gateId }),

    setScannerModalOpen: (scannerModalOpen) => set({ scannerModalOpen }),

    clearScanResult: () => set({ activeScanResult: null }),

    getGateQr: (gateId) => {
      const state = get();
      const existing = state.dailyTokens[gateId];
      const todayStr = getDailyDateString();
      if (existing && existing.dateStr === todayStr && Date.now() < existing.expiresAt) {
        return existing;
      }
      // Generate refreshed daily token
      const newToken = generateDailyGateQr(gateId, (state.gates[gateId]?.qrVersion || 1));
      set((s) => ({
        dailyTokens: { ...s.dailyTokens, [gateId]: newToken }
      }));
      return newToken;
    },

    rotateGateQr: (gateId, actor, reason = 'Routine gate refresh / daily rollover') => {
      const state = get();
      const currentGate = state.gates[gateId];
      const newVersion = (currentGate?.qrVersion || 1) + 1;
      const newToken = generateDailyGateQr(gateId, newVersion);

      const updatedGate: CampusGate = {
        ...currentGate,
        qrVersion: newVersion,
        lastQrRotatedAt: Date.now()
      };

      set((s) => ({
        gates: { ...s.gates, [gateId]: updatedGate },
        dailyTokens: { ...s.dailyTokens, [gateId]: newToken }
      }));

      get().appendAuditLog({
        actor,
        role: 'GATE_KEEPER',
        action: 'QR_REGENERATED',
        resource: gateId,
        result: 'SUCCESS',
        details: `Rotated daily QR to version ${newVersion}. Reason: ${reason}`
      });

      return newToken;
    },

    executeGateScan: (qrString, user, forcedType) => {
      const state = get();
      const currentStatus = state.movementStatus;

      // 1. Cryptographic and expiration validation
      const validation = validateGateQrToken(qrString);
      if (!validation.valid || !validation.gateId || !validation.token) {
        get().appendAuditLog({
          actor: user.name,
          role: user.role,
          action: 'INVALID_QR_ATTEMPT',
          resource: 'QR_SCANNER',
          result: 'REJECTED',
          details: validation.error || 'Failed QR validation'
        });

        const res = { success: false, message: validation.error || 'Invalid QR code' };
        set({ activeScanResult: res });
        return res;
      }

      const gateId = validation.gateId;
      const gate = state.gates[gateId];

      // 2. Determine target movement type
      // If user is OUTSIDE -> CHECK-IN. If INSIDE -> CHECK-OUT.
      const actionType: MovementType = forcedType || (currentStatus === 'OUTSIDE' ? 'CHECK-IN' : 'CHECK-OUT');

      // 3. Movement State Machine Rule Enforcement
      const transition = validateMovementTransition(currentStatus, actionType);
      if (!transition.allowed) {
        get().appendAuditLog({
          actor: user.name,
          role: user.role,
          action: 'INVALID_MOVEMENT_ATTEMPT',
          resource: gateId,
          result: 'REJECTED',
          details: transition.reason || 'Invalid transition'
        });

        const res = { success: false, message: transition.reason || 'Invalid state transition' };
        set({ activeScanResult: res });
        return res;
      }

      // 4. Create authoritative Movement Event
      const nextStatus: MovementStatus = actionType === 'CHECK-IN' ? 'INSIDE' : 'OUTSIDE';
      const event: MovementEvent = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.identifier,
        userName: user.name,
        userRole: user.role,
        gateId,
        gateName: gate.name,
        type: actionType,
        timestamp: Date.now(),
        method: 'QR_SCAN',
        gpsLat: state.gpsCoords?.lat,
        gpsLng: state.gpsCoords?.lng,
        gpsAccuracy: state.gpsCoords?.accuracy,
        geofenceStatus: state.locationStatus
      };

      // 5. Update Gate counters & User Movement Ledger
      const updatedGate: CampusGate = {
        ...gate,
        checkInsToday: actionType === 'CHECK-IN' ? gate.checkInsToday + 1 : gate.checkInsToday,
        checkOutsToday: actionType === 'CHECK-OUT' ? gate.checkOutsToday + 1 : gate.checkOutsToday,
        currentOccupancy:
          actionType === 'CHECK-IN' ? gate.currentOccupancy + 1 : Math.max(0, gate.currentOccupancy - 1)
      };

      const updatedHistory = [event, ...state.userMovementHistory];
      try {
        localStorage.setItem(MOVEMENT_STATUS_KEY, nextStatus);
        localStorage.setItem(MOVEMENT_LEDGER_KEY, JSON.stringify(updatedHistory.slice(0, 50)));
      } catch {}

      set((s) => ({
        gates: { ...s.gates, [gateId]: updatedGate },
        movementStatus: nextStatus,
        userMovementHistory: updatedHistory,
        allMovements: [event, ...s.allMovements],
        isLocationActive: nextStatus === 'INSIDE',
        activeScanResult: {
          success: true,
          message: `${actionType} SUCCESSFUL at ${gate.name}`,
          event
        }
      }));

      // 6. Audit Logging
      get().appendAuditLog({
        actor: user.name,
        role: user.role,
        action: actionType === 'CHECK-IN' ? 'CHECK_IN' : 'CHECK_OUT',
        resource: gateId,
        result: 'SUCCESS',
        details: `User completed ${actionType} at ${gate.name} via QR token.`
      });

      return {
        success: true,
        message: `${actionType} SUCCESSFUL at ${gate.name}`,
        event
      };
    },

    staffEmergencyOverride: (gateId, type, reason, user, authorizedBy) => {
      const state = get();
      const gate = state.gates[gateId];
      const nextStatus: MovementStatus = type === 'CHECK-IN' ? 'INSIDE' : 'OUTSIDE';

      const event: MovementEvent = {
        id: `override_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.identifier,
        userName: user.name,
        userRole: user.role,
        gateId,
        gateName: gate.name,
        type,
        timestamp: Date.now(),
        method: 'SECURITY_OVERRIDE',
        overrideReason: reason,
        authorizedBy
      };

      const updatedGate: CampusGate = {
        ...gate,
        checkInsToday: type === 'CHECK-IN' ? gate.checkInsToday + 1 : gate.checkInsToday,
        checkOutsToday: type === 'CHECK-OUT' ? gate.checkOutsToday + 1 : gate.checkOutsToday,
        currentOccupancy: type === 'CHECK-IN' ? gate.currentOccupancy + 1 : Math.max(0, gate.currentOccupancy - 1)
      };

      const updatedHistory = [event, ...state.userMovementHistory];
      try {
        localStorage.setItem(MOVEMENT_STATUS_KEY, nextStatus);
        localStorage.setItem(MOVEMENT_LEDGER_KEY, JSON.stringify(updatedHistory.slice(0, 50)));
      } catch {}

      set((s) => ({
        gates: { ...s.gates, [gateId]: updatedGate },
        movementStatus: nextStatus,
        userMovementHistory: updatedHistory,
        allMovements: [event, ...s.allMovements],
        isLocationActive: nextStatus === 'INSIDE'
      }));

      get().appendAuditLog({
        actor: authorizedBy,
        role: 'SECURITY_GUARD',
        action: 'SECURITY_OVERRIDE',
        resource: gateId,
        result: 'SUCCESS',
        details: `Manual gate override to ${type} for user ${user.name} (${user.identifier}). Reason: ${reason}`
      });

      return event;
    },

    updateGpsLocation: (coords) => {
      const geofence = checkCampusGeofence(coords.lat, coords.lng);
      const state = get();

      // Check for consistency warning (Inside per gate ledger, but GPS indicates outside)
      let consistencyAlert: LocationConsistencyAlert | null = state.consistencyAlert;
      if (state.movementStatus === 'INSIDE' && geofence === 'OUTSIDE_CAMPUS') {
        consistencyAlert = {
          id: `alert_geo_${Date.now()}`,
          userId: 'current-user',
          userName: 'Active Student',
          movementStatus: 'INSIDE',
          geofenceStatus: 'OUTSIDE_CAMPUS',
          lat: coords.lat,
          lng: coords.lng,
          timestamp: Date.now(),
          message:
            'Location consistency advisory: Last gate status indicates INSIDE, but device GPS reports coordinates outside the campus boundary. No punitive action taken.',
          acknowledged: false
        };

        get().appendAuditLog({
          actor: 'C3S_GEOFENCE_ENGINE',
          role: 'SYSTEM',
          action: 'CONSISTENCY_ALERT',
          resource: 'GEOFENCE',
          result: 'WARNING',
          details: `User GPS (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}) outside boundary while gate status is INSIDE.`
        });
      }

      set({
        gpsCoords: { ...coords, timestamp: Date.now() },
        locationStatus: geofence,
        consistencyAlert
      });
    },

    setLocationPermission: (locationPermission) => set({ locationPermission }),

    startLocationTracking: () => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        set({ locationPermission: 'denied', isLocationActive: false });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          set({ locationPermission: 'granted', isLocationActive: true });
          get().updateGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        () => {
          set({ locationPermission: 'denied', isLocationActive: false });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    },

    stopLocationTracking: () => {
      set({ isLocationActive: false });
    },

    dismissConsistencyAlert: () => set({ consistencyAlert: null }),

    getOccupancyStats: () => {
      const state = get();
      const gates = state.gates;
      let totalCheckIns = 0;
      let totalCheckOuts = 0;
      let netInsideDelta = 0;

      const byGate = {} as GateOccupancyStats['byGate'];
      for (const [id, gate] of Object.entries(gates) as [GateId, CampusGate][]) {
        totalCheckIns += gate.checkInsToday;
        totalCheckOuts += gate.checkOutsToday;
        const gateNet = gate.checkInsToday - gate.checkOutsToday;
        netInsideDelta += gateNet;
        byGate[id] = {
          name: gate.name,
          checkIns: gate.checkInsToday,
          checkOuts: gate.checkOutsToday,
          netInside: gateNet
        };
      }

      return {
        totalCampusInside: BASE_CAMPUS_RESIDENTS + netInsideDelta,
        totalCheckInsToday: totalCheckIns,
        totalCheckOutsToday: totalCheckOuts,
        byGate
      };
    },

    appendAuditLog: (entry) => {
      const fullEntry: AuditLogEntry = {
        ...entry,
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now()
      };
      set((s) => {
        const next = [fullEntry, ...s.auditLogs].slice(0, 100);
        try {
          localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(next));
        } catch {}
        return { auditLogs: next };
      });
    }
  };
});

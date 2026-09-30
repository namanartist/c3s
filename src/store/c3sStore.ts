import { create } from 'zustand';
import { MOCK_USERS, type C3SRole, type C3SUser } from '@/lib/mock-data/users';
import { MOCK_GATES, type C3SGate } from '@/lib/mock-data/gates';
import { MOCK_INCIDENTS, type C3SIncident, type IncidentStatus } from '@/lib/mock-data/incidents';
import { MOCK_MOVEMENTS, type C3SMovementLog } from '@/lib/mock-data/movement';
import { MOCK_NOTIFICATIONS, type C3SNotification } from '@/lib/mock-data/notifications';
import { MOCK_RESPONDERS, type C3SResponder } from '@/lib/mock-data/responders';
import { MOCK_CAMERAS, type C3SCamera } from '@/lib/mock-data/cameras';

export interface C3SStoreState {
  // Authentication & Role
  currentRole: C3SRole;
  currentUser: C3SUser;
  isAuthenticated: boolean;
  setRole: (role: C3SRole) => void;
  loginAs: (role: C3SRole) => void;
  logout: () => void;

  // Campus Presence (Check-in / Check-out)
  isInsideCampus: boolean;
  checkedInAt: string;
  checkedInGate: string;
  lastCheckOutAt: string | null;
  lastCheckOutGate: string | null;
  confirmCheckIn: (gateName: string) => void;
  confirmCheckOut: (gateName: string) => void;

  // Location & GPS Permission Simulation
  gpsPermission: 'prompt' | 'granted' | 'denied';
  isLocationActive: boolean;
  gpsAccuracy: number;
  latitude: number;
  longitude: number;
  lastLocationUpdate: string;
  requestGpsPermission: () => void;
  toggleLocation: () => void;

  // Emergency SOS State Machine
  sosActive: boolean;
  sosIncidentId: string | null;
  sosStatus: IncidentStatus;
  sosRespondersNotified: number;
  sosAssignedResponder: string;
  sosDistanceMeters: number;
  sosLocation: string;
  triggerSos: () => void;
  cancelSos: () => void;
  advanceSosStatus: () => void;
  setSosStatus: (status: IncidentStatus) => void;

  // Gate Management & QR
  selectedGateId: string;
  gates: C3SGate[];
  setSelectedGateId: (id: string) => void;
  regenerateGateQr: (gateId: string) => void;

  // Incidents
  incidents: C3SIncident[];
  createIncident: (incident: Omit<C3SIncident, 'id' | 'reportedAt' | 'timeline'>) => string;
  assignGuardToIncident: (incidentId: string, guardName: string) => void;
  advanceIncidentStatus: (incidentId: string) => void;
  resolveIncident: (incidentId: string) => void;
  addIncidentNote: (incidentId: string, note: string) => void;

  // Live Activity & Feeds
  movementLogs: C3SMovementLog[];
  notifications: C3SNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  responders: C3SResponder[];
  cameras: C3SCamera[];
  updateC3SCameras: (updater: (cameras: C3SCamera[]) => C3SCamera[]) => void;

  // Demo Walkthrough Mode
  demoStep: number;
  isDemoGuideOpen: boolean;
  toggleDemoGuide: () => void;
  advanceDemoFlow: () => void;
  setDemoStep: (step: number) => void;
  resetAllDemoData: () => void;
}

const STORAGE_KEY = 'c3s_security_state_v1';

export const useC3SStore = create<C3SStoreState>((set, get) => {
  // Try to load initial persisted state if available
  let initialRole: C3SRole = 'STUDENT';
  let initialInside = true;
  let initialGps: 'prompt' | 'granted' | 'denied' = 'granted';
  let initialLocActive = true;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currentRole) initialRole = parsed.currentRole;
      if (parsed.isInsideCampus !== undefined) initialInside = parsed.isInsideCampus;
      if (parsed.gpsPermission) initialGps = parsed.gpsPermission;
      if (parsed.isLocationActive !== undefined) initialLocActive = parsed.isLocationActive;
    }
  } catch {
    // Ignore storage parse issues
  }

  const defaultUser = MOCK_USERS.find((u) => u.role === initialRole) || MOCK_USERS[0];

  return {
    currentRole: initialRole,
    currentUser: defaultUser,
    isAuthenticated: true,

    setRole: (role: C3SRole) => {
      const matched = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
      set({ currentRole: role, currentUser: matched });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentRole: role }));
      } catch {}
    },

    loginAs: (role: C3SRole) => {
      const matched = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
      set({ currentRole: role, currentUser: matched, isAuthenticated: true });
    },

    logout: () => {
      set({ isAuthenticated: false });
    },

    // Presence
    isInsideCampus: initialInside,
    checkedInAt: '08:42 AM',
    checkedInGate: 'Main Gate',
    lastCheckOutAt: null,
    lastCheckOutGate: null,

    confirmCheckIn: (gateName: string) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newLog: C3SMovementLog = {
        id: `mov-${Date.now()}`,
        personName: get().currentUser.name,
        universityId: get().currentUser.universityId,
        role: get().currentRole,
        department: get().currentUser.department,
        movement: 'CHECK-IN',
        time: timeStr,
        date: '29 Sep 2026',
        gate: gateName,
        verificationMethod: 'QR_SCAN',
        status: 'VERIFIED'
      };

      set((state) => ({
        isInsideCampus: true,
        checkedInAt: timeStr,
        checkedInGate: gateName,
        movementLogs: [newLog, ...state.movementLogs],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            category: 'Gate',
            title: 'Check-in Verified',
            message: `Successfully checked in at ${gateName}. Campus safety tracking active.`,
            time: timeStr,
            date: 'Today',
            priority: 'NORMAL',
            read: false,
            link: '/student'
          },
          ...state.notifications
        ]
      }));
    },

    confirmCheckOut: (gateName: string) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newLog: C3SMovementLog = {
        id: `mov-${Date.now()}`,
        personName: get().currentUser.name,
        universityId: get().currentUser.universityId,
        role: get().currentRole,
        department: get().currentUser.department,
        movement: 'CHECK-OUT',
        time: timeStr,
        date: '29 Sep 2026',
        gate: gateName,
        verificationMethod: 'QR_SCAN',
        status: 'VERIFIED'
      };

      set((state) => ({
        isInsideCampus: false,
        lastCheckOutAt: timeStr,
        lastCheckOutGate: gateName,
        isLocationActive: false, // Location status ends on exit
        movementLogs: [newLog, ...state.movementLogs],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            category: 'Gate',
            title: 'Check-out Verified',
            message: `Checked out via ${gateName}. You are now marked outside campus.`,
            time: timeStr,
            date: 'Today',
            priority: 'NORMAL',
            read: false,
            link: '/student'
          },
          ...state.notifications
        ]
      }));
    },

    // GPS & Location
    gpsPermission: initialGps,
    isLocationActive: initialLocActive,
    gpsAccuracy: 8,
    latitude: 26.2183,
    longitude: 78.1828,
    lastLocationUpdate: 'Just now',

    requestGpsPermission: () => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      set({
        gpsPermission: 'granted',
        isLocationActive: true,
        lastLocationUpdate: now
      });
    },

    toggleLocation: () => {
      set((state) => ({ isLocationActive: !state.isLocationActive }));
    },

    // SOS State Machine
    sosActive: false,
    sosIncidentId: null,
    sosStatus: 'ALERT SENT',
    sosRespondersNotified: 3,
    sosAssignedResponder: 'Guard 02 (Vikram Rathore)',
    sosDistanceMeters: 320,
    sosLocation: 'Academic Block A, 2nd Floor',

    triggerSos: () => {
      const incidentId = 'C3S-INC-00192';
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      set({
        sosActive: true,
        sosIncidentId: incidentId,
        sosStatus: 'ALERT SENT',
        sosRespondersNotified: 3,
        sosAssignedResponder: 'Guard 02 (Vikram Rathore)',
        sosDistanceMeters: 320,
        notifications: [
          {
            id: `notif-sos-${Date.now()}`,
            category: 'Emergency',
            title: '🚨 EMERGENCY SOS ACTIVE',
            message: `SOS Incident ${incidentId} opened at Academic Block A. 3 responders alerted.`,
            time: now,
            date: 'Today',
            priority: 'CRITICAL',
            read: false,
            link: '/student/sos'
          },
          ...get().notifications
        ]
      });
    },

    cancelSos: () => {
      set({ sosActive: false, sosIncidentId: null, sosStatus: 'RESOLVED' });
    },

    advanceSosStatus: () => {
      const current = get().sosStatus;
      const order: IncidentStatus[] = ['ALERT SENT', 'ACKNOWLEDGED', 'EN ROUTE', 'ARRIVED', 'RESOLVED'];
      const nextIdx = order.indexOf(current) + 1;
      if (nextIdx < order.length) {
        const nextStatus = order[nextIdx];
        set({
          sosStatus: nextStatus,
          sosDistanceMeters: nextStatus === 'ARRIVED' ? 0 : nextStatus === 'EN ROUTE' ? 120 : get().sosDistanceMeters
        });
        if (nextStatus === 'RESOLVED') {
          // Keep active flag visible briefly or mark resolved
        }
      }
    },

    setSosStatus: (status: IncidentStatus) => {
      set({ sosStatus: status });
    },

    // Gates
    selectedGateId: 'gate-main',
    gates: MOCK_GATES,
    setSelectedGateId: (id: string) => set({ selectedGateId: id }),

    regenerateGateQr: (gateId: string) => {
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const updatedGates = get().gates.map((g) => {
        if (g.id === gateId) {
          return {
            ...g,
            qrToken: `C3S-QR-${g.code}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`,
            qrStatus: 'ACTIVE' as const
          };
        }
        return g;
      });
      set({
        gates: updatedGates,
        notifications: [
          {
            id: `notif-qr-${Date.now()}`,
            category: 'Gate',
            title: 'Gate QR Regenerated',
            message: `New digital QR active for ${gateId}. Previous tokens revoked.`,
            time: 'Just now',
            date: 'Today',
            priority: 'NORMAL',
            read: false
          },
          ...get().notifications
        ]
      });
    },

    // Incidents
    incidents: MOCK_INCIDENTS,

    createIncident: (incidentData) => {
      const id = `C3S-INC-00${Math.floor(193 + Math.random() * 50)}`;
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newIncident: C3SIncident = {
        ...incidentData,
        id,
        reportedAt: now,
        status: 'ALERT SENT',
        timeline: [
          { time: now, event: 'Incident Created & Dispatched', actor: get().currentUser.name }
        ]
      };
      set((state) => ({
        incidents: [newIncident, ...state.incidents],
        notifications: [
          {
            id: `notif-inc-${Date.now()}`,
            category: 'Security',
            title: `Incident Logged: ${incidentData.title}`,
            message: `Reported at ${incidentData.location}. Priority: ${incidentData.priority}`,
            time: now,
            date: 'Today',
            priority: incidentData.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            read: false,
            link: `/security/incidents/${id}`
          },
          ...state.notifications
        ]
      }));
      return id;
    },

    assignGuardToIncident: (incidentId: string, guardName: string) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      set((state) => ({
        incidents: state.incidents.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              assignedResponder: guardName,
              status: 'EN ROUTE',
              timeline: [
                ...inc.timeline,
                { time: now, event: `Assigned to ${guardName}`, actor: 'SOC Dispatch' },
                { time: now, event: `${guardName} En Route`, actor: guardName }
              ]
            };
          }
          return inc;
        })
      }));
    },

    advanceIncidentStatus: (incidentId: string) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const order: IncidentStatus[] = ['ALERT SENT', 'ACKNOWLEDGED', 'EN ROUTE', 'ARRIVED', 'RESOLVED'];
      set((state) => ({
        incidents: state.incidents.map((inc) => {
          if (inc.id === incidentId) {
            const nextIdx = Math.min(order.indexOf(inc.status) + 1, order.length - 1);
            const nextStatus = order[nextIdx];
            return {
              ...inc,
              status: nextStatus,
              timeline: [
                ...inc.timeline,
                { time: now, event: `Status updated to ${nextStatus}`, actor: get().currentUser.name }
              ]
            };
          }
          return inc;
        })
      }));
    },

    resolveIncident: (incidentId: string) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      set((state) => ({
        incidents: state.incidents.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              status: 'RESOLVED',
              timeline: [
                ...inc.timeline,
                { time: now, event: 'Incident Resolved & Closed', actor: get().currentUser.name }
              ]
            };
          }
          return inc;
        })
      }));
    },

    addIncidentNote: (incidentId: string, note: string) => {
      set((state) => ({
        incidents: state.incidents.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              notes: [...(inc.notes || []), note]
            };
          }
          return inc;
        })
      }));
    },

    // Movement Logs & Notifications & Responders
    movementLogs: MOCK_MOVEMENTS,
    notifications: MOCK_NOTIFICATIONS,

    markNotificationRead: (id: string) => {
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      }));
    },

    clearAllNotifications: () => {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      }));
    },

    responders: MOCK_RESPONDERS,
    cameras: MOCK_CAMERAS,
    updateC3SCameras: (updater) => set((state) => ({ cameras: updater(state.cameras) })),

    // Guided Demo Walkthrough Flow
    demoStep: 0,
    isDemoGuideOpen: true,
    toggleDemoGuide: () => set((state) => ({ isDemoGuideOpen: !state.isDemoGuideOpen })),

    advanceDemoFlow: () => {
      set((state) => ({ demoStep: (state.demoStep + 1) % 14 }));
    },

    setDemoStep: (step: number) => set({ demoStep: step }),

    resetAllDemoData: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      set({
        currentRole: 'STUDENT',
        currentUser: MOCK_USERS[0],
        isAuthenticated: true,
        isInsideCampus: true,
        checkedInAt: '08:42 AM',
        checkedInGate: 'Main Gate',
        lastCheckOutAt: null,
        gpsPermission: 'granted',
        isLocationActive: true,
        sosActive: false,
        sosIncidentId: null,
        sosStatus: 'ALERT SENT',
        gates: MOCK_GATES,
        incidents: MOCK_INCIDENTS,
        movementLogs: MOCK_MOVEMENTS,
        notifications: MOCK_NOTIFICATIONS,
        demoStep: 0
      });
    }
  };
});
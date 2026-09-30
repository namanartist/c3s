// src/store/safetyStore.ts
import { create } from 'zustand';
import type {
  SosIncident,
  SafetyAmenity,
  EmergencyContact,
  MapTheme,
  DashboardMode,
  CctvCamera,
  PatrolUnit,
  CampusAlert
} from '@/types/safety';

const INCIDENT_STORAGE_KEY = 'c3s-offline-incidents';

function readStoredIncidents(): SosIncident[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(INCIDENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) as SosIncident[] : [];
  } catch {
    return [];
  }
}

function persistIncidents(incidents: SosIncident[]) {
  if (typeof window !== 'undefined') localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(incidents));
}

export interface SafetyStoreState {
  // C3S Dashboard Mode
  activeDashboard: DashboardMode;
  setActiveDashboard: (mode: DashboardMode) => void;

  // Theme & Camera
  activeTheme: MapTheme;
  is3dMode: boolean;
  pitch: number;
  bearing: number;
  compassHeading: number;

  // SOS Incidents
  incidents: SosIncident[];
  selectedIncident: SosIncident | null;
  sosModalOpen: boolean;
  showIncidentRadar: boolean;

  // CCTV Surveillance
  cctvCameras: CctvCamera[];
  selectedCamera: CctvCamera | null;
  setSelectedCamera: (camera: CctvCamera | null) => void;
  updateCameraStatus: (id: string, status: CctvCamera['status']) => void;
  updateCameraCrowdMetrics: (
    updates: Array<{
      id: string;
      crowdCount?: number;
      crowdDensity?: 'low' | 'moderate' | 'high' | 'critical';
      confidence?: number;
      latencyMs?: number;
      status?: CctvCamera['status'];
      lastMotionDetected?: string;
    }>
  ) => void;

  // Patrol & QRF Fleet
  patrolUnits: PatrolUnit[];
  selectedPatrolUnit: PatrolUnit | null;
  setSelectedPatrolUnit: (unit: PatrolUnit | null) => void;
  dispatchPatrolUnit: (unitId: string, assignment: string) => void;

  // Campus Emergency Alerts
  activeAlert: CampusAlert | null;
  triggerCampusAlert: (alert: Omit<CampusAlert, 'id' | 'issuedAt'>) => void;
  clearCampusAlert: () => void;

  // Amenities & Layers
  safetyAmenities: SafetyAmenity[];
  showSafetyAmenities: boolean;
  activeAmenityFilter: string | null;

  // Emergency Contacts
  emergencyContacts: EmergencyContact[];

  // Real-time Crowd Telemetry
  realCrowdCount: number;
  setRealCrowdCount: (count: number) => void;

  // Node Detail Drawer / Inspection
  selectedNodeForDetail: any | null;
  setSelectedNodeForDetail: (node: any | null) => void;

  // Actions
  setTheme: (theme: MapTheme) => void;
  toggle3dMode: () => void;
  setPitch: (pitch: number) => void;
  setBearing: (bearing: number) => void;
  setCompassHeading: (deg: number) => void;

  triggerSosIncident: (incident: Omit<SosIncident, 'id' | 'timestamp' | 'status'>) => SosIncident;
  updateIncidentStatus: (id: string, status: SosIncident['status'], responder?: string) => void;
  updateIncidentEvidence: (id: string, evidence: SosIncident['evidence']) => void;
  dispatchResponder: (incidentId: string, responderName?: string, responderNodeId?: string) => void;
  advanceResponderStatus: (incidentId: string, nextStatus: 'enroute' | 'on_scene' | 'resolved') => void;
  mergeMeshIncident: (incident: SosIncident) => void;
  setSelectedIncident: (incident: SosIncident | null) => void;
  setSosModalOpen: (open: boolean) => void;
  setShowIncidentRadar: (show: boolean) => void;

  toggleSafetyAmenities: () => void;
  setActiveAmenityFilter: (filter: string | null) => void;
}

const DEFAULT_INCIDENTS: SosIncident[] = [
  {
    id: 'incident_med_01',
    category: 'medical',
    severity: 'critical',
    title: 'Medical Assistance Required',
    description: 'Student experiencing sudden dizziness near Conclave Centre foyer.',
    map: 'Main_GF',
    floor: 0,
    x: 406.8033,
    y: 487.5583,
    lat: 26.230752,
    lng: 78.205341,
    timestamp: Date.now() - 1000 * 60 * 12, // 12 mins ago
    status: 'responding',
    reportedBy: 'Student Volunteer',
    phone: '+91 98765 43210',
    responderAssigned: 'Campus Medical Response Unit 1'
  },
  {
    id: 'incident_sec_02',
    category: 'security',
    severity: 'high',
    title: 'Unauthorized Vehicle near Gate 2',
    description: 'Vehicle parked blocking student pedestrian pathway at New Gate Parking.',
    map: 'Campus_Map',
    floor: 0,
    x: 815.0,
    y: 606.1033,
    lat: 26.231389,
    lng: 78.203639,
    timestamp: Date.now() - 1000 * 60 * 4, // 4 mins ago
    status: 'active',
    reportedBy: 'Parking Attendant',
    phone: '+91 91234 56789'
  }
];

const DEFAULT_AMENITIES: SafetyAmenity[] = [
  {
    id: 'guard_main_gate',
    type: 'guard_post',
    name: 'Main Gate 1 Security Checkpost',
    map: 'Campus_Map',
    floor: 0,
    x: 253.0593,
    y: 606.1033,
    lat: 26.232611,
    lng: 78.205222,
    phone: '+91 751-2409301'
  },
  {
    id: 'guard_new_gate',
    type: 'guard_post',
    name: 'New Gate (Parking) Security Post',
    map: 'Campus_Map',
    floor: 0,
    x: 815.0,
    y: 606.1033,
    lat: 26.231389,
    lng: 78.203639,
    phone: '+91 751-2409302'
  },
  {
    id: 'guard_workshop_gate',
    type: 'guard_post',
    name: 'Workshop Gate 3 Security Post',
    map: 'Campus_Map',
    floor: 0,
    x: 215.0,
    y: 128.4842,
    lat: 26.230750,
    lng: 78.207111,
    phone: '+91 751-2409303'
  },
  {
    id: 'guard_jubilee_gate',
    type: 'guard_post',
    name: 'Jubilee Gate 4 Security Post',
    map: 'Campus_Map',
    floor: 0,
    x: 749.9669,
    y: 127.5277,
    lat: 26.229639,
    lng: 78.205639,
    phone: '+91 751-2409304'
  },
  {
    id: 'first_aid_main',
    type: 'first_aid',
    name: 'Campus Health & Medical Dispensary',
    map: 'Main_GF',
    floor: 0,
    x: 525.4835,
    y: 475.0009,
    lat: 26.230628,
    lng: 78.205118,
    phone: '+91 751-2409399'
  },
  {
    id: 'sos_phone_ai_block',
    type: 'emergency_phone',
    name: 'Emergency SOS Call Pole #3',
    map: 'Campus_Map',
    floor: 0,
    x: 422.8528,
    y: 134.8587,
    lat: 26.230912,
    lng: 78.205943
  },
  {
    id: 'sos_phone_courtyard',
    type: 'emergency_phone',
    name: 'Emergency SOS Call Pole #1',
    map: 'Campus_Map',
    floor: 0,
    x: 499.1435,
    y: 473.2811,
    lat: 26.231154,
    lng: 78.204892
  }
];

const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    title: 'Campus Security Control Room',
    role: 'Central Dispatch',
    phone: '+91 751-2409300',
    icon: 'Shield',
    available: '24/7 Patrol'
  },
  {
    title: 'Campus Medical Dispensary',
    role: 'First Aid & Doctor on Duty',
    phone: '+91 751-2409399',
    icon: 'Cross',
    available: '24 Hours'
  },
  {
    title: 'Women Safety Helpline',
    role: 'Internal Complaints & Safety Cell',
    phone: '+91 751-2409315',
    icon: 'HeartHandshake',
    available: 'Immediate Response'
  },
  {
    title: 'National Emergency Service',
    role: 'Police / Fire / Disaster',
    phone: '112',
    icon: 'PhoneCall',
    available: 'Toll-Free Govt.'
  },
  {
    title: 'National Ambulance Service',
    role: 'Emergency Medical Transport',
    phone: '108',
    icon: 'Ambulance',
    available: 'Toll-Free Govt.'
  }
];

const DEFAULT_CAMERAS: CctvCamera[] = [
  {
    id: 'cam_gate_1',
    name: 'CAM-01 • Main Gate Entrance & ANPR',
    location: 'Gate 1 Main Entrance Road',
    map: 'Campus_Map',
    floor: 0,
    x: 253.0593,
    y: 606.1033,
    lat: 26.232611,
    lng: 78.205222,
    status: 'online',
    resolution: '4K Ultra-HD',
    fps: 60,
    ptz: true,
    zone: 'Perimeter East',
    bearingDeg: 350,
    coverageAngleDeg: 110,
    lastMotionDetected: '12s ago',
    crowdLabel: 'Main Gate',
    crowdCount: 5,
    crowdDensity: 'low',
    confidence: 0.94,
    latencyMs: 38
  },
  {
    id: 'cam_gate_2',
    name: 'CAM-02 • New Gate Parking & Transit Hub',
    location: 'Gate 2 Student Vehicle Parking',
    map: 'Campus_Map',
    floor: 0,
    x: 815.0,
    y: 606.1033,
    lat: 26.231389,
    lng: 78.203639,
    status: 'alert',
    resolution: '4K Ultra-HD',
    fps: 60,
    ptz: true,
    zone: 'Perimeter West',
    bearingDeg: 190,
    coverageAngleDeg: 120,
    lastMotionDetected: 'Active Incident',
    crowdLabel: 'New Gate Parking',
    crowdCount: 18,
    crowdDensity: 'high',
    confidence: 0.91,
    latencyMs: 44
  },
  {
    id: 'cam_conclave',
    name: 'CAM-03 • Conclave Foyer & Quadrangle',
    location: 'Main Building South Entrance',
    map: 'Main_GF',
    floor: 0,
    x: 406.8033,
    y: 487.5583,
    lat: 26.230752,
    lng: 78.205341,
    status: 'alert',
    resolution: '1080p Full-HD',
    fps: 30,
    ptz: true,
    zone: 'Academic South',
    bearingDeg: 45,
    coverageAngleDeg: 95,
    lastMotionDetected: 'Medical Responder Dispatched',
    crowdLabel: 'Conclave Foyer',
    crowdCount: 22,
    crowdDensity: 'critical',
    confidence: 0.98,
    latencyMs: 52
  },
  {
    id: 'cam_library',
    name: 'CAM-04 • Central Library Plaza',
    location: 'Library Forecourt & Walkway',
    map: 'Campus_Map',
    floor: 0,
    x: 690.6019,
    y: 393.3739,
    lat: 26.230815,
    lng: 78.204795,
    status: 'online',
    resolution: '1080p Full-HD',
    fps: 30,
    ptz: false,
    zone: 'Academic Central',
    bearingDeg: 280,
    coverageAngleDeg: 80,
    lastMotionDetected: '1m ago',
    crowdLabel: 'Central Library Plaza',
    crowdCount: 7,
    crowdDensity: 'moderate',
    confidence: 0.93,
    latencyMs: 41
  },
  {
    id: 'cam_jubilee',
    name: 'CAM-05 • Jubilee Gate 4 & Hostel Axis',
    location: 'Jubilee Gate Southern Checkpost',
    map: 'Campus_Map',
    floor: 0,
    x: 749.9669,
    y: 127.5277,
    lat: 26.229639,
    lng: 78.205639,
    status: 'online',
    resolution: '1080p Full-HD',
    fps: 30,
    ptz: true,
    zone: 'Perimeter South',
    bearingDeg: 175,
    coverageAngleDeg: 105,
    lastMotionDetected: '4m ago',
    crowdLabel: 'Jubilee Gate',
    crowdCount: 3,
    crowdDensity: 'low',
    confidence: 0.96,
    latencyMs: 36
  },
  {
    id: 'cam_workshop',
    name: 'CAM-06 • Heavy Engineering Labs & Workshop',
    location: 'Workshop Gate 3 Road',
    map: 'Campus_Map',
    floor: 0,
    x: 215.0,
    y: 128.4842,
    lat: 26.230750,
    lng: 78.207111,
    status: 'online',
    resolution: '1080p Full-HD',
    fps: 30,
    ptz: false,
    zone: 'Perimeter North',
    bearingDeg: 60,
    coverageAngleDeg: 90,
    lastMotionDetected: '8m ago',
    crowdLabel: 'Engineering Workshop',
    crowdCount: 2,
    crowdDensity: 'low',
    confidence: 0.89,
    latencyMs: 39
  }
];

const DEFAULT_PATROL_UNITS: PatrolUnit[] = [
  {
    id: 'patrol_alpha',
    name: 'QRF Alpha Rover',
    badge: 'MITS-QRF-01',
    officer: 'Inspector R.S. Tomar & Driver',
    phone: '+91 98765 11223',
    radioChannel: 'VHF CH-01 (Priority)',
    status: 'patrolling',
    map: 'Campus_Map',
    floor: 0,
    x: 450.0,
    y: 400.0,
    lat: 26.2312,
    lng: 78.2051,
    battery: 92,
    currentAssignment: 'Routine Campus Perimeter Patrol'
  },
  {
    id: 'patrol_bravo',
    name: 'Guard Post 1 Checkpoint',
    badge: 'MITS-SEC-04',
    officer: 'Head Guard Rajesh Sharma',
    phone: '+91 751-2409301',
    radioChannel: 'VHF CH-02 (Gate Ops)',
    status: 'on_duty',
    map: 'Campus_Map',
    floor: 0,
    x: 253.0593,
    y: 606.1033,
    lat: 26.232611,
    lng: 78.205222,
    battery: 100,
    currentAssignment: 'Access Control & ANPR Monitoring'
  },
  {
    id: 'patrol_charlie',
    name: 'New Gate QRF Dispatch',
    badge: 'MITS-SEC-09',
    officer: 'Guard Vikram Singh',
    phone: '+91 751-2409302',
    radioChannel: 'VHF CH-02 (Gate Ops)',
    status: 'dispatched',
    map: 'Campus_Map',
    floor: 0,
    x: 815.0,
    y: 606.1033,
    lat: 26.231389,
    lng: 78.203639,
    battery: 84,
    currentAssignment: 'Investigating vehicle blockage incident #02'
  },
  {
    id: 'patrol_med',
    name: 'Emergency Medical Rapid Response Unit',
    badge: 'MITS-MED-01',
    officer: 'Paramedic Anjali Verma & Team',
    phone: '+91 751-2409399',
    radioChannel: 'VHF CH-09 (Emergency Med)',
    status: 'dispatched',
    map: 'Main_GF',
    floor: 0,
    x: 406.8033,
    y: 487.5583,
    lat: 26.230752,
    lng: 78.205341,
    battery: 98,
    currentAssignment: 'Attending medical incident near Conclave Centre'
  }
];

export const useSafetyStore = create<SafetyStoreState>((set) => ({
  // C3S Dashboard Mode
  activeDashboard: 'nav',
  setActiveDashboard: (mode) => set({ activeDashboard: mode }),

  activeTheme: 'standard',
  is3dMode: false,
  pitch: 0,
  bearing: 0,
  compassHeading: 0,

  incidents: typeof window === 'undefined' ? DEFAULT_INCIDENTS : [...readStoredIncidents(), ...DEFAULT_INCIDENTS.filter((defaultIncident) => !readStoredIncidents().some((incident) => incident.id === defaultIncident.id))],
  selectedIncident: null,
  sosModalOpen: false,
  showIncidentRadar: true,

  // CCTV Cameras
  cctvCameras: DEFAULT_CAMERAS,
  selectedCamera: null,
  setSelectedCamera: (camera) => set({ selectedCamera: camera }),
  updateCameraStatus: (id, status) => set((state) => ({
    cctvCameras: state.cctvCameras.map((cam) =>
      cam.id === id ? { ...cam, status } : cam
    ),
    selectedCamera: state.selectedCamera?.id === id
      ? { ...state.selectedCamera, status }
      : state.selectedCamera
  })),
  updateCameraCrowdMetrics: (updates) => set((state) => {
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    const updatedCameras = state.cctvCameras.map((cam) => {
      const u = updateMap.get(cam.id);
      if (!u) return cam;
      return {
        ...cam,
        ...(u.crowdCount !== undefined ? { crowdCount: u.crowdCount } : {}),
        ...(u.crowdDensity ? { crowdDensity: u.crowdDensity } : {}),
        ...(u.confidence !== undefined ? { confidence: u.confidence } : {}),
        ...(u.latencyMs !== undefined ? { latencyMs: u.latencyMs } : {}),
        ...(u.status ? { status: u.status } : {}),
        ...(u.lastMotionDetected ? { lastMotionDetected: u.lastMotionDetected } : {})
      };
    });

    const activeSelected = state.selectedCamera
      ? updatedCameras.find((c) => c.id === state.selectedCamera?.id) || state.selectedCamera
      : null;

    return {
      cctvCameras: updatedCameras,
      selectedCamera: activeSelected
    };
  }),

  // Patrol Units
  patrolUnits: DEFAULT_PATROL_UNITS,
  selectedPatrolUnit: null,
  setSelectedPatrolUnit: (unit) => set({ selectedPatrolUnit: unit }),
  dispatchPatrolUnit: (unitId, assignment) => set((state) => ({
    patrolUnits: state.patrolUnits.map((u) =>
      u.id === unitId ? { ...u, status: 'dispatched', currentAssignment: assignment } : u
    )
  })),

  // Campus Emergency Alerts
  activeAlert: null,
  triggerCampusAlert: (alertData) => {
    const alert: CampusAlert = {
      ...alertData,
      id: `alert_${Date.now()}`,
      issuedAt: Date.now()
    };
    set({ activeAlert: alert });
  },
  clearCampusAlert: () => set({ activeAlert: null }),

  safetyAmenities: DEFAULT_AMENITIES,
  showSafetyAmenities: true,
  activeAmenityFilter: null,

  emergencyContacts: DEFAULT_CONTACTS,

  setTheme: (theme) => set({
    activeTheme: theme,
    is3dMode: theme === '3d',
    pitch: theme === '3d' ? 42 : 0
  }),

  toggle3dMode: () => set((state) => {
    const next = !state.is3dMode;
    return {
      is3dMode: next,
      pitch: next ? 42 : 0,
      activeTheme: next ? '3d' : state.activeTheme === '3d' ? 'standard' : state.activeTheme
    };
  }),

  setPitch: (pitch) => set({ pitch }),
  setBearing: (bearing) => set({ bearing }),
  setCompassHeading: (compassHeading) => set({ compassHeading }),

  triggerSosIncident: (data) => {
    const newIncident: SosIncident = {
      ...data,
      id: `sos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      status: 'active'
      , deliveryState: 'queued'
      , relayHops: 0
    };
    set((state) => {
      const incidents = [newIncident, ...state.incidents];
      persistIncidents(incidents);
      return {
        incidents,
        selectedIncident: newIncident,
        sosModalOpen: false
      };
    });
    return newIncident;
  },

  updateIncidentStatus: (id, status, responder) => set((state) => {
    const incidents = state.incidents.map((inc) =>
      inc.id === id ? { ...inc, status, responderAssigned: responder || inc.responderAssigned, deliveryState: 'queued' as const } : inc
    );
    persistIncidents(incidents);
    return {
      incidents,
      selectedIncident: state.selectedIncident?.id === id
        ? { ...state.selectedIncident, status, responderAssigned: responder || state.selectedIncident.responderAssigned }
        : state.selectedIncident
    };
  }),

  updateIncidentEvidence: (id, evidence) => set((state) => {
    const incidents = state.incidents.map((inc) => inc.id === id ? { ...inc, evidence, deliveryState: 'queued' as const } : inc);
    persistIncidents(incidents);
    return {
      incidents,
      selectedIncident: state.selectedIncident?.id === id
        ? { ...state.selectedIncident, evidence }
        : state.selectedIncident
    };
  }),

  mergeMeshIncident: (incident) => set((state) => {
    const existing = state.incidents.find((item) => item.id === incident.id);
    const mergedIncident = { ...existing, ...incident, deliveryState: 'relayed' as const, lastRelayedAt: Date.now(), relayHops: (incident.relayHops ?? 0) + 1 };
    const incidents = existing
      ? state.incidents.map((item) => item.id === incident.id ? mergedIncident : item)
      : [mergedIncident, ...state.incidents];
    persistIncidents(incidents);
    return { incidents, selectedIncident: state.selectedIncident?.id === incident.id ? mergedIncident : state.selectedIncident };
  }),

  realCrowdCount: 24,
  setRealCrowdCount: (realCrowdCount) => set({ realCrowdCount }),

  selectedNodeForDetail: null,
  setSelectedNodeForDetail: (selectedNodeForDetail) => set({ selectedNodeForDetail }),

  dispatchResponder: (incidentId, responderName = 'QRF Patrol Unit 1', responderNodeId = 'MainRoad01') => set((state) => {
    const incidents = state.incidents.map((inc) => {
      if (inc.id !== incidentId) return inc;
      return {
        ...inc,
        status: 'responding' as const,
        responderAssigned: responderName,
        responderStatus: 'enroute' as const,
        responderEta: '2 mins',
        responderNodeId: responderNodeId,
        deliveryState: 'queued' as const,
      };
    });
    persistIncidents(incidents);
    const updatedSelected = state.selectedIncident?.id === incidentId
      ? {
          ...state.selectedIncident,
          status: 'responding' as const,
          responderAssigned: responderName,
          responderStatus: 'enroute' as const,
          responderEta: '2 mins',
          responderNodeId: responderNodeId,
        }
      : state.selectedIncident;
    return { incidents, selectedIncident: updatedSelected };
  }),

  advanceResponderStatus: (incidentId, nextStatus) => set((state) => {
    const isResolved = nextStatus === 'resolved';
    const incidents = state.incidents.map((inc) => {
      if (inc.id !== incidentId) return inc;
      return {
        ...inc,
        status: isResolved ? ('resolved' as const) : ('responding' as const),
        responderStatus: nextStatus,
        responderEta: isResolved ? 'Completed' : nextStatus === 'on_scene' ? 'On Scene' : inc.responderEta,
        deliveryState: 'queued' as const,
      };
    });
    persistIncidents(incidents);
    const updatedSelected = state.selectedIncident?.id === incidentId
      ? {
          ...state.selectedIncident,
          status: isResolved ? ('resolved' as const) : ('responding' as const),
          responderStatus: nextStatus,
          responderEta: isResolved ? 'Completed' : nextStatus === 'on_scene' ? 'On Scene' : state.selectedIncident.responderEta,
        }
      : state.selectedIncident;
    return { incidents, selectedIncident: updatedSelected };
  }),

  setSelectedIncident: (incident) => set({ selectedIncident: incident }),
  setSosModalOpen: (sosModalOpen) => set({ sosModalOpen }),
  setShowIncidentRadar: (showIncidentRadar) => set({ showIncidentRadar }),

  toggleSafetyAmenities: () => set((state) => ({ showSafetyAmenities: !state.showSafetyAmenities })),
  setActiveAmenityFilter: (activeAmenityFilter) => set({ activeAmenityFilter }),
}));

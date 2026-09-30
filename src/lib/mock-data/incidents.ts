export type IncidentPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'ALERT SENT' | 'ACKNOWLEDGED' | 'EN ROUTE' | 'ARRIVED' | 'RESOLVED';
export type IncidentCategory = 'Medical Emergency' | 'Security Threat' | 'Fire Alarm' | 'Unauthorized Access' | 'Traffic Obstruction' | 'General SOS';

export interface IncidentTimelineEntry {
  time: string;
  event: string;
  actor: string;
  detail?: string;
}

export interface C3SIncident {
  id: string;
  title: string;
  type: IncidentCategory;
  priority: IncidentPriority;
  location: string;
  zone: string;
  reportedAt: string;
  reportedBy: string;
  reportedById: string;
  reporterPhone: string;
  status: IncidentStatus;
  distanceMeters: number;
  assignedResponder?: string;
  responderPhone?: string;
  estimatedArrivalMin?: number;
  latitude: number;
  longitude: number;
  notes?: string[];
  timeline: IncidentTimelineEntry[];
}

export const MOCK_INCIDENTS: C3SIncident[] = [
  {
    id: 'C3S-INC-00192',
    title: 'Medical Emergency',
    type: 'Medical Emergency',
    priority: 'CRITICAL',
    location: 'Academic Block A, 2nd Floor Corridor',
    zone: 'Academic Zone 1',
    reportedAt: '20:16',
    reportedBy: 'Naman Lakhotia',
    reportedById: 'BTCS2026-0842',
    reporterPhone: '+91 98765 43210',
    status: 'EN ROUTE',
    distanceMeters: 320,
    assignedResponder: 'Guard 02 (Vikram Rathore)',
    responderPhone: '+91 98765 43215',
    estimatedArrivalMin: 2,
    latitude: 26.2183,
    longitude: 78.1828,
    notes: ['Student reported chest discomfort and dizziness near Lab 4', 'Defibrillator and first aid requested from Health Center'],
    timeline: [
      { time: '20:16', event: 'SOS Triggered by Student', actor: 'Naman Lakhotia', detail: 'Automated GPS lock (accuracy 8m)' },
      { time: '20:16', event: 'Control Room Notified', actor: 'Console 01 (Neha G.)', detail: 'Audio alarm flagged at SOC' },
      { time: '20:17', event: 'Guard 02 Assigned', actor: 'SOC Dispatch', detail: 'Dispatched closest patrol unit (320m away)' },
      { time: '20:18', event: 'Guard En Route', actor: 'Guard 02', detail: 'Rapid bike unit moving towards Academic Block A' }
    ]
  },
  {
    id: 'C3S-INC-00189',
    title: 'Unauthorized Perimeter Movement',
    type: 'Unauthorized Access',
    priority: 'HIGH',
    location: 'North Boundary Wall, near Jubilee Gate',
    zone: 'Perimeter West',
    reportedAt: '19:45',
    reportedBy: 'AI CCTV Tripwire (CAM-03)',
    reportedById: 'SYSTEM-AI',
    reporterPhone: 'SOC Hot-Line',
    status: 'ACKNOWLEDGED',
    distanceMeters: 450,
    assignedResponder: 'Guard 01 (Deepak Rao)',
    responderPhone: '+91 98765 43220',
    estimatedArrivalMin: 4,
    latitude: 26.2198,
    longitude: 78.1805,
    notes: ['Motion detected beyond 19:30 curfew limit', 'Camera lens showed single person near tree line'],
    timeline: [
      { time: '19:45', event: 'Automated Perimeter Tripwire Triggered', actor: 'AI Sensor CAM-03' },
      { time: '19:47', event: 'SOC Operator Verified False Breach or Intrusion', actor: 'Neha Gupta' },
      { time: '19:50', event: 'Patrol Dispatched for Physical Inspection', actor: 'Guard 01' }
    ]
  },
  {
    id: 'C3S-INC-00185',
    title: 'Smoke Detector Pre-Alarm',
    type: 'Fire Alarm',
    priority: 'CRITICAL',
    location: 'Chemistry Complex Lab 3',
    zone: 'Science Zone',
    reportedAt: '18:10',
    reportedBy: 'Lab Technician R. Verma',
    reportedById: 'TECH-CH-04',
    reporterPhone: '+91 98765 43231',
    status: 'RESOLVED',
    distanceMeters: 180,
    assignedResponder: 'Campus Fire Warden & Guard 03',
    responderPhone: '+91 98765 43222',
    latitude: 26.2171,
    longitude: 78.1818,
    notes: ['Burner overheating during post-lab sterilization; exhaust cleared', 'All sensors normal, no damage or casualties'],
    timeline: [
      { time: '18:10', event: 'Optical Smoke Detector Alert', actor: 'Sensor CH-302' },
      { time: '18:12', event: 'Fire Warden Dispatched', actor: 'Control Room' },
      { time: '18:15', event: 'Warden Arrived on Scene', actor: 'Fire Warden' },
      { time: '18:24', event: 'Ventilation verified, incident resolved', actor: 'Fire Warden' }
    ]
  },
  {
    id: 'C3S-INC-00181',
    title: 'Traffic Congestion at Inbound Lane',
    type: 'Traffic Obstruction',
    priority: 'MEDIUM',
    location: 'Main Gate Approach Road',
    zone: 'Gate Zone',
    reportedAt: '16:30',
    reportedBy: 'Ramesh Singh (Gate Keeper)',
    reportedById: 'GK-MG-01',
    reporterPhone: '+91 98765 43214',
    status: 'RESOLVED',
    distanceMeters: 50,
    assignedResponder: 'Traffic Marshall 01',
    latitude: 26.2177,
    longitude: 78.1835,
    notes: ['Bus breakdown temporarily blocked right lane', 'Vehicle towed to side maintenance bay'],
    timeline: [
      { time: '16:30', event: 'Traffic slowdown flagged', actor: 'Gate Keeper' },
      { time: '16:32', event: 'Auxiliary lane opened', actor: 'Gate Keeper' },
      { time: '16:48', event: 'Clear flow restored', actor: 'Traffic Marshall' }
    ]
  }
];
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
  photoUrl?: string;
  videoUrl?: string;
  evidence?: {
    photoUrl?: string;
    videoUrl?: string;
    fightConfidence?: number;
    aiClassification?: any;
  };
}

export const MOCK_INCIDENTS: C3SIncident[] = [
  {
    id: 'C3S-INC-00195',
    title: 'Physical Altercation (OpenCV Fight AI Alert)',
    type: 'Security Threat',
    priority: 'CRITICAL',
    location: 'J010 - SH-4 (Seminar Hall 4, Main Building GF)',
    zone: 'Main Building GF',
    reportedAt: '20:38',
    reportedBy: 'OpenCV Optical AI (CAM-10)',
    reportedById: 'SYSTEM-OPENCV-CAM10',
    reporterPhone: 'SOC Hot-Line',
    status: 'ALERT SENT',
    distanceMeters: 45,
    assignedResponder: 'Guard 01 (Deepak Rao) & QRF Unit 1',
    responderPhone: '+91 98765 43220',
    estimatedArrivalMin: 1,
    latitude: 26.2184,
    longitude: 78.1829,
    videoUrl: '/videos/cctv_recorded_incident.mp4',
    photoUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    evidence: {
      videoUrl: '/videos/cctv_recorded_incident.mp4',
      photoUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
      fightConfidence: 94,
      aiClassification: {
        action: 'Violent Physical Altercation & Rapid Kinetic Strikes',
        severity: 'CRITICAL',
        engine: 'OpenCV Optical Flow & MOG2 Multi-Tracker'
      }
    },
    notes: [
      'Automated SOS trigger initiated by OpenCV Optical Vision Engine in Seminar Hall 4 (SH-4)',
      'High-velocity kinetic jerk and subject collision confirmed above 90% confidence threshold',
      'Audio proctor sirens dispatched to local zone'
    ],
    timeline: [
      { time: '20:38', event: 'OpenCV Fight Detection Triggered (94% Conf)', actor: 'AI Sensor CAM-10', detail: 'Sustained kinetic altercation > 3.0s' },
      { time: '20:38', event: 'Automated SOS Broadcast Dispatched', actor: 'C3S Defense Engine', detail: 'Geo-locked to SH-4 (Main_GF, room_J010)' },
      { time: '20:39', event: 'QRF Patrol Team 1 Dispatched', actor: 'SOC Operator', detail: 'Guards dispatched with emergency response kit' }
    ]
  },
  {
    id: 'C3S-INC-00194',
    title: 'Aggressive Shoving Incident (Corridor Sector)',
    type: 'Security Threat',
    priority: 'HIGH',
    location: 'AI & CSE Building First Floor Corridor (Near M103)',
    zone: 'AI & CSE Building',
    reportedAt: '20:22',
    reportedBy: 'Faculty Cabin Report (Dr. Archana Acharya)',
    reportedById: 'FAC-AI-01',
    reporterPhone: '+91 98765 43250',
    status: 'RESOLVED',
    distanceMeters: 120,
    assignedResponder: 'Guard 02 (Vikram Rathore)',
    responderPhone: '+91 98765 43215',
    estimatedArrivalMin: 2,
    latitude: 26.2181,
    longitude: 78.1825,
    videoUrl: '/videos/cctv_recorded_incident.mp4',
    photoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    evidence: {
      videoUrl: '/videos/cctv_recorded_incident.mp4',
      photoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      fightConfidence: 86
    },
    notes: [
      'Minor confrontation between students outside classroom M103',
      'Faculty intervened immediately; campus guard arrived within 90 seconds. Dispersed peacefully.'
    ],
    timeline: [
      { time: '20:22', event: 'Altercation reported by faculty', actor: 'Dr. Archana Acharya' },
      { time: '20:23', event: 'Guard arrived on scene', actor: 'Guard 02' },
      { time: '20:26', event: 'Incident resolved & students counseled', actor: 'Chief Proctor Office' }
    ]
  },
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
    videoUrl: '/videos/cctv_recorded_incident.mp4',
    photoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    evidence: {
      videoUrl: '/videos/cctv_recorded_incident.mp4',
      photoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    },
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
    videoUrl: '/videos/cctv_recorded_incident.mp4',
    photoUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    evidence: {
      videoUrl: '/videos/cctv_recorded_incident.mp4',
      photoUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
      fightConfidence: 94
    },
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
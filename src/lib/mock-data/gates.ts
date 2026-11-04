export interface C3SGate {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'RESTRICTED' | 'MAINTENANCE';
  qrStatus: 'ACTIVE' | 'EXPIRED' | 'REGENERATING';
  currentGateKeeper: string;
  keeperId: string;
  checkInCount: number;
  checkOutCount: number;
  currentlyInside: number;
  activeAlerts: number;
  qrToken: string;
  qrExpiresAt: string;
  latitude: number;
  longitude: number;
  speedBumps: number;
  boomBarriers: 'OPERATIONAL' | 'MANUAL';
}

export const MOCK_GATES: C3SGate[] = [
  {
    id: 'gate-jubilee',
    name: 'Jubilee Gate',
    code: 'GATE-01',
    status: 'ACTIVE',
    qrStatus: 'ACTIVE',
    currentGateKeeper: 'Suresh Yadav',
    keeperId: 'GK-JG-02',
    checkInCount: 412,
    checkOutCount: 388,
    currentlyInside: 24,
    activeAlerts: 0,
    qrToken: 'C3S-QR-JUBILEE-20260929-SEC9',
    qrExpiresAt: '2026-09-29T23:59:59',
    latitude: 26.2195,
    longitude: 78.1810,
    speedBumps: 2,
    boomBarriers: 'OPERATIONAL'
  },
  {
    id: 'gate-main',
    name: 'Main Gate',
    code: 'GATE-02',
    status: 'ACTIVE',
    qrStatus: 'ACTIVE',
    currentGateKeeper: 'Ramesh Singh',
    keeperId: 'GK-MG-01',
    checkInCount: 1622,
    checkOutCount: 1490,
    currentlyInside: 132,
    activeAlerts: 2,
    qrToken: 'C3S-QR-MAIN-20260929-SEC1',
    qrExpiresAt: '2026-09-29T23:59:59',
    latitude: 26.2178,
    longitude: 78.1832,
    speedBumps: 3,
    boomBarriers: 'OPERATIONAL'
  },
  {
    id: 'gate-parking',
    name: 'New Parking Gate',
    code: 'GATE-03',
    status: 'ACTIVE',
    qrStatus: 'ACTIVE',
    currentGateKeeper: 'Dinesh Verma',
    keeperId: 'GK-PG-03',
    checkInCount: 447,
    checkOutCount: 421,
    currentlyInside: 26,
    activeAlerts: 0,
    qrToken: 'C3S-QR-PARK-20260929-SEC4',
    qrExpiresAt: '2026-09-29T23:59:59',
    latitude: 26.2162,
    longitude: 78.1848,
    speedBumps: 2,
    boomBarriers: 'OPERATIONAL'
  },
  {
    id: 'gate-ai-north',
    name: 'AI Building North Access',
    code: 'GATE-04',
    status: 'ACTIVE',
    qrStatus: 'ACTIVE',
    currentGateKeeper: 'Manoj Kushwah',
    keeperId: 'GK-AI-04',
    checkInCount: 840,
    checkOutCount: 780,
    currentlyInside: 60,
    activeAlerts: 0,
    qrToken: 'C3S-QR-AINORTH-20260929-SEC5',
    qrExpiresAt: '2026-09-29T23:59:59',
    latitude: 26.2182,
    longitude: 78.1824,
    speedBumps: 1,
    boomBarriers: 'OPERATIONAL'
  },
  {
    id: 'gate-sh4',
    name: 'Seminar Hall 4 (SH-4) Turnstile',
    code: 'GATE-05',
    status: 'ACTIVE',
    qrStatus: 'ACTIVE',
    currentGateKeeper: 'Vikram Sen',
    keeperId: 'GK-SH4-05',
    checkInCount: 320,
    checkOutCount: 295,
    currentlyInside: 25,
    activeAlerts: 1,
    qrToken: 'C3S-QR-SH4-20260929-SEC6',
    qrExpiresAt: '2026-09-29T23:59:59',
    latitude: 26.2184,
    longitude: 78.1829,
    speedBumps: 0,
    boomBarriers: 'OPERATIONAL'
  }
];
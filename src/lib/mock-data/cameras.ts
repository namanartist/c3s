export interface C3SCamera {
  id: string;
  name: string;
  zone: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  ip: string;
  resolution: string;
  fps: number;
  ptzCapable: boolean;
  nightVision: boolean;
  aiDetection: boolean;
  lastMotion: string;
  streamUrl: string;
  thumbnailColor: string;
  crowdLabel?: string;
  crowdCount?: number;
  crowdDensity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence?: number;
  latencyMs?: number;
}

export const MOCK_CAMERAS: C3SCamera[] = [
  {
    id: 'CAM-01',
    name: 'Main Gate - Pedestrian Entry',
    zone: 'Main Gate',
    location: 'Gate 2 Inbound Turnstiles',
    status: 'ONLINE',
    ip: '10.20.101.11',
    resolution: '1080p FHD',
    fps: 30,
    ptzCapable: true,
    nightVision: true,
    aiDetection: true,
    lastMotion: 'Just now (Student check-in)',
    streamUrl: '/cctv/sim-feed-01',
    thumbnailColor: 'from-blue-950 via-slate-900 to-indigo-950',
    crowdLabel: 'Main Gate',
    crowdCount: 4,
    crowdDensity: 'LOW'
  },
  {
    id: 'CAM-02',
    name: 'Main Gate - Vehicle Boom Barrier',
    zone: 'Main Gate',
    location: 'Gate 2 Vehicle Lane',
    status: 'ONLINE',
    ip: '10.20.101.12',
    resolution: '4K UltraHD',
    fps: 60,
    ptzCapable: true,
    nightVision: true,
    aiDetection: true,
    lastMotion: '2 mins ago (Delivery van)',
    streamUrl: '/cctv/sim-feed-02',
    thumbnailColor: 'from-slate-950 via-blue-950 to-slate-900'
  },
  {
    id: 'CAM-03',
    name: 'Jubilee Gate - West Access',
    zone: 'Jubilee Gate',
    location: 'Pedestrian Crossing 1',
    status: 'OFFLINE',
    ip: '10.20.102.15',
    resolution: '1080p FHD',
    fps: 30,
    ptzCapable: false,
    nightVision: true,
    aiDetection: false,
    lastMotion: 'Signal lost 14m ago (Cable check)',
    streamUrl: '',
    thumbnailColor: 'from-red-950 via-zinc-950 to-neutral-900'
  },
  {
    id: 'CAM-04',
    name: 'Academic Block A - Central Atrium',
    zone: 'Academic Zone',
    location: 'Block A Ground Floor Lobby',
    status: 'ONLINE',
    ip: '10.20.103.21',
    resolution: '1080p FHD',
    fps: 30,
    ptzCapable: true,
    nightVision: false,
    aiDetection: true,
    lastMotion: 'Active (Responder en route)',
    streamUrl: '/cctv/sim-feed-04',
    thumbnailColor: 'from-blue-900 via-indigo-950 to-black'
  },
  {
    id: 'CAM-05',
    name: 'Academic Block B - Science Courtyard',
    zone: 'Academic Zone',
    location: 'Block B North Wing',
    status: 'ONLINE',
    ip: '10.20.103.22',
    resolution: '1080p FHD',
    fps: 30,
    ptzCapable: true,
    nightVision: true,
    aiDetection: true,
    lastMotion: '3 mins ago (Students walking)',
    streamUrl: '/cctv/sim-feed-05',
    thumbnailColor: 'from-slate-900 via-teal-950 to-black'
  },
  {
    id: 'CAM-06',
    name: 'New Parking Zone - Sector 2',
    zone: 'Parking Zone',
    location: 'Two-Wheeler Shed B',
    status: 'ONLINE',
    ip: '10.20.104.30',
    resolution: '1080p FHD',
    fps: 25,
    ptzCapable: false,
    nightVision: true,
    aiDetection: true,
    lastMotion: '12 mins ago (Bike parked)',
    streamUrl: '/cctv/sim-feed-06',
    thumbnailColor: 'from-zinc-900 via-slate-950 to-blue-950'
  },
  {
    id: 'CAM-07',
    name: 'Central Library Plaza',
    zone: 'Campus Heart',
    location: 'Open Amphitheatre Walkway',
    status: 'ONLINE',
    ip: '10.20.105.10',
    resolution: '4K UltraHD',
    fps: 30,
    ptzCapable: true,
    nightVision: true,
    aiDetection: true,
    lastMotion: 'Just now (Normal pedestrian)',
    streamUrl: '/cctv/sim-feed-07',
    thumbnailColor: 'from-indigo-950 via-slate-900 to-sky-950'
  },
  {
    id: 'CAM-08',
    name: 'Hostel Block 4 - South Perimeter',
    zone: 'Residential Zone',
    location: 'East Boundary Fence',
    status: 'ONLINE',
    ip: '10.20.106.04',
    resolution: '1080p FHD',
    fps: 30,
    ptzCapable: true,
    nightVision: true,
    aiDetection: true,
    lastMotion: 'Patrol Guard pass at 20:10',
    streamUrl: '/cctv/sim-feed-08',
    thumbnailColor: 'from-neutral-900 via-slate-950 to-zinc-900'
  }
];
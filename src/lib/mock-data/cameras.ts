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
  youtubeEmbedUrl?: string;
  videoUrl?: string;
  fightDetected?: boolean;
  fightConfidence?: number;
  thumbnailColor: string;
  crowdLabel?: string;
  crowdCount?: number;
  crowdDensity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence?: number;
  latencyMs?: number;
  isLiveCameraSupported?: boolean;
}

export const MOCK_CAMERAS: C3SCamera[] = [
  {
    id: 'CAM-01',
    name: 'Main Gate - Inbound Turnstiles (Live Webcam & Optical AI)',
    isLiveCameraSupported: true,
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
    streamUrl: '/videos/cctv_recorded_incident.mp4',
    videoUrl: '/videos/cctv_recorded_incident.mp4',
    thumbnailColor: 'from-blue-950 via-slate-900 to-indigo-950',
    crowdLabel: 'Main Gate',
    crowdCount: 4,
    crowdDensity: 'LOW',
    fightDetected: true,
    fightConfidence: 91
  },
  {
    id: 'CAM-02',
    name: 'Gate 2 Annex - Incident CCTV (Sample Feed)',
    zone: 'Main Gate',
    location: 'Gate 2 Perimeter & Warehouse Annex',
    status: 'ONLINE',
    ip: '10.20.101.12',
    resolution: '4K UltraHD',
    fps: 60,
    ptzCapable: true,
    nightVision: true,
    aiDetection: true,
    lastMotion: 'Incident Review - Physical Altercation Footage',
    streamUrl: '/cctv/sim-feed-02',
    youtubeEmbedUrl: 'https://www.youtube.com/embed/2vTqzQJkoPE',
    crowdLabel: 'Gate 2 Annex',
    crowdCount: 6,
    crowdDensity: 'HIGH',
    fightDetected: true,
    fightConfidence: 96,
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
    name: 'Academic Block A - Central Corridor (Sample Feed)',
    zone: 'Academic Zone',
    location: 'Block A Ground Floor Corridor',
    status: 'ONLINE',
    ip: '10.20.103.21',
    resolution: '1080p FHD (Vertical CCTV)',
    fps: 30,
    ptzCapable: true,
    nightVision: false,
    aiDetection: true,
    lastMotion: 'Corridor Incident Review - Anti-Bullying Protocol',
    streamUrl: '/cctv/sim-feed-04',
    youtubeEmbedUrl: 'https://www.youtube.com/embed/s4mqtnrJbdM',
    thumbnailColor: 'from-blue-900 via-rose-950 to-black',
    crowdLabel: 'Academic Block A Corridor',
    crowdCount: 5,
    crowdDensity: 'MODERATE',
    fightDetected: true,
    fightConfidence: 94
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
    name: 'CAM-08 • Jubilee Gate Checkpoint (Live Hardware Webcam & Fight AI)',
    zone: 'Jubilee Gate',
    location: 'Jubilee Gate Inner Checkpost & Hostel Axis',
    status: 'ONLINE',
    ip: '10.20.106.08',
    resolution: '1080p FHD Live Optical Feed',
    fps: 30,
    ptzCapable: true,
    nightVision: true,
    aiDetection: true,
    isLiveCameraSupported: true,
    lastMotion: 'Live Hardware Optical Stream Active',
    streamUrl: '/cctv/sim-feed-08',
    thumbnailColor: 'from-blue-950 via-slate-900 to-indigo-950',
    crowdLabel: 'Jubilee Gate',
    crowdCount: 1,
    crowdDensity: 'LOW'
  }
];

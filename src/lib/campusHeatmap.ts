// src/lib/campusHeatmap.ts
export interface CampusHeatZone {
  id: string;
  name: string;
  sector: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  headcount: number;
  capacity: number;
  density: 'low' | 'moderate' | 'high' | 'critical';
  radius: number;
}

export const CAMPUS_HEATMAP_ZONES: CampusHeatZone[] = [
  {
    id: 'heat_atrium',
    name: 'Central Academic Atrium',
    sector: 'Main Academic Block',
    x: 510,
    y: 400,
    lat: 26.230810,
    lng: 78.205420,
    headcount: 52,
    capacity: 100,
    density: 'high',
    radius: 46
  },
  {
    id: 'heat_canteen',
    name: 'Campus Cafeteria & Food Hub',
    sector: 'Student Amenities',
    x: 740,
    y: 270,
    lat: 26.230410,
    lng: 78.206500,
    headcount: 86,
    capacity: 120,
    density: 'critical',
    radius: 54
  },
  {
    id: 'heat_library',
    name: 'Central Library & Reading Hall',
    sector: 'Academic Library',
    x: 510,
    y: 320,
    lat: 26.231200,
    lng: 78.205300,
    headcount: 38,
    capacity: 90,
    density: 'moderate',
    radius: 40
  },
  {
    id: 'heat_main_gate',
    name: 'Main Gate Checkpost & Turnstiles',
    sector: 'Perimeter Checkpoint',
    x: 260,
    y: 610,
    lat: 26.229500,
    lng: 78.204500,
    headcount: 64,
    capacity: 110,
    density: 'high',
    radius: 48
  },
  {
    id: 'heat_ai_complex',
    name: 'AI & CSE Complex Foyer & Labs',
    sector: 'AI Engineering Wing',
    x: 570,
    y: 130,
    lat: 26.232100,
    lng: 78.205800,
    headcount: 42,
    capacity: 85,
    density: 'moderate',
    radius: 42
  },
  {
    id: 'heat_west_lawn',
    name: 'Administrative Lawn & Walkways',
    sector: 'Central Lawn Axis',
    x: 330,
    y: 520,
    lat: 26.230200,
    lng: 78.204800,
    headcount: 22,
    capacity: 75,
    density: 'low',
    radius: 36
  },
  {
    id: 'heat_jubilee_gate',
    name: 'Jubilee Gate East Access',
    sector: 'East Perimeter',
    x: 860,
    y: 340,
    lat: 26.230100,
    lng: 78.207200,
    headcount: 16,
    capacity: 60,
    density: 'low',
    radius: 34
  }
];

export function getHeatColor(density: CampusHeatZone['density']): {
  primary: string;
  fill: string;
  glow: string;
  border: string;
  badge: string;
} {
  switch (density) {
    case 'critical':
      return {
        primary: '#ef4444',
        fill: 'rgba(239, 68, 68, 0.40)',
        glow: 'rgba(239, 68, 68, 0.20)',
        border: '#dc2626',
        badge: 'bg-red-500/20 text-red-400 border-red-500/40'
      };
    case 'high':
      return {
        primary: '#f97316',
        fill: 'rgba(249, 115, 22, 0.38)',
        glow: 'rgba(249, 115, 22, 0.18)',
        border: '#ea580c',
        badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40'
      };
    case 'moderate':
      return {
        primary: '#eab308',
        fill: 'rgba(234, 179, 8, 0.35)',
        glow: 'rgba(234, 179, 8, 0.16)',
        border: '#ca8a04',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      };
    case 'low':
    default:
      return {
        primary: '#10b981',
        fill: 'rgba(16, 185, 129, 0.30)',
        glow: 'rgba(16, 185, 129, 0.14)',
        border: '#059669',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
      };
  }
}

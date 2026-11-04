export interface HourlyTraffic {
  hour: string;
  entries: number;
  exits: number;
  occupancy: number;
}

export interface GateComparison {
  gate: string;
  entries: number;
  exits: number;
  netFlow: number;
  peakHour: string;
}

export interface IncidentTypeMetric {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ResponseTimeMetric {
  month: string;
  avgMinutes: number;
  targetMinutes: number;
}

export const MOCK_ANALYTICS = {
  totalOccupancy: 3120,
  breakdown: {
    students: 2420,
    faculty: 380,
    staff: 215,
    visitors: 105
  },
  gatesSummary: {
    mainGate: { entries: 1622, exits: 1490, inside: 132 },
    jubileeGate: { entries: 412, exits: 388, inside: 24 },
    parkingGate: { entries: 447, exits: 421, inside: 26 },
    aiNorthGate: { entries: 840, exits: 780, inside: 60 },
    sh4Gate: { entries: 320, exits: 295, inside: 25 }
  },
  hourlyTraffic: [
    { hour: '06:00', entries: 45, exits: 12, occupancy: 33 },
    { hour: '07:00', entries: 180, exits: 35, occupancy: 178 },
    { hour: '08:00', entries: 980, exits: 60, occupancy: 1098 },
    { hour: '09:00', entries: 1440, exits: 110, occupancy: 2428 },
    { hour: '10:00', entries: 540, exits: 150, occupancy: 2818 },
    { hour: '11:00', entries: 310, exits: 190, occupancy: 2938 },
    { hour: '12:00', entries: 410, exits: 390, occupancy: 2958 },
    { hour: '13:00', entries: 480, exits: 480, occupancy: 2958 },
    { hour: '14:00', entries: 390, exits: 260, occupancy: 3088 },
    { hour: '15:00', entries: 280, exits: 340, occupancy: 3028 },
    { hour: '16:00', entries: 160, exits: 890, occupancy: 2298 },
    { hour: '17:00', entries: 95, exits: 1120, occupancy: 1273 },
    { hour: '18:00', entries: 60, exits: 240, occupancy: 1093 },
    { hour: '19:00', entries: 45, exits: 90, occupancy: 1048 },
    { hour: '20:00', entries: 35, exits: 60, occupancy: 1023 }
  ] as HourlyTraffic[],
  gateComparisons: [
    { gate: 'Main Gate', entries: 1622, exits: 1490, netFlow: 132, peakHour: '08:30 - 09:30 AM' },
    { gate: 'AI North Gate', entries: 840, exits: 780, netFlow: 60, peakHour: '08:45 - 09:45 AM' },
    { gate: 'SH-4 Turnstile', entries: 320, exits: 295, netFlow: 25, peakHour: '09:00 - 10:00 AM' },
    { gate: 'New Parking Gate', entries: 447, exits: 421, netFlow: 26, peakHour: '08:15 - 09:00 AM' },
    { gate: 'Jubilee Gate', entries: 412, exits: 388, netFlow: 24, peakHour: '08:45 - 09:15 AM' }
  ] as GateComparison[],
  incidentBreakdown: [
    { type: 'Physical Altercations (OpenCV AI)', count: 14, percentage: 28, color: '#DC2626' },
    { type: 'Medical Emergencies', count: 12, percentage: 24, color: '#EA580C' },
    { type: 'Unauthorized Access', count: 10, percentage: 20, color: '#F59E0B' },
    { type: 'Traffic & Gate Blockages', count: 8, percentage: 16, color: '#3B82F6' },
    { type: 'Lost Property & General SOS', count: 6, percentage: 12, color: '#10B981' }
  ] as IncidentTypeMetric[],
  responseTimeTrend: [
    { month: 'Apr', avgMinutes: 4.5, targetMinutes: 3.0 },
    { month: 'May', avgMinutes: 3.8, targetMinutes: 3.0 },
    { month: 'Jun', avgMinutes: 3.2, targetMinutes: 3.0 },
    { month: 'Jul', avgMinutes: 2.9, targetMinutes: 3.0 },
    { month: 'Aug', avgMinutes: 2.4, targetMinutes: 3.0 },
    { month: 'Sep', avgMinutes: 1.85, targetMinutes: 3.0 }
  ] as ResponseTimeMetric[]
};
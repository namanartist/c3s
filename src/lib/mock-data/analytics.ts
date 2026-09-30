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
  totalOccupancy: 2481,
  breakdown: {
    students: 1982,
    faculty: 312,
    staff: 142,
    visitors: 45
  },
  gatesSummary: {
    mainGate: { entries: 1622, exits: 1490, inside: 132 },
    jubileeGate: { entries: 412, exits: 388, inside: 24 },
    parkingGate: { entries: 447, exits: 421, inside: 26 }
  },
  hourlyTraffic: [
    { hour: '06:00', entries: 45, exits: 12, occupancy: 33 },
    { hour: '07:00', entries: 180, exits: 35, occupancy: 178 },
    { hour: '08:00', entries: 980, exits: 60, occupancy: 1098 },
    { hour: '09:00', entries: 1240, exits: 110, occupancy: 2228 },
    { hour: '10:00', entries: 340, exits: 150, occupancy: 2418 },
    { hour: '11:00', entries: 210, exits: 190, occupancy: 2438 },
    { hour: '12:00', entries: 310, exits: 390, occupancy: 2358 },
    { hour: '13:00', entries: 420, exits: 480, occupancy: 2298 },
    { hour: '14:00', entries: 290, exits: 260, occupancy: 2328 },
    { hour: '15:00', entries: 180, exits: 340, occupancy: 2168 },
    { hour: '16:00', entries: 120, exits: 890, occupancy: 1398 },
    { hour: '17:00', entries: 95, exits: 1120, occupancy: 373 },
    { hour: '18:00', entries: 60, exits: 240, occupancy: 193 },
    { hour: '19:00', entries: 45, exits: 90, occupancy: 148 },
    { hour: '20:00', entries: 35, exits: 60, occupancy: 123 }
  ] as HourlyTraffic[],
  gateComparisons: [
    { gate: 'Main Gate', entries: 1622, exits: 1490, netFlow: 132, peakHour: '08:30 - 09:30 AM' },
    { gate: 'Jubilee Gate', entries: 412, exits: 388, netFlow: 24, peakHour: '08:45 - 09:15 AM' },
    { gate: 'New Parking Gate', entries: 447, exits: 421, netFlow: 26, peakHour: '08:15 - 09:00 AM' }
  ] as GateComparison[],
  incidentBreakdown: [
    { type: 'Medical Emergency', count: 18, percentage: 38, color: '#DC2626' },
    { type: 'Unauthorized Access', count: 12, percentage: 25, color: '#F59E0B' },
    { type: 'Fire & Sensor Alarms', count: 6, percentage: 13, color: '#EF4444' },
    { type: 'Traffic & Gate Blockage', count: 7, percentage: 15, color: '#3B82F6' },
    { type: 'Lost Property / Other', count: 4, percentage: 9, color: '#10B981' }
  ] as IncidentTypeMetric[],
  responseTimeTrend: [
    { month: 'Apr', avgMinutes: 4.5, targetMinutes: 3.0 },
    { month: 'May', avgMinutes: 3.8, targetMinutes: 3.0 },
    { month: 'Jun', avgMinutes: 3.2, targetMinutes: 3.0 },
    { month: 'Jul', avgMinutes: 2.9, targetMinutes: 3.0 },
    { month: 'Aug', avgMinutes: 2.4, targetMinutes: 3.0 },
    { month: 'Sep', avgMinutes: 2.14, targetMinutes: 3.0 }
  ] as ResponseTimeMetric[]
};
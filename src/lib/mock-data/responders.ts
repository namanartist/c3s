export interface C3SResponder {
  id: string;
  name: string;
  callsign: string;
  role: string;
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SCENE' | 'OFF_DUTY';
  battery: number;
  radioChannel: string;
  currentZone: string;
  assignedIncidentId?: string;
  vehicle: string;
  latitude: number;
  longitude: number;
  distanceToActiveIncident: string;
}

export const MOCK_RESPONDERS: C3SResponder[] = [
  {
    id: 'resp-01',
    name: 'Vikram Rathore',
    callsign: 'Guard 02',
    role: 'Rapid Patrol Guard',
    status: 'EN_ROUTE',
    battery: 88,
    radioChannel: 'CH-4 (Emergency Dispatch)',
    currentZone: 'Approaching Academic Block A',
    assignedIncidentId: 'C3S-INC-00192',
    vehicle: 'Electric Patrol Bike #2',
    latitude: 26.2180,
    longitude: 78.1824,
    distanceToActiveIncident: '120m away'
  },
  {
    id: 'resp-02',
    name: 'Deepak Rao',
    callsign: 'Guard 01',
    role: 'Perimeter Security',
    status: 'AVAILABLE',
    battery: 94,
    radioChannel: 'CH-1 (Perimeter)',
    currentZone: 'Jubilee Gate North Sector',
    vehicle: 'Foot Patrol',
    latitude: 26.2192,
    longitude: 78.1812,
    distanceToActiveIncident: '380m away'
  },
  {
    id: 'resp-03',
    name: 'Amitabh Sharma',
    callsign: 'Guard 03',
    role: 'Central Plaza Security',
    status: 'AVAILABLE',
    battery: 76,
    radioChannel: 'CH-2 (Campus Core)',
    currentZone: 'Library & Cafeteria Courtyard',
    vehicle: 'Segway Patrol #1',
    latitude: 26.2174,
    longitude: 78.1822,
    distanceToActiveIncident: '210m away'
  },
  {
    id: 'resp-04',
    name: 'Quick Response Team (QRT-1)',
    callsign: 'QRT Alpha',
    role: 'Armed Tactical & Evac Unit',
    status: 'AVAILABLE',
    battery: 100,
    radioChannel: 'CH-0 (Command Priority)',
    currentZone: 'Central Security HQ',
    vehicle: 'All-Terrain Response Van',
    latitude: 26.2170,
    longitude: 78.1830,
    distanceToActiveIncident: '300m away'
  },
  {
    id: 'resp-05',
    name: 'Campus Medical Unit',
    callsign: 'Medic 01',
    role: 'First Responder Paramedic',
    status: 'ON_SCENE',
    battery: 90,
    radioChannel: 'CH-5 (Health Services)',
    currentZone: 'Academic Block A Ground Entrance',
    assignedIncidentId: 'C3S-INC-00192',
    vehicle: 'Campus Ambulance Cart',
    latitude: 26.2182,
    longitude: 78.1827,
    distanceToActiveIncident: '40m away'
  }
];
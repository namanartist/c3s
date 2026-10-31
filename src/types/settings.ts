// src/types/settings.ts

export interface C3SSettings {
  // Appearance
  theme: 'dark' | 'light' | 'system';
  accentColor: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';
  reducedMotion: boolean;
  soundEffects: boolean;

  // Security & Hardware
  biometricPass: boolean;
  nfcSimulation: boolean;
  autoLockMinutes: number; // 0 = never, 5, 15, 30
  highPrecisionGps: boolean;
  stealthEmergencyMode: boolean;

  // Alerts & Notifications
  pushNotifications: boolean;
  smsEmergencyBroadcast: boolean;
  emailCriticalAlerts: boolean;
  zoneIntrusionAlerts: boolean;
  audioAlarmVolume: number; // 0 - 100

  // Campus Navigation
  accessibleRouting: boolean; // Elevators only, avoid stairs
  autoFloorSwitch: boolean;
  distanceUnit: 'meters' | 'feet';

  // Medical & Safety Info
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  dormitoryAddress: string;
}

export const DEFAULT_SETTINGS: C3SSettings = {
  theme: 'dark',
  accentColor: 'blue',
  reducedMotion: false,
  soundEffects: true,

  biometricPass: true,
  nfcSimulation: true,
  autoLockMinutes: 15,
  highPrecisionGps: true,
  stealthEmergencyMode: false,

  pushNotifications: true,
  smsEmergencyBroadcast: true,
  emailCriticalAlerts: true,
  zoneIntrusionAlerts: true,
  audioAlarmVolume: 80,

  accessibleRouting: false,
  autoFloorSwitch: true,
  distanceUnit: 'meters',

  bloodGroup: 'O+',
  emergencyContactName: 'Rajesh Lakhotia',
  emergencyContactPhone: '+91 94251 12345',
  emergencyContactRelation: 'Parent / Guardian',
  dormitoryAddress: 'Hostel Block-B, Room 312'
};

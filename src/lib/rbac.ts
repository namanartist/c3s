// src/lib/rbac.ts
import type { C3SRole, C3SUser } from '@/lib/mock-data/users';
import { MOCK_USERS } from '@/lib/mock-data/users';

export type Permission =
  | 'view_map'
  | 'trigger_sos'
  | 'scan_gate_qr'
  | 'validate_gate_entry'
  | 'manage_gate_barriers'
  | 'view_incident_queue'
  | 'respond_to_incidents'
  | 'view_cctv_matrix'
  | 'view_human_detection'
  | 'dispatch_qrf'
  | 'broadcast_alerts'
  | 'manage_users'
  | 'manage_gates'
  | 'view_audit_logs'
  | 'system_configuration';

export interface RoleDefinition {
  id: C3SRole;
  title: string;
  shortLabel: string;
  category: 'academic' | 'security' | 'administration';
  desc: string;
  defaultPath: string;
  primaryColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentBg: string;
  accentBorder: string;
  iconName: string;
  permissions: Permission[];
}

export const ROLE_DEFINITIONS: Record<C3SRole, RoleDefinition> = {
  STUDENT: {
    id: 'STUDENT',
    title: 'Student & Academic Scholar',
    shortLabel: 'Student',
    category: 'academic',
    desc: 'Campus indoor navigation, real-time crowd status, 1-tap multimodal SOS with auto video, digital gate pass.',
    defaultPath: '/student',
    primaryColor: '#2563EB',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    accentBg: 'bg-blue-50/50',
    accentBorder: 'border-blue-200',
    iconName: 'GraduationCap',
    permissions: ['view_map', 'trigger_sos', 'scan_gate_qr', 'view_human_detection']
  },
  FACULTY: {
    id: 'FACULTY',
    title: 'Academic Faculty & Staff',
    shortLabel: 'Faculty',
    category: 'academic',
    desc: 'Classroom safety monitoring, emergency broadcast receiver, student roll presence tracking.',
    defaultPath: '/student',
    primaryColor: '#059669',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    accentBg: 'bg-emerald-50/50',
    accentBorder: 'border-emerald-200',
    iconName: 'Users',
    permissions: ['view_map', 'trigger_sos', 'scan_gate_qr', 'view_human_detection', 'view_incident_queue']
  },
  CLASS_COORDINATOR: {
    id: 'CLASS_COORDINATOR',
    title: 'Class Coordinator',
    shortLabel: 'Coordinator',
    category: 'academic',
    desc: 'Department attendance verification, section student accountability and safety triage.',
    defaultPath: '/student',
    primaryColor: '#0D9488',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    accentBg: 'bg-teal-50/50',
    accentBorder: 'border-teal-200',
    iconName: 'BookOpen',
    permissions: ['view_map', 'trigger_sos', 'scan_gate_qr', 'view_incident_queue']
  },
  PROCTOR: {
    id: 'PROCTOR',
    title: 'Campus Proctor & Discipline Head',
    shortLabel: 'Proctor',
    category: 'security',
    desc: 'High-level discipline oversight, security alert triage, campus zone patrolling reviews.',
    defaultPath: '/control-room',
    primaryColor: '#7C3AED',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    accentBg: 'bg-purple-50/50',
    accentBorder: 'border-purple-200',
    iconName: 'ShieldAlert',
    permissions: ['view_map', 'trigger_sos', 'view_incident_queue', 'view_cctv_matrix', 'view_human_detection', 'view_audit_logs']
  },
  GATE_KEEPER: {
    id: 'GATE_KEEPER',
    title: 'Gate Keeper & Kiosk Operator',
    shortLabel: 'Gate Keeper',
    category: 'security',
    desc: 'Fast QR validation, live entry/exit registers, boom barrier control, real-time gate occupancy.',
    defaultPath: '/gate-keeper',
    primaryColor: '#D97706',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    accentBg: 'bg-amber-50/50',
    accentBorder: 'border-amber-200',
    iconName: 'QrCode',
    permissions: ['view_map', 'validate_gate_entry', 'manage_gate_barriers', 'view_incident_queue']
  },
  SECURITY_GUARD: {
    id: 'SECURITY_GUARD',
    title: 'Security Guard & QRF Responder',
    shortLabel: 'Security Guard',
    category: 'security',
    desc: 'On-ground tactical patrol, real-time SOS dispatch queue, turn-by-turn route to incident, callsign comms.',
    defaultPath: '/security',
    primaryColor: '#EA580C',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-200',
    accentBg: 'bg-orange-50/50',
    accentBorder: 'border-orange-200',
    iconName: 'ShieldCheck',
    permissions: ['view_map', 'view_incident_queue', 'respond_to_incidents', 'trigger_sos']
  },
  CONTROL_ROOM_OPERATOR: {
    id: 'CONTROL_ROOM_OPERATOR',
    title: 'SOC & Central Control Room',
    shortLabel: 'Control Room',
    category: 'security',
    desc: '12-camera optical video wall with live human detection, crowd heatmaps, QRF dispatch, campus emergency broadcasts.',
    defaultPath: '/control-room',
    primaryColor: '#DC2626',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
    accentBg: 'bg-rose-50/50',
    accentBorder: 'border-rose-200',
    iconName: 'Radio',
    permissions: ['view_map', 'view_cctv_matrix', 'view_human_detection', 'view_incident_queue', 'respond_to_incidents', 'dispatch_qrf', 'broadcast_alerts']
  },
  HOD: {
    id: 'HOD',
    title: 'Head of Department (HOD)',
    shortLabel: 'HOD',
    category: 'administration',
    desc: 'Department zone headcount, lab evacuation readiness, emergency communication channel.',
    defaultPath: '/student',
    primaryColor: '#4F46E5',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    accentBg: 'bg-indigo-50/50',
    accentBorder: 'border-indigo-200',
    iconName: 'Building2',
    permissions: ['view_map', 'trigger_sos', 'view_incident_queue', 'view_human_detection']
  },
  DEAN: {
    id: 'DEAN',
    title: 'Dean of Student Affairs',
    shortLabel: 'Dean',
    category: 'administration',
    desc: 'Campus-wide occupancy governance, safety compliance analytics, security policy audit.',
    defaultPath: '/admin',
    primaryColor: '#0284C7',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
    accentBg: 'bg-cyan-50/50',
    accentBorder: 'border-cyan-200',
    iconName: 'Landmark',
    permissions: ['view_map', 'view_incident_queue', 'view_audit_logs', 'view_human_detection', 'view_cctv_matrix']
  },
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    title: 'Super Administrator & Director',
    shortLabel: 'Administrator',
    category: 'administration',
    desc: 'Master system configuration, user role management, gate hardware rules, immutable audit logging.',
    defaultPath: '/admin',
    primaryColor: '#BE123C',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
    accentBg: 'bg-rose-50/50',
    accentBorder: 'border-rose-200',
    iconName: 'Sliders',
    permissions: [
      'view_map',
      'trigger_sos',
      'scan_gate_qr',
      'validate_gate_entry',
      'manage_gate_barriers',
      'view_incident_queue',
      'respond_to_incidents',
      'view_cctv_matrix',
      'view_human_detection',
      'dispatch_qrf',
      'broadcast_alerts',
      'manage_users',
      'manage_gates',
      'view_audit_logs',
      'system_configuration'
    ]
  }
};

/**
 * Checks whether a given role possesses a specific capability.
 */
export function hasPermission(role: C3SRole, permission: Permission): boolean {
  const def = ROLE_DEFINITIONS[role];
  if (!def) return false;
  return def.permissions.includes(permission);
}

/**
 * Returns the default dashboard route for a role.
 */
export function getRoleDefaultPath(role: C3SRole): string {
  return ROLE_DEFINITIONS[role]?.defaultPath || '/student';
}

/**
 * Resolves the primary mock account matching a role.
 */
export function getMockUserForRole(role: C3SRole): C3SUser {
  const found = MOCK_USERS.find((u) => u.role === role);
  return (
    found || {
      id: `usr-${role.toLowerCase()}`,
      name: ROLE_DEFINITIONS[role].title,
      universityId: `${role}-001`,
      email: `${role.toLowerCase()}@mitsgwalior.in`,
      role,
      department: 'Campus Administration',
      phone: '+91 751 2409300',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      status: 'ON_DUTY',
      lastActivity: 'Active in System'
    }
  );
}

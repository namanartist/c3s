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

const STUDENT_DEF: RoleDefinition = {
  id: 'STUDENT',
  title: 'Student',
  shortLabel: 'Student',
  category: 'academic',
  desc: 'Campus indoor navigation, real-time crowd status, 1-tap multimodal SOS with auto video, digital gate pass.',
  defaultPath: '/student/sos',
  primaryColor: '#2563EB',
  badgeBg: 'bg-blue-50',
  badgeText: 'text-blue-700',
  badgeBorder: 'border-blue-200',
  accentBg: 'bg-blue-50/50',
  accentBorder: 'border-blue-200',
  iconName: 'GraduationCap',
  permissions: ['view_map', 'trigger_sos', 'scan_gate_qr']
};

const GUARD_DEF: RoleDefinition = {
  id: 'GUARD',
  title: 'Guard',
  shortLabel: 'Guard',
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
};

const PROCTOR_DEF: RoleDefinition = {
  id: 'PROCTOR',
  title: 'Proctor',
  shortLabel: 'Proctor',
  category: 'security',
  desc: 'Central SOC surveillance grid, human detection telemetry, campus security dispatch, emergency alert management.',
  defaultPath: '/control-room',
  primaryColor: '#7C3AED',
  badgeBg: 'bg-purple-50',
  badgeText: 'text-purple-700',
  badgeBorder: 'border-purple-200',
  accentBg: 'bg-purple-50/50',
  accentBorder: 'border-purple-200',
  iconName: 'ShieldAlert',
  permissions: [
    'view_map',
    'trigger_sos',
    'view_cctv_matrix',
    'view_human_detection',
    'view_incident_queue',
    'respond_to_incidents',
    'dispatch_qrf',
    'broadcast_alerts',
    'view_audit_logs'
  ]
};

const GATEKEEPER_DEF: RoleDefinition = {
  id: 'GATEKEEPER',
  title: 'Gatekeeper',
  shortLabel: 'Gatekeeper',
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
};

const ADMIN_DEF: RoleDefinition = {
  id: 'ADMIN',
  title: 'Admin',
  shortLabel: 'Admin',
  category: 'administration',
  desc: 'Master system configuration, user role governance, gate hardware rules, immutable audit logging.',
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
};

export const ROLE_DEFINITIONS: Record<C3SRole, RoleDefinition> = {
  STUDENT: STUDENT_DEF,
  GUARD: GUARD_DEF,
  SECURITY_GUARD: GUARD_DEF,
  PROCTOR: PROCTOR_DEF,
  CONTROL_ROOM_OPERATOR: PROCTOR_DEF,
  FACULTY: PROCTOR_DEF,
  CLASS_COORDINATOR: PROCTOR_DEF,
  HOD: PROCTOR_DEF,
  GATEKEEPER: GATEKEEPER_DEF,
  GATE_KEEPER: GATEKEEPER_DEF,
  ADMIN: ADMIN_DEF,
  SUPER_ADMIN: ADMIN_DEF,
  DEAN: ADMIN_DEF
};

/**
 * Normalizes any role alias to its primary canonical role.
 */
export function normalizeRole(role: C3SRole): C3SRole {
  if (role === 'SECURITY_GUARD' || role === 'GUARD') return 'GUARD';
  if (role === 'GATE_KEEPER' || role === 'GATEKEEPER') return 'GATEKEEPER';
  if (role === 'SUPER_ADMIN' || role === 'DEAN' || role === 'ADMIN') return 'ADMIN';
  if (role === 'CONTROL_ROOM_OPERATOR' || role === 'FACULTY' || role === 'CLASS_COORDINATOR' || role === 'HOD' || role === 'PROCTOR') return 'PROCTOR';
  return role;
}

/**
 * Checks whether a given role possesses a specific capability.
 */
export function hasPermission(role: C3SRole, permission: Permission): boolean {
  const canonical = normalizeRole(role);
  const def = ROLE_DEFINITIONS[canonical] || ROLE_DEFINITIONS[role];
  if (!def) return false;
  return def.permissions.includes(permission);
}

/**
 * Returns the default dashboard route for a role.
 */
export function getRoleDefaultPath(role: C3SRole): string {
  const canonical = normalizeRole(role);
  return ROLE_DEFINITIONS[canonical]?.defaultPath || ROLE_DEFINITIONS[role]?.defaultPath || '/student';
}

/**
 * Resolves the primary mock account matching a role.
 */
export function getMockUserForRole(role: C3SRole): C3SUser {
  const canonicalRole = normalizeRole(role);
  const found = MOCK_USERS.find((u) => u.role === canonicalRole || u.role === role);
  return (
    found || {
      id: `usr-${canonicalRole.toLowerCase()}`,
      name: ROLE_DEFINITIONS[canonicalRole]?.title || 'User',
      universityId: `${canonicalRole}-001`,
      email: `${canonicalRole.toLowerCase()}@mitsgwalior.in`,
      role: canonicalRole,
      department: 'Campus Administration',
      phone: '+91 751 2409300',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      status: 'ON_DUTY',
      lastActivity: 'Active in System'
    }
  );
}

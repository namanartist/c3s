import { z } from 'zod';

export const Roles = ['student_visitor', 'staff', 'responder', 'warden', 'soc_admin', 'auditor'] as const;
export type Role = typeof Roles[number];

export type Scope = 'own' | 'assigned' | 'zone' | 'hostel' | 'all';
export type Action = 'read' | 'create' | 'update' | 'transition' | 'export';
export type Resource =
  | 'incident' | 'public_alert' | 'my_sos' | 'cctv' | 'cctv_clip'
  | 'responder_location' | 'gate_pass' | 'gate_log' | 'audit_log' | 'user';

export type Grant = { scope: Scope; fields?: 'redacted' | 'full'; audit?: boolean };
export type Matrix = Partial<Record<Role, Partial<Record<Resource, Partial<Record<Action, Grant>>>>>>;

// Deny by default: anything not listed is forbidden.
export const MATRIX: Matrix = {
  student_visitor: {
    public_alert: { read: { scope: 'all', fields: 'redacted' } },
    my_sos:       { read: { scope: 'own' }, create: { scope: 'own' }, update: { scope: 'own' } }, // cancel only
    gate_pass:    { read: { scope: 'own' } },
  },
  staff: {
    public_alert: { read: { scope: 'all', fields: 'redacted' } },
    incident:     { create: { scope: 'own' }, read: { scope: 'own', fields: 'redacted' } },
    gate_pass:    { create: { scope: 'own' }, read: { scope: 'own' } }, // visitors they host
  },
  responder: {
    incident:     { read: { scope: 'assigned', fields: 'full' }, transition: { scope: 'assigned', audit: true } },
    cctv_clip:    { read: { scope: 'assigned', audit: true } },        // time-boxed to incident window
    responder_location: { read: { scope: 'assigned' } },
    gate_log:     { read: { scope: 'zone' } },
  },
  warden: {
    incident:     { read: { scope: 'hostel', fields: 'redacted' } },
    gate_log:     { read: { scope: 'hostel', audit: true } },
    user:         { read: { scope: 'hostel', fields: 'redacted' } },
  },
  soc_admin: {
    incident:     { read: { scope: 'all', fields: 'full', audit: true }, update: { scope: 'all', audit: true }, transition: { scope: 'all', audit: true } },
    cctv:         { read: { scope: 'all', audit: true } },
    cctv_clip:    { read: { scope: 'all', audit: true }, export: { scope: 'all', audit: true } },
    responder_location: { read: { scope: 'all' } },
    gate_pass:    { read: { scope: 'all' }, update: { scope: 'all', audit: true } },
    gate_log:     { read: { scope: 'all' }, export: { scope: 'all', audit: true } },
    public_alert: { create: { scope: 'all', audit: true }, read: { scope: 'all' }, update: { scope: 'all', audit: true } },
  },
  auditor: {
    audit_log:    { read: { scope: 'all', audit: true } },
  },
};

export function grantFor(role: Role, resource: Resource, action: Action): Grant | null {
  return MATRIX[role]?.[resource]?.[action] ?? null;
}

// ============================================================================
// ZOD SCHEMAS & HELPERS FOR VALIDATION
// ============================================================================

export const RoleSchema = z.enum(Roles);
export const ScopeSchema = z.enum(['own', 'assigned', 'zone', 'hostel', 'all']);
export const ActionSchema = z.enum(['read', 'create', 'update', 'transition', 'export']);
export const ResourceSchema = z.enum([
  'incident', 'public_alert', 'my_sos', 'cctv', 'cctv_clip',
  'responder_location', 'gate_pass', 'gate_log', 'audit_log', 'user'
]);

/**
 * Maps system user roles (e.g. C3SRole) to authoritative permission matrix roles.
 */
export function toPermissionRole(rawRole: string | undefined | null): Role {
  if (!rawRole) return 'student_visitor';
  const normalized = rawRole.toLowerCase().trim();

  if (normalized === 'auditor') return 'auditor';
  if (normalized === 'soc_admin' || normalized === 'super_admin' || normalized === 'control_room_operator' || normalized === 'admin') {
    return 'soc_admin';
  }
  if (normalized === 'warden' || normalized === 'proctor' || normalized === 'hostel_warden') {
    return 'warden';
  }
  if (normalized === 'responder' || normalized === 'security_guard' || normalized === 'gate_keeper' || normalized === 'guard') {
    return 'responder';
  }
  if (normalized === 'staff' || normalized === 'faculty' || normalized === 'class_coordinator' || normalized === 'hod' || normalized === 'dean') {
    return 'staff';
  }
  return 'student_visitor';
}

/**
 * Validates check-in payload coming from client or gate terminal
 */
export const CheckInPayloadSchema = z.object({
  gateId: z.string().min(1, 'Gate ID is required'),
  gateName: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  userName: z.string().min(1, 'User Name is required'),
  userRole: z.string().default('STUDENT'),
  department: z.string().optional(),
  method: z.enum(['QR_SCAN', 'MANUAL_ENTRY', 'BIOMETRIC', 'GATE_PASS']).default('QR_SCAN'),
  qrToken: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  passId: z.string().optional()
});
export type CheckInPayload = z.infer<typeof CheckInPayloadSchema>;

/**
 * Validates check-out payload coming from client or gate terminal
 */
export const CheckOutPayloadSchema = z.object({
  gateId: z.string().min(1, 'Gate ID is required'),
  gateName: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  userName: z.string().min(1, 'User Name is required'),
  userRole: z.string().default('STUDENT'),
  department: z.string().optional(),
  method: z.enum(['QR_SCAN', 'MANUAL_ENTRY', 'BIOMETRIC', 'GATE_PASS']).default('QR_SCAN'),
  qrToken: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});
export type CheckOutPayload = z.infer<typeof CheckOutPayloadSchema>;

/**
 * Gate Pass Schema
 */
export const GatePassSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userRole: z.string(),
  hostel: z.string().optional(),
  zone: z.string().optional(),
  purpose: z.string(),
  destination: z.string(),
  validFrom: z.number(),
  validTo: z.number(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'USED', 'EXPIRED']),
  approvedBy: z.string().optional(),
  qrToken: z.string().optional(),
  createdAt: z.number().default(() => Date.now())
});
export type GatePass = z.infer<typeof GatePassSchema>;

/**
 * Gate Log Schema (Authoritative Movement Record)
 */
export const GateLogSchema = z.object({
  id: z.string(),
  personName: z.string(),
  universityId: z.string(),
  role: z.string(),
  department: z.string().optional(),
  hostel: z.string().optional(),
  zone: z.string().optional(),
  movement: z.enum(['CHECK-IN', 'CHECK-OUT']),
  time: z.string(),
  date: z.string(),
  gate: z.string(),
  gateId: z.string(),
  verificationMethod: z.string(),
  status: z.enum(['VERIFIED', 'OVERRIDDEN', 'REJECTED']),
  timestamp: z.number(),
  qrToken: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});
export type GateLog = z.infer<typeof GateLogSchema>;

/**
 * Audit Log Schema
 */
export const AuditLogSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  actor: z.string(),
  role: z.string(),
  action: z.string(),
  resource: z.string(),
  result: z.enum(['SUCCESS', 'REJECTED', 'DENIED']),
  details: z.string()
});
export type AuditLog = z.infer<typeof AuditLogSchema>;


// src/lib/mock-data/users.ts
export type C3SRole = 
  | 'STUDENT'
  | 'GUARD'
  | 'PROCTOR'
  | 'GATEKEEPER'
  | 'ADMIN'
  // Legacy aliases normalized to the 5 canonical roles:
  | 'SECURITY_GUARD'
  | 'GATE_KEEPER'
  | 'SUPER_ADMIN'
  | 'CONTROL_ROOM_OPERATOR'
  | 'FACULTY'
  | 'CLASS_COORDINATOR'
  | 'HOD'
  | 'DEAN';

export interface C3SUser {
  id: string;
  name: string;
  universityId: string;
  email: string;
  role: C3SRole;
  department: string;
  phone: string;
  avatar: string;
  status: 'ACTIVE' | 'ON_DUTY' | 'OFF_DUTY' | 'INSIDE' | 'OUTSIDE';
  lastActivity: string;
  assignedGate?: string;
  assignedUnit?: string;
}

export const MOCK_USERS: C3SUser[] = [
  {
    id: 'usr-student-01',
    name: 'Student',
    universityId: 'STU-2026-0842',
    email: 'student@campus.edu',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    status: 'INSIDE',
    lastActivity: 'Active on Campus'
  },
  {
    id: 'usr-guard-01',
    name: 'Guard',
    universityId: 'GRD-SEC-01',
    email: 'guard@campus.edu',
    role: 'GUARD',
    department: 'Campus Security & QRF Patrol',
    phone: '+91 98765 43215',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    status: 'ON_DUTY',
    assignedUnit: 'QRF Patrol Team 1',
    lastActivity: 'Active Patrol'
  },
  {
    id: 'usr-proctor-01',
    name: 'Proctor',
    universityId: 'PROC-SEC-01',
    email: 'proctor@campus.edu',
    role: 'PROCTOR',
    department: 'Campus Discipline & Central SOC',
    phone: '+91 98765 43213',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    status: 'ON_DUTY',
    lastActivity: 'Monitoring Central SOC Operations'
  },
  {
    id: 'usr-gatekeeper-01',
    name: 'Gatekeeper',
    universityId: 'GK-MAIN-01',
    email: 'gatekeeper@campus.edu',
    role: 'GATEKEEPER',
    department: 'Main Gate Access Control',
    phone: '+91 98765 43214',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    status: 'ON_DUTY',
    assignedGate: 'Main Gate',
    lastActivity: 'Terminal Scanner Online'
  },
  {
    id: 'usr-admin-01',
    name: 'Admin',
    universityId: 'ADM-SYS-001',
    email: 'admin@campus.edu',
    role: 'ADMIN',
    department: 'System Administration & Security Governance',
    phone: '+91 98765 43219',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    lastActivity: 'Audit Log Verification'
  }
];

export const ROLE_LABELS: Record<C3SRole, { title: string; desc: string; badgeColor: string }> = {
  STUDENT: { title: 'Student', desc: 'Campus navigation, gate QR pass, emergency SOS', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  GUARD: { title: 'Guard', desc: 'Tactical patrol, incident queue, rapid emergency response', badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  SECURITY_GUARD: { title: 'Guard', desc: 'Tactical patrol, incident queue, rapid emergency response', badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  PROCTOR: { title: 'Proctor', desc: 'SOC video wall, campus security operations, emergency alerts', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  CONTROL_ROOM_OPERATOR: { title: 'Proctor', desc: 'SOC video wall, campus security operations, emergency alerts', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  FACULTY: { title: 'Proctor', desc: 'Academic safety oversight, incident review', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  CLASS_COORDINATOR: { title: 'Proctor', desc: 'Student roll oversight, safety tracking', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  HOD: { title: 'Proctor', desc: 'Department security oversight', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  GATEKEEPER: { title: 'Gatekeeper', desc: 'Gate QR verification, live entry/exit registers, barrier control', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  GATE_KEEPER: { title: 'Gatekeeper', desc: 'Gate QR verification, live entry/exit registers, barrier control', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  ADMIN: { title: 'Admin', desc: 'Master system configuration, gates, cameras, audit logging', badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  SUPER_ADMIN: { title: 'Admin', desc: 'Master system configuration, gates, cameras, audit logging', badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  DEAN: { title: 'Admin', desc: 'Master safety governance & compliance', badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
};

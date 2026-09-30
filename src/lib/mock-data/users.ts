export type C3SRole = 
  | 'STUDENT'
  | 'FACULTY'
  | 'CLASS_COORDINATOR'
  | 'PROCTOR'
  | 'GATE_KEEPER'
  | 'SECURITY_GUARD'
  | 'CONTROL_ROOM_OPERATOR'
  | 'HOD'
  | 'DEAN'
  | 'SUPER_ADMIN';

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
    name: 'Naman Lakhotia',
    universityId: 'BTCS2026-0842',
    email: 'naman.l@campus.edu',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    status: 'INSIDE',
    lastActivity: 'Checked in at Main Gate (08:42 AM)'
  },
  {
    id: 'usr-faculty-01',
    name: 'Dr. Arvinder Sharma',
    universityId: 'FAC-CS-104',
    email: 'asharma@campus.edu',
    role: 'FACULTY',
    department: 'Computer Science & AI',
    phone: '+91 98765 43211',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    status: 'INSIDE',
    lastActivity: 'Academic Block A - Room 204'
  },
  {
    id: 'usr-coord-01',
    name: 'Prof. Anjali Patel',
    universityId: 'CC-CS-302',
    email: 'apatel@campus.edu',
    role: 'CLASS_COORDINATOR',
    department: 'CSE - 3rd Year Section B',
    phone: '+91 98765 43212',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    status: 'INSIDE',
    lastActivity: 'Class Attendance Verified'
  },
  {
    id: 'usr-proctor-01',
    name: 'Col. Rajesh Verma',
    universityId: 'PROC-SEC-01',
    email: 'proctor@campus.edu',
    role: 'PROCTOR',
    department: 'Campus Security & Discipline',
    phone: '+91 98765 43213',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    status: 'ON_DUTY',
    lastActivity: 'Monitoring Central SOC Console'
  },
  {
    id: 'usr-gk-01',
    name: 'Ramesh Singh',
    universityId: 'GK-MG-01',
    email: 'gate1.security@campus.edu',
    role: 'GATE_KEEPER',
    department: 'Main Gate Terminal',
    phone: '+91 98765 43214',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    status: 'ON_DUTY',
    assignedGate: 'Main Gate',
    lastActivity: 'QR Scanner Station Active'
  },
  {
    id: 'usr-guard-01',
    name: 'Vikram Rathore',
    universityId: 'SEC-G02',
    email: 'patrol2@campus.edu',
    role: 'SECURITY_GUARD',
    department: 'Quick Response Team (QRT)',
    phone: '+91 98765 43215',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    status: 'ON_DUTY',
    assignedUnit: 'Guard 02 - Rapid Bike Patrol',
    lastActivity: 'En Route to Academic Block A'
  },
  {
    id: 'usr-operator-01',
    name: 'Neha Gupta',
    universityId: 'SOC-OP-01',
    email: 'controlroom@campus.edu',
    role: 'CONTROL_ROOM_OPERATOR',
    department: 'C3S Command Center',
    phone: '+91 98765 43216',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    status: 'ON_DUTY',
    lastActivity: 'Managing 12 Live Video Feeds'
  },
  {
    id: 'usr-hod-01',
    name: 'Dr. Debabrata Mukherjee',
    universityId: 'HOD-CS-01',
    email: 'hod.cs@campus.edu',
    role: 'HOD',
    department: 'Head of Computer Science & Eng.',
    phone: '+91 98765 43217',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    status: 'INSIDE',
    lastActivity: 'Department Office Block'
  },
  {
    id: 'usr-dean-01',
    name: 'Dr. Sujata Banerjee',
    universityId: 'DEAN-SW-01',
    email: 'dean.sw@campus.edu',
    role: 'DEAN',
    department: 'Dean of Student Affairs',
    phone: '+91 98765 43218',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80',
    status: 'INSIDE',
    lastActivity: 'Administrative Complex'
  },
  {
    id: 'usr-admin-01',
    name: 'System Administrator',
    universityId: 'SYS-ADM-001',
    email: 'admin.c3s@campus.edu',
    role: 'SUPER_ADMIN',
    department: 'Campus IT & Cybersecurity Cell',
    phone: '+91 98765 43219',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    lastActivity: 'Audit Log Export (20:18:42)'
  }
];

export const ROLE_LABELS: Record<C3SRole, { title: string; desc: string; badgeColor: string }> = {
  STUDENT: { title: 'Student', desc: 'Scan gate QR, view location, trigger emergency SOS', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  FACULTY: { title: 'Faculty', desc: 'Campus presence, incident alerts, classroom security', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  CLASS_COORDINATOR: { title: 'Class Coordinator', desc: 'Section student roll verification, emergency tracking', badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  PROCTOR: { title: 'Proctor', desc: 'Discipline overview, high-level alert triage, patrols', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  GATE_KEEPER: { title: 'Gate Keeper', desc: 'Daily gate QR management, live check-in/out logs', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  SECURITY_GUARD: { title: 'Security Guard', desc: 'On-ground patrol, SOS dispatch response, route map', badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  CONTROL_ROOM_OPERATOR: { title: 'Control Room Operator', desc: 'CCTV grid, critical incident hub, responder dispatch', badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30' },
  HOD: { title: 'HOD', desc: 'Department safety status, student & staff headcount', badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  DEAN: { title: 'Dean', desc: 'Campus-wide occupancy, compliance, safety audit reports', badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  SUPER_ADMIN: { title: 'Super Admin', desc: 'Full system control, gate config, cameras, user roles, audit', badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
};
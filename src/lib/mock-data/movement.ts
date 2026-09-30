export interface C3SMovementLog {
  id: string;
  personName: string;
  universityId: string;
  role: string;
  department: string;
  movement: 'CHECK-IN' | 'CHECK-OUT';
  time: string;
  date: string;
  gate: string;
  verificationMethod: 'QR_SCAN' | 'RFID_CARD' | 'MANUAL_OVERRIDE';
  status: 'VERIFIED' | 'FLAGGED' | 'MANUAL';
}

export const MOCK_MOVEMENTS: C3SMovementLog[] = [
  { id: 'mov-101', personName: 'Naman Lakhotia', universityId: 'BTCS2026-0842', role: 'Student', department: 'CSE', movement: 'CHECK-IN', time: '08:42 AM', date: '29 Sep 2026', gate: 'Main Gate', verificationMethod: 'QR_SCAN', status: 'VERIFIED' },
  { id: 'mov-102', personName: 'Rahul Sharma', universityId: 'BTCS2025-1021', role: 'Student', department: 'CSE', movement: 'CHECK-OUT', time: '08:45 AM', date: '29 Sep 2026', gate: 'Main Gate', verificationMethod: 'QR_SCAN', status: 'VERIFIED' },
  { id: 'mov-103', personName: 'Priya Kumari', universityId: 'BTIT2025-0453', role: 'Student', department: 'IT', movement: 'CHECK-IN', time: '08:47 AM', date: '29 Sep 2026', gate: 'Main Gate', verificationMethod: 'QR_SCAN', status: 'VERIFIED' },
  { id: 'mov-104', personName: 'Dr. Arvinder Sharma', universityId: 'FAC-CS-104', role: 'Faculty', department: 'CS & AI', movement: 'CHECK-IN', time: '08:50 AM', date: '29 Sep 2026', gate: 'Main Gate', verificationMethod: 'RFID_CARD', status: 'VERIFIED' },
  { id: 'mov-105', personName: 'Ananya Verma', universityId: 'BTME2024-0321', role: 'Student', department: 'Mechanical', movement: 'CHECK-IN', time: '08:52 AM', date: '29 Sep 2026', gate: 'Jubilee Gate', verificationMethod: 'QR_SCAN', status: 'VERIFIED' },
  { id: 'mov-106', personName: 'Siddharth Jain', universityId: 'BTCS2025-0899', role: 'Student', department: 'CSE', movement: 'CHECK-OUT', time: '08:56 AM', date: '29 Sep 2026', gate: 'New Parking Gate', verificationMethod: 'QR_SCAN', status: 'VERIFIED' },
  { id: 'mov-107', personName: 'Prof. Anjali Patel', universityId: 'CC-CS-302', role: 'Faculty', department: 'CSE', movement: 'CHECK-IN', time: '09:02 AM', date: '29 Sep 2026', gate: 'Main Gate', verificationMethod: 'RFID_CARD', status: 'VERIFIED' },
  { id: 'mov-108', personName: 'Devansh Roy', universityId: 'BTCE2026-0112', role: 'Student', department: 'Civil', movement: 'CHECK-IN', time: '09:05 AM', date: '29 Sep 2026', gate: 'Main Gate', verificationMethod: 'QR_SCAN', status: 'VERIFIED' },
  { id: 'mov-109', personName: 'Pooja Nair', universityId: 'BTCS2026-0774', role: 'Student', department: 'CSE', movement: 'CHECK-OUT', time: '09:12 AM', date: '29 Sep 2026', gate: 'Jubilee Gate', verificationMethod: 'QR_SCAN', status: 'VERIFIED' },
  { id: 'mov-110', personName: 'Sandeep Malhotra', universityId: 'VISITOR-8812', role: 'Visitor', department: 'Guest Speaker', movement: 'CHECK-IN', time: '09:15 AM', date: '29 Sep 2026', gate: 'Main Gate', verificationMethod: 'MANUAL_OVERRIDE', status: 'MANUAL' }
];
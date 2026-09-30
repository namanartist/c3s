export type NotificationCategory = 'Emergency' | 'Security' | 'Gate' | 'System' | 'Information';

export interface C3SNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  time: string;
  date: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  read: boolean;
  link?: string;
}

export const MOCK_NOTIFICATIONS: C3SNotification[] = [
  {
    id: 'notif-01',
    category: 'Emergency',
    title: 'Critical Medical Alert Reported',
    message: 'Medical emergency triggered at Academic Block A (2nd Floor). Responder Guard 02 dispatched.',
    time: '20:16',
    date: 'Today',
    priority: 'CRITICAL',
    read: false,
    link: '/security/incidents/C3S-INC-00192'
  },
  {
    id: 'notif-02',
    category: 'Gate',
    title: 'Gate Check-in Confirmed',
    message: 'You have checked in at Main Gate. Campus safety monitoring is now active.',
    time: '08:42 AM',
    date: 'Today',
    priority: 'NORMAL',
    read: true,
    link: '/student'
  },
  {
    id: 'notif-03',
    category: 'Security',
    title: 'Night Perimeter Routine Active',
    message: 'Campus perimeter sensor tripwire armed at Jubilee Gate western boundary.',
    time: '19:30',
    date: 'Today',
    priority: 'HIGH',
    read: true,
    link: '/control-room/cameras'
  },
  {
    id: 'notif-04',
    category: 'System',
    title: 'Daily Gate QR Regenerated',
    message: 'Daily cryptographically signed QR codes for all 3 campus gates renewed for 29 Sept 2026.',
    time: '00:00',
    date: 'Today',
    priority: 'NORMAL',
    read: true,
    link: '/gate-keeper/qr'
  },
  {
    id: 'notif-05',
    category: 'Information',
    title: 'Campus SafeWalk Available',
    message: 'Late library users can request an escorted SafeWalk to hostel blocks via C3S emergency dispatch.',
    time: '18:00',
    date: 'Today',
    priority: 'NORMAL',
    read: true,
    link: '/student/location'
  }
];
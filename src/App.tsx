import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import useSmoothScroll from '@/hooks/smoothscroll';
import './styles/globals.css';
import { OfflineMeshBridge } from '@/components/safety/OfflineMeshBridge';
import { FightAlertBanner } from '@/components/safety/FightAlertBanner';
import { RoleGuard } from '@/components/c3s/RoleGuard';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

// C3S Resilient Lazy Loaded Page Components
const C3SLoginPage = lazyWithRetry(() => import('@/pages/c3s/C3SLoginPage'), 'C3SLoginPage');
const StudentDashboard = lazyWithRetry(() => import('@/pages/c3s/StudentDashboard'), 'StudentDashboard');
const StudentScanPage = lazyWithRetry(() => import('@/pages/c3s/StudentScanPage'), 'StudentScanPage');
const StudentCheckInPage = lazyWithRetry(() => import('@/pages/c3s/StudentCheckInPage'), 'StudentCheckInPage');
const StudentCheckOutPage = lazyWithRetry(() => import('@/pages/c3s/StudentCheckOutPage'), 'StudentCheckOutPage');
const StudentLocationPage = lazyWithRetry(() => import('@/pages/c3s/StudentLocationPage'), 'StudentLocationPage');
const StudentSosPage = lazyWithRetry(() => import('@/pages/c3s/StudentSosPage'), 'StudentSosPage');
const StudentIncidentsPage = lazyWithRetry(() => import('@/pages/c3s/StudentIncidentsPage'), 'StudentIncidentsPage');
const StudentMovementPage = lazyWithRetry(() => import('@/pages/c3s/StudentMovementPage'), 'StudentMovementPage');
const StudentNotificationsPage = lazyWithRetry(() => import('@/pages/c3s/StudentNotificationsPage'), 'StudentNotificationsPage');

const GateKeeperDashboard = lazyWithRetry(() => import('@/pages/c3s/GateKeeperDashboard'), 'GateKeeperDashboard');
const GateKeeperQrPage = lazyWithRetry(() => import('@/pages/c3s/GateKeeperQrPage'), 'GateKeeperQrPage');
const GateKeeperActivityPage = lazyWithRetry(() => import('@/pages/c3s/GateKeeperActivityPage'), 'GateKeeperActivityPage');
const GateKeeperOccupancyPage = lazyWithRetry(() => import('@/pages/c3s/GateKeeperOccupancyPage'), 'GateKeeperOccupancyPage');

const SecurityDashboard = lazyWithRetry(() => import('@/pages/c3s/SecurityDashboard'), 'SecurityDashboard');
const SecurityIncidentsPage = lazyWithRetry(() => import('@/pages/c3s/SecurityIncidentsPage'), 'SecurityIncidentsPage');
const SecurityIncidentDetailPage = lazyWithRetry(() => import('@/pages/c3s/SecurityIncidentDetailPage'), 'SecurityIncidentDetailPage');
const SecurityMapPage = lazyWithRetry(() => import('@/pages/c3s/SecurityMapPage'), 'SecurityMapPage');

const ControlRoomDashboard = lazyWithRetry(() => import('@/pages/c3s/ControlRoomDashboard'), 'ControlRoomDashboard');
const ControlRoomIncidentsPage = lazyWithRetry(() => import('@/pages/c3s/ControlRoomIncidentsPage'), 'ControlRoomIncidentsPage');
const ControlRoomMapPage = lazyWithRetry(() => import('@/pages/c3s/ControlRoomMapPage'), 'ControlRoomMapPage');
const ControlRoomCamerasPage = lazyWithRetry(() => import('@/pages/c3s/ControlRoomCamerasPage'), 'ControlRoomCamerasPage');
const ControlRoomOccupancyPage = lazyWithRetry(() => import('@/pages/c3s/ControlRoomOccupancyPage'), 'ControlRoomOccupancyPage');
const StaffDashboard = lazyWithRetry(() => import('@/pages/Staff/StaffDashboard'), 'StaffDashboard');

const AdminDashboard = lazyWithRetry(() => import('@/pages/c3s/AdminDashboard'), 'AdminDashboard');
const AdminUsersPage = lazyWithRetry(() => import('@/pages/c3s/AdminUsersPage'), 'AdminUsersPage');
const AdminGatesPage = lazyWithRetry(() => import('@/pages/c3s/AdminGatesPage'), 'AdminGatesPage');
const AdminCamerasPage = lazyWithRetry(() => import('@/pages/c3s/AdminCamerasPage'), 'AdminCamerasPage');
const AdminIncidentsPage = lazyWithRetry(() => import('@/pages/c3s/AdminIncidentsPage'), 'AdminIncidentsPage');
const AdminAnalyticsPage = lazyWithRetry(() => import('@/pages/c3s/AdminAnalyticsPage'), 'AdminAnalyticsPage');
const AdminAuditPage = lazyWithRetry(() => import('@/pages/c3s/AdminAuditPage'), 'AdminAuditPage');

const C3SSettingsPage = lazyWithRetry(() => import('@/pages/c3s/C3SSettingsPage'), 'C3SSettingsPage');
const C3SProfilePage = lazyWithRetry(() => import('@/pages/c3s/C3SProfilePage'), 'C3SProfilePage');
const C3SNotificationsPage = lazyWithRetry(() => import('@/pages/c3s/C3SNotificationsPage'), 'C3SNotificationsPage');

// Preserved Legacy Pages & Error Pages
const LandingPage = lazyWithRetry(() => import('@/pages/Landing/LandingPage'), 'LandingPage');
const MapPage = lazyWithRetry(() => import('@/pages/Map/MapPage'), 'MapPage');
const OperationsPage = lazyWithRetry(() => import('@/pages/Operations/OperationsPage'), 'OperationsPage');
const SupportPage = lazyWithRetry(() => import('@/pages/Support/SupportPage'), 'SupportPage');
const DevelopersPage = lazyWithRetry(() => import('@/pages/Developers/DevelopersPage'), 'DevelopersPage');
const NotFoundPage = lazyWithRetry(() => import('@/pages/404'), 'NotFoundPage');
const AccessDeniedPage = lazyWithRetry(() => import('@/pages/error/AccessDeniedPage'), 'AccessDeniedPage');
const SystemErrorPage = lazyWithRetry(() => import('@/pages/error/SystemErrorPage'), 'SystemErrorPage');

const LoadingFallback = () => (
  <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#070B14] text-slate-200">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  useSmoothScroll();

  return (
    <Router>
      <OfflineMeshBridge />
      <FightAlertBanner />
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public & Entry Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<C3SLoginPage />} />

          {/* Student Suite - Emergency SOS is the default student entry page */}
          <Route path="/student" element={<Navigate to="/student/sos" replace />} />
          <Route path="/student/sos" element={<RoleGuard><StudentSosPage /></RoleGuard>} />
          <Route path="/student/dashboard" element={<RoleGuard><StudentDashboard /></RoleGuard>} />
          <Route path="/student/scan" element={<RoleGuard><StudentScanPage /></RoleGuard>} />
          <Route path="/student/check-in" element={<RoleGuard><StudentCheckInPage /></RoleGuard>} />
          <Route path="/student/check-out" element={<RoleGuard><StudentCheckOutPage /></RoleGuard>} />
          <Route path="/student/location" element={<RoleGuard><StudentLocationPage /></RoleGuard>} />
          <Route path="/student/incidents" element={<RoleGuard><StudentIncidentsPage /></RoleGuard>} />
          <Route path="/student/movement" element={<RoleGuard><StudentMovementPage /></RoleGuard>} />
          <Route path="/student/notifications" element={<RoleGuard><StudentNotificationsPage /></RoleGuard>} />

          {/* Gate Keeper Suite */}
          <Route path="/gate-keeper" element={<RoleGuard allowedRoles={['GATE_KEEPER', 'SUPER_ADMIN']}><GateKeeperDashboard /></RoleGuard>} />
          <Route path="/gate-keeper/qr" element={<RoleGuard allowedRoles={['GATE_KEEPER', 'SUPER_ADMIN']}><GateKeeperQrPage /></RoleGuard>} />
          <Route path="/gate-keeper/activity" element={<RoleGuard allowedRoles={['GATE_KEEPER', 'SUPER_ADMIN']}><GateKeeperActivityPage /></RoleGuard>} />
          <Route path="/gate-keeper/occupancy" element={<RoleGuard allowedRoles={['GATE_KEEPER', 'SUPER_ADMIN']}><GateKeeperOccupancyPage /></RoleGuard>} />
          <Route path="/gate" element={<RoleGuard allowedRoles={['GATE_KEEPER', 'SUPER_ADMIN']}><GateKeeperDashboard /></RoleGuard>} />
          <Route path="/gate/:gateId" element={<RoleGuard allowedRoles={['GATE_KEEPER', 'SUPER_ADMIN']}><GateKeeperDashboard /></RoleGuard>} />

          {/* Security Guard Suite */}
          <Route path="/security" element={<RoleGuard allowedRoles={['SECURITY_GUARD', 'SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR']}><SecurityDashboard /></RoleGuard>} />
          <Route path="/security/incidents" element={<RoleGuard allowedRoles={['SECURITY_GUARD', 'SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR']}><SecurityIncidentsPage /></RoleGuard>} />
          <Route path="/security/incidents/:id" element={<RoleGuard allowedRoles={['SECURITY_GUARD', 'SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR']}><SecurityIncidentDetailPage /></RoleGuard>} />
          <Route path="/security/map" element={<RoleGuard allowedRoles={['SECURITY_GUARD', 'SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR', 'PROCTOR']}><SecurityMapPage /></RoleGuard>} />
          <Route path="/guard" element={<RoleGuard allowedRoles={['SECURITY_GUARD', 'SUPER_ADMIN']}><SecurityDashboard /></RoleGuard>} />

          {/* Faculty Suite */}
          <Route path="/faculty" element={<RoleGuard allowedRoles={['FACULTY', 'HOD', 'DEAN', 'CLASS_COORDINATOR', 'SUPER_ADMIN']}><StaffDashboard role="faculty" /></RoleGuard>} />

          {/* Control Room Suite */}
          <Route path="/control-room" element={<RoleGuard allowedRoles={['CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN', 'PROCTOR', 'HOD', 'DEAN']}><ControlRoomDashboard /></RoleGuard>} />
          <Route path="/control-room/incidents" element={<RoleGuard allowedRoles={['CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN', 'PROCTOR']}><ControlRoomIncidentsPage /></RoleGuard>} />
          <Route path="/control-room/map" element={<RoleGuard allowedRoles={['CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN', 'PROCTOR', 'SECURITY_GUARD']}><ControlRoomMapPage /></RoleGuard>} />
          <Route
            path="/control-room/cameras"
            element={
              <RoleGuard allowedRoles={['CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN', 'SECURITY_GUARD', 'PROCTOR', 'FACULTY', 'HOD', 'DEAN', 'CLASS_COORDINATOR']}>
                <ControlRoomCamerasPage />
              </RoleGuard>
            }
          />
          <Route path="/control-room/occupancy" element={<RoleGuard allowedRoles={['CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN', 'PROCTOR']}><ControlRoomOccupancyPage /></RoleGuard>} />
          <Route path="/proctor" element={<RoleGuard allowedRoles={['PROCTOR', 'SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR']}><ControlRoomDashboard /></RoleGuard>} />

          {/* Super Admin Suite */}
          <Route path="/admin" element={<RoleGuard allowedRoles={['SUPER_ADMIN']}><AdminDashboard /></RoleGuard>} />
          <Route path="/admin/users" element={<RoleGuard allowedRoles={['SUPER_ADMIN']}><AdminUsersPage /></RoleGuard>} />
          <Route path="/admin/gates" element={<RoleGuard allowedRoles={['SUPER_ADMIN']}><AdminGatesPage /></RoleGuard>} />
          <Route
            path="/admin/cameras"
            element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR']}>
                <AdminCamerasPage />
              </RoleGuard>
            }
          />
          <Route path="/admin/incidents" element={<RoleGuard allowedRoles={['SUPER_ADMIN']}><AdminIncidentsPage /></RoleGuard>} />
          <Route path="/admin/analytics" element={<RoleGuard allowedRoles={['SUPER_ADMIN']}><AdminAnalyticsPage /></RoleGuard>} />
          <Route path="/admin/audit" element={<RoleGuard allowedRoles={['SUPER_ADMIN']}><AdminAuditPage /></RoleGuard>} />

          {/* Global Pages */}
          <Route path="/settings" element={<RoleGuard><C3SSettingsPage /></RoleGuard>} />
          <Route path="/profile" element={<RoleGuard><C3SProfilePage /></RoleGuard>} />
          <Route path="/notifications" element={<RoleGuard><C3SNotificationsPage /></RoleGuard>} />

          {/* Error & Diagnostic Pages */}
          <Route path="/403" element={<AccessDeniedPage />} />
          <Route path="/500" element={<SystemErrorPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Campus Map & Operations (Protected by RBAC) */}
          <Route path="/map" element={<RoleGuard><MapPage /></RoleGuard>} />
          <Route path="/operations" element={<RoleGuard><OperationsPage /></RoleGuard>} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/developer" element={<DevelopersPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Analytics />
    </Router>
  );
}

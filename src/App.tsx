import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import useSmoothScroll from '@/hooks/smoothscroll';
import './styles/globals.css';
import { OfflineMeshBridge } from '@/components/safety/OfflineMeshBridge';

// C3S Lazy Loaded Page Components
const C3SLoginPage = React.lazy(() => import('@/pages/c3s/C3SLoginPage'));
const StudentDashboard = React.lazy(() => import('@/pages/c3s/StudentDashboard'));
const StudentScanPage = React.lazy(() => import('@/pages/c3s/StudentScanPage'));
const StudentCheckInPage = React.lazy(() => import('@/pages/c3s/StudentCheckInPage'));
const StudentCheckOutPage = React.lazy(() => import('@/pages/c3s/StudentCheckOutPage'));
const StudentLocationPage = React.lazy(() => import('@/pages/c3s/StudentLocationPage'));
const StudentSosPage = React.lazy(() => import('@/pages/c3s/StudentSosPage'));
const StudentIncidentsPage = React.lazy(() => import('@/pages/c3s/StudentIncidentsPage'));
const StudentMovementPage = React.lazy(() => import('@/pages/c3s/StudentMovementPage'));
const StudentNotificationsPage = React.lazy(() => import('@/pages/c3s/StudentNotificationsPage'));

const GateKeeperDashboard = React.lazy(() => import('@/pages/c3s/GateKeeperDashboard'));
const GateKeeperQrPage = React.lazy(() => import('@/pages/c3s/GateKeeperQrPage'));
const GateKeeperActivityPage = React.lazy(() => import('@/pages/c3s/GateKeeperActivityPage'));
const GateKeeperOccupancyPage = React.lazy(() => import('@/pages/c3s/GateKeeperOccupancyPage'));

const SecurityDashboard = React.lazy(() => import('@/pages/c3s/SecurityDashboard'));
const SecurityIncidentsPage = React.lazy(() => import('@/pages/c3s/SecurityIncidentsPage'));
const SecurityIncidentDetailPage = React.lazy(() => import('@/pages/c3s/SecurityIncidentDetailPage'));
const SecurityMapPage = React.lazy(() => import('@/pages/c3s/SecurityMapPage'));

const ControlRoomDashboard = React.lazy(() => import('@/pages/c3s/ControlRoomDashboard'));
const ControlRoomIncidentsPage = React.lazy(() => import('@/pages/c3s/ControlRoomIncidentsPage'));
const ControlRoomMapPage = React.lazy(() => import('@/pages/c3s/ControlRoomMapPage'));
const ControlRoomCamerasPage = React.lazy(() => import('@/pages/c3s/ControlRoomCamerasPage'));
const ControlRoomOccupancyPage = React.lazy(() => import('@/pages/c3s/ControlRoomOccupancyPage'));

const AdminDashboard = React.lazy(() => import('@/pages/c3s/AdminDashboard'));
const AdminUsersPage = React.lazy(() => import('@/pages/c3s/AdminUsersPage'));
const AdminGatesPage = React.lazy(() => import('@/pages/c3s/AdminGatesPage'));
const AdminCamerasPage = React.lazy(() => import('@/pages/c3s/AdminCamerasPage'));
const AdminIncidentsPage = React.lazy(() => import('@/pages/c3s/AdminIncidentsPage'));
const AdminAnalyticsPage = React.lazy(() => import('@/pages/c3s/AdminAnalyticsPage'));
const AdminAuditPage = React.lazy(() => import('@/pages/c3s/AdminAuditPage'));

const C3SSettingsPage = React.lazy(() => import('@/pages/c3s/C3SSettingsPage'));
const C3SProfilePage = React.lazy(() => import('@/pages/c3s/C3SProfilePage'));
const C3SNotificationsPage = React.lazy(() => import('@/pages/c3s/C3SNotificationsPage'));

// Preserved Legacy Pages
const LandingPage = React.lazy(() => import('@/pages/Landing/LandingPage'));
const MapPage = React.lazy(() => import('@/pages/Map/MapPage'));
const OperationsPage = React.lazy(() => import('@/pages/Operations/OperationsPage'));
const SupportPage = React.lazy(() => import('@/pages/Support/SupportPage'));
const NotFoundPage = React.lazy(() => import('@/pages/404'));

const LoadingFallback = () => (
  <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0B1020] text-slate-200">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent shadow-lg shadow-blue-500/20" />
    <p className="mt-4 font-mono text-xs text-blue-400 tracking-wider">C3S LOADING TACTICAL RADAR...</p>
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
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public & Entry Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<C3SLoginPage />} />

          {/* Student Suite */}
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/scan" element={<StudentScanPage />} />
          <Route path="/student/check-in" element={<StudentCheckInPage />} />
          <Route path="/student/check-out" element={<StudentCheckOutPage />} />
          <Route path="/student/location" element={<StudentLocationPage />} />
          <Route path="/student/sos" element={<StudentSosPage />} />
          <Route path="/student/incidents" element={<StudentIncidentsPage />} />
          <Route path="/student/movement" element={<StudentMovementPage />} />
          <Route path="/student/notifications" element={<StudentNotificationsPage />} />

          {/* Gate Keeper Suite */}
          <Route path="/gate-keeper" element={<GateKeeperDashboard />} />
          <Route path="/gate-keeper/qr" element={<GateKeeperQrPage />} />
          <Route path="/gate-keeper/activity" element={<GateKeeperActivityPage />} />
          <Route path="/gate-keeper/occupancy" element={<GateKeeperOccupancyPage />} />
          <Route path="/gate" element={<GateKeeperDashboard />} />
          <Route path="/gate/:gateId" element={<GateKeeperDashboard />} />

          {/* Security Guard Suite */}
          <Route path="/security" element={<SecurityDashboard />} />
          <Route path="/security/incidents" element={<SecurityIncidentsPage />} />
          <Route path="/security/incidents/:id" element={<SecurityIncidentDetailPage />} />
          <Route path="/security/map" element={<SecurityMapPage />} />
          <Route path="/guard" element={<SecurityDashboard />} />

          {/* Control Room Suite */}
          <Route path="/control-room" element={<ControlRoomDashboard />} />
          <Route path="/control-room/incidents" element={<ControlRoomIncidentsPage />} />
          <Route path="/control-room/map" element={<ControlRoomMapPage />} />
          <Route path="/control-room/cameras" element={<ControlRoomCamerasPage />} />
          <Route path="/control-room/occupancy" element={<ControlRoomOccupancyPage />} />
          <Route path="/proctor" element={<ControlRoomDashboard />} />

          {/* Super Admin Suite */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/gates" element={<AdminGatesPage />} />
          <Route path="/admin/cameras" element={<AdminCamerasPage />} />
          <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />

          {/* Global Pages */}
          <Route path="/settings" element={<C3SSettingsPage />} />
          <Route path="/profile" element={<C3SProfilePage />} />
          <Route path="/notifications" element={<C3SNotificationsPage />} />

          {/* Additional Features */}
          <Route path="/map" element={<MapPage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Analytics />
    </Router>
  );
}
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import useSmoothScroll from '@/hooks/smoothscroll';
import './styles/globals.css';
import { OfflineMeshBridge } from '@/components/safety/OfflineMeshBridge';
import { FightAlertBanner } from '@/components/safety/FightAlertBanner';
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

          {/* Error & Diagnostic Pages */}
          <Route path="/403" element={<AccessDeniedPage />} />
          <Route path="/500" element={<SystemErrorPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Additional Features */}
          <Route path="/map" element={<MapPage />} />
          <Route path="/operations" element={<OperationsPage />} />
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

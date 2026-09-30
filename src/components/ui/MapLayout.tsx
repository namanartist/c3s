import React from 'react';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { useSafetyStore } from '@/store/safetyStore';
import { CctvSocDashboard } from '@/components/safety/CctvSocDashboard';
import { SafetyAnalyticsDashboard } from '@/components/safety/SafetyAnalyticsDashboard';
import { PatrolDispatchDashboard } from '@/components/safety/PatrolDispatchDashboard';
import { ProctorDashboard } from '@/components/safety/ProctorDashboard';
import { isProctorRole } from '@/lib/viewerRole';

export interface MapLayoutProps {
  header?: React.ReactNode;
  searchBar?: React.ReactNode;
  mapCanvas?: React.ReactNode;
  routePanel?: React.ReactNode;
}

export function MapLayout({ header, searchBar, mapCanvas, routePanel }: MapLayoutProps) {
  const { isMobile, loading } = useCampusNavigation();
  const activeDashboard = useSafetyStore((s) => s.activeDashboard);
  const proctorMode = isProctorRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-700 text-sm font-semibold">Loading MITS campus map...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#F8FAFC] select-none flex flex-col">
        {/* Floating Top Dashboard Mode Switcher */}
        {proctorMode && <ProctorDashboard />}

        {/* Full Screen Interactive Map Canvas */}
        <div className="flex-1 relative w-full h-full z-0">
          {mapCanvas}
        </div>

        {/* Conditional Dashboards for Mobile */}
        {activeDashboard === 'soc' && <CctvSocDashboard />}
        {activeDashboard === 'analytics' && <SafetyAnalyticsDashboard />}
        {activeDashboard === 'patrol' && <PatrolDispatchDashboard />}

        {activeDashboard === 'nav' && (
          <>
            {searchBar}
            {routePanel}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F8FAFC] select-none flex flex-col">
      {/* Top Center Floating Dashboard Context Switcher */}
      {proctorMode && <ProctorDashboard />}

      {/* Full Screen Interactive Map Canvas */}
      <div className="flex-1 relative w-full h-full z-0">
        {mapCanvas}
      </div>

      {header}

      {/* Conditional Full-Screen / Overlay Dashboards */}
      {proctorMode && activeDashboard === 'soc' && <CctvSocDashboard />}
      {proctorMode && activeDashboard === 'analytics' && <SafetyAnalyticsDashboard />}
      {proctorMode && activeDashboard === 'patrol' && <PatrolDispatchDashboard />}

      {/* Floating Search & Safe Route Drawer (Left Side - Active in Nav Mode) */}
      <div
        className={`absolute top-6 left-6 z-10 w-[395px] h-[calc(100vh-48px)] flex flex-col bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl border border-slate-200/90 overflow-hidden pointer-events-auto transition-all duration-300 ${activeDashboard !== 'nav' || proctorMode ? 'opacity-0 pointer-events-none -translate-x-6' : 'opacity-100 translate-x-0'
          }`}
      >
        {/* Drawer Mini Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <span className="text-xs font-black text-slate-900 tracking-wider uppercase">MITS CAMPUS NAVIGATOR</span>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold uppercase border border-blue-200/60">
            Light Mode
          </span>
        </div>

        {/* Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar" data-lenis-prevent>
          {searchBar}
          {routePanel}
        </div>
      </div>
    </div>
  );
}

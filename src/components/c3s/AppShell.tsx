import React, { useState } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { SOSActiveBanner } from './SOSActiveBanner';
import { LayoutDashboard, Bell, Scan, ShieldAlert, User, MapPin, Camera } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { currentRole, sosActive } = useC3SStore();

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0B1020] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Topbar onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Floating Emergency SOS Banner */}
      <SOSActiveBanner />

      {/* Main Body Area */}
      <div className="flex flex-1 overflow-hidden pb-16 sm:pb-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
            <div className="relative flex w-72 flex-col bg-[#0B1020] z-10 shadow-2xl">
              <div className="flex justify-end p-3">
                <button onClick={() => setMobileSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>
              <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 flex sm:hidden h-16 items-center justify-around border-t border-slate-800 bg-[#0B1020]/95 backdrop-blur-xl px-2">
        <NavLink
          to={currentRole === 'GATE_KEEPER' ? '/gate-keeper' : currentRole === 'SECURITY_GUARD' ? '/security' : currentRole === 'CONTROL_ROOM_OPERATOR' ? '/control-room' : currentRole === 'SUPER_ADMIN' ? '/admin' : '/student'}
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] font-bold ${isActive ? 'text-blue-400' : 'text-slate-400'}`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/map"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] font-bold ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <MapPin className="h-5 w-5" />
          <span>Map</span>
        </NavLink>

        {/* Center Big SOS Button */}
        <NavLink
          to="/student/sos"
          className="relative -top-3 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white shadow-lg shadow-rose-950/60 ring-4 ring-[#0B1020] active:scale-95"
        >
          <ShieldAlert className="h-6 w-6 animate-pulse" />
          <span className="text-[8px] font-black uppercase">SOS</span>
        </NavLink>

        <NavLink
          to="/student/scan"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] font-bold ${isActive ? 'text-blue-400' : 'text-slate-400'}`}
        >
          <Scan className="h-5 w-5" />
          <span>Scan QR</span>
        </NavLink>

        <NavLink
          to="/control-room/cameras"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] font-bold ${isActive ? 'text-blue-400' : 'text-slate-400'}`}
        >
          <Camera className="h-5 w-5" />
          <span>CCTV</span>
        </NavLink>
      </nav>
    </div>
  );
};
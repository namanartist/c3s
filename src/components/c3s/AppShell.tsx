import React, { useState } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { SOSActiveBanner } from './SOSActiveBanner';
import { SosModal } from '@/components/safety/SosModal';
import { LayoutDashboard, Scan, ShieldAlert, MapPin, Camera } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { currentRole } = useC3SStore();

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors">
      {/* Top Header */}
      <Topbar onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Floating Emergency SOS Banner */}
      <SOSActiveBanner />
      <SosModal />

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
            <div className="relative flex w-72 flex-col bg-white dark:bg-[#090D16] z-10 shadow-2xl border-r border-slate-200 dark:border-white/[0.08]">
              <div className="flex justify-end p-3">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  aria-label="Close Navigation"
                >
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
      <nav className="fixed bottom-0 inset-x-0 z-30 flex sm:hidden h-16 items-center justify-around border-t border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-2xl px-2 transition-colors">
        <NavLink
          to={currentRole === 'GATE_KEEPER' ? '/gate-keeper' : currentRole === 'SECURITY_GUARD' ? '/security' : currentRole === 'CONTROL_ROOM_OPERATOR' ? '/control-room' : currentRole === 'SUPER_ADMIN' ? '/admin' : '/student'}
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/map"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <MapPin className="h-5 w-5" />
          <span>Map</span>
        </NavLink>

        {/* Center Quick SOS Button */}
        <NavLink
          to="/student/sos"
          className="relative -top-2 flex h-12 w-12 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-lg shadow-rose-950/60 ring-4 ring-[#090D16] active:scale-95 transition-transform"
          aria-label="Emergency SOS"
        >
          <ShieldAlert className="h-5 w-5 animate-pulse" />
        </NavLink>

        <NavLink
          to="/student/scan"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Scan className="h-5 w-5" />
          <span>Scan QR</span>
        </NavLink>

        <NavLink
          to="/control-room/cameras"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Camera className="h-5 w-5" />
          <span>CCTV</span>
        </NavLink>
      </nav>
    </div>
  );
};

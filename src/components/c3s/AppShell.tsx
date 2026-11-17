/**
 * src/components/c3s/AppShell.tsx
 *
 * Premium command-center shell.
 * Renders the persistent navigation (sidebar / mobile drawer / bottom bar),
 * the global top bar and the content region with an atmospheric ambient
 * backdrop so every dashboard inherits one premium visual language.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { SOSActiveBanner } from './SOSActiveBanner';
import { SosModal } from '@/components/safety/SosModal';
import { LayoutDashboard, Scan, ShieldAlert, MapPin, Camera, Activity, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { getRoleDefaultPath } from '@/lib/rbac';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const currentRole = useC3SStore((state) => state.currentRole);
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close the drawer whenever the route changes.
  const [lastPathname, setLastPathname] = useState(location.pathname);
  if (lastPathname !== location.pathname) {
    setLastPathname(location.pathname);
    setMobileSidebarOpen(false);
  }

  useEffect(() => {
    let raf = 0;
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        return; // handled by the top bar
      }
      if (event.key === 'Escape') {
        raf = window.requestAnimationFrame(() => setMobileSidebarOpen(false));
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  // Escape closes the drawer; body scroll is locked while it is open.
  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  // Trap focus inside the drawer while open.
  useEffect(() => {
    if (!mobileSidebarOpen || !drawerRef.current) return undefined;

    function handleTab(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [mobileSidebarOpen]);

  const bottomNavClass = ({ isActive }: { isActive: boolean }) =>
    `group relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 ${
      isActive ? 'text-sky-400' : 'text-slate-500 hover:text-slate-200'
    }`;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white transition-colors dark:bg-[#05070d] dark:text-slate-100">
      {/* ── Ambient backdrop ─────────────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.07)_0%,transparent_70%)]" />
        <div className="absolute -right-40 top-64 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,96,46,0.05)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.06)_0%,transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* Top Header */}
      <Topbar onToggleSidebar={() => setMobileSidebarOpen((open) => !open)} />

      {/* Floating Emergency SOS Banner */}
      <SOSActiveBanner />
      <SosModal />

      {/* Main Body Area */}
      <div className="relative flex flex-1 overflow-hidden pb-16 lg:pb-0">
        {/* Desktop Sidebar — fluid width, never crushes the canvas */}
        <div className="relative z-10 hidden shrink-0 lg:block lg:w-[clamp(14rem,20vw,18rem)] xl:w-[clamp(15.5rem,19.5vw,19.5rem)] 2xl:w-[clamp(17rem,18vw,21rem)]">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="relative z-10 flex w-72 flex-col border-r border-white/10 bg-[#070b16] shadow-[0_0_80px_rgba(0,0,0,0.9)]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
                <div className="leading-tight">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-sky-400">
                    Menu
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-400">Command Center</p>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-400 transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70"
                  aria-label="Close Navigation"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Content Container — fluid padding, fills available space */}
        <main className="relative z-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 xl:p-6 2xl:p-8">
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Mobile & tablet bottom navigation — phones and small screens only.
          Desktop (≥lg) uses the sidebar navigation instead. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-2xl transition-colors dark:border-white/[0.08] dark:bg-[#070b16]/95 lg:hidden"
        aria-label="Primary"
      >
        <NavLink to={getRoleDefaultPath(currentRole)} className={bottomNavClass}>
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          <span>Home</span>
        </NavLink>

        <NavLink to="/map" className={bottomNavClass}>
          <MapPin className="h-5 w-5" aria-hidden="true" />
          <span>Map</span>
        </NavLink>

        {/* Center Quick SOS Button */}
        <NavLink
          to="/student/sos"
          className="group relative -top-3 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 text-white shadow-[0_8px_28px_-4px_rgba(244,63,94,0.6)] ring-4 ring-[#05070d] transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          aria-label="Emergency SOS"
        >
          <ShieldAlert className="h-6 w-6 animate-pulse" aria-hidden="true" />
        </NavLink>

        <NavLink to="/student/scan" className={bottomNavClass}>
          <Scan className="h-5 w-5" aria-hidden="true" />
          <span>Scan QR</span>
        </NavLink>

        {currentRole !== 'STUDENT' ? (
          <NavLink to="/control-room/cameras" className={bottomNavClass}>
            <Camera className="h-5 w-5" aria-hidden="true" />
            <span>CCTV</span>
          </NavLink>
        ) : (
          <NavLink to="/student/movement" className={bottomNavClass}>
            <Activity className="h-5 w-5" aria-hidden="true" />
            <span>Pass Logs</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
};

export default AppShell;

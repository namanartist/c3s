// src/components/ui/MapHeader.tsx
/**
 * Premium floating command bar for the campus map.
 * All quick navigation is RBAC-gated against the signed-in role.
 */
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  PanelLeft,
  Home,
  Shield,
  School,
  HelpCircle,
  Radio,
  DoorOpen,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import clgLogo from '@/assets/clg_logo.webp';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { useSafetyStore } from '@/store/safetyStore';
import { useC3SStore } from '@/store/c3sStore';
import { isProctorRole } from '@/lib/viewerRole';
import { normalizeRole } from '@/lib/rbac';
import type { C3SRole } from '@/lib/mock-data/users';
import ThemeToggle from '@/components/ui/ThemeToggle';

export function MapHeader() {
  const navigate = useNavigate();
  const { isMobile, sidebarOpen, setSidebarOpen, isMenuOpen, setIsMenuOpen } = useCampusNavigation();
  const proctorMode = isProctorRole();
  const currentRole = useC3SStore((s) => s.currentRole);
  const roleKey = normalizeRole(currentRole);

  if (isMobile) {
    return (
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-2.5 py-1.5 shadow-lg backdrop-blur-2xl transition-colors dark:border-white/10 dark:bg-slate-900/95">
        <ThemeToggle />
        {roleKey !== 'STUDENT' && (
          <button
            type="button"
            onClick={() => useSafetyStore.getState().setSosModalOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-red-500/30 transition-all active:scale-95"
            title="Emergency SOS"
          >
            <Radio className="h-3 w-3 animate-pulse" />
            SOS
          </button>
        )}
      </div>
    );
  }

  const menuItems: Array<{
    label: string;
    icon: React.ElementType;
    tone: string;
    action: () => void;
    allowed: (role: C3SRole) => boolean;
  }> = [
    { label: 'C3S Home', icon: Home, tone: 'text-sky-500', action: () => navigate('/'), allowed: () => true },
    { label: 'Student Base', icon: School, tone: 'text-indigo-500', action: () => navigate('/student'), allowed: (r) => normalizeRole(r) === 'STUDENT' },
    { label: 'Guard Terminal', icon: Shield, tone: 'text-emerald-500', action: () => navigate('/security'), allowed: (r) => normalizeRole(r) === 'GUARD' },
    { label: 'Gate Terminal', icon: DoorOpen, tone: 'text-amber-500', action: () => navigate('/gate-keeper'), allowed: (r) => normalizeRole(r) === 'GATEKEEPER' },
    { label: 'Control Room SOC', icon: LayoutDashboard, tone: 'text-purple-500', action: () => navigate('/control-room'), allowed: (r) => normalizeRole(r) === 'PROCTOR' },
    { label: 'Administration', icon: ShieldCheck, tone: 'text-rose-500', action: () => navigate('/admin'), allowed: (r) => normalizeRole(r) === 'ADMIN' },
    { label: 'Support & Help', icon: HelpCircle, tone: 'text-violet-500', action: () => navigate('/support'), allowed: () => true },
  ];

  return (
    <div className="pointer-events-auto absolute right-5 top-5 z-20 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2 shadow-xl backdrop-blur-2xl transition-colors dark:border-white/10 dark:bg-[#0A0F1D]/90">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 rounded-xl outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-sky-500/60"
        title="Campus Safety Map Home"
      >
        <img src={clgLogo} alt="MITS Logo" className="h-8 w-auto object-contain" decoding="async" />
        <span className="font-mono text-xs text-slate-300 dark:text-slate-700">/</span>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black leading-none tracking-tight text-slate-900 dark:text-white">
              MITS MAP
            </span>
            <span className="rounded bg-blue-600 px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider text-white">
              {proctorMode ? 'PROCTOR' : '3D VECTOR'}
            </span>
          </div>
          <span className="mt-0.5 flex items-center gap-1 text-[9px] font-bold tracking-wide text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
            {proctorMode ? 'SOC OPERATIONS LIVE' : 'CAMPUS MESH LIVE'}
          </span>
        </div>
      </button>

      <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />

      {/* Emergency quick SOS — icon-first, RBAC-aware styling */}
      <button
        type="button"
        onClick={() => useSafetyStore.getState().setSosModalOpen(true)}
        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-3 py-2 text-xs font-black text-white shadow-md shadow-red-500/25 transition-all hover:from-red-500 hover:to-rose-600 active:scale-95"
        title="Open Emergency SOS Trigger"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        <span className="hidden sm:inline">SOS</span>
      </button>

      {/* Sidebar toggle shortcut */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
          sidebarOpen
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700'
        }`}
        title={sidebarOpen ? 'Collapse Sidebar' : 'Open Sidebar'}
      >
        <PanelLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Navigator</span>
      </button>

      <ThemeToggle />

      <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />

      {/* RBAC-gated overflow navigation menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-700 transition-all hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
          aria-label="Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 z-30 mt-3 flex min-w-44 flex-col gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-2xl transition-colors dark:border-white/10 dark:bg-slate-900/95"
              role="menu"
              aria-label="Quick navigation"
            >
              {menuItems.filter((item) => item.allowed(currentRole)).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      item.action();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    <Icon className={`h-4 w-4 ${item.tone}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

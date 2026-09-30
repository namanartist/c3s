// src/components/safety/DashboardModeSwitcher.tsx
import { motion } from 'motion/react';
import {
  Navigation,
  Video,
  BarChart3,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import type { DashboardMode } from '@/types/safety';

export function DashboardModeSwitcher() {
  const activeDashboard = useSafetyStore((s) => s.activeDashboard);
  const setActiveDashboard = useSafetyStore((s) => s.setActiveDashboard);
  const incidents = useSafetyStore((s) => s.incidents);
  const cctvCameras = useSafetyStore((s) => s.cctvCameras);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved').length;
  const alertCameras = cctvCameras.filter((c) => c.status === 'alert').length;

  const modes: {
    id: DashboardMode;
    label: string;
    sublabel: string;
    icon: typeof Navigation;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'nav',
      label: 'Safe Nav',
      sublabel: 'Student / User Map',
      icon: Navigation
    },
    {
      id: 'soc',
      label: 'CCTV SOC',
      sublabel: 'Live Surveillance Grid',
      icon: Video,
      badge: alertCameras,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'analytics',
      label: 'Safety Intel',
      sublabel: 'Incident Analytics',
      icon: BarChart3
    },
    {
      id: 'patrol',
      label: 'Patrol & QRF',
      sublabel: 'Security Fleet & Dispatch',
      icon: ShieldCheck,
      badge: activeIncidents,
      badgeColor: 'bg-red-500 text-white animate-pulse'
    }
  ];

  return (
    <div className="flex items-center p-1 bg-neutral-950/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 select-none">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = activeDashboard === m.id;

        return (
          <button
            key={m.id}
            onClick={() => setActiveDashboard(m.id)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-white shadow-lg'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="c3s-dashboard-pill"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-xl -z-10 shadow-md shadow-blue-500/25"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}

            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />

            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-tight leading-none flex items-center gap-1.5">
                {m.label}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </span>
              <span className="text-[9px] font-mono text-white/60 leading-tight hidden lg:inline">
                {m.sublabel}
              </span>
            </div>

            {m.badge != null && m.badge > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  m.badgeColor || 'bg-red-500 text-white'
                }`}
              >
                {m.badge}
              </span>
            )}
          </button>
        );
      })}

      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono text-emerald-400 border-l border-white/10 ml-1">
        <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
        <span className="font-bold">C3S ONLINE</span>
      </div>
    </div>
  );
}

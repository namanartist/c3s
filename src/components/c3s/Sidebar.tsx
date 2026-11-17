/**
 * src/components/c3s/Sidebar.tsx
 *
 * Premium navigation rail for the C3S command center:
 * gradient active indicators, grouped sections, live badges derived from the
 * store, and a presence capsule for the signed-in operator.
 */
import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  DoorOpen,
  MapPin,
  Camera,
  Users,
  BarChart3,
  FileText,
  Settings,
  Bell,
  Scan,
  Activity,
  Navigation,
  LogOut,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { normalizeRole } from '@/lib/rbac';
import { LogoutConfirmModal } from './LogoutConfirmModal';

interface SidebarProps {
  onCloseMobile?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: number;
  badgeLabel?: string;
  alert?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const currentRole = useC3SStore((state) => state.currentRole);
  const sosActive = useC3SStore((state) => state.sosActive);
  const incidents = useC3SStore((state) => state.incidents);
  const cameras = useC3SStore((state) => state.cameras);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const openIncidents = incidents.filter((incident) => incident.status !== 'RESOLVED').length;
  const liveCameras = cameras.filter((camera) => camera.status === 'ONLINE').length;

  // Role-tailored dynamic menu configuration.
  const getNavSections = (): NavSection[] => {
    const roleKey = normalizeRole(currentRole);

    switch (roleKey) {
      case 'GATEKEEPER':
        return [
          {
            title: 'Terminal',
            items: [
              { to: '/gate-keeper', label: 'Gate Terminal', icon: DoorOpen, end: true },
              { to: '/gate-keeper/qr', label: 'Daily Gate QR', icon: Scan },
              { to: '/gate-keeper/activity', label: 'Live Gate Activity', icon: Activity },
              { to: '/gate-keeper/occupancy', label: 'Gate Occupancy', icon: BarChart3 },
            ],
          },
          {
            title: 'Campus',
            items: [{ to: '/map', label: 'Campus Grid', icon: Navigation }],
          },
        ];

      case 'GUARD':
        return [
          {
            title: 'Response',
            items: [
              { to: '/security', label: 'Guard Patrol', icon: LayoutDashboard, end: true },
              {
                to: '/security/incidents',
                label: 'Active Incidents',
                icon: ShieldAlert,
                badge: openIncidents || undefined,
              },
              { to: '/security/map', label: 'SOS Dispatch', icon: MapPin },
            ],
          },
        ];

      case 'ADMIN':
        return [
          {
            title: 'Governance',
            items: [
              { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard, end: true },
              { to: '/admin/users', label: 'User Directory', icon: Users },
              { to: '/admin/gates', label: 'Gate Network', icon: DoorOpen },
              { to: '/admin/audit', label: 'Audit Trail', icon: FileText },
            ],
          },
          {
            title: 'Surveillance',
            items: [
              {
                to: '/admin/cameras',
                label: 'CCTV Fleet',
                icon: Camera,
                badgeLabel: liveCameras ? `${liveCameras} live` : undefined,
              },
              {
                to: '/admin/incidents',
                label: 'Incident Logs',
                icon: ShieldAlert,
                badge: openIncidents || undefined,
              },
              { to: '/admin/analytics', label: 'Safety Analytics', icon: BarChart3 },
            ],
          },
        ];

      case 'PROCTOR':
        return [
          {
            title: 'Command',
            items: [
              { to: '/control-room', label: 'Control Center', icon: LayoutDashboard, end: true },
              {
                to: '/control-room/incidents',
                label: 'Incident Hub',
                icon: ShieldAlert,
                badge: openIncidents || undefined,
              },
              {
                to: '/control-room/cameras',
                label: 'CCTV Matrix',
                icon: Camera,
                badgeLabel: liveCameras ? `${liveCameras} live` : undefined,
              },
            ],
          },
          {
            title: 'Awareness',
            items: [
              { to: '/control-room/map', label: 'SOS Tactical', icon: MapPin },
              { to: '/control-room/occupancy', label: 'Campus Occupancy', icon: BarChart3 },
            ],
          },
        ];

      case 'STUDENT':
      default:
        return [
          {
            title: 'Safety',
            items: [
              { to: '/student/sos', label: 'Emergency SOS', icon: ShieldAlert, alert: sosActive },
              { to: '/student/dashboard', label: 'Student Pass & Hub', icon: LayoutDashboard, end: true },
            ],
          },
          {
            title: 'Campus',
            items: [
              { to: '/student/scan', label: 'Scan Gate QR', icon: Scan },
              { to: '/map', label: 'Campus Grid', icon: Navigation },
            ],
          },
          {
            title: 'Records',
            items: [
              { to: '/student/movement', label: 'Movement Logs', icon: Activity },
              { to: '/student/incidents', label: 'Incident Reports', icon: ShieldAlert },
              { to: '/student/notifications', label: 'Alerts', icon: Bell },
            ],
          },
        ];
    }
  };

  const navSections = getNavSections();

  return (
    <aside className="relative flex h-full w-full flex-col justify-between overflow-hidden border-r border-slate-200 bg-white transition-colors dark:border-white/[0.07] dark:bg-[#05070d]">
      {/* ── Command header ────────────────────────────────────────── */}
      <div className="relative border-b border-slate-200 px-5 py-4 dark:border-white/[0.06]">
        <div
          aria-hidden="true"
          className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14)_0%,transparent_70%)]"
        />
        <div className="relative flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <img src="/c3s_logo.png" alt="" className="h-6 w-6 object-contain" />
          </span>
          <div className="leading-tight">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-500">
              Command Center
            </p>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              MITS · Gwalior
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation (scrollable when content exceeds height) ── */}
      <nav className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 scroll-thin" aria-label="Primary navigation">
        {navSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-5' : ''}>
            <div className="flex items-center justify-between px-3 pb-1.5">
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.26em] text-slate-400 dark:text-slate-600">
                {section.title}
              </span>
              {sectionIndex === 0 && (
                <span className="rounded-md border border-sky-500/25 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                  {normalizeRole(currentRole).replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const badgeText =
                  item.badgeLabel ?? (item.badge !== undefined ? String(item.badge) : undefined);

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <>
                              <span
                                aria-hidden="true"
                                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-sky-400 to-indigo-500"
                              />
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/[0.14] via-indigo-500/[0.08] to-transparent ring-1 ring-inset ring-sky-500/20"
                              />
                            </>
                          )}
                          <span className="relative flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                                isActive
                                  ? 'border-sky-400/30 bg-gradient-to-br from-sky-500/25 to-indigo-500/20 text-sky-300'
                                  : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-500 dark:group-hover:border-white/[0.12] dark:group-hover:text-slate-300'
                              }`}
                            >
                              <Icon
                                className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
                                  item.alert ? 'text-rose-500' : ''
                                }`}
                                aria-hidden="true"
                              />
                            </span>
                            <span className="truncate">{item.label}</span>
                          </span>

                          <span className="relative flex shrink-0 items-center">
                            {badgeText && (
                              <span
                                className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                                  isActive
                                    ? 'bg-sky-400/20 text-sky-300'
                                    : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400'
                                }`}
                              >
                                {badgeText}
                              </span>
                            )}
                            {item.alert && (
                              <span
                                className="ml-2 h-2 w-2 animate-ping rounded-full bg-rose-500"
                                aria-label="Active emergency"
                              />
                            )}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer controls — slim, profile intentionally removed ── */}
      <div className="relative border-t border-slate-200 p-3 transition-colors dark:border-white/[0.07]">
        <div className="grid grid-cols-2 gap-1.5">
          <NavLink
            to="/settings"
            onClick={onCloseMobile}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-white/[0.07] dark:bg-white/[0.02] dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:text-white"
          >
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Settings</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/5 px-2 py-2 text-[10px] font-bold text-rose-500 transition-colors hover:border-rose-400/40 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 dark:text-rose-400"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
    </aside>
  );
};

export default Sidebar;

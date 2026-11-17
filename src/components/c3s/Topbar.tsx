/**
 * src/components/c3s/Topbar.tsx
 *
 * Slim "command bar" header.
 *
 * Redesigned from the previous 64 px chrome bar. Desktop now shows only a
 * subtle route breadcrumb on the left and a compact action cluster on the
 * right — the brand identity lives in the sidebar, ⌘K lives in the palette,
 * and the emergency SOS lives in the bottom nav / sidebar / quick action.
 * Mobile keeps a compact header with hamburger, logo, SOS, notifications and
 * account menu.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bell,
  Search,
  ShieldAlert,
  LogOut,
  Settings,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Command,
  Menu,
  CheckCheck,
  Shield,
} from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';
import { ROLE_LABELS } from '@/lib/mock-data/users';
import { getRoleDefaultPath, normalizeRole } from '@/lib/rbac';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { CommandPalette } from './CommandPalette';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  '/student/sos': 'Student · SOS',
  '/student/dashboard': 'Student · Hub',
  '/student/scan': 'Student · Scan',
  '/student/check-in': 'Student · Check-in',
  '/student/check-out': 'Student · Check-out',
  '/student/location': 'Student · Location',
  '/student/movement': 'Student · Movement',
  '/student/incidents': 'Student · Incidents',
  '/student/notifications': 'Student · Alerts',
  '/security': 'Dispatch · Patrol',
  '/security/incidents': 'Dispatch · Incidents',
  '/security/map': 'Dispatch · Map',
  '/control-room': 'Command Center',
  '/control-room/incidents': 'Command Center · Incidents',
  '/control-room/map': 'Command Center · Map',
  '/control-room/cameras': 'Command Center · CCTV',
  '/control-room/occupancy': 'Command Center · Occupancy',
  '/gate-keeper': 'Gate · Terminal',
  '/gate-keeper/qr': 'Gate · Daily QR',
  '/gate-keeper/activity': 'Gate · Activity',
  '/gate-keeper/occupancy': 'Gate · Occupancy',
  '/admin': 'Administration',
  '/admin/users': 'Administration · Users',
  '/admin/gates': 'Administration · Gates',
  '/admin/cameras': 'Administration · CCTV',
  '/admin/incidents': 'Administration · Incidents',
  '/admin/analytics': 'Administration · Analytics',
  '/admin/audit': 'Administration · Audit',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/notifications': 'Notifications',
  '/map': 'Campus Grid · SOS',
};

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const currentRole = useC3SStore((state) => state.currentRole);
  const currentUser = useC3SStore((state) => state.currentUser);
  const notifications = useC3SStore((state) => state.notifications);
  const markNotificationRead = useC3SStore((state) => state.markNotificationRead);
  const clearAllNotifications = useC3SStore((state) => state.clearAllNotifications);
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const roleMeta = ROLE_LABELS[currentRole];
  const routeLabel = ROUTE_LABELS[location.pathname] ?? location.pathname.replace(/\//g, ' / ').trim();

  const notificationsPath =
    normalizeRole(currentRole) === 'STUDENT' ? '/student/notifications' : '/notifications';

  const closeDropdowns = useCallback(() => {
    setShowNotifDropdown(false);
    setShowUserDropdown(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserDropdown(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (paletteOpen) return;
      closeDropdowns();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeDropdowns, paletteOpen]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-11 w-full items-center justify-between gap-2 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-xl transition-colors dark:border-white/[0.06] dark:bg-[#05070d]/80 sm:h-12 sm:gap-3 sm:px-4 md:h-14 md:px-6">
        {/* ─── Left: mobile hamburger / desktop breadcrumb ─────────── */}
        <div className="flex min-w-0 items-center gap-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 lg:hidden dark:border-white/[0.08] dark:text-slate-400 dark:hover:bg-white/[0.05]"
              aria-label="Toggle Navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          )}

          {/* Mobile: compact brand mark */}
          <button
            type="button"
            onClick={() =>
              navigate(
                currentRole === 'STUDENT' ? '/student/sos' : getRoleDefaultPath(currentRole),
              )
            }
            className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 md:hidden"
            aria-label="C3S Home"
          >
            <img
              src="/c3s_logo.png"
              alt="C3S Logo"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              C3S
            </span>
          </button>

          {/* Desktop: quiet route breadcrumb */}
          <p className="hidden min-w-0 flex-1 select-none items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:flex dark:text-slate-500">
            <Shield className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
            <span className="truncate">{routeLabel}</span>
          </p>
        </div>

        {/* ─── Right: compact action cluster ──────────────────────── */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* ⌘K command palette trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-9 w-48 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 text-left transition-all hover:border-sky-500/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 md:flex md:w-48 lg:w-52 xl:w-72 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-sky-500/30"
            aria-label="Open command palette"
          >
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
              Search…
            </span>
            <kbd className="flex shrink-0 items-center gap-0.5 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-white/15">
              <Command className="h-2.5 w-2.5" aria-hidden="true" />K
            </kbd>
          </button>

          {/* Mobile palette trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 md:hidden dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300"
            aria-label="Open command palette"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Compact SOS quick action */}
          <button
            type="button"
            onClick={() => setSosModalOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/15 px-2.5 text-rose-500 transition hover:border-rose-400/60 hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 dark:text-rose-400"
            title="Broadcast Emergency SOS"
            aria-label="Emergency SOS"
          >
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <span className="hidden font-mono text-[10px] font-black uppercase tracking-widest sm:inline">
              SOS
            </span>
          </button>

          <ThemeToggle />

          {/* Notifications */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => {
                setShowNotifDropdown((open) => !open);
                setShowUserDropdown(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07]"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={showNotifDropdown}
              aria-haspopup="true"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:w-96 dark:border-white/[0.1] dark:bg-[#111A2E]">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-white/[0.08]">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 rounded-full bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] text-sky-600 dark:text-sky-400">
                        {unreadCount} new
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => clearAllNotifications()}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
                      >
                        <CheckCheck className="h-3 w-3" aria-hidden="true" />
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifDropdown(false);
                        navigate(notificationsPath);
                      }}
                      className="text-xs font-bold text-sky-600 transition-colors hover:underline dark:text-sky-400"
                    >
                      View all
                    </button>
                  </div>
                </div>

                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      All clear — no new notifications.
                    </p>
                  ) : (
                    notifications.slice(0, 6).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markNotificationRead(notification.id)}
                        className={`block w-full rounded-xl p-2.5 text-left transition-colors ${
                          notification.read
                            ? 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-white/[0.02] dark:text-slate-400'
                            : 'border border-sky-500/20 bg-sky-500/10 text-slate-700 hover:bg-sky-500/15 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`truncate text-xs font-semibold ${
                              notification.read
                                ? 'text-slate-600 dark:text-slate-300'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {notification.title}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-slate-400">
                            {notification.time}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-snug text-slate-500 dark:text-slate-400">
                          {notification.message}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserDropdown((open) => !open);
                setShowNotifDropdown(false);
              }}
              className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-1 pl-1 pr-2 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
              aria-label="User Account Menu"
              aria-expanded={showUserDropdown}
              aria-haspopup="true"
            >
              <img
                src={
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
                }
                alt={currentUser?.name || 'User'}
                className="h-7 w-7 rounded-lg object-cover"
              />
              <ChevronDown
                className="h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:w-80 dark:border-white/[0.1] dark:bg-[#111A2E]">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser?.avatar}
                      alt={currentUser?.name}
                      className="h-11 w-11 rounded-xl object-cover ring-2 ring-sky-500/40"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {currentUser?.name}
                        </p>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                      </div>
                      <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {currentUser?.universityId}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">{currentUser?.email}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[10px] dark:border-white/[0.06]">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Clearance:
                    </span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {roleMeta?.title || currentRole}
                    </span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/profile');
                    }}
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-sky-500" aria-hidden="true" />
                      <span>Digital Campus ID</span>
                    </span>
                    <ExternalLink className="h-3 w-3 text-slate-400" aria-hidden="true" />
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/settings');
                    }}
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span>System Settings</span>
                    </span>
                  </button>
                </div>

                <div className="mt-2 border-t border-slate-200 pt-2 dark:border-white/[0.08]">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowLogoutModal(true);
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <LogoutConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
    </>
  );
};

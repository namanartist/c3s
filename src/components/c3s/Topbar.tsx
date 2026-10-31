import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  Shield,
  RefreshCw,
  ShieldAlert,
  LogOut,
  Settings,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';
import { useCrowdMonitoring } from '@/lib/crowdMonitoringApi';
import { ROLE_LABELS } from '@/lib/mock-data/users';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { currentRole, currentUser, notifications, markNotificationRead, isInsideCampus } = useC3SStore();
  const realCrowdCount = useSafetyStore((s) => s.realCrowdCount);
  const { syncCrowdData, isRefreshing } = useCrowdMonitoring();
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const roleMeta = ROLE_LABELS[currentRole];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#090D16]/90 px-4 sm:px-6 backdrop-blur-2xl transition-colors">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden rounded-xl border border-slate-200 dark:border-white/[0.08] p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
              aria-label="Toggle Navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div
            onClick={() => navigate('/student')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            title="C3S Campus Command"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white overflow-hidden shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform p-0.5">
              <img src="/c3s_logo.png" alt="C3S Logo" className="h-full w-full object-contain" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">C3S</span>
                <span className="hidden sm:inline-block rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  DEFENSE
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400 leading-none mt-0.5">Campus Safety &amp; Navigation</p>
            </div>
          </div>

          {/* Real Crowd Count Minimal Pill */}
          <button
            onClick={() => syncCrowdData()}
            title="Real-time campus density. Click to sync."
            className="hidden sm:flex items-center gap-2 ml-3 rounded-full border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.06] px-3 py-1 text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-400">Campus:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{realCrowdCount || 192} active</span>
            <RefreshCw className={`h-3 w-3 text-slate-400 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>

        {/* Global Search Input */}
        <div className="hidden md:flex relative w-64 lg:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search campus gates, buildings, nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.03] py-2 pl-9 pr-4 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-white/[0.05] focus:outline-none transition-all"
          />
        </div>

        {/* Right Actions: Clearance Badge, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick SOS Trigger Button */}
          <button
            type="button"
            onClick={() => setSosModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 hover:text-red-300 px-2.5 py-1.5 text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
            title="Broadcast Emergency SOS"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            <span className="hidden sm:inline">SOS</span>
          </button>

          {/* Institutional Clearance Badge (Static Production Badge) */}
          <div
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 select-none"
            title={`Active Clearance: ${roleMeta?.title || currentRole}`}
          >
            <Shield className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline text-slate-400">Clearance:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{roleMeta?.title || currentRole}</span>
          </div>

          {/* Global Light / Dark Theme Switcher */}
          <ThemeToggle />

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-white/[0.07] hover:text-slate-900 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0E1424] p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">Notifications</span>
                  <span
                    className="text-xs text-blue-400 cursor-pointer hover:underline"
                    onClick={() => {
                      setShowNotifDropdown(false);
                      navigate('/student/notifications');
                    }}
                  >
                    View All
                  </span>
                </div>
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`cursor-pointer rounded-xl p-2.5 transition-colors ${
                        n.read ? 'bg-white/[0.02] text-slate-400' : 'bg-blue-500/10 border border-blue-500/20 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{n.title}</span>
                        <span className="font-mono text-[10px] text-slate-500">{n.time}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 leading-snug">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.03] p-1.5 pr-2.5 hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="User Account Menu"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'User'}
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-blue-500/30"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[100px]">
                  {currentUser?.name?.split(' ')[0]}
                </p>
                <p className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold leading-tight mt-0.5">
                  {isInsideCampus ? '• Inside' : '• Outside'}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
            </button>

            {/* Comprehensive User Profile Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0E1424] p-3 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95">
                {/* Header Summary */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser?.avatar}
                      alt={currentUser?.name}
                      className="h-11 w-11 rounded-xl object-cover ring-2 ring-blue-500/40"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser?.name}</p>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{currentUser?.universityId}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser?.email}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 dark:border-white/[0.06] pt-2 text-[10px]">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Security Clearance:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{roleMeta?.title || currentRole}</span>
                  </div>
                </div>

                {/* Navigation Options */}
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-blue-500" />
                      <span>Digital Campus ID &amp; Profile</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="h-4 w-4 text-slate-400" />
                      <span>System Settings &amp; Preferences</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/login');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="h-4 w-4 text-emerald-400" />
                      <span>Switch Account (Login Portal)</span>
                    </div>
                  </button>
                </div>

                {/* Divider & Sign Out */}
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out of Terminal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
    </>
  );
};

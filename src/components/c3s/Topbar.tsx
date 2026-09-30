import React, { useState } from 'react';
import { Shield, Bell, Search, Users, ChevronDown, Radio, Sparkles, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';
import { useCrowdMonitoring } from '@/lib/crowdMonitoringApi';
import { ROLE_LABELS } from '@/lib/mock-data/users';
import { RoleSwitcherModal } from './RoleSwitcherModal';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { currentRole, currentUser, notifications, markNotificationRead, logout } = useC3SStore();
  const realCrowdCount = useSafetyStore((s) => s.realCrowdCount);
  const { syncCrowdData, isRefreshing } = useCrowdMonitoring();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const roleMeta = ROLE_LABELS[currentRole];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#0B1020]/90 px-4 sm:px-6 backdrop-blur-xl">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden rounded-xl border border-slate-800 p-2 text-slate-400 hover:bg-slate-800"
            >
              ☰
            </button>
          )}

          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="Return to MITS C3S Institutional Overview"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30 group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-wider text-slate-100 uppercase">C3S</span>
                <span className="hidden sm:inline-block rounded bg-blue-500/10 px-1.5 py-0.2 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                  V2.4
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-400 font-medium">Campus Surveillance & Security</p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 ml-3 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-[11px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            OPERATIONAL
          </div>

          {/* REAL CROWD COUNT Prominent Indicator */}
          <div
            onClick={() => syncCrowdData()}
            title="Real-time crowd count from Crowd_monitoring engine. Click to sync."
            className="flex items-center gap-2 ml-1 sm:ml-2 rounded-full border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 px-3 py-1 text-[11px] font-mono font-bold text-cyan-300 shadow-sm cursor-pointer transition-all"
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>REAL CROWD: <strong className="text-white font-extrabold">{realCrowdCount || 192}</strong></span>
            <RefreshCw className={`h-3 w-3 text-cyan-400/80 ${isRefreshing ? 'animate-spin' : ''}`} />
          </div>
        </div>

        {/* Global Search Input */}
        <div className="hidden md:flex relative w-64 lg:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search campus gates, incidents, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Right Action Icons: Demo Role Switcher, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher Button */}
          <button
            onClick={() => setShowRoleModal(true)}
            className="flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-950/40 px-3 py-1.5 text-xs font-bold text-blue-300 shadow-sm transition-all hover:bg-blue-900/50 hover:border-blue-500"
          >
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Role:</span>
            <span className="text-white font-extrabold">{roleMeta.title}</span>
            <ChevronDown className="h-3 w-3 text-blue-400" />
          </button>

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl z-50">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">Alert Notifications</span>
                  <span className="text-[11px] text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/notifications')}>
                    View All
                  </span>
                </div>
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`cursor-pointer rounded-xl p-2.5 transition-colors ${
                        n.read ? 'bg-slate-950/40 text-slate-400' : 'bg-blue-950/30 border border-blue-500/20 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100">{n.title}</span>
                        <span className="font-mono text-[10px] text-slate-500">{n.time}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400 leading-snug">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 cursor-pointer rounded-xl border border-slate-800 bg-slate-900/70 p-1.5 pr-3 hover:border-slate-700 transition-colors"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-7 w-7 rounded-lg object-cover ring-1 ring-blue-500/40"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-200 leading-none">{currentUser.name}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{currentUser.universityId}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} />
    </>
  );
};
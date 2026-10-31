// src/components/c3s/Sidebar.tsx
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
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { LogoutConfirmModal } from './LogoutConfirmModal';

interface SidebarProps {
  onCloseMobile?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  alert?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { currentRole, currentUser, sosActive, isInsideCampus } = useC3SStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  // Role-tailored dynamic menu configuration
  const getNavLinks = (): NavItem[] => {
    switch (currentRole) {
      case 'GATE_KEEPER':
        return [
          { to: '/gate-keeper', label: 'Gate Terminal', icon: DoorOpen },
          { to: '/gate-keeper/qr', label: 'Daily Gate QR', icon: Scan },
          { to: '/gate-keeper/activity', label: 'Live Gate Activity', icon: Activity },
          { to: '/gate-keeper/occupancy', label: 'Gate Occupancy', icon: BarChart3 }
        ];

      case 'SECURITY_GUARD':
        return [
          { to: '/security', label: 'Guard Patrol', icon: LayoutDashboard },
          { to: '/security/incidents', label: 'Active Incidents', icon: ShieldAlert, badge: '1 Alert' },
          { to: '/security/map', label: 'Dispatch Map', icon: MapPin }
        ];

      case 'CONTROL_ROOM_OPERATOR':
        return [
          { to: '/control-room', label: 'Control Center (SOC)', icon: LayoutDashboard },
          { to: '/control-room/incidents', label: 'Incident Hub', icon: ShieldAlert },
          { to: '/control-room/cameras', label: 'CCTV Matrix', icon: Camera, badge: '12 Live' },
          { to: '/control-room/map', label: 'Tactical Campus Map', icon: MapPin },
          { to: '/control-room/occupancy', label: 'Campus Occupancy', icon: BarChart3 }
        ];

      case 'SUPER_ADMIN':
        return [
          { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard },
          { to: '/admin/users', label: 'User Directory', icon: Users },
          { to: '/admin/gates', label: 'Three-Gate Hub', icon: DoorOpen },
          { to: '/admin/cameras', label: 'CCTV Fleet', icon: Camera },
          { to: '/admin/incidents', label: 'Incident Logs', icon: ShieldAlert },
          { to: '/admin/analytics', label: 'Safety Analytics', icon: BarChart3 },
          { to: '/admin/audit', label: 'Audit Trail', icon: FileText }
        ];

      case 'PROCTOR':
      case 'HOD':
      case 'DEAN':
      case 'CLASS_COORDINATOR':
      case 'FACULTY':
        return [
          { to: '/control-room', label: 'Campus Overview', icon: LayoutDashboard },
          { to: '/control-room/incidents', label: 'Incident Reports', icon: ShieldAlert },
          { to: '/control-room/occupancy', label: 'Headcount & Flow', icon: BarChart3 },
          { to: '/control-room/cameras', label: 'CCTV Feeds', icon: Camera },
          { to: '/student/location', label: 'Campus Map', icon: MapPin }
        ];

      case 'STUDENT':
      default:
        return [
          { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/student/scan', label: 'Scan Gate QR', icon: Scan },
          { to: '/map', label: 'Campus Map', icon: Navigation },
          { to: '/student/sos', label: 'Emergency SOS', icon: ShieldAlert, alert: sosActive },
          { to: '/student/movement', label: 'Movement Logs', icon: Activity },
          { to: '/student/incidents', label: 'Incident Reports', icon: ShieldAlert },
          { to: '/student/notifications', label: 'Alerts', icon: Bell }
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="flex h-full w-64 flex-col justify-between border-r border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#070B14] p-4 select-none transition-colors">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="px-3 pb-2 flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              NAVIGATION
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase">
              {currentRole.replace(/_/g, ' ')}
            </span>
          </div>

          <nav className="mt-1 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      } ${item.alert ? 'text-rose-500 animate-pulse' : ''}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Global Links & User Status Capsule */}
      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
        {/* User Presence Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-900/60 p-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'User'}
                className="h-8 w-8 rounded-xl object-cover border border-slate-200 dark:border-white/10"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${isInsideCampus ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentUser?.name || 'Campus User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isInsideCampus ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                  {isInsideCampus ? 'Inside Campus' : 'Outside Campus'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings, ID & Sign Out Links */}
        <div className="flex items-center gap-1">
          <NavLink
            to="/settings"
            onClick={onCloseMobile}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white transition-colors"
            title="System Settings"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </NavLink>
          <NavLink
            to="/profile"
            onClick={onCloseMobile}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Digital ID Pass"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline">ID Pass</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center justify-center rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Sign Out of Terminal"
            aria-label="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
    </aside>
  );
};

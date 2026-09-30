import React from 'react';
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
  LogOut,
  ChevronRight
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { currentRole, sosActive } = useC3SStore();
  const location = useLocation();

  // Role-tailored dynamic menu configuration
  const getNavLinks = () => {
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
          { to: '/security/incidents', label: 'Active Incidents', icon: ShieldAlert, badge: '1 Critical' },
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
          { to: '/student/check-in', label: 'Check-In Terminal', icon: DoorOpen },
          { to: '/student/check-out', label: 'Check-Out Terminal', icon: DoorOpen },
          { to: '/student/location', label: 'My Location & Map', icon: MapPin },
          { to: '/student/sos', label: 'Emergency SOS', icon: ShieldAlert, alert: sosActive },
          { to: '/student/incidents', label: 'Reported Incidents', icon: ShieldAlert },
          { to: '/student/movement', label: 'Movement History', icon: Activity },
          { to: '/student/notifications', label: 'Alerts', icon: Bell }
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="flex h-full w-64 flex-col justify-between border-r border-slate-800/80 bg-[#0B1020] p-4 select-none">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            NAVIGATION ({currentRole.replace(/_/g, ' ')})
          </p>

          <nav className="mt-2 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'border border-blue-500/40 bg-blue-600/15 text-blue-400 shadow-md shadow-blue-950/40'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'} ${(item as any).alert ? 'text-rose-500 animate-pulse' : ''}`} />
                    <span>{item.label}</span>
                  </div>

                  {(item as any).badge && (
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                      {(item as any).badge}
                    </span>
                  )}
                  {(item as any).alert && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Global Links: Settings, Profile */}
      <div className="border-t border-slate-800/80 pt-4 space-y-1">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </NavLink>
        <NavLink
          to="/profile"
          onClick={onCloseMobile}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        >
          <Users className="h-4 w-4" />
          <span>Profile & ID</span>
        </NavLink>
      </div>
    </aside>
  );
};
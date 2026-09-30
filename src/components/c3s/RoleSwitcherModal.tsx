// src/components/c3s/RoleSwitcherModal.tsx
import React from 'react';
import { Users, Check, X, ArrowRight, Shield, ShieldCheck, QrCode, Radio, Sliders, GraduationCap, Building2, BookOpen } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { ROLE_DEFINITIONS, getMockUserForRole, getRoleDefaultPath } from '@/lib/rbac';
import { type C3SRole } from '@/lib/mock-data/users';
import { useNavigate } from 'react-router-dom';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  GraduationCap,
  Users,
  BookOpen,
  ShieldAlert: Shield,
  QrCode,
  ShieldCheck,
  Radio,
  Building2,
  Landmark: Building2,
  Sliders
};

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { currentRole, setRole } = useC3SStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const roles: C3SRole[] = [
    'STUDENT',
    'GATE_KEEPER',
    'SECURITY_GUARD',
    'CONTROL_ROOM_OPERATOR',
    'SUPER_ADMIN',
    'FACULTY',
    'CLASS_COORDINATOR',
    'PROCTOR',
    'HOD',
    'DEAN'
  ];

  const handleSelectRole = (role: C3SRole, redirect: boolean) => {
    setRole(role);
    onClose();
    if (redirect) {
      const target = getRoleDefaultPath(role);
      navigate(target);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Switch Operational Role</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 font-mono">
                  RBAC V2
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch active account tier with instant permissions and dashboard routing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Roles Grid */}
        <div className="mt-4 grid max-h-[60vh] grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
          {roles.map((role) => {
            const def = ROLE_DEFINITIONS[role];
            const isCurrent = currentRole === role;
            const mockUser = getMockUserForRole(role);
            const IconComponent = ROLE_ICONS[def.iconName] || Shield;

            return (
              <div
                key={role}
                onClick={() => handleSelectRole(role, true)}
                className={`group flex cursor-pointer flex-col justify-between rounded-2xl border p-3.5 transition-all ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${def.badgeBg} ${def.badgeText}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black text-slate-900 group-hover:text-blue-600">
                        {def.shortLabel}
                      </span>
                    </div>

                    {isCurrent ? (
                      <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white shadow-xs">
                        <Check className="h-2.5 w-2.5" /> ACTIVE
                      </span>
                    ) : (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-[10px] font-bold text-blue-600 gap-0.5">
                        Launch <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {def.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="truncate max-w-[140px] font-medium text-slate-700">{mockUser.name}</span>
                  <span className="text-slate-400">{mockUser.universityId}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Click any role to activate account and navigate to its dedicated dashboard.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-700 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
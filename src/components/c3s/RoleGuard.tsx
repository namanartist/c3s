// src/components/c3s/RoleGuard.tsx
import React from 'react';
import { ShieldAlert, ArrowRight, Lock, Users } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import type { C3SRole } from '@/lib/mock-data/users';
import { ROLE_DEFINITIONS, getRoleDefaultPath, hasPermission, type Permission } from '@/lib/rbac';
import { useNavigate } from 'react-router-dom';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: C3SRole[];
  requiredPermission?: Permission;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredPermission
}) => {
  const { currentRole, setRole } = useC3SStore();
  const navigate = useNavigate();

  // Role validation
  const isAllowed = allowedRoles ? allowedRoles.includes(currentRole) : true;
  const hasPerm = requiredPermission ? hasPermission(currentRole, requiredPermission) : true;

  if (isAllowed && hasPerm) {
    return <>{children}</>;
  }

  const currentDef = ROLE_DEFINITIONS[currentRole];
  const targetRole = allowedRoles && allowedRoles.length > 0 ? allowedRoles[0] : 'SUPER_ADMIN';
  const targetDef = ROLE_DEFINITIONS[targetRole];

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        <span className="mt-4 inline-block px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
          RBAC ACCESS RESTRICTED
        </span>

        <h2 className="mt-3 text-xl font-black text-slate-900 tracking-tight">
          Role Elevation Required
        </h2>

        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          This operational console requires elevated clearance ({allowedRoles?.join(', ') || requiredPermission}). 
          Your active session tier is currently <strong className="text-slate-800">{currentDef.title}</strong>.
        </p>

        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Current Role:</span>
            <span className="font-bold text-slate-700">{currentRole}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Required Role:</span>
            <span className="font-bold text-blue-600">{targetRole}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              setRole(targetRole);
              navigate(getRoleDefaultPath(targetRole));
            }}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <span>Switch to {targetDef.shortLabel} &amp; Proceed</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/student')}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer"
          >
            Return to Student Portal
          </button>
        </div>
      </div>
    </div>
  );
};

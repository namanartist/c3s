// src/pages/c3s/C3SLoginPage.tsx
import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  GraduationCap,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { type C3SRole } from '@/lib/mock-data/users';
import { ROLE_DEFINITIONS, getRoleDefaultPath, getMockUserForRole } from '@/lib/rbac';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function C3SLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as any)?.from;
  const { loginAs } = useC3SStore();
  const [universityId, setUniversityId] = useState('BTCS2026-0842');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<C3SRole>('STUDENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const primaryRoles: { role: C3SRole; icon: React.ElementType }[] = [
    { role: 'STUDENT', icon: GraduationCap },
    { role: 'GUARD', icon: ShieldCheck },
    { role: 'PROCTOR', icon: ShieldAlert },
    { role: 'GATEKEEPER', icon: QrCode },
    { role: 'ADMIN', icon: Sliders }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    loginAs(selectedRole);

    setTimeout(() => {
      const target = fromPath || getRoleDefaultPath(selectedRole);
      navigate(target, { replace: true });
    }, 400);
  };

  const handleQuickRoleSelect = (role: C3SRole) => {
    setSelectedRole(role);
    const mockUser = getMockUserForRole(role);
    setUniversityId(mockUser.universityId);
  };

  const handleDirectLaunch = (role: C3SRole) => {
    loginAs(role);
    const target = fromPath || getRoleDefaultPath(role);
    navigate(target, { replace: true });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-[#070B14] text-slate-800 dark:text-slate-100 flex flex-col justify-between select-none transition-colors duration-200">
      {/* Subtle Architectural Grid Lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 dark:opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(#2563eb 1px, transparent 1px), radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px'
        }}
      />

      {/* Header Bar */}
      <header className="relative z-10 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/90 px-6 py-4 backdrop-blur-md transition-colors">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm p-1">
              <img src="/c3s_logo.png" alt="C3S Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">
                  C3S Campus Defense Portal
                </span>
                <span className="rounded bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold border border-blue-200 dark:border-blue-500/30">
                  INSTITUTIONAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Madhav Institute of Technology &amp; Science • Gwalior</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/"
              className="text-xs font-bold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition"
            >
              ← Back to Overview
            </Link>
          </div>
        </div>
      </header>

      {/* Main Authentication Card & RBAC Quick Switcher */}
      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Column */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-xl transition-colors">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                CAMPUS SSO AUTHENTICATION
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Sign In to C3S
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Access turn-by-turn indoor routing, surveillance feeds, gate logs, or incident dispatch.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">University ID / Roll Number</label>
                <div className="relative mt-1">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    placeholder="e.g. BTCS2026-0842"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 py-2.5 pl-10 pr-4 text-xs font-mono font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Security Password / PIN</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 py-2.5 pl-10 pr-4 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Active Role Selector Pills */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Active Authorization Tier</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {primaryRoles.map(({ role, icon: IconComponent }) => {
                    const def = ROLE_DEFINITIONS[role];
                    const isSelected = selectedRole === role;
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => handleQuickRoleSelect(role)}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white shadow-xs'
                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <IconComponent className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{def.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'Verifying Session...' : `Sign In as ${ROLE_DEFINITIONS[selectedRole].shortLabel}`}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Direct RBAC Launchpad Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 shadow-xl transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Instant Operational RBAC Launchpad
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    1-Click direct role activation for examiners, operators, and staff
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  LIVE PASS
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {primaryRoles.map(({ role, icon: IconComponent }) => {
                  const def = ROLE_DEFINITIONS[role];
                  const user = getMockUserForRole(role);
                  return (
                    <div
                      key={role}
                      onClick={() => handleDirectLaunch(role)}
                      className="group flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500/40 transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${def.badgeBg} ${def.badgeText} border ${def.badgeBorder}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {def.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              {user.universityId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {def.desc}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                        <span>Launch</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compliance Note */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400 font-mono space-y-1 shadow-xs transition-colors">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Security Notice</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                All campus entries, SOS triggers, and surveillance telemetry are logged with cryptographic verification and stored locally offline.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 MITS Gwalior • Campus Safety &amp; Surveillance Network (C3S)</span>
          <span className="font-mono text-[11px] text-slate-400">Version 2.4.0 • Autonomous &amp; NAAC A++</span>
        </div>
      </footer>
    </div>
  );
}

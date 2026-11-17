// src/pages/c3s/C3SLoginPage.tsx
/**
 * C3S Premium Sign-In
 * Cinematic command-center aesthetic: an immersive brand/hero panel on the
 * left, an institutional glassmorphism authentication card on the right.
 * All existing behaviour (RBAC quick-launch, role tier selection, demo
 * passthrough) is preserved.
 */
import React, { useState } from 'react';
import {
  Compass,
  Radio,
  Shield,
  Zap,
  Lock,
  User,
  ArrowRight,
  GraduationCap,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Eye,
  EyeOff,
  ScanLine,
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { type C3SRole } from '@/lib/mock-data/users';
import { ROLE_DEFINITIONS, getRoleDefaultPath, getMockUserForRole } from '@/lib/rbac';
import ThemeToggle from '@/components/ui/ThemeToggle';

const PRIMARY_ROLES: { role: C3SRole; icon: React.ElementType; accent: string }[] = [
  { role: 'STUDENT', icon: GraduationCap, accent: 'from-blue-500 to-cyan-400' },
  { role: 'GUARD', icon: ShieldCheck, accent: 'from-amber-500 to-orange-500' },
  { role: 'PROCTOR', icon: ShieldAlert, accent: 'from-rose-500 to-red-500' },
  { role: 'GATEKEEPER', icon: QrCode, accent: 'from-emerald-500 to-teal-400' },
  { role: 'ADMIN', icon: Sliders, accent: 'from-purple-500 to-indigo-500' },
];

export default function C3SLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;
  const { loginAs } = useC3SStore();
  const [universityId, setUniversityId] = useState('BTCS2026-0842');
  const [password, setPassword] = useState('demo-access');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<C3SRole>('STUDENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    loginAs(selectedRole);

    setTimeout(() => {
      const target = fromPath || getRoleDefaultPath(selectedRole);
      navigate(target, { replace: true });
    }, 450);
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05070d] text-slate-100 select-none">
      {/* ── Atmosphere: gradient mesh + blueprint grid + scanline ───────── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.28)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-48 -right-48 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(255,96,46,0.22)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.14)_0%,transparent_70%)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
        {/* Corner brackets — terminal aesthetic */}
        <div className="absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-white/15" />
        <div className="absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-white/15" />
        <div className="absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-white/15" />
        <div className="absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-white/15" />
      </div>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500/60"
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 p-1 shadow-[0_0_24px_rgba(59,130,246,0.35)]">
            <img src="/c3s_logo.png" alt="C3S Logo" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white">
              C3S · Campus Defense
            </p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
              MITS Gwalior · Secure Portal
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-61px)] w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* ══ LEFT — Brand / command-center panel ═════════════════════ */}
          <section className="lg:col-span-6 xl:col-span-7">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Grid Operational
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-widest text-slate-500 sm:inline">
                SOC · MITS-GWL-04
              </span>
            </div>

            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl xl:text-7xl">
              Run the campus
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-orange-400 bg-clip-text text-transparent">
                like a fortress.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
              One secure identity unlocks indoor navigation, the CCTV aggression-detection
              grid, instant QR gate passes and a 1-tap SOS — all under one chain of custody.
            </p>

            {/* Feature ticker */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              {[
                { icon: Compass, label: 'Multi-floor routing' },
                { icon: Radio, label: 'Live SOS dispatch' },
                { icon: ScanLine, label: 'AI aggression validated' },
                { icon: Shield, label: 'SHA-256 evidence seal' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-semibold text-slate-300"
                >
                  <Icon className="h-3 w-3 text-sky-400" />
                  {label}
                </span>
              ))}
            </div>

            {/* Live telemetry strip */}
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-2.5">
              {[
                { value: '37', label: 'Blocks mapped', accent: 'text-sky-400' },
                { value: '14', label: 'AI CCTV sentinels', accent: 'text-orange-400' },
                { value: '<3s', label: 'Alert to dispatch', accent: 'text-emerald-400' },
              ].map(({ value, label, accent }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-3 backdrop-blur-sm"
                >
                  <p className={`font-mono text-2xl font-black leading-none ${accent}`}>{value}</p>
                  <p className="mt-1.5 text-[9px] font-bold uppercase leading-tight tracking-wider text-slate-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ══ RIGHT — Authentication card ═════════════════════════════ */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="relative rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
              {/* Gradient edge */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-3xl p-px [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude]"
              >
                <div className="h-full w-full rounded-3xl bg-gradient-to-br from-sky-500/40 via-transparent to-orange-500/30" />
              </div>

              {/* Card header */}
              <div className="relative flex items-center justify-between border-b border-white/[0.07] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-sky-400" />
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
                      SSO · Campus Shield
                    </p>
                  </div>
                  <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">
                    Authenticate
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  <Zap className="h-3 w-3 text-amber-400" />
                  v2.4
                </span>
              </div>

              <form onSubmit={handleLogin} className="relative mt-6 space-y-5">
                {/* University ID */}
                <div>
                  <label
                    htmlFor="university-id"
                    className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500"
                  >
                    University ID / Roll Number
                  </label>
                  <div className="group relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" />
                    <input
                      id="university-id"
                      type="text"
                      required
                      autoComplete="username"
                      value={universityId}
                      onChange={(e) => setUniversityId(e.target.value)}
                      placeholder="BTCS2026-0842"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 font-mono text-sm font-semibold text-white placeholder:text-slate-600 outline-none transition focus:border-sky-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="security-pin"
                    className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500"
                  >
                    Security PIN
                  </label>
                  <div className="group relative">
                    <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" />
                    <input
                      id="security-pin"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-12 font-mono text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-sky-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-sky-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide PIN' : 'Show PIN'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Authorization tier */}
                <div>
                  <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Authorization Tier
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRIMARY_ROLES.map(({ role, icon: Icon, accent }) => {
                      const def = ROLE_DEFINITIONS[role];
                      const isSelected = selectedRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleQuickRoleSelect(role)}
                          aria-pressed={isSelected}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-200 ${
                            isSelected
                              ? 'border-sky-400/40 bg-sky-500/15 text-sky-200 shadow-[0_0_24px_rgba(56,189,248,0.25)]'
                              : 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {isSelected ? (
                            <span
                              className={`-mx-1 rounded-lg bg-gradient-to-br p-[3px] ${accent}`}
                              style={{ boxShadow: '0 0 16px rgba(56,189,248,0.35)' }}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <Icon className="h-3.5 w-3.5" />
                          )}
                          <span>{def.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600 py-4 font-black uppercase tracking-[0.18em] text-white shadow-[0_16px_40px_-12px_rgba(99,102,241,0.55)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-[0.99] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Verifying Session…</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 transition-transform group-hover:scale-110" />
                      <span>Enter as {ROLE_DEFINITIONS[selectedRole].shortLabel}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <p className="text-center font-mono text-[9px] uppercase leading-relaxed tracking-widest text-slate-600">
                  256-bit AES handshake · MITS Gwalior controlled
                  <br />
                  Unauthorized access is a punishable offence
                </p>
              </form>
            </div>

            {/* RBAC quick-launch — secondary */}
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl">
              <p className="mb-2 flex items-center justify-between px-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Quick-switch operator
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[8px] text-emerald-300">
                  Live pass
                </span>
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {PRIMARY_ROLES.map(({ role, icon: Icon }) => {
                  const def = ROLE_DEFINITIONS[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleDirectLaunch(role)}
                      title={`Launch ${def.title}`}
                      className="flex flex-col items-center gap-1 rounded-xl border border-transparent px-1 py-2 text-slate-400 transition hover:border-white/15 hover:bg-white/5 hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[8px] font-bold uppercase tracking-wide">
                        {def.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

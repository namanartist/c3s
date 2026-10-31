// src/pages/error/AccessDeniedPage.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { ROLE_LABELS } from '@/lib/mock-data/users';
import { usePageMeta } from '@/hooks/usePageMeta';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function AccessDeniedPage() {
  usePageMeta('403 — Clearance Denied', 'Restricted institutional sector.');
  const navigate = useNavigate();
  const { currentRole, currentUser } = useC3SStore();
  const roleMeta = ROLE_LABELS[currentRole];

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans select-none overflow-x-hidden transition-colors">
      {/* Background Architectural Radar Grids */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15 dark:opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(#2563eb 1.5px, transparent 1.5px), radial-gradient(#1e293b 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px'
        }}
      />

      {/* Top Ambient Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-rose-600/10 dark:bg-rose-600/15 blur-[120px]" />

      {/* Header Bar */}
      <header className="relative z-10 border-b border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#090D16]/90 px-6 py-4 backdrop-blur-md flex items-center justify-between transition-colors">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-blue-500/20 border border-slate-200 dark:border-transparent">
            <img src="/c3s_logo.png" alt="C3S" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">C3S DEFENSE</span>
              <span className="rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                RESTRICTED SECTOR
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">CLEARANCE_CODE_403</p>
          </div>
        </Link>

        <ThemeToggle />
      </header>

      {/* Main 403 Body */}
      <main className="relative z-10 mx-auto max-w-xl px-4 py-12 w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-500 shadow-xl dark:shadow-2xl shadow-red-950/20 dark:shadow-red-950/60">
            <Lock className="h-10 w-10 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="font-mono uppercase tracking-wider">CLEARANCE INSUFFICIENT</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            RESTRICTED SECURITY ZONE
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            Your current digital credential <span className="font-bold text-slate-900 dark:text-white">({roleMeta?.title || currentRole})</span> does not possess the requisite clearance keys for this tactical module.
          </p>
        </div>

        {/* Current Credential Capsule */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 text-left flex items-center gap-3 shadow-xs">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
            alt={currentUser?.name || 'User'}
            className="h-12 w-12 rounded-xl object-cover ring-2 ring-blue-500/30"
          />
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-bold text-slate-900 dark:text-white">{currentUser?.name}</p>
            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{currentUser?.universityId}</p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">{currentUser?.department}</p>
          </div>
          <span className="rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 px-2 py-1 text-[10px] font-bold dark:text-blue-300">
            {roleMeta?.title}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In with Authorized Account</span>
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.1] px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Previous View</span>
          </button>
        </div>

        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Return to Student Base Dashboard</span>
        </Link>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-white/[0.08] py-4 text-center text-[11px] text-slate-500 font-mono">
        C3S ACCESS CONTROL PROTOCOL • INSTITUTIONAL PERMISSION VERIFICATION
      </footer>
    </div>
  );
}

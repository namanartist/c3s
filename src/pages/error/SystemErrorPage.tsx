// src/pages/error/SystemErrorPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, RefreshCw, Home, Terminal, Trash2 } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface SystemErrorPageProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export default function SystemErrorPage({ error, resetErrorBoundary }: SystemErrorPageProps) {
  usePageMeta('500 — Tactical Subsystem Exception', 'C3S Campus Security Runtime Anomaly.');
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleHardSync = async () => {
    setIsRefreshing(true);
    if ('caches' in window) {
      try {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const handlePurgeAndReset = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('c3s_security_state_v1');
      localStorage.removeItem('c3s-session');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

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
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-red-600/10 dark:bg-red-600/15 blur-[120px]" />

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
                SYSTEM EXCEPTION
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">CORE_SUBSYSTEM_EXCEPTION</p>
          </div>
        </Link>

        <ThemeToggle />
      </header>

      {/* Main 500 Body */}
      <main className="relative z-10 mx-auto max-w-xl px-4 py-12 w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-500 shadow-xl dark:shadow-2xl shadow-red-950/20 dark:shadow-red-950/60">
            <ShieldAlert className="h-10 w-10 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono uppercase tracking-wider">SUBSYSTEM EXCEPTION (HTTP 500)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            TELEMETRY DISRUPTION DETECTED
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            A fatal execution error interrupted client-side rendering. Emergency fallbacks and offline SOS buffers remain secure.
          </p>
        </div>

        {/* Diagnostics Output */}
        <div className="rounded-2xl border border-rose-500/20 dark:border-red-900/50 bg-rose-50/50 dark:bg-red-950/40 p-4 text-left font-mono text-xs text-rose-900 dark:text-red-200 break-words shadow-xs">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-red-400 font-bold mb-1.5 uppercase text-[10px]">
            <Terminal className="h-3.5 w-3.5" />
            <span>Trace Diagnostic:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {error?.message || 'CRITICAL_RENDER_FAILURE: Dynamic module evaluation aborted.'}
          </p>
        </div>

        {/* Tactical Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={resetErrorBoundary || handleHardSync}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Re-Syncing...' : 'Reload Application'}</span>
          </button>

          <button
            onClick={handlePurgeAndReset}
            className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-red-500/30 bg-rose-50 dark:bg-red-500/10 hover:bg-rose-100 dark:hover:bg-red-500/20 px-4 py-3 text-xs font-bold text-rose-700 dark:text-red-300 transition-all cursor-pointer shadow-xs"
          >
            <Trash2 className="h-4 w-4" />
            <span>Purge Cache &amp; Reset</span>
          </button>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Return to Institutional Landing</span>
        </Link>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-white/[0.08] py-4 text-center text-[11px] text-slate-500 font-mono">
        C3S FAULT-TOLERANT ARCHITECTURE • AUTOMATED RECOVERY SUBSYSTEM
      </footer>
    </div>
  );
}

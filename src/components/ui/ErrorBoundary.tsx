// src/components/ui/ErrorBoundary.tsx
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home, Trash2, ChevronDown, ChevronUp, AlertTriangle, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  isAutoRecovering: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    isAutoRecovering: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('C3S System Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });

    // Detect stale Vite deployment chunks (common after pushing new builds)
    const errorMsg = error?.message || '';
    const isChunkMismatch =
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('error loading dynamically imported module') ||
      errorMsg.includes('Importing a module script failed');

    if (isChunkMismatch && typeof window !== 'undefined') {
      const lastAutoReload = Number(sessionStorage.getItem('c3s_auto_chunk_recovery') || 0);
      const now = Date.now();

      // Only auto-reload if not already reloaded in the last 15 seconds
      if (now - lastAutoReload > 15000) {
        sessionStorage.setItem('c3s_auto_chunk_recovery', String(now));
        this.setState({ isAutoRecovering: true });
        console.warn('[C3S Error Boundary]: Auto-recovering from stale deployment chunk...');
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleHardReload = async () => {
    // Clear chunk cache, service worker caches, and reload with fresh cache-buster
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('c3s_auto_chunk_recovery');
      if ('caches' in window) {
        try {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((k) => window.caches.delete(k)));
        } catch {
          // non-fatal
        }
      }
      window.location.reload();
    }
  };

  private handleClearStorageAndReset = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('c3s_security_state_v1');
      localStorage.removeItem('c3s-session');
      localStorage.removeItem('c3s-user-movement-status');
      localStorage.removeItem('c3s-movement-ledger');
      localStorage.removeItem('c3s-consistency-alert');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.isAutoRecovering) {
      return (
        <div className="min-h-screen w-full bg-[#070B14] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent shadow-lg shadow-blue-500/20" />
          <p className="mt-4 font-mono text-xs text-blue-400 font-bold uppercase tracking-wider">
            SYNCHRONIZING LATEST DEPLOYMENT BUNDLE...
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Detected updated campus security assets. Reloading application...
          </p>
        </div>
      );
    }

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage =
        this.state.error?.message || 'An unexpected runtime anomaly occurred in the tactical display subsystem.';
      const isChunkError =
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('error loading dynamically imported module');

      return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 select-none font-sans relative overflow-hidden transition-colors">
          {/* Ambient Cyber Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15 dark:opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(#2563eb 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: '0 0, 20px 20px'
            }}
          />

          <div className="max-w-xl w-full relative z-10 rounded-3xl border border-slate-200 dark:border-red-500/30 bg-white/95 dark:bg-[#0B1020]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-red-950/40">
            {/* Status Radar Beacon */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-200 dark:border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 dark:bg-red-600/20 border border-red-500/30 dark:border-red-500/40 flex items-center justify-center text-red-500 dark:text-red-400 shrink-0 shadow-lg shadow-red-500/20">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-black tracking-widest text-red-600 dark:text-red-400 uppercase">
                    TACTICAL RECOVERY SUBSYSTEM
                  </span>
                </div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {isChunkError ? 'DEPLOYMENT ASSET UPDATED' : 'DISPLAY ANOMALY PREVENTED'}
                </h1>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
              {isChunkError
                ? 'A newer system release was deployed while this terminal session was open. The requested code chunk was replaced. Click below to synchronize with the live deployment:'
                : 'The C3S security engine caught an unhandled display exception. The core navigation and emergency mesh remain protected. Choose an action below to restore interface stability:'}
            </p>

            {/* Error Message Box */}
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-4 mb-6 font-mono text-xs text-red-900 dark:text-red-200 break-words shadow-xs">
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold mb-1 uppercase text-[10px]">
                <Terminal className="w-3.5 h-3.5" />
                <span>Diagnostics Code:</span>
              </div>
              {errorMessage}
            </div>

            {/* Tactical Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleHardReload}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sync Latest Version</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry View</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = '/student';
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <Home className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Return to Student Base</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearStorageAndReset}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-600/20 dark:hover:bg-amber-600/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Reset Local Cache</span>
              </button>
            </div>

            {/* Collapsible Stack Trace */}
            {this.state.errorInfo && (
              <div>
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center justify-between w-full text-slate-400 hover:text-slate-200 text-xs font-semibold py-2 transition cursor-pointer"
                >
                  <span>Technical Trace Log</span>
                  {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {this.state.showDetails && (
                  <pre className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-black/60 p-3 font-mono text-[10px] text-slate-400 leading-tight border border-white/5 whitespace-pre-wrap">
                    {this.state.error?.stack}
                    {'\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('C3S System Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleHardReload = () => {
    window.location.reload();
  };

  private handleClearStorageAndReset = () => {
    try {
      // Clear C3S specific session/state while keeping auth if possible
      sessionStorage.clear();
      localStorage.removeItem('c3s-user-movement-status');
      localStorage.removeItem('c3s-movement-ledger');
      localStorage.removeItem('c3s-consistency-alert');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'An unexpected runtime anomaly occurred in the tactical display subsystem.';

      return (
        <div className="min-h-screen w-full bg-[#070B14] text-slate-100 flex items-center justify-center p-6 select-none font-sans relative overflow-hidden">
          {/* Ambient Cyber Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#2563eb 1px, transparent 1px), radial-gradient(#1e293b 1px, #070B14 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: '0 0, 20px 20px'
            }}
          />

          <div className="max-w-xl w-full relative z-10 rounded-3xl border border-red-500/30 bg-[#0B1020]/95 backdrop-blur-2xl p-8 shadow-2xl shadow-red-950/40">
            {/* Status Radar Beacon */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-lg shadow-red-600/20">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-black tracking-widest text-red-400 uppercase">
                    TACTICAL RECOVERY SUBSYSTEM
                  </span>
                </div>
                <h1 className="text-xl font-black text-white uppercase tracking-tight">
                  DISPLAY ANOMALY PREVENTED
                </h1>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6 font-medium">
              The C3S security engine caught an unhandled display exception. The core navigation and emergency mesh remain protected. Choose an action below to restore interface stability:
            </p>

            {/* Error Message Box */}
            <div className="rounded-xl bg-red-950/40 border border-red-900/50 p-4 mb-6 font-mono text-xs text-red-200 break-words">
              <span className="text-red-400 font-bold block mb-1 uppercase text-[10px]">Diagnostics Code:</span>
              {errorMessage}
            </div>

            {/* Tactical Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Re-Initialize View</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReload}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Hard Reload Terminal</span>
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = '/student'; }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                <Home className="w-4 h-4 text-slate-400" />
                <span>Return to Student Base</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearStorageAndReset}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/30 font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span>Reset Local Cache</span>
              </button>
            </div>

            {/* Collapsible Stack Trace */}
            {this.state.errorInfo && (
              <div>
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center justify-between w-full text-slate-400 hover:text-slate-200 text-xs font-semibold py-2 transition"
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

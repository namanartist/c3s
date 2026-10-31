// src/pages/404.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Compass,
  Home,
  MapPin,
  Camera,
  DoorOpen,
  Settings,
  Search,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Radio
} from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  usePageMeta(
    '404 — Sector Coordinate Unresolved',
    'Requested sector route could not be found on the C3S Campus Defense Network.'
  );

  const tacticalDestinations = [
    { label: 'Student Terminal', to: '/student', icon: Home, desc: 'Primary student hub & attendance' },
    { label: 'Interactive Vector Map', to: '/map', icon: MapPin, desc: 'Multi-floor routing & Dijkstra pathfinding' },
    { label: 'Emergency SOS Hub', to: '/student/sos', icon: ShieldAlert, desc: 'Distress dispatch & safety beacon', alert: true },
    { label: 'CCTV Matrix Feeds', to: '/control-room/cameras', icon: Camera, desc: 'Live tactical camera surveillance' },
    { label: 'Gate Access Terminal', to: '/gate-keeper', icon: DoorOpen, desc: 'Digital QR validation & entry pass' },
    { label: 'System Settings', to: '/settings', icon: Settings, desc: 'Terminal preferences & diagnostics' }
  ];

  const filteredLinks = tacticalDestinations.filter(
    (d) =>
      d.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyDiagnostics = () => {
    const report = `[C3S ROUTING EXCEPTION]\nStatus: HTTP 404 (SECTOR_UNRESOLVED)\nTarget Path: ${location.pathname}\nTimestamp: ${new Date().toISOString()}\nUser Agent: ${navigator.userAgent}`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#070B14] text-slate-100 flex flex-col justify-between font-sans select-none overflow-x-hidden">
      {/* Background Architectural Radar Grids */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(#2563eb 1.5px, transparent 1.5px), radial-gradient(#1e293b 1px, #070B14 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px'
        }}
      />

      {/* Top Ambient Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />

      {/* Header Bar */}
      <header className="relative z-10 border-b border-white/[0.08] bg-[#090D16]/90 px-6 py-4 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-blue-500/20">
            <img src="/c3s_logo.png" alt="C3S" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-white uppercase">C3S DEFENSE</span>
              <span className="rounded bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-bold text-rose-400">
                ERROR 404
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">SECTOR_NOT_FOUND</p>
          </div>
        </Link>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reload</span>
        </button>
      </header>

      {/* Main 404 Body */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-12 w-full space-y-8">
        <div className="text-center space-y-3">
          {/* Radar Glitch Status Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400">
            <Radio className="h-3.5 w-3.5 animate-pulse text-rose-500" />
            <span className="font-mono uppercase tracking-wider">SECTOR COORDINATE UNRESOLVED</span>
          </div>

          <h1 className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 tracking-tighter">
            404
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
            The target route <code className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-blue-400 font-bold">{location.pathname}</code> does not correspond to an authorized campus facility or telemetry endpoint.
          </p>
        </div>

        {/* Quick Search Sector */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search valid campus hubs, maps, or gates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:bg-white/[0.07] focus:outline-none transition-all"
          />
        </div>

        {/* Tactical Hub Jump Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filteredLinks.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`group flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                  item.alert
                    ? 'border-rose-500/30 bg-rose-500/[0.04] hover:bg-rose-500/10 hover:border-rose-500/50'
                    : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-blue-500/40'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                    item.alert
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      {item.label}
                    </p>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 leading-snug line-clamp-2">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions & Diagnostic Footprint */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Target: {location.pathname}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyDiagnostics}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] px-3 py-2 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Diagnostic Copied' : 'Copy Trace'}</span>
            </button>
            <button
              onClick={() => navigate('/student')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Return to Base</span>
            </button>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] py-4 text-center text-[11px] text-slate-500 font-mono">
        C3S CAMPUS SURVEILLANCE &amp; DEFENSE SYSTEM • MITS GWALIOR • TERMINAL RECOVERY
      </footer>
    </div>
  );
}

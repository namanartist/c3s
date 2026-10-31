// src/pages/c3s/StudentDashboard.tsx
import { useState, useEffect } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import {
  ShieldAlert,
  Scan,
  MapPin,
  Clock,
  Navigation,
  Activity,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Search,
  QrCode,
  AlertTriangle,
  Compass,
  Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';
import { useCrowdMonitoring, getCrowdBadgeStyle, calculateCrowdDensity } from '@/lib/crowdMonitoringApi';
import { SOSButton } from '@/components/c3s/SOSButton';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    isInsideCampus,
    checkedInAt,
    checkedInGate,
    sosActive,
    sosIncidentId,
    sosNodeId,
    sosLocation
  } = useC3SStore();

  const realCrowdCount = useSafetyStore((s) => s.realCrowdCount);
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);
  useCrowdMonitoring();
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalCrowd = realCrowdCount > 0 ? realCrowdCount : 206;
  const density = calculateCrowdDensity(Math.round(totalCrowd / 12));
  const badgeStyle = getCrowdBadgeStyle(density);

  const handleNavigateToSos = () => {
    if (sosIncidentId) {
      navigate(`/map?incident=${encodeURIComponent(sosIncidentId)}`);
    } else if (sosNodeId) {
      navigate(`/map?to=${encodeURIComponent(sosNodeId)}`);
    } else {
      navigate('/map');
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6 py-2 sm:py-4">
        {/* MOBILE EXCLUSIVE TOP SOS TRIGGER BUTTON (Placed strictly at the top of mobile UI) */}
        <div className="block sm:hidden w-full">
          <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/80 bg-gradient-to-r from-red-950 via-slate-950 to-red-950 p-3.5 shadow-xl shadow-red-950/60 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/50">
                  <ShieldAlert className="h-6 w-6 animate-pulse" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      CAMPUS EMERGENCY SOS
                    </span>
                    <span className="rounded bg-red-600 px-1.5 py-0.2 text-[9px] font-black text-white">
                      TAP OR HOLD
                    </span>
                  </div>
                  <p className="text-[11px] text-red-200/90 font-medium truncate mt-0.5">
                    Auto photo, video &amp; turn-by-turn dispatch
                  </p>
                </div>
              </div>

              {/* 1-Tap Trigger and 2s Sensor Button */}
              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSosModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-900/50 active:scale-95 transition cursor-pointer"
                  title="Open Emergency SOS Confirmation"
                >
                  1-Tap
                </button>
                <div className="scale-[0.80] origin-right">
                  <SOSButton size="compact" showDetailsOnActive={false} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Digital Campus Pass & Welcome Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-5 sm:p-7 backdrop-blur-2xl shadow-sm dark:shadow-xl transition-colors">
          {/* Subtle Ambient Background Gradient */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" />
                  MITS Verified Student
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  {currentTime}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Welcome, {currentUser?.name || 'Aarav Sharma'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  {currentUser?.department || 'Department of Computer Science & Engineering'} • Roll #{currentUser?.universityId || '2026CS104'}
                </p>
              </div>
            </div>

            {/* Campus Status & Digital Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/70 p-3 sm:px-4 sm:py-3 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Presence Status
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isInsideCampus ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isInsideCampus ? 'Inside Campus' : 'Outside Campus'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                  Gate: {checkedInGate || 'Main Gate'} ({checkedInAt || '08:42 AM'})
                </span>
              </div>

              <button
                onClick={() => navigate('/student/scan')}
                className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <Scan className="h-4 w-4" />
                <span>Scan Gate QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE SOS NOTIFICATION STRIP (If SOS is triggered) */}
        {sosActive && (
          <div className="rounded-2xl border-2 border-red-500 bg-red-950/40 p-4 backdrop-blur-xl animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-red-950/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                    🚨 EMERGENCY BROADCAST ACTIVE
                  </span>
                  <span className="rounded bg-red-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-rose-200 mt-0.5">
                  Location: <strong className="text-white">{sosLocation || 'Academic Corridor Node #9'}</strong> • Alert sent to nearest Faculty, Guard &amp; Chief Proctor.
                </p>
              </div>
            </div>

            <button
              onClick={handleNavigateToSos}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
            >
              <Navigation className="h-4 w-4" />
              <span>Track Incident on Map →</span>
            </button>
          </div>
        )}

        {/* 3 Core Action Bento Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Bento Card 1: Gate QR Scanner */}
          <div
            onClick={() => navigate('/student/scan')}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-xs dark:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-lg dark:hover:shadow-blue-950/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                  <Scan className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border border-blue-200 dark:border-blue-500/20">
                  Daily Pass
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Scan Gate QR
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Scan the dynamic rotating QR code at Main Gate, Jubilee Gate, or Parking Gate for instant verified check-in &amp; check-out.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <span>Open Gate Scanner</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Bento Card 2: Interactive Campus Map & Safe Route */}
          <div
            onClick={() => navigate('/map')}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-xs dark:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-lg dark:hover:shadow-cyan-950/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                  <Compass className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border border-cyan-200 dark:border-cyan-500/20">
                  Indoor GPS
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                Interactive Campus Map
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Turn-by-turn indoor routing to lecture halls, HOD offices, libraries, washrooms, and barrier-free routes with non-blocking Dijkstra.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <span>Explore Indoor Routes</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Bento Card 3: 2-Second Hold Emergency SOS Sensor */}
          <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-500/10 via-white dark:via-slate-900/80 to-red-500/5 p-5 backdrop-blur-xl shadow-xs dark:shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-600 dark:text-rose-400 border border-red-500/30">
                  <ShieldAlert className="h-6 w-6 animate-pulse" />
                </div>
                <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase text-white shadow-sm">
                  Hold 2s
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Emergency SOS Dispatch
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Press and hold the circle for 2s. Automatically captures encrypted video, high-res photo, and dispatches responders.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="scale-75 origin-left">
                <SOSButton size="compact" showDetailsOnActive={false} />
              </div>
              <button
                onClick={() => setSosModalOpen(true)}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                1-Tap Alert →
              </button>
            </div>
          </div>
        </div>

        {/* Safety Services & Emergency Dialers Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/60 p-4 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <PhoneCall className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Chief Proctor Control</p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">+91 751 2409300</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/60 p-4 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Campus Security Guard QRF</p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Radio Ch-4 • Ext 104</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/60 p-4 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Campus Health &amp; First Aid</p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Dispensary Block • 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

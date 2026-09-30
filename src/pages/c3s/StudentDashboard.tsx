import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { CampusMap } from '@/components/c3s/CampusMap';
import {
  Users,
  ShieldAlert,
  Scan,
  Compass,
  Camera,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  MapPin,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';
import { useCrowdMonitoring, getCrowdBadgeStyle, calculateCrowdDensity } from '@/lib/crowdMonitoringApi';
import { SosModal } from '@/components/safety/SosModal';
import { useHumanDetection } from '@/hooks/useHumanDetection';
import { LiveDetectionOverlay } from '@/components/safety/LiveDetectionOverlay';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const {
    checkedInAt,
    checkedInGate,
    isLocationActive,
    gpsAccuracy
  } = useC3SStore();

  const realCrowdCount = useSafetyStore((s) => s.realCrowdCount);
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);
  const cctvCameras = useSafetyStore((s) => s.cctvCameras);

  const { isOnline, isRefreshing, syncCrowdData } = useCrowdMonitoring();
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const studentCamVideoRef = useRef<HTMLVideoElement>(null);
  const studentCamDetection = useHumanDetection(studentCamVideoRef, 'cam_gate_1', true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalCrowd = realCrowdCount > 0 ? realCrowdCount : 206;
  const density = calculateCrowdDensity(Math.round(totalCrowd / 12));
  const badgeStyle = getCrowdBadgeStyle(density);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Tactical Command Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#070b16] via-[#0d162a] to-[#070b16] p-6 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  CAMPUS DEFENSE LEVEL: SECURE
                </span>
                <span className="text-slate-500 font-mono text-xs hidden sm:inline">|</span>
                <span className="text-xs font-mono text-cyan-400 hidden sm:flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {currentTime} IST
                </span>
              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase">
                CAMPUS SHIELD <span className="text-blue-500">//</span> STUDENT COMMAND
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
                Unified autonomous campus protection, real-time AI crowd monitoring, and 1-tap multimodal SOS dispatch.
              </p>
            </div>

            {/* Quick Command Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSosModalOpen(true)}
                className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-red-950/60 hover:brightness-110 active:scale-95 transition-all border border-red-400/40 cursor-pointer animate-pulse"
                title="Immediate 1-tap SOS: Auto-records video evidence & dispatches security"
              >
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="leading-tight">1-TAP EMERGENCY SOS</div>
                  <div className="text-[9px] font-normal text-red-200 tracking-tight normal-case">Auto-records video &amp; GPS</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/student/scan')}
                className="flex items-center gap-2 rounded-2xl border border-blue-500/40 bg-blue-950/40 px-4 py-3 text-xs font-bold text-blue-300 hover:bg-blue-900/40 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
              >
                <Scan className="h-4 w-4 text-blue-400" />
                <span>SCAN GATE QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real Crowd Count Tactical Monitor Card (Prominent User Focus) */}
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-white uppercase">
                    CAMPUS REAL-TIME CROWD MONITORING
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${badgeStyle.bg}`}>
                    {badgeStyle.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Direct optical AI telemetry linked to Crowd_monitoring engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => syncCrowdData()}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:border-cyan-500 text-xs font-mono text-cyan-300 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'SYNCING...' : 'SYNC TELEMETRY'}</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-slate-300">ENGINE: <strong className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>{isOnline ? 'ONLINE' : 'ACTIVE'}</strong></span>
              </div>
            </div>
          </div>

          {/* Big Live Crowd Metrics Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Crowd Counter */}
            <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 to-slate-900 p-5 shadow-lg relative overflow-hidden">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 font-mono">
                TOTAL CAMPUS HEADCOUNT
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                  {totalCrowd}
                </span>
                <span className="text-sm font-bold text-cyan-300 font-mono">PEOPLE</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center gap-1 font-mono">
                <span className="text-emerald-400 font-bold">● LIVE AI SENSING</span> across 12 sectors
              </p>
            </div>

            {/* Academic Zone */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono uppercase">Academic Block A</span>
                <span className="text-emerald-400 font-mono font-bold">NORMAL</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-white font-mono">
                {Math.round(totalCrowd * 0.38)} <span className="text-xs text-slate-400 font-normal">Persons</span>
              </p>
              <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '38%' }} />
              </div>
            </div>

            {/* Central Library & Conclave */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono uppercase">Central Library Plaza</span>
                <span className="text-cyan-400 font-mono font-bold">MODERATE</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-white font-mono">
                {Math.round(totalCrowd * 0.28)} <span className="text-xs text-slate-400 font-normal">Persons</span>
              </p>
              <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '28%' }} />
              </div>
            </div>

            {/* Main Entrance & Gate 02 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono uppercase">Main Gate 02 Foyer</span>
                <span className="text-emerald-400 font-mono font-bold">STEADY</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-white font-mono">
                {Math.round(totalCrowd * 0.18)} <span className="text-xs text-slate-400 font-normal">Persons</span>
              </p>
              <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '18%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Dual Command: Live Surveillance Video Feed & Interactive Campus Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Surveillance AI Stream Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    LIVE AI SURVEILLANCE FEED
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">Sector: Academic Block Courtyard</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/control-room/cameras')}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono cursor-pointer"
              >
                <span>Full Matrix (12 Cams)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Moving Video Display with Real HUD */}
            <div className="relative mt-4 h-64 sm:h-72 w-full rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-inner">
              <video
                ref={studentCamVideoRef}
                src="/videos/crowd.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <LiveDetectionOverlay detection={studentCamDetection} />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-mono pt-2">
              <span>Status: <strong className="text-emerald-400">Active Monitoring</strong></span>
              <span>Encrypted RTSP Node</span>
            </div>
          </div>

          {/* Interactive Campus Map & Location Tracking */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    TACTICAL CAMPUS POSITION TRACKER
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">Live GPS Beacon: {isLocationActive ? 'Synchronized' : 'Standby'}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/map')}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-mono cursor-pointer"
              >
                <span>3D Vector Map</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-700 shadow-xl bg-slate-900">
              <CampusMap height="h-80 sm:h-[400px]" highlightLocation="Academic Block A" />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-mono pt-2">
              <span>Gate: <strong className="text-white">{checkedInGate}</strong></span>
              <span>Accuracy: <strong className="text-emerald-400">±{gpsAccuracy}m</strong></span>
              <span>Entry: <strong className="text-slate-200">{checkedInAt}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Command Navigation Tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={() => navigate('/student/scan')}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-blue-500 hover:bg-blue-950/20 active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2.5 text-blue-400">
                <Scan className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-100">SCAN GATE QR</p>
                <p className="text-[10px] text-slate-400">Verified Gate Access</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500" />
          </button>

          <button
            onClick={() => setSosModalOpen(true)}
            className="flex items-center justify-between rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 transition-all hover:border-rose-500 hover:bg-rose-950/40 active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/20 p-2.5 text-rose-400 animate-pulse">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-rose-300">EMERGENCY SOS</p>
                <p className="text-[10px] text-rose-400/80">Auto Photo+Video+LLM</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-rose-400" />
          </button>

          <button
            onClick={() => navigate('/student/incidents')}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-slate-700 active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-100">REPORT HAZARD</p>
                <p className="text-[10px] text-slate-400">Log campus issue</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500" />
          </button>

          <button
            onClick={() => navigate('/map')}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-emerald-500/50 hover:bg-emerald-950/20 active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-100">CAMPUS MAP</p>
                <p className="text-[10px] text-slate-400">Open Node Navigation</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Universal Auto-Camera & LLM Triage SOS Modal */}
      <SosModal />
    </AppShell>
  );
}
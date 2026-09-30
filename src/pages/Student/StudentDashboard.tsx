// src/pages/Student/StudentDashboard.tsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Scan,
  Radio,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  AlertTriangle,
  Phone,
  PhoneCall,
  Navigation,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { useSafetyStore } from '@/store/safetyStore';
import { useSessionStore } from '@/store/sessionStore';
import { useGateStore } from '@/store/gateStore';
import { StudentGateScannerModal } from '@/components/safety/StudentGateScannerModal';
import type { IncidentCategory, IncidentSeverity } from '@/types/safety';
import { OfflineMeshStatus } from '@/components/safety/OfflineMeshStatus';
import { formatDMS } from '@/lib/geoProjection';

const CATEGORIES: { id: IncidentCategory; label: string; icon: string; desc: string }[] = [
  { id: 'security', label: 'Security & Safety', icon: '🛡️', desc: 'Harassment, threat, suspicious activity' },
  { id: 'medical', label: 'Medical Emergency', icon: '🚑', desc: 'Injury, dizziness, sudden illness' },
  { id: 'fire', label: 'Fire / Smoke', icon: '🔥', desc: 'Fire hazard, smoke, electrical sparks' },
  { id: 'infrastructure', label: 'Campus Hazard', icon: '⚠️', desc: 'Water leak, broken pathway, power issue' }
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const signOut = useSessionStore((state) => state.signOut);

  const triggerSosIncident = useSafetyStore((state) => state.triggerSosIncident);
  const updateIncidentEvidence = useSafetyStore((state) => state.updateIncidentEvidence);
  const emergencyContacts = useSafetyStore((state) => state.emergencyContacts);

  const { enableGps, isGpsActive, userGpsCoords } = useCampusNavigation();

  // Gate Store state
  const movementStatus = useGateStore((s) => s.movementStatus);
  const setScannerModalOpen = useGateStore((s) => s.setScannerModalOpen);
  const userMovementHistory = useGateStore((s) => s.userMovementHistory);
  const gates = useGateStore((s) => s.gates);
  const isLocationActive = useGateStore((s) => s.isLocationActive);
  const consistencyAlert = useGateStore((s) => s.consistencyAlert);
  const dismissConsistencyAlert = useGateStore((s) => s.dismissConsistencyAlert);

  const [category, setCategory] = useState<IncidentCategory>('security');
  const severity: IncidentSeverity = 'high';
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentIncidentId, setSentIncidentId] = useState<string | null>(null);

  // Press-and-hold deliberate SOS trigger logic
  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const [isHoldingSos, setIsHoldingSos] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const latestMovement = userMovementHistory[0];

  // Press & Hold Handlers
  const handleSosStart = () => {
    setIsHoldingSos(true);
    setSosHoldProgress(0);

    const startTime = Date.now();
    const duration = 2000; // 2 seconds hold to trigger

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setSosHoldProgress(progress);

      if (elapsed >= duration) {
        clearInterval(holdIntervalRef.current!);
        setIsHoldingSos(false);
        setSosHoldProgress(0);
        executeStudentSos();
      }
    }, 50);
  };

  const handleSosCancel = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setIsHoldingSos(false);
    setSosHoldProgress(0);
  };

  const executeStudentSos = async () => {
    if (isSending) return;
    setIsSending(true);

    try {
      if (!isGpsActive) {
        enableGps();
      }

      const activeGate = gates['GATE-MAIN'];
      const lat = userGpsCoords?.lat ?? activeGate.lat;
      const lng = userGpsCoords?.lon ?? activeGate.lng;

      const incident = triggerSosIncident({
        category,
        severity,
        title: `${CATEGORIES.find((c) => c.id === category)?.label || 'Emergency'}: ${user?.name || 'Student'}`,
        description: description.trim() || 'Immediate emergency assistance requested via Student Safety Portal.',
        map: 'Campus_Map',
        floor: 0,
        x: 450,
        y: 400,
        lat,
        lng,
        reportedBy: `${user?.name || 'Student'} (${user?.identifier || 'STUDENT'})`,
        phone: '+91 98765 43210'
      });

      setSentIncidentId(incident.id);
      setDescription('');

      // Auto-record 10-second evidence clip if camera is available
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          chunksRef.current = [];
          const recorder = new MediaRecorder(stream);
          recorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
            updateIncidentEvidence(incident.id, {
              recordingUrl: URL.createObjectURL(blob),
              recordingMimeType: blob.type,
              recordedAt: Date.now(),
              recordedDurationSeconds: 10
            });
            streamRef.current?.getTracks().forEach((track) => track.stop());
          };

          recorder.start();
          setTimeout(() => {
            if (recorder.state === 'recording') recorder.stop();
          }, 10000);
        } catch {
          // Graceful fallback if camera denied
        }
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 text-white text-center">
        <div className="glass-card p-8 rounded-3xl max-w-md w-full">
          <ShieldAlert className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-black mb-2">Student Access Required</h2>
          <p className="text-xs text-slate-400 mb-6">Please sign in with your student credentials to view your personal safety workspace.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-xs transition shadow-lg shadow-blue-600/30"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] bg-cyber-grid text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* TOP COMMAND BAR */}
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/25">
              <div className="w-full h-full bg-[#090e1a] rounded-[14px] flex items-center justify-center text-cyan-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
                  C3S STUDENT PORTAL
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  SECURE NET
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>{user.name}</span>
                <span className="text-xs font-mono font-normal text-slate-400">({user.identifier})</span>
              </h1>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/map')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02]"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>Campus Map</span>
            </button>

            <button
              onClick={() => setScannerModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Gate QR</span>
            </button>

            <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />
            <OfflineMeshStatus />

            <button
              onClick={() => {
                signOut();
                navigate('/login');
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CONSISTENCY ADVISORY BANNER (If location mismatch occurs) */}
      <AnimatePresence>
        {consistencyAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-amber-600/30 via-orange-600/20 to-transparent border-b border-amber-500/30 px-6 py-2.5 backdrop-blur-md"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold">{consistencyAlert.message}</span>
              </div>
              <button
                onClick={dismissConsistencyAlert}
                className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-bold text-[10px]"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN WORKSPACE GRID */}
      <main className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================
            LEFT COLUMN (7 cols): Digital Gate Pass & Live Location Card
           ============================================================ */}
        <section className="lg:col-span-7 space-y-6">
          {/* Holographic Campus Digital Pass */}
          <div className="glass-card rounded-[32px] p-7 relative overflow-hidden animate-hologram">
            {/* Ambient Corner Radial Lights */}
            <div
              className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
                movementStatus === 'INSIDE' ? 'bg-emerald-500/20' : 'bg-blue-600/20'
              }`}
            />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Pass Header */}
            <div className="flex items-center justify-between relative z-10 mb-6">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    movementStatus === 'INSIDE' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">
                  DIGITAL CAMPUS ACCESS PASS
                </span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10 font-bold">
                MITS-C3S-2026
              </span>
            </div>

            {/* Pass Body Content */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center relative z-10">
              <div className="sm:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 border border-white/15">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      movementStatus === 'INSIDE' ? 'bg-emerald-400' : 'bg-slate-400'
                    }`}
                  />
                  <span>PRESENCE: {movementStatus === 'INSIDE' ? 'INSIDE CAMPUS' : 'OUTSIDE CAMPUS'}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {movementStatus === 'INSIDE' ? 'Access Validated' : 'Gate Entry Required'}
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {movementStatus === 'INSIDE'
                    ? `Checked in at ${latestMovement?.gateName || 'Main Gate'} at ${
                        latestMovement ? new Date(latestMovement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'
                      }. Location safety tracking is currently active.`
                    : 'Scan today’s daily rotating QR code physically displayed at Jubilee Gate, Main Gate, or New Parking Gate to check in.'}
                </p>

                {/* Live GPS Geofence Pill */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-200">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {isLocationActive ? (
                        <>GPS Active • <b className="text-emerald-400">Inside Perimeter</b></>
                      ) : (
                        'GPS Standby'
                      )}
                    </span>
                  </span>
                  {userGpsCoords && (
                    <span className="font-mono text-[11px] text-slate-400 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10">
                      {formatDMS(userGpsCoords.lat, userGpsCoords.lon)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button & QR Scanner Trigger */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white mb-3 shadow-xl shadow-blue-500/30">
                  <Scan className="w-8 h-8" />
                </div>
                <button
                  onClick={() => setScannerModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition active:scale-95"
                >
                  {movementStatus === 'INSIDE' ? 'Scan to Check-Out' : 'Scan Gate QR'}
                </button>
                <span className="text-[9px] text-slate-400 mt-2 font-mono">
                  {movementStatus === 'INSIDE' ? 'Exiting Campus' : 'Entering Campus'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Gate Checkpoint Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['GATE-MAIN', 'GATE-JUBILEE', 'GATE-PARKING'] as const).map((gid) => {
              const g = gates[gid];
              return (
                <div
                  key={gid}
                  onClick={() => setScannerModalOpen(true)}
                  className="glass-card glass-card-hover p-4 rounded-2xl cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{g.code}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">{g.name.split(' ')[0]} {g.name.split(' ')[1]}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{g.location}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Active QR</span>
                    <span className="text-blue-400 font-bold flex items-center gap-0.5">Scan →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Personal Entry / Exit Ledger Timeline */}
          <div className="glass-card rounded-[28px] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Your Recent Movement History
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Official Ledger</span>
            </div>

            <div className="space-y-2.5">
              {userMovementHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-white/10">
                  No gate movement events logged today. Scan a gate QR upon entry to begin your session.
                </div>
              ) : (
                userMovementHistory.slice(0, 5).map((m) => {
                  const isCheckIn = m.type === 'CHECK-IN';
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isCheckIn ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{m.gateName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({m.method})</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                          isCheckIn
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {m.type}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* ============================================================
            RIGHT COLUMN (5 cols): Emergency SOS Command & Safety Unit
           ============================================================ */}
        <section className="lg:col-span-5 space-y-6">
          {/* Deliberate Emergency SOS Activation Unit */}
          <div className="glass-card rounded-[32px] p-7 border-red-500/30 bg-gradient-to-b from-red-950/40 via-slate-950/60 to-slate-950 relative overflow-hidden shadow-2xl shadow-red-900/20">
            {/* Ambient Danger Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-wider">
                    Emergency SOS Command
                  </h2>
                  <p className="text-[10px] text-red-200/60">
                    Direct dispatch to Campus Quick Response Fleet (QRF)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold uppercase">
                Priority 1
              </span>
            </div>

            {/* Incident Category Selection Chips */}
            <div className="space-y-1.5 mb-4 relative z-10">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Select Incident Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-red-500/20 border-red-400 text-white shadow-md shadow-red-500/20'
                          : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="text-base mb-1">{cat.icon}</div>
                      <div className="text-xs font-black">{cat.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate">{cat.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Description */}
            <div className="mb-5 relative z-10">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief details or landmark (e.g. Near Library stairs, Conclave Centre)..."
                className="w-full glass-input rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none"
              />
            </div>

            {/* DELIBERATE PRESS & HOLD SOS BUTTON */}
            <div className="flex flex-col items-center justify-center pt-2 relative z-10">
              <div
                className="relative cursor-pointer select-none"
                onMouseDown={handleSosStart}
                onMouseUp={handleSosCancel}
                onMouseLeave={handleSosCancel}
                onTouchStart={handleSosStart}
                onTouchEnd={handleSosCancel}
              >
                {/* Outer Progress Ring SVG */}
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke="rgba(239, 68, 68, 0.2)"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke="#ef4444"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="402"
                    strokeDashoffset={402 - (402 * sosHoldProgress) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                </svg>

                {/* Central Button Core */}
                <div
                  className={`absolute inset-4 rounded-full flex flex-col items-center justify-center text-center transition-all ${
                    isHoldingSos
                      ? 'bg-gradient-to-tr from-red-700 to-rose-600 scale-95 shadow-2xl shadow-red-600/50'
                      : 'bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-xl shadow-red-600/30'
                  }`}
                >
                  <Camera className="w-7 h-7 text-white mb-1 animate-pulse" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    {isHoldingSos ? 'HOLDING...' : 'PRESS & HOLD'}
                  </span>
                  <span className="text-[9px] text-red-200 font-bold">
                    {isHoldingSos ? `${Math.round(sosHoldProgress)}%` : '2 SECONDS'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-3 text-center font-medium">
                Hold for 2 seconds to broadcast emergency alert. Releases early to prevent accidental triggers.
              </p>
            </div>

            {/* Sent Feedback Confirmation */}
            <AnimatePresence>
              {sentIncidentId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-black block">SOS Broadcast Received</span>
                      <span className="text-[10px] text-emerald-300">
                        QRF Alpha Rover & Medical Team notified. Turn-by-turn routing active.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSentIncidentId(null)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white"
                  >
                    DISMISS
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 24/7 Security Helplines Speed-Dial Card */}
          <div className="glass-card rounded-[28px] p-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Campus Emergency Speed-Dial
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">24/7 ACTIVE</span>
            </div>

            <div className="space-y-2">
              {emergencyContacts.slice(0, 3).map((contact, idx) => (
                <a
                  key={idx}
                  href={`tel:${contact.phone}`}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 hover:bg-blue-600/10 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      {contact.title}
                    </div>
                    <div className="text-[10px] text-slate-400">{contact.role}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 group-hover:text-blue-300">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>{contact.phone}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Student Gate QR Scanner Modal Component */}
      <StudentGateScannerModal />
    </div>
  );
}
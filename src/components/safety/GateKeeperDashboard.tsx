// src/components/safety/GateKeeperDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  RefreshCw,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Scan,
  Maximize2,
  Minimize2,
  MapPin,
  DoorOpen
} from 'lucide-react';
import { useGateStore } from '@/store/gateStore';
import { useSessionStore } from '@/store/sessionStore';
import type { GateId } from '@/types/gate';
import { QrCodeSvg } from '@/components/ui/QrCodeSvg';
import { serializeQrToken } from '@/lib/gateSecurity';
import { useNavigate } from 'react-router-dom';

interface GateKeeperDashboardProps {
  initialGateId?: GateId;
}

export const GateKeeperDashboard: React.FC<GateKeeperDashboardProps> = ({ initialGateId }) => {
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);
  const gates = useGateStore((s) => s.gates);
  const activeGateId = useGateStore((s) => s.activeGateId);
  const setActiveGate = useGateStore((s) => s.setActiveGate);
  const getGateQr = useGateStore((s) => s.getGateQr);
  const rotateGateQr = useGateStore((s) => s.rotateGateQr);
  const executeGateScan = useGateStore((s) => s.executeGateScan);
  const allMovements = useGateStore((s) => s.allMovements);
  const getOccupancyStats = useGateStore((s) => s.getOccupancyStats);

  const [selectedGate, setSelectedGate] = useState<GateId>(initialGateId || activeGateId || 'GATE-MAIN');
  const [isFullscreenQr, setIsFullscreenQr] = useState(false);
  const [rotateReason, setRotateReason] = useState('');
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [simulatedStudentId, setSimulatedStudentId] = useState('2026CS104');
  const [simulatedStudentName, setSimulatedStudentName] = useState('Aarav Sharma');
  const [scanFeedback, setScanFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (initialGateId) setSelectedGate(initialGateId);
  }, [initialGateId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const gate = gates[selectedGate] || gates['GATE-MAIN'];
  const qrToken = getGateQr(selectedGate);
  const qrString = serializeQrToken(qrToken);
  const occupancyStats = getOccupancyStats();

  // Midnight countdown calculation
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);
  const hoursLeft = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor(((midnight.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)));

  const handleGateSelect = (id: GateId) => {
    setSelectedGate(id);
    setActiveGate(id);
    setScanFeedback(null);
  };

  const handleRotateConfirm = () => {
    rotateGateQr(selectedGate, user?.name || 'Gate Keeper', rotateReason || 'Daily rollover check');
    setShowRotateModal(false);
    setRotateReason('');
  };

  const handleSimulateScan = (type?: 'CHECK-IN' | 'CHECK-OUT') => {
    const result = executeGateScan(
      qrString,
      {
        identifier: simulatedStudentId.trim() || '2026CS104',
        name: simulatedStudentName.trim() || 'Aarav Sharma',
        role: 'student'
      },
      type
    );
    setScanFeedback(result);
  };

  // Recent movements filtered to this gate
  const gateMovements = allMovements.filter((m) => m.gateId === selectedGate).slice(0, 8);

  return (
    <div className="min-h-screen bg-[#070b14] bg-cyber-grid text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Operations Header Bar */}
      <header className="border-b border-white/10 bg-slate-950/75 backdrop-blur-2xl px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 p-[1.5px] shadow-lg shadow-emerald-500/25">
              <div className="w-full h-full bg-[#070b14] rounded-[14px] flex items-center justify-center text-emerald-400">
                <DoorOpen className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
                  C3S GATE MANAGEMENT STATION
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  OPERATIONAL
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{gate.name}</span>
                <span className="text-xs font-mono font-normal text-slate-400">({gate.code})</span>
              </h1>
            </div>
          </div>

          {/* Gate Selection Tabs */}
          <div className="flex items-center bg-black/50 p-1 rounded-2xl border border-white/10">
            {(['GATE-MAIN', 'GATE-JUBILEE', 'GATE-PARKING'] as GateId[]).map((id) => {
              const isSelected = selectedGate === id;
              const gInfo = gates[id];
              return (
                <button
                  key={id}
                  onClick={() => handleGateSelect(id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-500'}`} />
                  <span>{gInfo?.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Station Status & Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/map')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Tactical Map</span>
            </button>
            <div className="h-5 w-[1px] bg-white/10" />
            <div className="text-right">
              <div className="text-xs font-mono text-white font-bold">{currentTime}</div>
              <div className="text-[10px] text-slate-400">Officer: {gate.gateKeeperName}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
        {/* ============================================================
            LEFT COLUMN (7 cols): High-Resolution Daily QR Billboard Card
           ============================================================ */}
        <section className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-[32px] p-8 relative overflow-hidden flex flex-col items-center text-center">
            {/* Ambient Background Light */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header controls inside card */}
            <div className="flex items-center justify-between w-full mb-6 z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                  DAILY ROTATING QR CODE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRotateModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition"
                  title="Rotate today's gate token"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rotate QR</span>
                </button>
                <button
                  onClick={() => setIsFullscreenQr(!isFullscreenQr)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition"
                  title="Toggle Fullscreen Billboard Mode"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Gate Title */}
            <div className="mb-6 z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                {gate.name}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {gate.location} • Official Entry/Exit Checkpoint
              </p>
            </div>

            {/* The Dedicated Crisp QR Billboard Box */}
            <div className="p-6 bg-white rounded-[28px] shadow-2xl shadow-blue-900/40 flex flex-col items-center border-4 border-slate-900 z-10 relative group">
              <QrCodeSvg
                value={qrString}
                size={270}
                fgColor="#070b14"
                bgColor="#ffffff"
                title={`${gate.name} Gate QR`}
              />
              <div className="mt-4 text-center">
                <p className="text-xs font-black tracking-widest text-slate-900 uppercase">
                  SCAN TO CHECK-IN / CHECK-OUT
                </p>
                <p className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">
                  TOKEN: {qrToken.token.substring(0, 32)}...
                </p>
              </div>
            </div>

            {/* Security & Expiry Metadata Chips */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-300 z-10">
              <span className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3.5 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Expires in {hoursLeft}h {minutesLeft}m (11:59 PM)</span>
              </span>
              <span className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3.5 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Version {qrToken.version} • Server Signed</span>
              </span>
              <span className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3.5 py-1.5 rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cryptographically Validated</span>
              </span>
            </div>
          </div>

          {/* Gate Scanner & Reader Simulator */}
          <div className="glass-card rounded-[28px] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Gate Reader / Scanner Simulator
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Physical Checkpoint Test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Student / Staff ID
                </label>
                <input
                  type="text"
                  value={simulatedStudentId}
                  onChange={(e) => setSimulatedStudentId(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  placeholder="2026CS104"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={simulatedStudentName}
                  onChange={(e) => setSimulatedStudentName(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white outline-none"
                  placeholder="Aarav Sharma"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleSimulateScan('CHECK-IN')}
                className="flex-1 min-w-[130px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-xs text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-emerald-600/25"
              >
                <span>Simulate Check-In</span>
              </button>
              <button
                onClick={() => handleSimulateScan('CHECK-OUT')}
                className="flex-1 min-w-[130px] py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 font-black text-xs text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-amber-600/25"
              >
                <span>Simulate Check-Out</span>
              </button>
              <button
                onClick={() => handleSimulateScan()}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-xs text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-blue-600/25"
              >
                <span>Auto State Detect</span>
              </button>
            </div>

            {/* Scan Feedback Alert */}
            <AnimatePresence>
              {scanFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                    scanFeedback.success
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                      : 'bg-red-500/15 border-red-500/30 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {scanFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                    <span>{scanFeedback.message}</span>
                  </div>
                  <button
                    onClick={() => setScanFeedback(null)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white"
                  >
                    DISMISS
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ============================================================
            RIGHT COLUMN (5 cols): Metrics, Occupancy Ledger & Activity
           ============================================================ */}
        <section className="lg:col-span-5 space-y-6">
          {/* Today's Gate Specific Metric Tiles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Today's Check-Ins</span>
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {gate.checkInsToday.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Verified entries at {gate.name.split(' ')[0]}</p>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Today's Check-Outs</span>
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {gate.checkOutsToday.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Recorded exits through checkpoint</p>
            </div>
          </div>

          {/* Authoritative Campus Occupancy Ledger Breakdown */}
          <div className="glass-card rounded-[28px] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Campus Occupancy Ledger
                  </h3>
                  <p className="text-[10px] text-slate-400">Authoritative movement ledger balance</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-cyan-400 font-mono">
                  {occupancyStats.totalCampusInside.toLocaleString()}
                </span>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Currently Inside</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-white/10">
              {(Object.keys(occupancyStats.byGate) as GateId[]).map((gid) => {
                const gStat = occupancyStats.byGate[gid];
                const isSelected = gid === selectedGate;
                return (
                  <div
                    key={gid}
                    onClick={() => handleGateSelect(gid)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-600/15 shadow-md shadow-blue-600/15'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-2">
                        <span>{gStat.name}</span>
                        {isSelected && (
                          <span className="text-[8px] px-1.5 py-0.2 bg-blue-500 text-white rounded font-black uppercase">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        IN: <b className="text-emerald-400 font-mono">{gStat.checkIns}</b> • OUT:{' '}
                        <b className="text-amber-400 font-mono">{gStat.checkOuts}</b>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        Net +{gStat.netInside}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Movement Activity Stream */}
          <div className="glass-card rounded-[28px] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Live Checkpoint Activity
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Stream</span>
            </div>

            <div className="space-y-2">
              {gateMovements.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center rounded-xl border border-dashed border-white/10">
                  No movement events recorded yet at this gate today.
                </p>
              ) : (
                gateMovements.map((m) => {
                  const isCheckIn = m.type === 'CHECK-IN';
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCheckIn ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-white">
                            {m.userName}{' '}
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({m.userId})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {m.method}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
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
      </main>

      {/* Manual Refresh QR Confirmation Modal */}
      <AnimatePresence>
        {showRotateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-[32px] p-7 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <h3 className="text-lg font-black text-white mb-2">Rotate Gate Daily QR</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Regenerating the token will immediately invalidate previous physical printouts for {gate.name}. The operation will be written permanently to the security audit ledger.
              </p>

              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Reason for Regeneration
              </label>
              <input
                type="text"
                value={rotateReason}
                onChange={(e) => setRotateReason(e.target.value)}
                placeholder="e.g. Daily shift handover, suspected token leakage"
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white outline-none mb-6"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRotateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRotateConfirm}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-black text-white shadow-lg shadow-blue-600/30"
                >
                  Confirm & Rotate QR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Billboard Projection View (For Dedicated Physical Display Monitors) */}
      <AnimatePresence>
        {isFullscreenQr && (
          <div className="fixed inset-0 z-50 bg-[#060a12] text-white flex flex-col items-center justify-center p-8 select-none">
            <button
              onClick={() => setIsFullscreenQr(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                CAMPUS SURVEILLANCE & SECURITY SYSTEM (C3S)
              </span>
              <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mt-2 uppercase">
                {gate.name}
              </h1>
              <p className="text-sm font-medium text-slate-400 mt-2">
                Scan with your phone to Check-In or Check-Out
              </p>
            </div>

            <div className="p-8 bg-white rounded-[36px] shadow-2xl shadow-blue-500/20 border-8 border-slate-900">
              <QrCodeSvg
                value={qrString}
                size={380}
                fgColor="#070b14"
                bgColor="#ffffff"
                title={`${gate.name} Fullscreen QR`}
              />
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>QR STATUS: ACTIVE • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

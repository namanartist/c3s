// src/components/safety/StudentGateScannerModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  QrCode,
  Scan,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Compass
} from 'lucide-react';
import { useGateStore } from '@/store/gateStore';
import { useSessionStore } from '@/store/sessionStore';
import { serializeQrToken } from '@/lib/gateSecurity';
import type { GateId } from '@/types/gate';

export const StudentGateScannerModal: React.FC = () => {
  const isOpen = useGateStore((s) => s.scannerModalOpen);
  const setOpen = useGateStore((s) => s.setScannerModalOpen);
  const movementStatus = useGateStore((s) => s.movementStatus);
  const userMovementHistory = useGateStore((s) => s.userMovementHistory);
  const executeGateScan = useGateStore((s) => s.executeGateScan);
  const gates = useGateStore((s) => s.gates);
  const getGateQr = useGateStore((s) => s.getGateQr);
  const isLocationActive = useGateStore((s) => s.isLocationActive);
  const gpsCoords = useGateStore((s) => s.gpsCoords);
  const startLocationTracking = useGateStore((s) => s.startLocationTracking);
  const consistencyAlert = useGateStore((s) => s.consistencyAlert);
  const dismissConsistencyAlert = useGateStore((s) => s.dismissConsistencyAlert);

  const user = useSessionStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attempt to activate camera when on scan tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'scan') {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
      return;
    }

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraActive(true);
          }
        })
        .catch(() => {
          setCameraActive(false); // Graceful fallback
        });
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const currentUser = {
    identifier: user?.identifier || 'student-demo',
    name: user?.name || 'Campus Student',
    role: user?.role || 'student'
  };

  const handleQuickScanGate = (gateId: GateId) => {
    const token = getGateQr(gateId);
    const serialized = serializeQrToken(token);
    const res = executeGateScan(serialized, currentUser);
    setScanResult(res);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    const res = executeGateScan(manualTokenInput.trim(), currentUser);
    setScanResult(res);
    setManualTokenInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0c121e] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Campus Gate QR Scanner
              </h2>
              <p className="text-[10px] text-slate-400">
                MITS Gwalior C3S Entry & Exit System
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Movement Status Banner */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                movementStatus === 'INSIDE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-bold text-slate-300">
              CURRENT STATUS:{' '}
              <b
                className={
                  movementStatus === 'INSIDE' ? 'text-emerald-400' : 'text-slate-400'
                }
              >
                {movementStatus === 'INSIDE' ? 'INSIDE CAMPUS' : 'OUTSIDE CAMPUS'}
              </b>
            </span>
          </div>

          {/* Location Status Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            {isLocationActive && gpsCoords ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>GPS ACTIVE ({Math.round(gpsCoords.accuracy || 8)}m)</span>
              </span>
            ) : (
              <button
                onClick={startLocationTracking}
                className="text-amber-400 hover:text-amber-300 underline text-[10px] flex items-center gap-1"
              >
                <Compass className="w-3 h-3" />
                <span>Enable GPS</span>
              </button>
            )}
          </div>
        </div>

        {/* Consistency Alert Warning (If applicable) */}
        {consistencyAlert && (
          <div className="mx-5 mt-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase text-[10px] tracking-wider text-amber-300">
                  Location Consistency Advisory
                </span>
                <span className="text-[11px]">{consistencyAlert.message}</span>
              </div>
            </div>
            <button
              onClick={dismissConsistencyAlert}
              className="text-[10px] font-bold text-amber-300 hover:text-white"
            >
              OK
            </button>
          </div>
        )}

        {/* Tab Controls */}
        <div className="px-5 pt-3 flex gap-2 border-b border-white/5">
          <button
            onClick={() => setActiveTab('scan')}
            className={`pb-2 text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'scan'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scanner & Check
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'history'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Movement History ({userMovementHistory.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {activeTab === 'scan' ? (
            <>
              {/* Camera Scanner Viewport */}
              <div className="relative w-full aspect-video bg-black/60 rounded-2xl border-2 border-dashed border-white/20 overflow-hidden flex flex-col items-center justify-center text-center p-4">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-blue-500 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 z-10">
                    <QrCode className="w-10 h-10 text-slate-500" />
                    <p className="text-xs font-bold text-slate-300">
                      Camera Ready • Point at Physical Gate QR
                    </p>
                    <p className="text-[10px] text-slate-500 max-w-xs">
                      Alternatively, choose your physical gate below to test scanning immediately.
                    </p>
                  </div>
                )}
              </div>

              {/* Scan Feedback Banner */}
              <AnimatePresence>
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                      scanResult.success
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                        : 'bg-red-500/15 border-red-500/30 text-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {scanResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                      <span>{scanResult.message}</span>
                    </div>
                    <button
                      onClick={() => setScanResult(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white"
                    >
                      DISMISS
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 1-Tap Physical Gate Quick Scan (Simulates reaching the physical gate) */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Select Physical Gate You Are At
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['GATE-MAIN', 'GATE-JUBILEE', 'GATE-PARKING'] as GateId[]).map((gid) => {
                    const g = gates[gid];
                    return (
                      <button
                        key={gid}
                        onClick={() => handleQuickScanGate(gid)}
                        className="p-3 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-blue-600/15 hover:border-blue-500/40 text-left transition active:scale-95 group"
                      >
                        <div className="text-xs font-black text-white group-hover:text-blue-400">
                          {g.name.split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{g.code}</div>
                        <div className="mt-2 text-[9px] font-black uppercase text-blue-400 flex items-center gap-1">
                          <span>Scan QR</span>
                          <span>→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manual QR String Input (For offline or barcode readers) */}
              <form onSubmit={handleManualSubmit} className="pt-2 border-t border-white/5">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Or Paste Gate Token / Raw QR String
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="C3S-QR-GATE-MAIN-..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white rounded-xl transition"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Movement History List */
            <div className="space-y-2.5">
              {userMovementHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No check-in or check-out events recorded for your account today.
                </div>
              ) : (
                userMovementHistory.map((m) => {
                  const isCheckIn = m.type === 'CHECK-IN';
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl border border-white/5 bg-white/[0.03] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isCheckIn ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        <div>
                          <div className="font-black text-white">{m.gateName}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}{' '}
                            • {m.method}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                          isCheckIn
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {m.type}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
          <span>Logged in as: <b className="text-white">{currentUser.name}</b></span>
          <span>Role: <b className="text-blue-400 uppercase">{currentUser.role}</b></span>
        </div>
      </motion.div>
    </div>
  );
};

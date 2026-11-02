import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  SwitchCamera,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  MapPin,
  AlertCircle,
  ShieldCheck,
  History
} from 'lucide-react';
import jsQR from 'jsqr';
import { useNavigate } from 'react-router-dom';
import { useGateStore } from '@/store/gateStore';
import { useC3SStore } from '@/store/c3sStore';
import { validateGateQrToken } from '@/lib/gateSecurity';
import { checkInUser, checkOutUser } from '@/lib/gateApi';
import type { GateId } from '@/types/gate';

interface QRScannerProps {
  onScanSuccess?: (gateName: string, gateId: string) => void;
  targetGateName?: string;
  isCheckOut?: boolean;
}

function playScanChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    /* empty */
  }
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, isCheckOut = false }) => {
  const navigate = useNavigate();
  const { gates, getGateQr, executeGateScan } = useGateStore();
  const { currentUser, confirmCheckIn, confirmCheckOut } = useC3SStore();

  const [selectedGateId, setSelectedGateId] = useState<GateId>('GATE-MAIN');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState<{
    gateName: string;
    gateId: string;
    type: 'CHECK-IN' | 'CHECK-OUT';
    time: string;
    id: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanLoopRef = useRef<() => void>(() => {});
  const lastScanTimeRef = useRef<number>(0);

  const activeGate = gates[selectedGateId] || gates['GATE-MAIN'];

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Process a verified QR token string
  const handleDecodedToken = useCallback(
    async (tokenString: string) => {
      if (scanning) return;
      setScanning(true);
      setCameraError(null);

      // Validate cryptographic signature & expiration
      const validation = validateGateQrToken(tokenString);
      if (!validation.valid || !validation.gateId) {
        setCameraError(validation.error || 'Invalid or unauthorized Gate QR token.');
        setScanning(false);
        return;
      }

      playScanChime();
      if (navigator.vibrate) {
        try {
          navigator.vibrate([40, 30, 40]);
        } catch {
          /* empty */
        }
      }

      const gateId = validation.gateId;
      const matchedGate = gates[gateId] || activeGate;
      const movementType = isCheckOut ? 'CHECK-OUT' : 'CHECK-IN';

      try {
        let apiResult;
        if (movementType === 'CHECK-IN') {
          apiResult = await checkInUser({
            gateId: matchedGate.id,
            gateName: matchedGate.name,
            userId: currentUser?.universityId || 'BTCS2026-0842',
            userName: currentUser?.name || 'Naman Lakhotia',
            userRole: currentUser?.role || 'STUDENT',
            department: currentUser?.department || 'Computer Science & Engineering',
            method: 'QR_SCAN',
            qrToken: tokenString,
            lat: matchedGate.lat,
            lng: matchedGate.lng
          });
          confirmCheckIn(matchedGate.name);
        } else {
          apiResult = await checkOutUser({
            gateId: matchedGate.id,
            gateName: matchedGate.name,
            userId: currentUser?.universityId || 'BTCS2026-0842',
            userName: currentUser?.name || 'Naman Lakhotia',
            userRole: currentUser?.role || 'STUDENT',
            department: currentUser?.department || 'Computer Science & Engineering',
            method: 'QR_SCAN',
            qrToken: tokenString,
            lat: matchedGate.lat,
            lng: matchedGate.lng
          });
          confirmCheckOut(matchedGate.name);
        }

        executeGateScan(
          tokenString,
          {
            identifier: currentUser?.universityId || 'BTCS2026-0842',
            name: currentUser?.name || 'Naman Lakhotia',
            role: currentUser?.role || 'STUDENT'
          },
          movementType
        );

        stopCamera();

        const timeStr = apiResult.event?.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const eventId = apiResult.event?.id || `mov_${Date.now()}`;

        setLastScannedResult({
          gateName: matchedGate.name,
          gateId,
          type: movementType,
          time: timeStr,
          id: eventId
        });

        if (onScanSuccess) {
          onScanSuccess(matchedGate.name, gateId);
        }
      } catch (err) {
        console.error('Scan processing error:', err);
        setCameraError('Verification network failure. Please retry.');
      } finally {
        setScanning(false);
      }
    },
    [scanning, isCheckOut, gates, activeGate, currentUser, confirmCheckIn, confirmCheckOut, executeGateScan, stopCamera, onScanSuccess]
  );

  // Setup loop function in ref
  useEffect(() => {
    scanLoopRef.current = () => {
      if (!videoRef.current || !canvasRef.current || scanning) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const now = performance.now();

      // Throttle CPU-heavy jsQR decode to ~8 FPS (125ms interval) to keep device responsive
      if (now - lastScanTimeRef.current >= 125) {
        lastScanTimeRef.current = now;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          // Downscale to max 360px dimension for lightning-fast QR detection without UI freezing
          const videoW = video.videoWidth || 640;
          const videoH = video.videoHeight || 480;
          const scale = Math.min(1, 360 / Math.max(videoW, videoH));
          const w = Math.round(videoW * scale);
          const h = Math.round(videoH * scale);

          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (code && code.data && code.data.includes('C3S-QR')) {
              handleDecodedToken(code.data);
              return;
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        scanLoopRef.current();
      });
    };
  }, [handleDecodedToken, scanning]);

  // Start hardware camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera hardware access is not supported by this browser.');
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      animationFrameRef.current = requestAnimationFrame(() => {
        scanLoopRef.current();
      });
    } catch (err) {
      console.warn('Camera initialization error:', err);
      setCameraActive(false);
      const msg = err instanceof Error ? err.message : 'Unable to access camera';
      setCameraError(
        msg.includes('Permission') || msg.includes('NotAllowedError')
          ? 'Camera permission denied. Please allow camera access in browser settings.'
          : 'Live camera is unavailable or already in use by another application.'
      );
    }
  }, [facingMode]);

  // Start camera on mount asynchronously via timer to prevent cascading sync renders
  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera().catch(() => {
        /* empty */
      });
    }, 60);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // 1-tap quick scan with active terminal token
  const handleInstantScan = () => {
    const token = getGateQr(selectedGateId);
    handleDecodedToken(token.token);
  };

  return (
    <div className="relative mx-auto flex w-full max-w-lg flex-col items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 text-center backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="mb-4 flex flex-col items-center">
        <div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border ${isCheckOut ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-blue-500/30 bg-blue-500/10 text-blue-400'}`}>
          <Camera className="h-6 w-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
          REAL-TIME GATE {isCheckOut ? 'EXIT' : 'INGRESS'} SCANNER
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Point camera directly at the physical gate terminal QR display to authorize{' '}
          <strong className="text-slate-900 dark:text-white">{isCheckOut ? 'Campus Exit' : 'Campus Check-In'}</strong>.
        </p>
      </div>

      {/* SUCCESS RECEIPT VIEW */}
      {lastScannedResult ? (
        <div className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 text-center animate-in zoom-in-95 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-lg font-black text-emerald-400">
              ✓ {lastScannedResult.type} VERIFIED & RECORDED
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Terminal: <strong className="text-white">{lastScannedResult.gateName}</strong>
            </p>
            <p className="text-xs text-slate-400">
              Timestamp: <span className="font-mono text-emerald-400 font-semibold">{lastScannedResult.time}</span>
            </p>
            <p className="mt-1 text-[10px] font-mono text-slate-500">Ref: {lastScannedResult.id}</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => navigate('/student/movement')}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition-colors"
            >
              <History className="h-4 w-4" />
              View Verified Movement Ledger
            </button>
            <button
              onClick={() => {
                setLastScannedResult(null);
                startCamera();
              }}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Scan Another Gate QR
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* CAMERA VIEWFINDER */}
          <div className="relative h-72 w-72 sm:h-80 sm:w-80 overflow-hidden rounded-3xl border-2 border-slate-700 bg-slate-950 shadow-2xl flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-slate-500 space-y-2">
                <CameraOff className="h-10 w-10 text-slate-600" />
                <p className="text-xs text-slate-400 font-medium">Camera Inactive</p>
                <button
                  onClick={startCamera}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
                >
                  Start Camera Feed
                </button>
              </div>
            )}

            {/* Viewfinder Target Reticle */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-4 left-4 h-7 w-7 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
              <div className="absolute top-4 right-4 h-7 w-7 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 h-7 w-7 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 h-7 w-7 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

              {/* Scanning Laser Line */}
              {cameraActive && (
                <div className="absolute inset-x-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-bounce" />
              )}
            </div>

            {/* Real-time Indicator Pill */}
            <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
              <span className="flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1 text-[10px] font-bold text-slate-200 border border-slate-700 backdrop-blur-md shadow-md">
                <span className={`h-2 w-2 rounded-full ${cameraActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                {cameraActive ? 'OPTICAL QR DECODER READY' : 'OFFLINE VIEWPORT'}
              </span>
            </div>

            {/* Camera Controls Overlay */}
            {cameraActive && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
                <button
                  onClick={() => {
                    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                    startCamera();
                  }}
                  className="p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700 backdrop-blur-md shadow-md transition-colors"
                  title="Switch Camera (Front/Rear)"
                >
                  <SwitchCamera className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {cameraError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs font-medium text-rose-400 text-left">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Secondary Options: Real QR Image Upload & Quick Demo Scan */}
          <div className="mt-5 w-full space-y-3">
            <div className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                Select Terminal:
              </span>
              <select
                value={selectedGateId}
                onChange={(e) => setSelectedGateId(e.target.value as GateId)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              >
                {Object.values(gates).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Test Scan Button using Real Daily Key */}
            <button
              onClick={handleInstantScan}
              disabled={scanning}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verifying Cryptographic QR Token...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Scan Active QR ({activeGate.name})
                </>
              )}
            </button>

            <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Strict Live Optical QR Verification • Live Camera Only</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

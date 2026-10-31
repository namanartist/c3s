// src/components/safety/LiveWebcamFeed.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, AlertCircle, Video, ShieldAlert, CheckCircle2, Zap, Activity } from 'lucide-react';
import { useHumanDetection } from '@/hooks/useHumanDetection';
import { LiveDetectionOverlay } from './LiveDetectionOverlay';

interface LiveWebcamFeedProps {
  cameraId: string;
  camera?: any;
  onFallbackToRecorded?: () => void;
  className?: string;
}

export const LiveWebcamFeed: React.FC<LiveWebcamFeedProps> = ({
  cameraId,
  camera,
  onFallbackToRecorded,
  className = 'w-full h-full'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [permissionState, setPermissionState] = useState<'requesting' | 'granted' | 'denied'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [simulateCombat, setSimulateCombat] = useState<boolean>(false);

  // Human / Optical ML Detection on the live webcam frames
  const detection = useHumanDetection(
    videoRef,
    cameraId,
    permissionState === 'granted',
    {
      ...camera,
      simulateCombat
    }
  );

  const stopActiveStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const initCamera = async (deviceId?: string) => {
    setPermissionState('requesting');
    setErrorMessage(null);
    stopActiveStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam hardware API is not supported in this browser.');
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Enumerate other cameras if available
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (!selectedDeviceId && videoInputs.length > 0) {
          const activeTrack = stream.getVideoTracks()[0];
          const settings = activeTrack.getSettings();
          if (settings.deviceId) setSelectedDeviceId(settings.deviceId);
        }
      } catch (err) {
        console.warn('Could not enumerate video devices:', err);
      }

      setPermissionState('granted');
    } catch (err: any) {
      console.error('Failed to access device camera:', err);
      setPermissionState('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied by browser. Please allow camera permissions in browser site settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No physical camera or webcam device was detected on this computer.');
      } else {
        setErrorMessage(err.message || 'Unable to establish video stream from camera hardware.');
      }
    }
  };

  useEffect(() => {
    initCamera(selectedDeviceId || undefined);
    return () => {
      stopActiveStream();
    };
  }, [selectedDeviceId]);

  const handleToggleCombatSimulation = () => {
    setSimulateCombat(true);
    setTimeout(() => {
      setSimulateCombat(false);
    }, 5000);
  };

  const ml = detection.fight.mlFeatures;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-black ${className}`}>
      {/* 1. Live Streaming Video Canvas */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          permissionState === 'granted' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 2. Optical AI Overlay for Real-time Headcount & Altercation Telemetry */}
      {permissionState === 'granted' && (
        <>
          <LiveDetectionOverlay detection={detection} />

          {/* Active Live Hardware Feed Badge */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-red-600/95 text-white px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider shadow-lg shadow-red-600/40 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span>LIVE CAM-08 HARDWARE ACCESS</span>
          </div>

          {/* Top Right Controls: Camera switcher & Test Fight Trigger */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
            <button
              onClick={handleToggleCombatSimulation}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                simulateCombat
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-black/80 hover:bg-red-950/80 text-amber-300 border border-amber-500/30'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>{simulateCombat ? 'TEST ALERT ACTIVE' : 'TEST ALTERCATION ML'}</span>
            </button>

            {availableDevices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-black/80 border border-white/20 text-white text-[10px] font-mono rounded-lg px-2 py-1 backdrop-blur-md focus:outline-none cursor-pointer"
              >
                {availableDevices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Real-time ML Telemetry Strip at Bottom */}
          <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/80 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-300 backdrop-blur-md">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                RWF-2000 ML ACTIVE
              </span>
              <span className="text-slate-600">|</span>
              <span>JERK: <strong className={ml && ml.kineticJerk > 40 ? 'text-red-400' : 'text-slate-200'}>{ml?.kineticJerk || 0}%</strong></span>
              <span className="text-slate-600">|</span>
              <span>FLOW VAR: <strong className={ml && ml.opticalFlowVariance > 45 ? 'text-red-400' : 'text-slate-200'}>{ml?.opticalFlowVariance || 0}%</strong></span>
              <span className="text-slate-600">|</span>
              <span>LIMB VEL: <strong className="text-slate-200">{ml?.limbVelocity || 0}%</strong></span>
            </div>

            <div className="px-2.5 py-1 rounded-xl bg-black/80 border border-white/10 text-[10px] font-mono text-cyan-400 backdrop-blur-md">
              <span>{detection.fps || 30} FPS • 720p HD</span>
            </div>
          </div>
        </>
      )}

      {/* 3. Requesting Permission State */}
      {permissionState === 'requesting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-neutral-950/90 z-20">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">Connecting to Camera Hardware...</h4>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Please allow browser camera permissions when prompted to enable real-time CCTV optical analysis.
          </p>
        </div>
      )}

      {/* 4. Denied / Unavailable State */}
      {permissionState === 'denied' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-neutral-950/95 z-20 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Live Camera Access Not Granted</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {errorMessage || 'Unable to connect to your physical webcam device.'}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => initCamera(selectedDeviceId || undefined)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera</span>
            </button>
            {onFallbackToRecorded && (
              <button
                onClick={onFallbackToRecorded}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs font-bold transition-all cursor-pointer"
              >
                Switch to Recorded Stream
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

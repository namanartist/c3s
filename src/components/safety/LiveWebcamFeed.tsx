// src/components/safety/LiveWebcamFeed.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, Video, ShieldAlert, CheckCircle2, Zap, Activity, Volume2, VolumeX } from 'lucide-react';
import { useHumanDetection } from '@/hooks/useHumanDetection';
import { LiveDetectionOverlay } from './LiveDetectionOverlay';
import { globalFightDispatcher } from '@/lib/fightAlertDispatcher';
import { globalProctorAlarm } from '@/lib/proctorAlarmAudio';

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [permissionState, setPermissionState] = useState<'requesting' | 'granted' | 'denied'>('requesting');
  const [isSimulatedLanFeed, setIsSimulatedLanFeed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [simulateCombat, setSimulateCombat] = useState<boolean>(false);
  const [sosStatusText, setSosStatusText] = useState<string | null>(null);

  // Helper to compile real recorded video blob from live webcam
  const getRealRecordedVideoUrl = useCallback((): string | undefined => {
    if (recordedChunksRef.current.length > 0) {
      try {
        const mime = mediaRecorderRef.current?.mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        return URL.createObjectURL(blob);
      } catch {}
    }
    return undefined;
  }, []);

  // Human / Optical ML Detection on the live webcam frames
  const detection = useHumanDetection(
    videoRef,
    cameraId,
    permissionState === 'granted',
    {
      ...camera,
      simulateCombat,
      getRealVideoUrl: getRealRecordedVideoUrl
    }
  );

  const stopActiveStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
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

    const isCam08 = camera?.id === 'CAM-08' || camera?.id === 'cam_jubilee' || cameraId === 'CAM-08' || cameraId === 'cam_jubilee';

    try {
      // Browsers restrict navigator.mediaDevices on plain HTTP IP addresses (e.g. http://192.168.x.x:5173).
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.info('[LiveWebcamFeed]: Browser mediaDevices restricted over HTTP LAN IP.');
        if (isCam08) {
          // Camera 8 must strictly use hardware camera only — never load recorded incident video
          setIsSimulatedLanFeed(false);
          setPermissionState('denied');
          setErrorMessage('CAM-08 requires live hardware camera access. Enable camera permissions or open via localhost/HTTPS.');
          return;
        }

        setIsSimulatedLanFeed(true);
        setPermissionState('granted');
        if (videoRef.current) {
          videoRef.current.src = camera?.videoUrl || '/videos/cctv_recorded_incident.mp4';
          videoRef.current.loop = true;
          videoRef.current.muted = true;
          await videoRef.current.play().catch(() => {});
        }
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: { ideal: 'environment' }
            },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Initialize continuous real-evidence recorder on live camera stream
      try {
        let mimeType = 'video/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            mimeType = 'video/webm;codecs=vp8';
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
          }
          const rec = new MediaRecorder(stream, { mimeType });
          recordedChunksRef.current = [];
          rec.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
              // Retain sliding 8-second buffer of genuine camera frames
              if (recordedChunksRef.current.length > 8) {
                recordedChunksRef.current.shift();
              }
            }
          };
          rec.start(1000);
          mediaRecorderRef.current = rec;
        }
      } catch (recErr) {
        console.warn('Real MediaRecorder streaming unavailable:', recErr);
      }

      setIsSimulatedLanFeed(false);
      setPermissionState('granted');

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
    } catch (err: any) {
      console.warn('Physical camera unavailable:', err);
      if (isCam08) {
        // CAM-08 must NEVER fall back to recorded incident video
        setIsSimulatedLanFeed(false);
        setPermissionState('denied');
        setErrorMessage('CAM-08 Hardware Camera Offline. Please grant rear camera permission to stream.');
        return;
      }

      // Fallback for non-CAM-08 demo streams
      setIsSimulatedLanFeed(true);
      setPermissionState('granted');
      if (videoRef.current) {
        videoRef.current.src = camera?.videoUrl || '/videos/cctv_recorded_incident.mp4';
        videoRef.current.loop = true;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
    }
  };

  useEffect(() => {
    initCamera(selectedDeviceId || undefined);
    return () => {
      stopActiveStream();
    };
  }, [selectedDeviceId]);

  // LIVE SOS TRIGGER: Operator manually triggers emergency from live camera
  const handleTriggerLiveSos = () => {
    const camName = camera?.name || `Live Camera #${cameraId}`;
    const camLocation = camera?.location || 'Academic Core Sector';
    const realVideo = getRealRecordedVideoUrl();

    // 1. Dispatch through fight/emergency system with real camera video
    globalFightDispatcher.handleFightDetection({
      cameraId,
      cameraName: camName,
      location: camLocation,
      confidence: 100,
      videoElement: videoRef.current,
      videoUrl: realVideo || camera?.videoUrl || (camera?.id === 'CAM-08' ? undefined : '/videos/cctv_recorded_incident.mp4')
    });

    // 2. Trigger audible emergency alarm to Chief Proctor
    globalProctorAlarm.triggerAlarm(`Live SOS Triggered from ${camName}`);

    // 3. UI feedback
    setSosStatusText(`🚨 LIVE SOS BROADCASTED TO CHIEF PROCTOR & GUARDS!`);
    setTimeout(() => {
      setSosStatusText(null);
    }, 6000);
  };

  // AGGRESSIVE ACTIVITY TRIGGER
  const handleToggleCombatSimulation = () => {
    setSimulateCombat(true);
    const camName = camera?.name || `Live Camera #${cameraId}`;
    const camLocation = camera?.location || 'Surveillance Zone';
    const realVideo = getRealRecordedVideoUrl();

    globalFightDispatcher.handleFightDetection({
      cameraId,
      cameraName: camName,
      location: camLocation,
      confidence: 96,
      videoElement: videoRef.current,
      videoUrl: realVideo || camera?.videoUrl || (camera?.id === 'CAM-08' ? undefined : '/videos/cctv_recorded_incident.mp4')
    });

    globalProctorAlarm.triggerAlarm(`Aggressive Altercation Recognized at ${camName}`);

    setSosStatusText(`⚡ AGGRESSIVE ACTIVITY FLAGGED • PROCTOR ALARM ACTIVE!`);
    setTimeout(() => {
      setSimulateCombat(false);
      setSosStatusText(null);
    }, 6000);
  };

  const ml = detection.fight.mlFeatures;
  const isAutoFlagged =
    detection.fight.isFightDetected &&
    !detection.fight.isOnlyMovement &&
    detection.fight.confidence >= 65;

  // Automatically trigger proctor alert sound and UI banner on auto-detection
  useEffect(() => {
    if (isAutoFlagged) {
      const camName = camera?.name || `Live CCTV #${cameraId}`;
      globalProctorAlarm.triggerAlarm(`Aggression Auto-Detected at ${camName}`);
      setSosStatusText(`🚨 AUTO-FLAGGED: AGGRESSION DETECTED (${Math.round(detection.fight.confidence)}%) • SOS ACTIVE`);
    }
  }, [isAutoFlagged, camera?.name, cameraId, detection.fight.confidence]);

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

          {/* Active Live Hardware / Stream Badge */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-red-600/95 text-white px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider shadow-lg shadow-red-600/40 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>{isSimulatedLanFeed ? 'LAN IP STREAM • CAM ACTIVE' : 'LIVE WEBCAM HARDWARE'}</span>
            </div>

            {/* LIVE SOS TRIGGER BUTTON */}
            <button
              type="button"
              onClick={handleTriggerLiveSos}
              className="px-3 py-1 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-[10px] font-mono flex items-center gap-1.5 shadow-lg shadow-red-600/50 active:scale-95 transition-all cursor-pointer animate-pulse border border-white/20"
              title="Immediately broadcast Live SOS with CCTV telemetry to Chief Proctor"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>LIVE SOS</span>
            </button>
          </div>

          {/* Top Right Controls: Camera switcher & Test Fight Trigger */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
            <button
              onClick={handleToggleCombatSimulation}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                isAutoFlagged || simulateCombat
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-black/80 hover:bg-red-950/80 text-amber-300 border border-amber-500/30'
              }`}
              title="Aggressive combat altercation status & Proctor emergency alarm"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>
                {isAutoFlagged
                  ? `⚡ AUTO-FLAGGED (${Math.round(detection.fight.confidence)}%)`
                  : simulateCombat
                  ? 'AGGRESSION FLAGGED'
                  : 'FLAG AGGRESSIVE ACTIVITY'}
              </span>
            </button>

            {availableDevices.length > 1 && !isSimulatedLanFeed && (
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

          {/* Live SOS / Aggression Broadcast Confirmation Toast */}
          {sosStatusText && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-mono font-black shadow-2xl border border-white/30 animate-bounce">
              {sosStatusText}
            </div>
          )}

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
            Synchronizing live video feed and initializing Kaggle RWF-2000 optical flow models.
          </p>
        </div>
      )}
    </div>
  );
};

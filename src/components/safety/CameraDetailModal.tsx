import React, { useState, useRef } from 'react';
import { Camera, X, Users, ShieldAlert, Video, Zap } from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { getCrowdBadgeStyle } from '@/lib/crowdMonitoringApi';
import { useHumanDetection } from '@/hooks/useHumanDetection';
import { LiveDetectionOverlay } from './LiveDetectionOverlay';
import { LiveWebcamFeed } from './LiveWebcamFeed';
import { globalFightDispatcher } from '@/lib/fightAlertDispatcher';
import { globalProctorAlarm } from '@/lib/proctorAlarmAudio';

export const CameraDetailModal: React.FC = () => {
  const selectedCamera = useSafetyStore((s) => s.selectedCamera);
  const setSelectedCamera = useSafetyStore((s) => s.setSelectedCamera);
  const isLiveCapable = selectedCamera?.isLiveCameraSupported || selectedCamera?.id === 'cam_jubilee' || selectedCamera?.id === 'CAM-08' || selectedCamera?.id === 'cam_gate_1' || selectedCamera?.id === 'CAM-01';

  const [streamMode, setStreamMode] = useState<'video' | 'hud' | 'webcam'>(
    selectedCamera?.id === 'CAM-08' || selectedCamera?.id === 'cam_jubilee' ? 'webcam' : 'video'
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSrc = selectedCamera
    ? selectedCamera.videoUrl ||
      (selectedCamera.id.includes('2') || selectedCamera.id.includes('4') || selectedCamera.id.includes('6')
        ? '/videos/crowd2.mp4'
        : '/videos/crowd.mp4')
    : '/videos/crowd.mp4';

  const detection = useHumanDetection(
    videoRef,
    selectedCamera?.id,
    streamMode === 'video',
    selectedCamera || undefined
  );

  if (!selectedCamera) return null;

  const currentCount = detection.count || selectedCamera.crowdCount || 4;
  const currentDensity = detection.density || selectedCamera.crowdDensity || 'low';
  const badgeStyle = getCrowdBadgeStyle(currentDensity);
  const hasFight = selectedCamera.fightDetected || detection.fight.isFightDetected;
  const fightConfidence = selectedCamera.fightConfidence || Math.round(detection.fight.confidence);

  const [sosNotice, setSosNotice] = useState<string | null>(null);

  const handleTriggerLiveSos = () => {
    globalFightDispatcher.handleFightDetection({
      cameraId: selectedCamera.id,
      cameraName: selectedCamera.name,
      location: selectedCamera.location,
      confidence: 100,
      videoElement: videoRef.current,
      videoUrl: selectedCamera.videoUrl || (selectedCamera.id === 'CAM-08' || selectedCamera.id === 'cam_jubilee' ? undefined : '/videos/cctv_recorded_incident.mp4')
    });
    globalProctorAlarm.triggerAlarm(`Live Camera SOS Triggered from ${selectedCamera.name}`);
    setSosNotice('🚨 LIVE SOS DISPATCHED TO CHIEF PROCTOR & GUARDS');
    setTimeout(() => setSosNotice(null), 5000);
  };

  const handleTriggerAggression = () => {
    globalFightDispatcher.handleFightDetection({
      cameraId: selectedCamera.id,
      cameraName: selectedCamera.name,
      location: selectedCamera.location,
      confidence: 95,
      videoElement: videoRef.current,
      videoUrl: selectedCamera.videoUrl || (selectedCamera.id === 'CAM-08' || selectedCamera.id === 'cam_jubilee' ? undefined : '/videos/cctv_recorded_incident.mp4')
    });
    globalProctorAlarm.triggerAlarm(`Aggressive Altercation Flagged at ${selectedCamera.name}`);
    setSosNotice('⚡ AGGRESSIVE ALTERCATION FLAGGED • PROCTOR ALARM ACTIVE');
    setTimeout(() => setSosNotice(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#070B14]/95 p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 flex flex-col max-h-[94vh] transition-colors">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-600 px-2.5 py-1 text-xs font-mono font-black text-white shadow-md shadow-blue-500/20">
              {selectedCamera.id}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {selectedCamera.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ONLINE</span>
                </span>
                {hasFight && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-600 text-white shadow-md animate-pulse flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>FIGHT: {fightConfidence}% CONF</span>
                  </span>
                )}
                {isLiveCapable && !hasFight && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-600/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>HARDWARE CAM</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {selectedCamera.location} • <span className="font-mono">{selectedCamera.zone}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Stream Mode Segmented Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {isLiveCapable && (
                <button
                  type="button"
                  onClick={() => setStreamMode('webcam')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    streamMode === 'webcam'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>LIVE WEBCAM</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setStreamMode('video')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  streamMode === 'video'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                RECORDED
              </button>
              <button
                type="button"
                onClick={() => setStreamMode('hud')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  streamMode === 'hud'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                HUD
              </button>
            </div>

            <button
              type="button"
              onClick={handleTriggerAggression}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Flag aggressive altercation activity"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">FLAG AGGRESSION</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerLiveSos}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="Broadcast Live SOS and sound Proctor emergency alarm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>LIVE SOS</span>
            </button>

            <button
              onClick={() => setSelectedCamera(null)}
              className="rounded-xl p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video / Live Optical Feed Container */}
        <div className="relative mt-3.5 h-80 sm:h-[420px] w-full rounded-2xl bg-black flex flex-col items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
          {streamMode === 'webcam' ? (
            <LiveWebcamFeed
              cameraId={selectedCamera.id}
              camera={selectedCamera}
              onFallbackToRecorded={() => setStreamMode('video')}
            />
          ) : streamMode === 'video' ? (
            selectedCamera.youtubeEmbedUrl ? (
              <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-black">
                <iframe
                  src={`${selectedCamera.youtubeEmbedUrl}?autoplay=1&mute=0&rel=0`}
                  title={selectedCamera.name}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
                <LiveDetectionOverlay detection={detection} />
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <LiveDetectionOverlay detection={detection} />
              </div>
            )
          ) : (
            <div className="w-full h-full relative flex flex-col items-center justify-center p-6 text-center bg-slate-950">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
              <Camera className="h-12 w-12 text-blue-400 animate-pulse mb-3" />
              <p className="font-mono text-sm text-slate-100 font-bold">TACTICAL RADAR SURVEILLANCE HUD</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Optical sensor tracking active on {selectedCamera.location} ({selectedCamera.zone}).
              </p>
              <div className="mt-4 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
                Real-time Headcount: <strong>{currentCount === 1 ? '1 Person Detected' : `${currentCount} Persons Detected`}</strong>
              </div>
            </div>
          )}

          {/* SOS Broadcast Confirmation Toast */}
          {sosNotice && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-mono font-black shadow-2xl border border-white/30 animate-bounce">
              {sosNotice}
            </div>
          )}
        </div>

        {/* Live Crowd Telemetry & Information Cards */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 transition-colors">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-semibold tracking-wider">Live Human Count</span>
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1 text-base">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">
                {currentCount === 1 ? '1 Person' : `${currentCount} People`}
              </span>
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 transition-colors">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-semibold tracking-wider">Fight / Threat AI</span>
            <p className={`font-mono font-bold mt-1 text-sm ${hasFight ? 'text-red-600 dark:text-red-400 font-black animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {hasFight ? `🚨 FIGHT: ${fightConfidence}%` : 'SECURE (0%)'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 transition-colors">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-semibold tracking-wider">Crowd Density</span>
            <div className="mt-1">
              <span className={`inline-block px-2.5 py-0.5 rounded-lg font-mono font-bold text-[10px] ${badgeStyle.bg}`}>
                {badgeStyle.label}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 transition-colors flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-semibold tracking-wider">AI Classification</span>
              <p className="font-mono text-cyan-600 dark:text-cyan-400 font-bold mt-1 truncate max-w-[150px]">
                {selectedCamera.latencyMs ?? 34}ms (Real-time)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

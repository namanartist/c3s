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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-blue-600 px-2 py-0.5 text-xs font-mono font-bold text-white shadow-md">
              {selectedCamera.id}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                  {selectedCamera.name}
                </h3>
                {hasFight && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-600/90 text-white shadow animate-pulse flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>FIGHT: {fightConfidence}% CONF</span>
                  </span>
                )}
                {isLiveCapable && !hasFight && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-600/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>LIVE HARDWARE ACCESS</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {selectedCamera.location} • {selectedCamera.zone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerLiveSos}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-red-600/40 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="Broadcast Live SOS and sound Proctor emergency alarm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>LIVE SOS</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerAggression}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Flag aggressive combat or fight activity"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">FLAG AGGRESSION</span>
            </button>

            <button
              onClick={() => setSelectedCamera(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video / Live Optical Feed Container */}
        <div className="relative mt-3 h-72 sm:h-96 w-full rounded-2xl bg-black flex flex-col items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
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
            <div className="w-full h-full relative flex flex-col items-center justify-center p-4 text-center">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
              <Camera className="h-10 w-10 text-blue-400/70 animate-pulse mb-2" />
              <p className="font-mono text-xs text-slate-200 font-bold">TACTICAL HUD RADAR STREAM</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedCamera.location} • {selectedCamera.zone}
              </p>
              <div className="mt-3 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
                Real-time Headcount: <strong>{currentCount} Persons Detected</strong>
              </div>
            </div>
          )}

          {/* SOS Broadcast Confirmation Toast */}
          {sosNotice && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-mono font-black shadow-2xl border border-white/30 animate-bounce">
              {sosNotice}
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/80 p-1 rounded-xl border border-white/20 backdrop-blur-md">
            {isLiveCapable && (
              <button
                onClick={() => setStreamMode('webcam')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  streamMode === 'webcam'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Video className="w-3 h-3" />
                <span>LIVE WEBCAM</span>
              </button>
            )}
            <button
              onClick={() => setStreamMode('video')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                streamMode === 'video'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              RECORDED
            </button>
            <button
              onClick={() => setStreamMode('hud')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                streamMode === 'hud'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              HUD
            </button>
          </div>
        </div>

        {/* Live Crowd Telemetry & Quick Action Bar */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Live Human Count</span>
            <p className="font-bold text-white flex items-center gap-1.5 mt-0.5 text-base">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-mono font-black">{currentCount} Detected</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Fight / Threat AI</span>
            <p className={`font-mono font-bold mt-0.5 text-sm ${hasFight ? 'text-red-400 font-black animate-pulse' : 'text-emerald-300'}`}>
              {hasFight ? `🚨 FIGHT: ${fightConfidence}%` : 'SECURE (0%)'}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Campus Crowd Density</span>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] ${badgeStyle.bg}`}>
              {badgeStyle.label}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Optical AI Latency</span>
              <p className="font-mono text-emerald-400 font-bold mt-0.5">{selectedCamera.latencyMs ?? 34}ms (Real-time)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

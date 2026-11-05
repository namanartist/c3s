import { useState, useRef } from 'react';
import { Camera, X, Users, RefreshCw, ShieldAlert, Video } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { StatusBadge } from './StatusBadge';
import type { C3SCamera } from '@/lib/mock-data/cameras';
import {
  useCrowdMonitoring,
  getCrowdBadgeStyle
} from '@/lib/crowdMonitoringApi';
import { useHumanDetection } from '@/hooks/useHumanDetection';
import { LiveDetectionOverlay } from '@/components/safety/LiveDetectionOverlay';
import { LiveWebcamFeed } from '@/components/safety/LiveWebcamFeed';
import { globalFightDispatcher } from '@/lib/fightAlertDispatcher';
import { globalProctorAlarm } from '@/lib/proctorAlarmAudio';

interface LiveCameraModalViewProps {
  videoSrc: string;
  cameraId: string;
  camera?: C3SCamera;
}

const LiveCameraModalView: React.FC<LiveCameraModalViewProps> = ({
  videoSrc,
  cameraId,
  camera
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detection = useHumanDetection(videoRef, cameraId, true, camera);

  return (
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
  );
};

const LiveStreamModalView: React.FC<{ camera: C3SCamera }> = ({ camera }) => {
  const detection = useHumanDetection(null, camera.id, true, camera);

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-black">
      <iframe
        src={`${camera.youtubeEmbedUrl}?autoplay=1&mute=0&rel=0`}
        title={camera.name}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      <LiveDetectionOverlay detection={detection} />
    </div>
  );
};

export const CCTVGrid: React.FC = () => {
  const { cameras } = useC3SStore();
  const [selectedCam, setSelectedCam] = useState<C3SCamera | null>(null);
  const [modalStreamMode, setModalStreamMode] = useState<'stream' | 'hud' | 'webcam'>('stream');

  const { health, isOnline, isRefreshing, syncCrowdData } = useCrowdMonitoring();

  const onlineCount = cameras.filter((c) => c.status === 'ONLINE').length;
  const offlineCount = cameras.filter((c) => c.status === 'OFFLINE').length;
  const activeFightCams = cameras.filter((c) => c.fightDetected).length;

  const handleOpenCam = (cam: C3SCamera, forceMode?: 'stream' | 'hud' | 'webcam') => {
    setSelectedCam(cam);
    const isSoleLiveCam = cam.id === 'CAM-08';
    if (forceMode) {
      setModalStreamMode(forceMode);
    } else if (isSoleLiveCam) {
      setModalStreamMode('webcam');
    } else {
      setModalStreamMode('stream');
    }
  };

  return (
    <div className="space-y-4">
      {/* Matrix Header & Crowd Link Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              CAMPUS SURVEILLANCE MATRIX
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              OPTICAL CV &amp; FIGHT AI
            </span>
            {activeFightCams > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/90 text-white shadow-lg shadow-red-600/40 animate-pulse flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-white" />
                <span>{activeFightCams} ALERTS DETECTED</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time human headcount, violent altercation recognition &amp; live hardware camera feeds.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div
            onClick={() => syncCrowdData()}
            title="Crowd Monitoring Engine status"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/60 font-mono cursor-pointer hover:border-blue-500/50 transition-all"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300">
              CROWD ENGINE:{' '}
              <strong className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>
                {isOnline ? 'LINKED' : 'STANDBY'}
              </strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400 font-bold">
              👥 {health.totalCrowdInCampus || cameras.reduce((acc, c) => acc + (c.crowdCount || 0), 0)} Total
            </span>
            <RefreshCw className={`h-3 w-3 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              {onlineCount} ONLINE
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-semibold font-mono">{offlineCount} OFFLINE</span>
          </div>
        </div>
      </div>

      {/* Grid of Cameras */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cameras.map((cam) => {
          const isOnline = cam.status === 'ONLINE';
          const density = (cam.crowdDensity?.toLowerCase() as 'low' | 'moderate' | 'high' | 'critical') || 'low';
          const badgeStyle = getCrowdBadgeStyle(density);
          const hasFight = cam.fightDetected;
          const isLiveCapable = cam.id === 'CAM-08';

          return (
            <div
              key={cam.id}
              onClick={() => handleOpenCam(cam)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border transition-all hover:shadow-xl flex flex-col justify-between ${
                isLiveCapable
                  ? 'border-blue-500/80 bg-blue-950/20 hover:border-blue-400 hover:shadow-blue-950/40 ring-1 ring-blue-500/30'
                  : hasFight
                  ? 'border-red-500/80 bg-red-950/20 hover:border-red-400 hover:shadow-red-950/50 ring-1 ring-red-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500/60 hover:shadow-lg dark:hover:shadow-blue-950/30 shadow-xs dark:shadow-none'
              }`}
            >
              <div
                className={`relative h-44 w-full bg-gradient-to-br ${cam.thumbnailColor} p-3 flex flex-col justify-between overflow-hidden`}
              >
                {isOnline && (
                  cam.youtubeEmbedUrl ? (
                    <iframe
                      src={`${cam.youtubeEmbedUrl}?autoplay=1&mute=1&controls=0&loop=1&playlist=${(cam.youtubeEmbedUrl || '').split('embed/')[1] || ''}&modestbranding=1`}
                      title={cam.name}
                      className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-70 group-hover:opacity-95 transition-opacity"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <video
                      src={cam.videoUrl || (cam.id.includes('2') || cam.id.includes('4') || cam.id.includes('6') ? '/videos/crowd2.mp4' : '/videos/crowd.mp4')}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none"
                    />
                  )
                )}

                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)'
                  }}
                />

                <div className="z-10 flex items-center justify-between text-[11px]">
                  <span className="rounded bg-black/70 px-2 py-0.5 font-mono font-bold text-slate-200 backdrop-blur-md border border-white/10">
                    {cam.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-black/70 px-2 py-0.5 font-mono font-bold text-emerald-400 backdrop-blur-md flex items-center gap-1 border border-emerald-500/30">
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>{cam.crowdCount ?? 3} CROWD</span>
                    </span>
                    <StatusBadge status={cam.status} size="sm" pulse={isOnline} />
                  </div>
                </div>

                {/* Central Status Indicator */}
                <div className="z-10 flex flex-col items-center justify-center text-center gap-1">
                  {isLiveCapable ? (
                    <span className="rounded-full bg-red-600/90 backdrop-blur-md px-3 py-1 text-[10px] font-mono font-black tracking-wider text-white uppercase border border-red-400 shadow-lg shadow-red-600/50 flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>LIVE CAMERA ACCESS</span>
                    </span>
                  ) : hasFight ? (
                    <span className="rounded-full bg-red-600/90 backdrop-blur-md px-3 py-1 text-[10px] font-mono font-black tracking-wider text-white uppercase border border-red-400 shadow-lg shadow-red-600/60 animate-pulse flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>FIGHT DETECTED • {cam.fightConfidence || 92}% CONF</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-mono font-bold tracking-widest text-emerald-300 uppercase border border-emerald-500/40">
                      {isOnline ? '● LIVE AI SENTINEL' : 'NO SIGNAL'}
                    </span>
                  )}
                </div>

                <div className="z-10 flex items-center justify-between text-[10px] text-slate-400">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold backdrop-blur-md ${hasFight ? 'bg-red-950/80 text-red-300 border border-red-500/40' : badgeStyle.bg}`}>
                    {hasFight ? 'ALTERCATION ZONE' : badgeStyle.label}
                  </span>
                  <span className="rounded bg-black/70 px-1.5 py-0.5 font-mono text-emerald-400 border border-white/10 backdrop-blur-md">
                    {cam.fps} FPS
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{cam.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate">{cam.zone}</span>
                    <span>•</span>
                    <span className={`font-mono text-[10px] shrink-0 ${hasFight ? 'text-red-400 font-bold' : 'text-blue-400'}`}>
                      {hasFight ? `FIGHT: ${cam.fightConfidence || 92}%` : cam.resolution}
                    </span>
                  </div>
                </div>

                {isLiveCapable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCam(cam, 'webcam');
                    }}
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Live Cam</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Camera Live Stream & Telemetry Modal */}
      {selectedCam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-600 px-2.5 py-0.5 text-xs font-mono font-bold text-white shadow-md shadow-blue-600/30">
                  {selectedCam.id}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-sm sm:max-w-md">
                  {selectedCam.name}
                </h3>
                <StatusBadge status={selectedCam.status} size="sm" />
                {selectedCam.fightDetected && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-red-600 text-white shadow-lg animate-pulse flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>FIGHT: {selectedCam.fightConfidence || 92}%</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    globalFightDispatcher.handleFightDetection({
                      cameraId: selectedCam.id,
                      cameraName: selectedCam.name,
                      location: selectedCam.location,
                      confidence: 100,
                      videoUrl: selectedCam.videoUrl || '/videos/cctv_recorded_incident.mp4'
                    });
                    globalProctorAlarm.triggerAlarm(`Live SOS Triggered from ${selectedCam.name}`);
                  }}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-red-600/40 active:scale-95 transition-all cursor-pointer animate-pulse"
                  title="Broadcast Live SOS and sound Proctor emergency alarm"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>LIVE SOS</span>
                </button>

                <button
                  onClick={() => setSelectedCam(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Video Viewport */}
            <div className="relative mt-4 h-80 sm:h-96 w-full rounded-2xl bg-black flex flex-col items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
              <div
                className="pointer-events-none absolute inset-0 opacity-20 z-10"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)'
                }}
              />

              {modalStreamMode === 'webcam' ? (
                <LiveWebcamFeed
                  cameraId={selectedCam.id}
                  camera={selectedCam}
                  onFallbackToRecorded={() => setModalStreamMode('stream')}
                />
              ) : modalStreamMode === 'stream' ? (
                selectedCam.youtubeEmbedUrl ? (
                  <LiveStreamModalView camera={selectedCam} />
                ) : (
                  <LiveCameraModalView
                    videoSrc={selectedCam.videoUrl || (selectedCam.id.includes('2') || selectedCam.id.includes('4') || selectedCam.id.includes('6') ? '/videos/crowd2.mp4' : '/videos/crowd.mp4')}
                    cameraId={selectedCam.id}
                    camera={selectedCam}
                  />
                )
              ) : (
                <div className="w-full h-full relative flex flex-col items-center justify-center p-6 text-center">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
                  <Camera className="h-14 w-14 text-blue-500/60 animate-pulse mb-2" />
                  <p className="font-mono text-sm text-slate-200 font-bold">
                    C3S ENCRYPTED RTSP STREAM (TACTICAL HUD)
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Node IP: {selectedCam.ip} • Resolution: {selectedCam.resolution} • PTZ: Active
                  </p>
                </div>
              )}

              {/* Mode switcher tabs */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/80 p-1 rounded-xl border border-white/15 backdrop-blur-md">
                {selectedCam.id === 'CAM-08' && (
                  <button
                    onClick={() => setModalStreamMode('webcam')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      modalStreamMode === 'webcam'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>LIVE WEBCAM</span>
                  </button>
                )}
                <button
                  onClick={() => setModalStreamMode('stream')}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    modalStreamMode === 'stream'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  RECORDED
                </button>
                <button
                  onClick={() => setModalStreamMode('hud')}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    modalStreamMode === 'hud'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  HUD
                </button>
              </div>
            </div>

            {/* Telemetry and Metadata Grid */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Live Human Count</span>
                <p className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>{selectedCam.crowdCount ?? 3} People</span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Fight / Threat AI</span>
                <p className={`text-sm font-bold mt-0.5 ${selectedCam.fightDetected ? 'text-red-400 font-mono font-black animate-pulse' : 'text-emerald-400'}`}>
                  {selectedCam.fightDetected ? `🚨 FIGHT: ${selectedCam.fightConfidence || 92}%` : 'SECURE (0%)'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Zone / Area</span>
                <p className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                  {selectedCam.zone} ({selectedCam.location})
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">AI Classification</span>
                <p className="text-xs font-bold text-slate-300 mt-0.5">
                  {selectedCam.lastMotion || 'Perimeter Active'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

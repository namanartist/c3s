import { useState, useRef } from 'react';
import { Camera, X, Users, RefreshCw } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { StatusBadge } from './StatusBadge';
import type { C3SCamera } from '@/lib/mock-data/cameras';
import {
  useCrowdMonitoring,
  getCameraVideoFeedUrl,
  getCrowdBadgeStyle
} from '@/lib/crowdMonitoringApi';
import { useHumanDetection } from '@/hooks/useHumanDetection';
import { LiveDetectionOverlay } from '@/components/safety/LiveDetectionOverlay';

interface LiveCameraModalViewProps {
  videoSrc: string;
  cameraId: string;
  resolution: string;
  fps: number;
}

const LiveCameraModalView: React.FC<LiveCameraModalViewProps> = ({
  videoSrc,
  cameraId,
  resolution,
  fps
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detection = useHumanDetection(videoRef, cameraId, true);

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

export const CCTVGrid: React.FC = () => {
  const { cameras } = useC3SStore();
  const [selectedCam, setSelectedCam] = useState<C3SCamera | null>(null);
  const [modalFeedError, setModalFeedError] = useState(false);
  const [modalStreamMode, setModalStreamMode] = useState<'stream' | 'hud'>('stream');

  const { health, isOnline, isRefreshing, syncCrowdData } = useCrowdMonitoring();

  const onlineCount = cameras.filter((c) => c.status === 'ONLINE').length;
  const offlineCount = cameras.filter((c) => c.status === 'OFFLINE').length;

  const handleOpenCam = (cam: C3SCamera) => {
    setSelectedCam(cam);
    setModalFeedError(false);
    setModalStreamMode('stream');
  };

  return (
    <div className="space-y-4">
      {/* Matrix Header & Crowd Link Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">
              CAMPUS SURVEILLANCE MATRIX
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              AI SURVEILLANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            12 AI-monitored HD & 4K PTZ optical nodes linked with Crowd Monitoring Engine.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Crowd Monitoring Service Status Badge */}
          <div
            onClick={() => syncCrowdData()}
            title="Crowd Monitoring Engine status (C:\Users\naman\Crowd_monitoring)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/60 font-mono cursor-pointer hover:border-blue-500/50 transition-all"
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
          const density = (cam.crowdDensity?.toLowerCase() as any) || 'low';
          const badgeStyle = getCrowdBadgeStyle(density);

          return (
            <div
              key={cam.id}
              onClick={() => handleOpenCam(cam)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 transition-all hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-950/30 flex flex-col justify-between"
            >
              <div
                className={`relative h-44 w-full bg-gradient-to-br ${cam.thumbnailColor} p-3 flex flex-col justify-between overflow-hidden`}
              >
                {isOnline && (
                  <video
                    src={cam.id.includes('2') || cam.id.includes('4') || cam.id.includes('6') ? '/videos/crowd2.mp4' : '/videos/crowd.mp4'}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none"
                  />
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
                    {/* Live Crowd Count Badge */}
                    <span className="rounded bg-black/70 px-2 py-0.5 font-mono font-bold text-emerald-400 backdrop-blur-md flex items-center gap-1 border border-emerald-500/30">
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>{cam.crowdCount ?? 3} CROWD</span>
                    </span>
                    <StatusBadge status={cam.status} size="sm" pulse={isOnline} />
                  </div>
                </div>

                <div className="z-10 flex flex-col items-center justify-center text-center">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-mono font-bold tracking-widest text-emerald-300 uppercase border border-emerald-500/40">
                    {isOnline ? '● LIVE AI SENTINEL' : 'NO SIGNAL'}
                  </span>
                </div>

                <div className="z-10 flex items-center justify-between text-[10px] text-slate-400">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold backdrop-blur-md ${badgeStyle.bg}`}>
                    {badgeStyle.label}
                  </span>
                  <span className="rounded bg-black/70 px-1.5 py-0.5 font-mono text-emerald-400 border border-white/10 backdrop-blur-md">
                    {cam.fps} FPS
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-200 truncate">{cam.name}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{cam.zone}</span>
                  <span className="font-mono text-[10px] text-blue-400">{cam.resolution}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Camera Live Stream & Telemetry Modal */}
      {selectedCam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-600 px-2.5 py-0.5 text-xs font-mono font-bold text-white shadow-md shadow-blue-600/30">
                  {selectedCam.id}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedCam.name}</h3>
                <StatusBadge status={selectedCam.status} size="sm" />
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  👥 REAL CROWD: {selectedCam.crowdCount ?? 4}
                </span>
              </div>
              <button
                onClick={() => setSelectedCam(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Video Viewport: Real moving video playback with tactical HUD */}
            <div className="relative mt-4 h-80 sm:h-96 w-full rounded-2xl bg-black flex flex-col items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
              <div
                className="pointer-events-none absolute inset-0 opacity-20 z-10"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)'
                }}
              />

              {modalStreamMode === 'stream' ? (
                <LiveCameraModalView
                  videoSrc={selectedCam.id.includes('2') || selectedCam.id.includes('4') || selectedCam.id.includes('6') ? '/videos/crowd2.mp4' : '/videos/crowd.mp4'}
                  cameraId={selectedCam.id}
                  resolution={selectedCam.resolution}
                  fps={selectedCam.fps}
                />
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

              {/* Mode switcher overlay */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                <button
                  onClick={() => setModalStreamMode((m) => (m === 'stream' ? 'hud' : 'stream'))}
                  className="px-3 py-1 rounded-lg font-mono text-xs font-bold bg-black/70 border border-white/15 text-slate-200 hover:bg-black/90 transition-all cursor-pointer backdrop-blur-md"
                >
                  {modalStreamMode === 'stream' ? 'TACTICAL HUD' : 'LIVE VIDEO FEED'}
                </button>
              </div>
            </div>

            {/* Telemetry and Metadata Grid */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Live Crowd Count</span>
                <p className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>{selectedCam.crowdCount ?? 3} People</span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Congestion Level</span>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {selectedCam.crowdDensity || 'LOW DENSITY'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Zone / Area</span>
                <p className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                  {selectedCam.zone} ({selectedCam.location})
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">AI Detection Status</span>
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
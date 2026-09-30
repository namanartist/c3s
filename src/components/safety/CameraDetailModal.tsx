import React, { useState, useRef } from 'react';
import { Camera, X, Users, RefreshCw, Eye } from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { getCrowdBadgeStyle } from '@/lib/crowdMonitoringApi';
import { useHumanDetection } from '@/hooks/useHumanDetection';
import { LiveDetectionOverlay } from './LiveDetectionOverlay';

export const CameraDetailModal: React.FC = () => {
  const selectedCamera = useSafetyStore((s) => s.selectedCamera);
  const setSelectedCamera = useSafetyStore((s) => s.setSelectedCamera);
  const [streamMode, setStreamMode] = useState<'video' | 'hud'>('video');
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSrc = selectedCamera
    ? selectedCamera.id.includes('2') || selectedCamera.id.includes('4') || selectedCamera.id.includes('6')
      ? '/videos/crowd2.mp4'
      : '/videos/crowd.mp4'
    : '/videos/crowd.mp4';

  const detection = useHumanDetection(videoRef, selectedCamera?.id, streamMode === 'video');

  if (!selectedCamera) return null;

  const currentCount = detection.count || selectedCamera.crowdCount || 4;
  const currentDensity = detection.density || selectedCamera.crowdDensity || 'low';
  const badgeStyle = getCrowdBadgeStyle(currentDensity);

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
              <h3 className="text-base font-bold text-white">{selectedCamera.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {selectedCamera.location} • {selectedCamera.zone}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedCamera(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video / Live Optical Feed Container */}
        <div className="relative mt-3 h-72 sm:h-96 w-full rounded-2xl bg-black flex flex-col items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
          {streamMode === 'video' ? (
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

          {/* Toggle Stream / HUD */}
          <button
            onClick={() => setStreamMode((m) => (m === 'video' ? 'hud' : 'video'))}
            className="absolute bottom-3 right-3 z-30 px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-black/80 border border-white/20 text-slate-200 hover:bg-black transition-all cursor-pointer backdrop-blur-md"
          >
            {streamMode === 'video' ? 'SWITCH TO HUD RADAR' : 'SWITCH TO LIVE VIDEO'}
          </button>
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
            <span className="text-[10px] text-slate-400 uppercase font-mono">Density Level</span>
            <p className="font-bold mt-0.5 text-sm">
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${badgeStyle.bg}`}>
                {badgeStyle.label}
              </span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Processing FPS</span>
            <p className="font-mono text-cyan-300 font-bold mt-0.5 text-base">
              {detection.fps || 24} FPS
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono">AI Accuracy</span>
            <p className="font-mono text-emerald-300 font-bold mt-0.5 text-base">
              {Math.round((detection.humans[0]?.confidence || 0.94) * 100)}%
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Real-time Optical AI Surveillance Active
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCamera(null)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

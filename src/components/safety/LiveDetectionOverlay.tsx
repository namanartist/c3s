// src/components/safety/LiveDetectionOverlay.tsx
import React from 'react';
import type { DetectionResult } from '@/lib/humanVisionEngine';
import { Users, Eye, Activity } from 'lucide-react';

interface LiveDetectionOverlayProps {
  detection: DetectionResult;
  showBoxes?: boolean;
}

export const LiveDetectionOverlay: React.FC<LiveDetectionOverlayProps> = ({
  detection,
  showBoxes = true
}) => {
  const { count, humans, density, fps } = detection;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Top Left Live Status Telemetry Pill */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>OPTICAL AI: {count} HUMANS</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 font-mono text-[10px]">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>{fps} FPS</span>
        </div>
      </div>

      {/* Top Right Live Congestion Indicator */}
      <div className="absolute top-3 right-3">
        <span
          className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-black tracking-wider uppercase backdrop-blur-md border shadow-lg ${
            density === 'critical'
              ? 'bg-rose-600/80 border-rose-400 text-white animate-bounce'
              : density === 'high'
              ? 'bg-amber-600/80 border-amber-400 text-white'
              : density === 'moderate'
              ? 'bg-blue-600/80 border-blue-400 text-white'
              : 'bg-emerald-600/70 border-emerald-400 text-white'
          }`}
        >
          {density} DENSITY
        </span>
      </div>

      {/* Real-time Human Bounding Boxes */}
      {showBoxes &&
        humans.map((human) => {
          return (
            <div
              key={human.id}
              className="absolute transition-all duration-150 ease-out border-2 border-emerald-400/90 bg-emerald-400/10 rounded-lg shadow-sm"
              style={{
                left: `${human.x}%`,
                top: `${human.y}%`,
                width: `${human.width}%`,
                height: `${human.height}%`
              }}
            >
              {/* Corner targeting marks */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />

              {/* Tag Label with Confidence */}
              <div className="absolute -top-5 left-0 px-1.5 py-0.2 rounded bg-black/85 backdrop-blur-sm border border-emerald-400/50 text-[9px] font-mono font-bold text-emerald-300 flex items-center gap-1 whitespace-nowrap shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{human.label}</span>
                <span className="text-white font-extrabold">[{Math.round(human.confidence * 100)}%]</span>
              </div>
            </div>
          );
        })}

      {/* Bottom Center Active Scan Line */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>REAL HUMAN DETECTION &amp; COUNT ENGINE ACTIVE</span>
      </div>
    </div>
  );
};

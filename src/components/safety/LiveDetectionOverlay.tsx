// src/components/safety/LiveDetectionOverlay.tsx
import React from 'react';
import type { DetectionResult } from '@/lib/humanVisionEngine';
import { ShieldAlert, Users, Activity, Flame } from 'lucide-react';

interface LiveDetectionOverlayProps {
  detection: DetectionResult;
  showBoxes?: boolean;
}

export const LiveDetectionOverlay: React.FC<LiveDetectionOverlayProps> = ({
  detection,
  showBoxes = true
}) => {
  const { count, humans, density, fps, fight } = detection;
  const isFight = fight?.isFightDetected;
  const fightConfidence = Math.round(fight?.confidence ?? 0);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* 1. TOP STATUS BAR */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
        {/* Left Telemetry Pill */}
        <div className="flex items-center gap-2">
          {fight?.classificationState === 'CONFIRMED_AGGRESSION' || isFight ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/90 backdrop-blur-md border border-red-500 text-white font-mono text-xs font-black shadow-xl shadow-red-950/80 animate-pulse">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>CONFIRMED PHYSICAL AGGRESSION</span>
              <span className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[11px] font-black tracking-wider">
                {fightConfidence}% CONFIDENCE
              </span>
              {fight?.sustainedDurationMs != null && fight.sustainedDurationMs > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-black/60 text-amber-300 text-[10px] font-mono font-bold">
                  Sustained: {(fight.sustainedDurationMs / 1000).toFixed(1)}s / 2.0s
                </span>
              )}
            </div>
          ) : fight?.classificationState === 'SUSPICIOUS' || fightConfidence >= 50 ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-950/85 backdrop-blur-md border border-amber-500 text-amber-200 font-mono text-[11px] font-bold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>SUSPICIOUS KINETICS: ANALYZING SEQUENCE</span>
              <span className="text-amber-500 font-normal">|</span>
              <span className="text-amber-300 font-bold">{fightConfidence}%</span>
            </div>
          ) : detection.movement?.isMoving ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-cyan-500/50 text-cyan-300 font-mono text-[11px] font-bold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>NORMAL MOVEMENT: {detection.movement.statusLabel}</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-emerald-400 font-bold">NO AGGRESSION</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>OPTICAL AI: {count} HUMANS</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-emerald-400 font-bold">PEACEFUL</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 font-mono text-[10px]">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>{fps} FPS</span>
          </div>
        </div>

        {/* Right Status / Threat Badge */}
        <div className="flex items-center gap-2">
          {(fight?.classificationState === 'CONFIRMED_AGGRESSION' || isFight) && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-900/80 backdrop-blur-md border border-red-400 text-red-100 font-mono text-[11px] font-extrabold shadow-lg animate-bounce">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>CONFIRMED: {fightConfidence}%</span>
            </div>
          )}

          <span
            className={`px-2.5 py-1 rounded-xl font-mono text-[10px] font-black tracking-wider uppercase backdrop-blur-md border shadow-lg ${
              fight?.classificationState === 'CONFIRMED_AGGRESSION' || isFight
                ? 'bg-red-600/90 border-red-300 text-white shadow-red-600/50'
                : fight?.classificationState === 'SUSPICIOUS' || fightConfidence >= 50
                ? 'bg-amber-600/80 border-amber-400 text-white'
                : density === 'critical'
                ? 'bg-rose-600/80 border-rose-400 text-white'
                : density === 'high'
                ? 'bg-amber-600/80 border-amber-400 text-white'
                : density === 'moderate'
                ? 'bg-blue-600/80 border-blue-400 text-white'
                : 'bg-emerald-600/70 border-emerald-400 text-white'
            }`}
          >
            {fight?.classificationState === 'CONFIRMED_AGGRESSION' || isFight
              ? 'CRITICAL THREAT'
              : fight?.classificationState === 'SUSPICIOUS' || fightConfidence >= 50
              ? 'SUSPICIOUS ACTIVITY'
              : `${density} DENSITY`}
          </span>
        </div>
      </div>

      {/* 2. REAL-TIME BOUNDING BOXES */}
      {showBoxes &&
        humans.map((human) => {
          const isCombatant = human.isFighting || human.role === 'combatant';
          const isBystander = human.role === 'bystander';
          const individualConfidence = human.fightConfidence || fightConfidence;

          return (
            <div
              key={human.id}
              className={`absolute transition-all duration-150 ease-out rounded-lg ${
                isCombatant
                  ? 'border-2 border-red-500 bg-red-600/15 ring-2 ring-red-500/40 shadow-xl shadow-red-950/60'
                  : isBystander
                  ? 'border-2 border-amber-400/90 bg-amber-400/10'
                  : 'border-2 border-emerald-400/90 bg-emerald-400/10'
              }`}
              style={{
                left: `${human.x}%`,
                top: `${human.y}%`,
                width: `${human.width}%`,
                height: `${human.height}%`
              }}
            >
              {/* Corner targeting marks */}
              <div
                className={`absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 ${
                  isCombatant ? 'border-red-400' : isBystander ? 'border-amber-300' : 'border-white'
                }`}
              />
              <div
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 ${
                  isCombatant ? 'border-red-400' : isBystander ? 'border-amber-300' : 'border-white'
                }`}
              />
              <div
                className={`absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 ${
                  isCombatant ? 'border-red-400' : isBystander ? 'border-amber-300' : 'border-white'
                }`}
              />
              <div
                className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 ${
                  isCombatant ? 'border-red-400' : isBystander ? 'border-amber-300' : 'border-white'
                }`}
              />

              {/* Tag Label with Confidence Percentage */}
              <div
                className={`absolute -top-6 left-0 px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-mono font-bold flex items-center gap-1.5 whitespace-nowrap shadow-lg border ${
                  isCombatant
                    ? 'bg-red-950/90 border-red-500 text-red-200'
                    : isBystander
                    ? 'bg-slate-950/90 border-amber-500/60 text-amber-300'
                    : 'bg-black/85 border-emerald-400/50 text-emerald-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCombatant ? 'bg-red-400 animate-ping' : isBystander ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="font-extrabold">{human.label}</span>
                {isCombatant ? (
                  <span className="rounded bg-red-600 px-1 text-[9px] font-black text-white">
                    FIGHT: {individualConfidence}%
                  </span>
                ) : (
                  <span className="text-slate-300 font-extrabold">[{Math.round(human.confidence * 100)}%]</span>
                )}
              </div>

              {/* Specific Action Pill on Combatant */}
              {isCombatant && human.action && (
                <div className="absolute -bottom-5 left-0 px-1.5 py-0.5 rounded bg-black/90 border border-red-500/50 text-[9px] font-mono font-bold text-red-300 whitespace-nowrap shadow">
                  ⚡ {human.action}
                </div>
              )}
            </div>
          );
        })}

      {/* 3. BOTTOM TELEMETRY BAR */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-mono text-slate-300 flex items-center gap-3 shadow-2xl">
        <span
          className={`w-2 h-2 rounded-full ${isFight ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`}
        />
        <span>
          AI ENGINE: <strong>{isFight ? 'PHYSICAL ALTERCATION IN PROGRESS' : 'SURVEILLANCE RADAR SECURE'}</strong>
        </span>
        {isFight ? (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-black">
              FIGHT CONFIDENCE: <strong>{fightConfidence}%</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300 font-bold">DISPATCH: NOTIFIED</span>
          </>
        ) : (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">FIGHT CHANCE: &lt; 5%</span>
          </>
        )}
      </div>
    </div>
  );
};

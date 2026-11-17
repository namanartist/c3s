// src/components/safety/LiveDetectionOverlay.tsx
import React from 'react';
import type { DetectionResult } from '@/lib/humanVisionEngine';
import { ShieldAlert, Users, Activity, Flame, Radio } from 'lucide-react';
import { SAFETY_THRESHOLDS } from '@/config/safetyThresholds';

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
  // The confidence is now the calibrated probability, so it can legitimately
  // sit anywhere in the range. It used to be clamped into [85, 100] for a
  // detection and [0, 5] otherwise, so the HUD could never show a
  // mid-range value.
  const fightConfidence = Math.round(fight?.confidence ?? 0);
  const isMetadataDerived = Boolean(detection.modelMeta?.isMetadataDerived);
  const sustainedSeconds = fight?.sustainedDurationMs ? fight.sustainedDurationMs / 1000 : 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* 1. TOP STATUS BAR */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
        {/* Left Telemetry Pill */}
        <div className="flex items-center gap-2">
          {isFight ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/90 backdrop-blur-md border border-red-500 text-white font-mono text-xs font-black shadow-xl shadow-red-950/80">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>VIOLENT ALTERCATION DETECTED</span>
              <span className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[11px] font-black tracking-wider">
                {fightConfidence}% CONFIDENCE
              </span>
              {sustainedSeconds > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-black/60 text-amber-300 text-[10px] font-mono font-bold">
                  Sustained {sustainedSeconds.toFixed(1)}s /{' '}
                  {(SAFETY_THRESHOLDS.CONFIRMATION_MS / 1000).toFixed(1)}s to dispatch
                </span>
              )}
            </div>
          ) : detection.movement?.isMoving ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-cyan-500/50 text-cyan-300 font-mono text-[11px] font-bold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>MOVEMENT: {detection.movement.statusLabel}</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-emerald-400 font-bold">
                AGGRESSION SCORE {fightConfidence}%
              </span>
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

          {/* Engine Telemetry Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/80 backdrop-blur-md border border-cyan-500/60 text-cyan-200 font-mono text-[10px] font-bold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{isMetadataDerived ? 'METADATA FEED' : 'OPTICAL AI'}</span>
            <span className="text-cyan-400/50">|</span>
            <span>{detection.persons?.length ?? count} Persons</span>
            {(detection.harmfulObjects?.length ?? (detection.objects?.length ?? 0)) > 0 ? (
              <>
                <span className="text-rose-400/80">|</span>
                <span className="text-rose-300 font-bold">
                  ⚠️ {detection.harmfulObjects?.length ?? detection.objects?.length} Threat Object
                  {(detection.harmfulObjects?.length ?? detection.objects?.length ?? 1) > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <>
                <span className="text-emerald-400/50">|</span>
                <span className="text-emerald-300 font-semibold">0 Threats</span>
              </>
            )}
          </div>
        </div>

        {/* Right Status / Threat Badge */}
        <div className="flex items-center gap-2">
          {isFight && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-900/80 backdrop-blur-md border border-red-400 text-red-100 font-mono text-[11px] font-extrabold shadow-lg">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>AGGRESSION {fightConfidence}%</span>
            </div>
          )}

          <span
            className={`px-2.5 py-1 rounded-xl font-mono text-[10px] font-black tracking-wider uppercase backdrop-blur-md border shadow-lg ${
              isFight
                ? 'bg-red-600/90 border-red-300 text-white shadow-red-600/50'
                : density === 'critical'
                ? 'bg-rose-600/80 border-rose-400 text-white'
                : density === 'high'
                ? 'bg-amber-600/80 border-amber-400 text-white'
                : density === 'moderate'
                ? 'bg-blue-600/80 border-blue-400 text-white'
                : 'bg-emerald-600/70 border-emerald-400 text-white'
            }`}
          >
            {isFight ? 'CRITICAL THREAT' : `${density} DENSITY`}
          </span>
        </div>
      </div>

      {/* 2. REAL-TIME BOUNDING BOXES */}
      {showBoxes &&
        humans.map((human) => {
          const isHarmfulObject = human.type === 'harmful_object' || (human.type === 'object' && human.role === 'threat_object');
          const isCombatant = !isHarmfulObject && (human.isFighting || human.role === 'combatant');
          const isBystander = !isHarmfulObject && human.role === 'bystander';
          const individualConfidence = human.fightConfidence || fightConfidence;

          return (
            <div
              key={`${human.type}-${human.id}`}
              className={`absolute transition-all duration-150 ease-out rounded-lg ${
                isHarmfulObject
                  ? 'border-2 border-dashed border-red-500 bg-red-950/40 ring-2 ring-red-500/50 shadow-xl shadow-red-950/70 animate-pulse'
                  : isCombatant
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
                  isHarmfulObject ? 'border-red-400' : isCombatant ? 'border-red-400' : isBystander ? 'border-amber-300' : 'border-white'
                }`}
              />
              <div
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 ${
                  isHarmfulObject ? 'border-red-400' : isCombatant ? 'border-red-400' : isBystander ? 'border-amber-300' : 'border-white'
                }`}
              />
              <div
                className={`absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 ${
                  isHarmfulObject ? 'border-red-400' : isCombatant ? 'border-red-400' : isBystander ? 'border-amber-300' : 'border-white'
                }`}
              />
              <div
                className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 ${
                  isHarmfulObject ? 'border-red-400' : isCombatant ? 'border-red-400' : isBystander ? 'border-amber-300' : 'border-white'
                }`}
              />

              {/* Tag Label with Confidence Percentage */}
              <div
                className={`absolute -top-6 left-0 px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-mono font-bold flex items-center gap-1.5 whitespace-nowrap shadow-lg border ${
                  isHarmfulObject
                    ? 'bg-red-950/95 border-red-500 text-red-100 shadow-red-900/50'
                    : isCombatant
                    ? 'bg-red-950/90 border-red-500 text-red-200'
                    : isBystander
                    ? 'bg-slate-950/90 border-amber-500/60 text-amber-300'
                    : 'bg-black/85 border-emerald-400/50 text-emerald-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isHarmfulObject ? 'bg-red-500 animate-ping' : isCombatant ? 'bg-red-400 animate-ping' : isBystander ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="font-extrabold">
                  {isHarmfulObject ? `⚠️ HARMFUL OBJECT: ${human.classLabel.toUpperCase()} [ID: #${human.id}]` : human.label}
                </span>
                {isCombatant ? (
                  <span className="rounded bg-red-600 px-1 text-[9px] font-black text-white">
                    FIGHT: {individualConfidence}%
                  </span>
                ) : isHarmfulObject ? (
                  <span className="rounded bg-red-700 px-1 text-[9px] font-black text-white">
                    THREAT: {Math.round(human.confidence * 100)}%
                  </span>
                ) : (
                  <span className="text-slate-300 font-extrabold">[{Math.round(human.confidence * 100)}%]</span>
                )}
              </div>

              {/* Specific Action Pill on Combatant or Harmful Object */}
              {isCombatant && human.action ? (
                <div className="absolute -bottom-5 left-0 px-1.5 py-0.5 rounded bg-black/90 border border-red-500/50 text-[9px] font-mono font-bold text-red-300 whitespace-nowrap shadow">
                  ⚡ {human.action}
                </div>
              ) : isHarmfulObject && human.action ? (
                <div className="absolute -bottom-5 left-0 px-1.5 py-0.5 rounded bg-red-950/90 border border-red-500/70 text-[9px] font-mono font-bold text-red-200 whitespace-nowrap shadow">
                  🚨 {human.action}
                </div>
              ) : null}
            </div>
          );
        })}

      {/* 3. BOTTOM TELEMETRY BAR */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-mono text-slate-300 flex items-center gap-3 shadow-2xl">
        <span
          className={`w-2 h-2 rounded-full ${isFight ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`}
        />
        <span>
          C3S AGGRESSION AI:{' '}
          <strong>
            {isFight ? 'PHYSICAL ALTERCATION IN PROGRESS' : 'SECTOR MONITORING ACTIVE'}
          </strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className={isFight ? 'text-rose-400 font-black' : 'text-slate-300'}>
          AGGRESSION SCORE: <strong>{fightConfidence}%</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">
          DISPATCH THRESHOLD: <strong>{SAFETY_THRESHOLDS.SOS_CONFIDENCE * 100}%</strong>
        </span>
        {isMetadataDerived && (
          <>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <Radio className="w-3 h-3" aria-hidden="true" />
              METADATA FEED - NO PIXEL ACCESS
            </span>
          </>
        )}
      </div>
    </div>
  );
};

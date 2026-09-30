import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { useNavigate } from 'react-router-dom';

interface SOSButtonProps {
  onTrigger?: () => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onTrigger }) => {
  const navigate = useNavigate();
  const { sosActive, triggerSos, cancelSos, sosStatus, sosRespondersNotified, sosIncidentId, advanceSosStatus } = useC3SStore();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const HOLD_DURATION = 1400;

  const startHold = () => {
    if (sosActive) return;
    setHolding(true);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        setHolding(false);
        setProgress(0);
        triggerSos();
        if (onTrigger) onTrigger();
        navigate('/student/sos');
      }
    }, 50);
  };

  const cancelHold = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setHolding(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (sosActive) {
    return (
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-rose-500/50 bg-rose-950/30 p-6 text-center backdrop-blur-xl shadow-2xl animate-pulse">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/50">
          <ShieldAlert className="h-8 w-8 animate-bounce" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-rose-400 tracking-wider">🚨 SOS ACTIVE</h2>
        <div className="mt-2 space-y-1 text-sm text-slate-300">
          <p className="font-mono text-xs text-rose-300">Incident: {sosIncidentId || 'C3S-INC-00192'}</p>
          <p className="text-xs text-slate-400">Location: Demo Campus Location (Academic Block A)</p>
          <p className="text-xs text-slate-400">Responders: {sosRespondersNotified} notified</p>
        </div>
        <div className="mt-4 w-full rounded-xl border border-rose-500/30 bg-rose-950/60 p-3">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">STATUS</p>
          <p className="text-lg font-black text-white">{sosStatus}</p>
        </div>
        <div className="mt-5 flex w-full flex-col gap-2">
          <button
            onClick={() => advanceSosStatus()}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-blue-500 active:scale-95"
          >
            Advance Status ({sosStatus})
          </button>
          <button
            onClick={() => cancelSos()}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700"
          >
            [ CANCEL SOS ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex items-center justify-center">
        <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="6" fill="transparent" />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="#ef4444"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * progress) / 100}
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        </svg>

        <button
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          className={`absolute flex h-36 w-36 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white shadow-2xl transition-all duration-200 select-none ${
            holding ? 'scale-95 shadow-rose-600/80' : 'hover:scale-105 shadow-rose-600/40 hover:shadow-rose-600/60'
          }`}
        >
          <ShieldAlert className="h-10 w-10 animate-pulse" />
          <span className="mt-1 text-2xl font-black tracking-widest uppercase">SOS</span>
          <span className="text-[9px] font-semibold tracking-wider text-rose-200 uppercase">
            {holding ? 'HOLDING...' : 'PRESS & HOLD'}
          </span>
        </button>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs font-bold tracking-wider text-slate-300 uppercase">PRESS & HOLD TO ACTIVATE</p>
        <p className="text-[11px] text-slate-400">Location: <span className="text-emerald-400 font-semibold">READY (±8m)</span></p>
      </div>
    </div>
  );
};
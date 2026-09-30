import React, { useState } from 'react';
import { RefreshCw, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';

export const GateQRDisplay: React.FC = () => {
  const { gates, selectedGateId, setSelectedGateId, regenerateGateQr } = useC3SStore();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentGate = gates.find((g) => g.id === selectedGateId) || gates[0];

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      regenerateGateQr(currentGate.id);
      setIsRegenerating(false);
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(currentGate.qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center max-w-xl mx-auto">
      <div className="mb-6 w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">DAILY GATE TERMINAL</p>
          <h2 className="text-2xl font-black text-slate-100 uppercase">{currentGate.name}</h2>
        </div>

        <div className="relative">
          <select
            value={selectedGateId}
            onChange={(e) => setSelectedGateId(e.target.value)}
            className="cursor-pointer appearance-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 pr-9 text-xs font-bold text-slate-200 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            {gates.map((gate) => (
              <option key={gate.id} value={gate.id}>
                {gate.name} ({gate.code})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">▼</div>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-blue-500/40 bg-white p-6 shadow-2xl shadow-blue-950/40 transition-transform hover:scale-[1.02]">
        <div className={`relative transition-opacity ${isRegenerating ? 'opacity-30' : 'opacity-100'}`}>
          <svg className="h-64 w-64 text-slate-950" viewBox="0 0 100 100" fill="currentColor">
            <rect x="5" y="5" width="26" height="26" fill="black" rx="2" />
            <rect x="9" y="9" width="18" height="18" fill="white" rx="1" />
            <rect x="13" y="13" width="10" height="10" fill="black" />

            <rect x="69" y="5" width="26" height="26" fill="black" rx="2" />
            <rect x="73" y="9" width="18" height="18" fill="white" rx="1" />
            <rect x="77" y="13" width="10" height="10" fill="black" />

            <rect x="5" y="69" width="26" height="26" fill="black" rx="2" />
            <rect x="9" y="73" width="18" height="18" fill="white" rx="1" />
            <rect x="13" y="77" width="10" height="10" fill="black" />

            <rect x="35" y="10" width="5" height="5" />
            <rect x="45" y="10" width="5" height="5" />
            <rect x="55" y="10" width="5" height="5" />
            <rect x="40" y="20" width="10" height="5" />
            <rect x="55" y="20" width="5" height="10" />

            <rect x="10" y="40" width="8" height="5" />
            <rect x="25" y="40" width="12" height="6" />
            <rect x="42" y="38" width="16" height="16" fill="#2563eb" rx="2" />
            <path d="M 50,42 L 55,45 L 55,50 C 55,53 50,56 50,56 C 50,56 45,53 45,50 L 45,45 Z" fill="white" />

            <rect x="65" y="40" width="10" height="6" />
            <rect x="80" y="40" width="10" height="6" />
            <rect x="35" y="60" width="10" height="8" />
            <rect x="50" y="65" width="15" height="6" />
            <rect x="70" y="60" width="8" height="12" />
            <rect x="85" y="70" width="6" height="15" />
            <rect x="38" y="78" width="20" height="6" />
            <rect x="65" y="80" width="15" height="8" />
          </svg>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          {currentGate.qrToken.slice(0, 24)}...
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          QR STATUS: 🟢 ACTIVE
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>29 SEPTEMBER 2026</span>
        </div>
        <div className="text-slate-400">
          Expires: <span className="font-bold text-slate-200">11:59 PM</span>
        </div>
      </div>

      <div className="mt-6 grid w-full grid-cols-3 gap-3 border-t border-slate-800 pt-5 text-center">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-[11px] text-slate-400 uppercase">Check-In</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{currentGate.checkInCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-[11px] text-slate-400 uppercase">Check-Out</p>
          <p className="mt-1 text-xl font-bold text-blue-400">{currentGate.checkOutCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-[11px] text-slate-400 uppercase">Inside Now</p>
          <p className="mt-1 text-xl font-bold text-amber-400">{currentGate.currentlyInside}</p>
        </div>
      </div>

      <div className="mt-6 flex w-full flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? 'Generating New Token...' : 'Regenerate Demo QR'}
        </button>
        <button
          onClick={handleCopy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/20 active:scale-95"
        >
          {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <ShieldCheck className="h-4 w-4" />}
          {copied ? 'Copied Token!' : 'Copy Hash'}
        </button>
      </div>
    </div>
  );
};
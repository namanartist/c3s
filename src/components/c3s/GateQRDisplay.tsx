import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, ShieldCheck, CheckCircle2, Download, Copy, Maximize2 } from 'lucide-react';
import QRCode from 'qrcode';
import { useC3SStore } from '@/store/c3sStore';
import { useGateStore } from '@/store/gateStore';
import type { GateId } from '@/types/gate';

export const GateQRDisplay: React.FC = () => {
  const { gates, selectedGateId, setSelectedGateId, regenerateGateQr } = useC3SStore();
  const { getGateQr, rotateGateQr } = useGateStore();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const defaultFallbackGate = {
    id: 'gate-01',
    name: 'Gate 1 - Main Campus Gate',
    code: 'G1-MAIN',
    status: 'OPEN' as const,
    currentGateKeeper: 'Ramesh Singh',
    keeperId: 'GK-01',
    checkInCount: 1420,
    checkOutCount: 980,
    currentlyInside: 3480,
    activeAlerts: 0,
    qrToken: 'TOKEN_G1_20261104'
  };

  const currentGate = gates.find((g) => g.id === selectedGateId) || gates[0] || defaultFallbackGate;

  // Derive active token from store or gateStore
  const gateId = (currentGate.id.startsWith('GATE-') ? currentGate.id : `GATE-${currentGate.id.toUpperCase().replace('GATE_', '')}`) as GateId;
  const activeTokenObj = getGateQr(gateId) || { token: currentGate.qrToken };
  const tokenString = activeTokenObj?.token || currentGate.qrToken || 'TOKEN_GATE_MAIN';

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(tokenString, {
      width: 340,
      margin: 2,
      color: {
        dark: '#030712',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate real QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [tokenString]);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      rotateGateQr(gateId, 'Gate Keeper Lead', 'Routine gate rotation / refresh');
      regenerateGateQr(currentGate.id);
      setIsRegenerating(false);
    }, 500);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(tokenString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `C3S_${currentGate.name.replace(/\s+/g, '_')}_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`flex flex-col items-center rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center max-w-xl mx-auto transition-all ${fullscreen ? 'fixed inset-4 z-50 max-w-none justify-center' : ''}`}>
      <div className="mb-6 w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AUTHORITATIVE GATE TERMINAL</p>
          <h2 className="text-2xl font-black text-slate-100 uppercase">{currentGate.name}</h2>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Toggle Fullscreen Kiosk Mode"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Real Generated QR Code Card */}
      <div className="relative flex flex-col items-center justify-center rounded-2xl border-4 border-blue-500/30 bg-white p-5 shadow-2xl shadow-blue-950/60 transition-transform hover:scale-[1.01]">
        <div className={`relative transition-opacity ${isRegenerating ? 'opacity-30' : 'opacity-100'}`}>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`${currentGate.name} Real QR Code`}
              className="h-64 w-64 rounded-lg object-contain shadow-sm select-none"
            />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center text-xs font-mono text-slate-500">
              Generating High-Density QR...
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-900">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="truncate max-w-[220px]">{tokenString}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          CRYPTOGRAPHIC TOKEN ACTIVE
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>DAILY ROTATION AT 00:00 UTC</span>
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? 'Regenerating QR...' : 'Rotate Daily Key'}
        </button>
        <button
          onClick={handleCopy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-xs font-bold text-slate-300 transition-all hover:bg-slate-700 active:scale-95"
        >
          {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied Token!' : 'Copy Token'}
        </button>
        <button
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95"
        >
          <Download className="h-4 w-4" />
          Download QR
        </button>
      </div>
    </div>
  );
};

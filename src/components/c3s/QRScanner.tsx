import React, { useState } from 'react';
import { Scan, QrCode, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QRScannerProps {
  onScanSuccess?: (gateName: string) => void;
  targetGateName?: string;
  isCheckOut?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, targetGateName = 'Main Gate', isCheckOut = false }) => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scannedGate, setScannedGate] = useState<string | null>(null);

  const handleSimulatedScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScannedGate(targetGateName);
      if (onScanSuccess) {
        onScanSuccess(targetGateName);
      } else {
        navigate(isCheckOut ? '/student/check-out' : '/student/check-in');
      }
    }, 1100);
  };

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-center backdrop-blur-xl shadow-2xl">
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
          <Scan className="h-6 w-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">SCAN GATE QR</h2>
        <p className="mt-1 text-xs text-slate-400">Scan the QR displayed at your current campus gate ({targetGateName}).</p>
      </div>

      <div className="relative h-72 w-72 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-950 shadow-inner flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
        <div className="absolute top-3 left-3 h-6 w-6 border-t-2 border-l-2 border-blue-400" />
        <div className="absolute top-3 right-3 h-6 w-6 border-t-2 border-r-2 border-blue-400" />
        <div className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-blue-400" />
        <div className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-blue-400" />

        <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-xl border border-dashed border-blue-500/50 bg-blue-500/5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#3b82f6] animate-[bounce_2s_infinite]" />
          <QrCode className="h-24 w-24 text-slate-600 opacity-60" />
          <span className="mt-2 text-[11px] font-medium tracking-wider text-blue-400 uppercase">
            {scanning ? 'Verifying Token...' : 'Align Gate QR'}
          </span>
        </div>

        <div className="absolute top-3 inset-x-0 flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            LIVE SCANNER VIEWPORT
          </span>
        </div>
      </div>

      {scannedGate && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Verified QR Token for {scannedGate}
        </div>
      )}

      <div className="mt-6 w-full space-y-3">
        <button
          onClick={handleSimulatedScan}
          disabled={scanning}
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 active:scale-95 disabled:opacity-50"
        >
          {scanning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Validating QR Signature...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Demo Scan ({targetGateName})
            </>
          )}
        </button>
        <p className="text-[11px] text-slate-500">Simulates high-speed AES-256 campus gate QR verification.</p>
      </div>
    </div>
  );
};
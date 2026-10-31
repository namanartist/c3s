import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { QRScanner } from '@/components/c3s/QRScanner';
import { useC3SStore } from '@/store/c3sStore';
import { DoorOpen, LogIn, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentScanPage() {
  const navigate = useNavigate();
  const { isInsideCampus } = useC3SStore();
  const [mode, setMode] = useState<'AUTO' | 'CHECK-IN' | 'CHECK-OUT'>('AUTO');

  const isCheckOut = mode === 'AUTO' ? isInsideCampus : mode === 'CHECK-OUT';

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => navigate('/student')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1 text-xs">
            <button
              onClick={() => setMode('AUTO')}
              className={`rounded-lg px-3 py-1.5 font-bold transition-all ${mode === 'AUTO' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              Auto ({isInsideCampus ? 'Exit' : 'Ingress'})
            </button>
            <button
              onClick={() => setMode('CHECK-IN')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold transition-all ${mode === 'CHECK-IN' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Check-In
            </button>
            <button
              onClick={() => setMode('CHECK-OUT')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold transition-all ${mode === 'CHECK-OUT' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              <DoorOpen className="h-3.5 w-3.5" />
              Check-Out
            </button>
          </div>
        </div>

        <QRScanner isCheckOut={isCheckOut} />
      </div>
    </AppShell>
  );
}

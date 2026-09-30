import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { CheckCircle2, DoorOpen, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

export default function StudentCheckOutPage() {
  const navigate = useNavigate();
  const { confirmCheckOut } = useC3SStore();
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    confirmCheckOut('Jubilee Gate');
    setConfirmed(true);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-lg py-8">
        {!confirmed ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center backdrop-blur-xl shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DoorOpen className="h-8 w-8" />
            </div>

            <h2 className="mt-4 text-2xl font-black text-slate-100">CHECK-OUT</h2>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-400">
              ✓ EXIT QR SCANNED
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-left text-sm">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-slate-400 text-xs">Gate:</span>
                <span className="font-bold text-white">Jubilee Gate</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Time:</span>
                <span className="font-bold text-white">05:38 PM</span>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-95"
            >
              [ CONFIRM CHECK-OUT ]
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-blue-500/40 bg-blue-950/20 p-8 text-center backdrop-blur-xl shadow-2xl animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/40">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h2 className="mt-4 text-2xl font-black text-blue-400">✓ CHECK-OUT SUCCESSFUL</h2>
            <p className="mt-2 text-sm text-slate-200">You are now marked OUTSIDE campus.</p>
            <p className="text-xs text-slate-400">Location tracking status has ended.</p>

            <button
              onClick={() => navigate('/student')}
              className="mt-8 w-full rounded-xl bg-slate-800 py-3.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
            >
              Return to Student Dashboard
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { useC3SStore } from '@/store/c3sStore';
import { useNavigate } from 'react-router-dom';

export default function AdminGatesPage() {
  const navigate = useNavigate();
  const { gates } = useC3SStore();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase">GATE MANAGEMENT</h1>
          <p className="text-xs text-slate-400">Three-gate architecture control, gatekeeper assignments, and throughput metrics.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {gates.map((g) => (
            <div key={g.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">{g.name}</h3>
                <StatusBadge status={g.status} />
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Gate Keeper:</span><span className="font-semibold text-slate-200">{g.currentGateKeeper}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">QR Status:</span><StatusBadge status={g.qrStatus} size="sm" /></div>
                <div className="flex justify-between"><span className="text-slate-400">Today's Entries:</span><span className="font-bold text-emerald-400">{g.checkInCount}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Today's Exits:</span><span className="font-bold text-blue-400">{g.checkOutCount}</span></div>
              </div>

              <div className="mt-6 flex flex-col gap-2 border-t border-slate-800 pt-4">
                <button
                  onClick={() => navigate('/gate-keeper/qr')}
                  className="rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500"
                >
                  [ View Gate QR ]
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
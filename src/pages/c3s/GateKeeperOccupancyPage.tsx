import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { MOCK_ANALYTICS } from '@/lib/mock-data/analytics';
import { useC3SStore } from '@/store/c3sStore';

export default function GateKeeperOccupancyPage() {
  const { gates } = useC3SStore();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase">GATE OCCUPANCY BREAKDOWN</h1>
          <p className="text-xs text-slate-400">Turnstile traffic metrics and gate throughput.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {gates.map((g) => (
            <div key={g.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">{g.name}</h3>
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-mono text-blue-400">{g.code}</span>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Check-In:</span>
                  <span className="font-bold text-emerald-400">{g.checkInCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Check-Out:</span>
                  <span className="font-bold text-blue-400">{g.checkOutCount}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-2 text-sm">
                  <span className="font-semibold text-slate-300">Net Flow Inside:</span>
                  <span className="font-black text-white">{g.currentlyInside}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
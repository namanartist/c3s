import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { useC3SStore } from '@/store/c3sStore';
import { RotateCcw, Shield, Moon, Sun, Smartphone, Bell, Check } from 'lucide-react';

export default function C3SSettingsPage() {
  const { resetAllDemoData } = useC3SStore();

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase">C3S PREFERENCES & DEMO SETTINGS</h1>
          <p className="text-xs text-slate-400">Configure notifications, campus telemetry, and reset prototype states.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <p className="text-sm font-bold text-white">Reset Demo Environment</p>
              <p className="text-xs text-slate-400">Clears localStorage state and resets all simulated incidents and gates.</p>
            </div>
            <button
              onClick={() => {
                resetAllDemoData();
                alert('Demo state reset to default!');
              }}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-500"
            >
              <RotateCcw className="h-4 w-4" /> Reset All Demo Data
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <p className="text-sm font-bold text-white">Theme Mode</p>
              <p className="text-xs text-slate-400">Command Center Dark (Recommended) / High-Contrast Light.</p>
            </div>
            <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-bold text-blue-400">
              Dark Mode (Default)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">High-Precision GPS Simulation</p>
              <p className="text-xs text-slate-400">Emulate ±8m satellite geofence inside MITS campus boundaries.</p>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              ENABLED
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
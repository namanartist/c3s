import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatCard } from '@/components/c3s/StatCard';
import { MOCK_ANALYTICS } from '@/lib/mock-data/analytics';
import { Users, DoorOpen, Activity, BarChart3 } from 'lucide-react';

export default function ControlRoomOccupancyPage() {
  const { totalOccupancy, breakdown, gatesSummary, hourlyTraffic } = MOCK_ANALYTICS;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase">CAMPUS OCCUPANCY DASHBOARD</h1>
          <p className="text-xs text-slate-400">Real-time gate telemetry, total campus headcount, and population flow rate.</p>
        </div>

        {/* Main Metric Hero */}
        <div className="rounded-3xl border border-blue-500/40 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-8 backdrop-blur-xl shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-400">CURRENT CAMPUS OCCUPANCY</p>
          <div className="mt-2 flex items-baseline gap-4">
            <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">{totalOccupancy.toLocaleString()}</span>
            <span className="text-sm font-bold text-slate-300 uppercase">PEOPLE INSIDE</span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-slate-800/80 pt-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-slate-400 text-xs font-semibold">Students</span>
              <p className="mt-1 text-2xl font-black text-blue-400">{breakdown.students.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-slate-400 text-xs font-semibold">Faculty</span>
              <p className="mt-1 text-2xl font-black text-emerald-400">{breakdown.faculty.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-slate-400 text-xs font-semibold">Staff</span>
              <p className="mt-1 text-2xl font-black text-teal-400">{breakdown.staff.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-slate-400 text-xs font-semibold">Visitors</span>
              <p className="mt-1 text-2xl font-black text-amber-400">{breakdown.visitors.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Gate Breakdown */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <h3 className="text-base font-bold text-white">Jubilee Gate</h3>
            <p className="mt-2 text-2xl font-black text-blue-400">{gatesSummary.jubileeGate.entries} IN / {gatesSummary.jubileeGate.exits} OUT</p>
            <p className="text-xs text-slate-400 mt-1">Net flow: +{gatesSummary.jubileeGate.inside} inside</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <h3 className="text-base font-bold text-white">Main Gate</h3>
            <p className="mt-2 text-2xl font-black text-emerald-400">{gatesSummary.mainGate.entries} IN / {gatesSummary.mainGate.exits} OUT</p>
            <p className="text-xs text-slate-400 mt-1">Net flow: +{gatesSummary.mainGate.inside} inside</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <h3 className="text-base font-bold text-white">New Parking Gate</h3>
            <p className="mt-2 text-2xl font-black text-teal-400">{gatesSummary.parkingGate.entries} IN / {gatesSummary.parkingGate.exits} OUT</p>
            <p className="text-xs text-slate-400 mt-1">Net flow: +{gatesSummary.parkingGate.inside} inside</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
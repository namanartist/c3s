import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatCard } from '@/components/c3s/StatCard';
import { GateQRDisplay } from '@/components/c3s/GateQRDisplay';
import { DataTable } from '@/components/c3s/DataTable';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { DoorOpen, Scan, Activity, ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

export default function GateKeeperDashboard() {
  const navigate = useNavigate();
  const { gates, selectedGateId, movementLogs } = useC3SStore();
  const currentGate = gates.find((g) => g.id === selectedGateId) || gates[0];

  const columns = [
    { header: 'Person', accessorKey: 'personName' as const, cell: (r: any) => <strong className="text-white">{r.personName}</strong> },
    { header: 'ID', accessorKey: 'universityId' as const, cell: (r: any) => <span className="font-mono text-slate-400">{r.universityId}</span> },
    { header: 'Movement', accessorKey: 'movement' as const, cell: (r: any) => <StatusBadge status={r.movement} /> },
    { header: 'Time', accessorKey: 'time' as const, cell: (r: any) => <span className="font-mono text-slate-300">{r.time}</span> },
    { header: 'Gate', accessorKey: 'gate' as const },
    { header: 'Status', accessorKey: 'status' as const, cell: (r: any) => <StatusBadge status={r.status} /> }
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">GATE TERMINAL</span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">ONLINE</span>
            </div>
            <h1 className="mt-1 text-3xl font-black text-white uppercase">{currentGate.name}</h1>
            <p className="text-xs text-slate-400">Assigned Gate Keeper: {currentGate.currentGateKeeper} ({currentGate.keeperId})</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/gate-keeper/qr')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500"
            >
              <Scan className="h-4 w-4" /> Fullscreen Gate QR
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            title="Today's Check-In"
            value={currentGate.checkInCount}
            subtitle="Verified student & faculty"
            icon={DoorOpen}
            variant="success"
          />
          <StatCard
            title="Today's Check-Out"
            value={currentGate.checkOutCount}
            subtitle="Recorded campus egress"
            icon={DoorOpen}
            variant="primary"
          />
          <StatCard
            title="Currently Inside"
            value={currentGate.currentlyInside}
            subtitle="Net active headcount"
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Active Alerts"
            value={currentGate.activeAlerts}
            subtitle="Perimeter warnings"
            icon={Activity}
            variant={currentGate.activeAlerts > 0 ? 'critical' : 'default'}
          />
        </div>

        {/* Gate QR + Live Activity Split */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-1">
            <GateQRDisplay />
          </div>

          <div className="col-span-1 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 uppercase">Live Gate Activity Feed</h2>
              <button
                onClick={() => navigate('/gate-keeper/activity')}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                View Full Log <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <DataTable columns={columns} data={movementLogs.slice(0, 7)} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
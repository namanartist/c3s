// src/pages/c3s/GateKeeperDashboard.tsx
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatCard } from '@/components/c3s/StatCard';
import { GateQRDisplay } from '@/components/c3s/GateQRDisplay';
import { DataTable } from '@/components/c3s/DataTable';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import {
  DoorOpen,
  Scan,
  Activity,
  ArrowRight,
  Users,
  ShieldCheck,
  QrCode,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import type { C3SMovementLog } from '@/lib/mock-data/movement';

export default function GateKeeperDashboard() {
  const navigate = useNavigate();
  const { gates, selectedGateId, movementLogs } = useC3SStore();
  const currentGate = gates.find((g) => g.id === selectedGateId) || gates[0];

  const columns = [
    {
      header: 'Person / Student',
      accessorKey: 'personName' as const,
      cell: (r: C3SMovementLog) => (
        <div>
          <strong className="text-slate-900 dark:text-white block">{r.personName}</strong>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{r.department || 'Student'}</span>
        </div>
      )
    },
    {
      header: 'University ID',
      accessorKey: 'universityId' as const,
      cell: (r: C3SMovementLog) => (
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
          {r.universityId}
        </span>
      )
    },
    {
      header: 'Movement',
      accessorKey: 'movement' as const,
      cell: (r: C3SMovementLog) => <StatusBadge status={r.movement} />
    },
    {
      header: 'Time',
      accessorKey: 'time' as const,
      cell: (r: C3SMovementLog) => (
        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">{r.time}</span>
      )
    },
    {
      header: 'Gate',
      accessorKey: 'gate' as const,
      cell: (r: C3SMovementLog) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{r.gate}</span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status' as const,
      cell: (r: C3SMovementLog) => <StatusBadge status={r.status || 'VERIFIED'} />
    }
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                GATE TERMINAL ACTIVE • {currentGate.id}
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {currentGate.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assigned Gate Keeper: <strong className="text-slate-800 dark:text-slate-200">{currentGate.currentGateKeeper}</strong> ({currentGate.keeperId})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/gate-keeper/qr')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>Fullscreen Terminal QR</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            title="Today's Check-In"
            value={currentGate.checkInCount}
            subtitle="Verified campus entries"
            icon={DoorOpen}
            variant="success"
            trend="14%"
            trendPositive={true}
          />
          <StatCard
            title="Today's Check-Out"
            value={currentGate.checkOutCount}
            subtitle="Recorded exits"
            icon={DoorOpen}
            variant="primary"
          />
          <StatCard
            title="Currently Inside"
            value={currentGate.currentlyInside}
            subtitle="Campus population via Gate 1"
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Active Gate Alerts"
            value={currentGate.activeAlerts}
            subtitle="Security perimeter notifications"
            icon={Activity}
            variant={currentGate.activeAlerts > 0 ? 'critical' : 'default'}
          />
        </div>

        {/* Gate QR + Live Activity Split */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-1">
            <GateQRDisplay />
          </div>

          <div className="col-span-1 lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Gate Activity Stream
                </h2>
              </div>
              <button
                onClick={() => navigate('/gate-keeper/activity')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <span>Full Ledger</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <DataTable columns={columns} data={movementLogs.slice(0, 7)} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

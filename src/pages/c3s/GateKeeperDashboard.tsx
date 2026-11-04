// src/pages/c3s/GateKeeperDashboard.tsx
import React, { useState } from 'react';
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
  Sparkles,
  Lock,
  Unlock,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import type { C3SMovementLog } from '@/lib/mock-data/movement';

export default function GateKeeperDashboard() {
  const navigate = useNavigate();
  const { gates, selectedGateId, setSelectedGateId, movementLogs, addMovementLog } = useC3SStore();

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualUniId, setManualUniId] = useState('');
  const [manualAction, setManualAction] = useState<'CHECK-IN' | 'CHECK-OUT'>('CHECK-IN');
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);
  const [barrierState, setBarrierState] = useState<'OPEN' | 'LOCKED'>('OPEN');

  const defaultGate = {
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

  const currentGate = gates.find((g) => g.id === selectedGateId) || gates[0] || defaultGate;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualUniId) return;

    const newLog: C3SMovementLog = {
      id: `mov-${Date.now()}`,
      personName: manualName,
      universityId: manualUniId,
      role: 'Student',
      department: 'Manual Guard Override',
      movement: manualAction,
      gate: currentGate.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
      verificationMethod: 'MANUAL_OVERRIDE',
      status: 'VERIFIED'
    };

    addMovementLog(newLog);
    setManualSuccessMsg(`Successfully logged ${manualAction} for ${manualName} (${manualUniId})`);
    setManualName('');
    setManualUniId('');
    setTimeout(() => {
      setManualSuccessMsg(null);
      setManualModalOpen(false);
    }, 1500);
  };

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
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                barrierState === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
              }`}>
                BARRIER: {barrierState}
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {currentGate.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assigned Gate Keeper: <strong className="text-slate-800 dark:text-slate-200">{currentGate.currentGateKeeper}</strong> ({currentGate.keeperId})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Gate Switcher Dropdown */}
            <div className="relative">
              <select
                value={currentGate.id}
                onChange={(e) => setSelectedGateId(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 pr-8 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>
                    Switch Gate: {g.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">▼</div>
            </div>

            {/* Quick Action: Manual Student Entry */}
            <button
              onClick={() => setManualModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3.5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>Manual Check-in</span>
            </button>

            {/* Toggle Barrier */}
            <button
              onClick={() => setBarrierState(barrierState === 'OPEN' ? 'LOCKED' : 'OPEN')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer border ${
                barrierState === 'OPEN'
                  ? 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                  : 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {barrierState === 'OPEN' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              <span>{barrierState === 'OPEN' ? 'Lock Barrier' : 'Release Barrier'}</span>
            </button>

            {/* Fullscreen QR */}
            <button
              onClick={() => navigate('/gate-keeper/qr')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>Fullscreen QR</span>
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
            subtitle={`Campus population via ${currentGate.code || currentGate.name}`}
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

        {/* Manual Check-in Modal */}
        {manualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b101e] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span>Manual Gate Verification</span>
                </h3>
                <button
                  onClick={() => setManualModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                >
                  ✕
                </button>
              </div>

              {manualSuccessMsg ? (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{manualSuccessMsg}</span>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Student / Staff Name
                    </label>
                    <input
                      type="text"
                      required
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      University ID / Roll Number
                    </label>
                    <input
                      type="text"
                      required
                      value={manualUniId}
                      onChange={(e) => setManualUniId(e.target.value)}
                      placeholder="e.g. 0901CS221045"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Movement Direction
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setManualAction('CHECK-IN')}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          manualAction === 'CHECK-IN'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                        }`}
                      >
                        CHECK-IN (Entry)
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualAction('CHECK-OUT')}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          manualAction === 'CHECK-OUT'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                        }`}
                      >
                        CHECK-OUT (Exit)
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setManualModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 cursor-pointer"
                    >
                      Confirm Log
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
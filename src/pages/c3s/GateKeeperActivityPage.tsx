import React, { useEffect, useState, useMemo } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { DataTable } from '@/components/c3s/DataTable';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { useC3SStore } from '@/store/c3sStore';
import { useGateStore } from '@/store/gateStore';
import { fetchMovementHistory } from '@/lib/gateApi';
import { RefreshCw, DoorOpen, Users, Filter, CheckCircle2 } from 'lucide-react';
import type { C3SMovementLog } from '@/lib/mock-data/movement';
import type { GateLog } from '@/packages/shared/permissions';

export default function GateKeeperActivityPage() {
  const { movementLogs } = useC3SStore();
  const { allMovements } = useGateStore();
  const [dbLogs, setDbLogs] = useState<C3SMovementLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [gateFilter, setGateFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const history = await fetchMovementHistory(undefined, 'responder');
      if (Array.isArray(history) && history.length > 0) {
        const formatted: C3SMovementLog[] = history.map((h: GateLog) => ({
          id: h.id || `mov-${Date.now()}`,
          personName: h.personName || 'Campus Resident',
          universityId: h.universityId || 'BTCS2026-0842',
          role: h.role || 'STUDENT',
          department: h.department || 'Computer Science',
          movement: h.movement,
          time: h.time,
          date: h.date || 'Today',
          gate: h.gate,
          verificationMethod: (h.verificationMethod === 'RFID_CARD' || h.verificationMethod === 'MANUAL_OVERRIDE') ? h.verificationMethod : 'QR_SCAN',
          status: 'VERIFIED'
        }));
        setDbLogs(formatted);
      }
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchMovementHistory(undefined, 'responder').then((history) => {
      if (!active) return;
      if (Array.isArray(history) && history.length > 0) {
        const formatted: C3SMovementLog[] = history.map((h: GateLog) => ({
          id: h.id || `mov-${Date.now()}`,
          personName: h.personName || 'Campus Resident',
          universityId: h.universityId || 'BTCS2026-0842',
          role: h.role || 'STUDENT',
          department: h.department || 'Computer Science',
          movement: h.movement,
          time: h.time,
          date: h.date || 'Today',
          gate: h.gate,
          verificationMethod: (h.verificationMethod === 'RFID_CARD' || h.verificationMethod === 'MANUAL_OVERRIDE') ? h.verificationMethod : 'QR_SCAN',
          status: 'VERIFIED'
        }));
        setDbLogs(formatted);
      }
    }).catch(() => {
      /* empty */
    });

    const interval = setInterval(() => {
      fetchMovementHistory(undefined, 'responder').then((history) => {
        if (!active) return;
        if (Array.isArray(history) && history.length > 0) {
          const formatted: C3SMovementLog[] = history.map((h: GateLog) => ({
            id: h.id || `mov-${Date.now()}`,
            personName: h.personName || 'Campus Resident',
            universityId: h.universityId || 'BTCS2026-0842',
            role: h.role || 'STUDENT',
            department: h.department || 'Computer Science',
            movement: h.movement,
            time: h.time,
            date: h.date || 'Today',
            gate: h.gate,
            verificationMethod: (h.verificationMethod === 'RFID_CARD' || h.verificationMethod === 'MANUAL_OVERRIDE') ? h.verificationMethod : 'QR_SCAN',
            status: 'VERIFIED'
          }));
          setDbLogs(formatted);
        }
      }).catch(() => {
        /* empty */
      });
    }, 15000); // 15s live refresh

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const mergedLogs = useMemo(() => {
    const map = new Map<string, C3SMovementLog>();

    // 1. From database
    dbLogs.forEach((l) => map.set(l.id, l));

    // 2. From allMovements in gateStore
    allMovements.forEach((h) => {
      if (!map.has(h.id)) {
        map.set(h.id, {
          id: h.id,
          personName: h.userName,
          universityId: h.userId,
          role: h.userRole,
          department: 'Campus User',
          movement: h.type,
          time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(h.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          gate: h.gateName,
          verificationMethod: h.method === 'SECURITY_OVERRIDE' ? 'MANUAL_OVERRIDE' : 'QR_SCAN',
          status: 'VERIFIED'
        });
      }
    });

    // 3. From mock logs in c3sStore
    movementLogs.forEach((l) => {
      if (!map.has(l.id)) {
        map.set(l.id, l);
      }
    });

    let result = Array.from(map.values());

    if (gateFilter !== 'ALL') {
      result = result.filter((r) => r.gate.toLowerCase().includes(gateFilter.toLowerCase()));
    }

    if (typeFilter !== 'ALL') {
      result = result.filter((r) => r.movement === typeFilter);
    }

    return result.sort((a, b) => (b.id > a.id ? 1 : -1));
  }, [dbLogs, allMovements, movementLogs, gateFilter, typeFilter]);

  const totalCheckIns = mergedLogs.filter((l) => l.movement === 'CHECK-IN').length;
  const totalCheckOuts = mergedLogs.filter((l) => l.movement === 'CHECK-OUT').length;

  const columns = [
    {
      header: 'Person',
      accessorKey: 'personName' as const,
      cell: (r: C3SMovementLog) => (
        <div>
          <strong className="text-white text-xs block">{r.personName}</strong>
          <span className="text-[10px] text-slate-400 font-mono">{r.department || 'Undergraduate'}</span>
        </div>
      )
    },
    {
      header: 'ID',
      accessorKey: 'universityId' as const,
      cell: (r: C3SMovementLog) => <span className="font-mono text-xs text-slate-300">{r.universityId}</span>
    },
    {
      header: 'Movement',
      accessorKey: 'movement' as const,
      cell: (r: C3SMovementLog) => <StatusBadge status={r.movement} />
    },
    {
      header: 'Gate',
      accessorKey: 'gate' as const,
      cell: (r: C3SMovementLog) => <span className="font-semibold text-slate-200 text-xs">{r.gate}</span>
    },
    {
      header: 'Time',
      accessorKey: 'time' as const,
      cell: (r: C3SMovementLog) => <span className="font-mono text-xs text-blue-400">{r.time}</span>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">LIVE GATE ACTIVITY STREAM</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time ingress and egress token verifications synced across all campus gates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs dark:shadow-none transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Streamed Events</span>
            <div className="mt-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-xl font-black text-slate-900 dark:text-white">{mergedLogs.length}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs dark:shadow-none transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entries (Check-Ins)</span>
            <div className="mt-1 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xl font-black text-emerald-400">{totalCheckIns}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs dark:shadow-none transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exits (Check-Outs)</span>
            <div className="mt-1 flex items-center gap-2">
              <DoorOpen className="h-4 w-4 text-amber-400" />
              <span className="text-xl font-black text-amber-400">{totalCheckOuts}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-3 text-xs shadow-xs dark:shadow-none transition-colors">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
            <Filter className="h-3.5 w-3.5 text-blue-400" />
            Filter Gate:
          </div>
          <select
            value={gateFilter}
            onChange={(e) => setGateFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Campus Gates</option>
            <option value="Main">Main Gate (Gate 1)</option>
            <option value="Jubilee">Jubilee Gate (Gate 4)</option>
            <option value="Parking">New Parking Gate (Gate 2)</option>
          </select>

          <div className="flex items-center gap-1.5 text-slate-400 font-semibold ml-2">
            Movement Type:
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="CHECK-IN">Check-In Only</option>
            <option value="CHECK-OUT">Check-Out Only</option>
          </select>
        </div>

        <DataTable columns={columns} data={mergedLogs} />
      </div>
    </AppShell>
  );
}

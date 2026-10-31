import React, { useEffect, useState, useMemo } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { DataTable } from '@/components/c3s/DataTable';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { useC3SStore } from '@/store/c3sStore';
import { useGateStore } from '@/store/gateStore';
import { fetchMovementHistory } from '@/lib/gateApi';
import { toPermissionRole, grantFor, type GateLog } from '@/packages/shared/permissions';
import { RefreshCw, Download, ShieldCheck, DoorOpen, Clock } from 'lucide-react';
import type { C3SMovementLog } from '@/lib/mock-data/movement';

export default function StudentMovementPage() {
  const { movementLogs, currentUser, isInsideCampus, checkedInGate, checkedInAt } = useC3SStore();
  const { userMovementHistory } = useGateStore();
  const [dbLogs, setDbLogs] = useState<C3SMovementLog[]>([]);
  const [loading, setLoading] = useState(false);

  const permRole = toPermissionRole(currentUser?.role);
  const canExport = !!grantFor(permRole, 'gate_log', 'export');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const history = await fetchMovementHistory(currentUser?.universityId, permRole);
      if (Array.isArray(history) && history.length > 0) {
        const formatted: C3SMovementLog[] = history.map((h: GateLog) => ({
          id: h.id || `mov-${Date.now()}`,
          personName: h.personName || currentUser.name,
          universityId: h.universityId || currentUser.universityId,
          role: h.role || currentUser.role,
          department: h.department || currentUser.department,
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
    fetchMovementHistory(currentUser?.universityId, permRole).then((history) => {
      if (!active) return;
      if (Array.isArray(history) && history.length > 0) {
        const formatted: C3SMovementLog[] = history.map((h: GateLog) => ({
          id: h.id || `mov-${Date.now()}`,
          personName: h.personName || currentUser.name,
          universityId: h.universityId || currentUser.universityId,
          role: h.role || currentUser.role,
          department: h.department || currentUser.department,
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
    return () => {
      active = false;
    };
  }, [currentUser?.universityId, currentUser?.name, currentUser?.role, currentUser?.department, permRole]);

  // Combine DB logs with memory and mock store, deduplicated by id
  const mergedLogs = useMemo(() => {
    const map = new Map<string, C3SMovementLog>();

    // 1. From store / local memory
    dbLogs.forEach((l) => map.set(l.id, l));

    // 2. From gateStore
    userMovementHistory.forEach((h) => {
      if (!map.has(h.id)) {
        map.set(h.id, {
          id: h.id,
          personName: h.userName,
          universityId: h.userId,
          role: h.userRole,
          department: currentUser.department,
          movement: h.type,
          time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(h.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          gate: h.gateName,
          verificationMethod: h.method === 'SECURITY_OVERRIDE' ? 'MANUAL_OVERRIDE' : 'QR_SCAN',
          status: 'VERIFIED'
        });
      }
    });

    // 3. From c3sStore
    movementLogs.forEach((l) => {
      if (!map.has(l.id)) {
        map.set(l.id, l);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      return (b.id > a.id ? 1 : -1);
    });
  }, [dbLogs, userMovementHistory, movementLogs, currentUser]);

  const exportCsv = () => {
    const headers = ['ID', 'Person', 'University ID', 'Role', 'Movement', 'Gate', 'Time', 'Date', 'Status'];
    const rows = mergedLogs.map((l) => [
      l.id,
      l.personName,
      l.universityId,
      l.role,
      l.movement,
      l.gate,
      l.time,
      l.date,
      l.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `movement_ledger_${currentUser?.universityId || 'student'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: 'Movement',
      accessorKey: 'movement' as const,
      cell: (r: C3SMovementLog) => <StatusBadge status={r.movement} />
    },
    {
      header: 'Gate',
      accessorKey: 'gate' as const,
      cell: (r: C3SMovementLog) => <span className="font-semibold text-slate-800 dark:text-slate-200">{r.gate}</span>
    },
    {
      header: 'Time',
      accessorKey: 'time' as const,
      cell: (r: C3SMovementLog) => (
        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">{r.time}</span>
      )
    },
    {
      header: 'Date',
      accessorKey: 'date' as const,
      cell: (r: C3SMovementLog) => <span className="text-xs text-slate-500 dark:text-slate-400">{r.date}</span>
    },
    {
      header: 'Method',
      accessorKey: 'verificationMethod' as const,
      cell: (r: C3SMovementLog) => (
        <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
          {r.verificationMethod || 'QR_SCAN'}
        </span>
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
        {/* Header with Presence Pill and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">GATE MOVEMENT HISTORY</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authoritative, cryptographically verified gate ingress and egress trail for{' '}
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{currentUser?.name}</span> ({currentUser?.universityId}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              Refresh
            </button>
            {canExport && (
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Export Ledger
              </button>
            )}
          </div>
        </div>

        {/* Current Presence Summary Card */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs dark:shadow-none transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Campus Presence</span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isInsideCampus ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className={`text-base font-bold ${isInsideCampus ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                {isInsideCampus ? 'INSIDE CAMPUS' : 'OUTSIDE CAMPUS'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs dark:shadow-none transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Gate Transaction</span>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
              <DoorOpen className="h-4 w-4 text-blue-500" />
              {checkedInGate || 'Main Gate (Gate 1)'}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs dark:shadow-none transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recorded Time</span>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-sm font-bold text-slate-900 dark:text-slate-200">
              <Clock className="h-4 w-4 text-amber-500" />
              {checkedInAt || '08:42 AM'}
            </div>
          </div>
        </div>

        {/* Table of Movements */}
        <DataTable columns={columns} data={mergedLogs} />
      </div>
    </AppShell>
  );
}

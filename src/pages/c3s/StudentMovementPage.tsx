import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { DataTable } from '@/components/c3s/DataTable';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { useC3SStore } from '@/store/c3sStore';

export default function StudentMovementPage() {
  const { movementLogs } = useC3SStore();

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
        <div>
          <h1 className="text-2xl font-black text-slate-100">MOVEMENT HISTORY</h1>
          <p className="text-xs text-slate-400">Cryptographically verified gate ingress and egress trail.</p>
        </div>

        <DataTable columns={columns} data={movementLogs} />
      </div>
    </AppShell>
  );
}
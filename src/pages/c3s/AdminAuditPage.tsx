// src/pages/c3s/AdminAuditPage.tsx
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { DataTable } from '@/components/c3s/DataTable';
import { StatusBadge } from '@/components/c3s/StatusBadge';

interface AuditItem {
  time: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  status: string;
}

const MOCK_AUDIT: AuditItem[] = [
  { time: '20:18', actor: 'Gate Keeper (Ramesh Singh)', role: 'Gate Keeper', action: 'QR_REGENERATED', resource: 'Main Gate', status: 'SUCCESS' },
  { time: '20:17', actor: 'Security Guard (Vikram Rathore)', role: 'Security Guard', action: 'INCIDENT_ACCEPTED', resource: 'C3S-INC-00192', status: 'SUCCESS' },
  { time: '20:16', actor: 'Aarav Sharma', role: 'Student', action: 'SOS_TRIGGERED', resource: 'Academic Block A', status: 'SUCCESS' },
  { time: '19:47', actor: 'Neha Gupta', role: 'Control Room', action: 'SENSOR_OVERRIDE', resource: 'CAM-03', status: 'SUCCESS' },
  { time: '18:24', actor: 'Fire Warden', role: 'Security', action: 'INCIDENT_RESOLVED', resource: 'C3S-INC-00185', status: 'SUCCESS' }
];

export default function AdminAuditPage() {
  const columns = [
    {
      header: 'Time',
      accessorKey: 'time' as const,
      cell: (r: AuditItem) => <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{r.time}</span>
    },
    {
      header: 'Actor',
      accessorKey: 'actor' as const,
      cell: (r: AuditItem) => <strong className="text-slate-900 dark:text-white font-bold">{r.actor}</strong>
    },
    { header: 'Role', accessorKey: 'role' as const },
    {
      header: 'Action',
      accessorKey: 'action' as const,
      cell: (r: AuditItem) => (
        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">{r.action}</span>
      )
    },
    { header: 'Resource', accessorKey: 'resource' as const },
    {
      header: 'Status',
      accessorKey: 'status' as const,
      cell: (r: AuditItem) => <StatusBadge status={r.status} />
    }
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">SECURITY AUDIT LOGS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Cryptographically verifiable trail of all security transactions and overrides.</p>
        </div>
        <DataTable columns={columns} data={MOCK_AUDIT} />
      </div>
    </AppShell>
  );
}

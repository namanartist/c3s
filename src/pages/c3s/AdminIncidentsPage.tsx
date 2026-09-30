import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { DataTable } from '@/components/c3s/DataTable';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { useC3SStore } from '@/store/c3sStore';
import { useNavigate } from 'react-router-dom';

export default function AdminIncidentsPage() {
  const navigate = useNavigate();
  const { incidents } = useC3SStore();

  const columns = [
    { header: 'ID', accessorKey: 'id' as const, cell: (r: any) => <span className="font-mono text-xs font-bold text-rose-400">{r.id}</span> },
    { header: 'Title', accessorKey: 'title' as const, cell: (r: any) => <strong className="text-white">{r.title}</strong> },
    { header: 'Location', accessorKey: 'location' as const },
    { header: 'Priority', accessorKey: 'priority' as const, cell: (r: any) => <span className="font-bold text-rose-400">{r.priority}</span> },
    { header: 'Responder', accessorKey: 'assignedResponder' as const },
    { header: 'Status', accessorKey: 'status' as const, cell: (r: any) => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      cell: (r: any) => (
        <button
          onClick={() => navigate(`/security/incidents/${r.id}`)}
          className="rounded-lg bg-blue-600/20 px-2.5 py-1 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white"
        >
          View
        </button>
      )
    }
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase">ALL CAMPUS INCIDENTS</h1>
          <p className="text-xs text-slate-400">Master safety log and post-incident investigation dossiers.</p>
        </div>
        <DataTable columns={columns} data={incidents} />
      </div>
    </AppShell>
  );
}
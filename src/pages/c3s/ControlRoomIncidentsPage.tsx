import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { DataTable } from '@/components/c3s/DataTable';
import { IncidentEvidenceModal } from '@/components/c3s/IncidentEvidenceModal';
import { ShieldAlert, ArrowRight, Video, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import type { C3SIncident } from '@/lib/mock-data/incidents';

export default function ControlRoomIncidentsPage() {
  const navigate = useNavigate();
  const { incidents } = useC3SStore();
  const [filter, setFilter] = useState('ALL');
  const [selectedIncidentForEvidence, setSelectedIncidentForEvidence] = useState<C3SIncident | null>(null);

  const filtered = incidents.filter((i) => {
    if (filter === 'ALL') return true;
    if (filter === 'CRITICAL') return i.priority === 'CRITICAL';
    if (filter === 'ACTIVE') return i.status !== 'RESOLVED';
    if (filter === 'RESOLVED') return i.status === 'RESOLVED';
    return true;
  });

  const columns = [
    { header: 'ID', accessorKey: 'id' as const, cell: (r: any) => <span className="font-mono text-xs font-bold text-rose-400">{r.id}</span> },
    { header: 'Title', accessorKey: 'title' as const, cell: (r: any) => <strong className="text-white">{r.title}</strong> },
    { header: 'Category', accessorKey: 'type' as const },
    { header: 'Location', accessorKey: 'location' as const },
    { header: 'Priority', accessorKey: 'priority' as const, cell: (r: any) => <span className="font-bold text-rose-400">{r.priority}</span> },
    { header: 'Responder', accessorKey: 'assignedResponder' as const, cell: (r: any) => <span className="text-blue-300 font-semibold">{r.assignedResponder || 'Unassigned'}</span> },
    {
      header: 'Evidence',
      cell: (r: any) => (
        <button
          type="button"
          onClick={() => setSelectedIncidentForEvidence(r)}
          className="flex items-center gap-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 px-2 py-1 text-xs font-bold text-rose-300 transition cursor-pointer"
          title="View CCTV Recording & Photo Snapshot"
        >
          <Video className="w-3.5 h-3.5 text-rose-400" />
          <span>View Clip</span>
        </button>
      )
    },
    { header: 'Status', accessorKey: 'status' as const, cell: (r: any) => <StatusBadge status={r.status} pulse /> },
    {
      header: 'Action',
      cell: (r: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/security/incidents/${r.id}`)}
            className="rounded-lg bg-blue-600/20 px-2.5 py-1 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition cursor-pointer"
          >
            Triage
          </button>
        </div>
      )
    }
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">INCIDENT OPERATIONS HUB</h1>
            <p className="text-xs text-slate-400">Chief Proctor &amp; Central SOC command board, CCTV evidence auditing, and dispatch verification.</p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1">
            {['ALL', 'CRITICAL', 'ACTIVE', 'RESOLVED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <DataTable columns={columns} data={filtered} />

        {/* Modal for Instant Evidence Video/Photo Inspection by Proctor */}
        <IncidentEvidenceModal
          incident={selectedIncidentForEvidence}
          isOpen={Boolean(selectedIncidentForEvidence)}
          onClose={() => setSelectedIncidentForEvidence(null)}
        />
      </div>
    </AppShell>
  );
}

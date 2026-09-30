import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { DataTable } from '@/components/c3s/DataTable';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { MOCK_USERS, type C3SRole } from '@/lib/mock-data/users';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = MOCK_USERS.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.universityId.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const columns = [
    { header: 'Name', accessorKey: 'name' as const, cell: (r: any) => <strong className="text-white">{r.name}</strong> },
    { header: 'ID', accessorKey: 'universityId' as const, cell: (r: any) => <span className="font-mono text-slate-400">{r.universityId}</span> },
    { header: 'Role', accessorKey: 'role' as const, cell: (r: any) => <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400">{r.role}</span> },
    { header: 'Department', accessorKey: 'department' as const },
    { header: 'Status', accessorKey: 'status' as const, cell: (r: any) => <StatusBadge status={r.status} /> },
    { header: 'Last Activity', accessorKey: 'lastActivity' as const, cell: (r: any) => <span className="text-slate-400 text-xs">{r.lastActivity}</span> }
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100 uppercase">USER MANAGEMENT</h1>
            <p className="text-xs text-slate-400">Search users, filter roles, and audit authorization levels.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search user or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200"
            />
          </div>
        </div>

        <DataTable columns={columns} data={filtered} />
      </div>
    </AppShell>
  );
}
// src/pages/c3s/AdminUsersPage.tsx
import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { DataTable } from '@/components/c3s/DataTable';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { MOCK_USERS, type C3SUser } from '@/lib/mock-data/users';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = MOCK_USERS.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.universityId.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name' as const,
      cell: (r: C3SUser) => <strong className="text-slate-900 dark:text-white font-bold">{r.name}</strong>
    },
    {
      header: 'ID',
      accessorKey: 'universityId' as const,
      cell: (r: C3SUser) => <span className="font-mono text-slate-600 dark:text-slate-400 text-xs">{r.universityId}</span>
    },
    {
      header: 'Role',
      accessorKey: 'role' as const,
      cell: (r: C3SUser) => (
        <span className="rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-2 py-0.5 text-xs font-bold">
          {r.role}
        </span>
      )
    },
    { header: 'Department', accessorKey: 'department' as const },
    { header: 'Status', accessorKey: 'status' as const, cell: (r: C3SUser) => <StatusBadge status={r.status} /> },
    {
      header: 'Last Activity',
      accessorKey: 'lastActivity' as const,
      cell: (r: C3SUser) => <span className="text-slate-500 dark:text-slate-400 text-xs">{r.lastActivity}</span>
    }
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">USER DIRECTORY</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Search users, filter roles, and audit authorization levels.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search user or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none transition-colors shadow-xs"
            />
          </div>
        </div>

        <DataTable columns={columns} data={filtered} />
      </div>
    </AppShell>
  );
}

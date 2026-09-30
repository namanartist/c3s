import React, { useState } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

export default function SecurityIncidentsPage() {
  const navigate = useNavigate();
  const { incidents } = useC3SStore();
  const [filter, setFilter] = useState<string>('ALL');

  const filtered = incidents.filter((i) => {
    if (filter === 'ALL') return true;
    if (filter === 'CRITICAL') return i.priority === 'CRITICAL';
    if (filter === 'ACTIVE') return i.status !== 'RESOLVED';
    if (filter === 'RESOLVED') return i.status === 'RESOLVED';
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100 uppercase">INCIDENT DISPATCH HUB</h1>
            <p className="text-xs text-slate-400">Campus-wide emergency incident tracking, priority queues, and guard assignment.</p>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((inc) => (
            <div
              key={inc.id}
              onClick={() => navigate(`/security/incidents/${inc.id}`)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition-all hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-950/30"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-blue-400">{inc.id}</span>
                <StatusBadge status={inc.status} />
              </div>

              <h3 className="mt-3 text-base font-bold text-slate-100 group-hover:text-blue-400">{inc.title}</h3>
              <p className="mt-1 text-xs text-slate-400">{inc.location}</p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                <span>Priority: <strong className={inc.priority === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}>{inc.priority}</strong></span>
                <span className="flex items-center gap-1 text-blue-400 font-semibold group-hover:underline">
                  Inspect <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
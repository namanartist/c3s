import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { useC3SStore } from '@/store/c3sStore';

export default function C3SNotificationsPage() {
  const { notifications, markNotificationRead, clearAllNotifications } = useC3SStore();

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-100 uppercase">NOTIFICATION CENTER</h1>
            <p className="text-xs text-slate-400">Emergency dispatch alerts, gate updates, and campus bulletins.</p>
          </div>
          <button
            onClick={clearAllNotifications}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Mark all read
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                n.read ? 'border-slate-800 bg-slate-900/40 text-slate-400' : 'border-blue-500/40 bg-blue-950/20 text-slate-200 shadow-md shadow-blue-950/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{n.category}</span>
                  <StatusBadge status={n.priority} size="sm" />
                </div>
                <span className="font-mono text-xs text-slate-500">{n.time}</span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-white">{n.title}</h3>
              <p className="mt-1 text-xs text-slate-400">{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
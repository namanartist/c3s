// src/pages/c3s/AdminAnalyticsPage.tsx
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { MOCK_ANALYTICS } from '@/lib/mock-data/analytics';

export default function AdminAnalyticsPage() {
  const { hourlyTraffic, incidentBreakdown, responseTimeTrend } = MOCK_ANALYTICS;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">SECURITY &amp; TRAFFIC ANALYTICS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Campus occupancy curves, response time benchmarking, and gate throughput.</p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Chart 1: Hourly Gate Flow */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-md shadow-xs dark:shadow-none transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Hourly Gate Flow (Entries vs Exits)</h3>
            <div className="mt-6 flex h-64 items-end gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              {hourlyTraffic.slice(2, 12).map((item) => (
                <div key={item.hour} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex items-end gap-0.5 justify-center h-48">
                    <div
                      style={{ height: `${(item.entries / 1300) * 100}%` }}
                      className="w-1/2 bg-blue-500 rounded-t transition-all group-hover:bg-blue-400"
                      title={`Entries: ${item.entries}`}
                    />
                    <div
                      style={{ height: `${(item.exits / 1300) * 100}%` }}
                      className="w-1/2 bg-rose-500 rounded-t transition-all group-hover:bg-rose-400"
                      title={`Exits: ${item.exits}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{item.hour}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2"><span className="h-2 w-4 bg-blue-500 rounded" /> Inbound Entries</span>
              <span className="flex items-center gap-2"><span className="h-2 w-4 bg-rose-500 rounded" /> Outbound Exits</span>
            </div>
          </div>

          {/* Chart 2: Incidents Breakdown */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-md shadow-xs dark:shadow-none transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Incident Categorization</h3>
            <div className="mt-6 space-y-4">
              {incidentBreakdown.map((item) => (
                <div key={item.type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-800 dark:text-slate-300 font-semibold">{item.type}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{item.count} incidents ({item.percentage}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Time Trend */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-md shadow-xs dark:shadow-none transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Average Incident Response Time (Minutes)</h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono">2.14 MIN AVG (SEPTEMBER)</span>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {responseTimeTrend.map((m) => (
              <div key={m.month} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 transition-colors">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{m.month}</span>
                <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{m.avgMinutes}m</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Target: &lt;{m.targetMinutes}m</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

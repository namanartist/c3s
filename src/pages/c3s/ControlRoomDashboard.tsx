import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatCard } from '@/components/c3s/StatCard';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { CampusMap } from '@/components/c3s/CampusMap';
import { CCTVGrid } from '@/components/c3s/CCTVGrid';
import { DataTable } from '@/components/c3s/DataTable';
import { Shield, ShieldAlert, Camera, Users, Radio, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

export default function ControlRoomDashboard() {
  const navigate = useNavigate();
  const { incidents, responders, cameras } = useC3SStore();

  const criticalIncidents = incidents.filter((i) => i.priority === 'CRITICAL' && i.status !== 'RESOLVED');

  const incidentColumns = [
    { header: 'ID', accessorKey: 'id' as const, cell: (r: any) => <span className="font-mono text-xs font-bold text-rose-400">{r.id}</span> },
    { header: 'Type', accessorKey: 'title' as const, cell: (r: any) => <strong className="text-white">{r.title}</strong> },
    { header: 'Location', accessorKey: 'location' as const },
    { header: 'Priority', accessorKey: 'priority' as const, cell: (r: any) => <span className="font-bold text-rose-400">{r.priority}</span> },
    { header: 'Responder', accessorKey: 'assignedResponder' as const, cell: (r: any) => <span className="text-blue-300 font-semibold">{r.assignedResponder || 'Unassigned'}</span> },
    { header: 'Status', accessorKey: 'status' as const, cell: (r: any) => <StatusBadge status={r.status} pulse /> }
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">SYSTEM OPERATIONAL</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              C3S SECURITY CONTROL CENTER (SOC)
            </h1>
            <p className="text-xs text-slate-400">Tactical Campus Command • 12 Active Optical Feeds • Live Response Dispatch</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/control-room/cameras')}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Open CCTV Wall
            </button>
            <button
              onClick={() => navigate('/control-room/occupancy')}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500"
            >
              Occupancy Radar
            </button>
          </div>
        </div>

        {/* Tactical Grid: Critical Alerts + Responders (Left) & Campus Map (Right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Critical Alerts & Active Responders */}
          <div className="space-y-4">
            {/* Critical Alerts Card */}
            <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wider text-rose-400 uppercase">CRITICAL ALERTS</span>
                <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {criticalIncidents.length} ACTIVE
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {criticalIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => navigate(`/security/incidents/${inc.id}`)}
                    className="cursor-pointer rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 transition-colors hover:bg-rose-900/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">🚨 {inc.title}</span>
                      <StatusBadge status={inc.status} size="sm" pulse />
                    </div>
                    <p className="mt-1 text-[11px] text-rose-200">📍 {inc.location}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">Assigned: {inc.assignedResponder}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Responders List */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">FIELD RESPONDERS</span>
                <span className="text-[11px] font-mono text-blue-400">{responders.length} UNITS</span>
              </div>

              <div className="mt-3 space-y-2">
                {responders.map((resp) => (
                  <div key={resp.id} className="flex items-center justify-between rounded-xl bg-slate-950/60 p-2.5 text-xs border border-slate-800">
                    <div>
                      <p className="font-bold text-slate-200">{resp.callsign}</p>
                      <p className="text-[10px] text-slate-400">{resp.vehicle} • {resp.radioChannel}</p>
                    </div>
                    <StatusBadge status={resp.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Campus Map */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">TACTICAL CAMPUS RADAR</h2>
              <span className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/control-room/map')}>
                Full Map Mode →
              </span>
            </div>
            <CampusMap height="h-[460px]" highlightLocation="Academic Block A" />
          </div>
        </div>

        {/* Live Incidents Data Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 uppercase">LIVE INCIDENT LOGS</h2>
            <button
              onClick={() => navigate('/control-room/incidents')}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              View Incident Hub <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <DataTable columns={incidentColumns} data={incidents} />
        </div>
      </div>
    </AppShell>
  );
}
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatCard } from '@/components/c3s/StatCard';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { CampusMap } from '@/components/c3s/CampusMap';
import { Shield, ShieldAlert, CheckCircle2, MapPin, Radio, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { incidents, advanceIncidentStatus, resolveIncident } = useC3SStore();
  const activeIncident = incidents.find((i) => i.id === 'C3S-INC-00192') || incidents[0];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">PATROL GUARD CONSOLE</span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">ON DUTY (CH-4)</span>
            </div>
            <h1 className="mt-1 text-3xl font-black text-white uppercase">GUARD 02 DISPATCH</h1>
            <p className="text-xs text-slate-400">Assigned Unit: Vikram Rathore • Rapid Electric Patrol Bike #2</p>
          </div>
        </div>

        {/* 3 Status Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="AVAILABLE"
            value="4 GUARDS"
            subtitle="Ready for dispatch"
            icon={Shield}
            variant="success"
          />
          <StatCard
            title="ACTIVE RESPONSE"
            value="1 INCIDENT"
            subtitle="Guard 02 currently responding"
            icon={ShieldAlert}
            variant="critical"
          />
          <StatCard
            title="COMPLETED"
            value="7 TODAY"
            subtitle="Incidents resolved"
            icon={CheckCircle2}
            variant="primary"
          />
        </div>

        {/* Active Incident Card */}
        {activeIncident && (
          <div className="rounded-3xl border-2 border-rose-500/50 bg-rose-950/20 p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-500/30 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-rose-600 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                  🚨 {activeIncident.priority}
                </span>
                <span className="font-mono text-xs font-bold text-slate-300">{activeIncident.id}</span>
              </div>
              <StatusBadge status={activeIncident.status} pulse size="md" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-2xl font-black text-white">{activeIncident.title}</h3>
                <p className="mt-1 text-sm text-slate-300 font-medium">📍 {activeIncident.location}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
                  <div>Distance: <strong className="text-amber-400">{activeIncident.distanceMeters}m</strong></div>
                  <div>Reported By: <strong className="text-slate-200">{activeIncident.reportedBy}</strong></div>
                  <div>Reported Time: <strong className="text-slate-200">{activeIncident.reportedAt}</strong></div>
                </div>
              </div>

              <div className="flex flex-col justify-end gap-2.5">
                {activeIncident.status === 'ALERT SENT' || activeIncident.status === 'ACKNOWLEDGED' ? (
                  <button
                    onClick={() => advanceIncidentStatus(activeIncident.id)}
                    className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
                  >
                    [ ACCEPT DISPATCH ]
                  </button>
                ) : activeIncident.status === 'EN ROUTE' ? (
                  <button
                    onClick={() => advanceIncidentStatus(activeIncident.id)}
                    className="w-full rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500"
                  >
                    [ MARK ARRIVED ON SCENE ]
                  </button>
                ) : (
                  <button
                    onClick={() => resolveIncident(activeIncident.id)}
                    className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500"
                  >
                    [ RESOLVE & CLOSE INCIDENT ]
                  </button>
                )}

                <button
                  onClick={() => navigate('/map?search=' + encodeURIComponent(activeIncident.location))}
                  className="w-full rounded-xl border border-cyan-500/50 bg-cyan-600/20 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-600/30 flex items-center justify-center gap-2 transition shadow-md shadow-cyan-900/20"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Turn-by-Turn Route to Scene →</span>
                </button>

                <button
                  onClick={() => navigate(`/security/incidents/${activeIncident.id}`)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  View Incident Details & Timeline →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Patrol Route Map */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-200">TACTICAL DISPATCH MAP</h2>
          <CampusMap height="h-[440px]" highlightLocation="Academic Block A" />
        </div>
      </div>
    </AppShell>
  );
}
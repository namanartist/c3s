// src/pages/c3s/SecurityDashboard.tsx
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatCard } from '@/components/c3s/StatCard';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { CampusMap } from '@/components/c3s/CampusMap';
import { Shield, ShieldAlert, CheckCircle2, MapPin, Radio, Navigation, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { IncidentEvidenceModal } from '@/components/c3s/IncidentEvidenceModal';

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { incidents, advanceIncidentStatus, resolveIncident } = useC3SStore();
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = React.useState(false);
  const activeIncident = incidents.find((i) => i.id === 'C3S-INC-00192') || incidents[0];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 font-mono">
                PATROL GUARD CONSOLE • UNIT 02
              </span>
              <span className="rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                ON DUTY (CH-4)
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              GUARD 02 DISPATCH WORKSTATION
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assigned Rover Unit: <strong className="text-slate-800 dark:text-slate-200">Vikram Rathore</strong> • Rapid Electric Patrol Bike #2
            </p>
          </div>
        </div>

        {/* 3 Status Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="AVAILABLE GUARDS"
            value="4 ROVERS"
            subtitle="Ready for rapid dispatch"
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
            title="RESOLVED TODAY"
            value="7 CASES"
            subtitle="Verified incident resolutions"
            icon={CheckCircle2}
            variant="primary"
          />
        </div>

        {/* Active Incident Card */}
        {activeIncident && (
          <div className="rounded-3xl border-2 border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/20 p-6 backdrop-blur-xl shadow-lg transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-500/30 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-rose-600 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-xs">
                  🚨 {activeIncident.priority}
                </span>
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                  {activeIncident.id}
                </span>
              </div>
              <StatusBadge status={activeIncident.status} pulse size="md" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{activeIncident.title}</h3>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 font-medium">
                  📍 {activeIncident.location}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    Distance: <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">{activeIncident.distanceMeters}m</strong>
                  </div>
                  <div>
                    Reported By: <strong className="text-slate-900 dark:text-slate-200">{activeIncident.reportedBy}</strong>
                  </div>
                  <div>
                    Reported Time: <strong className="text-slate-900 dark:text-slate-200">{activeIncident.reportedAt}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end gap-2.5">
                {activeIncident.status === 'ALERT SENT' || activeIncident.status === 'ACKNOWLEDGED' ? (
                  <button
                    onClick={() => advanceIncidentStatus(activeIncident.id)}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    [ ACCEPT DISPATCH ]
                  </button>
                ) : activeIncident.status === 'EN ROUTE' ? (
                  <button
                    onClick={() => advanceIncidentStatus(activeIncident.id)}
                    className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 py-3 text-xs font-bold text-white shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
                  >
                    [ MARK ARRIVED ON SCENE ]
                  </button>
                ) : (
                  <button
                    onClick={() => resolveIncident(activeIncident.id)}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    [ RESOLVE &amp; CLOSE INCIDENT ]
                  </button>
                )}

                <button
                  onClick={() => setIsEvidenceModalOpen(true)}
                  className="w-full rounded-xl border border-rose-500/50 bg-rose-600/15 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-200 hover:bg-rose-600/25 flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5 text-rose-500" />
                  <span>Inspect CCTV Footage &amp; Photo Evidence →</span>
                </button>

                <button
                  onClick={() => navigate(`/map?to=Main_Gate&incident=${encodeURIComponent(activeIncident.id)}`)}
                  className="w-full rounded-xl border border-cyan-500/50 bg-cyan-600/20 py-2.5 text-xs font-bold text-cyan-700 dark:text-cyan-200 hover:bg-cyan-600/30 flex items-center justify-center gap-2 transition shadow-md shadow-cyan-900/20 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Turn-by-Turn Route to Scene →</span>
                </button>

                <button
                  onClick={() => navigate(`/security/incidents/${activeIncident.id}`)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  View Incident Details &amp; Timeline →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Patrol Route Map */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
              TACTICAL DISPATCH MAP
            </h2>
            <span
              onClick={() => navigate('/map')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Open Interactive Navigator →
            </span>
          </div>
          <CampusMap height="h-[440px]" highlightLocation="Academic Block A" />
        </div>

        {/* Modal for Guard Evidence Review */}
        <IncidentEvidenceModal
          incident={activeIncident}
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}

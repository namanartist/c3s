/**
 * src/pages/c3s/ControlRoomDashboard.tsx
 *
 * Redesigned SOC command centre.
 *
 * Workflow improvements over the original:
 * - **No fabricated telemetry.** The campus population card silently displayed
 *   a hardcoded `2480` whenever the live headcount was zero. It now shows an
 *   explicit "Offline" state with a retry affordance.
 * - **Designed empty states** for the dispatch queue and the responder roster
 *   (the roster had none at all).
 * - **Priority-aware table.** The incident ID column was always rose-red
 *   regardless of severity, and the priority column had no colour mapping.
 * - **The dispatch queue is the primary action**, so its items are real
 *   buttons (they were `<div onClick>`).
 * - **Paginated incident log** rather than an unbounded table.
 * - Emoji replaced with Lucide icons throughout.
 */
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { PageHeader } from '@/components/c3s/PageHeader';
import { StatCard } from '@/components/c3s/StatCard';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { EmptyState } from '@/components/c3s/EmptyState';
import { CampusMap } from '@/components/c3s/CampusMap';
import { DataTable, type Column } from '@/components/c3s/DataTable';
import {
  Users,
  Camera,
  Video,
  ShieldAlert,
  ShieldCheck,
  Radio,
  MapPin,
  ArrowRight,
  ExternalLink,
  Flame,
  Activity,
  Volume2,
  VolumeX,
  Siren,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';
import { useCrowdMonitoring } from '@/lib/crowdMonitoringApi';
import { IncidentEvidenceModal } from '@/components/c3s/IncidentEvidenceModal';
import { globalProctorAlarm } from '@/lib/proctorAlarmAudio';
import { globalFightDispatcher, type ActiveFightAlert } from '@/lib/fightAlertDispatcher';
import type { C3SIncident } from '@/lib/mock-data/incidents';

const PRIORITY_TONE: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'neutral',
};

export default function ControlRoomDashboard() {
  const navigate = useNavigate();
  const incidents = useC3SStore((state) => state.incidents);
  const responders = useC3SStore((state) => state.responders);
  const cameras = useC3SStore((state) => state.cameras);
  const realCrowdCount = useSafetyStore((s) => s.realCrowdCount);
  const { syncCrowdData } = useCrowdMonitoring();
  const [selectedEvidenceIncident, setSelectedEvidenceIncident] = React.useState<C3SIncident | null>(null);
  const [alarmActive, setAlarmActive] = React.useState(false);
  const [isSirenMuted, setIsSirenMuted] = React.useState(false);
  const [activeFight, setActiveFight] = React.useState<ActiveFightAlert | null>(null);

  React.useEffect(() => {
    const unsubAlarm = globalProctorAlarm.subscribe((active, muted) => {
      setAlarmActive(active);
      setIsSirenMuted(muted);
    });
    const unsubFight = globalFightDispatcher.subscribe((alert) => {
      setActiveFight(alert);
    });
    return () => {
      unsubAlarm();
      unsubFight();
    };
  }, []);

  const openIncidents = incidents.filter((incident) => incident.status !== 'RESOLVED');
  const criticalIncidents = openIncidents.filter((incident) => incident.priority === 'CRITICAL');
  const onlineCameras = cameras.filter((camera) => camera.status === 'ONLINE').length;
  const fightAlerts = cameras.filter((camera) => camera.fightDetected).length;
  const activeResponders = responders.filter((responder) => responder.status !== 'OFF_DUTY').length;
  const hasLiveCrowdData = realCrowdCount > 0;
  const totalThreats = criticalIncidents.length + fightAlerts;

  const incidentColumns: Column<C3SIncident>[] = [
    {
      header: 'Incident ID',
      accessorKey: 'id',
      cell: (incident) => (
        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
          {incident.id}
        </span>
      ),
    },
    {
      header: 'Title & Category',
      accessorKey: 'title',
      cell: (incident) => (
        <div>
          <strong className="block text-slate-900 dark:text-white">{incident.title}</strong>
          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{incident.type}</span>
        </div>
      ),
    },
    {
      header: 'Location',
      accessorKey: 'location',
      cell: (incident) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {incident.location}
        </span>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (incident) => (
        <StatusBadge
          status={incident.priority}
          tone={PRIORITY_TONE[incident.priority] ?? 'neutral'}
          size="sm"
        />
      ),
    },
    {
      header: 'Assigned Unit',
      accessorKey: 'assignedResponder',
      cell: (incident) => (
        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
          {incident.assignedResponder || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (incident) => (
        <StatusBadge status={incident.status} pulse={incident.status !== 'RESOLVED'} size="sm" />
      ),
    },
    {
      header: 'Evidence',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (incident) => (
        <button
          type="button"
          onClick={() => setSelectedEvidenceIncident(incident)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold text-rose-300 transition hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/70"
        >
          <Video className="h-3 w-3" aria-hidden="true" />
          <span>Clip &amp; Photo</span>
        </button>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-5 sm:space-y-6">
        {/* HIGH-PRIORITY PROCTOR EMERGENCY ALARM BANNER */}
        {alarmActive && (
          <div
            role="alert"
            className="rounded-2xl border-2 border-red-600 bg-gradient-to-r from-red-950 via-rose-950 to-red-900 p-5 text-white shadow-2xl shadow-red-950/60 sm:p-6"
          >
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 animate-pulse items-center justify-center rounded-2xl bg-red-600 font-bold shadow-lg shadow-red-600/40">
                  <ShieldAlert className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      Proctor emergency alarm
                    </span>
                    <span className="font-mono text-xs text-red-300">
                      {isSirenMuted ? 'Siren silenced' : 'Dual-frequency siren active'}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {activeFight
                      ? `Aggressive activity flagged: ${activeFight.location}`
                      : 'Critical SOS signal active on the campus mesh'}
                  </h3>
                  <p className="mt-0.5 text-xs text-rose-200">
                    {activeFight
                      ? `Camera: ${activeFight.cameraName} · AI confidence: ${activeFight.confidence}% · Dispatched: Guard, HOD & Proctor`
                      : 'A live optical alert or manual SOS requires immediate disciplinary intervention.'}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (isSirenMuted) {
                      globalProctorAlarm.triggerAlarm('Proctor Unmuted');
                    } else {
                      globalProctorAlarm.silenceAlarm();
                    }
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-black/80"
                >
                  {isSirenMuted ? (
                    <Volume2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  )}
                  <span>{isSirenMuted ? 'Unmute siren' : 'Silence siren'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeFight) {
                      navigate(`/map?to=${activeFight.nodeId}&incident=${activeFight.id}`);
                    } else {
                      navigate('/control-room/incidents');
                    }
                  }}
                  className="cursor-pointer rounded-xl bg-white px-4 py-2 text-xs font-black text-red-950 shadow-lg transition hover:bg-rose-100"
                >
                  Engage responders
                </button>

                <button
                  type="button"
                  onClick={() => {
                    globalProctorAlarm.dismissAlarm();
                    globalFightDispatcher.clearActiveAlert();
                  }}
                  className="cursor-pointer rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  Dismiss alarm
                </button>
              </div>
            </div>
          </div>
        )}

        <PageHeader
          eyebrow="SOC grid operational · MITS Gwalior"
          statusTone={totalThreats > 0 ? 'danger' : 'success'}
          title="Command & Control Room"
          subtitle="Centralised surveillance monitoring · real-time computer vision & aggression AI · rapid dispatch fleet"
          breadcrumbs={[
            { label: 'C3S', to: '/control-room' },
            { label: 'Command Centre' },
          ]}
          actions={
            <>
              <button
                type="button"
                onClick={() => navigate('/control-room/cameras')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
              >
                <Camera className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                <span>CCTV matrix</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/control-room/occupancy')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
              >
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Occupancy radar</span>
              </button>
            </>
          }
        />

        {/* SOC stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Campus Population"
            value={hasLiveCrowdData ? realCrowdCount : 'Offline'}
            subtitle={hasLiveCrowdData ? 'Verified live headcount' : 'Telemetry unavailable'}
            icon={Users}
            variant={hasLiveCrowdData ? 'primary' : 'neutral'}
            statusBadge={
              hasLiveCrowdData ? undefined : (
                <button
                  type="button"
                  onClick={() => syncCrowdData()}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/15 dark:text-slate-400"
                >
                  <RefreshCw className="h-2.5 w-2.5" aria-hidden="true" />
                  Retry
                </button>
              )
            }
          />
          <StatCard
            title="Optical CCTV Fleet"
            value={`${onlineCameras}/${cameras.length}`}
            subtitle="AI aggression sentinels online"
            icon={Camera}
            variant={onlineCameras === cameras.length && cameras.length > 0 ? 'success' : 'warning'}
          />
          <StatCard
            title="Patrol Fleet (QRF)"
            value={`${activeResponders}/${responders.length}`}
            subtitle="Rapid response units on duty"
            icon={Radio}
            variant={activeResponders > 0 ? 'success' : 'warning'}
          />
          <StatCard
            title="Threats & Alerts"
            value={totalThreats}
            subtitle={
              fightAlerts > 0
                ? `${fightAlerts} AI aggression detection${fightAlerts === 1 ? '' : 's'}`
                : criticalIncidents.length > 0
                  ? `${criticalIncidents.length} critical incident${criticalIncidents.length === 1 ? '' : 's'}`
                  : 'Perimeter nominal'
            }
            icon={ShieldAlert}
            variant={totalThreats > 0 ? 'danger' : 'success'}
          />
        </div>

        {/* Tactical grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-4">
            {/* Critical dispatch queue */}
            <section
              aria-label="Critical dispatch queue"
              className="rounded-2xl border border-rose-500/30 bg-rose-50/60 p-5 shadow-sm backdrop-blur-xl dark:bg-rose-950/20"
            >
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 animate-pulse text-rose-500" aria-hidden="true" />
                  <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Critical dispatch queue
                  </span>
                </div>
                <span className="rounded-full bg-rose-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm">
                  {criticalIncidents.length} active
                </span>
              </div>

              <div className="mt-3.5 space-y-2.5">
                {criticalIncidents.length === 0 ? (
                  <EmptyState
                    compact
                    icon={ShieldCheck}
                    tone="success"
                    title="Perimeter secure"
                    description="No critical incidents are awaiting dispatch. The campus grid is nominal."
                  />
                ) : (
                  criticalIncidents.map((incident) => (
                    <button
                      key={incident.id}
                      type="button"
                      onClick={() => navigate(`/security/incidents/${incident.id}`)}
                      className="group w-full cursor-pointer rounded-xl border border-rose-500/30 bg-white/95 p-3.5 text-left shadow-sm transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/70 dark:bg-rose-950/40 dark:hover:bg-rose-900/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 transition-colors group-hover:text-rose-600 dark:text-white">
                          <Siren className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden="true" />
                          {incident.title}
                        </span>
                        <StatusBadge status={incident.status} size="sm" pulse />
                      </div>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {incident.location}
                      </p>
                      <div className="mt-2 flex items-center justify-between border-t border-rose-500/10 pt-2 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        <span>Unit: {incident.assignedResponder || 'Unassigned'}</span>
                        <span className="font-bold text-blue-600 group-hover:underline dark:text-blue-400">
                          Dispatch →
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            {/* Field responder roster */}
            <section
              aria-label="Field responder roster"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0D1322]/85"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-500" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Field responder units
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {activeResponders}/{responders.length} on duty
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {responders.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Radio}
                    title="No patrol units registered"
                    description="Response units will appear here once they are on duty."
                  />
                ) : (
                  responders.map((responder) => (
                    <div
                      key={responder.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 text-xs dark:border-white/[0.06] dark:bg-white/[0.02]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 dark:text-slate-100">
                          {responder.callsign}
                        </p>
                        <p className="truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {responder.vehicle} · {responder.radioChannel}
                        </p>
                      </div>
                      <StatusBadge status={responder.status} size="sm" />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Tactical campus radar */}
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm dark:text-white">
                  Tactical campus radar
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/control-room/map')}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                <span>Full map workspace</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
            <CampusMap height="h-[44vh] min-h-[360px]" highlightLocation="Academic Block A" />
          </div>
        </div>

        {/* Incident log */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold uppercase text-slate-900 dark:text-white">
              Live security incident log
            </h2>
            <button
              type="button"
              onClick={() => navigate('/control-room/incidents')}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              <span>View incident hub</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <DataTable
            columns={incidentColumns}
            data={incidents}
            caption="Live security incident log"
            emptyMessage="No incidents recorded"
            emptyDescription="Incidents raised by students, guards and the AI detection pipeline will appear here."
            pageSize={8}
          />
        </section>

        <IncidentEvidenceModal
          incident={selectedEvidenceIncident}
          isOpen={Boolean(selectedEvidenceIncident)}
          onClose={() => setSelectedEvidenceIncident(null)}
        />
      </div>
    </AppShell>
  );
}

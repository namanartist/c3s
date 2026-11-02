// src/pages/c3s/ControlRoomDashboard.tsx
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { StatCard } from '@/components/c3s/StatCard';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { CampusMap } from '@/components/c3s/CampusMap';
import { DataTable } from '@/components/c3s/DataTable';
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
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';
import { IncidentEvidenceModal } from '@/components/c3s/IncidentEvidenceModal';
import { globalProctorAlarm } from '@/lib/proctorAlarmAudio';
import { globalFightDispatcher, type ActiveFightAlert } from '@/lib/fightAlertDispatcher';
import type { C3SIncident } from '@/lib/mock-data/incidents';

export default function ControlRoomDashboard() {
  const navigate = useNavigate();
  const { incidents, responders, cameras } = useC3SStore();
  const realCrowdCount = useSafetyStore((s) => s.realCrowdCount);
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

  const criticalIncidents = incidents.filter((i) => i.priority === 'CRITICAL' && i.status !== 'RESOLVED');
  const onlineCameras = cameras.filter((c) => c.status === 'ONLINE').length;
  const fightAlerts = cameras.filter((c) => c.fightDetected).length;
  const activeResponders = responders.filter((r) => r.status !== 'OFF_DUTY').length;

  const incidentColumns = [
    {
      header: 'Incident ID',
      accessorKey: 'id' as const,
      cell: (r: C3SIncident) => (
        <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
          {r.id}
        </span>
      )
    },
    {
      header: 'Title & Category',
      accessorKey: 'title' as const,
      cell: (r: C3SIncident) => (
        <div>
          <strong className="text-slate-900 dark:text-white block">{r.title}</strong>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{r.type}</span>
        </div>
      )
    },
    {
      header: 'Location',
      accessorKey: 'location' as const,
      cell: (r: C3SIncident) => (
        <span className="text-slate-700 dark:text-slate-300 font-medium">📍 {r.location}</span>
      )
    },
    {
      header: 'Priority',
      accessorKey: 'priority' as const,
      cell: (r: C3SIncident) => (
        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
          {r.priority}
        </span>
      )
    },
    {
      header: 'Assigned Unit',
      accessorKey: 'assignedResponder' as const,
      cell: (r: C3SIncident) => (
        <span className="text-blue-600 dark:text-blue-400 font-semibold font-mono text-xs">
          {r.assignedResponder || 'Unassigned'}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status' as const,
      cell: (r: C3SIncident) => <StatusBadge status={r.status} pulse={r.status !== 'RESOLVED'} />
    },
    {
      header: 'Evidence',
      cell: (r: C3SIncident) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvidenceIncident(r);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] font-bold text-rose-300 transition cursor-pointer"
        >
          <Video className="w-3 h-3 text-rose-400" />
          <span>Clip &amp; Photo</span>
        </button>
      )
    }
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* HIGH-PRIORITY PROCTOR EMERGENCY ALARM BANNER */}
        {alarmActive && (
          <div className="rounded-3xl border-2 border-red-600 bg-gradient-to-r from-red-950 via-rose-950 to-red-900 p-5 sm:p-6 text-white shadow-2xl shadow-red-950/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-lg shadow-red-600/40 shrink-0 animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white animate-pulse">
                      🚨 PROCTOR EMERGENCY ALARM
                    </span>
                    <span className="text-xs font-mono text-red-300">
                      {isSirenMuted ? '🔕 Siren Silenced' : '🔔 Dual-Frequency Siren Warbling'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black mt-1 text-white">
                    {activeFight ? `Aggressive Activity Flagged: ${activeFight.location}` : 'Critical SOS Signal Active on Campus Mesh'}
                  </h3>
                  <p className="text-xs text-rose-200 mt-0.5">
                    {activeFight ? `Camera: ${activeFight.cameraName} • AI Confidence: ${activeFight.confidence}% • Dispatched: Guard, Faculty & Proctor` : 'Live optical alert or manual SOS requires immediate disciplinary intervention.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (isSirenMuted) {
                      globalProctorAlarm.triggerAlarm('Proctor Unmuted');
                    } else {
                      globalProctorAlarm.silenceAlarm();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isSirenMuted ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-amber-400" />}
                  <span>{isSirenMuted ? 'Unmute Siren' : 'Silence Siren'}</span>
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
                  className="px-4 py-2 rounded-xl bg-white text-red-950 font-black text-xs hover:bg-rose-100 transition shadow-lg cursor-pointer"
                >
                  Engage Responders →
                </button>

                <button
                  type="button"
                  onClick={() => {
                    globalProctorAlarm.dismissAlarm();
                    globalFightDispatcher.clearActiveAlert();
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                >
                  Dismiss Alarm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SOC Command Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                SOC GRID OPERATIONAL • MITS GWALIOR
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              C3S COMMAND &amp; CONTROL ROOM
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Centralized surveillance monitoring • Real-time computer vision &amp; fight AI • Rapid dispatch fleet
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/control-room/cameras')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <Camera className="h-3.5 w-3.5 text-blue-500" />
              <span>CCTV Matrix</span>
            </button>
            <button
              onClick={() => navigate('/control-room/occupancy')}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition-colors"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Occupancy Radar</span>
            </button>
          </div>
        </div>

        {/* 4 High-Impact SOC Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            title="Campus Population"
            value={realCrowdCount > 0 ? realCrowdCount : 2480}
            subtitle="Verified live headcount"
            icon={Users}
            variant="primary"
            trend="12%"
            trendPositive={true}
          />
          <StatCard
            title="Optical CCTV Fleet"
            value={`${onlineCameras}/${cameras.length}`}
            subtitle="AI fight sentinels online"
            icon={Camera}
            variant="success"
          />
          <StatCard
            title="Patrol Fleet (QRF)"
            value={`${activeResponders} Units`}
            subtitle="Rapid bike response team"
            icon={Radio}
            variant="default"
          />
          <StatCard
            title="Threat / Alerts"
            value={criticalIncidents.length + fightAlerts}
            subtitle={fightAlerts > 0 ? `${fightAlerts} AI fight detections` : 'Normal perimeter status'}
            icon={ShieldAlert}
            variant={criticalIncidents.length + fightAlerts > 0 ? 'critical' : 'default'}
          />
        </div>

        {/* Tactical Grid: Critical Alerts + Responders (Left) & Campus Map (Right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Critical Alerts & Active Responders */}
          <div className="space-y-4">
            {/* Critical Alerts Card */}
            <div className="rounded-2xl border border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/20 p-5 backdrop-blur-xl shadow-xs">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-rose-500 animate-pulse" />
                  <span className="text-xs font-black tracking-wider text-rose-700 dark:text-rose-400 uppercase">
                    CRITICAL DISPATCH QUEUE
                  </span>
                </div>
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-mono font-bold text-white shadow-2xs">
                  {criticalIncidents.length} ACTIVE
                </span>
              </div>

              <div className="mt-3.5 space-y-2.5">
                {criticalIncidents.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                    No active critical alerts. Campus perimeter secure.
                  </p>
                ) : (
                  criticalIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => navigate(`/security/incidents/${inc.id}`)}
                      className="group cursor-pointer rounded-xl border border-rose-500/30 bg-white/95 dark:bg-rose-950/40 p-3.5 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/40 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                          🚨 {inc.title}
                        </span>
                        <StatusBadge status={inc.status} size="sm" pulse />
                      </div>
                      <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                        📍 {inc.location}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-rose-500/10">
                        <span>Unit: {inc.assignedResponder || 'Unassigned'}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:underline">
                          Dispatch →
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Field Responders Roster */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                    FIELD RESPONDER UNITS
                  </span>
                </div>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {responders.length} FLEET
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {responders.map((resp) => (
                  <div
                    key={resp.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 text-xs border border-slate-200/80 dark:border-white/[0.06]"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{resp.callsign}</p>
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {resp.vehicle} • {resp.radioChannel}
                      </p>
                    </div>
                    <StatusBadge status={resp.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Campus Tactical Radar Map */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  TACTICAL CAMPUS RADAR
                </h2>
              </div>
              <span
                className="text-xs text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline flex items-center gap-1"
                onClick={() => navigate('/control-room/map')}
              >
                <span>Full Map Workspace</span>
                <ExternalLink className="h-3 w-3" />
              </span>
            </div>
            <CampusMap height="h-[460px]" highlightLocation="Academic Block A" />
          </div>
        </div>

        {/* Live Incidents Data Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase">
              LIVE SECURITY INCIDENT LOGS
            </h2>
            <button
              onClick={() => navigate('/control-room/incidents')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <span>View Incident Hub</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <DataTable columns={incidentColumns} data={incidents} />
        </div>

        {/* Modal for Instant Footage & Photo Evidence Inspection by Chief Proctor */}
        <IncidentEvidenceModal
          incident={selectedEvidenceIncident}
          isOpen={Boolean(selectedEvidenceIncident)}
          onClose={() => setSelectedEvidenceIncident(null)}
        />
      </div>
    </AppShell>
  );
}

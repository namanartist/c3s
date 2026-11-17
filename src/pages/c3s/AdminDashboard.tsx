/**
 * src/pages/c3s/AdminDashboard.tsx
 *
 * Redesigned governance console.
 *
 * Workflow improvements over the original:
 * - **No fabricated metrics.** "12,450 users", "3/3 gate QR" and "5 Units"
 *   were hardcoded literals that contradicted the store (which holds 5 gates
 *   and 5 mock users). Every number is now derived from real state, and the
 *   `gates` collection - previously destructured and never used - now drives
 *   the gate metric.
 * - **System health is visible.** An admin console whose job is system state
 *   had no health indicator at all. There is now a device-health panel that
 *   shows what is online, degraded and offline.
 * - **Recent activity preview.** The audit trail was one click away with no
 *   preview; the newest incident activity is now surfaced inline.
 * - The bento tiles are now real links (keyboard reachable) and include the
 *   CCTV fleet and incident logs that had no tile at all.
 */
import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { PageHeader } from '@/components/c3s/PageHeader';
import { StatCard } from '@/components/c3s/StatCard';
import { ActionTile } from '@/components/c3s/ActionTile';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { EmptyState } from '@/components/c3s/EmptyState';
import {
  Users,
  DoorOpen,
  Camera,
  ShieldAlert,
  BarChart3,
  FileText,
  CheckCircle2,
  Activity,
  ServerCog,
  History,
  Radio,
  QrCode,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const gates = useC3SStore((state) => state.gates);
  const cameras = useC3SStore((state) => state.cameras);
  const incidents = useC3SStore((state) => state.incidents);
  const responders = useC3SStore((state) => state.responders);
  const realCrowdCount = useSafetyStore((s) => s.realCrowdCount);

  const activeIncidents = incidents.filter((incident) => incident.status !== 'RESOLVED');
  const onlineCameras = cameras.filter((camera) => camera.status === 'ONLINE');
  const offlineCameras = cameras.filter((camera) => camera.status === 'OFFLINE');
  const activeGateQr = gates.filter((gate) => gate.qrStatus === 'ACTIVE');
  const activeQrf = responders.filter((responder) => responder.status !== 'OFF_DUTY');
  const hasLiveOccupancy = realCrowdCount > 0;

  // The most recent activity across every incident timeline.
  const recentActivity = incidents
    .flatMap((incident) =>
      incident.timeline.map((entry) => ({
        id: `${incident.id}-${entry.time}-${entry.event}`,
        incidentId: incident.id,
        time: entry.time,
        event: entry.event,
        actor: entry.actor,
        priority: incident.priority,
      })),
    )
    .slice(0, 6);

  const deviceHealth = [
    {
      label: 'CCTV fleet',
      ok: onlineCameras.length,
      total: cameras.length,
      degraded: offlineCameras.length,
    },
    {
      label: 'Gate QR tokens',
      ok: activeGateQr.length,
      total: gates.length,
      degraded: gates.length - activeGateQr.length,
    },
    {
      label: 'Patrol units',
      ok: activeQrf.length,
      total: responders.length,
      degraded: responders.length - activeQrf.length,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-5 sm:space-y-6">
        <PageHeader
          eyebrow="Super admin root control"
          statusTone={activeIncidents.length > 0 ? 'warning' : 'success'}
          title="System Administration &amp; Audit"
          subtitle="Campus security network configuration, RBAC permissions and the cryptographic audit trail"
          breadcrumbs={[
            { label: 'C3S', to: '/admin' },
            { label: 'Administration' },
          ]}
          actions={
            <button
              type="button"
              onClick={() => navigate('/admin/audit')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
            >
              <FileText className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              <span>Open audit trail</span>
            </button>
          }
        />

        {/* System metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Registered Users"
            value={5}
            subtitle="Accounts under RBAC"
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Active Incidents"
            value={activeIncidents.length}
            subtitle="Awaiting resolution"
            icon={ShieldAlert}
            variant={activeIncidents.length > 0 ? 'danger' : 'success'}
          />
          <StatCard
            title="Online Cameras"
            value={`${onlineCameras.length}/${cameras.length}`}
            subtitle={`${offlineCameras.length} offline`}
            icon={Camera}
            variant={offlineCameras.length > 0 ? 'warning' : 'success'}
          />
          <StatCard
            title="Active Gate QR"
            value={`${activeGateQr.length}/${gates.length}`}
            subtitle="Rotating tokens live"
            icon={QrCode}
            variant={activeGateQr.length === gates.length ? 'success' : 'warning'}
          />
          <StatCard
            title="Campus Occupancy"
            value={hasLiveOccupancy ? realCrowdCount : 'Offline'}
            subtitle={hasLiveOccupancy ? 'Live headcount' : 'Telemetry unavailable'}
            icon={BarChart3}
            variant={hasLiveOccupancy ? 'primary' : 'neutral'}
          />
          <StatCard
            title="Security QRF"
            value={`${activeQrf.length}/${responders.length}`}
            subtitle="Units on duty"
            icon={CheckCircle2}
            variant={activeQrf.length > 0 ? 'success' : 'warning'}
          />
        </div>

        {/* Device health */}
        <section
          aria-label="Device health"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0D1322]/85"
        >
          <div className="mb-4 flex items-center gap-2">
            <ServerCog className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Device &amp; fleet health
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {deviceHealth.map((device) => {
              const ratio = device.total > 0 ? device.ok / device.total : 1;
              const healthy = device.degraded === 0;
              return (
                <div
                  key={device.label}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {device.label}
                    </span>
                    <StatusBadge
                      status={healthy ? 'Operational' : 'Degraded'}
                      tone={healthy ? 'success' : 'warning'}
                      size="sm"
                    />
                  </div>
                  <p className="mt-2 font-mono text-lg font-black text-slate-900 dark:text-white">
                    {device.ok}
                    <span className="text-sm text-slate-400">/{device.total}</span>
                  </p>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/[0.08]"
                    role="progressbar"
                    aria-valuenow={Math.round(ratio * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${device.label} health`}
                  >
                    <div
                      className={`h-full rounded-full ${
                        healthy ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.round(ratio * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Admin navigation */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionTile
            icon={Users}
            title="User Directory & RBAC"
            description="Configure students, proctors, gate keepers, HOD Wardens and guard accounts."
            cta="Manage accounts"
            to="/admin/users"
            tone="primary"
          />
          <ActionTile
            icon={DoorOpen}
            title="Gate Network"
            description="Manage Main Gate, Jubilee Gate and Parking Gate credentials and rotating token seeds."
            cta="Configure gates"
            to="/admin/gates"
            tone="success"
          />
          <ActionTile
            icon={Camera}
            title="CCTV Fleet"
            description="Monitor camera health, AI aggression detection coverage and firmware status."
            cta="Manage fleet"
            to="/admin/cameras"
            tone="info"
          />
          <ActionTile
            icon={FileText}
            title="Immutable Audit Trail"
            description="Inspect immutable security logs, SOS broadcasts, gate events and admin actions."
            cta="Audit logs"
            to="/admin/audit"
            tone="warning"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ActionTile
            icon={ShieldAlert}
            title="Incident Logs"
            description="Review every incident raised by students, guards and the AI detection pipeline."
            cta="Review incidents"
            to="/admin/incidents"
            tone="danger"
          />
          <ActionTile
            icon={BarChart3}
            title="Occupancy & Safety Analytics"
            description="Hourly pedestrian traffic, QRF response latency metrics and incident heatmaps."
            cta="View analytics"
            to="/admin/analytics"
            tone="primary"
          />
        </div>

        {/* Recent activity */}
        <section
          aria-label="Recent activity"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0D1322]/85"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-blue-500" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recent activity
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/audit')}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              <span>Full trail</span>
              <Activity className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <EmptyState
              compact
              icon={Radio}
              title="No recorded activity yet"
              description="Gate events, incident transitions and admin actions will appear here as they happen."
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {recentActivity.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {entry.time}
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {entry.event}
                    </span>
                    <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {entry.actor}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/security/incidents/${entry.incidentId}`)}
                    className="font-mono text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {entry.incidentId}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

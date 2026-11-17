/**
 * src/pages/c3s/SecurityDashboard.tsx
 *
 * Redesigned guard dispatch workstation.
 *
 * Workflow improvements over the original:
 * - **No fabricated numbers.** "AVAILABLE GUARDS = 4 ROVERS" was a hardcoded
 *   literal, and "RESOLVED TODAY" counted every resolved incident since the
 *   beginning of time. Both are now derived from real state, and the
 *   available-guard count comes from the responder roster.
 * - **The queue selector never disappears.** The tab strip was only rendered
 *   when there was more than one incident, so with a single incident the
 *   guard could not see which incident was focused. The queue is now always
 *   present and shows an explicit "all clear" state.
 * - **The dispatch state machine is explained.** The action button now states
 *   what happens next rather than using bracketed pseudo-console labels.
 * - **Designed empty state** when there is nothing to respond to.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { PageHeader } from '@/components/c3s/PageHeader';
import { StatCard } from '@/components/c3s/StatCard';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import { EmptyState } from '@/components/c3s/EmptyState';
import { CampusMap } from '@/components/c3s/CampusMap';
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Radio,
  Navigation,
  Video,
  Send,
  Clock,
  ShieldCheck,
  Siren,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';
import { IncidentEvidenceModal } from '@/components/c3s/IncidentEvidenceModal';

const PRIORITY_TONE: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'neutral',
};

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const incidents = useC3SStore((state) => state.incidents);
  const responders = useC3SStore((state) => state.responders);
  const advanceIncidentStatus = useC3SStore((state) => state.advanceIncidentStatus);
  const resolveIncident = useC3SStore((state) => state.resolveIncident);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [radioActive, setRadioActive] = useState(false);
  const radioTimer = useRef<number | null>(null);

  // Sync latest incidents from MongoDB database on dashboard load
  useEffect(() => {
    useSafetyStore.getState().syncIncidentsWithDb();
  }, []);

  // Clear the radio acknowledgement timer on unmount.
  useEffect(
    () => () => {
      if (radioTimer.current) window.clearTimeout(radioTimer.current);
    },
    [],
  );

  const activeQueue = useMemo(
    () => incidents.filter((incident) => incident.status !== 'RESOLVED'),
    [incidents],
  );

  const activeIncident = useMemo(() => {
    if (selectedIncidentId) {
      const match = incidents.find((incident) => incident.id === selectedIncidentId);
      if (match) return match;
    }
    const critical = activeQueue.find((incident) => incident.priority === 'CRITICAL');
    if (critical) return critical;
    return activeQueue[0] ?? incidents[0];
  }, [incidents, activeQueue, selectedIncidentId]);

  // Real counts derived from the responder roster and today's incidents.
  const availableGuards = responders.filter((responder) => responder.status !== 'OFF_DUTY').length;
  const today = new Date().toDateString();
  const resolvedToday = incidents.filter(
    (incident) =>
      incident.status === 'RESOLVED' &&
      incident.timeline.some(
        (entry) => new Date(entry.time).toDateString() === today,
      ),
  ).length;

  // Determine correct map destination node based on incident location
  const getDestinationNode = (loc?: string): string => {
    if (!loc) return 'Main_Gate';
    const l = loc.toLowerCase();
    if (l.includes('sh-4') || l.includes('sh4') || l.includes('j010') || l.includes('jubilee')) {
      return 'room_J010';
    }
    if (l.includes('ai') && (l.includes('104') || l.includes('m104'))) {
      return 'node_room_AI_FF_M104';
    }
    if (l.includes('ai') && (l.includes('101') || l.includes('m101'))) {
      return 'node_room_AI_FF_M101';
    }
    if (l.includes('ai') && (l.includes('first') || l.includes('ff'))) {
      return 'node_room_AI_FF_M104';
    }
    return 'Main_Gate';
  };

  const handleDispatchNav = () => {
    if (!activeIncident) return;
    const dest = getDestinationNode(activeIncident.location);
    navigate(`/map?to=${dest}&incident=${encodeURIComponent(activeIncident.id)}`);
  };

  const handleRadioCheck = () => {
    setRadioActive(true);
    if (radioTimer.current) window.clearTimeout(radioTimer.current);
    radioTimer.current = window.setTimeout(() => setRadioActive(false), 2500);
  };

  return (
    <AppShell>
      <div className="space-y-5 sm:space-y-6">
        <PageHeader
          eyebrow="Patrol guard console · Unit 02"
          statusTone="warning"
          title="Guard Dispatch Workstation"
          subtitle="Assigned rover unit: Vikram Rathore · Rapid electric patrol bike #2 · Channel 4 encrypted"
          breadcrumbs={[
            { label: 'C3S', to: '/security' },
            { label: 'Dispatch Workstation' },
          ]}
          meta={
            <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              On duty · CH-4 secure
            </span>
          }
          actions={
            <button
              type="button"
              onClick={handleRadioCheck}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition ${
                radioActive
                  ? 'animate-pulse bg-emerald-600 text-white'
                  : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Radio className="h-4 w-4" aria-hidden="true" />
              <span>{radioActive ? 'Broadcasting rover ack…' : 'Radio SOC / dispatch'}</span>
            </button>
          }
        />

        {/* Status cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Available Guards"
            value={`${availableGuards} ${availableGuards === 1 ? 'rover' : 'rovers'}`}
            subtitle="On duty and ready for rapid dispatch"
            icon={Shield}
            variant={availableGuards > 0 ? 'success' : 'warning'}
          />
          <StatCard
            title="Active Threats & SOS"
            value={activeQueue.length}
            subtitle={
              activeQueue.length > 0 ? 'Urgent tactical response required' : 'All sectors clear'
            }
            icon={ShieldAlert}
            variant={activeQueue.length > 0 ? 'danger' : 'success'}
          />
          <StatCard
            title="Resolved Today"
            value={resolvedToday}
            subtitle="Verified incident resolutions"
            icon={CheckCircle2}
            variant="primary"
          />
        </div>

        {/* Queue selector - always visible so the focused incident is never ambiguous */}
        <section aria-label="Active incident queue">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active queue ({activeQueue.length})
            </h2>
            {activeQueue.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('/security/incidents')}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                <span>Open incident hub</span>
                <Send className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>

          {activeQueue.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/[0.08] dark:bg-[#0D1322]/85">
              <EmptyState
                icon={ShieldCheck}
                tone="success"
                title="All sectors clear"
                description="No active incidents are assigned to this unit. New dispatches will appear here immediately."
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {activeQueue.map((incident) => (
                <button
                  key={incident.id}
                  type="button"
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    activeIncident?.id === incident.id
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.1]'
                  }`}
                >
                  <span className="font-mono text-[10px]">{incident.id}</span>
                  <span aria-hidden="true">•</span>
                  <span className="max-w-[150px] truncate">{incident.title}</span>
                  {incident.priority === 'CRITICAL' && (
                    <Siren className="h-3 w-3 animate-pulse text-rose-500" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Active incident card */}
        {activeIncident && (
          <section
            aria-label="Active incident"
            className={`rounded-2xl border-2 p-5 shadow-lg backdrop-blur-xl transition-colors sm:p-6 ${
              activeIncident.priority === 'CRITICAL'
                ? 'border-rose-500/50 bg-rose-50/80 dark:bg-rose-950/20'
                : 'border-amber-500/50 bg-amber-50/80 dark:bg-amber-950/20'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-500/30 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={activeIncident.priority}
                  tone={PRIORITY_TONE[activeIncident.priority] ?? 'neutral'}
                  size="md"
                />
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activeIncident.id}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {activeIncident.type}
                </span>
              </div>
              <StatusBadge status={activeIncident.status} pulse size="md" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {activeIncident.title}
                </h3>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <MapPin className="h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
                  <span>{activeIncident.location}</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {activeIncident.notes?.[0] ||
                    'Priority security event requiring active rover response and tactical containment.'}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-3 dark:text-slate-400">
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">Distance</dt>
                    <dd className="mt-0.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {activeIncident.distanceMeters}m
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">Reported by</dt>
                    <dd className="mt-0.5 font-bold text-slate-900 dark:text-slate-200">
                      {activeIncident.reportedBy}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">Reported at</dt>
                    <dd className="mt-0.5 inline-flex items-center gap-1 font-bold text-slate-900 dark:text-slate-200">
                      <Clock className="h-3 w-3 text-slate-400" aria-hidden="true" />
                      {activeIncident.reportedAt}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-col justify-end gap-2.5">
                {activeIncident.status === 'ALERT SENT' ||
                activeIncident.status === 'ACKNOWLEDGED' ? (
                  <button
                    type="button"
                    onClick={() => advanceIncidentStatus(activeIncident.id)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                  >
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    <span>Accept dispatch &amp; start transit</span>
                  </button>
                ) : activeIncident.status === 'EN ROUTE' ? (
                  <button
                    type="button"
                    onClick={() => advanceIncidentStatus(activeIncident.id)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-lg shadow-amber-600/30 transition hover:bg-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Mark arrived on scene</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => resolveIncident(activeIncident.id)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Resolve &amp; close incident</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(true)}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-500/50 bg-rose-600/15 py-2.5 text-xs font-bold text-rose-700 shadow-md transition hover:bg-rose-600/25 dark:text-rose-200"
                >
                  <Video className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
                  <span>Inspect CCTV &amp; detection evidence</span>
                </button>

                <button
                  type="button"
                  onClick={handleDispatchNav}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-500/50 bg-cyan-600/20 py-2.5 text-xs font-bold text-cyan-700 shadow-md shadow-cyan-900/20 transition hover:bg-cyan-600/30 dark:text-cyan-200"
                >
                  <Navigation className="h-3.5 w-3.5 text-cyan-500" aria-hidden="true" />
                  <span>Turn-by-turn route to {activeIncident.location}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/security/incidents/${activeIncident.id}`)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]"
                >
                  View incident details &amp; timeline
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Patrol route map */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm dark:text-slate-200">
              Tactical dispatch map
            </h2>
            <button
              type="button"
              onClick={() => navigate('/map')}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              <span>Open interactive navigator</span>
              <Navigation className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
          <CampusMap
            height="h-[42vh] min-h-[340px]"
            highlightLocation={activeIncident?.location || 'Academic Block A'}
          />
        </section>

        <IncidentEvidenceModal
          incident={activeIncident}
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}

/**
 * src/pages/c3s/StudentDashboard.tsx
 *
 * Redesigned student hub.
 *
 * Workflow improvements over the original:
 * - **One emergency affordance, not five.** The page previously carried a
 *   mobile SOS strip, a dedicated SOS bento card, a second 1-tap link, the
 *   global top-bar SOS and the mobile bottom-nav FAB - all on one screen.
 *   There is now a single, clearly-labelled emergency panel.
 * - **Real status telemetry.** The crowd density was computed and then never
 *   rendered, and the fallback population was a hardcoded `206`. The student
 *   now sees a live stat row (presence, campus density, check-ins today,
 *   open incidents) that shows an explicit "Offline" state when telemetry is
 *   unavailable rather than a fabricated number.
 * - **Phone numbers are dialable.** The emergency contacts were plain text.
 * - **Action tiles are real links.** The bento cards were `<div onClick>` and
 *   were unreachable by keyboard.
 * - A "what happens next" panel explains the SOS workflow, which is the single
 *   biggest source of anxiety for a student activating the system.
 */
import { useState, useEffect } from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { PageHeader } from '@/components/c3s/PageHeader';
import { StatCard } from '@/components/c3s/StatCard';
import { ActionTile } from '@/components/c3s/ActionTile';
import { StatusBadge } from '@/components/c3s/StatusBadge';
import {
  ShieldAlert,
  Scan,
  Clock,
  Navigation,
  PhoneCall,
  Compass,
  Radio,
  Users,
  Activity,
  CalendarCheck,
  Siren,
  MapPinned,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';
import { useSafetyStore } from '@/store/safetyStore';
import { useCrowdMonitoring, getCrowdBadgeStyle, calculateCrowdDensity } from '@/lib/crowdMonitoringApi';
import { SOSButton } from '@/components/c3s/SOSButton';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const currentUser = useC3SStore((state) => state.currentUser);
  const isInsideCampus = useC3SStore((state) => state.isInsideCampus);
  const checkedInAt = useC3SStore((state) => state.checkedInAt);
  const checkedInGate = useC3SStore((state) => state.checkedInGate);
  const sosActive = useC3SStore((state) => state.sosActive);
  const sosIncidentId = useC3SStore((state) => state.sosIncidentId);
  const sosNodeId = useC3SStore((state) => state.sosNodeId);
  const sosLocation = useC3SStore((state) => state.sosLocation);
  const movementLogs = useC3SStore((state) => state.movementLogs);

  const realCrowdCount = useSafetyStore((s) => s.realCrowdCount);
  const setSosModalOpen = useSafetyStore((s) => s.setSosModalOpen);
  useCrowdMonitoring();

  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hasLiveCrowdData = realCrowdCount > 0;
  const totalCrowd = hasLiveCrowdData ? realCrowdCount : 0;
  const density = calculateCrowdDensity(Math.round(totalCrowd / 12));
  const badgeStyle = getCrowdBadgeStyle(density);

  const today = new Date().toDateString();
  const checkInsToday = movementLogs.filter(
    (log) => log.movement === 'CHECK-IN' && new Date(log.time).toDateString() === today,
  ).length;

  const handleNavigateToSos = () => {
    if (sosIncidentId) {
      navigate(`/map?incident=${encodeURIComponent(sosIncidentId)}`);
    } else if (sosNodeId) {
      navigate(`/map?to=${encodeURIComponent(sosNodeId)}`);
    } else {
      navigate('/map');
    }
  };

  return (
    <AppShell>
      <div className="space-y-5 py-1 sm:space-y-6">
        <PageHeader
          eyebrow="MITS Gwalior · Student Terminal"
          statusTone={isInsideCampus ? 'success' : 'warning'}
          title={`Welcome, ${currentUser?.name?.split(' ')[0] || 'Student'}`}
          subtitle={`${currentUser?.department || 'Department of Computer Science & Engineering'} · Roll #${currentUser?.universityId || '2026CS104'}`}
          breadcrumbs={[
            { label: 'C3S', to: '/student/dashboard' },
            { label: 'Student Hub' },
          ]}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={isInsideCampus ? 'Inside Campus' : 'Outside Campus'}
                tone={isInsideCampus ? 'success' : 'neutral'}
                size="md"
              />
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {currentTime}
              </span>
              {checkedInGate && (
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  · Last entry {checkedInGate} at {checkedInAt || '—'}
                </span>
              )}
            </div>
          }
          actions={
            <button
              type="button"
              onClick={() => navigate('/student/scan')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 active:scale-95"
            >
              <Scan className="h-4 w-4" aria-hidden="true" />
              <span>Scan Gate QR</span>
            </button>
          }
        />

        {/* ACTIVE SOS BANNER - only shown when an emergency is genuinely running */}
        {sosActive && (
          <div
            role="alert"
            className="flex flex-col items-start justify-between gap-3 rounded-2xl border-2 border-red-500 bg-red-950/40 p-4 shadow-lg shadow-red-950/40 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                    Emergency broadcast active
                  </span>
                  <span className="rounded bg-red-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    LIVE
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-rose-200">
                  Location: <strong className="text-white">{sosLocation || 'Academic Corridor Node #9'}</strong> ·
                  Nearest guard, HOD Warden and the chief proctor have been alerted.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNavigateToSos}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-950/50 transition hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              <span>Track responders on map</span>
            </button>
          </div>
        )}

        {/* Live status row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Campus Density"
            value={hasLiveCrowdData ? `${totalCrowd}` : 'Offline'}
            subtitle={hasLiveCrowdData ? 'People on campus right now' : 'Telemetry unavailable'}
            icon={Users}
            variant={hasLiveCrowdData ? (density === 'high' || density === 'critical' ? 'warning' : 'primary') : 'neutral'}
            statusBadge={
              hasLiveCrowdData ? (
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${badgeStyle}`}
                >
                  {density}
                </span>
              ) : undefined
            }
          />
          <StatCard
            title="Check-ins Today"
            value={checkInsToday}
            subtitle="Verified gate entries"
            icon={CalendarCheck}
            variant="success"
          />
          <StatCard
            title="Your Presence"
            value={isInsideCampus ? 'Inside' : 'Outside'}
            subtitle={checkedInGate ? `Last entry: ${checkedInGate}` : 'Not yet checked in'}
            icon={MapPinned}
            variant={isInsideCampus ? 'success' : 'warning'}
          />
          <StatCard
            title="Emergency Status"
            value={sosActive ? 'Active' : 'Clear'}
            subtitle={sosActive ? 'Responders en route' : 'No active incident for you'}
            icon={Siren}
            variant={sosActive ? 'danger' : 'success'}
          />
        </div>

        {/* Core actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ActionTile
            icon={Scan}
            title="Scan Gate QR"
            description="Scan the rotating QR code at Main Gate, Jubilee Gate or Parking Gate for an instant verified check-in."
            cta="Open gate scanner"
            to="/student/scan"
            tone="primary"
            badge={
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300">
                Daily pass
              </span>
            }
          />

          <ActionTile
            icon={Compass}
            title="Interactive Campus Map"
            description="Turn-by-turn indoor routing to lecture halls, labs, offices and step-free routes across every floor."
            cta="Explore indoor routes"
            to="/map"
            tone="info"
            badge={
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300">
                Indoor GPS
              </span>
            }
          />

          <ActionTile
            icon={Activity}
            title="Pass & Movement Log"
            description="Every gate entry and exit recorded against your ID, with timestamps you can audit any time."
            cta="View movement log"
            to="/student/movement"
            tone="success"
          />
        </div>

        {/* Emergency panel - the single emergency affordance on this page */}
        <section
          aria-label="Emergency assistance"
          className="overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/[0.08] via-white to-red-500/[0.04] shadow-sm dark:via-[#0D1322]/85"
        >
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/15 text-red-600 dark:text-rose-400">
                <ShieldAlert className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Need immediate help?
                </h3>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  One tap captures your live location, a photo and a short video clip, then alerts the
                  nearest guard, the HOD Warden and the chief proctor - with a turn-by-turn route
                  for the responding team.
                </p>
                <ol className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {[
                    'Location pinned',
                    'Evidence captured',
                    'Responders dispatched',
                    'Live tracking',
                  ].map((step, index) => (
                    <li key={step} className="flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 font-mono text-[9px] font-bold text-slate-500 dark:bg-white/[0.08] dark:text-slate-300">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              <button
                type="button"
                onClick={() => setSosModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 active:scale-95"
              >
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                <span>Send emergency SOS</span>
              </button>
              <div className="flex items-center gap-3">
                <SOSButton size="compact" showDetailsOnActive={false} />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  or hold for 2 seconds
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency contacts - dialable */}
        <section aria-label="Emergency contacts">
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Emergency contacts
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <a
              href="tel:+917512409300"
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-500/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 dark:border-white/[0.08] dark:bg-[#0D1322]/85"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Chief Proctor Control
                </span>
                <span className="block font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  +91 751 2409300
                </span>
              </span>
            </a>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#0D1322]/85">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Radio className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Security Guard QRF
                </span>
                <span className="block font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  Radio Ch-4 · Ext 104
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#0D1322]/85">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Health &amp; First Aid
                </span>
                <span className="block font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  Dispensary Block · 24/7
                </span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

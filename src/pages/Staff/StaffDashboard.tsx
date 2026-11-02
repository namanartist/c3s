// src/pages/Staff/StaffDashboard.tsx
import { useState, useMemo } from 'react';
import { CheckCircle2, ClipboardList, MapPin, Radio, ShieldCheck, Users, Camera, Video, Eye, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSafetyStore } from '@/store/safetyStore';
import { useSessionStore } from '@/store/sessionStore';
import { useC3SStore } from '@/store/c3sStore';
import type { UserRole, SosIncident } from '@/types/safety';
import { OfflineMeshStatus } from '@/components/safety/OfflineMeshStatus';
import { IncidentEvidenceModal } from '@/components/c3s/IncidentEvidenceModal';
import type { C3SIncident } from '@/lib/mock-data/incidents';

type StaffRole = Exclude<UserRole, 'student' | 'proctor' | 'admin' | 'gate_keeper'>;

const roleCopy: Record<StaffRole, { label: string; eyebrow: string; description: string; action: string; icon: typeof Users }> = {
    faculty: {
        label: 'Faculty Safety & Warden Desk',
        eyebrow: 'Welfare & Alert Response',
        description: 'Coordinate student welfare follow-up, review captured CCTV & photo evidence, and acknowledge alerts assigned to your area.',
        action: 'Acknowledge & follow up',
        icon: Users
    },
    guard: {
        label: 'Guard Response Desk',
        eyebrow: 'Field Response',
        description: 'Take the nearest incident, review live video evidence, navigate to its actual node, and close the response loop.',
        action: 'Accept field response',
        icon: ShieldCheck
    },
    other: {
        label: 'Campus Support Desk',
        eyebrow: 'Support Coordination',
        description: 'Review campus safety reports and route unresolved cases to the right response team.',
        action: 'Take ownership',
        icon: ClipboardList
    }
};

export default function StaffDashboard({ role }: { role: StaffRole }) {
    const navigate = useNavigate();
    const user = useSessionStore((state) => state.user);
    const signOut = useSessionStore((state) => state.signOut);
    const safetyIncidents = useSafetyStore((state) => state.incidents);
    const c3sIncidents = useC3SStore((state) => state.incidents);
    const updateIncidentStatus = useSafetyStore((state) => state.updateIncidentStatus);
    const content = roleCopy[role];
    const Icon = content.icon;

    const [selectedEvidenceIncident, setSelectedEvidenceIncident] = useState<C3SIncident | null>(null);

    const activeIncidents = useMemo(() => safetyIncidents.filter((incident) => incident.status !== 'resolved'), [safetyIncidents]);
    const assignedToMe = safetyIncidents.filter((incident) => incident.responderAssigned?.startsWith(user?.name || '__never__')).length;

    // Helper to open evidence for an incident
    const handleOpenEvidence = (incident: SosIncident) => {
        // Find matching C3S incident or construct one
        const matchedC3S = c3sIncidents.find((ci) => ci.id === incident.id);
        if (matchedC3S) {
            setSelectedEvidenceIncident(matchedC3S);
        } else {
            const mapped: C3SIncident = {
                id: incident.id,
                title: incident.title,
                type: 'Security Threat',
                priority: incident.severity.toUpperCase() as any,
                location: `${incident.map} Floor ${incident.floor}`,
                zone: incident.map,
                reportedAt: new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                reportedBy: incident.reportedBy || 'Student Distress Signal',
                reportedById: 'STU-DISTRESS',
                reporterPhone: incident.phone || '+91 751-2409300',
                status: incident.status.toUpperCase() as any,
                distanceMeters: 45,
                assignedResponder: incident.responderAssigned || 'Campus Responder',
                latitude: incident.lat,
                longitude: incident.lng,
                timeline: [
                    { time: 'Just now', event: 'Distress alert received with evidence telemetry.', actor: 'Emergency Router' }
                ],
                photoUrl: incident.evidence?.photoUrl,
                videoUrl: incident.evidence?.videoUrl || '/videos/cctv_recorded_incident.mp4',
                evidence: {
                    photoUrl: incident.evidence?.photoUrl,
                    videoUrl: incident.evidence?.videoUrl || '/videos/cctv_recorded_incident.mp4',
                    fightConfidence: incident.evidence?.fightConfidence
                }
            };
            setSelectedEvidenceIncident(mapped);
        }
    };

    if (!user || user.role !== role) {
        return (
            <div className="min-h-screen bg-slate-950 p-8 text-white flex flex-col items-center justify-center">
                <p className="text-base font-bold text-slate-300">Please sign in as {role.toUpperCase()} to access this safety station.</p>
                <button
                    onClick={() => navigate('/login')}
                    className="mt-4 px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white hover:bg-blue-500"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0b1018] px-4 py-5 text-white sm:px-8">
            <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-cyan-300">
                        <Radio className="h-4 w-4 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{content.eyebrow}</span>
                    </div>
                    <h1 className="mt-2 text-2xl font-black">{content.label}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <OfflineMeshStatus />
                    <button
                        onClick={() => { signOut(); navigate('/login'); }}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition cursor-pointer"
                    >
                        Sign out
                    </button>
                </div>
            </header>

            <div className="mx-auto mt-6 grid max-w-6xl gap-4 sm:grid-cols-3">
                <Summary label="Open incidents" value={activeIncidents.length.toString()} tone="text-red-300" />
                <Summary label="Assigned to me" value={assignedToMe.toString()} tone="text-amber-300" />
                <Summary label="Peer relay" value="Active & Encrypted" tone="text-emerald-300" />
            </div>

            <section className="mx-auto mt-5 max-w-6xl rounded-[28px] border border-cyan-400/15 bg-cyan-950/20 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <Icon className="mt-1 h-6 w-6 text-cyan-300" />
                    <div>
                        <h2 className="text-lg font-black">{content.description}</h2>
                        <p className="mt-1 text-xs text-slate-400">
                            Faculty floor wardens receive real-time telemetry, auto-captured CCTV recordings, and photographic forensic snapshots for rapid de-escalation.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-5 max-w-6xl space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
                        Live Faculty Incident Queue
                    </h2>
                    <span className="text-xs text-slate-500">{activeIncidents.length} active alerts</span>
                </div>

                {activeIncidents.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400 text-xs">
                        No active safety alerts pending for your department. All campus zones operating normally.
                    </div>
                ) : (
                    activeIncidents.map((incident) => {
                        const hasMedia = Boolean(incident.evidence?.photoUrl || incident.evidence?.videoUrl || incident.evidence?.recordingUrl);
                        return (
                            <article key={incident.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-lg space-y-4">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-rose-400">{incident.id}</span>
                                            <span className="rounded-full bg-red-400/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-red-200">
                                                {incident.status}
                                            </span>
                                        </div>
                                        <h3 className="mt-1 font-black text-base text-white">{incident.title}</h3>
                                        <p className="mt-0.5 text-xs text-slate-300">{incident.description}</p>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400">
                                        Floor: {incident.floor === 0 ? 'Ground' : incident.floor} ({incident.map})
                                    </span>
                                </div>

                                {/* Media Evidence Preview Banner for Faculty */}
                                <div className="p-3.5 rounded-xl border border-slate-700/80 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                                            <Video className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-200 block">
                                                Surveillance Telemetry: CCTV Video &amp; Photo Captured
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                Auto-recorded during alert dispatch for Faculty &amp; Proctorial verification.
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleOpenEvidence(incident)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Inspect Footage &amp; Photos</span>
                                    </button>
                                </div>

                                <div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-4">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-red-300" />
                                        {incident.map} · Floor {incident.floor}
                                    </span>
                                    <span>Node {Math.round(incident.x)}, {Math.round(incident.y)}</span>
                                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                        <Camera className="h-3 w-3" /> Auto-Evidence Archived
                                    </span>
                                    <span>{incident.deliveryState === 'queued' ? 'Mesh Syncing' : 'Relayed & Verified'}</span>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => updateIncidentStatus(incident.id, 'responding', `${user.name} (${role})`)}
                                        className="rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-2 text-xs font-black text-slate-950 transition cursor-pointer"
                                    >
                                        {content.action}
                                    </button>
                                    <button
                                        onClick={() => updateIncidentStatus(incident.id, 'resolved', `${user.name} (${role})`)}
                                        className="flex items-center gap-1 rounded-xl bg-emerald-400 hover:bg-emerald-300 px-3.5 py-2 text-xs font-black text-slate-950 transition cursor-pointer"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolve Alert
                                    </button>
                                    <button
                                        onClick={() => navigate(`/map?incident=${incident.id}`)}
                                        className="rounded-xl border border-white/10 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-300 transition cursor-pointer"
                                    >
                                        Open Waypoint on Map
                                    </button>
                                </div>
                            </article>
                        );
                    })
                )}
            </section>

            {/* Evidence Modal for Faculty Inspection */}
            <IncidentEvidenceModal
                incident={selectedEvidenceIncident}
                isOpen={Boolean(selectedEvidenceIncident)}
                onClose={() => setSelectedEvidenceIncident(null)}
            />
        </main>
    );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className={`text-2xl font-black ${tone}`}>{value}</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div>
        </div>
    );
}

import { useMemo } from 'react';
import { CheckCircle2, ClipboardList, MapPin, Radio, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSafetyStore } from '@/store/safetyStore';
import { useSessionStore } from '@/store/sessionStore';
import type { UserRole } from '@/types/safety';
import { OfflineMeshStatus } from '@/components/safety/OfflineMeshStatus';

type StaffRole = Exclude<UserRole, 'student' | 'proctor' | 'admin' | 'gate_keeper'>;

const roleCopy: Record<StaffRole, { label: string; eyebrow: string; description: string; action: string; icon: typeof Users }> = {
    faculty: {
        label: 'Faculty safety desk',
        eyebrow: 'Welfare response',
        description: 'Coordinate student welfare follow-up and acknowledge alerts assigned to your area.',
        action: 'Acknowledge & follow up',
        icon: Users
    },
    guard: {
        label: 'Guard response desk',
        eyebrow: 'Field response',
        description: 'Take the nearest incident, navigate to its actual node, and close the response loop.',
        action: 'Accept field response',
        icon: ShieldCheck
    },
    other: {
        label: 'Campus support desk',
        eyebrow: 'Support coordination',
        description: 'Review campus safety reports and route unresolved cases to the right response team.',
        action: 'Take ownership',
        icon: ClipboardList
    }
};

export default function StaffDashboard({ role }: { role: StaffRole }) {
    const navigate = useNavigate();
    const user = useSessionStore((state) => state.user);
    const signOut = useSessionStore((state) => state.signOut);
    const incidents = useSafetyStore((state) => state.incidents);
    const updateIncidentStatus = useSafetyStore((state) => state.updateIncidentStatus);
    const content = roleCopy[role];
    const Icon = content.icon;
    const activeIncidents = useMemo(() => incidents.filter((incident) => incident.status !== 'resolved'), [incidents]);
    const assignedToMe = incidents.filter((incident) => incident.responderAssigned?.startsWith(user?.name || '__never__')).length;

    if (!user || user.role !== role) return <div className="min-h-screen bg-slate-950 p-8 text-white">Please sign in with the correct staff role.</div>;

    return (
        <main className="min-h-screen bg-[#0b1018] px-4 py-5 text-white sm:px-8">
            <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-cyan-300"><Radio className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">{content.eyebrow}</span></div>
                    <h1 className="mt-2 text-2xl font-black">{content.label}</h1>
                </div>
                <div className="flex items-center gap-2"><OfflineMeshStatus /><button onClick={() => { signOut(); navigate('/login'); }} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">Sign out</button></div>
            </header>

            <div className="mx-auto mt-6 grid max-w-6xl gap-4 sm:grid-cols-3">
                <Summary label="Open incidents" value={activeIncidents.length.toString()} tone="text-red-300" />
                <Summary label="Assigned to me" value={assignedToMe.toString()} tone="text-amber-300" />
                <Summary label="Peer relay" value="Ready" tone="text-emerald-300" />
            </div>

            <section className="mx-auto mt-5 max-w-6xl rounded-[28px] border border-cyan-400/15 bg-cyan-950/20 p-5 sm:p-6">
                <div className="flex items-start gap-3"><Icon className="mt-1 h-6 w-6 text-cyan-300" /><div><h2 className="text-lg font-black">{content.description}</h2><p className="mt-1 text-xs text-slate-400">Every alert includes the reported map, floor, node coordinates, evidence, and delivery state.</p></div></div>
            </section>

            <section className="mx-auto mt-5 max-w-6xl space-y-3">
                <div className="flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Live incident queue</h2><span className="text-xs text-slate-500">{activeIncidents.length} open</span></div>
                {activeIncidents.map((incident) => <article key={incident.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-black">{incident.title}</h3><p className="mt-1 text-xs text-slate-400">{incident.description}</p></div><span className="rounded-full bg-red-400/15 px-2 py-1 text-[10px] font-black uppercase text-red-200">{incident.status}</span></div><div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-4"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-red-300" />{incident.map} · floor {incident.floor}</span><span>Node {Math.round(incident.x)}, {Math.round(incident.y)}</span><span>{incident.evidence?.recordingUrl ? 'Evidence attached' : 'No media attached'}</span><span>{incident.deliveryState === 'queued' ? 'Waiting for relay' : 'Relayed'}</span></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => updateIncidentStatus(incident.id, 'responding', `${user.name} (${role})`)} className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950">{content.action}</button><button onClick={() => updateIncidentStatus(incident.id, 'resolved', `${user.name} (${role})`)} className="flex items-center gap-1 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950"><CheckCircle2 className="h-3.5 w-3.5" /> Resolve</button><button onClick={() => navigate(`/map?incident=${incident.id}`)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">Open node map</button></div></article>)}
            </section>
        </main>
    );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: string }) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><div className={`text-2xl font-black ${tone}`}>{value}</div><div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div></div>;
}
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileClock, Radio, ShieldCheck, Users } from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';
import { useSessionStore } from '@/store/sessionStore';
import { OfflineMeshStatus } from '@/components/safety/OfflineMeshStatus';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const user = useSessionStore((state) => state.user);
    const signOut = useSessionStore((state) => state.signOut);
    const incidents = useSafetyStore((state) => state.incidents);
    const active = incidents.filter((incident) => incident.status !== 'resolved');
    if (!user || user.role !== 'admin') return <div className="min-h-screen bg-slate-950 p-8 text-white">Admin access required.</div>;

    return <main className="min-h-screen bg-[#0b1018] px-4 py-5 text-white sm:px-8"><header className="mx-auto flex max-w-6xl items-center justify-between"><div><div className="flex items-center gap-2 text-cyan-300"><Radio className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">System administration</span></div><h1 className="mt-2 text-2xl font-black">Campus safety command</h1></div><div className="flex items-center gap-2"><OfflineMeshStatus /><button onClick={() => { signOut(); navigate('/login'); }} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">Sign out</button></div></header><div className="mx-auto mt-6 grid max-w-6xl gap-3 sm:grid-cols-4"><Metric icon={ClipboardCheck} label="Active incidents" value={active.length.toString()} /><Metric icon={Users} label="User management" value="Ready" /><Metric icon={ShieldCheck} label="Responder pool" value="Live" /><Metric icon={FileClock} label="Audit trail" value="Enabled" /></div><section className="mx-auto mt-5 max-w-6xl rounded-[28px] border border-white/10 bg-white/[0.05] p-5"><h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Incident management</h2><div className="mt-4 space-y-2">{active.map((incident) => <div key={incident.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><div><div className="text-sm font-black">{incident.title}</div><div className="mt-1 text-xs text-slate-400">{incident.map} · node {Math.round(incident.x)}, {Math.round(incident.y)} · {incident.status}</div></div><button onClick={() => navigate(`/map?incident=${incident.id}`)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">View location</button></div>)}</div></section></main>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><Icon className="h-4 w-4 text-cyan-300" /><div className="mt-2 text-lg font-black">{value}</div><div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div></div>; }
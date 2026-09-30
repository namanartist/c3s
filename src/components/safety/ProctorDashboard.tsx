import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Eye, Gauge, Radio, Users } from 'lucide-react';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { useSafetyStore } from '@/store/safetyStore';
import { getProctorNodeMetrics } from '@/lib/proctorMetrics';

export function ProctorDashboard() {
    const { nodes, activeMapId } = useCampusNavigation();
    const incidents = useSafetyStore((state) => state.incidents);
    const [tick, setTick] = useState(0);

    const metrics = useMemo(() => {
        const activeNodes = nodes.filter((node) => node.map === activeMapId);
        const values = activeNodes.map((node) => getProctorNodeMetrics(node, tick));
        const users = values.reduce((total, value) => total + value.users, 0);
        const traffic = values.length ? Math.round(values.reduce((total, value) => total + value.traffic, 0) / values.length) : 0;
        const probability = values.length ? Math.round(values.reduce((total, value) => total + value.incidentProbability, 0) / values.length) : 0;
        return { nodeCount: activeNodes.length, users, traffic, probability };
    }, [activeMapId, nodes, tick]);

    const activeIncidents = incidents.filter((incident) => incident.status !== 'resolved').length;

    return (
        <aside className="absolute top-6 left-6 z-20 w-[360px] max-w-[calc(100vw-32px)] rounded-[24px] border border-slate-800 bg-slate-950/95 p-5 text-white shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                        <Radio className="h-3.5 w-3.5 animate-pulse" /> Proctor Console
                    </div>
                    <h1 className="mt-2 text-xl font-black tracking-tight">Campus flow monitor</h1>
                    <p className="mt-1 text-xs text-slate-400">Live occupancy and incident-risk view</p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">Live</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <Metric icon={Users} label="People on map" value={metrics.users.toLocaleString()} />
                <Metric icon={Activity} label="Active incidents" value={activeIncidents.toString()} tone="text-red-300" />
                <Metric icon={Gauge} label="Traffic index" value={`${metrics.traffic}%`} tone="text-amber-300" />
                <Metric icon={AlertTriangle} label="Incident probability" value={`${metrics.probability}%`} tone="text-orange-300" />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Node coverage</span>
                    <span className="text-white">{metrics.nodeCount} nodes</span>
                </div>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10">
                    <span className="w-1/3 bg-emerald-400" />
                    <span className="w-1/3 bg-yellow-400" />
                    <span className="w-1/3 bg-red-500" />
                </div>
                <div className="mt-2 flex justify-between text-[9px] text-slate-500">
                    <span>Low</span><span>Elevated</span><span>High</span>
                </div>
            </div>

            <button type="button" onClick={() => setTick((value) => value + 1)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-3 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-300">
                <Eye className="h-4 w-4" /> Refresh live snapshot
            </button>
        </aside>
    );
}

function Metric({ icon: Icon, label, value, tone = 'text-white' }: { icon: typeof Users; label: string; value: string; tone?: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <Icon className={`h-4 w-4 ${tone}`} />
            <div className={`mt-2 text-lg font-black ${tone}`}>{value}</div>
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
        </div>
    );
}
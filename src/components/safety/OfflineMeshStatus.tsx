import { useEffect, useState } from 'react';
import { CloudOff, Radio, Wifi } from 'lucide-react';
import { useSafetyStore } from '@/store/safetyStore';

export function OfflineMeshStatus() {
    const incidents = useSafetyStore((state) => state.incidents);
    const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
    const queued = incidents.filter((incident) => incident.deliveryState === 'queued' && incident.status !== 'resolved').length;

    useEffect(() => {
        const update = () => setOnline(navigator.onLine);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
    }, []);

    return (
        <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${online ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
            {online ? <Wifi className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
            <span>{online ? 'Online + peer relay' : 'Offline queue active'}</span>
            {queued > 0 && <span className="flex items-center gap-1 border-l border-current/20 pl-2"><Radio className="h-3 w-3" /> {queued} queued</span>}
        </div>
    );
}
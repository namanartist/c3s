import { useEffect } from 'react';
import { createOfflineMesh } from '@/lib/offlineMesh';
import { useSafetyStore } from '@/store/safetyStore';

export function OfflineMeshBridge() {
    useEffect(() => {
        const mesh = createOfflineMesh((packet) => {
            if (packet.type === 'incident' && packet.incident) useSafetyStore.getState().mergeMeshIncident(packet.incident);
        });
        if (!mesh) return undefined;

        const initialIds = new Set(useSafetyStore.getState().incidents.map((incident) => incident.id));
        let known = new Map(useSafetyStore.getState().incidents.map((incident) => [incident.id, JSON.stringify(incident)]));
        const unsubscribe = useSafetyStore.subscribe((state) => {
            for (const incident of state.incidents) {
                const serialized = JSON.stringify(incident);
                if (known.get(incident.id) === serialized) continue;
                known.set(incident.id, serialized);
                if (!initialIds.has(incident.id) || incident.deliveryState === 'queued') mesh.sendIncident(incident);
            }
        });
        return () => { unsubscribe(); mesh.close(); };
    }, []);

    return null;
}
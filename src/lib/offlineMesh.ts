import type { SosIncident } from '@/types/safety';

const CHANNEL_NAME = 'c3s-campus-safety-mesh';
const STORAGE_EVENT_KEY = 'c3s-mesh-packet';

export interface MeshPacket {
    type: 'incident' | 'ack';
    senderId: string;
    incident?: SosIncident;
    incidentId?: string;
    sentAt: number;
}

export interface OfflineMesh {
    sendIncident: (incident: SosIncident) => void;
    close: () => void;
}

function getPeerId() {
    const key = 'c3s-peer-id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = `peer_${crypto.randomUUID()}`;
    localStorage.setItem(key, id);
    return id;
}

export function createOfflineMesh(onPacket: (packet: MeshPacket) => void): OfflineMesh | null {
    if (typeof window === 'undefined') return null;

    const senderId = getPeerId();
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
    const handlePacket = (packet: MeshPacket) => {
        if (packet.senderId !== senderId && Date.now() - packet.sentAt < 24 * 60 * 60 * 1000) onPacket(packet);
    };
    const handleStorage = (event: StorageEvent) => {
        if (event.key !== STORAGE_EVENT_KEY || !event.newValue) return;
        try { handlePacket(JSON.parse(event.newValue) as MeshPacket); } catch { /* Ignore malformed peer packets. */ }
    };

    channel?.addEventListener('message', (event: MessageEvent<MeshPacket>) => handlePacket(event.data));
    window.addEventListener('storage', handleStorage);

    return {
        sendIncident: (incident) => {
            const packet: MeshPacket = { type: 'incident', senderId, incident, sentAt: Date.now() };
            channel?.postMessage(packet);
            localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(packet));
        },
        close: () => {
            channel?.close();
            window.removeEventListener('storage', handleStorage);
        }
    };
}
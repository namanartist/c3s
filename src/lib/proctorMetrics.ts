import type { MapNode } from '@/types/graph';

export interface ProctorNodeMetrics {
    users: number;
    traffic: number;
    incidentProbability: number;
}

function hashNodeId(id: string): number {
    return id.split('').reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) % 997, 7);
}

export function getProctorNodeMetrics(node: MapNode, tick = 0): ProctorNodeMetrics {
    const hash = hashNodeId(node.id);
    const wave = (tick + hash) % 7;
    const traffic = Math.min(100, 18 + ((hash * 13) % 64) + wave * 2);
    const users = 1 + ((hash + tick * 3) % 24);
    const incidentProbability = Math.min(98, Math.round(traffic * 0.58 + (hash % 21)));

    return { users, traffic, incidentProbability };
}

export function getProctorRiskColor(probability: number): string {
    if (probability >= 75) return '#dc2626';
    if (probability >= 50) return '#f97316';
    if (probability >= 30) return '#eab308';
    return '#22c55e';
}
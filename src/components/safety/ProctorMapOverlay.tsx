import { useEffect, useState } from 'react';
import { animated, to } from '@react-spring/web';
import type { SpringValue } from '@react-spring/web';
import type { MapNode } from '@/types/graph';
import { getProctorNodeMetrics, getProctorRiskColor } from '@/lib/proctorMetrics';

interface ProctorMapOverlayProps {
    nodes: MapNode[];
    mapId: string | null;
    zoom: SpringValue<number>;
}

export function ProctorMapOverlay({ nodes, mapId, zoom }: ProctorMapOverlayProps) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => setTick((value) => value + 1), 5000);
        return () => window.clearInterval(interval);
    }, []);

    return (
        <g aria-label="Live proctor traffic overlay">
            {nodes.filter((node) => node.map === mapId).map((node) => {
                const metrics = getProctorNodeMetrics(node, tick);
                const color = getProctorRiskColor(metrics.incidentProbability);

                return (
                    <animated.g
                        key={node.id}
                        style={{ transform: to([zoom], (value) => `translate(${node.x}px, ${node.y}px) scale(${1 / value})`) }}
                        className="pointer-events-none"
                    >
                        <circle cx="0" cy="0" r={Math.max(8, metrics.traffic / 7)} fill={color} opacity="0.16" />
                        <circle cx="0" cy="0" r="4.5" fill={color} stroke="#ffffff" strokeWidth="1.5" />
                        <text x="0" y="-8" textAnchor="middle" fontSize="7" fill="#111827" fontWeight="800">{metrics.users}</text>
                    </animated.g>
                );
            })}
        </g>
    );
}
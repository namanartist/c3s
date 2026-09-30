// src/components/route/RouteMeta.tsx
import type { Route } from '@/types';
import { Clock, Route as RouteIcon, Layers } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { formatTime, formatDistance, getFloorFromMapId } from '@/lib/routeBuilder';
import { getNodeById } from '@/lib/graphUtils';
import { useMapStore } from '@/store/mapStore';

export interface RouteMetaProps {
  route: Route;
}

export default function RouteMeta({ route }: RouteMetaProps) {
  const graph = useMapStore((state) => state.graph);

  if (!graph) return null;

  const uniqueFloors = new Set(
    route.steps
      .map((s) => {
        const node = getNodeById(graph, s.nodeId);
        if (!node) return null;
        return typeof (node as any).floor === 'number'
          ? (node as any).floor
          : getFloorFromMapId(node.map);
      })
      .filter((f): f is number => typeof f === 'number')
  ).size;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="accent">
        <Clock size={14} className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>{formatTime(route.estimatedTime)}</span>
      </Badge>
      <Badge variant="accent">
        <RouteIcon size={14} className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>{formatDistance(route.totalDistance)}</span>
      </Badge>
      {uniqueFloors > 1 && (
        <Badge variant="accent">
          <Layers size={14} className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>{uniqueFloors} floors</span>
        </Badge>
      )}
    </div>
  );
}

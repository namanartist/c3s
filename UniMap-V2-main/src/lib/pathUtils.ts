// src/lib/pathUtils.ts
import type { MapNode } from '@/types';

/**
 * Builds a polyline points string from a Dijkstra path.
 * Uses exact node coordinates in the same coordinate system as the SVG viewBox.
 */
export function buildPolylinePoints(
  shortestPathNodes: string[],
  nodes: Record<string, MapNode>
): string {
  return shortestPathNodes
    .filter((nodeId) => nodes[nodeId] && nodes[nodeId].x != null && nodes[nodeId].y != null)
    .map((nodeId) => {
      const node = nodes[nodeId];
      return `${node.x},${node.y}`;
    })
    .join(' ');
}

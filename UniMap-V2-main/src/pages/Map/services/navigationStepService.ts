// src/pages/Map/services/navigationStepService.ts
import { buildPolylinePoints } from '@/lib/pathUtils';
import { generateDetailedNavigationInstructions } from '@/lib/navigation_instructions';
import type { NavigationStep } from '@/lib/multiMapNavigation';
import type { MapNode, MapEdge } from '@/types';

export function mapDirectionForIcon(direction?: string): string {
  if (!direction) return 'straight';
  const leftVariants = ['slight left', 'sharp left', 'u-turn'];
  const rightVariants = ['slight right', 'sharp right'];
  if (leftVariants.includes(direction)) return 'left';
  if (rightVariants.includes(direction)) return 'right';
  return direction;
}

export function buildNavigationStepViewModel(
  step: NavigationStep,
  nodesMap: Record<string, MapNode>,
  edgeIndex: Map<string, MapEdge>
): { pathPoints: string; navigationDirections: Array<{ direction: string; instruction: string; distance: string }> } {
  if (!step || !step.path_nodes || step.path_nodes.length === 0) {
    return { pathPoints: '', navigationDirections: [] };
  }

  const stepPathWithCoords = step.path_nodes.filter((id) => nodesMap[id]);
  if (stepPathWithCoords.length === 0) {
    return { pathPoints: '', navigationDirections: [] };
  }

  const pathPoints = buildPolylinePoints(stepPathWithCoords, nodesMap);

  const rawInstructions = generateDetailedNavigationInstructions(
    stepPathWithCoords,
    nodesMap,
    edgeIndex
  );

  const navigationDirections = rawInstructions
    .filter((i) => i.action !== 'error')
    .map((i) => ({
      direction: mapDirectionForIcon(i.direction),
      instruction: [i.message, i.landmark].filter(Boolean).join(' '),
      distance: i.distanceInMeters != null ? `${i.distanceInMeters}m` : '',
    }));

  return { pathPoints, navigationDirections };
}

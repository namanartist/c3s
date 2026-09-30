import type { CampusGraph, MapNode, MapEdge, Route, RouteStep, RouteOptions } from '@/types';
import { WALKING_SPEED_MPS } from '@/constants';
import { getNodeById, getEdgesBetween } from './graphUtils';
import { parseRoomName } from './roomParser';

function getNodeName(node: MapNode): string {
  if (node.name) return node.name;
  const parsed = parseRoomName(node.id);
  if (parsed && parsed.name) return parsed.name;
  return node.id;
}

function findNearbyRoomInGraph(nodeId: string, graph: CampusGraph): string | null {
  for (const edge of graph.edges) {
    const from = edge.from_node ?? (edge as any).from;
    const to = edge.to_node ?? (edge as any).to;
    if (from === nodeId || to === nodeId) {
      const neighborId = from === nodeId ? to : from;
      const neighbor = graph.nodes.find(n => n.id === neighborId);
      if (neighbor && (neighbor.type === 'room' || neighbor.type === 'landmark' || neighbor.type === 'entrance' || neighbor.type === 'exit')) {
        const name = neighbor.name || parseRoomName(neighborId)?.name;
        if (name && !name.toLowerCase().includes('node') && !name.toLowerCase().includes('junction') && !name.toLowerCase().includes('road')) {
          return name;
        }
      }
    }
  }
  return null;
}

/** Helper to parse floor index from map ID string. */
export function getFloorFromMapId(mapId: string): number {
  if (!mapId) return 0;
  const parts = mapId.split('_');
  const suffix = parts[parts.length - 1]?.toLowerCase();
  if (suffix === 'gf') return 0;
  if (suffix === 'ff') return 1;
  if (suffix === 'sf') return 2;
  if (suffix === 'tf') return 3;
  const num = parseInt(suffix, 10);
  if (!isNaN(num)) return num;
  return 0;
}

/** Generates a human-readable navigation instruction for a step. */
export function generateInstruction(
  current: MapNode,
  next: MapNode,
  edge: MapEdge | undefined,
  graph?: CampusGraph
): string {
  const currentFloor = typeof (current as any).floor === 'number'
    ? (current as any).floor
    : getFloorFromMapId(current.map);
  const nextFloor = typeof (next as any).floor === 'number'
    ? (next as any).floor
    : getFloorFromMapId(next.map);

  // 1. STAIRCASE transition
  if (edge?.type === 'stairs') {
    if (nextFloor > currentFloor) {
      return `Take the stairs up to Floor ${nextFloor === 0 ? 'G' : `F${nextFloor}`}`;
    }
    if (nextFloor < currentFloor) {
      return `Take the stairs down to Floor ${nextFloor === 0 ? 'G' : `F${nextFloor}`}`;
    }
    return `Take the stairs to Floor ${nextFloor === 0 ? 'G' : `F${nextFloor}`}`;
  }

  // 2. LIFT transition
  if (edge?.type === 'lift') {
    if (nextFloor > currentFloor) {
      return `Take the lift up to Floor ${nextFloor === 0 ? 'G' : `F${nextFloor}`}`;
    }
    if (nextFloor < currentFloor) {
      return `Take the lift down to Floor ${nextFloor === 0 ? 'G' : `F${nextFloor}`}`;
    }
    return `Take the lift to Floor ${nextFloor === 0 ? 'G' : `F${nextFloor}`}`;
  }

  // 3. RAMP transition
  if (edge?.type === 'ramp') {
    return `Take the ramp to Floor ${nextFloor === 0 ? 'G' : `F${nextFloor}`}`;
  }

  // 4. BUILDING EXIT
  if (next.type === 'exit' || next.type === 'entrance') {
    return `Exit through ${getNodeName(next)}`;
  }

  // 5. OUTDOOR path
  if (edge?.type === 'outdoor') {
    return `Head outside towards ${getNodeName(next)}`;
  }

  // 6. LANDMARK
  if (next.type === 'landmark') {
    return `Pass ${getNodeName(next)} on your way`;
  }

  // 7. DESTINATION (final node = room)
  if (next.type === 'room') {
    return `Arrive at ${getNodeName(next)}`;
  }

  // 8. JUNCTION / CORRIDOR
  if (next.type === 'junction' || next.type === 'corridor') {
    if (graph) {
      const nearbyRoom = findNearbyRoomInGraph(next.id, graph);
      if (nearbyRoom) {
        return `Continue towards ${nearbyRoom}`;
      }
    }
    return `Continue straight`;
  }

  // 9. DEFAULT
  return `Continue towards ${getNodeName(next)}`;
}

/** Formats a distance in metres to a readable string. */
export function formatDistance(metres: number): string {
  if (metres < 1) {
    return '';
  }
  if (metres < 10) {
    return `${Math.round(metres)}m`;
  }
  if (metres < 1000) {
    return `${Math.round(metres)}m`;
  }
  return `${(metres / 1000).toFixed(1)}km`;
}

/** Formats a time duration in seconds to a readable string. */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return 'less than a minute';
  }
  if (seconds < 120) {
    return 'about 1 min';
  }
  if (seconds < 3600) {
    const mins = Math.ceil(seconds / 60);
    return `about ${mins} mins`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.ceil((seconds % 3600) / 60);
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} mins`;
}

/** Builds a complete Route object from an array of node IDs. */
export function buildRoute(
  graph: CampusGraph,
  nodeIds: string[],
  _options: RouteOptions
): Route | null {
  try {
    if (nodeIds.length < 1) {
      return null;
    }

    const resolvedNodes: MapNode[] = [];
    for (const id of nodeIds) {
      const node = getNodeById(graph, id);
      if (!node) {
        return null;
      }
      resolvedNodes.push(node);
    }

    const steps: RouteStep[] = [];

    // Prepend the first step: "Start at [Name]"
    const startNode = resolvedNodes[0];
    steps.push({
      nodeId: startNode.id,
      label: getNodeName(startNode),
      instruction: `Start at ${getNodeName(startNode)}`,
      distanceFromPrev: 0,
      type: 'corridor',
    });

    for (let i = 1; i < resolvedNodes.length; i++) {
      const prev = resolvedNodes[i - 1];
      const curr = resolvedNodes[i];
      const edges = getEdgesBetween(graph, prev.id, curr.id);
      const edge = edges[0];

      const distanceFromPrev = edge ? edge.distance : 0;
      const type = edge ? edge.type : 'corridor';
      const instruction = generateInstruction(prev, curr, edge, graph);

      steps.push({
        nodeId: curr.id,
        label: getNodeName(curr),
        instruction,
        distanceFromPrev,
        type,
      });
    }

    const totalDistance = steps.reduce((sum, step) => sum + step.distanceFromPrev, 0);

    const staircaseCount = steps.filter(s => s.type === 'stairs').length;
    const liftCount = steps.filter(s => s.type === 'lift').length;
    let estimatedTime = totalDistance / WALKING_SPEED_MPS;
    estimatedTime += staircaseCount * 20;
    estimatedTime += liftCount * 30;

    return {
      from: resolvedNodes[0],
      to: resolvedNodes[resolvedNodes.length - 1],
      steps,
      totalDistance,
      estimatedTime,
      nodeIds,
    };
  } catch (error) {
    return null;
  }
}

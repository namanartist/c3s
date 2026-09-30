// src/lib/graphUtils.ts
import type { CampusGraph, MapNode, MapEdge } from '@/types';

/** Returns the map node with the specified ID. */
export function getNodeById(graph: CampusGraph, id: string): MapNode | undefined {
  return graph.nodes.find(node => node.id === id);
}

/** Returns all map nodes located in the specified building. */
export function getNodesByBuilding(graph: CampusGraph, buildingId: string): MapNode[] {
  const building = graph.buildings.find(b => b.id === buildingId);
  if (!building) {
    return [];
  }
  const floorIdsSet = new Set(building.floorIds);
  return graph.nodes.filter(node => floorIdsSet.has(node.map));
}

/** Returns all map nodes located on the specified building floor. */
export function getNodesByFloor(
  graph: CampusGraph,
  buildingId: string,
  floor: number
): MapNode[] {
  const building = graph.buildings.find(b => b.id === buildingId);
  if (!building || floor < 0 || floor >= building.floorIds.length) {
    return [];
  }
  const targetMapId = building.floorIds[floor];
  return graph.nodes.filter(node => node.map === targetMapId);
}

/** Performs a case-insensitive search on node names. */
export function searchNodes(graph: CampusGraph, query: string): MapNode[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) {
    return [];
  }
  return graph.nodes.filter(node => {
    const type = node.type.toLowerCase();
    // Only search rooms, gates, building entries, entrances, and exits
    if (type !== 'room' && type !== 'gate' && type !== 'entry' && type !== 'entrance' && type !== 'exit') {
      return false;
    }

    const name = node.name.toLowerCase();
    const id = node.id.toLowerCase();

    // Remove intersection, zyx, node, and corridor keywords from search
    if (
      name.includes('zyx') || id.includes('zyx') ||
      name.includes('node') || id.includes('node') ||
      name.includes('intersection') || id.includes('intersection') ||
      name.includes('corridor') || id.includes('corridor')
    ) {
      return false;
    }

    return name.includes(trimmed);
  });
}

/** Returns all staircase, lift, entrance, and exit transition nodes. */
export function getTransitionNodes(graph: CampusGraph): MapNode[] {
  const transitionTypes = new Set(['staircase', 'lift', 'entrance', 'exit']);
  return graph.nodes.filter(node => transitionTypes.has(node.type));
}

/** Returns all edges between two nodes in either direction. */
export function getEdgesBetween(
  graph: CampusGraph,
  nodeIdA: string,
  nodeIdB: string
): MapEdge[] {
  return graph.edges.filter(
    edge =>
      (edge.from_node === nodeIdA && edge.to_node === nodeIdB) ||
      (edge.from_node === nodeIdB && edge.to_node === nodeIdA)
  );
}

/** Validates the graph structure and returns warnings. */
export function validateGraph(graph: CampusGraph): string[] {
  const warnings: string[] = [];

  if (graph.nodes.length === 0) {
    warnings.push('Graph has no nodes.');
  }

  if (graph.edges.length === 0) {
    warnings.push('Graph has no edges.');
  }

  const nodeIds = new Set(graph.nodes.map(node => node.id));

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from_node)) {
      warnings.push(`Edge ${edge.id} references non-existent start node ${edge.from_node}.`);
    }
    if (!nodeIds.has(edge.to_node)) {
      warnings.push(`Edge ${edge.id} references non-existent end node ${edge.to_node}.`);
    }
    if (edge.distance <= 0) {
      warnings.push(`Edge ${edge.id} has an invalid weight of ${edge.distance}.`);
    }
  }

  return warnings;
}

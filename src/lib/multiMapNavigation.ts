// src/lib/multiMapNavigation.ts
import type { MapNode, MapEdge } from '@/types';
import { dijkstraAsync } from './dijkstra';
import type { DijkstraGraph } from './dijkstra';

const graphCacheNormal = new WeakMap<any, DijkstraGraph>();
const graphCacheAccessible = new WeakMap<any, DijkstraGraph>();
const nodesMapCache = new WeakMap<any, Record<string, MapNode>>();

export interface NavigationStep {
  step: number;
  map: string | null;
  start_node: string;
  end_node: string;
  path_nodes: string[];
}

/**
 * Builds an adjacency graph from a flat list of edges.
 * The graph is map‑agnostic; segmentation happens later.
 */
export function buildGlobalGraph(
  navigationEdges: MapEdge[],
  options: { accessibleOnly?: boolean } = {}
): DijkstraGraph {
  const accessibleOnly = options.accessibleOnly ?? false;
  
  if (Array.isArray(navigationEdges)) {
    const cache = accessibleOnly ? graphCacheAccessible : graphCacheNormal;
    const cached = cache.get(navigationEdges);
    if (cached) return cached;
  }

  const graph: DijkstraGraph = {};

  navigationEdges.forEach((edge) => {
    const from = edge.from_node ?? (edge as any).from;
    const to = edge.to_node ?? (edge as any).to;
    const w = edge.distance ?? (edge as any).weight ?? 1;
    const type = edge.type;
    
    if (!from || !to) return;

    // Filter out stairs in step-free/accessible mode
    if (accessibleOnly && type === 'stairs') {
      return;
    }

    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];

    // Bidirectional edges
    graph[from].push({ node: to, weight: w });
    graph[to].push({ node: from, weight: w });
  });

  if (Array.isArray(navigationEdges)) {
    const cache = accessibleOnly ? graphCacheAccessible : graphCacheNormal;
    cache.set(navigationEdges, graph);
  }

  return graph;
}

/**
 * Builds a quick lookup map from node ID to node object.
 */
export function buildNodesMap(navigationNodes: MapNode[]): Record<string, MapNode> {
  if (Array.isArray(navigationNodes)) {
    const cached = nodesMapCache.get(navigationNodes);
    if (cached) return cached;
  }

  const nextMap = Object.fromEntries(navigationNodes.map((n) => [n.id, n]));
  if (Array.isArray(navigationNodes)) {
    nodesMapCache.set(navigationNodes, nextMap);
  }
  return nextMap;
}

/**
 * Splits a global Dijkstra path into per‑map steps.
 */
export function segmentPathByMap(path: string[], nodesMap: Record<string, MapNode>): NavigationStep[] {
  if (!path || path.length === 0) return [];

  const steps: NavigationStep[] = [];

  let currentMap = nodesMap[path[0]]?.map ?? null;
  let stepStartIndex = 0;
  let stepNumber = 1;

  for (let i = 1; i < path.length; i++) {
    const nodeId = path[i];
    const node = nodesMap[nodeId];
    const nodeMap = node?.map ?? null;

    if (nodeMap !== currentMap) {
      // Map boundary at index i:
      // - previous node (i-1) is the end of the current step
      // - current node (i) starts the new step
      const prevIndex = i - 1;
      const prevNodeId = path[prevIndex];

      steps.push({
        step: stepNumber++,
        map: currentMap,
        start_node: path[stepStartIndex],
        end_node: prevNodeId,
        path_nodes: path.slice(stepStartIndex, prevIndex + 1),
      });

      currentMap = nodeMap;
      stepStartIndex = i;
    }
  }

  // Final step
  if (stepStartIndex < path.length) {
    steps.push({
      step: stepNumber,
      map: currentMap,
      start_node: path[stepStartIndex],
      end_node: path[path.length - 1],
      path_nodes: path.slice(stepStartIndex),
    });
  }

  return steps;
}

/**
 * Non-blocking async multi-map route computation.
 * Yields during Dijkstra to keep the UI responsive on large graphs.
 */
export async function computeMultiMapRouteAsync(
  navigationNodes: MapNode[],
  navigationEdges: MapEdge[],
  startNodeId: string,
  endNodeId: string,
  options: {
    signal?: AbortSignal | null;
    yieldEvery?: number;
    includeFullPath?: boolean;
    nodesMap?: Record<string, MapNode>;
    graph?: DijkstraGraph;
    accessibleOnly?: boolean;
  } = {}
): Promise<{ steps: NavigationStep[]; fullPath?: string[] } | null> {
  const {
    includeFullPath = true,
    nodesMap: precomputedNodesMap,
    graph: precomputedGraph,
    accessibleOnly = false,
    ...dijkstraOptions
  } = options;

  const nodesMap = precomputedNodesMap ?? buildNodesMap(navigationNodes);
  const graph = precomputedGraph ?? buildGlobalGraph(navigationEdges, { accessibleOnly });

  if (!nodesMap[startNodeId] || !nodesMap[endNodeId]) return null;

  const path = await dijkstraAsync(graph, startNodeId, endNodeId, dijkstraOptions);
  if (!path || path.length === 0) return null;

  const steps = segmentPathByMap(path, nodesMap);

  const result: { steps: NavigationStep[]; fullPath?: string[] } = { steps };
  if (includeFullPath) result.fullPath = path;
  return result;
}

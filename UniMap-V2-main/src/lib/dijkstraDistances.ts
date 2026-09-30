// src/lib/dijkstraDistances.ts
import type { DijkstraGraph } from './dijkstra';

class MinHeap {
  private heap: Array<[number, string]> = [];

  push(item: [number, string]): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): [number, string] | null {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  get size(): number {
    return this.heap.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.heap[p][0] <= this.heap[i][0]) return;
      const temp = this.heap[p];
      this.heap[p] = this.heap[i];
      this.heap[i] = temp;
      i = p;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      const l = i * 2 + 1;
      const r = l + 1;
      let smallest = i;
      if (l < n && this.heap[l][0] < this.heap[smallest][0]) smallest = l;
      if (r < n && this.heap[r][0] < this.heap[smallest][0]) smallest = r;
      if (smallest === i) return;
      const temp = this.heap[i];
      this.heap[i] = this.heap[smallest];
      this.heap[smallest] = temp;
      i = smallest;
    }
  }
}

async function yieldToMainThread(): Promise<void> {
  if (typeof requestAnimationFrame === 'function') {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return;
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export function dijkstraDistances(graph: DijkstraGraph, start: string): Record<string, number> {
  if (!graph || typeof graph !== 'object' || start == null) return {};

  const distances: Record<string, number> = {};

  Object.keys(graph).forEach((node) => {
    distances[node] = Infinity;
  });

  if (!(start in distances)) return {};

  distances[start] = 0;

  const heap = new MinHeap();
  heap.push([0, start]);

  while (heap.size > 0) {
    const popped = heap.pop();
    if (!popped) break;
    const [d, u] = popped;
    if (d !== distances[u]) continue;

    const neighbours = graph?.[u] ?? [];
    for (const neighbour of neighbours) {
      if (!neighbour || typeof neighbour.node !== 'string' || typeof neighbour.weight !== 'number') continue;
      const v = neighbour.node;
      if (!(v in distances)) distances[v] = Infinity;

      const newDist = distances[u] + neighbour.weight;
      if (newDist < distances[v]) {
        distances[v] = newDist;
        heap.push([newDist, v]);
      }
    }
  }

  return distances;
}

export async function dijkstraDistancesAsync(
  graph: DijkstraGraph,
  start: string,
  options: {
    signal?: AbortSignal | null;
    yieldEvery?: number;
    targetNodeIds?: string[];
  } = {}
): Promise<Record<string, number>> {
  if (!graph || typeof graph !== 'object' || start == null) return {};

  const { signal = null, targetNodeIds } = options;

  if (!Array.isArray(targetNodeIds) || targetNodeIds.length === 0) {
    const distances: Record<string, number> = {};

    Object.keys(graph).forEach((node) => {
      distances[node] = Infinity;
    });

    if (!(start in distances)) return {};

    distances[start] = 0;

    const heap = new MinHeap();
    heap.push([0, start]);

    let lastYieldTime = performance.now();
    while (heap.size > 0) {
      if (signal?.aborted) return {};

      const popped = heap.pop();
      if (!popped) break;
      const [d, u] = popped;
      if (d !== distances[u]) continue;

      const neighbours = graph?.[u] ?? [];
      for (const neighbour of neighbours) {
        if (signal?.aborted) return {};
        if (!neighbour || typeof neighbour.node !== 'string' || typeof neighbour.weight !== 'number') continue;
        const v = neighbour.node;
        if (!(v in distances)) distances[v] = Infinity;

        const newDist = distances[u] + neighbour.weight;
        if (newDist < distances[v]) {
          distances[v] = newDist;
          heap.push([newDist, v]);
        }
      }

      if (performance.now() - lastYieldTime > 10) {
        await yieldToMainThread();
        lastYieldTime = performance.now();
      }
    }

    return distances;
  }

  const targetSet = new Set(targetNodeIds);
  const finalizedTargets = new Set();

  const distances: Record<string, number> = Object.create(null);
  distances[start] = 0;

  const heap = new MinHeap();
  heap.push([0, start]);

  let lastYieldTime = performance.now();
  while (heap.size > 0) {
    if (signal?.aborted) return {};

    const popped = heap.pop();
    if (!popped) break;
    const [d, u] = popped;

    if (distances[u] == null || d !== distances[u]) continue;

    if (targetSet.has(u) && !finalizedTargets.has(u)) {
      finalizedTargets.add(u);
      if (finalizedTargets.size >= targetSet.size) break;
    }

    const neighbours = graph?.[u] ?? [];
    for (const neighbour of neighbours) {
      if (signal?.aborted) return {};
      if (!neighbour || typeof neighbour.node !== 'string' || typeof neighbour.weight !== 'number') continue;
      const v = neighbour.node;
      const prevDist = distances[v] == null ? Infinity : distances[v];

      const newDist = d + neighbour.weight;
      if (newDist < prevDist) {
        distances[v] = newDist;
        heap.push([newDist, v]);
      }
    }

    if (performance.now() - lastYieldTime > 10) {
      await yieldToMainThread();
      lastYieldTime = performance.now();
    }
  }

  const result: Record<string, number> = Object.create(null);
  for (const t of targetNodeIds) {
    if (distances[t] != null) result[t] = distances[t];
  }
  return result;
}

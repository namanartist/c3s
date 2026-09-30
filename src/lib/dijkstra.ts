// src/lib/dijkstra.ts

export interface DijkstraGraphNode {
  node: string;
  weight: number;
}

export interface DijkstraGraph {
  [nodeId: string]: DijkstraGraphNode[];
}

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

export function dijkstra(graph: DijkstraGraph, start: string, end: string): string[] | null {
  const distances: Record<string, number> = {};
  const prev: Record<string, string | null> = {};

  for (const node of Object.keys(graph ?? {})) {
    distances[node] = Infinity;
  }

  if (start == null || end == null) return null;
  if (!(start in distances)) distances[start] = Infinity;
  if (!(end in distances)) distances[end] = Infinity;

  distances[start] = 0;
  const heap = new MinHeap();
  heap.push([0, start]);

  while (heap.size > 0) {
    const popped = heap.pop();
    if (!popped) break;
    const [d, u] = popped;
    if (d !== distances[u]) continue;
    if (u === end) break;

    const neighbours = graph?.[u] ?? [];
    for (const neighbour of neighbours) {
      if (!neighbour || typeof neighbour.node !== 'string') continue;
      const v = neighbour.node;
      const w = neighbour.weight;
      if (!(v in distances)) distances[v] = Infinity;

      const newDist = distances[u] + w;
      if (newDist < distances[v]) {
        distances[v] = newDist;
        prev[v] = u;
        heap.push([newDist, v]);
      }
    }
  }

  if (distances[end] === Infinity) return null;

  const path: string[] = [];
  let current: string | null = end;
  while (current != null) {
    path.push(current);
    if (current === start) break;
    current = prev[current] ?? null;
  }

  if (path[path.length - 1] !== start) return null;
  path.reverse();
  return path;
}

export async function dijkstraAsync(
  graph: DijkstraGraph,
  start: string,
  end: string,
  options: { signal?: AbortSignal | null; yieldEvery?: number } = {}
): Promise<string[] | null> {
  const { signal = null } = options;

  const distances: Record<string, number> = {};
  const prev: Record<string, string | null> = {};

  for (const node of Object.keys(graph ?? {})) {
    distances[node] = Infinity;
  }

  if (start == null || end == null) return null;
  if (!(start in distances)) distances[start] = Infinity;
  if (!(end in distances)) distances[end] = Infinity;

  distances[start] = 0;
  const heap = new MinHeap();
  heap.push([0, start]);

  let lastYieldTime = performance.now();
  while (heap.size > 0) {
    if (signal?.aborted) return null;

    const popped = heap.pop();
    if (!popped) break;
    const [d, u] = popped;
    if (d !== distances[u]) continue;
    if (u === end) break;

    const neighbours = graph?.[u] ?? [];
    for (const neighbour of neighbours) {
      if (signal?.aborted) return null;
      if (!neighbour || typeof neighbour.node !== 'string') continue;
      const v = neighbour.node;
      const w = neighbour.weight;
      if (!(v in distances)) distances[v] = Infinity;

      const newDist = distances[u] + w;
      if (newDist < distances[v]) {
        distances[v] = newDist;
        prev[v] = u;
        heap.push([newDist, v]);
      }
    }

    if (performance.now() - lastYieldTime > 10) {
      await yieldToMainThread();
      lastYieldTime = performance.now();
    }
  }

  if (distances[end] === Infinity) return null;

  const path: string[] = [];
  let current: string | null = end;
  while (current != null) {
    path.push(current);
    if (current === start) break;
    current = prev[current] ?? null;
  }

  if (path[path.length - 1] !== start) return null;
  path.reverse();
  return path;
}

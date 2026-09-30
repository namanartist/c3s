// src/types/route.ts
import type { MapNode, EdgeType } from './graph';

/** Represents options to configure route calculation. */
export interface RouteOptions {
  avoidStairs: boolean;
  accessibleOnly: boolean;
  preferShortest: boolean;
}

/** Represents a single step in a computed navigation path. */
export interface RouteStep {
  nodeId: string;
  label: string;
  instruction: string;
  distanceFromPrev: number;
  type: EdgeType;
}

/** Represents a complete computed route between two nodes. */
export interface Route {
  from: MapNode;
  to: MapNode;
  steps: RouteStep[];
  totalDistance: number;
  estimatedTime: number;
  nodeIds: string[];
}

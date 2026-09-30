// src/types/graph.ts

/** Union type of string literals representing every kind of campus node. */
export type NodeType =
  | 'room'
  | 'corridor'
  | 'junction'
  | 'staircase'
  | 'lift'
  | 'entrance'
  | 'exit'
  | 'landmark'
  | 'outdoor'
  | 'corridor_to_corridor'
  | 'campus';

/** Union type of string literals representing walkable paths. */
export type EdgeType = 'corridor' | 'stairs' | 'lift' | 'outdoor' | 'ramp';

/** Represents a building and its existing floors. */
export interface Building {
  id: string;
  name: string;
  floors: number;
  floorIds: string[];
}

/** Represents a single point or location on the campus map. */
export interface MapNode {
  id: string;
  name: string;
  type: NodeType;
  map: string;
  x: number;
  y: number;
  svgElementId?: string;
  category: string;
}

/** Represents a physical path connecting two nodes. */
export interface MapEdge {
  id: string;
  from_node: string;
  to_node: string;
  distance: number;
  type: EdgeType;
  category: string;
}

/** Represents the complete graph structure of the campus. */
export interface CampusGraph {
  nodes: MapNode[];
  edges: MapEdge[];
  buildings: Building[];
}

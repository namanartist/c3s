// src/constants/index.ts
import type { RouteOptions, EdgeType, NodeType } from '@/types';

export const WALKING_SPEED_MPS: number = 1.4;

export const NODE_TYPES: readonly NodeType[] = [
  'room',
  'corridor',
  'junction',
  'staircase',
  'lift',
  'entrance',
  'exit',
  'landmark',
  'outdoor',
  'corridor_to_corridor',
  'campus'
] as const;

export const EDGE_TYPES: readonly EdgeType[] = [
  'corridor',
  'stairs',
  'lift',
  'outdoor',
  'ramp'
] as const;

export const ACCESSIBLE_EDGE_TYPES: readonly EdgeType[] = [
  'corridor',
  'lift',
  'outdoor',
  'ramp'
];

export const DEFAULT_ROUTE_OPTIONS: RouteOptions = {
  avoidStairs: false,
  accessibleOnly: false,
  preferShortest: true
};

export const CLOUDINARY_BASE_URL: string =
  import.meta.env.VITE_CLOUDINARY_BASE_URL ?? '';

export const MONGODB_API_URL: string =
  import.meta.env.VITE_MONGODB_API_URL ?? '';

export const MONGODB_API_KEY: string =
  import.meta.env.VITE_MONGODB_API_KEY ?? '';

// src/types/map.ts
import type { MapNode } from './graph';
import type { Route } from './route';

/** Represents a specific floor plan map for a building. */
export interface FloorMap {
  map: string;
  building: string;
  floor: number;
  svgUrl: string;
  label: string;
}

/** Represents the global map navigation state in the app. */
export interface MapState {
  activeBuilding: string | null;
  activeFloor: number | null;
  activeFloorMap: FloorMap | null;
  selectedFrom: MapNode | null;
  selectedTo: MapNode | null;
  currentRoute: Route | null;
  isLoading: boolean;
  error: string | null;
}

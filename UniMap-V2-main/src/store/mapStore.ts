// src/store/mapStore.ts
import { create } from 'zustand';
import type { CampusGraph, FloorMap, MapNode, Route } from '@/types';

export interface Transform {
  scale: number;
  x: number;
  y: number;
}

export interface MapStoreState {
  graph: CampusGraph | null;
  floors: FloorMap[];
  isGraphLoaded: boolean;
  activeMap: string | null;
  activeFloor: number | null;
  activeFloorMap: FloorMap | null;
  selectedFrom: MapNode | null;
  selectedTo: MapNode | null;
  currentRoute: Route | null;
  isLoading: boolean;
  error: string | null;
  transform: Transform;

  setGraph: (graph: CampusGraph) => void;
  setFloors: (floors: FloorMap[]) => void;
  setActiveMap: (map: string | null) => void;
  setActiveFloor: (floor: number | null) => void;
  setActiveFloorMap: (floorMap: FloorMap | null) => void;
  setSelectedFrom: (node: MapNode | null) => void;
  setSelectedTo: (node: MapNode | null) => void;
  setCurrentRoute: (route: Route | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTransform: (transform: Transform) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetTransform: () => void;
  clearRoute: () => void;
  reset: () => void;
}

const initialState = {
  graph: null,
  floors: [],
  isGraphLoaded: false,
  activeMap: null,
  activeFloor: null,
  activeFloorMap: null,
  selectedFrom: null,
  selectedTo: null,
  currentRoute: null,
  isLoading: false,
  error: null,
  transform: { scale: 1, x: 0, y: 0 },
};

/** Zustand hook representing the central map navigation state store. */
export const useMapStore = create<MapStoreState>((set) => ({
  ...initialState,

  setGraph: (graph) => set({ graph }),
  setFloors: (floors) => {
    const mapped = floors.map(f => {
      // @ts-ignore
      if (f.map === 'Campus_Map') {
        return {
          ...f,
          building: 'Campus_Map',
          floor: 1,
        };
      }
      return f;
    });
    set({ floors: mapped });
  },
  setActiveMap: (activeMap) => set({ activeMap }),
  setActiveFloor: (activeFloor) => set({ activeFloor }),
  setActiveFloorMap: (activeFloorMap) => set({ activeFloorMap }),
  setSelectedFrom: (selectedFrom) => set({ selectedFrom }),
  setSelectedTo: (selectedTo) => set({ selectedTo }),
  setCurrentRoute: (currentRoute) => set({ currentRoute }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTransform: (transform) => set({ transform }),
  zoomIn: () => set((state) => {
    const scale = Math.min(state.transform.scale * 1.2, 4);
    return { transform: { ...state.transform, scale } };
  }),
  zoomOut: () => set((state) => {
    const scale = Math.max(state.transform.scale / 1.2, 0.5);
    return { transform: { ...state.transform, scale } };
  }),
  resetTransform: () => set({ transform: { scale: 1, x: 0, y: 0 } }),

  clearRoute: () => set({ selectedFrom: null, selectedTo: null, currentRoute: null }),
  reset: () => set(initialState),
}));

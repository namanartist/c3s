// src/hooks/useFloorMap.ts
import { useMemo } from 'react';
import { useMapStore } from '@/store/mapStore';
import type { FloorMap } from '@/types';
import { resolveSvgUrl } from '@/lib/cloudinary';

/** React hook to resolve the active floor map information and its corresponding Cloudinary SVG URL. */
export function useFloorMap(): {
  svgUrl: string | null;
  floorMap: FloorMap | null;
} {
  const activeMap = useMapStore(state => state.activeMap);
  const activeFloor = useMapStore(state => state.activeFloor);
  const floors = useMapStore(state => state.floors);

  const resolved = useMemo(() => {
    if (activeMap === null || activeFloor === null) {
      return { svgUrl: null, floorMap: null };
    }

    const svgUrl = resolveSvgUrl(floors, activeMap, activeFloor);
    const floorMap =
      floors.find(
        f => f.building?.toLowerCase() === activeMap.toLowerCase() && f.floor === activeFloor
      ) ?? null;

    return { svgUrl, floorMap };
  }, [activeMap, activeFloor, floors]);

  return resolved;
}

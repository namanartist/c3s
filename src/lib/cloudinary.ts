// src/lib/cloudinary.ts
import type { FloorMap } from '@/types';
import { CLOUDINARY_BASE_URL } from '@/constants';

/** Constructs a Cloudinary URL template for a specific floor map SVG. */
export function buildSvgUrl(map: string, floor: number): string {
  const sanitizedMap = map.toLowerCase().trim();
  return `${CLOUDINARY_BASE_URL}/${sanitizedMap}_floor${floor}.svg`;
}

/** Resolves the SVG URL from the floors metadata or falls back to standard Cloudinary pathing. */
export function resolveSvgUrl(
  floors: FloorMap[],
  map: string,
  floor: number
): string | null {
  const found = floors.find(
    f => f.building?.toLowerCase() === map.toLowerCase() && f.floor === floor
  );
  if (found) {
    return found.svgUrl;
  }
  if (!CLOUDINARY_BASE_URL) {
    return null;
  }
  return buildSvgUrl(map, floor);
}

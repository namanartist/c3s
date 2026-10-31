// src/lib/mapLabels.ts
import type { MapNode } from '@/types';

export interface LocationTagItem {
  id: string;
  node: MapNode;
  x: number;
  y: number;
  shortLabel: string;
  fullLabel: string;
  category: 'classroom' | 'lab' | 'hall' | 'stairs' | 'washroom' | 'cabin' | 'gate' | 'other';
  icon: string;
  tier: 1 | 2 | 3;
  color: string;
  bg: string;
  border: string;
  textColor: string;
  spreadX: number;
  spreadY: number;
}

/**
 * Cleanly categorizes and formats raw node labels into readable, aesthetic campus tags
 */
export function formatNodeTag(node: MapNode): {
  shortLabel: string;
  fullLabel: string;
  category: LocationTagItem['category'];
  icon: string;
  tier: 1 | 2 | 3;
  color: string;
  bg: string;
  border: string;
  textColor: string;
} {
  const name = node.name || node.id || '';
  const lower = name.toLowerCase();
  const idLower = (node.id || '').toLowerCase();

  // 1. High Priority Anchors & Key Classrooms (Tier 1)
  if (idLower === 'room_j125' || lower.includes('101') || lower.includes('j125')) {
    return {
      shortLabel: '101 (J125)',
      fullLabel: 'Classroom 101 J125',
      category: 'classroom',
      icon: '🎓',
      tier: 1,
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#3B82F6',
      textColor: '#1D4ED8',
    };
  }

  if (idLower === 'room_j126' || lower.includes('102') || lower.includes('j126')) {
    return {
      shortLabel: '102 (J126)',
      fullLabel: 'Classroom 102 J126',
      category: 'classroom',
      icon: '🎓',
      tier: 1,
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#3B82F6',
      textColor: '#1D4ED8',
    };
  }

  if (lower.includes('colloquium') || idLower.includes('colloquium') || lower.includes('j101')) {
    return {
      shortLabel: 'Colloquium Hall',
      fullLabel: 'Colloquium Hall (J101)',
      category: 'hall',
      icon: '🏛️',
      tier: 1,
      color: '#D97706',
      bg: '#FEF3C7',
      border: '#F59E0B',
      textColor: '#92400E',
    };
  }

  if (lower.includes('drawing hall') || lower.includes('j124')) {
    return {
      shortLabel: 'Drawing Hall',
      fullLabel: 'Drawing Hall (J124)',
      category: 'classroom',
      icon: '📐',
      tier: 1,
      color: '#0284C7',
      bg: '#F0F9FF',
      border: '#38BDF8',
      textColor: '#0369A1',
    };
  }

  if (lower.includes('library')) {
    return {
      shortLabel: 'Library',
      fullLabel: 'Central Library & Reading Hall',
      category: 'hall',
      icon: '📚',
      tier: 1,
      color: '#D97706',
      bg: '#FEF3C7',
      border: '#F59E0B',
      textColor: '#92400E',
    };
  }

  if (lower.includes('canteen') || lower.includes('cafeteria')) {
    return {
      shortLabel: 'Canteen',
      fullLabel: 'Campus Canteen & Cafeteria',
      category: 'hall',
      icon: '☕',
      tier: 1,
      color: '#EA580C',
      bg: '#FFEDD5',
      border: '#FB923C',
      textColor: '#9A3412',
    };
  }

  if (lower.includes('director')) {
    return {
      shortLabel: "Director's Office",
      fullLabel: "Director's Office",
      category: 'cabin',
      icon: '🏛️',
      tier: 1,
      color: '#475569',
      bg: '#F8FAFC',
      border: '#94A3B8',
      textColor: '#0F172A',
    };
  }

  // Staircases & Elevators (Tier 1)
  if (node.type === 'staircase' || (node.type as string) === 'stairs' || lower.includes('stair') || lower.includes('lift') || lower.includes('elevator')) {
    const stairNum = name.match(/\d+/)?.[0] || '';
    return {
      shortLabel: stairNum ? `Stairs ${stairNum}` : 'Stairs',
      fullLabel: name,
      category: 'stairs',
      icon: '🪜',
      tier: 1,
      color: '#9333EA',
      bg: '#FAF5FF',
      border: '#C084FC',
      textColor: '#6B21A8',
    };
  }

  // Washrooms (Tier 1)
  if (lower.includes('washroom') || lower.includes('restroom') || lower.includes('toilet')) {
    const isFemale = lower.includes('female') || lower.includes('ladies') || lower.includes('women');
    return {
      shortLabel: isFemale ? 'Restroom 🚺' : 'Restroom 🚹',
      fullLabel: name,
      category: 'washroom',
      icon: '🚻',
      tier: 1,
      color: '#0D9488',
      bg: '#F0FDFA',
      border: '#5EEAD4',
      textColor: '#115E59',
    };
  }

  // Gates & Entries (Tier 1)
  if (lower.includes('gate') || node.category === 'entry' || (node.type as string) === 'entry') {
    const gateMatch = name.match(/gate\s*(\d+)/i);
    const gateLabel = gateMatch ? `Gate ${gateMatch[1]}` : name.replace(/_node|_campus/gi, '');
    return {
      shortLabel: gateLabel,
      fullLabel: name,
      category: 'gate',
      icon: '🚪',
      tier: 1,
      color: '#059669',
      bg: '#ECFDF5',
      border: '#34D399',
      textColor: '#065F46',
    };
  }

  // 2. Classrooms & Department Laboratories (Tier 2 - Visible when zoomed in >= 1.3)
  if (lower.includes('classroom') || lower.includes('room') || lower.includes('sh-') || lower.includes('lt')) {
    const numMatch = name.match(/(?:classroom|room|sh-?|lt-?)\s*([a-z0-9]+)/i);
    const roomNum = numMatch ? numMatch[1].toUpperCase() : name.replace(/classroom|room/gi, '').trim();
    return {
      shortLabel: `Room ${roomNum}`,
      fullLabel: name,
      category: 'classroom',
      icon: '🎓',
      tier: 2,
      color: '#0284C7',
      bg: '#F0F9FF',
      border: '#7DD3FC',
      textColor: '#0369A1',
    };
  }

  if (lower.includes('lab') || lower.includes('laboratory') || lower.includes('computer')) {
    const short = name.replace(/laboratory/gi, 'Lab').replace(/department/gi, '').trim();
    return {
      shortLabel: short.length > 16 ? short.slice(0, 14) + '...' : short,
      fullLabel: name,
      category: 'lab',
      icon: '💻',
      tier: 2,
      color: '#7C3AED',
      bg: '#FAF5FF',
      border: '#DDD6FE',
      textColor: '#5B21B6',
    };
  }

  // 3. Faculty Cabins & Administrative Offices (Tier 3 - Visible when zoomed in deeply >= 2.0)
  if (lower.includes('dr.') || lower.includes('prof.') || lower.includes('er.') || lower.includes('ar.') || lower.includes('cabin')) {
    const cleanName = name.replace(/node_|cabin_/gi, '').replace(/_/g, ' ').trim();
    const shortName = cleanName.length > 16 ? cleanName.slice(0, 14) + '...' : cleanName;
    return {
      shortLabel: shortName,
      fullLabel: cleanName,
      category: 'cabin',
      icon: '👤',
      tier: 3,
      color: '#64748B',
      bg: '#F8FAFC',
      border: '#CBD5E1',
      textColor: '#334155',
    };
  }

  // Generic fallback (Tier 2 or 3)
  const isGenericWaypoint = lower.includes('corridor') || lower.includes('path') || lower.includes('turn') || lower.includes('junction');
  return {
    shortLabel: name.length > 15 ? name.slice(0, 13) + '..' : name,
    fullLabel: name,
    category: 'other',
    icon: '📍',
    tier: isGenericWaypoint ? 3 : 2,
    color: '#64748B',
    bg: '#F8FAFC',
    border: '#E2E8F0',
    textColor: '#475569',
  };
}

/**
 * Computes electrostatic-like repulsion offsets between closely adjacent nodes
 * so that when the map zooms in, the visual distance between tags expands smoothly
 * and eliminates overlapping labels!
 */
export function computeClusterOffsets(nodes: MapNode[]): Map<string, { x: number; y: number }> {
  const offsets = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => offsets.set(n.id, { x: 0, y: 0 }));

  const CLUSTER_THRESHOLD = 45; // Nodes closer than 45 SVG units interact

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let dist = Math.hypot(dx, dy);

      if (dist < CLUSTER_THRESHOLD) {
        if (dist === 0) {
          dx = 1;
          dy = 0;
          dist = 1;
        }
        // Force inversely proportional to distance
        const force = (CLUSTER_THRESHOLD - dist) / CLUSTER_THRESHOLD;
        const nx = (dx / dist) * force;
        const ny = (dy / dist) * force;

        const offA = offsets.get(a.id)!;
        const offB = offsets.get(b.id)!;
        offA.x += nx;
        offA.y += ny;
        offB.x -= nx;
        offB.y -= ny;
      }
    }
  }

  // Clamp & normalize magnitude
  nodes.forEach((n) => {
    const off = offsets.get(n.id)!;
    const mag = Math.hypot(off.x, off.y);
    if (mag > 0) {
      const clamped = Math.min(mag, 2.2);
      off.x = (off.x / mag) * clamped;
      off.y = (off.y / mag) * clamped;
    }
  });

  return offsets;
}

/**
 * Detects whether a node is a road node, path node, corridor segment, or intermediate routing waypoint.
 * Road nodes and transit waypoints are critical for Dijkstra navigation calculation, but MUST NOT show tags.
 */
export function isRoadOrTransitNode(node: MapNode): boolean {
  const id = (node.id || '').toLowerCase();
  const name = (node.name || '').toLowerCase();
  const type = ((node.type as string) || '').toLowerCase();
  const cat = ((node.category as string) || '').toLowerCase();

  // 1. Explicit Road / Street / Rasta keywords in ID or Name
  if (
    id.includes('road') ||
    id.startsWith('rd_') ||
    id.includes('_rd_') ||
    id.startsWith('road_') ||
    name.includes('road') ||
    name.includes('rasta') ||
    name.includes('gali') ||
    name.includes('street') ||
    name.includes('intersection') ||
    name.includes('path node') ||
    name.includes('pathway') ||
    name.includes('driveway')
  ) {
    return true;
  }

  // 2. Corridors, turns, junctions, path waypoints
  if (
    type === 'corridor' ||
    type === 'road' ||
    type === 'path' ||
    type === 'waypoint' ||
    cat === 'campus' && (id.includes('road') || id.includes('canteen0') || id.includes('library0')) ||
    id.startsWith('corridor') ||
    id.startsWith('junction') ||
    id.startsWith('turn_') ||
    id.startsWith('waypoint_') ||
    name.startsWith('corridor') ||
    name.startsWith('junction') ||
    name.startsWith('turn') ||
    name.startsWith('waypoint') ||
    /^p\d+$/i.test(id) ||
    /^node_\d+$/i.test(id)
  ) {
    // Only keep if it is explicitly a genuine destination / landmark
    const hasGenuineName =
      name.includes('classroom') ||
      name.includes('room') ||
      name.includes('hall') ||
      name.includes('lab') ||
      name.includes('laboratory') ||
      name.includes('gate') ||
      name.includes('stair') ||
      name.includes('lift') ||
      name.includes('washroom') ||
      name.includes('toilet') ||
      name.includes('library') ||
      name.includes('canteen') ||
      name.includes('cafeteria') ||
      name.includes('office') ||
      name.includes('workshop') ||
      name.includes('entry') ||
      name.includes('entrance') ||
      name.includes('dr.') ||
      name.includes('prof.');

    // If it's a "Path Node" even with canteen or library in name, it's a transit waypoint!
    if (name.includes('path node') || name.includes('road node')) {
      return true;
    }

    if (!hasGenuineName) {
      return true;
    }
  }

  return false;
}

/**
 * Generates ready-to-render location tags for the active map with precomputed
 * zoom spread vectors and level-of-detail tiers.
 * Road nodes and transit waypoints are strictly excluded.
 */
export function getMapLocationTags(nodes: MapNode[], mapId: string | null): LocationTagItem[] {
  if (!mapId) return [];

  // Filter named and recognizable points of interest on this floor, excluding road and transit nodes
  const mapNodes = nodes.filter((n) => {
    if (n.map !== mapId) return false;

    // RULE: Do not show tag of road nodes or intermediate transit waypoints
    if (isRoadOrTransitNode(n)) return false;

    const lowerName = (n.name || '').toLowerCase();
    const lowerId = (n.id || '').toLowerCase();
    const type = ((n.type as string) || '').toLowerCase();
    const cat = ((n.category as string) || '').toLowerCase();

    // Must be a recognizable destination, room, entrance, gate, staircase, lab, hall, or facility
    const isDest =
      type === 'room' ||
      type === 'staircase' ||
      type === 'stairs' ||
      type === 'lift' ||
      type === 'entry' ||
      cat === 'entrance' ||
      cat === 'entry' ||
      lowerName.includes('gate') ||
      lowerName.includes('entry') ||
      lowerName.includes('entrance') ||
      lowerName.includes('room') ||
      lowerName.includes('hall') ||
      lowerName.includes('lab') ||
      lowerName.includes('washroom') ||
      lowerName.includes('restroom') ||
      lowerName.includes('library') ||
      lowerName.includes('canteen') ||
      lowerName.includes('workshop') ||
      lowerName.includes('office') ||
      lowerName.includes('dr.') ||
      lowerName.includes('prof.') ||
      lowerId.startsWith('room_') ||
      lowerId.startsWith('entry');

    return isDest;
  });

  const offsets = computeClusterOffsets(mapNodes);

  return mapNodes.map((n) => {
    const formatted = formatNodeTag(n);
    const spread = offsets.get(n.id) || { x: 0, y: 0 };

    return {
      id: n.id,
      node: n,
      x: n.x,
      y: n.y,
      shortLabel: formatted.shortLabel,
      fullLabel: formatted.fullLabel,
      category: formatted.category,
      icon: formatted.icon,
      tier: formatted.tier,
      color: formatted.color,
      bg: formatted.bg,
      border: formatted.border,
      textColor: formatted.textColor,
      spreadX: spread.x,
      spreadY: spread.y,
    };
  });
}

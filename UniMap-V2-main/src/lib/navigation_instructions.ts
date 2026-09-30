// src/lib/navigation_instructions.ts
import type { MapNode, MapEdge } from '@/types';
import { parseRoomName } from '@/lib/roomParser';

const DIRECTION_MAP: Record<string, string> = {
  straight: 'Go straight',
  left: 'Turn left',
  right: 'Turn right',
  'slight left': 'Bear left',
  'slight right': 'Bear right',
  'sharp left': 'Make a sharp left turn',
  'sharp right': 'Make a sharp right turn',
  'u-turn': 'Make a U-turn',
};

export interface BasicNavigationInstruction {
  action: 'start' | 'continue' | 'turn' | 'arrive' | 'error';
  location?: string;
  message: string;
  distance: string | number;
  direction?: string;
  distanceInMeters?: number;
  from?: string;
  to?: string;
  firstStepTo?: string;
  edgeType?: string;
  landmark?: string;
}

/**
 * Calculate the angle between two vectors
 * Returns angle in degrees (-180 to 180)
 */
function calculateAngle(p1: MapNode, p2: MapNode, p3: MapNode): number {
  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  
  const angle1 = Math.atan2(v1.y, v1.x);
  const angle2 = Math.atan2(v2.y, v2.x);
  
  let angle = (angle2 - angle1) * (180 / Math.PI);
  
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  
  return angle;
}

/**
 * Determine turn direction from angle
 * (Negated for SVG coords where Y increases downward)
 */
function getTurnDirection(angle: number): string {
  const flipped = -angle;
  const absAngle = Math.abs(flipped);
  
  if (absAngle < 20) {
    return 'straight';
  } else if (absAngle > 160) {
    return 'u-turn';
  } else if (flipped > 0) {
    if (absAngle < 60) return 'slight left';
    if (absAngle < 120) return 'left';
    return 'sharp left';
  } else {
    if (absAngle < 60) return 'slight right';
    if (absAngle < 120) return 'right';
    return 'sharp right';
  }
}

function getFloorFromMapId(mapId: string): number {
  if (!mapId) return 0;
  const parts = mapId.split('_');
  const suffix = parts[parts.length - 1]?.toLowerCase();
  if (suffix === 'gf') return 0;
  if (suffix === 'ff') return 1;
  if (suffix === 'sf') return 2;
  if (suffix === 'tf') return 3;
  const num = parseInt(suffix, 10);
  if (!isNaN(num)) return num;
  return 0;
}

/**
 * Calculate distance between two nodes
 */
function calculateDistance(node1: MapNode, node2: MapNode): number {
  const dx = node2.x - node1.x;
  const dy = node2.y - node1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Format basic instruction message
 */
function formatInstruction(direction: string, distanceInMeters: number): string {
  const action = DIRECTION_MAP[direction] || 'Continue';
  
  if (distanceInMeters < 1) {
    return `${action}`;
  } else {
    return `${action} for ${distanceInMeters}m`;
  }
}

/**
 * Generate navigation instructions from a path
 */
export function generateNavigationInstructions(path: string[], nodes: Record<string, MapNode>): BasicNavigationInstruction[] {
  if (!path || path.length < 2) {
    return [{ action: 'error', message: 'Invalid path', distance: 0 }];
  }
  
  const instructions: BasicNavigationInstruction[] = [];
  
  // Start instruction placeholder
  instructions.push({
    action: 'start',
    location: path[0],
    message: `Starting at ${path[0]}`,
    distance: 0
  });
  
  let currentDirection: string | null = null;
  let accumulatedDistance = 0;
  let segmentStart = 0;
  
  for (let i = 1; i < path.length; i++) {
    const prevNode = nodes[path[i - 1]];
    const currentNode = nodes[path[i]];
    if (!prevNode || !currentNode) continue;
    
    const segmentDistance = calculateDistance(prevNode, currentNode);
    
    let direction = 'straight';
    if (i < path.length - 1) {
      const nextNode = nodes[path[i + 1]];
      if (nextNode) {
        const angle = calculateAngle(prevNode, currentNode, nextNode);
        direction = getTurnDirection(angle);
      }
    }
    
    if (direction !== currentDirection || i === path.length - 1) {
      if (currentDirection !== null) {
        const totalDist = accumulatedDistance + (i === path.length - 1 ? segmentDistance : 0);
        
        instructions.push({
          action: currentDirection === 'straight' ? 'continue' : 'turn',
          direction: currentDirection,
          distance: Math.round(totalDist * 100) / 100,
          distanceInMeters: Math.round(totalDist / 10),
          from: path[segmentStart],
          to: i === path.length - 1 ? path[i] : path[i - 1],
          firstStepTo: path[segmentStart + 1],
          message: formatInstruction(currentDirection, Math.round(totalDist / 10))
        });
        
        accumulatedDistance = 0;
        segmentStart = i - 1;
      }
      
      currentDirection = direction;
    }
    
    accumulatedDistance += segmentDistance;
  }
  
  // Arrival instruction placeholder
  instructions.push({
    action: 'arrive',
    location: path[path.length - 1],
    message: `You have arrived at ${path[path.length - 1]}`,
    distance: 0
  });
  
  return instructions;
}

/**
 * Build undirected edge index
 */
export function buildUndirectedEdgeIndex(edges: MapEdge[]): Map<string, MapEdge> {
  if (!Array.isArray(edges)) return new Map();
  const index = new Map<string, MapEdge>();
  edges.forEach((e) => {
    const from = e.from_node ?? (e as any).from;
    const to = e.to_node ?? (e as any).to;
    if (!from || !to) return;
    const keyA = `${from}|${to}`;
    const keyB = `${to}|${from}`;
    index.set(keyA, e);
    index.set(keyB, e);
  });
  return index;
}

/**
 * Enhanced detailed instructions utilizing neighbor and floor transition context
 */
export function generateDetailedNavigationInstructions(
  path: string[],
  nodes: Record<string, MapNode>,
  edgesOrIndex: MapEdge[] | Map<string, MapEdge>
): BasicNavigationInstruction[] {
  const basicInstructions = generateNavigationInstructions(path, nodes);
  const edgeIndex =
    edgesOrIndex instanceof Map ? edgesOrIndex : buildUndirectedEdgeIndex(edgesOrIndex);

  function getCleanRoomNameOnly(nodeId: string): string | null {
    const node = nodes[nodeId];
    if (!node) return null;
    if (node.type === 'room' || node.type === 'landmark' || node.type === 'entrance' || node.type === 'exit') {
      const name = node.name || parseRoomName(nodeId)?.name;
      if (name) {
        const lower = name.toLowerCase();
        if (!lower.includes('node') && !lower.includes('junction') && !lower.includes('road') && !lower.includes('corridor') && !lower.includes('intersection')) {
          return name;
        }
      }
    }
    return null;
  }

  function findNearbyRoomName(nodeId: string): string | null {
    const selfRoom = getCleanRoomNameOnly(nodeId);
    if (selfRoom) return selfRoom;

    for (const [key] of edgeIndex.entries()) {
      const parts = key.split('|');
      if (parts[0] === nodeId) {
        const room = getCleanRoomNameOnly(parts[1]);
        if (room) return room;
      }
    }

    for (const [key] of edgeIndex.entries()) {
      const parts = key.split('|');
      if (parts[0] === nodeId) {
        const neighborId = parts[1];
        for (const [subKey] of edgeIndex.entries()) {
          const subParts = subKey.split('|');
          if (subParts[0] === neighborId && subParts[1] !== nodeId) {
            const room = getCleanRoomNameOnly(subParts[1]);
            if (room) return room;
          }
        }
      }
    }
    return null;
  }

  function getNodeDisplayName(nodeId: string): string {
    const selfRoom = getCleanRoomNameOnly(nodeId);
    if (selfRoom) return selfRoom;
    
    const nearby = findNearbyRoomName(nodeId);
    if (nearby) return nearby;

    const node = nodes[nodeId];
    if (node && node.name) {
      const cleaned = node.name
        .replace(/intersection/gi, '')
        .replace(/corridor/gi, '')
        .replace(/road/gi, '')
        .replace(/node/gi, '')
        .replace(/junction/gi, '')
        .replace(/  +/g, ' ')
        .trim();
      if (cleaned) return cleaned;
    }
    return 'pathway';
  }

  return basicInstructions.map((instruction) => {
    const fromNode = instruction.from;
    const toNode = instruction.to;

    if (instruction.action === 'start' && instruction.location) {
      const selfRoom = getCleanRoomNameOnly(instruction.location);
      if (selfRoom) {
        instruction.message = `Starting at ${selfRoom}`;
      } else {
        const nearby = findNearbyRoomName(instruction.location);
        if (nearby) {
          instruction.message = `Starting near ${nearby}`;
        } else {
          instruction.message = `Starting journey at ${getNodeDisplayName(instruction.location)}`;
        }
      }
    }
    if (instruction.action === 'arrive' && instruction.location) {
      const selfRoom = getCleanRoomNameOnly(instruction.location);
      if (selfRoom) {
        instruction.message = `You have arrived at ${selfRoom}`;
      } else {
        const nearby = findNearbyRoomName(instruction.location);
        if (nearby) {
          instruction.message = `You have arrived near ${nearby}`;
        } else {
          instruction.message = `You have arrived at ${getNodeDisplayName(instruction.location)}`;
        }
      }
    }

    if (instruction.action === 'continue' || instruction.action === 'turn') {
      let isSpecialTransition = false;
      if (edgeIndex && fromNode && toNode) {
        const edge = edgeIndex.get(`${fromNode}|${toNode}`);
        if (edge) {
          instruction.edgeType = edge.type;
          if (edge.type === 'stairs' || edge.type === 'lift' || edge.type === 'ramp') {
            isSpecialTransition = true;
            const currentFloor = typeof (nodes[fromNode] as any).floor === 'number'
              ? (nodes[fromNode] as any).floor
              : getFloorFromMapId(nodes[fromNode].map);
            const nextFloor = typeof (nodes[toNode] as any).floor === 'number'
              ? (nodes[toNode] as any).floor
              : getFloorFromMapId(nodes[toNode].map);
            const floorStr = nextFloor === 0 ? 'G' : `F${nextFloor}`;
            if (edge.type === 'stairs') {
              instruction.message = `Take the stairs ${nextFloor > currentFloor ? 'up' : 'down'} to Floor ${floorStr}`;
            } else if (edge.type === 'lift') {
              instruction.message = `Take the lift ${nextFloor > currentFloor ? 'up' : 'down'} to Floor ${floorStr}`;
            } else {
              instruction.message = `Take the ramp to Floor ${floorStr}`;
            }
          }
        }
      }

      if (!isSpecialTransition) {
        const nearFrom = fromNode ? findNearbyRoomName(fromNode) : null;
        const nearTo = toNode ? findNearbyRoomName(toNode) : null;

        if (instruction.action === 'turn' && nearTo) {
          instruction.message = `${DIRECTION_MAP[instruction.direction || ''] || 'Turn'} near ${nearTo}`;
        } else if (instruction.action === 'continue' && nearFrom) {
          instruction.message = `Continue past ${nearFrom}`;
        } else {
          const action = DIRECTION_MAP[instruction.direction || ''] || 'Continue';
          instruction.message = action;
        }
      }

      if (instruction.distanceInMeters && instruction.distanceInMeters > 0) {
        instruction.distance = `${instruction.distanceInMeters}m`;
      } else {
        instruction.distance = '';
      }

      instruction.landmark = ''; // Keep landmark clean from roads/corridors
    }

    return instruction;
  });
}

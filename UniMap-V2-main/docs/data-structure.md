# UniMap Data Structures & Schemas

This document provides a detailed reference of the TypeScript interfaces, enums, graph models, and MongoDB collection schemas used across **UniMap**.

---

## TypeScript Core Interfaces (`src/types/`)

### 1. `MapNode` (`src/types/graph.ts`)
Represents a single point, room, junction, or landmark on the campus map graph.

```typescript
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

export interface MapNode {
  id: string;             // Unique node identifier (e.g. "room_101", "stair_g_01")
  name: string;           // Display name (e.g. "Physics Lab", "Main Stairs")
  type: NodeType;         // Specific node classification
  map: string;            // Map identifier string (e.g. "main_ground_floor")
  x: number;              // X coordinate relative to SVG viewBox
  y: number;              // Y coordinate relative to SVG viewBox
  svgElementId?: string;  // Linked SVG DOM element ID for visual selection
  category: string;       // Categorization grouping (e.g. "academic", "utility", "entry")
}
```

---

### 2. `MapEdge` (`src/types/graph.ts`)
Represents a physical, walkable connection connecting two nodes.

```typescript
export type EdgeType = 'corridor' | 'stairs' | 'lift' | 'outdoor' | 'ramp';

export interface MapEdge {
  id: string;         // Unique edge identifier
  from_node: string;  // Starting node ID
  to_node: string;    // Ending node ID
  distance: number;   // Physical/weight distance between nodes
  type: EdgeType;     // Classification of path type
  category: string;   // Grouping category (e.g. "indoor", "outdoor")
}
```

---

### 3. `Building` (`src/types/graph.ts`)
Represents a campus building structure containing multiple floor maps.

```typescript
export interface Building {
  id: string;         // Unique building ID (e.g. "main_block")
  name: string;       // Human-readable building name (e.g. "Main Academic Block")
  floors: number;     // Total number of floors
  floorIds: string[]; // List of floor map identifiers in order
}
```

---

### 4. `FloorMap` (`src/types/map.ts`)
Represents a floor plan map configuration.

```typescript
export interface FloorMap {
  map: string;        // Map identifier (e.g. "main_ground_floor")
  building: string;   // Parent building ID
  floor: number;      // Floor index (0 for Ground Floor, 1 for 1st Floor, etc.)
  svgUrl: string;     // URL path to floor SVG vector file
  label: string;      // Display title (e.g. "Ground Floor")
}
```

---

### 5. `Route` & `RouteStep` (`src/types/route.ts`)
Represents calculated navigation routes.

```typescript
export interface RouteStep {
  nodeId: string;
  label: string;
  instruction: string;
  distanceFromPrev: number;
  type: EdgeType;
}

export interface Route {
  from: MapNode;
  to: MapNode;
  steps: RouteStep[];
  totalDistance: number;
  estimatedTime: number; // Estimated walking time in minutes
  nodeIds: string[];     // Sequential list of visited node IDs
}
```

---

## MongoDB Database Collection Schemas

UniMap interacts with a MongoDB database named `UniMap`. Below are the document schemas for each collection:

### `nodes` Collection
```json
{
  "id": "node_main_gate",
  "name": "Main Entrance Gate",
  "type": "entrance",
  "map": "campus_outdoor",
  "x": 120.0,
  "y": 450.0,
  "svgElementId": "path_gate",
  "category": "entry"
}
```

### `edges` Collection
```json
{
  "id": "edge_gate_road1",
  "from_node": "node_main_gate",
  "to_node": "node_main_road_01",
  "distance": 25.5,
  "type": "outdoor",
  "category": "outdoor"
}
```

### `buildings` Collection
```json
{
  "id": "main_block",
  "name": "Main Academic Building",
  "floors": 2,
  "floorIds": ["main_ground", "main_first"]
}
```

### `floors` Collection
```json
{
  "map": "main_ground",
  "building": "main_block",
  "floor": 0,
  "svgUrl": "/maps/main_ground.svg",
  "label": "Ground Floor"
}
```

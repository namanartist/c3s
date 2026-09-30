# UniMap — Map Designer & Visual Architecture Guide

Welcome to the **UniMap Design Guide**. This document is created specifically for **Map Designers, SVG Artists, Campus Cartographers, and UI/UX Designers**. 

It explains how the UniMap navigation system works conceptually, how the maps look visually, the underlying architectural principles, and the guidelines for designing vector floor plans.

---

## 1. What is UniMap? (Concept Overview)

UniMap provides indoor and outdoor campus navigation. University campuses consist of multiple multi-story buildings, interconnecting outdoor paths, staircases, elevators, and corridors.

UniMap translates these physical campus spaces into interactive, multi-floor vector maps. Users can search for any classroom, lab, office, or landmark, and UniMap draws a path guiding them turn-by-turn across floors and buildings.

```text
 Physical Campus               UniMap Visual System
┌──────────────────┐           ┌───────────────────────────────────┐
│ Building A       │           │ Multi-Floor Selector (GF, 1F)     │
│  ├── Floor 1     │  ───────► │ Vector SVG Map Canvas             │
│  └── Floor 2     │           │ Animated Orange Route Overlay     │
│ Building B       │           │ Interactive Room Pins             │
└──────────────────┘           └───────────────────────────────────┘
```

---

## 2. Core Principles of the Map Architecture

UniMap relies on **five fundamental principles** to turn visual artwork into a functional navigation system:

### 1. The Node & Edge Principle (The Navigation Network)
Behind the visual artwork lies a network of points and lines:
- **Nodes (Points)**: Key locations on the map such as room doors, corridor intersections, staircase entries, elevator doors, and outdoor gates.
- **Edges (Pathways)**: Walkable lines connecting two nodes (e.g., walking down a corridor from Room 101 to Room 102).

*Design Requirement*: Every destination on your floor plan needs a corresponding point (node) on the walkable pathway.

---

### 2. The Multi-Floor Stack Principle
Buildings are split into separate, stacked floor plans:
- **Campus View**: Master outdoor map showing building footprints and campus roads.
- **Building Views**: Specific building floor plans (Ground Floor `GF`, First Floor `FF`, Second Floor `SF`).
- **Seamless Floor Transitions**: When a calculated route moves from Floor 1 to Floor 2, the app automatically switches the visible floor plan SVG when the user reaches a staircase or elevator node.

---

### 3. The Vector SVG Principle (Scalable Zoom)
Instead of static raster images (like PNG or JPG), UniMap uses **Scalable Vector Graphics (SVG)**. 
- **Crisp at Any Scale**: Users can zoom in close to see room numbers or zoom out for a full building overview without loss of clarity.
- **Lightweight**: SVG files load quickly on mobile devices over cellular networks.

---

### 4. The Interactive Element Binding (`svgElementId`)
When designing an SVG map in tools like Figma, Illustrator, or Inkscape, you can assign an `id` to room shapes (e.g., `id="room_101"`).
- When a user searches for *"Room 101"*, UniMap highlights that specific room polygon on the SVG canvas.
- When a user selects a room shape on screen, UniMap recognizes which room was selected.

---

### 5. The Layering Principle
Every map screen in UniMap is composed of three distinct visual layers stacked on top of each other:

```text
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Markers & Pins (Start pin, Dest pin, Radar)    │  ◄ TOP
├─────────────────────────────────────────────────────────┤
│ Layer 2: Route Overlay (Animated Coral Polyline)        │  ◄ MIDDLE
├─────────────────────────────────────────────────────────┤
│ Layer 1: Base SVG Floor Plan (Walls, Rooms, Corridors)  │  ◄ BOTTOM
└─────────────────────────────────────────────────────────┘
```

---

## 3. Visual Language & Aesthetics (How the Map Looks)

UniMap features a clean dark-and-cream design language built for visual clarity and accessibility.

### Color Palette

| Element | Color Code | Visual Appearance | Purpose |
|---|---|---|---|
| **Canvas Background** | `#fcfaf6` | Warm Soft Cream | Reduces eye strain and makes room walls stand out clearly |
| **Navigation Route** | `#ff602e` | Electric Coral Orange | High-visibility line highlighting the active path |
| **Destination Pin** | `#ff602e` | Coral Pin with Pulsing Radar Ring | Marks the final target location |
| **Current Location** | `#10b981` | Emerald Green Beacon | Shows where the user currently is |
| **Walking Simulation** | `#3b82f6` | Royal Blue Directional Arrow | Rotating compass arrow during live walking simulation |
| **Active Building Selection**| `orange-50` | Soft Warm Glow | Highlights active building/floor buttons |

---

### Micro-Animations & Dynamic Feedback

1. **Path Drawing Animation**: When a route is calculated, the orange path polyline draws itself smoothly along the floor plan.
2. **Pulsing Radar Rings**: Destination pins emit translucent expanding pulse waves to highlight the target location.
3. **Fluid Spring Pan & Zoom**: Dragging and pinching the map uses spring physics for responsive map interaction.

---

## 4. Map Designer's Guide (Creating SVG Floor Plans)

Follow these standards when creating or editing floor plans for UniMap:

### Recommended Tools
- **Inkscape** (Free, Open-Source)
- **Adobe Illustrator**
- **Figma** (Export as SVG with "Include ID Attribute" enabled)

---

### 1. Canvas Size & ViewBox
Set an explicit `viewBox` attribute on the root `<svg>` tag. For example:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 848 609">
```
- Keep coordinate units numeric (e.g. `848 x 609`).
- Maintain consistent aspect ratios across floors of the same building.

---

### 2. Layer Structure
Group vector elements logically inside your graphic editor:

1. `g_background` — Outer building footprint and background fills.
2. `g_corridors` — Walkable hallways and main paths (use light neutral tones).
3. `g_rooms` — Classrooms, labs, offices (closed shapes with clear fill colors).
4. `g_staircases_elevators` — Vertical transition zones (stair icons, lift boxes).
5. `g_labels` — Text elements (room numbers, building names).

---

### 3. Element ID Naming Conventions
To make SVG shapes interactive, assign clear, lowercase IDs to room polygons:

- **Rooms**: `room_101`, `physics_lab`, `dean_office`
- **Staircases**: `stair_main_gf`, `stair_west_ff`
- **Elevators**: `lift_main_01`
- **Landmarks**: `reception_desk`, `cafeteria_entry`

```xml
<!-- Example Interactive Room Polygon -->
<rect id="room_101" x="120" y="85" width="60" height="40" fill="#e2e8f0" stroke="#94a3b8" />
```

---

### 4. Accessibility & Visual Clarity
- **Contrast**: Ensure room wall outlines (`stroke`) are distinctly visible against the cream background (`#fcfaf6`).
- **Iconography**: Use universally recognizable icons for restrooms, elevators, staircases, and main exits.
- **Text Legibility**: Use clean sans-serif typography (such as Inter, Outfit, or Roboto) for room labels.

---

## 5. Designer Checklist for New Building Maps

When submitting a new SVG map for a campus building, verify:

- [ ] SVG file contains a valid `viewBox="0 0 W H"` attribute.
- [ ] Scale and orientation align with adjacent floor maps.
- [ ] Key rooms and landmarks have unique `id` attributes assigned.
- [ ] Walkable corridors are clear and unobstructed visually.
- [ ] Staircases and elevators are clearly demarcated.
- [ ] File size is optimized (unnecessary editor metadata cleaned up).

---

## Technical Documentation References

For technical details on database node structures and API schemas, check out:
- [docs/mapping.md](mapping.md) — Technical SVG mapping contract.
- [docs/data-structure.md](data-structure.md) — Database schemas for nodes and edges.
- [docs/architecture.md](architecture.md) — High-level code architecture.

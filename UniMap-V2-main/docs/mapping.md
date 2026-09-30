# UniMap Mapping & Vector SVG Documentation

This document explains how vector floor plans, spatial node coordinates, and SVG elements are mapped and visualized within **UniMap**.

For a non-technical visual guide, refer to the [Map Designer & Visual Architecture Guide](map-design-guide.md) for an overview of map themes, SVG layering standards, and visual aesthetics.

---

## Map Visual Rendering Engine

UniMap renders campus floor plans using vector SVG assets rendered inside `MapCanvas.tsx` (`src/components/map/MapCanvas.tsx`).

### SVG Rendering Pipeline

1. **Floor Plan Selection**: `activeFloorMap` in `useMapStore` specifies the active SVG URL (`svgUrl`) and `map` identifier.
2. **SVG Loading & Viewport**: `MapCanvas` embeds the floor SVG dynamically, maintaining zoom level, panning offset, and responsive viewports.
3. **Node Overlay Positioning**: Nodes belonging to the active map are rendered on top of the SVG canvas using normalized coordinate percentages $(x, y)$.
4. **Path Vector Overlay**: Computed route steps for the active floor map are drawn as smooth animated polylines connecting sequential route nodes.

---

## Binding SVG Elements (`svgElementId`)

Nodes in the database can optionally link directly to vector shapes in the floor plan SVG via `svgElementId`:

```json
{
  "id": "room_101",
  "name": "Room 101",
  "type": "room",
  "map": "main_ground_floor",
  "x": 425.5,
  "y": 310.0,
  "svgElementId": "path_room_101",
  "category": "academic"
}
```

### Benefits of `svgElementId`:
- **Interactive Highlighting**: Hovering over or selecting a room in the UI search panel dynamically highlights the corresponding SVG polygon element on the map canvas.
- **Click Selection**: Clicking on a room shape inside the SVG fires node selection events in the Zustand store.

---

## Coordinate Alignment Standard

UniMap uses a normalized $X, Y$ coordinate grid aligned with the viewBox dimensions of the base SVG map file:

- **Origin $(0,0)$**: Upper-left corner of the vector canvas.
- **Max Bounds $(W, H)$**: Width and height defined in the SVG `viewBox="0 0 W H"`.
- **Node Position**: $(x, y)$ values represent exact point centers where path edges connect.

---

## Adding a New Floor Map or Building

To add a new building or floor map to UniMap:

1. **Prepare Vector SVG Asset**:
   - Create or edit the SVG floor plan in Inkscape, Figma, or Illustrator.
   - Assign unique IDs (`id="room_101"`, `id="staircase_01"`) to room polygons or key landmark elements.
   - Place the SVG asset into `public/maps/` or host it via a CDN/Cloudinary.

2. **Add Building Record (`buildings` collection)**:
   ```json
   {
     "id": "eng_block",
     "name": "Engineering Block",
     "floors": 3,
     "floorIds": ["eng_ground", "eng_1st", "eng_2nd"]
   }
   ```

3. **Add Floor Map Record (`floors` collection)**:
   ```json
   {
     "map": "eng_ground",
     "building": "eng_block",
     "floor": 0,
     "svgUrl": "/maps/eng_ground.svg",
     "label": "Ground Floor"
   }
   ```

4. **Add Nodes & Edges**:
   - Add nodes for rooms, corridors, staircases, and entrances in the `nodes` collection.
   - Add connecting walkable edges in the `edges` collection.

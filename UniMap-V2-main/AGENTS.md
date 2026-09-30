# AGENTS.md — Guidelines for AI Coding Agents

This document defines core guidelines, architecture boundaries, and critical rules for AI coding agents (such as Antigravity, GitHub Copilot, Claude, Codex, Cursor, etc.) working on the **UniMap** codebase.

---

## Project Overview & System Boundaries

UniMap is an interactive campus navigation system built with React 19, Vite, TypeScript, Zustand, and MongoDB. It renders vector SVG maps and computes multi-floor routes across campus nodes and edges using a custom non-blocking Dijkstra pathfinding engine.

### Core Tech Stack

- **Frontend**: React 19 (`tsx`), TypeScript 6 (`ts`), Vite 8, Zustand (`src/store/mapStore.ts`), Tailwind CSS, Lucide React, Motion.
- **Backend API**: Vercel Serverless Functions (`api/*.ts`), Node.js dev server (`dev-api-server.js`).
- **Database**: MongoDB (`nodes`, `edges`, `buildings`, `floors` collections).
- **Navigation Engine**: Custom Dijkstra implementation (`src/lib/dijkstra.ts`), global graph builder & multi-map segmenter (`src/lib/multiMapNavigation.ts`).

---

## Critical Rules: Changes AI Agents Must Avoid

1. **Do NOT Modify Core Graph Interfaces Without Updating All References**:
   - `MapNode`, `MapEdge`, `Building`, `FloorMap` in `src/types/graph.ts` and `src/types/map.ts` are shared across the database, serverless APIs, Zustand store, and UI canvas.
   - Any modification to properties (e.g. `from_node`, `to_node`, `map`, `svgElementId`) requires synchronized updates in `api/`, `src/lib/`, `src/store/`, and components.

2. **Do NOT Remove Async Yielding in Dijkstra Pathfinding**:
   - `dijkstraAsync` in `src/lib/dijkstra.ts` uses `yieldToMainThread` (`requestAnimationFrame`/`setTimeout`) to prevent freezing the UI on large graphs.
   - **Never** replace `dijkstraAsync` with a fully synchronous block in UI execution paths.

3. **Do NOT Break Multi-Map Segmentation Logic**:
   - `segmentPathByMap` in `src/lib/multiMapNavigation.ts` relies on node `map` attributes to group raw node sequences into discrete floor steps.
   - Do not alter this logic without ensuring cross-floor transitions work properly.

4. **Do NOT Hardcode API Base URLs**:
   - All API calls must consume `import.meta.env.VITE_API_BASE_URL` via `src/lib/api.ts`.
   - Do not write hardcoded `http://localhost:3000` URLs directly in React components.

5. **Do NOT Restructure Existing Folder Boundaries**:
   - Preserve directory layout (`api/`, `docs/`, `src/components/`, `src/lib/`, `src/store/`, `src/types/`, `src/pages/`).

---

## Coding Rules for AI Agents

- **Strict TypeScript Compliance**: Always generate fully typed code. Avoid using `any` or `@ts-ignore` unless interfacing with an un-typed legacy module.
- **Zustand State Access**: Prefer selecting explicit store slices (e.g., `useMapStore(state => state.selectedFrom)`) over consuming the entire state object to minimize unnecessary re-renders.
- **Bi-directional Edges**: When modifying graph edge generation or database seeds, remember that UniMap edges are bidirectional in `buildGlobalGraph`.
- **Linting & Code Formatting**: Code written by agents should pass `npm run lint` and `npm run build` cleanly.
- **Preserve Comments**: Do not remove existing inline code documentation or docstrings when refactoring adjacent code.

---

## Codebase Quick Reference

| Module | Location | Role |
|---|---|---|
| Types | `src/types/` | Data contracts (`graph.ts`, `route.ts`, `map.ts`) |
| Pathfinding | `src/lib/dijkstra.ts` | MinHeap & async Dijkstra pathfinding |
| Multi-Map Navigation | `src/lib/multiMapNavigation.ts` | Global graph assembly & path segmentation |
| Instructions Engine | `src/lib/navigation_instructions.ts` | Text instruction generation |
| API Helpers | `src/lib/api.ts` | Frontend API client |
| State Store | `src/store/mapStore.ts` | Global Zustand state for selected nodes, active maps & routes |
| API Backend | `api/` & `dev-api-server.js` | Serverless endpoints & local MongoDB dev server |

# SKILLS.md — Contributor Skill Catalog

This document outlines the core technical domains, skills, and areas of expertise relevant to contributing to the **UniMap** project. Whether you are a frontend developer, spatial graph engineer, cartographer, UI designer, or technical writer, there is a place for your contributions.

---

## 1. Frontend Web Development

- **Technologies**: React 19, TypeScript 6, Vite 8, React Router v7, Zustand, Tailwind CSS.
- **Key Tasks**:
  - Building responsive, accessible navigation controls and modals.
  - Optimizing component re-renders using Zustand store selectors.
  - Implementing interactive UI elements with Motion / Framer Motion micro-animations.
  - Adding page routes, loading skeletons, and fallback states.

---

## 2. Graph & Navigation Engineering

- **Technologies**: Spatial Graph Theory, Dijkstra Pathfinding, Priority Queue Data Structures (MinHeap), Async JavaScript.
- **Key Tasks**:
  - Optimizing `dijkstraAsync` graph traversal for large-scale campus networks.
  - Refining multi-floor transition logic and step segmentation (`segmentPathByMap`).
  - Expanding step-free accessible navigation filters (`accessibleOnly`).
  - Enhancing natural-language direction generators (`navigation_instructions.ts`).

---

## 3. Cartography & SVG Map Authoring

- **Technologies**: Vector Graphics (SVG), Inkscape / Figma / Illustrator, GIS coordinate systems.
- **Key Tasks**:
  - Designing clean vector SVG floor plans with standardized layer structures.
  - Mapping SVG node IDs (`svgElementId`) to database node records (`MapNode`).
  - Aligning node spatial coordinates $(x, y)$ with visual SVG background layouts.
  - Optimizing SVG assets for fast web delivery and responsive scaling.

---

## 4. UI / UX & Accessibility Design

- **Technologies**: Modern UI Design Systems, Dark Mode aesthetics, Glassmorphism, Web Content Accessibility Guidelines (WCAG).
- **Key Tasks**:
  - Designing intuitive floor-switcher interfaces and route overview panels.
  - Ensuring high contrast, clear typography, and touch-friendly interaction targets.
  - Improving screen-reader accessibility and keyboard navigation across map controls.

---

## 5. Backend & Database Systems

- **Technologies**: Node.js, MongoDB, Vercel Serverless API Functions.
- **Key Tasks**:
  - Maintaining MongoDB collections for `nodes`, `edges`, `buildings`, and `floors`.
  - Writing efficient database queries and index strategies.
  - Enhancing the local development API server (`dev-api-server.js`).
  - Ensuring proper CORS headers and error handling in serverless handlers (`api/`).

---

## 6. Testing & Quality Assurance

- **Technologies**: Node graph validation scripts, ESLint, manual path verification.
- **Key Tasks**:
  - Writing graph integrity validators (e.g. detecting disconnected nodes or missing transition edges).
  - Simulating complex multi-building routes to verify turn-by-turn instruction accuracy.
  - Cross-browser and mobile device testing across iOS Safari and Android Chrome.

---

## 7. Technical Documentation

- **Technologies**: Markdown, Mermaid Diagrams, Technical Writing.
- **Key Tasks**:
  - Updating architectural blueprints (`docs/architecture.md`).
  - Documenting data schemas and API contracts (`docs/data-structure.md`).
  - Writing step-by-step guides for campus mappers (`docs/mapping.md`).

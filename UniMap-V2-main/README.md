# UniMap — Smart Campus Mapping & Navigation

UniMap is a high-performance, interactive multi-floor campus navigation and spatial pathfinding web application. Designed for complex multi-building environments, UniMap features non-blocking graph pathfinding, interactive SVG floor maps, turn-by-turn navigation instructions, and accessible (step-free) routing options.

---

## Features

- **Interactive Vector Maps**: Render detailed SVG floor plans with dynamic node markers and route overlays.
- **Non-Blocking Pathfinding**: Async Dijkstra algorithm powered by a MinHeap priority queue and main thread yielding to preserve UI responsiveness.
- **Multi-Building & Multi-Floor Navigation**: Seamless route calculation across floor boundaries and outdoor campus paths.
- **Accessible Routing**: Optional step-free navigation mode filtering out staircases in favor of elevators and ramps.
- **Responsive Modern UI**: Built with React 19, Tailwind CSS, Zustand, and smooth micro-animations.
- **Serverless Backend & MongoDB**: Quick data access via MongoDB collections (`nodes`, `edges`, `buildings`, `floors`) hosted on Vercel Serverless endpoints and a lightweight local dev server.

---

## Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript 6](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/), [React Router v7](https://reactrouter.com/), [Zustand](https://zustand-demo.pmnd.rs/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend / API**: Node.js HTTP dev server (`dev-api-server.js`), Vercel Serverless Functions (`api/`), MongoDB Driver
- **Database**: MongoDB (`nodes`, `edges`, `buildings`, `floors` collections)

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: A running MongoDB instance or MongoDB Atlas cluster connection string

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dotrwt/UniMap-V2.git
   cd UniMap-V2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and set your local MongoDB connection string:
   ```bash
   cp .env.example .env
   ```
   ```env
   MONGO_URL=mongodb://localhost:27017/UniMap
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. **Initialize Database Seed Data**:
   Contributors can populate their local MongoDB instance using the JSON datasets provided in `init-data/`:
   ```bash
   mongoimport --uri="mongodb://localhost:27017/UniMap" --collection=buildings --file=init-data/buildings.json --jsonArray
   mongoimport --uri="mongodb://localhost:27017/UniMap" --collection=floors --file=init-data/floors.json --jsonArray
   mongoimport --uri="mongodb://localhost:27017/UniMap" --collection=nodes --file=init-data/nodes.json --jsonArray
   mongoimport --uri="mongodb://localhost:27017/UniMap" --collection=edges --file=init-data/edges.json --jsonArray
   ```
   *For detailed instructions, see [init-data/README.md](init-data/README.md).*

### Running Locally

1. **Start the Development API Server** (connects to your local MongoDB):
   ```bash
   node dev-api-server.js
   ```
   *The dev server will start on `http://localhost:3000`.*

2. **Start the Vite Frontend**:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite development server with Hot Module Replacement (HMR). |
| `node dev-api-server.js` | Runs local Node.js API server for MongoDB queries. |
| `npm run build` | Runs TypeScript compilation check and builds production bundle. |
| `npm run lint` | Runs ESLint analysis across TypeScript & React files. |
| `npm run preview` | Previews the production build locally. |

---

## Project Structure

```text
UniMap-V2/
├── api/                   # Vercel Serverless API functions (nodes, edges, buildings, floors)
├── dev-api-server.js      # Local Express/HTTP API server for development
├── docs/                  # Architecture, Navigation, Mapping & Data Structure docs
├── init-data/             # MongoDB seed data JSON files and import instructions
├── public/                # Static assets, icons, and SVG floor plans
├── src/
│   ├── components/        # UI & Map components (MapCanvas, FloorSwitcher, RouteOverlay)
│   ├── hooks/             # Custom React hooks (smooth scroll, etc.)
│   ├── lib/               # Core navigation engine (dijkstra, multiMapNavigation, graphUtils)
│   ├── pages/             # Application pages (Landing, Map, Support, 404)
│   ├── store/             # Zustand state management (mapStore)
│   ├── styles/            # Global CSS styles and Tailwind configurations
│   ├── types/             # TypeScript type definitions (graph, route, map)
│   ├── App.tsx            # Main application router
│   └── main.tsx           # Application entry point
├── README.md
├── CONTRIBUTING.md
├── AGENTS.md
└── SKILLS.md
```

---

## Contributing

Contributions from developers, designers, and campus mappers are welcome. Please review:
- [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, branching rules, and PR workflows.
- [Map Designer Guide](docs/map-design-guide.md) for visual architecture, SVG floor plan guidelines, and map aesthetic standards.
- [AGENTS.md](AGENTS.md) for guidelines aimed at AI coding agents working on the codebase.
- [SKILLS.md](SKILLS.md) to explore the technical domain skills required across UniMap modules.
- [Documentation](docs/architecture.md) for deep dives into navigation algorithms and data schemas.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

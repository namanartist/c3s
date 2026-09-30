# UniMap MongoDB Seed Data (`init-data/`)

This directory contains static seed data for initializing a local or private **UniMap** database in MongoDB. Contributors can import these JSON datasets into their own database without requiring access to production credentials.

---

## Included Datasets

| File | MongoDB Collection | Description | Record Count |
|---|---|---|---|
| `buildings.json` | `buildings` | Building metadata and floor hierarchy | 2 buildings |
| `floors.json` | `floors` | Floor map metadata, SVG URL bindings, floor levels | 7 floor maps |
| `nodes.json` | `nodes` | Spatial map nodes (rooms, corridors, stairs, lifts, landmarks) | 624 nodes |
| `edges.json` | `edges` | Walkable connections and edge distances between nodes | 689 edges |

---

## How to Import Data into MongoDB

### Option 1: Using `mongoimport` (CLI)

If you have [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) installed, navigate to the `init-data/` folder in your terminal and run:

#### Local MongoDB Database (`mongodb://localhost:27017/UniMap`):

```bash
mongoimport --uri="mongodb://localhost:27017/UniMap" --collection=buildings --file=buildings.json --jsonArray
mongoimport --uri="mongodb://localhost:27017/UniMap" --collection=floors --file=floors.json --jsonArray
mongoimport --uri="mongodb://localhost:27017/UniMap" --collection=nodes --file=nodes.json --jsonArray
mongoimport --uri="mongodb://localhost:27017/UniMap" --collection=edges --file=edges.json --jsonArray
```

#### Remote MongoDB Atlas Database:

```bash
mongoimport --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/UniMap" --collection=buildings --file=buildings.json --jsonArray
mongoimport --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/UniMap" --collection=floors --file=floors.json --jsonArray
mongoimport --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/UniMap" --collection=nodes --file=nodes.json --jsonArray
mongoimport --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/UniMap" --collection=edges --file=edges.json --jsonArray
```

---

## Option 2: Using MongoDB Compass (GUI)

1. Open **MongoDB Compass** and connect to your database instance.
2. Create or select a database named `UniMap`.
3. Create four collections: `buildings`, `floors`, `nodes`, and `edges`.
4. For each collection:
   - Select the collection.
   - Click **Add Data** > **Import JSON or CSV file**.
   - Select the corresponding `.json` file from `init-data/`.
   - Choose **JSON** format and click **Import**.

---

## Connecting UniMap to Your Database

After importing the seed data:

1. Update your local `.env` file in the project root:
   ```env
   MONGO_URL=mongodb://localhost:27017/UniMap
   VITE_API_BASE_URL=http://localhost:3000
   ```
2. Start the local API server:
   ```bash
   node dev-api-server.js
   ```
3. Start the Vite development frontend:
   ```bash
   npm run dev
   ```

// dev-api-server.js
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse local .env file
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value.trim();
        }
      });
    }
  } catch (err) {
    console.error('Failed to load .env file:', err);
  }
}

loadEnv();

const mongoUrl = process.env.MONGO_URL;
if (!mongoUrl) {
  console.error('Error: MONGO_URL not found in environment or .env');
  process.exit(1);
}

const client = new MongoClient(mongoUrl);
let db = null;

async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db('UniMap');
    console.log('Connected to MongoDB UniMap database');
  }
  return db;
}

const server = http.createServer(async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const activeDb = await getDb();

    if (pathname === '/api/nodes') {
      const nodes = await activeDb.collection('nodes').find({}, { projection: { _id: 0 } }).toArray();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: nodes }));
    } else if (pathname === '/api/edges') {
      const edges = await activeDb.collection('edges').find({}, { projection: { _id: 0 } }).toArray();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: edges }));
    } else if (pathname === '/api/buildings') {
      const buildings = await activeDb.collection('buildings').find({}, { projection: { _id: 0 } }).toArray();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: buildings }));
    } else if (pathname === '/api/floors') {
      const floors = await activeDb.collection('floors').find({}, { projection: { _id: 0 } }).toArray();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: floors }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  } catch (err) {
    console.error('Request handler error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Development API server running at http://localhost:${PORT}`);
});

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
let client = null;
let db = null;

if (mongoUrl) {
  try {
    client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 2000 });
  } catch (e) {
    console.warn('Could not initialize Mongo client:', e.message);
  }
}

async function getDb() {
  if (!client) return null;
  if (!db) {
    try {
      await client.connect();
      db = client.db('UniMap');
      console.log('Connected to MongoDB UniMap database');
    } catch (e) {
      console.warn('MongoDB connection failed, running in memory-resilient mode:', e.message);
      return null;
    }
  }
  return db;
}

// In-memory fallbacks for resilient development
const inMemoryGateLogs = [];
const inMemoryAuditLogs = [];
const inMemoryPasses = [];

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const CAMPUS_QR_SECRET = 'C3S-MITS-GWL-2026-SECURE-KEY-8F39D';
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

const server = http.createServer(async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    const activeDb = await getDb();

    // ----------------------------------------------------
    // GET /api/nodes
    // ----------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/nodes') {
      if (activeDb) {
        const nodes = await activeDb.collection('nodes').find({}, { projection: { _id: 0 } }).toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: nodes }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: [] }));
      }
    }
    // ----------------------------------------------------
    // GET /api/edges
    // ----------------------------------------------------
    else if (req.method === 'GET' && pathname === '/api/edges') {
      if (activeDb) {
        const edges = await activeDb.collection('edges').find({}, { projection: { _id: 0 } }).toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: edges }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: [] }));
      }
    }
    // ----------------------------------------------------
    // GET /api/buildings
    // ----------------------------------------------------
    else if (req.method === 'GET' && pathname === '/api/buildings') {
      if (activeDb) {
        const buildings = await activeDb.collection('buildings').find({}, { projection: { _id: 0 } }).toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: buildings }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: [] }));
      }
    }
    // ----------------------------------------------------
    // GET /api/floors
    // ----------------------------------------------------
    else if (req.method === 'GET' && pathname === '/api/floors') {
      if (activeDb) {
        const floors = await activeDb.collection('floors').find({}, { projection: { _id: 0 } }).toArray();
        const normalizedFloors = floors.map((f) => ({
          ...f,
          svgUrl: `/maps/${f.map}.svg`,
          cloudUrl: f.svgUrl,
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: normalizedFloors }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: [] }));
      }
    }
    // ----------------------------------------------------
    // GET /api/crowd
    // ----------------------------------------------------
    else if (req.method === 'GET' && pathname === '/api/crowd') {
      try {
        if (client) {
          const homeDb = client.db('home');
          const crowdLogs = await homeDb
            .collection('blogs')
            .find({})
            .sort({ _id: -1 })
            .limit(50)
            .toArray();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: crowdLogs, count: crowdLogs.length }));
          return;
        }
      } catch (crowdErr) {
        console.warn('Failed to fetch home.blogs:', crowdErr.message);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: [] }));
    }
    // ----------------------------------------------------
    // GET /api/gate/qr
    // ----------------------------------------------------
    else if (req.method === 'GET' && pathname === '/api/gate/qr') {
      const gateId = url.searchParams.get('gateId') || 'GATE-MAIN';
      const version = parseInt(url.searchParams.get('version') || '1', 10);
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const expiresAt = new Date(now).setHours(23, 59, 59, 999);
      const signature = simpleHash(`${gateId}:${dateStr}:v${version}:${CAMPUS_QR_SECRET}:${expiresAt}`);
      const token = `C3S-QR-${gateId}-${dateStr}-V${version}-${signature}`;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: { gateId, dateStr, version, token, issuedAt: Date.now(), expiresAt, signature }
      }));
    }
    // ----------------------------------------------------
    // POST /api/gate/check-in
    // ----------------------------------------------------
    else if (req.method === 'POST' && pathname === '/api/gate/check-in') {
      const body = await readBody(req);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      const event = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        personName: body.userName || 'Naman Lakhotia',
        universityId: body.userId || 'BTCS2026-0842',
        role: body.userRole || 'STUDENT',
        department: body.department || 'Computer Science & Engineering',
        movement: 'CHECK-IN',
        time: timeStr,
        date: dateStr,
        gate: body.gateName || 'Main Gate',
        gateId: body.gateId || 'GATE-MAIN',
        verificationMethod: body.method || 'QR_SCAN',
        status: 'VERIFIED',
        timestamp: Date.now(),
        qrToken: body.qrToken || null,
        lat: body.lat || 26.232611,
        lng: body.lng || 78.205222
      };

      const audit = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        actor: event.personName,
        role: event.role,
        action: 'CHECK_IN',
        resource: event.gateId,
        result: 'SUCCESS',
        details: `Check-in recorded at ${event.gate} via ${event.verificationMethod}.`
      };

      inMemoryGateLogs.unshift(event);
      inMemoryAuditLogs.unshift(audit);

      if (activeDb) {
        try {
          await activeDb.collection('gate_logs').insertOne({ ...event });
          await activeDb.collection('audit_logs').insertOne({ ...audit });
          await activeDb.collection('users').updateOne(
            { universityId: event.universityId },
            { $set: { status: 'INSIDE', lastActivity: `Checked in at ${event.gate} (${timeStr})`, currentGate: event.gate } },
            { upsert: true }
          );
        } catch (dbErr) {
          console.warn('[dev-api] Mongo insert failed, kept in-memory:', dbErr.message);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `Check-in confirmed at ${event.gate}`, event, audit }));
    }
    // ----------------------------------------------------
    // POST /api/gate/check-out
    // ----------------------------------------------------
    else if (req.method === 'POST' && pathname === '/api/gate/check-out') {
      const body = await readBody(req);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      const event = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        personName: body.userName || 'Naman Lakhotia',
        universityId: body.userId || 'BTCS2026-0842',
        role: body.userRole || 'STUDENT',
        department: body.department || 'Computer Science & Engineering',
        movement: 'CHECK-OUT',
        time: timeStr,
        date: dateStr,
        gate: body.gateName || 'Jubilee Gate',
        gateId: body.gateId || 'GATE-JUBILEE',
        verificationMethod: body.method || 'QR_SCAN',
        status: 'VERIFIED',
        timestamp: Date.now(),
        qrToken: body.qrToken || null,
        lat: body.lat || 26.229639,
        lng: body.lng || 78.205639
      };

      const audit = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        actor: event.personName,
        role: event.role,
        action: 'CHECK_OUT',
        resource: event.gateId,
        result: 'SUCCESS',
        details: `Check-out recorded at ${event.gate} via ${event.verificationMethod}.`
      };

      inMemoryGateLogs.unshift(event);
      inMemoryAuditLogs.unshift(audit);

      if (activeDb) {
        try {
          await activeDb.collection('gate_logs').insertOne({ ...event });
          await activeDb.collection('audit_logs').insertOne({ ...audit });
          await activeDb.collection('users').updateOne(
            { universityId: event.universityId },
            { $set: { status: 'OUTSIDE', lastActivity: `Checked out at ${event.gate} (${timeStr})`, currentGate: event.gate } },
            { upsert: true }
          );
        } catch (dbErr) {
          console.warn('[dev-api] Mongo insert failed, kept in-memory:', dbErr.message);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `Check-out confirmed at ${event.gate}`, event, audit }));
    }
    // ----------------------------------------------------
    // GET /api/gate/history
    // ----------------------------------------------------
    else if (req.method === 'GET' && pathname === '/api/gate/history') {
      const userId = url.searchParams.get('userId');
      let logs = [];

      if (activeDb) {
        try {
          const query = userId ? { universityId: userId } : {};
          logs = await activeDb.collection('gate_logs').find(query, { projection: { _id: 0 } }).sort({ timestamp: -1 }).limit(50).toArray();
        } catch {
          logs = [];
        }
      }

      if (logs.length === 0) {
        logs = userId ? inMemoryGateLogs.filter(l => l.universityId === userId) : inMemoryGateLogs;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: logs, count: logs.length }));
    }
    // ----------------------------------------------------
    // GET & POST /api/gate/passes
    // ----------------------------------------------------
    else if (pathname === '/api/gate/passes') {
      if (req.method === 'GET') {
        let passes = [];
        if (activeDb) {
          try {
            passes = await activeDb.collection('gate_passes').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(50).toArray();
          } catch {}
        }
        if (passes.length === 0) passes = inMemoryPasses;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: passes }));
      } else if (req.method === 'POST') {
        const body = await readBody(req);
        const pass = {
          id: `pass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: body.userId || 'BTCS2026-0842',
          userName: body.userName || 'Naman Lakhotia',
          userRole: body.userRole || 'STUDENT',
          hostel: body.hostel || 'Hostel 3 (Aryabhatta)',
          purpose: body.purpose || 'Official Research Field Trip',
          destination: body.destination || 'City Centre Hub',
          validFrom: body.validFrom || Date.now(),
          validTo: body.validTo || Date.now() + 1000 * 60 * 60 * 8,
          status: 'APPROVED',
          approvedBy: 'Chief Proctor Prof. S. K. Jain',
          qrToken: `C3S-PASS-${Date.now()}`,
          createdAt: Date.now()
        };
        inMemoryPasses.unshift(pass);
        if (activeDb) {
          try {
            await activeDb.collection('gate_passes').insertOne({ ...pass });
          } catch {}
        }
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: pass }));
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      }
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

const PORT = process.env.API_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Development API server running at http://localhost:${PORT}`);
});

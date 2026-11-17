const DEFAULT_CROWD_LOGS = [
  { id: 'log-main-gate', label: 'Main Gate', count: 4, coordinates: { latitude: 26.2178, longitude: 78.1832 }, timestamp: new Date().toISOString() },
  { id: 'log-gate-2', label: 'Gate 2 Annex', count: 6, coordinates: { latitude: 26.2185, longitude: 78.1830 }, timestamp: new Date().toISOString() },
  { id: 'log-ai-ff', label: 'AI & CSE FF Corridor', count: 8, coordinates: { latitude: 26.2181, longitude: 78.1825 }, timestamp: new Date().toISOString() },
  { id: 'log-sh4', label: 'SH-4 Seminar Hall', count: 3, coordinates: { latitude: 26.2184, longitude: 78.1829 }, timestamp: new Date().toISOString() },
  { id: 'log-jubilee', label: 'Jubilee Gate', count: 2, coordinates: { latitude: 26.2195, longitude: 78.1810 }, timestamp: new Date().toISOString() },
  { id: 'log-library', label: 'Central Library Plaza', count: 5, coordinates: { latitude: 26.2172, longitude: 78.1820 }, timestamp: new Date().toISOString() }
];

// Fallback default settings (mirrors src/types/settings.ts DEFAULT_SETTINGS).
const DEFAULT_SETTINGS = {
  theme: 'dark', accentColor: 'blue', reducedMotion: false, soundEffects: true,
  biometricPass: true, nfcSimulation: true, autoLockMinutes: 15,
  highPrecisionGps: true, stealthEmergencyMode: false,
  pushNotifications: true, smsEmergencyBroadcast: true, emailCriticalAlerts: true,
  zoneIntrusionAlerts: true, audioAlarmVolume: 80,
  accessibleRouting: false, autoFloorSwitch: true, distanceUnit: 'meters',
  bloodGroup: 'O+', emergencyContactName: 'Rajesh Lakhotia',
  emergencyContactPhone: '+91 94251 12345', emergencyContactRelation: 'Parent / Guardian',
  dormitoryAddress: 'Hostel Block-B, Room 312'
};

// In-memory fallback store for resilient development when MongoDB is unavailable.
const memoryStore = new Map();

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

function resolveDbName(urlStr, fallback = 'UniMap') {
  try {
    const parsed = new URL(urlStr.replace(/^mongodb\+srv:\/\//, 'http://').replace(/^mongodb:\/\//, 'http://'));
    const pathName = parsed.pathname.replace(/^\//, '').split('?')[0];
    if (pathName) return pathName;
  } catch {}
  return fallback;
}
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
      const targetDb = resolveDbName(mongoUrl, 'UniMap');
      db = client.db(targetDb);
      console.log(`Connected to MongoDB [${db.databaseName}] database`);
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
const inMemorySos = [];
const inMemoryVisitorRegistrations = [];

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
          if (crowdLogs && crowdLogs.length > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: crowdLogs, count: crowdLogs.length }));
            return;
          }
        }
      } catch (crowdErr) {
        console.warn('Failed to fetch home.blogs:', crowdErr.message);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: DEFAULT_CROWD_LOGS, count: DEFAULT_CROWD_LOGS.length }));
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
    }
    // ----------------------------------------------------
    // GET /api/db-status
    // ----------------------------------------------------
    else if (pathname === '/api/db-status') {
      if (activeDb) {
        try {
          const cols = (await activeDb.listCollections().toArray()).map(c => c.name);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, connected: true, database: activeDb.databaseName, collections: cols }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, connected: false, error: e.message }));
        }
      } else {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, connected: false, message: 'MongoDB not connected. Running in memory fallback mode.' }));
      }
    }
    // ----------------------------------------------------
    // GET & POST /api/sos & /api/incidents (MongoDB Primary Storage)
    // ----------------------------------------------------
    else if (pathname === '/api/sos' || pathname === '/api/incidents') {
      if (req.method === 'GET') {
        let items = [];
        if (activeDb) {
          try {
            items = await activeDb.collection('sos_incidents').find({}, { projection: { _id: 0 } }).sort({ timestamp: -1 }).limit(50).toArray();
            if (items.length === 0) {
              items = await activeDb.collection('incidents').find({}, { projection: { _id: 0 } }).sort({ timestamp: -1 }).limit(50).toArray();
            }
          } catch {}
        }
        if (items.length === 0) items = inMemorySos;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: items }));
      } else if (req.method === 'POST') {
        const body = await readBody(req);
        const incident = {
          id: body.id || `sos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          category: body.category || 'security',
          severity: body.severity || 'critical',
          title: body.title || '🚨 Campus SOS Incident',
          description: body.description || 'Emergency SOS trigger received.',
          map: body.map || 'Campus_Map',
          floor: body.floor || 0,
          x: body.x || 500,
          y: body.y || 350,
          lat: body.lat || 26.230752,
          lng: body.lng || 78.205341,
          nodeId: body.nodeId || null,
          photoUrl: body.photoUrl || (body.evidence && body.evidence.photoUrl) || null,
          videoUrl: body.videoUrl || (body.evidence && body.evidence.videoUrl) || null,
          evidence: body.evidence || null,
          timestamp: body.timestamp || Date.now(),
          status: body.status || 'active',
          reportedBy: body.reportedBy || 'Student Distress Signal',
          assignedResponder: body.assignedResponder || body.responderAssigned || null,
          notifiedResponders: body.notifiedResponders || null
        };
        const existingIdx = inMemorySos.findIndex((i) => i.id === incident.id);
        if (existingIdx >= 0) {
          inMemorySos[existingIdx] = { ...inMemorySos[existingIdx], ...incident };
        } else {
          inMemorySos.unshift(incident);
        }
        if (activeDb) {
          try {
            await activeDb.collection('sos_incidents').updateOne(
              { id: incident.id },
              { $set: incident },
              { upsert: true }
            );
            await activeDb.collection('incidents').updateOne(
              { id: incident.id },
              { $set: incident },
              { upsert: true }
            );
          } catch (dbErr) {
            console.warn('[MongoDB] Failed writing incident:', dbErr.message);
          }
        }
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, incident }));
      }
    }
    else if ((pathname.startsWith('/api/sos/') || pathname.startsWith('/api/incidents/')) && req.method === 'POST') {
      const parts = pathname.split('/').filter(Boolean);
      const id = parts[2];
      const action = parts[3];
      const body = await readBody(req);
      const newStatus = action === 'resolve' ? 'resolved' : action === 'responding' || action === 'accept' ? 'responding' : 'active';
      const existing = inMemorySos.find((i) => i.id === id);
      if (existing) {
        existing.status = newStatus;
        if (body.responder) existing.assignedResponder = body.responder;
      }
      if (activeDb) {
        try {
          const updatePayload = { status: newStatus, ...(body.responder ? { assignedResponder: body.responder } : {}) };
          await activeDb.collection('sos_incidents').updateOne({ id }, { $set: updatePayload });
          await activeDb.collection('incidents').updateOne({ id }, { $set: updatePayload });
        } catch {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, id, status: newStatus }));
    }
    // ----------------------------------------------------
    // GET /api/users (MongoDB Primary)
    // ----------------------------------------------------
    else if (req.method === 'GET' && pathname === '/api/users') {
      let users = [];
      if (activeDb) {
        try {
          users = await activeDb.collection('users').find({}, { projection: { _id: 0 } }).toArray();
        } catch {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: users }));
    }
    // ----------------------------------------------------
    // GET /api/gates (MongoDB Primary)
    // ----------------------------------------------------
    else if (req.method === 'GET' && pathname === '/api/gates') {
      let gates = [];
      if (activeDb) {
        try {
          gates = await activeDb.collection('gates').find({}, { projection: { _id: 0 } }).toArray();
        } catch {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: gates }));
    }
    // ----------------------------------------------------
    // GET /api/cameras (MongoDB Primary)
    // ----------------------------------------------------
    else if (req.method === 'GET' && pathname === '/api/cameras') {
      let cameras = [];
      if (activeDb) {
        try {
          cameras = await activeDb.collection('cctv_cameras').find({}, { projection: { _id: 0 } }).toArray();
        } catch {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: cameras }));
    }
    // ----------------------------------------------------
    // GET & PUT /api/settings — real MongoDB-backed preferences.
    // ----------------------------------------------------
    else if (pathname === '/api/settings') {
      // Read the body once so we don't consume the stream twice.
      const incoming = req.method === 'PUT' ? await readBody(req) : null;
      const userKey =
        url.searchParams.get('userId') ||
        url.searchParams.get('key') ||
        req.headers['x-user-id'] ||
        (incoming && typeof incoming === 'object' ? incoming.userId : null) ||
        'global';

      if (req.method === 'GET') {
        let doc = null;
        if (activeDb) {
          try {
            doc = await activeDb.collection('user_settings').findOne(
              { userId: userKey },
              { projection: { _id: 0 } }
            );
          } catch {}
        }
        if (!doc) {
          doc = memoryStore.get(`settings:${userKey}`) ?? null;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          source: doc && activeDb ? 'mongodb' : doc ? 'memory' : 'default',
          userId: userKey,
          data: doc ? { ...DEFAULT_SETTINGS, ...doc } : DEFAULT_SETTINGS,
          ...(doc && doc.updatedAt ? { updatedAt: doc.updatedAt } : {}),
        }));
      } else if (req.method === 'PUT') {
        const sanitised = {};
        for (const key of Object.keys(DEFAULT_SETTINGS)) {
          if (incoming && incoming[key] !== undefined) {
            sanitised[key] = incoming[key];
          }
        }
        const merged = { ...DEFAULT_SETTINGS, ...sanitised };
        const nowIso = new Date().toISOString();
        if (activeDb) {
          try {
            await activeDb.collection('user_settings').updateOne(
              { userId: userKey },
              { $set: { ...merged, updatedAt: nowIso }, $setOnInsert: { createdAt: nowIso, userId: userKey } },
              { upsert: true }
            );
          } catch (dbErr) {
            console.warn('[dev-api] user_settings upsert failed:', dbErr.message);
          }
        } else {
          memoryStore.set(`settings:${userKey}`, { ...merged, updatedAt: nowIso });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, userId: userKey, data: merged, updatedAt: nowIso }));
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      }
    }
    // ----------------------------------------------------
    // GET & POST /api/visitor — public visitor self-registration (gate QR deep-link)
    // ----------------------------------------------------
    else if (pathname === '/api/visitor') {
      if (req.method === 'GET') {
        // Sanitized view for the gate desk — no Aadhaar hashes or face snapshots.
        let registrations = [];
        if (activeDb) {
          try {
            registrations = await activeDb.collection('visitor_registrations')
              .find({}, { projection: { _id: 0, faceSnapshot: 0, aadhaarHash: 0 } })
              .sort({ timestamp: -1 })
              .limit(50)
              .toArray();
          } catch {}
        }
        if (!registrations.length && inMemoryVisitorRegistrations.length) {
          registrations = inMemoryVisitorRegistrations.slice(-50).reverse()
            .map(({ faceSnapshot, aadhaarHash, ...safe }) => safe);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: registrations.length, data: registrations }));
      } else if (req.method === 'POST') {
        const body = await readBody(req);
        const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
        const VALID_ROLES = ['VISITOR', 'VENDOR', 'DELIVERY', 'MAINTENANCE', 'VIP', 'OTHER'];
        const roleRaw = str(body.visitorRole, 20).toUpperCase();
        const sanitized = {
          name: str(body.name, 120),
          phone: str(body.phone, 20),
          aadhaarHash: str(body.aadhaarHash, 128),
          aadhaarLast4: str(body.aadhaarLast4, 4),
          visitorRole: VALID_ROLES.includes(roleRaw) ? roleRaw : 'VISITOR',
          company: str(body.company, 120),
          purpose: str(body.purpose, 500),
          vehicleNumber: str(body.vehicleNumber, 20).toUpperCase(),
          hostName: str(body.hostName, 120) || undefined,
          hostDepartment: str(body.hostDepartment, 120) || undefined,
          workOrderNumber: str(body.workOrderNumber, 40).toUpperCase() || undefined,
          gate: str(body.gate, 40) || 'GATE-MAIN',
          qrToken: str(body.qrToken, 128),
          faceSnapshot: typeof body.faceSnapshot === 'string' && body.faceSnapshot.length <= 900 * 1024
            ? body.faceSnapshot : undefined,
          latitude: typeof body.latitude === 'number' ? body.latitude : undefined,
          longitude: typeof body.longitude === 'number' ? body.longitude : undefined,
        };

        if (sanitized.name.length < 2) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Visitor name is required.' }));
          return;
        }
        if (!/^[0-9+\-\s]{10,16}$/.test(sanitized.phone)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'A valid phone number is required.' }));
          return;
        }
        if (!/^[a-f0-9]{16,64}$/i.test(sanitized.aadhaarHash)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Aadhaar verification failed. Please re-enter the Aadhaar number.' }));
          return;
        }
        if (['VIP', 'OTHER'].includes(sanitized.visitorRole) && sanitized.purpose.length < 3) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Purpose of visit is required.' }));
          return;
        }
        if (sanitized.visitorRole === 'VISITOR' && (!sanitized.hostName || !sanitized.hostDepartment)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Host name and department are required for visitors.' }));
          return;
        }
        if (['VENDOR', 'MAINTENANCE'].includes(sanitized.visitorRole) && (!sanitized.company || !sanitized.workOrderNumber)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Company and work order number are required for vendor/maintenance visits.' }));
          return;
        }
        if (sanitized.visitorRole === 'DELIVERY' && (!sanitized.company || !sanitized.vehicleNumber)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Courier company and vehicle number are required for deliveries.' }));
          return;
        }

        const now = new Date();
        const registrationId = `VIS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const registration = {
          id: registrationId,
          ...sanitized,
          status: 'REGISTERED',
          timestamp: Date.now(),
          createdAt: now.toISOString(),
        };
        const gateLog = {
          id: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          personName: sanitized.name,
          universityId: registrationId,
          role: 'VISITOR',
          visitorRole: sanitized.visitorRole,
          department: sanitized.hostDepartment || sanitized.company || 'Visitor',
          movement: 'CHECK-IN',
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          gate: sanitized.gate,
          gateId: sanitized.gate,
          verificationMethod: 'VISITOR_SELF_SERVICE',
          status: 'VERIFIED',
          purpose: sanitized.purpose || `${sanitized.visitorRole} visit${sanitized.hostName ? ` — host: ${sanitized.hostName}` : ''}`,
          vehicleNumber: sanitized.vehicleNumber || null,
          hostName: sanitized.hostName ?? null,
          hostDepartment: sanitized.hostDepartment ?? null,
          workOrderNumber: sanitized.workOrderNumber ?? null,
          timestamp: Date.now(),
          qrToken: sanitized.qrToken || null,
          lat: sanitized.latitude ?? null,
          lng: sanitized.longitude ?? null,
          hasFaceSnapshot: Boolean(sanitized.faceSnapshot),
        };
        const auditEntry = {
          id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          actor: sanitized.name,
          role: 'VISITOR',
          action: 'VISITOR_SELF_CHECK_IN',
          resource: sanitized.gate,
          result: 'SUCCESS',
          details: `${sanitized.name} self-registered at ${sanitized.gate} as ${sanitized.visitorRole} (Aadhaar ···${sanitized.aadhaarLast4}).`,
        };

        let source = 'mongodb';
        if (activeDb) {
          try {
            await activeDb.collection('visitor_registrations').insertOne(registration);
            await activeDb.collection('gate_logs').insertOne(gateLog);
            await activeDb.collection('audit_logs').insertOne(auditEntry);
          } catch (dbErr) {
            console.warn('[dev-api] visitor insert failed, using memory fallback:', dbErr.message);
            source = 'memory';
            inMemoryVisitorRegistrations.push(registration);
            inMemoryGateLogs.push(gateLog);
            inMemoryAuditLogs.push(auditEntry);
          }
        } else {
          source = 'memory';
          inMemoryVisitorRegistrations.push(registration);
          inMemoryGateLogs.push(gateLog);
          inMemoryAuditLogs.push(auditEntry);
        }
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          source,
          registration: { id: registrationId, name: sanitized.name, gate: sanitized.gate, time: registration.createdAt },
        }));
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      }
    }
    // ----------------------------------------------------
    // POST /api/auth/login
    // ----------------------------------------------------
    else if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await readBody(req);
      const email = body.email || '';
      let user = null;
      if (activeDb) {
        try {
          user = await activeDb.collection('users').findOne({ email: email.toLowerCase() }, { projection: { password: 0 } });
        } catch {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        token: `c3s_token_${Date.now()}`,
        user: user || { email, name: 'Campus User', role: 'STUDENT', universityId: body.universityId || 'BTCS2026-0842' }
      }));
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Development API server running on 0.0.0.0:${PORT} (LAN accessible)`);
});

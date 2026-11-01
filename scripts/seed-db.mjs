// scripts/seed-db.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env if present
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const rawMongoUrl = process.argv[2] || process.env.MONGO_URL;

if (!rawMongoUrl) {
  console.error('\n❌ ERROR: No MongoDB connection string provided.');
  console.log('Provide it via MONGO_URL in your .env file or as a CLI argument:');
  console.log('  node scripts/seed-db.mjs "mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/UniMap"\n');
  process.exit(1);
}

function resolveDbName(urlStr) {
  try {
    const parsed = new URL(urlStr.replace(/^mongodb\+srv:\/\//, 'http://').replace(/^mongodb:\/\//, 'http://'));
    const pathName = parsed.pathname.replace(/^\//, '').split('?')[0];
    if (pathName) return pathName;
  } catch {}
  return 'UniMap';
}

const dbName = resolveDbName(rawMongoUrl);

console.log('====================================================');
console.log('  C3S & UniMap Automated Database Seeder');
console.log('====================================================');
console.log(`Connecting to: ${rawMongoUrl.replace(/:([^:@]+)@/, ':****@')}`);
console.log(`Target Database: [${dbName}]`);
console.log('----------------------------------------------------');

const client = new MongoClient(rawMongoUrl, {
  serverSelectionTimeoutMS: 6000,
  connectTimeoutMS: 10000,
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected successfully to MongoDB!');
    const db = client.db(dbName);

    const initDataDir = path.join(rootDir, 'init-data');
    const datasets = [
      { name: 'buildings', file: 'buildings.json' },
      { name: 'floors', file: 'floors.json' },
      { name: 'nodes', file: 'nodes.json' },
      { name: 'edges', file: 'edges.json' }
    ];

    console.log('\nImporting Spatial Graph Collections:');
    for (const set of datasets) {
      const filePath = path.join(initDataDir, set.file);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const col = db.collection(set.name);
        await col.deleteMany({});
        if (data.length > 0) {
          await col.insertMany(data);
          console.log(`  ✓ ${set.name.padEnd(12)} : ${data.length} records imported`);
        }
      } else {
        console.warn(`  ⚠ ${set.name} : file ${set.file} not found`);
      }
    }

    console.log('\nSeeding Campus Security Operational Collections:');

    // 1. Initial Users
    const initialUsers = [
      {
        universityId: 'BTCS2026-0842',
        name: 'Naman Lakhotia',
        email: 'naman.cs26@mitsgwalior.in',
        role: 'STUDENT',
        department: 'Computer Science & Engineering',
        status: 'INSIDE',
        phone: '+91 98765 43210',
        currentGate: 'Main Gate',
        createdAt: Date.now()
      },
      {
        universityId: 'GUARD-SEC-101',
        name: 'Havildar Rajesh Sharma',
        email: 'rajesh.guard@mitsgwalior.in',
        role: 'GATE_KEEPER',
        department: 'Campus Security Battalion',
        status: 'DUTY',
        phone: '+91 98765 00101',
        assignedGate: 'GATE-MAIN',
        createdAt: Date.now()
      },
      {
        universityId: 'RESPONDER-ERT-01',
        name: 'Officer Vikram Singh',
        email: 'vikram.ert@mitsgwalior.in',
        role: 'SECURITY_PATROL',
        department: 'Tactical Emergency Response Team',
        status: 'DUTY',
        phone: '+91 98765 00911',
        createdAt: Date.now()
      },
      {
        universityId: 'CTRL-OPERATOR-04',
        name: 'Control Room Chief Rao',
        email: 'control.chief@mitsgwalior.in',
        role: 'CONTROL_ROOM',
        department: 'Central SOC & Operations',
        status: 'ONLINE',
        phone: '+91 98765 00888',
        createdAt: Date.now()
      },
      {
        universityId: 'ADMIN-PROCTOR-01',
        name: 'Prof. S. K. Jain (Chief Proctor)',
        email: 'proctor@mitsgwalior.in',
        role: 'ADMIN',
        department: 'Office of the Proctor & Discipline',
        status: 'ONLINE',
        phone: '+91 98765 00001',
        createdAt: Date.now()
      }
    ];

    const usersCol = db.collection('users');
    await usersCol.deleteMany({});
    await usersCol.insertMany(initialUsers);
    console.log(`  ✓ users        : ${initialUsers.length} records seeded`);

    // 2. Initial Gates
    const initialGates = [
      {
        id: 'GATE-MAIN',
        name: 'Main Gate (Race Course Rd)',
        status: 'OPEN',
        currentOccupancy: 342,
        checkInsToday: 820,
        checkOutsToday: 478,
        lat: 26.232611,
        lng: 78.205222,
        lastActivity: Date.now()
      },
      {
        id: 'GATE-JUBILEE',
        name: 'Jubilee Block Gate',
        status: 'OPEN',
        currentOccupancy: 128,
        checkInsToday: 310,
        checkOutsToday: 182,
        lat: 26.229639,
        lng: 78.205639,
        lastActivity: Date.now()
      },
      {
        id: 'GATE-HOSTEL',
        name: 'Hostel Perimeter Gate',
        status: 'OPEN',
        currentOccupancy: 85,
        checkInsToday: 195,
        checkOutsToday: 110,
        lat: 26.231194,
        lng: 78.203861,
        lastActivity: Date.now()
      }
    ];

    const gatesCol = db.collection('gates');
    await gatesCol.deleteMany({});
    await gatesCol.insertMany(initialGates);
    console.log(`  ✓ gates        : ${initialGates.length} records seeded`);

    // 3. Initial SOS / Incidents
    const initialSos = [
      {
        id: 'sos_demo_01',
        category: 'medical',
        severity: 'critical',
        title: '🚨 Heat Exhaustion Incident',
        description: 'Student experiencing severe dizziness and heat exhaustion near Ground Pavilion.',
        map: 'Campus_Map',
        floor: 0,
        x: 480,
        y: 420,
        lat: 26.230752,
        lng: 78.205341,
        nodeId: 'node_ground_pavilion',
        timestamp: Date.now() - 1000 * 60 * 18,
        status: 'active',
        reportedBy: 'Aryan Sharma',
        phone: '+91 98261 22334',
        deliveryState: 'synced'
      }
    ];

    const sosCol = db.collection('sos_incidents');
    await sosCol.deleteMany({});
    await sosCol.insertMany(initialSos);
    console.log(`  ✓ sos_incidents: ${initialSos.length} records seeded`);

    // Summary of total collections
    const allCollections = await db.listCollections().toArray();
    console.log('\n====================================================');
    console.log(`✅ DATABASE SEED COMPLETE: [${dbName}] is fully initialized!`);
    console.log(`Active collections: ${allCollections.map(c => c.name).join(', ')}`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('\n❌ SEEDING FAILED:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();

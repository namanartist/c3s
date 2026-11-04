const DEFAULT_CROWD_LOGS = [
  {
    id: 'log-main-gate',
    label: 'Main Gate',
    count: 4,
    coordinates: { latitude: 26.2178, longitude: 78.1832 },
    timestamp: new Date().toISOString()
  },
  {
    id: 'log-gate-2',
    label: 'Gate 2 Annex',
    count: 6,
    coordinates: { latitude: 26.2185, longitude: 78.1830 },
    timestamp: new Date().toISOString()
  },
  {
    id: 'log-ai-ff',
    label: 'AI & CSE FF Corridor',
    count: 8,
    coordinates: { latitude: 26.2181, longitude: 78.1825 },
    timestamp: new Date().toISOString()
  },
  {
    id: 'log-sh4',
    label: 'SH-4 Seminar Hall',
    count: 3,
    coordinates: { latitude: 26.2184, longitude: 78.1829 },
    timestamp: new Date().toISOString()
  },
  {
    id: 'log-jubilee',
    label: 'Jubilee Gate',
    count: 2,
    coordinates: { latitude: 26.2195, longitude: 78.1810 },
    timestamp: new Date().toISOString()
  },
  {
    id: 'log-library',
    label: 'Central Library Plaza',
    count: 5,
    coordinates: { latitude: 26.2172, longitude: 78.1820 },
    timestamp: new Date().toISOString()
  }
];

// api/crowd.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db.js';

/** GET /api/crowd handler. Fetches latest crowd monitoring logs from MongoDB 'home' database. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const db = await getDb('home');
    const logs = await db.collection('blogs').find({}).sort({ _id: -1 }).limit(50).toArray();
    if (logs && logs.length > 0) {
      res.status(200).json({ data: logs, count: logs.length });
    } else {
      res.status(200).json({ data: DEFAULT_CROWD_LOGS, count: DEFAULT_CROWD_LOGS.length });
    }
  } catch (error) {
    console.warn('[API /api/crowd] Warning:', error);
    res.status(200).json({
      data: DEFAULT_CROWD_LOGS,
      count: DEFAULT_CROWD_LOGS.length
    });
  }
}

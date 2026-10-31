// api/nodes.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db.js';
import { fetchFromUniMapService } from './_unimap.js';

/** GET /api/nodes handler. Fetches all nodes from internal UniMap service or MongoDB collection. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 1. If bound to internal unimap service, resolve from the service
  if (process.env.UNIMAP_SERVICE_URL) {
    try {
      const serviceData = await fetchFromUniMapService<unknown[]>('/api/nodes');
      if (serviceData) {
        res.status(200).json({ data: serviceData });
        return;
      }
    } catch (serviceErr) {
      console.warn('[API /api/nodes] Binding service fetch error, falling back:', serviceErr);
    }
  }

  // 2. Direct database query fallback
  try {
    const db = await getDb();
    const nodes = await db.collection('nodes').find({}, { projection: { _id: 0 } }).toArray();
    res.status(200).json({ data: nodes });
  } catch (error) {
    console.error('[API /api/nodes] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch nodes',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// api/buildings.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db.js';
import { fetchFromUniMapService } from './_unimap.js';

/** GET /api/buildings handler. Fetches all buildings from internal UniMap service or MongoDB collection. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 1. If bound to internal unimap service, resolve from the service
  if (process.env.UNIMAP_SERVICE_URL) {
    try {
      const serviceData = await fetchFromUniMapService<unknown[]>('/api/buildings');
      if (serviceData) {
        res.status(200).json({ data: serviceData });
        return;
      }
    } catch (serviceErr) {
      console.warn('[API /api/buildings] Binding service fetch error, falling back:', serviceErr);
    }
  }

  // 2. Direct database query fallback
  try {
    const db = await getDb();
    const buildings = await db.collection('buildings').find({}, { projection: { _id: 0 } }).toArray();
    res.status(200).json({ data: buildings });
  } catch (error) {
    console.error('[API /api/buildings] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch buildings',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

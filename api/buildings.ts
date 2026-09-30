// api/buildings.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db.js';

/** GET /api/buildings handler. Fetches all buildings from the MongoDB collection. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

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

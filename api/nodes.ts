// api/nodes.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db.js';

/** GET /api/nodes handler. Fetches all nodes from the MongoDB collection. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

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

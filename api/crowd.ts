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
    res.status(200).json({ data: logs, count: logs.length });
  } catch (error) {
    console.warn('[API /api/crowd] Warning:', error);
    res.status(200).json({
      data: [],
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

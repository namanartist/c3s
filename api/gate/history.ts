// api/gate/history.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const userId = req.query.userId as string | undefined;
  const role = ((req.query.role as string) || 'student_visitor').toLowerCase();
  const gateId = req.query.gateId as string | undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);

  try {
    const db = await getDb();
    const query: Record<string, unknown> = {};

    // Apply Scope filtering per Permissions Matrix
    if (role === 'student_visitor' && userId) {
      query.universityId = userId;
    } else if (role === 'responder' && gateId) {
      query.gateId = gateId;
    } else if (role === 'warden') {
      // Filter by hostel/residential zone if provided
      if (req.query.hostel) {
        query.hostel = req.query.hostel;
      }
    }
    // soc_admin and auditor have scope: 'all'

    const logs = await db
      .collection('gate_logs')
      .find(query, { projection: { _id: 0 } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.warn('[History API]: DB fetch failed, returning empty buffer:', error);
    res.status(200).json({
      success: true,
      data: [],
      count: 0,
      note: 'Using local offline buffer'
    });
  }
}


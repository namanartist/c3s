// api/sos.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. GET: Fetch active and recent SOS incidents
  if (req.method === 'GET') {
    try {
      const db = await getDb();
      const incidents = await db
        .collection('sos_incidents')
        .find({})
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();

      res.status(200).json({ success: true, data: incidents, count: incidents.length });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: 'Database fetch failed', message: msg });
    }
    return;
  }

  // 2. POST: Record a new SOS incident
  if (req.method === 'POST') {
    try {
      const db = await getDb();
      const body = req.body || {};

      const now = Date.now();
      const incident = {
        id: body.id || `sos_${now}_${Math.random().toString(36).substring(2, 7)}`,
        category: body.category || 'medical',
        severity: body.severity || 'critical',
        title: body.title || '🚨 Campus SOS Incident',
        description: body.description || 'Emergency SOS trigger received from student node.',
        map: body.map || 'Campus_Map',
        floor: typeof body.floor === 'number' ? body.floor : 0,
        x: typeof body.x === 'number' ? body.x : 500,
        y: typeof body.y === 'number' ? body.y : 350,
        lat: typeof body.lat === 'number' ? body.lat : (body.latitude || 26.230752),
        lng: typeof body.lng === 'number' ? body.lng : (body.longitude || 78.205341),
        nodeId: body.nodeId || body.nearestNodeId || null,
        timestamp: body.timestamp || now,
        status: body.status || 'active',
        reportedBy: body.reportedBy || body.studentName || 'Student',
        phone: body.phone || '+91 98765 43210',
        deliveryState: 'synced',
        evidence: body.evidence || null,
      };

      await db.collection('sos_incidents').insertOne(incident);

      // Audit log entry
      await db.collection('audit_logs').insertOne({
        id: `audit_${now}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now,
        actor: incident.reportedBy,
        action: 'SOS_TRIGGERED',
        resource: incident.id,
        result: 'ALERT_DISPATCHED',
        details: `SOS category ${incident.category} logged at node ${incident.nodeId || 'unknown'}.`,
      });

      res.status(201).json({ success: true, message: 'SOS recorded in database', incident });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: 'Database insert failed', message: msg });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

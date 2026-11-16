// api/sos.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. GET: Fetch active and recent SOS incidents from MongoDB
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

  // 2. POST / PUT / PATCH: Record or update an SOS incident in MongoDB
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const db = await getDb();
      const body = req.body || {};

      const now = Date.now();
      const incidentId = body.id || `sos_${now}_${Math.random().toString(36).substring(2, 7)}`;
      const incident = {
        id: incidentId,
        category: body.category || 'security',
        severity: body.severity || 'critical',
        title: body.title || '🚨 Campus SOS Incident',
        description: body.description || 'Emergency SOS trigger received.',
        map: body.map || 'Campus_Map',
        floor: typeof body.floor === 'number' ? body.floor : 0,
        x: typeof body.x === 'number' ? body.x : 500,
        y: typeof body.y === 'number' ? body.y : 350,
        lat: typeof body.lat === 'number' ? body.lat : (body.latitude || 26.230752),
        lng: typeof body.lng === 'number' ? body.lng : (body.longitude || 78.205341),
        nodeId: body.nodeId || body.nearestNodeId || null,
        photoUrl: body.photoUrl || (body.evidence && body.evidence.photoUrl) || null,
        videoUrl: body.videoUrl || (body.evidence && body.evidence.videoUrl) || null,
        timestamp: body.timestamp || now,
        status: body.status || 'active',
        reportedBy: body.reportedBy || body.studentName || 'Student',
        phone: body.phone || '+91 751-2409300',
        assignedResponder: body.assignedResponder || body.responderAssigned || null,
        responderStatus: body.responderStatus || 'dispatched',
        responderEta: body.responderEta || '< 2 mins',
        notifiedResponders: body.notifiedResponders || null,
        deliveryState: 'synced',
        evidence: body.evidence || null,
      };

      await db.collection('sos_incidents').updateOne(
        { id: incidentId },
        { $set: incident },
        { upsert: true }
      );

      // Audit log entry
      await db.collection('audit_logs').insertOne({
        id: `audit_${now}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now,
        actor: incident.reportedBy,
        action: body.status === 'resolved' ? 'SOS_RESOLVED' : 'SOS_TRIGGERED',
        resource: incidentId,
        result: 'ALERT_PROCESSED',
        details: `SOS category ${incident.category} status: ${incident.status} at node ${incident.nodeId || 'unknown'}.`,
      });

      res.status(201).json({ success: true, message: 'SOS recorded in MongoDB database', incident });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: 'Database insert failed', message: msg });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

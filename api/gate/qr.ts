// api/gate/qr.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db.js';

const CAMPUS_QR_SECRET = 'C3S-MITS-GWL-2026-SECURE-KEY-8F39D';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function generateServerGateQr(gateId: string, version = 1, date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${d}`;

  const exp = new Date(date);
  exp.setHours(23, 59, 59, 999);
  const expiresAt = exp.getTime();
  const issuedAt = Date.now();

  const rawPayload = `${gateId}:${dateStr}:v${version}:${CAMPUS_QR_SECRET}:${expiresAt}`;
  const signature = simpleHash(rawPayload);
  const token = `C3S-QR-${gateId}-${dateStr}-V${version}-${signature}`;

  return {
    gateId,
    dateStr,
    version,
    token,
    issuedAt,
    expiresAt,
    signature
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const gateId = (req.query.gateId as string) || (req.body?.gateId as string) || 'GATE-MAIN';
  const version = parseInt((req.query.version as string) || (req.body?.version as string) || '1', 10);

  try {
    const tokenData = generateServerGateQr(gateId, version);

    // Optionally cache/persist in DB if available
    try {
      const db = await getDb();
      await db.collection('gate_tokens').updateOne(
        { gateId },
        { $set: { ...tokenData, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch {
      // Non-fatal if DB is temporarily unreachable
    }

    res.status(200).json({ success: true, data: tokenData });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate gate QR'
    });
  }
}


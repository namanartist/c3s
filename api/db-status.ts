// api/db-status.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkDbConnection } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const status = await checkDbConnection();
  if (status.connected) {
    res.status(200).json({
      success: true,
      status: 'healthy',
      ...status,
    });
  } else {
    res.status(503).json({
      success: false,
      status: 'disconnected',
      ...status,
      hint: 'Configure MONGO_URL in your .env file or Vercel Environment Variables to connect to MongoDB Atlas / local MongoDB.',
    });
  }
}

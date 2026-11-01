// api/auth/login.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const { email, password, universityId } = req.body || {};
  if (!email && !universityId) {
    res.status(400).json({ success: false, error: 'Email or University ID is required.' });
    return;
  }

  try {
    const db = await getDb();
    const query = email ? { email: email.toLowerCase().trim() } : { universityId };
    const user = await db.collection('users').findOne(query, { projection: { password: 0 } });

    if (!user) {
      // In dev/demo, allow fallback login if not found in db
      res.status(401).json({ success: false, error: 'Invalid user credentials.' });
      return;
    }

    const token = `c3s_jwt_${Buffer.from(`${user.universityId || user.email}:${Date.now()}`).toString('base64')}`;

    res.status(200).json({
      success: true,
      token,
      type: 'Bearer',
      expiresIn: 86400,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        universityId: user.universityId,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: 'Database query error', message: msg });
  }
}

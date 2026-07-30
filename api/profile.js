import { getDb } from './lib/db.js';
import { getAuthUser } from './lib/auth.js';

export default async function handler(req, res) {
  const authPayload = getAuthUser(req);
  if (!authPayload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = authPayload.uid;
  const db = getDb();

  try {
    // GET: Fetch user profile
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT * FROM profiles WHERE user_id = ? LIMIT 1',
        args: [userId]
      });
      return res.status(200).json({ success: true, data: result.rows[0] || null });
    }

    // POST: Update user profile
    if (req.method === 'POST') {
      const { business_name, owner_name, phone, address, business_category, avatar_url } = req.body || {};
      const profileId = 'prof_' + userId;
      const updatedAt = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO profiles (id, user_id, business_name, owner_name, phone, address, business_category, avatar_url, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET 
              business_name = ?, owner_name = ?, phone = ?, address = ?, business_category = ?, avatar_url = ?, updated_at = ?`,
        args: [
          profileId, userId, business_name || '', owner_name || '', phone || '', address || '', business_category || '', avatar_url || '', updatedAt,
          business_name || '', owner_name || '', phone || '', address || '', business_category || '', avatar_url || '', updatedAt
        ]
      });

      if (business_name) {
        await db.execute({
          sql: 'UPDATE users SET business_name = ? WHERE id = ?',
          args: [business_name, userId]
        });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Profile API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

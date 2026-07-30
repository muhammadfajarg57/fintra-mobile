import { getDb } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';

export default async function handler(req, res) {
  try {
    const authPayload = getAuthUser(req);
    if (!authPayload) {
      return res.status(401).json({ error: 'Unauthorized. Silakan login kembali.' });
    }

    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT id, email, phone, name, business_name, created_at FROM users WHERE id = ? LIMIT 1',
      args: [authPayload.uid]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const userRow = result.rows[0];
    const user = {
      uid: userRow.id,
      email: userRow.email,
      phone: userRow.phone,
      name: userRow.name,
      businessName: userRow.business_name
    };

    // Get extended profile if exists
    const profResult = await db.execute({
      sql: 'SELECT * FROM profiles WHERE user_id = ? LIMIT 1',
      args: [authPayload.uid]
    });

    const profile = profResult.rows[0] || null;

    return res.status(200).json({
      success: true,
      user,
      profile
    });
  } catch (err) {
    console.error('Auth ME API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

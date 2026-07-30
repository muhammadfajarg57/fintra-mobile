import { getDb } from '../lib/db.js';
import { signToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, avatarUrl } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email Google wajib diisi' });
    }

    const db = getDb();
    const existing = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ? LIMIT 1',
      args: [email.toLowerCase().trim()]
    });

    let userId;
    let businessName = 'Bisnis Saya';

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      businessName = existing.rows[0].business_name || 'Bisnis Saya';
    } else {
      userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const createdAt = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO users (id, email, phone, password_hash, name, business_name, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [userId, email.toLowerCase().trim(), null, 'google_oauth_user', name || 'Mitra finmo', businessName, createdAt]
      });

      await db.execute({
        sql: `INSERT INTO profiles (id, user_id, business_name, owner_name, avatar_url, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['prof_' + userId, userId, businessName, name || 'Mitra finmo', avatarUrl || '', createdAt]
      });

      const kasId = 'w_' + userId + '_kas';
      const bankId = 'w_' + userId + '_bank';
      await db.execute({
        sql: `INSERT INTO wallets (id, user_id, nama, jenis, saldo_terkini, saldo_awal, color, is_default, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          kasId, userId, 'Kas Tunai', 'cash', 0, 0, '#0ea5e9', 1, createdAt,
          bankId, userId, 'Bank Utama', 'bank', 0, 0, '#1e40af', 0, createdAt
        ]
      });
    }

    const user = {
      uid: userId,
      email: email,
      name: name || 'Mitra finmo',
      businessName: businessName
    };

    const token = signToken({ uid: userId, email });

    return res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (err) {
    console.error('Google Auth API error:', err);
    return res.status(500).json({ error: err.message || 'Gagal login dengan Google' });
  }
}

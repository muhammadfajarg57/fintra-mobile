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
    // GET: List categories
    if (req.method === 'GET') {
      const { type } = req.query || {};
      let sql = 'SELECT * FROM categories WHERE user_id = ?';
      let args = [userId];

      if (type) {
        sql += ' AND type = ?';
        args.push(type);
      }

      const result = await db.execute({ sql, args });
      return res.status(200).json({ success: true, data: result.rows });
    }

    // POST: Create category
    if (req.method === 'POST') {
      const { nama, type } = req.body || {};

      if (!nama || !type) {
        return res.status(400).json({ error: 'Nama dan Type kategori wajib diisi' });
      }

      const catId = 'cat_' + userId + '_' + Date.now();

      await db.execute({
        sql: 'INSERT INTO categories (id, user_id, nama, type) VALUES (?, ?, ?, ?)',
        args: [catId, userId, nama, type]
      });

      return res.status(200).json({ success: true, id: catId });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Categories API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

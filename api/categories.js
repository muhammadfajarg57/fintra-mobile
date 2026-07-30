import { getDb } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';

export default async function handler(req, res) {
  const authPayload = getAuthUser(req);
  const uid = authPayload?.uid || 'usr_demo';
  const db = getDb();

  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM categories WHERE user_id = ?', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const d = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const catId = 'cat_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO categories (id, user_id, nama, type, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [catId, uid, d.nama || 'Kategori Baru', d.type || 'tx_category', new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: catId });
  }
}
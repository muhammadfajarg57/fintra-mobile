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
    // GET: List all business partners
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT * FROM partners WHERE user_id = ? ORDER BY nama ASC',
        args: [userId]
      });
      return res.status(200).json({ success: true, data: result.rows });
    }

    // POST: Create or Update partner
    if (req.method === 'POST') {
      const { id, nama, jenis, hp, alamat, total_piutang } = req.body || {};

      if (!nama) {
        return res.status(400).json({ error: 'Nama mitra wajib diisi' });
      }

      const partnerId = id || 'p_' + userId + '_' + Date.now();
      const createdAt = new Date().toISOString();

      if (id) {
        await db.execute({
          sql: `UPDATE partners SET 
                nama = ?, jenis = ?, hp = ?, alamat = ?, total_piutang = ?
                WHERE id = ? AND user_id = ?`,
          args: [
            nama, jenis || 'kios', hp || '', alamat || '', Number(total_piutang || 0),
            partnerId, userId
          ]
        });
      } else {
        await db.execute({
          sql: `INSERT INTO partners (id, user_id, nama, jenis, hp, alamat, total_piutang, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            partnerId, userId, nama, jenis || 'kios', hp || '', alamat || '', Number(total_piutang || 0), createdAt
          ]
        });
      }

      return res.status(200).json({ success: true, id: partnerId });
    }

    // DELETE: Delete partner
    if (req.method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ error: 'ID mitra wajib diisi' });

      await db.execute({
        sql: 'DELETE FROM partners WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Partners API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

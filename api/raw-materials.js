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
    // GET: List all raw materials
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT * FROM raw_materials WHERE user_id = ? ORDER BY nama ASC',
        args: [userId]
      });
      return res.status(200).json({ success: true, data: result.rows });
    }

    // POST: Create or Update raw material
    if (req.method === 'POST') {
      const { id, nama, stok_aktif, satuan, avg_cost, min_stok, supplier } = req.body || {};

      if (!nama) {
        return res.status(400).json({ error: 'Nama bahan baku wajib diisi' });
      }

      const matId = id || 'mat_' + userId + '_' + Date.now();
      const createdAt = new Date().toISOString();

      if (id) {
        await db.execute({
          sql: `UPDATE raw_materials SET 
                nama = ?, stok_aktif = ?, satuan = ?, avg_cost = ?, 
                min_stok = ?, supplier = ?
                WHERE id = ? AND user_id = ?`,
          args: [
            nama, Number(stok_aktif || 0), satuan || 'gram', Number(avg_cost || 0),
            Number(min_stok || 0), supplier || '', matId, userId
          ]
        });
      } else {
        await db.execute({
          sql: `INSERT INTO raw_materials (
                  id, user_id, nama, stok_aktif, satuan, avg_cost, min_stok, supplier, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            matId, userId, nama, Number(stok_aktif || 0), satuan || 'gram', Number(avg_cost || 0),
            Number(min_stok || 0), supplier || '', createdAt
          ]
        });
      }

      return res.status(200).json({ success: true, id: matId });
    }

    // DELETE: Delete raw material
    if (req.method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ error: 'ID bahan baku wajib diisi' });

      await db.execute({
        sql: 'DELETE FROM raw_materials WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Raw Materials API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

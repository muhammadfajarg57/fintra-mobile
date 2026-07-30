import { getDb } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';

export default async function handler(req, res) {
  const authPayload = getAuthUser(req);
  const uid = authPayload?.uid || 'usr_demo';
  const db = getDb();

  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM raw_materials WHERE user_id = ? ORDER BY created_at DESC', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const d = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const matId = d.id || 'mat_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO raw_materials (id, user_id, nama, satuan, stok, total_nilai, hpp_rata_rata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET nama=excluded.nama, satuan=excluded.satuan, stok=excluded.stok, total_nilai=excluded.total_nilai, hpp_rata_rata=excluded.hpp_rata_rata`,
      args: [matId, uid, d.nama || 'Bahan Baku', d.satuan || 'pcs', d.stok || 0, d.total_nilai || 0, d.hpp_rata_rata || 0, new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: matId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    await db.execute({ sql: 'DELETE FROM raw_materials WHERE id = ? AND user_id = ?', args: [id, uid] });
    return res.status(200).json({ success: true });
  }
}
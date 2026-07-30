import { getDb } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';

export default async function handler(req, res) {
  const authPayload = getAuthUser(req);
  const uid = authPayload?.uid || 'usr_demo';
  const db = getDb();

  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM partners WHERE user_id = ? ORDER BY created_at DESC', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const d = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const pId = d.id || 'p_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO partners (id, user_id, nama_toko, nama_partner, pemilik, telepon, alamat, catatan, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET nama_toko=excluded.nama_toko, nama_partner=excluded.nama_partner, pemilik=excluded.pemilik, telepon=excluded.telepon, alamat=excluded.alamat, catatan=excluded.catatan`,
      args: [pId, uid, d.nama_toko || d.nama_partner || 'Mitra', d.nama_partner || '', d.pemilik || '', d.telepon || '', d.alamat || '', d.catatan || '', new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: pId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    await db.execute({ sql: 'DELETE FROM partners WHERE id = ? AND user_id = ?', args: [id, uid] });
    return res.status(200).json({ success: true });
  }
}
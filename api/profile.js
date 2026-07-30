import { getDb } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';

export default async function handler(req, res) {
  const authPayload = getAuthUser(req);
  const uid = authPayload?.uid || 'usr_demo';
  const db = getDb();

  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM profiles WHERE user_id = ? LIMIT 1', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows[0] || {} });
  }
  if (req.method === 'POST') {
    const d = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const profId = 'prof_' + uid;
    await db.execute({
      sql: `INSERT INTO profiles (id, user_id, business_name, owner_name, phone, address, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET business_name=excluded.business_name, owner_name=excluded.owner_name, phone=excluded.phone, address=excluded.address, updated_at=excluded.updated_at`,
      args: [profId, uid, d.nama_toko || d.business_name || 'Bisnis Saya', d.nama_pemilik || d.owner_name || 'Pemilik', d.telepon || d.phone || '', d.alamat || d.address || '', new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: profId });
  }
}
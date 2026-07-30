import { getDb } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';

export default async function handler(req, res) {
  const authPayload = getAuthUser(req);
  const uid = authPayload?.uid || 'usr_demo';
  const db = getDb();

  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM wallets WHERE user_id = ? ORDER BY created_at ASC', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const wId = body.id || 'w_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO wallets (id, user_id, nama, jenis, saldo_terkini, saldo_awal, color, is_default, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET nama=excluded.nama, jenis=excluded.jenis, saldo_terkini=excluded.saldo_terkini, color=excluded.color, is_default=excluded.is_default`,
      args: [wId, uid, body.nama || 'Kas', body.jenis || 'cash', body.saldo_terkini || 0, body.saldo_awal || 0, body.color || '#0ea5e9', body.is_default ? 1 : 0, new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: wId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    await db.execute({ sql: 'DELETE FROM wallets WHERE id = ? AND user_id = ?', args: [id, uid] });
    return res.status(200).json({ success: true });
  }
}
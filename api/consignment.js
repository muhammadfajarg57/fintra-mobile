import { getDb } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';

export default async function handler(req, res) {
  const authPayload = getAuthUser(req);
  const uid = authPayload?.uid || 'usr_demo';
  const db = getDb();

  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM consignment_stock WHERE user_id = ? ORDER BY created_at DESC', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const d = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const cId = d.id || 'cs_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO consignment_stock (id, user_id, partner_id, product_id, jumlah_titip, jumlah_terjual, sisa_stok, hpp_satuan, harga_jual_satuan, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET jumlah_titip=excluded.jumlah_titip, jumlah_terjual=excluded.jumlah_terjual, sisa_stok=excluded.sisa_stok, status=excluded.status`,
      args: [cId, uid, d.partner_id || '', d.product_id || '', d.jumlah_titip || 0, d.jumlah_terjual || 0, d.sisa_stok || 0, d.hpp_satuan || 0, d.harga_jual_satuan || 0, d.status || 'aktif', new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: cId });
  }
}
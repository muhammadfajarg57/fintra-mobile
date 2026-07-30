import { getDb } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';

export default async function handler(req, res) {
  const authPayload = getAuthUser(req);
  const uid = authPayload?.uid || 'usr_demo';
  const db = getDb();

  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM transactions WHERE user_id = ? ORDER BY tanggal DESC', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const txId = data.id || 'tx_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO transactions (id, user_id, tipe, jumlah, dompet_id, dompet_asal_id, dompet_tujuan_id, kategori, catatan, pelanggan, foto_url, status, items_json, tanggal, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET tipe=excluded.tipe, jumlah=excluded.jumlah, dompet_id=excluded.dompet_id, kategori=excluded.kategori, catatan=excluded.catatan, items_json=excluded.items_json`,
      args: [txId, uid, data.tipe || 'pemasukan', data.jumlah || 0, data.dompet_id || null, data.dompet_asal_id || null, data.dompet_tujuan_id || null, data.kategori || 'Umum', data.catatan || '', data.pelanggan || '', data.foto_url || '', data.status || 'selesai', typeof data.items_json === 'object' ? JSON.stringify(data.items_json) : (data.items_json || '[]'), data.tanggal || new Date().toISOString(), new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: txId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    await db.execute({ sql: 'DELETE FROM transactions WHERE id = ? AND user_id = ?', args: [id, uid] });
    return res.status(200).json({ success: true });
  }
}
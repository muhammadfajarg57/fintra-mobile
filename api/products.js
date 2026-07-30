import { getDb } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';

export default async function handler(req, res) {
  const authPayload = getAuthUser(req);
  const uid = authPayload?.uid || 'usr_demo';
  const db = getDb();

  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC', args: [uid] });
    const products = result.rows.map(p => ({ ...p, resep: p.resep ? JSON.parse(p.resep) : [] }));
    return res.status(200).json({ success: true, data: products });
  }
  if (req.method === 'POST') {
    const d = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const prId = d.id || 'prod_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO products (id, user_id, nama, barcode, sku, harga_jual, last_hpp_satuan, stok_gudang, kategori, foto_url, resep, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET nama=excluded.nama, barcode=excluded.barcode, sku=excluded.sku, harga_jual=excluded.harga_jual, last_hpp_satuan=excluded.last_hpp_satuan, stok_gudang=excluded.stok_gudang, kategori=excluded.kategori, foto_url=excluded.foto_url, resep=excluded.resep`,
      args: [prId, uid, d.nama || d.nama_produk || 'Produk Baru', d.barcode || '', d.sku || '', d.harga_jual || d.last_harga_jual || 0, d.last_hpp_satuan || 0, d.stok_gudang || 0, d.kategori || 'Umum', d.foto_url || '', typeof d.resep === 'object' ? JSON.stringify(d.resep) : (d.resep || '[]'), new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: prId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    await db.execute({ sql: 'DELETE FROM products WHERE id = ? AND user_id = ?', args: [id, uid] });
    return res.status(200).json({ success: true });
  }
}
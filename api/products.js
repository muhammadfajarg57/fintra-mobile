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
    // GET: List all products for current user
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT * FROM products WHERE user_id = ? ORDER BY nama ASC',
        args: [userId]
      });

      // Parse resep JSON if stored as string
      const products = result.rows.map(row => {
        let resep = [];
        if (row.resep) {
          try { resep = typeof row.resep === 'string' ? JSON.parse(row.resep) : row.resep; } catch (e) { resep = []; }
        }
        return { ...row, resep };
      });

      return res.status(200).json({ success: true, data: products });
    }

    // POST: Create or Update product
    if (req.method === 'POST') {
      const { 
        id, nama, kategori, harga_jual, harga_modal, stok_gudang, unit, min_stok, resep 
      } = req.body || {};

      if (!nama) {
        return res.status(400).json({ error: 'Nama produk wajib diisi' });
      }

      const productId = id || 'prod_' + userId + '_' + Date.now();
      const createdAt = new Date().toISOString();
      const resepStr = Array.isArray(resep) ? JSON.stringify(resep) : (resep || '[]');

      if (id) {
        await db.execute({
          sql: `UPDATE products SET 
                nama = ?, kategori = ?, harga_jual = ?, harga_modal = ?, 
                stok_gudang = ?, unit = ?, min_stok = ?, resep = ?
                WHERE id = ? AND user_id = ?`,
          args: [
            nama, kategori || 'Umum', Number(harga_jual || 0), Number(harga_modal || 0),
            Number(stok_gudang || 0), unit || 'pcs', Number(min_stok || 0), resepStr,
            productId, userId
          ]
        });
      } else {
        await db.execute({
          sql: `INSERT INTO products (
                  id, user_id, nama, kategori, harga_jual, harga_modal, 
                  stok_gudang, unit, min_stok, resep, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            productId, userId, nama, kategori || 'Umum', Number(harga_jual || 0), Number(harga_modal || 0),
            Number(stok_gudang || 0), unit || 'pcs', Number(min_stok || 0), resepStr, createdAt
          ]
        });
      }

      return res.status(200).json({ success: true, id: productId });
    }

    // DELETE: Delete product
    if (req.method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ error: 'ID produk wajib diisi' });

      await db.execute({
        sql: 'DELETE FROM products WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Products API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

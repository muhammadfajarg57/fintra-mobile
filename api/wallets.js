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
    // GET: List all wallets for current user
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT * FROM wallets WHERE user_id = ? ORDER BY is_default DESC, created_at ASC',
        args: [userId]
      });
      return res.status(200).json({ success: true, data: result.rows });
    }

    // POST: Create or Update wallet
    if (req.method === 'POST') {
      const { id, nama, jenis, saldo_terkini, saldo_awal, no_rekening, atas_nama, color, is_default } = req.body || {};
      
      if (!nama) {
        return res.status(400).json({ error: 'Nama dompet/rekening wajib diisi' });
      }

      const walletId = id || 'w_' + userId + '_' + Date.now();
      const createdAt = new Date().toISOString();

      if (id) {
        // Update existing wallet
        await db.execute({
          sql: `UPDATE wallets SET 
                nama = ?, jenis = ?, saldo_terkini = ?, saldo_awal = ?, 
                no_rekening = ?, atas_nama = ?, color = ?, is_default = ?
                WHERE id = ? AND user_id = ?`,
          args: [
            nama, jenis || 'cash', Number(saldo_terkini || 0), Number(saldo_awal || 0),
            no_rekening || '', atas_nama || '', color || '#0ea5e9', is_default ? 1 : 0,
            walletId, userId
          ]
        });
      } else {
        // Insert new wallet
        await db.execute({
          sql: `INSERT INTO wallets (id, user_id, nama, jenis, saldo_terkini, saldo_awal, no_rekening, atas_nama, color, is_default, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            walletId, userId, nama, jenis || 'cash', Number(saldo_terkini || saldo_awal || 0), Number(saldo_awal || 0),
            no_rekening || '', atas_nama || '', color || '#0ea5e9', is_default ? 1 : 0, createdAt
          ]
        });
      }

      return res.status(200).json({ success: true, id: walletId });
    }

    // DELETE: Remove wallet
    if (req.method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ error: 'ID dompet wajib diisi' });

      await db.execute({
        sql: 'DELETE FROM wallets WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Wallets API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

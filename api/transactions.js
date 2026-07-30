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
    // GET: Fetch transactions with optional filters
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT * FROM transactions WHERE user_id = ? ORDER BY tanggal_iso DESC, created_at DESC',
        args: [userId]
      });
      return res.status(200).json({ success: true, data: result.rows });
    }

    // POST: Create or Update transaction
    if (req.method === 'POST') {
      const { 
        id, tipe_tx, nominal, kategori, dompet_id, dompet_tujuan_id, 
        tanggal, tanggal_iso, catatan, foto_bukti 
      } = req.body || {};

      if (!nominal || isNaN(nominal)) {
        return res.status(400).json({ error: 'Nominal transaksi tidak valid' });
      }

      const txId = id || 'tx_' + userId + '_' + Date.now();
      const createdAt = new Date().toISOString();
      const numNominal = Number(nominal);

      if (id) {
        // Fetch old transaction to revert wallet balances
        const oldResult = await db.execute({
          sql: 'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
          args: [id, userId]
        });

        if (oldResult.rows.length > 0) {
          const oldTx = oldResult.rows[0];
          // Revert old transaction balance
          if (oldTx.tipe_tx === 'in' && oldTx.dompet_id) {
            await db.execute({
              sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini - ? WHERE id = ? AND user_id = ?',
              args: [oldTx.nominal, oldTx.dompet_id, userId]
            });
          } else if (oldTx.tipe_tx === 'out' && oldTx.dompet_id) {
            await db.execute({
              sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini + ? WHERE id = ? AND user_id = ?',
              args: [oldTx.nominal, oldTx.dompet_id, userId]
            });
          } else if (oldTx.tipe_tx === 'transfer') {
            if (oldTx.dompet_id) {
              await db.execute({
                sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini + ? WHERE id = ? AND user_id = ?',
                args: [oldTx.nominal, oldTx.dompet_id, userId]
              });
            }
            if (oldTx.dompet_tujuan_id) {
              await db.execute({
                sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini - ? WHERE id = ? AND user_id = ?',
                args: [oldTx.nominal, oldTx.dompet_tujuan_id, userId]
              });
            }
          }
        }

        // Update transaction record
        await db.execute({
          sql: `UPDATE transactions SET 
                tipe_tx = ?, nominal = ?, kategori = ?, dompet_id = ?, 
                dompet_tujuan_id = ?, tanggal = ?, tanggal_iso = ?, 
                catatan = ?, foto_bukti = ?
                WHERE id = ? AND user_id = ?`,
          args: [
            tipe_tx || 'out', numNominal, kategori || 'Umum', dompet_id || '',
            dompet_tujuan_id || '', tanggal || '', tanggal_iso || createdAt,
            catatan || '', foto_bukti || '', txId, userId
          ]
        });
      } else {
        // Insert new transaction record
        await db.execute({
          sql: `INSERT INTO transactions (
                  id, user_id, tipe_tx, nominal, kategori, dompet_id, 
                  dompet_tujuan_id, tanggal, tanggal_iso, catatan, foto_bukti, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            txId, userId, tipe_tx || 'out', numNominal, kategori || 'Umum', dompet_id || '',
            dompet_tujuan_id || '', tanggal || '', tanggal_iso || createdAt,
            catatan || '', foto_bukti || '', createdAt
          ]
        });
      }

      // Apply new wallet balance adjustment
      if (tipe_tx === 'in' && dompet_id) {
        await db.execute({
          sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini + ? WHERE id = ? AND user_id = ?',
          args: [numNominal, dompet_id, userId]
        });
      } else if (tipe_tx === 'out' && dompet_id) {
        await db.execute({
          sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini - ? WHERE id = ? AND user_id = ?',
          args: [numNominal, dompet_id, userId]
        });
      } else if (tipe_tx === 'transfer') {
        if (dompet_id) {
          await db.execute({
            sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini - ? WHERE id = ? AND user_id = ?',
            args: [numNominal, dompet_id, userId]
          });
        }
        if (dompet_tujuan_id) {
          await db.execute({
            sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini + ? WHERE id = ? AND user_id = ?',
            args: [numNominal, dompet_tujuan_id, userId]
          });
        }
      }

      return res.status(200).json({ success: true, id: txId });
    }

    // DELETE: Delete transaction
    if (req.method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) return res.status(400).json({ error: 'ID transaksi wajib diisi' });

      // Fetch transaction to revert wallet balances
      const oldResult = await db.execute({
        sql: 'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });

      if (oldResult.rows.length > 0) {
        const oldTx = oldResult.rows[0];
        if (oldTx.tipe_tx === 'in' && oldTx.dompet_id) {
          await db.execute({
            sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini - ? WHERE id = ? AND user_id = ?',
            args: [oldTx.nominal, oldTx.dompet_id, userId]
          });
        } else if (oldTx.tipe_tx === 'out' && oldTx.dompet_id) {
          await db.execute({
            sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini + ? WHERE id = ? AND user_id = ?',
            args: [oldTx.nominal, oldTx.dompet_id, userId]
          });
        } else if (oldTx.tipe_tx === 'transfer') {
          if (oldTx.dompet_id) {
            await db.execute({
              sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini + ? WHERE id = ? AND user_id = ?',
              args: [oldTx.nominal, oldTx.dompet_id, userId]
            });
          }
          if (oldTx.dompet_tujuan_id) {
            await db.execute({
              sql: 'UPDATE wallets SET saldo_terkini = saldo_terkini - ? WHERE id = ? AND user_id = ?',
              args: [oldTx.nominal, oldTx.dompet_tujuan_id, userId]
            });
          }
        }
      }

      await db.execute({
        sql: 'DELETE FROM transactions WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Transactions API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

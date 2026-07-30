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
    // GET: List consignment stock
    if (req.method === 'GET') {
      const { partner_id } = req.query || {};
      let sql = 'SELECT * FROM consignment_stock WHERE user_id = ?';
      let args = [userId];

      if (partner_id) {
        sql += ' AND partner_id = ?';
        args.push(partner_id);
      }

      const result = await db.execute({ sql, args });
      return res.status(200).json({ success: true, data: result.rows });
    }

    // POST: Save or update consignment stock
    if (req.method === 'POST') {
      const { partner_id, product_id, qty } = req.body || {};

      if (!partner_id || !product_id) {
        return res.status(400).json({ error: 'Partner ID dan Product ID wajib diisi' });
      }

      const csId = 'cs_' + userId + '_' + partner_id + '_' + product_id;
      const lastUpdated = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO consignment_stock (id, user_id, partner_id, product_id, qty, last_updated)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET qty = ?, last_updated = ?`,
        args: [csId, userId, partner_id, product_id, Number(qty || 0), lastUpdated, Number(qty || 0), lastUpdated]
      });

      return res.status(200).json({ success: true, id: csId });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Consignment API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

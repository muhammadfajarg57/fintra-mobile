import { getDb } from '../../lib/db.js';
import { getAuthUser, signToken } from '../../lib/auth.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  const { action } = req.query;
  const db = getDb();

  // GET /api/auth/me
  if (action === 'me') {
    const authPayload = getAuthUser(req);
    if (!authPayload) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const result = await db.execute({ sql: 'SELECT id, email, phone, name, business_name, created_at FROM users WHERE id = ?', args: [authPayload.uid] });
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const u = result.rows[0];
      return res.status(200).json({ user: { uid: u.id, email: u.email, phone: u.phone, name: u.name, businessName: u.business_name, createdAt: u.created_at } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/auth/login
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { identifier, password } = body;
    if (!identifier || !password) return res.status(400).json({ error: 'Email/HP dan password wajib diisi' });
    try {
      const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ? OR phone = ?', args: [identifier, identifier] });
      if (result.rows.length === 0) return res.status(401).json({ error: 'Email/HP atau password salah' });
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Email/HP atau password salah' });
      const token = signToken({ uid: user.id, email: user.email });
      return res.status(200).json({ token, user: { uid: user.id, email: user.email, phone: user.phone, name: user.name, businessName: user.business_name } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/auth/register
  if (action === 'register') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { email, phone, password, name, businessName } = body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });
    try {
      const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
      if (existing.rows.length > 0) return res.status(409).json({ error: 'Email sudah terdaftar', code: 'auth/email-already-in-use' });
      const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const hash = await bcrypt.hash(password, 10);
      await db.execute({
        sql: 'INSERT INTO users (id, email, phone, password_hash, name, business_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [userId, email, phone || '', hash, name || 'Pemilik', businessName || 'Bisnis Saya', new Date().toISOString()]
      });
      const token = signToken({ uid: userId, email });
      return res.status(200).json({ token, user: { uid: userId, email, phone: phone || '', name: name || 'Pemilik', businessName: businessName || 'Bisnis Saya' } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/auth/google
  if (action === 'google') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { email, name, googleId } = body;
    if (!email) return res.status(400).json({ error: 'Email wajib dari Google Sign-In' });
    try {
      const existing = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
      let user;
      if (existing.rows.length > 0) {
        user = existing.rows[0];
      } else {
        const userId = 'usr_g_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const hash = await bcrypt.hash(googleId || email + Date.now(), 10);
        await db.execute({
          sql: 'INSERT INTO users (id, email, password_hash, name, business_name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          args: [userId, email, hash, name || 'Pengguna Google', 'Bisnis Saya', new Date().toISOString()]
        });
        user = { id: userId, email, name: name || 'Pengguna Google', business_name: 'Bisnis Saya' };
      }
      const token = signToken({ uid: user.id, email: user.email });
      return res.status(200).json({ token, user: { uid: user.id, email: user.email, name: user.name, businessName: user.business_name } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(404).json({ error: 'Auth action not found' });
}

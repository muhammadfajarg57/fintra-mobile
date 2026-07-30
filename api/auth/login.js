import { getDb } from '../lib/db.js';
import { signToken } from '../lib/auth.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { identifier, email, phone, password } = req.body || {};
    const loginId = (identifier || email || phone || '').trim().toLowerCase();

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Email/No HP dan Password wajib diisi' });
    }

    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1',
      args: [loginId, loginId]
    });

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Akun tidak ditemukan. Silakan periksa kembali.' });
    }

    const userRow = result.rows[0];
    const isMatch = await bcrypt.compare(password, userRow.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: 'Password yang Anda masukkan salah.' });
    }

    const user = {
      uid: userRow.id,
      email: userRow.email,
      phone: userRow.phone,
      name: userRow.name,
      businessName: userRow.business_name
    };

    const token = signToken({ uid: userRow.id, email: userRow.email });

    return res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (err) {
    console.error('Login API error:', err);
    return res.status(500).json({ error: err.message || 'Gagal masuk akun' });
  }
}

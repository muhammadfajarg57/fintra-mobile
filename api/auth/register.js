import { getDb } from '../lib/db.js';
import { signToken } from '../lib/auth.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, phone, password, name, businessName } = req.body || {};

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email atau Nomor HP wajib diisi' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const db = getDb();
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    // Check if email already exists
    if (email) {
      const existing = await db.execute({
        sql: 'SELECT id FROM users WHERE email = ?',
        args: [email.toLowerCase().trim()]
      });
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
      }
    }

    // Insert new user
    await db.execute({
      sql: `INSERT INTO users (id, email, phone, password_hash, name, business_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        email ? email.toLowerCase().trim() : null,
        phone || null,
        passwordHash,
        name || 'Mitra finmo',
        businessName || 'Bisnis Saya',
        createdAt
      ]
    });

    // Insert profile
    const profileId = 'prof_' + userId;
    await db.execute({
      sql: `INSERT INTO profiles (id, user_id, business_name, owner_name, phone, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [profileId, userId, businessName || 'Bisnis Saya', name || 'Mitra finmo', phone || '', createdAt]
    });

    // Create default Kas & Bank wallets
    const kasId = 'w_' + userId + '_kas';
    const bankId = 'w_' + userId + '_bank';
    await db.execute({
      sql: `INSERT INTO wallets (id, user_id, nama, jenis, saldo_terkini, saldo_awal, color, is_default, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        kasId, userId, 'Kas Tunai', 'cash', 0, 0, '#0ea5e9', 1, createdAt,
        bankId, userId, 'Bank Utama', 'bank', 0, 0, '#1e40af', 0, createdAt
      ]
    });

    const user = {
      uid: userId,
      email: email || null,
      phone: phone || null,
      name: name || 'Mitra finmo',
      businessName: businessName || 'Bisnis Saya'
    };

    const token = signToken({ uid: userId, email: user.email });

    return res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (err) {
    console.error('Register API error:', err);
    return res.status(500).json({ error: err.message || 'Gagal mendaftar akun' });
  }
}

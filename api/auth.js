import { getDb } from '../lib/db.js';
import { signToken, getAuthUser } from '../lib/auth.js';
import bcrypt from 'bcryptjs';

function getReqBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch(e) { return {}; }
  }
  return req.body;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = getReqBody(req);
  const url = req.url || '';
  const action = body.action || req.query?.action || (url.includes('login') ? 'login' : url.includes('register') ? 'register' : url.includes('google') ? 'google' : 'me');

  if (action === 'login') return handleLogin(req, res, body);
  if (action === 'register') return handleRegister(req, res, body);
  if (action === 'google') return handleGoogle(req, res, body);
  return handleMe(req, res);
}

async function handleLogin(req, res, body) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { identifier, email, phone, password } = body;
  const loginId = (identifier || email || phone || '').trim().toLowerCase();
  if (!loginId || !password) return res.status(400).json({ error: 'Email/No HP dan Password wajib diisi' });

  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1', args: [loginId, loginId] });
  if (result.rows.length === 0) return res.status(400).json({ error: 'Akun tidak ditemukan.' });

  const userRow = result.rows[0];
  const isMatch = await bcrypt.compare(password, userRow.password_hash);
  if (!isMatch) return res.status(400).json({ error: 'Password salah.' });

  const user = { uid: userRow.id, email: userRow.email, phone: userRow.phone, name: userRow.name, businessName: userRow.business_name };
  const token = signToken({ uid: userRow.id, email: userRow.email });
  return res.status(200).json({ success: true, token, user });
}

async function handleRegister(req, res, body) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, phone, password, name, businessName } = body;
  if (!email && !phone) return res.status(400).json({ error: 'Email atau Nomor HP wajib diisi' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });

  const db = getDb();
  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const passwordHash = await bcrypt.hash(password, 10);
  const createdAt = new Date().toISOString();

  if (email) {
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email.toLowerCase().trim()] });
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
  }

  await db.execute({
    sql: 'INSERT INTO users (id, email, phone, password_hash, name, business_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [userId, email ? email.toLowerCase().trim() : null, phone || null, passwordHash, name || 'Mitra finmo', businessName || 'Bisnis Saya', createdAt]
  });

  await db.execute({
    sql: 'INSERT INTO profiles (id, user_id, business_name, owner_name, phone, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: ['prof_' + userId, userId, businessName || 'Bisnis Saya', name || 'Mitra finmo', phone || '', createdAt]
  });

  const kasId = 'w_' + userId + '_kas';
  const bankId = 'w_' + userId + '_bank';
  await db.execute({
    sql: 'INSERT INTO wallets (id, user_id, nama, jenis, saldo_terkini, saldo_awal, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [kasId, userId, 'Kas Tunai', 'cash', 0, 0, '#0ea5e9', 1, createdAt, bankId, userId, 'Bank Utama', 'bank', 0, 0, '#1e40af', 0, createdAt]
  });

  const user = { uid: userId, email: email || null, phone: phone || null, name: name || 'Mitra finmo', businessName: businessName || 'Bisnis Saya' };
  const token = signToken({ uid: userId, email: user.email });
  return res.status(200).json({ success: true, token, user });
}

async function handleGoogle(req, res, body) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, name, avatarUrl } = body;
  if (!email) return res.status(400).json({ error: 'Email Google wajib diisi' });

  const db = getDb();
  const existing = await db.execute({ sql: 'SELECT * FROM users WHERE email = ? LIMIT 1', args: [email.toLowerCase().trim()] });
  let userId, businessName = 'Bisnis Saya';

  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
    businessName = existing.rows[0].business_name || 'Bisnis Saya';
  } else {
    userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const createdAt = new Date().toISOString();
    await db.execute({
      sql: 'INSERT INTO users (id, email, phone, password_hash, name, business_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [userId, email.toLowerCase().trim(), null, 'google_oauth_user', name || 'Mitra finmo', businessName, createdAt]
    });
    await db.execute({
      sql: 'INSERT INTO profiles (id, user_id, business_name, owner_name, avatar_url, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: ['prof_' + userId, userId, businessName, name || 'Mitra finmo', avatarUrl || '', createdAt]
    });
    const kasId = 'w_' + userId + '_kas';
    const bankId = 'w_' + userId + '_bank';
    await db.execute({
      sql: 'INSERT INTO wallets (id, user_id, nama, jenis, saldo_terkini, saldo_awal, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [kasId, userId, 'Kas Tunai', 'cash', 0, 0, '#0ea5e9', 1, createdAt, bankId, userId, 'Bank Utama', 'bank', 0, 0, '#1e40af', 0, createdAt]
    });
  }

  const user = { uid: userId, email: email, name: name || 'Mitra finmo', businessName: businessName };
  const token = signToken({ uid: userId, email });
  return res.status(200).json({ success: true, token, user });
}

async function handleMe(req, res) {
  const authPayload = getAuthUser(req);
  if (!authPayload) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  const result = await db.execute({ sql: 'SELECT id, email, phone, name, business_name FROM users WHERE id = ? LIMIT 1', args: [authPayload.uid] });
  if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

  const userRow = result.rows[0];
  const user = { uid: userRow.id, email: userRow.email, phone: userRow.phone, name: userRow.name, businessName: userRow.business_name };
  const profResult = await db.execute({ sql: 'SELECT * FROM profiles WHERE user_id = ? LIMIT 1', args: [authPayload.uid] });
  return res.status(200).json({ success: true, user, profile: profResult.rows[0] || null });
}
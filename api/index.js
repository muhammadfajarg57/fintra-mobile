import { getDb } from '../lib/db.js';
import { signToken, getAuthUser } from '../lib/auth.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawUrl = req.url || '';
  const urlObj = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
  const path = urlObj.pathname.toLowerCase();

  try {
    // 1. AUTH ENDPOINTS
    if (path.includes('/auth/login') || path.includes('/auth?action=login')) {
      return handleLogin(req, res);
    }
    if (path.includes('/auth/register') || path.includes('/auth?action=register')) {
      return handleRegister(req, res);
    }
    if (path.includes('/auth/google') || path.includes('/auth?action=google')) {
      return handleGoogle(req, res);
    }
    if (path.includes('/auth/me') || path.includes('/auth?action=me')) {
      return handleMe(req, res);
    }

    // Authenticated endpoints require auth payload
    const authUser = getAuthUser(req);
    const uid = authUser?.uid || 'usr_demo';

    // 2. WALLETS
    if (path.includes('/wallets')) {
      return handleWallets(req, res, uid);
    }

    // 3. TRANSACTIONS
    if (path.includes('/transactions')) {
      return handleTransactions(req, res, uid);
    }

    // 4. PARTNERS
    if (path.includes('/partners')) {
      return handlePartners(req, res, uid);
    }

    // 5. PRODUCTS
    if (path.includes('/products')) {
      return handleProducts(req, res, uid);
    }

    // 6. RAW MATERIALS
    if (path.includes('/raw-materials')) {
      return handleRawMaterials(req, res, uid);
    }

    // 7. CONSIGNMENT
    if (path.includes('/consignment')) {
      return handleConsignment(req, res, uid);
    }

    // 8. CATEGORIES
    if (path.includes('/categories')) {
      return handleCategories(req, res, uid);
    }

    // 9. PROFILE
    if (path.includes('/profile')) {
      return handleProfile(req, res, uid);
    }

    // 10. AI CHAT
    if (path.includes('/ai-chat')) {
      return handleAiChat(req, res);
    }

    // 11. INIT DB
    if (path.includes('/init-db')) {
      return handleInitDb(req, res);
    }

    return res.status(404).json({ error: 'Endpoint API tidak ditemukan: ' + path });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || 'Server API Error' });
  }
}

// --- HANDLERS IMPLEMENTATION ---

async function handleLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { identifier, email, phone, password } = req.body || {};
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

async function handleRegister(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, phone, password, name, businessName } = req.body || {};
  if (!email && !phone) return res.status(400).json({ error: 'Email atau Nomor HP wajib diisi' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });

  const db = getDb();
  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const passwordHash = await bcrypt.hash(password, 10);
  const createdAt = new Date().toISOString();

  if (email) {
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email.toLowerCase().trim()] });
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar.' });
  }

  await db.execute({
    sql: `INSERT INTO users (id, email, phone, password_hash, name, business_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [userId, email ? email.toLowerCase().trim() : null, phone || null, passwordHash, name || 'Mitra finmo', businessName || 'Bisnis Saya', createdAt]
  });

  await db.execute({
    sql: `INSERT INTO profiles (id, user_id, business_name, owner_name, phone, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['prof_' + userId, userId, businessName || 'Bisnis Saya', name || 'Mitra finmo', phone || '', createdAt]
  });

  const kasId = 'w_' + userId + '_kas';
  const bankId = 'w_' + userId + '_bank';
  await db.execute({
    sql: `INSERT INTO wallets (id, user_id, nama, jenis, saldo_terkini, saldo_awal, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [kasId, userId, 'Kas Tunai', 'cash', 0, 0, '#0ea5e9', 1, createdAt, bankId, userId, 'Bank Utama', 'bank', 0, 0, '#1e40af', 0, createdAt]
  });

  const user = { uid: userId, email: email || null, phone: phone || null, name: name || 'Mitra finmo', businessName: businessName || 'Bisnis Saya' };
  const token = signToken({ uid: userId, email: user.email });
  return res.status(200).json({ success: true, token, user });
}

async function handleGoogle(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, name, avatarUrl } = req.body || {};
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
      sql: `INSERT INTO users (id, email, phone, password_hash, name, business_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, email.toLowerCase().trim(), null, 'google_oauth_user', name || 'Mitra finmo', businessName, createdAt]
    });
    await db.execute({
      sql: `INSERT INTO profiles (id, user_id, business_name, owner_name, avatar_url, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['prof_' + userId, userId, businessName, name || 'Mitra finmo', avatarUrl || '', createdAt]
    });
    const kasId = 'w_' + userId + '_kas';
    const bankId = 'w_' + userId + '_bank';
    await db.execute({
      sql: `INSERT INTO wallets (id, user_id, nama, jenis, saldo_terkini, saldo_awal, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [kasId, userId, 'Kas Tunai', 'cash', 0, 0, '#0ea5e9', 1, createdAt, bankId, userId, 'Bank Utama', 'bank', 0, 0, '#1e40af', 0, createdAt]
    });
  }

  const user = { uid: userId, email, name: name || 'Mitra finmo', businessName };
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

async function handleWallets(req, res, uid) {
  const db = getDb();
  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM wallets WHERE user_id = ? ORDER BY created_at ASC', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const { id, nama, jenis, saldo_terkini, saldo_awal, color, is_default } = req.body || {};
    const wId = id || 'w_' + uid + '_' + Date.now();
    const createdAt = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO wallets (id, user_id, nama, jenis, saldo_terkini, saldo_awal, color, is_default, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET nama=excluded.nama, jenis=excluded.jenis, saldo_terkini=excluded.saldo_terkini, color=excluded.color, is_default=excluded.is_default`,
      args: [wId, uid, nama || 'Kas', jenis || 'cash', saldo_terkini || 0, saldo_awal || 0, color || '#0ea5e9', is_default ? 1 : 0, createdAt]
    });
    return res.status(200).json({ success: true, id: wId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: 'ID dompet wajib diisi' });
    await db.execute({ sql: 'DELETE FROM wallets WHERE id = ? AND user_id = ?', args: [id, uid] });
    return res.status(200).json({ success: true });
  }
}

async function handleTransactions(req, res, uid) {
  const db = getDb();
  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM transactions WHERE user_id = ? ORDER BY tanggal DESC', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const data = req.body || {};
    const txId = data.id || 'tx_' + uid + '_' + Date.now();
    const tanggal = data.tanggal || new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO transactions (id, user_id, tipe, jumlah, dompet_id, dompet_asal_id, dompet_tujuan_id, kategori, catatan, pelanggan, foto_url, status, items_json, tanggal, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET tipe=excluded.tipe, jumlah=excluded.jumlah, dompet_id=excluded.dompet_id, kategori=excluded.kategori, catatan=excluded.catatan, items_json=excluded.items_json`,
      args: [txId, uid, data.tipe || 'pemasukan', data.jumlah || 0, data.dompet_id || null, data.dompet_asal_id || null, data.dompet_tujuan_id || null, data.kategori || 'Umum', data.catatan || '', data.pelanggan || '', data.foto_url || '', data.status || 'selesai', typeof data.items_json === 'object' ? JSON.stringify(data.items_json) : (data.items_json || '[]'), tanggal, new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: txId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: 'ID transaksi wajib diisi' });
    await db.execute({ sql: 'DELETE FROM transactions WHERE id = ? AND user_id = ?', args: [id, uid] });
    return res.status(200).json({ success: true });
  }
}

async function handlePartners(req, res, uid) {
  const db = getDb();
  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM partners WHERE user_id = ? ORDER BY created_at DESC', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const d = req.body || {};
    const pId = d.id || 'p_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO partners (id, user_id, nama_toko, nama_partner, pemilik, telepon, alamat, catatan, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET nama_toko=excluded.nama_toko, nama_partner=excluded.nama_partner, pemilik=excluded.pemilik, telepon=excluded.telepon, alamat=excluded.alamat, catatan=excluded.catatan`,
      args: [pId, uid, d.nama_toko || d.nama_partner || 'Mitra', d.nama_partner || '', d.pemilik || '', d.telepon || '', d.alamat || '', d.catatan || '', new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: pId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    await db.execute({ sql: 'DELETE FROM partners WHERE id = ? AND user_id = ?', args: [id, uid] });
    return res.status(200).json({ success: true });
  }
}

async function handleProducts(req, res, uid) {
  const db = getDb();
  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC', args: [uid] });
    const products = result.rows.map(p => ({
      ...p,
      resep: p.resep ? JSON.parse(p.resep) : []
    }));
    return res.status(200).json({ success: true, data: products });
  }
  if (req.method === 'POST') {
    const d = req.body || {};
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

async function handleRawMaterials(req, res, uid) {
  const db = getDb();
  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM raw_materials WHERE user_id = ? ORDER BY created_at DESC', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const d = req.body || {};
    const matId = d.id || 'mat_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO raw_materials (id, user_id, nama, satuan, stok, total_nilai, hpp_rata_rata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET nama=excluded.nama, satuan=excluded.satuan, stok=excluded.stok, total_nilai=excluded.total_nilai, hpp_rata_rata=excluded.hpp_rata_rata`,
      args: [matId, uid, d.nama || 'Bahan Baku', d.satuan || 'pcs', d.stok || 0, d.total_nilai || 0, d.hpp_rata_rata || 0, new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: matId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    await db.execute({ sql: 'DELETE FROM raw_materials WHERE id = ? AND user_id = ?', args: [id, uid] });
    return res.status(200).json({ success: true });
  }
}

async function handleConsignment(req, res, uid) {
  const db = getDb();
  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM consignment_stock WHERE user_id = ? ORDER BY created_at DESC', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const d = req.body || {};
    const cId = d.id || 'cs_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO consignment_stock (id, user_id, partner_id, product_id, jumlah_titip, jumlah_terjual, sisa_stok, hpp_satuan, harga_jual_satuan, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET jumlah_titip=excluded.jumlah_titip, jumlah_terjual=excluded.jumlah_terjual, sisa_stok=excluded.sisa_stok, status=excluded.status`,
      args: [cId, uid, d.partner_id || '', d.product_id || '', d.jumlah_titip || 0, d.jumlah_terjual || 0, d.sisa_stok || 0, d.hpp_satuan || 0, d.harga_jual_satuan || 0, d.status || 'aktif', new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: cId });
  }
}

async function handleCategories(req, res, uid) {
  const db = getDb();
  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM categories WHERE user_id = ?', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows });
  }
  if (req.method === 'POST') {
    const d = req.body || {};
    const catId = 'cat_' + uid + '_' + Date.now();
    await db.execute({
      sql: `INSERT INTO categories (id, user_id, nama, type, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [catId, uid, d.nama || 'Kategori Baru', d.type || 'tx_category', new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: catId });
  }
}

async function handleProfile(req, res, uid) {
  const db = getDb();
  if (req.method === 'GET') {
    const result = await db.execute({ sql: 'SELECT * FROM profiles WHERE user_id = ? LIMIT 1', args: [uid] });
    return res.status(200).json({ success: true, data: result.rows[0] || {} });
  }
  if (req.method === 'POST') {
    const d = req.body || {};
    const profId = 'prof_' + uid;
    await db.execute({
      sql: `INSERT INTO profiles (id, user_id, business_name, owner_name, phone, address, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET business_name=excluded.business_name, owner_name=excluded.owner_name, phone=excluded.phone, address=excluded.address, updated_at=excluded.updated_at`,
      args: [profId, uid, d.nama_toko || d.business_name || 'Bisnis Saya', d.nama_pemilik || d.owner_name || 'Pemilik', d.telepon || d.phone || '', d.alamat || d.address || '', new Date().toISOString()]
    });
    return res.status(200).json({ success: true, id: profId });
  }
}

async function handleAiChat(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt wajib diisi' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(200).json({ reply: 'Finmo AI Assistant aktif. (Konfigurasikan GEMINI_API_KEY di Vercel untuk analisis bisnis AI mendalam).' });

  try {
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await geminiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, AI belum dapat memproses pertanyaan saat ini.';
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Gagal menghubungi AI Service' });
  }
}

async function handleInitDb(req, res) {
  try {
    const db = getDb();
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, phone TEXT, password_hash TEXT, name TEXT, business_name TEXT, created_at TEXT);`,
      `CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, user_id TEXT UNIQUE, business_name TEXT, owner_name TEXT, phone TEXT, address TEXT, avatar_url TEXT, updated_at TEXT);`,
      `CREATE TABLE IF NOT EXISTS wallets (id TEXT PRIMARY KEY, user_id TEXT, nama TEXT, jenis TEXT, saldo_terkini REAL DEFAULT 0, saldo_awal REAL DEFAULT 0, color TEXT, is_default INTEGER DEFAULT 0, created_at TEXT);`,
      `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, user_id TEXT, tipe TEXT, jumlah REAL DEFAULT 0, dompet_id TEXT, dompet_asal_id TEXT, dompet_tujuan_id TEXT, kategori TEXT, catatan TEXT, pelanggan TEXT, foto_url TEXT, status TEXT DEFAULT 'selesai', items_json TEXT, tanggal TEXT, created_at TEXT);`,
      `CREATE TABLE IF NOT EXISTS partners (id TEXT PRIMARY KEY, user_id TEXT, nama_toko TEXT, nama_partner TEXT, pemilik TEXT, telepon TEXT, alamat TEXT, catatan TEXT, created_at TEXT);`,
      `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, user_id TEXT, nama TEXT, barcode TEXT, sku TEXT, harga_jual REAL DEFAULT 0, last_hpp_satuan REAL DEFAULT 0, stok_gudang REAL DEFAULT 0, kategori TEXT, foto_url TEXT, resep TEXT, created_at TEXT);`,
      `CREATE TABLE IF NOT EXISTS raw_materials (id TEXT PRIMARY KEY, user_id TEXT, nama TEXT, satuan TEXT, stok REAL DEFAULT 0, total_nilai REAL DEFAULT 0, hpp_rata_rata REAL DEFAULT 0, created_at TEXT);`,
      `CREATE TABLE IF NOT EXISTS consignment_stock (id TEXT PRIMARY KEY, user_id TEXT, partner_id TEXT, product_id TEXT, jumlah_titip REAL DEFAULT 0, jumlah_terjual REAL DEFAULT 0, sisa_stok REAL DEFAULT 0, hpp_satuan REAL DEFAULT 0, harga_jual_satuan REAL DEFAULT 0, status TEXT DEFAULT 'aktif', created_at TEXT);`,
      `CREATE TABLE IF NOT EXISTS stock_batches (id TEXT PRIMARY KEY, user_id TEXT, material_id TEXT, sisa_stok REAL DEFAULT 0, hpp_satuan REAL DEFAULT 0, created_at TEXT);`,
      `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, user_id TEXT, nama TEXT, type TEXT, created_at TEXT);`
    ];

    for (const sql of tables) {
      await db.execute(sql);
    }
    return res.status(200).json({ success: true, message: 'Database Turso initialized successfully!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

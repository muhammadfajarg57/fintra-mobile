import { getDb } from '../lib/db.js';

export default async function handler(req, res) {
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
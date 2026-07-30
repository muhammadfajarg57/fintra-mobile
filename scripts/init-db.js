import { getDb } from '../api/lib/db.js';

async function init() {
  console.log('Initializing Turso DB Schema...');
  try {
    const db = getDb();

    // 1. Users Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT,
        password_hash TEXT,
        name TEXT,
        business_name TEXT,
        role TEXT DEFAULT 'mitra',
        created_at TEXT
      );
    `);

    // 2. Profiles Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        business_name TEXT,
        owner_name TEXT,
        phone TEXT,
        address TEXT,
        business_category TEXT,
        avatar_url TEXT,
        updated_at TEXT
      );
    `);

    // 3. Wallets Table (Rekening/Dompet)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        nama TEXT NOT NULL,
        jenis TEXT,
        saldo_terkini REAL DEFAULT 0,
        saldo_awal REAL DEFAULT 0,
        no_rekening TEXT,
        atas_nama TEXT,
        color TEXT,
        is_default INTEGER DEFAULT 0,
        created_at TEXT
      );
    `);

    // 4. Transactions Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tipe_tx TEXT NOT NULL,
        nominal REAL NOT NULL,
        kategori TEXT,
        dompet_id TEXT,
        dompet_tujuan_id TEXT,
        tanggal TEXT,
        tanggal_iso TEXT,
        catatan TEXT,
        foto_bukti TEXT,
        created_at TEXT
      );
    `);

    // 5. Partners Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        nama TEXT NOT NULL,
        jenis TEXT,
        hp TEXT,
        alamat TEXT,
        total_piutang REAL DEFAULT 0,
        created_at TEXT
      );
    `);

    // 6. Products Table (Stok Barang Jadi)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        nama TEXT NOT NULL,
        kategori TEXT,
        harga_jual REAL DEFAULT 0,
        harga_modal REAL DEFAULT 0,
        stok_gudang REAL DEFAULT 0,
        unit TEXT,
        min_stok REAL DEFAULT 0,
        resep TEXT,
        created_at TEXT
      );
    `);

    // 7. Raw Materials Table (Stok Bahan Baku)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS raw_materials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        nama TEXT NOT NULL,
        stok_aktif REAL DEFAULT 0,
        satuan TEXT,
        avg_cost REAL DEFAULT 0,
        min_stok REAL DEFAULT 0,
        supplier TEXT,
        created_at TEXT
      );
    `);

    // 8. Consignment Stock Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS consignment_stock (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        partner_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        qty REAL DEFAULT 0,
        last_updated TEXT
      );
    `);

    // 9. Stock Batches Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS stock_batches (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        qty REAL DEFAULT 0,
        buy_price REAL DEFAULT 0,
        created_at TEXT
      );
    `);

    // 10. Categories Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        nama TEXT NOT NULL,
        type TEXT NOT NULL
      );
    `);

    console.log('SUCCESS! Turso DB Schema initialized successfully!');
  } catch (err) {
    console.error('FAILED to initialize Turso DB:', err);
  }
}

init();

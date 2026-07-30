# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## finMo — Aplikasi Manajemen Keuangan & Operasional UMKM

---

> **Versi Dokumen:** 1.0
> **Tanggal:** Juli 2026
> **Status:** Living Document
> **Platform:** Progressive Web App (PWA) — Mobile-first, Responsive untuk Desktop

---

## DAFTAR ISI

1. [Latar Belakang & Visi Produk](#1-latar-belakang--visi-produk)
2. [Konsep & Positioning Aplikasi](#2-konsep--positioning-aplikasi)
3. [Target Pengguna](#3-target-pengguna)
4. [Arsitektur Teknis](#4-arsitektur-teknis)
5. [Sistem Desain (Design System)](#5-sistem-desain-design-system)
6. [Alur Pengguna (User Flow)](#6-alur-pengguna-user-flow)
7. [Sistem Akuntansi yang Digunakan](#7-sistem-akuntansi-yang-digunakan)
8. [Modul & Fitur Lengkap](#8-modul--fitur-lengkap)
9. [Model Data & Skema Firestore](#9-model-data--skema-firestore)
10. [Logika Bisnis Inti](#10-logika-bisnis-inti)
11. [Laporan Keuangan](#11-laporan-keuangan)
12. [Integrasi AI (Gemini API)](#12-integrasi-ai-gemini-api)
13. [Manajemen State & Routing](#13-manajemen-state--routing)
14. [Keamanan & Autentikasi](#14-keamanan--autentikasi)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Roadmap & Future Enhancements](#16-roadmap--future-enhancements)

---

## 1. LATAR BELAKANG & VISI PRODUK

### 1.1 Latar Belakang

Mayoritas UMKM (Usaha Mikro, Kecil, dan Menengah) di Indonesia masih mengelola keuangan secara manual — menggunakan buku kas, catatan di kertas, atau spreadsheet yang tidak terintegrasi. Hal ini menyebabkan:

- **Ketidakakuratan data** karena pencatatan manual yang rawan kesalahan.
- **Tidak ada visibilitas real-time** terhadap kondisi keuangan bisnis.
- **Sulit membuat keputusan bisnis** karena tidak ada laporan yang terstruktur.
- **Manajemen stok yang buruk** — kekurangan atau kelebihan stok yang tidak terdeteksi.
- **Piutang tidak terlacak** — terutama bagi bisnis dengan sistem konsinyasi/titipan ke toko.

### 1.2 Visi Produk

**finMo** hadir sebagai solusi manajemen keuangan dan operasional terpadu yang dirancang khusus untuk UMKM. Visi produk:

> *"Menjadi sistem ERP (Enterprise Resource Planning) ringan yang dapat digunakan oleh siapapun — bahkan tanpa latar belakang akuntansi — untuk mengelola keuangan, stok, dan operasional bisnis secara profesional."*

### 1.3 Misi

- Menyederhanakan pencatatan keuangan dengan antarmuka yang intuitif.
- Mengotomasi perhitungan akuntansi (HPP, laba/rugi, neraca, arus kas) di belakang layar.
- Memberikan laporan keuangan standar tanpa memerlukan akuntan.
- Mendukung model bisnis konsinyasi/titipan yang umum di UMKM Indonesia.
- Mengintegrasikan kecerdasan buatan untuk mempercepat proses operasional.

---

## 2. KONSEP & POSITIONING APLIKASI

### 2.1 Positioning

finMo diposisikan sebagai **"Akuntansi + ERP untuk UMKM yang tidak butuh akuntan"** — sebuah aplikasi yang:

- **Bukan sekadar aplikasi kasir:** finMo mengelola keseluruhan siklus bisnis dari pembelian bahan baku, produksi, distribusi, penjualan, hingga laporan keuangan.
- **Bukan software akuntansi yang rumit:** Semua jurnal akuntansi dibuat secara otomatis di belakang layar. Pengguna hanya perlu mencatat kejadian bisnis nyata.
- **Mobile-first tapi siap desktop:** Antarmuka dioptimalkan untuk smartphone, namun nyaman di layar lebar.

### 2.2 Unique Value Proposition

| Aspek | finMo | Aplikasi Kasir Biasa | Software Akuntansi |
|---|---|---|---|
| Manajemen Bahan Baku | ✅ | ❌ | ✅ |
| Sistem Konsinyasi | ✅ | ❌ | ❌ |
| FIFO Stok Otomatis | ✅ | ❌ | ❌ |
| Laporan Laba/Rugi | ✅ | Terbatas | ✅ |
| AI Scan Nota | ✅ | ❌ | ❌ |
| AI Business Advisor | ✅ | ❌ | ❌ |
| Mudah Digunakan | ✅ | ✅ | ❌ |
| Barcode Scanner | ✅ | ✅ | ❌ |
| Real-time Cloud Sync | ✅ | Tergantung | ✅ |

### 2.3 Nama & Identitas Brand

- **Nama Produk:** finMo *(Finance + Mobile)*
- **Tagline:** Kelola bisnis lebih cerdas, lebih mudah.
- **Logo:** "fM." — italic, bold, background gradient ungu.
- **Brand Color:** `#4300e1` — "Royal Prism Purple" — kepercayaan, kecerdasan, modernitas.

---

## 3. TARGET PENGGUNA

### 3.1 Persona Utama

**Persona 1: Budi — Pemilik UMKM Makanan Ringan**
- Bisnis: Produksi keripik singkong, dititipkan ke warung & minimarket lokal.
- Pain Points: Sulit lacak piutang per warung, stok tersebar, laba tidak jelas.
- Kebutuhan: Catat distribusi titipan, terima setoran, tampilkan laba bersih.

**Persona 2: Rina — Pemilik Toko Sembako**
- Bisnis: Toko kelontong dengan berbagai produk.
- Pain Points: Kasir manual, tidak tahu produk laris, uang masuk-keluar tidak tercatat.
- Kebutuhan: Kasir POS sederhana, rekap transaksi, stok auto-update.

**Persona 3: Dian — Pengusaha Online**
- Bisnis: Produk kecantikan dengan banyak SKU, beli bahan dari supplier.
- Pain Points: Terlalu banyak aplikasi terpisah untuk kasir, stok, dan keuangan.
- Kebutuhan: Satu platform terintegrasi: bahan → produksi → stok → laporan.

### 3.2 Jenis Usaha yang Didukung

- Produksi makanan/minuman (kue, snack, katering)
- Kerajinan tangan / handmade
- Toko kelontong / retail
- Bisnis konsinyasi / titipan
- Jasa dengan pembelian bahan baku
- Dropshipper / reseller

---

## 4. ARSITEKTUR TEKNIS

### 4.1 Stack Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | Vanilla HTML5 + JavaScript (ES Modules) |
| Styling | Tailwind CSS v3 (via CDN) |
| Database | Google Cloud Firestore (NoSQL) |
| Autentikasi | Firebase Authentication (Email/Password) |
| Storage | Firebase Storage (foto struk/produk) |
| AI / LLM | Google Gemini API (gemini-1.5-flash) |
| Charts | Chart.js |
| PDF Export | html2pdf.js |
| Barcode Scanner | html5-qrcode library |
| Font | Inter (body), Plus Jakarta Sans (heading) |
| Icons | Material Symbols Rounded (Google Fonts) |

### 4.2 Arsitektur Aplikasi

```
finMo (SPA - Single Page Application)
├── index.html         ← Shell HTML statis: semua modal & layout
├── app.js             ← Seluruh logika aplikasi (~5,644 baris)
│   ├── Firebase Init  ← Inisialisasi Firestore & Auth
│   ├── Helpers        ← safeToDate, safeToMillis, formatRupiah
│   ├── Templates      ← Template literal HTML per halaman
│   ├── Page Loaders   ← Fungsi async fetch data per halaman
│   ├── MapsTo()       ← Router utama SPA
│   ├── Event Handlers ← Delegated event listeners
│   └── AI Functions   ← callGemini, chat AI, scan nota AI
└── PRD.md             ← Dokumen ini
```

### 4.3 Pola Arsitektur

- **SPA Pattern:** Navigasi dengan mengganti `innerHTML` dari elemen `#app-content`.
- **Template Literal Pattern:** Setiap halaman adalah variabel string template yang di-inject ke DOM.
- **Delegated Event Listening:** Event listener di level `document` untuk elemen yang di-inject dinamis.
- **Firestore Atomic Transactions:** Operasi multi-dokumen menggunakan `runTransaction()` untuk atomicity.

### 4.4 Firestore Collections

```
Firestore Database
├── users/              ← Data dasar pengguna
├── profiles/           ← Profil bisnis lengkap
├── wallets/            ← Rekening / kas bisnis
├── transactions/       ← Semua jurnal transaksi (koleksi utama)
├── products/           ← Master data produk jadi
├── raw_materials/      ← Master data bahan baku
├── stock_batches/      ← Batch produksi (untuk FIFO)
├── partners/           ← Data mitra / konsinyasi
├── consignment_stock/  ← Stok titipan per mitra per produk
├── product_categories/ ← Kategori produk kustom
└── product_units/      ← Satuan produk kustom
```

---

## 5. SISTEM DESAIN (DESIGN SYSTEM)

### 5.1 Tema: "Royal Prism"

Palet warna berbasis ungu kerajaan — kepercayaan, kecerdasan, dan modernitas.

### 5.2 Palet Warna

| Token | Hex | Penggunaan |
|---|---|---|
| `primary` | `#4300e1` | Tombol utama, elemen aktif, brand color |
| `primary-hover` | `#3300b0` | Hover state |
| `primary-light` | `#8e5bff` | Aksen ringan |
| `background` | `#faf8ff` | Background halaman |
| `surface` | `#faf8ff` | Background card/modal |
| `surface-container` | `#eaedff` | Background section |
| `on-surface` | `#131b2e` | Teks utama |
| `on-surface-variant` | `#474557` | Teks sekunder |
| `outline-variant` | `#c9c4da` | Border/divider |
| `success` | `#10b981` | Transaksi masuk, profit positif |
| `error` | `#ba1a1a` | Transaksi keluar, error |
| `warning` | `#f59e0b` | Peringatan |

### 5.3 Gradien

| Token | Nilai | Penggunaan |
|---|---|---|
| `gradient-ocean` | `135deg, #4300e1 → #5c33ff` | Hero cards, tombol CTA utama |
| `gradient-aurora` | `135deg, #5c33ff → #a855f7` | Aksen dekoratif |
| `gradient-success` | `135deg, #10b981 → #14b8a6` | Elemen positif |

### 5.4 Tipografi

- **Heading:** Plus Jakarta Sans (400–700)
- **Body:** Inter (400–700)
- **Hierarchy:** class `font-heading` untuk judul, `font-sans` untuk body.

### 5.5 Layout Responsif

- **Mobile (< 768px):** Single column, bottom navigation bar (5 item + floating POS button).
- **Desktop (md+):** Sidebar kiri 256px + konten utama, tidak ada bottom navbar.
- **Konten:** max-w-7xl, padding `px-4 sm:px-6 lg:px-8`.

---

## 6. ALUR PENGGUNA (USER FLOW)

### 6.1 Alur Registrasi & Onboarding

```
Buka Aplikasi
  → Halaman Sign In (default jika belum login)
  → Tap "Buat Akun"
  → Halaman Sign Up
      Input: Nama Toko, Nama Pemilik, Email, Password, Jenis Usaha
  → Firebase Auth: createUserWithEmailAndPassword()
  → Buat dokumen /users/{uid} & /profiles/{uid}
  → Inisialisasi Dompet Default (Kas Tunai & Bank)
  → onAuthStateChanged() trigger → MapsTo('dashboard')
  → DASHBOARD
```

### 6.2 Alur Login

```
Buka Aplikasi
  → onAuthStateChanged() check:
      User logged in → MapsTo('dashboard')
      User not logged in → MapsTo('signin')
  → Isi form & submit
  → Firebase Auth: signInWithEmailAndPassword()
  → onAuthStateChanged() trigger → MapsTo('dashboard')
```

### 6.3 Alur Mencatat Transaksi Kas

```
Tap FAB (+)
  → Modal "Pilih Aksi":
      - Scan Nota AI → Modal Scan Nota → Auto-fill Form
      - Transaksi Baru → Modal Catat Transaksi
      - Kasir POS → Halaman POS
      - Stok & Produk → Halaman Produk
      - Stok Bahan Baku → Halaman Bahan Baku
  → Modal Catat Transaksi:
      Input: Tipe (Masuk/Keluar/Transfer), Nominal, Kategori,
             Rekening, Tanggal, Catatan, Foto Struk (opsional)
  → Submit → Validasi saldo
  → runTransaction():
      ✓ Update saldo wallet
      ✓ Simpan transaksi ke /transactions/{id}
  → Refresh Dashboard & Transaction List
```

### 6.4 Alur Kasir POS

```
MapsTo('pos')
  → Fetch products (uid == currentUser.uid)
  → Tampilkan Grid Produk
  → Tap produk → addToPosCart()
      Stok habis → Alert "Stok habis!"
      Stok ada → Tambah ke cart
  → Tap Cart Footer → Modal Checkout:
      - List item dengan kontrol qty (+-)
      - Input uang diterima → kembalian real-time
      - Pilih rekening penerimaan
  → Submit → runTransaction() Atomic:
      Per item: Kurangi stok_gudang, FIFO batch deplesi, Jurnal Beban HPP
      Jurnal Pendapatan (in) ke wallet
      Tambah saldo wallet
  → Clear cart, refresh POS
```

### 6.5 Alur Konsinyasi — Distribusi ke Mitra

```
Halaman Mitra → Tap "Distribusi Stok"
  → Modal Distribusi Stok:
      Input: Mitra, Produk, Qty, Harga Setoran/pcs
      Preview: Total Piutang yang timbul
  → Submit → runTransaction() Atomic:
      ✓ Kurangi stok_gudang produk
      ✓ FIFO: Kurangi qty_sisa batch tertua
      ✓ Tambah total_piutang mitra
      ✓ Buat/Update consignment_stock
      ✓ Jurnal: 'Distribusi Stok' (in, piutang)
      ✓ Jurnal: 'Beban HPP' (out, persediaan)
  → Refresh Halaman Mitra
```

### 6.6 Alur Catat Penjualan Konsinyasi (Retur + Setoran)

```
Halaman Mitra → Tap mitra → Pilih "Catat Penjualan"
  → Modal Catat Penjualan:
      Input: Produk (dari titipan), Qty Laku
      Jika ada sisa: Input Qty Bagus + Qty Rusak
      Validasi: Laku + Bagus + Rusak = Total Titipan
      Input: Jumlah Uang Diterima, Rekening Penerimaan
  → Submit → runTransaction() Complex Atomic:
      A. Kurangi consignment_stock qty_titipan
      B. Kurangi total_piutang mitra
      C. Jika setoran: Tambah saldo + Jurnal 'Setoran Piutang Mitra' (in)
      D. Jika barang BAGUS kembali:
            Tambah stok_gudang + Buat batch baru
            Jurnal 'Retur Penjualan' (out)
            Jurnal 'Kredit Beban HPP' (out, nominal NEGATIF)
      E. Jika barang RUSAK:
            Jurnal 'Retur Penjualan' (out)
            Jurnal 'Beban Kerugian Barang Rusak' (out, HPP modal)
            Jurnal 'Kredit Beban HPP' (out, nominal NEGATIF)
  → Refresh Halaman Mitra
```

### 6.7 Alur Produksi / Restock

```
Halaman Produk → Tap "Restock (Produksi)"
  → Modal Restock:
      Input: Produk, Qty Produksi, Tanggal Produksi
      Input BOM: Pilih Bahan Baku + Qty Per Unit (multi-row)
      Auto-kalkulasi:
          Total HPP = Σ(avg_cost bahan × qty pakai)
          HPP Satuan = Total HPP / Qty Produksi
          Rekomendasi Harga Jual = HPP Satuan × (1 + margin%)
      Input: Harga Jual (auto-filled, bisa di-override)
      Input: Rekening (jika ada biaya tambahan non-bahan)
  → Submit → runTransaction() Atomic:
      ✓ Tambah stok_gudang produk
      ✓ Update: last_hpp_satuan, last_harga_jual, harga_jual, last_hpp_items
      ✓ Buat batch baru di /stock_batches (hpp + tanggal_produksi untuk FIFO)
      ✓ Per bahan baku: Kurangi stok_aktif di /raw_materials
      ✓ Jurnal: 'Persediaan Barang Jadi' (in, persediaan)
      ✓ Jurnal: 'Persediaan Bahan Baku' (out, persediaan)
      ✓ Jika biaya tambahan: Potong saldo + Jurnal pengeluaran
  → Refresh Halaman Produk
```

### 6.8 Alur Pembelian Bahan Baku

```
Halaman Bahan Baku → Tap "Beli Bahan Baku"
  → Modal Tambah Bahan Baku:
      Input: Nama (autocomplete datalist), Kategori, Satuan
      Input: Qty Beli, Total Harga Beli
      Input: Rekening Pembayaran, Tanggal, Keterangan
  → Kalkulasi: Harga Per Unit = Total Harga / Qty
  → Submit → runTransaction() Atomic:
      Jika bahan baku BARU:
          Buat dokumen baru di /raw_materials
          Set stok_aktif = qty, avg_cost = harga per unit
      Jika SUDAH ADA (Moving Average):
          avg_cost = (stok_lama × avg_cost_lama + total_harga) / (stok_lama + qty)
          stok_aktif += qty
      Kurangi saldo rekening pembayaran
      Jurnal: 'Persediaan Bahan Baku' (out) dari rekening
  → Refresh Halaman Bahan Baku
```

---

## 7. SISTEM AKUNTANSI YANG DIGUNAKAN

### 7.1 Metode: Perpetual Inventory System

finMo menggunakan Perpetual Inventory System — setiap pergerakan stok (produksi, penjualan, distribusi, retur) langsung menciptakan jurnal akuntansi secara otomatis dan real-time.

### 7.2 Metode Penilaian Persediaan

#### a. Moving Average (Weighted Average) — untuk Bahan Baku

Setiap pembelian bahan baku baru memperbarui harga rata-rata:

```
avg_cost_baru = (stok_lama × avg_cost_lama + total_pembelian_baru)
                ÷ (stok_lama + qty_beli_baru)
```

Fluktuasi harga bahan baku diserap secara merata.

#### b. FIFO (First In, First Out) — untuk Produk Jadi

Setiap batch produksi tercatat di `/stock_batches` dengan `tanggal_produksi`.
Saat jual/distribusi: batch dengan tanggal TERLAMA dikonsumsi dulu.

Keuntungan:
- HPP penjualan mencerminkan biaya produksi sesungguhnya.
- Stok lama terjual duluan → mengurangi risiko kedaluwarsa.

### 7.3 Struktur Akun (Chart of Accounts)

#### Akun Aset

| Akun | Representasi dalam finMo |
|---|---|
| Kas & Bank | `saldo_terkini >= 0` dari `/wallets` |
| Piutang Usaha | `total_piutang` dari semua `/partners` |
| Persediaan Bahan Baku | Σ (`stok_aktif × avg_cost`) dari `/raw_materials` |
| Persediaan Barang Jadi | Σ (`stok_gudang × last_hpp_satuan`) dari `/products` |

#### Akun Kewajiban

| Akun | Representasi |
|---|---|
| Utang / Kewajiban | `saldo_terkini < 0` (abs value) dari `/wallets` |

#### Akun Ekuitas

| Akun | Representasi |
|---|---|
| Modal Disetor | Σ `saldo_awal` dari semua `/wallets` |
| Laba/Rugi Ditahan | Total pendapatan − Total beban (all-time `/transactions`) |

#### Akun Pendapatan (tipe: 'in')

| Kategori | Keterangan |
|---|---|
| Penjualan | POS / penjualan tunai |
| Jasa | Layanan jasa |
| Pendapatan Lain | Sumber lain |
| Distribusi Stok | Piutang dari distribusi ke mitra (dompet virtual 'piutang') |
| Setoran Piutang Mitra | Penerimaan uang dari mitra konsinyasi |
| Persediaan Barang Jadi | Debit sisi persediaan saat produksi (virtual) |
| Modal Disetor | Penyetoran modal awal |
| Penjualan Kasir POS | Penjualan via kasir POS |

#### Akun Beban (tipe: 'out')

| Kategori | Keterangan |
|---|---|
| Beban HPP | HPP saat produk dijual (virtual) |
| Beban Kerugian Barang Rusak | Kerugian barang rusak dari mitra |
| Retur Penjualan | Pengurangan piutang karena retur |
| Persediaan Bahan Baku | Pembelian bahan baku (aset, bukan beban P&L) |
| Bahan Baku | Pembelian tunai (manual) |
| Gaji Karyawan | Beban gaji |
| Sewa | Beban sewa tempat |
| Listrik & Air | Beban utilitas |
| Perlengkapan | Beban perlengkapan |
| Transportasi | Beban transportasi |
| Marketing | Beban pemasaran |
| Lainnya | Beban operasional lainnya |

### 7.4 Jurnal Otomatis — Tabel Lengkap

| Kejadian Bisnis | Jurnal Debit | Jurnal Kredit |
|---|---|---|
| **Beli Bahan Baku** | Persediaan BB (out, dompet=wallet) | Kas/Bank berkurang |
| **Produksi Barang** | Persediaan BJ (in, dompet='persediaan') | Persediaan BB (out, dompet='persediaan') |
| **Penjualan POS** | Kas/Bank (in, dompet=wallet) | Beban HPP (out, dompet='persediaan') |
| **Distribusi ke Mitra** | Distribusi Stok (in, dompet='piutang') | Beban HPP (out, dompet='persediaan') |
| **Setoran Konsinyasi** | Kas/Bank (Setoran Piutang Mitra, in) | Piutang berkurang |
| **Retur Barang Bagus** | Persediaan BJ (stok naik, batch baru) | Retur Penjualan (out, harga setoran) |
| **Retur Barang Rusak** | Beban Kerugian (out, HPP modal) | Kredit Beban HPP (out, nominal negatif) |
| **Transfer Rekening** | Rekening tujuan naik | Rekening asal turun |
| **Modal Disetor** | Kas/Bank naik, saldo_awal naik | Modal ekuitas naik |

### 7.5 Dompet Virtual

finMo menggunakan konsep dompet virtual sebagai akun perantara:
- `dompet_id: 'piutang'` — Akun piutang virtual (tidak ubah saldo kas fisik).
- `dompet_id: 'persediaan'` — Akun persediaan virtual (pergerakan nilai persediaan).

Transaksi dompet virtual **dikecualikan** dari laporan Arus Kas.

### 7.6 Persamaan Akuntansi

```
ASET = KEWAJIBAN + EKUITAS
(Kas + Piutang + Persediaan BB + Persediaan BJ) = (Utang) + (Modal Awal + Laba/Rugi)
```

Diverifikasi secara otomatis dan ditampilkan di laporan Neraca.

---

## 8. MODUL & FITUR LENGKAP

### 8.1 Dashboard (Beranda)

Halaman utama — ringkasan kondisi keuangan bisnis secara real-time.

**Fitur:**
- **Greeting Card:** Sapaan personal (Selamat Pagi/Siang/Sore/Malam) + nama pemilik.
- **Hero Financial Summary:** Total saldo rekening, total piutang aktif, transaksi hari ini.
- **Quick Stats:** Kas masuk & keluar hari ini.
- **Recent Transactions:** 5 transaksi terbaru dengan ikon, kategori, nominal, waktu.
- **Quick Actions:** Shortcut ke fungsi yang sering digunakan.

**Data Sources:** `/wallets` (saldo), `/partners` (piutang), `/transactions` (recent).

**Logika:**
- Total saldo = Σ `saldo_terkini` dari semua wallet user.
- "Hari ini" = timestamp >= awal hari (00:00:00).
- Recent transactions diurutkan descending berdasarkan `tanggal`.

---

### 8.2 Transaksi (Buku Kas)

Ledger keuangan — mencatat, melihat, mengedit, menghapus transaksi.

**Sub-fitur:**

#### a. Daftar Transaksi
- Diurutkan terbaru ke terlama, dikelompokkan per hari.
- Visual indicator warna: masuk (hijau), keluar (merah), transfer (biru).
- Ikon attachment jika ada foto struk.

#### b. Pencarian & Filter
- Real-time search: catatan, kategori, nominal.
- Filter dropdown: Semua / Masuk / Keluar / Transfer.

#### c. Catat Transaksi Baru
Form: **Tipe** (tab: Pemasukan/Pengeluaran/Transfer), **Nominal** (auto-format ribuan), **Kategori** (dropdown dinamis sesuai tipe), **Rekening Sumber**, **Rekening Tujuan** (hanya Transfer), **Tanggal**, **Catatan**, **Foto Struk** (upload → Firebase Storage).

#### d. Edit & Aksi Transaksi
Tap transaksi → Modal Aksi: **Edit**, **Lihat Struk**, **Hapus**.
Edit = "rollback + apply baru" dalam satu `runTransaction()`.

---

### 8.3 Kasir POS (Point of Sale)

Kasir touch-screen untuk penjualan produk dari stok gudang.

**Sub-fitur:**

#### a. Grid Produk
Grid 2-3+ kolom per produk: foto, nama, stok, harga jual.
Badge "HABIS" merah jika `stok_gudang <= 0`.

#### b. Keranjang (Cart)
Footer sticky muncul saat cart tidak kosong. Total item dan total harga.

#### c. Modal Checkout
List item + kontrol qty (+-), input uang diterima → kembalian real-time, pilih rekening.
Atomic: Stok turun, FIFO batch depleted, HPP dicatat, pendapatan dicatat.

#### d. Barcode Scanner
- **Mode Kamera:** html5-qrcode library.
- **Mode Alat Scan:** Focus pada input, scanner kirim karakter + Enter.
- Produk ditemukan by `barcode`/`sku` → langsung ke cart.

#### e. Pencarian Produk
Real-time filter nama, SKU, barcode.

---

### 8.4 Mitra & Konsinyasi (Partners)

Kelola hubungan dengan mitra konsinyasi.

**Sub-fitur:**

#### a. Daftar Mitra
Card per mitra: avatar inisial, nama toko, kontak, alamat, status piutang.
Summary Stats: Total piutang aktif + total stok dititipkan (qty).

#### b. Tambah/Edit Mitra
Form: Nama Toko, Nama Pemilik, Kontak, Alamat.

#### c. Distribusi Stok
Distribusikan produk dari gudang ke mitra (konsinyasi).
Input: Mitra, Produk, Qty, Harga Setoran/pcs + preview piutang timbul.
Atomic: Stok gudang turun → FIFO → piutang naik → consignment_stock → jurnal.

#### d. Catat Penjualan / Selesai Konsinyasi
Input: Produk titipan, Qty Laku, (sisa: Qty Bagus + Qty Rusak), Pembayaran.
Validasi: Laku + Bagus + Rusak = Total Titipan.
Atomic complex: Piutang turun, setoran masuk, retur bagus/rusak dengan jurnal lengkap.

---

### 8.5 Produk & Stok

Master data produk jadi: info, stok, HPP, harga jual.

**Sub-fitur:**

#### a. Daftar Produk
Grid card: foto, nama, kategori, SKU/barcode, stok (hijau/merah), harga jual.

#### b. Tambah Produk
Nama, Kategori (kustom via modal), Satuan (kustom), Barcode/SKU, Foto.

#### c. Edit Produk
Pre-fill form → update `/products/{id}`.

#### d. Restock / Produksi
- **BOM Interface:** Pilih Bahan Baku + Qty pakai per unit (multi-row, tambah/hapus).
- **Auto-fill BOM** dari `last_hpp_items` (produksi sebelumnya).
- **Kalkulasi HPP real-time:** Total HPP + HPP/satuan.
- **Rekomendasi Harga Jual:** HPP/satuan × (1 + margin%). Margin dropdown (10%–50%).
- **Auto-fill harga jual**, bisa di-override manual.

---

### 8.6 Bahan Baku (Raw Materials)

Inventori bahan baku dengan Moving Average pricing.

**Sub-fitur:**

#### a. Daftar Bahan Baku
Grid card: nama, kategori, stok aktif + satuan, harga rata-rata/satuan.
Summary: Total jenis bahan baku + total nilai persediaan.

#### b. Beli Bahan Baku
Input: Nama (autocomplete), Kategori, Satuan, Qty beli, Total harga, Rekening, Tanggal.
Otomatis: Nama baru → buat dokumen. Sudah ada → Moving Average update.

#### c. Edit Bahan Baku
Langsung edit: nama, kategori, satuan, stok aktif, avg_cost (manual override).

#### d. Pencarian
Real-time filter nama/kategori.

---

### 8.7 Laporan Keuangan

Empat laporan keuangan standar dari data transaksi.

**Filter Waktu:** Hari Ini, Minggu Ini, Bulan Ini, Bulan Lalu, Tahun Ini, Semua Waktu.
**Hero Card:** Laba bersih + badge trending up/down + persentase margin.
**Charts:** Bar Chart (Pendapatan vs Beban), Donut Chart (distribusi kategori pengeluaran).

#### a. Laporan Laba/Rugi (Income Statement)
- Pendapatan: Breakdown per kategori + persentase.
- Beban: Breakdown per kategori + persentase.
- Laba/Rugi Bersih = Pendapatan − Beban.
- Dikecualikan: Modal, Setoran Piutang Mitra, Persediaan BB/BJ.

#### b. Laporan Neraca (Balance Sheet)
- Per saat ini (snapshot, bukan per periode).
- Aset: Kas & Bank, Piutang, Persediaan BB, Persediaan BJ.
- Kewajiban: Utang (saldo wallet negatif).
- Ekuitas: Modal Awal + Laba/Rugi Berjalan (all-time).
- Cek keseimbangan: Aset = Kewajiban + Ekuitas (✓ atau ✗).

#### c. Laporan Arus Kas (Cash Flow)
- Arus Masuk: Transaksi 'in' bukan dari dompet virtual.
- Arus Keluar: Transaksi 'out' bukan dari dompet virtual.
- Dikecualikan: dompet 'piutang'/'persediaan', kategori non-kas.

#### d. Laporan Persediaan (Inventory)
- Total nilai persediaan, nilai BJ, nilai BB.
- Tabel Produk Jadi: Nama, Stok, HPP Satuan, Nilai.
- Tabel Bahan Baku: Nama, Stok, Avg Cost, Nilai.

**Download PDF:** Setiap laporan bisa di-export via html2pdf.js.

---

### 8.8 Rekening (Wallets)

Multi-rekening/kas bisnis.

- Daftar Rekening: ikon/warna custom, nama, modal awal, saldo terkini.
- Tambah Rekening: Nama + Saldo Awal.
- Saldo diperbarui atomic setiap transaksi.
- `saldo_awal` hanya berubah saat transaksi 'Modal Disetor'.

---

### 8.9 Profil Bisnis

Profil & pengaturan bisnis.

- Informasi: Nama toko, nama pemilik, email.
- Edit Profil: Nama Toko, Nama Pemilik, Alamat, Telepon.
- Menu navigasi: Laporan Keuangan, Kelola Rekening, Kelola Produk.
- Logout: `signOut()` Firebase Auth.

---

### 8.10 Scan Nota AI (AI Receipt Scanner)

Fitur AI membaca foto nota/struk dan auto-fill form transaksi.

**Alur:**
1. Pilih Aksi → Scan Nota/Struk AI.
2. Pilih/foto nota → konversi Base64.
3. Kirim ke Gemini API dengan prompt JSON extraction.
4. Response: `{tipe_tx, nominal, kategori, catatan, tanggal}`.
5. Auto-fill form transaksi baru, foto di-attach sebagai struk.

**Error Handling:** Strip markdown fences, catch JSON parse error.

---

### 8.11 Asisten AI finMo (Chat AI)

Chatbot business advisor berbasis Gemini dengan data real-time bisnis.

**Alur:**
1. Tap ikon robot di top app bar.
2. Modal chat terbuka.
3. User ketik pertanyaan bisnis.
4. Sistem ambil: saldo rekening, produk, bahan baku, 10 tx terbaru.
5. Kirim ke Gemini: system context + pertanyaan.
6. Jawaban Bahasa Indonesia yang ramah ditampilkan dalam bubble.

**Use Cases:** piutang total, produk stok rendah, saran profit, rekap keuangan.

---

## 9. MODEL DATA & SKEMA FIRESTORE

### 9.1 `/users/{uid}`

```json
{
  "nama_toko": "String",
  "nama_pemilik": "String",
  "email": "String",
  "created_at": "Timestamp"
}
```

### 9.2 `/profiles/{uid}`

```json
{
  "uid": "String",
  "nama_toko": "String",
  "nama_pemilik": "String",
  "email": "String",
  "jenis_usaha": "String",
  "periode_awal": "String",
  "periode_akuntansi": "String",
  "alamat": "String",
  "telepon": "String",
  "created_at": "Timestamp"
}
```

### 9.3 `/wallets/{walletId}`

```json
{
  "uid": "String",
  "nama_rekening": "String",
  "saldo_awal": "Number (modal awal)",
  "saldo_terkini": "Number (bisa negatif)",
  "ikon": "String (Material Symbol name)",
  "warna": "String (hex color)"
}
```

### 9.4 `/transactions/{txId}`

```json
{
  "uid": "String",
  "tipe_tx": "String (in | out | transfer)",
  "nominal": "Number (bisa negatif untuk kredit HPP)",
  "kategori": "String",
  "dompet_id": "String (wallet ID | piutang | persediaan)",
  "dompet_tujuan_id": "String (hanya transfer)",
  "tanggal": "Timestamp",
  "catatan": "String",
  "foto_struk": "String? (Firebase Storage URL)"
}
```

### 9.5 `/products/{productId}`

```json
{
  "uid": "String",
  "nama_produk": "String",
  "nama": "String (alias, backward compat)",
  "kategori": "String",
  "satuan": "String",
  "barcode": "String? (SKU)",
  "foto_url": "String? (base64 atau Storage URL)",
  "stok_gudang": "Number",
  "harga_jual": "Number",
  "last_hpp_satuan": "Number (HPP produksi terakhir)",
  "last_harga_jual": "Number",
  "last_hpp_items": "Array (BOM produksi terakhir)",
  "harga_modal": "Number? (alias HPP)"
}
```

### 9.6 `/raw_materials/{rawId}`

```json
{
  "uid": "String",
  "nama": "String",
  "kategori": "String",
  "satuan": "String",
  "stok_aktif": "Number",
  "avg_cost": "Number (Moving Average per satuan)"
}
```

### 9.7 `/stock_batches/{batchId}` — KEY untuk FIFO

```json
{
  "uid": "String",
  "product_id": "String (ref ke /products)",
  "qty_awal": "Number",
  "qty_sisa": "Number (dikurangi saat jual/distribusi)",
  "hpp_total": "Number",
  "hpp_satuan": "Number (HPP per unit batch ini)",
  "harga_jual": "Number",
  "tanggal_produksi": "Timestamp (KEY: urutan FIFO)",
  "status": "String (active | depleted)"
}
```

### 9.8 `/partners/{partnerId}`

```json
{
  "uid": "String",
  "nama_toko": "String",
  "pemilik": "String",
  "kontak": "String",
  "alamat": "String",
  "total_piutang": "Number (akumulasi piutang aktif)"
}
```

### 9.9 `/consignment_stock/{consId}`

```json
{
  "uid": "String",
  "partner_id": "String (ref ke /partners)",
  "product_id": "String (ref ke /products)",
  "nama_produk": "String (snapshot)",
  "qty_titipan": "Number",
  "harga_setoran": "Number (per unit, disepakati)"
}
```

---

## 10. LOGIKA BISNIS INTI

### 10.1 Algoritma FIFO Batch Processing

Dijalankan saat penjualan POS atau distribusi ke mitra:

```javascript
// Ambil batch aktif, urutkan dari TERLAMA (ascending tanggal_produksi)
const validBatches = batches
    .filter(b => b.qty_sisa > 0)
    .sort((a, b) => safeToMillis(a.tanggal_produksi) - safeToMillis(b.tanggal_produksi));

// Konsumsi dari batch tertua
let sisaKurang = qtyYangDiJual;
for (const batch of validBatches) {
    if (batch.qty_sisa >= sisaKurang) {
        batch.newSisa = batch.qty_sisa - sisaKurang;
        sisaKurang = 0;
        break;
    } else {
        batch.newSisa = 0;
        sisaKurang -= batch.qty_sisa;
    }
}

// Update semua batch dalam runTransaction()
for (const batch of validBatches) {
    if (batch.newSisa !== undefined) {
        transaction.update(batchRef, {
            qty_sisa: batch.newSisa,
            status: batch.newSisa === 0 ? 'depleted' : 'active'
        });
    }
}
```

### 10.2 Moving Average (Bahan Baku)

```javascript
// Saat beli bahan baku yang sudah ada
const oldStok = existingData.stok_aktif;
const oldCost = existingData.avg_cost;
const totalOldValue = oldStok * oldCost;
const totalNewValue = totalOldValue + totalHargaBeli;
const newStok = oldStok + qtyBeli;
const newAvgCost = totalNewValue / newStok; // Moving Average
```

### 10.3 Kalkulasi HPP Produksi (BOM)

```javascript
let totalHpp = 0;
for (const row of hppRows) {
    const cost = row.rawMaterialAvgCost;  // dari /raw_materials avg_cost
    const qtyUsed = row.qtyPerUnit;
    totalHpp += cost * qtyUsed;
}
const hppSatuan = Math.round(totalHpp / qtyProduksi);
```

### 10.4 Rekomendasi Harga Jual

```javascript
const marginPct = selectedMargin / 100;  // 40% → 0.4
let rekomendasi = hppSatuan * (1 + marginPct);
rekomendasi = Math.ceil(rekomendasi / 100) * 100;  // Pembulatan ke ratusan terdekat
```

### 10.5 Kalkulasi Neraca Otomatis

```javascript
// ASET
const totalKas = wallets.reduce((a, w) => w.saldo_terkini >= 0 ? a + w.saldo_terkini : a, 0);
const totalPiutang = partners.reduce((a, p) => a + p.total_piutang, 0);
const totalBB = rawMaterials.reduce((a, m) => a + m.stok_aktif * m.avg_cost, 0);
const totalBJ = products.reduce((a, p) => a + p.stok_gudang * (p.last_hpp_satuan || 0), 0);
const totalAset = totalKas + totalPiutang + totalBB + totalBJ;

// KEWAJIBAN
const totalUtang = wallets.reduce((a, w) => w.saldo_terkini < 0 ? a + Math.abs(w.saldo_terkini) : a, 0);

// EKUITAS
const totalModalAwal = wallets.reduce((a, w) => a + (w.saldo_awal || 0), 0);
const labaRugiBerjalan = totalIn - totalOut;  // dari semua transaksi
const ekuitas = totalModalAwal + labaRugiBerjalan;

// VERIFIKASI (toleransi Rp 1 untuk floating point)
const isBalanced = Math.abs(totalAset - (totalUtang + ekuitas)) < 1;
```

### 10.6 Helper Functions Kritis

```javascript
// Menangani berbagai format Timestamp Firestore
function safeToDate(timestamp) {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (timestamp.seconds !== undefined) return new Date(timestamp.seconds * 1000);
    if (typeof timestamp === 'number') return new Date(timestamp);
    if (typeof timestamp === 'string') return new Date(timestamp);
    return new Date();
}

function safeToMillis(timestamp) {
    return safeToDate(timestamp).getTime();
}

function formatRupiah(amount) {
    return 'Rp ' + Math.abs(amount || 0).toLocaleString('id-ID');
}
```

---

## 11. LAPORAN KEUANGAN

### 11.1 Filter Waktu

| Filter | Rentang |
|---|---|
| Hari Ini | Mulai 00:00:00 hari ini |
| Minggu Ini | Mulai Senin minggu ini |
| Bulan Ini | Mulai tanggal 1 bulan ini |
| Bulan Lalu | Seluruh bulan sebelumnya |
| Tahun Ini | Mulai 1 Januari tahun ini |
| Semua Waktu | Tanpa filter tanggal |

### 11.2 Laporan Laba/Rugi — Filter Akun

**DIKECUALIKAN dari L/R:**
- `kategori === 'Modal'` — bukan pendapatan, hanya penyetoran modal.
- `kategori === 'Setoran Piutang Mitra'` — bukan pendapatan baru, hanya konversi piutang.
- `kategori === 'Persediaan Bahan Baku'` — aset, bukan beban.
- `kategori === 'Persediaan Barang Jadi'` — aset, bukan pendapatan.

**Khusus:** `'Retur Penjualan'` mengurangi total pendapatan (bukan menambah beban).

### 11.3 Laporan Arus Kas — Logika Eksklusi

**DIKECUALIKAN dari Arus Kas:**
- `dompet_id === 'persediaan'` (bukan kas fisik)
- `dompet_id === 'piutang'` (bukan kas fisik)
- Transaksi tipe `'transfer'`
- Kategori: Distribusi Stok, Beban HPP, Persediaan Barang Jadi, Beban Kerugian, Retur Penjualan

### 11.4 Laporan Persediaan

```
Nilai BB  = Σ (stok_aktif × avg_cost)   per /raw_materials
Nilai BJ  = Σ (stok_gudang × last_hpp_satuan)  per /products
Total     = Nilai BB + Nilai BJ
```

### 11.5 Export PDF

html2pdf.js — Format Letter, Portrait, Scale 2x (high-res), Margin 0.5 inch.

---

## 12. INTEGRASI AI (GEMINI API)

### 12.1 Fungsi callGemini

- **Model:** `gemini-1.5-flash`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **Auth:** Query param `key={API_KEY}`
- **Temperature:** 0.4
- **Input:** Teks prompt + opsional base64 gambar (multimodal)

```javascript
async function callGemini(prompt, base64Image = null, mimeType = 'image/jpeg') {
    const parts = [{ text: prompt }];
    if (base64Image) parts.push({ inlineData: { mimeType, data: base64Image } });
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.4 } })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
```

### 12.2 Scan Nota AI

- Model multimodal (teks + gambar).
- Prompt: ekstrak ke JSON `{tipe_tx, nominal, kategori, catatan, tanggal}`.
- Error handling: strip markdown fences, catch JSON parse.

### 12.3 Chat AI (Business Advisor)

- Persona: "Asisten Bisnis finMo yang ramah dan profesional, Bahasa Indonesia."
- System context: saldo rekening, produk, bahan baku, 10 tx terbaru.
- Output: jawaban akurat berbasis data real-time user.

---

## 13. MANAJEMEN STATE & ROUTING

### 13.1 Router: MapsTo(page)

Fungsi router utama SPA:
1. Atur visibilitas navbar (sembunyikan saat signin/signup).
2. Inject template HTML ke `#app-content`.
3. Panggil fungsi loader data.

Halaman: `dashboard`, `transactions`, `pos`, `partners`, `products`, `rawmaterials`, `profile`, `wallets`, `reports`, `signin`, `signup`.

### 13.2 Global State Variables

| Variabel | Tipe | Isi |
|---|---|---|
| `window.posCart` | Array | Keranjang POS aktif |
| `window.posProducts` | Array | Produk di POS halaman aktif |
| `window._txs` | Array | Transaksi yang ditampilkan |
| `window._profileData` | Object | Profil pengguna aktif |
| `window.currentPartnerId` | String | ID mitra yang dipilih |
| `window.currentActiveTxIndex` | Number | Index transaksi di-action |
| `window.productDataMap` | Object | Map productId → data produk (BOM) |
| `window.cachedRawMaterialsOptions` | String | HTML options bahan baku (cache) |

### 13.3 Firebase Auth Lifecycle

```javascript
onAuthStateChanged(auth, (user) => {
    if (user) MapsTo('dashboard');
    else MapsTo('signin');
});
```

Seluruh navigasi awal dikontrol oleh `onAuthStateChanged`. Tidak ada halaman yang bisa diakses tanpa autentikasi.

---

## 14. KEAMANAN & AUTENTIKASI

### 14.1 Autentikasi

- **Provider:** Firebase Auth — Email/Password.
- **Session:** Dipersistkan otomatis via IndexedDB.
- **Guard:** `onAuthStateChanged` mencegah akses halaman tanpa login.

### 14.2 Data Isolation

Setiap query Firestore menggunakan `where('uid', '==', auth.currentUser.uid)`.
User A tidak bisa membaca data user B.

### 14.3 Validasi Data

- **Client-side:** Required fields, format angka, validasi logika bisnis.
- **Server-side (dalam transaction):** Cek saldo cukup, cek stok cukup sebelum write.

### 14.4 ⚠️ Catatan Keamanan

> **PERINGATAN:** API Key Gemini saat ini tersimpan di JavaScript client-side.
> Untuk produksi: pindahkan pemanggilan Gemini ke Firebase Cloud Functions.

### 14.5 Firestore Security Rules (Rekomendasi)

```
match /{collection}/{docId} {
  allow read, write: if request.auth != null
      && request.auth.uid == resource.data.uid;
}
```

---

## 15. NON-FUNCTIONAL REQUIREMENTS

### 15.1 Performance

- Time to Interactive: < 3 detik pada koneksi 4G.
- Firestore: Selalu filter `uid` untuk hindari full collection scan.
- Template caching: String template tersimpan di memori, tidak re-parse DOM.

### 15.2 Reliability

- **Atomic Transactions:** `runTransaction()` mencegah partial state corruption.
- **Offline Resilience:** `safeToDate()` handle berbagai format Timestamp (cache vs live).
- **Error Handling:** try-catch pada setiap async operation dengan alert informatif.

### 15.3 Usability

- Mobile-first: Dioptimalkan untuk sentuhan.
- No Learning Curve: Jurnal akuntansi otomatis — user hanya catat kejadian bisnis.
- Loading States: Tombol tampilkan "Menyimpan...", "Memproses..." saat submit.
- Autocomplete: Nama bahan baku via `<datalist>` HTML.

### 15.4 Responsiveness

- **Mobile (< 768px):** Single column, bottom navbar 5 item + floating POS button.
- **Tablet (768px+):** Sidebar, grid 2 kolom.
- **Desktop (1024px+):** Sidebar permanen, grid 3 kolom, modal lebih lebar.

### 15.5 Kompatibilitas

- Target: Chrome, Firefox, Safari (2 tahun terakhir).
- Memerlukan ES Modules support (tidak support IE).
- Camera API memerlukan HTTPS.

---

## 16. ROADMAP & FUTURE ENHANCEMENTS

### v1.0 — Saat Ini (SELESAI ✅)

- [x] Dashboard keuangan real-time
- [x] Manajemen transaksi kas (CRUD + foto struk)
- [x] Kasir POS dengan FIFO batch processing
- [x] Manajemen mitra & sistem konsinyasi lengkap
- [x] Manajemen produk & restock/produksi (BOM)
- [x] Manajemen bahan baku (Moving Average)
- [x] Laporan keuangan: L/R, Neraca, Arus Kas, Persediaan
- [x] AI Scan Nota (Gemini Vision)
- [x] AI Business Advisor Chat
- [x] PDF Export laporan
- [x] Barcode scanner (kamera + alat hardware)
- [x] Multi-rekening

### v1.5 — Direncanakan 📌

- [ ] Notifikasi stok rendah (threshold kustom per produk)
- [ ] Target penjualan harian/bulanan + progress tracking
- [ ] Grafik tren: bulan ini vs bulan lalu
- [ ] Export Excel/CSV transaksi & laporan
- [ ] Multi-user: akses terbatas untuk karyawan/kasir
- [ ] Pindah API Key Gemini ke Cloud Functions
- [ ] Dark Mode

### v2.0 — Visi Jangka Panjang 🔭

- [ ] Mobile App Native (Android/iOS)
- [ ] Marketplace Integration (Shopee, Tokopedia, Lazada)
- [ ] Accounting Module Lanjutan (Buku Besar, Jurnal Umum)
- [ ] Supplier Management + Purchase Order
- [ ] Customer Loyalty Program
- [ ] AI Forecasting (prediksi penjualan + rekomendasi restock berbasis ML)
- [ ] Multi-Branch Support (cabang dalam satu akun)
- [ ] Tax Management (PPN, pelaporan pajak otomatis)
- [ ] Invoice Generation (kirim via WhatsApp/email)

---

## GLOSSARY

| Istilah | Definisi |
|---|---|
| **UMKM** | Usaha Mikro, Kecil, dan Menengah |
| **HPP** | Harga Pokok Penjualan — biaya langsung produksi barang yang terjual |
| **FIFO** | First In, First Out — barang pertama masuk = pertama dijual |
| **Moving Average** | Harga rata-rata dihitung ulang setiap ada pembelian baru |
| **Konsinyasi** | Sistem titipan barang ke mitra, bayar setelah laku |
| **Piutang** | Tagihan belum dibayar dari mitra |
| **Ekuitas** | Kekayaan bersih pemilik = Aset − Kewajiban |
| **Jurnal** | Catatan akuntansi setiap transaksi (debit & kredit) |
| **Perpetual Inventory** | Pencatatan persediaan diperbarui setiap transaksi (real-time) |
| **BOM** | Bill of Materials — daftar bahan untuk memproduksi satu produk |
| **POS** | Point of Sale — sistem kasir |
| **SPA** | Single Page Application — web app dalam satu halaman HTML |
| **Atomic Transaction** | Operasi DB yang dijamin selesai semua atau tidak sama sekali |
| **Dompet Virtual** | Akun perantara 'piutang' & 'persediaan' — bukan kas fisik |

---

## APPENDIX — Struktur File Proyek

```
fintra mobile/
├── index.html                                  ← Shell HTML + semua modal
├── app.js                                      ← Logika aplikasi (~5,644 baris)
└── PRODUCT REQUIREMENTS DOCUMENT (PRD).md      ← Dokumen ini
```

---

*Dokumen ini dibuat berdasarkan analisis kode sumber lengkap aplikasi finMo v1.0.*
*Ini adalah living document yang diperbarui seiring perkembangan produk.*
*Terakhir diperbarui: Juli 2026*

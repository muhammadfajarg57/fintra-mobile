
// API fetch helper for Vercel Serverless API + Turso DB
export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('finmo_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, { ...options, headers });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.error || 'Terjadi kesalahan pada server');
    }
    return json;
}

export let auth = {
    currentUser: null
};

export async function checkAuthSession() {
    const token = localStorage.getItem('finmo_token');
    if (!token) {
        auth.currentUser = null;
        return null;
    }
    try {
        const res = await apiFetch('/api/auth/me');
        if (res && res.user) {
            auth.currentUser = res.user;
            return res.user;
        }
    } catch (e) {
        console.warn("Session expired or invalid:", e.message);
        localStorage.removeItem('finmo_token');
        auth.currentUser = null;
    }
    return null;
}

export function safeToDate(timestamp) {
    if (!timestamp) return new Date(0);
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.seconds !== undefined) return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    return new Date(timestamp);
}

export function safeToMillis(timestamp) {
    if (!timestamp) return 0;
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
    if (timestamp instanceof Date) return timestamp.getTime();
    if (timestamp.seconds !== undefined) return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
    return new Date(timestamp).getTime();
}

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function callGemini(promptTextOrContents, base64Image = null, mimeType = null) {
    let contents = [];
    if (Array.isArray(promptTextOrContents)) {
        contents = promptTextOrContents;
    } else {
        const parts = [{ text: promptTextOrContents }];
        if (base64Image && mimeType) {
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image.split(',')[1] || base64Image
                }
            });
        }
        contents.push({ role: 'user', parts: parts });
    }

    const res = await apiFetch('/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify({ contents: contents })
    });
    return res.text;
}

// Template for Dashboard View
const dashboardTemplate = `
<div class="pb-32 bg-background min-h-screen">
    <!-- Greeting Section -->
    <div class="px-4 sm:px-8 pt-6 max-w-7xl mx-auto flex items-center justify-between">
        <div>
            <h1 id="dash-greeting" class="font-heading font-bold text-2xl text-on-surface">Halo! ??</h1>
            <p class="text-xs text-on-surface-variant mt-1">Berikut ringkasan keuangan finMo Anda hari ini.</p>
        </div>
    </div>

    <!-- Main Grid for Desktop -->
    <div class="max-w-7xl mx-auto lg:grid lg:grid-cols-12 lg:gap-6 lg:px-8 mt-4 lg:mt-6">
        
        <!-- Left Column: Hero, Quick Stats, Recent Tx -->
        <div class="lg:col-span-8 flex flex-col gap-6">
            <!-- Top Screen: Hero Balance Card -->
            <div class="w-full">
                <section class="bg-gradient-ocean rounded-[24px] p-6 sm:p-8 shadow-glow text-white relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-80 h-80 bg-white opacity-10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                    <div class="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>
                    
                    <div class="relative z-10 flex flex-col gap-4">
                        <div class="flex justify-between items-center">
                            <span class="font-heading font-semibold text-xs text-white/80 tracking-wide uppercase">Total Kas Tersedia</span>
                            <button id="btn-toggle-saldo" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition-colors">
                                <span class="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                        </div>
                        <div id="dash-total-saldo" class="font-heading font-black text-3xl sm:text-4xl tracking-tight mb-2">Rp 0</div>
                        <div class="flex gap-3">
                            <button id="btn-dash-transaksi-baru" onclick="document.getElementById('btn-transaksi-baru').click()" class="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-on-primary rounded-full px-4 py-2 font-label-sm text-xs transition-colors backdrop-blur-sm">
                                <span class="material-symbols-outlined text-[16px]">add</span>
                                Catat Baru
                            </button>
                            <button id="btn-dash-kasir" onclick="window.MapsTo('pos')" class="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-on-primary rounded-full px-4 py-2 font-label-sm text-xs transition-colors backdrop-blur-sm">
                                <span class="material-symbols-outlined text-[16px]">point_of_sale</span>
                                Kasir POS
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Quick Stats & Aset Usaha -->
            <section class="w-full">
                <div class="grid grid-cols-2 gap-4">
                    <!-- Pemasukan -->
                    <div onclick="window.MapsTo('reports')" class="bg-white rounded-[20px] p-3 sm:p-4 shadow-card border border-outline-variant/30 flex flex-col gap-2 group hover:shadow-float cursor-pointer transition-all">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-success-green/10 flex items-center justify-center text-success-green shrink-0">
                                <span class="material-symbols-outlined text-[18px]">arrow_downward</span>
                            </div>
                            <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Masuk</span>
                        </div>
                        <div id="dash-pemasukan" class="font-heading font-extrabold text-lg sm:text-xl text-on-surface tracking-tight truncate">Rp 0</div>
                    </div>

                    <!-- Pengeluaran -->
                    <div onclick="window.MapsTo('reports')" class="bg-white rounded-[20px] p-3 sm:p-4 shadow-card border border-outline-variant/30 flex flex-col gap-2 group hover:shadow-float cursor-pointer transition-all">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-danger-red/10 flex items-center justify-center text-danger-red shrink-0">
                                <span class="material-symbols-outlined text-[18px]">arrow_upward</span>
                            </div>
                            <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Keluar</span>
                        </div>
                        <div id="dash-pengeluaran" class="font-heading font-extrabold text-lg sm:text-xl text-on-surface tracking-tight truncate">Rp 0</div>
                    </div>
                </div>
            </section>

            <!-- Arus Kas Chart -->
            <section class="w-full">
                <div class="bg-white rounded-[24px] shadow-card border border-outline-variant/30 overflow-hidden p-5 sm:p-6 mb-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="font-heading font-bold text-lg text-on-surface tracking-tight">Statistik Arus Kas</h2>
                        <span class="text-xs font-semibold text-on-surface-variant bg-surface-container py-1 px-3 rounded-full">7 Hari</span>
                    </div>
                    <div class="relative w-full h-48 sm:h-56">
                        <canvas id="dash-cashflow-chart"></canvas>
                    </div>
                    <div class="flex items-center justify-center gap-6 mt-4">
                        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-[#10b981]"></div><span class="text-xs text-on-surface-variant font-medium">Masuk</span></div>
                        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-[#ef4444]"></div><span class="text-xs text-on-surface-variant font-medium">Keluar</span></div>
                    </div>
                </div>
            </section>

            <!-- Transaksi Terakhir -->
            <section class="w-full">
                <div class="flex justify-between items-end mb-4 px-1">
                    <h2 class="font-heading font-bold text-lg text-on-surface tracking-tight">Transaksi Terakhir</h2>
                </div>
                <div id="dash-tx-list" class="bg-white rounded-[24px] shadow-card border border-outline-variant/30 overflow-hidden divide-y divide-outline-variant/20">
                    <div class="p-6 text-center text-on-surface-variant text-sm">Memuat transaksi...</div>
                </div>
            </section>
        </div>

        <!-- Right Column: Piutang & Rekening -->
        <div class="lg:col-span-4 flex flex-col gap-6 mt-6 lg:mt-0">
            <!-- Consignment Widget -->
            <section class="w-full">
                <div id="btn-shortcut-piutang-widget" onclick="window.MapsTo('partners')" class="bg-tertiary-fixed/30 border border-tertiary-fixed-dim/30 rounded-[20px] p-4 flex items-start gap-3 shadow-sm relative overflow-hidden hover:bg-tertiary-fixed/40 transition-colors cursor-pointer group">
                    <div class="bg-tertiary-container text-on-tertiary-container p-2 rounded-xl shrink-0">
                        <span class="material-symbols-outlined text-[20px]">inventory_2</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-label-md text-sm text-on-surface font-bold truncate">Piutang Toko Titipan</h3>
                        <p id="dash-piutang-info" class="font-body-md text-xs text-on-surface-variant mt-0.5 truncate">Memuat info piutang...</p>
                    </div>
                    <button class="text-tertiary-container p-1 rounded-full hover:bg-white/20 transition-colors self-center shrink-0">
                        <span class="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </section>

            <!-- Account List -->
            <section class="w-full">
                <div class="flex justify-between items-end mb-4 px-1">
                    <h2 class="font-heading font-bold text-lg text-on-surface tracking-tight">Rekening & Kas</h2>
                    <button id="btn-lihat-semua-rekening" class="text-primary text-sm font-semibold hover:text-primary-hover bg-primary-container/10 px-4 py-1.5 rounded-full">Kelola</button>
                </div>
                <div id="dash-rekening-list" class="flex lg:grid lg:grid-cols-1 gap-4 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-4 lg:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div class="text-sm text-on-surface-variant">Memuat...</div>
                </div>
            </section>
        </div>
        
    </div>
</div>`;

// Template for Transactions View
const transactionsTemplate = `
<div class="space-y-6 pt-6 bg-background min-h-screen pb-32">
    <section class="px-3.5 sm:px-8 relative">
        <h1 class="font-heading font-bold text-3xl text-on-surface mb-6">Riwayat</h1>
        
        <!-- Filter Row -->
        <div class="relative">
            <div class="flex items-center gap-3 overflow-x-auto no-scrollbar py-2.5 px-1">
                <button id="btn-tx-filter" class="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold shadow-glow active:scale-95 transition-transform hover:shadow-lg">
                    <span class="material-symbols-outlined text-[18px]">tune</span> Filter
                </button>
                <button class="flex-shrink-0 px-5 py-2.5 rounded-full bg-white border border-outline-variant/30 text-on-surface font-semibold shadow-sm hover:bg-surface-container-low transition-colors">Bulan Ini</button>
            </div>
            <div id="dropdown-tx-filter" class="absolute left-1 top-14 mt-1 w-56 bg-white rounded-[20px] shadow-xl border border-outline-variant/30 py-2 z-[90] hidden opacity-0 transition-opacity">
                <button class="w-full text-left px-5 py-3 text-sm font-bold text-on-surface hover:bg-background hover:text-primary transition-colors tx-filter-opt" data-val="all">Semua Transaksi</button>
                <button class="w-full text-left px-5 py-3 text-sm font-bold text-on-surface hover:bg-background hover:text-success-green transition-colors tx-filter-opt" data-val="in">Pemasukan Saja</button>
                <button class="w-full text-left px-5 py-3 text-sm font-bold text-on-surface hover:bg-background hover:text-danger-red transition-colors tx-filter-opt" data-val="out">Pengeluaran Saja</button>
                <button class="w-full text-left px-5 py-3 text-sm font-bold text-on-surface hover:bg-background hover:text-primary transition-colors tx-filter-opt" data-val="transfer">Transfer Saja</button>
            </div>
        </div>
    </section>

    <!-- Search Bar -->
    <section class="px-3.5 sm:px-8">
        <div class="relative w-full">
            <span class="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline-variant font-bold">search</span>
            <input id="tx-search-input" class="w-full h-14 pl-14 pr-5 bg-surface-container-low border border-outline-variant/30 rounded-[20px] text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-shadow font-medium" placeholder="Cari nominal, kategori..." type="text">
        </div>
    </section>

    <!-- Transaction List -->
    <section id="tx-list-container" class="space-y-6 px-3.5 sm:px-8">
        <div class="p-6 text-center text-on-surface-variant bg-white rounded-[24px] border border-outline-variant/30 shadow-sm">Memuat riwayat...</div>
    </section>
</div>
`;

// Template for POS View
const templatePOS = `
<div class="space-y-6 pt-6 relative pb-32">
    <div>
        <h1 class="font-heading font-bold text-3xl text-on-surface">Kasir / POS</h1>
        <p class="text-on-surface-variant mt-1">Kelola transaksi pelanggan dengan cepat.</p>
    </div>

    <div class="relative w-full z-10">
        <button id="btn-pos-scanner-menu" class="w-full bg-gradient-ocean text-white rounded-[20px] h-16 shadow-glow flex items-center justify-center gap-2 hover:bg-gradient-ocean-hover transition-all active:scale-[0.98] font-bold tracking-wide">
            <span class="material-symbols-outlined text-[28px]">barcode_scanner</span>
            BUKA SCANNER
            <span class="material-symbols-outlined ml-2">expand_more</span>
        </button>
        <div id="dropdown-pos-scanner" class="absolute top-full left-0 right-0 mt-2 bg-surface rounded-[20px] shadow-lg border border-outline-variant/30 py-2 hidden opacity-0 transition-opacity">
            <button class="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-on-surface hover:bg-background transition-colors" id="btn-scan-kamera">
                <div class="w-10 h-10 rounded-full bg-gradient-ocean-container text-primary flex items-center justify-center">
                    <span class="material-symbols-outlined">photo_camera</span>
                </div>
                Scan Kamera HP
            </button>
            <button class="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-on-surface hover:bg-background transition-colors" id="btn-scan-alat">
                <div class="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center">
                    <span class="material-symbols-outlined">qr_code_scanner</span>
                </div>
                Alat Scanner (Bluetooth/USB)
            </button>
        </div>
    </div>

    <div class="relative w-full">
        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input id="pos-search-input" class="w-full h-14 pl-12 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-[20px] text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm" placeholder="Cari nama produk atau SKU..." type="text">
    </div>

    <!-- Product Grid -->
    <div id="pos-product-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div class="col-span-full text-center text-on-surface-variant py-8">Memuat katalog...</div>
    </div>
</div>

<!-- Floating Cart Footer -->
<div id="pos-cart-footer" class="fixed bottom-0 md:bottom-0 left-0 w-full z-[60] bg-surface/85 backdrop-blur-md border-t border-outline-variant/30 p-4 md:px-8 hidden mb-16 md:mb-0 shadow-glow">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex flex-col">
            <span class="text-xs text-on-surface-variant flex items-center gap-1 font-medium mb-0.5">
                <span class="material-symbols-outlined text-[14px]">shopping_cart</span> <span id="pos-cart-count">0</span> Items
            </span>
            <span id="pos-cart-total" class="font-heading font-bold text-xl text-on-surface">Rp 0</span>
        </div>
        <button id="btn-pos-checkout" class="px-6 py-3 bg-gradient-ocean hover:bg-gradient-ocean-hover text-white rounded-full font-bold shadow-glow active:scale-95 transition-all flex items-center gap-2">
            Checkout <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
    </div>
</div>
`;

// Template for Partners View
const templatePartners = `
<div class="flex flex-col gap-6 pt-6 pb-32">
    <div>
        <h2 class="font-heading font-bold text-xl md:text-3xl text-on-surface">Mitra &amp; Konsinyasi</h2>
        <p class="text-sm text-on-surface-variant mt-1">Kelola distribusi produk dan tagihan partner Anda.</p>
    </div>

    <!-- Stats Cards -->
    <section class="grid grid-cols-2 gap-4">
        <div class="bg-gradient-success text-white rounded-[20px] p-5 shadow-card flex flex-col gap-2 relative overflow-hidden group hover:shadow-float hover:-translate-y-0.5 transition-all duration-300">
            <div class="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors"></div>
            <div class="flex items-center gap-2 text-white/95">
                <span class="material-symbols-outlined text-[18px]">inventory_2</span>
                <span class="text-xs font-semibold">Total Titipan</span>
            </div>
            <div class="mt-1 relative z-10">
                <span id="stat-total-titipan" class="font-heading font-bold text-xl text-white">0</span>
                <span class="text-sm text-white/80 ml-1">Pcs</span>
            </div>
        </div>
        <div class="bg-gradient-ocean text-white rounded-[20px] p-5 shadow-card flex flex-col gap-2 relative overflow-hidden group hover:shadow-float hover:-translate-y-0.5 transition-all duration-300">
            <div class="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors"></div>
            <div class="flex items-center gap-2 text-white/95">
                <span class="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                <span class="text-xs font-semibold">Total Piutang Mitra</span>
            </div>
            <div class="mt-1 relative z-10">
                <span id="stat-total-piutang" class="font-heading font-bold text-xl text-white">Rp 0</span>
            </div>
        </div>
    </section>

    <!-- Action Buttons -->
    <section class="flex gap-3">
        <button id="btn-distribusi-stok-page" class="flex-1 min-h-[48px] bg-gradient-ocean text-white rounded-full flex items-center justify-center gap-2 text-sm font-semibold shadow-glow active:scale-[0.98] transition-transform hover:shadow-lg">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">local_shipping</span>
            Distribusi Stok
        </button>
        <button id="btn-tambah-mitra-page" class="min-h-[48px] px-5 bg-surface-container-low text-on-surface rounded-full flex items-center justify-center gap-2 text-sm font-semibold active:scale-[0.98] transition-transform hover:shadow-md border border-outline-variant/30">
            <span class="material-symbols-outlined text-[20px]">person_add</span>
            Tambah Mitra
        </button>
    </section>

    <!-- Daftar Mitra -->
    <section class="flex flex-col gap-3">
        <div class="flex justify-between items-center">
            <h3 class="font-heading font-bold text-xl text-on-surface">Daftar Mitra</h3>
        </div>
        <div id="partner-list-container" class="flex flex-col gap-3">
            <div class="p-6 text-center text-on-surface-variant bg-white rounded-[20px] border border-outline-variant/30 shadow-sm">Memuat data mitra...</div>
        </div>
    </section>
</div>
`;

// Template for Reports View
const templateReports = `
<div class="space-y-6 pt-4 pb-32 max-w-7xl mx-auto">

    <!-- VIEW 1: Menu Pemilihan Laporan Keuangan (Hub View) -->
    <div id="reports-hub-view" class="space-y-6">
        <!-- Header -->
        <div>
            <h2 class="font-heading font-bold text-xl md:text-3xl text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[28px]" style="font-variation-settings:'FILL' 1;">analytics</span>
                Laporan Keuangan
            </h2>
            <p class="text-sm text-on-surface-variant mt-1">Analitik & ringkasan performa bisnis Anda</p>
        </div>

        <!-- 1. Hero: Ringkasan Profit -->
        <section class="relative overflow-hidden rounded-[24px] bg-gradient-ocean p-5 sm:p-6 shadow-glow">
            <div class="absolute top-0 right-0 w-72 h-72 bg-white opacity-10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 w-56 h-56 bg-white opacity-5 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none"></div>
            
            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-4">
                    <div class="bg-white/15 backdrop-blur-md rounded-[12px] px-3 py-1.5 text-xs font-bold text-white/90 tracking-wide uppercase">Ringkasan Profit</div>
                </div>
                
                <div class="mb-5">
                    <p class="text-white/70 text-xs sm:text-sm font-medium mb-1">Laba/Rugi Bersih</p>
                    <div id="hero-laba-bersih" class="font-heading font-bold text-2xl sm:text-4xl text-white tracking-tight">Rp 0</div>
                    <div id="hero-laba-badge" class="inline-flex items-center gap-1 mt-2.5 bg-white/15 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-white/95">
                        <span class="material-symbols-outlined text-[14px]">trending_up</span>
                        <span id="hero-laba-percent">0%</span> margin
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-2.5 sm:gap-4">
                    <div class="bg-white/10 backdrop-blur-md rounded-[16px] p-2.5 sm:p-4 border border-white/10 overflow-hidden">
                        <div class="flex items-center gap-1 mb-1">
                            <span class="material-symbols-outlined text-[14px] text-success-green">arrow_downward</span>
                            <span class="text-[9px] sm:text-xs font-bold text-white/70 uppercase tracking-wider truncate">Pendapatan</span>
                        </div>
                        <div id="summary-pendapatan" class="font-heading font-bold text-xs sm:text-lg text-white truncate">Rp 0</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-md rounded-[16px] p-2.5 sm:p-4 border border-white/10 overflow-hidden">
                        <div class="flex items-center gap-1 mb-1">
                            <span class="material-symbols-outlined text-[14px] text-danger-red">arrow_upward</span>
                            <span class="text-[9px] sm:text-xs font-bold text-white/70 uppercase tracking-wider truncate">Beban</span>
                        </div>
                        <div id="summary-beban" class="font-heading font-bold text-xs sm:text-lg text-white truncate">Rp 0</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-md rounded-[16px] p-2.5 sm:p-4 border border-white/10 overflow-hidden">
                        <div class="flex items-center gap-1 mb-1">
                            <span class="material-symbols-outlined text-[14px] text-white">account_balance</span>
                            <span class="text-[9px] sm:text-xs font-bold text-white/70 uppercase tracking-wider truncate">Saldo Kas</span>
                        </div>
                        <div id="summary-kas" class="font-heading font-bold text-xs sm:text-lg text-white truncate">Rp 0</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 2. Grafik & Diagram -->
        <section class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <!-- Main Chart Card -->
                <div class="lg:col-span-3 bg-white p-4 sm:p-6 rounded-[20px] border border-outline-variant/30 shadow-card flex flex-col min-h-[360px]">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h3 class="font-heading font-bold text-base text-on-surface">Tren Keuangan</h3>
                            <p class="text-xs text-on-surface-variant mt-0.5">Pendapatan vs beban per periode</p>
                        </div>
                        <div class="flex items-center gap-3 text-xs font-semibold">
                            <span class="flex items-center gap-1 text-success-green"><div class="w-2.5 h-2.5 rounded-full bg-success-green"></div> Pendapatan</span>
                            <span class="flex items-center gap-1 text-danger-red"><div class="w-2.5 h-2.5 rounded-full bg-danger-red"></div> Beban</span>
                        </div>
                    </div>
                    <div class="w-full h-[260px] sm:h-[300px] relative grow">
                        <canvas id="reports-chart"></canvas>
                    </div>
                </div>

                <!-- Category Breakdown -->
                <div class="lg:col-span-2 bg-white p-4 sm:p-6 rounded-[20px] border border-outline-variant/30 shadow-card flex flex-col">
                    <div class="mb-4">
                        <h3 class="font-heading font-bold text-base text-on-surface">Komposisi Kategori</h3>
                        <p class="text-xs text-on-surface-variant mt-0.5">Proporsi per kategori transaksi</p>
                    </div>
                    <div class="w-full h-[180px] relative flex items-center justify-center">
                        <canvas id="reports-donut-chart"></canvas>
                    </div>
                    <div id="donut-legend" class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium"></div>
                </div>
            </div>
        </section>

        <!-- 3. Pemilihan Periode Pelaporan -->
        <section class="bg-white rounded-[20px] border border-outline-variant/30 shadow-card p-5">
            <div class="flex items-center gap-2 mb-4">
                <span class="material-symbols-outlined text-primary text-[20px]">date_range</span>
                <h3 class="font-heading font-bold text-base text-on-surface">Periode Pelaporan</h3>
            </div>
            <!-- Preset Shortcuts -->
            <div class="flex flex-wrap gap-2 mb-4">
                <button data-preset="this_week" class="reports-preset-btn px-4 py-2 rounded-full text-xs font-bold border border-outline-variant/30 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all">Minggu Ini</button>
                <button data-preset="this_month" class="reports-preset-btn px-4 py-2 rounded-full text-xs font-bold bg-primary text-white border border-primary shadow-sm">Bulan Ini</button>
                <button data-preset="this_year" class="reports-preset-btn px-4 py-2 rounded-full text-xs font-bold border border-outline-variant/30 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all">Tahun Ini</button>
                <button data-preset="all_time" class="reports-preset-btn px-4 py-2 rounded-full text-xs font-bold border border-outline-variant/30 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all">Semua Waktu</button>
            </div>
            <!-- Date Range Inputs -->
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-on-surface-variant">Dari Tanggal</label>
                    <input type="date" id="reports-date-from" class="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary transition-all">
                </div>
                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-on-surface-variant">Sampai Tanggal</label>
                    <input type="date" id="reports-date-to" class="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary transition-all">
                </div>
            </div>
        </section>

        <!-- 4. Tombol-tombol Pemilihan Laporan (Vertikal) -->
        <section class="space-y-3">
            <h3 class="font-heading font-bold text-base text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[20px]">description</span>
                Pilih Laporan Keuangan
            </h3>
            <button id="btn-report-labarugi" class="report-nav-btn w-full bg-white rounded-[20px] p-4 sm:p-5 shadow-card border border-outline-variant/30 hover:shadow-float hover:border-primary/30 transition-all flex items-center gap-4 group active:scale-[0.99]">
                <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-[24px]">request_quote</span>
                </div>
                <div class="flex-1 text-left min-w-0">
                    <h4 class="font-bold text-on-surface text-sm sm:text-base">Laporan Laba/Rugi</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5 truncate">Pendapatan, HPP, beban operasional & laba bersih</p>
                </div>
                <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors flex-shrink-0">chevron_right</span>
            </button>
            <button id="btn-report-neraca" class="report-nav-btn w-full bg-white rounded-[20px] p-4 sm:p-5 shadow-card border border-outline-variant/30 hover:shadow-float hover:border-primary/30 transition-all flex items-center gap-4 group active:scale-[0.99]">
                <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-[24px]">balance</span>
                </div>
                <div class="flex-1 text-left min-w-0">
                    <h4 class="font-bold text-on-surface text-sm sm:text-base">Laporan Neraca</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5 truncate">Aset, kewajiban & ekuitas perusahaan</p>
                </div>
                <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors flex-shrink-0">chevron_right</span>
            </button>
            <button id="btn-report-aruskas" class="report-nav-btn w-full bg-white rounded-[20px] p-4 sm:p-5 shadow-card border border-outline-variant/30 hover:shadow-float hover:border-primary/30 transition-all flex items-center gap-4 group active:scale-[0.99]">
                <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-[24px]">sync_alt</span>
                </div>
                <div class="flex-1 text-left min-w-0">
                    <h4 class="font-bold text-on-surface text-sm sm:text-base">Laporan Arus Kas</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5 truncate">Aliran kas masuk & keluar bisnis Anda</p>
                </div>
                <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors flex-shrink-0">chevron_right</span>
            </button>
            <button id="btn-report-persediaan" class="report-nav-btn w-full bg-white rounded-[20px] p-4 sm:p-5 shadow-card border border-outline-variant/30 hover:shadow-float hover:border-primary/30 transition-all flex items-center gap-4 group active:scale-[0.99]">
                <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-[24px]">inventory_2</span>
                </div>
                <div class="flex-1 text-left min-w-0">
                    <h4 class="font-bold text-on-surface text-sm sm:text-base">Laporan Persediaan</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5 truncate">Nilai stok produk jadi & bahan baku</p>
                </div>
                <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors flex-shrink-0">chevron_right</span>
            </button>
        </section>
    </div>

    <!-- VIEW 2: Halaman Khusus Detail Laporan (Full Page Report View) -->
    <div id="reports-detail-view" class="hidden space-y-4">
        <!-- Top Navigation Bar for Report Detail -->
        <div class="flex items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-[20px] border border-outline-variant/30 shadow-card">
            <button id="btn-back-to-reports-hub" class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-outline-variant/30 text-on-surface font-bold text-xs sm:text-sm transition-all active:scale-95 flex-shrink-0">
                <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali
            </button>
            <div class="text-center min-w-0 flex-1">
                <h3 id="report-detail-title" class="font-heading font-bold text-base sm:text-lg text-on-surface truncate">Detail Laporan</h3>
                <p id="report-detail-subtitle" class="text-[11px] sm:text-xs text-on-surface-variant truncate">Periode: -</p>
            </div>
            <button id="btn-download-active-report" class="bg-gradient-ocean hover:bg-gradient-ocean-hover text-white rounded-xl px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 flex-shrink-0">
                <span class="material-symbols-outlined text-[16px]">download</span>
                PDF
            </button>
        </div>

        <!-- Full-Width Report Content Container -->
        <div class="w-full">
            <section id="panel-labarugi" class="report-panel hidden">
                <div id="lr-content"></div>
            </section>
            <section id="panel-neraca" class="report-panel hidden">
                <div id="neraca-content"></div>
            </section>
            <section id="panel-aruskas" class="report-panel hidden">
                <div id="aruskas-content"></div>
            </section>
            <section id="panel-persediaan" class="report-panel hidden">
                <div id="persediaan-content"></div>
            </section>
        </div>
    </div>

</div>
`;


const templateProfile = `
<div class="space-y-8 pt-8 max-w-7xl mx-auto pb-32">
    <!-- Header -->
    <section class="flex flex-col items-center text-center">
        <div class="w-24 h-24 rounded-full bg-primary-container/10 ring-4 ring-primary/20 flex items-center justify-center overflow-hidden mb-4 relative shadow-sm">
            <span class="material-symbols-outlined text-[48px] text-primary" id="profile-avatar-icon">storefront</span>
        </div>
        <h2 id="profile-business-name" class="font-heading font-bold text-2xl text-on-surface">Memuat...</h2>
        <p class="text-sm text-on-surface-variant mt-1" id="profile-owner-name">Memuat...</p>
        <p class="text-xs text-on-surface-variant mt-0.5" id="profile-email-display"></p>
        <div class="mt-3 px-4 py-1.5 border border-success-green/20 text-success-green bg-success-green/10 rounded-full text-xs font-bold tracking-wide">
            PREMIUM PLAN
        </div>
    </section>

    <!-- Main Menus -->
    <section class="space-y-4">
        <!-- Laporan Keuangan (Hero Card) -->
        <div id="profile-nav-reports" class="bg-gradient-ocean hover:bg-gradient-ocean-hover cursor-pointer transition-all duration-300 hover:scale-[1.01] rounded-[24px] p-6 shadow-glow border border-white/10 text-white flex items-center justify-between group">
            <div>
                <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <span class="material-symbols-outlined">bar_chart</span>
                </div>
                <h3 class="font-heading font-bold text-xl mb-1">Laporan Keuangan</h3>
                <p class="text-sm text-white/80">Pantau performa penjualan dan kas.</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <span class="material-symbols-outlined">arrow_forward</span>
            </div>
        </div>

        <!-- Grid Menus -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div id="menu-kelola-rekening" class="bg-white rounded-[20px] p-4 shadow-card border border-outline-variant/30 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 group active:scale-[0.98]">
                <div class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">account_balance</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-semibold text-on-surface text-sm md:text-base">Kelola Rekening</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5">Atur bank dan e-wallet</p>
                </div>
                <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>
            <div id="menu-pengaturan" class="bg-white rounded-[20px] p-4 shadow-card border border-outline-variant/30 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 group active:scale-[0.98]">
                <div class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">settings</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-semibold text-on-surface text-sm md:text-base">Pengaturan</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5">Tema & Bahasa</p>
                </div>
                <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>
            <div id="menu-printer" class="bg-white rounded-[20px] p-4 shadow-card border border-outline-variant/30 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 group active:scale-[0.98]">
                <div class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">print</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-semibold text-on-surface text-sm md:text-base">Pengaturan Printer</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5">Koneksi Bluetooth</p>
                </div>
                <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>
        </div>

        <!-- Edit Profil -->
        <div id="menu-edit-profil" class="bg-white rounded-[20px] p-4 shadow-card border border-outline-variant/30 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 group active:scale-[0.98]">
            <div class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">manage_accounts</span>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold text-on-surface text-sm md:text-base">Edit Profil</h4>
                <p class="text-xs text-on-surface-variant mt-0.5">Ubah data toko &amp; pemilik</p>
            </div>
            <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
        </div>
    </section>

    <!-- Logout Area -->
    <section class="pt-4 pb-12 flex flex-col items-center gap-3">
        <button id="btn-ganti-akun" class="flex items-center gap-2 px-6 py-3 rounded-full text-danger-red hover:bg-error-container/20 transition-colors active:scale-95">
            <span class="material-symbols-outlined text-[18px]">logout</span>
            <span class="text-sm font-semibold">Keluar / Ganti Akun</span>
        </button>
        <p class="text-xs text-on-surface-variant">finMo v1.0</p>
    </section>
</div>
`;

const templateHello = `
<div id="hello-screen" class="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-[#f4fbf7] flex flex-col items-center justify-center m-0 p-0 overflow-hidden transition-all duration-700">
    <div class="flex flex-col items-center justify-center text-center gap-3 p-4 my-auto">
        <h1 class="hello-cursive font-['Caveat',cursive] text-7xl sm:text-8xl md:text-[9rem] bg-clip-text text-transparent bg-gradient-to-r from-[#1e40af] via-[#0ea5e9] to-[#84cc16] tracking-wide drop-shadow-sm font-bold leading-normal m-0 p-0 select-none" style="background-size:200% 200%; animation: hello-fade-in-up 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both, hello-bg-shift 4s ease infinite 1.3s;">Hello!</h1>
        <p class="hello-subtitle text-on-surface-variant text-base sm:text-lg font-medium tracking-wide m-0 p-0">Selamat datang di <span class="font-bold text-primary">FinMo</span></p>
    </div>
</div>
`;

const templateSignIn = `
<div class="min-h-[85vh] flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-[400px]">
        <!-- Logo Section -->
        <!-- Logo Section -->
        <div class="flex items-center justify-center gap-2 mb-6">
            <svg viewBox="0 0 120 60" class="w-16 h-8 drop-shadow-sm" fill="none">
                <defs>
                    <linearGradient id="gLogo3" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#1e40af"/>
                        <stop offset="50%" stop-color="#0ea5e9"/>
                        <stop offset="100%" stop-color="#84cc16"/>
                    </linearGradient>
                </defs>
                <path d="M 35 10 A 20 20 0 1 0 35 50 C 55 50 65 10 85 10 A 20 20 0 1 1 85 50 C 65 50 55 10 35 10 Z" stroke="url(#gLogo3)" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>
            </svg>
            <h1 class="font-['Poppins',sans-serif] font-bold italic text-4xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1e40af] via-[#0ea5e9] to-[#84cc16] pb-1 leading-normal">finmo</h1>
        </div>
        
        <!-- Heading -->
        <div class="text-center mb-6">
            <h2 class="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">Selamat Datang Kembali</h2>
            <p class="font-body-md text-body-md text-on-surface-variant">Silakan masuk ke akun Anda</p>
        </div>
        
        <div class="bg-surface-container-lowest rounded-[24px] shadow-soft-shadow p-6 sm:p-8 border border-outline-variant/30">
            <!-- Pilihan Login -->
            <div class="flex bg-surface-container-low rounded-[20px] p-1 mb-5">
                <button type="button" id="signin-type-email" class="signin-tab-btn flex-1 py-2.5 text-xs bg-white text-primary font-bold shadow-sm rounded-xl text-center transition-all">Email</button>
                <button type="button" id="signin-type-phone" class="signin-tab-btn flex-1 py-2.5 text-xs text-on-surface-variant font-medium text-center rounded-xl transition-all">Nomor HP</button>
            </div>

            <form id="signin-form" class="space-y-4">
                <input type="hidden" id="signin-method" value="email">
                
                <div id="signin-email-container" class="flex flex-col gap-1.5">
                    <label class="font-label-md text-label-md text-on-surface-variant" for="signin-email">Alamat Email</label>
                    <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                        <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">mail</span>
                        <input class="w-full h-14 pl-12 pr-4 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none" id="signin-email" placeholder="contoh@email.com" type="email">
                    </div>
                </div>

                <div id="signin-phone-container" class="hidden flex flex-col gap-1.5">
                    <label class="font-label-md text-label-md text-on-surface-variant" for="signin-phone">Nomor HP</label>
                    <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                        <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">call</span>
                        <input class="w-full h-14 pl-12 pr-4 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none" id="signin-phone" placeholder="08xxxxxxxxxx" type="tel">
                    </div>
                </div>

                <div class="flex flex-col gap-1.5">
                    <div class="flex justify-between items-center">
                        <label class="font-label-md text-label-md text-on-surface-variant" for="signin-password">Password</label>
                        <a href="#" id="btn-forgot-password" class="font-label-sm text-label-sm text-primary hover:underline">Lupa Password?</a>
                    </div>
                    <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                        <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">lock</span>
                        <input class="w-full h-14 pl-12 pr-12 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none" id="signin-password" required placeholder="••••••••" type="password">
                        <button type="button" class="absolute right-4 text-outline-variant hover:text-on-surface transition-colors focus:outline-none" onclick="togglePasswordVisibility('signin-password', this)">
                            <span class="material-symbols-outlined text-[20px]">visibility_off</span>
                        </button>
                    </div>
                </div>
                
                <button class="w-full h-14 bg-primary text-on-primary rounded-full font-label-md text-label-md shadow-[0_8px_20px_-4px_rgba(67,0,225,0.4)] hover:bg-primary-container hover:shadow-[0_12px_24px_-4px_rgba(67,0,225,0.5)] active:scale-[0.98] transition-all duration-200 mt-2" type="submit">
                    Masuk
                </button>
            </form>

            <div class="relative my-5">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-outline-variant/30"></div>
                </div>
                <div class="relative flex justify-center text-xs">
                    <span class="px-3 bg-surface-container-lowest text-on-surface-variant font-medium">Atau masuk dengan</span>
                </div>
            </div>

            <button id="btn-google-signin" class="w-full h-14 flex items-center justify-center gap-2 border border-outline-variant/50 rounded-full hover:bg-surface-container-low transition-all active:scale-[0.98]">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google">
                <span class="text-sm font-semibold text-on-surface">Masuk dengan Google</span>
            </button>
        </div>
        
        <p class="text-center mt-6 text-xs text-on-surface-variant">Belum punya akun? <a id="link-signup" class="text-primary font-bold hover:underline cursor-pointer">Daftar Sekarang</a></p>
    </div>
</div>
`;

const templateSignUp = `
<div class="min-h-[85vh] flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-xl">
        <!-- Logo Section -->
        <!-- Logo Section -->
        <div class="flex items-center justify-center gap-2 mb-6">
            <svg viewBox="0 0 120 60" class="w-16 h-8 drop-shadow-sm" fill="none">
                <defs>
                    <linearGradient id="gLogo4" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#1e40af"/>
                        <stop offset="50%" stop-color="#0ea5e9"/>
                        <stop offset="100%" stop-color="#84cc16"/>
                    </linearGradient>
                </defs>
                <path d="M 35 10 A 20 20 0 1 0 35 50 C 55 50 65 10 85 10 A 20 20 0 1 1 85 50 C 65 50 55 10 35 10 Z" stroke="url(#gLogo4)" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>
            </svg>
            <h1 class="font-['Poppins',sans-serif] font-bold italic text-4xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1e40af] via-[#0ea5e9] to-[#84cc16] pb-1 leading-normal">finmo</h1>
        </div>

        <div class="text-center mb-6">
            <h1 class="font-heading font-bold text-2xl text-on-surface mb-1">Mulai Bisnis Anda</h1>
            <p class="text-on-surface-variant text-xs text-center">Buat akun gratis dan kelola bisnis UMKM Anda.</p>
        </div>
        
        <div class="bg-surface-container-lowest rounded-[24px] shadow-soft-shadow border border-outline-variant/30 p-6 sm:p-8 space-y-5">
            <!-- Pilihan Sign Up -->
            <div class="flex bg-surface-container-low rounded-[20px] p-1">
                <button type="button" id="signup-type-email" class="signup-tab-btn flex-1 py-2.5 text-xs bg-white text-primary font-bold shadow-sm rounded-xl text-center transition-all">Daftar Email</button>
                <button type="button" id="signup-type-phone" class="signup-tab-btn flex-1 py-2.5 text-xs text-on-surface-variant font-medium text-center rounded-xl transition-all">Daftar Nomor HP</button>
            </div>

            <form id="signup-form" class="space-y-4">
                <input type="hidden" id="signup-method" value="email">
                
                <!-- Section 1: Akun & Keamanan -->
                <div class="space-y-4">
                    <h3 class="text-xs font-bold text-primary uppercase tracking-wider">1. Informasi Akun</h3>
                    
                    <div id="signup-email-container" class="flex flex-col gap-1.5">
                        <label class="font-label-md text-label-md text-on-surface-variant" for="signup-email">Alamat Email *</label>
                        <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                            <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">mail</span>
                            <input class="w-full h-14 pl-12 pr-4 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none" id="signup-email" placeholder="you@company.com" type="email">
                        </div>
                    </div>

                    <div id="signup-phone-container" class="hidden flex flex-col gap-1.5">
                        <label class="font-label-md text-label-md text-on-surface-variant" for="signup-phone">Nomor HP *</label>
                        <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                            <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">call</span>
                            <input class="w-full h-14 pl-12 pr-4 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none" id="signup-phone" placeholder="08xxxxxxxxxx" type="tel">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="font-label-md text-label-md text-on-surface-variant" for="signup-password">Password *</label>
                            <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                                <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">lock</span>
                                <input class="w-full h-14 pl-12 pr-12 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none" id="signup-password" required placeholder="Min. 6 karakter" type="password">
                                <button type="button" class="absolute right-4 text-outline-variant hover:text-on-surface transition-colors focus:outline-none" onclick="togglePasswordVisibility('signup-password', this)">
                                    <span class="material-symbols-outlined text-[20px]">visibility_off</span>
                                </button>
                            </div>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="font-label-md text-label-md text-on-surface-variant" for="signup-confirm">Konfirmasi Password *</label>
                            <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                                <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">password</span>
                                <input class="w-full h-14 pl-12 pr-4 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none" id="signup-confirm" required placeholder="Ulangi password" type="password">
                            </div>
                        </div>
                    </div>
                </div>

                <hr class="border-outline-variant/30">

                <!-- Section 2: Data Usaha -->
                <div class="space-y-4">
                    <h3 class="text-xs font-bold text-primary uppercase tracking-wider">2. Detail Profil Usaha</h3>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="font-label-md text-label-md text-on-surface-variant" for="signup-name">Nama Usaha / Toko *</label>
                            <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                                <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">storefront</span>
                                <input class="w-full h-14 pl-12 pr-4 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none" id="signup-name" required placeholder="Contoh: Toko Berkah" type="text">
                            </div>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="font-label-md text-label-md text-on-surface-variant" for="signup-owner">Nama Pemilik *</label>
                            <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                                <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">person</span>
                                <input class="w-full h-14 pl-12 pr-4 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none" id="signup-owner" required placeholder="Nama Anda" type="text">
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <label class="font-label-md text-label-md text-on-surface-variant" for="signup-business-type">Jenis Usaha *</label>
                        <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                            <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">category</span>
                            <select id="signup-business-type" required class="w-full h-14 pl-12 pr-10 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none cursor-pointer appearance-none">
                                <option value="">Pilih Jenis Usaha...</option>
                                <option value="Dagang / Retail">Dagang / Retail (Warung, Minimarket, Fashion, dll.)</option>
                                <option value="Kuliner">Kuliner (Cafe, Restoran, Makanan Ringan, Catering)</option>
                                <option value="Jasa">Jasa (Laundry, Bengkel, Salon, Konsultan, dll.)</option>
                                <option value="Manufaktur / Produksi">Manufaktur / Produksi (Pabrik Rumahan, Kerajinan, dll.)</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                            <span class="material-symbols-outlined absolute right-4 text-outline-variant pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="font-label-md text-label-md text-on-surface-variant" for="signup-start-period">Periode Awal Usaha *</label>
                            <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                                <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">calendar_today</span>
                                <input type="month" id="signup-start-period" required class="w-full h-14 pl-12 pr-4 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none">
                            </div>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="font-label-md text-label-md text-on-surface-variant" for="signup-accounting-period">Mulai Akuntansi *</label>
                            <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200">
                                <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">calendar_month</span>
                                <input type="month" id="signup-accounting-period" required class="w-full h-14 pl-12 pr-4 bg-transparent border-none rounded-[20px] font-body-md text-body-md text-on-surface focus:ring-0 outline-none">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex items-start gap-2 pt-2">
                    <input type="checkbox" id="terms" required class="mt-1 border-outline-variant/50 text-primary focus:ring-primary rounded">
                    <label for="terms" class="text-xs text-on-surface-variant">
                        Saya menyetujui <a href="#" class="text-primary font-semibold hover:underline">Syarat & Ketentuan</a> serta <a href="#" class="text-primary font-semibold hover:underline">Kebijakan Privasi</a> finMo.
                    </label>
                </div>
                
                <button class="w-full h-14 bg-primary text-on-primary rounded-full font-label-md text-label-md shadow-[0_8px_20px_-4px_rgba(67,0,225,0.4)] hover:bg-primary-container hover:shadow-[0_12px_24px_-4px_rgba(67,0,225,0.5)] active:scale-[0.98] transition-all duration-200 mt-4" type="submit">
                    Daftar Akun Baru
                </button>
            </form>

            <div class="relative">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-outline-variant/30"></div>
                </div>
                <div class="relative flex justify-center text-xs">
                    <span class="px-3 bg-surface-container-lowest text-on-surface-variant font-medium">Or continue with</span>
                </div>
            </div>

            <button id="btn-google-signup" class="w-full h-14 flex items-center justify-center gap-2 border border-outline-variant/50 rounded-full hover:bg-surface-container-low transition-all active:scale-[0.98]">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google">
                <span class="text-sm font-semibold text-on-surface">Daftar dengan Google</span>
            </button>
        </div>
        
        <p class="text-center mt-6 text-xs text-on-surface-variant">Sudah memiliki akun? <a id="link-signin" class="text-primary font-bold hover:underline cursor-pointer">Masuk</a></p>
    </div>
</div>
`;

// Template for Wallets Management View
const templateSettings = `
<div class="max-w-7xl mx-auto space-y-6 animate-fade-in relative pb-24 pt-4 px-4">
    <div class="flex items-center gap-4 mb-6">
        <button id="btn-back-settings" class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95">
            <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 class="font-heading font-bold text-2xl text-on-surface">Pengaturan</h2>
    </div>

    <div class="bg-surface rounded-[24px] shadow-sm border border-outline-variant/30 overflow-hidden">
        <!-- Theme Setting -->
        <div class="p-5 flex items-center justify-between border-b border-outline-variant/30">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined">dark_mode</span>
                </div>
                <div>
                    <h4 class="font-bold text-on-surface">Mode Gelap</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5">Sesuaikan tampilan aplikasi</p>
                </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="toggle-dark-mode" class="sr-only peer">
                <div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
        </div>

        <!-- Language Setting -->
        <div class="p-5 flex items-center justify-between border-b border-outline-variant/30">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined">language</span>
                </div>
                <div>
                    <h4 class="font-bold text-on-surface">Bahasa Aplikasi</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5">Ubah bahasa antarmuka</p>
                </div>
            </div>
            <select id="select-language" class="bg-surface-container-low border-none rounded-xl text-sm font-semibold text-on-surface p-2 focus:ring-0 cursor-pointer">
                <option value="id">Indonesia</option>
                <option value="en">English (BETA)</option>
            </select>
        </div>
        
        <div class="p-5 flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                    <span class="material-symbols-outlined">delete_forever</span>
                </div>
                <div>
                    <h4 class="font-bold text-on-surface text-error">Hapus Akun</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
                </div>
            </div>
            <button id="btn-delete-account" class="px-4 py-2 bg-error/10 text-error font-bold text-xs rounded-xl active:scale-95 transition-transform">Hapus</button>
        </div>
    </div>
</div>
`;

const templateWallets = `
<div class="space-y-6 pt-6 max-w-7xl mx-auto pb-32">
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <button id="btn-back-profile" class="text-on-surface-variant hover:text-primary mb-2 flex items-center gap-1 transition-colors">
                <span class="material-symbols-outlined text-[18px]">arrow_back</span> Kembali
            </button>
            <h1 class="font-heading font-bold text-3xl text-on-surface">Kelola Rekening</h1>
        </div>
        <button id="btn-tambah-rekening" class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-ocean text-white font-medium shadow-glow hover:bg-gradient-ocean-hover transition-colors whitespace-nowrap">
            <span class="material-symbols-outlined text-[20px]">add</span> Tambah Rekening
        </button>
    </section>

    <div id="wallets-list-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="p-6 text-center text-on-surface-variant col-span-full">Memuat rekening...</div>
    </div>
</div>

`;

const templateProducts = `
<div class="space-y-6 pt-6 pb-32 max-w-7xl mx-auto">
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <button id="btn-back-profile-from-prod" class="text-on-surface-variant hover:text-primary mb-2 flex items-center gap-1 transition-colors">
                <span class="material-symbols-outlined text-[18px]">arrow_back</span> Kembali
            </button>
            <h1 class="font-heading font-bold text-3xl text-on-surface">Kelola Stok & Produk</h1>
        </div>
        <div class="flex flex-wrap gap-2">
            <button id="btn-restock-page" class="flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-surface-container-low text-primary font-bold shadow-sm hover:shadow-md transition-all whitespace-nowrap text-sm sm:text-base flex">
                <span class="material-symbols-outlined text-[18px] sm:text-[20px]">inventory</span> Restok
            </button>
            <button id="btn-tambah-produk-page" class="flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-ocean text-white font-bold shadow-glow hover:bg-gradient-ocean-hover transition-all whitespace-nowrap text-sm sm:text-base flex">
                <span class="material-symbols-outlined text-[18px] sm:text-[20px]">add</span> Tambah Produk
            </button>
        </div>
    </section>

    <div id="products-list-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="p-6 text-center text-on-surface-variant col-span-full bg-white rounded-[20px] border border-outline-variant/30 shadow-sm">Memuat produk...</div>
    </div>
</div>
`;


const templateRawMaterials = `
<div class="max-w-7xl mx-auto space-y-6 animate-fade-in relative pb-24">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
            <h2 class="font-heading font-bold text-3xl text-on-surface">Bahan Baku</h2>
            <p class="text-on-surface-variant mt-1">Kelola stok dan harga modal bahan baku Anda</p>
        </div>
        <button id="btn-add-raw-material" class="bg-gradient-ocean hover:bg-gradient-ocean-hover text-white px-5 py-2.5 rounded-full font-bold flex items-center justify-center gap-2 shadow-glow transition-all">
            <span class="material-symbols-outlined">add</span>
            Beli Bahan Baku
        </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white rounded-[20px] p-5 shadow-card border border-outline-variant/30 flex flex-col gap-2 relative overflow-hidden group hover:shadow-float transition-all">
            <div class="absolute -right-6 -top-6 w-24 h-24 bg-gradient-ocean/5 rounded-full blur-2xl group-hover:bg-gradient-ocean/10 transition-colors"></div>
            <div class="flex items-center gap-2 text-on-surface-variant">
                <span class="material-symbols-outlined text-[20px] text-primary">kitchen</span>
                <span class="text-sm font-semibold">Total Item Bahan Baku</span>
            </div>
            <div class="mt-1 relative z-10">
                <span id="stat-raw-items" class="font-heading font-bold text-3xl text-on-surface">0</span>
            </div>
        </div>
        <div class="bg-white rounded-[20px] p-5 shadow-card border border-outline-variant/30 flex flex-col gap-2 relative overflow-hidden group hover:shadow-float transition-all">
            <div class="absolute -right-6 -top-6 w-24 h-24 bg-gradient-ocean/5 rounded-full blur-2xl group-hover:bg-gradient-ocean/10 transition-colors"></div>
            <div class="flex items-center gap-2 text-on-surface-variant">
                <span class="material-symbols-outlined text-[20px] text-primary">inventory_2</span>
                <span class="text-sm font-semibold">Nilai Aset Bahan Baku</span>
            </div>
            <div class="mt-1 relative z-10">
                <span id="stat-raw-value" class="font-heading font-bold text-3xl text-on-surface">Rp 0</span>
            </div>
        </div>
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
        <input type="text" id="search-raw" placeholder="Cari bahan baku..." 
               class="w-full pl-12 pr-4 h-14 bg-surface-container-low border border-outline-variant/30 rounded-[20px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm">
    </div>

    <!-- List -->
    <div id="raw-materials-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Loader -->
        <div class="col-span-full py-12 flex justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    </div>
</div>
`;



// Helper: Format Rupiah
export function populateSelect(selectEl, items, placeholder, mapFn, onTambahBaru) {
    if (!selectEl) return;
    let html = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
        const { value, label } = mapFn(item);
        html += `<option value="${value}">${label}</option>`;
    });
    
    if (onTambahBaru) {
        html += `<option value="__TAMBAH_BARU__">+ Tambah Baru</option>`;
    }
    
    selectEl.innerHTML = html;
    
    selectEl._fullItems = items;
    selectEl._mapFn = mapFn;
    selectEl._placeholder = placeholder;
    selectEl._onTambahBaru = onTambahBaru;
}
window.populateSelect = populateSelect;

window.openLainnyaModal = function(selectEl) {
    const modal = document.getElementById('modal-lainnya');
    if (!modal) return;
    const ul = document.getElementById('lainnya-list');
    const search = document.getElementById('search-lainnya');
    const title = document.getElementById('lainnya-title');
    
    title.textContent = selectEl._placeholder || 'Pilih Opsi';
    ul.innerHTML = '';
    search.value = '';
    
    const renderList = (filter = '') => {
        ul.innerHTML = '';
        const items = selectEl._fullItems.filter(item => {
            const { label } = selectEl._mapFn(item);
            return label.toLowerCase().includes(filter.toLowerCase());
        });
        items.forEach(item => {
            const { value, label } = selectEl._mapFn(item);
            const li = document.createElement('li');
            li.className = 'p-4 bg-surface-container-lowest rounded-[16px] mb-2 border border-outline-variant/30 active:scale-95 transition-all text-on-surface font-semibold text-sm cursor-pointer hover:bg-surface-container-low';
            li.textContent = label;
            li.onclick = () => {
                let optionExists = Array.from(selectEl.options).some(opt => opt.value === value);
                if (!optionExists) {
                    const opt = document.createElement('option');
                    opt.value = value;
                    opt.text = label;
                    selectEl.insertBefore(opt, selectEl.options[1]); // insert after placeholder
                }
                selectEl.value = value;
                closeModal(modal);
                selectEl.dispatchEvent(new Event('change'));
            };
            ul.appendChild(li);
        });
    };
    
    renderList();
    search.oninput = (e) => renderList(e.target.value);
    
    document.getElementById('close-modal-lainnya').onclick = () => closeModal(modal);
    openModal(modal);
}

document.addEventListener('change', (e) => {
    if (e.target.tagName === 'SELECT') {
        if (e.target.value === '__LAINNYA__') {
            e.target.value = ''; 
            window.openLainnyaModal(e.target);
        } else if (e.target.value === '__TAMBAH_BARU__') {
            const selectEl = e.target;
            selectEl.value = ''; 
            if (selectEl._onTambahBaru) selectEl._onTambahBaru(selectEl);
        }
    }
});

export function initCustomDatePicker() {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dpListDay = document.getElementById('dp-list-day');
    const dpListMonth = document.getElementById('dp-list-month');
    const dpListYear = document.getElementById('dp-list-year');
    const modal = document.getElementById('modal-datepicker');
    const content = document.getElementById('modal-datepicker-content');
    if(!modal) return;
    
    let daysHtml = '', monthsHtml = '', yearsHtml = '';
    for(let i=1; i<=31; i++) daysHtml += `<div class="dp-item" data-val="${i}">${i.toString().padStart(2,'0')}</div>`;
    months.forEach((m, i) => monthsHtml += `<div class="dp-item" data-val="${i+1}">${m}</div>`);
    const currYear = new Date().getFullYear();
    for(let i=currYear-5; i<=currYear+5; i++) yearsHtml += `<div class="dp-item" data-val="${i}">${i}</div>`;
    
    dpListDay.innerHTML = daysHtml;
    dpListMonth.innerHTML = monthsHtml;
    dpListYear.innerHTML = yearsHtml;
    
    let activeInput = null;
    
    function handleScroll(wheel, list) {
        const index = Math.round(wheel.scrollTop / 40);
        Array.from(list.children).forEach(c => c.classList.remove('active'));
        if(list.children[index]) list.children[index].classList.add('active');
    }
    
    ['day', 'month', 'year'].forEach(type => {
        const wheel = document.getElementById(`dp-wheel-${type}`);
        const list = document.getElementById(`dp-list-${type}`);
        if(wheel && list) {
            wheel.addEventListener('scroll', () => handleScroll(wheel, list));
            setTimeout(() => handleScroll(wheel, list), 100);
        }
    });
    
    function scrollToVal(type, val) {
        const list = document.getElementById(`dp-list-${type}`);
        const index = Array.from(list.children).findIndex(c => c.dataset.val == val);
        if(index >= 0) {
            document.getElementById(`dp-wheel-${type}`).scrollTop = index * 40;
        }
    }
    
    window.openDatePicker = function(inputEl) {
        activeInput = inputEl;
        let d = new Date();
        if(inputEl.value) d = new Date(inputEl.value);
        if(isNaN(d.getTime())) d = new Date();
        
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('translate-y-full');
            scrollToVal('day', d.getDate());
            scrollToVal('month', d.getMonth() + 1);
            scrollToVal('year', d.getFullYear());
        }, 10);
    };
    
    window.closeDatePicker = function() {
        modal.classList.add('opacity-0');
        content.classList.add('translate-y-full');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };
    
    document.getElementById('dp-btn-today').onclick = () => {
        const d = new Date();
        scrollToVal('day', d.getDate());
        scrollToVal('month', d.getMonth() + 1);
        scrollToVal('year', d.getFullYear());
    };
    
    document.getElementById('dp-btn-confirm').onclick = () => {
        const dItem = document.querySelector('#dp-list-day .active');
        const mItem = document.querySelector('#dp-list-month .active');
        const yItem = document.querySelector('#dp-list-year .active');
        if(activeInput && dItem && mItem && yItem) {
            const val = `${yItem.dataset.val}-${mItem.dataset.val.padStart(2,'0')}-${dItem.dataset.val.padStart(2,'0')}`;
            activeInput.value = val;
            activeInput.dispatchEvent(new Event('change'));
        }
        closeDatePicker();
    };
    
    modal.onclick = (e) => {
        if(e.target === modal) closeDatePicker();
    };
}

document.addEventListener('focusin', (e) => {
    if (e.target.matches('input[type="date"]')) {
        e.target.blur(); 
        window.openDatePicker(e.target);
    }
});

document.addEventListener('click', (e) => {
    if (e.target.matches('input[type="date"]')) {
        e.preventDefault();
        e.target.blur();
        window.openDatePicker(e.target);
    }
});

window.showConfirm = function(title, message, onConfirm, type = 'error') {
    const modal = document.getElementById('modal-confirm');
    if(!modal) return;
    const content = document.getElementById('modal-confirm-content');
    
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    
    const icon = document.getElementById('confirm-icon');
    const okBtn = document.getElementById('confirm-btn-ok');
    const iconContainer = icon.parentElement;
    
    if(type === 'error') {
        icon.textContent = 'warning';
        iconContainer.className = 'w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4';
        okBtn.className = 'flex-1 py-3 text-sm font-bold text-white bg-error hover:bg-error/90 rounded-2xl shadow-md shadow-error/30 transition-colors active:scale-95';
    } else {
        icon.textContent = 'help';
        iconContainer.className = 'w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4';
        okBtn.className = 'flex-1 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-2xl shadow-md shadow-primary/30 transition-colors active:scale-95';
    }
    
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        });
    });
    
    const closeConfirm = () => {
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };
    
    document.getElementById('confirm-btn-cancel').onclick = closeConfirm;
    
    // Also close when clicking backdrop
    modal.onclick = (e) => {
        if (e.target === modal) closeConfirm();
    };
    
    okBtn.onclick = () => {
        closeConfirm();
        setTimeout(() => {
            if(onConfirm) onConfirm();
        }, 300);
    };
}

window.showInputPrompt = function(title, placeholder, onConfirm) {
    const modal = document.getElementById('modal-input-prompt');
    if(!modal) return;
    const content = document.getElementById('modal-input-content');
    const inputField = document.getElementById('input-prompt-field');
    
    document.getElementById('input-prompt-title').textContent = title;
    inputField.placeholder = placeholder || 'Masukkan data...';
    inputField.value = '';
    
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
            inputField.focus();
        });
    });
    
    const closePrompt = () => {
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };
    
    document.getElementById('input-btn-cancel').onclick = closePrompt;
    modal.onclick = (e) => {
        if (e.target === modal) closePrompt();
    };
    
    document.getElementById('input-btn-ok').onclick = () => {
        const val = inputField.value.trim();
        if (val) {
            closePrompt();
            setTimeout(() => {
                if(onConfirm) onConfirm(val);
            }, 300);
        } else {
            inputField.focus();
        }
    };
    
    // Also trigger on enter key
    inputField.onkeypress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('input-btn-ok').click();
        }
    };
}

export function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

// Helper: Compress and Convert Image to Base64 (Max 800px width)
export async function uploadReceipt(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;
                
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to Base64 string directly with 60% quality (very lightweight)
                const dataURL = canvas.toDataURL('image/jpeg', 0.6);
                resolve(dataURL);
            };
            img.onerror = (err) => reject(new Error("Gagal memproses gambar"));
        };
        reader.onerror = (err) => reject(new Error("Gagal membaca file"));
    });
}

// Helper: Group Transactions by Date
function groupTransactionsByDate(transactions) {
    const groups = {};
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    transactions.forEach(tx => {
        const d = safeToDate(tx.tanggal);
        const txDate = new Date(d);
        txDate.setHours(0,0,0,0);
        
        let label = '';
        if (txDate.getTime() === today.getTime()) {
            label = 'HARI INI, ' + d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
        } else if (txDate.getTime() === yesterday.getTime()) {
            label = 'KEMARIN, ' + d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
        } else {
            label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
        }
        
        if (!groups[label]) groups[label] = [];
        groups[label].push(tx);
    });
    return groups;
}

export async function initializeUserWallets(uid) {
    if (!uid) return;
    try {
        const walletsQ = query(collection(db, 'wallets'), where('uid', '==', uid));
        const snap = await getDocs(walletsQ);
        if (snap.empty) {
            const newWalletRef = doc(collection(db, 'wallets'));
            await setDoc(newWalletRef, {
                uid: uid,
                nama_rekening: 'Kas Utama',
                jenis: 'kas',
                saldo_terkini: 0,
                saldo_awal: 0,
                warna: '#0ea5e9',
                created_at: new Date()
            });
        }
    } catch (e) {
        console.warn("Auto initialize wallets warning:", e);
    }
}

export async function loadDashboardData(uid) {
    try {
        const [wRes, txRes] = await Promise.all([
            apiFetch('/api/wallets'),
            apiFetch('/api/transactions')
        ]);
        const walletsData = wRes.data || [];
        const txData = txRes.data || [];

        let totalSaldo = 0;
        let walletsHTML = '';
        let walletOptionsHTML = '';

        walletsData.forEach(data => {
            const saldo = Number(data.saldo_terkini || 0);
            totalSaldo += saldo;
            const name = data.nama || data.nama_rekening || 'Dompet';
            walletsHTML += '<div class="bg-surface-container-lowest rounded-2xl p-3 shadow-card border border-outline-variant/50 hover:border-primary transition-all cursor-pointer">';
            walletsHTML += '<div class="flex justify-between items-start mb-4">';
            walletsHTML += '<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style="background-color: ' + (data.color || data.warna || '#1a73e8') + '">';
            walletsHTML += name.substring(0, 2).toUpperCase();
            walletsHTML += '</div></div>';
            walletsHTML += '<div class="text-sm text-on-surface-variant mb-1">' + name + '</div>';
            walletsHTML += '<div class="font-heading font-bold text-lg text-on-surface">' + formatRupiah(saldo) + '</div>';
            walletsHTML += '</div>';

            walletOptionsHTML += '<option value="' + data.id + '">' + name + ' - ' + formatRupiah(saldo) + '</option>';
        });

        window._dashTotalSaldo = totalSaldo;
        window._saldoVisible = true;

        const elTotalSaldo = document.getElementById('dash-total-saldo');
        if (elTotalSaldo) elTotalSaldo.innerText = formatRupiah(totalSaldo);

        const elRekeningList = document.getElementById('dash-rekening-list');
        if (elRekeningList) {
            elRekeningList.innerHTML = walletsHTML || '<div class="text-sm text-on-surface-variant p-4 col-span-3 text-center">Belum ada dompet.</div>';
        }

        const selSource = document.getElementById('tx-wallet-source');
        if (selSource) selSource.innerHTML = walletOptionsHTML;
        const selDest = document.getElementById('tx-wallet-destination');
        if (selDest) selDest.innerHTML = walletOptionsHTML;

        // Process Transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let pemasukan = 0;
        let pengeluaran = 0;

        txData.forEach(data => {
            const txDate = data.tanggal_iso ? new Date(data.tanggal_iso) : safeToDate(data.tanggal);
            if (txDate >= startOfMonth) {
                if (data.kategori === 'Modal' || data.kategori === 'Setoran Piutang Mitra' || data.kategori === 'Persediaan Bahan Baku' || data.kategori === 'Persediaan Barang Jadi' || data.kategori === 'Distribusi Stok') return;

                if (data.kategori === 'Retur Penjualan') {
                    pemasukan -= (data.nominal || 0);
                } else if (data.tipe_tx === 'in') {
                    pemasukan += (data.nominal || 0);
                } else if (data.tipe_tx === 'out') {
                    pengeluaran += (data.nominal || 0);
                }
            }
        });

        const elPemasukan = document.getElementById('dash-pemasukan');
        if (elPemasukan) elPemasukan.innerText = formatRupiah(pemasukan);
        const elPengeluaran = document.getElementById('dash-pengeluaran');
        if (elPengeluaran) elPengeluaran.innerText = formatRupiah(pengeluaran);
    } catch (e) {
        console.error("loadDashboardData error:", e);
    }
}

// Ledger: Load Reports Page
export async function loadReportsPage(uid) {
    let rawTransactions = [];
    let rawWallets = [];
    let rawProducts = [];
    let rawPartners = [];
    let rawMaterials = [];
    let reportsChartInstance = null;
    let donutChartInstance = null;

    const CATEGORY_COLORS = [
        '#4300e1', '#a855f7', '#ec4899', '#10b981', '#f59e0b',
        '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316',
        '#6366f1', '#84cc16', '#e11d48', '#0ea5e9', '#d946ef'
    ];

    async function fetchAllData() {
        const tQ = query(collection(db, 'transactions'), where('uid', '==', uid));
        const tSnap = await getDocs(tQ);
        rawTransactions = tSnap.docs.map(d => ({id: d.id, ...d.data()}));

        const wQ = query(collection(db, 'wallets'), where('uid', '==', uid));
        const wSnap = await getDocs(wQ);
        rawWallets = wSnap.docs.map(d => ({id: d.id, ...d.data()}));

        const pQ = query(collection(db, 'products'), where('uid', '==', uid));
        const pSnap = await getDocs(pQ);
        rawProducts = pSnap.docs.map(d => ({id: d.id, ...d.data()}));
        
        const ptQ = query(collection(db, 'partners'), where('uid', '==', uid));
        const ptSnap = await getDocs(ptQ);
        rawPartners = ptSnap.docs.map(d => ({id: d.id, ...d.data()}));

        const rmQ = query(collection(db, 'raw_materials'), where('uid', '==', uid));
        const rmSnap = await getDocs(rmQ);
        rawMaterials = rmSnap.docs.map(d => ({id: d.id, ...d.data()}));
    }

    function getFilteredData() {
        const fromEl = document.getElementById('reports-date-from');
        const toEl = document.getElementById('reports-date-to');
        let startDate = new Date(0);
        let endDate = new Date();
        endDate.setHours(23,59,59,999);
        let filter = 'custom';

        if (fromEl && fromEl.value) {
            startDate = new Date(fromEl.value);
            startDate.setHours(0,0,0,0);
        }
        if (toEl && toEl.value) {
            endDate = new Date(toEl.value);
            endDate.setHours(23,59,59,999);
        }

        const filteredTx = rawTransactions.filter(tx => {
            if (!tx.tanggal) return false;
            const txDate = safeToDate(tx.tanggal);
            return txDate >= startDate && txDate <= endDate;
        });

        return { filteredTx, filter };
    }

    function getTimeFilterLabel() {
        const fromEl = document.getElementById('reports-date-from');
        const toEl = document.getElementById('reports-date-to');
        const opts = { day: 'numeric', month: 'short', year: 'numeric' };
        if (fromEl && fromEl.value && toEl && toEl.value) {
            return new Date(fromEl.value).toLocaleDateString('id-ID', opts) + ' - ' + new Date(toEl.value).toLocaleDateString('id-ID', opts);
        }
        return 'Bulan Ini';
    }

    function setDatePreset(preset) {
        const fromEl = document.getElementById('reports-date-from');
        const toEl = document.getElementById('reports-date-to');
        const now = new Date();
        let startDate = new Date(0);
        let endDate = new Date();

        if (preset === 'this_week') {
            const first = now.getDate() - now.getDay();
            startDate = new Date(now.getFullYear(), now.getMonth(), first);
        } else if (preset === 'this_month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (preset === 'this_year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else if (preset === 'all_time') {
            startDate = new Date(2020, 0, 1);
        }

        const toIso = (d) => d.toISOString().split('T')[0];
        if (fromEl) fromEl.value = toIso(startDate);
        if (toEl) toEl.value = toIso(endDate);

        // Update preset button styling
        document.querySelectorAll('.reports-preset-btn').forEach(btn => {
            if (btn.dataset.preset === preset) {
                btn.className = 'reports-preset-btn px-4 py-2 rounded-full text-xs font-bold bg-primary text-white border border-primary shadow-sm';
            } else {
                btn.className = 'reports-preset-btn px-4 py-2 rounded-full text-xs font-bold border border-outline-variant/30 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all';
            }
        });

        updateView();
    }

    function renderHeroCard(filteredTx) {
        let totalIn = 0;
        let totalOut = 0;
        filteredTx.forEach(tx => {
            if (tx.kategori === 'Modal' || tx.kategori === 'Setoran Piutang Mitra') return;
            if (tx.kategori === 'Retur Penjualan') {
                totalIn -= tx.nominal;
            } else if (tx.tipe_tx === 'in') {
                totalIn += tx.nominal;
            } else if (tx.tipe_tx === 'out') {
                totalOut += tx.nominal;
            }
        });
        const laba = totalIn - totalOut;

        let totalKas = 0;
        rawWallets.forEach(w => {
            const s = w.saldo_terkini || 0;
            if (s >= 0) totalKas += s;
        });

        // Hero big number
        const heroLaba = document.getElementById('hero-laba-bersih');
        if (heroLaba) heroLaba.innerText = formatRupiah(laba);

        // Margin badge
        const heroBadge = document.getElementById('hero-laba-badge');
        const heroPercent = document.getElementById('hero-laba-percent');
        if (heroBadge && heroPercent) {
            const margin = totalIn > 0 ? ((laba / totalIn) * 100).toFixed(1) : '0.0';
            heroPercent.innerText = margin + '%';
            const icon = heroBadge.querySelector('.material-symbols-outlined');
            if (laba >= 0) {
                heroBadge.className = 'inline-flex items-center gap-1 mt-2 bg-emerald-400/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-emerald-200';
                if (icon) icon.textContent = 'trending_up';
            } else {
                heroBadge.className = 'inline-flex items-center gap-1 mt-2 bg-red-400/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-red-200';
                if (icon) icon.textContent = 'trending_down';
            }
        }

        // Mini stats
        const elPendapatan = document.getElementById('summary-pendapatan');
        if (elPendapatan) elPendapatan.innerText = formatRupiah(totalIn);
        
        const elBeban = document.getElementById('summary-beban');
        if (elBeban) elBeban.innerText = formatRupiah(totalOut);
        
        const elKas = document.getElementById('summary-kas');
        if (elKas) elKas.innerText = formatRupiah(totalKas);
    }

    function renderChart(filteredTx, filter) {
        const ctx = document.getElementById('reports-chart');
        if (!ctx) return;
        
        try {
            const existingChart = typeof Chart !== 'undefined' ? Chart.getChart(ctx) : null;
            if (existingChart) existingChart.destroy();
        } catch (err) {}
        if (reportsChartInstance) {
            try { reportsChartInstance.destroy(); } catch (err) {}
            reportsChartInstance = null;
        }

        const grouped = {};
        filteredTx.forEach(tx => {
            if (tx.tipe_tx === 'transfer') return;
            if (tx.kategori === 'Modal' || tx.kategori === 'Setoran Piutang Mitra') return;
            const dateStr = safeToDate(tx.tanggal).toLocaleDateString('id-ID', {
                month: 'short', 
                day: (filter === 'this_year' || filter === 'all_time') ? undefined : 'numeric'
            });
            if (!grouped[dateStr]) grouped[dateStr] = { in: 0, out: 0 };
            if (tx.kategori === 'Retur Penjualan') {
                grouped[dateStr].in -= tx.nominal || 0;
            } else if (tx.tipe_tx === 'in') {
                grouped[dateStr].in += tx.nominal || 0;
            } else if (tx.tipe_tx === 'out') {
                grouped[dateStr].out += tx.nominal || 0;
            }
        });

        const labels = Object.keys(grouped);
        const dataIn = labels.map(l => grouped[l].in);
        const dataOut = labels.map(l => grouped[l].out);

        reportsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { 
                        label: 'Pendapatan', 
                        data: dataIn, 
                        backgroundColor: 'rgba(16, 185, 129, 0.85)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false
                    },
                    { 
                        label: 'Beban', 
                        data: dataOut, 
                        backgroundColor: 'rgba(239, 68, 68, 0.85)',
                        borderColor: '#ef4444',
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false
                    }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(21,19,49,0.95)',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(139,92,246,0.3)',
                        borderWidth: 1,
                        cornerRadius: 12,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': Rp ' + context.raw.toLocaleString('id-ID');
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        display: true,
                        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                        ticks: { 
                            font: { size: 10, family: 'Inter' },
                            color: '#94a3b8',
                            callback: function(value) {
                                if (value >= 1000000) return 'Rp ' + (value/1000000).toFixed(0) + 'jt';
                                if (value >= 1000) return 'Rp ' + (value/1000).toFixed(0) + 'rb';
                                return 'Rp ' + value;
                            }
                        }
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { font: { size: 11, family: 'Inter', weight: '500' }, color: '#64748b' }
                    }
                },
                animation: { duration: 800, easing: 'easeOutQuart' }
            }
        });
    }

    function renderDonutChart(filteredTx) {
        const ctx = document.getElementById('reports-donut-chart');
        if (!ctx) return;
        
        try {
            const existingChart = typeof Chart !== 'undefined' ? Chart.getChart(ctx) : null;
            if (existingChart) existingChart.destroy();
        } catch (err) {}
        if (donutChartInstance) {
            try { donutChartInstance.destroy(); } catch (err) {}
            donutChartInstance = null;
        }

        const catMap = {};
        filteredTx.forEach(tx => {
            if (tx.tipe_tx === 'transfer') return;
            const k = tx.kategori || 'Lainnya';
            catMap[k] = (catMap[k] || 0) + (tx.nominal || 0);
        });

        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
        const labels = sorted.map(e => e[0]);
        const data = sorted.map(e => e[1]);
        const colors = labels.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]);

        // Custom legend
        const legendEl = document.getElementById('donut-legend');
        if (legendEl) {
            legendEl.innerHTML = labels.map((label, i) => 
                `<span class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full" style="background:${colors[i]}"></div>${label}</span>`
            ).join('');
        }

        donutChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(21,19,49,0.95)',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(139,92,246,0.3)',
                        borderWidth: 1,
                        cornerRadius: 12,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                                return context.label + ': Rp ' + context.raw.toLocaleString('id-ID') + ' (' + pct + '%)';
                            }
                        }
                    }
                },
                animation: { duration: 800, easing: 'easeOutQuart' }
            }
        });
    }

    // --- Inline Report Renderers ---
    function renderLabaRugi(filteredTx) {
        const container = document.getElementById('lr-content');
        if (!container) return;
        const periodEl = document.getElementById('lr-period');
        if (periodEl) periodEl.innerText = 'Periode: ' + getTimeFilterLabel();

        let inCats = {}; let hppCats = {}; let outCats = {};
        let totalIn = 0; let totalHpp = 0; let totalOut = 0;
        
        filteredTx.forEach(tx => {
            if (tx.kategori === 'Modal' || 
                tx.kategori === 'Setoran Piutang Mitra' || 
                tx.kategori === 'Persediaan Bahan Baku' || 
                tx.kategori === 'Persediaan Barang Jadi' ||
                tx.tipe_tx === 'transfer') return;
                
            const k = tx.kategori || 'Lainnya';
            
            if (k === 'Retur Penjualan') {
                totalIn -= tx.nominal;
                inCats[k] = (inCats[k] || 0) - tx.nominal;
            } else if (tx.tipe_tx === 'in') { 
                totalIn += tx.nominal; 
                inCats[k] = (inCats[k] || 0) + tx.nominal; 
            } else if (tx.tipe_tx === 'out') { 
                // Determine if HPP
                if (k.toLowerCase().includes('bahan baku') || k.toLowerCase().includes('kulakan') || k.toLowerCase().includes('hpp') || k.toLowerCase().includes('pembelian barang')) {
                    totalHpp += tx.nominal;
                    hppCats[k] = (hppCats[k] || 0) + tx.nominal;
                } else {
                    totalOut += tx.nominal; 
                    outCats[k] = (outCats[k] || 0) + tx.nominal; 
                }
            }
        });
        
        const labaKotor = totalIn - totalHpp;
        const labaBersih = labaKotor - totalOut;

        const renderFormalRows = (catsObj) => {
            let html = '';
            for (let [k, v] of Object.entries(catsObj).sort((a,b) => b[1]-a[1])) {
                const isNegVal = v < 0;
                const displayVal = isNegVal ? `(${formatRupiah(Math.abs(v))})` : formatRupiah(v);
                html += `
                <tr class="border-b border-outline-variant/30">
                    <td class="py-1.5 px-3 sm:px-4 text-xs sm:text-sm text-on-surface-variant">${k}</td>
                    <td class="py-1.5 px-3 sm:px-4 text-xs sm:text-sm text-right font-medium">${displayVal}</td>
                </tr>`;
            }
            if (!html) html = `<tr><td colspan="2" class="py-2 px-3 sm:px-4 text-xs sm:text-sm text-center text-outline-variant italic">Tidak ada data</td></tr>`;
            return html;
        };

        const inHtml = renderFormalRows(inCats);
        const hppHtml = renderFormalRows(hppCats);
        const outHtml = renderFormalRows(outCats);

        const businessName = document.getElementById('profile-business-name')?.innerText || 'Bisnis Anda';

        container.innerHTML = `
            <div class="bg-white text-black p-3.5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
                <div class="text-center mb-5 border-b border-black/20 pb-3">
                    <h2 class="text-base sm:text-lg font-bold uppercase tracking-wider">${businessName}</h2>
                    <h3 class="text-sm sm:text-base font-semibold mt-0.5">Laporan Laba/Rugi</h3>
                    <p class="text-[11px] sm:text-xs text-gray-500 mt-0.5">Periode: ${getTimeFilterLabel()}</p>
                </div>
                
                <div class="overflow-x-auto">
                <table class="w-full mb-5 min-w-[320px]">
                    <thead>
                        <tr class="bg-gray-100 border-y border-black/20">
                            <th class="py-1.5 px-3 sm:px-4 text-left text-xs sm:text-sm font-bold w-2/3">Keterangan</th>
                            <th class="py-1.5 px-3 sm:px-4 text-right text-xs sm:text-sm font-bold w-1/3">Jumlah (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="2" class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm bg-gray-50">Pendapatan</td></tr>
                        ${inHtml}
                        <tr class="border-t-2 border-black/20">
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm">Total Pendapatan Kotor</td>
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right">${formatRupiah(totalIn)}</td>
                        </tr>
                        
                        <tr><td colspan="2" class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm bg-gray-50 mt-3">Harga Pokok Penjualan (HPP)</td></tr>
                        ${hppHtml}
                        <tr class="border-t border-black/20">
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm">Total HPP</td>
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right">(${formatRupiah(totalHpp)})</td>
                        </tr>
                        
                        <tr class="border-t-2 border-black/20 bg-emerald-50">
                            <td class="py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-emerald-800">Laba Kotor</td>
                            <td class="py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right text-emerald-800">${formatRupiah(labaKotor)}</td>
                        </tr>

                        <tr><td colspan="2" class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm bg-gray-50 mt-3">Beban Operasional</td></tr>
                        ${outHtml}
                        <tr class="border-t border-black/20">
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm">Total Beban Operasional</td>
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right">(${formatRupiah(totalOut)})</td>
                        </tr>
                    </tbody>
                </table>
                </div>
                
                <div class="border-t-4 border-black/30 pt-3 flex justify-between items-center">
                    <span class="text-sm sm:text-base font-bold uppercase">Laba/Rugi Bersih</span>
                    <span class="text-xl sm:text-2xl font-extrabold ${labaBersih >= 0 ? 'text-success-green' : 'text-danger-red'}">
                        ${labaBersih < 0 ? '(' + formatRupiah(Math.abs(labaBersih)) + ')' : formatRupiah(labaBersih)}
                    </span>
                </div>
            </div>
        `;
    }

    function renderNeraca() {
        const container = document.getElementById('neraca-content');
        if (!container) return;
        const periodEl = document.getElementById('neraca-period');
        if (periodEl) periodEl.innerText = 'Per tanggal: ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        let totalKas = 0; let totalUtang = 0;
        rawWallets.forEach(w => {
            const s = w.saldo_terkini || 0;
            if (s >= 0) totalKas += s;
            else totalUtang += Math.abs(s);
        });

        let totalPiutang = 0;
        rawPartners.forEach(pt => {
            totalPiutang += pt.total_piutang || 0;
        });

        // Perpetual Inventory assets calculation
        const totalPersediaanBahanBaku = rawMaterials.reduce((acc, m) => acc + ((m.stok_aktif || 0) * (m.avg_cost || 0)), 0);
        const totalPersediaanBarangJadi = rawProducts.reduce((acc, p) => acc + ((p.stok_gudang || 0) * (p.last_hpp_satuan || p.harga_modal || 0)), 0);

        const totalAset = totalKas + totalPiutang + totalPersediaanBahanBaku + totalPersediaanBarangJadi;
        const totalKewajiban = totalUtang;

        let totalModalAwal = 0;
        rawWallets.forEach(w => { totalModalAwal += (w.saldo_awal || 0); });

        // Cumulative Laba/Rugi Berjalan and Tambahan Modal calculation from rawTransactions
        let totalIn = 0; let totalOut = 0;
        let totalTambahanModal = 0;
        rawTransactions.forEach(tx => {
            if (tx.kategori === 'Modal') {
                if (tx.tipe_tx === 'in') totalTambahanModal += tx.nominal;
                else if (tx.tipe_tx === 'out') totalTambahanModal -= tx.nominal;
            }
            if (tx.kategori === 'Modal' || 
                tx.kategori === 'Setoran Piutang Mitra' || 
                tx.kategori === 'Persediaan Bahan Baku' || 
                tx.kategori === 'Persediaan Barang Jadi') return;
            const k = tx.kategori || 'Lainnya';
            if (k === 'Retur Penjualan') {
                totalIn -= tx.nominal;
            } else if (tx.tipe_tx === 'in') { 
                totalIn += tx.nominal; 
            } else if (tx.tipe_tx === 'out') { 
                totalOut += tx.nominal; 
            }
        });
        const labaRugiBerjalan = totalIn - totalOut;
        const ekuitas = totalModalAwal + totalTambahanModal + labaRugiBerjalan;

        const makeFormalRow = (label, val) => {
            if (val === 0) return '';
            const isNeg = val < 0;
            const displayVal = isNeg ? `(${formatRupiah(Math.abs(val))})` : formatRupiah(val);
            return `
                <tr class="border-b border-outline-variant/30">
                    <td class="py-1.5 px-3 sm:px-4 text-xs sm:text-sm text-on-surface-variant pl-4 sm:pl-6">${label}</td>
                    <td class="py-1.5 px-3 sm:px-4 text-xs sm:text-sm text-right font-medium">${displayVal}</td>
                </tr>`;
        };

        const businessName = document.getElementById('profile-business-name')?.innerText || 'Bisnis Anda';
        const dateNow = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        container.innerHTML = `
            <div class="bg-white text-black p-3.5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
                <div class="text-center mb-5 border-b border-black/20 pb-3">
                    <h2 class="text-base sm:text-lg font-bold uppercase tracking-wider">${businessName}</h2>
                    <h3 class="text-sm sm:text-base font-semibold mt-0.5">Laporan Neraca</h3>
                    <p class="text-[11px] sm:text-xs text-gray-500 mt-0.5">Per tanggal: ${dateNow}</p>
                </div>
                
                <div class="overflow-x-auto">
                <table class="w-full mb-5 min-w-[320px]">
                    <thead>
                        <tr class="bg-gray-100 border-y border-black/20">
                            <th class="py-1.5 px-3 sm:px-4 text-left text-xs sm:text-sm font-bold w-2/3">Aset</th>
                            <th class="py-1.5 px-3 sm:px-4 text-right text-xs sm:text-sm font-bold w-1/3">Jumlah (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${makeFormalRow('Kas & Bank', totalKas)}
                        ${makeFormalRow('Piutang Usaha', totalPiutang)}
                        ${makeFormalRow('Persediaan Bahan Baku', totalPersediaanBahanBaku)}
                        ${makeFormalRow('Persediaan Barang Jadi', totalPersediaanBarangJadi)}
                        <tr class="border-t-2 border-black/20 bg-gray-50">
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm uppercase">Total Aset</td>
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right">${formatRupiah(totalAset)}</td>
                        </tr>
                        
                        <tr><td colspan="2" class="py-3"></td></tr>
                        
                        <tr class="bg-gray-100 border-y border-black/20">
                            <th class="py-1.5 px-3 sm:px-4 text-left text-xs sm:text-sm font-bold w-2/3">Kewajiban</th>
                            <th class="py-1.5 px-3 sm:px-4 text-right text-xs sm:text-sm font-bold w-1/3"></th>
                        </tr>
                        ${makeFormalRow('Utang Kas (Saldo Negatif)', totalKewajiban)}
                        <tr class="border-t-2 border-black/20 bg-gray-50">
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm uppercase">Total Kewajiban</td>
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right">${formatRupiah(totalKewajiban)}</td>
                        </tr>

                        <tr><td colspan="2" class="py-3"></td></tr>
                        
                        <tr class="bg-gray-100 border-y border-black/20">
                            <th class="py-1.5 px-3 sm:px-4 text-left text-xs sm:text-sm font-bold w-2/3">Ekuitas</th>
                            <th class="py-1.5 px-3 sm:px-4 text-right text-xs sm:text-sm font-bold w-1/3"></th>
                        </tr>
                        ${makeFormalRow('Modal Awal Rekening', totalModalAwal)}
                        ${makeFormalRow('Tambahan Modal/Prive', totalTambahanModal)}
                        ${makeFormalRow('Laba/Rugi Berjalan', labaRugiBerjalan)}
                        <tr class="border-t-2 border-black/20 bg-gray-50">
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm uppercase">Total Ekuitas</td>
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right">${formatRupiah(ekuitas)}</td>
                        </tr>
                    </tbody>
                </table>
                </div>
                
                <div class="border-t-4 border-black/30 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <span class="text-xs sm:text-sm font-bold uppercase block mb-0.5">Cek Keseimbangan</span>
                        <span class="text-[11px] text-gray-500">Aset = Kewajiban + Ekuitas</span>
                    </div>
                    <span class="text-base sm:text-xl font-extrabold ${Math.abs(totalAset - (totalKewajiban + ekuitas)) < 1 ? 'text-success-green' : 'text-danger-red'} mt-1 sm:mt-0">
                        ${Math.abs(totalAset - (totalKewajiban + ekuitas)) < 1 ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
                    </span>
                </div>
            </div>
        `;
    }

    function renderArusKas(filteredTx) {
        const container = document.getElementById('aruskas-content');
        if (!container) return;
        const periodEl = document.getElementById('aruskas-period');
        if (periodEl) periodEl.innerText = 'Periode: ' + getTimeFilterLabel();

        let inCats = {}; let outCats = {};
        let masuk = 0; let keluar = 0;
        filteredTx.forEach(tx => {
            if (tx.kategori === 'Distribusi Stok' || 
                tx.kategori === 'Beban HPP' || 
                tx.kategori === 'Persediaan Barang Jadi' || 
                tx.kategori === 'Beban Kerugian Barang Rusak' || 
                tx.kategori === 'Retur Penjualan') return;
            if (tx.dompet_id === 'persediaan' || tx.dompet_id === 'piutang') return;
            
            const k = tx.kategori || 'Lainnya';
            if (tx.tipe_tx === 'in') { masuk += tx.nominal; inCats[k] = (inCats[k] || 0) + tx.nominal; }
            if (tx.tipe_tx === 'out') { keluar += tx.nominal; outCats[k] = (outCats[k] || 0) + tx.nominal; }
        });
        const kasBersih = masuk - keluar;

        const makeFormalRow = (label, val) => {
            const displayVal = formatRupiah(val);
            return `
                <tr class="border-b border-outline-variant/30">
                    <td class="py-1.5 px-3 sm:px-4 text-xs sm:text-sm text-on-surface-variant pl-4 sm:pl-6">${label}</td>
                    <td class="py-1.5 px-3 sm:px-4 text-xs sm:text-sm text-right font-medium">${displayVal}</td>
                </tr>`;
        };
        
        let inHtml = '';
        for (let [k, v] of Object.entries(inCats).sort((a,b) => b[1]-a[1])) {
            inHtml += makeFormalRow(k, v);
        }
        if (!inHtml) inHtml = `<tr><td colspan="2" class="py-2 px-3 sm:px-4 text-xs sm:text-sm text-center text-outline-variant italic">Tidak ada kas masuk</td></tr>`;

        let outHtml = '';
        for (let [k, v] of Object.entries(outCats).sort((a,b) => b[1]-a[1])) {
            outHtml += makeFormalRow(k, v);
        }
        if (!outHtml) outHtml = `<tr><td colspan="2" class="py-2 px-3 sm:px-4 text-xs sm:text-sm text-center text-outline-variant italic">Tidak ada kas keluar</td></tr>`;

        const businessName = document.getElementById('profile-business-name')?.innerText || 'Bisnis Anda';

        container.innerHTML = `
            <div class="bg-white text-black p-3.5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
                <div class="text-center mb-5 border-b border-black/20 pb-3">
                    <h2 class="text-base sm:text-lg font-bold uppercase tracking-wider">${businessName}</h2>
                    <h3 class="text-sm sm:text-base font-semibold mt-0.5">Laporan Arus Kas</h3>
                    <p class="text-[11px] sm:text-xs text-gray-500 mt-0.5">Periode: ${getTimeFilterLabel()}</p>
                </div>
                
                <div class="overflow-x-auto">
                <table class="w-full mb-5 min-w-[320px]">
                    <thead>
                        <tr class="bg-gray-100 border-y border-black/20">
                            <th class="py-1.5 px-3 sm:px-4 text-left text-xs sm:text-sm font-bold w-2/3">Arus Kas Masuk</th>
                            <th class="py-1.5 px-3 sm:px-4 text-right text-xs sm:text-sm font-bold w-1/3">Jumlah (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inHtml}
                        <tr class="border-t-2 border-black/20 bg-gray-50">
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm uppercase">Total Kas Masuk</td>
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right">${formatRupiah(masuk)}</td>
                        </tr>
                        
                        <tr><td colspan="2" class="py-3"></td></tr>
                        
                        <tr class="bg-gray-100 border-y border-black/20">
                            <th class="py-1.5 px-3 sm:px-4 text-left text-xs sm:text-sm font-bold w-2/3">Arus Kas Keluar</th>
                            <th class="py-1.5 px-3 sm:px-4 text-right text-xs sm:text-sm font-bold w-1/3"></th>
                        </tr>
                        ${outHtml}
                        <tr class="border-t-2 border-black/20 bg-gray-50">
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm uppercase">Total Kas Keluar</td>
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right">${formatRupiah(keluar)}</td>
                        </tr>
                    </tbody>
                </table>
                </div>
                
                <div class="border-t-4 border-black/30 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <span class="text-xs sm:text-sm font-bold uppercase block mb-0.5">Kenaikan/Penurunan Kas</span>
                    </div>
                    <span class="text-base sm:text-xl font-extrabold ${kasBersih >= 0 ? 'text-success-green' : 'text-danger-red'} mt-1 sm:mt-0">
                        ${kasBersih < 0 ? '(' + formatRupiah(Math.abs(kasBersih)) + ')' : formatRupiah(kasBersih)}
                    </span>
                </div>
            </div>
        `;
    }

    function renderPersediaan() {
        const container = document.getElementById('persediaan-content');
        if (!container) return;
        const periodEl = document.getElementById('persediaan-period');
        if (periodEl) periodEl.innerText = 'Per tanggal: ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        let totalValProducts = 0;
        let productRows = '';
        rawProducts.forEach(p => {
            const qty = p.stok_gudang || 0;
            const hpp = p.last_hpp_satuan || p.harga_modal || 0;
            const subtotal = qty * hpp;
            totalValProducts += subtotal;
            const isHabis = qty <= 0;
            productRows += `
            <tr class="border-b border-outline-variant/30 ${isHabis ? 'bg-red-50/30' : ''}">
                <td class="py-1.5 px-3 sm:px-4 text-xs sm:text-sm text-on-surface-variant pl-4 sm:pl-6">
                    ${p.nama || p.nama_produk} 
                    <span class="text-[11px] text-gray-500">(${qty} ${p.unit || 'pcs'} x ${formatRupiah(hpp)})</span>
                    ${isHabis ? '<span class="ml-1.5 inline-block px-1.5 py-0.5 text-[9px] font-bold text-red-600 bg-red-100 rounded-md">Habis</span>' : ''}
                </td>
                <td class="py-1.5 px-3 sm:px-4 text-xs sm:text-sm text-right font-medium ${isHabis ? 'text-red-500' : ''}">${formatRupiah(subtotal)}</td>
            </tr>`;
        });

        let totalValMaterials = 0;
        let materialRows = '';
        rawMaterials.forEach(m => {
            const qty = m.stok_aktif || 0;
            const avgCost = m.avg_cost || 0;
            const subtotal = qty * avgCost;
            totalValMaterials += subtotal;
            const isHabis = qty <= 0;
            materialRows += `
            <tr class="border-b border-outline-variant/30 ${isHabis ? 'bg-red-50/30' : ''}">
                <td class="py-1.5 px-3 sm:px-4 text-xs sm:text-sm text-on-surface-variant pl-4 sm:pl-6">
                    ${m.nama} 
                    <span class="text-[11px] text-gray-500">(${qty} ${m.satuan || ''} x ${formatRupiah(avgCost)})</span>
                    ${isHabis ? '<span class="ml-1.5 inline-block px-1.5 py-0.5 text-[9px] font-bold text-red-600 bg-red-100 rounded-md">Habis</span>' : ''}
                </td>
                <td class="py-1.5 px-3 sm:px-4 text-xs sm:text-sm text-right font-medium ${isHabis ? 'text-red-500' : ''}">${formatRupiah(subtotal)}</td>
            </tr>`;
        });

        const totalInventoryVal = totalValProducts + totalValMaterials;

        const businessName = document.getElementById('profile-business-name')?.innerText || 'Bisnis Anda';
        const dateNow = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        container.innerHTML = `
            <div class="bg-white text-black p-3.5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
                <div class="text-center mb-5 border-b border-black/20 pb-3">
                    <h2 class="text-base sm:text-lg font-bold uppercase tracking-wider">${businessName}</h2>
                    <h3 class="text-sm sm:text-base font-semibold mt-0.5">Laporan Persediaan</h3>
                    <p class="text-[11px] sm:text-xs text-gray-500 mt-0.5">Per tanggal: ${dateNow}</p>
                </div>
                
                <div class="overflow-x-auto">
                <table class="w-full mb-5 min-w-[320px]">
                    <thead>
                        <tr class="bg-gray-100 border-y border-black/20">
                            <th class="py-1.5 px-3 sm:px-4 text-left text-xs sm:text-sm font-bold w-2/3">Persediaan Produk Jadi</th>
                            <th class="py-1.5 px-3 sm:px-4 text-right text-xs sm:text-sm font-bold w-1/3">Jumlah (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows || '<tr><td colspan="2" class="py-3 text-center text-xs sm:text-sm text-outline-variant italic">Belum ada data persediaan produk.</td></tr>'}
                        <tr class="border-t-2 border-black/20 bg-gray-50">
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm uppercase">Total Nilai Produk Jadi</td>
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right">${formatRupiah(totalValProducts)}</td>
                        </tr>
                        
                        <tr><td colspan="2" class="py-3"></td></tr>
                        
                        <tr class="bg-gray-100 border-y border-black/20">
                            <th class="py-1.5 px-3 sm:px-4 text-left text-xs sm:text-sm font-bold w-2/3">Persediaan Bahan Baku</th>
                            <th class="py-1.5 px-3 sm:px-4 text-right text-xs sm:text-sm font-bold w-1/3"></th>
                        </tr>
                        ${materialRows || '<tr><td colspan="2" class="py-3 text-center text-xs sm:text-sm text-outline-variant italic">Belum ada data persediaan bahan baku.</td></tr>'}
                        <tr class="border-t-2 border-black/20 bg-gray-50">
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm uppercase">Total Nilai Bahan Baku</td>
                            <td class="py-1.5 px-3 sm:px-4 font-bold text-xs sm:text-sm text-right">${formatRupiah(totalValMaterials)}</td>
                        </tr>
                    </tbody>
                </table>
                </div>
                
                <div class="border-t-4 border-black/30 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <span class="text-xs sm:text-sm font-bold uppercase block mb-0.5">Total Aset Persediaan</span>
                    </div>
                    <span class="text-base sm:text-xl font-extrabold text-primary mt-1 sm:mt-0">
                        ${formatRupiah(totalInventoryVal)}
                    </span>
                </div>
            </div>
        `;
    }

    // --- Navigation between Hub & Full-Page Detail View ---
    function setupReportButtons() {
        const btnMap = {
            'btn-report-labarugi': { 
                panel: 'panel-labarugi', 
                title: 'Laporan Laba/Rugi', 
                getSubtitle: () => 'Periode: ' + getTimeFilterLabel(),
                render: (tx) => renderLabaRugi(tx) 
            },
            'btn-report-neraca': { 
                panel: 'panel-neraca', 
                title: 'Laporan Neraca', 
                getSubtitle: () => 'Per tanggal: ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                render: () => renderNeraca() 
            },
            'btn-report-aruskas': { 
                panel: 'panel-aruskas', 
                title: 'Laporan Arus Kas', 
                getSubtitle: () => 'Periode: ' + getTimeFilterLabel(),
                render: (tx) => renderArusKas(tx) 
            },
            'btn-report-persediaan': { 
                panel: 'panel-persediaan', 
                title: 'Laporan Persediaan', 
                getSubtitle: () => 'Per tanggal: ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                render: () => renderPersediaan() 
            }
        };

        const hubView = document.getElementById('reports-hub-view');
        const detailView = document.getElementById('reports-detail-view');

        Object.entries(btnMap).forEach(([btnId, config]) => {
            document.getElementById(btnId)?.addEventListener('click', () => {
                const panel = document.getElementById(config.panel);
                if (!panel || !hubView || !detailView) return;

                // Hide hub, show detail view
                hubView.classList.add('hidden');
                detailView.classList.remove('hidden');

                // Hide all panels first, then show selected panel
                document.querySelectorAll('.report-panel').forEach(p => p.classList.add('hidden'));
                panel.classList.remove('hidden');

                // Update detail header
                const titleEl = document.getElementById('report-detail-title');
                const subTitleEl = document.getElementById('report-detail-subtitle');
                if (titleEl) titleEl.innerText = config.title;
                if (subTitleEl) subTitleEl.innerText = config.getSubtitle();

                // Render content
                const { filteredTx } = getFilteredData();
                config.render(filteredTx);

                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // Back button listener (returns to reports hub view)
        document.getElementById('btn-back-to-reports-hub')?.addEventListener('click', () => {
            if (hubView && detailView) {
                detailView.classList.add('hidden');
                hubView.classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // --- PDF Download for Active Report ---
    function setupPdfButtons() {
        document.getElementById('btn-download-active-report')?.addEventListener('click', () => {
            const activePanel = document.querySelector('.report-panel:not(.hidden)');
            if (!activePanel) return;
            const contentEl = activePanel.querySelector('div[id$="-content"]');
            const titleText = document.getElementById('report-detail-title')?.innerText || 'Laporan_Keuangan';
            if (!contentEl) return;

            // Clone report content into an unconstrained, clean off-screen wrapper to guarantee zero clipping/cropping
            const clone = contentEl.cloneNode(true);
            
            // Remove any responsive overflow or min-width classes from tables in clone
            clone.querySelectorAll('.overflow-x-auto').forEach(el => {
                el.classList.remove('overflow-x-auto');
            });
            clone.querySelectorAll('table').forEach(tbl => {
                tbl.style.width = '100%';
                tbl.style.minWidth = '0';
            });

            const pdfWrap = document.createElement('div');
            pdfWrap.style.position = 'fixed';
            pdfWrap.style.left = '-9999px';
            pdfWrap.style.top = '0';
            pdfWrap.style.width = '750px';
            pdfWrap.style.backgroundColor = '#ffffff';
            pdfWrap.style.padding = '24px';
            pdfWrap.style.boxSizing = 'border-box';
            pdfWrap.appendChild(clone);
            document.body.appendChild(pdfWrap);

            const opt = {
                margin: [0.35, 0.35, 0.35, 0.35],
                filename: titleText.replace(/\s+/g, '_').toLowerCase() + '.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    width: 750, 
                    windowWidth: 750, 
                    scrollX: 0, 
                    scrollY: 0 
                },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(pdfWrap).save().then(() => {
                if (pdfWrap.parentNode) document.body.removeChild(pdfWrap);
            }).catch(err => {
                if (pdfWrap.parentNode) document.body.removeChild(pdfWrap);
                console.error('PDF generation failed:', err);
                alert('Gagal mengunduh PDF: ' + err.message);
            });
        });
    }

    function updateView() {
        const { filteredTx, filter } = getFilteredData();
        renderHeroCard(filteredTx);
        renderChart(filteredTx, filter);
        renderDonutChart(filteredTx);
        
        // Re-render active detail report panel if detail view is open
        document.querySelectorAll('.report-panel').forEach(panel => {
            if (!panel.classList.contains('hidden')) {
                const id = panel.id;
                if (id === 'panel-labarugi') renderLabaRugi(filteredTx);
                if (id === 'panel-neraca') renderNeraca();
                if (id === 'panel-aruskas') renderArusKas(filteredTx);
                if (id === 'panel-persediaan') renderPersediaan();
                
                // Update subtitle if open
                const subTitleEl = document.getElementById('report-detail-subtitle');
                if (subTitleEl) {
                    if (id === 'panel-labarugi' || id === 'panel-aruskas') {
                        subTitleEl.innerText = 'Periode: ' + getTimeFilterLabel();
                    }
                }
            }
        });
    }

    try {
        await fetchAllData();
        
        // Set default date range to this month
        setDatePreset('this_month');

        setupReportButtons();
        setupPdfButtons();

        // Preset buttons
        document.querySelectorAll('.reports-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setDatePreset(btn.dataset.preset);
            });
        });

        // Custom date range change
        document.getElementById('reports-date-from')?.addEventListener('change', () => {
            // Clear active preset styling
            document.querySelectorAll('.reports-preset-btn').forEach(btn => {
                btn.className = 'reports-preset-btn px-4 py-2 rounded-full text-xs font-bold border border-outline-variant/30 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all';
            });
            updateView();
        });
        document.getElementById('reports-date-to')?.addEventListener('change', () => {
            document.querySelectorAll('.reports-preset-btn').forEach(btn => {
                btn.className = 'reports-preset-btn px-4 py-2 rounded-full text-xs font-bold border border-outline-variant/30 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all';
            });
            updateView();
        });

    } catch(err) {
        console.error("Error loading reports", err);
    }
}


export async function loadWalletsPage(uid) {
    try {
        const walletsQuery = query(collection(db, 'wallets'), where('uid', '==', uid));
        const walletsSnapshot = await getDocs(walletsQuery);
        let walletsHTML = '';
        
        walletsSnapshot.forEach((docSnap) => {
            const data = docSnap.data();

            walletsHTML += `
            <div class="bg-surface rounded-2xl p-3 shadow-card border border-outline-variant flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-card" style="background-color: ${data.warna || '#1a73e8'}">
                        ${data.ikon ? `<span class="material-symbols-outlined">${data.ikon}</span>` : data.nama_rekening.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div class="font-bold text-on-surface">${data.nama_rekening}</div>
                        <div class="text-xs font-medium text-primary mt-1">Modal Awal: ${formatRupiah(data.saldo_awal || 0)}</div>
                        <div class="text-xs text-on-surface-variant">Saldo Saat Ini: ${formatRupiah(data.saldo_terkini)}</div>
                    </div>
                </div>
            </div>`;
        });
        
        const container = document.getElementById('wallets-list-container');
        if (container) {
            container.innerHTML = walletsHTML || '<div class="p-6 text-center text-on-surface-variant col-span-full">Belum ada rekening. Silakan tambah.</div>';
        }
        
    } catch (e) {
        console.error("Error loading wallets page:", e);
    }
}

// Ledger: Load Transactions Page
export async function loadTransactionsPage(uid) {
    try {
        const txQuery = query(collection(db, 'transactions'), where('uid', '==', uid));
        const txSnapshot = await getDocs(txQuery);
        const transactions = [];
        txSnapshot.forEach(doc => {
            const data = doc.data();
            data._id = doc.id;
            transactions.push(data);
        });
        
        const container = document.getElementById('tx-list-container');
        if (!container) return;
        
        // Sort in JavaScript to avoid Firestore Composite Index requirements
        transactions.sort((a, b) => safeToMillis(b.tanggal) - safeToMillis(a.tanggal));
        window._txs = transactions; // Store globally
        
        // Render function
        const renderTxs = (txs) => {
            if (txs.length === 0) {
                container.innerHTML = '<div class="p-6 text-center text-on-surface-variant col-span-full">Tidak ada transaksi yang sesuai.</div>';
                return;
            }
            
            const grouped = groupTransactionsByDate(txs);
            let html = '';
            
            for (const [dateLabel, groupTxs] of Object.entries(grouped)) {
                html += '<div class="space-y-3"><h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">' + dateLabel + '</h3><div class="bg-surface rounded-2xl shadow-card border border-outline-variant divide-y divide-outline-variant overflow-hidden">';
                    
                groupTxs.forEach(tx => {
                    const txIndex = window._txs.findIndex(t => t._id === tx._id);
                    const isIncome = tx.tipe_tx === 'in';
                    const isTransfer = tx.tipe_tx === 'transfer';
                    const isNegative = (tx.nominal || 0) < 0;
                    
                    let iconClass = isIncome ? 'bg-[#10b981] text-white' : (isTransfer ? 'bg-secondary-container text-primary' : (isNegative ? 'bg-success-container text-success' : 'bg-error-container text-error'));
                    let iconName = isIncome ? 'storefront' : (isTransfer ? 'sync_alt' : (isNegative ? 'trending_up' : 'shopping_bag'));
                    let amountClass = isIncome 
                        ? (isNegative ? 'text-error' : 'text-success') 
                        : (isTransfer ? 'text-on-surface' : (isNegative ? 'text-success' : 'text-error'));
                    let sign = isIncome ? (isNegative ? '-' : '+') : (isTransfer ? '' : (isNegative ? '+' : '-'));
                    let timeStr = safeToDate(tx.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    let editedBadge = tx.is_edited ? '<span class="text-[10px] bg-surface-container-high px-1 rounded text-on-surface-variant ml-1">Diedit</span>' : '';
                    
                    let clickAction = 'onclick="window.openActionTransaksi(' + txIndex + ')"';
                    let attachmentIcon = tx.foto_struk ? '<span class="material-symbols-outlined text-[14px] text-primary" title="Terdapat struk">attachment</span>' : '';
                    let catName = tx.kategori || (isTransfer ? 'Transfer' : 'Transaksi');
                    let notes = tx.catatan || 'Tanpa catatan';
                    
                    html += '<div ' + clickAction + ' class="flex items-center justify-between p-3.5 sm:p-4 hover:bg-background transition-colors cursor-pointer gap-2.5 sm:gap-4">';
                    html += '<div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">';
                    html += '<div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full ' + iconClass + ' flex-shrink-0 flex items-center justify-center"><span class="material-symbols-outlined text-[18px] sm:text-[20px]" style="font-variation-settings: \'FILL\' 1;">' + iconName + '</span></div>';
                    html += '<div class="min-w-0 flex-1"><div class="font-semibold text-xs sm:text-sm text-on-surface flex items-center gap-1 truncate">' + catName + ' ' + attachmentIcon + '</div>';
                    html += '<div class="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 truncate">' + notes + '</div></div></div>';
                    html += '<div class="flex-shrink-0 text-right pl-1"><div class="font-bold text-xs sm:text-sm whitespace-nowrap ' + amountClass + '">' + sign + formatRupiah(Math.abs(tx.nominal || 0)) + '</div><div class="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 whitespace-nowrap">' + timeStr + editedBadge + '</div></div></div>';
                });
                html += '</div></div>';
            }
            container.innerHTML = html;
        };

        // Initial render
        renderTxs(transactions);

        // Search & Filter Logic
        let currentSearch = '';
        let currentFilter = 'all';

        const applyFilters = () => {
            let filtered = window._txs;
            if (currentFilter !== 'all') {
                filtered = filtered.filter(tx => tx.tipe_tx === currentFilter);
            }
            if (currentSearch.trim() !== '') {
                const q = currentSearch.toLowerCase();
                filtered = filtered.filter(tx => {
                    return (tx.catatan || '').toLowerCase().includes(q) ||
                           (tx.kategori || '').toLowerCase().includes(q) ||
                           (tx.nominal || 0).toString().includes(q);
                });
            }
            renderTxs(filtered);
        };

        const searchInput = document.getElementById('tx-search-input');
        if (searchInput) {
            // clear old listener if any by cloning
            const newSearch = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearch, searchInput);
            newSearch.addEventListener('input', (e) => {
                currentSearch = e.target.value;
                applyFilters();
            });
        }

        const btnFilter = document.getElementById('btn-tx-filter');
        const dropdownFilter = document.getElementById('dropdown-tx-filter');
        if (btnFilter && dropdownFilter) {
            const newBtn = btnFilter.cloneNode(true);
            btnFilter.parentNode.replaceChild(newBtn, btnFilter);
            
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownFilter.classList.toggle('hidden');
                setTimeout(() => dropdownFilter.classList.toggle('opacity-0'), 10);
            });
            
            document.addEventListener('click', (e) => {
                if (!newBtn.contains(e.target) && !dropdownFilter.contains(e.target)) {
                    dropdownFilter.classList.add('opacity-0');
                    setTimeout(() => dropdownFilter.classList.add('hidden'), 300);
                }
            });

            document.querySelectorAll('.tx-filter-opt').forEach(opt => {
                const newOpt = opt.cloneNode(true);
                opt.parentNode.replaceChild(newOpt, opt);
                newOpt.addEventListener('click', () => {
                    currentFilter = newOpt.getAttribute('data-val');
                    applyFilters();
                    dropdownFilter.classList.add('opacity-0');
                    setTimeout(() => dropdownFilter.classList.add('hidden'), 300);
                });
            });
        }
        
    } catch (e) {
        console.error("Error loading transactions:", e);
    }
}

// Global function to open receipt modal
window.openReceiptModal = function(index) {
    if (!window._txs || !window._txs[index]) return;
    const tx = window._txs[index];
    if (tx.foto_struk) {
        document.getElementById('receipt-image-view').src = tx.foto_struk;
        const modal = document.getElementById('modal-view-receipt');
        modal.classList.remove('hidden');
        // trigger reflow
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
    }
};

export async function updateTransaction(txId, txData, oldTxData) {
    try {
        await runTransaction(db, async (transaction) => {
            // 1. Kembalikan saldo lama
            if (oldTxData.tipe_tx === 'in') {
                const oldSourceRef = doc(db, 'wallets', oldTxData.dompet_id);
                const oldSourceDoc = await transaction.get(oldSourceRef);
                if (oldSourceDoc.exists()) {
                    let newSaldo = oldSourceDoc.data().saldo_terkini - oldTxData.nominal;
                    let updates = { saldo_terkini: newSaldo };
                    if (oldTxData.kategori === 'Modal') {
                        updates.saldo_awal = (oldSourceDoc.data().saldo_awal || 0) - oldTxData.nominal;
                    }
                    transaction.update(oldSourceRef, updates);
                }
            } 
            else if (oldTxData.tipe_tx === 'out') {
                const oldSourceRef = doc(db, 'wallets', oldTxData.dompet_id);
                const oldSourceDoc = await transaction.get(oldSourceRef);
                if (oldSourceDoc.exists()) {
                    let newSaldo = oldSourceDoc.data().saldo_terkini + oldTxData.nominal;
                    transaction.update(oldSourceRef, { saldo_terkini: newSaldo });
                }
            }
            else if (oldTxData.tipe_tx === 'transfer') {
                const oldSrcRef = doc(db, 'wallets', oldTxData.dompet_id);
                const oldDestRef = doc(db, 'wallets', oldTxData.dompet_tujuan_id);
                const oldSrcDoc = await transaction.get(oldSrcRef);
                const oldDestDoc = await transaction.get(oldDestRef);
                
                if (oldSrcDoc.exists()) {
                    transaction.update(oldSrcRef, { saldo_terkini: oldSrcDoc.data().saldo_terkini + oldTxData.nominal });
                }
                if (oldDestDoc.exists()) {
                    transaction.update(oldDestRef, { saldo_terkini: oldDestDoc.data().saldo_terkini - oldTxData.nominal });
                }
            }

            // 2. Terapkan saldo baru
            const sourceRef = doc(db, 'wallets', txData.dompet_id);
            const sourceDoc = await transaction.get(sourceRef);
            if (!sourceDoc.exists()) throw new Error("Dompet asal tidak ditemukan!");

            if (txData.tipe_tx === 'out') {
                const newSaldo = sourceDoc.data().saldo_terkini - txData.nominal;
                if (newSaldo < 0) throw new Error("Saldo tidak mencukupi!");
                transaction.update(sourceRef, { saldo_terkini: newSaldo });
            } 
            else if (txData.tipe_tx === 'in') {
                const newSaldo = sourceDoc.data().saldo_terkini + txData.nominal;
                const updates = { saldo_terkini: newSaldo };
                if (txData.kategori === 'Modal') {
                    updates.saldo_awal = (sourceDoc.data().saldo_awal || 0) + txData.nominal;
                }
                transaction.update(sourceRef, updates);
            }
            else if (txData.tipe_tx === 'transfer') {
                const destRef = doc(db, 'wallets', txData.dompet_tujuan_id);
                const destDoc = await transaction.get(destRef);
                if (!destDoc.exists()) throw new Error("Dompet tujuan tidak ditemukan!");
                
                const freshSourceDoc = await transaction.get(sourceRef);
                const newSourceSaldo = freshSourceDoc.data().saldo_terkini - txData.nominal;
                if (newSourceSaldo < 0) throw new Error("Saldo asal tidak mencukupi!");
                
                const freshDestDoc = await transaction.get(destRef);
                const newDestSaldo = freshDestDoc.data().saldo_terkini + txData.nominal;
                
                transaction.update(sourceRef, { saldo_terkini: newSourceSaldo });
                transaction.update(destRef, { saldo_terkini: newDestSaldo });
            }

            // 3. Update dokumen transaksi
            transaction.update(doc(db, 'transactions', txId), txData);
        });
        return true;
    } catch (e) {
        console.error("Update transaction failed: ", e);
        throw e;
    }
}

// Ledger: Submit Transaction atomically
export async function submitTransaction(txData) {
    try {
        await runTransaction(db, async (transaction) => {
            const sourceRef = doc(db, 'wallets', txData.dompet_id);
            const sourceDoc = await transaction.get(sourceRef);
            if (!sourceDoc.exists()) throw new Error("Dompet asal tidak ditemukan!");
            
            const newTxRef = doc(collection(db, 'transactions'));

            if (txData.tipe_tx === 'out') {
                const newSaldo = sourceDoc.data().saldo_terkini - txData.nominal;
                if (newSaldo < 0) throw new Error("Saldo tidak mencukupi!");
                transaction.update(sourceRef, { saldo_terkini: newSaldo });
                transaction.set(newTxRef, txData);
            } 
            else if (txData.tipe_tx === 'in') {
                const newSaldo = sourceDoc.data().saldo_terkini + txData.nominal;
                const updates = { saldo_terkini: newSaldo };
                if (txData.kategori === 'Modal') {
                    updates.saldo_awal = (sourceDoc.data().saldo_awal || 0) + txData.nominal;
                }
                transaction.update(sourceRef, updates);
                transaction.set(newTxRef, txData);
            }
            else if (txData.tipe_tx === 'transfer') {
                const destRef = doc(db, 'wallets', txData.dompet_tujuan_id);
                const destDoc = await transaction.get(destRef);
                if (!destDoc.exists()) throw new Error("Dompet tujuan tidak ditemukan!");
                
                const newSourceSaldo = sourceDoc.data().saldo_terkini - txData.nominal;
                if (newSourceSaldo < 0) throw new Error("Saldo asal tidak mencukupi!");
                
                const newDestSaldo = destDoc.data().saldo_terkini + txData.nominal;
                
                transaction.update(sourceRef, { saldo_terkini: newSourceSaldo });
                transaction.update(destRef, { saldo_terkini: newDestSaldo });
                transaction.set(newTxRef, txData);
            }
        });
        return true;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
}

export function MapsTo(page, pushHistory = true) {
    window.MapsTo = MapsTo;
    if (pushHistory) {
        window.history.pushState({ page: page }, '', '#' + page);
    }
    const appContent = document.getElementById('app-content');
    const topAppBar = document.getElementById('top-app-bar');
    const bottomNavBar = document.getElementById('bottom-nav-bar');
    const desktopSidebar = document.getElementById('desktop-sidebar');
    
    if (page === 'signin' || page === 'signup' || page === 'hello') {
        if (topAppBar) topAppBar.style.display = 'none';
        if (bottomNavBar) bottomNavBar.style.display = 'none';
        if (desktopSidebar) {
            desktopSidebar.classList.add('!hidden');
            desktopSidebar.classList.remove('md:flex');
        }
    } else {
        if (topAppBar) topAppBar.style.display = 'flex';
        if (bottomNavBar) bottomNavBar.style.display = ''; 
        if (desktopSidebar) {
            desktopSidebar.classList.remove('!hidden');
            desktopSidebar.classList.add('md:flex');
        }
    }
    
    document.querySelectorAll('.page-container').forEach(el => el.classList.add('hidden'));
    const targetContainer = document.getElementById('page-' + page);
    if (targetContainer) {
        targetContainer.classList.remove('hidden');
    }
    
    if (page === 'dashboard') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = dashboardTemplate;
        if (auth.currentUser) loadDashboardData(auth.currentUser.uid);
    } else if (page === 'transactions') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = transactionsTemplate;
        if (auth.currentUser) loadTransactionsPage(auth.currentUser.uid);
    } else if (page === 'pos') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templatePOS;
        if (auth.currentUser) loadPOSPage(auth.currentUser.uid);
    } else if (page === 'partners') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templatePartners;
        if (auth.currentUser) loadPartnersPage(auth.currentUser.uid);
    } else if (page === 'products') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templateProducts;
        if (auth.currentUser) loadProductsPage();
    } else if (page === 'rawmaterials') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templateRawMaterials;
        if (auth.currentUser) loadRawMaterialsPage(auth.currentUser.uid);
    } else if (page === 'profile') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templateProfile;
        if (auth.currentUser) loadProfileData(auth.currentUser.uid);
    } else if (page === 'settings') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templateSettings;
        initSettingsState();
    } else if (page === 'wallets') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templateWallets;
        if (auth.currentUser) loadWalletsPage(auth.currentUser.uid);
    } else if (page === 'reports') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templateReports;
        if (auth.currentUser) loadReportsPage(auth.currentUser.uid);
    } else if (page === 'signin') {
        if (!sessionStorage.getItem('hasSeenHello')) {
            sessionStorage.setItem('hasSeenHello', 'true');
            MapsTo('hello');
            return;
        }
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templateSignIn;
    } else if (page === 'signup') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templateSignUp;
    } else if (page === 'hello') {
        if (!targetContainer.innerHTML) targetContainer.innerHTML = templateHello;
        setTimeout(() => {
            const helloScreen = document.getElementById('hello-screen');
            if (helloScreen) {
                helloScreen.style.opacity = '0';
                helloScreen.style.transform = 'scale(1.05)';
                setTimeout(() => MapsTo('signin'), 800);
            }
        }, 2500);
    }

    // Update active navigation state
    const navMap = {
        'dashboard': ['top-nav-home', 'nav-home'],
        'transactions': ['top-nav-transactions', 'nav-transactions'],
        'partners': ['top-nav-partners', 'nav-partners'],
        'profile': ['nav-profile'], // Profile sidebar link is now the bottom user info section
        'reports': ['sidebar-laporan-keuangan'],
        'pos': ['sidebar-kasir-pos'],
        'products': ['sidebar-stok-produk'],
        'rawmaterials': ['sidebar-stok-bahan']
    };

    const allNavIds = [
        'top-nav-home', 'nav-home',
        'top-nav-transactions', 'nav-transactions',
        'top-nav-partners', 'nav-partners',
        'nav-profile', 'sidebar-laporan-keuangan',
        'sidebar-scan-nota', 'sidebar-transaksi-baru',
        'sidebar-kasir-pos', 'sidebar-stok-produk', 'sidebar-stok-bahan'
    ];

    allNavIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('text-primary', 'bg-primary/10', 'font-bold');
            el.classList.add('text-on-surface-variant');
        }
    });

    const activeIds = navMap[page] || [];
    activeIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('text-on-surface-variant');
            el.classList.add('text-primary');
            if (id.startsWith('top-nav') || id.startsWith('sidebar')) {
                el.classList.add('bg-primary/10', 'font-bold');
            }
        }
    });
}

function initApp() {
    initCustomDatePicker();
    
    // Auth Initialization

    const modalPilihAksi = document.getElementById('modal-pilih-aksi');
    const modalRecordTransaction = document.getElementById('modal-record-transaction');

    function openModal(modal) {
        if (!modal) return;
        
        if (modal.id === 'modal-record-transaction') {
            const isEdit = !!document.getElementById('tx-edit-id')?.value;
            const titleEl = modal.querySelector('h3');
            const btnSave = document.getElementById('btn-save-transaction');
            if (titleEl) titleEl.textContent = isEdit ? 'Edit Transaksi' : 'Tambah Transaksi Baru';
            if (btnSave) btnSave.textContent = isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi';

            const type = document.getElementById('tx-type').value || 'out';
            if (window.populateTxCategoryDropdown) window.populateTxCategoryDropdown(type);
            if (window.populateWalletDropdown) {
                window.populateWalletDropdown('tx-wallet-source');
                window.populateWalletDropdown('tx-wallet-destination');
            }
        }
        
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        if (modal.firstElementChild) modal.firstElementChild.classList.remove('translate-y-full', 'sm:translate-y-0', 'scale-95');
    }
    window.openModal = openModal;
    
    window.closeModal = function(modal) {
        if (!modal) return;
        modal.classList.add('opacity-0');
        if (modal.firstElementChild) modal.firstElementChild.classList.add('translate-y-full', 'sm:translate-y-0', 'scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };
    const closeModal = window.closeModal;

    document.getElementById('close-pilih-aksi')?.addEventListener('click', () => closeModal(modalPilihAksi));
    document.getElementById('close-record-transaction')?.addEventListener('click', () => closeModal(modalRecordTransaction));
    document.getElementById('close-pos-checkout')?.addEventListener('click', () => closeModal(document.getElementById('modal-pos-checkout')));
    
    document.getElementById('btn-buka-kasir')?.addEventListener('click', () => {
        closeModal(modalPilihAksi);
        MapsTo('pos');
    });
    
    document.getElementById('btn-stok-produk')?.addEventListener('click', () => {
        closeModal(modalPilihAksi);
        MapsTo('products');
    });
    
    document.getElementById('btn-stok-bahan-baku')?.addEventListener('click', () => {
        closeModal(modalPilihAksi);
        MapsTo('rawmaterials');
    });
    
    document.getElementById('btn-transaksi-baru')?.addEventListener('click', () => {
        closeModal(modalPilihAksi);
        setTimeout(() => openModal(modalRecordTransaction), 300);
    });

    window.addEventListener('click', (e) => {
        if (e.target === modalPilihAksi) closeModal(modalPilihAksi);
        if (e.target === modalRecordTransaction) closeModal(modalRecordTransaction);
        
        if (e.target.closest('#btn-tambah-rekening')) openModal(document.getElementById('modal-tambah-rekening'));
        if (e.target.closest('#close-tambah-rekening') || e.target === document.getElementById('modal-tambah-rekening')) closeModal(document.getElementById('modal-tambah-rekening'));
        
        if (e.target.closest('#menu-kelola-rekening')) MapsTo('wallets');
        if (e.target.closest('#menu-pengaturan')) MapsTo('settings');
        if (e.target.closest('#btn-back-settings')) MapsTo('profile');
        if (e.target.closest('#profile-nav-reports')) MapsTo('reports');
        if (e.target.closest('#btn-back-profile')) MapsTo('profile');
    });

    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'form-tambah-rekening') {
            e.preventDefault();
            if (!auth.currentUser) return;
            const btnSave = document.getElementById('btn-save-wallet');
            if(btnSave) { btnSave.disabled = true; btnSave.innerHTML = "Menyimpan..."; }
            
            try {
                // Firebase dynamic import removed
                const name = document.getElementById('add-wallet-name').value;
                const rawBal = document.getElementById('add-wallet-balance').value;
                const balance = Number(rawBal.replace(/\./g, ''));
                
                const newWalletRef = doc(collection(db, 'wallets'));
                await setDoc(newWalletRef, {
                    uid: auth.currentUser.uid,
                    nama_rekening: name,
                    saldo_terkini: balance,
                    saldo_awal: balance,
                    ikon: 'account_balance_wallet',
                    warna: '#1a73e8'
                });
                
                alert("Rekening berhasil ditambahkan!");
                closeModal(document.getElementById('modal-tambah-rekening'));
                e.target.reset();
                if (auth.currentUser) loadWalletsPage(auth.currentUser.uid);
            } catch(err) {
                alert("Gagal menyimpan rekening: " + err.message);
            } finally {
                if(btnSave) { btnSave.disabled = false; btnSave.innerHTML = "Simpan Rekening"; }
            }
        }
    });

    const formRecord = document.getElementById('form-record-transaction');
    if (formRecord) {
        formRecord.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!auth.currentUser) return;
            const btnSave = document.getElementById('btn-save-transaction');
            if(btnSave) { btnSave.disabled = true; btnSave.innerHTML = "Menyimpan..."; }
            
            try {
                const txType = document.getElementById('tx-type').value;
                const rawAmount = document.getElementById('tx-amount').value || '';
                const nominal = Number(rawAmount.replace(/\./g, ''));
                if (!nominal || isNaN(nominal) || nominal <= 0) throw new Error("Nominal transaksi harus lebih besar dari 0");
                const editId = document.getElementById('tx-edit-id').value;
                
                const txCategory = document.getElementById('tx-category').value;
                if (!txCategory) throw new Error("Pilih kategori transaksi terlebih dahulu");

                const walletSource = document.getElementById('tx-wallet-source').value;
                if (!walletSource) throw new Error("Pilih sumber dana terlebih dahulu");
                
                const txDateEl = document.getElementById('tx-date');
                const dateVal = txDateEl.dataset.iso || txDateEl.value;
                if (!dateVal) throw new Error("Tanggal harus diisi");
                
                const finalDate = dateVal.includes('T') ? new Date(dateVal) : new Date(dateVal + 'T12:00:00');
                
                const txData = {
                    uid: auth.currentUser.uid,
                    tipe_tx: txType,
                    nominal: nominal,
                    kategori: txCategory,
                    dompet_id: walletSource,
                    tanggal: Timestamp.fromDate(finalDate),
                    catatan: document.getElementById('tx-note').value
                };
                
                if (txType === 'transfer') {
                    txData.dompet_tujuan_id = document.getElementById('tx-wallet-destination').value;
                    if (!txData.dompet_tujuan_id) throw new Error("Pilih dompet tujuan!");
                    if (txData.dompet_id === txData.dompet_tujuan_id) throw new Error("Dompet asal dan tujuan tidak boleh sama");
                }
                
                const fileInput = document.getElementById('tx-receipt-file');
                if (fileInput && fileInput.files.length > 0) {
                    if (btnSave) btnSave.innerHTML = "Memproses foto...";
                    const url = await window.uploadReceipt(fileInput.files[0]);
                    txData.foto_struk = url;
                }
                
                const batch = writeBatch(db);
                
                // Track net balance changes per wallet ID
                const walletDeltas = {};
                const addWalletDelta = (wId, amount) => {
                    if (!wId) return;
                    walletDeltas[wId] = (walletDeltas[wId] || 0) + amount;
                };

                if (editId) {
                    const oldTx = (window._txs || []).find(t => t._id === editId || t.id === editId);
                    if (!oldTx) throw new Error("Data transaksi lama tidak ditemukan.");
                    
                    if (oldTx.foto_struk && !txData.foto_struk) {
                        txData.foto_struk = oldTx.foto_struk;
                    }
                    
                    const txRef = doc(db, 'transactions', editId);
                    txData.is_edited = true;
                    txData.edited_at = new Date();
                    batch.update(txRef, txData);
                    
                    // 1. Revert old transaction's impact on balances
                    if (oldTx.tipe_tx === 'in') {
                        addWalletDelta(oldTx.dompet_id, -oldTx.nominal);
                    } else if (oldTx.tipe_tx === 'out') {
                        addWalletDelta(oldTx.dompet_id, +oldTx.nominal);
                    } else if (oldTx.tipe_tx === 'transfer') {
                        addWalletDelta(oldTx.dompet_id, +oldTx.nominal);
                        addWalletDelta(oldTx.dompet_tujuan_id, -oldTx.nominal);
                    }
                } else {
                    txData.created_at = new Date();
                    batch.set(doc(collection(db, 'transactions')), txData);
                }
                
                // 2. Apply new transaction's impact on balances
                if (txType === 'in') {
                    addWalletDelta(txData.dompet_id, +txData.nominal);
                } else if (txType === 'out') {
                    addWalletDelta(txData.dompet_id, -txData.nominal);
                } else if (txType === 'transfer') {
                    addWalletDelta(txData.dompet_id, -txData.nominal);
                    addWalletDelta(txData.dompet_tujuan_id, +txData.nominal);
                }

                // 3. Apply calculated net deltas to wallets in database
                const walletIds = Object.keys(walletDeltas);
                for (const wId of walletIds) {
                    const delta = walletDeltas[wId];
                    if (delta !== 0) {
                        const wRef = doc(db, 'wallets', wId);
                        const wDoc = await getDoc(wRef);
                        if (wDoc.exists()) {
                            const currentSaldo = wDoc.data().saldo_terkini || 0;
                            const newSaldo = currentSaldo + delta;
                            batch.update(wRef, { saldo_terkini: newSaldo });
                        }
                    }
                }
                
                await batch.commit();
                alert(editId ? "Transaksi berhasil diperbarui!" : "Transaksi berhasil disimpan!");
                
                window.closeModal(document.getElementById('modal-record-transaction'));
                formRecord.reset();
                document.getElementById('tx-amount').value = '';
                document.getElementById('tx-edit-id').value = '';
                if (fileInput) fileInput.value = '';
                const fname = document.getElementById('tx-receipt-filename');
                if (fname) fname.textContent = '';
                
                const now = new Date();
                const nowIso = now.toISOString().slice(0,16);
                txDateEl.dataset.iso = nowIso;
                txDateEl.value = `${now.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][now.getMonth()]} ${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                
                // Reset text button
                if (btnSave) btnSave.innerHTML = "Simpan Transaksi";
                
                if (auth.currentUser) {
                    loadDashboardData(auth.currentUser.uid);
                    if (document.getElementById('tx-list-container')) {
                        loadTransactionsPage(auth.currentUser.uid);
                    }
                }
            } catch (err) {
                alert(err.message);
            } finally {
                if(btnSave) { btnSave.disabled = false; if(!document.getElementById('tx-edit-id').value) btnSave.innerHTML = "Simpan Transaksi"; else btnSave.innerHTML = "Simpan Perubahan"; }
            }
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.tx-tab-btn');
        if (btn) {
            document.querySelectorAll('.tx-tab-btn').forEach(b => {
                b.classList.remove('bg-error-container', 'text-error', 'bg-success-container', 'text-success', 'bg-gradient-ocean-container', 'text-primary', 'font-bold', 'shadow-card', 'bg-surface');
                b.classList.add('text-on-surface-variant', 'font-medium');
            });
            
            const type = btn.getAttribute('data-type');
            btn.classList.remove('text-on-surface-variant', 'font-medium');
            btn.classList.add('font-bold', 'shadow-card');
            
            if (type === 'out') {
                btn.classList.add('bg-error-container', 'text-error');
            } else if (type === 'in') {
                btn.classList.add('bg-success-container', 'text-success');
            } else {
                btn.classList.add('bg-gradient-ocean-container', 'text-primary');
            }
            
            document.getElementById('tx-type').value = type;
            
            if (window.populateTxCategoryDropdown) {
                window.populateTxCategoryDropdown(type);
            }
            
            const destContainer = document.getElementById('container-tx-wallet-dest');
            const catContainer = document.getElementById('container-tx-category');
            const sourceLabel = document.getElementById('label-tx-wallet-source');
            
            if (destContainer && catContainer && sourceLabel) {
                if (type === 'transfer') {
                    destContainer.classList.remove('hidden');
                    destContainer.classList.add('flex');
                    catContainer.classList.remove('flex');
                    catContainer.classList.add('hidden');
                    sourceLabel.textContent = 'Dari Dompet';
                    document.getElementById('tx-wallet-destination').required = true;
                } else {
                    destContainer.classList.add('hidden');
                    destContainer.classList.remove('flex');
                    catContainer.classList.remove('hidden');
                    catContainer.classList.add('flex');
                    sourceLabel.textContent = 'Sumber Dana';
                    document.getElementById('tx-wallet-destination').required = false;
                }
            }
        }
    });

    document.addEventListener('change', (e) => {
    if (e.target.classList.contains('hpp-raw-select')) {
        calculateHppTotal();
        window.calculateRestockTotal();
    }
        if (e.target && e.target.id === 'tx-receipt-file') {
            const receiptName = document.getElementById('tx-receipt-filename');
            if (receiptName) {
                if (e.target.files.length > 0) {
                    receiptName.textContent = e.target.files[0].name;
                } else {
                    receiptName.textContent = '';
                }
            }
        }
    });

    // Input Format Titik on tx-amount & add-wallet-balance via delegation
    document.addEventListener('input', function(e) {
        if (e.target && (e.target.id === 'tx-amount' || e.target.id === 'add-wallet-balance' || e.target.id === 'sale-payment')) {
            let val = e.target.value.replace(/[^0-9]/g, '');
            if (val) {
                val = parseInt(val, 10).toString();
                e.target.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            } else {
                e.target.value = '';
            }
        }
        
        // Phase 5: Show/Hide Wallet in Catat Penjualan
        if (e.target && e.target.id === 'sale-payment') {
            const valStr = e.target.value.replace(/[^0-9]/g, '');
            if (parseInt(valStr) > 0) {
                document.getElementById('container-sale-wallet').classList.remove('hidden');
                document.getElementById('sale-wallet-id').required = true;
            } else {
                document.getElementById('container-sale-wallet').classList.add('hidden');
                document.getElementById('sale-wallet-id').required = false;
            }
        }
    });

    // Set default date for transaction form
    const txDateEl = document.getElementById('tx-date');
    if (txDateEl) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        txDateEl.value = now.toISOString().slice(0,16);
    }
    
    // ==========================================
    // PHASE 5 FORM SUBMISSIONS
    // ==========================================
    document.getElementById('form-tambah-mitra')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        const btn = document.getElementById('btn-save-partner');
        btn.disabled = true; btn.innerHTML = "Menyimpan...";
        try {
            const partnerId = document.getElementById('add-partner-id').value;
            const data = {
                uid: auth.currentUser.uid,
                nama_toko: document.getElementById('add-partner-name').value,
                pemilik: document.getElementById('add-partner-owner').value,
                kontak: document.getElementById('add-partner-phone').value,
                alamat: document.getElementById('add-partner-address').value.trim()
            };
            
            if (partnerId) {
                // Update
                
await apiFetch('/api/partners', { method: 'POST', body: JSON.stringify({ id: partnerId, ...data }) });

            } else {
                // Add new
                data.total_piutang = 0;
                
await apiFetch('/api/partners', { method: 'POST', body: JSON.stringify(data) });

            }
            
            closeModal(document.getElementById('modal-tambah-mitra'));
            document.getElementById('form-tambah-mitra').reset();
            document.getElementById('add-partner-id').value = '';
            document.getElementById('title-tambah-mitra').innerText = "Tambah Mitra Baru";
            loadPartnersPage(auth.currentUser.uid);
        } catch (err) { alert(err.message); }
        finally { btn.disabled = false; btn.innerHTML = "Simpan Mitra"; }
    });

    document.getElementById('form-distribusi-stok')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        const btn = document.getElementById('btn-save-distribusi');
        btn.disabled = true; btn.innerHTML = "Menyimpan...";
        try {
            const partnerId = document.getElementById('dist-partner-id').value;
            const productId = document.getElementById('dist-product-id').value;
            const qty = parseInt(document.getElementById('dist-qty').value);
            const setoranStr = document.getElementById('dist-harga-setoran').value.replace(/[^0-9]/g, '');
            const setoran = setoranStr ? parseInt(setoranStr) : 0;
            
            const q = query(collection(db, 'consignment_stock'), where('partner_id', '==', partnerId), where('product_id', '==', productId));
            const snap = await getDocs(q);
            let consDocRef = snap.empty ? doc(collection(db, 'consignment_stock')) : snap.docs[0].ref;

            // FIFO Batch preparation
            const qBatches = query(collection(db, 'stock_batches'), where('product_id', '==', productId));
            const batchSnapRaw = await getDocs(qBatches);
            let validBatches = [];
            batchSnapRaw.forEach(b => {
                if (b.data().qty_sisa > 0) validBatches.push(b);
            });
            validBatches.sort((a, b) => safeToMillis(a.data().tanggal_produksi) - safeToMillis(b.data().tanggal_produksi));

            let partnerData = null;
            let prodData = null;

            await runTransaction(db, async (transaction) => {
                // === ALL READS ===
                const prodRef = doc(db, 'products', productId);
                const prodDoc = await transaction.get(prodRef);
                if (!prodDoc.exists()) throw new Error("Produk tidak ditemukan");
                if (prodDoc.data().stok_gudang < qty) throw new Error("Stok gudang tidak mencukupi!");
                prodData = prodDoc.data();
                
                const validBatchData = [];
                for(let b of validBatches) {
                    const bDoc = await transaction.get(b.ref);
                    validBatchData.push({ ref: b.ref, sisa: bDoc.data().qty_sisa });
                }
                
                const partnerRef = doc(db, 'partners', partnerId);
                const partnerDoc = await transaction.get(partnerRef);
                if (!partnerDoc.exists()) throw new Error("Mitra tidak ditemukan");
                partnerData = partnerDoc.data();
                
                let consDoc = null;
                if (!snap.empty) {
                    consDoc = await transaction.get(consDocRef);
                }

                // === LOGIC ===
                let sisaKurang = qty;
                const batchUpdates = [];
                for(let bData of validBatchData) {
                    let currentSisa = bData.sisa;
                    if(currentSisa > 0) {
                        if(currentSisa >= sisaKurang) {
                            batchUpdates.push({ ref: bData.ref, sisa: currentSisa - sisaKurang });
                            sisaKurang = 0;
                            break;
                        } else {
                            batchUpdates.push({ ref: bData.ref, sisa: 0 });
                            sisaKurang -= currentSisa;
                        }
                    }
                }
                if(sisaKurang > 0) console.warn("Batch FIFO tidak sinkron. Mengabaikan sisa kurang " + sisaKurang);
                
                const newDebt = qty * setoran;
                
                // === ALL WRITES ===
                transaction.update(prodRef, { stok_gudang: prodDoc.data().stok_gudang - qty });
                transaction.update(partnerRef, { total_piutang: (partnerDoc.data().total_piutang || 0) + newDebt });
                
                if (newDebt > 0) {
                    const txRef = doc(collection(db, 'transactions'));
                    transaction.set(txRef, {
                        uid: auth.currentUser.uid,
                        tipe_tx: 'in',
                        nominal: newDebt,
                        kategori: 'Distribusi Stok',
                        dompet_id: 'piutang',
                        tanggal: Timestamp.now(),
                        catatan: `Distribusi ke: ${partnerDoc.data().nama_toko || partnerDoc.data().nama_partner || 'Mitra'}`
                    });
                }

                const newHpp = qty * (prodDoc.data().last_hpp_satuan || prodDoc.data().harga_modal || 0);
                if (newHpp > 0) {
                    const txHppRef = doc(collection(db, 'transactions'));
                    transaction.set(txHppRef, {
                        uid: auth.currentUser.uid,
                        tipe_tx: 'out',
                        nominal: newHpp,
                        kategori: 'Beban HPP',
                        dompet_id: 'persediaan',
                        tanggal: Timestamp.now(),
                        catatan: `HPP Distribusi ke: ${partnerDoc.data().nama_toko || partnerDoc.data().nama_partner || 'Mitra'}`
                    });
                }
                
                batchUpdates.forEach(u => transaction.update(u.ref, { qty_sisa: u.sisa, status: u.sisa === 0 ? 'depleted' : 'active' }));
                
                if (!consDoc) {
                    transaction.set(consDocRef, {
                        uid: auth.currentUser.uid,
                        partner_id: partnerId,
                        product_id: productId,
                        nama_produk: prodDoc.data().nama_produk || prodDoc.data().nama,
                        qty_titipan: qty,
                        harga_setoran: setoran
                    });
                } else {
                    transaction.update(consDocRef, { 
                        qty_titipan: consDoc.data().qty_titipan + qty,
                        harga_setoran: setoran
                    });
                }
            });
            
            closeModal(document.getElementById('modal-distribusi-stok'));
            document.getElementById('form-distribusi-stok').reset();
            loadPartnersPage(auth.currentUser.uid);
            
            if (confirm("Distribusi berhasil! Apakah Anda ingin mencetak struk?")) {
                if (window.printDistribusiReceipt) {
                    window.printDistribusiReceipt(partnerData, prodData, qty, setoran);
                }
            }
        } catch (err) { alert(err.message); }
        finally { btn.disabled = false; btn.innerHTML = "Simpan Distribusi"; }
    });

    document.getElementById('form-catat-penjualan')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        const btn = document.getElementById('btn-save-sale');
        btn.disabled = true; btn.innerHTML = "Memproses...";
        try {
            const partnerId = document.getElementById('sale-partner-id').value;
            const consId = document.getElementById('sale-product-id').value;
            const qtySold = parseInt(document.getElementById('sale-qty').value);
            const paymentStr = document.getElementById('sale-payment').value.replace(/[^0-9]/g, '');
            const paymentReceived = paymentStr ? parseInt(paymentStr) : 0;
            const walletId = document.getElementById('sale-wallet-id').value;
            
            const selectEl = document.getElementById('sale-product-id');
            const selectedOpt = selectEl.options[selectEl.selectedIndex];
            const setoranPrice = parseInt(selectedOpt.getAttribute('data-price')) || 0;
            const totalTitipan = parseInt(selectedOpt.getAttribute('data-qty')) || 0;
            const productId = selectedOpt.getAttribute('data-product-id');
            
            let qtyBagus = 0;
            let qtyRusak = 0;
            
            if (qtySold < totalTitipan) {
                qtyBagus = parseInt(document.getElementById('sale-qty-bagus').value) || 0;
                qtyRusak = parseInt(document.getElementById('sale-qty-rusak').value) || 0;
                if (qtySold + qtyBagus + qtyRusak !== totalTitipan) {
                    throw new Error(`Total Qty Laku (${qtySold}) + Sisa Bagus (${qtyBagus}) + Rusak (${qtyRusak}) harus sama dengan total titipan (${totalTitipan})!`);
                }
            }
            
            if (paymentReceived > 0 && !walletId) throw new Error("Pilih dompet penerimaan uang!");
            
            const piutangReduction = paymentReceived + (qtyBagus * setoranPrice) + (qtyRusak * setoranPrice);
            
            await runTransaction(db, async (transaction) => {
                // === ALL READS ===
                const consRef = doc(db, 'consignment_stock', consId);
                const consDoc = await transaction.get(consRef);
                if (!consDoc.exists() || consDoc.data().qty_titipan < qtySold) throw new Error("Jumlah laku melebihi sisa titipan!");
                
                const partnerRef = doc(db, 'partners', partnerId);
                const partnerDoc = await transaction.get(partnerRef);
                
                let walletRef = null;
                let walletDoc = null;
                if (paymentReceived > 0) {
                    walletRef = doc(db, 'wallets', walletId);
                    walletDoc = await transaction.get(walletRef);
                }
                
                let prodDoc = null;
                let prodRef = null;
                if ((qtyBagus > 0 || qtyRusak > 0) && productId) {
                    prodRef = doc(db, 'products', productId);
                    prodDoc = await transaction.get(prodRef);
                }
                
                // === ALL WRITES ===
                transaction.update(consRef, { qty_titipan: consDoc.data().qty_titipan - qtySold - qtyBagus - qtyRusak });
                transaction.update(partnerRef, { total_piutang: Math.max(0, (partnerDoc.data().total_piutang || 0) - piutangReduction) });
                
                if (paymentReceived > 0 && walletRef && walletDoc) {
                    transaction.update(walletRef, { saldo_terkini: walletDoc.data().saldo_terkini + paymentReceived });
                    
                    const txRef = doc(collection(db, 'transactions'));
                    transaction.set(txRef, {
                        uid: auth.currentUser.uid,
                        tipe_tx: 'in',
                        nominal: paymentReceived,
                        kategori: 'Setoran Piutang Mitra',
                        dompet_id: walletId,
                        tanggal: Timestamp.now(),
                        catatan: `Konsinyasi laku: ${partnerDoc.data().nama_toko || 'Mitra'}`
                    });
                }
                
                // Langkah 2 / B: Penyesuaian Stok Fisik & Debit Persediaan Barang Jadi, Kredit Beban HPP (Barang Bagus Kembali)
                const costPrice = (prodDoc && prodDoc.exists()) ? (prodDoc.data().last_hpp_satuan || prodDoc.data().harga_modal || 0) : 0;
                if (qtyBagus > 0 && prodRef && prodDoc) {
                    transaction.update(prodRef, { stok_gudang: (prodDoc.data().stok_gudang || 0) + qtyBagus });
                    
                    const batchRef = doc(collection(db, 'stock_batches'));
                    transaction.set(batchRef, {
                        uid: auth.currentUser.uid,
                        product_id: productId,
                        qty_awal: qtyBagus,
                        qty_sisa: qtyBagus,
                        hpp_total: qtyBagus * costPrice,
                        hpp_satuan: costPrice,
                        harga_jual: prodDoc.data().harga_jual || 0,
                        tanggal_produksi: Timestamp.now(),
                        status: 'active'
                    });

                    // Kredit Beban HPP
                    const txHppCreditRef = doc(collection(db, 'transactions'));
                    transaction.set(txHppCreditRef, {
                        uid: auth.currentUser.uid,
                        tipe_tx: 'out',
                        nominal: -(qtyBagus * costPrice),
                        kategori: 'Beban HPP',
                        dompet_id: 'persediaan',
                        tanggal: Timestamp.now(),
                        catatan: `Kredit Beban HPP - Retur Bagus: ${consDoc.data().nama_produk} (${qtyBagus} pcs)`
                    });
                }
                
                // Langkah 1 / A: Penyesuaian Piutang Toko (Menggunakan Harga Jual untuk seluruh retur)
                if (qtyBagus + qtyRusak > 0) {
                    const txReturRef = doc(collection(db, 'transactions'));
                    transaction.set(txReturRef, {
                        uid: auth.currentUser.uid,
                        tipe_tx: 'out',
                        nominal: (qtyBagus + qtyRusak) * setoranPrice,
                        kategori: 'Retur Penjualan',
                        dompet_id: 'piutang',
                        tanggal: Timestamp.now(),
                        catatan: `Retur penjualan: ${consDoc.data().nama_produk} (${qtyBagus + qtyRusak} pcs)`
                    });
                }
                
                // Langkah 3 / C: Pemindahan Beban Barang Rusak (Wajib Menggunakan Harga Modal)
                if (qtyRusak > 0) {
                    // Debit Beban Kerugian Barang Rusak
                    const txKerugianRef = doc(collection(db, 'transactions'));
                    transaction.set(txKerugianRef, {
                        uid: auth.currentUser.uid,
                        tipe_tx: 'out',
                        nominal: qtyRusak * costPrice,
                        kategori: 'Beban Kerugian Barang Rusak',
                        dompet_id: 'persediaan',
                        tanggal: Timestamp.now(),
                        catatan: `Kerugian barang rusak: ${consDoc.data().nama_produk} (${qtyRusak} pcs)`
                    });
                    
                    // Kredit Beban HPP (menggunakan nominal negatif)
                    const txHppCreditRusakRef = doc(collection(db, 'transactions'));
                    transaction.set(txHppCreditRusakRef, {
                        uid: auth.currentUser.uid,
                        tipe_tx: 'out',
                        nominal: -(qtyRusak * costPrice),
                        kategori: 'Beban HPP',
                        dompet_id: 'persediaan',
                        tanggal: Timestamp.now(),
                        catatan: `Kredit Beban HPP - Retur Rusak: ${consDoc.data().nama_produk} (${qtyRusak} pcs)`
                    });
                }
            });
            
            closeModal(document.getElementById('modal-catat-penjualan'));
            document.getElementById('form-catat-penjualan').reset();
            document.getElementById('container-retur-rusak')?.classList.add('hidden');
            loadPartnersPage(auth.currentUser.uid);
            alert("Penjualan & retur berhasil dicatat!");
        } catch (err) { alert(err.message); }
        finally { btn.disabled = false; btn.innerHTML = "Proses Penjualan"; }
    });

    // ==========================================
    // PHASE 6 INPUT LISTENERS & SUBMISSIONS
    // ==========================================
    window.calculateRestockTotal = function() {
        let total = 0;
        document.querySelectorAll('.hpp-row').forEach(row => {
            // Support both old format (hpp-desc/hpp-nominal) and new format (hpp-raw-select/hpp-raw-qty)
            const sel = row.querySelector('.hpp-raw-select');
            const qtyInp = row.querySelector('.hpp-raw-qty');
            const nomEl = row.querySelector('.hpp-nominal');

            if (sel && qtyInp && sel.value) {
                // New format: raw material select + qty
                const cost = parseFloat(sel.options[sel.selectedIndex]?.dataset?.cost) || 0;
                const q = parseFloat(qtyInp.value) || 0;
                total += cost * q;
            } else if (nomEl) {
                // Old format: manual text nominal
                const nomStr = nomEl.value.replace(/[^0-9]/g, '');
                total += nomStr ? parseInt(nomStr) : 0;
            }
        });
        const methodChecked = document.querySelector('input[name="restock-method"]:checked');
        const method = methodChecked ? methodChecked.value : 'produksi';
        
        let hppSatuan = 0;
        
        if (method === 'produksi') {
            const qty = parseInt(document.getElementById('restock-qty').value) || 1;
            hppSatuan = qty > 0 ? Math.round(total / qty) : 0;
            
            document.getElementById('restock-total-hpp').innerText = formatRupiah(total);
            document.getElementById('restock-hpp-satuan').innerText = formatRupiah(hppSatuan);
        } else {
            const hargaBeliInput = document.getElementById('restock-harga-beli');
            const hBeliStr = hargaBeliInput ? hargaBeliInput.value.replace(/[^0-9]/g, '') : '';
            hppSatuan = hBeliStr ? parseInt(hBeliStr) : 0;
        }

        // Margin Calculation
        const marginSelect = document.getElementById('restock-margin');
        const marginPct = marginSelect ? parseInt(marginSelect.value) / 100 : 0.4;
        let rekomendasi = hppSatuan * (1 + marginPct);
        rekomendasi = Math.ceil(rekomendasi / 100) * 100;
        
        const elRek = document.getElementById('restock-rekomendasi-harga');
        if (elRek) elRek.innerText = formatRupiah(rekomendasi);
        
        // Do not auto-fill manual field if user has typed something, but for simplicity we fill it if empty
        const hargaJualInput = document.getElementById('restock-harga-jual');
        if (hargaJualInput) {
            if (!hargaJualInput.value || hargaJualInput.dataset.auto == "1") {
                hargaJualInput.value = formatRupiah(rekomendasi);
                hargaJualInput.dataset.auto = "1";
            }
        }
    };

    // Attach listener to margin dropdown
    document.addEventListener('change', (e) => {
        if (e.target.id === 'restock-margin') {
            window.calculateRestockTotal();
        }
    });

    window.calculateDistribusiPiutang = function() {
        const qty = parseInt(document.getElementById('dist-qty').value) || 0;
        const setoranStr = document.getElementById('dist-harga-setoran').value.replace(/[^0-9]/g, '');
        const setoran = setoranStr ? parseInt(setoranStr) : 0;
        document.getElementById('dist-total-piutang').innerText = formatRupiah(qty * setoran);
    };

    document.addEventListener('input', function(e) {
        if (e.target && (e.target.id === 'restock-harga-jual' || e.target.id === 'dist-harga-setoran' || e.target.id === 'restock-harga-beli')) {
            let val = e.target.value.replace(/[^0-9]/g, '');
            if (val) {
                val = parseInt(val, 10).toString();
                e.target.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            } else {
                e.target.value = '';
            }
            if (e.target.id === 'restock-harga-jual') e.target.dataset.auto = "0";
            if (e.target.id === 'dist-harga-setoran') window.calculateDistribusiPiutang();
            if (e.target.id === 'restock-harga-beli') window.calculateRestockTotal();
        }
        // HPP raw qty changed -> recalculate
        if (e.target && e.target.classList.contains('hpp-raw-qty')) {
            calculateHppTotal();
            window.calculateRestockTotal();
        }
        if (e.target && e.target.id === 'restock-qty') {
            calculateHppTotal();
            window.calculateRestockTotal();
        }
        if (e.target && e.target.id === 'dist-qty') {
            window.calculateDistribusiPiutang();
        }
    });

    document.addEventListener('change', function(e) {
        if (e.target && e.target.name === 'restock-method') {
            const method = e.target.value;
            const hppContainer = document.getElementById('restock-hpp-container');
            const beliContainer = document.getElementById('restock-beli-container');
            if (method === 'produksi') {
                hppContainer.classList.remove('hidden');
                beliContainer.classList.add('hidden');
            } else {
                hppContainer.classList.add('hidden');
                beliContainer.classList.remove('hidden');
            }
            window.calculateRestockTotal();
        }
    });
    
    document.getElementById('dist-product-id')?.addEventListener('change', function(e) {
        const selectedOpt = e.target.options[e.target.selectedIndex];
        if (selectedOpt && selectedOpt.value) {
            const hpp = parseInt(selectedOpt.getAttribute('data-hpp')) || 0;
            const hj = parseInt(selectedOpt.getAttribute('data-hj')) || 0;
            document.getElementById('dist-harga-jual-info').innerText = formatRupiah(hj);
            document.getElementById('dist-harga-setoran').value = formatRupiah(hj);
            window.calculateDistribusiPiutang();
        } else {
            document.getElementById('dist-harga-jual-info').innerText = 'Rp 0';
            document.getElementById('dist-harga-setoran').value = '';
            document.getElementById('dist-total-piutang').innerText = 'Rp 0';
        }
    });

    document.getElementById('restock-product-id')?.addEventListener('change', function(e) {
        const prodId = e.target.value;
        const d = window.productDataMap[prodId];
        const container = document.getElementById('hpp-rows-container');
        if (d && d.last_hpp_items && d.last_hpp_items.length > 0) {
            container.innerHTML = '';
            d.last_hpp_items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'flex gap-2 hpp-row';
                const optionsHtml = window.cachedRawMaterialsOptions || '<option value="">Pilih Bahan Baku...</option>';
                row.innerHTML = `
                    <select class="hpp-raw-select w-2/3 bg-surface border border-outline-variant rounded-2xl p-2 text-sm focus:border-primary" required>
                        ${optionsHtml}
                    </select>
                    <input type="number" step="0.01" min="0" class="hpp-raw-qty w-1/3 bg-surface border border-outline-variant rounded-2xl p-2 text-sm focus:border-primary" placeholder="Qty Pakai" value="${item.qty_used || 0}" required>
                    <button type="button" class="btn-remove-hpp text-error p-2 hover:bg-error/10 rounded-2xl"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                `;
                const selectEl = row.querySelector('.hpp-raw-select');
                if (selectEl) {
                    if (item.raw_id) {
                        selectEl.value = item.raw_id;
                    } else {
                        // fallback matching using keterangan string
                        for (let opt of selectEl.options) {
                            if (opt.text.includes(item.keterangan)) {
                                selectEl.value = opt.value;
                                break;
                            }
                        }
                    }
                }
                container.appendChild(row);
            });
            document.getElementById('restock-harga-jual').value = formatRupiah(d.last_harga_jual || 0);
            document.getElementById('restock-harga-jual').dataset.auto = "0";
        } else {
            const optionsHtml = window.cachedRawMaterialsOptions || '<option value="">Pilih Bahan Baku...</option>';
            container.innerHTML = `
                <div class="flex gap-2 hpp-row">
                    <select class="hpp-raw-select w-2/3 bg-surface border border-outline-variant rounded-2xl p-2 text-sm focus:border-primary" required>
                        ${optionsHtml}
                    </select>
                    <input type="number" step="0.01" min="0" class="hpp-raw-qty w-1/3 bg-surface border border-outline-variant rounded-2xl p-2 text-sm focus:border-primary" placeholder="Qty Pakai" required>
                    <button type="button" class="btn-remove-hpp text-error p-2 hover:bg-error/10 rounded-2xl"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
            `;
            document.getElementById('restock-harga-jual').value = '';
            document.getElementById('restock-harga-jual').dataset.auto = "1";
        }
        window.calculateRestockTotal();
        document.getElementById('restock-qty').dispatchEvent(new Event('input', {bubbles: true}));
    });

    document.getElementById('form-tambah-kategori')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        const btn = document.getElementById('btn-save-kategori');
        btn.disabled = true; btn.innerHTML = "Menyimpan...";
        try {
            await setDoc(doc(collection(db, 'product_categories')), {
                uid: auth.currentUser.uid,
                nama_kategori: document.getElementById('cat-nama').value
            });
            closeModal(document.getElementById('modal-tambah-kategori'));
            document.getElementById('form-tambah-kategori').reset();
            if (window.populateCategoryDropdown) window.populateCategoryDropdown(); // refresh dropdown
        } catch (err) { alert(err.message); }
        finally { btn.disabled = false; btn.innerHTML = "Simpan"; }
    });

    document.getElementById('form-tambah-unit')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        const btn = document.getElementById('btn-save-unit');
        btn.disabled = true; btn.innerHTML = "Menyimpan...";
        try {
            await setDoc(doc(collection(db, 'product_units')), {
                uid: auth.currentUser.uid,
                nama_unit: document.getElementById('unit-nama').value
            });
            closeModal(document.getElementById('modal-tambah-unit'));
            document.getElementById('form-tambah-unit').reset();
            if (window.populateUnitDropdown) window.populateUnitDropdown(); 
        } catch (err) { alert(err.message); }
        finally { btn.disabled = false; btn.innerHTML = "Simpan"; }
    });

    // Auto-populate when category or unit dropdowns are focused
    document.addEventListener('focusin', (e) => {
        if (e.target.id === 'prod-kategori') {
            if (window.populateCategoryDropdown) window.populateCategoryDropdown();
        }
        if (e.target.id === 'prod-unit') {
            if (window.populateUnitDropdown) window.populateUnitDropdown();
        }
    });

    // Handle Foto Produk File Input to Base64
    document.getElementById('prod-foto-file')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                const base64Str = evt.target.result;
                document.getElementById('prod-foto-url').value = base64Str;
                document.getElementById('prod-foto-preview').innerHTML = `<img src="${base64Str}" class="w-full h-full object-cover">`;
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('prod-foto-url').value = '';
            document.getElementById('prod-foto-preview').innerHTML = `<span class="material-symbols-outlined text-on-surface-variant">image</span>`;
        }
    });

    window.openEditProduct = function(id, nama, kategori, unit, barcode, fotoUrl) {
        document.getElementById('prod-id').value = id;
        document.getElementById('prod-nama').value = nama;
        
        if (window.populateCategoryDropdown) {
            window.populateCategoryDropdown().then(() => {
                document.getElementById('prod-kategori').value = kategori;
            });
        } else {
            document.getElementById('prod-kategori').value = kategori;
        }
        
        if (window.populateUnitDropdown) {
            window.populateUnitDropdown().then(() => {
                document.getElementById('prod-unit').value = unit;
            });
        } else {
            document.getElementById('prod-unit').value = unit;
        }
        
        document.getElementById('prod-barcode').value = barcode || '';
        document.getElementById('prod-foto-url').value = fotoUrl || '';
        
        const preview = document.getElementById('prod-foto-preview');
        if (preview) {
            if (fotoUrl) {
                preview.innerHTML = `<img src="${fotoUrl}" class="w-full h-full object-cover">`;
            } else {
                preview.innerHTML = `<span class="material-symbols-outlined text-on-surface-variant">image</span>`;
            }
        }
        
        const title = document.getElementById('title-tambah-produk');
        if (title) title.innerText = "Edit Produk";
        const btnSave = document.getElementById('btn-save-produk');
        if (btnSave) btnSave.innerText = "Simpan Perubahan";
        
        openModal(document.getElementById('modal-tambah-produk'));
    };

    document.getElementById('form-tambah-produk')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        const btn = document.getElementById('btn-save-produk');
        const prodId = document.getElementById('prod-id').value;
        btn.disabled = true; btn.innerHTML = "Menyimpan...";
        try {
            const data = {
                uid: auth.currentUser.uid,
                barcode: document.getElementById('prod-barcode').value,
                nama: document.getElementById('prod-nama').value,
                kategori: document.getElementById('prod-kategori').value,
                unit: document.getElementById('prod-unit').value,
                foto_url: document.getElementById('prod-foto-url').value || null
            };
            
            if (prodId) {
                // Edit mode: use updateDoc to preserve stock & hpp
                
await apiFetch('/api/products', { method: 'POST', body: JSON.stringify({ id: prodId, ...data }) });

                alert("Produk berhasil diperbarui!");
            } else {
                // Add mode: use setDoc with initial values
                data.stok_gudang = 0;
                data.last_hpp_items = [];
                data.last_hpp_satuan = 0;
                data.last_harga_jual = 0;
                
await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data) });

                alert("Produk berhasil disimpan!");
            }
            
            closeModal(document.getElementById('modal-tambah-produk'));
            document.getElementById('form-tambah-produk').reset();
            document.getElementById('prod-id').value = '';
            document.getElementById('prod-foto-preview').innerHTML = `<span class="material-symbols-outlined text-on-surface-variant">image</span>`;
            document.getElementById('prod-foto-url').value = '';
            
            const title = document.getElementById('title-tambah-produk');
            if (title) title.innerText = "Tambah Produk Baru";
            if (btn) btn.innerText = "Simpan Produk";
            
            window.stopScanner();
            loadProductsPage();
        } catch (err) { alert(err.message); }
        finally { btn.disabled = false; btn.innerHTML = "Simpan Produk"; }
    });

    document.getElementById('form-restock')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        const btn = document.getElementById('btn-save-restock');
        if (btn) { btn.disabled = true; btn.innerHTML = "Memproses..."; }
        try {
            const productId = document.getElementById('restock-product-id')?.value;
            const qty = parseInt(document.getElementById('restock-qty')?.value || '0');
            let walletId = document.getElementById('restock-wallet-id')?.value || '';
            const hargaJualStr = (document.getElementById('restock-harga-jual')?.value || '').replace(/[^0-9]/g, '');
            const hargaJual = hargaJualStr ? parseInt(hargaJualStr) : 0;
            const dateVal = document.getElementById('restock-date')?.value || '';
            
            if (!productId) throw new Error("Pilih produk yang ingin direstock/diproduksi!");
            if (!qty || qty <= 0) throw new Error("Masukkan jumlah produksi / restock yang valid!");
            
            const dateObj = dateVal ? new Date(dateVal) : new Date();
            const txDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
            
            const methodChecked = document.querySelector('input[name="restock-method"]:checked');
            const method = methodChecked ? methodChecked.value : 'produksi';
            
            const hppItems = [];
            let hppTotal = 0;
            let kasDeductionTotal = 0;
            let hppSatuan = 0;
            const rawMaterialDeductions = [];
            
            if (method === 'produksi') {
                document.querySelectorAll('.hpp-row').forEach(row => {
                    const descEl = row.querySelector('.hpp-desc');
                    const nomEl = row.querySelector('.hpp-nominal');
                    const selectEl = row.querySelector('.hpp-raw-select');
                    const qtyEl = row.querySelector('.hpp-raw-qty');

                    if (descEl && nomEl) {
                        const desc = descEl.value;
                        const nomStr = nomEl.value.replace(/[^0-9]/g, '');
                        const nom = nomStr ? parseInt(nomStr) : 0;
                        if (desc && nom > 0) {
                            hppItems.push({ keterangan: desc, nominal: nom });
                            hppTotal += nom;
                            kasDeductionTotal += nom; // Manual items deduct Kas
                        }
                    } else if (selectEl && qtyEl) {
                        const rawName = selectEl.options[selectEl.selectedIndex]?.text?.split(' (')[0] || '';
                        const cost = parseFloat(selectEl.options[selectEl.selectedIndex]?.dataset.cost) || 0;
                        const q = parseFloat(qtyEl.value) || 0;
                        const nom = Math.round(cost * q);
                        if (rawName && selectEl.value && nom > 0) {
                            hppItems.push({ keterangan: rawName, nominal: nom, raw_id: selectEl.value, qty_used: q });
                            hppTotal += nom;
                            rawMaterialDeductions.push({ id: selectEl.value, qty: q, name: rawName });
                        }
                    }
                });
                hppSatuan = qty > 0 ? Math.round(hppTotal / qty) : 0;
            } else {
                const hargaBeliStr = (document.getElementById('restock-harga-beli')?.value || '').replace(/[^0-9]/g, '');
                hppSatuan = hargaBeliStr ? parseInt(hargaBeliStr) : 0;
                hppTotal = hppSatuan * qty;
                kasDeductionTotal = hppTotal; // In Beli Jadi, the entire cost is paid from Kas
            }
            
            if (kasDeductionTotal > 0 && !walletId) {
                const walletSelect = document.getElementById('restock-wallet-id');
                if (walletSelect && walletSelect.options.length > 1) {
                    for (let i = 1; i < walletSelect.options.length; i++) {
                        if (walletSelect.options[i].value) {
                            walletId = walletSelect.options[i].value;
                            break;
                        }
                    }
                }
            }
            
            await runTransaction(db, async (transaction) => {
                // 1. Read Wallet (only if there are manual additions that deduct cash)
                let walletRef = null;
                let walletDoc = null;
                if (kasDeductionTotal > 0) {
                    if (!walletId) throw new Error("Pilih Dompet/Rekening untuk memotong biaya pembayaran!");
                    walletRef = doc(db, 'wallets', walletId);
                    walletDoc = await transaction.get(walletRef);
                    if (!walletDoc.exists()) throw new Error("Dompet tidak ditemukan!");
                    if (walletDoc.data().saldo_terkini < kasDeductionTotal) {
                        throw new Error("Saldo Kas tidak mencukupi untuk biaya produksi / pembelian!");
                    }
                }
                
                // 2. Read Product
                const prodRef = doc(db, 'products', productId);
                const prodDoc = await transaction.get(prodRef);
                if (!prodDoc.exists()) throw new Error("Produk tidak ditemukan!");
                
                // 3. Read Raw Materials
                const rawDocs = {};
                for (const raw of rawMaterialDeductions) {
                    const rRef = doc(db, 'raw_materials', raw.id);
                    const rDoc = await transaction.get(rRef);
                    if (!rDoc.exists() || (rDoc.data().stok_aktif || 0) < raw.qty) {
                        throw new Error(`Stok Bahan Baku ${raw.name} tidak mencukupi! Tersedia: ${rDoc.data()?.stok_aktif || 0}`);
                    }
                    rawDocs[raw.id] = { ref: rRef, doc: rDoc };
                }
                
                // 4. Execute Writes
                if (kasDeductionTotal > 0) {
                    transaction.update(walletRef, { saldo_terkini: walletDoc.data().saldo_terkini - kasDeductionTotal });
                    
                    const txRef = doc(collection(db, 'transactions'));
                    transaction.set(txRef, {
                        uid: auth.currentUser.uid,
                        tipe_tx: 'out',
                        nominal: kasDeductionTotal,
                        kategori: method === 'produksi' ? 'Restock / Produksi (Biaya Tambahan)' : 'Pembelian Barang Jadi',
                        dompet_id: walletId,
                        tanggal: Timestamp.fromDate(txDate),
                        catatan: method === 'produksi' ? `Biaya Tambahan Produksi: ${prodDoc.data().nama_produk || prodDoc.data().nama} (${qty})` : `Beli Jadi: ${prodDoc.data().nama_produk || prodDoc.data().nama} (${qty})`
                    });
                }
                
                transaction.update(prodRef, { 
                    stok_gudang: (prodDoc.data().stok_gudang || 0) + qty,
                    last_hpp_items: hppItems,
                    last_hpp_satuan: hppSatuan,
                    last_harga_jual: hargaJual,
                    harga_jual: hargaJual
                });
                
                const batchRef = doc(collection(db, 'stock_batches'));
                transaction.set(batchRef, {
                    uid: auth.currentUser.uid,
                    product_id: productId,
                    qty_awal: qty,
                    qty_sisa: qty,
                    hpp_total: hppTotal,
                    hpp_satuan: hppSatuan,
                    harga_jual: hargaJual,
                    tanggal_produksi: Timestamp.fromDate(txDate),
                    status: 'active'
                });
                
                for (const raw of rawMaterialDeductions) {
                    const currentStok = rawDocs[raw.id].doc.data().stok_aktif;
                    transaction.update(rawDocs[raw.id].ref, { stok_aktif: currentStok - raw.qty });
                }

                // Journal for Perpetual Inventory
                if (hppTotal > 0) {
                    const txProdInRef = doc(collection(db, 'transactions'));
                    transaction.set(txProdInRef, {
                        uid: auth.currentUser.uid,
                        tipe_tx: 'in',
                        nominal: hppTotal,
                        kategori: 'Persediaan Barang Jadi',
                        dompet_id: 'persediaan',
                        tanggal: Timestamp.fromDate(txDate),
                        catatan: `Debit Persediaan Barang Jadi - ${method === 'produksi' ? 'Produksi' : 'Beli Jadi'}: ${prodDoc.data().nama_produk || prodDoc.data().nama || 'Produk'} (${qty})`
                    });

                    if (method === 'produksi') {
                        const txProdOutRef = doc(collection(db, 'transactions'));
                        transaction.set(txProdOutRef, {
                            uid: auth.currentUser.uid,
                            tipe_tx: 'out',
                            nominal: hppTotal,
                            kategori: 'Persediaan Bahan Baku',
                            dompet_id: 'persediaan',
                            tanggal: Timestamp.fromDate(txDate),
                            catatan: `Kredit Persediaan Bahan Baku - Produksi: ${prodDoc.data().nama_produk || prodDoc.data().nama || 'Produk'} (${qty})`
                        });
                    }
                }
            });
            
            closeModal(document.getElementById('modal-restock'));
            document.getElementById('form-restock').reset();
            loadProductsPage();
            if (document.getElementById('home-balance')) loadDashboardData(auth.currentUser.uid); 
            alert(`Restock (${method === 'produksi' ? 'Produksi' : 'Beli Jadi'}) berhasil! Stok masuk.`);
        } catch (err) { alert(err.message); }
        finally {
            if (btn) { btn.disabled = false; btn.innerHTML = "Simpan Produksi & Update Stok"; }
        }
    });

    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'form-pos-checkout') {
            e.preventDefault();
            if (!auth.currentUser) return;
            const btn = document.getElementById('btn-save-pos');
            
            const total = parseInt(document.getElementById('pos-checkout-total').dataset.val) || 0;
            let cash = parseInt(document.getElementById('pos-cash-received').value.replace(/\D/g, '')) || 0;
            const walletId = document.getElementById('pos-wallet-id').value;
            
            if (cash < total) {
                alert("Uang tunai kurang dari total tagihan!");
                return;
            }
            if (window.posCart.length === 0) {
                alert("Keranjang kosong.");
                return;
            }
            
            btn.disabled = true;
            btn.innerHTML = "Memproses...";
            
            try {
                await runTransaction(db, async (transaction) => {
                    // 1. Dapatkan dompet penerima
                    const walletRef = doc(db, 'wallets', walletId);
                    const walletDoc = await transaction.get(walletRef);
                    if (!walletDoc.exists()) throw new Error("Dompet tidak ditemukan.");
                    
                    // 2. Loop semua item keranjang
                    const batchUpdates = [];
                    const productUpdates = [];
                    let totalHpp = 0;
                    for (const item of window.posCart) {
                        const prodRef = doc(db, 'products', item.id);
                        const prodDoc = await transaction.get(prodRef);
                        if (!prodDoc.exists() || prodDoc.data().stok_gudang < item.qty) {
                            throw new Error("Stok produk " + item.nama + " tidak cukup.");
                        }
                        
                        totalHpp += (prodDoc.data().last_hpp_satuan || prodDoc.data().harga_modal || 0) * item.qty;
                        
                        // Queue master stock deduction
                        productUpdates.push({ ref: prodRef, newStok: prodDoc.data().stok_gudang - item.qty });
                        
                        // Deduct batches FIFO
                        const batchQ = query(collection(db, 'stock_batches'), where('uid', '==', auth.currentUser.uid), where('product_id', '==', item.id), where('status', '==', 'active'));
                        const batchSnapRaw = await getDocs(batchQ);
                        let validBatches = [];
                        batchSnapRaw.forEach(b => validBatches.push(b));
                        validBatches.sort((a, b) => safeToMillis(a.data().tanggal_produksi) - safeToMillis(b.data().tanggal_produksi));
                        
                        let qtyToDeduct = item.qty;
                        for (let b of validBatches) {
                            if (qtyToDeduct <= 0) break;
                            const bDoc = await transaction.get(b.ref);
                            const currentSisa = bDoc.data().qty_sisa;
                            
                            if (currentSisa > 0) {
                                if (currentSisa >= qtyToDeduct) {
                                    batchUpdates.push({ ref: b.ref, sisa: currentSisa - qtyToDeduct });
                                    qtyToDeduct = 0;
                                } else {
                                    batchUpdates.push({ ref: b.ref, sisa: 0 });
                                    qtyToDeduct -= currentSisa;
                                }
                            }
                        }
                        if (qtyToDeduct > 0) throw new Error("Batch stok FIFO tidak sinkron untuk " + item.nama);
                    }
                    
                    // 2.5 Apply All Writes (After All Reads)
                    productUpdates.forEach(p => transaction.update(p.ref, { stok_gudang: p.newStok }));
                    batchUpdates.forEach(u => transaction.update(u.ref, { qty_sisa: u.sisa, status: u.sisa === 0 ? 'depleted' : 'active' }));
                    
                    // 3. Tambahkan saldo dompet
                    transaction.update(walletRef, { saldo_terkini: walletDoc.data().saldo_terkini + total });
                    
                    // 4. Catat transaksi masuk
                    const txRef = doc(collection(db, 'transactions'));
                    transaction.set(txRef, {
                        uid: auth.currentUser.uid,
                        tipe_tx: 'in',
                        nominal: total,
                        kategori: 'Penjualan Kasir POS',
                        dompet_id: walletId,
                        tanggal: Timestamp.now(),
                        catatan: `POS: ${window.posCart.length} item`
                    });

                    // 5. Catat transaksi HPP (Perpetual Inventory)
                    if (totalHpp > 0) {
                        const txHppRef = doc(collection(db, 'transactions'));
                        transaction.set(txHppRef, {
                            uid: auth.currentUser.uid,
                            tipe_tx: 'out',
                            nominal: totalHpp,
                            kategori: 'Beban HPP',
                            dompet_id: 'persediaan',
                            tanggal: Timestamp.now(),
                            catatan: `HPP POS: ${window.posCart.length} item`
                        });
                    }
                });
                
                closeModal(document.getElementById('modal-pos-checkout'));
                document.getElementById('form-pos-checkout').reset();
                window.posCart = [];
                loadPOSPage(auth.currentUser.uid); // Refresh products
                
                alert("Pembayaran Berhasil! Kembalian: " + formatRupiah(cash - total));
                
            } catch (err) {
                console.error("Error Checkout POS:", err);
                alert(err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<span class="material-symbols-outlined">point_of_sale</span> Selesaikan Transaksi`;
            }
        }
    });


    // Mobile Bottom Nav Listeners
    document.getElementById('nav-home')?.addEventListener('click', () => MapsTo('dashboard'));
    document.getElementById('nav-transactions')?.addEventListener('click', () => MapsTo('transactions'));
    document.getElementById('nav-pos')?.addEventListener('click', () => openModal(modalPilihAksi));
    document.getElementById('nav-partners')?.addEventListener('click', () => MapsTo('partners'));
    document.getElementById('nav-profile')?.addEventListener('click', () => MapsTo('profile'));

    // Desktop Top Nav Listeners
    document.getElementById('top-nav-home')?.addEventListener('click', () => MapsTo('dashboard'));
    document.getElementById('top-nav-transactions')?.addEventListener('click', () => MapsTo('transactions'));
    document.getElementById('top-nav-pos')?.addEventListener('click', () => openModal(modalPilihAksi));
    document.getElementById('top-nav-partners')?.addEventListener('click', () => MapsTo('partners'));
    document.getElementById('top-nav-reports')?.addEventListener('click', () => MapsTo('reports'));
    document.getElementById('top-nav-profile')?.addEventListener('click', () => MapsTo('profile'));

    // Auth navigation and form handling
    document.addEventListener('click', async (e) => {
        if (e.target.id === 'link-signup') {
            e.preventDefault();
            MapsTo('signup');
        }
        if (e.target.id === 'link-signin') {
            e.preventDefault();
            MapsTo('signin');
        }
        
        if (e.target.id === 'signin-type-email') {
            e.preventDefault();
            document.getElementById('signin-method').value = 'email';
            document.getElementById('signin-email-container').classList.remove('hidden');
            document.getElementById('signin-phone-container').classList.add('hidden');
            
            e.target.className = "signin-tab-btn flex-1 py-2 text-xs bg-white text-primary font-bold shadow-sm rounded-xl text-center transition-all";
            document.getElementById('signin-type-phone').className = "signin-tab-btn flex-1 py-2 text-xs text-on-surface-variant font-medium text-center rounded-xl transition-all";
        }
        if (e.target.id === 'signin-type-phone') {
            e.preventDefault();
            document.getElementById('signin-method').value = 'phone';
            document.getElementById('signin-phone-container').classList.remove('hidden');
            document.getElementById('signin-email-container').classList.add('hidden');
            
            e.target.className = "signin-tab-btn flex-1 py-2 text-xs bg-white text-primary font-bold shadow-sm rounded-xl text-center transition-all";
            document.getElementById('signin-type-email').className = "signin-tab-btn flex-1 py-2 text-xs text-on-surface-variant font-medium text-center rounded-xl transition-all";
        }
        if (e.target.id === 'signup-type-email') {
            e.preventDefault();
            document.getElementById('signup-method').value = 'email';
            document.getElementById('signup-email-container').classList.remove('hidden');
            document.getElementById('signup-phone-container').classList.add('hidden');
            
            e.target.className = "signup-tab-btn flex-1 py-2 text-xs bg-white text-primary font-bold shadow-sm rounded-xl text-center transition-all";
            document.getElementById('signup-type-phone').className = "signup-tab-btn flex-1 py-2 text-xs text-on-surface-variant font-medium text-center rounded-xl transition-all";
        }
        if (e.target.id === 'signup-type-phone') {
            e.preventDefault();
            document.getElementById('signup-method').value = 'phone';
            document.getElementById('signup-phone-container').classList.remove('hidden');
            document.getElementById('signup-email-container').classList.add('hidden');
            
            e.target.className = "signup-tab-btn flex-1 py-2 text-xs bg-white text-primary font-bold shadow-sm rounded-xl text-center transition-all";
            document.getElementById('signup-type-email').className = "signup-tab-btn flex-1 py-2 text-xs text-on-surface-variant font-medium text-center rounded-xl transition-all";
        }
        
        if (e.target.closest('#btn-google-signin') || e.target.closest('#btn-google-signup')) {
            e.preventDefault();
            const googleBtn = e.target.closest('#btn-google-signin') || e.target.closest('#btn-google-signup');
            const originalHTML = googleBtn.innerHTML;
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> <span class="text-sm font-semibold text-on-surface">Menghubungkan...</span>';
            
            try {
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
                
                let result = null;
                try {
                    result = await signInWithPopup(auth, provider);
                } catch (popupErr) {
                    // If popup blocked or failed, fall back to redirect
                    if (popupErr.code === 'auth/popup-blocked' || 
                        popupErr.code === 'auth/popup-closed-by-user' ||
                        popupErr.code === 'auth/cancelled-popup-request') {
                        console.warn('Popup blocked/closed, falling back to redirect...');
                        await signInWithRedirect(auth, provider);
                        return; // Page will redirect, no further processing
                    }
                    throw popupErr;
                }
                
                if (result && result.user) {
                    await handleGoogleUserProfile(result.user);
                }
            } catch (err) {
                console.error("Login Google error:", err);
                let msg = err.message || String(err);
                if (err.code === 'auth/account-exists-with-different-credential') {
                    msg = 'Akun dengan email ini sudah terdaftar menggunakan metode lain. Silakan masuk dengan email/password.';
                } else if (err.code === 'auth/network-request-failed') {
                    msg = 'Koneksi jaringan bermasalah. Periksa internet Anda dan coba lagi.';
                } else if (err.code === 'auth/internal-error') {
                    msg = 'Terjadi kesalahan internal. Silakan coba lagi.';
                }
                alert('Login Google gagal: ' + msg);
            } finally {
                if (googleBtn) {
                    googleBtn.disabled = false;
                    googleBtn.innerHTML = originalHTML;
                }
            }
        }

        if (e.target.closest('#btn-forgot-password')) {
            e.preventDefault();
            const emailInput = document.getElementById('signin-email')?.value || '';
            
            // Create a premium forgot password modal
            const existingModal = document.getElementById('modal-forgot-password');
            if (existingModal) existingModal.remove();
            
            const fpModal = document.createElement('div');
            fpModal.id = 'modal-forgot-password';
            fpModal.className = 'fixed inset-0 z-[110] bg-[#0f172a]/30 backdrop-blur-md flex items-center justify-center opacity-0 transition-opacity duration-300 p-4';
            fpModal.innerHTML = `
                <div class="bg-surface w-full max-w-[380px] rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.15)] transform scale-95 transition-all duration-300 overflow-hidden" id="fp-content">
                    <div class="p-6 text-center">
                        <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                            <span class="material-symbols-outlined text-[32px]">lock_reset</span>
                        </div>
                        <h3 class="font-heading font-bold text-lg text-on-surface mb-2">Lupa Password?</h3>
                        <p class="text-sm text-on-surface-variant leading-relaxed mb-5">Masukkan email Anda, kami akan mengirimkan link untuk mengatur ulang kata sandi.</p>
                        <div class="relative flex items-center input-glow rounded-[20px] border border-outline-variant/50 bg-surface-container-low transition-all duration-200 mb-2">
                            <span class="material-symbols-outlined absolute left-4 text-outline-variant pointer-events-none">mail</span>
                            <input class="w-full h-14 pl-12 pr-4 bg-transparent border-none rounded-[20px] text-sm text-on-surface focus:ring-0 outline-none" id="fp-email-input" placeholder="contoh@email.com" type="email" value="${emailInput}">
                        </div>
                        <p id="fp-status" class="text-xs text-on-surface-variant mt-2 hidden"></p>
                    </div>
                    <div class="flex gap-3 p-5 pt-0">
                        <button id="fp-btn-cancel" class="flex-1 py-3 text-sm font-bold text-on-surface-variant bg-surface-container-low hover:bg-surface-container rounded-2xl transition-colors active:scale-95">Batal</button>
                        <button id="fp-btn-send" class="flex-1 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-2xl shadow-md shadow-primary/30 transition-colors active:scale-95 flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-[18px]">send</span> Kirim
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(fpModal);
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    fpModal.classList.remove('opacity-0');
                    fpModal.querySelector('#fp-content').classList.remove('scale-95');
                    fpModal.querySelector('#fp-content').classList.add('scale-100');
                    fpModal.querySelector('#fp-email-input').focus();
                });
            });
            
            const closeFP = () => {
                fpModal.classList.add('opacity-0');
                fpModal.querySelector('#fp-content')?.classList.remove('scale-100');
                fpModal.querySelector('#fp-content')?.classList.add('scale-95');
                setTimeout(() => fpModal.remove(), 300);
            };
            
            fpModal.querySelector('#fp-btn-cancel').onclick = closeFP;
            fpModal.onclick = (ev) => { if (ev.target === fpModal) closeFP(); };
            
            fpModal.querySelector('#fp-btn-send').onclick = async () => {
                const email = fpModal.querySelector('#fp-email-input').value.trim();
                if (!email) {
                    fpModal.querySelector('#fp-status').textContent = 'Silakan masukkan alamat email.';
                    fpModal.querySelector('#fp-status').className = 'text-xs text-error mt-2';
                    return;
                }
                const sendBtn = fpModal.querySelector('#fp-btn-send');
                sendBtn.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>';
                sendBtn.disabled = true;
                
                try {
                    // Firebase dynamic import removed
                    await sendPasswordResetEmail(auth, email);
                    fpModal.querySelector('#fp-status').textContent = '✅ Link reset telah dikirim! Cek email Anda (termasuk folder spam).';
                    fpModal.querySelector('#fp-status').className = 'text-xs text-success-green mt-2 font-semibold';
                    fpModal.querySelector('#fp-status').classList.remove('hidden');
                    sendBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> Terkirim!';
                    sendBtn.className = 'flex-1 py-3 text-sm font-bold text-white bg-success-green rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2';
                    setTimeout(closeFP, 2500);
                } catch (err) {
                    fpModal.querySelector('#fp-status').textContent = '❌ Gagal: ' + (err.code === 'auth/user-not-found' ? 'Email tidak terdaftar.' : err.message);
                    fpModal.querySelector('#fp-status').className = 'text-xs text-error mt-2 font-semibold';
                    fpModal.querySelector('#fp-status').classList.remove('hidden');
                    sendBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">send</span> Kirim';
                    sendBtn.disabled = false;
                }
            };
        }
    });

    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'signin-form') {
            e.preventDefault();
            const method = document.getElementById('signin-method')?.value || 'email';
            let email = '';
            if (method === 'phone') {
                const phoneVal = (document.getElementById('signin-phone')?.value || '').trim();
                if (!phoneVal) {
                    alert("Nomor HP wajib diisi!");
                    return;
                }
                email = phoneVal + "@fintra.com";
            } else {
                email = (document.getElementById('signin-email')?.value || '').trim();
            }
            const password = (document.getElementById('signin-password')?.value || '').trim();
            
            if (!email) {
                alert("Alamat email atau nomor HP wajib diisi!");
                return;
            }
            if (!password) {
                alert("Password wajib diisi!");
                return;
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Memproses...';
            }
            try {
                
const authRes = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: email, password: password })
});
localStorage.setItem('finmo_token', authRes.token);
auth.currentUser = authRes.user;
MapsTo('dashboard');

            } catch (err) {
                console.error("Sign In error:", err);
                let msg = err.message;
                if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                    msg = "Email / Nomor HP atau password salah. Silakan periksa kembali data Anda.";
                } else if (err.code === 'auth/invalid-email') {
                    msg = "Format alamat email tidak valid!";
                } else if (err.code === 'auth/too-many-requests') {
                    msg = "Terlalu banyak percobaan masuk yang gagal. Silakan coba beberapa saat lagi.";
                }
                alert("Login gagal: " + msg);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `Sign In <span class="material-symbols-outlined text-[16px]">arrow_forward</span>`;
                }
            }
        }
        
        if (e.target.id === 'signup-form') {
            e.preventDefault();
            const method = document.getElementById('signup-method')?.value || 'email';
            let email = '';
            if (method === 'phone') {
                const phoneVal = (document.getElementById('signup-phone')?.value || '').trim();
                if (!phoneVal) {
                    alert("Nomor HP wajib diisi!");
                    return;
                }
                email = phoneVal + "@fintra.com";
            } else {
                email = (document.getElementById('signup-email')?.value || '').trim();
            }

            if (!email) {
                alert("Alamat email wajib diisi!");
                return;
            }

            const password = document.getElementById('signup-password')?.value || '';
            const confirmPassword = document.getElementById('signup-confirm')?.value || '';
            
            if (!password || password.length < 6) {
                alert("Password minimal 6 karakter!");
                return;
            }
            if (password !== confirmPassword) {
                alert("Password dan konfirmasi password tidak cocok!");
                return;
            }

            const termsChecked = document.getElementById('terms')?.checked;
            if (!termsChecked) {
                alert("Anda harus menyetujui Syarat dan Ketentuan!");
                return;
            }

            const name = (document.getElementById('signup-name')?.value || '').trim() || 'Nama Bisnis';
            const owner = (document.getElementById('signup-owner')?.value || '').trim() || 'Pemilik';
            const businessType = document.getElementById('signup-business-type')?.value || '';
            const startPeriod = document.getElementById('signup-start-period')?.value || '';
            const accountingPeriod = document.getElementById('signup-accounting-period')?.value || '';

            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Mendaftarkan...';
            }

            try {
                // Check if email already exists in Firestore database
                const existingUserQuery = query(collection(db, 'users'), where('email', '==', email));
                const existingUserSnap = await getDocs(existingUserQuery);
                if (!existingUserSnap.empty) {
                    throw { code: 'auth/email-already-in-use', message: 'Email tersebut tidak bisa dipakai karena sudah digunakan sebelumnya.' };
                }

                
const authRes = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
        email: email,
        phone: method === 'phone' ? (document.getElementById('signup-phone')?.value || '').trim() : '',
        password: password,
        name: owner,
        businessName: name
    })
});
localStorage.setItem('finmo_token', authRes.token);
auth.currentUser = authRes.user;
alert("Pendaftaran berhasil! Selamat datang di finMo.");

                MapsTo('dashboard');

            } catch (err) {
                console.error("Sign up error:", err);
                let msg = err.message || err;
                if (err.code === 'auth/email-already-in-use') {
                    msg = "Email/Nomor HP tersebut tidak bisa dipakai karena sudah digunakan sebelumnya. Silakan gunakan email lain atau masuk dengan akun Anda.";
                } else if (err.code === 'auth/weak-password') {
                    msg = "Password terlalu lemah! Gunakan minimal 6 karakter.";
                } else if (err.code === 'auth/invalid-email') {
                    msg = "Format alamat email tidak valid!";
                }
                alert(msg);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `Daftar Akun Baru <span class="material-symbols-outlined text-[16px]">arrow_forward</span>`;
                }
            }
        }
    });

    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.page) {
            MapsTo(event.state.page, false);
        } else {
            const hashPage = window.location.hash.replace('#', '');
            if (hashPage && auth.currentUser) {
                MapsTo(hashPage, false);
            } else if (!auth.currentUser && hashPage !== 'signup') {
                MapsTo('signin', false);
            }
        }
    });

    // Handle Google redirect result on page load
    getRedirectResult(auth).then(async (result) => {
        if (result && result.user) {
            console.log('Google redirect sign-in successful:', result.user.email);
            await handleGoogleUserProfile(result.user);
        }
    }).catch((err) => {
        if (err.code && err.code !== 'auth/popup-closed-by-user') {
            console.error('Redirect result error:', err);
            alert('Login Google gagal: ' + (err.message || err));
        }
    });

    
checkAuthSession().then((user) => {
    const hashPage = window.location.hash.replace('#', '');
    if (user) {
        if (hashPage === 'signin' || hashPage === 'signup' || hashPage === 'hello' || !hashPage) {
            MapsTo('dashboard', false);
        } else {
            MapsTo(hashPage, false);
        }
    } else {
        if (hashPage === 'signup') {
            MapsTo('signup', false);
        } else if (hashPage === 'hello') {
            MapsTo('hello', false);
        } else {
            MapsTo('signin', false);
        }
    }
});
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// --- POS & PARTNERS FUNCTIONS ---
window.posCart = [];
window.posProducts = [];

export async function loadPOSPage(uid) {
    try {
        const prodRes = await apiFetch('/api/products');
        window.posProducts = prodRes.data || [];
        renderPosProducts(window.posProducts);
        
        const searchInput = document.getElementById('pos-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase();
                const filtered = window.posProducts.filter(p => 
                    (p.nama || p.nama_produk || '').toLowerCase().includes(val) || 
                    (p.sku && p.sku.toLowerCase().includes(val)) ||
                    (p.barcode && p.barcode.toLowerCase().includes(val))
                );
                renderPosProducts(filtered);
            });
            
            // Handle barcode scanner 'Enter' key press
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.target.value;
                    const matchedProduct = window.posProducts.find(p => p.barcode === val || p.sku === val);
                    if (matchedProduct) {
                        window.addToPosCart(matchedProduct.id);
                        e.target.value = ''; // clear input after scan
                        renderPosProducts(window.posProducts); // reset grid
                    } else if (val.trim() !== '') {
                        alert('Produk tidak ditemukan!');
                        e.target.select();
                    }
                }
            });
        }

        // Scanner Dropdown Logic
        const btnMenu = document.getElementById('btn-pos-scanner-menu');
        const dropdown = document.getElementById('dropdown-pos-scanner');
        if (btnMenu && dropdown) {
            btnMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
                setTimeout(() => dropdown.classList.toggle('opacity-0'), 10);
            });
            
            document.addEventListener('click', (e) => {
                if (!btnMenu.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add('opacity-0');
                    setTimeout(() => dropdown.classList.add('hidden'), 300);
                }
            });
            
            document.getElementById('btn-scan-kamera')?.addEventListener('click', () => {
                dropdown.classList.add('opacity-0');
                setTimeout(() => dropdown.classList.add('hidden'), 300);
                window.openScannerModal();
            });
            
            document.getElementById('btn-scan-alat')?.addEventListener('click', () => {
                dropdown.classList.add('opacity-0');
                setTimeout(() => dropdown.classList.add('hidden'), 300);
                if (searchInput) {
                    searchInput.focus();
                    alert('Siap scan! Silakan arahkan scanner barcode ke produk.');
                }
            });
        }
    } catch(e) {
        console.error(e);
        document.getElementById('pos-product-grid').innerHTML = '<div class="col-span-full text-center text-red-500">Gagal memuat produk.</div>';
    }

    window.renderPosProducts = function(products) {
        const grid = document.getElementById('pos-product-grid');
        if (!grid) return;
        if (products.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-on-surface-variant py-8">Tidak ada produk.</div>';
            return;
        }
        let html = '';
        products.forEach(p => {
            let photoHtml = p.foto_url 
                ? `<img src="${p.foto_url}" class="w-full h-full object-cover" alt="${p.nama || p.nama_produk || ''}">`
                : `<span class="material-symbols-outlined text-[40px]">inventory_2</span>`;
                
            html += `
            <div class="bg-white rounded-[20px] shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col relative group cursor-pointer active:scale-95 transition-transform" onclick="addToPosCart('${p.id}')">
                ${p.stok_gudang <= 0 ? `
                <div class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <span class="bg-error text-white font-label-md px-3 py-1 rounded-full rotate-[-12deg] shadow-lg text-xs font-bold">HABIS</span>
                </div>
                ` : ''}
                <div class="h-32 w-full bg-surface-container-low flex items-center justify-center overflow-hidden relative">
                    ${photoHtml}
                </div>
                <div class="p-4 flex flex-col flex-1 justify-between">
                    <div>
                        <h3 class="font-label-md text-on-surface line-clamp-2 mb-1 text-sm font-semibold">${p.nama || p.nama_produk || ''}</h3>
                        <p class="font-label-md text-primary font-bold text-sm">${formatRupiah(p.harga_jual || p.last_harga_jual || 0)}</p>
                    </div>
                    <p class="font-label-sm text-on-surface-variant mt-2 text-xs">Stok: ${p.stok_gudang || 0} ${p.satuan || ''}</p>
                </div>
            </div>
            `;
        });
        grid.innerHTML = html;
    };

    window.openTxCategoryFullModal = function(type) {
        const modal = document.getElementById('modal-lainnya');
        if (!modal) return;
        const ul = document.getElementById('lainnya-list');
        const search = document.getElementById('search-lainnya');
        const title = document.getElementById('lainnya-title');
        
        // Inject the + button into the header if it doesn't exist
        const header = modal.querySelector('div.flex.justify-between') || modal.querySelector('h3')?.parentElement;
        let btnContainer = document.getElementById('tx-cat-lainnya-actions');
        if (!btnContainer && header) {
            btnContainer = document.createElement('div');
            btnContainer.id = 'tx-cat-lainnya-actions';
            btnContainer.className = 'flex items-center gap-2';
            
            const btnAdd = document.createElement('button');
            btnAdd.type = 'button';
            btnAdd.className = 'text-primary font-bold text-xs flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-colors active:scale-95';
            btnAdd.innerHTML = '<span class="material-symbols-outlined text-[16px]">add</span> <span>Tambah Kategori</span>';
            
            const closeBtn = document.getElementById('close-modal-lainnya');
            if (closeBtn) {
                header.insertBefore(btnContainer, closeBtn);
                btnContainer.appendChild(btnAdd);
                btnContainer.appendChild(closeBtn);
            }
        }
        
        const addBtn = btnContainer ? btnContainer.querySelector('button') : null;
        if (addBtn) {
            addBtn.style.display = 'flex';
            addBtn.onclick = (e) => {
                if (e) e.stopPropagation();
                window.showInputPrompt('Kategori Baru', 'Contoh: Hadiah', async (newCat) => {
                    if(newCat && newCat.trim() !== '') {
                        try {
                            await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify({ nama: newCat.trim(), type: 'tx_category' }) });
                            await window.populateTxCategoryDropdown(type);
                            
                            document.getElementById('tx-category').value = newCat.trim();
                            const selector = document.getElementById('tx-category-selector');
                            if(selector) selector.value = newCat.trim();
                            window.closeModal(modal);
                        } catch(err) {
                            alert('Gagal menambah kategori: ' + err.message);
                        }
                    }
                });
            };
        }
        
        if (title) title.textContent = 'Pilih Kategori';
        if (ul) ul.innerHTML = '';
        if (search) search.value = '';
        
        const items = window.txCategoryListCache || [];
        const renderList = (filter = '') => {
            if (!ul) return;
            ul.innerHTML = '';
            const filtered = items.filter(item => item.toLowerCase().includes(filter.toLowerCase()));
            if (filtered.length === 0) {
                const emptyLi = document.createElement('li');
                emptyLi.className = 'p-4 text-center text-xs text-on-surface-variant/70 italic';
                emptyLi.textContent = 'Kategori tidak ditemukan';
                ul.appendChild(emptyLi);
            } else {
                filtered.forEach(item => {
                    const icon = window.getCategoryIcon(item);
                    const li = document.createElement('li');
                    li.className = 'flex items-center justify-between p-3 px-4 bg-surface-container-lowest rounded-xl mb-2 border border-outline-variant/30 active:scale-[0.98] transition-all text-on-surface font-semibold text-sm cursor-pointer hover:bg-slate-100/90 group';
                    li.innerHTML = `
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">${icon}</span>
                            <span class="font-medium text-sm text-on-surface group-hover:text-primary transition-colors">${item}</span>
                        </div>
                        <span class="material-symbols-outlined text-[18px] text-on-surface-variant/40 group-hover:text-primary transition-colors">chevron_right</span>
                    `;
                    li.onclick = () => {
                        document.getElementById('tx-category').value = item;
                        const selector = document.getElementById('tx-category-selector');
                        if(selector) selector.value = item;
                        window.closeModal(modal);
                    };
                    ul.appendChild(li);
                });
            }
        };
        
        renderList();
        if (search) search.oninput = (e) => renderList(e.target.value);
        
        const closeBtn = document.getElementById('close-modal-lainnya');
        if (closeBtn) {
            emptyLi.className = 'p-4 text-center text-xs text-on-surface-variant/70 italic';
            emptyLi.textContent = 'Kategori tidak ditemukan';
            ul.appendChild(emptyLi);
        } else {
            filtered.forEach(item => {
                const icon = window.getCategoryIcon(item);
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between p-3 px-4 bg-surface-container-lowest rounded-xl mb-2 border border-outline-variant/30 active:scale-[0.98] transition-all text-on-surface font-semibold text-sm cursor-pointer hover:bg-slate-100/90 group';
                li.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">${icon}</span>
                        <span class="font-medium text-sm text-on-surface group-hover:text-primary transition-colors">${item}</span>
                    </div>
                    <span class="material-symbols-outlined text-[18px] text-on-surface-variant/40 group-hover:text-primary transition-colors">chevron_right</span>
                `;
                li.onclick = () => {
                    document.getElementById('tx-category').value = item;
                    const selector = document.getElementById('tx-category-selector');
                    if(selector) selector.value = item;
                    window.closeModal(modal);
                };
                ul.appendChild(li);
            });
        }
    };
    
    renderList();
    if (search) search.oninput = (e) => renderList(e.target.value);
    
    const closeBtn = document.getElementById('close-modal-lainnya');
    if (closeBtn) {
        closeBtn.onclick = () => {
            window.closeModal(modal);
        };
    }
    
    window.openModal(modal);
};

window.getCategoryIcon = function(catName) {
    const name = (catName || '').toLowerCase();
    if (name.includes('jual') || name.includes('penjualan')) return 'shopping_bag';
    if (name.includes('jasa')) return 'handyman';
    if (name.includes('gaji') || name.includes('karyawan')) return 'group';
    if (name.includes('sewa')) return 'domain';
    if (name.includes('listrik') || name.includes('air') || name.includes('utilitas')) return 'bolt';
    if (name.includes('bahan')) return 'inventory_2';
    if (name.includes('perlengkapan')) return 'build';
    if (name.includes('transp') || name.includes('bensin') || name.includes('kendaraan')) return 'directions_car';
    if (name.includes('makan') || name.includes('minum') || name.includes('kuliner')) return 'restaurant';
    if (name.includes('market') || name.includes('iklan') || name.includes('promosi')) return 'campaign';
    if (name.includes('modal')) return 'account_balance';
    if (name.includes('pendapatan')) return 'payments';
    if (name.includes('transfer')) return 'swap_horiz';
    if (name.includes('apparel') || name.includes('baju') || name.includes('pakaian')) return 'styler';
    if (name.includes('aksesoris') || name.includes('accessory')) return 'diamond';
    if (name.includes('art') || name.includes('seni')) return 'palette';
    if (name.includes('beauty') || name.includes('kosmetik')) return 'dry_cleaning';
    if (name.includes('buku') || name.includes('book')) return 'book';
    if (name.includes('komputer') || name.includes('computer')) return 'computer';
    if (name.includes('elektronik') || name.includes('gadget')) return 'smartphone';
    if (name.includes('furniture') || name.includes('mebel')) return 'chair';
    if (name.includes('jewelry') || name.includes('perhiasan')) return 'auto_awesome';
    if (name.includes('kitchen') || name.includes('dapur')) return 'skillet';
    return 'category';
};

window.renderTxCategoryDropdownList = function(items, type, searchTerm = '') {
    const list = document.getElementById('tx-category-list');
    if (!list) return;
    list.innerHTML = '';
    
    let filtered = items;
    if (searchTerm && searchTerm.trim() !== '') {
        filtered = items.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase().trim()));
    }
    
    const maxItems = 5;
    const isSearching = searchTerm && searchTerm.trim() !== '';
    const displayItems = isSearching ? filtered : filtered.slice(0, maxItems);
    
    if (displayItems.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'p-3 text-center text-xs text-on-surface-variant/70 italic';
        emptyDiv.textContent = 'Kategori tidak ditemukan';
        list.appendChild(emptyDiv);
    } else {
        displayItems.forEach(item => {
            const icon = window.getCategoryIcon(item);
            const div = document.createElement('div');
            div.className = 'tx-cat-dropdown-item flex items-center justify-between p-2.5 px-3 hover:bg-slate-100/90 rounded-xl cursor-pointer transition-all text-on-surface group active:scale-[0.99]';
            div.setAttribute('data-value', item);
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">${icon}</span>
                    <span class="font-medium text-sm text-on-surface group-hover:text-primary transition-colors">${item}</span>
                </div>
            `;
            list.appendChild(div);
        });
    }
    
    if (!isSearching) {
        const lainDiv = document.createElement('div');
        lainDiv.className = 'tx-cat-dropdown-item-lainnya flex items-center justify-between p-2.5 px-3 hover:bg-primary/5 rounded-xl cursor-pointer transition-all text-primary font-semibold text-sm border-t border-slate-100/80 mt-1 pt-2 active:scale-[0.99]';
        let remaining = items.length > maxItems ? items.length - maxItems : 0;
        lainDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[20px] text-primary">more_horiz</span>
                <span>Lainnya...</span>
            </div>
            <span class="text-xs font-normal text-on-surface-variant/60">${remaining > 0 ? `${remaining} lagi` : ''}</span>
        `;
        lainDiv.onclick = (e) => {
             e.stopPropagation();
             document.getElementById('tx-category-dropdown').classList.add('hidden');
             document.getElementById('tx-category-dropdown').classList.remove('flex');
             const txIcon = document.getElementById('tx-category-icon');
             if (txIcon) txIcon.classList.remove('rotate-180');
             
             window.openTxCategoryFullModal(type);
        };
        list.appendChild(lainDiv);
    }
};

window.populateTxCategoryDropdown = async function(type) {
    if (!auth.currentUser) return;
    const hiddenInput = document.getElementById('tx-category');
    if (!hiddenInput) return;
    
    let defaultItems = [];
    if(type === 'in') {
        defaultItems = ['Penjualan', 'Jasa', 'Pendapatan Lain', 'Modal'];
    } else if(type === 'out') {
        defaultItems = ['Bahan Baku', 'Gaji Karyawan', 'Sewa', 'Listrik & Air', 'Perlengkapan', 'Transportasi', 'Makanan', 'Marketing', 'Lainnya'];
    } else {
        defaultItems = ['Transfer'];
    }
    
    const wrapper = document.getElementById('tx-category-wrapper');
    if (type === 'transfer') {
        if(wrapper) wrapper.style.display = 'none';
        hiddenInput.value = 'Transfer';
        return;
    } else {
        if(wrapper) wrapper.style.display = 'block';
    }
    
    try {
        // Firebase dynamic import removed
        const q = query(collection(db, 'tx_categories'), where('uid', '==', auth.currentUser.uid), where('type', '==', type));
        
const prodRes = await apiFetch('/api/products');
window.posProducts = prodRes.data || [];

        
        const allItems = [...new Set([...defaultItems, ...customItems])];
        window.txCategoryListCache = allItems;
        window.txCategoryTypeCache = type;
        
        window.renderTxCategoryDropdownList(allItems, type);
        
        hiddenInput.value = '';
        const selector = document.getElementById('tx-category-selector');
        if (selector) selector.value = '';
        
    } catch(e) {
        console.error(e);
    }
};

window.populateUnitDropdown = async function() {
    if (!auth.currentUser) return;
    const select = document.getElementById('prod-unit');
    if (!select) return;
    
    try {
        // Firebase dynamic import removed
        const q = query(collection(db, 'product_units'), where('uid', '==', auth.currentUser.uid));
        
const prodRes = await apiFetch('/api/products');
window.posProducts = prodRes.data || [];

        
        if (items.length === 0) {
            items = ['Pcs', 'Kg', 'Gram', 'Liter', 'Pack', 'Box', 'Botol', 'Porsi', 'Piring', 'Cup', 'Buah'];
        }
        
        const onAddUnit = (selectEl) => {
            window.showInputPrompt("Unit Produk Baru", "Nama unit...", async (val) => {
                if (val) {
                    const newOpt = document.createElement('option');
                    newOpt.value = val;
                    newOpt.textContent = val;
                    const tambahOpt = selectEl.querySelector('option[value="__TAMBAH_BARU__"]');
                    if (tambahOpt) {
                        selectEl.insertBefore(newOpt, tambahOpt);
                    } else {
                        selectEl.appendChild(newOpt);
                    }
                    selectEl.value = val;
                    try {
                        // Firebase dynamic import removed
                        
await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify({ nama: val, type: 'product_unit' }) });

                    } catch(err) { console.error("Error saving unit", err); }
                }
            });
        };
        
        if (window.populateSelect) {
            window.populateSelect(select, items, 'Pilih Unit...', (item) => ({
                value: item,
                label: item
            }), onAddUnit);
        } else {
            let html = '<option value="">Pilih Unit...</option>';
            items.forEach(item => {
                html += `<option value="${item}">${item}</option>`;
            });
            html += `<option value="__TAMBAH_BARU__">+ Tambah Baru</option>`;
            select.innerHTML = html;
            select._onTambahBaru = onAddUnit;
        }
    } catch(e) {
        console.error(e);
    }
};

window.html5QrcodeScanner = null;

window.startScanner = function(targetElementId, onScanSuccess) {
    if (!window.html5QrcodeScanner) {
        window.html5QrcodeScanner = new Html5QrcodeScanner(targetElementId, { fps: 10, qrbox: {width: 250, height: 250} }, false);
    }
    window.html5QrcodeScanner.render((decodedText) => {
        if(onScanSuccess) onScanSuccess(decodedText);
    }, (error) => {
        // handle scan error
    });
};

window.stopScanner = function() {
    if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.clear().catch(e => console.error(e));
        window.html5QrcodeScanner = null;
    }
};

document.addEventListener('click', (e) => {
    // Tambah Kategori
    if (e.target.closest('#btn-tambah-kategori')) {
        window.openModal(document.getElementById('modal-tambah-kategori'));
    }
    if (e.target.closest('#close-tambah-kategori')) {
        window.closeModal(document.getElementById('modal-tambah-kategori'));
    }

    // Tambah Unit
    if (e.target.closest('#btn-tambah-unit')) {
        window.openModal(document.getElementById('modal-tambah-unit'));
    }
    if (e.target.closest('#close-tambah-unit')) {
        window.closeModal(document.getElementById('modal-tambah-unit'));
    }
    
    // Scanner
    if (e.target.closest('#btn-scan-barcode')) {
        const scannerContainer = document.getElementById('scanner-container');
        scannerContainer.classList.remove('hidden');
        if(window.startScanner) {
            window.startScanner('reader', (text) => {
                document.getElementById('prod-barcode').value = text;
                if(window.stopScanner) window.stopScanner();
                scannerContainer.classList.add('hidden');
            });
        }
    }
    if (e.target.closest('#btn-close-scanner')) {
        if(window.stopScanner) window.stopScanner();
        document.getElementById('scanner-container').classList.add('hidden');
    }

    // Restock HPP Rows
    if (e.target.closest('#btn-add-hpp-row')) {
        const container = document.getElementById('hpp-rows-container');
        const row = document.createElement('div');
        row.className = 'flex gap-2 hpp-row';
        const optionsHtml = window.cachedRawMaterialsOptions || '<option value="">Pilih Bahan Baku...</option>';
        row.innerHTML = `
            <select class="hpp-raw-select w-2/3 bg-surface border border-outline-variant rounded-2xl p-2 text-sm focus:border-primary" required>
                ${optionsHtml}
            </select>
            <input type="number" step="0.01" min="0" class="hpp-raw-qty w-1/3 bg-surface border border-outline-variant rounded-2xl p-2 text-sm focus:border-primary" placeholder="Qty Pakai" required>
            <button type="button" class="btn-remove-hpp text-error p-2 hover:bg-error/10 rounded-2xl"><span class="material-symbols-outlined text-[18px]">delete</span></button>
        `;
        container.appendChild(row);
    }
    if (e.target.closest('.btn-remove-hpp')) {
        const row = e.target.closest('.hpp-row');
        if (row) {
            row.remove();
            calculateHppTotal();
        }
    }
});

// Format nominal in restock HPP rows and calculate total
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('hpp-raw-qty')) {
        calculateHppTotal();
        if (window.calculateRestockTotal) window.calculateRestockTotal();
    }
    if (e.target.id === 'restock-qty') {
        calculateHppTotal();
        if (window.calculateRestockTotal) window.calculateRestockTotal();
    }
});

function calculateHppTotal() {
    let total = 0;
    document.querySelectorAll('.hpp-row').forEach(row => {
        const select = row.querySelector('.hpp-raw-select');
        const qtyInput = row.querySelector('.hpp-raw-qty');
        const nomEl = row.querySelector('.hpp-nominal');

        if (select && qtyInput && select.value) {
            // New format: raw material select + qty
            const cost = parseFloat(select.options[select.selectedIndex].dataset.cost) || 0;
            const q = parseFloat(qtyInput.value) || 0;
            total += (cost * q);
        } else if (nomEl) {
            // Old format: manual text nominal
            const nomStr = nomEl.value.replace(/[^0-9]/g, '');
            total += nomStr ? parseInt(nomStr) : 0;
        }
    });
    
    const qtyInput = document.getElementById('restock-qty');
    const qty = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
    
    const hppTotalEl = document.getElementById('restock-total-hpp');
    const hppSatuanEl = document.getElementById('restock-hpp-satuan');
    const hppSatuanModalEl = document.getElementById('restock-hpp-satuan-modal'); // Assuming there's a text display for it
    
    if (hppTotalEl) hppTotalEl.textContent = formatRupiah(total);
    
    const satuan = qty > 0 ? Math.round(total / qty) : 0;
    if (hppSatuanEl) hppSatuanEl.textContent = formatRupiah(satuan);
    if (hppSatuanModalEl) hppSatuanModalEl.textContent = formatRupiah(satuan);
}

document.addEventListener('input', (e) => {
    if (e.target.id === 'restock-harga-jual') {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val) {
            e.target.value = parseInt(val).toLocaleString('id-ID');
        } else {
            e.target.value = '';
        }
    }
});

// Partners page button handlers
document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-tambah-mitra-page')) {
        document.getElementById('add-partner-id').value = '';
        document.getElementById('form-tambah-mitra').reset();
        document.getElementById('title-tambah-mitra').innerText = "Tambah Mitra Baru";
        document.getElementById('btn-delete-partner').classList.add('hidden');
        window.openModal(document.getElementById('modal-tambah-mitra'));
    }
    if (e.target.closest('#btn-distribusi-stok-page')) {
        window.openModal(document.getElementById('modal-distribusi-stok'));
        if (window.populateDistribusiDropdowns) window.populateDistribusiDropdowns();
    }
});

window.openScannerModal = function() {
    const modal = document.getElementById('modal-scanner');
    if (!modal) return;
    window.openModal(modal);
    window.startScanner('global-scanner-container', (decodedText) => {
        window.stopScanner();
        window.closeModal(modal);
        const posSearch = document.getElementById('pos-search');
        if (posSearch) {
            posSearch.value = decodedText;
            posSearch.dispatchEvent(new Event('input'));
            
            const matchedProduct = window.posProducts.find(p => p.barcode === decodedText || p.sku === decodedText);
            if (matchedProduct) {
                window.addToPosCart(matchedProduct.id);
                posSearch.value = '';
                window.renderPosProducts(window.posProducts);
            }
        }
    });
};

window.renderRestockDropdownList = function(products) {
    const list = document.getElementById('restock-product-list');
    if (!list) return;
    
    if (products.length === 0) {
        list.innerHTML = '<div class="p-3 text-sm text-center text-on-surface-variant">Tidak ada produk ditemukan.</div>';
        return;
    }
    
    let html = '';
    products.forEach(p => {
        const photoUrl = p.foto_url || '';
        const photoHtml = photoUrl ? `<img src="${photoUrl}" class="w-10 h-10 rounded-2xl object-cover flex-shrink-0 border border-outline-variant">` : `<div class="w-10 h-10 rounded-2xl bg-surface-variant flex items-center justify-center flex-shrink-0 border border-outline-variant"><span class="material-symbols-outlined text-on-surface-variant text-[20px]">image</span></div>`;
        
        html += `
        <div class="restock-dropdown-item flex items-center gap-3 p-2 hover:bg-surface-variant/50 rounded-2xl cursor-pointer transition-colors" data-id="${p.id}" data-name="${p.nama || p.nama_produk}" data-price="${p.harga_jual || p.last_harga_jual || 0}" data-stok="${p.stok_gudang}">
            ${photoHtml}
            <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-on-surface truncate">${p.nama || p.nama_produk}</div>
                <div class="text-xs text-on-surface-variant">Stok: ${p.stok_gudang} | ${p.kategori}</div>
            </div>
        </div>
        `;
    });
    list.innerHTML = html;
};

// Global click listener for custom dropdowns
document.addEventListener('click', (e) => {
    // ---- Restock Dropdown ----
    const wrapper = document.getElementById('restock-dropdown-wrapper');
    const selector = document.getElementById('restock-product-selector');
    const dropdown = document.getElementById('restock-product-dropdown');
    const icon = document.getElementById('restock-dropdown-icon');
    
    if (wrapper && selector && dropdown) {
        if (selector.contains(e.target)) {
            const isHidden = dropdown.classList.contains('hidden');
            if (isHidden) {
                dropdown.classList.remove('hidden');
                dropdown.classList.add('flex');
                if (icon) icon.classList.add('rotate-180');
                const searchInput = document.getElementById('restock-product-search');
                if (searchInput) searchInput.focus();
            } else {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('flex');
                if (icon) icon.classList.remove('rotate-180');
            }
        } 
        else if (e.target.closest('.restock-dropdown-item')) {
            const item = e.target.closest('.restock-dropdown-item');
            const id = item.getAttribute('data-id');
            const name = item.getAttribute('data-name');
            
            document.getElementById('restock-product-id').value = id;
            document.getElementById('restock-product-display').innerHTML = `<span class="text-on-surface font-semibold">${name}</span>`;
            
            dropdown.classList.add('hidden');
            dropdown.classList.remove('flex');
            if (icon) icon.classList.remove('rotate-180');
            
            document.getElementById('restock-product-id').dispatchEvent(new Event('change'));
        }
        else if (!wrapper.contains(e.target)) {
            dropdown.classList.add('hidden');
            dropdown.classList.remove('flex');
            if (icon) icon.classList.remove('rotate-180');
        }
    }

    // ---- TX Category Dropdown ----
    const txWrapper = document.getElementById('tx-category-wrapper');
    const txSelector = document.getElementById('tx-category-selector');
    const txDropdown = document.getElementById('tx-category-dropdown');
    const txIcon = document.getElementById('tx-category-icon');
    
    if (txWrapper && txSelector && txDropdown) {
        if (txSelector.contains(e.target)) {
            const isHidden = txDropdown.classList.contains('hidden');
            if (isHidden) {
                txDropdown.classList.remove('hidden');
                txDropdown.classList.add('flex');
                if (txIcon) txIcon.classList.add('rotate-180');
                const searchInput = document.getElementById('tx-category-search');
                if (searchInput) searchInput.focus();
            } else {
                txDropdown.classList.add('hidden');
                txDropdown.classList.remove('flex');
                if (txIcon) txIcon.classList.remove('rotate-180');
            }
        }
        else if (e.target.closest('.tx-cat-dropdown-item')) {
            const item = e.target.closest('.tx-cat-dropdown-item');
            const val = item.getAttribute('data-value');
            
            document.getElementById('tx-category').value = val;
            txSelector.value = val;
            
            txDropdown.classList.add('hidden');
            txDropdown.classList.remove('flex');
            if (txIcon) txIcon.classList.remove('rotate-180');
        }
        else if (e.target.closest('.tx-cat-dropdown-item-new')) {
            txDropdown.classList.add('hidden');
            txDropdown.classList.remove('flex');
            if (txIcon) txIcon.classList.remove('rotate-180');
            
            const type = e.target.closest('.tx-cat-dropdown-item-new').getAttribute('data-type');
            window.showInputPrompt('Kategori Baru', 'Contoh: Hadiah', async (newCat) => {
                if(newCat && newCat.trim() !== '') {
                    try {
                        // Firebase dynamic import removed
                        
await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify({ nama: val || 'Kategori Baru', type: 'tx_category' }) });

                        window.populateTxCategoryDropdown(type).then(() => {
                            document.getElementById('tx-category').value = newCat.trim();
                            document.getElementById('tx-category-selector').value = newCat.trim();
                        });
                    } catch(err) {
                        alert('Gagal menambah kategori: ' + err.message);
                    }
                }
            });
        }
        else if (!txWrapper.contains(e.target)) {
            txDropdown.classList.add('hidden');
            txDropdown.classList.remove('flex');
            if (txIcon) txIcon.classList.remove('rotate-180');
        }
    }
});

document.addEventListener('input', (e) => {
    if (e.target.id === 'restock-product-search') {
        const val = e.target.value.toLowerCase();
        if (window.restockProductsList) {
            const filtered = window.restockProductsList.filter(p => 
                (p.nama || p.nama_produk || '').toLowerCase().includes(val) || 
                (p.sku || '').toLowerCase().includes(val)
            );
            if (window.renderRestockDropdownList) {
                window.renderRestockDropdownList(filtered);
            }
        }
    }
    if (e.target.id === 'tx-category-search') {
        const val = e.target.value.toLowerCase();
        if (window.txCategoryListCache) {
            const filtered = window.txCategoryListCache.filter(c => c.toLowerCase().includes(val));
            if (window.renderTxCategoryDropdownList) {
                window.renderTxCategoryDropdownList(filtered, window.txCategoryTypeCache);
            }
        }
    }
});

// Delete partner logic
document.addEventListener('click', async (e) => {
    if (e.target.closest('#btn-delete-partner')) {
        const id = document.getElementById('add-partner-id').value;
        if (!id) return;
        window.showConfirm('Hapus Mitra', 'Apakah Anda yakin ingin menghapus mitra ini?', async () => {
            try {
                // Firebase dynamic import removed
                
await apiFetch('/api/partners?id=' + id, { method: 'DELETE' });

                window.closeModal(document.getElementById('modal-tambah-mitra'));
                if (window.loadPartnersPage) window.loadPartnersPage(auth.currentUser.uid);
                alert('Mitra berhasil dihapus!');
            } catch (err) {
                alert('Gagal menghapus mitra: ' + err.message);
            }
        });
    }
});

// (POS checkout submit handler is handled inside DOMContentLoaded block - no duplicate needed here)
    
    // --- RAW MATERIALS MODULE ---

window.loadRawMaterialsPage = async function(uid) {
    const list = document.getElementById('raw-materials-list');
    if (!list) return;

    try {
        // Firebase dynamic import removed
        const q = query(collection(db, 'raw_materials'), where('uid', '==', uid));
        
const prodRes = await apiFetch('/api/products');
window.posProducts = prodRes.data || [];


        document.getElementById('stat-raw-items').textContent = totalItems;
        document.getElementById('stat-raw-value').textContent = formatRupiah(totalValue);

        function renderList(items) {
            if (items.length === 0) {
                list.innerHTML = '<div class="text-center text-on-surface-variant py-8 col-span-full bg-white rounded-[20px] border border-outline-variant/30 shadow-sm">Belum ada bahan baku. Silakan beli bahan baku baru.</div>';
                return;
            }
            let html = '';
            items.forEach(data => {
                const safeName = data.nama.replace(/'/g, "\\'");
                const safeKat = data.kategori.replace(/'/g, "\\'");
                const safeSat = data.satuan.replace(/'/g, "\\'");
                html += `
                <div class="bg-white border border-outline-variant/30 rounded-[20px] p-4 shadow-card hover:shadow-glow transition-all flex flex-col justify-between relative group">
                    <button class="absolute top-4 right-4 text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-low transition-colors" onclick="window.openEditRawMaterial('${data.id}', '${safeName}', '${safeKat}', '${safeSat}', ${data.stok_aktif}, ${data.avg_cost})">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <div class="flex items-start gap-4 mb-4 pr-6">
                        <div class="w-10 h-10 bg-surface-container-low text-primary rounded-xl flex items-center justify-center font-bold">
                            <span class="material-symbols-outlined">kitchen</span>
                        </div>
                        <div>
                            <div class="font-bold text-on-surface line-clamp-1">${data.nama}</div>
                            <div class="text-xs text-on-surface-variant mt-1">${data.kategori}</div>
                        </div>
                    </div>
                    <div class="flex justify-between items-end border-t border-outline-variant/20 pt-3">
                        <div>
                            <div class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Stok Tersedia</div>
                            <div class="font-bold text-primary mt-1 text-sm">${data.stok_aktif} ${data.satuan}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Harga Rata-Rata</div>
                            <div class="font-bold text-on-surface mt-1 text-sm">${formatRupiah(data.avg_cost)} / ${data.satuan}</div>
                        </div>
                    </div>
                </div>
                `;
            });
            list.innerHTML = html;
        }

        renderList(rawData);

        document.getElementById('search-raw')?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = rawData.filter(r => r.nama.toLowerCase().includes(query) || r.kategori.toLowerCase().includes(query));
            renderList(filtered);
        });

        document.getElementById('btn-add-raw-material')?.addEventListener('click', async () => {
            openModal(document.getElementById('modal-tambah-bahan-baku'));
            
            // Auto default raw-tanggal to today if not set
            const rawDateInput = document.getElementById('raw-tanggal');
            if (rawDateInput && !rawDateInput.value) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                rawDateInput.value = `${yyyy}-${mm}-${dd}`;
            }
            
            // Populate selects
            const namaSelect = document.getElementById('raw-nama');
            const katSelect = document.getElementById('raw-kategori');
            const satSelect = document.getElementById('raw-satuan');
            
            const uniqueRaw = [];
            const uniqueNama = [];
            const uniqueKat = new Set();
            const uniqueSat = new Set();
            
            rawData.forEach(r => {
                if(!uniqueNama.includes(r.nama)) {
                    uniqueNama.push(r.nama);
                    uniqueRaw.push(r);
                }
                uniqueKat.add(r.kategori);
                uniqueSat.add(r.satuan);
            });
            
            // Helper to populate select with 'Tambah Baru' logic
            const setupSelect = (selectEl, items, placeholder, titlePrompt) => {
                let html = `<option value="">${placeholder}</option>`;
                items.forEach(item => html += `<option value="${item}">${item}</option>`);
                html += `<option value="TAMBAH_BARU">+ Tambah Baru</option>`;
                selectEl.innerHTML = html;
                
                // Remove old listeners to prevent duplicates
                const clone = selectEl.cloneNode(true);
                selectEl.parentNode.replaceChild(clone, selectEl);
                
                clone.addEventListener('change', (e) => {
                    if (e.target.value === 'TAMBAH_BARU') {
                        e.target.value = '';
                        window.showInputPrompt(titlePrompt, 'Masukkan data...', (val) => {
                            if(val) {
                                // Add to options and select it
                                const opt = document.createElement('option');
                                opt.value = val;
                                opt.textContent = val;
                                clone.insertBefore(opt, clone.lastElementChild);
                                clone.value = val;
                                clone.dispatchEvent(new Event('change'));
                            }
                        });
                    }
                });
                return clone;
            };
            
            const newNamaSelect = setupSelect(namaSelect, uniqueNama, 'Pilih Bahan Baku...', 'Nama Bahan Baku Baru');
            const newKatSelect = setupSelect(katSelect, Array.from(uniqueKat), 'Pilih Kategori...', 'Kategori Baru');
            const newSatSelect = setupSelect(satSelect, Array.from(uniqueSat), 'Pilih Satuan...', 'Satuan Baru');
            
            // --- Harga Satuan Auto-Calculation ---
            const hargaSatuanDisplay = document.getElementById('raw-harga-satuan-display');
            const hargaSatuanPrevContainer = document.getElementById('raw-harga-satuan-prev-container');
            const hargaSatuanPrev = document.getElementById('raw-harga-satuan-prev');
            const qtyInput = document.getElementById('raw-qty');
            const totalHargaInput = document.getElementById('raw-total-harga');

            function updateHargaSatuan() {
                const qty = parseFloat(qtyInput?.value) || 0;
                const totalStr = totalHargaInput?.value?.replace(/[^0-9]/g, '') || '0';
                const total = parseInt(totalStr) || 0;
                if (qty > 0 && total > 0) {
                    const hargaSatuan = Math.round(total / qty);
                    if (hargaSatuanDisplay) hargaSatuanDisplay.textContent = formatRupiah(hargaSatuan);
                } else {
                    if (hargaSatuanDisplay) hargaSatuanDisplay.textContent = 'Rp 0';
                }
            }

            qtyInput?.addEventListener('input', updateHargaSatuan);
            totalHargaInput?.addEventListener('input', updateHargaSatuan);

            // Reset harga satuan display when modal opens
            if (hargaSatuanDisplay) hargaSatuanDisplay.textContent = 'Rp 0';
            if (hargaSatuanPrevContainer) hargaSatuanPrevContainer.classList.add('hidden');

            // Auto-fill logic when selecting existing raw material
            newNamaSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val && val !== 'TAMBAH_BARU') {
                    const raw = uniqueRaw.find(r => r.nama === val);
                    if (raw) {
                        newKatSelect.value = raw.kategori;
                        newSatSelect.value = raw.satuan;
                        // Show previous avg_cost as reference
                        if (raw.avg_cost && raw.avg_cost > 0 && hargaSatuanPrevContainer && hargaSatuanPrev) {
                            hargaSatuanPrev.textContent = formatRupiah(raw.avg_cost) + ' / ' + raw.satuan;
                            hargaSatuanPrevContainer.classList.remove('hidden');
                        }
                    }
                } else {
                    // Hide previous price if creating new
                    if (hargaSatuanPrevContainer) hargaSatuanPrevContainer.classList.add('hidden');
                }
            });

            // Pop wallets
            try {
                // Firebase dynamic import removed
                const walletSelect = document.getElementById('raw-wallet-id');
                if (walletSelect && auth.currentUser) {
                    const wq = query(collection(db, 'wallets'), where('uid', '==', auth.currentUser.uid));
                    const wSnapshot = await getDocs(wq);
                    let wHtml = '<option value="">Pilih Rekening / Kas</option>';
                    wSnapshot.forEach(docSnap => {
                        const data = docSnap.data();
                        wHtml += `<option value="${docSnap.id}">${data.nama_rekening} - ${formatRupiah(data.saldo_terkini)}</option>`;
                    });
                    walletSelect.innerHTML = wHtml;
                }
            } catch(e) { console.error("Error populating wallets", e); }
        });


    } catch(err) {
        console.error(err);
        list.innerHTML = '<div class="text-error text-center py-4 col-span-full">Gagal memuat data.</div>';
    }
}


    document.addEventListener('click', (e) => {
        if (e.target.closest('#close-tambah-bahan-baku') || e.target.id === 'modal-tambah-bahan-baku') {
            closeModal(document.getElementById('modal-tambah-bahan-baku'));
        }
        if (e.target.closest('#close-edit-bahan-baku') || e.target.id === 'modal-edit-bahan-baku') {
            closeModal(document.getElementById('modal-edit-bahan-baku'));
        }
    });

    window.openEditRawMaterial = function(id, nama, kategori, satuan, stok, avgCost) {
        document.getElementById('edit-raw-id').value = id;
        document.getElementById('edit-raw-nama').value = nama;
        document.getElementById('edit-raw-kategori').value = kategori;
        document.getElementById('edit-raw-satuan').value = satuan;
        document.getElementById('edit-raw-stok').value = stok;
        document.getElementById('edit-raw-avg-cost').value = avgCost;
        openModal(document.getElementById('modal-edit-bahan-baku'));
    };

    document.getElementById('form-edit-bahan-baku')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        const btn = document.getElementById('btn-save-edit-raw');
        if (btn) { btn.disabled = true; btn.innerHTML = "Menyimpan..."; }
        try {
            const rawId = document.getElementById('edit-raw-id').value;
            const data = {
                nama: document.getElementById('edit-raw-nama').value.trim(),
                kategori: document.getElementById('edit-raw-kategori').value.trim(),
                satuan: document.getElementById('edit-raw-satuan').value.trim(),
                stok_aktif: parseFloat(document.getElementById('edit-raw-stok').value),
                avg_cost: parseFloat(document.getElementById('edit-raw-avg-cost').value)
            };
            
            
await apiFetch('/api/raw-materials', { method: 'POST', body: JSON.stringify({ id: rawId, ...data }) });

            
            closeModal(document.getElementById('modal-edit-bahan-baku'));
            alert("Bahan Baku berhasil diperbarui!");
            loadRawMaterialsPage(auth.currentUser.uid);
        } catch (err) {
            alert("Gagal memperbarui bahan baku: " + err.message);
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = "Simpan Perubahan"; }
        }
    });

    // --- RAW MATERIALS SUBMISSION ---
    document.getElementById('form-tambah-bahan-baku')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        const btn = document.getElementById('btn-save-raw');
        if (btn) { btn.disabled = true; btn.innerHTML = "Menyimpan..."; }
        try {
            const nama = (document.getElementById('raw-nama')?.value || '').trim();
            const kategori = (document.getElementById('raw-kategori')?.value || '').trim();
            const satuan = (document.getElementById('raw-satuan')?.value || '').trim();
            const qty = parseFloat(document.getElementById('raw-qty')?.value || '0');
            const totalStr = (document.getElementById('raw-total-harga')?.value || '').replace(/[^0-9]/g, '');
            const totalHarga = totalStr ? parseInt(totalStr, 10) : 0;
            let walletId = document.getElementById('raw-wallet-id')?.value;
            const rawDateVal = document.getElementById('raw-tanggal')?.value;
            
            let tanggal = new Date();
            if (rawDateVal) {
                if (rawDateVal.includes('/')) {
                    const parts = rawDateVal.split('/');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1;
                        const year = parseInt(parts[2].split('T')[0].split(' ')[0], 10);
                        const parsed = new Date(year, month, day, 12, 0, 0);
                        if (!isNaN(parsed.getTime())) tanggal = parsed;
                    }
                } else {
                    const parsed = new Date(rawDateVal.includes('T') ? rawDateVal : rawDateVal + 'T12:00:00');
                    if (!isNaN(parsed.getTime())) tanggal = parsed;
                }
            }
            const keterangan = (document.getElementById('raw-keterangan')?.value || '').trim();

            if (!nama) throw new Error("Pilih atau masukkan Nama Bahan Baku!");
            if (!kategori) throw new Error("Pilih atau masukkan Kategori!");
            if (!satuan) throw new Error("Pilih atau masukkan Satuan!");
            
            if (!walletId) {
                const wSelect = document.getElementById('raw-wallet-id');
                if (wSelect && wSelect.options.length > 1) {
                    for (let i = 1; i < wSelect.options.length; i++) {
                        if (wSelect.options[i].value) {
                            walletId = wSelect.options[i].value;
                            break;
                        }
                    }
                }
            }

            if (!walletId) throw new Error("Pilih Dompet/Rekening!");
            if (!qty || qty <= 0) throw new Error("Jumlah harus lebih dari 0!");
            if (!totalHarga || totalHarga <= 0) throw new Error("Total harga harus lebih dari 0!");

            const costPerUnit = totalHarga / qty;

            // Check raw material existence OUTSIDE runTransaction
            const rawQ = query(collection(db, 'raw_materials'), where('uid', '==', auth.currentUser.uid), where('nama', '==', nama));
            const rawSnap = await getDocs(rawQ);
            
            let existingRawRef = null;
            let existingRawData = null;
            if (!rawSnap.empty) {
                existingRawRef = rawSnap.docs[0].ref;
                existingRawData = rawSnap.docs[0].data();
            }

            await runTransaction(db, async (transaction) => {
                // 1. Deduct from wallet
                const walletRef = doc(db, 'wallets', walletId);
                const walletDoc = await transaction.get(walletRef);
                if (!walletDoc.exists()) throw new Error("Dompet tidak ditemukan!");
                if (walletDoc.data().saldo_terkini < totalHarga) throw new Error("Saldo dompet tidak cukup!");
                
                transaction.update(walletRef, { saldo_terkini: walletDoc.data().saldo_terkini - totalHarga });

                // 2. Record Expense Transaction (Beban Bahan Baku)
                const txRef = doc(collection(db, 'transactions'));
                transaction.set(txRef, {
                    uid: auth.currentUser.uid,
                    tipe_tx: 'out',
                    nominal: totalHarga,
                    kategori: 'Persediaan Bahan Baku',
                    dompet_id: walletId,
                    tanggal: Timestamp.fromDate(tanggal),
                    catatan: `Beli ${qty} ${satuan} ${nama}${keterangan ? ' - ' + keterangan : ''}`
                });

                // 3. Update or Create Raw Material
                if (!existingRawRef) {
                    const newRawRef = doc(collection(db, 'raw_materials'));
                    transaction.set(newRawRef, {
                        uid: auth.currentUser.uid,
                        nama: nama,
                        kategori: kategori,
                        satuan: satuan,
                        stok_aktif: qty,
                        avg_cost: costPerUnit
                    });
                } else {
                    const existData = existingRawData;
                    // Re-read inside transaction for consistency
                    const freshRaw = await transaction.get(existingRawRef);
                    const freshData = freshRaw.exists() ? freshRaw.data() : existData;
                    
                    const oldStok = freshData.stok_aktif || 0;
                    const oldCost = freshData.avg_cost || 0;
                    
                    const totalOldValue = oldStok * oldCost;
                    const totalNewValue = totalOldValue + totalHarga;
                    const newStok = oldStok + qty;
                    const newAvgCost = totalNewValue / newStok;

                    transaction.update(existingRawRef, {
                        stok_aktif: newStok,
                        avg_cost: newAvgCost,
                        kategori: kategori,
                        satuan: satuan
                    });
                }
            });

            closeModal(document.getElementById('modal-tambah-bahan-baku'));
            document.getElementById('form-tambah-bahan-baku').reset();
            alert("Bahan Baku berhasil dibeli!");
            
            // Reload if on rawmaterials page
            const appContentHtml = document.getElementById('app-content').innerHTML;
            if (appContentHtml.includes('Bahan Baku')) {
                loadRawMaterialsPage(auth.currentUser.uid);
            }

        } catch (err) {
            console.error("Error simpan bahan baku:", err);
            alert(err.message);
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = "Simpan Pembelian"; }
        }
    });

// --- TRANSAKSI ACTIONS MODAL SYSTEM ---
window.openActionTransaksi = function(index) {
    if (!window._txs || !window._txs[index]) return;
    window.currentActiveTxIndex = index;
    const tx = window._txs[index];
    
    // Tampilkan/sembunyikan tombol lihat struk
    const btnReceipt = document.getElementById('btn-receipt-tx-action');
    if (btnReceipt) {
        if (tx.foto_struk) {
            btnReceipt.classList.remove('hidden');
        } else {
            btnReceipt.classList.add('hidden');
        }
    }
    
    const modal = document.getElementById('modal-aksi-transaksi');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.remove('pointer-events-none');
            modal.classList.add('opacity-100');
            modal.children[0].classList.remove('translate-y-full', 'sm:scale-95');
            modal.children[0].classList.add('translate-y-0', 'sm:scale-100');
        }, 10);
    }
};

window.closeActionTransaksi = function() {
    const modal = document.getElementById('modal-aksi-transaksi');
    if (modal) {
        modal.classList.add('pointer-events-none');
        modal.classList.remove('opacity-100');
        modal.children[0].classList.add('translate-y-full', 'sm:scale-95');
        modal.children[0].classList.remove('translate-y-0', 'sm:scale-100');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
};

document.getElementById('close-aksi-transaksi')?.addEventListener('click', () => {
    window.closeActionTransaksi();
});
document.getElementById('modal-aksi-transaksi')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-aksi-transaksi')) {
        window.closeActionTransaksi();
    }
});

document.getElementById('btn-receipt-tx-action')?.addEventListener('click', () => {
    window.closeActionTransaksi();
    if (window.currentActiveTxIndex !== undefined) {
        window.openReceiptModal(window.currentActiveTxIndex);
    }
});

document.getElementById('btn-delete-tx-action')?.addEventListener('click', async () => {
    if (window.currentActiveTxIndex === undefined) return;
    const tx = window._txs[window.currentActiveTxIndex];
    if (!tx) return;
    
    window.showConfirm('Hapus Transaksi', 'Apakah Anda yakin ingin menghapus transaksi ini? Saldo dompet terkait akan disesuaikan otomatis.', async () => {
        const btn = document.getElementById('btn-delete-tx-action');
        btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Menghapus...';
        
        try {
            await runTransaction(db, async (transaction) => {
                if (tx.tipe_tx === 'in') {
                    const walletRef = doc(db, 'wallets', tx.dompet_id);
                    const walletDoc = await transaction.get(walletRef);
                    if (walletDoc.exists()) {
                        let newSaldo = walletDoc.data().saldo_terkini - tx.nominal;
                        let updates = { saldo_terkini: newSaldo };
                        if (tx.kategori === 'Modal') {
                            updates.saldo_awal = (walletDoc.data().saldo_awal || 0) - tx.nominal;
                        }
                        transaction.update(walletRef, updates);
                    }
                } 
                else if (tx.tipe_tx === 'out') {
                    const walletRef = doc(db, 'wallets', tx.dompet_id);
                    const walletDoc = await transaction.get(walletRef);
                    if (walletDoc.exists()) {
                        let newSaldo = walletDoc.data().saldo_terkini + tx.nominal;
                        transaction.update(walletRef, { saldo_terkini: newSaldo });
                    }
                }
                else if (tx.tipe_tx === 'transfer') {
                    const srcRef = doc(db, 'wallets', tx.dompet_id);
                    const destRef = doc(db, 'wallets', tx.dompet_tujuan_id);
                    const srcDoc = await transaction.get(srcRef);
                    const destDoc = await transaction.get(destRef);
                    if (srcDoc.exists() && destDoc.exists()) {
                        transaction.update(srcRef, { saldo_terkini: srcDoc.data().saldo_terkini + tx.nominal });
                        transaction.update(destRef, { saldo_terkini: destDoc.data().saldo_terkini - tx.nominal });
                    }
                }
                
                const txRef = doc(db, 'transactions', window._txs[window.currentActiveTxIndex].id);
                transaction.delete(txRef);
            });
            
            window.loadTransactionsPage(auth.currentUser.uid);
            alert('Transaksi berhasil dihapus');
        } catch (err) {
            console.error(err);
            alert('Gagal menghapus transaksi: ' + err.message);
        } finally {
            btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">delete</span> Hapus';
            window.closeActionTransaksi();
        }
    });
});

document.getElementById('btn-edit-tx-action')?.addEventListener('click', () => {
    if (window.currentActiveTxIndex === undefined) return;
    const tx = window._txs[window.currentActiveTxIndex];
    if (!tx) return;
    
    window.closeActionTransaksi();
    
    const modalRecord = document.getElementById('modal-record-transaction');
    if (modalRecord) {
        document.getElementById('tx-edit-id').value = tx._id;
        
        const typeTab = document.querySelector(`.tx-tab-btn[data-type="${tx.tipe_tx}"]`);
        if (typeTab) typeTab.click();
        
        const amountInput = document.getElementById('tx-amount');
        if (amountInput) {
            amountInput.value = new Intl.NumberFormat('id-ID').format(tx.nominal);
            amountInput.dispatchEvent(new Event('input'));
        }
        
        window.populateWalletDropdown('tx-wallet-source').then(() => {
            document.getElementById('tx-wallet-source').value = tx.dompet_id;
        });
        
        if (tx.tipe_tx === 'transfer') {
            window.populateWalletDropdown('tx-wallet-destination').then(() => {
                document.getElementById('tx-wallet-destination').value = tx.dompet_tujuan_id || '';
            });
        }
        
        const catSelect = document.getElementById('tx-category');
        if (catSelect) {
            if (tx.tipe_tx === 'in') {
                catSelect.innerHTML = '<option value="Penjualan">🛒 Penjualan</option><option value="Jasa">💼 Jasa</option><option value="Pendapatan Lain">💰 Pendapatan Lain</option><option value="Modal">🏦 Modal Disetor</option>';
            } else if (tx.tipe_tx === 'out') {
                catSelect.innerHTML = '<option value="Bahan Baku">📦 Bahan Baku</option><option value="Gaji Karyawan">👥 Gaji Karyawan</option><option value="Sewa">🏢 Sewa</option><option value="Listrik & Air">⚡ Listrik & Air</option><option value="Perlengkapan">📎 Perlengkapan</option><option value="Transportasi">🚗 Transportasi</option><option value="Makanan">🍔 Makanan</option><option value="Marketing">📈 Marketing</option><option value="Lainnya">📌 Lainnya</option>';
            } else {
                catSelect.innerHTML = '<option value="Transfer">🔄 Transfer Antar Kas/Bank</option>';
            }
            catSelect.value = tx.kategori || '';
        }
        
        const dateInput = document.getElementById('tx-date');
        if (dateInput && tx.tanggal) {
            const dateObj = safeToDate(tx.tanggal);
            const offset = dateObj.getTimezoneOffset();
            const localObj = new Date(dateObj.getTime() - (offset*60*1000));
            const iso = localObj.toISOString().slice(0, 16);
            
            dateInput.dataset.iso = iso;
            const year = dateObj.getFullYear();
            const monthStr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][dateObj.getMonth()];
            const day = dateObj.getDate();
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            dateInput.value = `${day} ${monthStr} ${year} ${hours}:${minutes}`;
        }
        
        const noteTextarea = document.getElementById('tx-note');
        if (noteTextarea) noteTextarea.value = tx.catatan || '';
        
        const filename = document.getElementById('tx-receipt-filename');
        if (filename && tx.foto_struk) {
            filename.textContent = 'Struk terlampir (klik Lampirkan Foto untuk mengganti)';
        }
        
        const btnSave = document.getElementById('btn-save-transaction');
        if (btnSave) btnSave.innerHTML = 'Simpan Perubahan';
        
        window.openModal(modalRecord);
    }
});

// --- NOTIFIKASI SYSTEM ---
document.getElementById('btn-notif')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-notif');
    if (modal) window.openModal(modal);
});
document.getElementById('close-notif')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-notif');
    if (modal) window.closeModal(modal);
});

// --- CHAT AI & SCAN NOTA AI SYSTEM ---
window._aiChatHistory = [];

function formatAiMarkdown(text) {
    if (!text) return '';
    let formatted = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs">$1</code>')
        .replace(/^\s*[\-\*]\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
    return formatted;
}

document.getElementById('btn-clear-chat-ai')?.addEventListener('click', () => {
    window._aiChatHistory = [];
    const container = document.getElementById('chat-messages-container');
    if (container) {
        container.innerHTML = `
        <div class="flex items-start gap-2.5 max-w-[85%]">
            <div class="w-7 h-7 bg-primary-container text-primary rounded-full flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[16px]">smart_toy</span>
            </div>
            <div class="bg-surface border border-outline rounded-2xl rounded-tl-none p-3 shadow-card text-sm text-on-surface">
                Chat telah dibersihkan. Silakan tanyakan hal lain seputar keuangan atau operasional bisnis Anda!
            </div>
        </div>`;
    }
});

document.addEventListener('click', (e) => {
    const chip = e.target.closest('.quick-chip-btn');
    if (chip) {
        const msg = chip.dataset.msg;
        const inputEl = document.getElementById('chat-user-message');
        if (inputEl && msg) {
            inputEl.value = msg;
            document.getElementById('chat-input-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    }
});

document.getElementById('btn-chat-ai')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-chat-ai');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.remove('pointer-events-none');
            modal.classList.add('opacity-100');
            modal.children[0].classList.remove('translate-y-full', 'sm:scale-95');
            modal.children[0].classList.add('translate-y-0', 'sm:scale-100');
        }, 10);
    }
});

document.getElementById('close-chat-ai')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-chat-ai');
    if (modal) {
        modal.classList.add('pointer-events-none');
        modal.classList.remove('opacity-100');
        modal.children[0].classList.add('translate-y-full', 'sm:scale-95');
        modal.children[0].classList.remove('translate-y-0', 'sm:scale-100');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
});

document.getElementById('chat-input-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMsgEl = document.getElementById('chat-user-message');
    const container = document.getElementById('chat-messages-container');
    if (!userMsgEl || !container || !auth.currentUser) return;

    const message = userMsgEl.value.trim();
    if (!message) return;

    const userHtml = `
    <div class="flex items-start gap-2.5 justify-end max-w-[85%] ml-auto">
        <div class="bg-primary text-white rounded-2xl rounded-tr-none p-3 shadow-card text-sm">
            ${message}
        </div>
    </div>
    `;
    container.insertAdjacentHTML('beforeend', userHtml);
    userMsgEl.value = '';
    container.scrollTop = container.scrollHeight;

    const loadingId = 'ai-loading-' + Date.now();
    const loadingHtml = `
    <div id="${loadingId}" class="flex items-start gap-2.5 max-w-[85%]">
        <div class="w-7 h-7 bg-primary-container text-primary rounded-full flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[16px] animate-spin">sync</span>
        </div>
        <div class="bg-surface border border-outline rounded-2xl rounded-tl-none p-3 shadow-card text-sm text-on-surface-variant italic">
            Gemini sedang berpikir & menganalisis data...
        </div>
    </div>
    `;
    container.insertAdjacentHTML('beforeend', loadingHtml);
    container.scrollTop = container.scrollHeight;

    try {
        const businessName = document.getElementById('profile-business-name')?.innerText || 'Bisnis pengguna';
        const ownerName = document.getElementById('profile-owner-name')?.innerText || '';
        
        let walletInfo = '';
        let totalSaldoSemua = 0;
        rawWallets.forEach(w => {
            const s = w.saldo_terkini || 0;
            totalSaldoSemua += s;
            walletInfo += `- ${w.nama_rekening} (${w.tipe || 'rekening'}): ${formatRupiah(s)}\n`;
        });

        let prodInfo = '';
        let outOfStockProds = [];
        rawProducts.forEach(p => {
            const qty = p.stok_gudang || 0;
            const price = p.harga_jual || 0;
            const modal = p.last_hpp_satuan || p.harga_modal || 0;
            prodInfo += `- ${p.nama || p.nama_produk}: Stok ${qty} ${p.unit || 'pcs'}, Harga Jual ${formatRupiah(price)}, Modal HPP ${formatRupiah(modal)}\n`;
            if (qty <= 0) outOfStockProds.push(p.nama || p.nama_produk);
        });

        let rawInfo = '';
        let outOfStockRaws = [];
        rawMaterials.forEach(m => {
            const qty = m.stok_aktif || 0;
            rawInfo += `- ${m.nama}: Stok ${qty} ${m.satuan || ''}, Avg Cost ${formatRupiah(m.avg_cost || 0)}\n`;
            if (qty <= 0) outOfStockRaws.push(m.nama);
        });

        let partnerInfo = '';
        rawPartners.forEach(pt => {
            partnerInfo += `- ${pt.nama}: Piutang ${formatRupiah(pt.total_piutang || 0)}, HP/Kontak: ${pt.no_hp || '-'}\n`;
        });

        let txInfo = '';
        let totalPendapatan = 0;
        let totalBeban = 0;
        rawTransactions.slice(0, 15).forEach(tx => {
            const dateStr = tx.tanggal ? safeToDate(tx.tanggal).toLocaleDateString('id-ID') : '-';
            const sign = tx.tipe_tx === 'in' ? '+' : '-';
            txInfo += `- [${dateStr}] ${tx.tipe_tx.toUpperCase()} | Kategori: ${tx.kategori} | ${sign}${formatRupiah(tx.nominal || 0)} | Catatan: ${tx.catatan || 'Tanpa catatan'}\n`;
            if (tx.tipe_tx === 'in') totalPendapatan += (tx.nominal || 0);
            if (tx.tipe_tx === 'out') totalBeban += (tx.nominal || 0);
        });

        const labaBersihEstimasi = totalPendapatan - totalBeban;

        const systemContextPrompt = `SYSTEM CONTEXT & REKAP DATA REAL-TIME BISNIS:
Anda adalah Asisten Bisnis finMo - AI konsultan keuangan & operasional pintar yang ramah, komunikatif, solutif, dan intuitif untuk pelaku UMKM.
Pemilik Bisnis: ${ownerName || 'Pengguna'} (${businessName})

DATA REAL-TIME BISNIS SAAT INI:
1. Rekening & Kas:
${walletInfo || 'Belum ada dompet.'}
Total Saldo Kas & Rekening: ${formatRupiah(totalSaldoSemua)}

2. Produk Jadi (Gudang):
${prodInfo || 'Belum ada produk.'}
Produk Stok Habis: ${outOfStockProds.length > 0 ? outOfStockProds.join(', ') : 'Tidak ada'}

3. Bahan Baku:
${rawInfo || 'Belum ada bahan baku.'}
Bahan Baku Stok Habis: ${outOfStockRaws.length > 0 ? outOfStockRaws.join(', ') : 'Tidak ada'}

4. Partner / Konsinyasi / Piutang Mitra:
${partnerInfo || 'Belum ada mitra.'}

5. Transaksi Terakhir (15 Transaksi):
${txInfo || 'Belum ada transaksi.'}
Ringkasan: Pemasukan ${formatRupiah(totalPendapatan)}, Pengeluaran ${formatRupiah(totalBeban)}, Estimasi Laba/Rugi ${formatRupiah(labaBersihEstimasi)}

INSTRUKSI RESPON:
- Jawablah secara alami, ramah, dan manusiawi (tidak kaku/robotik).
- Manfaatkan data real-time di atas untuk memberikan jawaban yang 100% akurat.
- Selalu komunikatif dan berikan saran bermanfaat bagi perkembangan UMKM jika relevan.
- Gunakan bahasa Indonesia yang baik dan cetak tebal **teks** untuk poin penting.`;

        let geminiContents = [
            { role: 'user', parts: [{ text: systemContextPrompt }] },
            { role: 'model', parts: [{ text: `Siap! Saya adalah Asisten AI finMo untuk ${businessName}. Saya memegang seluruh rekap real-time kas, stok, transaksi, dan laporan bisnis Anda. Ada yang bisa saya bantu?` }] }
        ];

        // Append historical turns in this session
        if (window._aiChatHistory && window._aiChatHistory.length > 0) {
            geminiContents.push(...window._aiChatHistory);
        }

        // Append active question
        geminiContents.push({ role: 'user', parts: [{ text: message }] });

        const replyText = await callGemini(geminiContents);

        // Update session memory
        window._aiChatHistory.push({ role: 'user', parts: [{ text: message }] });
        window._aiChatHistory.push({ role: 'model', parts: [{ text: replyText }] });

        document.getElementById(loadingId)?.remove();

        const formattedReply = formatAiMarkdown(replyText);

        const aiHtml = `
        <div class="flex items-start gap-2.5 max-w-[85%]">
            <div class="w-7 h-7 bg-primary-container text-primary rounded-full flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[16px]">smart_toy</span>
            </div>
            <div class="bg-surface border border-outline rounded-2xl rounded-tl-none p-3 shadow-card text-sm text-on-surface leading-relaxed">
                ${formattedReply}
            </div>
        </div>
        `;
        container.insertAdjacentHTML('beforeend', aiHtml);
        container.scrollTop = container.scrollHeight;

    } catch (err) {
        document.getElementById(loadingId)?.remove();
        const errHtml = `
        <div class="flex items-start gap-2.5 max-w-[85%]">
            <div class="w-7 h-7 bg-error-container text-error rounded-full flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[16px]">error</span>
            </div>
            <div class="bg-error-container border border-error/20 rounded-2xl rounded-tl-none p-3 text-sm text-error">
                Gagal memanggil AI: ${err.message}
            </div>
        </div>
        `;
        container.insertAdjacentHTML('beforeend', errHtml);
        container.scrollTop = container.scrollHeight;
    }
});

document.getElementById('btn-scan-nota')?.addEventListener('click', () => {
    window.closeModal(document.getElementById('modal-pilih-aksi'));
    const modal = document.getElementById('modal-scan-nota');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.remove('pointer-events-none');
            modal.classList.add('opacity-100');
            modal.children[0].classList.remove('translate-y-full', 'sm:scale-95');
            modal.children[0].classList.add('translate-y-0', 'sm:scale-100');
        }, 10);
    }
});

document.getElementById('close-scan-nota')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-scan-nota');
    if (modal) {
        modal.classList.add('pointer-events-none');
        modal.classList.remove('opacity-100');
        modal.children[0].classList.add('translate-y-full', 'sm:scale-95');
        modal.children[0].classList.remove('translate-y-0', 'sm:scale-100');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
        document.getElementById('scan-nota-preview-container').classList.add('hidden');
        document.getElementById('scan-nota-preview').src = '';
        document.getElementById('scan-nota-file').value = '';
        document.getElementById('scan-nota-loading').classList.add('hidden');
    }
});

document.getElementById('btn-reset-scan-nota')?.addEventListener('click', () => {
    document.getElementById('scan-nota-preview-container').classList.add('hidden');
    document.getElementById('scan-nota-preview').src = '';
    document.getElementById('scan-nota-file').value = '';
});

document.getElementById('scan-nota-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewImg = document.getElementById('scan-nota-preview');
    const previewContainer = document.getElementById('scan-nota-preview-container');
    const loadingEl = document.getElementById('scan-nota-loading');

    const fileUrl = URL.createObjectURL(file);
    previewImg.src = fileUrl;
    previewContainer.classList.remove('hidden');
    loadingEl.classList.remove('hidden');

    try {
        const base64Image = await fileToBase64(file);
        
        const promptText = `
        Analisis gambar nota/struk belanja ini.
        Ekstrak informasi transaksi ke dalam format JSON dengan kunci berikut secara eksak:
        {
          "tipe_tx": "in" atau "out",
          "nominal": angka total transaksi (integer),
          "kategori": nama kategori transaksi (pilih salah satu dari: "Bahan Baku", "Gaji Karyawan", "Sewa", "Listrik & Air", "Perlengkapan", "Transportasi", "Makanan", "Marketing", "Lainnya" untuk tipe "out", atau "Penjualan Kasir POS", "Setoran Mitra", "Lainnya" untuk tipe "in"),
          "catatan": detail barang/keterangan belanja singkat (string),
          "tanggal": tanggal transaksi dalam format YYYY-MM-DD (string)
        }
        Pastikan Anda HANYA mengembalikan format JSON yang valid, tanpa teks tambahan atau pembungkus markdown (seperti \`\`\`json).
        `;

        const reply = await callGemini(promptText, base64Image, file.type);
        
        let cleanReply = reply.trim();
        if (cleanReply.startsWith('```')) {
            cleanReply = cleanReply.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }

        const data = JSON.parse(cleanReply);

        document.getElementById('close-scan-nota').click();

        const modalRecord = document.getElementById('modal-record-transaction');
        if (modalRecord) {
            window.openModal(modalRecord);
            
            const typeBtn = document.querySelector(`.tx-tab-btn[data-type="${data.tipe_tx || 'out'}"]`);
            if (typeBtn) typeBtn.click();

            const amountInput = document.getElementById('tx-amount');
            if (amountInput) {
                amountInput.value = data.nominal ? new Intl.NumberFormat('id-ID').format(data.nominal) : '0';
                amountInput.dispatchEvent(new Event('input'));
            }

            const catSelect = document.getElementById('tx-category');
            if (catSelect) {
                const exists = Array.from(catSelect.options).some(opt => opt.value === data.kategori);
                catSelect.value = exists ? data.kategori : 'Lainnya';
            }

            const noteTextarea = document.getElementById('tx-note');
            if (noteTextarea) {
                noteTextarea.value = data.catatan || '';
            }

            const dateInput = document.getElementById('tx-date');
            if (dateInput) {
                if (data.tanggal) {
                    dateInput.value = data.tanggal + 'T12:00';
                } else {
                    const now = new Date();
                    const offset = now.getTimezoneOffset();
                    now.setMinutes(now.getMinutes() - offset);
                    dateInput.value = now.toISOString().slice(0, 16);
                }
            }
            
            const txReceiptFilename = document.getElementById('tx-receipt-filename');
            if (txReceiptFilename) {
                txReceiptFilename.textContent = `Gambar terlampir: ${file.name}`;
            }
            const mainReceiptFileInput = document.getElementById('tx-receipt-file');
            if (mainReceiptFileInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                mainReceiptFileInput.files = dataTransfer.files;
            }
        }

    } catch (err) {
        alert("Gagal membaca nota dengan AI: " + err.message);
    } finally {
        loadingEl.classList.add('hidden');
    }
});

window.MapsTo = MapsTo;
window.loadPOSPage = loadPOSPage;

// Settings Logic
function initSettingsState() {
    const toggle = document.getElementById('toggle-dark-mode');
    if (toggle) {
        // Init state from localStorage or body class
        if(localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark')) {
            toggle.checked = true;
            document.documentElement.classList.add('dark');
        } else {
            toggle.checked = false;
            document.documentElement.classList.remove('dark');
        }
        
        toggle.onchange = (e) => {
            if (e.target.checked) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        };
    }
    
    const langSelect = document.getElementById('select-language');
    if (langSelect) {
        langSelect.value = localStorage.getItem('lang') || 'id';
        langSelect.onchange = (e) => {
            localStorage.setItem('lang', e.target.value);
            // Re-render strings (in real app, use i18n logic)
            alert('Perubahan bahasa akan diterapkan pada saat memuat ulang aplikasi.');
            location.reload();
        };
    }
    
    document.getElementById('btn-delete-account')?.addEventListener('click', () => {
        window.showConfirm('Hapus Akun', 'Apakah Anda yakin ingin menghapus akun ini beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.', async () => {
            if (auth.currentUser) {
                try {
                    await auth.currentUser.delete();
                    alert('Akun Anda berhasil dihapus.');
                    location.reload();
                } catch(e) {
                    alert('Gagal menghapus akun. Ini biasanya karena alasan keamanan. Silakan logout, lalu login kembali dan coba hapus akun lagi. (' + e.message + ')');
                }
            }
        });
    });
}
// --- iOS-Style DatePicker Logic ---
let dpSelectedDate = new Date();
let dpActiveField = null;
const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
const getDaysInMonth = (year, month) => [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];

function initWheel(wheelId, items, selectedIndex, onChange) {
    const wheel = document.getElementById(wheelId);
    const list = wheel.querySelector('div[id^="dp-list-"]');
    
    let html = '';
    items.forEach((item, idx) => {
        html += `<div class="dp-item ${idx === selectedIndex ? 'active' : ''}" data-idx="${idx}">${item.label}</div>`;
    });
    list.innerHTML = html;
    
    const itemHeight = 40;
    
    // Reset scroll handler to prevent duplicates
    wheel.onscroll = null;
    
    // Set initial scroll
    requestAnimationFrame(() => {
        wheel.scrollTop = selectedIndex * itemHeight;
        
        let scrollTimeout;
        wheel.onscroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const centerPos = wheel.scrollTop + (wheel.clientHeight / 2);
                const idx = Math.round(wheel.scrollTop / itemHeight);
                const safeIdx = Math.max(0, Math.min(idx, items.length - 1));
                
                // Snap
                if (wheel.scrollTop !== safeIdx * itemHeight) {
                    wheel.scrollTo({ top: safeIdx * itemHeight, behavior: 'smooth' });
                }
                
                // Update active classes
                Array.from(list.children).forEach((child, i) => {
                    if (i === safeIdx) child.classList.add('active');
                    else child.classList.remove('active');
                });
                
                if (onChange) onChange(items[safeIdx].value);
            }, 100);
        };
    });
}

function updateDatePicker(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    const years = [];
    for(let i = year - 5; i <= year + 5; i++) years.push({label: i, value: i});
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => ({label: m, value: i}));
    
    const daysInMonth = getDaysInMonth(year, month);
    const days = [];
    for(let i = 1; i <= daysInMonth; i++) days.push({label: i, value: i});
    
    initWheel('dp-wheel-year', years, 5, (newYear) => {
        dpSelectedDate.setFullYear(newYear);
        updateDatePicker(dpSelectedDate);
    });
    
    initWheel('dp-wheel-month', months, month, (newMonth) => {
        dpSelectedDate.setMonth(newMonth);
        updateDatePicker(dpSelectedDate);
    });
    
    initWheel('dp-wheel-day', days, day - 1, (newDay) => {
        dpSelectedDate.setDate(newDay);
    });
}

window.openDatePicker = function(field) {
    dpActiveField = field;
    if (field.value) {
        const parsed = new Date(field.value);
        if (!isNaN(parsed.getTime())) {
            dpSelectedDate = parsed;
        } else {
            dpSelectedDate = new Date();
        }
    } else {
        dpSelectedDate = new Date();
    }
    
    updateDatePicker(dpSelectedDate);
    
    const modal = document.getElementById('modal-datepicker');
    const content = document.getElementById('modal-datepicker-content');
    if (modal && content) {
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('translate-y-full');
            });
        });
    }
};

window.closeDatePicker = function() {
    const modal = document.getElementById('modal-datepicker');
    const content = document.getElementById('modal-datepicker-content');
    if (modal && content) {
        modal.classList.add('opacity-0');
        content.classList.add('translate-y-full');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
};

document.getElementById('tx-date')?.addEventListener('click', (e) => {
    openDatePicker(e.target);
});

document.getElementById('dp-btn-cancel')?.addEventListener('click', closeDatePicker);
document.getElementById('modal-datepicker')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-datepicker') closeDatePicker();
});

document.getElementById('dp-btn-today')?.addEventListener('click', () => {
    dpSelectedDate = new Date();
    updateDatePicker(dpSelectedDate);
});

document.getElementById('dp-btn-confirm')?.addEventListener('click', () => {
    if (dpActiveField) {
        const year = dpSelectedDate.getFullYear();
        const month = String(dpSelectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(dpSelectedDate.getDate()).padStart(2, '0');
        const hours = String(dpSelectedDate.getHours()).padStart(2, '0');
        const minutes = String(dpSelectedDate.getMinutes()).padStart(2, '0');
        
        if (dpActiveField.type === 'date') {
            dpActiveField.value = `${year}-${month}-${day}`;
        } else if (dpActiveField.type === 'month') {
            dpActiveField.value = `${year}-${month}`;
        } else if (dpActiveField.type === 'datetime-local') {
            dpActiveField.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        } else {
            dpActiveField.value = `${day} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][dpSelectedDate.getMonth()]} ${year} ${hours}:${minutes}`;
        }
        dpActiveField.dataset.iso = `${year}-${month}-${day}T${hours}:${minutes}`;
        dpActiveField.dispatchEvent(new Event('change', { bubbles: true }));
        dpActiveField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    closeDatePicker();
});

// Update places that read tx-date value to use dataset.iso if available
// This involves checking how tx-date is read in app.js

window.printDistribusiReceipt = function(partnerData, prodData, qty, setoran) {
    const container = document.getElementById("print-receipt-container");
    if (!container) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const total = qty * setoran;
    
    container.innerHTML = `
        <div style="font-family: monospace; width: 300px; margin: 0 auto; padding: 10px; color: #000; background: #fff;">
            <h2 style="text-align: center; margin: 0; font-size: 1.2rem;">FINTRA MOBILE</h2>
            <p style="text-align: center; margin: 5px 0 15px; font-size: 0.8rem; border-bottom: 1px dashed #000; padding-bottom: 10px;">
                Bukti Distribusi Stok
            </p>
            
            <p style="margin: 3px 0; font-size: 0.85rem;"><strong>Tanggal:</strong> ${dateStr}</p>
            <p style="margin: 3px 0; font-size: 0.85rem;"><strong>Mitra:</strong> ${partnerData.nama_toko || partnerData.nama_partner}</p>
            
            <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
            
            <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
                <tr>
                    <td colspan="2" style="padding-bottom: 5px;"><strong>${prodData.nama_produk || prodData.nama}</strong></td>
                </tr>
                <tr>
                    <td>${qty} x ${formatRupiah(setoran)}</td>
                    <td style="text-align: right;">${formatRupiah(total)}</td>
                </tr>
            </table>
            
            <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: bold;">
                <span>Total Setoran:</span>
                <span>${formatRupiah(total)}</span>
            </div>
            
            <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
            
            <p style="text-align: center; font-size: 0.75rem; margin-top: 15px;">
                Terima kasih atas kerjasamanya.<br>
                <em>Dicetak dari aplikasi Fintra Mobile</em>
            </p>
        </div>
    `;
    
    // Slight delay to allow DOM to render before printing
    setTimeout(() => {
        window.print();
        // clear after print to not affect other things
        container.innerHTML = "";
    }, 300);
};


console.log('APP_JS_LOADED');



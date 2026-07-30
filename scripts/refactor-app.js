import fs from 'fs';

let code = fs.readFileSync('app.js', 'utf8');

// 1. Remove all dynamic imports of firebasejs
code = code.replace(/const\s*\{[^}]+\}\s*=\s*await\s*import\(['"]https:\/\/www\.gstatic\.com\/firebasejs[^'"]+['"]\);?/g, '// Firebase dynamic import removed');

// 2. Refactor loadDashboardData
const dashboardRegex = /export async function loadDashboardData\(uid\) \{[\s\S]*?\n\}/;
const newDashboardFunc = `export async function loadDashboardData(uid) {
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
}`;

code = code.replace(dashboardRegex, newDashboardFunc);

fs.writeFileSync('app.js', code);
console.log('app.js refactored successfully!');

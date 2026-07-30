document.getElementById('form-tambah-bahan-baku')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama = (document.getElementById('raw-nama')?.value || '').trim();
        const satuan = (document.getElementById('raw-satuan')?.value || '').trim() || 'pcs';
        const stok = Number(document.getElementById('raw-stok')?.value || 0);
        const totalNilai = Number((document.getElementById('raw-total-nilai')?.value || '0').replace(/\./g, ''));
        const walletId = document.getElementById('raw-wallet')?.value;
        const hppRataRata = stok > 0 ? (totalNilai / stok) : 0;
        const rawId = document.getElementById('raw-id')?.value;

        try {
            await apiFetch('/api/raw-materials', {
                method: 'POST',
                body: JSON.stringify({
                    id: rawId || undefined,
                    nama,
                    satuan,
                    stok,
                    total_nilai: totalNilai,
                    hpp_rata_rata: hppRataRata
                })
            });

            if (walletId && totalNilai > 0) {
                await apiFetch('/api/transactions', {
                    method: 'POST',
                    body: JSON.stringify({
                        tipe: 'pengeluaran',
                        jumlah: totalNilai,
                        kategori: 'Bahan Baku',
                        dompet_id: walletId,
                        catatan: 'Pembelian bahan baku: ' + nama
                    })
                });
            }

            alert("Bahan baku berhasil disimpan!");
            closeModal(document.getElementById('modal-tambah-bahan-baku'));
            e.target.reset();
            if (window.loadBahanBakuPage) window.loadBahanBakuPage();
        } catch(err) {
            alert(err.message);
        }
    });

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

            const res = await apiFetch('/api/raw-materials');
            const rawMaterials = res.data || [];
            const existingRaw = rawMaterials.find(r => r.nama === nama);

            const oldStok = Number(existingRaw?.stok || existingRaw?.stok_aktif || 0);
            const oldCost = Number(existingRaw?.hpp_rata_rata || existingRaw?.avg_cost || 0);
            const totalOldValue = oldStok * oldCost;
            const totalNewValue = totalOldValue + totalHarga;
            const newStok = oldStok + qty;
            const newAvgCost = newStok > 0 ? (totalNewValue / newStok) : 0;

            await apiFetch('/api/raw-materials', {
                method: 'POST',
                body: JSON.stringify({
                    id: existingRaw?.id || undefined,
                    nama: nama,
                    satuan: satuan,
                    stok: newStok,
                    total_nilai: totalNewValue,
                    hpp_rata_rata: newAvgCost
                })
            });

            if (walletId && totalHarga > 0) {
                await apiFetch('/api/transactions', {
                    method: 'POST',
                    body: JSON.stringify({
                        tipe: 'pengeluaran',
                        jumlah: totalHarga,
                        kategori: 'Persediaan Bahan Baku',
                        dompet_id: walletId,
                        catatan: `Beli ${qty} ${satuan} ${nama}${keterangan ? ' - ' + keterangan : ''}`,
                        tanggal: tanggal.toISOString()
                    })
                });
            }

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
            if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
            const tx = window._txs ? window._txs[window.currentActiveTxIndex] : null;
            if (!tx) return;
            try {
                await apiFetch('/api/transactions?id=' + tx.id, { method: 'DELETE' });
                alert("Transaksi berhasil dihapus.");
                closeModal(document.getElementById('modal-aksi-transaksi'));
                if (auth.currentUser) {
                    loadDashboardData(auth.currentUser.uid);
                    loadTransactionsPage(auth.currentUser.uid);
                }
            } catch(e) {
                alert("Gagal menghapus: " + e.message);
            }
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



// Halaman Cek Data: menjalankan pembacaan setiap tab dan menampilkan hasilnya untuk admin.
const CEK = [
  { k: 'proyek', fn: () => normalizeProyek, guna: 'Daftar proyek, PIC, akhir penugasan', n: (d) => d.length },
  { k: 'personil', fn: () => normalizePersonil, guna: 'Personil per PSO, daftar nama di Input MM', n: (d) => d.length },
  { k: 'mm', fn: () => normalizeMM, guna: 'Rencana man-month per bulan', n: (d) => d.rows.length, extra: (d) => `${d.months.length} kolom bulan` },
  { k: 'tad', fn: () => normalizeTad, guna: 'Permintaan TAD', n: (d) => d.length },
  { k: 'adkon', fn: () => normalizeAdkon, guna: 'Pagu & realisasi RBT/MM per penugasan', n: (d) => d.length },
  { k: 'datalist', fn: () => normalizeDatalist, guna: 'Progres proyek (Monitoring Progress)', n: (d) => (Array.isArray(d) ? d.length : (d.rows || d.packages || []).length) },
  { k: 'mmAktual', fn: () => normalizeMmAktual, guna: 'Aktual man-month hasil input web', n: (d) => d.length, optional: true },
];
const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function cekSemua() {
  const body = document.getElementById('cek-body');
  body.innerHTML = CEK.map((c) => `<tr id="cek-${c.k}"><td><b>${escH(SOURCES[c.k].sheet)}</b></td><td>${escH(c.guna)}</td><td>memeriksa…</td><td></td></tr>`).join('');
  await Promise.all(CEK.map(async (c) => {
    const tr = document.getElementById('cek-' + c.k);
    let st, ket;
    try {
      const d = await parseSheet(SOURCES[c.k], c.fn());
      const n = c.n(d);
      if (n > 0) { st = '<span class="ok">OK</span>'; ket = `${n} baris terbaca${c.extra ? ' · ' + c.extra(d) : ''}`; }
      else if (c.optional) { st = '<span class="warn">KOSONG</span>'; ket = 'Belum ada data. Tab ini terisi otomatis setelah ada kiriman dari halaman Input MM.'; }
      else { st = '<span class="warn">KOSONG</span>'; ket = 'Tab terbaca tetapi tidak ada baris data. Periksa isi sheet asal.'; }
    } catch (e) { st = '<span class="bad">GAGAL</span>'; ket = e.message; }
    tr.children[2].innerHTML = st; tr.children[3].textContent = ket;
  }));
  const tr = document.createElement('tr');
  let st = '<span class="warn">BELUM DIPASANG</span>', ket = 'INPUT_URL di site/js/config.js masih kosong (lihat PANDUAN_ADMIN.md bagian C).';
  if (INPUT_URL) {
    try { const j = await (await fetch(INPUT_URL)).json(); st = j.ok ? '<span class="ok">OK</span>' : '<span class="bad">GAGAL</span>'; ket = j.info || j.error || ''; }
    catch (e) { st = '<span class="bad">GAGAL</span>'; ket = 'Penerima tidak menjawab. Periksa deployment Apps Script (akses harus "Anyone").'; }
  }
  tr.innerHTML = `<td><b>Penerima input web</b></td><td>Menyimpan kiriman halaman Input MM dan Input Data Lain</td><td>${st}</td><td>${escH(ket)}</td>`;
  body.appendChild(tr);
}
document.getElementById('cek-sheet').href = `https://docs.google.com/spreadsheets/d/${DATA_ID}/edit`;
document.getElementById('cek-ulang').onclick = cekSemua;
cekSemua();

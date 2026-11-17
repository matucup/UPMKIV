// Halaman input Man-Month aktual: per bulan, per PSO, jumlah pegawai + jumlah TAD (MM = pegawai + TAD). Dikirim ke Apps Script.
const $ = (id) => document.getElementById(id);
const num = (el) => { const v = parseFloat(el.value); return Number.isFinite(v) ? v : 0; };
function msg(text, ok) { const m = $('in-msg'); m.hidden = false; m.className = 'in-msg ' + (ok ? 'ok' : 'err'); m.textContent = text; }

function hitung() {
  let p = 0, t = 0;
  for (const tr of $('in-rows').children) {
    const a = num(tr.querySelector('.r-peg')), b = num(tr.querySelector('.r-tad'));
    tr.querySelector('.r-mm').textContent = a + b; p += a; t += b;
  }
  $('t-peg').textContent = p; $('t-tad').textContent = t; $('t-mm').textContent = p + t;
}

function buatBaris() {
  $('in-rows').innerHTML = PSO_RESMI.map((p) => `<tr data-pso="${p}"><td>${p}</td><td><input class="r-peg" type="number" min="0" max="500" step="1" inputmode="numeric" placeholder="0"></td><td><input class="r-tad" type="number" min="0" max="500" step="1" inputmode="numeric" placeholder="0"></td><td class="r-mm">0</td></tr>`).join('');
  $('in-rows').oninput = hitung; hitung();
}

async function kirim(ev) {
  ev.preventDefault();
  if (!INPUT_URL) return msg('Alamat penerima (INPUT_URL di config.js) belum diisi.', false);
  const rows = [];
  for (const tr of $('in-rows').children) {
    const pi = tr.querySelector('.r-peg'), ti = tr.querySelector('.r-tad');
    if (pi.value === '' && ti.value === '') continue;  // PSO yang dikosongkan tidak dikirim
    const a = num(pi), b = num(ti);
    if (a < 0 || b < 0) return msg('Jumlah tidak boleh negatif.', false);
    rows.push({ Bulan: $('in-bulan').value, PSO: tr.dataset.pso, Pegawai: a, TAD: b, MM: a + b });
  }
  if (!rows.length) return msg('Belum ada angka yang diisi.', false);
  const btn = $('in-send'); btn.disabled = true; btn.textContent = 'Mengirim…';
  try {
    const res = await fetch(INPUT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ pin: $('in-pin').value, tab: 'MM_Aktual', rows }) });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || 'Ditolak');
    msg(`Tersimpan: ${j.baru} baris baru, ${j.diperbarui} diperbarui. Buka Beranda lalu klik Muat ulang untuk melihat grafiknya.`, true);
    buatBaris();
  } catch (e) { msg('Gagal mengirim: ' + e.message, false); }
  btn.disabled = false; btn.textContent = 'Kirim';
}

(function () {
  if (!INPUT_URL) { const w = $('in-warn'); w.hidden = false; w.textContent = 'Penerima data belum dipasang (INPUT_URL kosong di config.js). Formulir bisa dicoba, tetapi belum bisa mengirim.'; }
  $('in-bulan').value = new Date().toISOString().slice(0, 7);
  buatBaris();
  $('in-form').onsubmit = kirim;
})();

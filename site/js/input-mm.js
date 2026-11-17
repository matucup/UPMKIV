// Halaman input Man-Month aktual (uji coba): daftar personil dibaca dari tab Personil, data dikirim ke Apps Script.
let PERSONIL = [];
const $ = (id) => document.getElementById(id);

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function msg(text, ok) { const m = $('in-msg'); m.hidden = false; m.className = 'in-msg ' + (ok ? 'ok' : 'err'); m.textContent = text; }

function addRow() {
  const row = document.createElement('div');
  row.className = 'in-row';
  const names = [...new Set(PERSONIL.map((p) => p.nama))].sort((a, b) => a.localeCompare(b, 'id'));
  row.innerHTML =
    '<div><label>Nama personil</label><select class="r-nama"><option value="">Pilih…</option>' + names.map((n) => '<option>' + esc(n) + '</option>').join('') + '</select></div>' +
    '<div><label>Proyek</label><select class="r-proyek"><option value="">Pilih nama dulu</option></select></div>' +
    '<div><label>MM</label><input class="r-mm" type="number" min="0" max="2" step="0.01" placeholder="1"></div>' +
    '<button type="button" class="btn r-del" title="Hapus baris" aria-label="Hapus baris">×</button>';
  const selN = row.querySelector('.r-nama'), selP = row.querySelector('.r-proyek');
  selN.onchange = () => {
    const ps = [...new Set(PERSONIL.filter((p) => p.nama === selN.value).map((p) => p.proyek).filter(Boolean))];
    selP.innerHTML = ps.length ? ps.map((p) => '<option>' + esc(p) + '</option>').join('') : '<option value="">(proyek kosong di Personil)</option>';
  };
  row.querySelector('.r-del').onclick = () => { if ($('in-rows').children.length > 1) row.remove(); };
  $('in-rows').appendChild(row);
}

async function kirim(ev) {
  ev.preventDefault();
  if (!INPUT_URL) return msg('Alamat penerima (INPUT_URL di config.js) belum diisi.', false);
  const rows = [];
  for (const r of $('in-rows').children) {
    const nama = r.querySelector('.r-nama').value, proyek = r.querySelector('.r-proyek').value, mm = r.querySelector('.r-mm').value;
    if (!nama && !proyek && mm === '') continue;
    if (!nama || !proyek || mm === '') return msg('Lengkapi nama, proyek, dan MM di setiap baris (atau hapus baris kosong).', false);
    const p = PERSONIL.find((x) => x.nama === nama && x.proyek === proyek);
    if (+mm < 0 || +mm > 2) return msg('MM per baris harus antara 0 dan 2.', false);
    rows.push({ Bulan: $('in-bulan').value, Nama: nama, PSO: p ? p.pso : '', Proyek: proyek, MM: +mm });
  }
  if (!rows.length) return msg('Belum ada baris yang diisi.', false);
  const btn = $('in-send'); btn.disabled = true; btn.textContent = 'Mengirim…';
  try {
    const res = await fetch(INPUT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ pin: $('in-pin').value, tab: 'MM_Aktual', rows }) });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || 'Ditolak');
    msg('Tersimpan: ' + j.baru + ' baris baru, ' + j.diperbarui + ' diperbarui.', true);
    $('in-rows').innerHTML = ''; addRow();
  } catch (e) { msg('Gagal mengirim: ' + e.message, false); }
  btn.disabled = false; btn.textContent = 'Kirim';
}

(async function () {
  const w = $('in-warn');
  if (!INPUT_URL) { w.hidden = false; w.textContent = 'Penerima data belum dipasang (INPUT_URL kosong di config.js). Formulir bisa dicoba, tetapi belum bisa mengirim.'; }
  $('in-bulan').value = new Date().toISOString().slice(0, 7);
  try { PERSONIL = await parseSheet(SOURCES.personil, normalizePersonil); }
  catch (e) { w.hidden = false; w.textContent = 'Daftar personil gagal dimuat: ' + e.message; }
  addRow();
  $('in-add').onclick = addRow;
  $('in-form').onsubmit = kirim;
})();

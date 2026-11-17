// Halaman Input Data: formulir umum untuk tab-tab input di spreadsheet induk. Nama kolom (n) harus sama persis dengan judul kolom di tab.
// t: text | area | num | pct | date | month | pso | paket | pilih (dengan o: [...]).  k: true = kolom kunci.
const FORMS = [
  { tab: 'Progres_Bulanan', label: 'Progres proyek bulanan', ket: 'Satu baris per paket per periode. Tampil di Monitoring Progress.', f: [
    { n: 'Periode', t: 'month', k: true }, { n: 'ID_Paket', t: 'paket', k: true }, { n: 'Milestone', t: 'pilih', o: ['', 'Konstruksi', 'RLB', 'Energize', 'SLO', 'BAST1', 'BAST2'] },
    { n: 'Progres_Aktual', t: 'pct' }, { n: 'Progres_Plan', t: 'pct' }, { n: 'Tgl_Data', t: 'date' }, { n: 'Aktivitas_Periode', t: 'area' }] },
  { tab: 'Isu', label: 'Isu / kendala proyek', ket: 'Menutup isu: kirim ulang ID_Isu yang sama dengan Status_Isu = Closed.', f: [
    { n: 'ID_Isu', t: 'text', k: true, h: 'mis. ISU-001' }, { n: 'ID_Paket', t: 'paket' }, { n: 'Kategori', t: 'text' }, { n: 'Status_Isu', t: 'pilih', o: ['Open', 'Closed'] },
    { n: 'PIC_Tindak_Lanjut', t: 'text' }, { n: 'Target_Selesai', t: 'date' }, { n: 'Detail_Isu', t: 'area' }, { n: 'Tindak_Lanjut', t: 'area' }] },
  { tab: 'Dokumen_Milestone', label: 'Dokumen milestone (RLB, Energize, SLO, BAST)', f: [
    { n: 'ID_Paket', t: 'paket', k: true }, { n: 'Jenis_Dokumen', t: 'pilih', k: true, o: ['RLB', 'Energize', 'SLO', 'BAST 1', 'BAST 2'] },
    { n: 'Nomor_Dokumen', t: 'text' }, { n: 'Tanggal_Dokumen', t: 'date' }, { n: 'Keterangan_Asli', t: 'area' }] },
  { tab: 'Proyek', label: 'Paket proyek (data induk paket)', ket: 'Isi sekali per paket; ID_Paket dipakai oleh formulir Progres, Isu, dan Dokumen.', f: [
    { n: 'ID_Paket', t: 'text', k: true, h: 'mis. S17140-1' }, { n: 'Kode_Lokasi', t: 'text' }, { n: 'No_Paket', t: 'text' }, { n: 'PSO', t: 'pso' },
    { n: 'Jenis', t: 'pilih', o: ['', 'GI', 'TL', 'GITET', 'SUTET', 'Lainnya'] }, { n: 'Nama_Proyek', t: 'text', w: true, req: true }, { n: 'Kontraktor', t: 'text' },
    { n: 'Direksi_Pekerjaan', t: 'text' }, { n: 'Pemberi_Tugas', t: 'text' }, { n: 'No_Kontrak', t: 'text' }, { n: 'Akhir_Penugasan', t: 'date' },
    { n: 'COD_Kontrak', t: 'date' }, { n: 'COD_Amandemen', t: 'date' }, { n: 'Bank_Garansi_s.d.', t: 'date' }, { n: 'Nilai_Kontrak_Akhir', t: 'num', h: 'rupiah, angka saja' },
    { n: 'Kapasitas', t: 'num' }, { n: 'Satuan', t: 'text', h: 'kmr, MVA, ...' }, { n: 'Detail_Lingkup', t: 'area' }] },
  { tab: 'Laporan_KPI', label: 'Laporan: KPI / kinerja', f: [
    { n: 'Kelompok', t: 'text', k: true }, { n: 'Indikator', t: 'text', k: true }, { n: 'Nilai', t: 'num' }, { n: 'Satuan', t: 'text' },
    { n: 'Tampilkan', t: 'pilih', o: ['Ya', 'Tidak'] }, { n: 'Keterangan', t: 'area' }] },
  { tab: 'Matlev_ERM', label: 'Laporan: Matlev / K3 / ERM', f: [
    { n: 'Kelompok', t: 'text', k: true }, { n: 'Program', t: 'text', k: true }, { n: 'Status', t: 'pilih', o: ['Terlaksana', 'Dalam proses', 'Belum'] }] },
  { tab: 'Kepatuhan', label: 'Laporan: kepatuhan', f: [
    { n: 'Indikator', t: 'text', k: true }, { n: 'Terlapor', t: 'num' }, { n: 'Wajib', t: 'num' }] },
  { tab: 'IDD_Mitra', label: 'Laporan: IDD mitra', f: [
    { n: 'Mitra', t: 'text', k: true }, { n: 'Tanggal_IDD', t: 'date' }, { n: 'IDD_Ulang', t: 'date' }, { n: 'Penilaian_Risiko', t: 'text' }, { n: 'Mitigasi', t: 'area' }] },
  { tab: 'Kegiatan', label: 'Laporan: kegiatan khusus', f: [
    { n: 'Tanggal', t: 'date', k: true }, { n: 'Kegiatan', t: 'text', k: true, w: true }, { n: 'Kategori', t: 'text' }] },
  { tab: 'Kontrak_Status', label: 'Laporan: status kontrak', f: [
    { n: 'Uraian', t: 'text', k: true, w: true }, { n: 'Jumlah', t: 'num' }, { n: 'Nilai', t: 'num' }, { n: 'Volume', t: 'num' }, { n: 'Satuan', t: 'text' }, { n: 'Berakhir_Periode_Ini', t: 'num' }] },
  { tab: 'Pengalihan_Anggaran', label: 'Laporan: pengalihan anggaran', f: [
    { n: 'Pemberi_Kerja', t: 'text', k: true }, { n: 'Pengalihan', t: 'num' }, { n: 'Realisasi_Biaya', t: 'num' }] },
];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let PAKET = [];
function msg(text, ok) { const m = $('in-msg'); m.hidden = false; m.className = 'in-msg ' + (ok ? 'ok' : 'err'); m.textContent = text; }
const form = () => FORMS[+$('in-jenis').value];

function control(f, i) {
  const id = `f-${i}`, req = f.k || f.req ? ' required' : '';
  const opts = (list) => list.map((o) => (Array.isArray(o) ? `<option value="${esc(o[0])}">${esc(o[1])}</option>` : `<option value="${esc(o)}">${esc(o || '(kosong)')}</option>`)).join('');
  if (f.t === 'area') return `<textarea id="${id}" rows="3"></textarea>`;
  if (f.t === 'pilih') return `<select id="${id}"${req}>${opts(f.o)}</select>`;
  if (f.t === 'pso') return `<select id="${id}"${req}>${opts([''].concat(PSO_RESMI))}</select>`;
  if (f.t === 'paket') {
    return PAKET.length ? `<select id="${id}"${req}>${opts([['', 'Pilih paket…']].concat(PAKET.map((p) => [p.ID_Paket, `${p.ID_Paket} · ${p.Nama_Proyek}`])))}</select>`
      : `<input id="${id}" type="text"${req} placeholder="ID paket"><small>Daftar paket kosong: isi dulu formulir "Paket proyek".</small>`;
  }
  const type = { num: 'number', pct: 'number', date: 'date', month: 'month' }[f.t] || 'text';
  const more = f.t === 'pct' ? ' min="0" max="100" step="0.01" placeholder="0-100"' : f.t === 'num' ? ' step="any"' : '';
  return `<input id="${id}" type="${type}"${req}${more}${f.h ? ` placeholder="${esc(f.h)}"` : ''}>`;
}

function render() {
  const F = form();
  $('in-ket').textContent = `Tab: ${F.tab}. ${F.ket || ''}`;
  $('in-fields').innerHTML = F.f.map((f, i) => `<div class="${f.t === 'area' || f.w ? 'wide' : ''}"><label for="f-${i}">${esc(f.n.replace(/_/g, ' '))}${f.k ? ' <i>*</i>' : ''}${f.t === 'pct' ? ' (%)' : ''}</label>${control(f, i)}</div>`).join('');
}

async function kirim(ev) {
  ev.preventDefault();
  if (!INPUT_URL) return msg('Alamat penerima (INPUT_URL di config.js) belum diisi.', false);
  const F = form(), row = {};
  F.f.forEach((f, i) => {
    const v = $('f-' + i).value.trim();
    if (v === '') return;  // kolom kosong tidak dikirim: nilai lama di sheet dipertahankan
    row[f.n] = f.t === 'num' ? +v : f.t === 'pct' ? `${v}%` : f.t === 'month' ? `${v}-01` : v;
  });
  const btn = $('in-send'); btn.disabled = true; btn.textContent = 'Mengirim…';
  try {
    const res = await fetch(INPUT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ pin: $('in-pin').value, tab: F.tab, rows: [row] }) });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || 'Ditolak');
    msg(j.diperbarui ? `Tersimpan di tab ${F.tab}: data lama dengan kunci yang sama diperbarui.` : `Tersimpan di tab ${F.tab}: 1 baris baru.`, true);
    if (F.tab === 'Proyek') await muatPaket();
    render();
  } catch (e) { msg('Gagal mengirim: ' + e.message, false); }
  btn.disabled = false; btn.textContent = 'Kirim';
}

async function muatPaket() {
  try { PAKET = (await parseSheet(SOURCES.lap_proyek, (g) => normalizeTable(g, ['ID_Paket', 'Nama_Proyek']))).filter((p) => p.ID_Paket); } catch (e) { PAKET = []; }
}

(async function () {
  if (!INPUT_URL) { const w = $('in-warn'); w.hidden = false; w.textContent = 'Penerima data belum dipasang (INPUT_URL kosong di config.js). Formulir bisa dilihat, tetapi belum bisa mengirim.'; }
  $('in-jenis').innerHTML = FORMS.map((F, i) => `<option value="${i}">${esc(F.label)}</option>`).join('');
  const want = new URLSearchParams(location.search).get('tab');
  const at = FORMS.findIndex((F) => F.tab === want);
  if (at >= 0) $('in-jenis').value = at;
  await muatPaket();
  render();
  $('in-jenis').onchange = () => { $('in-msg').hidden = true; render(); };
  $('in-form').onsubmit = kirim;
})();

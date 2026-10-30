const MONTHS_ID = {
  jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2, apr: 3, april: 3, mei: 4,
  jun: 5, juni: 5, jul: 6, juli: 6, agu: 7, agt: 7, ags: 7, agustus: 7,
  sep: 8, sept: 8, september: 8, okt: 9, oktober: 9, nov: 10, november: 10, des: 11, desember: 11,
  may: 4, aug: 7, august: 7, oct: 9, october: 9, dec: 11, december: 11, june: 5, july: 6, march: 2, january: 0, february: 1,
};

function parseDate(s) {
  s = String(s ?? '').trim();
  if (!s) return null;
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = /^(\d{1,2})[\s-]+([A-Za-z]+)\.?[\s-]+(\d{2,4})(?!\d)/.exec(s);
  if (m && MONTHS_ID[m[2].toLowerCase()] !== undefined) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return new Date(y, MONTHS_ID[m[2].toLowerCase()], +m[1]);
  }
  m = /^([A-Za-z]+)\s+(\d{4})$/.exec(s);
  if (m && MONTHS_ID[m[1].toLowerCase()] !== undefined) return new Date(+m[2], MONTHS_ID[m[1].toLowerCase()], 1);
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(s);
  if (m) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    const [a, b] = [+m[1], +m[2]];
    return a > 12 ? new Date(y, b - 1, a) : new Date(y, a - 1, b);
  }
  return null;
}

function parseNum(s) {
  s = String(s ?? '').trim().replace(/Rp|\s/g, '');
  if (!s || s.startsWith('#') || s === '-') return null;
  if (/^-?\d{1,3}(\.\d{3}){2,}$/.test(s)) s = s.replace(/\./g, '');
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const titleCase = (s) => (s && s === s.toUpperCase() ? s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : s);
const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/* Standarisasi nama PSO: satu nama resmi per PSO di seluruh sheet.
   - awalan "PSO " dibuang; nama gabungan ("Aceh, Sumut", "A & B", "A dan PSO B") diambil bagian pertamanya;
   - alias (mis. "Kepulauan Riau" -> Riau) dipetakan lewat PSO_ALIAS di config.js;
   - setiap perubahan isi atau nama yang tidak dikenal dicatat di PSO_LOG supaya terlihat di halaman. */
const PSO_LOG = new Map();

function canonPso(raw, src, ref) {
  const orig = clean(raw);
  if (!orig || orig === '-' || /^lainnya$/i.test(orig)) return orig === '-' ? '' : orig;
  const noPrefix = clean(orig.replace(/^PSO\s+/i, ''));
  const first = clean(noPrefix.split(/\s*(?:,|&|\/|\s+dan\s+(?:PSO\s+)?)\s*/i)[0]);
  const key = norm(first);
  const official = PSO_RESMI.find((n) => norm(n) === key);
  const canon = official || PSO_ALIAS[key] || titleCase(first);
  const changed = norm(canon) !== norm(noPrefix);
  const known = PSO_RESMI.includes(canon);
  if (changed || !known) {
    const k = `${src}\u0001${orig}`;
    const e = PSO_LOG.get(k) || { src, orig, canon, n: 0, known, refs: [] };
    e.n += 1;
    if (ref && e.refs.length < 3 && !e.refs.includes(clean(ref))) e.refs.push(clean(ref));
    PSO_LOG.set(k, e);
  }
  return canon;
}

// PSO kosong dicatat juga (baris tetap dipakai dengan PSO "Lainnya").
function logPsoBlank(src, ref) {
  const k = `${src}\u0001(kosong)`;
  const e = PSO_LOG.get(k) || { src, orig: '(kosong)', canon: 'Lainnya', n: 0, known: false, refs: [] };
  e.n += 1;
  if (ref && e.refs.length < 3 && !e.refs.includes(clean(ref))) e.refs.push(clean(ref));
  PSO_LOG.set(k, e);
}

function psoNotices() {
  const fixed = [], unknown = [];
  PSO_LOG.forEach((e) => (e.known ? fixed : unknown).push(e));
  const msgs = [];
  if (fixed.length) msgs.push(`Nama PSO disamakan otomatis: ${fixed.map((e) => `"${e.orig}" menjadi ${e.canon} (${e.src}, ${e.n} baris${e.refs.length ? `, mis. ${e.refs.join(' | ')}` : ''})`).join('; ')}. Sebaiknya diseragamkan juga di sheet sumbernya.`);
  const blank = unknown.filter((e) => e.orig === '(kosong)');
  unknown.splice(0, unknown.length, ...unknown.filter((e) => e.orig !== '(kosong)'));
  if (blank.length) msgs.push(`Kolom PSO kosong: ${blank.map((e) => `${e.src}, ${e.n} baris${e.refs.length ? ` (mis. ${e.refs.join(' | ')})` : ''}`).join('; ')}. Baris ini dihitung sebagai "Lainnya".`);
  if (unknown.length) msgs.push(`PSO tidak dikenal: ${unknown.map((e) => `"${e.orig}" (${e.src}, ${e.n} baris${e.refs.length ? `, mis. ${e.refs.join(' | ')}` : ''})`).join('; ')}. Tambahkan alias di js/config.js (PSO_ALIAS) bila itu penulisan lain dari PSO yang ada.`);
  return msgs;
}

function findHeader(grid, required) {
  const need = required.map(norm);
  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const cells = grid[r].map(norm);
    if (need.every((n) => cells.includes(n))) {
      const index = {};
      grid[r].forEach((c, i) => { const k = norm(c); if (k && !(k in index)) index[k] = i; });
      return { row: r, index, cells: grid[r] };
    }
  }
  return null;
}

const cellAt = (row, h, name) => (h.index[norm(name)] === undefined ? '' : clean(row[h.index[norm(name)]]));

function normalizeProyek(grid) {
  const h = findHeader(grid, ['PSO', 'Judul Surat Penugasan']);
  if (!h) throw new Error('Header Daftar Proyek tidak ditemukan');
  const today = new Date();
  const out = [];
  for (const row of grid.slice(h.row + 1)) {
    const g = (n) => cellAt(row, h, n);
    const judul = g('Judul Surat Penugasan').replace(/^\(TBA\)$/i, '');
    const epc = g('Proyek EPC');
    const kode = g('Kode Lokasi');
    if (!judul && !kode && !epc) continue;
    const pso = canonPso(g('PSO'), 'Daftar Proyek', g('Kode Lokasi')) || '-';
    const akhir = parseDate(g('Akhir Penugasan')) || parseDate(g('COD Amandemen')) || parseDate(g('COD Kontrak'));
    const daysLeft = akhir ? Math.ceil((akhir - today) / 864e5) : null;
    const status = daysLeft === null ? (g('PIC') ? 'Tanpa tanggal' : 'Belum ditugaskan') : daysLeft < 0 ? 'Berakhir' : daysLeft <= 90 ? 'Segera berakhir' : 'Berjalan';
    out.push({
      pso, pic: g('PIC'), jenis: g('Jenis'), kode, nama: epc || judul, provinsi: titleCase(g('Provinsi')), akhir, daysLeft, status,
      _f: [
        ['PSO', pso], ['PIC', g('PIC')], ['PC', g('PC')], ['SC', g('SC')], ['Jenis', g('Jenis')],
        ['Kode Lokasi', kode], ['Proyek', epc], ['Judul Surat Penugasan', judul], ['Nomor Surat Penugasan', g('Nomor Surat Penugasan')],
        ['Provinsi', titleCase(g('Provinsi'))], ['User Pengguna Jasa', g('User Pengguna Jasa')],
        ['Direksi Lapangan', g('Direksi Lapangan')], ['Durasi (bulan)', g('Durasi')], ['Awal Penugasan', g('Awal Penugasan')],
        ['Akhir Penugasan', g('Akhir Penugasan')], ['Tanggal Kontrak', g('Tanggal Kontrak')],
        ['Efektif Kontrak', g('Efektif Kontrak')], ['COD Kontrak', g('COD Kontrak')],
        ['COD Amandemen', g('COD Amandemen')], ['EOT ke-', g('EOT ke-')], ['Status', status],
      ],
    });
  }
  return out;
}

function normalizePersonil(grid) {
  const h = findHeader(grid, ['NAMA', 'PSO', 'PENUGASAN']);
  if (!h) throw new Error('Header Personil tidak ditemukan');
  const out = [];
  for (const row of grid.slice(h.row + 1)) {
    const nama = cellAt(row, h, 'NAMA');
    if (!nama) continue;
    const proyek = cellAt(row, h, 'PROYEK');
    const g = (n) => cellAt(row, h, n);
    out.push({
      nama, pso: canonPso(g('PSO'), 'Personil', nama) || '-', penugasan: g('PENUGASAN'), kualifikasi: g('KUALIFIKASI'), proyek,
      _f: [['Nama', nama], ['PSO', g('PSO')], ['Penugasan', g('PENUGASAN')], ['Kualifikasi', g('KUALIFIKASI')],
        ['Proyek', proyek], ['Tanggal Awal Bergabung', g('TANGGAL AWAL BERGABUNG')]],
    });
  }
  return out;
}

function normalizeMM(grid) {
  const h = findHeader(grid, ['PSO', 'Proyek', 'Posisi']);
  if (!h) throw new Error('Header Man-Month tidak ditemukan');
  const months = [];
  h.cells.forEach((c, i) => {
    const m = /^([A-Za-z]{3})\s*['’‘]\s*(\d{2})$/.exec(clean(c));
    if (m && MONTHS_ID[m[1].toLowerCase()] !== undefined) {
      months.push({ col: i, label: clean(c), y: 2000 + +m[2], m: MONTHS_ID[m[1].toLowerCase()] });
    }
  });
  const rows = [];
  for (const row of grid.slice(h.row + 1)) {
    const pso = cellAt(row, h, 'PSO');
    const proyek = cellAt(row, h, 'Proyek');
    if (!pso || !proyek) continue;
    const vals = months.map((mo) => parseNum(row[mo.col]) || 0);
    rows.push({
      pso: canonPso(pso, 'LIVE_MM', proyek), proyek, posisi: cellAt(row, h, 'Posisi'), keahlian: cellAt(row, h, 'Keahlian'),
      kualifikasi: cellAt(row, h, 'Kualifikasi Dalam SLA') || cellAt(row, h, 'Kualifikasi Maks'), vals,
    });
  }
  return { months, rows };
}

function normalizeTad(grid) {
  const h = findHeader(grid, ['No.', 'Nomor Surat', 'Kualifikasi Personil (Maksimum)']);
  if (!h) throw new Error('Header Permintaan TAD tidak ditemukan');
  const out = [];
  for (const row of grid.slice(h.row + 1)) {
    const no = cellAt(row, h, 'No.');
    const g = (n) => cellAt(row, h, n);
    if (!/^\d+$/.test(no) && !(g('Nomor Surat') && g('Kualifikasi Personil (Maksimum)'))) continue;
    const late = parseNum(g('Hari Kerja Terlambat'));
    out.push({
      no, surat: g('Nomor Surat'), tanggal: g('Tanggal'), kualifikasi: g('Kualifikasi Personil (Maksimum)'),
      bidang: g('Bidang'), peruntukan: g('Peruntukan'), hasil: g('Hasil'), nama: g('Nama Personil'),
      mobilisasi: g('Mobilisasi'), target: g('Target Ketersediaan'), late: late ?? 0, keterangan: g('Keterangan'),
      _f: [['No.', no], ['Nomor Surat Permintaan', g('Nomor Surat')], ['Tanggal Permintaan', g('Tanggal')],
        ['Kualifikasi Maksimum', g('Kualifikasi Personil (Maksimum)')], ['Jumlah', g('Jumlah')], ['Bidang', g('Bidang')],
        ['Peruntukan', g('Peruntukan')], ['Hasil Evaluasi', g('Hasil')], ['Nama Personil', g('Nama Personil')],
        ['Tanggal Mobilisasi', g('Mobilisasi')], ['Target Ketersediaan', g('Target Ketersediaan')],
        ['Hari Kerja Terlambat', g('Hari Kerja Terlambat')], ['Keterangan', g('Keterangan')],
        ['Keterangan Tambahan', g('Keterangan Tambahan')]],
    });
  }
  return out;
}

function parsePct(s) {
  s = String(s ?? '').trim();
  if (!s || s.startsWith('#')) return null;
  const n = parseNum(s.replace('%', ''));
  if (n === null) return null;
  return s.endsWith('%') ? n : n <= 1 ? n * 100 : n;
}

const daysUntil = (d) => (d ? Math.ceil((d - new Date()) / 864e5) : null);
const DEV_GREEN = -5;
const DEV_YELLOW = -10;

function progressStatus(aktual, plan) {
  if (aktual === null || plan === null) return 'Belum dilaporkan';
  if (aktual >= 100 && plan >= 100) return 'Selesai';
  if (aktual === 0 && plan === 0) return 'Belum mulai';
  const dev = aktual - plan;
  return dev >= DEV_GREEN ? 'Hijau' : dev >= DEV_YELLOW ? 'Kuning' : 'Merah';
}

function makePackage(o) {
  const aktual = parsePct(o.aktual);
  const plan = parsePct(o.plan);
  const periode = parseDate(o.periode);
  const penugasanSd = parseDate(o.penugasanSd);
  const cod = parseDate(o.codAmd) || parseDate(o.codKontrak);
  const dev = aktual !== null && plan !== null ? aktual - plan : null;
  const status = progressStatus(aktual, plan);
  return {
    id: o.id, kode: o.kode, no: o.no, pso: canonPso(o.pso, 'Proyek (template)') || 'Lainnya', jenis: o.jenis, milestone: o.milestone, nama: o.nama,
    kontraktor: o.kontraktor, direksi: o.direksi, pemberi: o.pemberi, noKontrak: o.noKontrak, aktual, plan, dev, status,
    periode, ageDays: periode ? -daysUntil(periode) : null, penugasanSd, cod, garansi: parseDate(o.garansi),
    nilai: parseNum(o.nilai), aktivitas: o.aktivitas, issues: o.issues, lingkup: o.lingkup, dokumen: o.dokumen || [],
    habisSebelumCod: !!(penugasanSd && cod && penugasanSd < cod && aktual !== null && aktual < 100),
    _f: [
      ['Kode Lokasi', o.kode], ['No. Paket', o.no], ['PSO', o.pso], ['Jenis', o.jenis], ['Milestone', o.milestone],
      ['Nama Proyek', o.nama], ['Pemberi Tugas', o.pemberi], ['Direksi Pekerjaan', o.direksi], ['Kontraktor', o.kontraktor],
      ['No. Kontrak', o.noKontrak], ['Nilai Kontrak Akhir', o.nilai], ['Progres Aktual', o.aktual], ['Progres Plan', o.plan],
      ['Deviasi (poin)', dev === null ? '' : dev.toFixed(2)], ['Status (aturan dashboard)', status], ['Data per', o.periode],
      ['Penugasan s.d.', o.penugasanSd], ['COD Kontrak', o.codKontrak], ['COD Amandemen', o.codAmd], ['Bank Garansi s.d.', o.garansi],
      ['Lingkup', o.lingkup], ['Aktivitas periode ini', o.aktivitas],
      ...o.issues.flatMap((x, i) => [[`Isu ${i + 1}`, x.kategori], [`Detail isu ${i + 1}`, x.detail], [`Tindak lanjut ${i + 1}`, x.tl]]),
      ...o.dokumen.map((x) => [x.jenis, x.isi]),
    ],
  };
}

function normalizeDatalist(grid) {
  const h = findHeader(grid, ['Kode Lokasi', 'Nama Proyek', 'Progres Aktual (%)']);
  if (!h) throw new Error('Header Datalist tidak ditemukan');
  const out = [];
  for (const row of grid.slice(h.row + 1)) {
    const g = (n) => cellAt(row, h, n);
    if (!g('Nama Proyek')) continue;
    if (h.index[norm('UPMK')] !== undefined && g('UPMK') && norm(g('UPMK')) !== norm(UPMK_SAYA)) continue; // sheet bersama banyak UPMK
    const pst = g('PSO') || g('PST');
    const pso = canonPso(pst, 'Datalist_Pusmanpro', `${g('Kode Lokasi')} ${g('Nama Proyek')}`) || 'Lainnya';
    if (!pst) logPsoBlank('Datalist_Pusmanpro', `${g('Kode Lokasi')} ${g('Nama Proyek')}`);
    const issues = [];
    for (let i = 1; i <= 5; i++) {
      const kat = g('Kategori' + i);
      if (kat && !/^tidak ada isu$/i.test(kat)) issues.push({ kategori: kat, detail: g('Detail' + i), tl: g('Tindaklanjut' + i) });
    }
    out.push(makePackage({
      kode: g('Kode Lokasi'), no: g('No'), pso, jenis: g('Jenis'), milestone: g('Milestone'), nama: g('Nama Proyek'),
      kontraktor: g('Kontraktor'), direksi: g('Direksi Pekerjaan'), pemberi: g('Pemberi Tugas'), noKontrak: g('No Kontrak'),
      aktual: g('Progres Aktual (%)'), plan: g('Progres Plan(%)'), periode: g('Periode'), penugasanSd: g('Jangka Waktu Penugasan'),
      codAmd: g('COD Amandemen'), codKontrak: g('COD Kontrak'), garansi: g('Masa Berlaku Bank Garansi'), nilai: g('Nilai Kontrak Akhir'),
      aktivitas: g('Aktivitas'), issues, lingkup: `${g('Detail')} ${g('Kapasitas') ? `(${g('Kapasitas')} ${g('Satuan Kapasitas')})` : ''}`.trim(),
      dokumen: [['RLB', 'RLB'], ['Energize', 'Energize'], ['SLO', 'SLO'], ['BAST 1', 'BAST 1'], ['BAST 2', 'BAST 2']].map(([jenis, c]) => ({ jenis, isi: g(c) })).filter((x) => x.isi && x.isi !== '-'),
    }));
  }
  return out;
}

// Gabungan tab Proyek + Progres_Bulanan + Isu dari template Google Sheet (format tabel panjang)
function buildFromTemplate(proyek, progres, isu, dokumen) {
  const latest = new Map();
  for (const r of progres) {
    const d = parseDate(r.Periode);
    const cur = latest.get(r.ID_Paket);
    if (r.ID_Paket && d && (!cur || d > cur.d)) latest.set(r.ID_Paket, { d, r });
  }
  return proyek.filter((p) => p.ID_Paket && p.Nama_Proyek).map((p) => {
    const pr = (latest.get(p.ID_Paket) || { r: {} }).r;
    const issues = isu.filter((x) => x.ID_Paket === p.ID_Paket && !/^closed$/i.test(x.Status_Isu)).map((x) => ({ kategori: x.Kategori, detail: x.Detail_Isu, tl: x.Tindak_Lanjut, pic: x.PIC_Tindak_Lanjut, target: x.Target_Selesai, status: x.Status_Isu || 'Open' }));
    return makePackage({
      id: p.ID_Paket, kode: p.Kode_Lokasi, no: p.No_Paket, pso: p.PSO, jenis: p.Jenis, milestone: pr.Milestone || '', nama: p.Nama_Proyek, kontraktor: p.Kontraktor,
      direksi: p.Direksi_Pekerjaan, pemberi: p.Pemberi_Tugas, noKontrak: p.No_Kontrak, aktual: pr.Progres_Aktual, plan: pr.Progres_Plan,
      periode: pr.Tgl_Data || pr.Periode, penugasanSd: p.Akhir_Penugasan, codAmd: p.COD_Amandemen, codKontrak: p.COD_Kontrak,
      garansi: p['Bank_Garansi_s.d.'], nilai: p.Nilai_Kontrak_Akhir, aktivitas: pr.Aktivitas_Periode || '', issues,
      lingkup: `${p.Detail_Lingkup || ''} ${p.Kapasitas ? `(${p.Kapasitas} ${p.Satuan || ''})` : ''}`.trim(),
      dokumen: dokumen.filter((x) => x.ID_Paket === p.ID_Paket).map((x) => ({ jenis: x.Jenis_Dokumen, isi: [x.Nomor_Dokumen, x.Tanggal_Dokumen, x.Keterangan_Asli].filter(Boolean).join(' · ') })).filter((x) => x.isi),
    });
  });
}

function normalizeRekapPengawas(grid) {
  const start = grid.findIndex((r) => norm(r[0]) === 'pso');
  if (start < 0) throw new Error('Header Rekap Jumlah Pengawas tidak ditemukan');
  const rows = [];
  let total = null;
  for (const r of grid.slice(start + 1)) {
    const name = clean(r[0]);
    if (!name) continue;
    const n = (i) => parseNum(r[i]) ?? 0;
    const rec = { pso: titleCase(name), pc: clean(r[1]), sc: n(2), pengawas: n(3), tad: n(4), total: n(5), sebelum: { selesai: n(6), ongoing: n(7), idle: n(8), total: n(9) }, setelah: { selesai: n(10), ongoing: n(11), idle: n(12), total: n(13) }, rasio: parseNum(r[14]) };
    if (norm(name) === 'total') { total = rec; break; }
    if (/^(rasio)/i.test(name)) break;
    rows.push(rec);
  }
  return { rows, total };
}

function normalizePA(grid) {
  const h = findHeader(grid, ['No', 'Nama Proyek', 'No. PA']);
  if (!h) throw new Error('Header Monitoring PA tidak ditemukan');
  const sub = grid[h.row + 1] || [];
  const col = (name) => sub.findIndex((c) => norm(c) === name);
  const cPagu = col('pagu'), cReal = col('realisasi'), cSisa = col('sisa');
  if (cPagu < 0) throw new Error('Kolom Pagu tidak ditemukan');
  const projects = [];
  let cur = null, pa = '', tgl = '';
  for (const row of grid.slice(h.row + 2)) {
    const nama = cellAt(row, h, 'Nama Proyek');
    if (nama) { cur = { nama, items: [], pagu: 0, realisasi: 0 }; projects.push(cur); pa = ''; tgl = ''; }
    if (!cur) continue;
    pa = cellAt(row, h, 'No. PA') || pa;
    tgl = cellAt(row, h, 'Tanggal PA') || tgl;
    const kegiatan = cellAt(row, h, 'Nama Kegiatan');
    const pagu = parseNum(row[cPagu]);
    if (!kegiatan || pagu === null) continue;
    const real = cReal >= 0 ? parseNum(row[cReal]) ?? 0 : 0;
    cur.items.push({ pa, tgl, kegiatan, pagu, realisasi: real, sisa: cSisa >= 0 ? parseNum(row[cSisa]) : pagu - real });
    cur.pagu += pagu; cur.realisasi += real;
  }
  return projects;
}

function normalizePengadaan(grid) {
  const h = findHeader(grid, ['No', 'Nama Proyek', 'Lokasi Mess']);
  if (!h) throw new Error('Header Monitoring Pengadaan tidak ditemukan');
  const out = [];
  for (const row of grid.slice(h.row + 1)) {
    const g = (n) => cellAt(row, h, n);
    const nama = g('Nama Proyek');
    if (!nama) continue;
    const dates = (g('Akhir Kontrak Kendaraan (mobil/mtor)').match(/\d{1,2}[\s-][A-Za-z]{3,}[\s-]\d{2,4}/g) || []).map(parseDate).filter(Boolean);
    out.push({
      nama, mess: g('Lokasi Mess'), noMess: g('Nomor Kontrak Mess'), akhirMess: parseDate(g('Akhir Kontrak Mess')),
      dc: parseNum(g('Jumlah Kendaraan Double Cabin')) ?? 0, mpv: parseNum(g('Jumlah Kendaraan MPV')) ?? 0, motor: parseNum(g('Jumlah Motor')) ?? 0,
      akhirKendaraan: dates.length ? new Date(Math.max(...dates)) : null, akhirKendaraanTxt: g('Akhir Kontrak Kendaraan (mobil/mtor)'),
      laptop: parseNum(g('Jumlah Laptop')) ?? 0, printer: parseNum(g('Jumlah Printer')) ?? 0,
      _f: [['Proyek', nama], ['Lokasi mess', g('Lokasi Mess')], ['No. kontrak mess', g('Nomor Kontrak Mess')], ['Akhir kontrak mess', g('Akhir Kontrak Mess')],
        ['Double cabin', g('Jumlah Kendaraan Double Cabin')], ['MPV', g('Jumlah Kendaraan MPV')], ['Motor', g('Jumlah Motor')],
        ['Akhir kontrak kendaraan', g('Akhir Kontrak Kendaraan (mobil/mtor)')], ['Keterangan', g('Keterangan (Perbantukan UPP, dll)')],
        ['Laptop', g('Jumlah Laptop')], ['Printer', g('Jumlah Printer')], ['Peralatan lain', g('Peralatan Lainnya')], ['Keterangan lain', g('Keterangan Lain-lain')]],
    });
  }
  return out;
}

function mmWindow(mm) {
  const cur = new Date().getFullYear() * 12 + new Date().getMonth();
  let start = mm.months.findIndex((m) => m.y * 12 + m.m >= cur);
  if (start < 0) start = Math.max(0, mm.months.length - 6);
  return { start, end: Math.min(mm.months.length, start + 6), cur: mm.months.findIndex((m) => m.y * 12 + m.m === cur) };
}

function normalizeTable(grid, required) {
  const h = findHeader(grid, required);
  if (!h) throw new Error('Header tidak ditemukan');
  const cols = h.cells.map((c, i) => [clean(c), i]).filter(([c]) => c);
  return grid.slice(h.row + 1).filter((r) => r.some((c) => clean(c))).map((r) => Object.fromEntries(cols.map(([c, i]) => [c, clean(r[i])])));
}

function normalizeAdkon(grid) {
  const h = findHeader(grid, ['KODE LOKASI', 'NAMA PROYEK', 'REALISASI RBT']);
  if (!h) throw new Error('Header Adkon tidak ditemukan');
  const akhirCols = h.cells.map((c, i) => (norm(c) === 'akhir penugasan' ? i : -1)).filter((i) => i >= 0);
  const out = [];
  for (const row of grid.slice(h.row + 1)) {
    const g = (n) => cellAt(row, h, n);
    if (norm(g('UPMK New')) !== norm(UPMK_SAYA) || !g('KODE LOKASI')) continue;
    const rbt = parseNum(g('RENCANA BIAYA TUNAI (RBT)'));
    const real = parseNum(g('REALISASI RBT'));
    const pst = g('PSO Sesuai KEP GM') || g('PST Sesuai KEP GM');
    const lokasi = g('LOKASI');
    const akhir = akhirCols.map((i) => parseDate(row[i])).find(Boolean) || null;
    out.push({
      kode: g('KODE LOKASI'), nama: g('NAMA PROYEK'), judul: g('Judul STg'), noSurat: g('NOSurat Penugasan'), amandemen: g('Amandemen Terakhir'),
      status: g('STATUS'), jenis: g('JENIS'), subJenis: g('SUB SUB JENIS'), pso: (pst ? canonPso(pst, 'Adkon', `${g('KODE LOKASI')} ${g('NAMA PROYEK')}`) : canonPso(lokasi, 'Adkon (kolom LOKASI)', `${g('KODE LOKASI')} ${g('NAMA PROYEK')}`)) || 'Lainnya',
      rbt, realisasi: real, bulanIni: parseNum(g('REALISASI RBT BULAN INI')), periode: parseDate(g('PERIODE')),
      mulai: parseDate(g('Mulai Penugasan')), akhir, sisaMM: parseNum(g('SISA MAN-MONTH')),
      rencanaMM: parseNum(g('RENCANA MAN-MONTH (MM)')), realMM: parseNum(g('REALISASI MM')), mmBulanIni: parseNum(g('REALISASI MM BULAN INI')),
      serapan: rbt && real !== null ? (real / rbt) * 100 : null,
    });
  }
  return out;
}

const STATUS_RANK = { Merah: 0, Kuning: 1, Hijau: 2, 'Belum mulai': 3, Selesai: 4, 'Belum dilaporkan': 5 };

// Satu penugasan (surat penugasan, memegang biaya RBT) dapat memayungi banyak kontrak proyek (memegang progres fisik).
function buildPenugasan(adkon, kontrak) {
  const map = new Map();
  for (const a of adkon) map.set(a.kode, { kode: a.kode, adkon: a, kontrak: [] });
  for (const p of kontrak) {
    if (!map.has(p.kode)) map.set(p.kode, { kode: p.kode, adkon: null, kontrak: [] });
    map.get(p.kode).kontrak.push(p);
  }
  const wavg = (ks, f) => {
    const v = ks.filter((k) => f(k) !== null);
    if (!v.length) return null;
    const useVal = v.every((k) => k.nilai);
    const w = (k) => (useVal ? k.nilai : 1);
    return v.reduce((s, k) => s + f(k) * w(k), 0) / v.reduce((s, k) => s + w(k), 0);
  };
  return [...map.values()].map((e) => {
    const a = e.adkon;
    const ks = e.kontrak;
    const aktual = wavg(ks, (k) => k.aktual);
    const plan = wavg(ks, (k) => k.plan);
    const worst = ks.length ? ks.map((k) => k.status).sort((x, y) => STATUS_RANK[x] - STATUS_RANK[y])[0] : null;
    const akhir = (a && a.akhir) || (ks.find((k) => k.penugasanSd) || {}).penugasanSd || null;
    const cods = ks.filter((k) => k.cod && k.aktual !== null && k.aktual < 100).map((k) => k.cod);
    const codMax = cods.length ? new Date(Math.max(...cods)) : null;
    const first = ks[0] || {};
    return {
      kode: e.kode, adkon: a, kontrak: ks,
      nama: (a && a.nama) || first.nama || e.kode, judul: (a && a.judul) || '', noSurat: (a && a.noSurat) || '',
      pso: titleCase((a && a.pso) || first.pso || 'Lainnya'), jenis: (a && a.jenis) || first.jenis || '', statusAdkon: (a && a.status) || '',
      rbt: a ? a.rbt : null, realisasi: a ? a.realisasi : null, bulanIni: a ? a.bulanIni : null, serapan: a ? a.serapan : null,
      sisaMM: a ? a.sisaMM : null, rencanaMM: a ? a.rencanaMM : null, realMM: a ? a.realMM : null, mmBulanIni: a ? a.mmBulanIni : null,
      mulai: a ? a.mulai : null, amandemen: a ? a.amandemen : '',
      aktual, plan, dev: aktual !== null && plan !== null ? aktual - plan : null, worst, akhir, sisaHari: daysUntil(akhir), codMax,
      sel: a && a.serapan !== null && aktual !== null ? a.serapan - aktual : null,
      habisSebelumCod: !!(akhir && codMax && akhir < codMax),
      issues: ks.flatMap((k) => k.issues.map((x) => ({ ...x, k }))),
    };
  });
}

// Pagu RBT (rencana) vs realisasi per PSO. rows: penugasan/adkon yang punya field pso, rbt, realisasi.
function rbtPerPso(rows) {
  const m = new Map();
  for (const r of rows) {
    if (!r.rbt) continue;
    const name = titleCase(r.pso) || 'Lainnya';
    const k = norm(name);
    if (!m.has(k)) m.set(k, { pso: name, rbt: 0, real: 0, n: 0 });
    const e = m.get(k);
    e.rbt += r.rbt; e.real += r.realisasi || 0; e.n += 1;
  }
  return m;
}

// Pagu man-month (rencana MM) vs realisasi per PSO. rows: penugasan/adkon dengan field pso, rencanaMM, realMM.
function mmPerPso(rows) {
  const m = new Map();
  for (const r of rows) {
    if (!r.rencanaMM) continue;
    const name = r.pso || 'Lainnya';
    const k = norm(name);
    if (!m.has(k)) m.set(k, { pso: name, plan: 0, real: 0, bulanIni: 0, n: 0 });
    const e = m.get(k);
    e.plan += r.rencanaMM; e.real += r.realMM || 0; e.bulanIni += r.mmBulanIni || 0; e.n += 1;
  }
  return m;
}

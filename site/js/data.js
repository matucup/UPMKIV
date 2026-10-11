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
    const pso = titleCase(g('PSO')) || '-';
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
      nama, pso: titleCase(g('PSO')) || '-', penugasan: g('PENUGASAN'), kualifikasi: g('KUALIFIKASI'), proyek,
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
      pso: titleCase(pso), proyek, posisi: cellAt(row, h, 'Posisi'), keahlian: cellAt(row, h, 'Keahlian'),
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

function normalizeDatalist(grid) {
  const h = findHeader(grid, ['Kode Lokasi', 'Nama Proyek', 'Progres Aktual (%)']);
  if (!h) throw new Error('Header Datalist tidak ditemukan');
  const out = [];
  for (const row of grid.slice(h.row + 1)) {
    const g = (n) => cellAt(row, h, n);
    if (!g('Nama Proyek')) continue;
    const pst = g('PST');
    const pso = /^PSO /i.test(pst) ? pst.replace(/^PSO /i, '').replace(/ dan PSO /i, ' & ') : 'Lainnya';
    const aktual = parsePct(g('Progres Aktual (%)'));
    const plan = parsePct(g('Progres Plan(%)'));
    const issues = [];
    for (let i = 1; i <= 5; i++) {
      const kat = g('Kategori' + i);
      if (kat && !/^tidak ada isu$/i.test(kat)) issues.push({ kategori: kat, detail: g('Detail' + i), tl: g('Tindaklanjut' + i) });
    }
    const periode = parseDate(g('Periode'));
    const penugasanSd = parseDate(g('Jangka Waktu Penugasan'));
    const cod = parseDate(g('COD Amandemen')) || parseDate(g('COD Kontrak'));
    const garansi = parseDate(g('Masa Berlaku Bank Garansi'));
    const dev = aktual !== null && plan !== null ? aktual - plan : null;
    out.push({
      kode: g('Kode Lokasi'), no: g('No'), pso: titleCase(pso), jenis: g('Jenis'), milestone: g('Milestone'), nama: g('Nama Proyek'),
      kontraktor: g('Kontraktor'), direksi: g('Direksi Pekerjaan'), pemberi: g('Pemberi Tugas'), aktual, plan, dev,
      status: progressStatus(aktual, plan), periode, ageDays: periode ? -daysUntil(periode) : null,
      penugasanSd, cod, garansi, nilai: parseNum(g('Nilai Kontrak Akhir')), aktivitas: g('Aktivitas'), issues,
      habisSebelumCod: !!(penugasanSd && cod && penugasanSd < cod && g('Progres Aktual (%)') && !(aktual >= 100)),
      _f: [
        ['Kode Lokasi', g('Kode Lokasi')], ['No. Paket', g('No')], ['PSO', pso], ['Jenis', g('Jenis')], ['Milestone', g('Milestone')],
        ['Nama Proyek', g('Nama Proyek')], ['Pemberi Tugas', g('Pemberi Tugas')], ['Direksi Pekerjaan', g('Direksi Pekerjaan')],
        ['Kontraktor', g('Kontraktor')], ['No. Kontrak', g('No Kontrak')], ['Nilai Kontrak Akhir', g('Nilai Kontrak Akhir')],
        ['Progres Aktual', g('Progres Aktual (%)')], ['Progres Plan', g('Progres Plan(%)')],
        ['Deviasi (poin)', dev === null ? '' : dev.toFixed(2)], ['Status (aturan dashboard)', progressStatus(aktual, plan)],
        ['Data per', g('Periode')], ['Penugasan s.d.', g('Jangka Waktu Penugasan')], ['COD Kontrak', g('COD Kontrak')],
        ['COD Amandemen', g('COD Amandemen')], ['Bank Garansi s.d.', g('Masa Berlaku Bank Garansi')], ['Kapasitas', `${g('Kapasitas')} ${g('Satuan Kapasitas')}`.trim()],
        ['Lingkup', g('Detail')], ['Aktivitas periode ini', g('Aktivitas')],
        ...issues.flatMap((x, i) => [[`Isu ${i + 1}`, x.kategori], [`Detail isu ${i + 1}`, x.detail], [`Tindak lanjut ${i + 1}`, x.tl]]),
        ['RLB', g('RLB')], ['Energize', g('Energize')], ['SLO', g('SLO')], ['BAST 1', g('BAST 1')], ['BAST 2', g('BAST 2')],
      ],
    });
  }
  return out;
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

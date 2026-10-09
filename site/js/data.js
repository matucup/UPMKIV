const MONTHS_ID = {
  jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2, apr: 3, april: 3, mei: 4,
  jun: 5, juni: 5, jul: 6, juli: 6, agu: 7, agt: 7, ags: 7, agustus: 7,
  sep: 8, sept: 8, september: 8, okt: 9, oktober: 9, nov: 10, november: 10, des: 11, desember: 11,
};

function parseDate(s) {
  s = String(s ?? '').trim();
  if (!s) return null;
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = /^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{2,4})$/.exec(s);
  if (m && MONTHS_ID[m[2].toLowerCase()] !== undefined) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return new Date(y, MONTHS_ID[m[2].toLowerCase()], +m[1]);
  }
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(s);
  if (m) return new Date(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[2] - 1, +m[1]);
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
    const judul = cellAt(row, h, 'Judul Surat Penugasan');
    const kode = cellAt(row, h, 'Kode Lokasi');
    if (!judul && !kode) continue;
    const g = (n) => cellAt(row, h, n);
    const akhir = parseDate(g('Akhir Penugasan')) || parseDate(g('COD Amandemen')) || parseDate(g('COD Kontrak'));
    const daysLeft = akhir ? Math.ceil((akhir - today) / 864e5) : null;
    const status = daysLeft === null ? 'Tanpa tanggal' : daysLeft < 0 ? 'Berakhir' : daysLeft <= 90 ? 'Segera berakhir' : 'Berjalan';
    out.push({
      pso: g('PSO') || '-', pic: g('PIC'), jenis: g('Jenis'), kode, judul: judul || kode,
      provinsi: g('Provinsi'), akhir, daysLeft, status,
      _f: [
        ['PSO', g('PSO')], ['PIC', g('PIC')], ['PC', g('PC')], ['SC', g('SC')], ['Jenis', g('Jenis')],
        ['Kode Lokasi', kode], ['Judul Surat Penugasan', judul], ['Nomor Surat Penugasan', g('Nomor Surat Penugasan')],
        ['Proyek EPC', g('Proyek EPC')], ['Provinsi', g('Provinsi')], ['User Pengguna Jasa', g('User Pengguna Jasa')],
        ['Direksi Lapangan', g('Direksi Lapangan')], ['Durasi', g('Durasi')], ['Awal Penugasan', g('Awal Penugasan')],
        ['Akhir Penugasan', g('Akhir Penugasan')], ['Tanggal Kontrak', g('Tanggal Kontrak')],
        ['Efektif Kontrak', g('Efektif Kontrak')], ['COD Kontrak', g('COD Kontrak')],
        ['COD Amandemen', g('COD Amandemen')], ['EOT ke-', g('EOT ke-')],
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
    // kolom PROYEK kosong di sheet; nama proyek ada di kolom I tanpa header
    const proyek = cellAt(row, h, 'PROYEK') || clean(row[8]);
    const g = (n) => cellAt(row, h, n);
    out.push({
      nama, pso: g('PSO') || '-', penugasan: g('PENUGASAN'), kualifikasi: g('KUALIFIKASI'), proyek,
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
      pso, proyek, posisi: cellAt(row, h, 'Posisi'), keahlian: cellAt(row, h, 'Keahlian'),
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
    if (!/^\d+$/.test(no)) continue;
    const g = (n) => cellAt(row, h, n);
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

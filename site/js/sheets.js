const SOURCES = {
  proyek: { id: DATA_ID, sheet: 'Daftar Proyek' },
  personil: { id: DATA_ID, sheet: 'Personil' },
  mm: { id: DATA_ID, sheet: 'LIVE_MM' },
  tad: { id: DATA_ID, sheet: 'DATA' },
  datalist: { id: DATA_ID, sheet: 'Datalist_Pusmanpro' },
  adkon: { id: DATA_ID, sheet: 'Adkon' },
  rekap: { id: DATA_ID, sheet: 'Rekap Jumlah Pengawas' },
  pa: { id: DATA_ID, sheet: 'Monitoring PA' },
  pengadaan: { id: DATA_ID, sheet: 'Monitoring Pengadaan' },
};

const LAPORAN_TABS = {
  lap_kpi: 'Laporan_KPI', lap_matlev: 'Matlev_ERM', lap_patuh: 'Kepatuhan', lap_idd: 'IDD_Mitra',
  lap_kegiatan: 'Kegiatan', lap_kontrak: 'Kontrak_Status', lap_alih: 'Pengalihan_Anggaran',
  lap_proyek: 'Proyek', lap_progres: 'Progres_Bulanan', lap_isu: 'Isu', lap_dok: 'Dokumen_Milestone',
};
for (const [k, sheet] of Object.entries(LAPORAN_TABS)) SOURCES[k] = { id: typeof LAPORAN_ID === 'undefined' ? '' : LAPORAN_ID, sheet };

function gvizUrl(src, extra) {
  return `https://docs.google.com/spreadsheets/d/${src.id}/gviz/tq?sheet=${encodeURIComponent(src.sheet)}&headers=1&tqx=${extra}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function fetchCsvGrid(src) {
  const res = await fetch(gvizUrl(src, 'out:csv'));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseCsv(await res.text());
}

function fetchJsonpGrid(src) {
  return new Promise((resolve, reject) => {
    const cb = `__gviz_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const done = () => { delete window[cb]; script.remove(); };
    window[cb] = (resp) => {
      done();
      if (!resp || !resp.table) return reject(new Error('Respons tidak valid'));
      const labels = resp.table.cols.map((c) => c.label || '');
      resolve([labels].concat(resp.table.rows.map((r) => (r.c || []).map((c) => (c ? (c.f ?? c.v ?? '') : '')).map(String))));
    };
    script.onerror = () => { done(); reject(new Error('Gagal memuat')); };
    script.src = gvizUrl(src, `out:json;responseHandler:${cb}`);
    document.head.appendChild(script);
  });
}

async function loadSheet(src) {
  try {
    return await fetchCsvGrid(src);
  } catch (e) {
    return fetchJsonpGrid(src);
  }
}

// Diagnostik: bila pembacaan gagal, sertakan versi dan cuplikan baris awal yang benar-benar diterima dari Google.
const BUILD = 'induk-3';
function gridHint(grid) {
  if (!Array.isArray(grid)) return '';
  const rows = grid.slice(0, 5).map((r, i) => `b${i + 1}: ${r.slice(0, 6).map((c) => String(c).replace(/\s+/g, ' ').slice(0, 16)).join(' | ')}`).join(' // ');
  return ` [${BUILD}; ${grid.length} baris; ${rows || 'kosong'}]`;
}

async function parseSheet(src, fn) {
  const grid = await loadSheet(src);
  try {
    return fn(grid);
  } catch (e) {
    e.message += gridHint(grid);
    throw e;
  }
}

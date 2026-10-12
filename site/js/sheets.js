const SOURCES = {
  proyek: { id: '1rH6dQf_bBBVe2ClHYWXxqD7uS76gRx29TiFB43gEoKg', sheet: 'Daftar Proyek' },
  personil: { id: '1Jo3wbnkjSHSm4auaM1fDVyLyRRntSIRSyHeCcCKY81c', sheet: 'Personil' },
  mm: { id: '1Jo3wbnkjSHSm4auaM1fDVyLyRRntSIRSyHeCcCKY81c', sheet: '[LIVE]MM' },
  tad: { id: '1hIXrBaY6H9nPW7gKyrH0Ld7pQ9CHV3MASPuEbkGVtEo', sheet: 'DATA' },
  datalist: { id: '1KbakwavXHcx_7JYVfBMvqUSY7tf__x_-so3vePM6dDg', sheet: 'Datalist_Pusmanpro' },
  adkon: { id: '1H3A4ti0xQGOeKvSJEzXLYqCns25kjoGuUwIO7z7gbvM', sheet: 'Adkon' },
  rekap: { id: '1rH6dQf_bBBVe2ClHYWXxqD7uS76gRx29TiFB43gEoKg', sheet: 'Rekap Jumlah Pengawas' },
  pa: { id: '1rH6dQf_bBBVe2ClHYWXxqD7uS76gRx29TiFB43gEoKg', sheet: 'Monitoring PA' },
  pengadaan: { id: '1rH6dQf_bBBVe2ClHYWXxqD7uS76gRx29TiFB43gEoKg', sheet: 'Monitoring Pengadaan' },
};

const LAPORAN_TABS = {
  lap_kpi: 'Laporan_KPI', lap_matlev: 'Matlev_ERM', lap_patuh: 'Kepatuhan', lap_idd: 'IDD_Mitra',
  lap_kegiatan: 'Kegiatan', lap_kontrak: 'Kontrak_Status', lap_alih: 'Pengalihan_Anggaran',
  lap_proyek: 'Proyek', lap_progres: 'Progres_Bulanan', lap_isu: 'Isu', lap_dok: 'Dokumen_Milestone',
};
for (const [k, sheet] of Object.entries(LAPORAN_TABS)) SOURCES[k] = { id: typeof LAPORAN_ID === 'undefined' ? '' : LAPORAN_ID, sheet };

function gvizUrl(src, extra) {
  return `https://docs.google.com/spreadsheets/d/${src.id}/gviz/tq?sheet=${encodeURIComponent(src.sheet)}&headers=0&tqx=${extra}`;
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
      resolve(resp.table.rows.map((r) => (r.c || []).map((c) => (c ? (c.f ?? c.v ?? '') : '')).map(String)));
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

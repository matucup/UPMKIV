const JOBS = {
  personil: [normalizePersonil, []],
  pa: [normalizePA, []],
  adkon: [normalizeAdkon, []],
  pengadaan: [normalizePengadaan, []],
  mm: [normalizeMM, { months: [], rows: [] }],
  tad: [normalizeTad, []],
};
const TABLE_REQ = {
  lap_kpi: ['Kelompok', 'Indikator', 'Nilai'], lap_matlev: ['Kelompok', 'Program', 'Status'], lap_patuh: ['Indikator', 'Terlapor', 'Wajib'],
  lap_idd: ['Mitra', 'IDD_Ulang'], lap_kegiatan: ['Tanggal', 'Kegiatan'], lap_kontrak: ['Uraian', 'Jumlah'], lap_alih: ['Pemberi_Kerja', 'Pengalihan'],
};
let S = null;
let L = null;

const key = (s) => String(s).replace(/[^A-Za-z0-9]/g, '').toLowerCase();
const num = (v) => parseNum(v) ?? 0;

function periodLabel() {
  const dates = S.datalist.map((p) => p.periode).filter(Boolean).sort((a, b) => a - b);
  const d = dates.length ? dates[Math.floor(dates.length / 2)] : new Date();
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function renderExecKpis() {
  const { datalist: d, personil, mm, tad } = S;
  const win = mmWindow(mm);
  const wm = mm.months.slice(win.start, win.end);
  const mmTotal = mm.rows.reduce((a, r) => a + r.vals.slice(win.start, win.end).reduce((x, y) => x + y, 0), 0);
  const late = tad.filter((t) => t.late > 0).length;
  const cards = [
    { label: 'Kontrak dimonitor', value: d.length, sub: `${d.filter((p) => p.status === 'Selesai').length} selesai · ${d.filter((p) => !['Selesai', 'Belum mulai'].includes(p.status)).length} konstruksi aktif`, open: () => openList(pkgList('Semua kontrak', d)) },
    { label: 'Merah / Kuning', value: `${d.filter((p) => p.status === 'Merah').length} / ${d.filter((p) => p.status === 'Kuning').length}`, sub: 'paket menyimpang dari plan', open: () => openList(pkgList('Kontrak Merah dan Kuning', d.filter((p) => ['Merah', 'Kuning'].includes(p.status)).sort((a, b) => a.dev - b.dev))) },
    { label: 'Personil lapangan', value: personil.length || '-', sub: personil.length ? `${new Set(personil.map((x) => norm(x.pso))).size} PSO / unit kerja` : 'tab Personil belum terbaca', open: () => $('sdm').scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Man-month 6 bulan', value: fmt(mmTotal), sub: wm.length ? `${wm[0].label} – ${wm[wm.length - 1].label}` : 'belum ada data', open: () => { window.location.href = 'index.html'; } },
    { label: 'Permintaan TAD', value: tad.length, sub: `${late} terlambat mobilisasi`, open: () => { window.location.href = 'index.html'; } },
  ];
  $('kpis').innerHTML = cards.map((c, i) => `<button type="button" class="card stat-card stat-btn" data-k="${i}"><div class="stat-label">${esc(c.label)}</div><div class="stat-value">${esc(c.value)}</div><div class="stat-sub">${esc(c.sub)}</div></button>`).join('');
  $('kpis').onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) cards[+b.dataset.k].open(); };
}

function renderSdm() {
  const { personil, mm } = S;
  if (!personil.length) { $('sdm').innerHTML = '<p class="empty">Data personil (tab Personil) belum terbaca.</p>'; return; }
  const win = mm.months.length ? mmWindow(mm) : null;
  const nMonth = win ? win.end - win.start : 0;
  const f1 = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  const map = new Map();
  const slot = (name) => { const k = norm(name); if (!map.has(k)) map.set(k, { pso: name, n: 0, plan: 0, real: 0, demand: 0, hasMm: false }); return map.get(k); };
  personil.forEach((p) => { slot(p.pso).n += 1; });
  mmPerPso(S.pen).forEach((v) => { const x = slot(v.pso); x.plan += v.plan; x.real += v.real; x.hasMm = true; });
  if (win) mm.rows.forEach((r) => { slot(r.pso).demand += r.vals.slice(win.start, win.end).reduce((a, b) => a + b, 0); });
  const rows = [...map.values()].sort((a, b) => String(a.pso).localeCompare(String(b.pso), 'id'));
  const tot = rows.reduce((a, r) => ({ n: a.n + r.n, plan: a.plan + r.plan, real: a.real + r.real, demand: a.demand + r.demand, hasMm: a.hasMm || r.hasMm }), { n: 0, plan: 0, real: 0, demand: 0, hasMm: false });
  const mmCells = (r) => (r.hasMm ? `<td class="num">${f1(r.plan)}</td><td class="num">${f1(r.real)}</td><td class="num">${fmtPct(r.plan ? (r.real / r.plan) * 100 : null)}</td><td class="num">${f1(r.plan - r.real)}</td>` : '<td class="num">-</td><td class="num">-</td><td class="num">-</td><td class="num">-</td>');
  const tr = (r, i) => `<tr class="clickable" tabindex="0" data-i="${i}"><td>${esc(r.pso)}</td><td class="num">${r.n}</td>${mmCells(r)}<td class="num">${nMonth ? f1(r.demand) : '-'}</td></tr>`;
  const label = nMonth ? `${mm.months[win.start].label} – ${mm.months[win.end - 1].label}` : '';
  const byTugas = {};
  personil.forEach((p) => { const k = p.penugasan || '(belum diisi)'; byTugas[k] = (byTugas[k] || 0) + 1; });
  const top = Object.entries(byTugas).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const mini = top.map(([k, v]) => `<div class="mini"><div class="stat-label">${esc(k)}</div><div class="stat-value">${v}</div><div class="stat-sub">${f1((v / personil.length) * 100)}% dari personil</div></div>`).join('');
  $('sdm').innerHTML = `<div class="mini-row four">${mini}</div><div class="panel-header" style="margin-top:18px"><div><h2>Pagu man-month vs realisasi per PSO</h2><p class="panel-sub">Klik baris untuk melihat pagu MM tiap proyek di PSO itu.</p></div><button type="button" id="mm-all" class="link-btn">Detail seluruh proyek &rarr;</button></div><div class="table-scroll"><table class="report-table"><thead><tr><th>PSO / unit</th><th class="num">Personil</th><th class="num">Pagu MM</th><th class="num">Realisasi MM</th><th class="num">Serapan MM</th><th class="num">Sisa MM</th><th class="num">Kebutuhan MM ${nMonth ? `${nMonth} bln ` : ""}ke depan</th></tr></thead><tbody>${rows.map(tr).join('')}</tbody><tfoot><tr><td>Total</td><td class="num">${tot.n}</td>${mmCells(tot)}<td class="num">${nMonth ? f1(tot.demand) : '-'}</td></tr></tfoot></table></div><p class="panel-sub" style="margin-top:10px">Personil dari tab Personil (sheet Distribusi Man Month). Pagu, realisasi, dan sisa MM dari tab Adkon (rencana dan realisasi man-month tiap penugasan). Kebutuhan MM ke depan dari tab LIVE_MM${label ? `, periode ${esc(label)}` : ''}.</p>`;
  const pens = (r) => S.pen.filter((p) => p.rencanaMM && norm(p.pso) === norm(r.pso));
  const open = (i) => openList(mmPaguList(`Pagu MM per proyek: ${rows[i].pso}`, pens(rows[i]), true));
  $('sdm').onclick = (ev) => {
    if (ev.target.closest('#mm-all')) { openList(mmPaguList('Pagu MM seluruh proyek', S.pen.filter((p) => p.rencanaMM), true)); return; }
    const t = ev.target.closest('tr[data-i]'); if (t) open(+t.dataset.i);
  };
  $('sdm').onkeydown = (ev) => { const t = ev.target.closest('tr[data-i]'); if (t && ev.key === 'Enter') open(+t.dataset.i); };
}

function renderPa() {
  const rows = S.adkon.filter((r) => r.rbt);
  if (rows.length) return renderBiaya(rows);
  const withPa = S.pa.filter((p) => p.items.length);
  $('pa-note').textContent = `Data RBT belum terbaca. ${withPa.length} dari ${S.pa.length} paket punya data penetapan anggaran (PA).`;
  $('pa').innerHTML = '<p class="empty">Sumber biaya (tab Adkon) belum terbaca.</p>';
}

function renderBiaya(rows) {
  const list = S.pen.filter((r) => r.rbt);
  const tot = list.reduce((a, r) => ({ rbt: a.rbt + r.rbt, real: a.real + (r.realisasi || 0), bln: a.bln + (r.bulanIni || 0) }), { rbt: 0, real: 0, bln: 0 });
  const per = rows.find((r) => r.periode);
  $('pa-note').textContent = `RBT dan realisasi RBT per surat penugasan, sumber tab Adkon${per ? ` (periode ${fmtDate(per.periode)})` : ''}. Progres fisik adalah rata-rata kontrak di bawah penugasan itu.`;
  const avg = (arr, f) => { const v = arr.map(f).filter((x) => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const byJenis = ['Transmisi', 'Gardu Induk'].map((j) => { const x = list.filter((r) => r.jenis === j && r.statusAdkon === 'OPEN'); return { j, n: x.length, s: avg(x, (r) => r.serapan), p: avg(x, (r) => r.aktual) }; }).filter((x) => x.n);
  const mini = [['RBT total', fmtRp(tot.rbt), `${list.length} penugasan`], ['Realisasi RBT', fmtRp(tot.real), `${fmtPct((tot.real / tot.rbt) * 100)} dari RBT`], ['Realisasi bulan ini', fmtRp(tot.bln), 'tambahan periode berjalan'],
    ...byJenis.map((x) => [`Rata-rata ${x.j}`, `${fmtPct(x.s)} serapan`, `progres fisik ${fmtPct(x.p)} (${x.n} penugasan OPEN)`])];
  const sorted = [...list].sort((a, b) => Math.abs(b.sel ?? 0) - Math.abs(a.sel ?? 0));
  const row = (r, i) => `<tr class="clickable" tabindex="0" data-i="${i}"><td>${esc(r.nama)}<div class="item-sub">${esc(r.kode)} · ${esc(r.jenis)} · ${esc(r.statusAdkon)}${r.kontrak.length ? ` · ${r.kontrak.length} kontrak` : ' · belum ada kontrak terpantau'}</div></td><td class="num">${fmtRp(r.rbt)}</td><td class="num">${r.realisasi === null ? '-' : fmtRp(r.realisasi)}</td><td class="num">${fmtPct(r.serapan)}</td><td class="num">${fmtPct(r.aktual)}</td><td class="num">${r.sel === null ? '-' : `<span class="badge ${Math.abs(r.sel) > 25 ? 'badge-warning' : 'badge-muted'}">${fmtDev(r.sel)}</span>`}</td></tr>`;
  $('pa').innerHTML = `<div class="mini-row four">${mini.map(([l, v, s]) => `<div class="mini"><div class="stat-label">${esc(l)}</div><div class="stat-value">${esc(v)}</div><div class="stat-sub">${esc(s)}</div></div>`).join('')}</div><h3 class="sub-title">Realisasi RBT vs progres fisik per PSO</h3><div id="pa-psocost"></div><h3 class="sub-title">Per surat penugasan</h3><div class="table-scroll"><table class="report-table"><thead><tr><th>Surat penugasan</th><th class="num">RBT</th><th class="num">Realisasi</th><th class="num">Serapan</th><th class="num">Progres fisik</th><th class="num">Selisih (poin)</th></tr></thead><tbody>${sorted.map(row).join('')}</tbody></table></div><p class="panel-sub" style="margin-top:10px">Selisih = serapan biaya dikurangi progres fisik. Selisih besar berarti biaya berjalan jauh di depan atau di belakang pekerjaan. Klik baris untuk membuka penugasan beserta kontrak-kontraknya.</p>`;
  mountPsoCost($('pa-psocost'), S.pen);
  const open = (i) => openPenugasanCard(sorted[i], null);
  $('pa').onclick = (ev) => { const tr = ev.target.closest('tr[data-i]'); if (tr) open(+tr.dataset.i); };
  $('pa').onkeydown = (ev) => { const tr = ev.target.closest('tr[data-i]'); if (tr && ev.key === 'Enter') open(+tr.dataset.i); };
}

function renderPengadaan() {
  const pg = S.pengadaan;
  const sum = (k) => pg.reduce((a, x) => a + x[k], 0);
  $('pengadaan-kpi').innerHTML = [['Mobil', sum('dc') + sum('mpv'), `${sum('dc')} double cabin · ${sum('mpv')} MPV`], ['Motor', sum('motor'), 'kendaraan roda dua'], ['Mess / site office', pg.filter((x) => x.noMess).length, 'kontrak mess aktif']]
    .map(([l, v, s]) => `<div class="mini"><div class="stat-label">${l}</div><div class="stat-value">${v}</div><div class="stat-sub">${s}</div></div>`).join('');
  const due = [];
  for (const x of pg) {
    const dm = daysUntil(x.akhirMess), dk = daysUntil(x.akhirKendaraan);
    if (dm !== null && dm <= 120) due.push({ x, tag: dm < 0 ? 'Mess lewat' : `Mess ${dm} hari`, text: `Kontrak mess ${x.noMess || ''} berakhir ${fmtDate(x.akhirMess)}`, days: dm });
    if (dk !== null && dk <= 120) due.push({ x, tag: dk < 0 ? 'Kendaraan lewat' : `Kendaraan ${dk} hari`, text: `Kontrak kendaraan berakhir ${x.akhirKendaraanTxt}`, days: dk });
  }
  due.sort((a, b) => a.days - b.days);
  $('pengadaan-due').innerHTML = due.length ? due.slice(0, 6).map((r, i) => `<button type="button" class="item-row" data-i="${i}"><span class="item-main"><span class="item-title">${esc(r.x.nama)}</span><span class="item-sub">${esc(r.text)}</span></span><span class="badge ${r.days < 0 ? 'badge-late' : 'badge-warning'}">${esc(r.tag)}</span></button>`).join('') : '<p class="empty">Tidak ada kontrak mess atau kendaraan yang berakhir dalam 120 hari.</p>';
  const cfg = { title: 'Kontrak mess dan kendaraan segera berakhir', rows: due, cols: [{ label: 'Proyek', val: (r) => r.x.nama }, { label: 'Peringatan', val: (r) => r.tag }, { label: 'Keterangan', val: (r) => r.text }], record: (r) => r.x._f, recordTitle: (r) => r.x.nama };
  $('pengadaan-due').onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) openRecord(cfg, due[+b.dataset.i]); };
  $('pengadaan-all').onclick = () => openList(cfg);
}

/* Bagian dari sheet Laporan Bulanan */

function renderLaporan() {
  const box = $('laporan');
  if (!TAMPILKAN_LAPORAN) { box.hidden = true; return; }
  if (!L) {
    box.innerHTML = `<div class="card panel pending-card"><strong>Bagian ini belum tersambung ke Google Sheet.</strong><br>Kinerja, kepatuhan, K3 dan keamanan, ERM, IDD mitra, status kontrak, pengalihan anggaran, dan kegiatan khusus tidak ada di spreadsheet yang ada sekarang. Isi tab-tab pada template <em>Monitoring_Progres_PUSMANPRO</em> (sudah berisi data laporan Agustus 2026), unggah ke Google Sheets, lalu isi <code>LAPORAN_ID</code> di <code>js/config.js</code>.</div>`;
    return;
  }
  const parts = [];
  const kpi = L.lap_kpi;
  const groups = [...new Set(kpi.map((r) => r.Kelompok))];
  parts.push(`<h3 class="section-title">Kinerja dan pengadaan</h3><div class="stats-grid">${kpi.filter((r) => r.Tampilkan !== 'Tidak').slice(0, 8).map((r) => `<div class="card stat-card"><div class="stat-label">${esc(r.Indikator)}</div><div class="stat-value">${esc(r.Nilai)}${r.Satuan ? ` <small>${esc(r.Satuan)}</small>` : ''}</div><div class="stat-sub">${esc(r.Keterangan || r.Kelompok)}</div></div>`).join('')}</div>`);
  const mt = L.lap_matlev;
  const mg = [...new Set(mt.map((r) => r.Kelompok))];
  parts.push(`<h3 class="section-title">Matlev K3, keamanan, dan ERM</h3><div class="panels-grid even">${mg.map((g) => { const rows = mt.filter((r) => r.Kelompok === g); const done = rows.filter((r) => /terlaksana/i.test(r.Status)).length; return `<section class="card panel"><div class="panel-header"><div><h2>${esc(g)}</h2><p class="panel-sub">${done} dari ${rows.length} program terlaksana</p></div></div><div class="item-list">${rows.map((r) => `<div class="item-row static"><span class="item-main"><span class="item-title wrap">${esc(r.Program)}</span></span><span class="badge ${/terlaksana/i.test(r.Status) ? 'badge-active' : 'badge-warning'}">${esc(r.Status)}</span></div>`).join('')}</div></section>`; }).join('')}</div>`);
  parts.push(`<h3 class="section-title">Kepatuhan</h3><section class="card panel"><div class="bar-list">${L.lap_patuh.map((r) => { const t = num(r.Terlapor), w = num(r.Wajib); return `<div class="bar-row static"><span class="bar-label">${esc(r.Indikator)}</span><span class="bar-track"><span class="bar-fill" style="width:${w ? Math.min(100, (t / w) * 100) : 0}%"></span></span><span class="bar-val wide">${t}/${w}</span></div>`; }).join('')}</div></section>`);
  const idd = L.lap_idd.map((r) => ({ ...r, d: parseDate(r.IDD_Ulang) })).sort((a, b) => (a.d || 0) - (b.d || 0));
  parts.push(`<h3 class="section-title">Integrity due diligence mitra</h3><section class="card panel"><div class="table-scroll"><table class="report-table"><thead><tr><th>Mitra</th><th>Tanggal IDD</th><th>Penilaian risiko</th><th>Mitigasi</th><th>IDD ulang</th></tr></thead><tbody>${idd.map((r) => { const dd = daysUntil(r.d); return `<tr><td>${esc(r.Mitra)}</td><td>${esc(r.Tanggal_IDD)}</td><td>${esc(r.Penilaian_Risiko)}</td><td>${esc(r.Mitigasi)}</td><td>${esc(r.IDD_Ulang)} ${dd !== null && dd <= 90 ? `<span class="badge ${dd < 0 ? 'badge-late' : 'badge-warning'}">${dd < 0 ? 'terlewat' : dd + ' hari'}</span>` : ''}</td></tr>`; }).join('')}</tbody></table></div></section>`);
  const kt = L.lap_kontrak;
  const totalN = kt.reduce((a, r) => a + num(r.Jumlah), 0), totalV = kt.reduce((a, r) => a + num(r.Nilai), 0);
  parts.push(`<h3 class="section-title">Status kontrak</h3><section class="card panel"><div class="table-scroll"><table class="report-table"><thead><tr><th>Uraian</th><th class="num">Jumlah</th><th class="num">Nilai</th><th class="num">Volume</th><th>Berakhir periode ini</th></tr></thead><tbody>${kt.map((r) => `<tr><td>${esc(r.Uraian)}</td><td class="num">${esc(r.Jumlah)}</td><td class="num">${fmtRp(num(r.Nilai))}</td><td class="num">${esc(r.Volume)} ${esc(r.Satuan)}</td><td>${esc(r.Berakhir_Periode_Ini)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="num">${totalN}</td><td class="num">${fmtRp(totalV)}</td><td></td><td></td></tr></tfoot></table></div></section>`);
  const al = L.lap_alih;
  const sP = al.reduce((a, r) => a + num(r.Pengalihan), 0), sR = al.reduce((a, r) => a + num(r.Realisasi_Biaya), 0);
  parts.push(`<h3 class="section-title">Pengalihan anggaran pemberi kerja</h3><section class="card panel"><div class="table-scroll"><table class="report-table"><thead><tr><th>Pemberi kerja</th><th class="num">Pengalihan</th><th class="num">Realisasi biaya</th><th class="num">Lebih / (kurang)</th></tr></thead><tbody>${al.map((r) => `<tr><td>${esc(r.Pemberi_Kerja)}</td><td class="num">${fmtRp(num(r.Pengalihan))}</td><td class="num">${fmtRp(num(r.Realisasi_Biaya))}</td><td class="num">${fmtRp(num(r.Pengalihan) - num(r.Realisasi_Biaya))}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="num">${fmtRp(sP)}</td><td class="num">${fmtRp(sR)}</td><td class="num">${fmtRp(sP - sR)}</td></tr></tfoot></table></div></section>`);
  const ev = L.lap_kegiatan;
  parts.push(`<h3 class="section-title">Kegiatan khusus</h3><section class="card panel"><div class="item-list">${ev.map((r) => `<div class="item-row static"><span class="item-main"><span class="item-title wrap">${esc(r.Kegiatan)}</span><span class="item-sub">${esc(r.Kategori || '')}</span></span><span class="badge badge-muted">${esc(r.Tanggal)}</span></div>`).join('')}</div></section>`);
  box.innerHTML = parts.join('');
}

async function loadLaporan() {
  if (!TAMPILKAN_LAPORAN || !SOURCES.lap_kpi.id) return null;
  const out = {};
  const failed = [];
  await Promise.all(Object.keys(TABLE_REQ).map(async (k) => {
    try { out[k] = await parseSheet(SOURCES[k], (g) => normalizeTable(g, TABLE_REQ[k])); } catch (e) { failed.push(`${SOURCES[k].sheet} (${e.message})`); out[k] = []; }
  }));
  if (failed.length) out._failed = failed;
  return out;
}

async function refresh() {
  $('refresh').disabled = true;
  $('updated').textContent = 'Memuat data dari Google Sheets…';
  PSO_LOG.clear();
  const [{ data, failed }, lap, mon] = await Promise.all([loadSources(JOBS), loadLaporan(), loadMonitoring()]);
  S = { ...data, datalist: mon.rows };
  S.pen = buildPenugasan(S.adkon, S.datalist);
  failed.push(...mon.failed);
  L = lap;
  showBanner([...failed, ...(lap && lap._failed ? lap._failed : [])]);
  showNotice(psoNotices());
  $('periode').textContent = periodLabel();
  renderExecKpis(); renderPso(); renderAttention(); renderAlerts(); renderSdm(); renderPa(); renderPengadaan(); renderLaporan();
  $('updated').textContent = `Diperbarui ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  $('refresh').disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  $('refresh').onclick = refresh;
  $('print').onclick = () => window.print();
  refresh();
});

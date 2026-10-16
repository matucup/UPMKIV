const STATUS_ORDER = ['Merah', 'Kuning', 'Hijau', 'Selesai', 'Belum mulai', 'Belum dilaporkan'];
const STATUS_COLOR = { Merah: '#B42318', Kuning: '#E0A63A', Hijau: '#2F9E58', Selesai: '#2D6CDF', 'Belum mulai': '#B9C7DA', 'Belum dilaporkan': '#D5DAE2' };
const STALE_DAYS = 35;

const pkgCols = [
  { label: 'PSO', val: (r) => r.pso },
  { label: 'Kontrak', val: (r) => r.nama },
  { label: 'Jenis', val: (r) => r.jenis },
  { label: 'Milestone', val: (r) => r.milestone },
  { label: 'Aktual', val: (r) => fmtPct(r.aktual), num: true },
  { label: 'Plan', val: (r) => fmtPct(r.plan), num: true },
  { label: 'Deviasi', val: (r) => fmtDev(r.dev), num: true },
  { label: 'Status', val: (r) => r.status, html: (r) => `<span class="badge ${STATUS_BADGE[r.status]}">${esc(r.status)}</span>` },
  { label: 'Isu', val: (r) => String(r.issues.length), num: true },
  { label: 'Data per', val: (r) => fmtDate(r.periode) },
];
const pkgList = (title, rows, sub) => ({ title, sub, rows, cols: pkgCols, card: (r, cfg) => openPackageCard(r, cfg) });

const issueRows = () => S.datalist.flatMap((p) => p.issues.map((x) => ({ ...x, p })));
const issueList = (title, rows) => ({
  title, rows,
  cols: [
    { label: 'PSO', val: (r) => r.p.pso }, { label: 'Kontrak', val: (r) => r.p.nama }, { label: 'Kategori', val: (r) => r.kategori },
    { label: 'Detail', val: (r) => r.detail }, { label: 'Tindak lanjut', val: (r) => r.tl },
  ],
  card: (r, cfg) => openPackageCard(r.p, cfg),
});

const penOf = (p) => ((S && S.pen) || []).find((x) => x.kode === p.kode);
const barHtml = (label, v, color) => `<div class="pk-bar"><span>${label}</span><span class="pk-track"><i style="width:${Math.min(100, v ?? 0)}%;background:${color}"></i></span><b>${fmtPct(v)}</b></div>`;

function packageAlerts(p) {
  const out = [];
  const dG = daysUntil(p.garansi);
  if (dG !== null && dG <= 90) out.push({ p, sev: dG < 0 ? 2 : 1, tag: dG < 0 ? 'Bank garansi lewat' : 'Bank garansi segera habis', text: `Berlaku s.d. ${fmtDate(p.garansi)}${p.status === 'Selesai' ? ' (kontrak selesai, pastikan pasca-BAST)' : ''}`, days: dG });
  if (p.ageDays !== null && p.ageDays > STALE_DAYS) out.push({ p, sev: 3, tag: 'Data perlu update', text: `Data terakhir ${fmtDate(p.periode)} (${p.ageDays} hari lalu)`, days: -p.ageDays });
  return out;
}

function penugasanAlerts(e) {
  const out = [];
  if (e.habisSebelumCod) out.push({ e, sev: 0, tag: 'Penugasan habis sebelum COD', text: `Penugasan s.d. ${fmtDate(e.akhir)}, COD kontrak ${fmtDate(e.codMax)}`, days: e.sisaHari });
  else if (e.sisaHari !== null && e.sisaHari >= 0 && e.sisaHari <= 90 && e.statusAdkon !== 'LOCK') out.push({ e, sev: 1, tag: 'Penugasan segera berakhir', text: `Penugasan s.d. ${fmtDate(e.akhir)} (${e.sisaHari} hari lagi)`, days: e.sisaHari });
  return out;
}

function alerts() {
  const a = (S.pen || []).flatMap(penugasanAlerts);
  const b = S.datalist.flatMap((p) => packageAlerts(p).filter((x) => x.tag !== 'Data perlu update'));
  return [...a, ...b].sort((x, y) => x.sev - y.sev || x.days - y.days);
}

const openAlert = (x, cfg) => (x.e ? openPenugasanCard(x.e, cfg) : openPackageCard(x.p, cfg));

/* Penugasan: surat penugasan beserta biaya, memayungi satu atau lebih kontrak */

const penCols = [
  { label: 'PSO', val: (r) => r.pso },
  { label: 'Penugasan', val: (r) => r.nama, html: (r) => `${esc(r.nama)}<div class="item-sub">${esc(r.kode)}${r.noSurat ? ` · ${esc(r.noSurat)}` : ''}</div>` },
  { label: 'Kontrak', val: (r) => String(r.kontrak.length), num: true },
  { label: 'Progres', val: (r) => fmtPct(r.aktual), num: true },
  { label: 'Serapan biaya', val: (r) => fmtPct(r.serapan), num: true },
  { label: 'Selisih', val: (r) => fmtDev(r.sel), num: true },
  { label: 'Penugasan s.d.', val: (r) => fmtDate(r.akhir), html: (r) => `${esc(fmtDate(r.akhir))}${r.sisaHari !== null && r.sisaHari <= 90 ? ` <span class="badge ${r.sisaHari < 0 ? 'badge-late' : 'badge-warning'}">${r.sisaHari < 0 ? 'lewat' : `${r.sisaHari} hr`}</span>` : ''}` },
  { label: 'Status', val: (r) => r.worst || r.statusAdkon || '-', html: (r) => (r.worst ? `<span class="badge ${STATUS_BADGE[r.worst]}">${esc(r.worst)}</span>` : `<span class="badge badge-muted">${esc(r.statusAdkon || 'Belum ada kontrak')}</span>`) },
];
const penList = (title, rows, sub) => ({ title, sub, rows, cols: penCols, card: (r, cfg) => openPenugasanCard(r, cfg) });

function openPenugasanCard(e, back) {
  const again = () => openPenugasanCard(e, back);
  const al = penugasanAlerts(e);
  const selTxt = e.sel === null ? '' : `Serapan biaya ${e.sel >= 0 ? 'lebih tinggi' : 'lebih rendah'} ${Math.abs(e.sel).toLocaleString('id-ID', { maximumFractionDigits: 1 })} poin dari progres fisik rata-rata kontraknya.`;
  const stats = [['RBT', e.rbt ? fmtRp(e.rbt) : '-'], ['Realisasi RBT', e.realisasi === null ? '-' : fmtRp(e.realisasi)], ['Realisasi bulan ini', e.bulanIni ? fmtRp(e.bulanIni) : '-'], ['Sisa man-month', e.sisaMM === null ? '-' : fmt(e.sisaMM)]];
  const cats = countBy(e.issues, (x) => x.kategori);
  const kv = [['Judul surat penugasan', e.judul], ['No. surat penugasan', e.noSurat], ['Amandemen terakhir', e.amandemen], ['Mulai penugasan', fmtDate(e.mulai)], ['Akhir penugasan', e.akhir ? `${fmtDate(e.akhir)}${e.sisaHari !== null ? ` (${e.sisaHari < 0 ? `lewat ${-e.sisaHari} hari` : `${e.sisaHari} hari lagi`})` : ''}` : ''], ['Status penugasan', e.statusAdkon], ['Kode lokasi', e.kode]].filter(([, v]) => v && v !== '-');
  const html = `<div class="pkg">
    <div class="pkg-top">${e.worst ? `<span class="badge ${STATUS_BADGE[e.worst]}">${esc(e.worst)}</span>` : ''}<span class="pkg-dev">${e.dev === null ? '' : `deviasi rata-rata ${fmtDev(e.dev)} poin`}</span><span class="pkg-meta">${esc(e.pso)}${e.jenis ? ` · ${esc(e.jenis)}` : ''}${e.statusAdkon ? ` · ${esc(e.statusAdkon)}` : ''}</span></div>
    ${e.kontrak.length ? `${barHtml('Progres', e.aktual, STATUS_COLOR[e.worst] || '#2D6CDF')}${barHtml('Plan', e.plan, '#7C93B3')}` : '<p class="empty">Belum ada kontrak proyek yang dipantau pada penugasan ini.</p>'}
    ${al.length ? `<div class="pkg-alerts">${al.map((x) => `<span class="badge ${x.sev === 0 ? 'badge-late' : 'badge-warning'}">${esc(x.tag)}: ${esc(x.text)}</span>`).join('')}</div>` : ''}
    <h3 class="pkg-h">Biaya penugasan</h3>
    ${e.rbt ? `${barHtml('Serapan', e.serapan, '#5B6B7F')}<div class="stat-quad">${stats.map(([l, v]) => `<div><span>${l}</span><b>${esc(v)}</b></div>`).join('')}</div><p class="pkg-text">${esc(selTxt)}</p>` : '<p class="empty">Belum ada RBT untuk penugasan ini.</p>'}
    <h3 class="pkg-h">Kontrak proyek dalam penugasan ini <span class="neutral">${e.kontrak.length}</span></h3>
    ${e.kontrak.length ? `<div class="item-list">${e.kontrak.map((k, i) => `<button type="button" class="item-row" data-i="${i}"><span class="item-main"><span class="item-title wrap">${esc(k.nama)}</span><span class="item-sub">${esc(k.kontraktor || '')} · aktual ${fmtPct(k.aktual)} / plan ${fmtPct(k.plan)}${k.issues.length ? ` · ${k.issues.length} isu` : ''}</span></span><span class="badge ${STATUS_BADGE[k.status]}">${esc(k.status)}</span></button>`).join('')}</div>` : ''}
    ${cats.length ? `<h3 class="pkg-h">Isu pada seluruh kontrak <span>${e.issues.length}</span></h3><div class="chips">${cats.map(([c, n]) => `<span class="chip">${esc(c)} <b>${n}</b></span>`).join('')}</div>` : ''}
    <h3 class="pkg-h">Surat penugasan</h3><dl class="record compact">${kv.map(([l, v]) => `<dt>${esc(l)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <p class="pkg-foot">Biaya dan masa penugasan dikelola per surat penugasan; progres fisik dan isu dikelola per kontrak proyek.</p></div>`;
  openCard(e.nama, e.judul && e.judul !== e.nama ? e.judul : e.pso, html, back);
  $('modal-body').onclick = (ev) => { const b = ev.target.closest('[data-i]'); if (b) openPackageCard(e.kontrak[+b.dataset.i], again); };
}

function renderPenugasan() {
  const rows = [...S.pen].sort((a, b) => (a.akhir ? a.akhir.getTime() : 9e15) - (b.akhir ? b.akhir.getTime() : 9e15));
  const rbt = rows.reduce((s, r) => s + (r.rbt || 0), 0), real = rows.reduce((s, r) => s + (r.realisasi || 0), 0);
  $('pen-note').textContent = `${rows.length} penugasan · RBT ${fmtRp(rbt)} · realisasi ${fmtRp(real)} (${fmtPct(rbt ? (real / rbt) * 100 : null)}) · urut dari masa penugasan terdekat`;
  const cols = penCols.filter((c) => c.label !== 'PSO');
  $('pen-table').innerHTML = rows.length ? `<div class="table-scroll"><table class="report-table"><thead><tr><th>PSO</th>${cols.map((c) => `<th${c.num ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0, 12).map((r, i) => `<tr class="clickable" tabindex="0" data-i="${i}"><td>${esc(r.pso)}</td>${cols.map((c) => `<td${c.num ? ' class="num"' : ''}>${c.html ? c.html(r) : esc(c.val(r))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="empty">Belum ada data penugasan.</p>';
  const open = (i) => openPenugasanCard(rows[i], penList('Semua penugasan', rows));
  $('pen-table').onclick = (ev) => { const tr = ev.target.closest('tr[data-i]'); if (tr) open(+tr.dataset.i); };
  $('pen-table').onkeydown = (ev) => { const tr = ev.target.closest('tr[data-i]'); if (tr && ev.key === 'Enter') open(+tr.dataset.i); };
  $('pen-all').onclick = () => openList(penList('Semua penugasan', rows, 'Klik baris untuk membuka surat penugasan, biaya, dan kontraknya'));
}

function openPackageCard(p, backCfg) {
  const bar = barHtml;
  const pen = penOf(p);
  const issues = p.issues.length
    ? p.issues.map((x) => `<article class="issue"><div class="issue-head"><span class="issue-cat">${esc(x.kategori)}</span>${x.status ? `<span class="badge ${/closed/i.test(x.status) ? 'badge-active' : 'badge-late'}">${esc(x.status)}</span>` : ''}</div>${x.detail ? `<p class="issue-detail">${esc(x.detail)}</p>` : ''}${x.tl ? `<p class="issue-tl"><b>Tindak lanjut</b>${esc(x.tl)}</p>` : ''}${x.pic || x.target ? `<p class="issue-meta">${x.pic ? `PIC: ${esc(x.pic)}` : ''}${x.pic && x.target ? ' · ' : ''}${x.target ? `Target: ${esc(x.target)}` : ''}</p>` : ''}</article>`).join('')
    : '<p class="empty">Tidak ada isu yang dilaporkan.</p>';
  const al = packageAlerts(p);
  const kv = [['Kontraktor', p.kontraktor], ['No. kontrak', p.noKontrak], ['Nilai kontrak', p.nilai ? fmtRp(p.nilai) : ''], ['Direksi pekerjaan', p.direksi], ['Pemberi tugas', p.pemberi], ['COD (amandemen)', fmtDate(p.cod)], ['Penugasan s.d.', fmtDate(p.penugasanSd)], ['Bank garansi s.d.', fmtDate(p.garansi)], ['Lingkup', p.lingkup]].filter(([, v]) => v && v !== '-');
  const html = `<div class="pkg">
    <div class="pkg-top"><span class="badge ${STATUS_BADGE[p.status]}">${esc(p.status)}</span><span class="pkg-dev">${p.dev === null ? '' : `deviasi ${fmtDev(p.dev)} poin`}</span><span class="pkg-meta">${esc(p.pso)}${p.jenis ? ` · ${esc(p.jenis)}` : ''}${p.milestone ? ` · ${esc(p.milestone)}` : ''}</span></div>
    ${bar('Aktual', p.aktual, STATUS_COLOR[p.status] || '#2D6CDF')}${bar('Plan', p.plan, '#7C93B3')}
    ${al.length ? `<div class="pkg-alerts">${al.map((x) => `<span class="badge ${x.sev === 0 || x.days < 0 ? 'badge-late' : 'badge-warning'}" title="${esc(x.text)}">${esc(x.tag)}: ${esc(x.text)}</span>`).join('')}</div>` : ''}
    ${pen ? `<h3 class="pkg-h">Penugasan induk</h3><div class="pen-link"><div><b>${esc(pen.nama)}</b><span>${esc(pen.noSurat || pen.kode)} · biaya dan masa penugasan dikelola di tingkat ini${pen.kontrak.length > 1 ? `, dibagi ${pen.kontrak.length} kontrak` : ''}</span>${pen.rbt ? `<span>Serapan ${fmtPct(pen.serapan)} dari RBT ${fmtRp(pen.rbt)}</span>` : ''}</div><button type="button" class="btn" data-pen="1">Buka penugasan</button></div>` : ''}
    <h3 class="pkg-h">Permasalahan dan tindak lanjut <span>${p.issues.length}</span></h3>${issues}
    <h3 class="pkg-h">Aktivitas periode ini</h3><p class="pkg-text">${esc(p.aktivitas) || '<span class="empty">Belum diisi.</span>'}</p>
    <h3 class="pkg-h">Kontrak dan penugasan</h3><dl class="record compact">${kv.map(([l, v]) => `<dt>${esc(l)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${p.dokumen.length ? `<details class="pkg-docs"><summary>Dokumen milestone (${p.dokumen.length})</summary><dl class="record compact">${p.dokumen.map((x) => `<dt>${esc(x.jenis)}</dt><dd>${esc(x.isi)}</dd>`).join('')}</dl></details>` : ''}
    <p class="pkg-foot">Data per ${esc(fmtDate(p.periode))}${p.kode ? ` · Kode lokasi ${esc(p.kode)}` : ''}</p></div>`;
  openCard(p.nama, `${p.pso} · ${p.kontraktor || ''}`.replace(/ · $/, ''), html, backCfg);
  if (pen) $('modal-body').onclick = (ev) => { if (ev.target.closest('[data-pen]')) openPenugasanCard(pen, () => openPackageCard(p, backCfg)); };
}

async function loadMonitoring() {
  const failed = [];
  if (SOURCES.lap_proyek.id) {
    try {
      const get = async (k) => parseSheet(SOURCES[k], (g) => normalizeTable(g, { lap_proyek: ['ID_Paket', 'Nama_Proyek'], lap_progres: ['Periode', 'ID_Paket', 'Progres_Aktual'], lap_isu: ['ID_Isu', 'ID_Paket'], lap_dok: ['ID_Paket', 'Jenis_Dokumen'] }[k]));
      const [pr, pg, is, dk] = await Promise.all([get('lap_proyek'), get('lap_progres'), get('lap_isu'), get('lap_dok')]);
      const rows = buildFromTemplate(pr, pg, is, dk);
      if (rows.some((r) => r.aktual !== null)) return { rows, source: 'Google Sheet monitoring (template)', failed };
      failed.push('Template monitoring belum berisi progres, memakai datalist lama');
    } catch (e) {
      failed.push(`Template monitoring (${e.message}), memakai datalist lama`);
    }
  }
  try {
    return { rows: await parseSheet(SOURCES.datalist, normalizeDatalist), source: 'Datalist_Pusmanpro', failed };
  } catch (e) {
    failed.push(`${SOURCES.datalist.sheet} (${e.message})`);
    return { rows: [], source: '-', failed };
  }
}

function renderProgressKpis() {
  const d = S.datalist;
  const n = (s) => d.filter((p) => p.status === s).length;
  const stale = d.filter((p) => p.ageDays !== null && p.ageDays > STALE_DAYS);
  const issues = issueRows();
  const oldest = d.reduce((m, p) => (p.periode && (!m || p.periode < m) ? p.periode : m), null);
  const cards = [
    { label: 'Kontrak dimonitor', value: d.length, sub: `${n('Selesai')} selesai · ${n('Belum mulai')} belum mulai`, open: () => openList(pkgList('Semua kontrak', d)) },
    { label: 'Merah', value: n('Merah'), sub: `deviasi di bawah ${DEV_YELLOW} poin`, open: () => openList(pkgList('Kontrak berstatus Merah', d.filter((p) => p.status === 'Merah').sort((a, b) => a.dev - b.dev))) },
    { label: 'Kuning', value: n('Kuning'), sub: `deviasi ${DEV_YELLOW} s.d. ${DEV_GREEN} poin`, open: () => openList(pkgList('Kontrak berstatus Kuning', d.filter((p) => p.status === 'Kuning'))) },
    { label: 'Isu terbuka', value: issues.length, sub: `pada ${d.filter((p) => p.issues.length).length} kontrak`, open: () => openList(issueList('Semua isu', issues)) },
    { label: 'Data perlu update', value: stale.length, sub: oldest ? `tertua ${fmtDate(oldest)} · batas ${STALE_DAYS} hari` : 'belum ada tanggal data', open: () => openList(pkgList(`Data lebih dari ${STALE_DAYS} hari`, stale.sort((a, b) => b.ageDays - a.ageDays))) },
  ];
  $('kpis').innerHTML = cards.map((c, i) => `<button type="button" class="card stat-card stat-btn" data-k="${i}"><div class="stat-label">${esc(c.label)}</div><div class="stat-value">${esc(c.value)}</div><div class="stat-sub">${esc(c.sub)}</div></button>`).join('');
  $('kpis').onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) cards[+b.dataset.k].open(); };
}

function renderPso() {
  const d = S.datalist;
  const groups = countBy(d, (p) => p.pso).map(([pso]) => pso);
  $('pso-board').innerHTML = groups.length ? groups.map((pso, i) => {
    const rows = d.filter((p) => p.pso === pso);
    const segs = STATUS_ORDER.map((s) => ({ s, n: rows.filter((p) => p.status === s).length })).filter((x) => x.n);
    return `<button type="button" class="stack-row" data-i="${i}"><span class="bar-label">${esc(pso)}</span><span class="stack">${segs.map((x) => `<i style="width:${(x.n / rows.length) * 100}%;background:${STATUS_COLOR[x.s]}" title="${esc(x.s)}: ${x.n}"></i>`).join('')}</span><span class="bar-val">${rows.length}</span></button>`;
  }).join('') : '<p class="empty">Belum ada data.</p>';
  $('pso-board').onclick = (e) => {
    const b = e.target.closest('[data-i]');
    if (b) openList(pkgList(`Kontrak ${groups[+b.dataset.i]}`, d.filter((p) => p.pso === groups[+b.dataset.i])));
  };
  $('legend-status').innerHTML = STATUS_ORDER.slice(0, 5).map((s) => `<span><i class="lg" style="background:${STATUS_COLOR[s]}"></i>${esc(s)}</span>`).join('');
}

function renderAttention() {
  const rows = S.datalist.filter((p) => p.status === 'Merah' || p.status === 'Kuning').sort((a, b) => a.dev - b.dev);
  $('attention-count').textContent = `${rows.length} kontrak · urut dari deviasi terbesar`;
  $('attention').innerHTML = rows.length ? rows.slice(0, 8).map((p, i) => `<button type="button" class="item-row" data-i="${i}"><span class="item-main"><span class="item-title">${esc(p.nama)}</span><span class="item-sub">${esc(p.pso)} · ${esc(p.milestone)} · aktual ${fmtPct(p.aktual)} / plan ${fmtPct(p.plan)}</span><span class="pp" title="Aktual ${fmtPct(p.aktual)}, plan ${fmtPct(p.plan)}"><i style="width:${Math.min(100, p.aktual)}%;background:${STATUS_COLOR[p.status]}"></i><b style="left:${Math.min(100, p.plan)}%"></b></span></span><span class="badge ${STATUS_BADGE[p.status]}">${fmtDev(p.dev)} poin</span></button>`).join('') : '<p class="empty">Tidak ada kontrak Merah atau Kuning.</p>';
  $('attention').onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) openPackageCard(rows[+b.dataset.i], pkgList('Kontrak perlu perhatian', rows)); };
  $('attention-all').onclick = () => openList(pkgList('Kontrak perlu perhatian', rows, 'Merah dan Kuning, urut dari deviasi terbesar'));
}

function renderIssues() {
  const all = issueRows();
  const cats = countBy(all, (x) => x.kategori);
  barList($('issue-cats'), cats, (k) => openList(issueList(k, all.filter((x) => x.kategori === k))));
}

function renderAlerts() {
  const a = alerts();
  $('alerts-count').textContent = `${a.length} peringatan: penugasan dan bank garansi`;
  $('alerts').innerHTML = a.length ? a.slice(0, 8).map((x, i) => `<button type="button" class="item-row" data-i="${i}"><span class="item-main"><span class="item-title">${esc((x.e || x.p).nama)}</span><span class="item-sub">${esc(x.text)}</span></span><span class="badge ${x.sev === 0 || x.days < 0 ? 'badge-late' : 'badge-warning'}">${esc(x.tag)}</span></button>`).join('') : '<p class="empty">Tidak ada peringatan.</p>';
  const cfg = { title: 'Peringatan penugasan dan bank garansi', rows: a, cols: [{ label: 'PSO', val: (r) => (r.e || r.p).pso }, { label: 'Penugasan / kontrak', val: (r) => (r.e || r.p).nama }, { label: 'Peringatan', val: (r) => r.tag }, { label: 'Keterangan', val: (r) => r.text }], card: (r, c) => openAlert(r, c) };
  $('alerts').onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) openAlert(a[+b.dataset.i], cfg); };
  $('alerts-all').onclick = () => openList(cfg);
}


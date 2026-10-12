const STATUS_ORDER = ['Merah', 'Kuning', 'Hijau', 'Selesai', 'Belum mulai', 'Belum dilaporkan'];
const STATUS_COLOR = { Merah: '#B42318', Kuning: '#E0A63A', Hijau: '#2F9E58', Selesai: '#2D6CDF', 'Belum mulai': '#B9C7DA', 'Belum dilaporkan': '#D5DAE2' };
const STALE_DAYS = 35;

const pkgCols = [
  { label: 'PSO', val: (r) => r.pso },
  { label: 'Paket', val: (r) => r.nama },
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
    { label: 'PSO', val: (r) => r.p.pso }, { label: 'Paket', val: (r) => r.p.nama }, { label: 'Kategori', val: (r) => r.kategori },
    { label: 'Detail', val: (r) => r.detail }, { label: 'Tindak lanjut', val: (r) => r.tl },
  ],
  card: (r, cfg) => openPackageCard(r.p, cfg),
});

function packageAlerts(p) {
  const out = [];
  const done = p.status === 'Selesai';
  const dPen = daysUntil(p.penugasanSd);
  if (p.habisSebelumCod) out.push({ p, sev: 0, tag: 'Penugasan habis sebelum COD', text: `Penugasan s.d. ${fmtDate(p.penugasanSd)}, COD ${fmtDate(p.cod)}`, days: dPen });
  else if (dPen !== null && dPen >= 0 && dPen <= 90) out.push({ p, sev: 1, tag: 'Penugasan segera berakhir', text: `Penugasan s.d. ${fmtDate(p.penugasanSd)} (${dPen} hari lagi)`, days: dPen });
  const dG = daysUntil(p.garansi);
  if (dG !== null && dG <= 90) out.push({ p, sev: dG < 0 ? 2 : 1, tag: dG < 0 ? 'Bank garansi lewat' : 'Bank garansi segera habis', text: `Berlaku s.d. ${fmtDate(p.garansi)}${done ? ' (paket selesai, pastikan pasca-BAST)' : ''}`, days: dG });
  if (p.ageDays !== null && p.ageDays > STALE_DAYS) out.push({ p, sev: 3, tag: 'Data perlu update', text: `Data terakhir ${fmtDate(p.periode)} (${p.ageDays} hari lalu)`, days: -p.ageDays });
  return out;
}

function alerts() {
  return S.datalist.flatMap((p) => packageAlerts(p).filter((x) => x.tag !== 'Data perlu update')).sort((a, b) => a.sev - b.sev || a.days - b.days);
}

function openPackageCard(p, backCfg) {
  const bar = (label, v, color) => `<div class="pk-bar"><span>${label}</span><span class="pk-track"><i style="width:${Math.min(100, v ?? 0)}%;background:${color}"></i></span><b>${fmtPct(v)}</b></div>`;
  const issues = p.issues.length
    ? p.issues.map((x) => `<article class="issue"><div class="issue-head"><span class="issue-cat">${esc(x.kategori)}</span>${x.status ? `<span class="badge ${/closed/i.test(x.status) ? 'badge-active' : 'badge-late'}">${esc(x.status)}</span>` : ''}</div>${x.detail ? `<p class="issue-detail">${esc(x.detail)}</p>` : ''}${x.tl ? `<p class="issue-tl"><b>Tindak lanjut</b>${esc(x.tl)}</p>` : ''}${x.pic || x.target ? `<p class="issue-meta">${x.pic ? `PIC: ${esc(x.pic)}` : ''}${x.pic && x.target ? ' · ' : ''}${x.target ? `Target: ${esc(x.target)}` : ''}</p>` : ''}</article>`).join('')
    : '<p class="empty">Tidak ada isu yang dilaporkan.</p>';
  const al = packageAlerts(p);
  const kv = [['Kontraktor', p.kontraktor], ['No. kontrak', p.noKontrak], ['Nilai kontrak', p.nilai ? fmtRp(p.nilai) : ''], ['Direksi pekerjaan', p.direksi], ['Pemberi tugas', p.pemberi], ['COD (amandemen)', fmtDate(p.cod)], ['Penugasan s.d.', fmtDate(p.penugasanSd)], ['Bank garansi s.d.', fmtDate(p.garansi)], ['Lingkup', p.lingkup]].filter(([, v]) => v && v !== '-');
  const html = `<div class="pkg">
    <div class="pkg-top"><span class="badge ${STATUS_BADGE[p.status]}">${esc(p.status)}</span><span class="pkg-dev">${p.dev === null ? '' : `deviasi ${fmtDev(p.dev)} poin`}</span><span class="pkg-meta">${esc(p.pso)}${p.jenis ? ` · ${esc(p.jenis)}` : ''}${p.milestone ? ` · ${esc(p.milestone)}` : ''}</span></div>
    ${bar('Aktual', p.aktual, STATUS_COLOR[p.status] || '#2D6CDF')}${bar('Plan', p.plan, '#7C93B3')}
    ${al.length ? `<div class="pkg-alerts">${al.map((x) => `<span class="badge ${x.sev === 0 || x.days < 0 ? 'badge-late' : 'badge-warning'}" title="${esc(x.text)}">${esc(x.tag)}: ${esc(x.text)}</span>`).join('')}</div>` : ''}
    <h3 class="pkg-h">Permasalahan dan tindak lanjut <span>${p.issues.length}</span></h3>${issues}
    <h3 class="pkg-h">Aktivitas periode ini</h3><p class="pkg-text">${esc(p.aktivitas) || '<span class="empty">Belum diisi.</span>'}</p>
    <h3 class="pkg-h">Kontrak dan penugasan</h3><dl class="record compact">${kv.map(([l, v]) => `<dt>${esc(l)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${p.dokumen.length ? `<details class="pkg-docs"><summary>Dokumen milestone (${p.dokumen.length})</summary><dl class="record compact">${p.dokumen.map((x) => `<dt>${esc(x.jenis)}</dt><dd>${esc(x.isi)}</dd>`).join('')}</dl></details>` : ''}
    <p class="pkg-foot">Data per ${esc(fmtDate(p.periode))}${p.kode ? ` · Kode lokasi ${esc(p.kode)}` : ''}</p></div>`;
  openCard(p.nama, `${p.pso} · ${p.kontraktor || ''}`.replace(/ · $/, ''), html, backCfg);
}

async function loadMonitoring() {
  const failed = [];
  if (SOURCES.lap_proyek.id) {
    try {
      const get = async (k) => normalizeTable(await loadSheet(SOURCES[k]), { lap_proyek: ['ID_Paket', 'Nama_Proyek'], lap_progres: ['Periode', 'ID_Paket', 'Progres_Aktual'], lap_isu: ['ID_Isu', 'ID_Paket'], lap_dok: ['ID_Paket', 'Jenis_Dokumen'] }[k]);
      const [pr, pg, is, dk] = await Promise.all([get('lap_proyek'), get('lap_progres'), get('lap_isu'), get('lap_dok')]);
      const rows = buildFromTemplate(pr, pg, is, dk);
      if (rows.some((r) => r.aktual !== null)) return { rows, source: 'Google Sheet monitoring (template)', failed };
      failed.push('Template monitoring belum berisi progres, memakai datalist lama');
    } catch (e) {
      failed.push(`Template monitoring (${e.message}), memakai datalist lama`);
    }
  }
  try {
    return { rows: normalizeDatalist(await loadSheet(SOURCES.datalist)), source: 'Datalist_Pusmanpro', failed };
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
    { label: 'Paket dimonitor', value: d.length, sub: `${n('Selesai')} selesai · ${n('Belum mulai')} belum mulai`, open: () => openList(pkgList('Semua paket', d)) },
    { label: 'Merah', value: n('Merah'), sub: `deviasi di bawah ${DEV_YELLOW} poin`, open: () => openList(pkgList('Paket berstatus Merah', d.filter((p) => p.status === 'Merah').sort((a, b) => a.dev - b.dev))) },
    { label: 'Kuning', value: n('Kuning'), sub: `deviasi ${DEV_YELLOW} s.d. ${DEV_GREEN} poin`, open: () => openList(pkgList('Paket berstatus Kuning', d.filter((p) => p.status === 'Kuning'))) },
    { label: 'Isu terbuka', value: issues.length, sub: `pada ${d.filter((p) => p.issues.length).length} paket`, open: () => openList(issueList('Semua isu', issues)) },
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
    if (b) openList(pkgList(`Paket ${groups[+b.dataset.i]}`, d.filter((p) => p.pso === groups[+b.dataset.i])));
  };
  $('legend-status').innerHTML = STATUS_ORDER.slice(0, 5).map((s) => `<span><i class="lg" style="background:${STATUS_COLOR[s]}"></i>${esc(s)}</span>`).join('');
}

function renderAttention() {
  const rows = S.datalist.filter((p) => p.status === 'Merah' || p.status === 'Kuning').sort((a, b) => a.dev - b.dev);
  $('attention-count').textContent = `${rows.length} paket · urut dari deviasi terbesar`;
  $('attention').innerHTML = rows.length ? rows.slice(0, 8).map((p, i) => `<button type="button" class="item-row" data-i="${i}"><span class="item-main"><span class="item-title">${esc(p.nama)}</span><span class="item-sub">${esc(p.pso)} · ${esc(p.milestone)} · aktual ${fmtPct(p.aktual)} / plan ${fmtPct(p.plan)}</span><span class="pp" title="Aktual ${fmtPct(p.aktual)}, plan ${fmtPct(p.plan)}"><i style="width:${Math.min(100, p.aktual)}%;background:${STATUS_COLOR[p.status]}"></i><b style="left:${Math.min(100, p.plan)}%"></b></span></span><span class="badge ${STATUS_BADGE[p.status]}">${fmtDev(p.dev)} poin</span></button>`).join('') : '<p class="empty">Tidak ada paket Merah atau Kuning.</p>';
  $('attention').onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) openPackageCard(rows[+b.dataset.i], pkgList('Paket perlu perhatian', rows)); };
  $('attention-all').onclick = () => openList(pkgList('Paket perlu perhatian', rows, 'Merah dan Kuning, urut dari deviasi terbesar'));
}

function renderIssues() {
  const all = issueRows();
  const cats = countBy(all, (x) => x.kategori);
  barList($('issue-cats'), cats, (k) => openList(issueList(k, all.filter((x) => x.kategori === k))));
}

function renderAlerts() {
  const a = alerts();
  $('alerts-count').textContent = `${a.length} peringatan kontrak dan penugasan`;
  $('alerts').innerHTML = a.length ? a.slice(0, 8).map((x, i) => `<button type="button" class="item-row" data-i="${i}"><span class="item-main"><span class="item-title">${esc(x.p.nama)}</span><span class="item-sub">${esc(x.text)}</span></span><span class="badge ${x.sev === 0 || x.days < 0 ? 'badge-late' : 'badge-warning'}">${esc(x.tag)}</span></button>`).join('') : '<p class="empty">Tidak ada peringatan.</p>';
  const cfg = { title: 'Peringatan kontrak dan penugasan', rows: a, cols: [{ label: 'PSO', val: (r) => r.p.pso }, { label: 'Paket', val: (r) => r.p.nama }, { label: 'Peringatan', val: (r) => r.tag }, { label: 'Keterangan', val: (r) => r.text }], card: (r, c) => openPackageCard(r.p, c) };
  $('alerts').onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) openPackageCard(a[+b.dataset.i].p, cfg); };
  $('alerts-all').onclick = () => openList(cfg);
}


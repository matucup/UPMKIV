const QUICK_LINKS = [
  { title: 'SK PST', desc: 'Surat keputusan penetapan Project Site Team', href: 'sk-pst.html' },
  { title: 'Executive Summary', desc: 'Ringkasan eksekutif kinerja unit', href: 'executive-summary.html' },
  { title: 'Laporan', desc: 'Kumpulan laporan berkala', href: 'laporan.html' },
  { title: 'Evidence KPI', desc: 'Bukti pendukung pencapaian KPI', href: 'evidence-kpi.html' },
  { title: 'Man-Month', desc: 'Alokasi dan realisasi orang-bulan', href: 'man-month.html' },
  { title: 'Kajian', desc: 'Dokumen kajian teknis dan non-teknis', href: 'kajian.html' },
  { title: 'Lesson Learn', desc: 'Pembelajaran dari pelaksanaan proyek', href: 'lesson-learn.html' },
  { title: 'Pakta Integritas', desc: 'Status penandatanganan pakta integritas', href: 'pakta-integritas.html' },
  { title: 'Monitoring Progress', desc: 'Status dan progres seluruh proyek', href: 'monitoring-progress.html' },
  { title: 'Sertifikat', desc: 'Sertifikat kompetensi personil', href: 'sertifikat.html' },
  { title: 'Project Site Team', desc: 'Executive summary dan personil site', href: 'site-team-executive-summary.html' },
];

const STATUS_BADGE = {
  'Berjalan': 'badge-active',
  'Segera berakhir': 'badge-warning',
  'Berakhir': 'badge-late',
  'Tanpa tanggal': 'badge-muted',
  'Belum ditugaskan': 'badge-muted',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });
const fmtDate = (d) => (d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const $ = (id) => document.getElementById(id);

function countBy(arr, fn) {
  const m = new Map();
  arr.forEach((x) => m.set(fn(x), (m.get(fn(x)) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function daysText(d) {
  if (d === null) return 'Tanggal akhir belum diisi';
  return d < 0 ? `Berakhir ${-d} hari lalu` : d === 0 ? 'Berakhir hari ini' : `${d} hari lagi`;
}

let S = null;
let lastFocus = null;
let currentList = null;

async function loadAll() {
  const jobs = { proyek: normalizeProyek, personil: normalizePersonil, mm: normalizeMM, tad: normalizeTad };
  const data = {};
  const failed = [];
  await Promise.all(Object.entries(jobs).map(async ([k, fn]) => {
    try {
      data[k] = fn(await loadSheet(SOURCES[k]));
    } catch (e) {
      failed.push(`${SOURCES[k].sheet} (${e.message})`);
      data[k] = k === 'mm' ? { months: [], rows: [] } : [];
    }
  }));
  return { data, failed };
}

function mmWindow(mm) {
  const cur = new Date().getFullYear() * 12 + new Date().getMonth();
  let start = mm.months.findIndex((m) => m.y * 12 + m.m >= cur);
  if (start < 0) start = Math.max(0, mm.months.length - 6);
  return { start, end: Math.min(mm.months.length, start + 6), cur: mm.months.findIndex((m) => m.y * 12 + m.m === cur) };
}

/* Modal */

function openModal() {
  lastFocus = document.activeElement;
  $('modal').hidden = false;
  document.body.style.overflow = 'hidden';
  $('modal-close').focus();
}

function closeModal() {
  $('modal').hidden = true;
  document.body.style.overflow = '';
  currentList = null;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function openList(cfg) {
  currentList = cfg;
  $('modal-title').textContent = cfg.title;
  $('modal-sub').textContent = cfg.sub || '';
  $('modal-tools').innerHTML = `<input type="search" id="modal-search" class="search" placeholder="Cari di daftar ini…" aria-label="Cari di daftar ini"><span id="modal-count" class="count"></span>`;
  const searchable = cfg.rows.map((r) => cfg.cols.map((c) => c.val(r)).join(' ').toLowerCase());
  const draw = () => {
    const q = $('modal-search').value.trim().toLowerCase();
    const idx = [];
    searchable.forEach((t, i) => { if (!q || t.includes(q)) idx.push(i); });
    const shown = idx.slice(0, 500);
    $('modal-count').textContent = `${idx.length} dari ${cfg.rows.length}${idx.length > 500 ? ' (500 teratas)' : ''}`;
    $('modal-body').innerHTML = shown.length
      ? `<div class="table-wrap"><table class="table"><thead><tr>${cfg.cols.map((c) => `<th${c.num ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${shown.map((i) => `<tr${cfg.record ? ` class="clickable" tabindex="0" data-i="${i}"` : ''}>${cfg.cols.map((c) => `<td${c.num ? ' class="num"' : ''}>${c.html ? c.html(cfg.rows[i]) : esc(c.val(cfg.rows[i]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      : '<p class="empty">Tidak ada data yang cocok.</p>';
  };
  $('modal-search').addEventListener('input', draw);
  $('modal-body').onclick = (e) => {
    const tr = e.target.closest('tr[data-i]');
    if (tr && cfg.record) openRecord(cfg, cfg.rows[+tr.dataset.i]);
  };
  $('modal-body').onkeydown = (e) => {
    const tr = e.target.closest('tr[data-i]');
    if (tr && cfg.record && e.key === 'Enter') openRecord(cfg, cfg.rows[+tr.dataset.i]);
  };
  draw();
  if ($('modal').hidden) openModal();
}

function openRecord(cfg, row) {
  const fields = cfg.record(row);
  $('modal-title').textContent = cfg.recordTitle ? cfg.recordTitle(row) : cfg.title;
  $('modal-sub').textContent = cfg.title;
  $('modal-tools').innerHTML = '<button type="button" class="back" id="modal-back">← Kembali ke daftar</button>';
  $('modal-back').onclick = () => openList(cfg);
  $('modal-body').onclick = null;
  $('modal-body').onkeydown = null;
  $('modal-body').innerHTML = `<dl class="record">${fields.filter(([, v]) => String(v ?? '').trim() !== '').map(([l, v]) => `<dt>${esc(l)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
  if ($('modal').hidden) openModal();
  $('modal-back').focus();
}

/* Daftar detail per dataset */

const projectCols = [
  { label: 'PSO', val: (r) => r.pso },
  { label: 'Proyek', val: (r) => r.nama },
  { label: 'Provinsi', val: (r) => r.provinsi },
  { label: 'PIC', val: (r) => r.pic },
  { label: 'Akhir penugasan', val: (r) => fmtDate(r.akhir) },
  { label: 'Status', val: (r) => r.status, html: (r) => `<span class="badge ${STATUS_BADGE[r.status]}">${esc(r.status)}</span>` },
];

const projectList = (title, rows, sub) => ({ title, sub, rows, cols: projectCols, record: (r) => r._f, recordTitle: (r) => r.nama });

const personilList = (title, rows) => ({
  title, rows, record: (r) => r._f, recordTitle: (r) => r.nama,
  cols: [
    { label: 'Nama', val: (r) => r.nama }, { label: 'PSO', val: (r) => r.pso },
    { label: 'Penugasan', val: (r) => r.penugasan }, { label: 'Kualifikasi', val: (r) => r.kualifikasi },
    { label: 'Proyek', val: (r) => r.proyek },
  ],
});

const tadList = (title, rows) => ({
  title, rows, record: (r) => r._f, recordTitle: (r) => r.nama || r.peruntukan,
  cols: [
    { label: 'No.', val: (r) => r.no }, { label: 'Peruntukan', val: (r) => r.peruntukan },
    { label: 'Kualifikasi', val: (r) => r.hasil || r.kualifikasi }, { label: 'Nama personil', val: (r) => r.nama || '(belum ada)' },
    { label: 'Mobilisasi', val: (r) => r.mobilisasi },
    { label: 'Terlambat (hari kerja)', val: (r) => (r.late > 0 ? String(r.late) : '-'), num: true },
  ],
});

function mmList(title, sub, rows) {
  return {
    title, sub, rows,
    cols: [
      { label: 'PSO', val: (r) => r.pso }, { label: 'Proyek', val: (r) => r.proyek },
      { label: 'Posisi', val: (r) => r.posisi }, { label: 'Kualifikasi', val: (r) => r.kualifikasi },
      { label: 'Man-month', val: (r) => fmt(r.mm), num: true },
    ],
    record: (r) => [['PSO', r.pso], ['Proyek', r.proyek], ['Posisi', r.posisi], ['Keahlian', r.keahlian], ['Kualifikasi', r.kualifikasi], ['Man-month', fmt(r.mm)]],
    recordTitle: (r) => r.posisi,
  };
}

/* Render */

function renderKpis() {
  const { proyek, personil, mm, tad } = S;
  const win = mmWindow(mm);
  const wm = mm.months.slice(win.start, win.end);
  const winRows = mm.rows.map((r) => ({ ...r, mm: r.vals.slice(win.start, win.end).reduce((a, b) => a + b, 0) })).filter((r) => r.mm > 0);
  const winTotal = winRows.reduce((a, r) => a + r.mm, 0);
  const late = tad.filter((t) => t.late > 0);
  const mobilized = tad.filter((t) => t.nama).length;
  const cards = [
    { label: 'Proyek terdaftar', value: proyek.length, sub: `${proyek.filter((p) => p.pic).length} ditugaskan · ${proyek.filter((p) => !p.pic).length} belum`, open: () => openList(projectList('Semua proyek', proyek)) },
    { label: 'Personil', value: personil.length, sub: `${new Set(personil.map((p) => p.pso)).size} PSO / unit kerja`, open: () => openList(personilList('Seluruh personil', personil)) },
    { label: 'Man-month 6 bulan', value: fmt(winTotal), sub: wm.length ? `${wm[0].label} – ${wm[wm.length - 1].label}` : 'Belum ada data bulan', open: () => openList(mmList('Man-month 6 bulan', wm.length ? `${wm[0].label} – ${wm[wm.length - 1].label}` : '', winRows.sort((a, b) => b.mm - a.mm))) },
    { label: 'Permintaan TAD', value: tad.length, sub: `${late.length} terlambat · ${mobilized} sudah mobilisasi`, open: () => openList(tadList('Semua permintaan TAD', tad)) },
  ];
  $('kpis').innerHTML = cards.map((c, i) => `<button type="button" class="card stat-card stat-btn" data-k="${i}"><div class="stat-label">${esc(c.label)}</div><div class="stat-value">${esc(c.value)}</div><div class="stat-sub">${esc(c.sub)}</div></button>`).join('');
  $('kpis').onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) cards[+b.dataset.k].open(); };
}

function renderChart() {
  const { mm } = S;
  const n = mm.months.length;
  if (!n) { $('chart').innerHTML = '<p class="empty">Belum ada data man-month.</p>'; return; }
  const totals = mm.months.map((_, i) => mm.rows.reduce((a, r) => a + r.vals[i], 0));
  const max = Math.max(...totals, 1);
  const step = max <= 10 ? 2 : Math.pow(10, Math.floor(Math.log10(max / 4))) * (max / 4 > 5 * Math.pow(10, Math.floor(Math.log10(max / 4))) ? 10 : max / 4 > 2 * Math.pow(10, Math.floor(Math.log10(max / 4))) ? 5 : 2);
  const top = Math.ceil(max / step) * step;
  const W = 1000, H = 250, pl = 44, pb = 34, pt = 14;
  const bw = (W - pl) / n;
  const y = (v) => pt + (H - pt - pb) * (1 - v / top);
  const win = mmWindow(mm);
  let g = '';
  for (let v = 0; v <= top; v += step) g += `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 8}" y="${y(v) + 4}" class="ytick">${v}</text>`;
  mm.months.forEach((mo, i) => {
    const inWin = i >= win.start && i < win.end;
    const cls = i === win.cur ? 'bar now' : inWin ? 'bar win' : 'bar';
    const x = pl + i * bw + bw * 0.15;
    const label = Object.keys(MONTHS_ID).find((k) => MONTHS_ID[k] === mo.m && k.length === 3);
    const showYear = i === 0 || mo.m === 0;
    g += `<g class="${cls}" data-i="${i}" tabindex="0" role="button" aria-label="${esc(mo.label)}: ${fmt(totals[i])} man-month"><title>${esc(mo.label)}: ${fmt(totals[i])} man-month</title><rect x="${x}" y="${y(totals[i])}" width="${bw * 0.7}" height="${Math.max(0, y(0) - y(totals[i]))}" rx="2"/></g>`;
    g += `<text x="${pl + i * bw + bw / 2}" y="${H - 16}" class="xtick">${label ? label[0].toUpperCase() + label.slice(1) : ''}</text>`;
    if (showYear) g += `<text x="${pl + i * bw + bw / 2}" y="${H - 3}" class="xtick yr">${mo.y}</text>`;
  });
  $('chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Man-month per bulan">${g}</svg>`;
  const open = (i) => {
    const rows = mm.rows.map((r) => ({ ...r, mm: r.vals[i] })).filter((r) => r.mm > 0).sort((a, b) => a.pso.localeCompare(b.pso) || a.proyek.localeCompare(b.proyek));
    openList(mmList(`Man-month ${mm.months[i].label}`, `Total ${fmt(totals[i])} man-month`, rows));
  };
  $('chart').onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) open(+b.dataset.i); };
  $('chart').onkeydown = (e) => { const b = e.target.closest('[data-i]'); if (b && e.key === 'Enter') open(+b.dataset.i); };
}

function barList(el, entries, onPick) {
  const max = Math.max(...entries.map((e) => e[1]), 1);
  el.innerHTML = entries.length
    ? entries.map(([k, v], i) => `<button type="button" class="bar-row" data-i="${i}"><span class="bar-label">${esc(k)}</span><span class="bar-track"><span class="bar-fill" style="width:${(v / max) * 100}%"></span></span><span class="bar-val">${v}</span></button>`).join('')
    : '<p class="empty">Belum ada data.</p>';
  el.onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) onPick(entries[+b.dataset.i][0]); };
}

function renderPanels() {
  const { proyek, personil, tad } = S;
  barList($('pso-proyek'), countBy(proyek, (p) => p.pso), (k) => openList(projectList(`Proyek PSO ${k}`, proyek.filter((p) => p.pso === k))));
  barList($('pso-personil'), countBy(personil, (p) => p.pso), (k) => openList(personilList(`Personil ${k}`, personil.filter((p) => p.pso === k))));

  const soon = proyek.filter((p) => p.status === 'Segera berakhir').sort((a, b) => a.daysLeft - b.daysLeft);
  const ended = proyek.filter((p) => p.status === 'Berakhir').sort((a, b) => b.daysLeft - a.daysLeft);
  const watch = [...soon, ...ended];
  $('expiring-count').textContent = `${soon.length} segera berakhir · ${ended.length} sudah berakhir`;
  $('expiring').innerHTML = watch.length
    ? watch.slice(0, 7).map((p, i) => `<button type="button" class="item-row" data-i="${i}"><span class="item-main"><span class="item-title">${esc(p.nama)}</span><span class="item-sub">${esc(p.pso)}${p.provinsi ? ` · ${esc(p.provinsi)}` : ''}</span></span><span class="badge ${STATUS_BADGE[p.status]}">${esc(daysText(p.daysLeft))}</span></button>`).join('')
    : '<p class="empty">Tidak ada penugasan yang segera berakhir.</p>';
  $('expiring').onclick = (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    const cfg = projectList('Penugasan segera / sudah berakhir', watch);
    openRecord(cfg, watch[+b.dataset.i]);
  };
  $('expiring-all').onclick = () => openList(projectList('Penugasan segera / sudah berakhir', watch, 'Urut dari yang paling dekat berakhir'));

  const lateRows = tad.filter((t) => t.late > 0).sort((a, b) => b.late - a.late);
  $('tad-late').innerHTML = lateRows.length
    ? lateRows.slice(0, 7).map((t, i) => `<button type="button" class="item-row" data-i="${i}"><span class="item-main"><span class="item-title">${esc(t.nama || '(belum ada nama)')} — ${esc(t.hasil || t.kualifikasi)}</span><span class="item-sub">${esc(t.peruntukan)}</span></span><span class="badge badge-late">+${t.late} hari kerja</span></button>`).join('')
    : '<p class="empty">Tidak ada keterlambatan mobilisasi.</p>';
  $('tad-late').onclick = (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    const cfg = tadList('Keterlambatan mobilisasi TAD', lateRows);
    openRecord(cfg, lateRows[+b.dataset.i]);
  };
  $('tad-all').onclick = () => openList(tadList('Semua permintaan TAD', tad));
}

function renderQuickLinks() {
  $('quicklinks').innerHTML = QUICK_LINKS.map((q) => `<a href="${q.href}" class="card quicklink-card"><div class="quicklink-title">${q.title}</div><div class="quicklink-desc">${q.desc}</div></a>`).join('');
}

async function refresh() {
  $('refresh').disabled = true;
  $('updated').textContent = 'Memuat data dari Google Sheets…';
  const { data, failed } = await loadAll();
  S = data;
  $('banner').hidden = !failed.length;
  $('banner').textContent = failed.length ? `Data gagal dimuat dari Google Sheets: ${failed.join('; ')}. Bagian terkait dikosongkan. Pastikan sheet dibagikan sebagai "Siapa saja yang memiliki link".` : '';
  renderKpis();
  renderChart();
  renderPanels();
  $('updated').textContent = `Dimuat: ${S.proyek.length} proyek · ${S.personil.length} personil · ${S.mm.rows.length} baris man-month · ${S.tad.length} baris TAD · Diperbarui ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  $('refresh').disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  renderQuickLinks();
  $('refresh').onclick = refresh;
  $('modal-close').onclick = closeModal;
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });
  refresh();
});

const STATUS_BADGE = {
  'Berjalan': 'badge-active',
  'Segera berakhir': 'badge-warning',
  'Berakhir': 'badge-late',
  'Tanpa tanggal': 'badge-muted',
  'Belum ditugaskan': 'badge-muted',
  Merah: 'badge-late',
  Kuning: 'badge-warning',
  Hijau: 'badge-active',
  Selesai: 'badge-done',
  'Belum mulai': 'badge-muted',
  'Belum dilaporkan': 'badge-muted',
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

let lastFocus = null;
let currentList = null;

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

/* Pengurutan daftar detail: default menaik (A-Z / kecil ke besar / tanggal terlama); klik judul kolom untuk mengubah arah. */

function sortKey(v) {
  const s = String(v ?? '').replace(/\u2212/g, '-').trim();
  if (s === '' || s === '-') return { t: 0 };
  if (/^[+-]?\d[\d.,]*\s*%?$/.test(s)) {
    const n = parseNum(s.replace('%', '').replace(/^\+/, ''));
    if (n !== null) return { t: 1, n };
  }
  if (/^\d{1,2}[\s-][A-Za-z]{3,}\.?[\s-]\d{2,4}$/.test(s)) {
    const d = parseDate(s);
    if (d) return { t: 2, n: d.getTime() };
  }
  return { t: 3, s };
}

const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });

function cmpKeys(a, b) {
  if (a.t === 0 || b.t === 0) return a.t === b.t ? 0 : a.t === 0 ? 1 : -1; // kosong selalu di bawah
  if (a.t === b.t && a.t !== 3) return a.n - b.n;
  return collator.compare(a.s ?? String(a.n), b.s ?? String(b.n));
}

function openList(cfg) {
  currentList = cfg;
  $('modal-title').textContent = cfg.title;
  $('modal-sub').textContent = cfg.sub || '';
  $('modal-tools').innerHTML = `<input type="search" id="modal-search" class="search" placeholder="Cari di daftar ini…" aria-label="Cari di daftar ini"><span id="modal-count" class="count"></span>`;
  const searchable = cfg.rows.map((r) => cfg.cols.map((c) => c.val(r)).join(' ').toLowerCase());
  const keys = cfg.rows.map((r) => cfg.cols.map((c) => sortKey(c.val(r))));
  // Urutan asli dipertahankan hanya bila pemanggil menyebutnya ("Urut dari ..."); selain itu menaik menurut kolom kiri ke kanan.
  if (!cfg._sort) cfg._sort = { col: cfg.sub && /urut/i.test(cfg.sub) ? null : -1, dir: 1 };
  const sortBy = cfg._sort;
  const compare = (i, j) => {
    if (sortBy.col === null) return 0;
    if (sortBy.col >= 0) return sortBy.dir * cmpKeys(keys[i][sortBy.col], keys[j][sortBy.col]) || i - j;
    for (let c = 0; c < cfg.cols.length; c++) { const d = cmpKeys(keys[i][c], keys[j][c]); if (d) return d; }
    return i - j;
  };
  const draw = () => {
    const q = $('modal-search').value.trim().toLowerCase();
    const idx = [];
    searchable.forEach((t, i) => { if (!q || t.includes(q)) idx.push(i); });
    idx.sort(compare);
    const shown = idx.slice(0, 500);
    $('modal-count').textContent = `${idx.length} dari ${cfg.rows.length}${idx.length > 500 ? ' (500 teratas)' : ''}`;
    $('modal-body').innerHTML = shown.length
      ? `<div class="table-wrap"><table class="table"><thead><tr>${cfg.cols.map((c, ci) => { const on = sortBy.col === ci || (sortBy.col === -1 && ci === 0); return `<th class="sortable${c.num ? ' num' : ''}" data-col="${ci}" tabindex="0" role="columnheader" aria-sort="${on ? (sortBy.dir > 0 ? 'ascending' : 'descending') : 'none'}" title="Klik untuk mengurutkan">${esc(c.label)}<span class="sort-ind">${on ? (sortBy.dir > 0 ? ' ▲' : ' ▼') : ''}</span></th>`; }).join('')}</tr></thead><tbody>${shown.map((i) => `<tr${cfg.record || cfg.card ? ` class="clickable" tabindex="0" data-i="${i}"` : ''}>${cfg.cols.map((c) => `<td${c.num ? ' class="num"' : ''}>${c.html ? c.html(cfg.rows[i]) : esc(c.val(cfg.rows[i]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      : '<p class="empty">Tidak ada data yang cocok.</p>';
  };
  $('modal-search').addEventListener('input', draw);
  const toggleSort = (th) => {
    const col = +th.dataset.col;
    if (sortBy.col === col) sortBy.dir = -sortBy.dir; else { sortBy.col = col; sortBy.dir = 1; }
    draw();
    const again = $('modal-body').querySelector(`th[data-col="${col}"]`);
    if (again) again.focus();
  };
  $('modal-body').onclick = (e) => {
    const th = e.target.closest('th[data-col]');
    if (th) { toggleSort(th); return; }
    const tr = e.target.closest('tr[data-i]');
    if (tr && (cfg.record || cfg.card)) (cfg.card ? cfg.card(cfg.rows[+tr.dataset.i], cfg) : openRecord(cfg, cfg.rows[+tr.dataset.i]));
  };
  $('modal-body').onkeydown = (e) => {
    const th = e.target.closest('th[data-col]');
    if (th && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleSort(th); return; }
    const tr = e.target.closest('tr[data-i]');
    if (tr && (cfg.record || cfg.card) && e.key === 'Enter') (cfg.card ? cfg.card(cfg.rows[+tr.dataset.i], cfg) : openRecord(cfg, cfg.rows[+tr.dataset.i]));
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

function openCard(title, sub, html, backCfg) {
  $('modal-title').textContent = title;
  $('modal-sub').textContent = sub || '';
  $('modal-tools').innerHTML = backCfg ? '<button type="button" class="back" id="modal-back">← Kembali</button>' : '';
  if (backCfg) $('modal-back').onclick = typeof backCfg === 'function' ? backCfg : () => openList(backCfg);
  $('modal-body').onclick = null;
  $('modal-body').onkeydown = null;
  $('modal-body').innerHTML = html;
  if ($('modal').hidden) openModal();
  (backCfg ? $('modal-back') : $('modal-close')).focus();
}

function barList(el, entries, onPick) {
  const max = Math.max(...entries.map((e) => e[1]), 1);
  el.innerHTML = entries.length
    ? entries.map(([k, v], i) => `<button type="button" class="bar-row" data-i="${i}"><span class="bar-label">${esc(k)}</span><span class="bar-track"><span class="bar-fill" style="width:${(v / max) * 100}%"></span></span><span class="bar-val">${v}</span></button>`).join('')
    : '<p class="empty">Belum ada data.</p>';
  el.onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) onPick(entries[+b.dataset.i][0]); };
}

function initModal() {
  $('modal-close').onclick = closeModal;
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });
}

async function loadSources(jobs) {
  const data = {};
  const failed = [];
  await Promise.all(Object.entries(jobs).map(async ([k, [fn, empty]]) => {
    try {
      data[k] = await parseSheet(SOURCES[k], fn);
    } catch (e) {
      failed.push(`${SOURCES[k].sheet} (${e.message})`);
      data[k] = empty;
    }
  }));
  return { data, failed };
}

function showBanner(failed) {
  $('banner').hidden = !failed.length;
  $('banner').textContent = failed.length ? `Data gagal dimuat dari Google Sheets: ${failed.join('; ')}. Bagian terkait dikosongkan. Pastikan sheet dibagikan sebagai "Siapa saja yang memiliki link".` : '';
}

const fmtRp = (n) => (n >= 1e9 ? `Rp ${(n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M` : n >= 1e6 ? `Rp ${(n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt` : `Rp ${Math.round(n).toLocaleString('id-ID')}`);
const fmtPct = (n) => (n === null || n === undefined ? '-' : `${n.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`);
const fmtDev = (n) => (n === null || n === undefined ? '-' : `${n > 0 ? '+' : ''}${n.toLocaleString('id-ID', { maximumFractionDigits: 1 })}`);

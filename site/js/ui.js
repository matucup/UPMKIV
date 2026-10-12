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
      ? `<div class="table-wrap"><table class="table"><thead><tr>${cfg.cols.map((c) => `<th${c.num ? ' class="num"' : ''}>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${shown.map((i) => `<tr${cfg.record || cfg.card ? ` class="clickable" tabindex="0" data-i="${i}"` : ''}>${cfg.cols.map((c) => `<td${c.num ? ' class="num"' : ''}>${c.html ? c.html(cfg.rows[i]) : esc(c.val(cfg.rows[i]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      : '<p class="empty">Tidak ada data yang cocok.</p>';
  };
  $('modal-search').addEventListener('input', draw);
  $('modal-body').onclick = (e) => {
    const tr = e.target.closest('tr[data-i]');
    if (tr && (cfg.record || cfg.card)) (cfg.card ? cfg.card(cfg.rows[+tr.dataset.i], cfg) : openRecord(cfg, cfg.rows[+tr.dataset.i]));
  };
  $('modal-body').onkeydown = (e) => {
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
  $('modal-tools').innerHTML = backCfg ? '<button type="button" class="back" id="modal-back">← Kembali ke daftar</button>' : '';
  if (backCfg) $('modal-back').onclick = () => openList(backCfg);
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
      data[k] = fn(await loadSheet(SOURCES[k]));
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

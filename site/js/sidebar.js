const NAV_ITEMS = [
  { href: 'index.html', label: 'Beranda' },
  { href: 'sk-pst.html', label: 'SK PST' },
  { href: 'executive-summary.html', label: 'Executive Summary' },
  { href: 'laporan.html', label: 'Laporan' },
  { href: 'evidence-kpi.html', label: 'Evidence KPI' },
  { href: 'man-month.html', label: 'Man-Month' },
  { href: 'kajian.html', label: 'Kajian' },
  { href: 'lesson-learn.html', label: 'Lesson Learn' },
  { href: 'pakta-integritas.html', label: 'Pakta Integritas' },
  { href: 'monitoring-progress.html', label: 'Monitoring Progress' },
  { href: 'sertifikat.html', label: 'Sertifikat' },
  {
    group: 'Project Site Team',
    children: [
      { href: 'site-team-executive-summary.html', label: 'Executive Summary' },
      { href: 'site-team-personil.html', label: 'Personil' },
    ],
  },
];

function currentFileName() {
  const path = window.location.pathname;
  const base = path.substring(path.lastIndexOf('/') + 1);
  return base === '' ? 'index.html' : base;
}

function renderLink(item, current, isChild) {
  const active = item.href === current;
  const classes = ['nav-link'];
  if (isChild) classes.push('child');
  if (active) classes.push('active');
  return `<a href="${item.href}" class="${classes.join(' ')}">${item.label}</a>`;
}

function renderSidebar() {
  const current = currentFileName();
  const parts = NAV_ITEMS.map((item) => {
    if (item.group) {
      const children = item.children.map((child) => renderLink(child, current, true)).join('');
      return `<div class="sidebar-group-label">${item.group}</div>${children}`;
    }
    return renderLink(item, current, false);
  });

  return `
    <div class="sidebar-header">
      <div class="sidebar-eyebrow">PT PLN (PERSERO)</div>
      <div class="sidebar-title">UPMK IV</div>
      <div class="sidebar-subtitle">Dashboard Manajemen Jaringan</div>
    </div>
    <nav class="sidebar-nav">${parts.join('')}</nav>
    <div class="sidebar-footer">v1.0 &middot; Data contoh (placeholder)</div>
  `;
}

function mountSidebar() {
  const container = document.getElementById('sidebar');
  if (!container) return;
  container.classList.add('sidebar');
  container.innerHTML = renderSidebar();
}

document.addEventListener('DOMContentLoaded', mountSidebar);

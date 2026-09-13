const STATS = [
  { label: 'Total Proyek Aktif', value: '12', sub: '3 site · 4 provinsi' },
  { label: 'Rata-rata Progress', value: '68%', sub: 'naik 4% dari bulan lalu' },
  { label: 'KPI Tercapai', value: '24/30', sub: '80% pencapaian' },
  { label: 'Personil Aktif', value: '86', sub: '12 Project Site Team' },
];

const STATUS_STYLES = {
  Aktif: { badge: 'badge-active', bar: 'progress-fill-active' },
  Perhatian: { badge: 'badge-warning', bar: 'progress-fill-warning' },
  Selesai: { badge: 'badge-done', bar: 'progress-fill-done' },
};

const PROJECTS = [
  { name: 'Paket Sumatera 1 - GI Baru', status: 'Aktif', progress: 74, pic: 'Ahmad Ridwan' },
  { name: 'Paket Jawa Tengah 2 - SUTT 150kV', status: 'Perhatian', progress: 41, pic: 'Dewi Anjani' },
  { name: 'Paket Kalimantan - Distribusi', status: 'Aktif', progress: 88, pic: 'Bagus Wicaksono' },
  { name: 'Paket Sulawesi - Gardu Induk', status: 'Selesai', progress: 100, pic: 'Nur Fadilah' },
];

const KPI_HIGHLIGHTS = [
  { label: 'Ketepatan Waktu', value: '82%' },
  { label: 'Kualitas Pekerjaan', value: '91%' },
  { label: 'Efisiensi Biaya', value: '76%' },
];

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

function renderStats() {
  const el = document.getElementById('stats');
  el.innerHTML = STATS.map((s) => `
    <div class="card stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>
  `).join('');
}

function renderProjects() {
  const el = document.getElementById('projects');
  el.innerHTML = PROJECTS.map((p) => {
    const style = STATUS_STYLES[p.status];
    return `
      <div class="project-row">
        <div class="project-row-top">
          <div class="project-name">${p.name}</div>
          <span class="badge ${style.badge}">${p.status}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${style.bar}" style="width:${p.progress}%"></div>
        </div>
        <div class="project-meta">${p.progress}% selesai · PIC ${p.pic}</div>
      </div>
    `;
  }).join('');
}

function renderKpiHighlights() {
  const el = document.getElementById('kpi-highlights');
  el.innerHTML = KPI_HIGHLIGHTS.map((k) => `
    <div class="kpi-row">
      <span class="kpi-label">${k.label}</span>
      <span class="kpi-value">${k.value}</span>
    </div>
  `).join('');
}

function renderQuickLinks() {
  const el = document.getElementById('quicklinks');
  el.innerHTML = QUICK_LINKS.map((q) => `
    <a href="${q.href}" class="card quicklink-card">
      <div class="quicklink-title">${q.title}</div>
      <div class="quicklink-desc">${q.desc}</div>
    </a>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderProjects();
  renderKpiHighlights();
  renderQuickLinks();
});

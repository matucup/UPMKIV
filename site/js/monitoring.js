const JOBS = { adkon: [normalizeAdkon, []] };
let S = null;

async function refresh() {
  $('refresh').disabled = true;
  $('updated').textContent = 'Memuat data dari Google Sheets…';
  const [mon, cost] = await Promise.all([loadMonitoring(), loadSources(JOBS)]);
  S = { datalist: mon.rows, adkon: cost.data.adkon };
  showBanner([...mon.failed, ...cost.failed]);
  renderProgressKpis(); renderPso(); renderAttention(); renderIssues(); renderAlerts();
  $('updated').textContent = `Sumber: ${mon.source} · ${S.datalist.length} paket · Diperbarui ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  $('refresh').disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  $('refresh').onclick = refresh;
  refresh();
});

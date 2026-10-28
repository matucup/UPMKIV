const JOBS = { adkon: [normalizeAdkon, []] };
let S = null;

async function refresh() {
  $('refresh').disabled = true;
  $('updated').textContent = 'Memuat data dari Google Sheets…';
  PSO_LOG.clear();
  const [mon, cost] = await Promise.all([loadMonitoring(), loadSources(JOBS)]);
  S = { datalist: mon.rows, adkon: cost.data.adkon };
  S.pen = buildPenugasan(S.adkon, S.datalist);
  showBanner([...mon.failed, ...cost.failed]);
  showNotice(psoNotices());
  renderProgressKpis(); renderPso(); renderAttention(); renderIssues(); renderAlerts(); renderPenugasan();
  $('updated').textContent = `Sumber: ${mon.source}${mon.note ? ` (${mon.note})` : ''} · ${S.datalist.length} kontrak · ${S.pen.length} penugasan · Diperbarui ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  $('refresh').disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  $('refresh').onclick = refresh;
  refresh();
});

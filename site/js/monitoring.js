let S = null;

async function refresh() {
  $('refresh').disabled = true;
  $('updated').textContent = 'Memuat data dari Google Sheets…';
  const mon = await loadMonitoring();
  S = { datalist: mon.rows };
  showBanner(mon.failed);
  renderProgressKpis(); renderPso(); renderAttention(); renderIssues(); renderAlerts();
  $('updated').textContent = `Sumber: ${mon.source} · ${S.datalist.length} paket · Diperbarui ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  $('refresh').disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  $('refresh').onclick = refresh;
  refresh();
});

const JOBS = { datalist: [normalizeDatalist, []] };
let S = null;

async function refresh() {
  $('refresh').disabled = true;
  $('updated').textContent = 'Memuat data dari Google Sheets…';
  const { data, failed } = await loadSources(JOBS);
  S = data;
  showBanner(failed);
  renderProgressKpis(); renderPso(); renderAttention(); renderIssues(); renderAlerts();
  $('updated').textContent = `Dimuat: ${S.datalist.length} paket · Diperbarui ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  $('refresh').disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  $('refresh').onclick = refresh;
  refresh();
});

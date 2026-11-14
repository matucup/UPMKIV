/**
 * Penerima input Man-Month aktual -> menulis ke tab "MM_Aktual" pada spreadsheet induk.
 * Dipasang sebagai Web App dari Extensions > Apps Script di spreadsheet UPMKIV_Data_Induk.
 * PIN disimpan di Project Settings > Script Properties (nama: PIN), bukan di kode.
 */
const TAB = 'MM_Aktual';
const HEAD = ['Bulan', 'Nama', 'PSO', 'Proyek', 'MM', 'Diinput_Pada'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const req = JSON.parse(e.postData.contents);
    const pin = PropertiesService.getScriptProperties().getProperty('PIN');
    if (!pin || String(req.pin) !== String(pin)) return out({ ok: false, error: 'PIN salah' });
    if (!/^\d{4}-\d{2}$/.test(req.bulan || '')) return out({ ok: false, error: 'Bulan tidak valid' });
    const rows = req.rows || [];
    if (!rows.length || rows.length > 200) return out({ ok: false, error: 'Jumlah baris tidak valid' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(TAB);
    if (!sh) { sh = ss.insertSheet(TAB); sh.appendRow(HEAD); sh.setFrozenRows(1); }
    const data = sh.getDataRange().getValues();
    const idx = {};  // kunci: bulan|nama|proyek -> nomor baris
    for (let i = 1; i < data.length; i++) {
      idx[[fmtBulan(data[i][0]), data[i][1], data[i][3]].join('|')] = i + 1;
    }
    let baru = 0, ubah = 0;
    const now = new Date();
    for (const r of rows) {
      const mm = Number(r.mm);
      if (!r.nama || !r.proyek || !isFinite(mm) || mm < 0 || mm > 2) return out({ ok: false, error: 'Baris tidak valid: ' + (r.nama || '?') });
      const key = [req.bulan, r.nama, r.proyek].join('|');
      const vals = [req.bulan, r.nama, r.pso || '', r.proyek, mm, now];
      if (idx[key]) { sh.getRange(idx[key], 1, 1, HEAD.length).setValues([vals]); ubah++; }
      else { sh.appendRow(vals); idx[key] = sh.getLastRow(); baru++; }
    }
    sh.getRange('A:A').setNumberFormat('@');  // Bulan sebagai teks "2026-11"
    return out({ ok: true, baru: baru, diperbarui: ubah });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() { return out({ ok: true, info: 'Penerima input MM aktif' }); }

function fmtBulan(v) {
  return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM') : String(v);
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/**
 * Penerima input web dashboard UPMK IV -> menulis ke tab-tab input pada spreadsheet induk.
 * Pasang sebagai Web App dari Extensions > Apps Script di spreadsheet UPMKIV_Data_Induk (lihat PANDUAN_ADMIN.md bagian C).
 * PIN disimpan di Project Settings > Script Properties (nama: PIN), bukan di kode.
 *
 * Hanya tab di daftar TABS yang boleh ditulis. "key" = kolom penentu baris: kiriman dengan nilai kunci yang sama MENIMPA baris lama.
 * Tab cermin (Daftar Proyek, Personil, LIVE_MM, DATA, Datalist_Pusmanpro, Adkon) sengaja tidak ada di daftar.
 */
const TABS = {
  MM_Aktual: { key: ['Bulan', 'Nama', 'Proyek'], head: ['Bulan', 'Nama', 'PSO', 'Proyek', 'MM', 'Diinput_Pada'] },
  Proyek: { key: ['ID_Paket'] },
  Progres_Bulanan: { key: ['Periode', 'ID_Paket'] },
  Isu: { key: ['ID_Isu'] },
  Dokumen_Milestone: { key: ['ID_Paket', 'Jenis_Dokumen'] },
  Laporan_KPI: { key: ['Kelompok', 'Indikator'] },
  Matlev_ERM: { key: ['Kelompok', 'Program'] },
  Kepatuhan: { key: ['Indikator'] },
  IDD_Mitra: { key: ['Mitra'] },
  Kegiatan: { key: ['Tanggal', 'Kegiatan'] },
  Kontrak_Status: { key: ['Uraian'] },
  Pengalihan_Anggaran: { key: ['Pemberi_Kerja'] },
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const req = JSON.parse(e.postData.contents);
    const pin = PropertiesService.getScriptProperties().getProperty('PIN');
    if (!pin || String(req.pin) !== String(pin)) return out({ ok: false, error: 'PIN salah' });
    const def = TABS[req.tab];
    if (!def) return out({ ok: false, error: 'Tab tidak diizinkan: ' + req.tab });
    const rows = req.rows || [];
    if (!rows.length || rows.length > 200) return out({ ok: false, error: 'Jumlah baris tidak valid' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(req.tab);
    if (!sh) {
      if (!def.head) return out({ ok: false, error: 'Tab ' + req.tab + ' tidak ada di spreadsheet' });
      sh = ss.insertSheet(req.tab); sh.getRange(1, 1, 1, def.head.length).setValues([def.head]); sh.setFrozenRows(1);
    }
    const data = sh.getDataRange().getValues();
    const head = data[0].map(function (c) { return String(c).trim(); });
    const col = {};
    head.forEach(function (h, i) { if (h) col[h] = i; });
    for (const k of def.key) if (col[k] === undefined) return out({ ok: false, error: 'Kolom ' + k + ' tidak ada di tab ' + req.tab });

    const keyOf = function (get) { return def.key.map(function (k) { return txt(get(k)).toLowerCase(); }).join('|'); };
    const idx = {};
    for (let i = 1; i < data.length; i++) idx[keyOf(function (k) { return data[i][col[k]]; })] = i + 1;

    let baru = 0, ubah = 0, next = sh.getLastRow() + 1;
    const now = new Date();
    for (const r of rows) {
      for (const f in r) if (col[f] === undefined) return out({ ok: false, error: 'Kolom tidak dikenal: ' + f });
      for (const k of def.key) if (txt(r[k]) === '') return out({ ok: false, error: 'Kolom ' + k + ' wajib diisi' });
      const key = keyOf(function (k) { return r[k]; });
      const at = idx[key] || next;
      // Baris lama dipertahankan untuk kolom yang tidak dikirim.
      const vals = idx[key] ? sh.getRange(at, 1, 1, head.length).getValues()[0] : head.map(function () { return ''; });
      const fmts = idx[key] ? sh.getRange(at, 1, 1, head.length).getNumberFormats()[0] : head.map(function () { return 'General'; });
      for (const f in r) {
        const v = r[f];
        if (typeof v === 'number') { if (!isFinite(v)) return out({ ok: false, error: 'Angka tidak valid: ' + f }); vals[col[f]] = v; fmts[col[f]] = 'General'; }
        else {
          const s = String(v == null ? '' : v);
          if (s.length > 5000) return out({ ok: false, error: 'Isi terlalu panjang: ' + f });
          vals[col[f]] = /^[=+@]/.test(s) ? "'" + s : s; fmts[col[f]] = '@';  // teks apa adanya: tanggal/persen tidak diubah Google, rumus tidak dijalankan
        }
      }
      if (col.Diinput_Pada !== undefined) { vals[col.Diinput_Pada] = now; fmts[col.Diinput_Pada] = 'yyyy-mm-dd hh:mm'; }
      sh.getRange(at, 1, 1, head.length).setNumberFormats([fmts]).setValues([vals]);
      if (idx[key]) ubah++; else { idx[key] = at; next++; baru++; }
    }
    return out({ ok: true, baru: baru, diperbarui: ubah });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() { return out({ ok: true, info: 'Penerima input aktif (' + Object.keys(TABS).length + ' tab)' }); }

function txt(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v == null ? '' : v).trim();
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

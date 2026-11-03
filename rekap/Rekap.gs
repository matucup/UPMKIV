/**
 * REKAP FOLDER GOOGLE SHEET -> SATU SHEET
 * Cara pakai: lihat README.md di folder ini.
 */
const CONFIG = {
  FOLDER_ID: '1IyXIvkUK5uMIuO7bx4lrb9aGeBTgYBhN', // folder berisi sheet yang Anda update
  TAB_SUMBER: '',          // nama tab yang dibaca di tiap file; kosong = otomatis cari tab yang headernya paling cocok
  TAB_REKAP: 'Rekap',
  TAB_LOG: 'Log',
  HEADER_SCAN_ROWS: 15,    // header dicari di N baris pertama
  MIN_HEADER_MATCH: 5,     // minimal kolom cocok agar sebuah tab dianggap tabel data
  JAM_OTOMATIS: 6,         // jam (0-23) untuk pembaruan otomatis harian
};

const KOLOM = ['Kode Lokasi','Status','Periode','No Surat Penugasan','Jangka Waktu Penugasan','No Amandemen Penugasan','UPMK','PSO','Pemberi Tugas','Direksi Pekerjaan','Nama Proyek','No Kontrak','Kontraktor','Nilai Kontrak Original','Nilai Kontrak Akhir','No. Amandemen Nilai Kontrak Akhir','Sumber Dana','Tanggal Kontrak','Efektif Kontrak','COD Kontrak','COD Amandemen','No. Amd Waktu Kontrak','Kapasitas','Satuan Kapasitas','Detail','Masa Berlaku Bank Garansi','Lokasi','Progres Aktual (%)','Progres Plan(%)','Aktivitas','RLB','Energize','SLO','BAST 1','BAST 2','Kategori1','Detail1','Tindaklanjut1','Kategori2','Detail2','Tindaklanjut2','Kategori3','Detail3','Tindaklanjut3','Kategori4','Detail4','Tindaklanjut4','Kategori5','Detail5','Tindaklanjut5','Jenis','Milestone','to decimal actual','to decimal plan','Deviasi','Bullet'];
const EXTRA = ['Sumber File','Sumber Tab','Baris Asal','Diambil Pada'];

const norm_ = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');
const KEY_IDX = (() => { const m = {}; KOLOM.forEach((k, i) => { m[norm_(k)] = i; }); return m; })();

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Rekap')
    .addItem('Ambil data sekarang', 'ambilData')
    .addItem('Aktifkan pembaruan otomatis harian', 'aktifkanOtomatis')
    .addItem('Matikan pembaruan otomatis', 'matikanOtomatis')
    .addToUi();
}

function ambilData() {
  const mulai = new Date();
  const tz = Session.getScriptTimeZone();
  const stempel = Utilities.formatDate(mulai, tz, 'yyyy-MM-dd HH:mm:ss');
  const ss = SpreadsheetApp.getActive();
  const log = [];
  const hasil = [];

  const files = DriveApp.getFolderById(CONFIG.FOLDER_ID).getFilesByType(MimeType.GOOGLE_SHEETS);
  while (files.hasNext()) {
    const f = files.next();
    if (f.getId() === ss.getId()) continue; // jangan baca diri sendiri
    try {
      const n = bacaFile_(f, stempel, hasil);
      log.push([stempel, f.getName(), 'OK', n, '', Utilities.formatDate(f.getLastUpdated(), tz, 'yyyy-MM-dd HH:mm:ss')]);
    } catch (e) {
      log.push([stempel, f.getName(), 'GAGAL', 0, String(e.message || e), '']);
    }
  }

  tulisRekap_(ss, hasil);
  tulisLog_(ss, log, stempel, hasil.length);
  ss.toast(hasil.length + ' baris dari ' + log.length + ' file. Diambil: ' + stempel, 'Rekap selesai', 8);
}

/** Baca satu file; tambahkan baris ke `hasil`; kembalikan jumlah baris. */
function bacaFile_(file, stempel, hasil) {
  const book = SpreadsheetApp.openById(file.getId());
  const tabs = CONFIG.TAB_SUMBER ? [book.getSheetByName(CONFIG.TAB_SUMBER)].filter(Boolean) : book.getSheets();
  let total = 0;
  tabs.forEach((sh) => {
    const vals = sh.getDataRange().getValues();
    const disp = sh.getDataRange().getDisplayValues(); // untuk tanggal/persen sesuai tampilan
    const h = cariHeader_(vals);
    if (!h) return;
    const peta = h.map; // indeks kolom sumber -> indeks KOLOM
    for (let r = h.row + 1; r < vals.length; r++) {
      const out = new Array(KOLOM.length).fill('');
      let isi = 0;
      for (const c in peta) {
        const v = vals[r][c];
        if (v === '' || v === null) continue;
        out[peta[c]] = (v instanceof Date) ? disp[r][c] : v;
        isi++;
      }
      // lewati baris kosong / baris tanpa identitas proyek
      if (!isi || (!out[KEY_IDX[norm_('Kode Lokasi')]] && !out[KEY_IDX[norm_('Nama Proyek')]])) continue;
      hasil.push(out.concat([file.getName(), sh.getName(), r + 1, stempel]));
      total++;
    }
  });
  return total;
}

function cariHeader_(vals) {
  let terbaik = null;
  const batas = Math.min(CONFIG.HEADER_SCAN_ROWS, vals.length);
  for (let r = 0; r < batas; r++) {
    const map = {}; let cocok = 0; const dipakai = {};
    vals[r].forEach((cell, c) => {
      const i = KEY_IDX[norm_(cell)];
      if (i !== undefined && !dipakai[i]) { map[c] = i; dipakai[i] = true; cocok++; }
    });
    if (cocok >= CONFIG.MIN_HEADER_MATCH && (!terbaik || cocok > terbaik.cocok)) terbaik = { row: r, map, cocok };
  }
  return terbaik;
}

function tulisRekap_(ss, hasil) {
  const sh = ss.getSheetByName(CONFIG.TAB_REKAP) || ss.insertSheet(CONFIG.TAB_REKAP, 0);
  sh.clearContents();
  const header = KOLOM.concat(EXTRA);
  sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#1f4e79').setFontColor('#ffffff');
  if (hasil.length) sh.getRange(2, 1, hasil.length, header.length).setValues(hasil);
  sh.setFrozenRows(1);
  const kolomAmbil = header.length;
  sh.getRange(2, kolomAmbil, Math.max(hasil.length, 1), 1).setBackground('#fff2cc');
}

function tulisLog_(ss, log, stempel, totalBaris) {
  const sh = ss.getSheetByName(CONFIG.TAB_LOG) || ss.insertSheet(CONFIG.TAB_LOG);
  sh.clearContents();
  sh.getRange(1, 1, 1, 2).setValues([['Terakhir diambil', stempel]]).setFontWeight('bold');
  sh.getRange(2, 1, 1, 2).setValues([['Total baris rekap', totalBaris]]).setFontWeight('bold');
  const head = [['Diambil Pada', 'File', 'Status', 'Jumlah Baris', 'Catatan', 'File Terakhir Diubah']];
  sh.getRange(4, 1, 1, 6).setValues(head).setFontWeight('bold').setBackground('#d9d9d9');
  if (log.length) sh.getRange(5, 1, log.length, 6).setValues(log);
}

function aktifkanOtomatis() {
  matikanOtomatis();
  ScriptApp.newTrigger('ambilData').timeBased().everyDays(1).atHour(CONFIG.JAM_OTOMATIS).create();
  SpreadsheetApp.getActive().toast('Pembaruan otomatis harian aktif (jam ' + CONFIG.JAM_OTOMATIS + ').');
}

function matikanOtomatis() {
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'ambilData').forEach(ScriptApp.deleteTrigger);
}

// ID spreadsheet induk (UPMKIV_Data_Induk). Semua tab dibaca dari sini.
// Tab cermin (Daftar Proyek, Personil, LIVE_MM, DATA, Datalist_Pusmanpro, Adkon, dst.) menarik data dari sheet asal lewat IMPORTRANGE;
// asal tiap tab diatur di tab "Sumber" pada spreadsheet itu, bukan di kode ini.
const DATA_ID = '1PRzzDpWvDq8NWcQ2ANYAR_dTQzLGqndbNfc3YZFdQag';
// Tab template laporan/monitoring (Proyek, Progres_Bulanan, Isu, Laporan_KPI, dst.) ada di spreadsheet yang sama.
const LAPORAN_ID = DATA_ID;

// Bagian laporan di Executive Summary (KPI, Matlev/ERM, Kepatuhan, IDD, Kegiatan, Kontrak, Pengalihan Anggaran) disembunyikan sampai tab-tabnya diisi data nyata.
// Ubah menjadi true bila sudah siap ditampilkan.
const TAMPILKAN_LAPORAN = false;

// Daftar PSO resmi. Nama di sheet mana pun dibaca lalu disamakan ke salah satu nama ini.
const PSO_RESMI = ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Jambi', 'Riau', 'Kantor UPMK IV'];
// Alias: nama lain (huruf kecil) -> nama resmi. Tambahkan baris baru di sini bila ada penulisan lain di sheet.
const PSO_ALIAS = {
  'kepulauan riau': 'Riau', 'kepri': 'Riau', 'kep. riau': 'Riau', 'kep riau': 'Riau', 'batam': 'Riau',
  'sumut': 'Sumatera Utara', 'sumbar': 'Sumatera Barat', 'nad': 'Aceh', 'nanggroe aceh darussalam': 'Aceh',
  'upmk iv': 'Kantor UPMK IV', 'kantor upmk 4': 'Kantor UPMK IV',
};

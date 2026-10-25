// ID spreadsheet induk (UPMKIV_Data_Induk). Semua tab dibaca dari sini.
// Tab cermin (Daftar Proyek, Personil, LIVE_MM, DATA, Datalist_Pusmanpro, Adkon, dst.) menarik data dari sheet asal lewat IMPORTRANGE;
// asal tiap tab diatur di tab "Sumber" pada spreadsheet itu, bukan di kode ini.
const DATA_ID = '1PRzzDpWvDq8NWcQ2ANYAR_dTQzLGqndbNfc3YZFdQag';
// Tab template laporan/monitoring (Proyek, Progres_Bulanan, Isu, Laporan_KPI, dst.) ada di spreadsheet yang sama.
const LAPORAN_ID = DATA_ID;

// Bagian laporan di Executive Summary (KPI, Matlev/ERM, Kepatuhan, IDD, Kegiatan, Kontrak, Pengalihan Anggaran) disembunyikan sampai tab-tabnya diisi data nyata.
// Ubah menjadi true bila sudah siap ditampilkan.
const TAMPILKAN_LAPORAN = false;

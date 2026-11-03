# Rekap folder Google Sheet -> satu sheet

`Rekap.gs` (Google Apps Script) membaca semua Google Sheet di folder Drive, mencocokkan kolom berdasarkan **nama header** (bukan urutan), lalu menulis semuanya ke tab `Rekap` dengan 4 kolom tambahan: `Sumber File`, `Sumber Tab`, `Baris Asal`, `Diambil Pada`. Tab `Log` mencatat waktu pengambilan terakhir, status tiap file, dan galat.

## Pemasangan (sekali, ±5 menit)
1. Buat Google Sheet baru (mis. "Rekap UPMK IV"), **simpan di folder yang sama atau di luar folder** (jangan diubah isinya manual).
2. Menu **Ekstensi > Apps Script**, hapus isi `Code.gs`, tempel seluruh isi `Rekap.gs`, simpan.
3. Pastikan `FOLDER_ID` di bagian `CONFIG` sudah benar.
4. Pilih fungsi `ambilData` > **Jalankan**, setujui izin akses Drive/Sheets.
5. Muat ulang sheet; menu **Rekap** muncul. Pakai "Ambil data sekarang" setiap selesai update, atau "Aktifkan pembaruan otomatis harian".

## Catatan
- Rekap ditimpa ulang penuh tiap kali dijalankan (tidak ada duplikat meski file sumber diubah).
- Header dicari otomatis di 15 baris pertama tiap tab; tab tanpa minimal 5 kolom yang cocok dilewati. Isi `TAB_SUMBER` bila hanya satu tab tertentu yang ingin dibaca.
- Kolom hasil rumus (`to decimal actual`, `Deviasi`, `Bullet`) diambil sebagai nilai, bukan rumus.
- Batas Apps Script: 6 menit per eksekusi. Bila file sangat banyak/besar, gagal dengan "Exceeded maximum execution time"; kabari agar dipecah per file.

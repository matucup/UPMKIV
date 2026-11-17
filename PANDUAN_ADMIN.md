# Panduan Admin Dashboard UPMK IV

Situs: https://matucup.github.io/UPMKIV/ · Data: spreadsheet **UPMKIV_Data_Induk** (Google Sheets).

Admin **tidak perlu menyentuh kode**. Pekerjaan admin hanya tiga hal di bawah.

## A. Pekerjaan rutin (cara memperbarui data)

| Data | Diperbarui di mana | Cara |
| --- | --- | --- |
| Proyek, personil, rencana MM, TAD, Adkon, Datalist | Sheet **asal** masing-masing (daftar ada di tab `Sumber` spreadsheet induk) | Ubah di sheet asal seperti biasa. Dashboard ikut berubah sendiri. |
| Aktual man-month per bulan | Halaman **Input MM** di website | Pilih bulan, isi PIN, pilih nama + proyek, isi MM, klik Kirim. |

Setelah mengubah data: buka website, klik **Muat ulang**. Tidak ada langkah lain.

Aturan yang wajib dijaga:

1. **Jangan mengetik di tab cermin** spreadsheet induk (`Daftar Proyek`, `Personil`, `LIVE_MM`, `DATA`, `Datalist_Pusmanpro`, `Adkon`). Isinya rumus; mengetik di sana memutus penarikan data.
2. **Jangan mengganti nama tab atau nama kolom judul** di sheet asal. Menyisipkan baris di atas judul masih aman (sampai baris ke-8).
3. **Tab `MM_Aktual` hanya diisi lewat halaman Input MM.** Mengoreksi angka: kirim ulang bulan + nama + proyek yang sama, nilai lama tertimpa.
4. Nama PSO hanya: Aceh, Sumatera Utara, Sumatera Barat, Jambi, Riau, Kantor UPMK IV.

## B. Bila ada yang salah

1. Buka halaman **Cek Data (admin)** di website. Setiap tab diberi status OK / KOSONG / GAGAL dan petunjuknya.
2. Masalah yang paling sering:
   - `#REF!` di tab cermin → buka tab itu di spreadsheet induk, klik sel A1, klik **Izinkan akses**. Bila tidak ada tombolnya, periksa ID sheet asal di tab `Sumber`.
   - Angka tidak berubah → klik **Muat ulang**, lalu Ctrl+Shift+R.
   - Input MM ditolak "PIN salah" → PIN ada di Apps Script > Project Settings > Script Properties.
3. Data terhapus/tertimpa → di Google Sheets: **File > Version history** untuk mengembalikan.

## C. Pemasangan penerima Input MM (sekali saja, oleh pemilik spreadsheet)

1. Buka UPMKIV_Data_Induk > **Extensions > Apps Script**.
2. Hapus isi yang ada, tempel seluruh isi `apps-script/Code.gs` dari repo ini, simpan.
3. **Project Settings > Script Properties > Add**: nama `PIN`, nilai = PIN pilihan (min. 8 karakter, jangan dibagikan di grup).
4. **Deploy > New deployment > Web app**: Execute as **Me**, Who has access **Anyone** > Deploy > Authorize.
5. Salin alamat berakhiran `/exec`, tempel ke `INPUT_MM_URL` di `site/js/config.js` (lewat GitHub: buka file, ikon pensil, Commit).
6. Buka halaman Cek Data: baris "Penerima Input MM" harus OK.

Mengganti PIN: ubah nilai `PIN` di Script Properties (tidak perlu deploy ulang).

## D. Batas kemampuan (perlu diketahui pimpinan)

- Spreadsheet induk dibagikan "siapa saja yang memiliki link" agar website bisa membacanya. Artinya **isi sheet bisa dibaca siapa pun yang tahu link-nya**. Jangan menaruh data rahasia (NIK, gaji, nomor rekening) di spreadsheet ini.
- Input web dilindungi satu PIN bersama, bukan akun per orang. Cocok untuk 1-2 admin.
- Dashboard bergantung pada sheet asal milik orang lain. Bila pemiliknya mengubah struktur atau mencabut akses, bagian terkait kosong sampai diperbaiki.
- Ini alat pemantauan, **bukan** sistem pencatatan resmi. Angka resmi tetap di sheet/aplikasi asal.

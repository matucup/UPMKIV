# UPMKIV: Dashboard Manajemen Jaringan UPMK IV

Dashboard statis (HTML, CSS, JavaScript tanpa build) untuk PLN PUSMANPRO UPMK IV. Data dibaca langsung dari Google Sheets.

- Situs: https://matucup.github.io/UPMKIV/
- Kode: folder `site/` (halaman: `index.html`, `monitoring-progress.html`, `executive-summary.html`)
- Sumber data dan ID spreadsheet: `site/js/sheets.js`; ID workbook template: `site/js/config.js`

## Menjalankan lokal

```bash
cd site
python3 -m http.server 8000   # buka http://localhost:8000
```

## Publikasi

Setiap push ke `main` yang mengubah `site/` otomatis dipublikasikan ke GitHub Pages lewat `.github/workflows/pages.yml`.
Pengaturan satu kali: Settings > Pages > Build and deployment > Source: **GitHub Actions**.

## Nama PSO yang seragam

Nama PSO ditulis berbeda-beda di tiap sheet (mis. "Kepulauan Riau", "Aceh, Sumut", "PSO Riau", bahkan judul proyek). Kode menyamakannya lewat `resolvePso()` di `site/js/data.js`:

1. Nilai kolom PSO dipetakan langsung: awalan `PSO ` dibuang; nama gabungan ("Aceh, Sumut", "A & B", "A dan PSO B") diambil bagian pertamanya; alias dipetakan lewat `PSO_ALIAS` di `site/js/config.js` (daftar PSO resmi ada di `PSO_RESMI`).
2. Bila isinya bukan nama PSO (mis. judul proyek), PSO dicari di dalam teksnya (yang disebut paling awal), lalu di kolom pembantu: Adkon memakai `Project Site Team (PST) New` lalu `LOKASI`; Datalist memakai `Lokasi`; Daftar Proyek memakai `Provinsi`.
3. Penyamaan otomatis tidak ditampilkan di halaman; rinciannya ada di konsol browser (`[PSO] disamakan otomatis`).
4. Kotak biru di halaman hanya muncul bila perlu tindakan: PSO kosong yang tidak bisa ditebak, isi yang bukan nama PSO dan tidak bisa ditebak, atau nama PSO baru. Kotak itu menyebut tab dan contoh baris (kode + nama proyek).

Bila ada PSO baru atau penulisan baru, tambahkan satu baris di `PSO_ALIAS` (atau satu nama di `PSO_RESMI`).

Datalist dan Adkon hanya membaca baris `UPMK_SAYA` (`UPMK IV`) karena sheet aslinya memuat banyak UPMK.

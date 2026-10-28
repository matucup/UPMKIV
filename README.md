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

Nama PSO ditulis berbeda-beda di tiap sheet (mis. "Kepulauan Riau", "Aceh, Sumut", "PSO Riau"). Kode menyamakannya lewat `canonPso()` di `site/js/data.js`:

- awalan `PSO ` dibuang; nama gabungan ("Aceh, Sumut", "A & B", "A dan PSO B") diambil bagian pertamanya;
- alias dipetakan lewat `PSO_ALIAS` di `site/js/config.js`; daftar PSO resmi ada di `PSO_RESMI`;
- setiap nama yang diubah atau tidak dikenal ditampilkan sebagai kotak biru di halaman, lengkap dengan nama tab sumbernya.

Bila muncul PSO baru atau penulisan baru, cukup tambahkan satu baris di `PSO_ALIAS` (atau satu nama di `PSO_RESMI`).

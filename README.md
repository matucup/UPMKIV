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

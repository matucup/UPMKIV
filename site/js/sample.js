// Data contoh: dipakai hanya bila Google Sheets gagal dimuat (nilai tanggal/PSO proyek bersifat ilustrasi).
const SAMPLE_GRIDS = {
  proyek: [
    ['No', 'PSO', 'PIC', 'PC', 'SC', 'Jenis', 'Kode Lokasi', 'Judul Surat Penugasan', 'Nomor Surat Penugasan', 'Proyek EPC', 'Provinsi', 'User Pengguna Jasa', 'Direksi Lapangan', 'Durasi', 'Awal Penugasan', 'Akhir Penugasan', 'Tanggal Kontrak', 'Efektif Kontrak', 'COD Kontrak', 'COD Amandemen', 'EOT ke-'],
    ['1', 'Riau', 'Contoh PIC', '', '', 'GI', 'RI-01', 'GI 150 kV Pakning', 'ST-001/2025', 'EPC A', 'Riau', 'UIP Sumbagut', '', '12', '1 Jun 26', '30 Nov 26', '', '', '', '', ''],
    ['2', 'Riau', 'Contoh PIC', '', '', 'SUTT', 'RI-02', 'SUTT 150 kV KID - Pakning Lot 1', 'ST-002/2025', 'EPC B', 'Riau', 'UIP Sumbagut', '', '12', '1 Jun 26', '30 Jun 27', '', '', '', '', ''],
    ['3', 'Aceh', 'Contoh PIC', '', '', 'SUTT', 'AC-01', 'SUTT 150 kV Arun - Bireun', 'ST-003/2025', 'EPC C', 'Aceh', 'UIP Sumbagut', '', '12', '1 Jan 26', '15 Sep 26', '', '', '', '', ''],
    ['4', 'Sumatera Utara', 'Contoh PIC', '', '', 'GI', 'SU-01', 'GI 150 kV Contoh Sumut', 'ST-004/2025', 'EPC D', 'Sumatera Utara', 'UIP Sumbagut', '', '18', '1 Mar 26', '20 Dec 26', '', '', '', '', ''],
    ['5', 'Sumatera Utara', 'Contoh PIC', '', '', 'SUTT', 'SU-02', 'SUTT 150 kV Contoh Sumut 2', 'ST-005/2025', 'EPC E', 'Sumatera Utara', 'UIP Sumbagut', '', '24', '1 Mar 26', '28 Feb 28', '', '', '', '', ''],
  ],
  personil: [
    ['NAMA', 'PSO', 'PENUGASAN', 'KUALIFIKASI', 'PROYEK', 'TANGGAL AWAL BERGABUNG', '', '', ''],
    ['SAULINA SAHWIDI', 'Kantor UPMK IV', 'Administrasi Proyek', 'Administrator', '', '16 April 2024', '', '', 'GI 150 kV Pakning'],
    ['MUHAMMAD ADITYA TRI GUSDI', 'Sumatera Utara', 'Administrasi Proyek', 'Administrator', '', '01 Mei 2016', '', '', 'SUTT 150 kV KID - Pakning Lot 1'],
    ['RENNO DEWA', 'Aceh', 'Engineer BIM', 'Surveyor', '', '04 September 2024', '', '', 'SUTT 150 kV KID - Pakning Lot 2'],
    ['BONAR MARDAME SINAGA', 'Riau', 'Supervisor Sipil', 'Ahli Muda 5', '', '11 September 2024', '', '', 'GI 150 kV Lubuk Gaung'],
    ['DOOHAN KASKARINO', 'Riau', 'Supervisor Sipil', 'Ahli muda 3', '', '13 Maret 2023', '', '', 'GI 150 kV Sorek'],
  ],
  mm: [
    ['PSO', 'Proyek', 'Posisi', 'Keahlian', 'Kualifikasi Maks', 'Kualifikasi Dalam SLA', 'Total', "Agu '26", "Sep '26", "Okt '26", "Nov '26", "Des '26", "Jan '27", "Feb '27", "Mar '27", "Apr '27"],
    ['Riau', 'GI 150 kV Pakning', 'Administrasi Proyek (TAD)', 'Administrasi', 'Administrasi', 'Administrasi', '6.000', '1.000', '1.000', '1.000', '1.000', '', '', '', '', ''],
    ['Riau', 'GI 150 kV Pakning', 'Pengawas K3 1 (TAD)', 'K3', 'Ahli Muda 5', 'Ahli Muda 3', '6.000', '1.000', '1.000', '1.000', '1.000', '1.000', '1.000', '', '', ''],
    ['Riau', 'GI 150 kV Pakning', 'Operator Teknik 1 (TAD)', 'Operator', 'Operator Teknik', 'Operator Teknik', '6.000', '1.000', '1.000', '1.000', '1.000', '1.000', '1.000', '1.000', '', ''],
    ['Aceh', 'SUTT 150 kV Arun - Bireun', 'Supervisor Sipil', 'Sipil', 'Ahli Muda 4', 'Ahli Muda 4', '5.000', '', '1.000', '1.000', '1.000', '1.000', '1.000', '1.000', '1.000', '1.000'],
    ['Sumatera Utara', 'GI 150 kV Contoh Sumut', 'Supervisor Elektrikal', 'Elektrikal', 'Ahli Muda 3', 'Ahli Muda 3', '7.000', '', '', '1.000', '1.000', '1.000', '1.000', '1.000', '1.000', '1.000'],
  ],
  tad: [
    ['', 'SURAT USULAN PUSMANPRO UPMK IV'],
    ['No.', 'Nomor Surat', 'Tanggal', 'Kualifikasi Personil (Maksimum)', 'Jumlah', 'Bidang', 'Peruntukan', 'Nomor Surat 2', 'Tanggal 2', 'Jumlah Usulan', 'Bidang Usulan', 'Durasi', 'Nomor Surat 3', 'Tanggal 3', 'Hasil', 'Durasi 2', 'Nama Personil', 'Nomor Surat 4', 'Tanggal 4', 'Mobilisasi', 'Durasi 3', 'Durasi Mobilisasi', 'Keterangan', 'Keterangan Tambahan', 'Column 1', 'Target Ketersediaan', 'Hari Kerja Terlambat'],
    ['1', '0282/SDM.00.02/F26030000/2026', '12 April 2026', 'Tenaga Ahli Muda 4', '3', 'Jaringan (Sipil)', 'Wilayah Aceh: T/L150 kV Arun - Bireun', '', '20 Apr 26', '2', 'Jaringan (Sipil)', '8', '', '23 Apr 26', 'Ahli Muda 4', '11', 'Gusnedi Marhaban', '', '27 Apr 26', '27 Apr 26', '15', '0', '', '', '', '3 May 2026', '-4'],
    ['1', '0282/SDM.00.02/F26030000/2026', '12 April 2026', 'Tenaga Ahli Muda 4', '2', 'Jaringan (Sipil)', 'Wilayah Aceh - Sumatera Utara', '', '20 Apr 26', '2', 'Jaringan (Sipil)', '8', '', '23 Apr 26', 'Ahli Muda 4', '11', 'Iqram Imam', '', '27 Apr 26', '27 Apr 26', '15', '0', '', '', '', '3 May 2026', '-4'],
    ['1', '0282/SDM.00.02/F26030000/2026', '12 April 2026', 'Tenaga Ahli Muda 4', '', 'Jaringan (Sipil)', 'Wilayah Aceh: T/L150 kV Bireun - Peusangan', '', '28 Apr 26', '1', 'Jaringan (Sipil)', '16', '', '30 Apr 26', 'Ahli Muda 4', '18', 'Umar', '', '06 May 26', '06 May 26', '24', '0', 'Tambahan kekurangan dari surat permintaan', '', '', '3 May 2026', '1'],
    ['1', '0282/SDM.00.02/F26030000/2026', '12 April 2026', 'Tenaga Ahli Muda 4', '', 'Jaringan (Sipil)', 'Wilayah Aceh: T/L150 kV Arun - Bireun', '', '4 May 26', '1', 'Jaringan (Sipil)', '22', '', '12 May 26', 'Ahli Muda 3', '30', 'Muhammad', '', '19 May 26', '18 May 26', '37', '-1', 'Tenaga Pengganti', 'Kena Pasal Keterlambatan Mobilisasi', '', '3 May 2026', '8'],
  ],
};

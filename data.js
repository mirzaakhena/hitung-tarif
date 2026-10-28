/*
 * Data POC tarif (tiket 261027100801).
 *
 * Daftar modular DISALIN dari katalog aplikasi (`KATEGORI` dan `KLASIFIKASI`
 * di `mobile/webapp/js/data.js`, 13 kategori, 81 modular, 27 Okt 2026), bukan
 * diimpor: POC ini berdiri sendiri dan dibuka dari file://. Kalau katalog
 * aplikasinya berubah, daftar ini tidak ikut berubah.
 *
 * Tiap modular: [nama, Instalasi, Perbaikan, Perawatan] dalam Rupiah.
 * Angka-angkanya CONTOH, bukan tarif sungguhan — dikarang di kisaran yang
 * Mirza beri (Instalasi ±100–150 rb, Perbaikan ±250–400 rb, Perawatan
 * ±120–180 rb), lebih tinggi untuk alat yang lebih rumit. Harga yang diubah
 * di halaman disimpan di peramban (`harga.js`); berkas ini tetap harga contohnya.
 *
 * `senioritas` dan `penilaian` dipakai simulasi bonus bintang (tiket
 * 261028095701): batas bonus dan potongan dalam persen dari tarif dasar, dan
 * enam penilaian yang disetujui Mirza 28 Okt 2026.
 */
window.POC_TARIF = {
  jenis: [
    { id: 'instalasi', nama: 'Instalasi' },
    { id: 'perbaikan', nama: 'Perbaikan' },
    { id: 'perawatan', nama: 'Perawatan' },
  ],
  // Urutan dari yang paling junior. Angka dari Mirza, 28 Okt 2026.
  senioritas: [
    { id: 'rookie', nama: 'Rookie', bonusMaks: 5, potonganMaks: 60 },
    { id: 'senior', nama: 'Senior', bonusMaks: 10, potonganMaks: 50 },
    { id: 'intermediate', nama: 'Intermediate', bonusMaks: 15, potonganMaks: 45 },
    { id: 'advance', nama: 'Advance', bonusMaks: 20, potonganMaks: 40 },
    { id: 'expert', nama: 'Expert', bonusMaks: 20, potonganMaks: 10 },
  ],
  // Nilai tiap bintang: indeks 0 = bintang 1.
  nilaiBintang: [-2, -1, 0, 1, 2],
  penilaian: [
    { id: 'eq1', kelompok: 'EQ', nama: 'Komunikasi', penjelasan: 'Menjelaskan masalah, tindakan, dan hasil dengan bahasa yang dimengerti.' },
    { id: 'eq2', kelompok: 'EQ', nama: 'Keramahan dan sopan santun', penjelasan: 'Sikap terhadap staf, sabar menanggapi pertanyaan.' },
    { id: 'eq3', kelompok: 'EQ', nama: 'Ketepatan waktu dan komitmen', penjelasan: 'Datang sesuai jadwal, mengabari bila terlambat, menepati yang dijanjikan.' },
    { id: 'iq1', kelompok: 'IQ', nama: 'Hasil kerja', penjelasan: 'Alat berfungsi baik sesudahnya dan masalahnya tuntas.' },
    { id: 'iq2', kelompok: 'IQ', nama: 'Ketelitian dan kepatuhan prosedur', penjelasan: 'Pemeriksaan menyeluruh, memperhatikan keselamatan, area kerja rapi.' },
    { id: 'iq3', kelompok: 'IQ', nama: 'Efisiensi kerja', penjelasan: 'Selesai dalam waktu wajar, siap dengan alat dan suku cadang, tanpa bolak-balik.' },
  ],
  kategori: [
    {
      id: 'imaging', kode: 'MOD-IMG', nama: 'Medical Imaging', keterangan: 'Pencitraan Medis',
      modular: [
        ['CT-Scan System', 135_000, 360_000, 165_000],
        ['MRI System', 140_000, 370_000, 170_000],
        ['X-Ray (Fixed / Mobile)', 145_000, 385_000, 175_000],
        ['C-Arm Fluoroscopy', 150_000, 395_000, 180_000],
        ['Ultrasonografi (USG)', 140_000, 365_000, 165_000],
        ['Mammografi', 145_000, 380_000, 170_000],
        ['PET-CT / SPECT', 145_000, 390_000, 175_000],
        ['Dental X-Ray / Panorama', 135_000, 360_000, 165_000],
        ['Densitometer Tulang (DEXA)', 140_000, 370_000, 170_000],
      ],
    },
    {
      id: 'fisiologis', kode: 'MOD-PHY', nama: 'Physiological Diagnostics', keterangan: 'Diagnostik Fisiologis',
      modular: [
        ['Elektrokardiograf (ECG / EKG)', 120_000, 305_000, 145_000],
        ['Elektroensefalograf (EEG)', 125_000, 320_000, 150_000],
        ['Elektromiograf (EMG)', 125_000, 330_000, 150_000],
        ['Spirometer', 130_000, 345_000, 155_000],
        ['Patient Monitor / Bedside Monitor', 120_000, 315_000, 145_000],
        ['Holter / Ambulatory ECG', 125_000, 325_000, 150_000],
        ['Oksimeter Nadi (Pulse Oximeter)', 130_000, 335_000, 155_000],
        ['Capnography Monitor', 120_000, 305_000, 145_000],
      ],
    },
    {
      id: 'endoskopi', kode: 'MOD-END', nama: 'Endoscopy', keterangan: 'Peralatan Endoskop',
      modular: [
        ['Gastroskop', 120_000, 315_000, 145_000],
        ['Kolonoskop', 125_000, 325_000, 150_000],
        ['Bronkoskop', 130_000, 340_000, 155_000],
        ['Laparoskop', 135_000, 350_000, 160_000],
        ['Artroskop', 125_000, 320_000, 150_000],
        ['Sistoskop', 130_000, 335_000, 155_000],
      ],
    },
    {
      id: 'penunjang-hidup', kode: 'MOD-LFS', nama: 'Life Support', keterangan: 'Penunjang Hidup Pasien',
      modular: [
        ['Ventilator Mekanis (ICU / Transport)', 130_000, 345_000, 160_000],
        ['Mesin Heart-Lung / ECMO', 135_000, 355_000, 165_000],
        ['Defibrilator (Manual / AED)', 140_000, 370_000, 165_000],
        ['Mesin Hemodialisis (Cuci Darah)', 145_000, 380_000, 170_000],
        ['Infusion Pump', 135_000, 350_000, 160_000],
        ['Syringe Pump', 140_000, 365_000, 165_000],
        ['Inkubator Bayi & Infant Warmer', 140_000, 375_000, 170_000],
        ['Resusitator Neonatus (T-Piece)', 130_000, 345_000, 160_000],
      ],
    },
    {
      id: 'bedah', kode: 'MOD-SUR', nama: 'Surgical & Interventional', keterangan: 'Bedah & Intervensi',
      modular: [
        ['Unit Elektrokauter (Electrosurgical Unit)', 130_000, 335_000, 155_000],
        ['Mesin Anestesi & Vaporizer', 135_000, 350_000, 160_000],
        ['Laser Bedah (Surgical Laser)', 135_000, 360_000, 165_000],
        ['Lampu Operasi (Surgical Light)', 140_000, 375_000, 170_000],
        ['Meja Operasi Hidrolik / Elektrik', 130_000, 345_000, 155_000],
        ['Surgical Drill & Saw System', 135_000, 355_000, 160_000],
        ['Unit ESWL (Extracorporeal Lithotripsy)', 140_000, 365_000, 165_000],
        ['Unit Radioterapi (LINAC / Brachy)', 130_000, 335_000, 155_000],
      ],
    },
    {
      id: 'metrologi', kode: 'MOD-MET', nama: 'Measurement & Metrology', keterangan: 'Pengukuran & Metrologi Umum',
      modular: [
        ['Tensimeter (Aneroid / Digital / Raksa)', 100_000, 250_000, 120_000],
        ['Termometer Medis (Infrared / Digital)', 100_000, 250_000, 120_000],
        ['Timbangan Dewasa / Standing Scale', 105_000, 265_000, 125_000],
        ['Timbangan Bayi (Baby Scale)', 110_000, 275_000, 130_000],
        ['Pengukur Tinggi Badan (Stadiometer)', 100_000, 250_000, 120_000],
        ['Dinamometer Genggam (Handgrip)', 105_000, 260_000, 125_000],
        ['Stopwatch / Timer Laboratorium', 105_000, 270_000, 130_000],
        ['Pipet Mikro / Mikropipet', 100_000, 250_000, 120_000],
      ],
    },
    {
      id: 'ivd', kode: 'MOD-IVD', nama: 'In Vitro Diagnostics / IVD', keterangan: 'Laboratorium Klinik',
      modular: [
        ['Hematology Analyzer', 125_000, 320_000, 150_000],
        ['Clinical Chemistry Analyzer', 130_000, 335_000, 155_000],
        ['Immunoassay Analyzer', 130_000, 345_000, 160_000],
        ['Blood Gas Analyzer (BGA)', 135_000, 360_000, 165_000],
        ['Coagulation Analyzer', 125_000, 330_000, 150_000],
        ['Centrifuge Laboratorium', 130_000, 340_000, 155_000],
        ['Mikroskop Biologi Klinis', 135_000, 350_000, 160_000],
        ['Thermal Cycler / Real-Time PCR', 125_000, 320_000, 150_000],
      ],
    },
    {
      id: 'sterilisasi', kode: 'MOD-CSS', nama: 'Sterilization & Disinfection', keterangan: 'CSSD & Sanitasi',
      modular: [
        ['Autoklaf Steam', 115_000, 300_000, 140_000],
        ['Sterilisator Plasma / EtO', 120_000, 310_000, 145_000],
        ['Washer-Disinfector', 125_000, 325_000, 150_000],
        ['Ultrasonic Cleaner', 130_000, 335_000, 155_000],
        ['Laminar Flow / BSC', 120_000, 305_000, 140_000],
        ['Robot / Lampu UV-C', 125_000, 320_000, 145_000],
      ],
    },
    {
      id: 'rantai-dingin', kode: 'MOD-STR', nama: 'Special Storage & Cold Chain', keterangan: 'Rantai Dingin & Farmasi',
      modular: [
        ['Blood Bank Refrigerator', 115_000, 290_000, 135_000],
        ['Pharmaceutical Refrigerator', 120_000, 305_000, 140_000],
        ['Ultra-Low Temp Freezer (-80°C)', 120_000, 315_000, 145_000],
        ['BSC Sitostatiska / Kemoterapi', 125_000, 330_000, 150_000],
      ],
    },
    {
      id: 'infrastruktur', kode: 'MOD-INF', nama: 'Hospital Infrastructure & Gas', keterangan: 'Infrastruktur & Gas Medis',
      modular: [
        ['Sentral Oksigen (PSA / Liquid Tank)', 125_000, 330_000, 150_000],
        ['Pompa Vakum Medis (Medical Vacuum)', 130_000, 340_000, 155_000],
        ['Kompresor Udara Tekan Medis', 135_000, 355_000, 160_000],
        ['Bedhead Panel & Pendant Ruang Operasi', 140_000, 365_000, 165_000],
        ['Sistem HVAC HEPA Filter / Laminar Air Flow', 130_000, 335_000, 155_000],
      ],
    },
    {
      id: 'perawatan-pasien', kode: 'MOD-FUR', nama: 'Patient Care & Furniture', keterangan: '',
      modular: [
        ['Hospital Bed (ICU / Elektrik)', 100_000, 255_000, 120_000],
        ['Kursi Roda & Brankar Pasien', 105_000, 265_000, 125_000],
        ['Patient Hoist / Crane Lifter', 110_000, 280_000, 130_000],
        ['Lampu Periksa (Examination Light)', 115_000, 290_000, 135_000],
      ],
    },
    {
      id: 'kamar-jenazah', kode: 'MOD-MRG', nama: 'Mortuary', keterangan: 'Kamar Jenazah',
      modular: [
        ['Kulkas Jenazah (Mortuary Ref)', 105_000, 260_000, 125_000],
        ['Meja Otopsi Diseksi Stainless', 110_000, 275_000, 130_000],
        ['Brankar Khusus Transport Jenazah', 110_000, 285_000, 135_000],
      ],
    },
    {
      id: 'limbah', kode: 'MOD-WST', nama: 'Medical Waste & Environmental', keterangan: 'Pengolahan Limbah Medis',
      modular: [
        ['Insinerator Medis Suhu Tinggi', 120_000, 305_000, 145_000],
        ['Autoklaf Pengolah Limbah B3', 125_000, 320_000, 150_000],
        ['Penghancur Jarum / Needle Destroyer', 125_000, 330_000, 150_000],
        ['Sistem IPAL Cair Medis', 130_000, 345_000, 155_000],
      ],
    },
  ],
};

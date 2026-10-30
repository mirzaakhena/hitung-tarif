/*
 * Sepuluh set contoh order untuk tab Formula tarif mitra (tiket 261030141201).
 *
 * Tiap set adalah cerita satu mitra dengan satu grading selama beberapa pekan
 * (keputusan Mirza 30 Okt 2026). Penyesuaian tarif berjalan seminggu sekali:
 * saat dimuat, order pekan ke-n dihitung di penerapan ke-n, dan pekan terakhir
 * dibiarkan belum diterapkan supaya "Terapkan perubahan tarif" bisa langsung
 * ditekan.
 *
 * Pola hari yang dijaga di DATA ini, bukan di form (keputusan Mirza): hari
 * kerja Senin–Sabtu, paling banyak 2 order dan 8 jam sehari, durasi 3–8 jam
 * seperti pilihan form. Bintang dibuat masuk akal dengan cerita setnya.
 *
 * Bentuk tiap order: [hari, modular, jenis, jam, bintang]. `hari` 1 = Senin …
 * 6 = Sabtu; `bintang` enam angka 1..5 dalam urutan `POC_TARIF.penilaian`
 * (Komunikasi, Keramahan, Ketepatan waktu, Hasil kerja, Ketelitian,
 * Efisiensi). Nama modular harus persis nama di `data.js`.
 *
 * Dimuat sesudah `data.js`, sebelum `formula.js`. Skrip biasa, bukan modul.
 */
window.POC_CONTOH = (function () {
  'use strict';

  // Nama modular yang dipakai lebih dari sekali, supaya tidak salah ketik.
  const PM = 'Patient Monitor / Bedside Monitor';
  const INF = 'Infusion Pump';
  const SYR = 'Syringe Pump';
  const ECG = 'Elektrokardiograf (ECG / EKG)';
  const TENSI = 'Tensimeter (Aneroid / Digital / Raksa)';
  const TERMO = 'Termometer Medis (Infrared / Digital)';
  const TIMB = 'Timbangan Dewasa / Standing Scale';
  const OKSI = 'Oksimeter Nadi (Pulse Oximeter)';
  const HD = 'Mesin Hemodialisis (Cuci Darah)';
  const CT = 'CT-Scan System';
  const MRI = 'MRI System';
  const XR = 'X-Ray (Fixed / Mobile)';
  const CARM = 'C-Arm Fluoroscopy';
  const VENT = 'Ventilator Mekanis (ICU / Transport)';
  const DEFIB = 'Defibrilator (Manual / AED)';
  const LAMPU = 'Lampu Operasi (Surgical Light)';
  const ANEST = 'Mesin Anestesi & Vaporizer';
  const AUTO = 'Autoklaf Steam';
  const BAYI = 'Timbangan Bayi (Baby Scale)';
  const STADIO = 'Pengukur Tinggi Badan (Stadiometer)';
  const HEMA = 'Hematology Analyzer';
  const KIMIA = 'Clinical Chemistry Analyzer';
  const IMUN = 'Immunoassay Analyzer';
  const KOAG = 'Coagulation Analyzer';
  const KURSI = 'Kursi Roda & Brankar Pasien';
  const BED = 'Hospital Bed (ICU / Elektrik)';
  const PERIKSA = 'Lampu Periksa (Examination Light)';
  const STERIL = 'Sterilisator Plasma / EtO';
  const WASH = 'Washer-Disinfector';
  const ULTRA = 'Ultrasonic Cleaner';
  const LAF = 'Laminar Flow / BSC';
  const I = 'instalasi';
  const B = 'perbaikan';
  const W = 'perawatan';

  const set = [
    {
      id: 'membaik', nama: 'Mitra yang membaik', grading: 'intermediate',
      kalimat: 'Pekan pertama kebanyakan bintang 2–3 di alat rawat inap; tiap pekan ia lebih tepat waktu dan rapi, sampai bintang 4–5.',
      pekan: [
        [[1, PM, B, 4, '232232'], [1, INF, W, 3, '333222'], [3, SYR, B, 5, '222323'], [5, PM, W, 3, '323332']],
        [[2, INF, B, 4, '333332'], [4, ECG, W, 3, '333333'], [4, PM, B, 5, '333433'], [6, SYR, W, 3, '343333']],
        [[1, PM, W, 4, '434443'], [2, INF, W, 3, '443434'], [2, ECG, B, 4, '444343'], [5, SYR, B, 6, '444444']],
        [[1, ECG, W, 3, '454444'], [3, PM, B, 5, '544454'], [3, INF, W, 3, '455444'], [5, SYR, W, 4, '554545']],
        [[2, PM, W, 4, '555455'], [2, INF, B, 4, '545554'], [4, ECG, B, 5, '555545']],
      ],
    },
    {
      id: 'bermasalah', nama: 'Mitra bermasalah', grading: 'rookie',
      kalimat: 'Sering terlambat dan pekerjaannya harus diulang; bintang 1–2 di hampir semua order, jadi kedua rumus menurunkan tarifnya.',
      pekan: [
        [[1, TENSI, B, 3, '221232'], [2, TERMO, W, 3, '312222'], [4, TIMB, B, 4, '221122'], [4, TENSI, W, 3, '322232']],
        [[1, OKSI, B, 4, '211221'], [3, TENSI, B, 5, '122122'], [3, TERMO, W, 3, '222312'], [6, TIMB, W, 3, '231222']],
        [[2, TENSI, W, 3, '212121'], [2, OKSI, W, 4, '221212'], [5, TERMO, B, 4, '112222'], [6, TENSI, B, 6, '222122']],
        [[1, TIMB, B, 4, '322222'], [3, OKSI, B, 5, '212222'], [3, TENSI, W, 3, '222212']],
      ],
    },
    {
      id: 'satu-modular', nama: 'Satu modular saja', grading: 'senior',
      kalimat: 'Spesialis mesin hemodialisis: semua ordernya di satu modular, rawat rutin dan sesekali perbaikan, bintang 3–4.',
      pekan: [
        [[1, HD, W, 4, '343433'], [3, HD, B, 6, '433343'], [5, HD, W, 4, '334434']],
        [[2, HD, W, 4, '443433'], [2, HD, W, 4, '344343'], [4, HD, B, 7, '434434']],
        [[1, HD, I, 8, '444344'], [3, HD, W, 4, '434443'], [6, HD, B, 5, '443344']],
        [[2, HD, W, 4, '444434'], [4, HD, W, 3, '344444'], [4, HD, B, 5, '444443']],
        [[1, HD, W, 4, '444444'], [3, HD, B, 6, '443444']],
      ],
    },
    {
      id: 'banyak-modular', nama: 'Banyak modular', grading: 'advance',
      kalimat: 'Teknisi serba bisa di rumah sakit besar: empat belas modular dalam empat pekan, hanya sebagian yang diorder lagi.',
      pekan: [
        [[1, CT, W, 5, '444344'], [2, VENT, B, 6, '434443'], [4, DEFIB, W, 3, '443434'], [4, LAMPU, I, 4, '344444'], [6, AUTO, W, 4, '443344']],
        [[1, HEMA, B, 5, '434344'], [1, 'Centrifuge Laboratorium', W, 3, '444433'], [3, VENT, W, 4, '444344'], [5, ANEST, B, 7, '343444'], [6, 'Ultrasonografi (USG)', I, 4, '444443']],
        [[2, CT, B, 8, '434344'], [3, INF, W, 3, '444444'], [3, SYR, W, 3, '444434'], [5, 'Blood Gas Analyzer (BGA)', B, 5, '344443'], [6, DEFIB, B, 4, '443444']],
        [[1, BED, B, 4, '444344'], [2, AUTO, B, 6, '434444'], [4, 'Sentral Oksigen (PSA / Liquid Tank)', W, 5, '444443'], [4, LAMPU, W, 3, '443444']],
      ],
    },
    {
      id: 'stabil', nama: 'Expert yang stabil', grading: 'expert',
      kalimat: 'Enam pekan di alat pencitraan dengan bintang 4–5 di hampir semua atribut; tarifnya naik pelan tapi terus.',
      pekan: [
        [[1, MRI, W, 5, '545454'], [3, CT, B, 6, '454545'], [5, XR, W, 4, '554455']],
        [[2, MRI, B, 7, '455545'], [4, CARM, W, 4, '545455'], [4, CT, W, 4, '454554']],
        [[1, XR, B, 5, '554545'], [3, MRI, W, 5, '545545'], [6, CT, W, 4, '455454']],
        [[2, CARM, B, 6, '454545'], [3, MRI, W, 4, '555454'], [5, XR, W, 3, '545454'], [5, CT, W, 5, '455455']],
        [[1, MRI, I, 8, '545455'], [4, CT, B, 6, '554545'], [6, XR, W, 4, '455545']],
        [[2, CARM, W, 4, '545454'], [3, MRI, B, 6, '454555']],
      ],
    },
    {
      id: 'belajar', nama: 'Rookie yang belajar', grading: 'rookie',
      kalimat: 'Mitra baru di alat sederhana: pekan pertama terlambat dan kurang teliti, lalu pelan-pelan naik ke bintang 3–4.',
      pekan: [
        [[1, TENSI, B, 3, '331323'], [3, BAYI, B, 4, '322332'], [5, TERMO, W, 3, '332322']],
        [[1, TENSI, W, 3, '333233'], [2, STADIO, I, 3, '333333'], [2, BAYI, W, 3, '323333'], [5, TERMO, B, 4, '333332']],
        [[2, TENSI, B, 4, '343333'], [4, BAYI, B, 3, '333434'], [4, TERMO, W, 3, '343333'], [6, STADIO, W, 3, '334343']],
        [[1, TENSI, B, 4, '343434'], [3, TERMO, W, 3, '344343'], [5, BAYI, W, 3, '434343']],
      ],
    },
    {
      id: 'menurun', nama: 'Mitra yang menurun', grading: 'senior',
      kalimat: 'Dua pekan pertama bagus di alat laboratorium, lalu mulai terlambat dan hasilnya kurang tuntas sampai bintang 2.',
      pekan: [
        [[1, HEMA, W, 4, '454444'], [2, KIMIA, B, 6, '444544'], [4, IMUN, W, 4, '445444'], [4, KOAG, W, 3, '444454']],
        [[1, HEMA, B, 5, '444434'], [3, KIMIA, W, 4, '434443'], [3, KOAG, B, 4, '443433'], [6, IMUN, B, 6, '344343']],
        [[2, HEMA, W, 4, '333332'], [2, KIMIA, W, 3, '332323'], [4, IMUN, W, 4, '323332'], [5, KOAG, B, 5, '332322']],
        [[1, KIMIA, B, 6, '322232'], [3, HEMA, B, 5, '231222'], [3, KOAG, W, 3, '322322'], [6, IMUN, W, 4, '222322']],
        [[2, HEMA, W, 4, '221222'], [4, KIMIA, B, 5, '222122'], [4, IMUN, W, 3, '312222']],
      ],
    },
    {
      id: 'paruh-waktu', nama: 'Mitra paruh waktu', grading: 'intermediate',
      kalimat: 'Hanya dua order singkat sepekan (6–7 jam), jadi bagian jam rumus Mirza tidak pernah penuh walau bintangnya bagus.',
      pekan: [
        [[2, KURSI, B, 3, '444343'], [6, BED, W, 3, '434443']],
        [[3, PERIKSA, I, 3, '443434'], [6, KURSI, W, 4, '344443']],
        [[1, BED, B, 4, '444434'], [6, PERIKSA, W, 3, '434444']],
        [[2, KURSI, B, 3, '443444'], [5, BED, W, 4, '444344']],
        [[3, PERIKSA, B, 3, '444443'], [6, KURSI, W, 3, '443444']],
      ],
    },
    {
      id: 'padat', nama: 'Pekan padat', grading: 'advance',
      kalimat: 'Teknisi sterilisasi dengan dua order di hampir setiap hari kerja, delapan sampai sepuluh order sepekan; pekan kedua kelelahan.',
      pekan: [
        [[1, AUTO, W, 4, '434443'], [1, WASH, W, 4, '443434'], [2, STERIL, B, 5, '344433'], [2, ULTRA, W, 3, '443343'], [3, AUTO, B, 6, '433443'],
          [4, LAF, W, 4, '444333'], [4, WASH, B, 4, '344434'], [5, STERIL, W, 4, '434343'], [5, ULTRA, B, 3, '343434'], [6, AUTO, W, 4, '443344']],
        [[1, STERIL, W, 4, '333443'], [1, AUTO, W, 3, '343334'], [2, WASH, B, 5, '334333'], [3, LAF, B, 6, '333433'], [4, AUTO, B, 5, '323343'],
          [4, ULTRA, W, 3, '333332'], [5, WASH, W, 4, '343333'], [5, STERIL, W, 4, '333343'], [6, ULTRA, B, 3, '233333']],
        [[1, AUTO, W, 4, '443434'], [1, ULTRA, W, 4, '434344'], [2, STERIL, B, 6, '344443'], [3, WASH, W, 4, '443443'], [3, LAF, W, 4, '434443'],
          [4, AUTO, B, 5, '444344'], [5, STERIL, W, 4, '434434'], [5, WASH, W, 3, '443434'], [6, ULTRA, W, 3, '444343']],
        [[1, LAF, B, 5, '443444'], [1, ULTRA, W, 3, '444434'], [2, AUTO, W, 4, '444443'], [2, WASH, W, 4, '434444'], [3, STERIL, B, 6, '444344'],
          [4, AUTO, B, 5, '443444'], [5, WASH, B, 5, '444434'], [6, STERIL, W, 4, '444444']],
      ],
    },
    {
      id: 'naik-turun', nama: 'Naik-turun', grading: 'expert',
      kalimat: 'Pekan bagus dan pekan buruk berselang-seling di alat ICU dan kamar operasi; potongan maksimal Expert kecil, jadi turunnya tipis.',
      pekan: [
        [[1, VENT, B, 6, '545454'], [3, ANEST, W, 4, '454545'], [5, DEFIB, W, 3, '545444']],
        [[2, VENT, W, 4, '332323'], [2, PM, B, 4, '323232'], [4, ANEST, B, 6, '232323'], [6, DEFIB, B, 3, '322332']],
        [[1, ANEST, W, 4, '454555'], [3, VENT, B, 7, '545455'], [5, PM, W, 4, '555445']],
        [[2, DEFIB, W, 3, '323222'], [2, VENT, W, 5, '232322'], [4, PM, B, 5, '322323'], [6, ANEST, B, 6, '232232']],
        [[1, VENT, W, 4, '454545'], [3, ANEST, B, 6, '545454'], [5, PM, W, 3, '455454']],
      ],
    },
  ];

  return {
    /**
     * Sepuluh set, tiap order sudah diurai: { pekan (1..), hari (1..6),
     * modular, jenis, jam, bintang: [6 × 1..5] }, berurutan menurut pekan.
     */
    set: set.map((s) => ({
      id: s.id, nama: s.nama, kalimat: s.kalimat, grading: s.grading,
      pekan: s.pekan.length,
      order: s.pekan.flatMap((isi, i) => isi.map(([hari, modular, jenis, jam, bintang]) => ({
        pekan: i + 1, hari, modular, jenis, jam, bintang: [...bintang].map(Number),
      }))),
    })),
  };
})();

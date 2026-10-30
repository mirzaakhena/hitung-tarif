/*
 * POC tab Formula tarif mitra (tiket 261030105302).
 *
 * Satu mitra rekaan. Grading mitra dipilih di tab Grading dan penyetel kedua
 * rumus di tab Penyetel rumus (tiket 261030124701, dibaca lewat
 * `pengaturan.js`); halaman ini hanya menampilkannya. "Buat Ulasan Order"
 * menambah satu order (modular, jenis, jam, enam bintang; grading saat order
 * dibuat ikut dicatat). "Terapkan perubahan tarif" adalah satu penyesuaian berkala:
 * order yang belum dihitung diberi nomor penerapan itu (tidak dihapus), dan
 * grading mitra saat itu dicatat di riwayat.
 *
 * Tabel "Tarif milik mitra" bisa dipindah halaman per penerapan: bawaannya
 * keadaan sekarang (sesudah penerapan terakhir), halaman sebelumnya menghitung
 * ulang riwayat sampai penerapan itu saja. Sejak tiket 261030134401 riwayat
 * penerapan menyatu di bagian itu: daftar ringkas satu baris per penerapan
 * (klik untuk berpindah halaman), dan halaman penerapan ke-n memuat langkah
 * hitung kedua rumus milik penerapan ke-n, tertutup sampai dibuka. Tabel Order
 * bisa dilipat dari judulnya dan disaring (semua, belum, sudah diterapkan).
 *
 * Sejak tiket 261030141201 tiap order punya hari (`pekan`, `hari`; tampil
 * "Pekan 2 · Selasa"), dipilih di form; order lama tanpa hari tetap sah dan
 * tampil "—". Sepuluh set contoh (`contoh.js`) bisa dimuat: menggantikan order
 * dan penerapan sesudah konfirmasi, mengatur grading mitra lewat
 * `pengaturan.js`, dan menerapkan tiap pekan kecuali yang terakhir, satu
 * penerapan per pekan. Hari tidak ikut hitungan; batas 2 order dan 8 jam
 * sehari hanya dijaga di data contoh, form tidak memaksakannya. Set contoh
 * dan form ulasan ("Input ulasan order secara manual") adalah dua tab; tab
 * terakhir yang dipilih disimpan bersama keadaan lipat (`KUNCI_TAMPILAN`).
 *
 * Hitungannya di `rumus.js`, atas seluruh riwayat setiap kali digambar, jadi
 * penyetel, tarif dasar (tab Tarif dasar, `harga.js`), dan batas grading (tab
 * Grading, `batas.js`) yang diubah berlaku untuk semua penerapan. Tampilan
 * membulatkan angka; yang disimpan dan dihitung tidak pernah dibulatkan.
 *
 * Disimpan di `localStorage` (kunci `KUNCI`): order dan penerapan. Keadaan
 * lipat tabel Order dan tab yang dipilih disimpan terpisah (kunci `KUNCI_TAMPILAN`), hanya kemudahan
 * bagi peramban ini; saringannya tidak disimpan, supaya order yang baru dibuat
 * tidak tersembunyi tanpa disadari sesudah halaman dimuat ulang. Grading
 * mitra dan penyetel yang dulu ikut di kunci ini dipindah ke kunci
 * `pengaturan.js` saat halaman mana pun dimuat. Simpanan dibaca dengan penjagaan yang sama dengan isian, jadi isi
 * yang rusak atau disunting tangan diabaikan, bukan dipakai.
 */
(function () {
  'use strict';

  const D = window.POC_TARIF;
  const H = window.POC_HARGA;
  const B = window.POC_BATAS;
  const R = window.POC_RUMUS;
  const P = window.POC_PENGATURAN;
  const penyimpanan = window.POC_PENYIMPANAN || null;
  const KUNCI = 'nukitu-poc-tarif:formula';
  const KUNCI_TAMPILAN = 'nukitu-poc-tarif:tampilan-formula';
  const MINUS = '−';
  const DURASI = [3, 4, 5, 6, 7, 8];
  const JENIS = D.jenis;
  const namaJenis = (id) => JENIS.find((j) => j.id === id).nama;
  const namaGrading = (id) => D.grading.find((g) => g.id === id).nama;

  // Hari order (tiket 261030141201): "Pekan n · Hari". Pekan 1..PEKAN_MAKS,
  // hari 1 = Senin … 7 = Minggu. Order lama tanpa hari tetap sah (tampil "—").
  const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const PEKAN_MAKS = 52;
  /** Sepuluh set contoh order (`contoh.js`); menggantikan tombol contoh tiket 261030105302. */
  const SET = (window.POC_CONTOH && window.POC_CONTOH.set) || [];

  /** Penyetel kedua rumus, diatur di tab Penyetel rumus (`pengaturan.js`). */
  const PENYETEL = P.PENYETEL;
  /** Penyetel yang berlaku, dibaca ulang tiap kali halaman digambar. */
  let penyetel = P.penyetel();

  /* ------------------------------------------------------- simpanan ---- */

  const gradingSah = (id) => D.grading.some((g) => g.id === id);
  const bulatDalam = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;
  const hariSah = (pekan, hari) => bulatDalam(pekan, 1, PEKAN_MAKS) && bulatDalam(hari, 1, HARI.length);
  /** "Pekan 2 · Selasa", atau "—" untuk order lama tanpa hari. */
  const teksHari = (o) => (o.pekan ? 'Pekan ' + o.pekan + ' · ' + HARI[o.hari - 1] : '—');

  function keadaanKosong() {
    return { order: [], penerapan: [], idBerikut: 1 };
  }

  /** Simpanan → keadaan. Butir yang tidak sah dibuang. */
  function bacaSimpanan() {
    const k = keadaanKosong();
    if (!penyimpanan) return k;
    let m;
    try {
      m = JSON.parse(penyimpanan.getItem(KUNCI) || '{}');
    } catch (e) {
      return k;
    }
    if (!m || typeof m !== 'object') return k;
    if (Array.isArray(m.penerapan)) {
      for (const p of m.penerapan) {
        if (p && gradingSah(p.grading)) k.penerapan.push({ grading: p.grading });
        else break; // nomor penerapan sesudahnya tidak bisa dipercaya lagi
      }
    }
    const ids = new Set();
    if (Array.isArray(m.order)) {
      for (const o of m.order) {
        if (!o || typeof o !== 'object') continue;
        const ok = bulatDalam(o.id, 1, 1e9) && !ids.has(o.id) &&
          typeof o.modular === 'string' && Object.prototype.hasOwnProperty.call(H.contoh, o.modular) &&
          JENIS.some((j) => j.id === o.jenis) && gradingSah(o.grading) && DURASI.includes(o.jam) &&
          Array.isArray(o.bintang) && o.bintang.length === D.penilaian.length && o.bintang.every((b) => bulatDalam(b, 1, 5)) &&
          bulatDalam(o.ke, 0, k.penerapan.length);
        if (!ok) continue;
        ids.add(o.id);
        const x = { id: o.id, modular: o.modular, jenis: o.jenis, grading: o.grading, jam: o.jam, bintang: o.bintang.slice(), ke: o.ke };
        // Hari hanya dipakai bila keduanya sah; selain itu order tetap ada, tanpa hari.
        if (hariSah(o.pekan, o.hari)) { x.pekan = o.pekan; x.hari = o.hari; }
        k.order.push(x);
      }
    }
    k.idBerikut = Math.max(bulatDalam(m.idBerikut, 1, 1e9) ? m.idBerikut : 1, ...k.order.map((o) => o.id + 1));
    return k;
  }

  let keadaan = bacaSimpanan();
  let gagalSimpan = !penyimpanan;

  /**
   * Dua tab cara menambah order (tiket 261030141201), berurutan seperti di
   * halaman; yang pertama tampil saat kunjungan pertama.
   */
  const TAB = [
    { id: 'contoh', nama: 'Set contoh order' },
    { id: 'manual', nama: 'Input ulasan order secara manual' },
  ];

  /**
   * Keadaan tampilan: lipat tabel Order (`true` hanya bila tersimpan persis
   * `true`; selain itu terbuka) dan tab yang terakhir dipilih (hanya id yang
   * dikenal; selain itu tab pertama). Isi rusak atau tidak ada berarti bawaan.
   */
  function bacaTampilan() {
    const k = { orderTerlipat: false, tab: TAB[0].id };
    if (!penyimpanan) return k;
    try {
      const m = JSON.parse(penyimpanan.getItem(KUNCI_TAMPILAN) || 'null');
      if (!m || typeof m !== 'object') return k;
      k.orderTerlipat = m.orderTerlipat === true;
      if (TAB.some((x) => x.id === m.tab)) k.tab = m.tab;
    } catch (e) {
      // rusak: bawaan
    }
    return k;
  }
  function simpanTampilan() {
    if (!penyimpanan) return;
    try {
      penyimpanan.setItem(KUNCI_TAMPILAN, JSON.stringify({ orderTerlipat, tab: tabDipilih }));
    } catch (e) {
      // hanya kemudahan tampilan: bila ditolak, berlaku sampai halaman dimuat ulang
    }
  }
  let { orderTerlipat, tab: tabDipilih } = bacaTampilan();

  function simpan() {
    if (!penyimpanan) return; // gagalSimpan sudah true sejak awal
    try {
      penyimpanan.setItem(KUNCI, JSON.stringify(keadaan));
      gagalSimpan = false;
    } catch (e) {
      gagalSimpan = true;
    }
  }

  /* ---------------------------------------------------------- angka ---- */

  /** Angka Indonesia, paling banyak `desimal` angka di belakang koma: { teks, pas }. */
  function angka(n, desimal) {
    const f = Math.pow(10, desimal);
    const r = Math.round(Math.abs(n) * f);
    const pas = Math.abs(Math.abs(n) * f - r) < 1e-6;
    const bulat = Math.floor(r / f);
    const sisa = desimal ? String(r % f).padStart(desimal, '0').replace(/0+$/, '') : '';
    const nol = r === 0;
    return { teks: (n < 0 && !nol ? MINUS : '') + H.rupiah(bulat) + (sisa ? ',' + sisa : ''), pas };
  }
  /** Teks angka dengan "≈ " bila dibulatkan untuk ditampilkan. */
  function a(n, desimal) {
    const x = angka(n, desimal);
    return (x.pas ? '' : '≈ ') + x.teks;
  }
  const t = (n, d) => angka(n, d).teks; // tanpa tanda ≈
  const bertanda = (teks, n) => (n > 0 ? '+' : '') + teks;
  const persen = (n) => a(n, 4) + '%';
  /** Persen dengan "+" bila positif: "≈ +0,1458%". */
  const persenBertanda = (n) => { const x = angka(n, 4); return (x.pas ? '' : '≈ ') + (n > 0 ? '+' : '') + x.teks + '%'; };
  /** Rupiah dengan tanda di depan "Rp": "+Rp 3.704,17", "−Rp 500". */
  const rpBertanda = (n) => (n > 0 ? '+' : n < 0 ? MINUS : '') + 'Rp ' + t(Math.abs(n), 2);
  // Rupiah negatif selalu "−Rp 1.000", di tabel maupun di langkah.
  const rp = (n) => (n < 0 && t(n, 2) !== '0' ? MINUS : '') + 'Rp ' + t(Math.abs(n), 2);
  const rpLangkah = (n) => (angka(n, 2).pas ? '' : '≈ ') + rp(n);
  const selisihRp = (n) => (angka(n, 2).pas ? '' : '≈ ') + (n > 0 ? '+' : '') + rp(n);
  const nilaiTeks = (v) => (v > 0 ? '+' : v < 0 ? MINUS : '') + Math.abs(v);
  const deretNilai = (nilai) => nilai.map((v) => (v < 0 ? '(' + nilaiTeks(v) + ')' : String(v))).join(' + ');
  /** "0,0,-1,2,1,2" seperti di tiket. */
  const nilaiRingkas = (bintang) => R.nilaiDari(bintang).join(',');

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  /* ------------------------------------------------------- tampilan ---- */

  /**
   * Pekan bawaan untuk order baru: pekan terbesar yang sudah ada bila order
   * terakhirnya belum diterapkan, pekan sesudahnya bila sudah; tanpa hari sama
   * sekali, satu sesudah jumlah penerapan.
   */
  function pekanBerikut() {
    const berhari = keadaan.order.filter((o) => o.pekan);
    if (!berhari.length) return Math.min(PEKAN_MAKS, keadaan.penerapan.length + 1);
    const maks = Math.max(...berhari.map((o) => o.pekan));
    const sudah = berhari.filter((o) => o.pekan === maks).every((o) => o.ke > 0);
    return Math.min(PEKAN_MAKS, maks + (sudah ? 1 : 0));
  }

  const akar = document.getElementById('formula');
  const form = {
    modular: H.contoh['MRI System'] ? 'MRI System' : Object.keys(H.contoh)[0],
    jenis: JENIS[0].id,
    jam: DURASI[0],
    bintang: D.penilaian.map(() => 3),
    pekan: pekanBerikut(),
    hari: 1,
  };
  let tanyaKosongkan = false;
  let tanyaMuat = null; // id set yang sedang menunggu konfirmasi muat
  let pesanMuat = ''; // kalimat sesudah satu set dimuat, hilang pada perubahan berikutnya
  const terbuka = new Set(); // penerapan yang langkahnya sedang dibuka
  // Saringan tabel Order: 'semua', 'belum', atau 'sudah' (diterapkan). Tidak disimpan.
  let saringOrder = 'semua';
  // Halaman tabel tarif mitra: nomor penerapan yang dilihat, null = yang terakhir.
  let lihatKe = null;

  /**
   * Seluruh riwayat, atau (bila `sampai` diisi) riwayat sampai penerapan ke-`sampai`
   * saja: order sesudahnya dan yang belum dihitung tidak ikut, jadi tarif dan
   * poinnya adalah angka sesudah penerapan itu.
   */
  function hitungSemua(sampai) {
    const potong = sampai !== undefined;
    return R.hitung({
      order: potong ? keadaan.order.filter((o) => o.ke >= 1 && o.ke <= sampai) : keadaan.order,
      penerapan: potong ? keadaan.penerapan.slice(0, sampai) : keadaan.penerapan,
      penyetel,
      tarifDasar: (m, j) => H.harga(m, j),
      batas: (id) => B.grading(id),
    });
  }

  function gambarMitra() {
    const g = B.grading(P.gradingMitra());
    return (
      '<section class="panel" aria-labelledby="judul-mitra">' +
        '<h2 id="judul-mitra">Mitra</h2>' +
        '<p class="batas-pilihan" data-batas-mitra>Grading mitra <b data-grading-mitra>' + esc(g.nama) + '</b> · poin maksimal <b>' + g.poinMaks + '%</b> · potongan maksimal <b>' + g.potonganMaks + '%</b> · <a href="grading.html#grading-mitra">ubah di tab Grading</a></p>' +
        '<p class="redup kecil">Berlaku saat "Terapkan perubahan tarif" ditekan; tiap order mencatat grading saat ia dibuat.</p>' +
        (H.adaPenyimpanan() && B.adaPenyimpanan() && P.adaPenyimpanan() ? '' : '<p class="peringatan" role="alert">Peramban menolak penyimpanan, jadi harga, batas, grading mitra, dan penyetel yang diubah di tab lain tidak terbaca di sini.</p>') +
      '</section>'
    );
  }

  function gambarForm() {
    const opsiModular = D.kategori.map((k) =>
      '<optgroup label="' + esc(k.kode + ' · ' + k.nama) + '">' +
        k.modular.map(([nama]) => '<option value="' + esc(nama) + '"' + (nama === form.modular ? ' selected' : '') + '>' + esc(nama) + '</option>').join('') +
      '</optgroup>').join('');
    const opsiJenis = JENIS.map((j) => '<option value="' + j.id + '"' + (j.id === form.jenis ? ' selected' : '') + '>' + esc(j.nama) + '</option>').join('');
    const opsiJam = DURASI.map((n) => '<option value="' + n + '"' + (n === form.jam ? ' selected' : '') + '>' + n + ' jam</option>').join('');
    const opsiPekan = Array.from({ length: PEKAN_MAKS }, (_, i) => i + 1).map((n) => '<option value="' + n + '"' + (n === form.pekan ? ' selected' : '') + '>Pekan ' + n + '</option>').join('');
    const opsiHari = HARI.map((h, i) => '<option value="' + (i + 1) + '"' + (i + 1 === form.hari ? ' selected' : '') + '>' + h + '</option>').join('');
    const kelompok = [{ id: 'EQ', judul: 'EQ · sikap dan komunikasi' }, { id: 'IQ', judul: 'IQ · mutu kerja teknis' }];
    return (
      '<div class="pilih-pekerjaan">' +
          '<label class="isian-pilih"><span>Modular</span><select data-form="modular">' + opsiModular + '</select></label>' +
          '<label class="isian-pilih"><span>Jenis pekerjaan</span><select data-form="jenis">' + opsiJenis + '</select></label>' +
          '<label class="isian-pilih"><span>Durasi kerja</span><select data-form="jam">' + opsiJam + '</select></label>' +
          '<label class="isian-pilih"><span>Pekan</span><select data-form="pekan">' + opsiPekan + '</select></label>' +
          '<label class="isian-pilih"><span>Hari</span><select data-form="hari">' + opsiHari + '</select></label>' +
        '</div>' +
        '<div class="kelompok-penilaian ulasan-bintang">' +
        kelompok.map((g) =>
          '<div class="kelompok"><h3>' + esc(g.judul) + '</h3>' +
            D.penilaian.map((p, i) => p.kelompok !== g.id ? '' :
              '<fieldset class="penilaian" data-penilaian="' + p.id + '">' +
                '<legend>' + esc(p.nama) + '</legend>' +
                '<p class="penjelasan">' + esc(p.penjelasan) + '</p>' +
                '<div class="baris-bintang"><span class="bintang">' +
                [1, 2, 3, 4, 5].map((n) => {
                  const id = 'fb-' + p.id + '-' + n;
                  return '<input type="radio" id="' + id + '" name="fb-' + i + '" value="' + n + '"' + (form.bintang[i] === n ? ' checked' : '') + '>' +
                    '<label for="' + id + '" title="Bintang ' + n + '"' + (n <= form.bintang[i] ? ' class="nyala"' : '') + '><span aria-hidden="true">★</span><span class="sr">' + esc(p.nama) + ' bintang ' + n + '</span></label>';
                }).join('') +
                '</span><span class="nilai-bintang" data-nilai>bintang ' + form.bintang[i] + ' · nilai ' + nilaiTeks(D.nilaiBintang[form.bintang[i] - 1]) + '</span></div>' +
              '</fieldset>').join('') +
          '</div>').join('') +
        '</div>' +
        '<div class="bar-aksi bar-kiri">' +
          '<button type="button" class="tombol tombol-utama" data-aksi="buat">Buat Ulasan Order</button>' +
        '</div>'
    );
  }

  /**
   * Dua tab dalam satu panel (pola tablist WAI-ARIA): hanya panel tab yang
   * dipilih tampil, tab lain tabindex -1 (panah kiri/kanan, Home, End memilih).
   * Isi panel contoh digambar ulang bersama hasil; isi form hanya di `gambar()`,
   * supaya pilihan yang sedang diisi tidak hilang saat berpindah tab.
   */
  function gambarTab() {
    const isi = { contoh: '<div data-bagian-contoh>' + gambarContoh() + '</div>', manual: '<div data-bagian-form>' + gambarForm() + '</div>' };
    return (
      '<section class="panel panel-tab" aria-labelledby="judul-tambah">' +
        '<h2 id="judul-tambah" class="sr">Tambah order</h2>' +
        '<div class="daftar-tab" role="tablist" aria-label="Cara menambah order">' +
        TAB.map((x) => '<button type="button" role="tab" class="tab" id="tab-' + x.id + '" data-tab="' + x.id + '" aria-controls="panel-' + x.id + '"' +
          ' aria-selected="' + (x.id === tabDipilih) + '" tabindex="' + (x.id === tabDipilih ? 0 : -1) + '">' + esc(x.nama) + '</button>').join('') +
        '</div>' +
        TAB.map((x) => '<div class="panel-isi-tab" role="tabpanel" id="panel-' + x.id + '" aria-labelledby="tab-' + x.id + '"' + (x.id === tabDipilih ? '' : ' hidden') + '>' + isi[x.id] + '</div>').join('') +
      '</section>'
    );
  }

  /** Pindah tab tanpa menggambar ulang isinya; pilihan disimpan untuk peramban ini. */
  function pilihTab(id, fokus) {
    if (!TAB.some((x) => x.id === id)) return;
    tabDipilih = id;
    simpanTampilan();
    for (const x of TAB) {
      const b = akar.querySelector('#tab-' + x.id);
      b.setAttribute('aria-selected', String(x.id === id));
      b.tabIndex = x.id === id ? 0 : -1;
      akar.querySelector('#panel-' + x.id).hidden = x.id !== id;
    }
    if (fokus) akar.querySelector('#tab-' + id).focus();
  }

  /**
   * Sepuluh set contoh (tiket 261030141201): nama, grading, lama, dan satu
   * kalimat cerita. Memuat satu set mengganti order dan penerapan yang ada;
   * bila ada yang akan diganti, ditanyakan dulu di baris set itu.
   */
  function gambarContoh() {
    const adaIsi = keadaan.order.length || keadaan.penerapan.length;
    const butir = SET.map((x) => {
      const nOrder = x.order.length;
      const tanya = tanyaMuat === x.id
        ? '<span class="tanya" role="group" aria-label="Konfirmasi muat ' + esc(x.nama) + '">Ganti ' + keadaan.order.length + ' order dan ' + keadaan.penerapan.length +
            ' penerapan dengan set ini? Grading mitra jadi ' + esc(namaGrading(x.grading)) + '. ' +
            '<button type="button" class="tombol tombol-bahaya" data-aksi="muat-ya" data-set="' + esc(x.id) + '">Ya, ganti</button> ' +
            '<button type="button" class="tombol" data-aksi="muat-batal" data-set="' + esc(x.id) + '">Batal</button></span>'
        : '<button type="button" class="tombol tombol-kecil" data-aksi="muat" data-set="' + esc(x.id) + '" aria-label="Muat set ' + esc(x.nama) + '">Muat</button>';
      return '<li class="set-contoh" data-set-contoh="' + esc(x.id) + '">' +
        '<p class="set-judul"><b>' + esc(x.nama) + '</b> <span class="redup">· ' + esc(namaGrading(x.grading)) + ' · ' + x.pekan + ' pekan · ' + nOrder + ' order</span></p>' +
        '<p class="set-kalimat">' + esc(x.kalimat) + '</p>' +
        '<div class="set-aksi">' + tanya + '</div>' +
      '</li>';
    }).join('');
    return (
      '<p class="redup kecil">Cerita satu mitra dengan satu grading selama beberapa pekan. Order pekan ke-n sudah dihitung di penerapan ke-n; pekan terakhir belum diterapkan.' +
          (adaIsi ? ' Memuat satu set mengganti order dan penerapan yang ada.' : '') + '</p>' +
        '<ol class="daftar-set" aria-label="Sepuluh set contoh">' + butir + '</ol>' +
        (pesanMuat ? '<p class="status" role="status" data-pesan-muat>' + esc(pesanMuat) + '</p>' : '')
    );
  }

  /**
   * Warna baris order: penerapan ganjil abu-abu, genap sedikit lebih gelap,
   * berselang-seling per penerapan; yang belum dihitung putih bergaris biru.
   */
  function kelasOrder(o) {
    if (!o.ke) return 'belum';
    return 'sudah ' + (o.ke % 2 ? 'penerapan-ganjil' : 'penerapan-genap');
  }

  const SARINGAN = [
    { id: 'semua', nama: 'Semua', cocok: () => true },
    { id: 'belum', nama: 'Belum diterapkan', cocok: (o) => o.ke === 0,
      kosong: 'Tidak ada order yang belum diterapkan. Order yang dibuat di atas muncul di sini sampai "Terapkan perubahan tarif" ditekan.' },
    { id: 'sudah', nama: 'Sudah diterapkan', cocok: (o) => o.ke > 0,
      kosong: 'Belum ada order yang sudah diterapkan. Tekan "Terapkan perubahan tarif" untuk menghitung order yang belum diterapkan.' },
  ];

  function gambarOrder() {
    const belum = keadaan.order.filter((o) => o.ke === 0).length;
    const n = keadaan.penerapan.length;
    const saring = SARINGAN.find((x) => x.id === saringOrder);
    const tampil = keadaan.order.filter(saring.cocok);
    const baris = tampil.map((o) =>
      '<tr data-order="' + o.id + '" class="' + kelasOrder(o) + '">' +
        '<th scope="row">#' + o.id + ' ' + esc(o.modular) + '</th>' +
        '<td data-jenis="Hari" data-kolom="hari"' + (o.pekan ? '' : ' class="redup" title="Order lama tanpa hari"') + '>' + esc(teksHari(o)) + '</td>' +
        '<td data-jenis="Jenis">' + esc(namaJenis(o.jenis)) + '</td>' +
        '<td data-jenis="Grading">' + esc(namaGrading(o.grading)) + '</td>' +
        '<td data-jenis="Jam" data-kolom="jam">' + o.jam + '</td>' +
        '<td data-jenis="Nilai bintang" data-kolom="nilai" class="angka-rapat">' + esc(nilaiRingkas(o.bintang)) + '</td>' +
        '<td data-jenis="Status" data-kolom="status">' + (o.ke
          ? '<span class="tanda-sudah">dihitung · penerapan ke-' + o.ke + '</span>'
          : '<span class="redup">belum dihitung</span> <button type="button" class="tombol tombol-kecil" data-hapus="' + o.id + '" aria-label="Hapus order #' + o.id + '">Hapus</button>') +
        '</td>' +
      '</tr>').join('');
    const kosongkan = tanyaKosongkan
      ? '<span class="tanya" role="group" aria-label="Konfirmasi">Kosongkan ' + keadaan.order.length + ' order dan ' + n + ' penerapan, tarif mitra kembali ke tarif dasar? ' +
          '<button type="button" class="tombol tombol-bahaya" data-aksi="kosongkan-ya">Ya, kosongkan</button> ' +
          '<button type="button" class="tombol" data-aksi="kosongkan-batal">Batal</button></span>'
      : '<button type="button" class="tombol" data-aksi="kosongkan"' + (keadaan.order.length || n ? '' : ' disabled') + '>Kosongkan order dan tarif mitra</button>';
    const saringan = '<div class="saring-order" role="group" aria-label="Saring order">' +
      SARINGAN.map((x) => '<button type="button" class="tombol tombol-kecil" data-saring="' + x.id + '" aria-pressed="' + (x.id === saringOrder) + '">' +
        esc(x.nama) + ' <span class="redup">(' + keadaan.order.filter(x.cocok).length + ')</span></button>').join('') +
    '</div>';
    const isi = !keadaan.order.length
      ? '<p class="redup" data-order-kosong>Belum ada order. Muat set contoh atau isi ulasan order secara manual di atas.</p>'
      : saringan + (tampil.length
        ? '<div class="bungkus-tabel gulir" data-gulir="order" role="region" tabindex="0" aria-label="Tabel order, bisa digulir"><table class="tarif tabel-order"><thead><tr><th scope="col">Order · modular</th><th scope="col">Hari</th><th scope="col">Jenis</th><th scope="col">Grading</th><th scope="col">Jam</th><th scope="col">Nilai bintang</th><th scope="col">Status</th></tr></thead><tbody>' + baris + '</tbody></table></div>'
        : '<p class="redup" data-saring-kosong>' + esc(saring.kosong) + '</p>');
    return (
      '<section class="panel" aria-labelledby="judul-order">' +
        '<div class="judul-baris"><h2 id="judul-order"><button type="button" class="tombol-lipat" data-aksi="lipat-order" aria-expanded="' + !orderTerlipat + '" aria-controls="isi-order">' +
            '<span class="panah-lipat" aria-hidden="true">' + (orderTerlipat ? '▸' : '▾') + '</span> ' +
            '<span data-judul-order>Order (' + keadaan.order.length + ' · ' + belum + ' belum diterapkan)</span></button></h2>' +
          '<p class="status" data-status-order>' + keadaan.order.length + ' order · <b>' + belum + '</b> belum dihitung · ' + n + ' penerapan</p></div>' +
        '<div id="isi-order" data-isi-order' + (orderTerlipat ? ' hidden' : '') + '>' + isi + '</div>' +
        '<div class="bar bar-order">' +
          '<button type="button" class="tombol tombol-utama" data-aksi="terapkan">Terapkan perubahan tarif</button>' +
          '<span class="redup kecil">' + (belum ? 'Menghitung ' + belum + ' order yang belum dihitung sebagai penerapan ke-' + (n + 1) + '.' : 'Tidak ada order baru: penerapan berikutnya tidak mengubah rumus Mirza, tetapi jendela rumus usulan bergeser.') + '</span>' +
          '<div class="bar-aksi">' + kosongkan + '</div>' +
        '</div>' +
        (gagalSimpan ? '<p class="peringatan" role="alert">Peramban menolak menyimpan, jadi order dan penerapan hilang saat halaman dimuat ulang.</p>' : '') +
      '</section>'
    );
  }

  /** Satu sel tarif: angka dan selisihnya dari tarif dasar. */
  function selTarif(nilai, dasar, kolom, label) {
    const s = nilai - dasar;
    const kelas = Math.abs(s) < 0.005 ? '' : s > 0 ? ' naik' : ' turun';
    return '<td data-jenis="' + label + '" data-kolom="' + kolom + '" class="kolom-harga' + kelas + '"><b>' + rp(nilai) + '</b>' +
      (kolom === 'dasar' ? '' : '<span class="selisih">' + (kelas ? rpBertanda(s) : 'sama') + '</span>') + '</td>';
  }

  /** Satu baris ringkas penerapan: grading, order, jam, persen Mirza, M usulan. */
  function ringkasPenerapan(r) {
    const m = r.mirza;
    return 'Penerapan ke-' + r.ke + ' · ' + namaGrading(r.grading) + ' · ' + r.jumlahOrder + ' order' +
      (m.kosong ? '' : ', ' + m.jam + ' jam') + ' · Mirza ' + (m.kosong ? 'tetap' : persenBertanda(m.total)) +
      ' · usulan M ' + persenBertanda(r.usulan.M);
  }

  /** Daftar ringkas semua penerapan; yang sedang dilihat ditandai aria-current. */
  function gambarDaftarPenerapan(riwayat, ke) {
    if (!riwayat.length) return '<p class="redup" data-penerapan-kosong>Belum ada penerapan.</p>';
    return '<ol class="daftar-penerapan" data-daftar-penerapan aria-label="Semua penerapan">' +
      riwayat.map((r) => '<li><button type="button" class="pilih-penerapan" data-ke-tarif="' + r.ke + '"' +
        (r.ke === ke ? ' aria-current="true"' : '') + '>' + esc(ringkasPenerapan(r)) + '</button></li>').join('') +
    '</ol>';
  }

  /**
   * Satu kartu langkah hitung. Daftar langkahnya digulir di dalam kartu,
   * judulnya tetap di atas (tiket 261030162901).
   */
  function kartuLangkah(r, id, nama, langkah) {
    return '<article class="kartu-hasil tetap langkah-rumus" data-langkah="' + id + '"><h3>' + esc(nama) + '</h3>' +
      '<div class="gulir gulir-langkah" data-gulir="langkah-' + id + '-' + r.ke + '" role="region" tabindex="0" aria-label="Langkah ' + esc(nama) + ', bisa digulir">' +
        '<ol class="daftar-langkah">' + susunLangkah(langkah) + '</ol></div></article>';
  }

  /** Langkah hitung kedua rumus milik penerapan `r`, tertutup sampai dibuka. */
  function gambarLangkahPenerapan(r) {
    return '<details class="penerapan" data-penerapan="' + r.ke + '"' + (terbuka.has(r.ke) ? ' open' : '') + '>' +
      '<summary>Langkah hitung penerapan ke-' + r.ke + '</summary>' +
      '<p class="redup kecil">Kedua rumus, dari bintang sampai Rupiah, dengan angka sebelum pembulatan ("≈" berarti angkanya dibulatkan untuk ditampilkan).</p>' +
      '<div class="dua-cara">' +
        kartuLangkah(r, 'mirza', 'Rumus Mirza', langkahMirza(r)) +
        kartuLangkah(r, 'usulan', 'Rumus usulan', langkahUsulan(r)) +
      '</div>' +
    '</details>';
  }

  /**
   * Halaman penerapan yang dilihat: daftar ringkas (satu-satunya cara berpindah
   * penerapan; tombol ‹ › dibuang, keputusan Mirza di tiket 261030134401),
   * ringkasan, tarif, poin, dan langkah hitung. Tarif dan poin halaman lampau dihitung atas
   * riwayat sampai penerapan itu; langkahnya diambil dari riwayat seluruh order
   * (`hSemua`), sama dengan yang dulu tampil di bagian Riwayat penerapan.
   */
  function gambarTarif(hSemua) {
    const n = hSemua.riwayat.length;
    const ke = lihatKe === null ? n : lihatKe;
    const lampau = ke < n;
    const h = lampau ? hitungSemua(ke) : hSemua;
    const r = n ? hSemua.riwayat[ke - 1] : null;
    const keterangan = !n ? '' : lampau
      ? ' Angka sesudah penerapan ke-' + ke + ', sebelum penerapan ke-' + (ke + 1) + '; modular yang baru diorder sesudahnya belum tampil.'
      : ' Angka sesudah penerapan terakhir (ke-' + n + ').';
    // Ketiga jenis satu modular sewarna; modular berurutan berselang-seling,
    // dua warna yang sama dengan tabel Order (tiket 261030134401).
    const baris = h.modular.map((m, i) => JENIS.map((j) => {
      const x = h.tarif[m][j.id];
      return '<tr data-tarif-mitra="' + esc(m) + '|' + j.id + '" class="' + (i % 2 ? 'modular-genap' : 'modular-ganjil') + '"><th scope="row">' + esc(m) + ' <span class="redup">· ' + esc(j.nama) + '</span></th>' +
        selTarif(x.dasar, x.dasar, 'dasar', 'Tarif dasar') + selTarif(x.mirza, x.dasar, 'mirza', 'Rumus Mirza') + selTarif(x.usulan, x.dasar, 'usulan', 'Rumus usulan') + '</tr>';
    }).join('')).join('');
    const kontribusi = D.penilaian.map((p, i) => '<div><dt>' + esc(p.nama) + '</dt><dd data-poin-mirza="' + p.id + '">' + bertanda(t(h.mirza.kontribusi[i], 2), h.mirza.kontribusi[i]) + '</dd></div>').join('');
    const atribut = D.penilaian.map((p, i) => '<div><dt>' + esc(p.nama) + '</dt><dd data-poin-usulan="' + p.id + '">' + t(h.usulan.poinAtribut[i], 2) + '</dd></div>').join('');
    return (
      '<section class="panel" aria-labelledby="judul-tarif" data-tarif-ke="' + ke + '">' +
        '<h2 id="judul-tarif">Tarif milik mitra</h2>' +
        gambarDaftarPenerapan(hSemua.riwayat, ke) +
        (r ? '<p class="ringkas-penerapan" data-ringkas-tarif>' + esc(ringkasPenerapan(r)) + '</p>' : '') +
        '<p class="redup kecil" data-keterangan-tarif>Untuk setiap modular yang pernah diorder; ketiga jenis pekerjaan. Rupiah dibulatkan ke 2 angka desimal saat ditampilkan.' + keterangan +
          (h.usulan.M < 0 && !penyetel.usulan.pengurangIkutJam ? ' Pengurang rumus usulan berlaku penuh, jadi modular yang belum pernah diorder pun turun ' + persen(h.usulan.M) + '.' : '') + '</p>' +
        (h.modular.length
          ? '<div class="bungkus-tabel gulir" data-gulir="tarif" role="region" tabindex="0" aria-label="Tabel tarif milik mitra, bisa digulir"><table class="tarif tabel-tarif-mitra"><thead><tr><th scope="col">Modular · jenis</th><th scope="col" class="kolom-harga">Tarif dasar</th><th scope="col" class="kolom-harga">Rumus Mirza</th><th scope="col" class="kolom-harga">Rumus usulan</th></tr></thead><tbody>' + baris + '</tbody></table></div>'
          : '<p class="redup" data-tarif-kosong>Belum ada modular yang diorder.</p>') +
        '<div class="dua-cara poin-dua">' +
          '<article class="kartu-hasil tetap" data-poin="mirza"><h3>Poin · rumus Mirza</h3>' +
            '<p class="redup kecil">Poin mitra = 40 + rata-rata tiap penerapan, dibatasi 10–100. Di bawahnya sumbangan tiap atribut (jumlah rata-rata nilainya).</p>' +
            '<dl class="angka"><div class="bayar"><dt>Poin mitra</dt><dd data-poin-mitra>' + t(h.mirza.poin, 2) + '</dd></div>' + kontribusi + '</dl></article>' +
          '<article class="kartu-hasil tetap" data-poin="usulan"><h3>Poin · rumus usulan</h3>' +
            '<p class="redup kecil">Poin tiap atribut atas order di jendela waktu, ditimbang jam dan modal awal.</p>' +
            '<dl class="angka"><div class="bayar"><dt>P (rata-rata enam atribut)</dt><dd data-poin-p>' + t(h.usulan.P, 2) + '</dd></div>' + atribut +
              '<div><dt>M (pengali tarif)</dt><dd data-poin-m>' + bertanda(t(h.usulan.M, 4), h.usulan.M) + '%</dd></div></dl></article>' +
        '</div>' +
        (r ? gambarLangkahPenerapan(r) : '') +
      '</section>'
    );
  }

  /* -------------------------------------------------- langkah hitung ---- */

  function langkahMirza(r) {
    const m = r.mirza;
    const pm = penyetel.mirza;
    if (m.kosong) return ['Tidak ada order baru di penerapan ini: poin mitra (' + t(m.poinSebelum, 2) + ') dan tarif tetap.'];
    const L = [];
    L.push('Order yang dihitung: ' + m.order.length + '. Jumlah nilai bintang (bintang 1 → −2 … bintang 5 → +2) tiap order:');
    for (const o of m.order) L.push('  #' + o.id + ' ' + o.modular + ' · ' + namaJenis(o.jenis) + ' · ' + o.jam + ' jam: ' + deretNilai(o.nilai) + ' = ' + nilaiTeks(o.jumlah));
    const suku = m.order.length > 1
      ? '(' + m.order.map((o) => (o.jumlah < 0 ? '(' + nilaiTeks(o.jumlah) + ')' : o.jumlah)).join(' + ') + ')'
      : t(m.order[0].jumlah, 0);
    L.push('Rata-rata: ' + suku + ' ÷ ' + m.order.length + ' = ' + a(m.rataRata, 4));
    L.push('Poin mitra: ' + t(m.poinSebelum, 4) + ' + ' + (m.rataRata < 0 ? '(' + t(m.rataRata, 4) + ')' : t(m.rataRata, 4)) + ' = ' + a(m.poinMentah, 4) +
      (m.poinMentah !== m.poinSesudah ? ', dibatasi ke ' + t(m.poinSesudah, 2) : ''));
    const naik = m.arah === 'naik';
    L.push((naik ? 'Rata-rata ' + t(m.rataRata, 4) + ' ≥ 0 → penambah. Poin maksimal ' : 'Rata-rata ' + t(m.rataRata, 4) + ' < 0 → pengurang. Potongan maksimal ') +
      namaGrading(r.grading) + ' ' + m.batas + '% dibagi: bagian poin ' + pm.porsiPoin + '% → ' + a(m.bagianPoinMaks, 4) + '%, bagian jam ' + (100 - pm.porsiPoin) + '% → ' + a(m.bagianJamMaks, 4) + '%');
    L.push('Bagian poin: ' + t(m.rataRata, 4) + ' ÷ ' + m.penyebut + ' × ' + t(m.bagianPoinMaks, 4) + '% = ' + persenBertanda(m.bagianPoin));
    const jamTeks = m.order.map((o) => o.jam).join(' + ') + ' = ' + m.jam + ' jam';
    const sisi = (naik ? '' : MINUS) + t(m.bagianJamMaks, 4) + '%';
    if (m.aturanJam === 'penuh') L.push('Bagian jam: ' + jamTeks + '; ' + m.jam + ' ≥ ' + pm.jamPenuh + ' → penuh: ' + sisi);
    else if (m.aturanJam === 'proporsional') L.push('Bagian jam: ' + jamTeks + '; ' + pm.jamMin + ' ≤ ' + m.jam + ' < ' + pm.jamPenuh + ' → ' + m.jam + ' ÷ ' + pm.jamPenuh + ' × ' + sisi + ' = ' + persen(m.bagianJam));
    else L.push('Bagian jam: ' + jamTeks + '; kurang dari ' + pm.jamMin + ' jam → 0%');
    L.push('Total: ' + persen(m.bagianPoin) + ' + ' + (m.bagianJam < 0 ? '(' + persen(m.bagianJam) + ')' : persen(m.bagianJam)) + ' = ' + persen(m.total));
    L.push('Porsi tiap modular menurut frekuensi (terbanyak ' + m.frekuensiMaks + ' order): ' +
      m.frekuensi.map((f) => f.modular + ' ' + f.n + ' ÷ ' + m.frekuensiMaks + ' = ' + a(f.porsi * 100, 4) + '%').join('; '));
    L.push('Tarif mitra saat itu × total × porsi, tiap jenis pekerjaan (berlipat dari penerapan sebelumnya):');
    for (const p of m.perubahan) {
      L.push('  ' + p.modular + ' · ' + namaJenis(p.jenis) + ': ' + rpLangkah(p.sebelum) + ' × ' + persen(m.total) + ' × ' + a(p.porsi * 100, 4) + '% = ' + selisihRp(p.selisih) + ' → ' + rpLangkah(p.sesudah));
    }
    return L;
  }

  function langkahUsulan(r) {
    const u = r.usulan;
    const pu = penyetel.usulan;
    const L = [];
    L.push('Jendela: penerapan ke-' + u.dari + ' sampai ke-' + u.ke + ' (' + pu.jendela + ' penerapan terakhir): ' + u.order.length + ' order, ' + u.jamJendela + ' jam.');
    if (u.order.length) {
      L.push('Bintang → poin tujuan (1 → 10, 2 → 25, 3 → 40, 4 → 70, 5 → 100):');
      for (const o of u.order) L.push('  #' + o.id + ' ' + o.modular + ', ' + o.jam + ' jam: bintang ' + o.bintang.join(', ') + ' → ' + o.tujuan.join(', '));
    }
    L.push('Poin tiap atribut = (40 × modal ' + pu.modalJam + ' jam + Σ poin tujuan × jam) ÷ (modal ' + pu.modalJam + ' jam + Σ jam):');
    D.penilaian.forEach((p, i) => {
      const x = u.atribut[i];
      const suku = ['40 × ' + pu.modalJam].concat(u.order.map((o) => o.tujuan[i] + ' × ' + o.jam)).join(' + ');
      L.push('  ' + p.nama + ': (' + suku + ') ÷ (' + [pu.modalJam].concat(u.order.map((o) => o.jam)).join(' + ') + ') = ' + t(x.pembilang, 4) + ' ÷ ' + t(x.penyebut, 4) +
        (x.penyebut > 0 ? ' = ' + a(x.poin, 4) : ' → tanpa jam sama sekali: netral 40'));
    });
    L.push('P = (' + u.atribut.map((x) => a(x.poin, 4)).join(' + ') + ') ÷ 6 = ' + a(u.P, 4));
    if (u.arah === 'naik') L.push(t(u.P, 4) + ' ≥ 40 → penambah: M = (' + t(u.P, 4) + ' − 40) ÷ 60 × poin maksimal ' + namaGrading(r.grading) + ' ' + u.batas + '% = ' + persenBertanda(u.M));
    else L.push(t(u.P, 4) + ' < 40 → pengurang: M = −(40 − ' + t(u.P, 4) + ') ÷ 30 × potongan maksimal ' + namaGrading(r.grading) + ' ' + u.batas + '% = ' + persen(u.M));
    L.push('Jam terbang tiap modular (semua order yang sudah dihitung), ambang ' + pu.ambangJam + ' jam: ' +
      u.modular.map((m) => m.modular + ' ' + m.jam + ' jam → K = min(1, ' + m.jam + ' ÷ ' + pu.ambangJam + ') = ' + a(m.K, 4)).join('; '));
    const negPenuh = u.M < 0 && !pu.pengurangIkutJam;
    L.push('Tarif = tarif dasar × (1 + M × ' + (negPenuh ? '1, pengurang berlaku penuh' : 'K') + '), tiap jenis pekerjaan (tidak berlipat):');
    for (const m of u.modular) {
      for (const j of JENIS) {
        const x = m.tarif[j.id];
        L.push('  ' + m.modular + ' · ' + j.nama + ': ' + rpLangkah(x.dasar) + ' × (1 + ' + (u.M < 0 ? '(' + persen(u.M) + ')' : persen(u.M)) + ' × ' + a(m.faktor, 4) + ') = ' + rpLangkah(x.sesudah) + ' (' + selisihRp(x.selisih) + ')');
      }
    }
    if (negPenuh) L.push('Modular yang belum pernah diorder juga: tarif dasar × (1 + ' + '(' + persen(u.M) + ')).');
    return L;
  }

  /** Baris berawalan dua spasi menjadi rincian di bawah langkah sebelumnya. */
  function susunLangkah(L) {
    let html = '';
    let rincian = [];
    let induk = null;
    const tutup = () => {
      if (induk === null) return;
      html += '<li>' + esc(induk) + (rincian.length ? '<ul>' + rincian.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>' : '') + '</li>';
      rincian = [];
    };
    for (const l of L) {
      if (l.startsWith('  ')) rincian.push(l.slice(2));
      else { tutup(); induk = l; }
    }
    tutup();
    return html;
  }

  /** Penyetel yang berlaku, hanya dibaca; diubah di tab Penyetel rumus. */
  function gambarPenyetel() {
    const daftar = (rumus) => PENYETEL[rumus].map((p) => {
      const v = penyetel[rumus][p.id];
      const ubah = P.penyetelDiubah(rumus, p.id);
      const teks = p.ya ? (v ? 'ya' : 'tidak') : v + (p.satuan === '%' ? '%' : p.satuan ? ' ' + p.satuan : '');
      const bawaan = p.ya ? (R.BAWAAN[rumus][p.id] ? 'ya' : 'tidak') : R.BAWAAN[rumus][p.id];
      return '<div' + (ubah ? ' class="diubah"' : '') + '><dt>' + esc(p.nama) + '</dt><dd data-penyetel-nilai="' + rumus + '.' + p.id + '">' + esc(teks) +
        (ubah ? ' <span class="redup kecil">(bawaan ' + esc(bawaan) + ')</span>' : '') + '</dd></div>';
    }).join('');
    const n = ['mirza', 'usulan'].reduce((t, r) => t + PENYETEL[r].filter((p) => P.penyetelDiubah(r, p.id)).length, 0);
    return (
      '<section class="panel" aria-labelledby="judul-penyetel">' +
        '<div class="judul-baris"><h2 id="judul-penyetel">Penyetel rumus</h2>' +
          '<a class="tautan-tab" href="penyetel.html">ubah di tab Penyetel rumus</a></div>' +
        '<p class="redup kecil" data-status-penyetel>' + (n ? n + ' angka berbeda dari bawaan.' : 'Semua angka bawaan.') + ' Angkanya berlaku untuk seluruh riwayat: semua penerapan dihitung ulang dari order yang sama.</p>' +
        '<div class="dua-cara">' +
          '<div data-penyetel-rumus="mirza"><h3>Rumus Mirza</h3><dl class="angka daftar-penyetel">' + daftar('mirza') + '</dl></div>' +
          '<div data-penyetel-rumus="usulan"><h3>Rumus usulan</h3><dl class="angka daftar-penyetel">' + daftar('usulan') + '</dl></div>' +
        '</div>' +
      '</section>'
    );
  }

  function gambar() {
    penyetel = P.penyetel();
    const h = hitungSemua();
    akar.innerHTML =
      '<div data-bagian-mitra>' + gambarMitra() + '</div>' +
      gambarTab() +
      '<div data-bagian-order>' + gambarOrder() + '</div>' +
      '<div data-bagian-tarif>' + gambarTarif(h) + '</div>' +
      '<div data-bagian-penyetel>' + gambarPenyetel() + '</div>';
    tampakkanPenerapanDilihat();
  }

  /** Gambar ulang semua kecuali form ulasan, supaya pilihan yang sedang diisi tidak hilang. */
  function gambarHasil() {
    const h = hitungSemua();
    akar.querySelector('[data-bagian-mitra]').innerHTML = gambarMitra();
    akar.querySelector('[data-bagian-contoh]').innerHTML = gambarContoh();
    isiBagian('order', gambarOrder());
    isiBagian('tarif', gambarTarif(h));
    akar.querySelector('[data-bagian-penyetel]').innerHTML = gambarPenyetel();
    tampakkanPenerapanDilihat();
  }

  /**
   * Gambar ulang `[data-bagian-<nama>]` tanpa melempar bagian yang digulir di
   * tempat (`[data-gulir]`) kembali ke atas: posisi gulirnya dicatat lalu
   * dipasang lagi pada bagian bernama sama di gambar baru (tiket 261030162901).
   * `dariAtas` membuang catatan itu, untuk isi yang memang lain (saringan).
   */
  function isiBagian(nama, html, dariAtas) {
    const wadah = akar.querySelector('[data-bagian-' + nama + ']');
    const posisi = new Map();
    if (!dariAtas) for (const g of wadah.querySelectorAll('[data-gulir]')) posisi.set(g.dataset.gulir, [g.scrollTop, g.scrollLeft]);
    wadah.innerHTML = html;
    for (const g of wadah.querySelectorAll('[data-gulir]')) {
      const p = posisi.get(g.dataset.gulir);
      if (p) [g.scrollTop, g.scrollLeft] = p;
    }
  }

  /** Daftar ringkas bisa digulir sendiri: baris yang dilihat digulir ke dalam pandangan. */
  function tampakkanPenerapanDilihat() {
    const daftar = akar.querySelector('[data-daftar-penerapan]');
    const aktif = daftar && daftar.querySelector('[aria-current="true"]');
    if (!aktif) return;
    const li = aktif.parentElement;
    if (li.offsetTop < daftar.scrollTop) daftar.scrollTop = li.offsetTop;
    else if (li.offsetTop + li.offsetHeight > daftar.scrollTop + daftar.clientHeight) daftar.scrollTop = li.offsetTop + li.offsetHeight - daftar.clientHeight;
  }

  /** Gambar ulang bagian Order saja, lalu fokus ke `pemilih` bila diberikan. */
  function gambarOrderSaja(pemilih, dariAtas) {
    isiBagian('order', gambarOrder(), dariAtas);
    const f = pemilih && akar.querySelector(pemilih);
    if (f) f.focus({ preventScroll: true });
  }

  /* ---------------------------------------------------------- aksi ---- */

  function tambahOrder(modular, jenis, jam, bintang, pekan, hari) {
    keadaan.order.push({ id: keadaan.idBerikut++, modular, jenis, grading: P.gradingMitra(), jam, bintang: bintang.slice(), ke: 0, pekan, hari });
  }

  /**
   * Mengganti order dan penerapan dengan satu set contoh: grading mitra diatur
   * lewat `pengaturan.js` (pemiliknya tab Grading), lalu order pekan ke-n
   * dihitung di penerapan ke-n untuk semua pekan kecuali yang terakhir.
   */
  function muatSet(x) {
    P.aturGradingMitra(x.grading);
    keadaan = keadaanKosong();
    for (let n = 1; n < x.pekan; n++) keadaan.penerapan.push({ grading: x.grading });
    for (const o of x.order) {
      keadaan.order.push({ id: keadaan.idBerikut++, modular: o.modular, jenis: o.jenis, grading: x.grading, jam: o.jam,
        bintang: o.bintang.slice(), ke: o.pekan < x.pekan ? o.pekan : 0, pekan: o.pekan, hari: o.hari });
    }
    terbuka.clear();
    lihatKe = null;
    saringOrder = 'semua';
    form.pekan = pekanBerikut();
    form.hari = 1;
    const belum = keadaan.order.filter((o) => o.ke === 0).length;
    pesanMuat = 'Set "' + x.nama + '" dimuat: ' + keadaan.order.length + ' order, ' + keadaan.penerapan.length + ' penerapan; ' +
      belum + ' order pekan ' + x.pekan + ' belum diterapkan. Grading mitra: ' + namaGrading(x.grading) + '.';
  }

  function terapkan() {
    keadaan.penerapan.push({ grading: P.gradingMitra() });
    const ke = keadaan.penerapan.length;
    for (const o of keadaan.order) if (o.ke === 0) o.ke = ke;
    lihatKe = null; // tabel tarif kembali ke penerapan terakhir
  }

  akar.addEventListener('change', (e) => {
    const el = e.target;
    if (el.matches('select[data-form]')) {
      const k = el.dataset.form;
      form[k] = k === 'jam' || k === 'pekan' || k === 'hari' ? Number(el.value) : el.value;
    } else if (el.matches('input[type="radio"][name^="fb-"]')) {
      const i = Number(el.name.slice(3));
      form.bintang[i] = Number(el.value);
      const fs = el.closest('fieldset');
      fs.querySelectorAll('label').forEach((l, k) => l.classList.toggle('nyala', k < form.bintang[i]));
      fs.querySelector('[data-nilai]').textContent = 'bintang ' + form.bintang[i] + ' · nilai ' + nilaiTeks(D.nilaiBintang[form.bintang[i] - 1]);
    }
  });

  // Papan ketik di daftar tab: panah kiri/kanan berputar, Home/End ke ujung.
  akar.addEventListener('keydown', (e) => {
    const tab = e.target.closest && e.target.closest('[role="tab"][data-tab]');
    if (!tab) return;
    const i = TAB.findIndex((x) => x.id === tab.dataset.tab);
    const ke = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TAB.length - 1 }[e.key];
    if (ke === undefined) return;
    e.preventDefault();
    pilihTab(TAB[(ke + TAB.length) % TAB.length].id, true);
  });

  akar.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d.matches || !d.matches('details[data-penerapan]')) return;
    const ke = Number(d.dataset.penerapan);
    if (d.open) terbuka.add(ke); else terbuka.delete(ke);
  }, true);

  akar.addEventListener('click', (e) => {
    const hapus = e.target.closest('[data-hapus]');
    if (hapus) {
      const id = Number(hapus.dataset.hapus);
      const i = keadaan.order.findIndex((o) => o.id === id && o.ke === 0);
      if (i >= 0) { keadaan.order.splice(i, 1); pesanMuat = ''; simpan(); gambarHasil(); }
      return;
    }
    const tab = e.target.closest('[role="tab"][data-tab]');
    if (tab) {
      pilihTab(tab.dataset.tab, true);
      return;
    }
    const saring = e.target.closest('[data-saring]');
    if (saring) {
      if (SARINGAN.some((x) => x.id === saring.dataset.saring)) saringOrder = saring.dataset.saring;
      gambarOrderSaja('[data-saring="' + saringOrder + '"]', true);
      return;
    }
    const pilih = e.target.closest('[data-ke-tarif]');
    if (pilih) {
      pilihHalamanTarif(Number(pilih.dataset.keTarif));
      return;
    }
    const t = e.target.closest('[data-aksi]');
    if (!t || t.disabled) return;
    const aksi = t.dataset.aksi;
    if (aksi === 'lipat-order') {
      orderTerlipat = !orderTerlipat;
      simpanTampilan();
      gambarOrderSaja('[data-aksi="lipat-order"]');
      return;
    } else if (aksi === 'muat' || aksi === 'muat-ya') {
      const x = SET.find((s) => s.id === t.dataset.set);
      if (!x) return;
      if (aksi === 'muat' && (keadaan.order.length || keadaan.penerapan.length)) {
        tanyaMuat = x.id;
        tanyaKosongkan = false;
        gambarHasil();
        const ya = akar.querySelector('[data-aksi="muat-ya"]');
        if (ya) ya.focus();
        return;
      }
      tanyaMuat = null;
      tanyaKosongkan = false;
      muatSet(x);
      simpan();
      gambar(); // form ikut digambar ulang: pekan bawaannya pekan terakhir set
      const b = akar.querySelector('[data-aksi="muat"][data-set="' + x.id + '"]');
      if (b) b.focus();
      return;
    } else if (aksi === 'muat-batal') {
      tanyaMuat = null;
      gambarHasil();
      const b = akar.querySelector('[data-aksi="muat"][data-set="' + t.dataset.set + '"]');
      if (b) b.focus();
      return;
    } else if (aksi === 'buat') {
      tambahOrder(form.modular, form.jenis, form.jam, form.bintang, form.pekan, form.hari);
    } else if (aksi === 'terapkan') {
      terapkan();
    } else if (aksi === 'kosongkan') {
      tanyaKosongkan = true;
      tanyaMuat = null;
      gambarHasil();
      const ya = akar.querySelector('[data-aksi="kosongkan-ya"]');
      if (ya) ya.focus();
      return;
    } else if (aksi === 'kosongkan-batal') {
      tanyaKosongkan = false;
      gambarHasil();
      const k = akar.querySelector('[data-aksi="kosongkan"]');
      if (k) k.focus();
      return;
    } else if (aksi === 'kosongkan-ya') {
      keadaan.order = [];
      keadaan.penerapan = [];
      keadaan.idBerikut = 1;
      terbuka.clear();
      lihatKe = null;
    } else {
      return;
    }
    tanyaKosongkan = false;
    tanyaMuat = null;
    pesanMuat = '';
    simpan();
    gambarHasil();
  });

  /** Gambar ulang halaman penerapan ke-`ke` (1..n); false bila di luar jangkauan. */
  function tampilkanHalamanTarif(ke) {
    const n = keadaan.penerapan.length;
    if (!Number.isInteger(ke) || ke < 1 || ke > n) return false;
    lihatKe = ke === n ? null : ke;
    isiBagian('tarif', gambarTarif(hitungSemua()));
    tampakkanPenerapanDilihat();
    return true;
  }

  /** Klik di daftar ringkas: pindah ke penerapan itu; fokus ke baris yang sama di gambar baru. */
  function pilihHalamanTarif(ke) {
    if (!tampilkanHalamanTarif(ke)) return;
    const b = akar.querySelector('[data-ke-tarif="' + ke + '"]');
    if (b) b.focus({ preventScroll: true }); // barisnya sudah ditampakkan di daftar; halaman tidak ikut melompat
  }

  // Simpanan diubah di jendela lain (tab ini, tarif dasar, grading, grading mitra,
  // atau penyetel), atau kembali dari tembolok.
  function muatUlang() {
    H.muatUlang();
    B.muatUlang();
    P.muatUlang();
    keadaan = bacaSimpanan();
    ({ orderTerlipat, tab: tabDipilih } = bacaTampilan());
    tanyaKosongkan = false;
    tanyaMuat = null;
    pesanMuat = '';
    if (lihatKe !== null && lihatKe >= keadaan.penerapan.length) lihatKe = null;
    for (const ke of [...terbuka]) if (ke > keadaan.penerapan.length) terbuka.delete(ke);
    gambar();
  }
  const KUNCI_DIBACA = [KUNCI, H.KUNCI, B.KUNCI, P.KUNCI_MITRA, P.KUNCI_PENYETEL, null];
  window.addEventListener('storage', (e) => {
    if (KUNCI_DIBACA.includes(e.key)) muatUlang();
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) muatUlang(); });

  gambar();
})();

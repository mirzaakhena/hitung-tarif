/*
 * Harga efektif POC tarif: harga contoh dari `data.js`, ditimpa harga yang
 * diubah di tabel (tiket 261027100801, dipisah dari `app.js` di 261028095701
 * supaya simulasi membaca harga lewat aturan yang sama dengan tabel).
 *
 * Yang diubah disimpan di `localStorage` (kunci `KUNCI`), hanya yang berbeda
 * dari contoh. Simpanan dibaca dengan penjagaan yang sama dengan isian —
 * nama modular dikenal, bilangan bulat 1..MAKS — jadi isi yang rusak atau
 * disunting tangan diabaikan, bukan dipakai.
 *
 * Dipakai oleh `app.js` (tabel) dan `simulasi.js`. Skrip biasa, bukan modul.
 */
window.POC_HARGA = (function () {
  'use strict';

  const D = window.POC_TARIF;
  const KUNCI = 'nukitu-poc-tarif:harga';
  const MAKS = 999999999;
  const JENIS = D.jenis;

  /** Harga contoh per modular: { nama: { instalasi, perbaikan, perawatan } }. */
  const contoh = {};
  for (const k of D.kategori) {
    for (const [nama, ...harga] of k.modular) {
      contoh[nama] = {};
      JENIS.forEach((j, i) => { contoh[nama][j.id] = harga[i]; });
    }
  }

  const penyimpanan = (function () {
    try {
      const s = window.localStorage;
      const coba = KUNCI + ':coba';
      s.setItem(coba, '1');
      s.removeItem(coba);
      return s;
    } catch (e) {
      return null;
    }
  })();

  function hargaSah(n) {
    return Number.isSafeInteger(n) && n > 0 && n <= MAKS;
  }

  /** Harga yang diubah, dari simpanan. Butir yang tidak dikenal atau tidak sah dibuang. */
  function bacaSimpanan() {
    const hasil = {};
    if (!penyimpanan) return hasil;
    let mentah;
    try {
      mentah = JSON.parse(penyimpanan.getItem(KUNCI) || '{}');
    } catch (e) {
      return hasil;
    }
    if (!mentah || typeof mentah !== 'object') return hasil;
    for (const nama of Object.keys(mentah)) {
      if (!contoh[nama] || !mentah[nama] || typeof mentah[nama] !== 'object') continue;
      for (const j of JENIS) {
        const n = mentah[nama][j.id];
        if (hargaSah(n) && n !== contoh[nama][j.id]) {
          (hasil[nama] = hasil[nama] || {})[j.id] = n;
        }
      }
    }
    return hasil;
  }

  let diubah = bacaSimpanan();
  let gagalSimpan = !penyimpanan;

  /** Menulis `diubah` ke simpanan. `false` bila peramban menolaknya. */
  function simpan() {
    if (!penyimpanan) return false;
    try {
      if (Object.keys(diubah).length) penyimpanan.setItem(KUNCI, JSON.stringify(diubah));
      else penyimpanan.removeItem(KUNCI);
      return true;
    } catch (e) {
      return false;
    }
  }

  function harga(nama, jenis) {
    const u = diubah[nama];
    return u && u[jenis] !== undefined ? u[jenis] : contoh[nama][jenis];
  }

  function aturHarga(nama, jenis, n) {
    if (n === contoh[nama][jenis]) {
      if (diubah[nama]) {
        delete diubah[nama][jenis];
        if (!Object.keys(diubah[nama]).length) delete diubah[nama];
      }
    } else {
      (diubah[nama] = diubah[nama] || {})[jenis] = n;
    }
    gagalSimpan = !simpan();
  }

  function kembalikanSemua() {
    diubah = {};
    gagalSimpan = !simpan();
  }

  function jumlahDiubah() {
    return Object.values(diubah).reduce((t, u) => t + Object.keys(u).length, 0);
  }

  /** Rupiah tanpa "Rp": 120000 → "120.000". */
  function rupiah(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  return {
    KUNCI,
    MAKS,
    JENIS,
    contoh,
    harga,
    aturHarga,
    kembalikanSemua,
    jumlahDiubah,
    rupiah,
    /** Membaca ulang simpanan, misalnya sesudah tabel di tab lain mengubah harga. */
    muatUlang() { diubah = bacaSimpanan(); },
    diubah(nama, jenis) { return harga(nama, jenis) !== contoh[nama][jenis]; },
    gagalSimpan() { return gagalSimpan; },
    adaPenyimpanan() { return !!penyimpanan; },
  };
})();

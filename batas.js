/*
 * Poin maksimal dan potongan maksimal efektif per grading (tiket 261028104601;
 * "senioritas" jadi "grading" dan "bonus" jadi "poin" di tiket 261030105301):
 * angka Mirza dari `data.js` (`grading`), ditimpa angka yang diubah di tab
 * Grading. Pola dan alasannya sama dengan `harga.js`: tab yang mengubah dan
 * halaman yang memakai membaca lewat aturan yang sama.
 *
 * Yang diubah disimpan di `localStorage` (kunci `KUNCI`), hanya yang berbeda
 * dari angka Mirza: { rookie: { poinMaks: 8 }, ... }. Simpanan dibaca dengan
 * penjagaan yang sama dengan isian — grading dikenal, bilangan bulat 0..MAKS —
 * jadi isi yang rusak atau disunting tangan diabaikan, bukan dipakai.
 * Nama dan urutan grading tidak bisa diubah di halaman.
 *
 * Simpanan dari sebelum 261030105301 (kunci dan id grading sama, tapi jenisnya
 * `bonusMaks`) tetap dibaca sebagai `poinMaks`; tulisan berikutnya memakai nama
 * baru. Angka tersimpan mengikuti NAMA grading (id-nya tidak berubah), bukan
 * posisinya: Senior yang dulu diubah jadi 12 tetap 12 walau angka asal Senior
 * kini 15. Angka yang dulu tidak diubah memang tidak tersimpan, jadi ikut angka
 * Mirza yang baru. Angka tersimpan yang kebetulan sama dengan angka Mirza yang
 * baru tidak lagi dihitung "diubah" (nilainya sama).
 *
 * Dipakai oleh `grading.js` (tab) dan `simulasi.js`. Skrip biasa, bukan modul.
 */
window.POC_BATAS = (function () {
  'use strict';

  const D = window.POC_TARIF;
  const KUNCI = 'nukitu-poc-tarif:batas';
  // Potongan di atas 100% membuat pembayaran negatif (keputusan Mirza 28 Okt 2026).
  const MAKS = 100;
  const JENIS = [
    { id: 'poinMaks', nama: 'Poin maksimal', keterangan: 'semua bintang 5' },
    { id: 'potonganMaks', nama: 'Potongan maksimal', keterangan: 'semua bintang 1' },
  ];

  // Nama jenis di simpanan lama → nama sekarang (tiket 261030105301).
  const NAMA_LAMA = { poinMaks: 'bonusMaks' };

  /** Angka Mirza per grading: { rookie: { poinMaks, potonganMaks }, ... }. */
  const asal = {};
  for (const s of D.grading) {
    asal[s.id] = {};
    for (const j of JENIS) asal[s.id][j.id] = s[j.id];
  }

  // Diperiksa sekali di `penyimpanan.js` (tiket 261030105302).
  const penyimpanan = window.POC_PENYIMPANAN || null;

  function batasSah(n) {
    return Number.isInteger(n) && n >= 0 && n <= MAKS;
  }

  /** Angka yang diubah, dari simpanan. Butir yang tidak dikenal atau tidak sah dibuang. */
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
    for (const id of Object.keys(mentah)) {
      if (!Object.prototype.hasOwnProperty.call(asal, id) || !mentah[id] || typeof mentah[id] !== 'object') continue;
      for (const j of JENIS) {
        const lama = NAMA_LAMA[j.id];
        const n = mentah[id][j.id] !== undefined || !lama ? mentah[id][j.id] : mentah[id][lama];
        if (batasSah(n) && n !== asal[id][j.id]) {
          (hasil[id] = hasil[id] || {})[j.id] = n;
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

  /** Angka yang berlaku untuk satu grading dan satu jenis batas. */
  function batas(id, jenis) {
    const u = diubah[id];
    return u && u[jenis] !== undefined ? u[jenis] : asal[id][jenis];
  }

  /** Grading dari `data.js` dengan batas yang berlaku: { id, nama, poinMaks, potonganMaks }. */
  function grading(id) {
    const s = D.grading.find((x) => x.id === id);
    return s && { id: s.id, nama: s.nama, poinMaks: batas(id, 'poinMaks'), potonganMaks: batas(id, 'potonganMaks') };
  }

  function aturBatas(id, jenis, n) {
    if (!batasSah(n)) return;
    if (n === asal[id][jenis]) {
      if (diubah[id]) {
        delete diubah[id][jenis];
        if (!Object.keys(diubah[id]).length) delete diubah[id];
      }
    } else {
      (diubah[id] = diubah[id] || {})[jenis] = n;
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

  return {
    KUNCI,
    MAKS,
    JENIS,
    asal,
    batas,
    grading,
    aturBatas,
    kembalikanSemua,
    jumlahDiubah,
    /** Membaca ulang simpanan, misalnya sesudah tab Grading mengubah angka di jendela lain. */
    muatUlang() { diubah = bacaSimpanan(); },
    diubah(id, jenis) { return batas(id, jenis) !== asal[id][jenis]; },
    gagalSimpan() { return gagalSimpan; },
    adaPenyimpanan() { return !!penyimpanan; },
  };
})();

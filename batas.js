/*
 * Batas bonus dan potongan efektif per senioritas (tiket 261028104601):
 * angka Mirza dari `data.js` (`senioritas`), ditimpa angka yang diubah di tab
 * Batas senioritas. Pola dan alasannya sama dengan `harga.js`: tab yang
 * mengubah dan simulasi yang memakai membaca lewat aturan yang sama.
 *
 * Yang diubah disimpan di `localStorage` (kunci `KUNCI`), hanya yang berbeda
 * dari angka Mirza: { rookie: { bonusMaks: 8 }, ... }. Simpanan dibaca dengan
 * penjagaan yang sama dengan isian — senioritas dikenal, bilangan bulat
 * 0..MAKS — jadi isi yang rusak atau disunting tangan diabaikan, bukan dipakai.
 * Nama dan urutan senioritas tidak bisa diubah (keputusan Mirza, 261028095701).
 *
 * Dipakai oleh `senioritas.js` (tab) dan `simulasi.js`. Skrip biasa, bukan modul.
 */
window.POC_BATAS = (function () {
  'use strict';

  const D = window.POC_TARIF;
  const KUNCI = 'nukitu-poc-tarif:batas';
  // Potongan di atas 100% membuat pembayaran negatif (keputusan Mirza 28 Okt 2026).
  const MAKS = 100;
  const JENIS = [
    { id: 'bonusMaks', nama: 'Bonus maksimal', keterangan: 'semua bintang 5' },
    { id: 'potonganMaks', nama: 'Potongan maksimal', keterangan: 'semua bintang 1' },
  ];

  /** Angka Mirza per senioritas: { rookie: { bonusMaks, potonganMaks }, ... }. */
  const asal = {};
  for (const s of D.senioritas) {
    asal[s.id] = {};
    for (const j of JENIS) asal[s.id][j.id] = s[j.id];
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
        const n = mentah[id][j.id];
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

  /** Angka yang berlaku untuk satu senioritas dan satu jenis batas. */
  function batas(id, jenis) {
    const u = diubah[id];
    return u && u[jenis] !== undefined ? u[jenis] : asal[id][jenis];
  }

  /** Senioritas dari `data.js` dengan batas yang berlaku: { id, nama, bonusMaks, potonganMaks }. */
  function senioritas(id) {
    const s = D.senioritas.find((x) => x.id === id);
    return s && { id: s.id, nama: s.nama, bonusMaks: batas(id, 'bonusMaks'), potonganMaks: batas(id, 'potonganMaks') };
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
    senioritas,
    aturBatas,
    kembalikanSemua,
    jumlahDiubah,
    /** Membaca ulang simpanan, misalnya sesudah tab Batas senioritas mengubah angka di tab lain. */
    muatUlang() { diubah = bacaSimpanan(); },
    diubah(id, jenis) { return batas(id, jenis) !== asal[id][jenis]; },
    gagalSimpan() { return gagalSimpan; },
    adaPenyimpanan() { return !!penyimpanan; },
  };
})();

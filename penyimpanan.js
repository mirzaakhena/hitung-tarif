/*
 * Penyimpanan peramban untuk POC tarif (tiket 261030105302; dulu disalin di
 * `harga.js` dan `batas.js`). `window.POC_PENYIMPANAN` adalah `localStorage`
 * bila peramban mengizinkan menulis ke sana, atau `null` bila menolak (mode
 * privat tertentu, file:// di sebagian peramban, kuota penuh). Pemakai yang
 * mendapat `null` tetap jalan dan mengatakan perubahan hilang saat dimuat ulang.
 *
 * Dimuat sebelum `harga.js`, `batas.js`, dan `formula.js`. Skrip biasa, bukan modul.
 */
window.POC_PENYIMPANAN = (function () {
  'use strict';
  try {
    const s = window.localStorage;
    const coba = 'nukitu-poc-tarif:coba';
    s.setItem(coba, '1');
    s.removeItem(coba);
    return s;
  } catch (e) {
    return null;
  }
})();

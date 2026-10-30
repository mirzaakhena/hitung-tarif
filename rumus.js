/*
 * Dua rumus tarif milik mitra, dihitung atas order yang sama (tiket
 * 261030105302). Hanya hitungan: tidak menyentuh halaman atau penyimpanan,
 * supaya keduanya bisa diperiksa terpisah dari tampilannya.
 *
 * Bahan: order (modular, jenis, jam, enam bintang 1..5, `ke` = penerapan yang
 * menghitungnya, 0 bila belum), daftar penerapan (grading mitra saat itu),
 * penyetel, tarif dasar yang berlaku, dan batas grading yang berlaku. Seluruh
 * riwayat dihitung ulang dari bahan itu tiap kali dipanggil, jadi penyetel,
 * tarif dasar, dan batas grading yang diubah berlaku untuk semua penerapan.
 *
 * Rumus Mirza (30 Okt 2026, tafsirannya di Notes tiket): tiap penerapan,
 * rata-rata jumlah nilai bintang (−2..+2) per order atas order baru. ≥ 0
 * penambah, < 0 pengurang. Batas grading dibagi ke bagian poin dan bagian jam
 * (bawaan 50:50). Bagian poin = rata-rata ÷ 60 (pengurang ÷ 30) × bagiannya;
 * bagian jam = penuh bila jam ≥ 10, proporsional bila 2 ≤ jam < 10, nol di
 * bawahnya. Persennya dikali porsi frekuensi modular (terbanyak = 100%) dan
 * dikalikan ke tarif mitra saat itu, tiap jenis pekerjaan — jadi berlipat.
 * Poin mitra = 40 + rata-rata, dibatasi 10..100, hanya dicatat.
 *
 * Rumus usulan: bintang → poin tujuan (10, 25, 40, 70, 100). Poin tiap
 * atribut = (40 × modal jam + Σ tujuan × jam) ÷ (modal jam + Σ jam) atas order
 * di jendela penerapan terakhir. P = rata-rata enam atribut. M dari P dan batas
 * grading; K = min(1, jam terbang modular ÷ ambang), jam terbang dari semua
 * order yang sudah dihitung. Tarif = tarif dasar × (1 + M × K); bila M negatif,
 * × (1 + M) kecuali penyetel meminta ikut K. Tidak berlipat: selalu dari tarif
 * dasar yang berlaku.
 *
 * Bilangan disimpan apa adanya (tanpa pembulatan); pembulatan hanya saat
 * ditampilkan (`formula.js`). Persen dalam satuan persen (2,5 = 2,5%).
 */
window.POC_RUMUS = (function () {
  'use strict';

  const D = window.POC_TARIF;
  const NETRAL = 40;
  const POIN_MIN = 10;
  const POIN_MAKS = 100;
  const POIN_TUJUAN = [10, 25, 40, 70, 100]; // indeks 0 = bintang 1

  const BAWAAN = {
    mirza: { porsiPoin: 50, penyebutNaik: 60, penyebutTurun: 30, jamPenuh: 10, jamMin: 2 },
    usulan: { modalJam: 40, jendela: 13, ambangJam: 10, pengurangIkutJam: false },
  };

  const JENIS = D.jenis.map((j) => j.id);
  const nilaiDari = (bintang) => bintang.map((b) => D.nilaiBintang[b - 1]);
  const jumlah = (xs) => xs.reduce((t, x) => t + x, 0);

  /** Modular berurutan menurut kemunculan pertamanya di `order`. */
  function urutanModular(order) {
    const hasil = [];
    for (const o of order) if (!hasil.includes(o.modular)) hasil.push(o.modular);
    return hasil;
  }

  /* --------------------------------------------------------- Mirza ---- */

  function penerapanMirza(batch, poinSebelum, tarifSaatIni, g, p, tarifDasar) {
    const hasil = { kosong: batch.length === 0, poinSebelum, poinSesudah: poinSebelum };
    if (hasil.kosong) return hasil;

    hasil.order = batch.map((o) => {
      const nilai = nilaiDari(o.bintang);
      return { id: o.id, modular: o.modular, jenis: o.jenis, jam: o.jam, nilai, jumlah: jumlah(nilai) };
    });
    hasil.rataRata = jumlah(hasil.order.map((o) => o.jumlah)) / batch.length;
    hasil.rataAtribut = D.penilaian.map((_, i) => jumlah(hasil.order.map((o) => o.nilai[i])) / batch.length);
    hasil.poinMentah = poinSebelum + hasil.rataRata;
    hasil.poinSesudah = Math.min(POIN_MAKS, Math.max(POIN_MIN, hasil.poinMentah));

    const naik = hasil.rataRata >= 0;
    hasil.arah = naik ? 'naik' : 'turun';
    hasil.batas = naik ? g.poinMaks : g.potonganMaks;
    hasil.bagianPoinMaks = hasil.batas * p.porsiPoin / 100;
    hasil.bagianJamMaks = hasil.batas * (100 - p.porsiPoin) / 100;
    hasil.penyebut = naik ? p.penyebutNaik : p.penyebutTurun;
    // rata-rata negatif → bagian poin negatif dengan sendirinya
    hasil.bagianPoin = hasil.rataRata / hasil.penyebut * hasil.bagianPoinMaks;

    hasil.jam = jumlah(batch.map((o) => o.jam));
    if (hasil.jam >= p.jamPenuh) { hasil.aturanJam = 'penuh'; hasil.faktorJam = 1; }
    else if (hasil.jam >= p.jamMin) { hasil.aturanJam = 'proporsional'; hasil.faktorJam = hasil.jam / p.jamPenuh; }
    else { hasil.aturanJam = 'kurang'; hasil.faktorJam = 0; }
    hasil.bagianJam = (naik ? 1 : -1) * hasil.bagianJamMaks * hasil.faktorJam;
    hasil.total = hasil.bagianPoin + hasil.bagianJam;

    const frek = {};
    for (const o of batch) frek[o.modular] = (frek[o.modular] || 0) + 1;
    hasil.frekuensiMaks = Math.max(...Object.values(frek));
    hasil.frekuensi = urutanModular(batch).map((m) => ({ modular: m, n: frek[m], porsi: frek[m] / hasil.frekuensiMaks }));

    hasil.perubahan = [];
    for (const f of hasil.frekuensi) {
      const persen = hasil.total * f.porsi;
      for (const j of JENIS) {
        const t = tarifSaatIni[f.modular] = tarifSaatIni[f.modular] || {};
        const sebelum = t[j] !== undefined ? t[j] : tarifDasar(f.modular, j);
        const selisih = sebelum * persen / 100;
        t[j] = sebelum + selisih;
        hasil.perubahan.push({ modular: f.modular, jenis: j, sebelum, porsi: f.porsi, persen, selisih, sesudah: t[j] });
      }
    }
    return hasil;
  }

  /* -------------------------------------------------------- usulan ---- */

  /** Tarif satu modular dan jenis menurut M dan K: dasar × (1 + M × faktor). */
  function faktorUsulan(M, K, p) {
    return M >= 0 || p.pengurangIkutJam ? K : 1;
  }

  function penerapanUsulan(ke, order, g, p, tarifDasar) {
    const dari = Math.max(1, ke - p.jendela + 1);
    const jendela = order.filter((o) => o.ke >= dari && o.ke <= ke);
    const hasil = { dari, ke };
    hasil.order = jendela.map((o) => ({ id: o.id, modular: o.modular, jam: o.jam, bintang: o.bintang, tujuan: o.bintang.map((b) => POIN_TUJUAN[b - 1]) }));
    hasil.jamJendela = jumlah(jendela.map((o) => o.jam));
    hasil.atribut = D.penilaian.map((_, i) => {
      const pembilang = NETRAL * p.modalJam + jumlah(hasil.order.map((o) => o.tujuan[i] * o.jam));
      const penyebut = p.modalJam + hasil.jamJendela;
      return { pembilang, penyebut, poin: penyebut > 0 ? pembilang / penyebut : NETRAL };
    });
    hasil.P = jumlah(hasil.atribut.map((a) => a.poin)) / hasil.atribut.length;
    const naik = hasil.P >= NETRAL;
    hasil.arah = naik ? 'naik' : 'turun';
    hasil.batas = naik ? g.poinMaks : g.potonganMaks;
    hasil.M = naik
      ? (hasil.P - NETRAL) / (POIN_MAKS - NETRAL) * g.poinMaks
      : -(NETRAL - hasil.P) / (NETRAL - POIN_MIN) * g.potonganMaks;

    const sudah = order.filter((o) => o.ke >= 1 && o.ke <= ke);
    hasil.jamTerbang = {};
    for (const o of sudah) hasil.jamTerbang[o.modular] = (hasil.jamTerbang[o.modular] || 0) + o.jam;
    hasil.modular = urutanModular(sudah).map((m) => {
      const jam = hasil.jamTerbang[m];
      const K = Math.min(1, jam / p.ambangJam);
      const faktor = faktorUsulan(hasil.M, K, p);
      const tarif = {};
      for (const j of JENIS) {
        const dasar = tarifDasar(m, j);
        const selisih = dasar * hasil.M / 100 * faktor;
        tarif[j] = { dasar, selisih, sesudah: dasar + selisih };
      }
      return { modular: m, jam, K, faktor, tarif };
    });
    return hasil;
  }

  /* --------------------------------------------------------- semua ---- */

  /**
   * Seluruh riwayat dan keadaan akhir.
   * bahan: { order, penerapan: [{ grading }], penyetel: { mirza, usulan },
   *          tarifDasar(modular, jenis), batas(gradingId) → { poinMaks, potonganMaks } }
   */
  function hitung(bahan) {
    const pm = bahan.penyetel.mirza;
    const pu = bahan.penyetel.usulan;
    const tarifMirza = {};
    let poin = NETRAL;
    const kontribusi = D.penilaian.map(() => 0);
    const riwayat = [];

    bahan.penerapan.forEach((pen, i) => {
      const ke = i + 1;
      const g = bahan.batas(pen.grading);
      const batch = bahan.order.filter((o) => o.ke === ke);
      const mirza = penerapanMirza(batch, poin, tarifMirza, g, pm, bahan.tarifDasar);
      poin = mirza.poinSesudah;
      if (!mirza.kosong) mirza.rataAtribut.forEach((v, k) => { kontribusi[k] += v; });
      const usulan = penerapanUsulan(ke, bahan.order, g, pu, bahan.tarifDasar);
      riwayat.push({ ke, grading: pen.grading, batas: g, jumlahOrder: batch.length, mirza, usulan });
    });

    const akhirU = riwayat.length ? riwayat[riwayat.length - 1].usulan : null;
    const modular = urutanModular(bahan.order);
    const tarif = {};
    for (const m of modular) {
      tarif[m] = {};
      for (const j of JENIS) {
        const dasar = bahan.tarifDasar(m, j);
        const mirza = tarifMirza[m] && tarifMirza[m][j] !== undefined ? tarifMirza[m][j] : dasar;
        let usulan = dasar;
        if (akhirU) {
          const K = Math.min(1, (akhirU.jamTerbang[m] || 0) / pu.ambangJam);
          usulan = dasar * (1 + akhirU.M / 100 * faktorUsulan(akhirU.M, K, pu));
        }
        tarif[m][j] = { dasar, mirza, usulan };
      }
    }

    return {
      riwayat,
      modular,
      tarif,
      mirza: { poin, kontribusi },
      usulan: akhirU
        ? { poinAtribut: akhirU.atribut.map((a) => a.poin), P: akhirU.P, M: akhirU.M }
        : { poinAtribut: D.penilaian.map(() => NETRAL), P: NETRAL, M: 0 },
    };
  }

  return { NETRAL, POIN_MIN, POIN_MAKS, POIN_TUJUAN, BAWAAN, nilaiDari, hitung };
})();

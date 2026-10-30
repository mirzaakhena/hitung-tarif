/*
 * Pengaturan mitra rekaan untuk tab Formula tarif mitra (tiket 261030124701):
 * grading mitra (diubah di tab Grading) dan penyetel kedua rumus (diubah di tab
 * Penyetel rumus). Tab Formula tarif mitra hanya membacanya. Pola dan alasannya
 * sama dengan `harga.js` dan `batas.js`: tab yang mengubah dan halaman yang
 * memakai membaca lewat aturan yang sama.
 *
 * Disimpan di `localStorage`, dua kunci: `KUNCI_MITRA` ({ grading }) dan
 * `KUNCI_PENYETEL` ({ mirza: {...}, usulan: {...} }, selalu lengkap). Simpanan
 * dibaca dengan penjagaan yang sama dengan isian, jadi isi yang rusak atau
 * disunting tangan diabaikan, bukan dipakai.
 *
 * Simpanan lama: sampai tiket 261030105302 keduanya tinggal di kunci halaman
 * formula (`nukitu-poc-tarif:formula`, bidang `grading` dan `penyetel`). Bila
 * kunci baru belum ada, isi lama dibaca sekali dan langsung ditulis ke kunci
 * baru; sesudah itu hanya kunci baru yang dibaca. `formula.js` tidak lagi
 * menulis kedua bidang itu, jadi isi lama hilang pada simpanan formula berikutnya.
 *
 * Dimuat sesudah `data.js`, `penyimpanan.js`, dan `rumus.js` (angka bawaan
 * penyetel). Skrip biasa, bukan modul.
 */
window.POC_PENGATURAN = (function () {
  'use strict';

  const D = window.POC_TARIF;
  const R = window.POC_RUMUS;
  const penyimpanan = window.POC_PENYIMPANAN || null;
  const KUNCI_MITRA = 'nukitu-poc-tarif:mitra';
  const KUNCI_PENYETEL = 'nukitu-poc-tarif:penyetel';
  const KUNCI_LAMA = 'nukitu-poc-tarif:formula';

  /** Tiap penyetel: rentang bilangan bulat yang diterima, atau ya/tidak. */
  const PENYETEL = {
    mirza: [
      { id: 'porsiPoin', nama: 'Bagian poin dari batas grading', satuan: '%', min: 0, maks: 100, ket: 'sisanya bagian jam' },
      { id: 'penyebutNaik', nama: 'Penyebut rata-rata, penambah', satuan: '', min: 1, maks: 1000, ket: 'jarak poin 40 ke 100' },
      { id: 'penyebutTurun', nama: 'Penyebut rata-rata, pengurang', satuan: '', min: 1, maks: 1000, ket: 'jarak poin 40 ke 10' },
      { id: 'jamPenuh', nama: 'Jam untuk bagian jam penuh', satuan: 'jam', min: 1, maks: 1000, ket: 'di bawahnya proporsional' },
      { id: 'jamMin', nama: 'Jam paling sedikit agar bagian jam dihitung', satuan: 'jam', min: 0, maks: 1000, ket: 'tidak boleh melebihi jam penuh' },
    ],
    usulan: [
      { id: 'modalJam', nama: 'Modal awal', satuan: 'jam', min: 0, maks: 10000, ket: 'jam bernilai netral 40 di tiap atribut' },
      { id: 'jendela', nama: 'Jendela waktu', satuan: 'penerapan', min: 1, maks: 1000, ket: '13 ≈ 90 hari bila seminggu sekali' },
      { id: 'ambangJam', nama: 'Ambang jam terbang per modular', satuan: 'jam', min: 1, maks: 1000, ket: 'jam terbang penuh (K = 1)' },
      { id: 'pengurangIkutJam', nama: 'Pengurang ikut jam terbang', ya: true, ket: 'bila tidak dicentang, pengurang berlaku penuh di semua modular' },
    ],
  };
  const RUMUS = ['mirza', 'usulan'];

  const gradingSah = (id) => D.grading.some((g) => g.id === id);
  const bulatDalam = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;
  const ribuan = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const cari = (rumus, id) => (PENYETEL[rumus] || []).find((p) => p.id === id);

  function salinBawaan() {
    return { mirza: Object.assign({}, R.BAWAAN.mirza), usulan: Object.assign({}, R.BAWAAN.usulan) };
  }

  function baca(kunci) {
    if (!penyimpanan) return { ada: false };
    const teks = penyimpanan.getItem(kunci);
    if (teks === null) return { ada: false };
    try {
      return { ada: true, isi: JSON.parse(teks) };
    } catch (e) {
      return { ada: true, isi: null };
    }
  }

  function tulis(kunci, isi) {
    if (!penyimpanan) return false;
    try {
      penyimpanan.setItem(kunci, JSON.stringify(isi));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Penyetel dari objek simpanan; butir tak sah kembali ke bawaan. */
  function penyetelDari(ps) {
    const k = salinBawaan();
    ps = ps && typeof ps === 'object' ? ps : {};
    for (const rumus of RUMUS) {
      const sumber = ps[rumus] && typeof ps[rumus] === 'object' ? ps[rumus] : {};
      for (const p of PENYETEL[rumus]) {
        const v = sumber[p.id];
        if (p.ya ? typeof v === 'boolean' : bulatDalam(v, p.min, p.maks)) k[rumus][p.id] = v;
      }
    }
    if (k.mirza.jamMin > k.mirza.jamPenuh) {
      k.mirza.jamMin = R.BAWAAN.mirza.jamMin;
      k.mirza.jamPenuh = R.BAWAAN.mirza.jamPenuh;
    }
    return k;
  }

  let grading = D.grading[0].id;
  let penyetel = salinBawaan();
  let gagalSimpan = !penyimpanan;

  /** Membaca kedua kunci; kunci yang belum ada diisi sekali dari simpanan lama. */
  function muat() {
    grading = D.grading[0].id;
    penyetel = salinBawaan();
    if (!penyimpanan) return;
    const mitra = baca(KUNCI_MITRA);
    const ps = baca(KUNCI_PENYETEL);
    let lama = null;
    if (!mitra.ada || !ps.ada) {
      const l = baca(KUNCI_LAMA);
      lama = l.isi && typeof l.isi === 'object' ? l.isi : {};
    }
    if (mitra.ada) {
      if (mitra.isi && gradingSah(mitra.isi.grading)) grading = mitra.isi.grading;
    } else if (gradingSah(lama.grading)) {
      grading = lama.grading;
      tulis(KUNCI_MITRA, { grading });
    }
    if (ps.ada) {
      penyetel = penyetelDari(ps.isi);
    } else if (lama.penyetel && typeof lama.penyetel === 'object') {
      penyetel = penyetelDari(lama.penyetel);
      tulis(KUNCI_PENYETEL, penyetel);
    }
  }
  muat();

  /** Teks isian penyetel → { ok, nilai } atau { ok: false, alasan }. */
  function periksaPenyetel(rumus, id, teks) {
    const p = cari(rumus, id);
    if (!p || p.ya) return { ok: false, alasan: 'Penyetel tidak dikenal.' };
    const t = String(teks).trim();
    const rentang = p.min + '–' + ribuan(p.maks);
    if (t === '') return { ok: false, alasan: 'Angka wajib diisi. Tulis bilangan bulat ' + rentang + '.' };
    if (!/^-?\d+$/.test(t)) return { ok: false, alasan: 'Harus bilangan bulat ' + rentang + ', tanpa koma atau pecahan.' };
    const n = Number(t);
    if (n < p.min || n > p.maks) return { ok: false, alasan: 'Di luar rentang: tulis bilangan bulat ' + rentang + '.' };
    if (rumus === 'mirza' && id === 'jamMin' && n > penyetel.mirza.jamPenuh) {
      return { ok: false, alasan: 'Tidak boleh melebihi jam untuk bagian jam penuh (' + penyetel.mirza.jamPenuh + ').' };
    }
    if (rumus === 'mirza' && id === 'jamPenuh' && n < penyetel.mirza.jamMin) {
      return { ok: false, alasan: 'Tidak boleh kurang dari jam paling sedikit (' + penyetel.mirza.jamMin + ').' };
    }
    return { ok: true, nilai: n };
  }

  /**
   * Mengubah satu penyetel. Angka diperiksa ulang di sini (bukan hanya di
   * isian), centang harus boolean. `{ ok }` atau `{ ok: false, alasan }`.
   */
  function aturPenyetel(rumus, id, nilai) {
    const p = cari(rumus, id);
    if (!p) return { ok: false, alasan: 'Penyetel tidak dikenal.' };
    if (p.ya) {
      if (typeof nilai !== 'boolean') return { ok: false, alasan: 'Harus ya atau tidak.' };
    } else {
      const h = periksaPenyetel(rumus, id, String(nilai));
      if (!h.ok) return h;
      nilai = h.nilai;
    }
    penyetel[rumus][id] = nilai;
    gagalSimpan = !tulis(KUNCI_PENYETEL, penyetel);
    return { ok: true };
  }

  function kembalikanPenyetel() {
    penyetel = salinBawaan();
    gagalSimpan = !tulis(KUNCI_PENYETEL, penyetel);
  }

  function aturGradingMitra(id) {
    if (!gradingSah(id)) return false;
    grading = id;
    gagalSimpan = !tulis(KUNCI_MITRA, { grading });
    return true;
  }

  const penyetelDiubah = (rumus, id) => penyetel[rumus][id] !== R.BAWAAN[rumus][id];

  return {
    KUNCI_MITRA,
    KUNCI_PENYETEL,
    PENYETEL,
    gradingMitra: () => grading,
    aturGradingMitra,
    /** Salinan penyetel yang berlaku: { mirza: {...}, usulan: {...} }. */
    penyetel: () => ({ mirza: Object.assign({}, penyetel.mirza), usulan: Object.assign({}, penyetel.usulan) }),
    periksaPenyetel,
    aturPenyetel,
    kembalikanPenyetel,
    penyetelDiubah,
    adaPenyetelDiubah: () => RUMUS.some((r) => PENYETEL[r].some((p) => penyetelDiubah(r, p.id))),
    /** Membaca ulang simpanan, misalnya sesudah tab lain mengubahnya di jendela lain. */
    muatUlang: muat,
    gagalSimpan: () => gagalSimpan,
    adaPenyimpanan: () => !!penyimpanan,
  };
})();

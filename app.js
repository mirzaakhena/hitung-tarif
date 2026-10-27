/*
 * POC tarif dasar per modular (tiket 261027100801).
 *
 * Tabel: satu baris per modular, dikelompokkan per kategori, tiga kolom harga
 * (Instalasi, Perbaikan, Perawatan). Harga contohnya dari `data.js`; harga
 * yang diubah di halaman disimpan di `localStorage` (kunci `KUNCI`), hanya
 * yang berbeda dari contoh. "Kembali ke harga contoh" membuang simpanan itu.
 *
 * Isian diterima hanya bila bilangan bulat positif (lihat `periksaHarga`).
 * Simpanan dibaca dengan penjagaan yang sama, jadi isi yang rusak atau
 * disunting tangan diabaikan, bukan ditampilkan.
 *
 * Tidak tersambung ke aplikasi utama, dashboard, atau server. Bila peramban
 * menolak penyimpanan, halaman tetap jalan dan mengatakan perubahan hilang
 * saat dimuat ulang.
 */
(function () {
  'use strict';

  const D = window.POC_TARIF;
  const KUNCI = 'nukitu-poc-tarif:harga';
  const MAKS = 999999999;
  const JENIS = D.jenis;

  /* ------------------------------------------------------------- data ---- */

  /** Harga contoh per modular: { nama: { instalasi, perbaikan, perawatan } }. */
  const contoh = {};
  for (const k of D.kategori) {
    for (const [nama, ...harga] of k.modular) {
      contoh[nama] = {};
      JENIS.forEach((j, i) => { contoh[nama][j.id] = harga[i]; });
    }
  }

  /* ------------------------------------------------------- penyimpanan ---- */

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

  let diubah = bacaSimpanan();
  let gagalSimpan = !penyimpanan;
  let tanyaReset = false;

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

  function jumlahDiubah() {
    return Object.values(diubah).reduce((t, u) => t + Object.keys(u).length, 0);
  }

  /* ---------------------------------------------------------- isian ---- */

  /** Rupiah tanpa "Rp": 120000 → "120.000". */
  function rupiah(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Isian harga → { ok: true, nilai } atau { ok: false, alasan }.
   * Diterima: angka saja (120000), atau dengan titik pemisah ribuan (120.000),
   * boleh diawali "Rp". Selebihnya ditolak dengan kalimat yang menjelaskan.
   */
  function periksaHarga(teks) {
    const t = String(teks).trim().replace(/^rp\.?\s*/i, '');
    if (t === '') return { ok: false, alasan: 'Harga wajib diisi. Tulis angka, misalnya 120000.' };
    if (/^-/.test(t)) return { ok: false, alasan: 'Harga tidak boleh negatif. Tulis bilangan bulat lebih dari 0.' };
    if (/^\d+$/.test(t) || /^\d{1,3}(\.\d{3})+$/.test(t)) {
      const n = Number(t.replace(/\./g, ''));
      if (n === 0) return { ok: false, alasan: 'Harga harus lebih dari 0.' };
      if (n > MAKS) return { ok: false, alasan: 'Harga paling besar ' + rupiah(MAKS) + '.' };
      return { ok: true, nilai: n };
    }
    if (/^[\d.,]+$/.test(t)) {
      return { ok: false, alasan: 'Harga harus bilangan bulat, tanpa koma atau pecahan. Titik hanya untuk pemisah ribuan, misalnya 120.000.' };
    }
    return { ok: false, alasan: 'Harga hanya boleh berisi angka, misalnya 120000 atau 120.000.' };
  }

  /* --------------------------------------------------------- tampilan ---- */

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  const akar = document.getElementById('aplikasi');

  function gambarBar() {
    const n = jumlahDiubah();
    const status = n
      ? '<b>' + n + '</b> harga diubah dari contoh.'
      : 'Semua harga masih harga contoh.';
    const peringatan = gagalSimpan
      ? '<p class="peringatan" role="alert">Peramban menolak menyimpan, jadi perubahan hilang saat halaman dimuat ulang.</p>'
      : '';
    const reset = tanyaReset
      ? '<span class="tanya" role="group" aria-label="Konfirmasi">' +
          'Kembalikan ' + n + ' harga ke contoh? ' +
          '<button type="button" class="tombol tombol-bahaya" data-aksi="reset-ya">Ya, kembalikan</button> ' +
          '<button type="button" class="tombol" data-aksi="reset-batal">Batal</button>' +
        '</span>'
      : '<button type="button" class="tombol" data-aksi="reset"' + (n ? '' : ' disabled') + '>Kembali ke harga contoh</button>';
    return (
      '<div class="bar">' +
        '<p class="status" data-status>' + status + ' <span class="redup">Angka awal adalah contoh, bukan tarif sungguhan.</span></p>' +
        '<div class="bar-aksi">' + reset + '</div>' +
      '</div>' + peringatan
    );
  }

  function gambarSel(nama, idx, j) {
    const n = harga(nama, j.id);
    const id = 'h-' + idx + '-' + j.id;
    const beda = n !== contoh[nama][j.id];
    return (
      '<td data-jenis="' + esc(j.nama) + '"' + (beda ? ' class="diubah"' : '') + '>' +
        '<input id="' + id + '" type="text" inputmode="numeric" autocomplete="off" spellcheck="false"' +
          ' data-nama="' + esc(nama) + '" data-jenis-id="' + j.id + '"' +
          ' aria-label="' + esc(j.nama + ' ' + nama) + '" aria-describedby="' + id + '-galat"' +
          ' value="' + rupiah(n) + '">' +
        '<p class="galat" id="' + id + '-galat" hidden></p>' +
      '</td>'
    );
  }

  function gambar() {
    let idx = 0;
    let isi = '';
    for (const k of D.kategori) {
      isi += '<tbody>' +
        '<tr class="baris-kategori"><th colspan="4" scope="colgroup">' +
          '<span class="kode">' + esc(k.kode) + '</span> ' + esc(k.nama) +
          (k.keterangan ? ' <span class="redup">· ' + esc(k.keterangan) + '</span>' : '') +
          ' <span class="redup">· ' + k.modular.length + ' modular</span>' +
        '</th></tr>';
      for (const [nama] of k.modular) {
        isi += '<tr><th scope="row">' + esc(nama) + '</th>' +
          JENIS.map((j) => gambarSel(nama, idx, j)).join('') + '</tr>';
        idx++;
      }
      isi += '</tbody>';
    }
    akar.innerHTML =
      '<div data-bar>' + gambarBar() + '</div>' +
      '<div class="bungkus-tabel">' +
        '<table class="tarif">' +
          '<thead><tr><th scope="col">Modular</th>' +
            JENIS.map((j) => '<th scope="col" class="kolom-harga">' + esc(j.nama) + ' <span class="redup">(Rp)</span></th>').join('') +
          '</tr></thead>' + isi +
        '</table>' +
      '</div>';
  }

  function gambarUlangBar() {
    akar.querySelector('[data-bar]').innerHTML = gambarBar();
  }

  function tampilGalat(input, alasan) {
    const p = document.getElementById(input.id + '-galat');
    p.textContent = alasan || '';
    p.hidden = !alasan;
    if (alasan) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  /** Isian ditinggalkan atau Enter: simpan bila sah, tolak dengan alasannya bila tidak. */
  function terapkan(input) {
    const hasil = periksaHarga(input.value);
    if (!hasil.ok) {
      tampilGalat(input, hasil.alasan);
      return;
    }
    const nama = input.dataset.nama;
    const jenis = input.dataset.jenisId;
    aturHarga(nama, jenis, hasil.nilai);
    tampilGalat(input, '');
    input.value = rupiah(hasil.nilai);
    input.parentElement.classList.toggle('diubah', hasil.nilai !== contoh[nama][jenis]);
    tanyaReset = false;
    gambarUlangBar();
  }

  /** Esc: buang ketikan, kembali ke harga yang tersimpan. */
  function batalkan(input) {
    input.value = rupiah(harga(input.dataset.nama, input.dataset.jenisId));
    tampilGalat(input, '');
  }

  akar.addEventListener('change', (e) => {
    if (e.target.matches('input[data-nama]')) terapkan(e.target);
  });

  akar.addEventListener('keydown', (e) => {
    if (!e.target.matches('input[data-nama]')) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      terapkan(e.target);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      batalkan(e.target);
    }
  });

  akar.addEventListener('click', (e) => {
    const t = e.target.closest('[data-aksi]');
    if (!t) return;
    const aksi = t.dataset.aksi;
    if (aksi === 'reset') {
      tanyaReset = true;
      gambarUlangBar();
      const ya = akar.querySelector('[data-aksi="reset-ya"]');
      if (ya) ya.focus();
    } else if (aksi === 'reset-batal') {
      tanyaReset = false;
      gambarUlangBar();
      const r = akar.querySelector('[data-aksi="reset"]');
      if (r) r.focus();
    } else if (aksi === 'reset-ya') {
      diubah = {};
      gagalSimpan = !simpan();
      tanyaReset = false;
      gambar();
    }
  });

  gambar();
})();

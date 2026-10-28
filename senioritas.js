/*
 * POC tab Batas senioritas (tiket 261028104601).
 *
 * Lima senioritas, masing-masing dua angka (bonus maksimal, potongan
 * maksimal) dalam persen dari tarif dasar. Angka Mirza dari `data.js`; angka
 * yang diubah disimpan lewat `batas.js` (dipakai juga oleh simulasi), hanya
 * yang berbeda dari angka Mirza. "Kembali ke angka Mirza" membuang simpanan itu.
 *
 * Isian diterima hanya bila bilangan bulat 0–100 (lihat `periksaBatas`),
 * keputusan Mirza 28 Okt 2026. Isian yang ditolak tidak mengubah angka yang
 * berlaku.
 */
(function () {
  'use strict';

  const D = window.POC_TARIF;
  const B = window.POC_BATAS;
  const MAKS = B.MAKS;

  let tanyaReset = false;

  /* ---------------------------------------------------------- isian ---- */

  /**
   * Isian batas → { ok: true, nilai } atau { ok: false, alasan }.
   * Diterima: bilangan bulat 0..MAKS, boleh diakhiri "%". Selebihnya ditolak
   * dengan kalimat yang menjelaskan.
   */
  function periksaBatas(teks) {
    const t = String(teks).trim().replace(/\s*%$/, '');
    if (t === '') return { ok: false, alasan: 'Angka wajib diisi. Tulis bilangan bulat 0–' + MAKS + ', misalnya 8.' };
    if (/^-/.test(t)) return { ok: false, alasan: 'Batas tidak boleh negatif. Tulis bilangan bulat 0–' + MAKS + '.' };
    if (/^\d+$/.test(t)) {
      const n = Number(t);
      if (n > MAKS) return { ok: false, alasan: 'Batas paling besar ' + MAKS + '%: potongan di atas itu membuat pembayaran negatif.' };
      return { ok: true, nilai: n };
    }
    if (/^[\d.,]+$/.test(t)) {
      return { ok: false, alasan: 'Batas harus bilangan bulat, tanpa koma atau pecahan, misalnya 8.' };
    }
    return { ok: false, alasan: 'Batas hanya boleh berisi angka 0–' + MAKS + ', misalnya 8.' };
  }

  /* --------------------------------------------------------- tampilan ---- */

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  const akar = document.getElementById('batas');

  function gambarBar() {
    const n = B.jumlahDiubah();
    const status = n
      ? '<b>' + n + '</b> angka diubah dari angka Mirza.'
      : 'Semua angka masih angka Mirza.';
    const peringatan = B.gagalSimpan()
      ? '<p class="peringatan" role="alert">Peramban menolak menyimpan, jadi perubahan hilang saat halaman dimuat ulang dan tidak terbaca di simulasi.</p>'
      : '';
    const reset = tanyaReset
      ? '<span class="tanya" role="group" aria-label="Konfirmasi">' +
          'Kembalikan ' + n + ' angka ke angka Mirza? ' +
          '<button type="button" class="tombol tombol-bahaya" data-aksi="reset-ya">Ya, kembalikan</button> ' +
          '<button type="button" class="tombol" data-aksi="reset-batal">Batal</button>' +
        '</span>'
      : '<button type="button" class="tombol" data-aksi="reset"' + (n ? '' : ' disabled') + '>Kembali ke angka Mirza</button>';
    return (
      '<div class="bar">' +
        '<p class="status" data-status>' + status + '</p>' +
        '<div class="bar-aksi">' + reset + '</div>' +
      '</div>' + peringatan
    );
  }

  /** Tanda di bawah isian yang berbeda dari angka Mirza. */
  function teksAsal(id, jenis) {
    return B.diubah(id, jenis) ? 'diubah · angka Mirza ' + B.asal[id][jenis] + '%' : '';
  }

  function gambarSel(s, j) {
    const id = 'bt-' + s.id + '-' + j.id;
    const beda = B.diubah(s.id, j.id);
    return (
      '<td data-jenis="' + esc(j.nama) + '"' + (beda ? ' class="diubah"' : '') + '>' +
        '<span class="isian-persen">' +
          '<input id="' + id + '" type="text" inputmode="numeric" autocomplete="off" spellcheck="false"' +
            ' data-sen="' + s.id + '" data-batas="' + j.id + '"' +
            ' aria-label="' + esc(j.nama + ' ' + s.nama + ' (persen)') + '" aria-describedby="' + id + '-asal ' + id + '-galat"' +
            ' value="' + B.batas(s.id, j.id) + '">' +
          '<span aria-hidden="true">%</span>' +
        '</span>' +
        '<p class="asal" id="' + id + '-asal" data-asal>' + esc(teksAsal(s.id, j.id)) + '</p>' +
        '<p class="galat" id="' + id + '-galat" hidden></p>' +
      '</td>'
    );
  }

  function gambar() {
    akar.innerHTML =
      '<div data-bar>' + gambarBar() + '</div>' +
      '<div class="bungkus-tabel">' +
        '<table class="tarif batas-ubah">' +
          '<thead><tr><th scope="col">Senioritas</th>' +
            B.JENIS.map((j) => '<th scope="col" class="kolom-harga">' + esc(j.nama) + ' <span class="redup">(%, ' + esc(j.keterangan) + ')</span></th>').join('') +
          '</tr></thead>' +
          '<tbody>' + D.senioritas.map((s) =>
            '<tr data-senioritas="' + s.id + '"><th scope="row">' + esc(s.nama) + '</th>' +
              B.JENIS.map((j) => gambarSel(s, j)).join('') + '</tr>').join('') +
          '</tbody>' +
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
    const hasil = periksaBatas(input.value);
    if (!hasil.ok) {
      tampilGalat(input, hasil.alasan);
      return;
    }
    const id = input.dataset.sen;
    const jenis = input.dataset.batas;
    B.aturBatas(id, jenis, hasil.nilai);
    tampilGalat(input, '');
    input.value = String(B.batas(id, jenis));
    const td = input.closest('td');
    td.classList.toggle('diubah', B.diubah(id, jenis));
    td.querySelector('[data-asal]').textContent = teksAsal(id, jenis);
    tanyaReset = false;
    gambarUlangBar();
  }

  /** Esc: buang ketikan, kembali ke angka yang berlaku. */
  function batalkan(input) {
    input.value = String(B.batas(input.dataset.sen, input.dataset.batas));
    tampilGalat(input, '');
  }

  akar.addEventListener('change', (e) => {
    if (e.target.matches('input[data-sen]')) terapkan(e.target);
  });

  akar.addEventListener('keydown', (e) => {
    if (!e.target.matches('input[data-sen]')) return;
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
      B.kembalikanSemua();
      tanyaReset = false;
      gambar();
    }
  });

  // Angka diubah di tab ini pada jendela lain, atau kembali ke halaman ini dari tembolok.
  window.addEventListener('storage', (e) => {
    if (e.key === B.KUNCI || e.key === null) {
      B.muatUlang();
      tanyaReset = false;
      gambar();
    }
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      B.muatUlang();
      tanyaReset = false;
      gambar();
    }
  });

  gambar();
})();

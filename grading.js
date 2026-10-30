/*
 * POC tab Grading (tiket 261028104601 sebagai "Batas senioritas"; jadi Grading,
 * urutan Intermediate sebelum Senior, dan "bonus" jadi "poin" di tiket
 * 261030105301).
 *
 * Lima grading, masing-masing dua angka (poin maksimal, potongan maksimal)
 * dalam persen dari tarif dasar. Angka Mirza dari `data.js`; angka yang diubah
 * disimpan lewat `batas.js` (dipakai juga oleh simulasi), hanya yang berbeda
 * dari angka Mirza. "Kembali ke angka Mirza" membuang simpanan itu.
 *
 * Isian diterima hanya bila bilangan bulat 0–100 (lihat `periksaBatas`),
 * keputusan Mirza 28 Okt 2026. Isian yang ditolak tidak mengubah angka yang
 * berlaku.
 *
 * Di bawah tabel: grading mitra rekaan tab Formula tarif mitra (tiket
 * 261030124701, dulu dipilih di tab itu), disimpan lewat `pengaturan.js`,
 * beserta batasnya yang berlaku menurut tabel di atasnya.
 */
(function () {
  'use strict';

  const D = window.POC_TARIF;
  const B = window.POC_BATAS;
  const P = window.POC_PENGATURAN;
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
    if (/^-/.test(t)) return { ok: false, alasan: 'Poin dan potongan tidak boleh negatif. Tulis bilangan bulat 0–' + MAKS + '.' };
    if (/^\d+$/.test(t)) {
      const n = Number(t);
      if (n > MAKS) return { ok: false, alasan: 'Poin dan potongan paling besar ' + MAKS + '%: potongan di atas itu membuat pembayaran negatif.' };
      return { ok: true, nilai: n };
    }
    if (/^[\d.,]+$/.test(t)) {
      return { ok: false, alasan: 'Poin dan potongan harus bilangan bulat, tanpa koma atau pecahan, misalnya 8.' };
    }
    return { ok: false, alasan: 'Poin dan potongan hanya boleh berisi angka 0–' + MAKS + ', misalnya 8.' };
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
      ? '<p class="peringatan" role="alert">Peramban menolak menyimpan, jadi perubahan hilang saat halaman dimuat ulang.</p>'
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

  /** Batas grading mitra yang sedang dipilih, menurut angka yang berlaku di tabel. */
  function teksBatasMitra() {
    const g = B.grading(P.gradingMitra());
    return 'Batas ' + esc(g.nama) + ': poin maksimal <b>' + g.poinMaks + '%</b> · potongan maksimal <b>' + g.potonganMaks + '%</b>';
  }

  function gambarMitra() {
    const opsi = D.grading.map((x) => '<option value="' + x.id + '"' + (x.id === P.gradingMitra() ? ' selected' : '') + '>' + esc(x.nama) + '</option>').join('');
    return (
      '<section class="panel panel-mitra" id="grading-mitra" aria-labelledby="judul-mitra">' +
        '<h2 id="judul-mitra">Grading mitra</h2>' +
        '<div class="baris-mitra">' +
          '<label class="isian-pilih"><span>Grading mitra</span><select data-grading-mitra>' + opsi + '</select></label>' +
          '<p class="batas-pilihan" data-batas-mitra>' + teksBatasMitra() + '</p>' +
        '</div>' +
        '<p class="redup kecil">Dipakai <a href="formula.html">tab Formula tarif mitra</a> saat "Terapkan perubahan tarif" ditekan; tiap order di sana mencatat grading saat ia dibuat.</p>' +
        (P.gagalSimpan() ? '<p class="peringatan" role="alert">Peramban menolak menyimpan, jadi grading mitra tidak terbaca tab Formula tarif mitra dan hilang saat halaman dimuat ulang.</p>' : '') +
      '</section>'
    );
  }

  function gambar() {
    akar.innerHTML =
      '<div data-bar>' + gambarBar() + '</div>' +
      '<div class="bungkus-tabel">' +
        '<table class="tarif batas-ubah">' +
          '<thead><tr><th scope="col">Grading</th>' +
            B.JENIS.map((j) => '<th scope="col" class="kolom-harga">' + esc(j.nama) + ' <span class="redup">(%, ' + esc(j.keterangan) + ')</span></th>').join('') +
          '</tr></thead>' +
          '<tbody>' + D.grading.map((s) =>
            '<tr data-grading="' + s.id + '"><th scope="row">' + esc(s.nama) + '</th>' +
              B.JENIS.map((j) => gambarSel(s, j)).join('') + '</tr>').join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '<div data-bagian-mitra>' + gambarMitra() + '</div>';
  }

  function gambarUlangMitra() {
    akar.querySelector('[data-bagian-mitra]').innerHTML = gambarMitra();
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
    akar.querySelector('[data-batas-mitra]').innerHTML = teksBatasMitra();
  }

  /** Esc: buang ketikan, kembali ke angka yang berlaku. */
  function batalkan(input) {
    input.value = String(B.batas(input.dataset.sen, input.dataset.batas));
    tampilGalat(input, '');
  }

  akar.addEventListener('change', (e) => {
    if (e.target.matches('input[data-sen]')) terapkan(e.target);
    else if (e.target.matches('select[data-grading-mitra]')) {
      if (P.aturGradingMitra(e.target.value)) {
        gambarUlangMitra();
        akar.querySelector('select[data-grading-mitra]').focus();
      }
    }
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
    if (e.key === B.KUNCI || e.key === P.KUNCI_MITRA || e.key === null) {
      B.muatUlang();
      P.muatUlang();
      tanyaReset = false;
      gambar();
    }
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      B.muatUlang();
      P.muatUlang();
      tanyaReset = false;
      gambar();
    }
  });

  gambar();
})();

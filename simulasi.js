/*
 * POC simulasi bonus dan potongan dari enam bintang (tiket 261028095701).
 *
 * Pilih pekerjaan (modular + jenis) dan senioritas, beri enam bintang, lalu
 * hasilnya langsung terlihat menurut dua cara yang masih dibandingkan Mirza:
 *
 *   A — nilai keenam bintang dijumlahkan dulu (S, −12..+12). S > 0 memberi
 *       S/12 × bonus maksimal; S < 0 memberi S/12 × potongan maksimal.
 *   B — nilai positif (P, 0..12) dan negatif (N, −12..0) dihitung terpisah:
 *       P/12 × bonus maksimal + N/12 × potongan maksimal.
 *
 * Tarif dasar dibaca lewat `harga.js`, jadi harga yang diubah di tabel ikut
 * terpakai (juga bila tabel diubah di tab lain: peristiwa `storage`).
 *
 * Hitungannya bilangan bulat supaya tidak ada galat pecahan: persen disimpan
 * sebagai X/12 (X = S × maks, atau P × bonus + N × potongan), besar Rupiah
 * sebagai tarif × X / 1200. Pembayaran dibulatkan ke rupiah utuh (setengah
 * ke atas); langkah hitung menampilkan angka sebelum pembulatan.
 */
(function () {
  'use strict';

  const D = window.POC_TARIF;
  const H = window.POC_HARGA;
  const NILAI = D.nilaiBintang;
  const MINUS = '−';

  /* ------------------------------------------------------------ hitung ---- */

  /**
   * Pembilang/penyebut → teks desimal Indonesia, paling banyak 2 angka di
   * belakang koma. `pas` false bila angkanya dibulatkan untuk ditampilkan.
   * Tanpa tanda; tanda diurus pemanggil.
   */
  function desimal(pembilang, penyebut) {
    const a = Math.abs(pembilang);
    const ratus = Math.round((a * 100) / penyebut);
    const pas = (a * 100) % penyebut === 0;
    const bulat = Math.floor(ratus / 100);
    const sisa = String(ratus % 100).padStart(2, '0').replace(/0+$/, '');
    return { teks: H.rupiah(bulat) + (sisa ? ',' + sisa : ''), pas };
  }

  function tanda(n) {
    return n > 0 ? '+' : n < 0 ? MINUS : '';
  }

  /** X/12 persen → "+2,5%" (dengan "≈" bila dibulatkan). */
  function persen(x) {
    const d = desimal(x, 12);
    return (d.pas ? '' : '≈ ') + tanda(x) + d.teks + '%';
  }

  /**
   * Persen untuk dikalikan di langkah hitung, tanpa pembulatan: "−27,5%" bila
   * pas, "+5% ÷ 12" bila tidak (5/12 % tidak punya desimal yang habis).
   */
  function persenPersis(x) {
    if ((Math.abs(x) * 100) % 12 === 0) return persen(x);
    return tanda(x) + Math.abs(x) + '% ÷ 12';
  }

  /** Rupiah bulat bertanda: −42000 → "−Rp 42.000". */
  function rp(n) {
    return tanda(n) + 'Rp ' + H.rupiah(Math.abs(n));
  }

  /** Rupiah sebelum pembulatan, pembilang/1200: "Rp 3.583,33" (≈ bila dipotong). */
  function rpMentah(pembilang, bertanda) {
    const d = desimal(pembilang, 1200);
    return (d.pas ? '' : '≈ ') + (bertanda ? tanda(pembilang) : '') + 'Rp ' + d.teks;
  }

  /**
   * Hasil satu cara. `x` = persen × 12. Pembayaran = tarif + tarif × x / 1200,
   * dibulatkan setengah ke atas; besar = pembayaran − tarif.
   */
  function hasilDari(tarif, x) {
    const pembilang = tarif * x; // besar × 1200
    const bayarPembilang = tarif * 1200 + pembilang;
    const bayar = Math.floor((2 * bayarPembilang + 1200) / 2400);
    return { x, pembilang, bayarPembilang, bayar, besar: bayar - tarif };
  }

  /** Semua hitungan untuk tarif, nilai keenam bintang, dan senioritas. */
  function hitung(tarif, nilai, sen) {
    const S = nilai.reduce((t, v) => t + v, 0);
    const P = nilai.filter((v) => v > 0).reduce((t, v) => t + v, 0);
    const N = nilai.filter((v) => v < 0).reduce((t, v) => t + v, 0);
    const xA = S > 0 ? S * sen.bonusMaks : S * sen.potonganMaks;
    const xBonus = P * sen.bonusMaks;
    const xPotongan = N * sen.potonganMaks;
    return {
      S, P, N, xBonus, xPotongan,
      a: hasilDari(tarif, xA),
      b: hasilDari(tarif, xBonus + xPotongan),
    };
  }

  /* --------------------------------------------------------- keadaan ---- */

  const modularSemua = [];
  for (const k of D.kategori) for (const [nama] of k.modular) modularSemua.push(nama);

  // Awalnya contoh Mirza: rookie, instalasi MRI System.
  const pilihan = {
    modular: H.contoh['MRI System'] ? 'MRI System' : modularSemua[0],
    jenis: D.jenis[0].id,
    senioritas: D.senioritas[0].id,
    bintang: Object.fromEntries(D.penilaian.map((p) => [p.id, 3])),
  };

  const senioritasDari = (id) => D.senioritas.find((s) => s.id === id);
  const nilaiSekarang = () => D.penilaian.map((p) => NILAI[pilihan.bintang[p.id] - 1]);

  /* -------------------------------------------------------- tampilan ---- */

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  const akar = document.getElementById('simulasi');

  function gambarPekerjaan() {
    const opsiModular = D.kategori.map((k) =>
      '<optgroup label="' + esc(k.kode + ' · ' + k.nama) + '">' +
        k.modular.map(([nama]) => '<option value="' + esc(nama) + '"' + (nama === pilihan.modular ? ' selected' : '') + '>' + esc(nama) + '</option>').join('') +
      '</optgroup>').join('');
    const opsiJenis = D.jenis.map((j) => '<option value="' + j.id + '"' + (j.id === pilihan.jenis ? ' selected' : '') + '>' + esc(j.nama) + '</option>').join('');
    const opsiSen = D.senioritas.map((s) => '<option value="' + s.id + '"' + (s.id === pilihan.senioritas ? ' selected' : '') + '>' + esc(s.nama) + '</option>').join('');
    return (
      '<section class="panel" aria-labelledby="judul-pekerjaan">' +
        '<h2 id="judul-pekerjaan">Pekerjaan dan mitra</h2>' +
        '<div class="pilih-pekerjaan">' +
          '<label class="isian-pilih isian-modular"><span>Modular</span><select data-pilih="modular">' + opsiModular + '</select></label>' +
          '<label class="isian-pilih"><span>Jenis pekerjaan</span><select data-pilih="jenis">' + opsiJenis + '</select></label>' +
          '<label class="isian-pilih"><span>Senioritas mitra</span><select data-pilih="senioritas">' + opsiSen + '</select></label>' +
        '</div>' +
        '<p class="tarif-dasar" data-tarif></p>' +
        (H.adaPenyimpanan() ? '' : '<p class="peringatan" role="alert">Peramban menolak penyimpanan, jadi harga yang diubah di tabel tidak terbaca di sini; simulasi memakai harga contoh.</p>') +
      '</section>'
    );
  }

  function gambarPenilaian() {
    const kelompok = [
      { id: 'EQ', judul: 'EQ · sikap dan komunikasi' },
      { id: 'IQ', judul: 'IQ · mutu kerja teknis' },
    ];
    return (
      '<section class="panel" aria-labelledby="judul-penilaian">' +
        '<div class="judul-baris">' +
          '<h2 id="judul-penilaian">Enam penilaian</h2>' +
          '<div class="bar-aksi">' +
            '<span class="redup">Semua bintang:</span>' +
            [1, 3, 5].map((n) => '<button type="button" class="tombol tombol-kecil" data-semua="' + n + '">' + n + '</button>').join('') +
          '</div>' +
        '</div>' +
        '<div class="kelompok-penilaian">' +
        kelompok.map((g) =>
          '<div class="kelompok">' +
            '<h3>' + esc(g.judul) + '</h3>' +
            D.penilaian.filter((p) => p.kelompok === g.id).map((p) =>
              '<fieldset class="penilaian" data-penilaian="' + p.id + '">' +
                '<legend>' + esc(p.nama) + '</legend>' +
                '<p class="penjelasan">' + esc(p.penjelasan) + '</p>' +
                '<div class="baris-bintang">' +
                  '<span class="bintang">' +
                  [1, 2, 3, 4, 5].map((n) => {
                    const id = 'b-' + p.id + '-' + n;
                    return '<input type="radio" id="' + id + '" name="b-' + p.id + '" value="' + n + '"' + (pilihan.bintang[p.id] === n ? ' checked' : '') + '>' +
                      '<label for="' + id + '" title="Bintang ' + n + '"><span aria-hidden="true">★</span><span class="sr">Bintang ' + n + '</span></label>';
                  }).join('') +
                  '</span>' +
                  '<span class="nilai-bintang" data-nilai></span>' +
                '</div>' +
              '</fieldset>').join('') +
          '</div>').join('') +
        '</div>' +
      '</section>'
    );
  }

  function gambarBatas() {
    return (
      '<section class="panel" aria-labelledby="judul-batas">' +
        '<h2 id="judul-batas">Batas bonus dan potongan per senioritas</h2>' +
        '<p class="redup kecil">Dari tarif dasar. Urutan dari yang paling junior.</p>' +
        '<table class="batas">' +
          '<thead><tr><th scope="col">Senioritas</th><th scope="col">Bonus maksimal<br><span class="redup">semua bintang 5</span></th><th scope="col">Potongan maksimal<br><span class="redup">semua bintang 1</span></th></tr></thead>' +
          '<tbody>' + D.senioritas.map((s) =>
            '<tr data-senioritas="' + s.id + '"><th scope="row">' + esc(s.nama) + '</th><td>' + s.bonusMaks + '%</td><td>' + s.potonganMaks + '%</td></tr>').join('') +
          '</tbody>' +
        '</table>' +
      '</section>'
    );
  }

  function gambar() {
    akar.innerHTML =
      gambarPekerjaan() +
      gambarPenilaian() +
      '<section class="panel" aria-labelledby="judul-hasil">' +
        '<h2 id="judul-hasil">Hasil</h2>' +
        '<div data-hasil aria-live="polite"></div>' +
      '</section>' +
      gambarBatas();
  }

  /* ---------------------------------------------------------- hasil ---- */

  function namaHasil(x) {
    if (x > 0) return 'Bonus';
    if (x < 0) return 'Potongan';
    return 'Tanpa bonus atau potongan';
  }

  /** Langkah terakhir yang sama di kedua cara: besar dan pembayaran. */
  function langkahBayar(tarif, h) {
    const langkah = [];
    if (h.x === 0) {
      langkah.push('Pembayaran: Rp ' + H.rupiah(tarif) + ', sama dengan tarif dasar');
      return langkah;
    }
    langkah.push('Rp ' + H.rupiah(tarif) + ' × ' + persenPersis(h.x) + ' = ' + rpMentah(h.pembilang, true));
    const pas = h.bayarPembilang % 1200 === 0;
    langkah.push(
      'Pembayaran: Rp ' + H.rupiah(tarif) + ' ' + tanda(h.x) + ' ' + rpMentah(Math.abs(h.pembilang), false) +
      ' = ' + rpMentah(h.bayarPembilang, false) + (pas ? '' : ', dibulatkan ke rupiah utuh: Rp ' + H.rupiah(h.bayar))
    );
    return langkah;
  }

  function nilaiTeks(v) {
    return (v > 0 ? '+' : v < 0 ? MINUS : '') + Math.abs(v);
  }

  function deret(nilai) {
    return nilai.length ? nilai.map((v) => '(' + nilaiTeks(v) + ')').join(' + ') : 'tidak ada';
  }

  function kartu(cara, judul, keterangan, h, langkah) {
    const nama = namaHasil(h.x);
    const kelas = h.x > 0 ? 'naik' : h.x < 0 ? 'turun' : 'tetap';
    return (
      '<article class="kartu-hasil ' + kelas + '" data-cara="' + cara + '">' +
        '<h3>' + esc(judul) + '</h3>' +
        '<p class="redup kecil">' + esc(keterangan) + '</p>' +
        '<dl class="angka">' +
          '<div><dt data-nama-hasil>' + nama + '</dt><dd><span data-persen>' + (h.x === 0 ? '0%' : persen(h.x)) + '</span> · <span data-besar>' + (h.besar === 0 ? 'Rp 0' : rp(h.besar)) + '</span></dd></div>' +
          '<div class="bayar"><dt>Pembayaran akhir</dt><dd data-bayar>Rp ' + H.rupiah(h.bayar) + '</dd></div>' +
        '</dl>' +
        '<details class="langkah" open><summary>Langkah hitung</summary><ol>' +
          langkah.map((l) => '<li>' + esc(l) + '</li>').join('') +
        '</ol></details>' +
      '</article>'
    );
  }

  function perbarui() {
    const sen = senioritasDari(pilihan.senioritas);
    const tarif = H.harga(pilihan.modular, pilihan.jenis);
    const jenis = D.jenis.find((j) => j.id === pilihan.jenis);
    const nilai = nilaiSekarang();
    const r = hitung(tarif, nilai, sen);

    akar.querySelector('[data-tarif]').innerHTML =
      'Tarif dasar ' + esc(jenis.nama.toLowerCase()) + ' ' + esc(pilihan.modular) + ': <b data-tarif-angka>Rp ' + H.rupiah(tarif) + '</b> ' +
      (H.diubah(pilihan.modular, pilihan.jenis)
        ? '<span class="tanda-diubah">diubah di tabel</span>'
        : '<span class="redup">(harga contoh)</span>');

    D.penilaian.forEach((p, i) => {
      const fs = akar.querySelector('[data-penilaian="' + p.id + '"]');
      const b = pilihan.bintang[p.id];
      fs.querySelectorAll('label').forEach((l, k) => l.classList.toggle('nyala', k < b));
      fs.querySelector('[data-nilai]').textContent = 'bintang ' + b + ' · nilai ' + nilaiTeks(nilai[i]);
    });

    akar.querySelectorAll('[data-senioritas]').forEach((tr) => {
      const ini = tr.dataset.senioritas === pilihan.senioritas;
      tr.classList.toggle('terpilih', ini);
      if (ini) tr.setAttribute('aria-current', 'true');
      else tr.removeAttribute('aria-current');
    });

    const positif = nilai.filter((v) => v > 0);
    const negatif = nilai.filter((v) => v < 0);

    const langkahA = ['Jumlah nilai keenam bintang: ' + deret(nilai) + ' = ' + nilaiTeks(r.S)];
    if (r.S > 0) langkahA.push(nilaiTeks(r.S) + ' ÷ 12 × bonus maksimal ' + sen.bonusMaks + '% = ' + persen(r.a.x));
    else if (r.S < 0) langkahA.push(nilaiTeks(r.S) + ' ÷ 12 × potongan maksimal ' + sen.potonganMaks + '% = ' + persen(r.a.x));
    else langkahA.push('Jumlahnya 0: tanpa bonus atau potongan');

    /** Satu baris cara B: nilai positif → bonus, atau nilai negatif → potongan. */
    const bagianB = (judul, batas, daftar, jumlah, maks, x) => daftar.length
      ? judul + ': ' + deret(daftar) + ' = ' + nilaiTeks(jumlah) + ' → ' + nilaiTeks(jumlah) + ' ÷ 12 × ' + batas + ' maksimal ' + maks + '% = ' + persen(x) + ' → ' + rpMentah(tarif * x, true)
      : judul + ': tidak ada → ' + batas + ' 0%';
    const langkahB = [
      bagianB('Nilai positif', 'bonus', positif, r.P, sen.bonusMaks, r.xBonus),
      bagianB('Nilai negatif', 'potongan', negatif, r.N, sen.potonganMaks, r.xPotongan),
      'Bonus dan potongan dijumlahkan: ' + (r.xBonus ? persen(r.xBonus) : '0%') + ' ' + (r.xPotongan ? persen(r.xPotongan) : '+ 0%') + ' = ' + (r.b.x ? persen(r.b.x) : '0%'),
    ];

    akar.querySelector('[data-hasil]').innerHTML =
      '<p class="deret-nilai">Nilai tiap bintang: ' +
        D.penilaian.map((p, i) => '<span class="chip ' + (nilai[i] > 0 ? 'naik' : nilai[i] < 0 ? 'turun' : '') + '" title="' + esc(p.nama) + '">' + esc(p.kelompok) + ' ' + (D.penilaian.filter((q) => q.kelompok === p.kelompok).indexOf(p) + 1) + ' <b>' + nilaiTeks(nilai[i]) + '</b></span>').join(' ') +
      '</p>' +
      '<div class="dua-cara">' +
        kartu('a', 'Cara A · jumlahkan nilai dulu', 'Nilai keenam bintang dijumlahkan; hasil positif memakai bonus maksimal, negatif memakai potongan maksimal.', r.a, langkahA.concat(langkahBayar(tarif, r.a))) +
        kartu('b', 'Cara B · bonus dan potongan terpisah', 'Nilai positif menjadi bonus dan nilai negatif menjadi potongan, masing-masing dengan batasnya, lalu dijumlahkan.', r.b, langkahB.concat(langkahBayar(tarif, r.b))) +
      '</div>';
  }

  /* --------------------------------------------------------- peristiwa ---- */

  akar.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('select[data-pilih]')) {
      pilihan[t.dataset.pilih] = t.value;
      perbarui();
    } else if (t.matches('input[type="radio"]')) {
      const id = t.name.slice(2);
      if (pilihan.bintang[id] !== undefined) {
        pilihan.bintang[id] = Number(t.value);
        perbarui();
      }
    }
  });

  akar.addEventListener('click', (e) => {
    const t = e.target.closest('[data-semua]');
    if (!t) return;
    const n = Number(t.dataset.semua);
    for (const p of D.penilaian) {
      pilihan.bintang[p.id] = n;
      const r = document.getElementById('b-' + p.id + '-' + n);
      if (r) r.checked = true;
    }
    perbarui();
  });

  // Harga diubah di tabel pada tab lain, atau kembali ke halaman ini dari tembolok.
  window.addEventListener('storage', (e) => {
    if (e.key === H.KUNCI || e.key === null) {
      H.muatUlang();
      perbarui();
    }
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      H.muatUlang();
      perbarui();
    }
  });

  gambar();
  perbarui();
})();

/*
 * POC tab Penyetel rumus (tiket 261030124701). Isian tiap penyetel rumus Mirza
 * dan rumus usulan; aturan, simpanan, dan angka bawaannya di `pengaturan.js`,
 * yang juga dibaca tab Formula tarif mitra. Isian yang ditolak tidak mengubah
 * angka yang berlaku.
 */
(function () {
  'use strict';

  const P = window.POC_PENGATURAN;
  const R = window.POC_RUMUS;
  const PENYETEL = P.PENYETEL;
  const akar = document.getElementById('penyetel');

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function gambarBar() {
    const n = ['mirza', 'usulan'].reduce((t, r) => t + PENYETEL[r].filter((p) => P.penyetelDiubah(r, p.id)).length, 0);
    return (
      '<div class="bar">' +
        '<p class="status" data-status>' + (n ? '<b>' + n + '</b> angka berbeda dari bawaan.' : 'Semua angka masih bawaan.') + '</p>' +
        '<div class="bar-aksi"><button type="button" class="tombol" data-aksi="penyetel-bawaan"' + (n ? '' : ' disabled') + '>Kembali ke angka bawaan</button></div>' +
      '</div>' +
      (P.gagalSimpan() ? '<p class="peringatan" role="alert">Peramban menolak menyimpan, jadi angka yang diubah tidak terbaca tab Formula tarif mitra dan hilang saat halaman dimuat ulang.</p>' : '')
    );
  }

  function teksKet(rumus, p) {
    return p.ket + (P.penyetelDiubah(rumus, p.id) ? ' · bawaan ' + R.BAWAAN[rumus][p.id] : '');
  }

  function isian(rumus) {
    const ps = P.penyetel();
    return PENYETEL[rumus].map((p) => {
      const id = 'ps-' + rumus + '-' + p.id;
      const ubah = P.penyetelDiubah(rumus, p.id);
      if (p.ya) {
        return '<label class="isian-centang' + (ubah ? ' diubah' : '') + '"><input type="checkbox" id="' + id + '" data-penyetel="' + rumus + '.' + p.id + '"' + (ps[rumus][p.id] ? ' checked' : '') + '> ' +
          esc(p.nama) + ' <span class="redup kecil">(' + esc(p.ket) + ')</span></label>';
      }
      return '<label class="isian-pilih isian-penyetel' + (ubah ? ' diubah' : '') + '"><span>' + esc(p.nama) + (p.satuan ? ' (' + esc(p.satuan) + ')' : '') + '</span>' +
        '<input type="text" inputmode="numeric" autocomplete="off" id="' + id + '" data-penyetel="' + rumus + '.' + p.id + '" value="' + ps[rumus][p.id] + '" aria-describedby="' + id + '-galat">' +
        '<span class="redup kecil" data-ket>' + esc(teksKet(rumus, p)) + '</span>' +
        '<span class="galat" id="' + id + '-galat" hidden></span></label>';
    }).join('');
  }

  function gambar() {
    akar.innerHTML =
      '<div data-bar>' + gambarBar() + '</div>' +
      '<section class="panel" aria-label="Penyetel rumus">' +
        '<div class="dua-cara">' +
          '<div data-penyetel-rumus="mirza"><h3>Rumus Mirza</h3><div class="kisi-penyetel">' + isian('mirza') + '</div></div>' +
          '<div data-penyetel-rumus="usulan"><h3>Rumus usulan</h3><div class="kisi-penyetel">' + isian('usulan') + '</div></div>' +
        '</div>' +
        '<p class="redup kecil">Dipakai di <a href="formula.html">tab Formula tarif mitra</a>.</p>' +
      '</section>';
  }

  function tampilGalat(input, alasan) {
    const p = document.getElementById(input.id + '-galat');
    if (!p) return;
    p.textContent = alasan || '';
    p.hidden = !alasan;
    if (alasan) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  /** Isian ditinggalkan, Enter, atau centang diubah: simpan bila sah, tolak dengan alasannya bila tidak. */
  function atur(input) {
    const [rumus, id] = input.dataset.penyetel.split('.');
    const hasil = P.aturPenyetel(rumus, id, input.type === 'checkbox' ? input.checked : input.value);
    if (!hasil.ok) { tampilGalat(input, hasil.alasan); return; }
    // Diperbarui di tempat, bukan digambar ulang, supaya fokus yang sudah
    // pindah ke isian berikutnya tidak hilang.
    tampilGalat(input, '');
    const p = PENYETEL[rumus].find((x) => x.id === id);
    const label = input.closest('label');
    label.classList.toggle('diubah', P.penyetelDiubah(rumus, id));
    if (!p.ya) {
      input.value = String(P.penyetel()[rumus][id]);
      label.querySelector('[data-ket]').textContent = teksKet(rumus, p);
    }
    akar.querySelector('[data-bar]').innerHTML = gambarBar();
  }

  akar.addEventListener('change', (e) => {
    if (e.target.matches('[data-penyetel]')) atur(e.target);
  });

  akar.addEventListener('keydown', (e) => {
    const el = e.target;
    if (!el.matches('input[type="text"][data-penyetel]')) return;
    if (e.key === 'Enter') { e.preventDefault(); atur(el); }
    else if (e.key === 'Escape') {
      e.preventDefault();
      const [rumus, id] = el.dataset.penyetel.split('.');
      el.value = String(P.penyetel()[rumus][id]);
      tampilGalat(el, '');
    }
  });

  akar.addEventListener('click', (e) => {
    const t = e.target.closest('[data-aksi="penyetel-bawaan"]');
    if (!t || t.disabled) return;
    P.kembalikanPenyetel();
    gambar();
    // Tombolnya kini mati dan tidak bisa memegang fokus: fokus ke isian pertama.
    akar.querySelector('[data-penyetel]').focus();
  });

  // Diubah di jendela lain, atau kembali ke halaman ini dari tembolok.
  window.addEventListener('storage', (e) => {
    if (e.key === P.KUNCI_PENYETEL || e.key === null) { P.muatUlang(); gambar(); }
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) { P.muatUlang(); gambar(); }
  });

  gambar();
})();

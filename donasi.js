// Data tiap kampanye. Buka halaman dengan donasi.html?id=karhutla | cilacap | banjir | angin
// "dua: true" = judul tampil 2 baris (posisi teks disesuaikan seperti di desain).
var KAMPANYE = {
  karhutla: {
    judul: 'Bantu Korban Karhutla',
    foto: 'images/karhutla.jpg',
    desc: 'Asap dan kebakaran hutan melanda Sumatra dan Kalimantan, ribuan warga terdampak gangguan pernapasan dan sekolah terpaksa diliburkan.',
    dw: 466, dua: false,
    terkumpul: '45.000.000', target: '100.000.000', pct: 45, donatur: 128
  },
  cilacap: {
    judul: 'Pemulihan Pasca Gempa Cilacap',
    foto: 'images/gempa-cilacap.jpg',
    desc: 'Gempa magnitudo 5,3 mengguncang Cilacap, menyebabkan kerusakan bangunan dan kepanikan warga di wilayah selatan Jawa Tengah.',
    dw: 533, dua: true,
    terkumpul: '45.000.000', target: '100.000.000', pct: 45, donatur: 128
  },
  banjir: {
    judul: 'Bantu Korban Banjir & Longsor',
    foto: 'images/banjir-longsor.jpg',
    desc: 'Banjir dan tanah longsor merendam 13 desa di Kabupaten Lebak, memaksa warga mengungsi dan kehilangan akses jalan utama.',
    dw: 510, dua: true,
    terkumpul: '45.000.000', target: '100.000.000', pct: 45, donatur: 128
  },
  angin: {
    judul: 'Bantu Korban Angin Kencang',
    foto: 'images/angin-kencang.jpg',
    desc: 'Cuaca ekstrem disertai angin kencang merusak puluhan rumah warga di Kota Binjai, Sumatera Utara.',
    dw: 495, dua: true,
    terkumpul: '45.000.000', target: '100.000.000', pct: 45, donatur: 128
  }
};

(function () {
  var id = new URLSearchParams(location.search).get('id');
  var k = KAMPANYE[id] || KAMPANYE.karhutla;

  document.title = k.judul + ' — Uluran Nusantara';
  var foto = document.getElementById('d-foto');
  foto.src = k.foto;
  foto.alt = k.judul;
  document.getElementById('d-judul').textContent = k.judul;
  var desc = document.getElementById('d-desc');
  desc.textContent = k.desc;
  desc.style.setProperty('--dw', k.dw + 'px');
  document.getElementById('d-info').classList.toggle('dua', k.dua);
  document.getElementById('d-prog-txt').textContent =
    'Rp. ' + k.terkumpul + ' terkumpul dari target Rp. ' + k.target + ' (' + k.pct + '%)';
  document.getElementById('d-bar').style.setProperty('--pct', k.pct + '%');
  document.getElementById('d-donatur').textContent = k.donatur + ' Donatur';

  // Skala otomatis agar desain 1440px tetap sama di layar lebih kecil
  function fit() {
    document.getElementById('page').style.zoom = window.innerWidth <= 820 ? 1 : Math.min(1, window.innerWidth / 1440);
  }
  fit();
  window.addEventListener('resize', fit);

  // Formulir donasi cepat
  var f = document.getElementById('donasi-form');
  var other = f.elements.nominal;
  var btns = f.querySelectorAll('.amt');
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      btns.forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      other.value = Number(b.dataset.v).toLocaleString('id-ID');
    });
  });
  other.addEventListener('input', function () {
    var d = other.value.replace(/\D/g, '');
    btns.forEach(function (x) { x.classList.toggle('on', x.dataset.v === d); });
  });
  // ---- Pembayaran ----
  var DEMO = true; // ganti false setelah terhubung ke payment gateway (Midtrans / Xendit / dll.)
  var VA = {
    'E-Wallet': { label: 'e-wallet', list: { GoPay: '70001', DANA: '88099', OVO: '80003', ShopeePay: '70003', LinkAja: '91111' } },
    'Transfer Bank': { label: 'bank', list: { BCA: '70012', Mandiri: '88908', BNI: '8848', BRI: '26215', BSI: '9002', Permata: '8528' } }
  };
  var $ = function (id) { return document.getElementById(id); };
  var rp = function (n) { return 'Rp. ' + Number(n).toLocaleString('id-ID'); };
  var pad = function (n) { return n < 10 ? '0' + n : n; };
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  var pay = $('pay'), body = $('pay-body'), timerId;

  function toast(msg) {
    var t = $('toast');
    t.textContent = msg; t.hidden = false;
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 3400);
  }
  function makeVa(prefix) {
    var s = prefix; while (s.length < 16) s += Math.floor(Math.random() * 10);
    return s.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
  function closePay() {
    clearInterval(timerId); pay.hidden = true; document.body.classList.remove('modal-open');
  }

  function openPay(d) {
    d.trx = 'UN-' + Date.now().toString(36).toUpperCase().slice(-8);
    d.via = d.metode;
    var opt = VA[d.metode], inner;
    if (d.metode === 'QRIS') {
      inner = '<div class="pay-qr" id="pay-qr"></div><p class="pay-hint c">Scan kode QR dengan aplikasi e-wallet atau mobile banking yang mendukung QRIS.</p>';
    } else {
      inner = '<label class="pay-lbl" for="pay-sel">Pilih ' + opt.label + '</label><select class="pay-sel" id="pay-sel">' +
        Object.keys(opt.list).map(function (n) { return '<option>' + n + '</option>'; }).join('') + '</select>' +
        '<div class="pay-va"><div><span>Nomor Virtual Account</span><b id="pay-va"></b></div><button type="button" class="pay-copy" id="pay-copy">Salin</button></div>' +
        '<p class="pay-hint">Buka aplikasi <b id="pay-name"></b>, pilih menu bayar / transfer Virtual Account, masukkan nomor di atas, lalu konfirmasi pembayaran.</p>';
    }
    body.innerHTML =
      '<h2 id="pay-title">Selesaikan Pembayaran</h2><p class="pay-camp">' + esc(k.judul) + '</p>' +
      '<div class="pay-sum"><b>' + rp(d.nominal) + '</b><span class="pay-timer" id="pay-timer">15:00</span></div>' + inner +
      '<div class="pay-rows"><div><span>Donatur</span><b>' + esc(d.tampil) + '</b></div><div><span>Email</span><b>' + esc(d.email) +
      '</b></div><div><span>No. Transaksi</span><b>' + d.trx + '</b></div></div>' +
      '<div class="pay-actions"><button type="button" class="pay-btn ghost" id="pay-cancel">Batalkan</button>' +
      '<button type="button" class="pay-btn" id="pay-done">Saya Sudah Bayar</button></div>' +
      (DEMO ? '<p class="pay-demo">Mode demo: nomor pembayaran ini hanya contoh dan belum terhubung ke payment gateway.</p>' : '');

    if (d.metode === 'QRIS') {
      var qr = $('pay-qr');
      if (window.QRCode) {
        new QRCode(qr, { text: 'QRIS-DEMO|' + d.trx + '|' + d.nominal, width: 200, height: 200, colorDark: '#3E4B8E', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
      } else { qr.textContent = 'QR tidak dapat dimuat. Periksa koneksi internet.'; }
    } else {
      var sel = $('pay-sel');
      var setVa = function () {
        d.via = sel.value + ' VA'; d.va = makeVa(opt.list[sel.value]);
        $('pay-va').textContent = d.va; $('pay-name').textContent = sel.value;
      };
      sel.addEventListener('change', setVa); setVa();
      $('pay-copy').addEventListener('click', function () {
        var b = this;
        try { navigator.clipboard.writeText(d.va.replace(/\s/g, '')); } catch (e) {}
        b.textContent = 'Tersalin'; setTimeout(function () { b.textContent = 'Salin'; }, 1600);
      });
    }

    var left = 900; clearInterval(timerId);
    timerId = setInterval(function () {
      var t = $('pay-timer'); left--;
      if (!t) { clearInterval(timerId); return; }
      if (left <= 0) { clearInterval(timerId); t.textContent = 'Waktu habis'; $('pay-done').disabled = true; return; }
      t.textContent = pad(Math.floor(left / 60)) + ':' + pad(left % 60);
    }, 1000);

    $('pay-cancel').addEventListener('click', closePay);
    $('pay-done').addEventListener('click', function () {
      this.disabled = true; this.textContent = 'Memeriksa pembayaran…';
      setTimeout(function () { if (!pay.hidden) showSuccess(d); }, 1400);
    });
    pay.hidden = false; document.body.classList.add('modal-open');
  }

  function showSuccess(d) {
    clearInterval(timerId);
    body.innerHTML =
      '<div class="pay-ok"><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></div>' +
      '<h2 class="c">Terima kasih, ' + esc(d.tampil) + '!</h2>' +
      '<p class="pay-camp c">Donasi Anda untuk ' + esc(k.judul) + ' sudah kami terima dan akan segera disalurkan.</p>' +
      '<div class="pay-rows"><div><span>Nominal</span><b>' + rp(d.nominal) + '</b></div><div><span>Metode</span><b>' + esc(d.via) + '</b></div>' +
      '<div><span>No. Transaksi</span><b>' + d.trx + '</b></div><div><span>Waktu</span><b>' +
      new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + '</b></div></div>' +
      '<div class="pay-actions"><a class="pay-btn ghost" href="index.html#donasi">Kembali ke Beranda</a>' +
      '<button type="button" class="pay-btn" id="pay-close">Tutup</button></div>';
    $('pay-close').addEventListener('click', closePay);
    f.reset(); btns.forEach(function (x) { x.classList.remove('on'); });
  }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var nominal = other.value.replace(/\D/g, '');
    var metode = f.querySelector('input[name="metode"]:checked');
    var anonim = f.elements.anonim.checked, nama = f.elements.nama.value.trim();
    if (!Number(nominal)) { toast('Pilih atau isi nominal donasi terlebih dahulu.'); other.focus(); return; }
    if (!nama && !anonim) { toast('Isi nama lengkap, atau centang "Sembunyikan nama saya".'); f.elements.nama.focus(); return; }
    if (!f.elements.email.value || !f.elements.email.checkValidity()) { toast('Isi email dengan format yang benar.'); f.elements.email.focus(); return; }
    if (!metode) { toast('Pilih metode pembayaran.'); return; }
    openPay({ nominal: nominal, nama: nama, tampil: anonim ? 'Donatur Anonim' : nama, email: f.elements.email.value, metode: metode.value });
  });
  pay.addEventListener('click', function (e) { if (e.target === pay) closePay(); });
  $('pay-x').addEventListener('click', closePay);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pay.hidden) closePay(); });
})();
---
title: "Lume: Migrasi ke Deno Deploy versi 2 "
ringkasan: "Cara migrasi dari Deno Deploy Classic ke Deno Deploy versi terbaru"
date: 2026-04-20
tags:
  - lume
  - deno
  - tutorial
kategori: jurnal
relasi: lume
code: false
favorit: false
comment: true
templateEngine: md
tocx: false
draft: false
keywords: lume, deno, deploy, ssg, blog
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KPMHM2F3NDVTZ7NRA0NP9XGM
  real: https://sok.egois.org/@poes/statuses/01KPMHM2F3NDVTZ7NRA0NP9XGM
---

![Dashboard Deno Deploy](https://ik.imagekit.io/hjse9uhdjqd/tr:w-800/jurnal/migrasi_lume/SCR-20260420-jgay_9mfxOp25u.png){ .fuck .lebar}
<p class="ncaption">Tampilan Dashboard Deno Deploy versi 2</p>


Deno Deploy menginformasikan bahwa per 20 Juli 2026 mereka akan menutup Deno Deploy Classic yang sudah mengudara selama kurang lebih 5 tahun setelah diluncurkan pada Juni 2021. Deno juga sudah membuat dokumentasi untuk [bermigrasi](https://docs.deno.com/deploy/migration_guide/) secara aman ke Deno Deploy V2. 

[Deno Deploy](https://deno.com/deploy) adalah layanan *sub hosting* dari Deno yang memberikan komputasi *edge* secara [gratis terbatas](https://deno.com/deploy/pricing) pada pemakaian CPU, Database, dan Cron Job. Sedangkan versi berbayarnya memberikan batasan yang lebih tinggi. Untuk kepentingan *serve* blog atau jurnal seperti situs ini, layanan gratis sudah sangat lebih dari cukup.

<div class="postnotes">
    <p>Dari <i>upgrade</i> Deno Deploy ini ada banyak hal yang menjadi peningkatan namun ada juga penurunan terutama jumlah Regions yang didukung di versi gratis yang semula 6 Regions sekarang cuma 2 saja. Lebih lengkap bisa merujuk pada <a href="https://docs.deno.com/deploy/#comparison-to-deploy-classic" target="_blankx">tabel perbandingan</a> Deno Deploy.</p>
</div>

Deno menyatakan bahwa proses migrasi tidak bisa berjalan otomatis, namun perlu dilakukan secara manual termasuk menghapus Apps dari Deno Deploy Classic dan membuat ulang di Deno Deploy V2. Berikut adalah pengalaman ane dalam proses migrasi [Lume SSG](https://lume.land).

### Persiapan

Ada beberapa hal yang perlu ane persiapkan sebelum migrasi dan ini lebih penting daripada proses pembuatan App-nya sendiri karena itu mudah (diatur oleh Deno Deploy) yaitu perubahan `CNAME` dan `A/AAAA` *record* karena ane pakai _custom domain_, mematikan fungsi Github Actions karena semua hal akan di*handle* langsung oleh Deno Deploy.

Langkah pertama adalah menghapus sambungan *custom domain* ane di Deploy Classic dan kemudian menghapus `CNAME` dan `A/AAAA` *records* melalui Domain Management. Setelah isian ini kosong dan sambil menunggu proses [propagansi domain](https://www.rumahweb.com/journal/apa-itu-propagasi-dns/), ane matikan proses Github Actions dengan masuk ke halaman repositori dari blog ini kemudian tuju ke menu ***Settings*** - ***Actions - General*** - di halaman ***Actions Permissions*** pilih ***Disable actions*** dan simpan.

<div class="postnotes">
<p>Setelah proses migrasi selesai 100%, App's di Deno Deploy Classic bisa dihapus.</p>
</div>

### Proses Migrasi
*Login* ke Deploy V2 dengan mengunjungi [console.deno.com](https://console.deno.com/) kemudian klik pada tombol ***+New App*** untuk membuat App baru. 

Karena ane *login* dengan akun Github, maka akan muncul halaman ***Create a new Application*** pilihan akun dan repo ane otomatis muncul. Deno secara otomatis akan membaca isi repo dan memberikan sugesti pilihan "terbaik", karena repo ini dibuat dengan Lume maka Deno akan memilih App Config dengan *framework* Lume. Langsung saja klik pad tombol biru bertuliskan ***Create App***.

Deploy akan menampilkan halaman Dashboard dari App ini dan mulai melakukan `build`, prosesnya antara 20 - 50 detik sampai semua selesai. Setelah selesai Deploy akan memberikan Preview URL hasil dari proses `build` tadi, formatnya adalah `nama app-kode build`. URL ini berubah - ubah setiap selesai `build`, namun Deploy juga memberikan URL statis dengan format `nama app.user.deno.net`. Karena ane ga ingin pakai ini dan mau pakai domain sendiri, maka tuju menu ***Settings*** dan pilih Production Domain - ***Add Domain***. Masukkan nama domain yang akan dipakai (`kusaeni.com`) kemudian akan muncul di *sidebar* pengaturan *DNS Records*. Ada 3 tab yaitu `CNAME`, `ANAME/ALIAS`, `A/AAAA` pilih saja yang paling mudah atau relevan.

*Domain management* ane hanya mengijinkan `A/AAAA` *records* maka ane pilih tab itu. Buat *record* baru yaitu `CNAME` (wajib) dan `A` *records* jika pakai IPv4 saja atau pakai `AAAA` untuk IPv6. Kemudian tinggal verifikasi dan _request Let's Encrypt Certificate_ langsung dari Deno Deploy. Jika tidak ada masalah, maka domain akan segera terverifikasi dan menunggu propagansi (prosesnya cepat biasanya 10 menit sudah selesai).

![contoh dns records](https://ik.imagekit.io/hjse9uhdjqd/jurnal/migrasi_lume/SCR-20260419-trcv_6MQAQKKpR.png)
<aside class="image">
    Contoh isian *DNS Records*. Sesuaikan dengan kode yang diberikan oleh Deno Deploy
</aside>

Terakhir sila kunjungi URL domain dan _insya Allah_ jurnal/blog sudah muncul dengan baik.

### Personalisasi

Deno Deploy secara _default_ akan memeriksa _framework_ yang dipakai, karena repo ini dibuat untuk dan dengan Lume maka Deploy akan memakai Lume sebagai _framework default_ dan `deno task build` sebagai _Build Command_. Dengan begini membuat Lume bisa *live* dengan segara, namun otomasi ini akan membuat beberapa pengaturan personal menjadi tidak berjalan baik, salah satunya tentang bagaimana halaman 404 ditampilkan.

<div class="postnotes kuning">
    <p>Dalam dunia HTTP, 404 adalah salah satu HTTP <i>Status Code</i> yang mengindikasikan bahwa peramban/<i>browser</i> bisa berkomunikasi dengan sebuah <i>server</i>, namun <i>server</i> tidak bisa memberikan <i>request</i> yang diminta. Bisa karena yang di<i>request</i> tidak ada atau disembunyikan (tidak memiliki kewenangan), maka peramban akan menampilkan kode 404: <i>Resource Not Found</i>.</p>
</div>

Ane memiliki tampilan halaman 404 yang ane buat sendiri, namun dengan Deploy secara otomatis memberikan label _framework_ Lume dan menganggap bahwa repo ini bisa di*serve* sebagai *static page* membuat fitur halaman 404 ane tidak bisa dipakai karena Deploy memiliki fungsi penampil 404 tersendiri yang sangat minimalis.

Sebelumnya di Deploy Classic, ane pakai `server.ts` sebagai *endpoint* untuk dijalankan sehingga *script's* yang ane pasang di *file* ini bisa berjalan seperti 404 dan [No AI Crawler](https://kusaeni.com/jurnal/lume-block-bot-AI-crawler/), maka penggunaan *template framework* Lume ini membuat fitur ini tidak tersedia. Oleh karena itu ane melakukan sedikit personalisasi yaitu dengan merubah *framework* menjadi dinamis, caranya

- Masuk ke Dashboard Apps (dalam hal ini Jurnal), kemudian tuju menu ***Settings***
- Edit ***App Configuration***,
- Di pilihan *drop down* rubah _framework preset_ dari Lume ke ***No Preset***,
- Isi perintah `build` dengan `deno task build`
- Di Runtime Configuration, pilih ***Dynamic App*** kemudian isi *Entrypoint* dengan `server.ts`,
- Kemudian simpan

Dengan ini maka Deploy akan memakai `server.ts` sebagai *entrypoint* sehingga fitur kustom 404 dan No AI crawler kembali tersedia.

---
title: "Install 4Get di FreeBSD"
ringkasan: "<i>selfhost proxy search engine</i> di FreeBSD untuk kenyamanan dan privasi."
date: 2026-01-22
tags:
  - tutorial
  - freebsd
  - bsd
  - security
kategori: jurnal
relasi: freebsd
code: true
favorit: false
comment: true
keywords: bsd, freebsd, ente, security, tutorial, privasi, 4get, search, google, duckduckgo, brave
draft: true
tocx: false
comments:
  src: https://sepoi.deno.dev/@poes/statuses/
  real: https://sok.egois.org/@poes/statuses/
---

Sudah banyak orang bilang untuk meninggalkan Google Search sebagai mesin pencari. Sudah terlalu banyak alasannya, sudah banyak pula alternatifnya. Namun benarkah memakai alternatif itu sudah membuat privasi ane aman?

[Proton sudah merangkum 5 privacy focus alternative search egine](https://proton.me/blog/alternative-search-engines) dan juaranya saat ini adalah tidak ada, semua ada plus dan minusnya sendiri. Urutan pertama dalam _list_ memang [Duckduckgo](https://duckduckgo.com) namun mesin pencari ini bukannya tidak memiliki kelemahan, karena disebut - sebut bahwa dia masih kasih "laporan" ke Microsoft karena masih pakai Bing sebagai otak dari mesin pencari dan karena lokasi kantor utama di Amerika membuat banyak pengamat menganggap kalo bisa saja Duckduckgo kena pengawasan dari pemerintah disana. Ane sendiri selama ini menganggap Duckduckgo sebagai perusahaan dari Uni Eropa namun ternyata salah. Selain itu di Indonesia situs Duckduckgo [kena begal](https://teknologi.bisnis.com/read/20240805/101/1788262/kominfo-beberkan-alasan-situs-duckduckgo-diblokir-di-ri) dari Komdigi.

Maka orang - orang yang sangat perhatian dengan privasi mulai membuat alternatif sendiri yang bisa di _selfhost_, di antaranya yang populer adalah [SearcxNg](https://searxng.org/), [librex](https://github.com/hnhx/librex), [Leta](https://leta.mullvad.net/)) dan [websurfx](https://github.com/neon-mmd/websurfx). Semua alternatif ini sering disebut _meta search engine_ karena mereka menggabungkan hasil pencarian dari banyak _search engine_ dan menjadikan satu hasil pencariannya sehingga lebih lengkap dan luas, ya _meta search engine_ tidak memiliki mesin pencari sendiri namun mengambil data dari mesin pencari populer lainnya.

Masalah umum dari _meta search engine_ adalah saat mesin pencari utama (sebut saja Google misalnya) merubah cara bagaimana menampilkan hasil maka _meta search engine_ ini tidak akan bisa dipakai lagi dan harus memperbarui kode - kode yang dipakai, dan ini [menyusahkan](https://mullvad.net/en/blog/shutting-down-our-search-proxy-leta). Selain itu _meta search engine_ membutuhkan sumber daya yang besar untuk bisa berjalan lancar, tentu saja menggabungkan hasil pencarian dari banyak sumber akan menguras waktu dan tenaga.

Alternatif lain adalah dengan memakai _proxy search engine_, yaitu sebuah aplikasi yang tidak memproses hasil pencarian hanya mengambil hasil pencarian dari sebuah mesin pencari saja. Seperti namanya hanya menjadi proxy sehingga mesin pencari (misal google) tidak akan tahu siapa yang melakukan pencarian sehingga privasi lebih aman.

Salah satu _proxy search engine_ yang cukup banyak dipakai adalah [4Get](https://git.lolcat.ca/lolcat/4get) yang punya _tagline_: <mark>_4get is a proxy search engine that doesn't suck_</mark>.

4Get dibangun dengan PHP dan tidak membutuhkan database, sehingga bisa dipasang di layanan _hosting_ murah karena juga tidak membutuhkan sumber daya yg tinggi. Dibuat dengan dasar Linux maka memasangnya di Linux tidak membutuhkan banyak _effort_ apalagi jika pakai Docker. Namun ane hanya punya ~~Open~~FreeBSD maka ane akan coba untuk memasang 4Get di FreeBSD (yang ane kira bakalan agak susah ha ha ha).

Untuk kasus ini ane tidak install di _Jail_ melainkan di _host_, meskipun bisa saja dipasang di Jail (gunakan [template ini](https://github.com/BastilleBSD/templates/tree/main/lang/php) untuk cepat bikin jail PHP). Saya akan pakai [Caddy](https://caddyserver.com/) sebagai _reverse proxy_ dan PHP8.1

```shell-sesion
$ doas pkg install caddy php81 php81-pecl-imagick php81-curl php81-pecl-APCu php81-session
```

di [dokumentasinya](https://git.lolcat.ca/lolcat/4get/src/branch/master/docs/caddy.md) juga disebut untuk memasang `php-dom`, `curl`, dan `imagemagick`. Namun itu semua sudah menjadi _dependencies_ dari paket yang sudah ane pasang di atas. Sebagai contoh `php-dom` sudah menjadi satu dengan `php81` atau `imagemagick` sudah dengan `php81-pecl-imagick`.

Pastikan semua sudah terpasang dengan baik

```shell-session
$ php -v
PHP 8.1.34 (cli) (built: Dec 23 2025 01:19:33) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.1.34, Copyright (c) Zend Technologies

$ php -m | grep -E 'dom|imagick|curl|session'
curl
dom
imagick
session
```

<div class="postnotes hijau">
  <p>Meski sudah ada versi 8.5 namun ane pakai 8.1 yang kata orang lebih stabil, selain itu <code>php-pecl-APCu</code> tidak bisa jalan lancar di 8.5 alias masih ada bug. Namun 4Get sendiri mengsyaratkan PHP 8.2 di dokumentasinya.</p>
</div>

Setelah semua terpasang, klon repo dari 4Get dan tentukan _folder permission_ yang pas.

```shell-session
$ doas git clone https://git.lolcat.ca/lolcat/4get.git /var/www
$ doas chmod -R 775 /var/www/4get
$ doas chmod -R 777 /var/www/4get/icons
$ doas pw groupmod www -m poes
```

Untuk menjalankan PHP sebagai _service_ dan bisa jalan setiap _boot_ maka masukkan `php_fpm_enable` ke `/etc/rc.conf`.

```shell-session
$ doas sysrc php_fpm_enable=YES
php_fpm_enable: NO -> YES
```

Asumsi adalah tidak memakai pengaturan sendiri, ikut _default_ dari 4Get sehingga ane tidak merubah pengaturan di `/var/www/4get/data/config.php`. Sekarang mulai mengatur Caddy, ane ga akan bahas lengkap dari awal soal ini namun ane cuma kasih lihat isi `Caddyfile` terkait 4Get saja.

```ini
forget.taa.ee {
	root * /var/www/4get
        file_server
        encode gzip

        php_fastcgi unix//var/run/php-fpm.sock
        try_files {path} {path}.php /index.php?{query}

        @static path *.ico *.png *.jpg *.jpeg *.webp *.css *.js
        header @static Cache-Control "public, max-age=86400"
}
```

simpan dan tambahkan pengaturan Caddy di `/etc/rc.conf` juga dan mulai jalankan semua _service_ terkait.

```shell-session
$ doas sysrc caddy_enable=YES
cady_enable: NO -> YES
$ doas service php_fpm start
$ doas service caddy start
```

Buka _browser_ dan cek (sebagai contoh) https://forget.taa.ee, seharusnya _instance_ 4Get sudah nongol dengan baik.

![FourGet](https://ik.imagekit.io/hjse9uhdjqd/jurnal/fourget/SCR-20260117-ocee__nFp_iON-.png)

Ane sudah rubah _banner_-nya karena ga suka dengan _banner_ aslinya. Ane inginnya pakai foto kucing hitam tapi burung hantu juga bagus ha ha ha.

Apakah ini sudah selesai? oh tidak dong karena bakalan banyak _error_ PHP yang nongol, tinggal catat nama _variable_, _files_, dan baris yang _error_. Kebanyakan adalah _error_ berulang dan cara penyelesaiannya bisa dicari lewat mesin pencarian atau lewat instance 4Get juga.

Selain itu ada beberapa _engine_ yang tidak bisa dipakai, mungkin karena token tidak ditemukan dan ane belum sempat periksa. Namun dengan Duckduckgo dan Brave tersedia, ane tidak terlalu ambil pusing dengan _engine_ lain yang gagal.

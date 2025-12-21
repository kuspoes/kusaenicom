---
title: Self host Ente Photos di FreeBSD
ringkasan: "Ini adalah catatan ane dalam memasang Ente di FreeBSD, tidak mudah dan menjengkelkan"
date: 2025-12-07
tags:
  - kusaeni
  - tutorial
  - freebsd
  - bsd
kategori: jurnal
code: true
favorit: false
comment: true
keywords: bsd, freebsd, ente, selfhost
draft: true
comments:
  src: https://sepoi.deno.dev/@poes/statuses/
  real: https://sok.egois.org/@poes/statuses/
---

Jika kamu pengguna Linux maka kamu boleh tersenyum akan kemudahan hidupmu karena Ente bisa dengan mudah dipasang di Linux dengan Docker. Namun kalo kamu pengguna Linux tapi punya _fetish_ <mark>**kalo bisa susah ngapain dipermudah**</mark> maka kamu cocok membaca tulisan ini sampai akhir. Namun perlu dicatat artikel ini bukan tutorial melainkan catatan atas pengalaman ane memasang Ente app di FreeBSD 14.3.

Apa itu Ente?. [Ente](https://ente.io/) adalah sebuah aplikasi penyimpanan foto yang dienkripsi E2E, _cross platform_, dan _open source_. Karena _open source_ membuat orang boleh dan bisa meng-_selfhost_ aplikasi ini, meski Ente sendiri juga menyediakan layanan penyimpanan awan dengan harga tertentu.

Kebutuhan minimal untuk _selfhost_ Ente ini cukup ringan yaitu komputer atau VPS dengan RAM 1GB, 1 core CPU , dan database postgresql. Sedangkan untuk penyimpanan diwajibkan memiliki penyimpanan S3. Untuk yang terakhir ini bisa bikin sendiri atau menyewa layanan penyimpanan S3 yang sudah ada.

Jutaan orang sudah tahu kalo ane pengguna BSD, di VPS ane pun pakai FreeBSD sehingga ane akan memasang Ente di FreeBSD dengan mempergunakan _binary_ karena FreeBSD 14.3 tidak mengsupport Docker dan atau OCI (secara penuh).
Di VPS ane sudah pasang Postgresql dan Garage S3 di jail, sehingga nantinya bisa dimanfaatkan untuk mendukung Ente tanpa repot memasang ulang meski harus melakukan sedikit perubahan konfigurasi.

### Postgresql

Seperti yang sudah ane sebutkan di atas bahwa ane sudah memiliki postgresql berjalan di dalam salah satu jail dalam hal ini bernama `postgres` dan IP `10.0.0.5`. Karena nantinya saya akan membuat jail khusus Ente di IP `10.0.0.6` maka ane perlu merubah perijinan akses ke database di file `postgresql.conf` dan `pg_hba.conf`

```shell-session
# vim /data/db/postgres/data18/postgresql.conf
listen_addresses = '*'
```

merubah isian `listen_addresses` ke `*` membuat postgresql akan menerima koneksi dari luar jail. Kemudian di file `pg_hba.conf` ditambahkan isian sebagai berikut

```shell-session
# vim /data/db/postgres/data18/pg_hba.conf
host    ente_db      all     10.0.0.6/32         trust
host    ente_db      all     10.0.0.0/24         trust
```

terakhir _restart_ postgresql dengan perintah `service postgresql restart`.

### Garage S3

Disini ane perlu membuat 1 bucket khusus untuk Ente dengan nama ente-bucket, catat access key dan secret key karena nanti dibutuhkan untuk konfigurasi Ente.

### Ente

Ini adalah bagian paling seru dan menjengkelkan, ane perlu berhari - hari untuk selesai karena dokumentasi dari Ente amat sangat tidak lengkap dan _missleading_ (waktu itu, ga tau kalo sekarang).

Karena ane tak pakai Docker maka ane akan pasang secara manual, dokumentasi resmi bisa diakses di [Manual setup (without Docker)](https://ente.io/help/self-hosting/installation/manual). Tapi di catatan ini ane tidak akan menuliskan masalah - masalah yang sempat ane hadapi melainkan catatan penting untuk membuat Ente bisa berjalan dengan baik di FreeBSD.

Ente dibuat dengan Golang, tentu saja memasang Golang adalah hal utama yang perlu dilakukan tapi tidak wajib karena sebenarnya nanti yang perlu dijalankan adalah versi binary yang sudah di-_compiled_. Karena VPS ane punya sumbedaya pas - pasan, maka ane akan _compile_ di lokal terlebih dahulu, untuk build perlu Go dan NodeJs.

```shell-session
# pkg install go125 node25 yarn
```

untuk keperluan _build_ disebutkan perlu paket `pkg-config` tapi FreeBSD sudah tidak lagi pakai dan sudah ada di Base. Namun jika ada masalah silakan memasang paket [`devel/pkgconf`](https://www.freshports.org/devel/pkgconf) sebagai alternatif.

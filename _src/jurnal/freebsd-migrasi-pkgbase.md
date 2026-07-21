---
title: "FreeBSD: migrasi ke pkgbase"
ringkasan: "masa depan proses <i>update - upgrade</i> FreeBSD yang akan menggantikan <code>freebsd-update</code>"
date: 2026-07-05
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
keywords: "bsd, freebsd, security, tutorial, cara migrasi pkgbase, belajar freebsd"
draft: false
tocx: false
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KWQ1N5VYP0VHKASZJKJGY1X1
  real: https://sok.egois.org/@poes/statuses/01KWQ1N5VYP0VHKASZJKJGY1X1
---

Di FreeBSD versi 15.0 diperkenalkan sebuah metode baru untuk meng-*install* dan memanajemen *base system* dengan mempergunakan paket manajer pkg(8) yang disebut dengan **pkgbase**.

Pada saat proses peng*install*an sistem, bsdinstall(8) akan memberikan pilihan kepada *user* untuk mempergunakan metode instalasi berbeda yaitu:

1. Metode Tradisional dengan *Distribution Sets* yaitu metode yang selama ini dipakai dirilis sebelumnya dengan mempergunakan alat <code>freebsd-update</code>(8). Proses ini dikeluhkan sangat lambat saat mengunduh *files update*,
2. Metode paket atau pkgbase, metode baru dimana pemasangan sistem akan memanfaatkan repositori base. Semua proses akan di*handle* oleh alat <code>pkg</code>. Metode ini akan menjadi standar untuk memanajemen *base system installation and upgrades*. Kecepatan unduhan jauh lebih cepat dibandingkan memakai metode tradisional.

### Migrasi dengan pkgbasify
Untuk yang sudah memakai [#FreeBSD](/tags/freebsd) versi 15 dan masih mempergunakan metode tradisional, FreeBSD Foundation membuatkan [sebuah *script*](https://github.com/FreeBSDFoundation/pkgbasify) untuk melakukan migrasi. Namun sebelum mulai migrasi, pastikan setidaknya ada 5GB kapasitas *storage* tersedia karena *script* akan mengunduh paket - paket pengganti (untuk sementara).

```shell-session
$ mkdir pkgbase && cd pkgbase
$ fetch https://github.com/FreeBSDFoundation/pkgbasify/raw/refs/heads/main/pkgbasify.lua
$ chmod +x pkgbasify.lua
$ doas ./pkgbasify
```

`pkgbasify.lua` akan menampilkan peringatan tentang *backup* sistem dulu sebelum lanjut dan kemungkinan kegagalan sistem karena migrasi. Jadi jika memakai ZFS sebaiknya lakukan *backup* terlebih dahulu. Batalkan proses migrasi dengan mengetik "N" atau No! dan lakukan *backup*, namun jika tidak memakai ZFS bisa langsung melakukan migrasi.

<div class="postnotes">
    <p><b>Khusus pengguna ZFS</b></p>
    <p>Gunakan cara berikut untuk membuat <i>snapshot</i> yang nantinya bisa dipergunakan untuk <i>restore system</i> jika terjadi kegagalan proses migrasi</p>    
    <pre class="language-shell-session" tabindex="0"><code class="language-shell-session">
        <br />
    <span class="token command"><span class="token shell-symbol important">$</span> <span class="token bash language-bash">doas bectl create snapshot-sebelum-migrasi</span></span>
<span class="token output">    </span></code></pre>
</div>

Lanjutkan proses migrasi dengan mengulang perintah `doas ./pkgbasify.lua` dan kali ini ketik Y untuk memulai. `pkgbasify.lua` akan memeriksa semua paket sistem yang terpasang dan kemudian mulai mengunduh paket yang sama dari repositori dengan mempergunakan pkg(8) dan memasangnya sebagai pengganti paket base yang didapat dengan `freebsd-update`.

Lama waktu proses migrasi dipengaruhi oleh jumlah paket yang terpasang dan kecepatan pengunduhan. Sebagai contoh di VPS ane dengan versi minimal FreeBSD, ada sekitar 217 paket yang harus diunduh dan dengan kecepatan pengunduhan sekitar 25Mbps `pkgbasify.lua` membutuhkan waktu sekitar 4 menit. 

Setelah semua paket terunduh dan terpasang jangan *reboot* terlebih dahulu, namun periksa *files* berikut dan pastikan isinya sudah benar. *Files* yang penting untuk diperiksa adalah

- `/etc/master.passwd`, periksa akun yang ada terutama akun `root` dan `user` agar nantinya setelah *reboot* bisa login dengan baik,
- `/etc/group`, sama seperti di atas. Pastikan group untuk `user` susah sesuai,
- `/etc/ssh/sshd_config`, penting untuk memastikan bahwa pengaturan sudah sesuai agar tidak ada masalah saat login melalui SSH. Jika tidak pakai SSH, *file* ini bisa diabaikan.

Jika semua sudah sesuai, lakukan *reboot* dengan `$ doas shutdown -r now`.

### Setelah migrasi

Setelah *reboot* sistem dan login kembali, maka untuk proses *update* dan *upgrade* FreeBSD sudah tidak memakai perintah `freebsd-update` melainkan menjadi satu dengan perintah `pkg`. Jadi lakukan *update repository* dan *upgrade* paket yang sudah terpasang.

```shell-session
$ doas pkg update -f
$ doas pkg upgrade
```
<aside>opsi <code>-f</code> akan membuat pkg mengunduh dan membuat ulang database repo</aside>

Proses *update repository* dan *upgrade* selanjutnya akan melakukan *update base system*  seperti *update* dan *upgrade* paket seperti biasa. Jika ingin menghapus paket yang sudah terunduh guna mengembalikan kapasitas diska tersedia gunakan `pkg clean -a` dan atau pakai `pkg autoremove` untuk menghapus paket terpasang yang sudah tidak dipakai lagi.

Lalu bagaimana cara update version atau *security patch*?

Tentu saja dengan melakukan *update* pada paket *base* dengan cara melakukan *fetch* dan *install* paket yang khusus diambil dari repositori **FreeBSD-base** dan melakukan *reboot*.

```shell-session
$ doas pkg update -r FreeBSD-base
$ doas shutdown -r +10min "Reboot setelah update paket base"
```

<hr />

### Lagi sial?

Ane sudah mencoba melakukan migrasi 2 VPS dari metode tradisional ke pkgbase dan keduanya berjalan dengan lancar kecuali saat proses *upgrade* (di VPS kedua) setelah *reboot*.

`pkg` berusaha memasang hampir semua paket `gcc1*-devel`! yang jelas akan muncul konflik. Permasalahan ini karena `pkg` perlu memasang paket `mozjpeg` yang konflik dengan `jpeg-turbo` yang disyaratkan/dipakai oleh paket `vnstat`.

```txt
New packages to be INSTALLED:

FreeBSD-clibs-lib32: 15.1p1 [FreeBSD-base]
binutils: 2.44,1 [FreeBSD-ports]
gcc12: 12.4.0_5 [FreeBSD]
gcc12-devel: 12.4.1.s20250702 [FreeBSD-ports]
gcc13: 13.3.0_3 [FreeBSD-ports]
gcc13-devel: 13.4.1.s20260326 [FreeBSD-ports]
gcc14: 14.2.0_4 [FreeBSD-ports]
gcc14-devel: 14.3.1.s20260327,1 [FreeBSD-ports]
gcc15: 15.2.0_1 [FreeBSD-ports]
gcc15-devel: 15.2.1.s20260328 [FreeBSD-ports]
gcc16-devel: 16.0.1.s20260329 [FreeBSD-ports]
ja-libgd: 2.3.3_13,1 [FreeBSD-ports]
mozjpeg: 4.1.5 [FreeBSD-ports]
ru-libgd: 2.3.3_13,1 [FreeBSD-ports]
uk-libgd: 2.3.3_13,1 [FreeBSD-ports]
```

Hal ini karena sebelumnya ane mengunci paket `jpeg-turbo` agar tidak diganti oleh `mozjpeg`, sehingga `pkg` bingung dan perlu melakukan *build* ulang. Oleh karena itu, ane perlu membuka kunci paket ini sebelum melakukan *upgrade*.

```shell-session
$ doas pkg unlock jpeg-turbo
$ doas pkg clean -a
$ doas pkg upgrade
```

Ane juga melakukan pembersihan/*cleaning cache* paket dan mengunduh ulang paket untuk memastikan tidak ada *cache* paket yang korup karena masalah saat *upgrade*.

Jika masalah terjadi pada saat proses migrasi, maka baca baik - baik *error* yang muncul dan selesaikan terlebih dahulu masalah yang ada. Kemudian lanjutkan dengan menambahkan *flag* `--force` untuk memaksa dan melanjutkan proses migrasi.

{{ comp.subs() }}

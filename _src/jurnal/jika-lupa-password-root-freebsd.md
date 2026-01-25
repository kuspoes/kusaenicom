---
title: Jika lupa password root FreeBSD
ringkasan: "Cara ini sering dipakai untuk merubah password root jika kelupaan"
date: 2024-12-26
tags:
  - jurnal
  - bsd
  - tutorial
  - freebsd
keywords: "freebsd, vps, tutorial bsd, linux, lupa password"
kategori: jurnal
relasi: freebsd
code: true
favorit: false
comment: true
tocx: false
style: "jika-lupa-password-root-freebsd.css"
---

Mengaktifkan [doas(1)](https://man.freebsd.org/cgi/man.cgi?query=doas&sektion=1&format=html) untuk _user_ dengan _privilleges_ `root` tanpa _password_ itu memang memudahkan namun memiliki efek yang kadang menyebalkan yaitu lupa _password_ `root` setelah sekian lama.

Hal ini beberapa kali terjadi kepada saya, selain karena pada dasarnya saya seorang pelupa.

Bilamana hal itu terjadi yang dilakukan adalah merubah _password_ `root` tersebut karena me-_recover_-nya adalah pekerjaan yang lebih sulit lagi. Caranya sebenarnya mudah asal punya akses fisik ke PC/Box VPS, langkah - langkahnya adalah sebagai berikut:

1. _Reboot system_ dan tunggu sampai muncul _boot loader options_. Kemudian masukkan pilihan (ketik nomernya) untuk _booting_ ke _single user mode_. Untuk Desktop biasanya di nomer 4 sedangkan kalo VPS biasanya di nomer 2.
2. Setelah pesan _boot_ selesai, tekan tombol Enter sehingga otomatis akan masuk ke _shell_.
3. Ketik `passwd` untuk mengganti _password_, ikuti perintah _on screen_ .
   Jika muncul error `passwd: pam_chauthtok(): error in service module` maka pastikan terlebih dahulu apakah _file system_ saat ini berjalan dalam mode Read Write. Jika masih dalam mode Read Only, harus dirubah terlebih dahulu.

```shell-session
# mount
/dev/vtbd0s1a on / (ufs, local, read-only)
devfs on /dev (devfs)
# mount -o rw /
# mount
/dev/vtbd0s1a on / (ufs, local, soft-updates, journaled soft-updates)
devfs on /dev (devfs)
```

4. Setelah selesai mengganti password ketik `reboot` untuk me*reboot* PC/VPS. Saat muncul _boot loader options_ ketik 1 untuk _booting_ secara normal dan coba login dengan _password_ `root` yang baru saja diganti.

![freebsd boot loader options](https://ik.imagekit.io/hjse9uhdjqd/jurnal/freebsd_lupa_password/bsdinstall-newboot-loader-menu_dy1DYb2c2.png?updatedAt=1735196565380)

<p class="ncaption">Gambar diambil dari FreeBSD Handbook</p>

Mudah bukan? _but wait_ ini artinya orang lain bisa dong dengan mudah masuk ke PC dengan _password_ `root`. Jawabannya adalah iya, sehebat apapun *software*nya kalo penyerang mendapatkan akses fisik ke PC maka hasilnya akan sama saja.

Oleh karena itu jangan jadi pelupa, sehingga bisa mengnonaktifkan _boot menu_ muncul. Gunakan aplikasi untuk memanajemen _password_ seperti [keepassxc](https://keepassxc.org) untuk membantu.

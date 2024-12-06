---
title: Menginstall OpenBSD di VPS berbasis Linux
ringkasan: "Provider tidak menyediakan OS OpenBSD dan atau ingin menginstall sendiri?"
date: 2024-12-06
tags:
  - jurnal
  - bsd
  - tutorial
  - fave
keywords: "openbsd, vps, tutorial, jagoan hosting, bsd, linux, cara install, xtermjs"
kategori: jurnal
code: true
favorit: false
comment: false
tocx: false
---


Di artikel sebelumnya saya sudah bisa menginstall FreeBSD di VPS Jagoan Hosting yang pakai xtermjs sebagai web console-nya. Lalu bagaimana jika menginstall OS BSD lainnya seperti OpenBSD?

Ini agak rumit, karena OpenBSD tidak memiliki mfsBSD atau setara, jadi satu - satunya cara adalah dengan melakukan operasi penimpaan disk dengan _image_ dari OpenBSD dengan `dd`. Tapi inipun juga akan jadi masalah karena proses instal harus dilanjutkan dengan console sementara akses ke dalam console tidak bisa dilakukan. Xtermjs tidak akan bisa tersambung ke _installer_ OpenBSD.

Saya sudah mencoba, setelah selesai menimpa disk dan membuka xtermjs untuk melanjutkan proses _installation_, hanya muncul layar hitam/_blank_ saja. Persoalannya sama, xtermjs tidak bisa membaca _console output_ dari OpenBSD.

Emang aneh banget Jagoan Hosting ini pakai xtermjs dibandingkan NoVNC. Apalagi tampilan xtermjs juga ga bagus - bagus banget, font dengan ligature (seperti huruf g, y, j ) tidak bisa dirender dengan baik, termasuk karakter `_` tidak akan kelihatan/terbaca.

Jadi bagaimana?

Ya harus merubah _boot_ OpenBSD agar bisa jalan di _serial console_ dan ini artinya harus membedah isi _file installer_ dan merubah pengaturan di _boot file_. Terdengar komplek dan susah kan? Awokwokwok.

Secara garis besar caranya sebagai berikut:
1. _Mount file installer_ OpenBSD (biasanya dalam format `.img`),
2. _Edit file_ `boot.conf` dan masukkan pengaturan _serial console_
3. _Umount_ atau _repackaging_

tapi masih ada _problem_ lainnya yaitu operasi ini tidak bisa (sulit) untuk dilakukan dari dalam OS Linux (apa saja), masih memungkinkan jika dilakukan di FreeBSD namun paling mudah dilakukan dari dalam OpenBSD sendiri.

Saya akan menunjukkan 2 cara yang semua dilakukan dari BSD, namun sebelum itu mari diunduh dulu bahannya. Disini saya akan pakai file `miniroot76.img` yang bisa diunduh dari [halaman download OpenBSD](https://www.openbsd.org/faq/faq4.html#Download) , karena saya pakai arsitektur 64 bit maka saya pilih `miniroot76.img` AMD64.

Saya pilih _file_ `miniroot76.img` karena _file_ ini paling ringan (tidak menyertakan _sets_ yang nantinya bisa diunduh saat proses _install_).

```shell-session
$ wget https://cdn.openbsd.org/pub/OpenBSD/7.6/amd64/miniroot76.img
```

### Modifikasi dengan OpenBSD

Dalam hal ini saya mempergunakan OpenBSD yang berjalan dari dalam VM, saya mempergunakan [UTM](https://mac.getutm.app/) untuk membuat VM OpenBSD. Jika memiliki VirtualBox maka bisa juga dipakai.

OpenBSD menyediakan fungsi [vnconfig (8)](https://man.openbsd.org/vnconfig) untuk membuat _vnode disk_ dan kemudian bisa di-_mount_ untuk bisa diakses. Maka dengan ini caranya adalah:

1. Buat _vnode disk_ dengan bahan `miniroot76.img`yang sudah diunduh tadi,
```shell-session
$ doas vnconfig -c vnd0 miniroot76.img
```
`vnd0` adalah nama _disk_ yang dibuat dengan `vnconfig`

2. Kemudian _mount_ `vnd0` agar bisa diakses
```shell-session
$ doas mount /dev/vnd0 /mnt
```

3. _Edit file_ `boot.conf` agar bisa membaca _serial console_, (jika _file_ `boot.conf` tidak ada bisa dibuat dengan manual)
```shell-session
$ doas mkdir /mnt/etc
$ doas echo "set tty com0" > /mnt/etc/boot.conf
```

4. _Umount disk_ dan hapus _vnode disk_
```shell-session
$ doas umount /dev/vnd0
$ doas vnconfig -u vnd0
```

Sampai disini maka file `miniroot76.img` sudah bisa ditimpakan ke _disk_ dan di-_install_.

### Modifikasi dengan FreeBSD

Jika di OpenBSD ada `vnconfig`, maka di FreeBSD ada [mdconfig(8)](https://man.freebsd.org/cgi/man.cgi?mdconfig(8)) yang bisa dipakai. Caranya sebagai berikut:

1. Cek apakah _vnode disk_ sudah dibuat dan buat _vnode disk_ baru,
```shell-session
$ doas mdconfig -l
$ doas mdconfig -a -t vnode -f miniroot76.img
md0
```
proses pembuatan _vnode disk_ menghasilkan _disk_ baru dengan nama `md0`.

2. Periksa daftar partisi yang ada di dalam `md0`
```shell-session
$ doas gpart show md0
=>    1  11391  md0  MBR  (5.6M)
      1     63       - free -  (32K)
     64    960    1  efi  (480K)
   1024  10368    4  !166  [active]  (5.1M)
```
tersebut ada 1 partisi dan 2 _slices_, yang pertama adalah `efi` (tidak perlu utak atik yang ini) dan yang kedua adalah _slice_ 4 lokasi _boot file_.

3. _Mount slice 4_ dan buat _file_ `boot.conf`
```shell-session
$ doas mount /dev/md0s4
$ cd /mnt
$ doas mkdir etc
$ doas echo "set tty com0" > etc/boot/conf
```

4. _Umount_ `md0` dan selesai
```shell-session
$ umount /dev/md0
$ mdconfig -d -u md0
```

Sampai disini maka file `miniroot76.img` sudah bisa ditimpakan ke _disk_ dan di-_install_.

Cukup mudah bukan?

Jika tidak maka bisa kok _build_ ISO _images_ sendiri di lokal atau di VPS dengan OS Linux kemudian _install_ di VPS dengan Qemu. Caranya?

_Clone repository_ [openbsd-cloud-image](https://github.com/hcartiaux/openbsd-cloud-image) kemudian tuju folder `custom` dan rubah isi dari _file_ `install.conf`, selanjutnya tinggal jalankan di konsol perintah sebagai berikut (saya pakai yang partisi minimalis saja).

```shell-session
`./build_openbsd_qcow2.sh -r '7.6 --image-file 'openbsd-min.qcow2' --size '20' --disklabel 'custom/disklabel.cloud' --sets '-game*.tgz -x*.tgz' --allow_root_ssh 'no' -b`
```

perintah ini akan membuat sebuah _file_ `.qcow2`dengan ukuran _disk_ 20GiB (sesuaikan dengan ukuran _disk_ di VPS) yang bisa ditulis ke disk dengan bantuan `qemu-tools`.

```shell-session
$ qemu-img convert -f qcow2 -O raw openbsd-min.qcow2 openbsd-min.raw
$ sudo dd if=openbsd-min.raw of=/dev/sda bs=4M status=progress
$ sync
```

Kemudian reboot dan bisa langsung kebuka menu login OpenBSD. Login dengan _username_ dan _password_ yang sudah diatur di _file_ `install.conf` sebelumnya.

Bingung? silakan sampaikan pertanyaan ke [poes@egois.org](https://sok.egois.org) di fediverse.

### Penutup

Cara diatas adalah beberapa cara untuk menginstall OpenBSD di VPS berbasis Linux, sebenarnya sangat mudah asal _provider_ memakai NoVNC untuk konsolnya, yang menjadi masalah sebenarnya adalah pemakaian xtermjs.

Jika tidak mau repot, saran saya sebaiknya hindari VPS yang memakai xtermjs. Kalaupun terpaksa minta saja bantuan _support_ untuk meng-_install_-kan OS yang diinginan (jika _support_ mau).

Tapi intinya adalah mau kondisi apa saja, jangan sampai menghalangi kita untuk memakai OS yang kita inginkan. Kalo memang sudah mentok, ganti _provider_ saja. :)

_Provider_ lokal yang saya rekomendasikan [Neva Cloud](https://nevacloud.com) dan [Ide.id](https://ide.id).

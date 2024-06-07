---
title: Migrasi Jail antar VPS dengan BastilleBSD
ringkasan: "sebelumnya memindahkan container tak pernah semudah dan secepat ini"
date: 2024-05-07
tags:
  - jurnal
  - bsd
  - tutorial
keywords: "freebsd, jail, vps, tutorial, vultr, bsd"
kategori: jurnal
code: true
favorit: true
comment: true
tocx: true
---

### Migrasi Jail dari VPS ke VPS lainnya

Karena suatu alasan, saya perlu untuk migrasi VPS kembali setelah sebelumnya migrasi dari BiznetGio ke Vultr. Tidak ada masalah dengan Vultr, service mereka _excellent_ tapi karena tidak setuju dengan TOS-nya membuat saya memikirkan untuk pindahan (meski TOS sudah diganti [setelah viral](https://news.ycombinator.com/item?id=39836495)).

Di VPS Vultr saya mempergunakan OS FreeBSD 14.0 dan membuat beberapa Jail’s untuk menaruh aplikasi web yang saya pergunakan, diantaranya adalah [GotoSocial](https://gotosocial.org) dan [Snac2](https://codeberg.org/grunfink/snac2) untuk instance [fediverse](https://en.wikipedia.org/wiki/Fediverse), kemudian untuk _self host comment system_ , dan untuk landing page subdomain gratisan dari [afraid.org](https://freedns.afraid.org/) (keduanya tidak aktif). Sebagai catatan semua jail’s tersebut saya buat dengan mempergunakan [BastilleBSD](https://bastillebsd.org) dan proses perpindahan ini juga memanfaatkan fitur `export` dan `import` dari BastilleBSD.

Untuk pengguna _jail management_ lainnya seperti ezjail, iocage, cbsd, dan sebagainya juga memiliki fitur yang sama (bisa merujuk ke masing - masing dokumentasinya).

```sh
$ doas pkg update
$ doas pkg install bastille
$ bastille --version
0.10.20231125
```

Secara garis besar prosesnya adalah melakukan _archives_ terhadap container tersebut dengan perintah `export` dan kemudian melakukan _unachives_ dengan perintah `import`. Perintah ini biasanya juga dipakai untuk mem-_backup_ sebuah container.

Saya akan membagi 2 bagian untuk menandakan masing - masing VPS, yaitu VULTR untuk VPS Vultr dan NEVA untuk VPS NevaCloud.

### VULTR

Hal pertama yang perlu dilakukan adalah mendapatkan data jail yang tersedia, bisa dengan mempergunakan perintah sebagai berikut:

```shell
$ doas bastille list all
JID     State  IP Address   Published Ports  Hostname  Release          Path
 kauaku  Up     192.168.1.2  -                kauaku    14.0-RELEASE-p6  /usr/local/bastille/jails/kauaku/root
 snac2   Up     192.168.1.4  -                keboh     14.0-RELEASE-p6  /usr/local/bastille/jails/snac2/root
```

 <aside>
  saya memakai <code>doas</code> untuk elevasi ke <code>root</code>. App ini setara dengan <code>sudo</code> tapi lebih ringan dan memiliki keamanan lebih baik.
 </aside>

Tersebut saya mempunya 2 container/jail’s yang sedang aktif (`up`) dan sebagai contoh saya akan memindahkan jail `kauaku` ke VPS NEVA. Sebelum memulai ekspor, container harus dimatikan dulu untuk menjaga integritas data.

```sh
$ doas bastille stop kauaku
[kauaku]:
kauaku: removed
$ doas bastille export --txz kauaku
Exporting 'kauaku' to a compressed .txz archive...
  100 %       1100.7 MiB / 1230.0 MiB = 0.895    8.4 MiB/s       2:48
Exported '/usr/local/bastille/backups/kauaku-05-07-114627.txz' successfully.
```

 <aside>
  BastilleBSD adalah <i>wrapper</i> dari <code>jls</code>(<a href="https://man.freebsd.org/cgi/man.cgi?jls(8)">8</a>) yang merupakan <i>jail manager</i> bawaan dari FreeBSD, sehingga ada perintah lain yang bisa dipergunakan untuk melakukan ekspor dan impor.
 </aside>

Saya mempergunakan _option_ `—txz` untuk membuat _archive_ dengan kompresi `.txz` karena saya mempergunakan UFS sebagai _file system_, jika mempergunakan ZFS maka bisa mempergunakan `gz`, `raw`, maupun `xz`. Hasil ekspor akan disimpan di folder `backups` di `/usr/local/bastille`.

Untuk mempermudah maka saya copy hasil ekspor tadi ke home folder.

```sh
$ cp /usr/local/bastille/backups/kauaku-05-07-114627.txz /home/poes
```

Sampai disini proses yang diharus dilakukan di dalam VPS VULTR sudah selesai.

### NEVA

Di Neva saya juga mempergunakan OS FreeBSD, bedanya adalah saya perlu mengupgrade secara manual karena di Neva hanya tersedia versi 13.0. Setelah selesai dan install BastilleBSD, maka yang harus dilakukan pertama kali adalah mengunduh file backup dari container/jail kauaku tadi. Disini saya pergunakan perintah `scp` untuk mengunduh via `ssh`

```sh
$ mkdir container && cd container
$ scp poes@VULTR:/home/poes/kauaku-05-07-114627.txz .
poes@VULTR passwod:
```

Setelah selesai maka di folder `container` akan tersedia file `kauaku-05-07-114627.txz` dan proses ekstrak bisa dilakukan

```sh
$ ls
kauaku-05-07-114627.txz
$ doas bastille import /home/neva/container/kauaku-05-07-114627.txz
```

sebagai catatan bastille mengsyaratkan full path untuk menentukan file yang akan di import. Proses import akan segera berjalan dengan bastille mengurai file tersebut, Bastille BSD akan mengimpor semua file dan konfigurasi sama persis dengan aslinya. Saat selesai maka bisa dikonfirmasi apakah container kauaku sudah terdaftar dan bisa dijalankan.

```sh
$ doas bastille list all
JID     State  IP Address   Published Ports  Hostname  Release          Path
 kauaku  Up     192.168.1.2  -                kauaku    14.0-RELEASE-p6  /usr/local/bastille/jails/kauaku/root
```

Selesai, proses migrasi container/jail sudah usai, tapi masih ada beberapa pekerjaan kecil untuk membetulkan konfigurasi terutama di bagian jaringan. Apalagi setiap VPS akan memiliki konfigurasi berbeda.

Jalankan dan chroot ke console container kauaku untuk melakukan sedikit perubahan `nameserver` di file `/etc/resolv.conf`.

```shell
$ doas bastille start kauaku
[kauaku]:
kauaku: created
$ doas bastille console kauaku
[root@kauaku] vim /etc/resolv.conf
# nameserver 9.9.9.9
# nameserver 1.1.1.1
[root@kauaku] pkg update
```

Jika VPS tidak menyediakan DNS lookup atau nameserver sendiri, saya merekomendasikan untuk pakai nameserver dari [Quad9](https://quad9.net) maupun [Cloudflare](https://cloudflare.com). Terakhir lakukan update dan upgrade package jika diperlukan.

### Penutup

BastilleBSD menyediakan cara yang mudah untuk migrasi dengan `export`-`import` ini. Sebelumnya saya memakai cara manual untuk migrasi yang tentu membutuhkan waktu yang lebih lama dan kemungkinan _error_ lebih besar, dengan BastilleBSD semua hanya butuh waktu kurang dari 10 menit sampai container/jail terpasang dan bisa berjalan dengan baik.

Terakhir, agar situs/layanan bisa berjalan dengan baik saya perlu merubah DNS Record untuk domain yang terhubung. Bisa dilakukan di Domain Management. Perubahan ini tentu memerlukan waktu untuk propagansi, biasanya proses propagansi bisa dimonitor melalui [DNSChecker](https://dnschecker.org/).

Selain itu juga perlu mengatur load balancer/reverse proxy serta request sertifikat SSL/TLS yang bisa dilayani dengan gratis oleh CertBot. Saya pribadi mempergunakan nginx sebagai load balancer. Untuk tutorial yang bagus
bisa merujuk ke [tutorial di DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04).

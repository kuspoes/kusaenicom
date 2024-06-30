---
title: Menambah block storage di FreeBSD
ringkasan: "Cara menambahkan _block storage_ dan meng*attach*nya ke jail di FreeBSD"
date: 2024-06-25
tags:
  - tutorial
  - bsd
kategori: jurnal
code: true
favorit: false
comments:
  src: "https://poestodon.deno.dev/@poes/statuses/01J1H5A14TM0945CBM9N61C8F1"
templateEngine: vto, md
---

2 bulan terakhir ini saya mempergunakan [NevaCloud](https://nevacloud.com/) sebagai penyedia layanan VPS setelah pindahan dari Vultr karena beberapa pertimbangan.

Neva memberikan spesifikasi CPU 1 core, 1Gb Ram, dan 20Gb _storage_ yang saya rasa cukup untuk urusan _self host_ aplikasi [fediverse](https://en.wikipedia.org/wiki/Fediverse) seperti [gotosocial](https://github.com/superseriousbusiness/gotosocial) dan [snac2](https://codeberg.org/grunfink/snac2). Biaya layanan sebesar 48 ribu rupiah per bulan. Sedikit lebih murah dibandingkan kompetitor dengan penawaran spesifikasi serupa.

{{ echo |> terkait("Migrasi FreeBSD Jail dengan Bastille", "/jurnal/migrasi-FreeBSD-Jail-dengan-Bastille", "full") }}
Karena suatu alasan, saya perlu untuk migrasi VPS kembali setelah sebelumnya migrasi dari BiznetGio ke Vultr.
{{ /echo }}

Di Vultr dan Gio sebelumnya saya sudah memiliki instan gotosocial dengan banyak _post_ dan interaksi yang membuat ukuran database sqlite yang saya gunakan membengkak besar. Sehingga saat dipindahkan langsung memenuhi _storage_ yang tersedia [^1].

Kemudian saya berencana menghentikan _instance_ gotosocial ini ke depannya, namun <mark>tidak berniat untuk menghapus instance</mark>. Tanggal pastinya kapan belum tau tapi kemungkinan sekitar Januari 2025 (saat domain habis).

Di sisi yang lain saya juga sudah membeli domain baru pengganti untuk instan gotosocial yang rencananya akan saya pasang aplikasi fedi antara gotosocial atau snac2 namun muncul permasalahan _storage_ yang sudah menipis.

Neva memberikan layanan tambahan berupa [block storage](https://nevacloud.com/block-storage/) yang bisa di*attach* ke VPS untuk memberikan tambahan spasi _storage_. Harganya dimulai 20 ribu per bulan untuk 10Gb _storage_ atau sekitar 2 ribu rupiah per 1Gb-nya.

Saya memanfaatkan layanan ini untuk menambah _storage_ pada VPS yang saya pergunakan. Prosesnya cepat, setelah pembayaran _block storage_ tersebut langsung tersedia untuk dipergunakan.

Tapi timbul masalah.

Ternyata tidak langsung bisa dipergunakan karena _block storage_ dalam format RAW dan harus dipersiapkan terlebih dahulu (diformat). Neva menyediakan tutorial pemasangan namun sayangnya hanya untuk Linux (Debian). Tapi tak masalah saya akan pasang di FreeBSD.

### Memasang _block storage_ di FreeBSD

Sesuai tutorial di Neva, _block storage_ akan ditandai sebagai `/dev/sdb` namun di FreeBSD tentu berbeda. Untuk itu saya perlu mencari tau *devices*nya.

```bash
poes@jaeger:~$ doas camcontrol devlist
<QEMU QEMU DVD-ROM 2.5+>        at scbus0 target 0 lun 0 (pass0,cd0)
<QEMU QEMU HARDDISK 2.5+>       at scbus2 target 0 lun 0 (pass1,da0)
<QEMU QEMU HARDDISK 2.5+>       at scbus2 target 1 lun 0 (pass2,da1)
```

Dari perintah diatas tersebutlah bahwa _block storage_ yang saya miliki terdaftar sebagai QEMU HARDDISK di `/dev/da1`. Langkah selanjutnya adalah membuat partisi baru (UFS).

```bash
poes@jaeger:~$ doas newfs /dev/da1
/dev/da1: 10240.0MB (20971520 sectors) block size 32768, fragment size 4096
using 17 cylinder groups of 625.22MB, 20007 blks, 80128 inodes.
super-block backups (for fsck_ffs -b #) at:
192, 1280640, 2561088, 3841536, 5121984, 6402432, 7682880, 8963328, 10243776, 11524224, 12804672, 14085120, 15365568, 16646016, 17926464, 19206912, 20487360
```

Untuk memastikan bahwa partisi sudah selesai dibuat, saya memeriksanya dengan `gpart`.

```bash
poes@jaeger:~$ doas gpart show da1
=>      63  20971457  da1  MBR  (10G)
        63  20964762    1  freebsd  [active]  (10G)
  20964825      6695       - free -  (3.3M)
```

OK! partisi sudah aktif, saatnya untuk melakukan `mounting` pada partisi tadi.

```bash
poes@jaeger:~$ doas mkdir /mnt/monster
poes@jaeger:~$ doas mount -t ufs /dev/da1 /mnt/monster
poes@jaeger:~$ ls -ltr /mnt/monster
total 0

poes@jaeger:~$ df -h
Filesystem                        Size    Used   Avail Capacity  Mounted on
/dev/gpt/rootfs                   19G      14G     4.3G   76%    /
devfs                             1.0K      0B    1.0K     0%    /dev
/dev/da1                          9.7G    8.0K    8.9G     0%    /mnt/monster
```

<aside>
Buat folder untuk <i>mount point</i> kemudian <code>mount</code> <i>device block storage</i> ke <i>mount point</i> dan pastikan sudah masuk ke dalam sistem dengan perintah <code>df -h</code>
</aside>

Selesai! Akhirnya _block storage_ bisa ditambahkan ke dalam sistem FreeBSD dan bisa diakses secara langsung. Tapi setiap sistem _reboot_ saya perlu untuk mengulang perintah diatas agar _storage_ bisa diakses. Agar tak perlu repot, saya _edit file_ `/etc/fstab` agar bisa melakukan `mounting` saat _booting_.

```bash
poes@jaeger:~$ doas vim /etc/fstab
# Device        Mountpoint  FStype  Options Dump    Pass#
/dev/gpt/rootfs /            ufs     rw  1   1
/dev/da1        /mnt/monster ufs     rw  2   2
```

### Jail dan _block storage_

{{ echo |> terkait("FreeBSD di Raspberry Pi4", "/jurnal/raspberry-pi4-di-freebsd/#jail%E2%80%99s") }}
... Jails adalah sejenis container yang dibangun diatas konsep chroot untuk menciptakan sebuah safe environtment yang terisolasi dari sistem utama...
{{ /echo }}

Sesuai rencana, saya akan memakai _storage_ monster di Jail. Saya membuat 1 Jail khusus sebut saja namanya **egois**. Tentang cara membuat Jail pernah saya tuliskan di artikel yang lain.

Setelah Jail dibuat selanjutnya adalah membuat folder di dalam Jail tersebut yang nantinya akan dijadikan `mount point` dan menyambungkannya dengan _device block storage_.

Secara garis besar, prosesnya mirip dengan cara diatas, bedanya memakai _file_ `/etc/fstab` yang ada di dalam Jail.

```bash
poes@jaeger:~$ doas bastille cmd egois mkdir hanggar
poes@jaeger:~$ doas bastille mount egois /mnt/monster root/hanggar nullfs rw 0 0
[egois]:
Added: /mnt/monster /usr/local/bastille/jails/egois/root/root/hanggar nullfs rw 0 0
```

<aside>
Seluruh perintah diatas dijalankan dari Host.
</aside>

Mantap, sekarang setiap _file_ yang ditaruh di dalam folder `hanggar` di dalam Jail akan tersimpan di dalam _block storage_ saya.

---

[^1]: Apalagi saya sudah tidak memakai layanan S3 untuk menyimpan media melainkan mempergunakan _local storage_ untuk meladeninya.

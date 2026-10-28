---
title: "FreeBSD - Jika gagal boot karena disk tidak clean"
ringkasan: "Cara mengatasi FreeBSD yang tidak bisa boot karena disk bermasalah dan perlu `fsck`"
date: 2026-10-28
tags:
  - jurnal
  - bsd
  - tutorial
  - freebsd
keywords: "freebsd, vps, tutorial bsd, linux, tidak bisa boot"
kategori: jurnal
relasi: freebsd
code: true
favorit: false
---

Ane tidak tahu kenapa tiba - tiba box VPS FreeBSD tewas secara mengenaskan!. Ketika ane cek dengan SSH tidak bisa terhubung, kemudian ane cek ke informasi *maintenance* Greencloud tidak ada informasi sedang dalam perbaikan.

Setelah masuk ke [Dashboard Greencloud](https://greencloudvps.com/billing/aff.php?aff=8753
), ane temukan sistem berjalan dengan baik atau menyala namun saat aktifkan VNC dan buka web VNC ditemukan bahwa sistem bermasalah dan behenti di proses *booting* dengan log seperti ini

```txt
pass1 at vtscsi3 bus 0 scbus11 target 0 lun 0
pass1: ‹QEMU QEMU TARGET 2.5> Fixed Uninstalled SPC-3 SCSI device (offline)
pass1: 300.000MB/s transfers
pass1: Command Queueing enabled
da0: Write Protected
uhubo: 2 ports with 2 removable, self powered
Dual Console: Serial Primary, Video Secondary
WARNING: /mnt/jail was not properly dismounted
ugenO.2: ‹QEMU QEMU USB Tablet› at usbusO
usbhid0 on uhubO
usbhid0: ‹QEMU QEMU USB Tablet, class 0/0, rev 2.00/0.00, addr 2> on usbus0
hidbus0: ‹HID bus> on usbhid0
```

Dari *boot message* tersebut ada 1 pesan **WARNING** yang menarik yaitu diska dengan partisi `/mnt/jail` tidak dilepas dengan benar, artinya kemungkinan besar menyebabkan diska menjadi korup atau tidak `clean`. 

Cara memperbaiki hal ini dengan cara melakukan `fsck` atau *file system check*, proses ini harus dilakukan dengan cara *boot* ke *single mode*. Sederhana namun masalahnya adalah dengan web VNC ~~cukup~~ sangat sulit mendapatkan FreeBSD Bootloader Menu tampil karena saat web VNC terhubung posisi *booting* sudah masuk ke *boot messages*. Ane coba ulang beberapa kali namun tetap gagal, akhirnya pakai cara lain yaitu dengan mempergunakan *rescue disk* yang untungnya GreenCloud menyediakan *rescue disk* dengan ISO FreeBSD selain ISO Linux. Mantap!

Atur *boot order* agar CD-ROM menjadi yang pertama dan *mount/insert* ISO FreeBSD kemudian *boot* dengan pengaturan ini. Setelah selesai *booting* akan muncul menu `bsdinstall` abaikan saja dan pilih **Live CD** yang akan membawa ke dalam *shell* dengan *user* `root`.

Hal pertama yang harus dilakukan adalah mencari data partisi, ane gunakan perintah `gpart show` hasilnya seperti berikut:

```shell-session
# gpart show
=>      40  41942960  vtbd0  GPT  (20G)
        40      1024      1  freebsd-boot  (512K)
      1064    524288      2  efi  (256M)
    525352   1048576      3  freebsd-swap  (512M)
   1573928  40369072      4  freebsd-ufs  (19G)

=>        40  1048575920  vtbd1  GPT  (500G)
          40     2097152      1  freebsd-swap  (1.0G)
     2097192   167772160      2  freebsd-ufs  (80G)
   169869352   104857600      3  freebsd-ufs  (50G)
   274726952   564133888      4  freebsd-ufs  (269G)
   838860840   209715120      5  freebsd-ufs  (100G)
```

ada 2 disk dengan banyak partisi di dalamnya, yang pertama perlu diperbaiki adalah disk `vtbd0` karena di situ ada partisi `/` di `/dev/vtbd0p4` maka ane lakukan pemeriksaan *file system* dengan `fsck` di semua partisi kecual partisi dengan label `freebsd-boot`, `efi`, dan `freebsd-swap`.

```shell-session
# fsck -y -f /dev/vtbd0p4
```

Prosesnya tergantung ukuran diska dan seberapa banyak *files* yang korup. Tapi tunggu saja sampai selesai, opsi `-y` akan membantu menjawab pilihan dengan YES pada setiap pertanyaan sedangkan opsi `-f` untuk memaksa pemeriksaan dilakukan ke diska tersebut meski sistem mengakuinya sebagai diska yang *clean*.

Jika sudah selesai akan muncul info <mark>**FILE SYSTEM CLEAN**</mark> atau <mark>**FILE SYSTEM WAS MODIFIED**</mark> sebagai penanda bahwa proses telah selesai dan berhasil. Kemudian ane ulangi untuk partisi - partisi lainnya.

```shell-session
# fsck -y -f /dev/vtbd1p2
# fsck -y -f /dev/vtbd1p3
# fsck -y -f /dev/vtbd1p4
# fsck -y -f /dev/vtbd1p5
```

Setelah selesai semua, ane atur supaya sistem melakukan pemeriksaan mandiri saat *booting* jika ada ditemukan masalah di *file system* tanpa harus menunggu penanganan manual. Caranya dengan menambahkan `fsck_y_enable=YES`.

```shell-session
# mount /dev/vtbd0p4 /mnt
# echo "fsck_y_enable=YES" > /mnt/etc/rc.conf
```

Kemudian *shutdown* sistem, kembali ke Dashboard GreenCloud dan rubah *boot order* agar sistem utamakan *boot* dari HDD/SSD. Selesai.

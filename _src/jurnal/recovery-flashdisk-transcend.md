---
title: Recovery flashdisk Transcend yang mati total
ringkasan: "Cara untuk menghidupkan kembali flashdisk yang rusak bootloadernya"
date: 2025-10-18
tags:
  - kusaeni
  - tutorial
kategori: jurnal
code: true
favorit: false
comment: true
keywords: flashdisk, matot, rusak, recovery, transcend, tutorial
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01K5HB8BQJJPVT4HV1A2SH3M6X
  real: https://sok.egois.org/@poes/statuses/01K5HB8BQJJPVT4HV1A2SH3M6X
---

Sudah lebih dari 8 tahun ane punya Flashdisk Transcend JetFlash 64GB, _flashdisk_ ini termasuk kuat dan handal karena ane pakai dengan cara bar - bar. Pernah ikut kecuci di mesin cuci dan pernah jatuh berkali - kali tapi _flashdisk_ ini bisa bertahan dan tetap bisa dipergunakan dengan baik. Namun baru saja ane mengalami hal yang sempat membuat ane harus ikhlas jika Flashdisk Transcend JetFlash harus rusak untuk selamanya.

Ceritanya seperti ini.

## Kenapa bisa rusak?

Di tempat kerja ane ada server bekas yang dulu kala dipakai untuk _file server_ [Samba](https://www.samba.org/), ditenagai dengan prosesor Intel Pentium 4, 2x 512MB RAM, 80GB HDD dan OS Centos 4.3 pernah jadi andalan untuk berbagi _file_ jaman dulu. Setelah hampir 10 tahun kemudian akhirnya server ini diparkir dan digantikan dengan _file server_ dari Synology. Setelah ini praktis server ini sudah tidak dinyalakan.

Tapi beberapa hari yang lalu, tiba - tiba kami membutuhkan data yang ternyata tidak di*backup* ke Synology dan masih tersimpan di dalam server Samba ini. Sehingga mau tidak mau server ini terpaksa dibangkitkan lagi dari tidur panjangnya dan harus bekerja lagi.

_Long story short_ setelah pembersihan dan perbaikan di sana dan di sini akhirnya server ini menyala dan ane bisa _browse_ ke dalam Centos untuk langsung menuju ke folder tempat _file sharing_ berada untuk menyalin data yang dibutuhkan. Setelah dihitung data yang perlu diambil sekitar 60Gb. Cara pengambilannya ada beberapa cara diantaranya yang menjadi opsi adalah dengan menyalin data lewat _network_ dan yang kedua mempergunakan _external disk_.

Cara yang pertama tidak ane ambil dengan pertimbangan karena akan butuh banyak waktu untuk mengunduh _files_ dari jaringan dan ane pilih cara kedua dengan mempergunakan _external disk_. Problemnya ane ada SSD _eksternal_ dengan colokan type C sedangkan server cuma ada USB 2.0 saja, pasang konverter sambungan? bisa tapi muncul masalah kedua, Centos tidak support membaca SSD!!!. Biasanya masalah seperti ini mudah saja untuk diselesaikan tapi OS Centos ini ketinggalan jaman, masih versi 4.3 yang sudah lewat masa dukungannya kira - kira 15 tahun yang lalu. Hal ini menyebabkan Centos tidak bisa mengunduh _packages_ yang dibutuhkan untuk membaca SSD.

Masalah selanjutnya adalah kernel Centos 4.3 tidak banyak mendukung jenis _file system_, dalam hal ini seperti `exFAT` maupun `NTFS`. Sedangkan _file system_ yang didukung adalah `FAT` dan keluarga `extfs`. Karena ini seharusnya ane meng*format* ulang SSD tapi tidak ane lakukan karena ada data ~~cukup~~ penting di dalamnya. Sehingga ane mencari substitusi disk lainnya dan ketemu dengan pakai USB Flashdisk 64Gb.

Setelah mem*backup* dan meng*format* ulang _flashdisk_ ke `FAT32`, kemudian ane pasang ke server. Tidak ada masalah dengan Centos untuk mendeteksi disk ini dan langsung dikenali sebagai Generic USB Disk di `/dev/sdb1`. Agar bisa untuk ditulisi data nantinya, ane _mount flashdisk_ ini dengan cara:

```shell-session
# mkdir -p /mnt/transcend
# mount -t fat32 /dev/sdb1 /mnt/transcend
```

maka _flashdisk_ bisa diakses di `/mnt/transcend`. Untuk proses _backup_ sederhana saja, ane _copy - paste_ data dari `/opt/samba` (folder samba file sharing) ke _flashdisk_.

```shell-session
# cp -r /opt/samba /mnt/transcend
```

Proses _backup_ berjalan di*background*, bisa ane tinggal minum teh. Beberapa menit kemudian ane cek *progress*nya dan menemukan kalo ada masalah I/O _error_ dan _system_ tidak responsive. Ane mencoba mendapatkan akses lagi ke _system_ tapi tidak bisa, terpaksa ane _hard reboot_ servernya dan _Viola!!! system crash_ dan USB tidak bisa ditemukan.

Ane langsung cabut _flashdisk_ dan memasangnya di laptop Windows, namun tetap saja tidak terdeteksi. Di Disk Management hanya muncul drive D: No Media. Ini adalah indikasi bahwa _flashdisk_ sudah rusak. Setiap ditancap ke _port_ USB, Windows mendeteksinya sebentar dan kemudian hilang. Perlu kecepatan tangan untuk mencoba _assign drive letter_, ane coba atur ke _drive_ K. Namun tetap saja _drive_ ini hanya muncul sebentar dan kemudian hilang.

Tapi ane tidak yakin kalo rusak fisiknya (meski bisa saja karena _overload voltage_ di _port_ USB server) dan ini hanya partisi, _bootloader_ yang rusak sehingga masih bisa diperbaiki.

## Recovery

Sebenarnya ane sudah banyak pengalaman dalam memperbaiki _flashdisk_ tapi sudah hampir 10 tahun tidak pernah lagi melakukannya sehingga lupa - lupa ingat. Hasil pencarian di Google kebanyakan hanya menampilkan artikel dari vendor _software recovery data_ yang pada akhirnya adalah jualan aplikasi.

Ane coba beberapa aplikasi seperti Mini Tools, Easus, dan Aoemi Recovery namun tidak ada yang berhasil mungkin karena pakai yang versi gratis. Hampir semua bisa mendeteksi _flashdisk_ namun tidak bisa melakukan operasi apapun.

Kedua, ane coba dengan _tools_ bawaan Microsoft Windows yaitu Disk Management dan `diskpart`. Sayangnya Disk Management selalu _not responding_ setiap mencoba membaca deskripsi _flashdisk_. Sedangkan diskpart tidak bisa membaca _flashdisk_ dan menganggapnya sebagai `no media`.

Ketiga, ane coba dengan _tools_ [Flashbot.ru](https://flashboot.ru/) yang punya aplikasi unik untuk meng*flash firmware* tapi tidak ada satupun yang cocok.

![Testdisk](https://ik.imagekit.io/hjse9uhdjqd/jurnal/recoveryFd/SCR-20251018-ibdj_tLX00Tgpy.png?updatedAt=1760751869234)

Cara selanjutnya dengan mempergunakan [TestDisk](https://www.cgsecurity.org/wiki/TestDisk) yang sangat _powerfull_ untuk _recovery data_ maupun partisi. TestDisk bisa mendeteksi _flashdisk_ dengan sangat baik tapi tidak bisa menemukan partisi yang seharusnya. Saat mencoba fungsi analisa, TestDisk menemukan _bad sector_ di setiap sektornya. Di titik ini ane sudah putus asa dan mulai bersiap ikhlas kalo _flashdisk_ ini sudah tidak bisa diselamatkan.

![JetFlash Online Recovery](https://ik.imagekit.io/hjse9uhdjqd/jurnal/recoveryFd/JetFlash_OnlineRecovery_2_KBIoqwVJv.JPG?updatedAt=1760751825359)

Tapi sebelum itu ane coba cari _tools_ dari produsen _flashdisk_ yaitu Transcend yang ternyata menyediakan aplikasi untuk _flashing firmware_ bernama [JetFlash Online Recovery](https://www.transcend-info.com/support/software/jetflash-online-recovery). Ada 2 pilihan aplikasi yaitu JetFlash Series dan JetFlash 620. Karena ane tidak tahu pasti serienya ane pilih versi _legacy_ yaitu JetFlash Series. Setelah selesai di*install* ane jalankan aplikasi dan kemudian tancapkan *flashdisk*nya. Begitu terdeteksi, aplikasi langsung mengunduh _firmware_ secara _online_ sehingga akses internet memang dibutuhkan saat memakai aplikasi ini.

Prosesnya[^1] tidak bisa langsung selesai, kira - kira sampai di 60% dan kemudian aplikasi menyatakan bahwa proses _flashing_ gagal. Saat ane cek di Windows Explorer, di _drive tree_ di _sidebar_ sekarang muncul _drive_ K: dan tidak hilang lagi. Pertanda baik meski saat ane klik ada _error_ bahwa _drive_ tidak bisa diakses.

Ane coba lagi, proses _stuck_ di 20% dan butuh waktu beberapa lama sampai kemudian bisa lanjut sampai ke 99%. Namun muncul pesan lagi kalo proses gagal dan aplikasi meminta _flashdisk_ dicabut dan dipasang ulang. Setelah dipasang ulang, di _drive tree_ muncul _drive_ D:!. Ini tandanya bahwa UUID dari _flashdisk_ sudah berubah sehingga Windows tidak mendeteksinya di _drive_ K.

Ketika diklik, muncul pesan bahwa _drive_ tidak bisa dipakai karena tidak diformat!!!. **YES!** akhirnya partisi dan _bootloader_ terdeteksi. Ane langsung coba format dan proses format berjalan dengan lancar. Sekarang **_flashdisk_ ane sudah hidup lagi!!!**. Untuk memastikan ane coba cabut pasang beberapa kali dan buat _folder_ dan taruh _files_ semua berjalan dengan baik. Kemudian ane coba akses dari MacOs dan ternyata juga bisa dibaca dan tulis dengan baik kecuali saat ane coba format ulang di MacOs selalu gagal. Tapi tak mengapa yang penting masih bisa dibaca dan tulis.

![MacOs Disk Utility](https://ik.imagekit.io/hjse9uhdjqd/jurnal/recoveryFd/SCR-20251018-igmw_IMvIHUrmi.png?updatedAt=1760752298323)

## Kesimpulan

Jika punya _flashdisk_ yang original dan dari merk populer dan mengalami masalah seperti ini, jangan dulu pakai aplikasi dari pihak ketiga untuk recover meski kadang bisa namun biasanya produses sudah menyediakan tools sendiri untuk hal ini dan dengan metode lebih mudah dan murah (gratis).

---

[^1]: Proses ini dilakukan di Windows karena aplikasi hanya tersedia untuk OS ini.

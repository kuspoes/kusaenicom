---
title: Ubiquity mac address poisoning
ringkasan: "cara memperbaiki pengaturan ubiquity yang menyebabkan multiple mac address di dalam jaringan"
date: 2026-09-13
tags:
  - kusaeni
  - tutorial
kategori: jurnal
relasi: tutorial
code: true
favorit: false
comment: true
keywords: ubiquity, tutorial, jaringan, multiple, mac address, double
comments:
  src: https://sepoi.kuspoes.deno.net/@poes/statuses/01K5HB8BQJJPVT4HV1A2SH3M6X
  real: https://sok.egois.org/@poes/statuses/01K5HB8BQJJPVT4HV1A2SH3M6X
---


![kucingnya banyak sekali](https://ik.imagekit.io/hjse9uhdjqd/jurnal/ubnt_/SCR-20260912-owah_7W4EV8dcp.png){.fuck}
<p class="ncaption">satu kucing terhubung dengan kucing yang lain, tapi kenapa wajahnya sama? </p>


`arp -a` menunjukkan hasil yang tidak sesuai, jumlah perangkat yang *online* ada sekitar 30 namun arp hanya menunjukkan 18 perangkat hidup. Saat diperiksa dengan aplikasi seperti [ Angry IP Scanner ](https://angryip.org/) maupun [Advanced IP Scanner](https://www.advanced-ip-scanner.com/) hasilnya sama saja, hanya ada sekitar 18 perangkat yang hidup.

Setelah di*sort by mac address* ketemua segerombolan perangkat yang *offline* namun dengan *mac address* yang sama persis yaitu `E0:63:DA:D8:EC:FE`. Setelah di*lookup* ternyata *mac address* ini milik perangkat Ubiquity NanoStation loco M2! yang ane pasang di gedung sebelah, ada sekitar 15 perangkat berada di balik Ubiquity ini dan semua terdeteksi *down* meski realisasinya sedang *online*. 

Ane coba `ping` tapi muncul *error Request Timeout* namun dari PC tujuan mereka bisa ping ke *router* dan bisa akses NAS. Ada ava kenava?

Setelah membaca - baca dokumentasi, ternyata Ubiquity memiliki fitur WDS atau Wireless Transparent Bridging yang harus aktif agar perangkat di balik Ubiquity tersebut bisa di*discovery* oleh `arp` atau aplikasi *scanner* seperti [ nmap ](https://nmap.org/) maupun Advanced IP Scanner. Jika WDS ini tidak aktif, maka Ubiquity akan menyamarkan perangkat - perangkat tersebut dan semua *reply* dianggap berasal dari Ubiquity sebagai garda depan. Fitur yang memiliki niat yang mulia, namun ane tidak membutuhkannya untuk saat ini.

Apa pasal?

Hal ini akan merepotkan saat pembacaan log firewall seperti di FortiGate karena membuat data di kolom *Source* alih - alih terbaca *Hostname* namun yang muncul adalah *mac address*, lebih buruknya semua kolom berisi *mac address* yang sama karena Ubiquity mengirimkan data ini, bukan *mac address* asli dari perangkat. Sehingga menyulitkan untuk mengidentifikasi dari perangkat mana data log tersebut berasal.

Bisa dibilang kalo Ubiquity telah meracuni perangkat di belakangnya sehingga `arp` tidak bisa mendeteksi secara akurat karena yang muncul di awal saja yang terdeteksi sedangkan perangkat di belakang Ubiquity dianggap menjadi satu dengan Ubiquity akibat dari *mac address* yang sama.

Cara penangannya mudah, namun sebelum itu masalah seperti ini <mark>tidak akan terjadi di Ubiquity dengan AirOS versi 8 ke atas</mark>. Sedangkan masalah yang ane hadapi karena ane pakai sistem dengan *firmware* versi XW.v6.2.0.

Jika mengalami hal serupa, maka cara perbaikannya seperti berikut:

1. **Login ke Ubiquity** yang dimaksud (Nano Station Loco M2), disini harus tahu IP atau NanoStation mana yang menyebabkan masalah,
2. Setelah login, **buka menu Wireless** kemudian kasih centang atau aktifkan fitur WDS (Transparent Bridge Mode),
3. Klik **Change untuk menyimpan**, dan kemudian klik **Apply** untuk mengkonfirmasi dan menerapkan pengaturan,
4. **Reboot** perangkat!

![aktifkan WDS!](https://ik.imagekit.io/hjse9uhdjqd/jurnal/ubnt_/SCR-20260912-ojik-min_YMeJBjYH6.png)
<aside class="image">Tampilan menu pengaturan Wireless, di <i>firmware</i> terbaru Wireless Mode diberi nama <b>Bridge</b> sedangkan yang lama namanya <b>Station</b>. </aside>

Sementara itu di sisi lokal, hapus *cache* dari `arp` dengan perintah 

```shell-session
$ sudo arp -d -a 
```
Perintah ini akan menghapus *cache* dari semua *interface* yang ada, untuk perintah lainnya bisa dilihat di `man arp`

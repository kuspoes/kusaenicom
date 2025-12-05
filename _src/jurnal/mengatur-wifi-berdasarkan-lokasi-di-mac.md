---
title: Mengatur Wifi berdasarkan lokasi atau SSID di MacOs
ringkasan: "Trik kecil yang sangat membantu jika kamu sering berganti - ganti Wi-Fi"
date: 2025-09-19
tags:
  - kusaeni
  - MacOs
  - tutorial
kategori: jurnal
code: true
favorit: true
comment: true
keywords: macos, tutorial
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01K5HB8BQJJPVT4HV1A2SH3M6X
  real: https://sok.egois.org/@poes/statuses/01K5HB8BQJJPVT4HV1A2SH3M6X
---

_Slides_ presentasi untuk artikel ini tersedia di bawah ini.

<iframe class="speakerdeck-iframe" frameborder="0" src="https://speakerdeck.com/player/a9de6f78b10a47f69971116b26f8c6aa" title="Mengatur Wifi berdasarkan lokasi atau SSID di MacOs" allowfullscreen="true" style="border: 0px; background: padding-box padding-box rgba(0, 0, 0, 0.1); margin: 0px; padding: 0px; border-radius: 6px; box-shadow: rgba(0, 0, 0, 0.2) 0px 5px 40px; width: 100%; height: auto; aspect-ratio: 560 / 315;" data-ratio="1.7777777777777777"></iframe>

Sebagai pengguna laptop saya sangat bergantung dengan Wi-fi untuk akses internet, entah sedang di tempat kerja maupun di rumah.

Saat di tempat kerja, saya harus merubah IPv4 dari Automatis (DHCP) ke manual karena setiap pegawai mendapatkan jatah IPv4 sendiri - sendiri. Jika tidak diatur tetap akan dapat jatah IPv4 namun dengan _rules_ sangat terbatas. Sehingga mengatur secara manual adalah pilihan yang tidak bisa dihindari.

Masalahnya ini membuat akses internet tidak akan bisa berfungsi saat berpindah Wi-Fi, seperti saat pulang ke rumah misalnya karena IPv4nya terkunci secara manual. Satu - satunya cara adalah merubah IPv4 tersebut secara mandiri atau merubahnya ke DHCP agar mendapatkan IP dari modem. Hal kecil yang kadang kala merepotkan.

## Otomasi di MacOs

Untungnya sejak rilis MacOs Ventura, Apple menyertakan fitur Location sebagai cara mengidentifikasi jaringan. Dengan fitur ini saya bisa membuat perubahan IP menjadi otomatis hanya dengan klik atau pilih lokasi.

Rencana pengaturan IP yang saya miliki seperti berikut:

| Location  | SSID     | IPv4 Mode | IPv4          | Subnet        | Gateway     | DNS       |
| --------- | -------- | --------- | ------------- | ------------- | ----------- | --------- |
| Automatic | iTu7uh   | Otomatis  | Auto/DHCP     | Auto/DHCP     | Auto/DHCP   | Auto/DHCP |
| Kerja     | AP_Buruh | Manual    | 192.168.0.220 | 255.255.255.0 | 192.168.0.1 | 10.1.2.3  |

Caranya sebagai berikut:

1. Buka pengaturan sistem dengan mengklik logo Apple  kemudian klik pada **System Settings**..,
2. Setelah jendela **System Settings...** terbuka pilih menu **Network**. kemudian gulir ke bawah dan cari tombol ... (dengan panah ke bawah), pilih menu **Location** dan **Edit Location**. (Gambar 1),
3. Klik pada tombol [+] untuk menambahkan data, disini saya memasukkan nama lokasi dari Wi-Fi yang biasa digunakan. Selesai

![Menambahkan Lokasi di network Settings MacOs](https://ik.imagekit.io/hjse9uhdjqd/jurnal/Wifi/Create_Location_5Tg4qPtAr.png?updatedAt=1758296766381)

<p class="ncaption"><b>Gambar 1</b>: Menambahkan Lokasi di network Settings MacOs</p>

Setelah lokasi ditambahkan, di Mac saya muncul menu baru di bawah logo Apple  yaitu menu **Location**. Sekarang saatnya mengatur preferensi (dalam hal ini IPv4). Caranya

1. Aktifkan Wi-Fi dan koneksikan ke Wi-Fi apa saja, tujuannya untuk mengaktifkan pengaturan IP dan lain -lain,
2. Klik pada logo Apple  kemudian _hover_ pada menu **Location**, di _child menu_ akan muncul nama SSID yang tadi sudah ditambahkan. Kemudian klik (pilih) pada salah satu lokasi yang akan diatur IP-nya. Sebagai contoh saya pilih pada lokasi **Kerja** . Akan muncul tanda centang **✓** di samping nama SSID yang dipilih, (Gambar 2)

3. Kemudian _hover_ lagi di menu **Location** tapi kali ini pilih menu **Network Settings..**. Akan muncul menu **Network Settings** kemudian pilih _interface_ Wi-Fi dan klik tombol **Details** pada Wi-Fi yang tersambung saat ini,
4. Setelah muncul jendela pengaturan jaringan, tuju pada tab **TCP/IP**, kemudian buat pengaturan sesuai dengan _plan_ Wi-Fi di lokasi tersebut. Selanjutnya klik pada tab **DNS** untuk mengatur DNS. Setelah selesai simpan, (Gambar 3)
5. Ulangi lagi jika ada lokasi lain yang perlu dirubah, karena Wi-Fi di rumah tidak perlu diatur maka saya biarkan apa adanya dan nanti akan pakai Location : **Automatic**.

![Menu Location Network Settings di bawah menu apple](https://ik.imagekit.io/hjse9uhdjqd/jurnal/Wifi/Location_menu_0U-5ZagL_.png?updatedAt=1758296746434)

<p class="ncaption"><b>Gambar 2</b>: Menu Location sekarang muncul di bawah menu Apple</p>

![Network Settings per Wi-Fi](https://ik.imagekit.io/hjse9uhdjqd/jurnal/Wifi/Network_Settings_Wifi_J7K2hK6VS.png?updatedAt=1758296737012)

<p class="ncaption"><b>Gambar 3</b>: pengaturan jaringan.</p>

Saatnya mencoba, karena contoh situasi sekarang sedang di tempat kerja dan sudah terhubung ke Wi-Fi, maka saya rubah Location ke Automatic agar Network Settings melakukan perubahan mode pengaturan IPv4 ke DHCP.

Untuk memastikan bisa dengan mempergunakan perintah `ifconfig | grep 192.168` atau melalui **Network Settings**. Seharusnya sekarang modenya sudah DHCP dan mendapatkan IPv4 acak dari Firewall.

Rubah lagi **Location** ke **Kerja** dan cek mode dan IPv4 yang didapatkan. Seharusnya mode sudah manual dan IPv4 menjadi `192.168.0.220`. Keren.

## Alternatif lain

Ada cara lain dengan memanfaatkan Shortcut dan script shell, tapi saya tidak pakai karena terlalu ribet. Scriptnya bisa dibuat sendiri atau meniru dari internet seperti ini

```sh
#!/bin/bash
SSID=$(networksetup -getairportnetwork en0 | cut -d: -f2 | xargs)
if [ "$SSID" = "rumah" ]; then
  networksetup -setdhcp Wi-Fi
elif [ "$SSID" = "kantor" ]; then
  networksetup -setmanual Wi-Fi 192.168.0.220 255.255.255.0 192.168.0.1
fi
```

tentu saja _file script_ ini harus dirubah menjadi _executable_ dan ditaruh di `~/bin`.

Cara yang lain adalah dengan mempergunakan aplikasi Wifi Loc Control yang sebenarnya versi lebih _advanced_ dari _script_ di atas, aplikasi ini bisa diunduh di [Wifi Loc Control di Github](https://github.com/vborodulin/wifi-loc-control).

---
title: Menginstall FreeBSD di VPS berbasis Linux
ringkasan: "Provider tidak menyediakan OS FreeBSD dan atau ingin menginstall sendiri?"
date: 2024-12-04
tags:
  - jurnal
  - bsd
  - tutorial
  - fave
keywords: "openbsd, vps, tutorial, jagoan hosting, bsd, linux, cara install, xtermjs"
kategori: jurnal
code: true
favorit: true
comment: true
tocx: false
---

<div class="postnotes">
<h4>TLDR</h4>
<p>Cara menginstall FreeBSD di atas VPS Linux, contoh mempergunakan VPS Jagoan Hosting dengan OS Debian Linux 12. Jika tidak ingin repot, bisa hubungi support Jagoan Hosting untuk diinstallkan OS FreeBSD.</p>
</div>

Selaras dengan semakin populernya Linux, sebagian besar provider VPS (Virtual Private Server) sekarang lebih memilih untuk menyediakan layanan VPS hanya dengan pilihan OS Linux yang populer. 

Meski masih ada yang menyediakan pilihan untuk mempergunakan FreeBSD dan atau custom ISO, namun saat ini jumlahnya sangat terbatas. Tidak hanya di Indonesia bahkan di VPS Provider kelas dunia pun banyak yang fokus menyediakan Linux sebagai OS pilihan. Alasan yang paling sering muncul adalah penghematan biaya dan memudahkan layanan/maintenance. 

### Tetap ingin pakai FreeBSD

Saya ingin memakai FreeBSD, bagaimana caranya?

Cara paling mudah adalah mencari penyedia VPS yang support FreeBSD. Jika tidak ada maka terpaksa pakai trik untuk menginstall FreeBSD di atas VPS Linux (overwrite Linux dengan FreeBSD ).

Jadi mari kita coba cara kedua. 

Sebagai contoh saya menyewa VPS dari Jagoan Hosting paket Nebula dengan spek 2 vCore CPU dan 2 Gb RAM, namun VPS dengan spek 1 Core CPU dan 1 Gb RAM sudah cukup untuk menjadi ujicoba.

Default OS saya pasang Debian 12, saya menghindari Ubuntu karena biasanya sudah terlalu banyak modifikasi sehingga kadang malah membuat proses menjadi gagal. Jika tidak ada Debian bisa pakai Almalinux, Rocky Linux, atau bahkan Alpine Linux. 

Sebagai catatan Jagoan Hosting memakai [xtermjs](https://xtermjs.org/) sebagai web consolenya, melawan arus utama perhostingan yang biasanya memakai [noVNC](https://novnc.com/info.html). Hal ini akan membuat proses install menjadi cukup pelik cukup sulit. 

<div class="postnotes">
<h4>Kenapa?</h4>
<p>Karena xtermjs memberikan syarat harus terinstall Qemu (guest) di VPS dan FreeBSD harus boot dengan serial console aktif. Default instalasi FreeBSD tidak memiliki 2 syarat ini.</p>
<p>Meski begitu, akses console ke VPS masih bisa dilakukan dengan SSH, lebih bagus lagi jika pakai tmux sehingga saat pengaturan <code>pf</code> lebih nyaman. Apalagi jika terjadi kesalahan.</p>
</div>

Setelah Debian terinstall dan berjalan dengan baik, maka saya buka akses web konsol (bukan SSH). Kemudian login dengan user `root` dan password yang sudah diatur sebelumnya. 

### Memeriksa disk

Hal pertama yang saya lakukan adalah memeriksa konfigurasi disk yang digunakan.

```shell-session
# df -h
 Filesystem     Size    Used   Avail Capacity  Mounted on
 /dev/sda1       37G    2.3G     31G     7%    /
 devfs          1.0K      0B    1.0K     0%    /dev
 /dev/sda2.     286M    6.1M.   280M.    1%    /boot/efi
```

Dari hasil di atas, diketahui bahwa disk yang dipergunakan adalah `/dev/sda`.
Pemeriksaan ini penting karena nanti saya harus menulis/menimpa data di disk tersebut.

### mfsBSD

[mfsBSD](https://mfsbsd.vx.sk/) adalah sebuah tools yang dibuat oleh Martin Matuška yang tujuan utamanya sebagai recovery OS namun bisa dipergunakan untuk menginstalasi FreeBSD ke dalam sistem. 

Download file `.img` pilih arch dan rilis yang diiginkan, karena rilis FreeBSD terbaru adalah 14.1, maka

```shell-session
# wget https://mfsbsd.vx.sk/files/images/14/amd64/mfsbsd-se-14.1-RELEASE-amd64.img
```

Setelah selesai, tulis file mfsBSD yang sudah didownload ke dalam disk (menimpa file system Debian), caranya adalah

```shell-session
# dd if=mfsbsd-se-14.1-RELEASE-amd64.img of=/dev/sda bs=1M
```

Perintah di atas akan menulis timpa file system mfsBSD ke `/dev/sda`, pastikan proses penulisan berjalan sempurna dan kemudian `reboot` . Jangan tutup web console, biarkan proses reboot berjalan. Setelah reboot selesai maka akan muncul bootloader dari FreeBSD, tekan tombol Enter untuk booting.

<div class="postnotes">
<h4 id="postnotes-systemd">Gagal saat menimpa?</h4>
<p>Mungkin systemd akan memblok proses <code>dd</code> saat menimpa <code>boot</code> <i>files</i>. Maka perlu menghentikan <code>systemd-udevd</code> dengan <code>systemctl</code class="language-shell-session">
<pre class="language-shell-session"><code>
$ sudo systemctl stop systemd-udevd
$ sudo systemctl stop systemd-timesyncd
$ sudo systemctl stop systemd-journald
</pre></code>
<p>Perintah di atas akan menghentikan proteksi <code>systemd</code> pada <i>disk</i></p>
</div>

Proses booting mfsBSD akan berjalan, dalam beberapa kasus akan memakan waktu agak lama sekitar 1 - 3 menit karena system sedang mencari atau mendapatkan IP dari DHCP Client. Jangan panik biarkan saja. Setelah proses booting selesai, maka akan muncul prompt untuk login. Gunakan credentials `root/mfsroot` untuk login. Selamat!!!

Hal pertama yang harus dilakukan setelah login adalah melakukan recovery partisi yang rusak karena proses mfsBSD. 

```shell-session
# gpart recover da0
```

<aside>
<code>da0</code> adalah nama disk, bisa dicek dengan cara yang sama dengan di atas.
</aside>

#### Memeriksa konektivitas jaringan

Sebenarnya setelah recover disk, bisa saja ketik `bsdinstall` untuk memulai TUI penginstallan FreeBSD, namun sebaiknya melakukan pengecekan jaringan terlebih dahulu. Cara yang paling mudah adalah dengan melakukan `ping` ke Google. 

```shell-session
# ping -c3 google.com
ping: No route to host
```

Jika muncul reply dari Google maka tandanya bisa langsung jalankan `bsdinstall`. Tapi hidup kadang tak semudah itu ya, jadi disini saya tidak mendapatkan reply dari Google melainkan error `No route to host`.

Hal ini karena mfsBSD tidak bisa menemukan konfigurasi yang benar, ingat dengan booting yang lama? ini karena system berusaha mendapatkan IP dari DHCP Client sampai timeout.

Ada beberapa hal yang penting untuk dilakukan, antara lain:

1. Memeriksa IP yang sudah diberikan oleh VPS Provider (Jagoan Hosting), bisa dicek di halaman member JagHost. Disini saya mendapatkan IP `103.158.31.189`, netmask `255.255.255.0`, dan gateway `103.158.31.1`.
2. Melakukan pengaturan secara manual ke dalam mfsBSD.

#### mfsBSD setting jaringan

Maka perlu untuk memeriksa interfaces apa saja yang sudah dideteksi oleh system, ini nanti akan membatu untuk melakukan pengaturan IP.

```shell-session
# ifconfig
vtnet0: flags=1008843 ....<REDACTED>
		media: Ethernet autoselect
		status: active

lo0: flags=1008049 <REDACTED>
```

Tersebut interface yang terdeteksi adalah `vtnet0`.

#### Setting nameserver

Sebelum mengatur IP saya atur dulu nameserver untuk memproses DNS.

```shell-session
# echo "nameserver 8.8.8.8" > /etc/resolv.conf
```

Di FreeBSD untuk mengatur IP bisa dengan mendeskripsikannya ke dalam file `/etc/rc.conf` seperti berikut ini:

```shell-session
# vi /etc/rc.conf
ifconfig_vtnet0="inet 103.158.31.189 netmask 255.255.255.0"
defaultrouter="103.158.31.1"
```

simpan dan kemudian restart jaringan dengan cara:

```shell-session
# service netif restart
# service routing restart
```

Setelah direstart, seharusnya mfsBSD sudah bisa mendapatkan IP. Namun ternyata tidak!. Saya masih belum bisa melakukan ping dan masih mendapatkan masalah `No route to host`. Ternyata pengaturan IP di file `/etc/rc.conf` tidak membuat sistem terhubung ke jaringan. Sepertinya mfsBSD memiliki cara berbeda untuk melakukan pengaturan jaringan.

Saya tak paham dengan bagaimana mfsBSD mengaturnya, tapi saya paham cara melakukan pengaturan secara manual, urutannya sebagai berikut:

```shell-session
# netstat -nrF0
Routing tables

Internet:
Destination        Gateway            Flags     Netif    Expire
127.0.0.1          link#2             UH        lo
```

Ternyata di Routing Tables tidak terdeteksi IP dan gateway (broadcast), jadi saya buat IP dan Gateway secara manual.

```shell-session
# ifconfig vtnet0 create 103.158.31.189 netmask 255.255.255.0
# route add default 103.158.31.1
# netstat -nrF0
Routing tables

Internet:
Destination        Gateway            Flags     Netif     Expire
default            103.158.31.1       UGS       vtnet0
103.158.31.0/24.   link#1             U         vtnet0
104.158.31.189.    link#2.            UHS       lo0
127.0.0.1          link#2             UH        lo0
```

kemudian tes koneksi dengan ping, Alhamdulillah ada reply dari Google.

#### BSDInstall

Setelah jaringan berjalan dengan baik, maka sekarang saatnya menginstall FreeBSD. ketik perintah `bsdinstall` maka akan muncul TUI untuk menginstall FreeBSD.

Saya mempergunakan semua disk sebagai `/root` folder dengan format UFS. Installer akan memberitahu bahwa file MANIFEST tidak ditemukan sehingga perlu diunduh dari internet (disinilah pentingnya akses jaringan tersedia).

Tapi disini saya tidak bisa memilih server dengan mode FTP, karena selalu gagal dalam terkoneksi. Jadi pilih server dengan mode HTTPS, saya pilih server di Australia karena lebih dekat. Sistem akan langsung mengunduh file `base.txz` dan `kernel.txz` kemudian mengekstraknya ke dalam disk.

Proses selanjutnya adalah melakukan pengaturan jaringan, rubah/atur sesuai dengan IP, netmask, dan gateway di atas. Ada juga kesempatan untuk merubah password root dan menambah user baru. Maka buat user baru, ini penting karena default ssh akses nanti tidak bisa login dengan root.

Setelah semua rangkaian install sudah selesai, jangan terburu - buru restart. Kalo pakai noVNC boleh langsung restart tapi karena pakai xtermjs maka ada beberapa hal yang harus dilakukan agar xtermjs bisa terhubung ke FreeBSD.

Pilih Yes saat ada menu untuk masuk ke dalam shell-session.

### Pengaturan koneksi xtermjs

Untuk bisa menghubungkan xtermjs dengan FreeBSD maka diperlukan paket `qemu-guest-agent` terinstall. Caranya sebagai berikut

```shell-session
# pkg update
# pkg install qemu-guest-agent
```

Setelah terpasang, kemudian tambahkan `service qemu-ga` ke dalam file `/etc/rc.conf` agar selalu dijalankan saat sistem boot.

```shell-session
# sysctl qemu_guest_agent_enable="YES"
```

Selain itu perlu juga mengatur agar FreeBSD booting dengan mode serial console aktif. Mode ini bertujuan untuk menampilkan semua boot messages namun bisa dipakai juga untuk menghubungkan xtermjs serial console. Jadi saya tambahkan berikut ini ke file `/boot/loader.conf`

```shell-session
# echo 'console="comconsole"' > /boot/loader.conf
```

Kemudian reboot dan nikmati sistem FreeBSD yang sudah terinstall.

---
title: FreeBSD di Raspberry Pi4
ringkasan: "mencoba memasang FreeBSD 14 dan Jail Postgresql serta miniflux di Raspi4"
tags:
  - tutorial
  - bsd
  - fave
  - freebsd
date: 2024-05-18
kategori: jurnal
relasi: freebsd
code: true
tocx: true
favorit: true
comment: true
---

Saya ada Raspberry Pi4 Model B yang rencananya mau dipakai sebagai _home lab_. Raspberry Pi4 ini datang dengan CPU Armv7 di frequensi 1500Mhz 4 cores dan _memory_ 2GB. Untuk _storage_ saya pakai micro SD merek Sandisk berkapasitas 16Gb.

Untuk OS saya _install_ FreeBSD 14 versi [RPI](https://download.freebsd.org/releases/arm64/aarch64/ISO-IMAGES/14.0/) (khusus untuk Raspberry Pi), harus pakai _image_ ini karena saya sudah coba pakai versi `armv6/7` tidak bisa dipakai. Proses _installasi_ mengikuti standar saja. _Download image_ kemudian _burn_ ke micro SD dan jalankan Raspberry Pi-nya.

Kemudian _login_ dengan _username/password_ `root/root` atau `freebsd/freebsd`. Setelah _login_ ganti _password_ dengan perintah `passwd`.

### Update patch dan atur CPU frequency

Hal pertama yang selalu saya lakukan adalah mengunduh _patch_ terbaru (`14.0-RELEASE-p6`) dan `update pkg`

_Update patch_

```shell-session
# freebsd-version
14.0-RELEASE
# freebsd-update fetch install
# freebsd-version
14.0-RELEASE-p6
```

_Update pkg_

```shell-session
# pkg update
# pkg upgrade
```

Raspberry Pi4 memiliki _clock frequency_ di 1500Mhz namun FreeBSD _fresh install_ akan mengatur _frequency_ berjalan di batas minimal, biasanya di 300Mhz. Untuk itu perlu dilakukan pengaturan agar bisa berjalan di 1500Mhz.

```shell-session
# sysctl dev.cpu.0.freq
dev.cpu.0.freq: 300
# sysctl dev.cpu.0.freq=1500
dev.cpu.0.freq: 1500
```

<aside>
Raspberry Pi sepertinya memang mengatur <i>clock</i> di posisi paling rendah untuk alasan keamanan. Tapi dengan <i>clock</i> paling rendah itu performa masih lumayan bagus.
</aside>

tapi pengaturan ini akan kembali ke _default_ setelah Raspberry Pi4 di `reboot`. Agar pengaturan menjadi permanen maka perlu mengatur di file `/etc/systctl.conf` dan tambahkan `dev.cpu.0.freq=1500` di baris paling akhir, kemudian `reboot` agar pengaturan diterapkan.

Secara _default_ RPI akan mengatur `generic` sebagai _hostname_ dari perangkat ini, untuk merubahnya saya perlu meng*edit file* `/etc/rc.conf` dan masukkan pengaturan `hostname="rpi4"` untuk mengubah _hostname_ menjadi `rpi4` dan kemudian `reboot`.[^1]

### Jail’s

Jails adalah sejenis _container_ yang dibangun diatas konsep `chroot` untuk menciptakan sebuah _safe environtment_ yang terisolasi dari sistem utama. Semua proses yang terjadi di dalam Jail tidak bisa mengakses semua _resources_ dari sistem utama atau `host`. Di Linux lebih mirip dengan [LXC](https://linuxcontainers.org/) tapi bagi yang pernah pakai [Docker](https://docker.com) maka Jail memiliki konsep yang sama.

Di Raspberry Pi ini saya hendak _install_ Jail sehingga di `host` nanti tidak ada aplikasi _selfhost_ yang berjalan sehingga di `host` tidak akan banyak _package_ yang terinstall.

Saya mempergunakan [bastilleBSD](https://bastilleBSD.org) sebagai Jail _manager_. Apakah harus pakai BastilleBSD?.
Jawabannya **tidak**, FreeBSD sudah menyediakan Jail _manager_ bawaan namun BastilleBSD membuat proses manajemen Jail lebih mudah dengan koleksi _shell script_ yang lengkap[^2].

BastilleBSD bisa di*install* melalui `pkg`

```shell-session
[RPI4] # pkg install bastille
```

Agar BastilleBSD bisa jalan setiap sistem `boot`, maka tambahkan pengaturan dibawah ke dalam _file_ `/etc/rc.conf`

```txt
bastille_enable="YES"
```

atau bisa langsung melalui _command line_

```shell-session
[RPI4] # sysrc bastille_enable="YES"
```

Setelah bastilleBSD terdaftar di `rc.conf` maka sistem akan memiliki kemampuan untuk mengelola bastilleBSD melalui `service`. Sebagai contoh untuk memulai jalankan bastilleBSD bisa dengan perintah `service bastille start`. Opsi perintah lainnya adalah `stop` dan `restart`.

#### Loopback

Sebelum memulai mengatur Jail, saya perlu memeriksa daftar _network interfaces_ yang tersedia di perangkat Raspberry Pi4,

```shell-session
[RPI4] # ifconfig
genet0: flags=1008843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST,LOWER_UP> metric 0 mtu 1500
	options=68000b<RXCSUM,TXCSUM,VLAN_MTU,LINKSTATE,RXCSUM_IPV6,TXCSUM_IPV6>
	ether dc:a6:32:35:0a:c2
	inet 192.168.1.46 netmask 0xffffff00 broadcast 192.168.37.255
	inet6 fe80::dea6:32ff:fe35:ac2%genet0 prefixlen 64 scopeid 0x1
	media: Ethernet autoselect (1000baseT <full-duplex>)
	status: active
	nd6 options=23<PERFORMNUD,ACCEPT_RTADV,AUTO_LINKLOCAL>
lo0: flags=1008049<UP,LOOPBACK,RUNNING,MULTICAST,LOWER_UP> metric 0 mtu 16384
	options=680003<RXCSUM,TXCSUM,LINKSTATE,RXCSUM_IPV6,TXCSUM_IPV6>
	inet 127.0.0.1 netmask 0xff000000
	inet6 ::1 prefixlen 128
	inet6 fe80::1%lo0 prefixlen 64 scopeid 0x2
	groups: lo
	nd6 options=23<PERFORMNUD,ACCEPT_RTADV,AUTO_LINKLOCAL>
```

dari hasil `ifconfig` di atas ditemukan bahwa _interfaces ethernet_ Raspberry Pi4 saya adalah `genet0` dan `lo0` untuk _interface_ `loopback` dan IP `192.168.1.46`.

BastilleBSD sendiri mengsyaratkan pemakaian `loopback` jaringan untuk memberikan IP kepada masing - masing Jail. Oleh karena itu perlu melakukan pembuatan `loopback` _interfaces_ di `host`. Caranya sebagai berikut

```shell-session
[RPI4] # sysrc cloned_interfaces+=lo1
[RPI4] # sysrc ifconfig_lo1_name="bastille0"
[RPI4] # service netif cloneup
```

Perintah diatas akan membuat kloning atas _interfaces_ `lo0` dan diberi nama `lo1`. Kemudian saya rubah nama `lo1` agar muncul di `ifconfig` dengan nama `bastille0`. Terakhir jalankan `service netif cloneup` untuk memulai kloning _interface_ `lo0`.

Setelah itu seharusnya ketika di `ifconfig` akan muncul hasil sebagai berikut

```shell-session
[RPI4] # ifconfig
genet0: flags=1008843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST,LOWER_UP> metric 0 mtu 1500
	options=68000b<RXCSUM,TXCSUM,VLAN_MTU,LINKSTATE,RXCSUM_IPV6,TXCSUM_IPV6>
	ether dc:a6:32:35:0a:c2
	inet 192.168.1.46 netmask 0xffffff00 broadcast 192.168.37.255
	inet6 fe80::dea6:32ff:fe35:ac2%genet0 prefixlen 64 scopeid 0x1
	media: Ethernet autoselect (1000baseT <full-duplex>)
	status: active
	nd6 options=23<PERFORMNUD,ACCEPT_RTADV,AUTO_LINKLOCAL>
lo0: flags=1008049<UP,LOOPBACK,RUNNING,MULTICAST,LOWER_UP> metric 0 mtu 16384
	options=680003<RXCSUM,TXCSUM,LINKSTATE,RXCSUM_IPV6,TXCSUM_IPV6>
	inet 127.0.0.1 netmask 0xff000000
	inet6 ::1 prefixlen 128
	inet6 fe80::1%lo0 prefixlen 64 scopeid 0x2
	groups: lo
	nd6 options=23<PERFORMNUD,ACCEPT_RTADV,AUTO_LINKLOCAL>
bastille0: flags=1008049<UP,LOOPBACK,RUNNING,MULTICAST,LOWER_UP> metric 0 mtu 16384
	options=680003<RXCSUM,TXCSUM,LINKSTATE,RXCSUM_IPV6,TXCSUM_IPV6>
	inet6 fe80::1%bastille0 prefixlen 64 scopeid 0x3
	groups: lo
	nd6 options=23<PERFORMNUD,ACCEPT_RTADV,AUTO_LINKLOCAL>
```

#### Packet Filter

_Interface_ `bastille0` yang sudah dibuat akan menjadi _interface_ yang memberikan IP kepada masing - masing Jail yang sudah dibuat. Untuk memberikan akses agar Jail bisa diakses dari internet maka perlu dibuatkan NAT.

Untungnya FreeBSD sudah menyediakan aplikasi seperti `pf`[^3] untuk mengatur lalu lintas jaringan. Buat sebuah _file_ `/etc/pf.conf` kemudian isi dengan _script_ seperti ini

```txt
ext_if="genet0"

set block-policy return
scrub in on $ext_if all fragment reassemble
set skip on lo

table <jails> persist
nat on $ext_if from <jails> to any -> ($ext_if:0)
rdr-anchor "rdr/*"

block in all
pass out quick keep state
antispoof for $ext_if inet

pass in inet proto tcp from any to any port ssh flags S/SA keep state
```

<aside>
untuk isian <code>ext_if</code> saya masukkan <code>genet0</code> karena <i>interface</i> ini yang terhubung ke internet melalu ethernet (kabel). Konfigurasi diatas adalah contoh yang sudah disediakan oleh BastilleBSD dan untuk banyak kejadian bisa berjalan dengan baik.
</aside>

Setelah itu simpan dan masukkan `service pf` ke `rc.conf` dan mulai jalankan dengan[^4]

```shell-session
[RPI4] # sysrc pf_enable="YES"
[RPI4] # service pf start
```

#### Bootstrap dan mulai membuat Jail

Sebelum membuat Jail, sistem perlu melakukan `boostrap` atas rilis FreeBSD di `host`. Di atas saya sudah melakukan _update patch_ sampai ke `14.0-RELEASE-p6` sehingga versi ini yang akan saya `bootstrap`.

```shell-session
[RPI4] # bastille bootsrap 14.0-RELEASE update
```

tambahan `update` di perintah diatas akan membuat FreeBSD melakukan pemeriksaan jika ada `update` terbaru. Ini opsional, agar lebih cepat kadang saya tak pakai perintah `update`. Meskipun tidak menyertakan rilis _patch_ namun hasil `bootstrap` tetap sesuai rilis _patch_ yang terakhir.

Setelah `bootstrap` berhasil, saatnya membuat kontainer Jail

```shell-session
[RPI4] # bastille create postgres 14.0-RELEASE 10.1.1.1/24
```

perintah diatas akan membuat sebuah Jail dengan nama `postgres` dengan mempergunakan rilis `14.0-RELEASE` dan diberi IP `10.1.1.1/24`[^5].

Untuk melihat daftar Jail yang sudah dibuat,

```shell-session
[RPI4] # bastille list
JID State IP Address Published Ports Hostname Release Path
postgres Up 10.1.1.1 -  14.0-RELEASE-p6 /usr/local/bastille/jails/postgres/root
```

BastilleBSD secara otomatis akan menjalankan container setelah proses `create` selesai.

#### Menginstall PostgreSQL di Jail

Setelah pembuatan Jail selesai, saya ingin memasang [postgresql](https://postgresql.org) di dalam Jail `postgres`. Untuk mempergunakan postgresql dari dalam Jail, saya perlu merubah/menambah konfigurasi Jail (`jail.conf`) yang bisa diakses dengan perintah sebagai berikut

```shell-session
[RPI4] # bastille edit postgres
```

kemudian saya tambahkan konfigurasi

```txt
allow.raw_sockets=1;
allow.sysvipc=1;
```

konfigurasi `allow.raw_sockets=1;` diperlukan agar bisa melakukan `ping` atau perintah berkaitan penggunaan `sockets`[^6], sedangan `allow.sysvipc` diperlukan untuk me*load module kernel* agar postgresql bisa berjalan baik.

Untuk meng*install* postgresql saya perlu melakukan `chroot` ke dalam Jail `postgres`.

```shell-session
[RPI4] # bastille console postgres
```

perintah ini akan membawa saya masuk ke dalam _environtment_ `root` di dalam Jail `postgres`. Hal pertama yang perlu saya lakukan adalah mengaktifkan `pkg` untuk menginstall _packages_.

```shell-session
[postgres] # pkg update
[postgres] # pkg install postgresql16-server postgresql16-client postgresql16-contrib
```

akan muncul notifikasi bahwa `pkg` belum terpasang dan perlu melakukan `bootsrap`. Tekan "Y" untuk setuju dan secara otomatis `pkg` akan mengunduh beberapa data yang diperlukan. Setelah selesai `pkg` akan melakukan `update` dilanjutkan pemasangan postgresql.

Agar postgresql berjalan saat sistem `booting` maka saya aktifkan postgresql di `/etc/rc.conf` dan jalankan.

```shell-session
[postgres] # sysrc postgresql_enable="YES"
[postgres] # service postgresql initdb
[postgres] # service postgresql start
```

dengan perintah `initdb` postgresql akan melakukan pembuatan database awal dan semua proses akan berjalan dibawah _user_ baru bernama `postgres`. Hal pertama yang biasanya saya lakukan adalah mengubah _password_ dari _user_ `postgres`.

```shell-session
[postgres] # su - postgres
$ psql -c "ALTER USER postgres WITH PASSWORD 'olala'"
```

perintah diatas akan merubah _password user_ `postgres` dengan `olala`.
Gunakan perintah `psql` untuk masuk ke _prompt_ postgresql. Sampai disini layanan database postgresql sudah aktif dan berjalan di Jail `postgres` di IP `10.1.1.1` dengan `port` default `5432`.

#### Menginstall miniflux di Jail

Untuk mencoba layanan postgresql yang sudah aktif di Jail `postgres`, saya akan memasang [miniflux](https://miniflux.app).

Miniflux adalah aplikasi _feed reader_ minimalis yang mempergunakan database postgresql sebagai penyimpanan. Contoh aplikasi yang tepat untuk menguji layanan postgresql yang sudah di*install* sebelumnya.

Sebelum memasang miniflux, saya siapkan dulu database postgresql dengan kredensial nama database **miniflux** dan user **mnflx**

```shell-session
[postgres] # su - postgres
$ createuser -P mnflx
Enter password for new role:
$ createdb miniflux -O mnflx
$ psql miniflux -c 'create extension hstore'
```

<aside>
Perintah - perintah diatas <i>copy paste</i> dari <a href="https://miniflux.app/docs/database.html">dokumentasi miniflux</a>.
</aside>

Database miniflux ini akan diakses dari Jail yang lain, maka saya perlu memberikan ijin akses. Rencananya saya akan membuat Jail dengan IP `10.1.1.2` sehingga saya _edit file_ `/var/db/postgres/data16/pg_hba.conf` dan tambahkan pengaturan sebagai berikut

```txt
# Jail IP
host    miniflux        mnflx        10.1.1.2          trust
```

Setelah database siap, saya buat Jail khusus untuk miniflux

```shell-session
[RPI4] # bastille create miniflux 14.0-RELEASE 10.1.1.2/24
[RPI4] # bastille console miniflux
[miniflux] # pkg update
```

_Package_ miniflux sudah tersedia di FreeBSD dan bisa di*install* dengan perintah berikut

```shell-session
[miniflux] # pkg install miniflux
```

Kemudian buat pengaturan database di miniflux, _edit file_ `/usr/local/etc/miniflux.env` dan tambahkan database _connection_ seperti berikut

```txt
DATABASE_URL=`postgres://mnflx:miniflux@10.1.1.1/miniflux?sslmode=disable`
```

Karena postgresql dihost di Jail yang lain maka saya gunakan _connection string_ dengan format seperti diatas. Selanjutnya lakukan migrasi dan buat akun `admin` untuk miniflux.

```shell-session
miniflux -c /usr/local/etc/miniflux.env -migrate
miniflux -c /usr/local/etc/miniflux.env -create-admin
```

Selesai! Agar miniflux berjalan saat sistem `booting` maka saya aktifkan miniflux di `/etc/rc.conf` dan jalankan. Miniflux harusnya sudah bisa berjalan di IP `10.1.1.2:8080` dan bisa dikonfirmasi melalui `netstat` atau `sockstat`.

Tapi bagaimana caranya supaya bisa diakses melalui _browser_?

#### Nginx Reverse Proxy

Agar aplikasi miniflux bisa diakses melalui _browser_ maka saya perlu memasang aplikasi seperti [nginx](https:nginx.com).

```shell-session
[RPI4] # pkg install nginx
[RPI4] # sysrc nginx_enable="YES"
[RPI4] # service nginx start
```

Kemudian saya atur _reverse proxy_ dengan meng*edit file* `/usr/local/etc/nginx/nginx.conf` seperti berikut

```txt
user nobody;
worker_processes 1;
events {
 }
http {
	server {
		listen 80;
		location / {
		proxy_pass http://10.1.1.2:8080;
		proxy_set_header Host $http_host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
		}
	}
}
```

simpan, cek konfigurasi apakah ada yang keliru dan `restart nginx`.

```shell-session
[RPI4] # nginx -T
[RPI4] # service nginx restart
```

Jika semua berjalan lancar, maka miniflux bisa diakses melalui _browser_ di alamat IP `192.168.1.46:80` alias IP dari Raspberry Pi4.

 <img src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/miniflux_L1-UQF0dk0.png?updatedAt=1716043784554" />

### Penutup

FreeBSD sudah mendukung perangkat Raspberry Pi secara _out of the box_ namun sayangnya masih kurang populer di kalangan pecinta _home lab_ karena Raspberry Pi sendiri sudah membawa OS sendiri yaitu Raspbian yang tentu saja akan berjalan secara optimal di perangkatnya sendiri. Namun FreeBSD bisa menjadi alternatif yang menarik selain Raspbian.

[^1]: Jika tidak ingin meng`reboot` sistem, maka perlu merubah _entry_ di `/etc/hosts` yang menyebut ke _hostname_ yang lama. Cukup perbarui _file_ ini dan simpan.

[^2]: Ada banyak Jail _manager_ yang tersedia, daftar lengkapnya bisa dilihat [disini](https://docs.freebsd.org/en/books/handbook/jails/#jail-managers-and-containers).

[^3]: Dokumentasi - [PF](https://docs.freebsd.org/en/books/handbook/firewalls/index.html#firewalls-pf). Di halaman yang sama terdapat informasi tentang _firewall_ lainnya yang didukung oleh FreeBSD.

[^4]: Jika akses ke `host` melalui `ssh` _session_ maka saat `pf` diaktifkan maka secara otomatis `host` akan meng*disconnect* akses. Untuk masuk tinggal konek kembali seperti biasanya, namun jika tidak bisa maka artinya ada masalah di _entry firewall_-nya. Maka perlu konek melalui konsol.

[^5]: IP disini adalah deretan IP lokal, bisa juga pakai IP dengan deretan `192.168.x.x/24` dan sebagainya.

[^6]: Secara _default_ Jail tidak mengizinkan penggunaan `raw sockets` untuk alasan keamanan, sehingga jika tidak penting sekali jangan diaktifkan fitur ini.

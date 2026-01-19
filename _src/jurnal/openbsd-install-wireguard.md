---
title: Wireguard di OpenBSD
ringkasan: "Catatan ane tentang memasang Wireguard di OpenBSD, yang katanya mudah tapi cukup bikin pusing juga"
date: 2025-11-29
tags:
  - tutorial
  - openbsd
  - bsd
kategori: jurnal
relasi: openbsd
code: true
favorit: false
comment: true
tocx: true
keywords: bsd, openbsd, wireguard, self host, vpn
templateEngine: vto, md
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KB7AAT2X97B5D49DADYPP5KS
  real: https://sok.egois.org/@poes/statuses/01KB7AAT2X97B5D49DADYPP5KS
---

Kata orang - orang kalo pakai BSD paling gampang di OpenBSD karena Wireguard sudah ada di dalam base, oke karena memang sudah diinstall OpenBSD bisa langsung lanjut. Akan tetapi, ternyata itu bohong. Semua sama saja, harus mulai dari nol (kayak di BSD lainnya). Mau gimana lagi nasi sudah jadi krupuk maka mau ga mau lanjut.

Catatan ini akan dibagi menjadi 2 bagian yaitu memasang Wireguard di sisi server (VPS) dan sisi client (macos).

## Setup Wireguard di VPS

Karena `wg` (binary dari wireguard) ternyata belum ada di dalam OpenBSD, maka perlu memasangnya secara manual. Sebelum itu ada beberapa hal yang perlu ane catat yaitu VPS ane sudah memakai [OpenBSD 7.8](https://www.openbsd.org/78.html) dengan spesifikasi 1vCPU - 1GB RAM - 25GB SSD dan akan login dengan user bukan root sehingga ane akan pakai `doas` untuk elevasi ke root.

```shell-session
$ doas pkg_add wireguard-tools
```

perintah ini akan memasang `wireguard-tools` yang akan menyediakan binari `wg` dan `wg-quick`. tapi ane akan pakai `wg` saja. `wg-quick` emang mantap untuk membuat akses wireguard secara cepat, namun ane ingin belajar jadi akan membangunnya dari nol.

### Buat key

Setelah terpasang, langkah selanjutnya adalah membuat direktori khusus yang akan berisi berkas konfigurasi dari wireguard. Ini opsional, berkas wireguard bisa saja ditaruh dimana terserah tapi ane ikuti dulu panduan yang sudah ada dan jamak. Di dalam direktori `/etc/wireguard`, ane akan buat 2 buah key yang diperlukan untuk authentication server wireguard nantinya.

```shell-session
$ doas mkdir -p /etc/wireguard
$ cd /etc/wireguard
$ doas wg genkey | doas tee private.key | doas wg pubkey > public.key
$ cat private.key
QJqx4o8lsM1eZb2u+t4yRctEkjALq2GFJgimdkTphHc=
$ cat public.key
dbXB+Cue2VpYBIjaTYneGgNglJHdgylriDkb014v6nI=
```

<aside>
  Ada alternatif lain yang menurut ane lebih mudah untuk meng-generate private dan public key, yaitu dengan memanfaatkan layanan online dari web <a href="https://wgquick.com/">wgquick</a>.
</aside>

Catat hasil dari `private.key` dan `public.key` karena ini nanti penting untuk konfigurasi.

### Buat konfigurasi untuk Wireguard

<div class="postnotes kuning-gading">
<p>Di OpenBSD ada 2 cara untuk mengatur interface <code>wg0</code> yang pertama adalah mempergunakan konfigurasi resmi dari Wireguard dan yang kedua mempergunakan metode asli khas OpenBSD.</p>
<p>Kelebihan dari metode pertama adalah standar Wireguard bisa langsung diaplikasikan kalo migrasi ke OS yang lain, sedangkan yang kedua karena konfigurasi standar dari OpenBSD sehingga bagi yang sudah terbiasa akan menjadi mudah dan familiar</p>
</div>

#### Cara pertama

Masih di direktori `/etc/wireguard`, ane akan buat berkas konfigurasi wireguard yang akan digunakan untuk mengatur koneksi antara server dan client yaitu `wg0.conf`

```shell-session
$ doas vim wg0.conf
[Interface]
PrivateKey = QJqx4o8lsM1eZb2u+t4yRctEkjALq2GFJgimdkTphHc=
ListenPort = 51820

[Peer]
PublicKey = <kosongin dulu nanti diisi publickey dari klien>
AllowedIPs = 10.0.0.2/32
```

Untuk `PrivateKey`, diisi dengan isi dari berkas `PrivateKey` yang sudah dibuat sebelumnya (yang tadi sudah dicatat. Sudah dicatat kan?). Sedangkan `PublicKey` nanti diisi dengan publickey yang akan dibuat diklien.

untuk interface, buat file baru dengan nama `hostname.wg0` di direktori `/etc`.

```shell-session
$ doas vim /etc/hostname.wg0
inet 10.0.0.1 255.255.255.0
!/usr/local/bin/wg setconf wg0 /etc/wireguard/wg0.conf
up
```

Perhatikan baris kode `!/usr/local/bin/wg setconf wg0 /etc/wireguard/wg0.conf`, perintah ini akan memanggil konfigurasi Wireguard di `/etc/wireguard/wg0.conf` dan akan membacanya saat interface `wg0` diaktifkan.

#### Cara kedua

Untuk cara yang kedua adalah membuat konfigurasi dengan metode tradisional OpenBSD. Untuk interface, buat file baru dengan nama `hostname.wg0` di direktori `/etc`.

```shell-session
$ doas vim /etc/hostname.wg0
wgkey QJqx4o8lsM1eZb2u+t4yRctEkjALq2GFJgimdkTphHc=
wgport 51820
wgpeer <kosongin dulu nanti diisi publickey dari klien> wgaip 10.0.0.2/32
inet 10.0.0.1 255.255.255.0
up
```

Jika memakai cara yang ini tidak perlu membuat file konfigurasi `/etc/wireguard/wg0.conf`. Apapun cara yang dipilih, sementara biarin dulu seperti ini, ane akan atur wireguard di klien terlebih dahulu.

<div class="postnotes hijau">
  <h4>Jika tidak bisa buka situs tertentu</h4>
  <p>MTU standar biasanya di angka 1400, namun jika browsing internet terkendala di Wireguard maka turunkan MTU ke 1392. Caranya adalah menambahkan <code>mtu 1392</code> ke dalam <code>/etc/hostname.wg0</code> sebelum <code>up</code>.</p>
</div>

## Wireguard Client di macos

Ane pakai aplikasi #WireGuard resmi dari Wireguard. Kemudian membuat dan mengatur tunnel kosong baru (lihat gambar).

![wireguard add tunnel](https://ik.imagekit.io/hjse9uhdjqd/jurnal/OpenBSD_Wireguard/SCR-20251129-qxxr__wylSLRT7.png?updatedAt=1764419428366)

<aside class="image">
  <b>No. 1</b> adalah public key dari klien yang nantinya akan di masukkan ke dalam wg0.conf peer publickey yang sebelumnya sudah ane buat.
  <b>No. 2</b> diisi dengan isian dari public.key wireguard di VPS yang sebelumnya sudah dibuat.
  <b>No. 3</b> adalah IP dari VPS dan port dari wireguard.
</aside>

<div class="postnotes">
  <h4>Opsional tapi kadang penting</h4>
  <p>Untuk blok <code>[Interface]</code> kadang perlu memasukkan <code>Address</code> dari <code>wgaip</code> di konfigurasi (dalam hal ini <code>10.0.0.1/32</code>)</p>
  <p>Untuk block <code>[Peer]</code> sangat disarankan untuk menambahkan <code>PersistentKeepalive = 25</code> untuk menjaga koneksi tetap terjaga/terhubung dengan baik</p>
</div>

<div class="postnotes pink">
  <h4>Wireguard sudah terhubung tapi <mark>tidak bisa akses situs tertentu</mark>?</h4>
  <p>Tersangkanya jelas MTU.</p>
  <p>Biasanya sistem akan mengatur MTU secara otomatis, namun untuk beberapa OS tidak mengaturnya di nilai yang sama. Jadi jika di VPS (<i>host</i>) sudah diatur secara manual (misalnya ke nilai 1392) maka di klien harus memakai MTU yang sama. Caranya adalah menambahkan <code>MTU=1392</code> ke dalam blok <code>[Interface]</code>.</p>

  <h4>Tapi bagaimana cara menentukan MTU yang pas untuk wireguard?</h4>
  <p>Ada aplikasi yang bagus untuk membantu menentukan MTU yang sesuai dan optimal, nama aplikasinya <a href="https://github.com/yeya/wire-seek">wire-seek</a>.</p>
  <p>Unduh saja aplikasi ini, sesuaikan dengan OS yang dipakai (ane sesuaikan dengan OS di klien yaitu MacOS). Kemudian jalankan di Terminal/CLI dengan perintah:</p>
  <pre class="language-bash" tabindex="0">  <code class="language-bash">
       <span class="token shell-symbol important">➜</span> ./wire-seek-darwin-arm64 --tunnel <span class="token number">10.0.0.1</span>
       Wire-Seek: WireGuard MTU Optimizer
       Target: <span class="token number">10.0.0.1</span><span class="token punctuation">(</span><span class="token number">10.0.0.1</span><span class="token punctuation">)</span>
       Protocol: IPv4
       Discovering path MTU <span class="token punctuation">(</span>range: <span class="token number">576-1500</span><span class="token punctuation">)</span><span class="token punctuation">..</span>.
       Results:
         Path MTU: <span class="token number">1500</span> bytes
         WireGuard MTU: <span class="token number">1500</span> bytes
       Add to your WireGuard config:
         MTU <span class="token operator">=</span> <span class="token number">1500</span>
    </code>
    </pre>
  <p>Dengan catatan, perintah ini dijalankan saat klien sudah terhubung dengan server Wireguard. IP <code>10.0.0.1</code> adalah IP server Wireguard (bisa diganti dengan IP endpoint namun hapus flag <code>--tunnel</code>). Hasilnya adalah MTU dengan nilai <code>1500</code>, nilai ini kemudian ane masukkan di file konfigurasi <code>wg0.conf</code> di server maupun di klien.</p>
</div>

Simpan dan kembali ke pengaturan wireguard di VPS.

## Finishing WireGuard di VPS

Apapun pilihan jenis konfigurasi WireGuard, setelah mendapatkan `public key` dari klien (dalam hal ini `DQ/kSnXwMGIRmF/40wQhCWCrNe7k4V6zb3Jo92Y3s3w=`) maka bisa dimasukkan ke dalam `wg0.conf` atau di `hostname.wg0` di bagian peer publickey.

Maka isian dari `/etc/wireguard/wg0.conf` akan seperti ini:

```shell-session
$ doas vim /etc/wireguard/wg0.conf
[Interface]
PrivateKey = QJqx4o8lsM1eZb2u+t4yRctEkjALq2GFJgimdkTphHc=
ListenPort = 51820

[Peer]
PublicKey = DQ/kSnXwMGIRmF/40wQhCWCrNe7k4V6zb3Jo92Y3s3w=
AllowedIPs = 10.0.0.2/32
```

atau `/etc/hostname.wg0`:

```txt
wgkey QJqx4o8lsM1eZb2u+t4yRctEkjALq2GFJgimdkTphHc=
wgport 51820
wgpeer DQ/kSnXwMGIRmF/40wQhCWCrNe7k4V6zb3Jo92Y3s3w= wgaip 10.0.0.2/32
inet 10.0.0.1 255.255.255.0
up
```

Selanjutnya adalah mengatur aliran data untuk mengalihkan paket wireguard ke interface `wg0`.

```shell-session
$ doas sysctl net.inet.ip.forwarding=1
$ doas echo "net.inet.ip.forwarding=1" >> /etc/sysctl.conf
```

Tidak cukup ini saja, perlu juga mengatur firewall di `pf.conf`. Ane cukup pusing disini dan butuh waktu yang lama agar bisa berjalan.

```shell-session
$ doas vim /etc/pf.conf
# Set MTU
match on wg0 scrub (max-mss 1352)

# Wireguard
pass in on egress proto udp from any to any port 51820
pass in on wg0
pass out on egress
pass from 10.0.0.0/24 to any
match out on egress from 10.0.0.0/24 to any nat-to (egress)

# SSH
pass in quick on egress proto tcp from any to (egress) port 22
```

Tes firewall jika tidak ada masalah langsung aktifkan.

```shell-session
$ doas pfctl -nf /etc/pf.conf
$ doas pfctl -f /etc/pf.conf
```

Aktifkan wireguard network interface dan cek statusnya.

```shell-session
$ doas sh /etc/netstart wg0
$ doas wg show
interface: wg0
public key: dbXB+Cue2VpYBIjaTYneGgNglJHdgylriDkb014v6nI=
 private key: (hidden)
 listening port: 5

peer: DQ/kSnXwMGIRmF/40wQhCWCrNe7k4V6zb3Jo92Y3s3w=
  endpoint: 103.102.101.100:5976
  allowed ips: 10.0.0.2/32
```

di bagian peer tidak ada keterangan handshake menandakan bahwa klien belum terhubung. Hubungkan klien di aplikasi wireguard dan seharusnya di bagian peer menjadi seperti ini:

```txt
peer: DQ/kSnXwMGIRmF/40wQhCWCrNe7k4V6zb3Jo92Y3s3w=
  endpoint: 103.102.101.100:5976
  allowed ips: 10.0.0.2/32
  latest handshake: 10 seconds ago
  transfer: 1 MiB received, 2 Mib sent
```

kemudian cek akses internet di klien dan cek IP dengan mengunjungi situs [ipleak](https://ipleak.net) seharusnya lokasi dan IPnya sudah sesuai dengan IP dan lokasi VPS.

<div class="postnotes">
  <h5>Update</h5>
  <p>Untuk menambahkan <code>peer</code> baru, sila mengulangi proses <a href="#wireguard-di-vps-1">ini</a>. Kemudian restart ulang interface wireguard, dan cek lagi dengan menjalankan perintah <code>doas wg show</code>. Jika setelah dicek masih ada <code>peer</code> yang lama atau yang baru dimasukkan tidak terlihat, maka coba untuk menghapus interface <code>wg0</code> dan mengaktifkan ulang.</p>

<pre><code>
$ doas ifconfig wg0 destroy
$ doas sh /etc/netstart wg0
$ doas wg show
</code></pre>
<p>Seharusnya data <code>peer</code> sudah diperbarui.</p>
</div>

{{ echo |> terkait("Unbound di OpenBSD", "/jurnal/openbsd-unbound/", "full") }}
Unbound adalah DNS resolver caching recursive yang open-source, ringan, dan secure. Tapi dia punya kemampuan lain yaitu memblokir iklan yang menjengkelkan. Sempurna untuk digabung dengan Wireguard.
{{ /echo }}

#### Killswitch

Killswitch adalah fitur keamanan yang sekarang sepertinya sudah menjadi standar untuk layanan VPN. Fungsinya adalah memutus akses internet saat VPN terputus sehingga tidak ada kebocoroan (_data leak_) berupa IP, DNS, atau data lainnya yang terkait. Hampir semua aplikasi VPN sudah menyediakan fitur ini.

Namun karena ane buat VPN secara mandiri, maka ane hanya pakai aplikasi resmi dari wireguard yang sangat minimalis dan tidak banyak fitur tersedia termasuk killswitch. Karena MacOs sendiri adalah bagian dari keluarga BSD, maka tentu saja MacOs memiliki atau mempergunakan firewall [PF](https://www.openbsd.org/faq/pf/), sehingga bisa dimanfaatkan untuk membuat mode killswitch sendiri.

Inti dari killswitch ini adalah memutus akses keluar masuk saat tidak sedang terhubung ke VPN, script pf sederhananya sebagai berikut

```txt
vpn_ip = '103.102.101.100'
vpn_port = '5128'

set skip on lo0

# block semua akses keluar
block drop out all

# ijinkan akses ke wireguard saja
pass out proto udp from any $vpn_ip to any port $vpn_port
pass on utun4 all
```

<aside>
Simpan sebagai misalnya <code>.pf_killswitch.conf</code> dan taruh di home directory. Tanda titik sebelum nama file berarti membuat file menjadi tersembunyi atau <i>hidden</i>
</aside>

Saat diaktifkan perintah ini akan memblokir semua akses keluar kecuali akses ke wireguard dan akses ke interface `utun4`.

<div class="postnotes kuning-gading">
  <p>Di mac ane, akses wireguard mempergunakan interface <code>utun4</code>. Sesuaikan dengan interface yang digunakan oleh wireguard di sistem ente.</p>
</div>

Cara pakainya adalah, saat VPN sudah terhubung, jalankan perintah berikut:

```shell-session
$ sudo pfctl -fa ~/.pf_killswitch.conf -e
```

Saat sudah tidak memakai VPN, pf ini harus dimatikan supaya tidak memblokir akses internet yang lain. Jalankan perintah berikut:

```shell-session
$ sudo pfctl -d
```

Jika punya pengaturan pf yang lain, maka jangan lupa aktifkan kembali pengaturan pf asli dari Macos dengan perintah berikut:

```shell-session
$ sudo pfctl -f /etc/pf.conf -e
```

Cukup merepotkan bukan?
Tapi diluar sana tidak hanya ane yang repot, sehingga ada seseorang yang kemudian membuat script untuk memudahkan proses ini. Namanya killswitch dari [github](https://github.com/vpn-kill-switch/killswitch) - [https://vpn-kill-switch.com/](https://vpn-kill-switch.com/). Cara pasangnya mudah sekali, dibantu oleh [homebrew](https://brew.sh) dan cara pakainya seperti ini

```shell-session
$ brew install killswitch
$ sudo killswitch -e
$ sudo killswitch -d
```

<aside>
  <ul>
  <li>Flag <code>-e</code> untuk mengaktifkan killswitch</li>
  <li>Flag <code>-d</code> untuk menonaktifkan killswitch</li>
</ul>
</aside>

Sedangkan perintah killswitch sendiri akan menghasilkan informasi terkait interface tersedia dan public IP address yang digunakan oleh VPN.

```shell-session
$ sudo killswitch
Interface  MAC address         IP
en0        76:61:a8:f1:ex:1O   172.20.10.2/16
utun4                          10.0.0.2

Public IP address: 103.102.101.100
PEER IP address:   <nil>

To enable the kill switch run: sudo killswitch -e
To disable: sudo killswitch -d
```

seperti contoh di atas adalah informasi setelah VPN terhubung, masalahnya adalah di `PEER IP address:   <nil>` ini karena killswitch tidak bisa menemukan IP dari Endpoint VPN, bug yang memang muncul jika pakai MacOS. Sehingga saat killswitch dijalankan dia akan bikin semua akses internet terblokir meski sudah terhubung ke VPN.

Jadi agar killswitch bisa mengerti `PEER IP address`, maka perlu menambahkan flag `-ip` untuk menentukan IP address dari Endpoint VPN.

```shell-session
$ sudo killswitch -e -ip 103.102.101.100
$ sudo killswitch
Interface  MAC address         IP
en0        76:61:a8:f1:ex:1O   172.20.10.2/16
utun4                          10.0.0.2

Public IP address: 103.102.101.100
PEER IP address:   103.102.101.100

To enable the kill switch run: sudo killswitch -e
To disable: sudo killswitch -d
```

dan dengan ini killswitch akan menandai akses ke IP Address VPN dan mengaktifkan pf, jika VPN terputus maka killswitch akan memblokir semua akses internet yang meningkatkan keamanan dan privasi pengguna.Jangan lupa mematikan killswitch jika sedang tidak memakai VPN, agar tidak repot ketik perintah manual di terminal gunakan Shortcuts app untuk membuat shortcut.

#### Dengan aplikasi

<img src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/OpenBSD_Wireguard/SCR-20260111-mcap_Z9pGFTPUD.png" alt="Lulu Block Mode, harus manual mengakses menu ini untuk mengaktifkan block mode" />
<aside class="image">
  Butuh waktu dan beberapa klik untuk bisa mengaktifkan block mode ini, meski bisa diatur dengan bantuan shortcut misalnya, tapi ane belum pernah coba
</aside>

Ada beberapa aplikasi yang bisa digunakan sebagai alternatif killswitch seperti [Little Snitch](https://www.obdev.at/products/littlesnitch/index.html) atau [Lulu](https://objective-see.org/products/lulu.html). Dari kedua ini Little Snitch lebih bagus dan mudah namun memang aplikasi berbayar, sedangkan Lulu gratis namun kurang fleksibel dan masih memerlukan campur tangan user (manual aktifkan rules.)

Aplikasi gratis lain yang bisa dipakai adalah Mirham KillSwitch, yang bisa diunduh dari [sini](https://github.com/mirham/KillSwitch). Aplikasi ini akan menaruh ikon di menubar dan tinggal klik untuk memakainya.

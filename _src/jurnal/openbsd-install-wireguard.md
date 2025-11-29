---
title: Wireguard di OpenBSD
ringkasan: "Catatan ane tentang memasang Wireguard di OpenBSD, yang katanya mudah tapi cukup bikin pusing juga"
date: 2025-11-29
tags:
  - kusaeni
  - tutorial
  - openbsd
  - bsd
kategori: jurnal
code: true
favorit: false
comment: true
keywords: bsd, openbsd, wireguard, self host, vpn
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KB7AAT2X97B5D49DADYPP5KS
  real: https://sok.egois.org/@poes/statuses/01KB7AAT2X97B5D49DADYPP5KS
---

Kata orang - orang kalo pakai BSD paling gampang di OpenBSD karena Wireguard sudah ada di dalam base, oke karena memang sudah diinstall OpenBSD bisa langsung lanjut. Akan tetapi, ternyata itu bohong. Semua sama saja, harus mulai dari nol (kayak di BSD lainnya). Mau gimana lagi nasi sudah jadi krupuk maka mau ga mau lanjut.

Catatan ini akan dibagi menjadi 2 bagian yaitu memasang Wireguard di sisi server (VPS) dan sisi client (macos).

## Wireguard di VPS

Karena `wg` (binary dari wireguard) ternyata belum ada di dalam OpenBSD, maka perlu memasangnya secara manual. Sebelum itu ada beberapa hal yang perlu ane catat yaitu VPS ane sudah memakai [OpenBSD 7.8](https://www.openbsd.org/78.html) dengan spesifikasi 1vCPU - 1GB RAM - 25GB SSD dan akan login dengan user bukan root sehingga ane akan pakai `doas` untuk elevasi ke root.

```shell-session
$ doas pkg_add wireguard-tools
```

perintah ini akan memasang `wireguard-tools` yang akan menyediakan binari `wg` dan `wg-quick`. tapi ane akan pakai `wg` saja. `wg-quick` emang mantap untuk membuat akses wireguard secara cepat, namun ane ingin belajar jadi akan membangunnya dari nol.

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

Wireguard membutuhkan ip forwarding dan di OpenBSD perlu dibuat pengaturan untuk interface khusus (dalam hal ini `wg0`).

```shell-session
$ doas sysctl net.inet.ip.forwarding=1
$ doas echo "net.inet.ip.forwarding=1" >> /etc/sysctl.conf
```

untuk interface, buat file baru dengan nama `hostname.wg0` di direktori `/etc`.

```shell-session
$ doas vim /etc/hostname.wg0
wgkey QJqx4o8lsM1eZb2u+t4yRctEkjALq2GFJgimdkTphHc=
wgport 51820
inet 10.0.0.1 255.255.255.0
!/sbin/route add -net 10.0.0.0/24 10.0.0.1

up
```

Sementara biarin dulu seperti ini, ane akan atur wireguard di klien terlebih dahulu.

## Wireguard Client di macos

Ane pakai aplikasi #WireGuard resmi dari Wireguard. Kemudian membuat dan mengatur tunnel kosong baru (lihat gambar).

![wireguard add tunnel](https://ik.imagekit.io/hjse9uhdjqd/jurnal/OpenBSD_Wireguard/SCR-20251129-qxxr__wylSLRT7.png?updatedAt=1764419428366)

<aside>
  <b>No. 1</b> adalah public key dari klien yang nantinya akan di masukkan ke dalam wg0.conf peer publickey yang sebelumnya sudah ane buat.
  <b>No. 2</b> diisi dengan isian dari public.key wireguard di VPS yang sebelumnya sudah dibuat.
  <b>No. 3</b> adalah IP dari VPS dan port dari wireguard.
</aside>

Simpan dan kembali ke pengaturan wireguard di VPS.

## WireGuard di VPS

Setelah mendapatkan `public key` dari klien (dalam hal ini `DQ/kSnXwMGIRmF/40wQhCWCrNe7k4V6zb3Jo92Y3s3w=`) maka bisa dimasukkan ke dalam `wg0.conf` di bagian peer publickey.

```shell-session
$ doas vim /etc/wireguard/wg0.conf
[Interface]
PrivateKey = QJqx4o8lsM1eZb2u+t4yRctEkjALq2GFJgimdkTphHc=
ListenPort = 51820

[Peer]
PublicKey = DQ/kSnXwMGIRmF/40wQhCWCrNe7k4V6zb3Jo92Y3s3w=
AllowedIPs = 10.0.0.2/32
```

Selanjutnya adalah mengatur aliran data untuk mengalihkan paket wireguard ke interface `wg0`.

```shell-session
$ doas sysctl net.inet.ip.forwarding=1
$ doas echo "net.inet.ip.forwarding=1" >> /etc/sysctl.conf
```

Tidak cukup ini saja, perlu juga mengatur firewall di `pf.conf`. Ane cukup pusing disini dan butuh waktu yang lama agar bisa berjalan.

```shell-session
$ doas vim /etc/pf.conf
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

ktifkan wireguard network interface dan cek statusnya.

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

---
title: "Blocklistd: cara ampuh menghalau penyusup di FreeBSD"
ringkasan: "pasangkan dengan SSH Guard maka ane punya pertahanan berlapis."
date: 2026-01-14
tags:
  - tutorial
  - freebsd
  - bsd
  - security
kategori: jurnal
code: true
favorit: false
comment: true
keywords: bsd, freebsd, ente, security, tutorial
draft: false
tocx: false
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KEYD0GSTPZ8YBBVAK3K8RCX6
  real: https://sok.egois.org/@poes/statuses/01KEYD0GSTPZ8YBBVAK3K8RCX6
---

Semua yang online pasti beresiko atas perentasan, meski bilangnya sistem paling kuat tapi _assume everything will be attacked_ atau _no system is safe_. Teknik awal dalam perentasan adalah melakukan _scanning ports_ dan kemudian mengeksploitasinya, yang paling sering diincar adalah port SSH dan FTP. Meskipun banyak sekali teknik dalam perentasan, namun paling tidak mengamankan _ports_ ini adalah langkah awal yang baik.

### Blocklistd

Blacklistd (sekarang sudah dirubah menjadi Blocklistd) adalah salah satu fitur di FreeBSD yang berguna untuk membuka atau menutup sebuah port dengan kriteria tertentu. Apalagi jika masih mempergunakan port standar untuk SSH yaitu di port 22. Saat selesai install FreeBSD (di VPS), tak lama kemudian akan bermunculan para hiu mencoba _bruteforce_ akses SSH, dengan pelbagai macam cara dimana IP yang sering sekali mencoba berasal dari Asia. Maka Blocklistd ini sangat berguna untuk menghalau dan memblokir alamat IP tersebut untuk mengakses SSH. Secara fungsi mirip dengan [fail2ban](https://www.fail2ban.org/) yaitu memblokir alamat IP yang gagal login SSH dengan rentang waktu tertentu.

Blocklistd sudah ada di dalam FreeBSD, tidak perlu memasangnya lagi, dan tinggal mengaktifkan saja.

```shell-session
$ doas sysrc blocklistd_enable="YES"
$ doas sysrc blocklistd_flags="-r"
```

ini akan mengaktifkan Blocklistd dan akan tersedia setiap sistem dimulai ulang, untuk sistem yang sudah berjalan tinggal perintahkan untuk `start`

```shell-session
$ doas service blocklistd start
```

Khusus untuk memonitor SSH, maka rubah konfigurasi SSH untuk mengaktifkan Blocklistd.

```shell-session
$ doas sysrc sshd_flags="-o UseBlacklistd=yes"
```

atau langsung rubah file konfigurasi `sshd_config.conf` dan _uncomment_ baris `UseBlacklistd yes` (jika masih `no` tinggal ganti ke `yes`). Setelah merubah konfigurasi atau menambahkan baris di `/etc/rc.conf`, layanan SSH harus di _restart_.

```shell-session
$ doas service sshd restart
```

Di FreeBSD semua hal yang berkaitan dengan akses jaringan, maka PF pasti akan ikutan bermain. Maka rubah konfigurasi PF untuk mengaktifkan Blocklistd.

```txt
table <blocklistd> persist
anchor "blacklistd/*" in on $ext_if

block in quick from <blocklistd>
```

<aside>
  <ul><li>rubah <code>$ext_if</code> dengan nama interface yang bisa dicek dengan <code>ifconfig</code></li>
    <li>baris <code>block in quick from <blocklistd></code> ini berguna untuk memblok IP yang terjaring oleh Blocklistd, tapi ini opsional</li></ul>
</aside>

Untuk menentukan waktu tunggu sampai sebuah IP bisa kembali mengakses SSH, maka perlu merubah konfigurasi Blocklistd.

```shell-session
$ doas ee /usr/local/etc/blocklistd.conf
location      type    proto   owner   name    nfail   duration
vtnet:ssh        *       *       *       *       3       72h
```

dimana perintah ini akan membuat Blocklistd memonitor _port_ SSH di _interface_ `vtnet`, jika sebuah IP gagal login 3 kali, maka IP tersebut akan diblokir selama 72 jam. Pengaturan 72 jam ini bisa saja diubah sesuai keinginan, 2400h untuk 100 hari.

<div class="postnotes pink">
  <p>Setiap perubahan file konfigurasi harus diikuti dengan restart service yang konfigurasinya diubah agar perubahan bisa diterapkan.</p>
</div>

Tapi bagaimana jika ini menjadi pedang bermata dua saat kita sendiri gagal login ke SSH? Maka caranya adalah menghapus IP kita dari _table_ `blocklistd` dengan perintah berikut.

```shell-session
$ doas pfctl -a "blocklistd/22" -t port22 -T delete <IP>
```

Ini akan menghapus IP kita dari _table_ `blocklistd` sehingga kita bisa kembali mengakses SSH. Lalu bagaimana cara melihat IP apa saja yang terjaring oleh Blocklistd? Ada perintah khusus untuk itu

```shell-session
$ doas blocklistctl dump -abr
rulename                address/ma:port id      nfail   remaining time
blocklistd       143.198.161.12/32:22   OK      3/3     5h29m32s
blocklistd          54.38.52.18/32:22   OK      3/3     8h51m11s
blocklistd         46.151.182.7/32:22           1/3     10h16m37s
blocklistd       103.105.176.66/32:22   OK      3/3     17h39m40s
blocklistd          161.35.92.3/32:22           1/3     5h31m23s
blocklistd        45.78.193.199/32:22   OK      3/3     6h10m2s
blocklistd       209.15.115.240/32:22   OK      3/3     11h12m9s
blocklistd        153.99.94.233/32:22           1/3     11h13m45s
blocklistd       122.55.205.229/32:22   OK      3/3     13h39m36s
```

### SSH Guard

Selain Blocklist, FreeBSD juga memiliki SSH Guard untuk melindungi _port_ SSH dari serangan, khususnya metode _brute-force attack_. SSH Guard akan mengumpulkan data dari _system log_ dan memblokir IP pelaku pelanggaran berulang mempergunakan kemampuan dari _firewall_. Tidak seperti Blocklist, SSH Guard bisa melakukan pemblokiran secara permanen atau sementara waktu saja.

SSH Guard bisa dipasangkan dengan PF, [IPFW](https://en.wikipedia.org/wiki/Ipfirewall), [firewalld](https://firewalld.org/), maupun IPtables ([nftables](https://www.netfilter.org/projects/nftables/index.html)) sebagai `backend`.

```shell-session
$ doas pkg install sshguard
$ doas sysrc sshguard_enable="YES"
$ doas vim /usr/local/etc/sshguard.conf
```

sebelum mengaktifkan SSH Guard, perlu melakukan [sshguard-setup](https://manned.org/man/arch/sshguard-setup.7), yaitu dengan mengubah _file_ `/usr/local/etc/sshguard.conf`. Beberapa hal yang perlu ane sesuaikan, karena pakai PF maka ane _uncomment_ baris `BACKEND`.

```txt
BACKEND="/usr/local/libexec/sshg-fw-pf"
```

Selain itu agar IP ane tidak diblokir maka ane perlu _uncomment_ juga baris `WHITELIST`.

```txt
WHITELIST_FILE=/usr/local/etc/sshguard.whitelist
```

Kemudian bikin file `/usr/local/etc/sshguard.whitelist` dengan isian IP yang hendak diijinkan. Masalahnya adalah ane tidak punya IP publik (CG NAT), maka ane masukkan IP yang bisa dicek di situs seperti [WhatIsMyIPAddress](https://whatismyipaddress.com/). Misalkan hasilnya `100.99.98.97` maka ane masukkan subnetnya `100.99.98.0/24`. Yang dimasukkan cukup IP saja, 1 baris 1 IP.

Untuk pengaturan PF, maka perlu ditambahkan baris berikut di `/etc/pf.conf`

```ini
table <sshguard> persist
block in proto tcp from <sshguard>
```

Kemudian `restart` PF dan jalankan SSH Guard,

```shell-session
$ doas pfctl -nf /etc/pf.conf
$ doas pfctl -f /etc/pf.conf
$ doas service sshguard start
```

Contoh hasil penjaringan oleh SSH Guard:

```log
Jan 14 20:27:54 oyenBSD sshd-session[56374]: Invalid user admin from 103.23.199.119 port 44768
Jan 14 20:27:54 oyenBSD sshguard[56323]: Attack from "103.23.199.119" on service SSH with danger 10.
Jan 14 20:27:55 oyenBSD sshd-session[56374]: Received disconnect from 103.23.199.119 port 44768:11: Bye Bye [preauth]
Jan 14 20:28:06 oyenBSD sshd-session[56376]: Received disconnect from 188.37.194.181 port 46948:11: Bye Bye [preauth]
Jan 14 20:28:12 oyenBSD sshd-session[56378]: Invalid user ubuntu from 45.78.204.234 port 49542
Jan 14 20:28:12 oyenBSD sshguard[56323]: Attack from "45.78.204.234" on service SSH with danger 10.
Jan 14 20:28:13 oyenBSD sshd-session[56378]: Received disconnect from 45.78.204.234 port 49542:11: Bye Bye [preauth]
```

Untuk melihat daftar IP yang diblokir SSH Guard, bisa menggunakan perintah berikut:

```shell-session
$ doas pfctl -t sshguard -T show
103.23.199.119
```

<aside>kalo isi table sshguard kosong, berarti belum ada IP yang terjaring. Biasanya dalam perjalanan waktu akan muncul IP yang tertangkap oleh SSH Guard.</aside>

### Cara lainnya (mudah)

Daripada ribet dan repot mengatur Blocklist dan atau SSH Guard, ada cara atau trik khusus yang sering ane pakai dan selalu berjalan lancar yaitu merubah _port_ SSH ke _custom port_ acak lainnya. Kenapa? karena bot lebih banyak _scrapping_ dan _brute force_ pada _port_ standar.

*Default*nya _port_ SSH adalah `22`, jadi ane akan rubah misalnya menjadi `2277`. Maka ane perlu merubah `pf.conf` dan `sshd_config`.

```shell-session
$ doas ee /etc/pf.conf
pass in quick inet proto tcp from any to any port 2277 flags S/SA keep state
$ doas ee /etc/ssh/sshd_config
Port 2277
```

kemudian _restart_ SSH dan PF

```shell-session
$ doas service sshd restart
$ doas service pf restart
```

Aman.

### Pilih yang mana?

Jika kamu pengguna NetBSD maka Blocklist sudah ada di dalam sistem dan sudah jalan dengan baik, sedangkan kalo pakai FreeBSD harus mengaktifkannya secara manual. SSH Guard bukanlah aplikasi _native_ di dalam sistem, perlu memasangnya dulu tapi kelebihannya tersedia untuk pelbagai OS (di luar BSD). Selain itu SSH Guard juga punya kelebihan untuk monitor banyak _ports_, jadi jika di sistem punya banyak _service_ yang perlu dimonitor SSH Guard cocok sekali dipakai. Namun jika cuma port SSH atau FTP, maka Blocklist sudah lebih dari cukup.

Mengganti _port_ SSH dengan _custom port_ mungkin terlihat aman untuk waktu tertentu, tapi bot semakin hari semakin canggih sehingga bisa saja nantinya akan meng-_scan port_ lain dan tinggal tunggu waktu untuk ketemu. Jadi tetap memasang Blocklist adalah pilihan yag bijaksana, apalagi Blocklist ringan dan tidak memakan _resources_ yang tinggi.

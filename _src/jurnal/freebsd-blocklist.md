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
relasi: freebsd
code: true
favorit: false
comment: true
keywords: bsd, freebsd, ente, security, tutorial
draft: false
tocx: true
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KEYD0GSTPZ8YBBVAK3K8RCX6
  real: https://sok.egois.org/@poes/statuses/01KEYD0GSTPZ8YBBVAK3K8RCX6
---

Semua yang online pasti beresiko atas perentasan, meski bilangnya sistem paling kuat tapi _assume everything will be attacked_ atau _no system is safe_. Teknik awal dalam perentasan adalah melakukan _scanning ports_ dan kemudian mengeksploitasinya, yang paling sering diincar adalah port SSH dan FTP. Meskipun banyak sekali teknik dalam perentasan, namun paling tidak mengamankan _ports_ ini adalah langkah awal yang baik.

### Blocklistd

Blacklistd (sekarang sudah dirubah menjadi Blocklistd) adalah salah satu fitur di FreeBSD yang berguna untuk membuka atau menutup sebuah port dengan kriteria tertentu. Apalagi jika masih mempergunakan port standar untuk SSH yaitu di port 22. Saat selesai install FreeBSD (di VPS), tak lama kemudian akan bermunculan para hiu mencoba _bruteforce_ akses SSH, dengan pelbagai macam cara dimana IP yang sering sekali mencoba berasal dari Asia. Maka Blocklistd ini sangat berguna untuk menghalau dan memblokir alamat IP tersebut untuk mengakses SSH. Secara fungsi mirip dengan [fail2ban](https://www.fail2ban.org/) yaitu memblokir alamat IP yang gagal login SSH dengan rentang waktu tertentu.

<div class="postnotes">
  <p>Perubahan nama dari Blacklistd ke Blocklistd ini mengikuti dari perubahan yang dilakukan oleh NetBSD. FreeBSD mengimpor fungsi ini dari NetBSD, sehingga saat nama berubah maka FreeBSD mengikuti untuk menjaga kompatibilitas. Meski begitu ada kabar menyebutkan bahwa perubahan ini untuk menghindari kesan rasis kepada sekelompok komunitas.</p>
  <p>Beberapa istilah yang dirubah di antaranya:</p>
  <ul>
    <li><b>Blacklistd</b> (daftar hitam) menjadi <b>Blocklistd</b> (daftar cekal)</li>
    <li><b>Whitelist</b> (daftar putih) menjadi <b>Allowlist</b> (daftar diijinkan)</li>
  </ul>
</div>

Blocklistd sudah ada di dalam FreeBSD, tidak perlu memasangnya lagi, dan tinggal mengaktifkan saja.

```shell-session
$ doas sysrc blocklistd_enable="YES"
$ doas sysrc blocklistd_flags="-r"
```

<aside>
<i>flags</i> <code>-r</code> untuk membuat <i>rules</i> blocklist tetap tersedia setelah reboot.
</aside>

ini akan mengaktifkan Blocklistd dan akan tersedia setiap sistem dimulai ulang, untuk sistem yang sudah berjalan tinggal perintahkan untuk `start`

```shell-session
$ doas service blocklistd start
```

#### SSH

Khusus untuk memonitor SSH, maka rubah konfigurasi SSH untuk mengaktifkan Blocklistd.

```shell-session
$ doas sysrc sshd_flags="-o UseBlocklistd=yes"
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

dimana perintah ini akan membuat Blocklistd memonitor _port_ SSH di _interface_ `vtnet`, jika sebuah IP gagal login 3 kali, maka IP tersebut akan diblokir selama 72 jam. Pengaturan 72 jam ini bisa saja diubah sesuai keinginan, 2400h untuk 100 hari, namun perhatikan juga bahwa semakin lama waktu tunggu maka <mark>semakin banyak IP yang tercatat dan bisa saja memenuhin table PF sehingga membutuhkan sumber daya lebih untuk memprosesnya</mark>.

<div class="postnotes pink">
  <p>Setiap perubahan file konfigurasi harus diikuti dengan restart service yang konfigurasinya diubah agar perubahan bisa diterapkan.</p>
</div>

Tapi bagaimana jika ini menjadi pedang bermata dua saat kita sendiri gagal login ke SSH? Maka caranya adalah menghapus IP kita dari _table_ `blocklistd` dengan perintah berikut.

```shell-session
$ doas pfctl -a "blocklistd/22" -t port22 -T delete <IP>
```

Ini akan menghapus IP kita dari PF sehingga kita bisa kembali mengakses SSH, namun masih akan muncul di dalam table `blocklistd` dan akan dihapus saat masa tunggu _expired_. Lalu bagaimana cara melihat IP apa saja yang terjaring oleh Blocklistd? Ada perintah khusus untuk itu.

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

<aside>
  tanda <code>OK</code> menandakan bahwa IP tersebut sudah terblok. Sedangkan yang tidak ada menandakan IP tersebut sudah ditandai namun belum masuk ke dalam table blocklist.
</aside>

Untuk melihat data IP dengan PF, gunakan perintah seperti ini

```shell-session
# pfctl -a blacklistd/22 -t port22 -T show
143.198.161.12
54.38.52.18
46.151.182.7
103.105.176.66
```

#### FTP

Pada dasarnya Blocklistd akan memblok port's yang sudah diatur di `/etc/blocklistd.conf` salah satunya FTP. Jika memakai FTP sebagai koneksi ke server, maka bentuk pengamanannya adalah dengan menambahkan _flags_ `-B` setelah _command_ FTP.

Pengaturannya bisa di `/etc/inetd.conf` atau langsung di `/etc/rc.conf`. Berikut cara mengaturnya di `rc.conf`

```shell-session
$ doas sysrc ftpd_flags="-B"
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

### Cara lainnya (paling mudah)

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

Aman? mungkin. Tapi bisa saja akan ketahuan saat bot melakukan scan terhadap semua port. Pengalaman ane, dari 100x bot tertangkap ada 1 atau 2 bot yang berusaha terhubung ke _custom port_ ini.

### Pilih yang mana?

Jika kamu pengguna NetBSD maka Blocklist sudah ada di dalam sistem dan sudah jalan dengan baik, sedangkan kalo pakai FreeBSD harus mengaktifkannya secara manual. SSH Guard bukanlah aplikasi _native_ di dalam sistem, perlu memasangnya dulu tapi kelebihannya tersedia untuk pelbagai OS (di luar BSD). Selain itu SSH Guard juga punya kelebihan untuk monitor banyak _ports_, jadi jika di sistem punya banyak _service_ yang perlu dimonitor SSH Guard cocok sekali dipakai. Namun jika cuma port SSH atau FTP, maka Blocklist sudah lebih dari cukup.

Mengganti _port_ SSH dengan _custom port_ mungkin terlihat aman untuk waktu tertentu, tapi bot semakin hari semakin canggih sehingga bisa saja nantinya akan meng-_scan port_ lain dan tinggal tunggu waktu untuk ketemu. Jadi tetap memasang Blocklist adalah pilihan yag bijaksana, apalagi Blocklist ringan dan tidak memakan _resources_ yang tinggi.

### Update: Pengamanan SSH lanjutan

Meskipun sudah memasang Blocklist atau SSH Guard, akan lebih baik lagi jika akses ke SSH diamankan lebih kuat lagi. Salah dua cara paling umum dan disarankan adalah tidak memberikan akses untuk login ke SSH dengan _password_ melainkan dengan SSH Pubkey ID dan tidak memberikan ijin _user_ root untuk _login_ dengan SSH.

<ol>
<li><b>Login dengan SSH Public Key</b></li>
<ul>
<li>Buat public key, katakanlah hendak membuat public key khusus untuk akses ke SSH</li>
</ul>
<pre class="language-shell-session" tabindex="0"><code class="language-shell-session"><span class="token command"><span class="token shell-symbol important">$</span> <span class="token bash language-bash">ssh-keygen -t ed25519 -C "ssh-FreeBSD"</span></span>
</code></pre>
<p>ikuti semua prompt yang muncul sampai selesai. Setelah selesai seharusnya file public key sudah tersedia di <code>~/.ssh/id_ed25519.pub</code></p>
<pre class="language-shell-session" tabindex="0"><code class="language-shell-session"><span class="token command"><span class="token shell-symbol important">$</span> <span class="token bash language-bash">cat ~/.ssh/id_ed25519.pub</span></span>
</code></pre>
<p>akan muncul baris teks kode acak dengan awalan <code>SSH-ed25519</code></p>
<ul>
<li>Salin file <code>id_ed25519.pub</code> ke VPS</li>
</ul>
<pre class="language-shell-session" tabindex="0"><code class="language-shell-session"><span class="token command"><span class="token shell-symbol important">$</span> <span class="token bash language-bash">ssh-copy-id -i ~/.ssh/id_ed25519.pub poes@oyenBSD</span></span>
</code></pre>
<p>ikuti prompt dan proses yang muncul seperti minta <i>password login</i> ke SSH.</p>
</ol>

2. **Menolak root login lewat SSH.**
   Para penyerang biasanya akan memakai _username_ root untuk melakukan serangan, jadi membatasi akses root untuk login ke SSH adalah pilihan yang tepat. Caranya adalah dengan mengubah konfigurasi `sshd_config`.

   ```shell-session
   $ doas vim /etc/ssh/sshd_config
   ---
   PermitRootLogin no
   PasswordAuthentication no
   PubkeyAuthentication yes
   PermitEmptyPasswords no
   KbdInteractiveAuthentication no
   ---
   ```

   Di `sshd_config.conf` cari baris konfigurasi di atas, hilangkan tanda `#` atau komentar, kemudian sesuaikan isinya seperti baris - baris di atas. Penjelasannya sebagai berikut:

<div class="ragu">

| Isi konfig                        | Keterangan                                             |
| :-------------------------------- | :----------------------------------------------------- |
| `PermitRootLogin no`              | Baris ini menonaktifkan akun `root` untuk akses SSH    |
| `PasswordAuthentication no`       | Bikin SSH tidak pakai password tapi pakai cara lain    |
| `PubkeyAuthentication yes`        | Cara lain yang dipakai yaitu pakai SSH public key      |
| `PermitEmptyPasswords no`         | Password ga boleh kosong dong, ya kan?                 |
| `KbdInteractiveAuthentication no` | Ga wajib, tapi sebaiknya diatur. Ane juga kurang paham |

</div>

      Kemudian _restart_ SSH dengan `$ doas service sshd restart` dan coba login ke SSH lagi. Seharusnya prompt yang muncul adalah \_password dari file `id_ed25519.pub` yang sebelumnya ane buat.

      ```shell-session
      ➜  ~ ssh poes@oyenBSD
      Enter passphrase for key '/Users/poes/.ssh/id_ed25519':
      ```

3.  **Pakai _rate limit_ untuk membatasi jumlah akses**.
    Mengatur _rate limiting_ akan membuat _firewall_ mencegah serangan _brute force attack_ dengan membatasi jumlah koneksi pada port SSH dalam kurun waktu tertentu. Untuk ini PF bisa meng*handle*nya dengan baik.

    Jika Blocklistd akan memblok akses jika dalam beberapa kali percobaan gagal login dengan sukses di SSH, maka PF akan memblok akses bahkan sebelum percobaan login terjadi. Maka rubah bagaimana PF mengatur akses ke SSH

    ```shell-session
    $ doas vim /etc/pf.conf
    pass in on $ext_if proto tcp from any to any port 22 /
    flags S/SA keep state (max-src-conn 10, max-src-conn-rate 5/60)
    $ doas pfctl -nf /etc/pf.conf
    $ doas pfctl -f /etc/pf.conf
    ```

    <aside>
    <ul>
      <li>perintah <code>pfctl -nf /etc/pf.conf</code> digunakan untuk mencoba apakah <i>rules</i> <code>pf.conf</code> ada masalah (salah syntax) atau tidak.</li>
      <li>perintah <code>pfctl -f /etc/pf.conf</code> digunakan untuk meng<i>reload</i> <i>rules</i> tanpa me<i>restart service</i></li> 
    </ul>
    </aside>

    Perintah ini akan membuat PF memeriksa jumlah akses secara bersamaan dan mencoba akses ke SSH dengan maksimal 5 percobaan dalam semenit (60 detik). Jika percobaan (biasanya oleh _bot_) itu lebih dari 5 kali dalam semenit maka PF akan mengabaikan koneksi ini.

    Digabungkan dengan Bloclistd maka PF akan menolak akses dari IP yang mencoba akses lebih dari 5 kali dalam kurun satu menit, jika tidak maka akan muncul _prompt login_ SSH. Jika gagal login sebanyak 3x karena salah _password_, maka Blocklistd akan memblokir aksesnya dalam jangka waktu yang sudah ditentukan (misalnya 100 hari).

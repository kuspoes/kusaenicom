---
title: Unbound di OpenBSD
ringkasan: "DNS Resolver yang cepat, memperkuat privasi sekaligus memblok iklan"
date: 2025-12-07
tags:
  - kusaeni
  - tutorial
  - openbsd
  - bsd
kategori: jurnal
code: true
favorit: false
comment: true
keywords: bsd, openbsd, wireguard,unbound, adsblock, self host, vpn
templateEngine: vto, md
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KBVV3FPM7M0Y53ASN498SM5A
  real: https://sok.egois.org/@poes/statuses/01KBVV3FPM7M0Y53ASN498SM5A
---

**TLDR**: [Unbound](https://man.openbsd.org/unbound) adalah sebuah _tool_ untuk mengvalidasi, menyimpan DNS secara lokal, dan mencari DNS secara rekursif (sampai ke root DNS) yang sudah tersedia di `base` OpenBSD. Gunanya tentu meningkatkan privasi karena tidak mengarahkan langsung _domain resolver_ DNS _provider_ seperti Google DNS (8.8.8.8), Cloudflarfe DNS (1.1.1.1), atau Quad9 (9.9.9.9).

Maka ane perlu memasang _tools_ ini untuk disandingkan dengan Wireguard yang [sebelumnya sudah dipasang](https://kusaeni.com/jurnal/openbsd-install-wireguard/). Selain sebagai DNS Resolver nantinya ane akan pasang _ads blocker_ juga untuk menghalau iklan dan menghemat bandwitdh.

{{ echo |> terkait("Wireguard di OpenBSD", "/jurnal/openbsd-install-wireguard/", "full" )}}
WireGuard adalah VPN protokol yang modern, sederhana, cepat, dan secure. Dibanding protokol lainnya (OpenVPN, IPSec), WireGuard dirancang dengan filosofi minimalis - konfigurasi lebih mudah, dan performa lebih tinggi. Begini cara pasangnya di OpenBSD.
{{ /echo }}

---

### Memasang Unbound

Karena sudah tersedia di `base` maka tinggal diperiksa apakah Unbound sudah berjalan atau belum. Jika _fresh install_ atau _default_ OpenBSD akan pakai [Unwind](https://man.openbsd.org/unwind) sebagai DNS Resolver, Unwind ini mirip Unbound tapi lebih sederhana namun tidak bisa disandingkan dengan Wireguard secara langsung karena secara _default_ hanya LISTEN di localhost saja. Jika Unwind berjalan sebagai DNS Resolver, seharusnya Unbound tidak akan berjalan demikian pula sebaliknya. Cek apakah Unwind sudah jalan, jika iya harus dimatikan.

```shell-session
$ doas rcctl check unwind
unwind(ok)
$ doas stop unwind && doas disable unwind
unwind (failed)
```

<aside>
  Defaultnya saat disable sebuah service, OpenBSD akan menampilkan pesan <code>(failed)</code> jika service tersebut (sudah) tidak berjalan.
</aside>

Kemudian jalankan Unbound

```shell-session
$ doas rcctl check unbound
unbound (failed)
$ doas rcctl enable unbound
unbound (ok)
$ doas rcctl start unbound
unbound (ok)
```

#### Cek nameserver yang dipakai

Seperti keluarga NIX lainnya, OpenBSD juga pakai `/etc/resolv.conf` sebagai DNS Resolution.

```shell-session
$ cat /etc/resolv.conf
nameserver 127.0.0.1
nameserver 8.8.8.8 # resolvd: vio0
nameserver 9.9.9.9 # resolvd: vio0
lookup file bind
```

Jika `nameserver 127.0.0.1` sudah ada di dalam file `/etc/resolv.conf` maka sebenarnya sudah siap untuk memanfaatkan Unbound (atau Unwind) namun jika tidak ada maka harus mengatur secara manual file ini (menambahkan _entry_ ke dalam file ini).

Untuk `# resolvd: vio0` menandakan bahwa baris _entry_ tersebut ditulis oleh [resolvd](https://man.openbsd.org/resolvd), hal ini bisa menyebabkan konflik karena `resolvd` lebih mengutamakan Unwind. Untuk itu _daemon_ ini harus di-_disable_ karena [dhclient](https://man.openbsd.org/OpenBSD-7.5/dhclient) sebagai pengelola file `/etc/resolv.conf` kemungkinan akan menulis ulang file ini ketika selesai di-_edit_ sehingga file `/etc/resolv.conf` akan balik ke default.

```shell-session
$ doas rcctl check resolvd
resolvd(ok)
$ doas rcctl stop resolvd && doas rcctl disable resolvd
resolv (failed)
```

Dalam banyak kasus yang ane temukan, `nameserver 127.0.0.1` tidak ada di dalam file `/etc/resolv.conf` karena di-_overwrite_ oleh `dhclient` dan biasanya tidak bisa di-_edit_ bahkan dengan akun `root` sekalipun. Namun kadang kala masih bisa ~~dirubah~~ ditambahkan _entry_-nya dengan cara ini

```shell-session
$ doas echo 'nameserver 127.0.0.1' > /etc/resolv.conf
```

secepatnya setelah perintah ini, beri status _imuttable_ ke file ini agar `dhclient` ga bisa balikin isinya ke semula.

```shell-session
$ doas chflags schg /etc/resolv.conf
```

<div class="postnotes pink">
  <p>Jika cara di atas tidak berhasil dan atau karena pakai VPS yang mau tak mau harus pakai <code>dhcp</code> untuk mendapatkan IP, maka gunakan file <code>/etc/dhclient.conf</code> untuk menambahkan <i>entry</i> nameserver</p>
  <pre>   <code>
      $ doas vim /etc/dhclient.conf
      prepend domain-name-servers 127.0.0.1;
    </code>  </pre>
</div>

### Konfigurasi Unbound

_Default_-nya konfigurasi Unbound terletak di `/var/unbound/etc/unbound.conf`, konfigurasi minimalis yang bisa dipakai untuk mengawali adalah sebagai berikut

```shell-session
$ doas vim /var/unbound/etc/unbound.conf
```

```yaml
server:
    verbosity: 1
    interface: 127.0.0.1
    interface: 10.0.0.1                # IP server Wireguard
    access-control: 127.0.0.0/8 allow
    access-control: 10.0.0.0/24 allow. # IP range Wireguard
    cache-max-ttl: 86400
    cache-min-ttl: 3600
    hide-identity: yes
    hide-version: yes
    harden-glue: yes
    harden-dnssec-stripped: yes
    auto-trust-anchor-file: "/var/unbound/db/root.key"
    prefetch: yes

forward-zone:
    name: "."
    forward-tls-upstream: yes
    forward-addr: 1.1.1.1@853         # Cloudflare DNS over TLS
    forward-addr: 9.9.9.9@853         # Quad9 DNS over TLS
```

<aside>
  Perhatikan bagian <code>verbosity: 1</code>, ini penting untuk menampilkan log dari unbound, pilihan lainnya adalah 2, 3, 4, atau 5. Semakin tinggi nilainya maka semakin jelas log yang ditampilkan.
</aside>

Di bagian `interface: 10.0.0.1` perlu ditambahkan agar IP server dari Wireguard bisa dijadikan sebagai IP DNS resolver selain 127.0.0.1 (<mark>ini adalah kelebihan dari Unbound yang tidak bisa/dimiliki oleh Unwind</mark>). Sekalian ane tambahkan `access-control: 10.0.0.0/24 allow` untuk megijinkan semua IP di dalam Wireguard memanfaatkan Unbound.

simpan file ini dan kemudian _reload_ `unbound`

```shell-session
$ doas rcctl reload unbound
unbound (ok)
```

jika hasilnya _failed_, cek ulang konfigurasi `unbound.conf` dengan perintah

```shell-session
$ doas unbound-checkconf
unbound-checkconf: no errors in /var/unbound/etc/unbound.conf
```

### Percobaan

Waktunya untuk mencoba!.

```shell-session
$ dig kusaeni.com
; <<>> dig 9.10.8-P1 <<>> kusaeni.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 34850
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 1232
;; QUESTION SECTION:
;kusaeni.com.                   IN      A

;; ANSWER SECTION:
kusaeni.com.            12014   IN      A       34.120.54.55

;; Query time: 17 msec
;; SERVER: 127.0.0.1#53(127.0.0.1)
;; WHEN: Sun Dec 07 13:22:42 WIB 2025
;; MSG SIZE  rcvd: 56
```

Alhamdulillah Unbound sudah berjalan, bisa dicek di baris `;; SERVER: 127.0.0.1#53(127.0.0.1)` dimana _resolver_ sekarang memakain IP `127.0.0.1` sebagai DNS _resolver_ utama.

Kemudian ane sambungkan MacOS (wireguard klien) ke server namun sebelum itu ane rubah pengaturan DNS di Wireguard agar mengarah ke _10.0.0.1_ yaitu DNS server Wireguard.

![Wireguard Client Config, change DNS Resolver IP](https://ik.imagekit.io/hjse9uhdjqd/jurnal/Unbound/SCR-20251207-Unbound_bzEPcBfMq.png)

di terminal dicoba untuk tes _resolver_

```shell-session
➜  ~ dig kusaeni.com

; <<>> DiG 9.10.6 <<>> kusaeni.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 5
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 1232
;; QUESTION SECTION:
;kusaeni.com.                   IN      A

;; ANSWER SECTION:
kusaeni.com.            11880   IN      A       34.120.54.55

;; Query time: 171 msec
;; SERVER: 10.0.0.1#53(10.0.0.1)
;; WHEN: Sun Dec 07 13:24:56 WIB 2025
;; MSG SIZE  rcvd: 56
```

Terlihat bahwa klien sudah mempergunakan IP dari server Wireguard sebagai _resolvers_.

### Block Ads/iklan

Jutaan orang tau kalo _browsing_ di internet itu sering banget diganggu dengan iklan yang bejibun, untuk itu orang sering pakai [µBlock Origin](https://ublockorigin.com/) untuk menghalau iklan. _Powerfull_ namun sayangnya hanya tersedia di _browser_ tidak _system wide_. Unbound bisa bantu untuk masalah yang terakhir ini, karena _blocking_ berada di sisi DNS maka efeknya akan _system wide_ alias global selama pakai DNS tersebut. Caranya seperti ini

Unduh dulu daftar URL iklan yang sudah dikurasi oleh orang - orang, ane pakai dari Steven Black.

```shell-session
$ doas mkdir -p /var/unbound/etc/include
$ doas wget https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts -O /tmp/adblock-hosts
```

karena daftar di dalam file `adblock-hosts` ini formatnya berbeda dengan format yang dipakai oleh Unbound maka perlu merubah format tersebut, bisa pakai _shell script_ seperti di bawah ini

```Bash
#!/bin/bash
BLOCKLIST="/tmp/adblock-hosts"
CONFIG="/var/unbound/etc/include/adblock.conf"

# Extract domains (skip localhost/0.0.0.0 lines, sort/unique)
grep '^0\.0\.0\.0' "$BLOCKLIST" | awk '{print $2}' | grep -v 'localhost' | sort -u > /tmp/domains.txt

# Generate Unbound config
echo "# Auto-generated adblock list" > "$CONFIG"
echo "server:" >> "$CONFIG"
while read -r domain; do
    echo "    local-zone: \"$domain\" refuse" >> "$CONFIG"
done < /tmp/domains.txt

rm /tmp/domains.txt
echo "Adblock config updated: $(wc -l < "$CONFIG") entries"
```

kemudian simpan dengan nama misalnya `convert-adsblock.sh` (taruh dimana saja, kalo ane di `~/.local/bin`) dan rubah ijin file supaya bisa dijalankan `chmod +x convert-adsblock.sh` kemudian jalankan dengan perintah `./convert-adsblock.sh`. Tunggu sampai selesai.

Agar bisa dibaca oleh Unbound, ane rubah konfigurasi `unbound.conf` dan menyisipkan baris `include: "/etc/unbound/adblock.conf"` di blok `server` sehingga hasilnya seperti ini

```yaml
server:
    verbosity: 1
    interface: 127.0.0.1
    interface: 10.0.0.1                # IP server Wireguard
    access-control: 127.0.0.0/8 allow
    access-control: 10.0.0.0/24 allow. # IP range Wireguard
    cache-max-ttl: 86400
    cache-min-ttl: 3600
    hide-identity: yes
    hide-version: yes
    harden-glue: yes
    harden-dnssec-stripped: yes
    auto-trust-anchor-file: "/var/unbound/db/root.key"
    prefetch: yes
    include: "/var/unbound/etc/include/adblock.conf"`
```

simpan dan jalankan lagi `unbound-checkconf` untuk mengvalidasi konfigurasi. Jika tidak ada masalah, _reload_ Unbound dan test dengan mengunjungi situs seperti detik.com yang banyak iklannya itu dan cek apakah iklan - iklannya sudah hilang atau berkurang. Ya berkurang karena ada beberapa iklan yang di-_host_ di internal situs sehingga tidak terdeteksi oleh Unbound. Tapi ini wajar, karena jika terdeteksi di dalam adblock maka bisa saja malah situs tersebut yang tidak akan bisa dibuka karena akan diblok oleh Unbound. Ga masalah karena 99% iklan pasti akan terfilter oleh Adblok dan Unbound.

Agar maksimal, ane masih pakai µBlock Origin untuk bantu _define_ iklan yang di-_host_ di lokal tersebut.

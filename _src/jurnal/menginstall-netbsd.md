---
title: Menginstall NetBSD di VPS
ringkasan: "pengalaman ane meng*install* NetBSD di VPS (NAT), agak ruwet tapi
mengasyikkan"
date: 2026-08-30
tags:
  - kusaeni
  - tutorial
  - bsd
  - netbsd
kategori: jurnal
relasi: bsd
code: true
favorit: false
comment: true
tocx: false
draft: false
lightbox: true
style: "galeri.css"
keywords: "netbsd, bsd, install, vps, belajar"
comments:
  src: https://sepoi.kuspoes.deno.net/@poes/statuses/01M19EXTJZYGXJP6V1BWN91SDN
  real: https://sok.egois.org/@poes/statuses/01M19EXTJZYGXJP6V1BWN91SDN
---


{{ comp.relasi_artikel({
    judul: "Menginstall FreeBSD di VPS berbasis Linux",
    teks: "Provider tidak menyediakan OS FreeBSD dan atau ingin menginstall sendiri?",
    format: "kiri",
    heading: "" })
}}
<span class="caps">D</span>ari trio BSD yang pernah ane coba, NetBSD adalah distribusi BSD
yang paling susah ane *install*. Bukan karena sulit tapi metode
*install*nya berbeda dengan yang lainnya. FreeBSD mudah bisa
dengan `dd` atau timpa ke *disk* kemudian jalankan `bsdinstall`,
OpenBSD-pun sama meski cara terbaik adalah dengan mempergunakan
media ketiga seperti CDROM bahkan FreeBSD bisa di*install* dengan [*recovery image*](/jurnal/menginstall-freebsd-di-vps-berbasis-linux/#mfsbsd-setting-jaringan).

<div class="sidebar_notes sebelah_kanan" style="margin-top: 2em">
<p>ya! ini adalah <i>paid link</i>, ane akan dapat komisi kecil jika kalian mendaftar layanan melalui *link* ini</p>
</div>

Jadi ketika menemukan layanan VPS yang sangat murah (NAT VPS) dan mendukung pengunggahan ISO *files* maka ane putuskan untuk mencoba memasang NetBSD disini. Nama *provider*nya adalah [TierHive](https://tierhive.com/r/2B38419718E0) memiliki beberapa layanan level NAT seperti VPS biasa, dan *storage* VPS dengan harga murah. Ane pilih NAT VPS Micro dengan spesifikasi 1vCPU, 512Mb RAM, dan 3GB SSD yang berbiaya sekitar 0.000581 token/jam dimana 1 token = 1 USD atau sekitar Rp. 10/jam atau sekitar Rp 9 ribu/bulan. Sangat murah dan tidak beresiko jika kena begal.

<div class="table_kirik">

| Uraian | IP | Keterangan |
|:-------|:---:|:------|
| IP Address | 10.4.185.185 | IP lokal NAT |
| Netmask | 255.255.255.0 | Netmask |
| Gateway | 10.4.185.1 | Gateway|

</div>

Setelah mendaftar dan mengisi saldo sekitar 62 ribu rupiah, ane kemudian membuat *VPS Instance* dengan nama `nbsd` dengan lokasi *server* di Singapore. Setelah selesai ane mendapatkan informasi tentang IP lokal (NAT) yang dipakai dimana IP ini bisa ane pilih sendiri, jadi informasi IP ane menjadi seperti ini. Salah satu hal penting kenapa perlu tau detail IP karena di TierHive tidak memberikan fitur DHCP secara gratis, berbayar dengan harga yang murah namun ane tidak mau bayar ha ha ha.

#### Manual Install

Karena hendak memakai NetBSD maka ane pilih **Manual Install** di pilihan OS, sehingga ane perlu menambahkan **Virtual Media**.
Caranya mudah di **VPS Instances** > **Manage: nbsd** klik pada ikon CDROM dengant tulisan **Virtual Media**, kemudian masukkan URL dari tautan ke *file* ISO yang dipilih. Ane mau pakai NetBSD jadi ane masukkan <code>https://cdn.netbsd.org/pub/NetBSD/NetBSD-11.0/amd64/installation/cdrom/boot.iso</code>. 

<div class="postnotes">
<p>Ane sengaja pakai boot.iso karena cuma butuh boot saja ke installer dan nanti unduh set's melalui http</p>
</div>

<div class="gallery gal-1-baris" id="glightbox">  
 <a href="https://ik.imagekit.io/hjse9uhdjqd/jurnal/netbsd/SCR-20260829-qgkv_He6N0khNc.png" data-gallery="gallery">
 <img src="https://ik.imagekit.io/hjse9uhdjqd/tr:w-iw_div_2,h-ih,cm-extract,fo-left/jurnal/netbsd/SCR-20260829-qgkv_He6N0khNc.png" class="fuck radius-kiri-bawah" alt="masukkan tautan ISO ke Virtual Media">
 </a>
 <a href="https://ik.imagekit.io/hjse9uhdjqd/jurnal/netbsd/SCR-20260829-qgmz_9BZXfd7zIj.png" data-gallery="gallery">
 <img src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/netbsd/SCR-20260829-qgmz_9BZXfd7zIj.png" class="fuck radius-kanan-bawah" alt="Mount ISO ke CDROM">
  </a>
</div>
<p class="ncaption">Mount ISO ke CDROM di TierHive tinggal <i>copy-paste</i> URL ISOnya saja</p>


Kemudian *boot* VPS dan buka *console* VNC yang disediakan, secara *default* akan muncul SeaBIOS *boot manager*. Tekan tombol **ESC** untuk memunculkan pilihan diska. File ISO akan tersedia di CDROM [AHCI], pilih nomer urut CDROM tersebut (biasanya di nomer 3) maka sistem akan boot *installer* NETBSD. 

Jangan buru - buru untuk tekan Enter atau angka 1 (*boot normaly*) tapi tekan tombol SPASI atau langsung tekan angka 3 untuk masuk ke **Drop to boot prompt**. Akan muncul *prompt* opsi untuk memasukkan konfigurasi *boot*. Karena disini pakai VNC maka perlu mengaktifkan tipe grafis VESA dengan mengetik `vesa on` dan dilanjut dengan perintah `boot`.

<div class="gallery gal-1-baris" id="glightbox">  
 <a href="https://ik.imagekit.io/hjse9uhdjqd/jurnal/netbsd/SCR-20260829-qilx_HMmWtqSHX.png" data-gallery="gallery">
 <img src="https://ik.imagekit.io/hjse9uhdjqd/tr:w-iw_div_2,h-ih,cm-extract,fo-left/jurnal/netbsd/SCR-20260829-qilx_HMmWtqSHX.png" class="fuck radius-kiri-bawah" alt="SeaBios boot menu">
 </a>
 <a href="https://ik.imagekit.io/hjse9uhdjqd/jurnal/netbsd/SCR-20260829-qhxi_RRqUADOll.png" data-gallery="gallery">
 <img src="https://ik.imagekit.io/hjse9uhdjqd/tr:w-iw_div_2,h-ih,cm-extract,fo-left/jurnal/netbsd/SCR-20260829-qhxi_RRqUADOll.png" class="fuck radius-kanan-bawah" alt="NetBSD Boot Menu">
  </a>
</div>
<p class="ncaption">Pengaturan <i>boot menu</i> SeaBIOS dan NetBSD</p>

<div class="postnotes pink">
<p>Jika tidak pakai <code>vesa on</code> maka VNC tidak akan bisa menampilkan <i>installer</i> NetBSD dengan baik karena tampilan layar tidak bisa muncul</p> 
</div>

Sebelum lanjut memasang NetBSD, maka ane perlu mempersiapkan pengaturan jaringan. Ya karena ane tidak berlangganan fitur DHCP. Pengaturan bisa dilakukan melalui 3 cara yaitu mempergunakan menu **Utility Menu** kemudian pilih **Run /bin/sh** (cara manual lewat *shell*) atau **Configure Network** (cara manual dengan tampilan interaktif) cara lain bisa dengan mempergunakan **Auto Configuration** (tapi ini tidak akan berhasil karena DHCP tidak tersedia).

<div id="ipv4"></div>


Ane lebih suka memilih lewat **Configure Network**, namun jika lebih suka yan manual lewat *shell* berikut caranya:

```shell-session
# ifconfig 
vioif0: flags=0x8802<BROADCAST,SIMPLEX,MULTICAST> mtu 1500
		....
# ifconfig vioif0 inet 10.4.185.185 netmask 255.255.255.0
# route add default 10.4.185.1
# echo "nameserver 9.9.9.9" > /etc/resolv.conf
# ping -c 3 cdn.netbsd.org
# ./install.sh
```
<aside>
penting untuk menambahkan IP, <i>netmask</i>, <i>gateway</i> atau <i>router</i>, dan <i>DNS Resolver</i> agar jaringan bisa berjalan dengan baik.
Perintah `./install.sh` dipergunakan untuk kembali ke menu <i>installer</i>
</aside>

Ane ada juga IPv6 yang tersedia namun ane tidak akan atur saat proses peng*install*an melainkan nanti saat NetBSD sudah jalan dengan baik (*post install*).

![NetBSD Installer](https://ik.imagekit.io/hjse9uhdjqd/jurnal/netbsd/netbsd_installer_p_mfzyV82.jpeg)

Kemudian lanjutkan proses install seperti biasa atau sesuai dengan panduan [resmi dari NetBSD](https://www.netbsd.org/docs/guide/en/chap-exinst.html). Ane ga mau ribet karena sumber daya VPS ini minimalis maka ane pakai rekomendasi NetBSD saat bikin partisi dan kemudian pilih **Minimal Installation**, ane juga mengaktifkan SSH agar nanti bisa akses ke *shell* tanpa VNC. Setelah proses instalasi selesai  kemudian *reboot system*.


#### Post Install

1. Aktifkan vesa saat *boot*
Saat *booting* ulangi proses seperti sebelumnya untuk memakai grafis vesa. Untuk memastikan agar vesa secara otomatis dipanggil, maka perlu merubah *file* `/boot.cfg` menjadi seperti ini

	```txt
	menu=Boot normally:rndseed /var/db/entropy-file;vesa on;boot
	menu=Boot single user:rndseed /var/db/entropy-file;vesa on;boot -s
	menu=Drop to boot prompt:prompt
	default=1
	timeout=5
	clear=1
	```
	<aside>
	ane tambahkan <code>vesa on</code> sebelum <code>boot</code> di menu <b>Boot normally</b> dan <b>Boot single</b>.
	</aside>

	Dengan pengaturan ini maka setiap *boot* VNC akan menganggap *console* NetBSD memakai grafis `vesa`. Namun ini hanya berguna untuk akses lewat web VNC saja, lebih baik akses NetBSD memakai SSH.

2. Tambahkan *user*,
Ini penting biar ga selalu login pakai akun `root`, sekalian nanti pakai `doas` supaya bisa jalankan perintah dengan elevasi selevel `root`

	```shell-session
	# useradd -m -G whell poes
	# passwd poes
	```

	Perintah di atas akan membuat akun baru dengan nama `poes` dan masukkan ke grup `wheel`, sekalian kasih *password* buat login.

3. Aktifkan SSH 
Ane sudah aktifkan SSH saat proses *install* berjalan namun jika belum maka caranya mudah sekali. Jalankan saja perintah berikut di *shell*

	```shell-session
	# vi /etc/rc.conf
	sshd=YES
	```
	
	*Edit file* `/etc/rc.conf` dan tambahkan `sshd=YES` di baris paling bawah, kemudian simpan. Mulai jalankan layanan SSH dengan perintah berikut

	```shell-session
	# service sshd start
	```

4. *Install package manager*
Meski sudah ada `pkg_add` namun di NetBSD ada `pkgin` yang lebih mudah dan familiar untuk dipakai, tapi sebelumnya harus melakukan konfigurasi `pkg_add` agar bisa menemukan letak repositori dari paket aplikasin.

	```shell-session
	# export PKG_PATH="https://cdn.NetBSD.org/pub/pkgsrc/packages/NetBSD/$(uname -p)/$(uname -r | cut -d_ -f1)/All"
	# pkg_add -v pkgin
	```
	
	Setelah `pkgin` terpasang, ane bisa pakai untuk memasang paket - paket yang lainnya misalnya `vim`, `git`, maupun `doas`.

	```shell-session
	# pkgin update
	# pkgin install vim git doas
	```

5. `doas` untuk elevasi ke `root`
Sebenarnya sudah ada perintah `su` untuk melakukan elevasi dari *user* biasa ke `root`, namun ini kurang fleksibel. Maka ane pasang `doas` biar bisa elevasi *ǎ la* [#openbsd](/tags/openbsd)
	```shell-session
	# pkgin install doas
	# echo "permit nopass poes" > /usr/pkg/etc/doas.conf
	```

	Ane aktifkan `doas` tanpa *password* untuk akun `poes` dengan `permit nopass poes` dan tulis ke *file* konfigurasi `doas`.

6. Aktifkan IPv6
Karena TierHive ngasih IPv6 gratis dengan subnet `/64` kenapa tak dipakai?. Jadi mari kita pakai.

	NetBSD punya cara unik (menurut ane) untuk pengaturan IPv6 ini meski sudah mendukungnya sejak 1999!. Namun jujur agak ruwet dan tidak semudah FreeBSD saat dicoba. Cara manualnya sama seperti saat [mengatur IPv4 sebelumnya](#ipv4) sebagai berikut

	```shell-session
	# ifconfig vioif0 inet6 2a11:6c7:3001:5d8b::2 prefixlen 64 alias
	# route add -inet6 default fe80::20b2:10ff:fee7:ac0f%vioif0
	# echo "nameserver nameserver 2620:fe::fe" > /etc/resolv.conf
	```

	Baris pertama untuk mengatur alamat IPv6, baris kedua untuk mengatur *gateway*. Disini di TierHive tidak memakai alamat IP Gateway yang dikasih (ini yang bikin pusing tiga keliling) ternyata dia pakai *link local* yang bisa di cek melalui perintah `ndp -a` 

	Sedangkan baris ketiga untuk mendaftarkan *DNS Resolver* memakai [Quad9](https://quad9.net/service/service-addresses-and-features/)

	Untuk membuat pengaturan ini permanen, maka ane sisipkan pengaturan berikut di *file* `/etc/rc.conf`

	```txt
	defaultroute="10.4.185.1"
	defaultroute6="fe80::20b2:10ff:fee7:ac0f%vioif0"
	ifconfig_vioif0="
        inet 10.4.185.185 netmask 255.255.255.0
        inet6 2a11:6c7:3001:5d8b::2 prefixlen 64 alias
	"
	dns_nameservers="9.9.9.9 2620:fe::fe"
	```

---
title: Serba-serbi package manager di FreeBSD
ringkasan: "untuk memperbarui *package* atau menambal celah keamanan."
date: 2026-04-03
tags:
  - kusaeni
  - tutorial
  - freebsd
kategori: jurnal
relasi: freebsd
code: true
favorit: false
comment: true
tocx: true
draft: false
keywords: freebsd, bsd
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KNCEENCJD01EE7BP2MHJRNNA
  real: https://sok.egois.org/@poes/statuses/01KNCEENCJD01EE7BP2MHJRNNA
---


Meski sudah banyak aplikasi yang dibawa di dalam paket *base*-nya namun FreeBSD tetap menyediakan alat untuk meng*install* aplikasi pihak ketiga, mengelola atau meng*update*nya. Disediakan 2 alat dan 2 cara berbeda yaitu dengan FreeBSD *ports collections* yaitu cara meng*install* aplikasi lewat *build source code*. Cara lainnya adalah memasang aplikasi dari *pre-built binaries* dengan [`pkg(8)`](https://man.freebsd.org/cgi/man.cgi?query=pkg&sektion=8&format=html)

Memasang dari *ports collections* biasanya dilakukan jika di dalam *repository* resmi FreeBSD sebuah paket belum ter*update* karena biasanya memang di *ports* lebih dahulu diluncurkan. [Freshports](https://www.freshports.org/) adalah situs yang bisa dipergunakan untuk melacak rilis dari *ports*, resminya juga ada yaitu melalui [FreeBSD Ports Collections](https://ports.freebsd.org/cgi/ports.cgi).

<#toc#>

<div class="postnotes info">
    <p>⚠️ Artikel ini masih dalam proses dan akan terus diupdate.</p>
</div>

## Mempergunakan PKG

Semua versi FreeBSD sudah datang dengan `pkg` secara standar. Ketika pertama kali memakai sistem FreeBSD atau saat di awal membuat `jail` maka perlu melakukan `pkg bootstrap` untuk mengunduh paket `pkg` (jika di sistem belum ada) dan memasangnya, jika ternyata `pkg` sudah ada di dalam sistem maka perintah ini tidak akan berpengaruh apa - apa. Jika perintah ini diberi *flag* `-f` sehingga menjadi `pkg bootstrap -f` maka akan melakukan pengunduhan dan pemasangan paket `pkg` dan mengabaikan apakah `pkg` sudah ada atau belum.

Setelah `pkg` tersedia bisa dipergunakan dengan memasukkan perintah - perintah sebagai berikut.

```shell-session
# pkg bootstrap
# pkg
# pkg update
# pkg upgrade
```
<aside>
Perintah di atas adalah beberapa perintah populer yang paling sering dipergunakan, namun <code>pkg</code> sendiri sebenarnya memiliki lebih banyak perintah yang bisa dilihat dengan memasukkan perintah <code>pkg help</code>.
</aside>

### Pengaturan PKG
Perintah `pkg update` akan membuat `pkg` mengunduh data _repository_ FreeBSD dan menyimpannya di lokal. Umumnya `pkg` akan menghubungi server `pkg.FreeBSD.org` dan kemudian akan dialihkan ke server terdekat berdasarkan lokasi geografi. Untuk Asia Tenggara lokasi server terdekat ada di Kuala Lumpur, namun server ini kurang memiliki akses yang cepat sehingga pengunduhan sering terkendala.

Namun ada sebuah aplikasi yang bagus yang biasanya dipergunakan untuk menentukan posisi server yang sesuai dan cepat, nama aplikasinya adalah `fastest_pkg`. Berikut cara memasang dan pakainya.

<div class="postnotes kuning-gading">
    <p>⚠️ Semua perintah terkait <code>pkg</code> biasanya membutuhkan elevasi ke <i>superuser</i>, oleh karena ane jalankan sebagai <i>user</i> biasa maka ane butuh <code>doas</code> untuk menaikkan <i>privileges</i> ane ke selevel dengan <code>root</code>.</p>
    <p><code>doas</code> bisa dipasang dengan perintah <code># pkg install doas</code> atau <code># pkg install opendoas</code> untuk mendapatkan <code>doas</code> yang lebih mirip dengan di OpenBSD.</p>
</div>

```shell-session
$ doas pkg search fastest_pkg
py311-fastest_pkg-0.2.3        Script to find the fastest pkg mirror
$ doas pkg install py311-fastest_pkg
...

$ doas fastest_pkg
pkg0.your.freebsd.org: 378.5 kB/s
pkg0.son.freebsd.org: 0.0 B/s
pkg0.sjb.freebsd.org: 351.4 kB/s
pkg0.twn.freebsd.org: 0.0 B/s
pkg0.kul.freebsd.org: 0.0 B/s
pkg0.bbt.freebsd.org: 0.0 B/s
pkg0.jinx.freebsd.org: 0.0 B/s
pkg0.kwc.freebsd.org: 18.4 MB/s
pkg0.syd.freebsd.org: 636.2 kB/s
pkg0.pao.freebsd.org: 772.4 kB/s
pkg0.tuk.freebsd.org: 1.1 MB/s
pkg0.bra.freebsd.org: 234.9 kB/s
pkg0.nyi.freebsd.org: 275.3 kB/s

Fastest:
pkg0.kwc.freebsd.org: 18.4 MB/s


Write configuration:
mkdir -p /usr/local/etc/pkg/repos/
echo 'FreeBSD: { url: "http://pkg0.kwc.freebsd.org/${ABI}/latest", mirror_type: "NONE" }' \
        > /usr/local/etc/pkg/repos/FreeBSD.conf
```

Dari hasil `fastest_pkg` seperti di atas ditemukan bahwa server `pkg0.kwc.freebsd.org` adalah server dengan kecepatan pengunduhan paling baik dibandingkan yang lainnya. Di atas juga disebutkan cara untuk membuat `pkg` mempergunakan server `pkg0.kwc.freebsd.org` sebagai pilhan utama.

Setelah `FreeBSD.conf` selesai dibuat, maka paksa `pkg` untuk mengunduh ulang definisi repo ke lokal dengan perintah `pkg update -f`, seharusnya kecepatan pengunduhan akan naik secara signifikan/menyesuaikan.

*File* `FreeBSD.conf` adalah *file* khusus yang dipergunakan oleh FreeBSD untuk merubah atau menimpa pengaturan pada `pkg`. Pengaturan asli dari `pkg.conf` ada di *path* `/etc/pkg/FreeBSD.conf` namun mengubah isi dari *file* ini <mark class="pink">sangat tidak direkomendasikan</mark>. Untuk merubah pengaturan, FreeBSD merekomendasikan *file* `FreeBSD.conf` yang berada di *path* `/usr/local/etc/pkg/repos/FreeBSD.conf` dimana semua pengaturan yang berada di bawah *path* `/usr/local` <mark>hanya akan dijalankan secara khusus untuk *user* yang bersangkutan</mark>, sedangkan pengaturan di bawah *path* `/etc/` akan berlaku menyeluruh.

Salah satu pengaturan yang biasanya sering dipakai oleh pengguna FreeBSD adalah menentukan jenis *update* repositori dimana ada 2 pilihan utama yaitu `latest` dan `quarterly`. Perbedaan utamanya sebagai berikut

| Jenis Repo      | Keterangan      |
| :------------: | :------------: |
| `Latest` | Berisi versi terbaru dari masing - masing package alias lebih _up to date_ namun memiliki resiko atas kompatibilitas. |
| `Quarterly` | Berisi versi yang lebih stabil, di*update* setiap 3 bulan sekali.|

Cara untuk berpindah dari repo `latest` ke `quarterly` atau sebaliknya bisa dilakukan dengan merubah pengaturan di *file* `FreeBSD.conf` sebagai berikut

```shell-session
$ doas ee /usr/local/etc/pkg/repos/FreeBSD.conf
url: "pkg+http://pkg.FreeBSD.org/${ABI}/quarterly"
```
<aside>Rubah pada tulisan <code>quarterly</code> atau <code>latest</code> sesuaikan dengan repo yang diinginkan. <br /> <code>ee</code> adalah text editor bawaan dari FreeBSD</aside>

### Mencari, lihat deskripsi, dan meng-*install package*
Setelah pengaturan selesai dan *repository* sudah di*update*, maka perintah untuk memasang sebuah atau lebih *package* bisa dilakukan dengan perintah `pkg install`. Namun penting untuk melakukan pencarian terlebih dahulu karena *default*nya FreeBSD akan menampilkan beberapa pilihan versi *package* jika tersedia apalagi jika memakai repositori `latest`. Sebagai contoh akan mencari dan memasangan [vim](https://www.vim.org/).

```shell-session
$ pkg search vim
...
vim-9.2.0272            Improved version of the vi editor (console flavor)
vim-gtk2-9.2.0272       Improved version of the vi editor (gtk2 flavor)
vim-gtk3-9.2.0272       Improved version of the vi editor (gtk3 flavor)
vim-lsp-0.1.4.198       Async language server protocol plugin for vim and neovim
vim-motif-9.2.0272      Improved version of the vi editor (motif flavor)
vim-tiny-9.2.0272       Improved version of the vi editor (tiny flavor)
vim-x11-9.2.0272        Improved version of the vi editor (x11 flavor)
...
```
Ditemukan banyak versi *package* dari `VIM`, untuk mengetahui uraian atau deskripsi dari sebuah *package* maka gunakan perintah `pkg info`.

```shell-session
$ pkg info vim
vim-9.2.0272
Name           : vim
Version        : 9.2.0272
Installed on   : Sat Apr  4 10:37:32 2026 WIB
Origin         : editors/vim
Architecture   : FreeBSD:15:amd64
Prefix         : /usr/local
Categories     : editors
Licenses       : VIM
Maintainer     : adamw@FreeBSD.org
WWW            : https://www.vim.org/
Comment        : Improved version of the vi editor (console flavor)
...
...
```

Kemudian pasang *package* tersebut dengan perintah

```shell-session
$ doas pkg install vim
doas (poes@kocheng) password: 
All repositories are up to date.
Checking integrity... done (0 conflicting)
The following 1 package(s) will be affected (of 0 checked):

New packages to be INSTALLED:
  vim: 9.2.0272 [FreeBSD-ports]

Number of packages to be installed: 1

The process will require 42 MiB more space.

Proceed with this action? [y/N]: y
[1/1] Installing vim-9.2.0272...
[1/1] Extracting vim-9.2.0272: 100%
```


### Menghapus *package*
Ada 2 perintah yang memiliki fungsi untuk menghapus *package* dengan `pkg` yaitu `pkg delete` dan `pkg remove`, meski berbeda namun memiliki fungsi yang sama. Namun di [man pages pkg](https://man.freebsd.org/cgi/man.cgi?pkg) perintah `pkg remove` tidak disebut sehingga untuk kompatibilitas pergunakan perintah `pkg delete`.

Cara pakainya  seperti ini

```shell-session
$ doas pkg delete vim
Checking integrity... done (0 conflicting)
Deinstallation has been requested for the following 1 packages (of 0 packages in the universe):

Installed packages to be REMOVED:
  vim: 9.2.0272

Number of packages to be removed: 1

The operation will free 42 MiB.

Proceed with deinstalling packages? [y/N]: y
[1/1] Deinstalling vim-9.2.0272...
[1/1] Deleting files for vim-9.2.0272: 100%
```

Ada juga perintah `autoremove` yang tugasnya mencari dan menghapus *package* yang sudah tidak dipakai lagi, biasanya adalah *package* yang menjadi *dependecies* dari *build* *package* utama. 

```shell-session
$ doas pkg autoremove
doas (poes@oyenBSD) password:
Checking integrity... done (0 conflicting)
Deinstallation has been requested for the following 67 packages:

Installed packages to be REMOVED:
        abseil: 20250127.1_1
        alsa-lib: 1.2.15.3
        at-spi2-core: 2.56.8
        basu: 0.2.1
        bsddialog: 1.1
        ...
        
Number of packages to be removed: 67

The operation will free 269 MiB.

Proceed with deinstalling packages? [y/N]: y
[ 1/67] Deinstalling abseil-20250127.1_1...
[ 1/67] Deleting files for abseil-20250127.1_1: 100%
...
$
```
`pkg autoremove` bisa dipakai untuk membersihkan ruang yang dipakai oleh banyak *package* sehingga membuat kapasitas *storage* menjadi lebih lega. Namun ada perintah lain yang juga bisa dipakai yaitu `pkg clean`, yang ini tugasnya menghapus/membersihkan isi dari *local cache* dari *package* yang terunduh.

### Mengunci *package* supaya tidak dirubah

Jika ane ingin agar sebuah atau lebih *package* tidak bisa dirubah (di*reinstall*, di*upgrade*, dimodifikasi, bahkan dihapus) maka ane akan pakai `pkg lock` untuk urusan ini. Bermanfaat jika ingin tetap memakai versi tertentu dari sebuah *package*. 

```shell-session
$ vim --version
VIM - Vi IMproved 9.2 (2026 Feb 14, compiled Mar 31 2026 01:05:15)
$ doas pkg lock vim
doas (poes@oyenBSD) password:
vim-9.2.0272: lock this package? [y/N]: y
Locking vim-9.2.0272
```

untuk *unlock*

```shell-session
$ doas pkg unlock vim
doas (poes@oyenBSD) password:
vim-9.2.0272: unlock this package? [y/N]: y
Unlocking vim-9.2.0272
```

### Statistik

Untuk menampilkan statistik database `pkg` gunakan `pkg stats` yang akan memberikan info jumlah *package* yang terpasang dan *disk storage* yang dipergunakan.

```shell-session
$ doas pkg stats
Local package database:
  Installed packages: 231
  Disk space occupied: 2 GiB

Remote package database(s):
  Number of repositories: 2
  Packages available: 37306
  Unique packages: 37306
  Total size of packages: 160 GiB
```

### Query PKG
Mendapatkan informasi sebuah paket selain dengan `pkg info` bisa juga dengan `pkg-query` ([man](https://man.freebsd.org/cgi/man.cgi?query=pkg-query)) sebuah _tool_ yang dibuat khusus untuk meng-*query* data informasi dari sebuah atau lebih *package* meski lebih sering dipakai untuk melakukan *tracing*.

Sebagai contoh ingin melihat daftar _package_ mana saja yang pakai `jpeg-turbo` sebagai *reverse dependencies*-nya

```shell-session
$ pkg query %ro jpeg-turbo
graphics/tiff
graphics/openjpeg
graphics/libraw
graphics/lcms2
graphics/php81-gd
multimedia/libv4l
graphics/gd
graphics/webp
```
<aside>
    Hasilnya <code>jpeg-turbo</code> dibutuhkan oleh beberapa <i>package</i> seperti <code>tiff</code>, <code>openjpeg</code>, dan <code>php81-gd</code>.
</aside>

Sedangkan untuk melihat _dependencies_ dari sebuah *package* (misal `vnstat`) bisa dengan perintah berikut

```shell-session
$ doas pkg query %dn-%dv vnstat
sqlite3-3.50.4_2,1
libgd-2.3.3_13,1
```
<aside>
    Hasilnya <code>vnstat</code> membutuhkan <code>sqlite</code> dan <code>libgd</code> sebagai <i>dependencies</i>-nya.
</aside>

### Audit

[FreeBSD Security Advisories](https://www.freebsd.org/security/advisories/) adalah informasi resmi dari FreeBSD terkait masalah keamanan di *base system* FreeBSD misalnya soal jaringan, kernel, sistem inti lainnya. Informasi ini berisi tentang penjelasan masalah yang ditemukan dan cara penyelesaiannya. `pkg` memberikan perintah `audit` untuk memeriksa apakah di dalam sistem saat ini ditemukan masalah sesuai dengan informasi dari FreeBSD Security Advisories. Untuk memeriksanya gunakan perintah `pkg audit -F`

```shell-session
$ doas pkg audit -F
doas (poes@oyenBSD) password:
vulnxml file up-to-date
python311-3.11.15 is vulnerable:
  Python -- poplib module, when passed a user-controlled command, can have additional commands injected using newlines
  CVE: CVE-2025-15367
  WWW: https://vuxml.FreeBSD.org/freebsd/6d3488ae-2e0f-11f1-88c7-00a098b42aeb.html

  Python -- imaplib module, when passed a user-controlled command, can have additional commands injected using newlines
  CVE: CVE-2025-15366
  WWW: https://vuxml.FreeBSD.org/freebsd/0be929a5-2e0f-11f1-88c7-00a098b42aeb.html

  Python -- The webbrowser.open() API allows leading dashes
  CVE: CVE-2026-4519
  WWW: https://vuxml.FreeBSD.org/freebsd/9fdad262-2e0f-11f1-88c7-00a098b42aeb.html

openexr-3.4.8 is vulnerable:
  openexr -- multiple vulnerabilities
  CVE: CVE-2026-34378
  CVE: CVE-2026-34379
  CVE: CVE-2026-34380
  CVE: CVE-2026-34588
  CVE: CVE-2026-34589
  WWW: https://vuxml.FreeBSD.org/freebsd/adb096d4-2e72-11f1-acc1-339a1a6999b0.html

3 problem(s) in 1 package(s) found.
```

Hasil dari perintah ini adalah informasi tentang kerentanan. Sebagai contoh di atas setidaknya ada 3 masalah dari 1 *package* yaitu `python`. Informasi lebih lengkap bisa diperiksa dengan mengakses halaman WWW di tautan yang diberikan. Sebagai contoh masalah di `python` disebutkan bahwa itu merupakan tindak lanjut dari temuan oleh laporan Python Software Foundation Security Developer.

Cara penyelesaiannya biasanya dengan menunggu *patch* resmi dari FreeBSD atau *upgrade* ke versi lebih tinggi, dengan `pkg` (nunggu *patch*) atau lewat Freshport.

### Jika `pkg` rusak tak bisa dipakai

Karena proses *update* atau *upgrade* yang keliru, belum selesai, *database corrupt*, atau perubahan dari jenis repo yang gagal bisa membuat `pkg` tidak bisa dipergunakan. Oleh karena itu meng-*install* ulang `pkg` mutlak diberikan, disini alat kecil bernama `pkg-static`[(8)](https://man.freebsd.org/cgi/man.cgi?query=pkg-static&sektion=8&n=1) bisa dipergunakan. `pkg-static` adalah sebuah aplikasi yang (sudah tersedia di `base`) fungsinya sama dengan `pkg` namun tidak tertaut pada  *library* lain seperti `libssl` atau *library* lain yang terus berubah (karena proses *upgrade* dan sebagainya), *library* yang dibutuhkan untuk `pkg-static` berkerja sudah tersedia di dalam binari-nya sendiri sehingga `pkg-static` tidak akan rusak dan selalu bisa dipakai. `pkg-static` dipergunakan untuk mem*build* `pkg` itu sendiri (`bootstrap pkg`). Namun untuk penggunaan sehari - hari `pkg` lebih diutamakan karena aplikasi ini terus di*update* dan *upgrade*.

Secara fitur, `pkg-static` memiliki fitur yang identik dengan `pkg`. Namun ada fungsi utama yang sering dipakai yaitu `bootstrap` untuk meng*generate* ulang aplikasi `pkg`.

1. *Bootstrap* `pkg`
```shell-session
$ doas pkg-static bootstrap -y
```
`pkg-static` akan mem*build* ulang `pkg`, sebaiknya dilanjut dengan `update` repo setelah selesai.

2. *Database corrupt*
```shell-session
$ doas pkg-static update -f
```
`pkg-static` akan mengunduh data secara paksa dan membuat *database* baru.

---

## Mempergunakan Port's

Port's adalah kumpulan dari beberapa *files* `Makefile`, `patches`, dan `Description` yang dipergunakan untuk mem-*build* sebuah *package*. Sehingga untuk mendapatkan sebuah *binary* yang siap untuk di*install* perlu melakukan *build* yang sering kali membutuhkan sumber daya komputasi lebih. 

### Mempersiapkan Port's
<div class="postnotes">
    <p>Ane pakai Port's untuk mencari <i>package</i> yang lebih cepat <i>up to date</i> dibandingkan dari repo <code>pkg</code> resmi. Namun sebaiknya dihindari kalo tidak butuh banget karena prosesnya lebih ribet, makan waktu dan <i>resources</i> perangkat.</p>
</div>

*Files* `Makefile` dan kawan - kawannya terlebih dahulu harus disalin ke lokal dan kemudian baru bisa melakukan `build`. Karena repo dari Port's ini disimpan dalam repo `git` maka perlu untuk memasang *package* `git` terlebih dahulu. Asumsi bahwa Port's sama sekali masih kosong, maka *install* `git` dengan `pkg`.

```shell-session
$ doas pkg install git-lite
```
<aside>Bisa juga memasang <code>git</code>, namun karena cuma butuh operasi <code>git</code> standar maka ane pasang <code>git-lite</code> yang lebih ringan.</aside>

Kemudian mulai untuk menyalin (`clone`) repositori Port's, simpan di `/usr/ports` dan lakukan *checkout*.

```shell-session
$ doas git clone --depth 1 https://git.FreeBSD.org/ports.git /usr/ports
$ doas git -C /usr/ports pull
```
<aside><code>--depth 1</code> opsi ini untuk menyalin isi repo tanpa <i>commit history</i> sehingga ukurannya menjadi lebih ramping dan proses menjadi cepat.<br />
    <p></p>
Perintah di atas akan menyalin isi repo dengan rilis <code>latest</code>, sedangkan untuk <code>quarterly</code> harus menjalankan dengan opsi <em>branch</em> <code>-b 2026Q1</code> yang berarti ambil dari <em>branch</em> kuartal 1 tahun 2026.<br />
<p></p>
Sehingga perintah lengkapnya menjadi seperti ini
<pre class="language-shell-session" tabindex="0"><code class="language-shell-session"><span class="token command"><span class="token shell-symbol important">$</span> <span class="token bash language-bash">doas git clone --depth 1 https://git.FreeBSD.org/ports.git -b 2026Q1 /usr/ports</span></span>
</code></pre>
</aside>

### Memasang aplikasi dari Port's

Repotnya di Port's adalah saat mencari dimana letak dari folder aplikasi yang dimaksud, karena di dalam `/usr/ports` sendiri setidaknya ada 70 kategori dengan total 46195 *folders* di bawahnya!!!. Ane biasanya gunakan FreshPorts untuk mencari letak *folder* yang sesuai. Sebagai contoh ane akan pasang `vim`. Jika [merujuk pada FreshPorts](https://www.freshports.org/editors/vim/) letak `vim` ada di `/usr/ports/editors/vim`. Maka cara *install*-nya seperti ini

```shell-session
$ cd /usr/ports/editors/vim
$ doas make install clean
==>  License VIM accepted by the user
===>   vim-9.2.0204 depends on file: /usr/local/sbin/pkg - found
=> vim-vim-v9.2.0204_GH0.tar.gz doesn't seem to exist in /usr/ports/distfiles.
=> Attempting to fetch https://codeload.github.com/vim/vim/tar.gz/v9.2.0204?dummy=/vim-vim-v9.2.0204_GH0.tar.gz
vim-vim-v9.2.0204_GH0.tar.gz                            18 MB 7562 kBps    03s
===> Fetching all distfiles required by vim-9.2.0204 for building
===>  Extracting for vim-9.2.0204
=> SHA256 Checksum OK for vim-vim-v9.2.0204_GH0.tar.gz.
install  -m 0644 /usr/ports/editors/vim/files/vietnamese_viscii.vim /usr/ports/editors/vim/work-console/vim-9.2.0204/runtime/keymap
===>  Patching for vim-9.2.0204
===>  Applying FreeBSD patches for vim-9.2.0204 from /usr/ports/editors/vim/files

===>   vim-9.2.0204 depends on package: libiconv>=1.14_11 - found
===>   vim-9.2.0204 depends on package: pkgconf>=1.3.0_1 - found
===>   vim-9.2.0204 depends on file: /usr/local/bin/python3.11 - found

===>  Installing for vim-9.2.0204

/usr/local/bin/vim
```
Untuk menghemat spasi karena dalam proses `build` Ports akan mengunduh banyak sekali *dependecies* maka gunakan opsi `clean`. Bisa sebelum atau sesudah proses `build`.

### Menghapus *package* dari Ports

Untuk menghapus ada 2 cara, bisa pakai perintah `pkg delete` karena toh juga *package* namanya meski dipasang dari Ports dan bisa pakai perintah `make deinstall`. Untuk perintah yang kedua ini harus masuk kembali ke *folder* *package* tersebut terlebih dahulu. Jadi gunakan saja `pkg delete` karena lebih mudah.

### Meng-*upgrade* Ports

Caranya ribet, pokoknya pakai Ports itu ribet!. Pertama harus tau dulu daftar dari *package* yang ada versi pembaharuan namun harus melakukan `git pull` terlebih dahulu untuk memperbarui `local copy` dari repo Ports. 

```shell-session line-numbers
$ doas git -C /usr/ports pull
$ doas pkg version -l "<"
```

Akan meng*update* dan menampilkan *package* yang ada versi pembaharuan dan kemudian (secara manual) melakukan `build` ulang satu per satu. Kalo cuma ada 2 atau 3 *packages* yang perlu di*upgrade* maka ga terlalu masalah, namun kalo ada 10-an ke atas *packages* itu baru masalah. Maka ada yang namanya [Portmaster](https://cgit.freebsd.org/ports/tree/ports-mgmt/portmaster/) sebuah alat kecil yang berjasa untuk melakukan *upgrade* atas Ports yang terpasang. *Install* dulu dengan

```shell-session
$ cd /usr/ports/ports-mgmt/portmaster
$ doas make install clean
```

Setelah sukses, tinggal pakai cara ini untuk menampilkan daftar yang perlu di*ugrade*

```shell-session
$ doas portmaster -L
...
...
===>>> 176 total installed ports
    ===>>> 1 has a new version available

$ doas portmaster -a
...
```

Selain untuk melakukan *upgrade* sebenarnya `portmaster` bisa juga dipakai untuk meng-*install* Ports. Caranya adalah dengan perintah `$ doas portmaster editors/vim` dan ini jauh lebih mudah daripada cara manual.

## Kesimpulan

FreeBSD memberikan alat untuk melakukan pencarian, pemasangan, *upgrade*, maupun menghapus sebuah atau lebih aplikasi yang bernama `pkg`. *Package Manager* ini sangat *powerfull* untuk melakukan tugasnya secara umum dan jauh lebih mudah daripada memakai *ports* karena akan meng*install* aplikasi dari *pre-built binaries* yang sudah tersedia.

Meski disebut tidak memiliki *wrapper* untuk `pkg` namun `portmaster` juga bisa dipakai untuk manajemen *package*. Ada juga [Poudriere](https://man.freebsd.org/cgi/man.cgi?poudriere) yang bisa dipakai meski fungsi utamanya untuk melakukan *package builder* dan *port tester*. Berbeda dengan *wrapper package manager* lainnya seperti Powerpill di Arch Linux, di FreeBSD tidak memberikan fitur *download accelerator* namun lebih pada kekuatan di pengelolaan *dependencies* dan keamanan.

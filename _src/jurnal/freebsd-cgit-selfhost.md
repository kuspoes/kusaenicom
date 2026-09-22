---
title: "Selfhost cgit di FreeBSD"
ringkasan: "Self host cgit, aplikasi antar muka web untuk git yang sederhan dan ringan"
date: 2026-09-24
tags:
  - tutorial
  - freebsd
  - bsd
kategori: jurnal
relasi: freebsd
code: true
favorit: false
comment: true
keywords: "bsd, freebsd, git, cgit, self host"
draft: true
tocx: true
comments:
  src: https://sepoi.kuspoes.deno.net/@poes/statuses/01M33SJXR194MWDGBPQF90KM8K
  real: https://sok.egois.org/@poes/statuses/01M33SJXR194MWDGBPQF90KM8K
---

Ketika tiba - tiba repositori publik milik ane di Codeberg tidak bisa diakses tanpa login, ane memutuskan untuk mencari alternatif.

Banyak alternatif yang tersedia, namun sebelum itu perlu diketahui bahwa Codeberg mempergunakan Forgejo sebagai aplikasinya. Forgejo adalah *fork* dari Gitea, *frontend web interface suite* untuk Git yang ringan. Namun ane tidak ingin mengganti Codeberg dengan *self host* Forgejo karena keterbatasan sumber daya VPS dan karena fiturnya yang melimpah yang sebagian besar tidak ane butuhkan. 

Oleh karena itu ane mencari alternatif dengan syarat 
1. Bukan Forgejo atau Gitea atau *fork*-nya,
2. Ringan! kalo bisa dibangun dengan C,
3. Tersedia di FreeBSD (atau NetBSD).

Dan akhirnya pilihan itu mengerucut ke [cgit](https://git.zx2c4.com/cgit/about/) dan [stagit](https://git.codemadness.org/stagit/). Perbedaan mendasar dari 2 pilihan ini adalah cgit merupakan aplikasi *frontend* yang dinamis dimana dia bisa memproses perintah Git *on the fly* contohnya adalah melakukan `diff` pada 2 *files* maupun lebih. Sedangkan stagit lebih menjadi tampilan *frontend* yang statis sehingga saat melakukan `diff` hanya bisa menampilkan perbedaan dari *files* yang sudah di*generate* di awal saja.

Untuk saat ini pemenangnya cgit.

<#toc#>

## Install
### cgit & kebutuhannya

<div class="postnotes pink">
<h4>Catatan</h4>
<p>Asumsi pemasangan <code>cgit</code> di dalam jail dengan rilis 15.1-RELEASE dan IP 10.0.0.7</p>
</div>

Binari cgit sendiri sudah tersedia di FreeBSD sehingga tidak perlu mengkompilasi dari *source*.

```shell-session
# pkg install git cgit fcgiwrap spawn-fcgi
```

`fcgiwrap` adalah *wrapper* CGI untuk menjalankan *script* cgit nantinya. Agar berjalan saat *boot* maka perlu menambahkan baris berikut di *file* `/etc/rc.conf`

```conf
fcgiwrap_enable="YES"
fcgiwrap_flags="-f"
fcgiwrap_user="www"
fcgiwrap_group="www"
fcgiwrap_socket_owner="www"
fcgiwrap_socket_group="www"
```

Ingat! bahwa `fcgiwrap` mempergunakan *user* dan *group* `www:www` sehingga semua *folder*/*path* yang dipakai untuk `cgit` harus bisa diakses oleh *user*/*group* ini.

Sedangkan `spawn-fcgi` nanti dipergunakan untuk mengelola proses FastCGI dari `fcgi-wrap` melalui pengaturan *socket*nya.

```shell-session
# spawn-fcgi -s /var/run/cgit.sock /
	-u www -g www -a 10.0.0.7 \
	-p 9000 -F 4 -- \
	/usr/local/bin/fcgiwrap
```
<aside>
<ul>
	<li><code>-u www -g www</code>: jalankan sebagai <i>user</i> dan <i>group</i> <code>www</code> </li>
	<li><code>-a 10.0.0.7 -p 9000</code>: pakai IP jail dan <i>port</i> <code>9000</code></li>
	<li><code>-F 4</code>: berjalan dengan 4 <i>workers</i>
		
</ul>
</aside>

Maka `spawn-fcgi` akan menjalankan `fcgiwrap` di *port* `9000` yang nantinya akan dipanggil melalui [Caddy](https://caddyserver.com/).

Validasi dengan perintah ini

```shell-session
# sockstat -4 | grep 9000
  www      fcgiwrap   21451  0 tcp4  10.0.0.7:9000         *:*
```
Terpantau `fcgiwrap` sudah berjalan di mode `tcp` *port* `9000`.

### Konfigurasi Caddy *reverse proxy*

Setelah pengaturan di atas seharusnya `cgit` bisa diakses melalui IP `10.0.0.7:9000` , agar bisa ditempelkan ke domain maka ane buat pengaturan di Caddyfile (di *host*), seperti ini

```txt
legit.kusaeni.com {
    handle /git/* {
        basic_auth {
            poes $2a$14$.NhljHKhalkfhalkHK.XPp/PkuJU7ALJDLaBZoo/jladalHKA
        }
        uri strip_prefix /git
        reverse_proxy 10.0.0.7:9000 {
            request_buffers 50mb

            transport fastcgi {
                env SCRIPT_FILENAME /usr/local/libexec/git-core/git-http-backend
                env GIT_PROJECT_ROOT /home/legit
                env GIT_HTTP_EXPORT_ALL ""
                env PATH_INFO {http.request.uri.path}
                env QUERY_STRING {http.request.uri.query}
                env REQUEST_METHOD {http.request.method}
                env CONTENT_TYPE {http.request.header.Content-Type}
                env CONTENT_LENGTH {http.request.header.Content-Length}
                env REMOTE_USER {http.auth.user.id}
                env HTTP_HOST {http.request.host}
                env PATH /usr/local/bin:/usr/bin:/bin
            }
        }
    }

    handle /favicon.ico {
        root * /var/www/cgit
        file_server
    }

    handle /cgit.js {
    root * /var/www/cgit
    file_server
    }

    handle /cgit.css {
         root * /var/www/cgit
         file_server
        }

   handle /cgit.png {
        root * /var/www/cgit
        file_server
    }

    handle {
        reverse_proxy 10.0.0.7:9000 {
            transport fastcgi {
                env SCRIPT_FILENAME /usr/local/libexec/git-core/git-http-backend
                env GIT_PROJECT_ROOT /home/legit
                env GIT_HTTP_EXPORT_ALL ""
                env CONTENT_TYPE {http.request.header.Content-Type}
                env CONTENT_LENGTH {http.request.header.Content-Length}
                env REMOTE_USER {http.auth.user.id}
                env SCRIPT_FILENAME /usr/local/www/cgit/cgit.cgi
                env SCRIPT_NAME /
                env PATH_INFO {http.request.uri.path}
                env DOCUMENT_ROOT /usr/local/www/cgit
                env CGIT_CONFIG /usr/local/etc/cgitrc
                env QUERY_STRING {http.request.uri.query}
                env REQUEST_METHOD {http.request.method}
                env HTTP_HOST {http.request.host}
               }
         }
    }
}
```

Cukup rumit kan?  yang perlu diperhatikan adalah `handle`. 
- handle `/git` ini nanti akan menjadi *endpoint* untuk proses `pull - push -  clone`, disini akan dilindungi oleh *basic auth* dari Caddy [baca dokumentasinya](https://caddyserver.com/docs/caddyfile/directives/basic_auth)
- handle `/` ini akan menjadi halaman *web interface* `cgit` yang di-*reverse proxy* kan ke IP `10.0.0.7` dan *port* `9000`
- handle lainnya seperti favicon, *js, *css, dan *png di arahkan di folder `/var/www/cgit` di *host* karena ini cuma *serve static files* saja.

Validasi konfigurasi dan *restart* Caddy.

### Buat lokasi Repositori

Karena `cgit` dan `fcgiwrap` jalan dengan *user* dan *group*`www` maka ane tidak bisa naruh folder repo di bawah `/root` (default user di FreeBSD jail). Jadi ane bikin di tempat lain, misal di `/home/legit`

```shell-session
# mkdir -p /home/legit
# cd /home/legit
# mkdir repopo
# git init --bare
hint: Using 'master' as the name for the initial branch. This default branch name
hint: will change to "main" in Git 3.0. To configure the initial branch name
hint: to use in all of your new repositories, which will suppress this warning,
hint: call:
hint:
hint: 	git config --global init.defaultBranch <name>
hint:
hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
hint: 'development'. The just-created branch can be renamed via this command:
hint:
hint: 	git branch -m <name>
hint:
hint: Disable this message with "git config set advice.defaultBranchName false"
Initialized empty Git repository in /home/legit/repopo/
# chown -R www:www /home/legit/repopo
```

Ini akan membuat folder `/home/legit` dan folder `repopo` serta merubah kepemilikan folder menjadi milik *user* `www`. Nantinya semua pembuatan repo akan mengulang perintah ini.


Bunuh `spawn-fcgi` dan `fcgiwrap` yang sedang berjalan kemudian ulangi perintah untuk menjalankannya. Untuk lebih mudah silakan membuat *script* `rc.d` saja.

Kemudian kunjungi URL dari repo dan pastikan bahwa `cgit` sudah berjalan dengan baik.

### Konfigurasi `cgit`

Berikut adalah konfigurasi `cgitrc` yang ane pakai. Buat atau *edit file* `/usr/local/etc/cgitrc` (di dalam jail)

```txt
## style-sheet and custom logo
css=/cgit.css
logo=/cgit.png

## root for all cgit links
virtual-root=/

clone-prefix=https://legit.kusaeni.com/git
enable-http-clone=1

scan-path=/home/legit/
root-title=Lapis LeGit
root-desc=sungguh legit menggigit, auwwww!
```

Ini merupakan konfigurasi minimal dari `cgit`, ada beberapa hal yang mungkin ingin diaktifkan diantaranya berikut ini

1. **Memperluas info di tab *Summary***, seperti info tentang *branches*, *logs*, maupun *tags*
	```txt
	summary-branches=10
	summary-log=10
	summary-tags=10
	```
2. **Memperluas tampilan *commit message**, ini berguna biar tampilan pesan *commit* tidak terpotong
	```txt
	max-message-length=10000
	```
3. **Fleksibel dalam membaca pengaturan spesifik pada masing - masing repo**, perintah ini akan membuat `cgit` memprioritaskan pembacaan informasi repo langsung dari *file* `.git/config` alih - alih membaca dari `cgitrc`. Sangat bermanfaat jika punya *multiple* repo.
	```txt
	enable-git-config=1
	enable-index-owner=1
	```
	Jika pakai ini maka untuk menulis deskripsi repo harus mengubah *file* `.git/description`, sedangkan nama *owner* bisa dengan merubah *file* `.git/config` yang berada di bawah masing - masing folder repo.
4.  **Menampilkan statistik di halaman *Commit, Summary, dan Logs***, gunakan pengaturan ini untuk menampilkan banyak pesan yang mungkin bermanfaat. 
	```txt
	enable-blame=1
	enable-index-links=1
	enable-commit-graph=1
	enable-follow-links=1
	enable-log-filecount=1
	enable-log-linecount=1
	max-stats=quarter
	```
5. **Pakai filter**, `cgit` punya beberapa filter bawaan untuk melakukan *post-process* tampilan web-nya. Salah satu filter yang menarik adalah untuk menampilkan isi *file* `README.md` dan filter untuk *syntax highlighting* 
	`cgit` menaruh filter bawaan di folder `/usr/local/lib/cgit/filters` dan bisa diaktifkan dengan menambahkan konfigurasi berikut
	```txt
	about-filter=/usr/local/lib/cgit/filters/about-formatting.sh
	source-filter=/usr/local/lib/cgit/filters/syntax-highlighting.sh
	```
	Pada dasarnya filter ini adalah kumpulan *shell script* yang mengformat hasil `stdout` dari `cgit`, sebagai contoh `about-formatting.sh` adalah *shell script* yang berguna untuk me*render file* `README.md` dan menampilkan di tab khusus bernama `about`. Namun agar bisa me*render file raw* hasil dari `cgit` perlu *library* terpasang yaitu `python` dan `python markdown`. Di FreeBSD ane pakai `python312` maka ane perlu memasang paket ini. Tapi ane males! 

	Jadi ane pasang *parser* dan *render* lain yang lebih ringan yaitu `md4c` yang juga punya fungsi yang sama namun lebih ringan dan mendukung `markdown` a la Github.

	```shell-session
	# pkg install md4c
	```

	Kemudian buat *file* filter baru dengan nama misalnya `about-formatting-md4c.sh` dan isinya menjiplak isi dari *file* asli `about-formatting.sh`. Kira - kira seperti ini

	```sh
	#!/bin/sh

	case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
	    *.markdown|*.mdown|*.md|*.mkd)
		    exec /usr/local/bin/md2html --github
	        ;;
	    *.htm|*.html)
	        exec cat
	        ;;
	    *)
	        exec /usr/local/lib/cgit/filters/lowdown.sh "$@"
	esac
	```

	baris ke-11 berisi aturan jika misal terjadi gagal *render* maka pakai filter `lowdown.sh` yang juga merupakan *rederer* markdown yang ringan. Tapi jika tidak ingin pakai bisa dihapus saja.

	Selanjutnya aktifkan pembacaan *file* README.md di konfigurasi `cgit`

	```txt
	readme=:README
	readme=:README.md
	```
	jika ada *file* README atau README.md maka `cgit` akan me*render*nya di tab *about*

	Begitupula dengan filter `highlight` untuk *syntax highlighting* memerlukan paket lain yaitu `highlight` yang bisa dipasang dengan perintah
	```shell-session
	# pkg install highlight
	```

	Kemudian *edit* file `/usr/local/lig/cgit/filters/syntax-highlighting.sh`.

	*File* ini memberikan pilihan cara menjalankan `highlight` yaitu pada versi 2 atau 3, karena ane pasang versi terbaru maka ane pakai versi 3. Cukup *uncomment* baris untuk versi 3. Kemudian simpan.

	Untuk mendapatkan tampilah *syntax highlight* yang sesuai, salin CSS yang dicontohkan di dalam *file* `syntax-highlighting.sh` dan simpan di *file* `cgit.css`. Namun `highlight` juga memberikan pilihan tema yang banyak, memakai tema bawaan ini lebih mudah daripada menyalin dan mengubah CSS sendiri. 

	*Edit* kembali file `syntax-highlighting.sh` dan rubah menjadi seperti ini

	```sh
	exec /usr/local/bin/highlight --force --inline-css -f -I -O xhtml -S "$EXTENSION" -s github 2>/dev/null
	```
	<aside>
	pakai <code>--inline-css</code> untuk menginjek css kedalam halaman yang dibuka dan <code>-s github</code> mempergunakan tema dari githubi <br />
	untuk tema yang lain bisa dilihat dengan perintah <code>highlight --list-scripts=themes</code>
	</aside>
6. **Menyembunyikan email**, sudah jelas fungsinya untuk menghindari spam kan?, tambahkan pengaturan ini untuk menghilangkan email (*owner* maupun *commiter*) dari halaman `cgit`
	```txt
	noplainemail=1
	```
7. **Menambahkan tautan ke situs lain**, tambahkan 
	```txt
	[gitweb]
		homepage = https://kusaeni.com
	```
	membuat `cgit` akan menampilkan tab baru *Homepage* yang merupakan tautan ke situs yang disebutkan.


## Troubleshoting

1. Tidak bisa push ke repo yang sudah ada.  Masalah ini biasanya dikarenakan folder repo tersebut dimiliki (*ownership*) bukan oleh *user* `fcgiwrap`. Biasanya mudah diselesaikan dengan cara memasukkan *user* atau *group* `www`
	```shell-session
	# chown -R www:www /home/legit/repopo
	```
	Jika *ownership* sudah diatur dengan benar namun masih muncul error *permission*, maka coba untuk mengabaikan *error* tersebut dengan memasukkan `repopo` ke dalam *safe directory*
	```shell-session
	# git config --global add safe.directory /home/legit/repopo
	```
	<div class="postnotes pink">
	<p>perintah ini dijalankan dari <i>client</i> bukan di <i>server</i></p>
	</div>

2. Filter tidak jalan, yang ini pastikan *path* ke *file* filter sudah benar dan pastikan atribut filter adalah *file* yang bisa dieksekusi.
	```shell-session
	# chmod +x /usr/local/lib/cgit/filters/about-formatting.sh
	```
3. Muncul error `error: failed to push some refs to`, masalah ini muncul saat berusaha `push` ke repo dikarenakan saat bikin repo pertama kali tidak menyertakan opsi `--bare`. Solusinya hapus saja folder reponya dan buat ulang dengan menambahkan opsi yang diminta dan jangan lupa rubah kepemilikan ke `www`
	```shell-session
	# git init --bare /home/legit/repopo/
	# chown -R www:www /home/legit/repopo/
	```

	
	
### Inspirasi Modifikasi

Ane membuat repo khusus untuk menampung modifikasi yang sudah ane buat termasuk logo, css, dan beberapa *filters*.

Bisa dilihat di repo ini [cgit_kus](https://legit.kusaeni.com/cgit_kus/)

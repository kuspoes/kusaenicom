---
title: "cgit di FreeBSD"
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
  src: https://sepoi.kuspoes.deno.net/@poes/statuses/
  real: https://sok.egois.org/@poes/statuses/
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

### Install cgit & kebutuhannya

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

summary-branches=10
summary-log=10
summary-tags=10

enable-git-config=1
enable-index-owner=1
max-message-length=10000

enable-blame=1
enable-index-links=1
enable-commit-graph=1
enable-follow-links=1
enable-log-filecount=1
enable-log-linecount=1
max-stats=quarter

readme=:README
readme=:README.md

about-filter=/usr/local/lib/cgit/filters/about-formatting-md4c.sh
source-filter=/usr/local/lib/cgit/filters/syntax-highlighting.sh

noplainemail=1

mimetype.png=image/png
mimetype.jpg=image/jpeg
mimetype.jpeg=image/jpeg
mimetype.gif=image/gif
mimetype.svg=image/svg+xml
mimetype.bmp=image/bmp
mimetype.ico=image/x-icon

clone-prefix=https://legit.kusaeni.com/git
enable-http-clone=1

scan-path=/home/legit/
root-title=Lapis LeGit
root-desc=sungguh legit menggigit, auwwww!
```

Khusus filter, saat diaktifkan mungkin perlu memasang *dependency* lainnya seperti `highlight` atau `py312-markdown` tergantung mau mengaktifkan yang mana. `cgit` sudah menyediakan beberapa filter yang bisa dipakai dan diletakkan di `/usr/local/lib/cgit/filters`.

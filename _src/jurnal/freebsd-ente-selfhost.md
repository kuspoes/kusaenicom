---
title: Self host Ente Photos di FreeBSD
ringkasan: "Ini adalah catatan ane dalam memasang Ente di FreeBSD, tidak mudah dan menjengkelkan. Silakan pakai Linux saja karena mudah dan cocok untuk pemula"
date: 2026-01-04
tags:
  - kusaeni
  - tutorial
  - freebsd
  - bsd
  - selfhost
kategori: jurnal
code: true
favorit: false
comment: true
keywords: bsd, freebsd, ente, selfhost, tutorial
draft: false
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KE3PT1SQ9KEB9077C1X2MMD8
  real: https://sok.egois.org/@poes/statuses/01KE3PT1SQ9KEB9077C1X2MMD8
---

Artikel ini berisi catataan ane saat memasang Ente di FreeBSD. Sejujurnya memasang Ente adalah proses _self host_ app yang sangat rumit dan menjengkelkan yang pernah ane rasakan, hingga saat ini. Jadi tujuan catatan ini dibuat menjadi sangat jelas agar ane (atau ente atau elu) tidak menjadi pusing dan jengkel seperti ane sebelum ini.

Ente adalah aplikasi backup foto seperti Google Photos atau iCloud Photos, dia punya banyak fitur keren (dan _overkill_ untuk ukuran aplikasi Photos) seperti _end to end encryption, open source, cross platform, face recognition, zero knowledge AI_, tanpa iklan, tanpa AI, tanpa _tracking_, dan bahkan 2FA _Authenticator_ di dalamnya.

Ane akan fokus pada fungsi Ente untuk penyimpanan Photos, jadi berikut catatan yang sudah ane kumpulkan dari pengalaman memasang Ente (yang menjengkelkan itu). Ente sudah memberikan dokumentasi untuk _self host_ tanpa Docker, per hari ini sudah banyak perbaikan atas dokumentasi ini namun 3 bulan yang lalu kacau isinya.

### Persiapan

Ente sudah menyediakan _binary_ yang bisa langsung dipasang, sayangnya tidak untuk FreeBSD. Oleh karena itu ane perlu mem-_build_ sendiri _binary_ tersebut. Untuk melakukan itu ada beberapa aplikasi dan pustaka yang perlu dipasang terlebih dahulu.

1. **Go**. Mutlak diperlukan karena Ente dibuat dengan Go, tambahkan `pkgconf` untuk _handling dependencies_. Ane nanti perlu _pull_ data dari repo Ente di [Github](https://github.com/ente-io/ente/) jadi butuh Git. Untuk _reverse proxy_ ane akan pakai [Caddy](https://caddyserver.com/).

   ```shell-session
   $ doas pkg update
   $ doas pkg install go124 pkgconf git-lite caddy
   ```

2. **Postgresql**. Ente pakai postgresql untuk database-nya, juga minta `libsodium` untuk enkripsi E2E. Karena ane sudah ada postgresql di jail yang lain, jadi ane cukup pasang `libsodium`. Tapi, oke baiklah mari kita anggap tidak ada postgres.

   ```shell-session
   $ doas pkg install libsodium postgresql18-server
   ```

   Kemudian buat database postgresql, sebelum itu aktifkan postgresql, inisialisasi postgres ,dan jalankan daemonnya dulu

   ```shell-session
   $ doas sysrc postgresql_enable="YES"
   $ doas /usr/local/etc/rc.d/postgresql initdb
   $ doas service postgresql start
   ```

   Pastikan bahwa postgresql sudah berjalan dengan baik

   ```shell-session
   $ doas service postgresql status
   status postgresql
   pg_ctl: server is running (PID: 66771)
   /usr/local/bin/postgres "-D" "/data/postgres/data18"

   $ doas sockstat -4 | grep 5432
   postgres postgres   88698  9 tcp4  10.0.0.3:5432         10.0.0.4:13701
   postgres postgres   88682  9 tcp4  10.0.0.3:5432         10.0.0.4:62644
   postgres postgres   88662  9 tcp4  10.0.0.3:5432         10.0.0.4:58171
   postgres postgres   66771  6 tcp4  10.0.0.3:5432         *:*
   ```

   Setelah postgres benar - benar berjalan, ganti password untuk user default postgresql yaitu `postgres`

   ```shell-session
   $ doas passwd postgres
   ```

   Buat user dan database untuk Ente, kemudian atur agar database tersebut menjadi milik user yang dibuat.

   ```shell-session
   $ su - postgres
   $ CREATEUSER ente-admin
   $ CREATEDB ente-db -O ente-admin
   ```

   Atur password untuk `ente-admin` dan beri semua _privilleges_ untuknya.

   ```shell-session
   $ psql ente-db
   ente-db=# ALTER ROLE ADMIN WITH ENCRYPTED PASSWORD 'entebahlul';
   ente-db=# GRANT ALL PRIVILLEGES ON DATABASE ente-db TO ente-admin;
   ente-db=# exit
   $ exit
   $ doas service postgresql restart
   ```

   Asumsi postgresql dan Ente akan berjalan di localhost, maka ane tidak perlu mengubah pengaturan untuk akses jaringan di `postgresql.conf` dan `pg_hba.conf`. Namun jika postgresql jalan di jaringan atau jail yang lain, maka perlu merubah pengaturan.

   ```shell-session
   # vim /data/db/postgres/data18/postgresql.conf
   listen_addresses = '*'
   ```

   merubah isian `listen_addresses` ke `*` membuat postgresql akan menerima koneksi dari luar jail. Kemudian di file `pg_hba.conf` ditambahkan isian sebagai berikut

   ```shell-session
   # vim /data/db/postgres/data18/pg_hba.conf
   	host    ente_db      all     10.0.0.3/32         trust
   	host    ente_db      all     10.0.0.0/24         trust
   ```

   dimana `10.0.0.3` adalah IP dari Ente.

3. **NodeJS**, diperlukan untuk _build frontend_. Sebenarnya ane ga butuh untuk _build frontend_ di FreeBSD, namun siapa tahu ada masalah ane tetap _install_ saja.

```shell-session
$ doas pkg install node24 yarn-node24
```

4. **Storage** alias penyimpanan. Ane sudah punya Garage S3 yang berjalan di dalam jail dan sudah menulis [tentang cara pasang](https://kusaeni.com/jurnal/freebsd-self-hosting-s3/) dan pengaturannya.

### Build

Ente memiliki 2 jenis servis yaitu _backend_ dan _frontend_, oleh karena itu perlu untuk melakukan build secara terpisah. *Backend*nya sendiri dibangun dengan Go dan akan menghasilkan _file binary_, sedangkan *frontend*nya dibangun dengan NextJS.

#### Backend

Setelah semua persiapan selesai, saatnya melakukan _build_ Ente server. Unduh repo Ente terlebih dahulu dengan git dan kemudian _build_.

```shell-session
$ git clone https://github.com/ente-io/ente.git
$ cd ente/server
$ go124 mod tidy
$ go124 build cmd/museum/main.go
```

Perintah `go mod tidy` digunakan untuk mengunduh semua _dependencies_ dan perintah `go build` untuk memulai melakukan _build_ dengan hasil file `main` yang sudah memiliki atribut _execute_.

Saat _file_ `main` dijalankan akan muncul error bahwa dia membutuhkan _file_ konfigurasi bernama `museum.yaml`. Jadi salin _file_ tersebut dari folder `example` atau bikin sendiri kosongan.

```shell-session
$ cp config/example.yaml ./museum.yaml
```

Agar bisa berjalan saja untuk sementara ane isi dengan konfigurasi database dan bucket S3. Contohnya seperti ini

```yaml
db:
  host: 10.0.0.3
  port: 5432
  sslmode: disable
  name: ente-db
  user: ente-user
  password: entebahlul

s3:
  are_local_buckets: false
  use_path_style_urls: true
  b2-eu-cen:
    key: W3wNV6XRh1YJ8arQKBoongNqGhQ
    secret: FakeLIpA3l0VjttIiHaZgdMXF4ujQOYTyBtztpSy7w0yD2qzphOQwRtvj
    endpoint: s3.taa.ee
    region: us-east-1
    bucket: ente-bucket
```

khusus untuk s3, karena ane pakai local atau _selfhost_ maka nilai `are_local_buckets: false` karena ane pakai endpoint url. Ane sudah coba kasih `true` tapi tak pernah bisa tersambung dengan baik. `b2-eu-cen` adalah `key` yang harus dipakai jika pakai s3 _selfhost_ atau AWS Compatible s3.

Kemudian jalankan `./main` secara `default`nya akan mencari _file_ `museum.yaml` sebagai konfigurasi utama atau kasih _flags_ `--config path` jika memakai nama yang lain. Ente akan berjalan di https://localhost:8080.

Jika ada rencana untuk memakai email sebagai alat komunikasi dan verifikasi, ada baiknya untuk mengatur JWT (JSON Web Token) yang bisa dibuat dengan perintah

```shell-session
$ cd ente/server
$ go124 run tools/gen-random-keys/main.go
```

Kemudian simpan hasilnya di _file_ `museum.yaml` di bawah pengaturan sebelumnya. Karena ane hanya _single user_ maka ane tak perlu pengaturan ini, resikonya adalah OTP tidak akan dikirim ke email, melainkan harus melihat di console.

Setelah _backend_ sudah selesai di*build* selanjutnya adalah _build_ `ente-cli` yang nantinya sangat penting untuk melakukan _tweaks_ akun Ente.

```shell-session
$ cd ente/cli
$ go124 build -o "bin/ente-cli" main.go
```

perintah ini akan menghasilkan file `ente-cli` di dalam folder `bin`. Agar bisa dipergunakan yang harus dilakukan adalah menentukan konfigurasi, `ente-cli` membutuhkan file `config.yaml` di folder `.ente` di _home directory_.

```shell-session
$ cd ~
$ mkdir .ente
$ touch config.yaml
endpoint:
	api: http://localhost:8080
$ mkdir secrets
```

elu bisa pakai nilai `http://localhost:8080` atau langsung domain (tapi harus set di Caddy dulu). Juga harus membuat folder `secrets` yang dipergunakan `ente-cli` untuk menyimpan _secrets auth_.

Untuk sementara sampai disini _build backend_ (server dan cli), selanjutnya adalah _build frontend_.

#### Frontend

Ane tidak melakukan _build frontend_ di FreeBSD karena NextJS tidak bisa berjalan lancar di sini, memang bisa diakali dengan mengikuti banyak sekali _build library_ dari _source_ tapi tidak _worth it_ untuk dilakukan. NextJS adalah aplikasi web dan dia tidak butuh harus di*build* di FreeBSD (_framework agnostic_), jadi ane akan build di Macos karena lebih mudah.

Di Macos tentu harus pasang Node, npm, dan [yarn](https://yarnpkg.com/) semua diselesaikan oleh [Homebrew](https://brew.sh/).

```shell-session
$ git clone https://github.com/ente-io/ente.git
$ cd ente/web
$ yarn install
```

Tunggu sampai selesai, setelah itu ane bisa saja mengatur _environment variables_ tapi tidak ane lakukan karena memang mau buat Ente Photos lebih aman dengan mengetik langsung _endpoint_-nya saat login.

_Frontend_ bisa di*build* dengan yarn (ane hanya build `accounts`, `photos` saja ga butuh yang lainnya) caranya sebagai berikut

```shell-session
$ yarn build
$ yarn build:accounts
```

kedua perintah di atas akan mem*build frontends* dan hasilnya bisa dilihat di folder `out` di bawah `apps/photos/` dan `apps/accounts/` . Untuk mempermudah maka ane kumpulkan folder `out` tadi ke satu folder khusus dengan nama `ente-www`.

```shell-session
$ cp -R ente/web/apps/photos/out ~/ente-www/photos
$ cp -R ente/web/apps/accounts/out ~/ente-www/accounts
```

### Caddy Reverse Proxy

Untuk ini ane sudah siapkan domain, sebut saja `photos.taa.ee`. Langsung saja _edit file_ konfigurasi Caddy dan tambahkan _rules_ baru.

```shell-session
$ doas vim /usr/local/etc/caddy/Caddyfile
photos.taa.ee {
	root * /home/tae/ente-www/photos
	file_server try_files {path} {path}.html /index.html
	}

ente.taa.ee {
	reverse_proxy http://127.0.0.1:8080
	}

$ doas caddy validate /usr/local/etc/caddy/Caddyfile
$ doas service caddy restart
```

Jika tidak ada masalah seharusnya Ente sudah bisa diakses dengan membuka `photos.taa.ee`. Di tampilan awal Ente, klik 7x di gambar brankas dan ketik alamat dari ente server yaitu `ente.taa.ee`. Kemudian klik pada tautan **Don't have an account** untuk mendaftar.

![ente developer mode](https://ik.imagekit.io/hjse9uhdjqd/jurnal/ente/ente-1_6vBhiSSZ8.gif)

Karena ane tidak setup email (SMTP dll termasuk JWT), maka verifikasi akun tidak bisa dilakukan melalui email. Jadi kembali ke console dan lihat log dari `main` dan cari baris seperti ini

```
Skipping sending email to poes@taa.ee: Verification code: 946197
```

Masukkan kode verifikasi `946197` dan _voila_ bisa langsung masuk ke dalam Ente Photos.

#### Konfigurasi lanjutan

Semua perubahan di `museum.yaml` harus diikuti dengan _restart_ `main` agar Ente mempergunakan konfigurasi yang baru dirubah.

1. **Closed, tidak menerima pendaftaran**
   Instance Ente ini ane pergunakan pribadi sehingga ane tidak perlu menerima pendaftaran, oleh karena itu ane masukkan `key` berikut di `museum.yaml`

```yaml
internal:
	disable-registration: true
```

2. **Jadi Admin**
   Ini penting karena menjadi admin bisa melakukan pengaturan secara maksimal. Untuk menjadi admin ada beberapa langkah yang harus dilakukan yaitu mencari `user_id` di dalam database postgres dan masukkan ke dalam `museum.yaml`.

```shell-session
$ psql -U ente-user -d ente-db
ente-db=# SELECT * FROM users;
```

Catat `user_id`, misalnya `1580567352375231` kemudian edit file `museum.yaml`

```yaml
internal:
	disable-registration: true
	admins:
		- 1580567352375231
```

3. **Upgrade storage**
   Meski _selfhost_, *default*nya Ente akan memberikan _storage_ maksimal 10GB pada setiap user, agar bisa memaksimalkan _storage_ ada 2 cara yaitu _edit_ database atau pakai `ente-cli`.x

Agar bisa mempergunakan `ente-cli` maka akun ane harus sudah menjadi admin. Kemudian jalankan `ente-cli`.

```shell-session
$ cd ente/cli/bin
$ ./ente-cli admin update-subscription -u poes@taa.ee --no-limit True
```

perintah ini akan membuat user poes@taa.ee akan memiliki _storage_ sebesar 100TB dengan akan _expired_ di 100 tahun kemudian.

Namun jika lebih nyaman dengan SQL, bisa dicoba [cara berikut:](https://pegelinux.top/users/kimiamania/statuses/115458916631493259)

```shell-session
$ psql -U ente-user -d ente-db
$ UPDATE subscriptions SET storage = 107374182400 WHERE user_id = 1580567352375231;
```

Mempergunakan cara ini lebih beresiko database rusak sehingga ane pilih memakai `ente-cli`.

<div class="image-2column">
<img class="no-border" src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/ente/ente-limit_vVmbYvovP.png" alt="ente user limit storage">
<img class="no-border" src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/ente/ente-no-limit_301ZKOOdo.png" alt="ente user no limit storage">
</div>

4. **Update CORS**
   Ane pakai Garage S3 (AWS Compatible), entah mengapa selalu gagal saat upload media melalui Ente. Dari web console errornya adalah masalah CORS Origin. Jadi ane perlu benerin bucket dengan mengupdate Cors. Buat file dengan nama misalnya `cors.json`

   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["*"],
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "HEAD", "POST", "PUT", "DELETE"],
         "MaxAgeSeconds": 3000,
         "ExposeHeaders": ["Etag"]
       }
     ]
   }
   ```

Kemudian dengan [aws-cli](https://github.com/aws/aws-cli) (perlu dikonfigurasi dulu) _update bucket policy_.

```shell-session
$ aws s3api put-bucket-cors --bucket ente-bucket --cors-configuration file://home/poes/cors.json
```

#### Linux

Khusus untuk yang ingin mudah hidupnya, gunakan Linux karena Ente bisa diinstall hanya dengan 1 baris perintah. Apa itu adek - adek?

```shell-session
$ sh -c "$(curl -fsSL https://raw.githubusercontent.com/ente-io/ente/main/server/quickstart.sh)"
```

Setelah semua selesai Ente akan tersedia di `http://localhost:3000`. Linux itu mudah bukan? bukan.

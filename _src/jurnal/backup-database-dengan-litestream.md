---
title: Backup database dengan Litestream
ringkasan: "Ane pakai untuk backup database sqlite3 dan sejauh ini, ini yang paling bagus meski sedikit ruwet."
date: 2026-06-26
tags:
  - tutorial
  - litestream
  - selfhost
  - gotosocial
kategori: jurnal
relasi: gotosocial
code: true
favorit: false
comment: true
keywords: "backup database, backup sqlite, sqlite, backup, database, gotosocial, backup postgres, backup database dengan litestream"
draft: true
tocx: true
lightbox: false
comments:
  src: https://sepoi.deno.dev/@poes/statuses/
  real: https://sok.egois.org/@poes/statuses/
---

Ketika ngomongin backup database SQLite ane ada 2 pilihan yaitu backup *full compress* atau memanfaatkan WAL. Untuk yang *full* maksudnya adalah membuat salinan database yang kemudian dikompresi dengan `tar.xz` dan dikirim ke *clouds*, seperti yang sudah ane lakukan dengan [Restic atau Rclone](/jurnal/freebsd-backup-restic/). Meski sangat handal, memakai cara ini memiliki sedikit kekurangan yaitu database harus dalam *idle state* (tidak ada proses baca tulis) dan data yang disimpan mengikuti *update* waktu saat dilakukan penyimpanan atau *backup*.

Misal database di-*backup* setiap jam 24 maka jika di jam 03 terjadi masalah misalnya maka data yang tersedia untuk di-*restore* hanya data saat jam 24 tersebut. Sehingga data antara jam 24-03 tidak tersedia. Pengorbanan yang memang harus diterima, sampai kemudian datang aplikasi bernama [Litestream](https://litestream.io) dengan misi untuk *fully-replicated database with no pain and little cost*[^1].


<div class="sidebar_notes sebelah_kanan">
    <p><sup>1</sup>: Membuat replika database dengan mudah dan murah.</p>
</div>

Sehingga ane akan pakai Litestream untuk backup database SQLite yang ane pakai di [Gotosocial](https://gotosocial.org) yang juga sudah mendukung pemanfaatan Litestream dengan baik. Beberapa detil yang tersedia sebagai berikut:

| Uraian | Deskripsi |
|:------:|:---------:|
| Path   | <code>/var/www/gotosocial/data/egois.db</code> <br /> lokasi database tersimpan|
| Nama DB | <code>egois.db</code> <br /> dengan WAL Mode|
| Type DB | SQLite3 database |
| Versi Litestream | 0.3.13 |

### Mempersiapkan database Gotosocial

Agar bisa memanfaatkan Litestream untuk mem*backup* database SQLite maka perlu mengaktifkan [WAL Mode](https://sqlite.org/wal.html) atau *Write-Ahead Logging*. Di Gotosocial untuk mengaktifkan ini perlu menambahkan pengaturan di *file* `config.yaml` seperti berikut

```yaml
db-sqlite-journal-mode: "WAL"
db-sqlite-synchronous: "NORMAL"
```
<aside>
Secara <i>default</i> Gotosocial sudah mengaktifkan pengaturan ini.
</aside>

### Litestream

<div class="sidebar_notes sebelah_kiri" style="margin-top:3em">
    <p><sup>2</sup>: Versi 0.5 masih pakai metode WAL namun dengan pendekatan lebih canggih dengan LTX (Litestream Transaction Log) yang melakukan kompresi lebih baik daripada versi sebelumnya dengan WAL (lz4). </p>
</div>

Ane pakai [#FreeBSD](/tags/freebsd), btw.  versi Litestream yang ane pakai adalah versi stabil 0.33 sedangkan versi terakhir adalah 0.5, alasannya adalah karena 0.33 lebih stabil menurut ane dan masih pakai mode WAL klasik[^2]. 

Masalah lainnya adalah alih - alih menjanjikan ukuran backup yang lebih hemat penyimpanan, pengalaman ane memakai versi 0.5 malah sebaliknya. Backup database bengkak menjadi 4-5 kali lipat padahal proses baru berjalan kurang dari 24 jam. Sedangkan versi 0.3 malah lebih hemat karena hasil backup untuk database yang sama hasilnya mirip dengan ukuran database aslinya, selisih pun tidak signifikan. 

Berikut adalah perbandingan antar versi Litestream yang pernah ane pakai:

<div class="lebar">
    <div class="div_flex">
    <div class="flex_kolom">
        <h4>Litestream v0.3.13</h4>
        <ul>
            <li>Masih mempergunakan cara "tradisional" untuk transaksi backup database yaitu dengan WAL.</i>
            <li><i>Package Binary</i> sudah tidak tersedia di repo FreeBSD, resikonya harus build manual. Potensi untuk gagal tetap ada.</li>
            <li>Pengalaman ane, ukuran file backup <mark>lebih bisa dikendalikan</mark> sehingga lebih hemat penyimpanan (dan biaya) sewa S3 storage</li>
            <li>Ringan, di awal memakai 100 - 200 MB RAM saat membuat snapshot, namun setelah selesai sekitar 40-60 Mb konsumsi RAM.</li>
        </ul>
    </div>
    <div class="flex_kolom">
        <h4>Litestream v0.5</h4>
        <ul>
            <li>Disebut lebih modern dengan dengan memanfaatkan teknologi dari LiteFS/LTX yaitu LTX sehingga memungkinkan untuk <mark><i>restore database</i> lebih cepat</mark>.</i>
            <li><i>Package Binary</i> sudah tersedia di repo FreeBSD sehingga tinggal pasang dan memiliki kompatibilitas yang baik. <code>doas pkg install litestream</code></li>
            <li>Ukuran backup lebih besar beberapa kali lipat, mungkin karena bug yang masih ada di versi 0.5 karena pemanfaatan LTX.</li>
            <li>Agak berat, konsisten memakai RAM sekitar 200Mb ke atas saat dijalankan</li>
        </ul>
    </div>
    </div>
</div>

#### Build manual
Masalahnya paket 0.33 sudah tidak tersedia di repositori FreeBSD maka ane perlu mem*build* secara manual. 

```shell-session
$ mkdir tmp && cd tmp
$ fetch https://github.com/benbjohnson/litestream/archive/refs/tags/v0.3.13.tar.gz
$ tar -xf v0.3.13.tar.gz
$ cd litestream-0.3.13
$ go build -tags osusergo,netgo -ldflags "-X main.version=0.3.13" ./cmd/litestream
```

karena litestream dibuat dengan Golang, maka minimal harus ada Golang versi 1.21. Tunggu sampai selesai akan muncul file `litestream`. Pindahkan ke `/usr/local/bin` dan beri atribut eksekusi.

```shell-session
$ cp litestream /usr/local/bin/litestream
$ doas chmod +x /usr/local/bin/litestream
```

#### Konfigurasi

Umumnya Litestream menyimpan konfigurasi dalam bentuk berkas `yaml` atau `yml`[^3] dan ditaruh di folder `/etc/`, Sehingga *path* lengkap dari berkas konfigurasinya adalah `/etc/litestream.yml`. 

<div class="sidebar_notes sebelah_kanan" style="">
    <p><sup>3</sup>: <code>yaml</code> dana <code>yml</code> adalah format yang sama, perbedaan hanya terletak pada huruf "a" karena alasan kompatibilitas dengan MS-DOS yang mewajibkan ekstensi hanya boleh pakai 3 karakter.</p>
</div>

```yaml
dbs:
  - path: /var/www/database/egois.db
    lock-timeout: 30s
    replicas:
      - name: nama_replika
        type: s3
        bucket: nama_bucket
        path: gotosocial
        region: us-east-1
        skip-verify: true
        endpoint: https://s3.provider.id
        force-path-style: true
        access-key-id: <access-key>
        secret-access-key: <secret-access-key>
        sync-interval: 60s
        retention: 12h
```
<aside>
    untuk <b>endpoint</b>, <b>access-key-id</b>, dan <b>secret-access-key</b> bisa didapatkan dari penyedia/<i>provider storage server</i>. Jika tidak pakai AWS, biasanya <b>region</b> cukup diisi <code>us-east-1</code>. Pastikan benar agar bisa terhubung dengan baik.
</aside>

Pengaturan tambahan yang menurut ane penting adalah `sync-interval` dan `retention`. 

`sync-interval` berguna untuk berapa sering Litestream memeriksa database untuk mencari perubahan dan membackup file WAL-nya ke *storage*, sedangkan `retention` mengontrol Litestream untuk secara aktif menghapus file WAL yang lama sebagai contoh `12h` akan membuat Litestream menghapus file WAL yang usinyanya lebih dari 12 jam.

Agar bisa berjalan setiap <i>boot</i> dan atau mempermudah dalam pemakaian maka ane buat rc script sederhana, sebagai berikut

```bash
#!/bin/sh

. etc/rc.subr

name=litestream
rcvar=litestream_enable
load_rc_config "${name}"
procname="/usr/local/bin/litestream"

command=/usr/sbin/daemon
command_args="-S -T ${name} ${procname} replicate > /dev/null 2>1&"

run_rc_command "$1"
```
<aside>Jangan lupa untuk membuat file <i>script</i> ini menjadi <i>executable</i> dengan <code>chmod +x</code></aside>

#### Replicate
Kemudian daftarkan ke layanan *service daemon* di `/etc.rc.conf` dan setelah itu bisa dijalankan dengan *command* `service`

```shell-session
$ doas sysrc litestream_enable=YES
litestream_enable = NO → YES
$ doas service litestream start
$ tail -f /var/log/messages | grep litestream
```

Litestream membutuhkan waktu untuk menyusun *snapshot* dan persiapan *backup* setelah selesai dan berjalan normal, akan muncul file backup di *bucket S3*. Hasil file backupnya biasanya ada  di folder **generations** yang berisi folder **snapshot** dan **WAL**, snapshot berisi salinan dari database sedangkan WAL berisi file kecil yang merupakan catatan transaksi.

#### Restore

Proses *restore* adalah mengembalikan database yang sudah di*backup* sebelumnya dengan Litestream. Ada beberapa pilihan yang bisa dilakukan yaitu langsung *restore* database dari *backup* terakhir atau *restore* dari jam tertentu.

Namun sebelum melakukan itu ada baiknya untuk memeriksa *timestamp* dan daftar *files* yang tersedia.

```shell-session
$ litestream generations -config /etc/litestream.yml /var/www/database/egois.db
name  generation       start                 end
idc   b37bjda78c437    2026-06-25T10:16:02Z  2026-06-25T10:30:55Z
```

Dari hasil perintah di atas, diketahui 
- ada 1 buah generasi yang *file snapshot*nya dibuat pertama kali pada tanggal 25 Juni 2026 jam 10:16 WIB 
- Jam 10:16 WIB adalah batas paling lama dan tidak bisa melakukan *restore* sebelum jam dan tanggal ini karena ini adalah *checkpoint* awal backup dibuat,
- Jam 10:30 WIB adalah posisi backup paling akhir (terkini) yang tersedia, mungkin setelah jam ini ada *checkpoint* baru namun saat perintah di atas dilaksanakan, 10:30 WIB adalah *checkpoint* terkini yang tersedia.

<p></p>

##### Restore langsung ke backup terakhir
Jika ingin langsung saja *restore* ke waktu paling akhir (yaitu jam 10:30 WIB) maka matikan dulu semua akses ke database *existing* di lokal dan gunakan perintah seperti ini 

```shell-session
$ litestream restore -config /etc/litestream.yml \
-o /home/poes/egois-restore.db /var/www/database/egois.db
```

Litestream akan melakukan *restore* dan menyimpan hasilnya di `/home/poes/egois-restore.db`. Setelah selesai, sebaiknya lakukan pemeriksaan integritas data dengan perintah <mark>`sqlite3 "PRAGMA integrity_check;"`</mark>. Hasil yang diharapkan adalah OK namun jika ada *error's* maka ada masalah saat *restore* atau *backup*.


##### Restore ke backup di jam tertentu

Seperti hasil dari pemeriksaan generasi data *backup* di atas, maka *restore* database ke jam tertentu hanya bisa dilakukan di rentang antara 10:16 WIB - 10:30 WIB[^4]. Pemilihan waktu sampai detail ke menit ditentukan oleh apakah di jam tersebut ada proses *backup* yang berhasil dijalankan. 

<div class="sidebar_notes sebelah_kanan" style="">
    <p><sup>4</sup>: rentang waktu ini dipengaruhi juga berapa lama database sudah di-backup dan berapa lama retention diterapkan. Semakin lama (keduanya) maka pilihan jam dan harinya bisa saja lebih banyak, namun hal ini akan berpengaruh terhadap besaran data yang disimpan di dalam bucket S3.</p>
</div>

Jika tidak ada biasanya proses *restore* tidak akan berjalan, jadi pemilihan waktu ini sangat krusial yang dipengaruhi oleh pengaturan `sync-interval` di *file* `/etc/litestream.yml`, semakin kecil nilainya semakin besar peluang data tersedia setiap menit.

Sebagai contoh ane akan *restore* database di pukul 10:20 WIB, maka perintah yang ane terapkan adalah 

```shell-session
$ litestream restore \
  -config /etc/litestream.yml \
  -replica nama_replika \
  -timestamp "2026-06-25T10:20:00Z" \
  -o /home/poes/egois-restore.db \
  /var/www/database/egois.db
```

Jika ada *check point* di jam tersebut maka database akan di-*restore* ke `/home/poes/egois-restore.db`. Jangan lupa lakukan pemeriksaan integritas data.

### Kesimpulan

Litestream adalah *tool* yang sangat bagus untuk membantu proses *backup* & *restore* untuk database yang tidak memiliki *tool backup* internal seperti SQLite. Ane lebih memilih memakai versi 0.3.13 yang menurut ane lebih stabil (di [#FreeBSD](/tags/freebsd)) dibandingkan versi terbaru 0.5 yang masih ada beberapa *bug's* mengganggu.

Alikasi ini mengsyaratkan S3 sebagai tempat penyimpanan, namun jika tidak memiliki maka mempergunakan alat lain seperti Restic dan Rclone bisa dipertimbangkan.

---

[^1]: Membuat replika database dengan mudah dan murah.
[^2]: Versi 0.5 masih pakai metode WAL namun dengan pendekatan lebih canggih dengan LTX (Litestream Transaction Log kadang disebut LiteFS Transaction) yang melakukan kompresi lebih baik daripada versi sebelumnya dengan WAL (lz4).
[^3]: <code>yaml</code> dana <code>yml</code> adalah format yang sama, perbedaan hanya terletak pada huruf "a" karena alasan kompatibilitas dengan MS-DOS yang mewajibkan ekstensi hanya boleh pakai 3 karakter.
[^4]: rentang waktu ini dipengaruhi juga berapa lama database sudah di-backup dan berapa lama retention diterapkan. Semakin lama (keduanya) maka pilihan jam dan harinya bisa saja lebih banyak, namun hal ini akan berpengaruh terhadap besaran data yang disimpan di dalam bucket S3.

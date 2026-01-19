---
title: Backup data dengan Restic dan Rclone
ringkasan: "Sedia backup sebelum hujan badai datang"
date: 2025-12-21
tags:
  - tutorial
  - restic
  - rclone
  - bsd
  - freebsd
kategori: jurnal
relasi: freebsd
code: true
favorit: false
comment: true
keywords: restic, rclone, backup, selfhost, koofr, cloud storage
draft: false
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KD0P1KEZNSM2H09G1S5HJBV8
  real: https://sok.egois.org/@poes/statuses/01KD0P1KEZNSM2H09G1S5HJBV8
---

Kelemahan self host aplikasi adalah repot dalam pemeliharaan sistem dan ini ane rasakan ketika Ente Photos bermasalah di database-nya. Entah karena upgrade NextJS atau karena hal lainnya. Masalah semakin pelik ketika entah bagaimana postgresql menghapus semua entry database media milik Ente, bisa jadi karena ane salah memasukkan perintah SQL. Untungnya ane sempat membuat backup beberapa minggu sebelumnya, sehingga bisa meng*restore* database kembali.

Oleh karena itu penting bagi ane untuk rutin melakukan backup database (dan data penting lainnya) untuk berjaga - jaga jika suatu hari ada masalah. Backup database yang ane restore tersebut ane backup di host (postgresql di jail), syukur Alhamdulillah tapi model backup seperti ini tak aman. Karena jika ane membuat kesalahan lagi dan [host error/rusak](https://sok.egois.org/users/poes/statuses/01KCH9ENQC46V5J8QQA8HFNYJ3) maka otomatis backup tidak akan bisa ane akses. Maka memiliki backup di tempat berbeda (cloud storage) menjadi sebuah kewajiban yang tidak bisa ane hindari.

Namun ane ga mau keluarkan uang untuk sewa cloud storage, jadi ane pilih beberapa layanan backup dan cloud storage gratisan yang bisa dipakai. Salah duanya adalah [Borgbase](https://borgbase.com/) dan [Koofr](https://koofr.net/). Keduanya memberikan storage gratis sebesar 10GB per user dan itu sudah cukup untuk membackup database yang ane miliki, apalagi nantinya ane akan pakai tool backup yang mendukung [deduplikasi](https://id.wikipedia.org/wiki/Deduplikasi_data). Dalam hal ini ane akan memakai [Restic](https://restic.net/) karena tool ini yang mendukung proses backup ke Borgbase maupun Koofr.

<div class="postnotes">
<p>Seperti biasa ane mempergunakan <a href="https://www.freebsd.org/">FreeBSD</a> rilis 14.3 sebagai OS, namun baik rclone maupun restic tersedia dengan luas untuk sistem operasi lainnya.</p>
</div>

Di FreeBSD restic dan rclone sudah tersedia di dalam repo sehingga tak perlu build manual atau lewat [Freshports](https://www.freshports.org/sysutils/restic/)[^1]

```shell-session
$ doas pkg install -y restic rclone
```

### Borgbase

Ane mendaftar untuk trial (lifetime) dan mendapatkan 10GB storage dengan batasan hanya bisa dipakai untuk 2 repositori/repo saja. Setelah login ane bikin repo baru dengan nama "VaultWarden" karena akan dipakai untuk backup database SQLite Vaultwarden.

Di tab Basic, ane pilih Repo Region ke EU. Alasannya? karena EU biasanya lebih cepat diakses dari Indonesia dan karena sentimen politik saja. Untuk Repo Format ada 2 pilihan yaitu memakai [Borg](https://borgbackup.readthedocs.io/en/stable/) dan Restic. Borg adalah tool backup yang juga dibuat oleh Borgbase, namun disini ane akan pakai Restic. Ane abaikan tab Access dan Monitoring, tapi di tab Advanced ane aktifkan Enable Storage Limit ke 5GB (sisanya untuk repo kedua).

Borg akan memberikan URL restic repo, yang ini harus disimpan karena nantinya akan dipakai untuk restic mengakses repo. Formatnya biasanya seperti ini:

```text
rest:https://trkhdakh06:akljhkldjav@trp54607.repo.borgbase.com
```

Di local atau di VPS ane kemudian melakukan inisialisasi restic repo, namun yang pertama kali dilakukan adalah memastikan URL restic repo tersedia secara global[^2]. Maka di file `~/.profile` perlu ane tambahkan baris berikut:

```text
export RESTIC_REPOSITORY="rest:https://trkhdakh06:akljhkldjav@trp54607.repo.borgbase.com"
```

kemudian refresh shell profile dengan perintah `. ~/.profile` atau logout dari session dan login kembali. Setelah itu jalankan inisialisasi restic repo dengan perintah:

```shell-session
$ doas restic init
```

Restic akan meminta password (2 kali), password ini akan dipergunakan restic untuk mengakses repo. Begitu inisialisasi selesai maka repo sudah siap dipergunakan. Untuk memulai backup bisa dengan perintah berikut:

```shell-session
$ doas restic backup /path/ke/data_backup
```

Untuk melihat status backup bisa dengan perintah:

```shell-session
$ doas restic snapshots
repository c4brutd5 opened (version 2, compression level auto)
ID        Time                 Host        Tags        Paths                            Size
-------------------------------------------------------------------------------------------------
7f3ffd40  2025-12-19 02:01:13  pribsd                  /usr/local/www/vaultwarden/data  5.441 MiB
4fbca2f9  2025-12-20 02:00:34  pribsd                  /usr/local/www/vaultwarden/data  5.504 MiB
25tgeb19  2025-12-21 02:00:20  pribsd                  /usr/local/www/vaultwarden/data  5.945 MiB
-------------------------------------------------------------------------------------------------
3 snapshots
```

### Koofr

Pada dasarnya cara backup ke Koofr sama saja dengan Borgbase namun Koofr tidak bisa diakses langsung melalui restic, disini rclone tampil sebagai jembatan.

<div class="postnotes">
<p>Kelebihan memakai Koofr adalah dia tidak membatasi jumlah repositori karena seolah - olah seperti penyimpanan biasa karena dikenali sebagai rclone.</p>
</div>

<pre class="no-border">
<code>
+-----------------------------------+        +------------+
| FreeBSD Host                      |        |            |
|                                   |        |            |
|  +----------+       +----------+  | https  |    Koofr   |
|  |  Restic  |------>|  Rclone  |---------->|   Storage  |
|  +----------+       +----------+  |        |            |
|                                   |        |            |
+-----------------------------------+        +------------+
</code>
</pre>

Namun agar bisa diakses dengan rclone, Koofr perlu membuat semacam password khusus. Caranya adalah login ke dalam Koofr kemudian masuk ke **Preferences** dan buka halaman **Password**. Gulir ke bawah dan temukan **App Passwords**, bikin nama app dan kemudian klik tombol **Generate**. Catat password acak yang dibuat oleh Koofr karena akan dipakai untuk akses rclone.

![Koofr setup app password](https://ik.imagekit.io/hjse9uhdjqd/jurnal/restic/SCR-20251221-msdr_BW6Y0vqdH.png)

Di local atau VPS, setup rclone dengan perintah `rclone config` dan isian seperti berikut:
| Uraian | Value | Keterangan |
|----------|:-------------:|:------------|
| name | koofr | bisa diisi bebas |
| type | cloud | bisa diisi bebas |
| provider | koofr | harus Koofr |
| user | email@emailku.org | email yang dipakai untuk login ke Koofr |
| password | password | App password dari koofr |

Jika data yang dimasukkan benar, maka tes koneksi dengan perintah `rclone lsd koofr:` maka akan muncul daftar folder yang ada di dalam Koofr ane.

```shell-session
# rclone lsd koofr:
         -1 2000-01-01 07:00:00        -1 My documents
         -1 2000-01-01 07:00:00        -1 Vaultwarden
```

Rclone sudah selesai saatnya mengatur restic. Seperti di Borgbase maka di `~/.profile` rubah menjadi

```shell-session
export RESTIC_REPOSITORY=rclone:koofr:Vaultwarden
```

<div class="postnotes">
<p>Jika ingin mempergunakan keduanya (Borgbase maupun Koofr) ane buat 2 variable dengan nama masing - masing <code>$RESTIC_BORG</code> dan <code>$RESTIC_KOOFR</code>. Namun saat operasi restic harus menyertakan flag <code>-r</code> dan nama variable, contohnya seperti ini: </p>
<pre><code>restic backup -r $RESTIC_KOOFR /path/ke/backup_data</code></pre>
</div>

Selesai, kemudian tinggal melakukan backup dengan perintah seperti sebelumnya di Borgbase. Keren!. Level selanjutnya adalah automatisasi dengan shell script dan cronjob, tapi ane ga akan bahas disini karena itu hanyalah rangkuman command di atas.

#### Update

Oke - oke berikut contoh shell script sederhana untuk backup data ke Koofr dan Borg.

```bash
#!/bin/sh

SERVICE=vaultwarden
DATA=/usr/local/www/vaultwarden/data

# Restic config
export RESTIC_PASSWORD='passwordku-yang-sangat-panjang'
export RESTIC_BORG='rest:https://um7lty27:bo1oY8i83GV2pgKG@um7lty27.repo.borgbase.com'
export RESTIC_KOOFR='rclone:koofr:Vaultwarden'

# Masih running?
if pgrep -f $SERVICE >/dev/null; then
        echo "$SERVICE: masih berjalan"
        echo "Mematikan $SERVICE"
        service $SERVICE stop
        echo "Service $SERVICE sudah berhenti."
else
        echo "$SERVICE: sudah berhenti"
fi


sleep 5
echo "Restic: memulai backup data..."
echo "Restic: backup data ke Koofr"
restic backup $DATA -r $RESTIC_KOOFR
sleep 3
echo "Restic: backup data ke Borg"
restic backup $DATA -r $RESTIC_BORG
sleep 3
echo "Restic: backup data selesai."
sleep 5

# Prune : hapus snapshot lama biar storage ga penuh
echo "Restic: cleaning snapshot lama"
restic forget --keep-last 7 --prune -r $RESTIC_KOOFR
sleep 3
restic forget --keep-last 7 --prune -r $RESTIC_BORG
echo "Restic: cleaning snapshot lama selesai."
sleep 5

#start service
echo "$SERVICE: memulai service..."
service $SERVICE start
echo "$SERVICE: service sudah berjalan."
```

Simpan sebagai misalnya `restic_warden.sh` di `/usr/local/bin/restic_warden.sh` dan kemudian beri atribut agar bisa dijalankan dengan

```shell-session
$ doas chmod +x /usr/local/bin/restic_warden.sh
```

Untuk automatisasi bisa memanfaatkan cronjob, rencananya ane akan backup setiap hari pada pukul 02.00 WIB dan setiap kegiatan akan di-log di `/var/log/restic_warden.log`.

```shell-session
$ doas crontab -e
0 2 * * * /usr/local/bin/restic_warden.sh > /var/log/restic_warden.log 2>&1
```

---

Demikian cara untuk melakukan backup data dengan mempergunakan tools restic dan rclone di FreeBSD, caranya mudah dan efektif. Restic sudah memiliki fitur untuk melakukan enkripsi data sehingga terjamin keamanannya dan tidak perlu memakai aplikasi pihak ketiga seperti [age](https://github.com/FiloSottile/age).

Meski akan sangat kuat jika disandingkan dengan age, namun hal ini akan menghilangkan kemampuan restic untuk deduplikasi data. Sedangkan rclone ini adalah tool yang sangat powerfull untuk akses data dan bahkan bisa menjadi server webdav sendiri secara built-in. Dia semacam swiss army knife untuk akses data kemana saja. Menggabungkan restic dan rclone menjadi salah satu solusi prima untuk operasi backup data di FreeBSD.

---

[^1]: Namun boleh gunakan Freshports jika ingin menginstall rilis terbaru karena biasanya Freshports lebih cepat dalam update.

[^2]: Jika restic dijalankan dengan shell script, hal ini bisa dilewati dan lebih baik mengatur agar URL restic dipanggil saat shell script dijalankan

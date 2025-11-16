---
title: Meng-upload ebook ke Kindle dengan Ko Reader SSH Server
ringkasan: "cara mudah untuk mengunggah koleksi ebook ke Kindle"
date: 2025-11-16
tags:
  - kusaeni
  - tutorial
  - Kindle
kategori: jurnal
code: true
favorit: false
comment: true
keywords: ko reader, ssh, kindle, jailbreak
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KA6FYHCK2BQCK04WH1T6XD0N
  real: https://sok.egois.org/@poes/statuses/01KA6FYHCK2BQCK04WH1T6XD0N
---

Memakai kindle yg sudah di[jailbreak](https://kusaeni.com/jurnal/jailbreak-kindle/) dan install Ko Reader, salah satu halangan yang ane rasakan adalah saat mengunggah file ebook. Normalnya ane pakai kabel data untuk transfer file namun untuk bisa melakukan ini harus mematikan Ko Reader dan balik ke OS Kindle.

Sebenarnya Ko Reader sudah menyediakan fitur untuk kirim file tanpa harus kembali ke Kindle OS. Cara yang paling mudah bagi ane saat ini adalah dengan fungsi SSH. Berikut cara ane untuk terkoneksi antara komputer (Mac) dan Ko Reader (Kindle) dengan akses SSH alias _Secure Shell_.

Tentu saja untuk bisa terhubung maka antara Kindle dan komputer harus dalam jaringan yang sama, untuk ini ane pakai _tethering_ dari ponsel. Setelah terhubung maka pembagian IP-nya sebagai berikut:

| Nama Perangkat | IP          | Role    |
| -------------- | ----------- | ------- |
| Ponsel         | 172.20.10.1 | Gateway |
| Kindle         | 172.20.10.4 | Client  |
| Komputer (Mac) | 172.20.10.2 | Client  |

Sebelum itu tentu harus mengatur agar Kindle (mode Ko Reader) terhubung ke WiFi Ponsel. Usap ke bawah pada bagian atas layar Kindle kemudian pilih icon _Gear_ dan kemudian pilih _Network_ dan beri centang pada _Wi-Fi Connection_ kemudian pilih dan masukkan _password_ pada SSID WiFi Ponsel. Setelah tersambung akan muncul informasi terkait jaringan.

Kemudian di menu yang sama pilih _SSH Server_ akan muncul menu baru dan tekan beri centang pada `Login without password (DANGEROUS)`. Sementara tidak pakai _password_ dulu karena ane pelupa. Setelah itu baru kasih centang pada _SSH Server_ dan catat _port_-nya (dalam hal ini punya ane di _port_ `2222`.

![Ko Reader: pengaturan SSH Server](https://ik.imagekit.io/hjse9uhdjqd/jurnal/kindle/Reader_The%20Name%20of%20the%20Rose%20--%20Eco,%20Umberto%20--%202010%20--%20Harcourt%20Trade%20Publishers%20--%20c9a92ab81d76e2cab9f8c5e8053a07ff%20--%20Anna_s%20Archive.epub_p92_2025-11-16_104435_8WAlLNfcy.png)

Maka _server SSH_ sudah tersedia dan bisa diakses melalui IP dan _port_ yang sudah ditentukan, bisa pakai CLI/Terminal atau dengan _File Manager_. Ane pilih yang kedua dan pakai Nimble Commander karena punya 2 panel terpisah dalam 1 jendela aplikasi. Di Nimble SSH bisa diakses dengan SFTP atau _Secure File Transfer Protocol_. Konfigurasi melibatkan alamat IP tujuan, _username_, _password_ dan _port_.

Nimble tidak mengijinkan pengaturan SFTP tanpa _password_ tapi di pengaturan Ko Reader sudah diatur tanpa _password_, maka apapun _password_ yang ane masukkan akan diabaikan oleh Ko Reader.

![Nimble Commander: setup SFTP ke Ko Reader](https://ik.imagekit.io/hjse9uhdjqd/jurnal/kindle/SCR-20251116-rwzy_nxtACN6tM.png)

Setelah terhubung, _default_-nya akan terbuka `/var/tmp` _directory_. Tujulah _directory_ `//172.20.10.4/mnt/us/`. Dalam pengaturan Ko Reader ane simpan semua buku di _folder_ `Buku`. Sehingga ane tinggal _copy - paste_ ke dalam _folder_ ini. Semua dilakukan melalui Nimble Commander.

![Nimble: Copy paste ebook ke dalam folder Buku di Ko Reader/Kindle](https://ik.imagekit.io/hjse9uhdjqd/jurnal/kindle/SCR-20251116-rwmm_K5XwcW7DQ.png?updatedAt=1763300984284)

Cara yang lainnya adalah dengan mempergunakan _authorized_keys_ yaitu dengan cara mengirim SSH Key ke Kindle dan kemudian bisa login lewat SSH tanpa _password_. Metode ini membuat koneksi menjadi sangat aman, namun ane cukup dengan model SSH (pakai SFTP) seperti sebelumnya.

Setelah selesai jangan lupa untuk mematikan _SSH Server_ dan _disconnect_ dari WiFi (untuk mengindari Kindle mendownload _firmware_ yang bisa membuat _jailbreak_ gagal berfungsi.)

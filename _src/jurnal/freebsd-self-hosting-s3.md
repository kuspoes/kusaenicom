---
title: Self hosting S3 di FreeBSD dengan Garage
ringkasan: "Memasang garage sebagai peladen S3 di FreeBSD"
date: 2025-11-14
tags:
  - kusaeni
  - tutorial
  - freeBSD
kategori: jurnal
code: true
favorit: false
comment: true
keywords: freebsd, bsd, garage, s3, self-hosting, garage webui, vps
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01K9ZPY9R52AWCZ87X1Z3K3RDD
  real: https://sok.egois.org/@poes/statuses/01K9ZPY9R52AWCZ87X1Z3K3RDD
---

![garage s3](https://ik.imagekit.io/hjse9uhdjqd/jurnal/garage/garage-s3_VFc-JOmAa.jpg)

<p class="ncaption"><i>gambar dibuat dengan Grok</i></p>

Bulan Oktober kemarin ane akhirnya migrasi dari Racknerd ke GreenCloudVPS dengan menyewa VPS Storage Plan seharga USD 25 per tahun dengan spesifikasi

- 1 vCPU AMD EPYC Rome,
- 2 GB RAM,
- 20 GB NVME (untuk OS) dan
- 500 GB HDD.

Namanya VPS Storage maka tentu saja VPS ini dioptimalisasi untuk keperluan penyimpanan data bukan untuk komputasi, namun ane hendak mencoba memakainya untuk menjalankan beberapa _service_ ringan seperti Gotosocial, Ente Photos, Snac, Caddy, Garage S3, Vaultwarden dengan OS tentu saja FreeBSD 14.3-RELEASE.

Rencananya adalah membuat storage NVME 20GB sebagai host OS dan nantinya semua _service_ akan dimasukkan ke dalam _jail_ masing - masing biar mudah _maintenance_ dan lebih terorganisir, tentunya dengan _service_ sebanyak itu minimal akan dibuat _jail_ sekitar 5 - 6 unit. Hal ini akan membuat spasi _storage_ di NVME akan penuh dan tidak memenuhi syarat yang layak untuk menjalankan OS, misal dalam 1 _jail_ berukuran sekitar 1,5 GB (masih polos) saja akan membutuhkan setidaknya 8GB _storage_ belum lagi nanti kalo sudah ada isinya bisa membengkak sekitar 2 - 3 kali lipat atau minimal membutuhkan _storage_ sebesar 22-25 GB. Untuk itu nantinya ane akan menaruh _folder jail_ di _storage_ kedua yang berkapasitas jauh lebih besar yaitu 500GB.

Long story short, ane sudah membuat beberapa _jail_ tersebut dan sekarang saatnya untuk memasang Garage yang nantinya akan menjadi peladen untuk S3 _storage_ yang akan dipergunakan sebagai penyimpanan untuk Gotosocial dan Ente Photos. Meskipun banyak pilihan aplikasi _open source_ untuk _storage server_ S3 ini namun ane pilih Garage karena paling ringan pemakaian RAM, mudah pemasangannya, dan mendukung AWS. Jadi ane akan memasang Garage dan Garage WebUI (untuk admin UInya).

Ane sudah persiapkan _jail_ dengan nama `PondokBambu` dan IP `10.0.0.2/24`, akses internet di dalam _jail_ sudah berjalan baik dan ane juga sudah atur agar _jail_ bisa pakai/akses ke _raw_sockets_ dan sudah `bootstrap pkg`.

## Install Garage

Setelah masuk ke dalam `PondokBambu` kemudian _update_ paket dari repositori. Untuk memasang Garage sangat mudah karena sudah ada _binary_ tersedia di repositori FreeBSD, masalahnya adalah di repositori masih pakai versi yang lama yaitu 1.20_2. Dengan versi ini nantinya akan bermasalah jika hendak memakai Garage WebUI karena tidak kompatibel. Ketika cek ke [Freshport](https://www.freshports.org/www/garage/) ternyata sudah tersedia versi terkini yaitu 2.1.0_1 per tanggal 11 Nopember kemarin.

```sh
# bastille console PondokBambu
[PondokBambu]
root@PondokBambu:~ # pkg bootstrap -y && pkg update
...
...
root@PondokBambu:~ # pkg search garage
garage-1.2.0                   Open-source distributed storage service
```

Oleh karena itu ane akan pakai versi terbaru ini saja, tidak perlu _build_ dari Ports melainkan dicoba untuk berpindah repo dari Quaterly ke Latest.

```sh
root@PondokBambu:~ # mkdir -p /usr/local/etc/pkg/repos
root@PondokBambu:~ # echo "FreeBSD { url = \"pkg+http://pkg.freebsd.org/\${ABI}/latest\"; }" > /usr/local/etc/pkg/repos/FreeBSD.conf
root@PondokBambu:~ # pkg update -f
root@PondokBambu:~ # pkg search garage
garage-2.1.0                   Open-source distributed storage service
root@PondokBambu:~ # pkg install -y garage
```

Setelah terpasang dengan baik, buat _file_ `garage.toml` yang berisi konfigurasi Garage dan ditaruh di _folder_ `/usr/local/etc/`, isinya kira - kira sebagai berikut:

```toml
metadata_dir = "/tmp/meta"
data_dir = "/tmp/data"
db_engine = "sqlite"

replication_factor = 1

rpc_bind_addr = "0.0.0.0:3901"
rpc_public_addr = "127.0.0.1:3901"
rpc_secret = "25f8994b12625d9cf2d985fe9de126758a59db15de673c4470696156e3261d3f"

[s3_api]
s3_region = "garage"
api_bind_addr = "0.0.0.0:3900"


[s3_web]
bind_addr = "0.0.0.0:3902"
root_domain = ".web.garage.localhost"
index = "index.html"

[k2v_api]
api_bind_addr = "0.0.0.0:3904"

[admin]
api_bind_addr = "0.0.0.0:3903"
admin_token = "yijEPXXjouuDFgrHopNXG89ZL6h8ztdqOw2AjUKne44="
metrics_token = "yijEPXXjouuDFgrHopNXG89ZL6h8ztdqOw2AjUKne44="
```

Karena ane cuma aktifkan IPv4 maka ane sesuaikan IP di `bind_addr` dengan IP `localhost`. Untuk `rpc_secret` adalah kode acak yang dibuat dengan perintah `openssl rand -hex 32` sedangkan `admin_token` dan `metrics_token` dengan `openssl rand -base64 32`, sehingga perlu memasang paket `openssl` namun jika tidak maka bisa pakai layanan online [OpenSSL toolkit](https://www.cryptool.org/en/cto/openssl/) untuk mendapatkan token.

Konfigurasi sudah siap, maka tinggal menjalankan layanan `garage` saja.

```sh
root@PondokBambu:~ # sysrc garage_enable=YES
garage_enable -> YES
root@PondokBambu:~ # service garage start
Starting garage.
root@PondokBambu:~ # service garage status
ID        Hostname  Address         Tags  Zone  Capacity  DataAvail
0cb2c960c garage    127.0.0.1:3901  []    dc1   100.0 GB  125 GB (88.6%)
```

Untuk mencoba apakah `garage` sudah berjalan dengan baik ada 2 opsi yaitu dengan CLI ataupun dengan [Garage WebUI](https://github.com/khairul169/garage-webui). Jika memilih yang kedua maka silakan skip dan lompat ke Memasang Garage WebUI

### Mempersiapkan Cluster

Garage membutuhkan disk untuk menyimpan data (tentu saja ya kan), maka perlu menyiapkan disk/partisi untuk menjadi _node cluster_. Ane sudah menyiapkan spasi yang nantinya akan dipakai sebagai _cluster_. Anggap saja partisi _jail_ tersebut memiliki spasi bebas sebesar 100GB dan akan dipergunakan sebagai _cluster_ dengan alokasi sebesar 50GB[^1].

```sh
root@PondokBambu:~ # garage layout assign -z dc1 -c 50G 0cb2c960c
root@PondokBambu:~ # garage layout apply --version 1
```

`0cb2c960c` adalah `node_id` yang bisa di dapat di _field_ `ID` ketika menjalankan perintah `service garage status`.

### Membuat Bucket

Setelah _cluster_ tersedia maka ane bisa membuat _bucket_ untuk menampung _files_. Diasumsikan ane mau bikin _bucket_ dengan nama `ente-bucket` untuk menampung _files_ dari Ente Photos nantinya. _Bucket_ ini nantinya akan bisa diakses dengan kunci bernama `ente-bucket-key`.

```sh
root@PondokBambu:~ # garage bucket create ente-bucket
==== BUCKET INFORMATION ====
Bucket:          cfc5f8763f3a01a1277b0d5ed73661d75ea7d9ad7987558f1a3b4e4c39d80699
Created:         2025-11-13 10:27:41.892 +07:00

Size:            0 B (0 B)
Objects:         0

Website access:  false

Global alias:    ente-bucket

==== KEYS FOR THIS BUCKET ====
Permissions  Access key    Local aliases

root@PondokBambu:~ # garage bucket list
ID                Created     Global aliases  Local aliases
cfc5f8763f3a01a1  2025-11-13  ente-bucket
```

Untuk bisa akses maka dibutuhkan kunci, ane akan membuat kunci untuk membuka _bucket_ ini.

```sh
root@PondokBambu:~ # garage key create ente-bucket-key
==== ACCESS KEY INFORMATION ====
Key ID:              GKeb9de68995f550e000133ac2
Key name:            ente-bucket-key
Secret key:          a120b7effaedc7865e4ec59598fda63eb49d4b24ea5f6270e493074848d35f1f
Created:             2025-11-13 10:33:23.128 +07:00
Validity:            valid
Expiration:          never

Can create buckets:  false

==== BUCKETS FOR THIS KEY ====
Permissions  ID  Global aliases  Local aliases
root@PondokBambu:~ # garage key list
ID                          Created     Name                 Expiration
GKeb9de68995f550e000133ac2  2025-11-13  ente-bucket-key      never
```

Sekarang ane punya _bucket_ dan kuncinya tapi belum bisa akses karena belum permisi, jadi ane mau sambungin dulu _bucket_ dan kuncinya.

```sh
root@PondokBambu:~ # garage bucket allow \
  --read \
  --write \
  --owner \
  ente-bucket \
  --key ente-bucket-key
```

Alhamdulillah sampai disini pengaturan Garage sudah selesai semua, sekarang tinggal coba untuk unggah _files_ ke _bucket_ `ente-bucket`. Untuk ini ane akan pakai `awscli`[^2] sebuah _tools_ untuk operasi S3 dari Amazon AWS kemudian membuat _file_ `~/.awsrc` sebagai lokasi untuk menaruh `env`.

```sh
root@PondokBambu:~ # python3 -m pip install awscli
root@PondokBambu:~ # aws --version
aws-cli/1.42.29 Python/3.11.13 FreeBSD/14.3-RELEASE botocore/1.40.25
root@PondokBambu:~ # vi ~/.awsrc
export AWS_ACCESS_KEY_ID=GKeb9de68995f550e000133ac2
export AWS_SECRET_ACCESS_KEY=a120b7effaedc7865e4ec59598fda63eb49d4b24ea5f6270e493074848d35f1f
export AWS_DEFAULT_REGION='us-east-1'
export AWS_ENDPOINT_URL='http://localhost:3900'
```

kemudian load dulu dengan perintah `# . .awsrc` untuk membaca _environtment_. Contoh perintah yang bisa dicoba untuk memastikan akses sudah bisa berjalan lancar adalah

```sh
root@PondokBambu:~ # aws s3 ls s3://ente-bucket
```

Perintah yang lain bisa dibaca di [dokumentasi resmi](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/s3/index.html) awscli.

### Garage WebUI

[Garage WebUI](https://github.com/khairul169/garage-webui) adalah sebuah aplikasi web <abbr title="Single Page Application">SPA</abbr> yang dibuat untuk menjadi _frontend_ dari Garage S3, dibangun dengan Go dan Vite (React). Sayangnya versi binari untuk FreeBSD tidak tersedia sehingga perlu melakukan `build` sendiri. _Lets go!_

Langkah pertama adalah melakukan `clone` dari repositori Garage WebUI dari Github ke lokal dan kemudian melakukan `build`. Urutan `build`nya adalah:

1. Build _frontend_ dalam hal ini Vite,
2. Build _backend_ dengan Go.

```sh
root@PondokBambu:~ # pkg install -y node24 git go125
root@PondokBambu:~ # npm install -g pnpm
root@PondokBambu:~ # git clone https://github.com/khairul169/garage-webui.git
...
root@PondokBambu:~ # cd garage-webui
root@PondokBambu:garage-webui # vi package.json
```

Untuk membangun _frontend_ ini ada hal yang perlu diperhatikan yaitu mengatur modul `rollup` yang bermasalah di FreeBSD. Di _file_ `package.json` rubah atau tambahkan baris - baris berikut

```json
"pnpm": {
	"ovverides": {
		"rollup": "^4.24.0"
	}
}
```

ini akan menimpa modul `rollup` agar tidak di*skip* saat `pnpm install` nantinya. Setelah `pnpm` mengunduh modul yang dibutukan kemudian `build` dan hasilnya adalah _files_ `html` dan `js` berada di folder `dist\`

```sh
root@PondokBambu:garage-webui # pnpm install
...
root@PondokBambu:garage-webui # pnpm run build
...
root@PondokBambu:garage-webui # ls dist/
...
index.html
...
```

karena aplikasi ini bertipe SPA maka _frontend_ akan di-_embed_ ke dalam aplikasi itu sendiri, jadi salin folder `dist` ke dalam folder `backend`. Kemudian `build` _backend_ dengan Go.

```sh
root@PondokBambu:backend # go mod tidy
root@PondokBambu:backend # go build -tags prod -ldflags="-s -w" -o garage-webui
root@PondokBambu:backend # ls | grep garage-webui
-rwxr-xr-x 1 user group 13M Nov 14 10:00 garage-webui
```

Proses `go mod tidy` akan mengunduh semua _library_ yang dibutuhkan, sedangkan `build` _tags_ `prod` untuk membuat garage webui mengira ini untuk _productioons_[^3]. Setelah selesai semua proses `build` akan muncul file dengan nama `garage-webui`, file ini adalah binari yang bisa dipakai untuk menjalankan garage webui.

```sh
root@PondokBambu:backend # cp garage-webui /home/poes/.local/bin
root@PondokBambu:bin # chmod +x garage-webui
root@PondokBambu:bin # ./garage-webui -c /usr/local/etc/garage.toml
```

Perintah `./garage-webui -c /usr/local/etc/garage.toml` akan menjalankan garage webui di `Port 3909` dan memakai konfigurasi `garage.toml`, tapi ini belum 100% berjalan baik karena belum ada token yang dipakai. Oleh karena itu ane bikin _environtment_ untuk menyimpan token dan opsi lainnya. Karena ane malas pakai `.env` _files_ dan sering bermasalah, maka keterangan/info itu ane _inject_ saja ke `.shrc` karena _file_ ini pasti akan selalu di*load* pertama kali `shell` berjalan. Sisipkan `env` di dalam _file_ `.shrc`

```shell-sessio
root@PondokBambu:bin # vim ~/.shrc
...
export CONFIG_PATH='/usr/local/etc/garage.toml'
export API_BASE_URL='http://127.0.0.1:3903'
export S3_ENDPOINT_URL='http://127.0.0.1:3900'
export API_ADMIN_KEY='yijEPXXjouuDFgrHopNXG89ZL6h8ztdqOw2AjUKne44='
export AUTH_USER_PASS='admin:$apr1$gJB3Mbhd$Xb9e9E283S7BQ.YcVPygZ0'
export PORT=3909
...
```

untuk isi dari `API_ADMIN_KEY` merujuk ke isi `admin_token` di _file_ `garage.toml` dan harus sama karena kalo tak sama tidak akan bisa tersambung. Kemudian untuk isian `AUTH_USER_PASS` adalah kode enkripsi yang dibuat dengan `apache/htpasswd`. Untuk memakai `htpasswd` bisa dengan memasang paket `apache24` atau pakai _online generator_ seperti [htpasswd.org](https://htpasswd.org/). Format di atas adalah `username:passwordterenkripsi`, maka di situs htpasswd.org masukkan _user_ dan _password_ kemudian salin isi di Apache MD5. _User_ dan _password_ ini nantinya yang akan dipakai untuk _login_ ke dalam garage webui.

Maka _load_ ulang _file_ `.shrc` dan jalankan `garage-webui` lagi.

```sh
root@PondokBambu:bin # . ~/.shrc
root@PondokBambu:bin # ./garage-webui &
```

periksa apakah sudah berjalan baik di alamat URL `http://127.0.0.1:3909`, jika sudah maka tinggal rubah `Caddyfile` untuk _serving_ sebagai `reverse_proxy` tentu siapkan domain/subdomain agar bisa diakses darimana saja.

![garage webui dashboar ](https://ik.imagekit.io/hjse9uhdjqd/jurnal/garage/SCR-20251114-foxc_MjjB__d7P.png?updatedAt=1763073670991)
![garage webui cluster](https://ik.imagekit.io/hjse9uhdjqd/jurnal/garage/SCR-20251114-fpah_pVgcRgthP.png?updatedAt=1763073671406)
![garage webui bucket list](https://ik.imagekit.io/hjse9uhdjqd/jurnal/garage/SCR-20251114-fpeb_tOonJsPhz.png?updatedAt=1763073671393)

## Penutup

Ane cukup puas dengan performa GreenCloudVPS dan Garage sebagai peladen S3, yang paling seru adalah proses `build` di FreeBSD yang menurut ane bisa menambah pengalaman dan ilmu karena rata - rata aplikasi _self host_ lebih memilih untuk menyediakan `dockerfile` untuk mempermudah pemasangan dengan Docker.

Namun kalo tidak ingin bersusah payah, kalian bisa pakai Docker atau jika pakai FreeBSD bisa menyalin hasil `build` yang sudah ane buat (khusus untuk Garage WebUI) [disini](https://egois.org/files/freebsd/garage).

```shell-session
 $ curl -o garage-webui https://egois.org/files/freebsd/garage-webui
 $ chmod +x garage-webui
 $ ./garage-webui
```

---

[^1]: Sangat disarankan untuk memakai partisi terpisah dari Jail, karena _storage jail_ akan berkurang dengan berjalannya waktu karena terisi _files packages, log_, maupun _cache_. Tapi untuk contoh di atas ane asumsikan _cluster_ berada di dalam _jail_.

[^2]: Perlu `awscli` versi minimal 1.29 agar tidak perlu memasukkan _flags_ `AWS_ENDPOINT_URL` setiap kali menjalakan aws.

[^3]: Ane selalu gagal build kalo ga pakai `-tags prod`, gagal disini maksudnya _frontend_ tidak bisa di*embed* ke dalam binari SPA.

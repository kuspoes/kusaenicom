---
layout: content/post.njk
title: '11ty: Reader Bar'
ringkasan: 'Menambahkan Reader Bar sebagai indikator halaman dan bagaimana cara memodif-ikasinya'
date: 2021-04-23
update: false
tags:
    - jurnal
kategori: jurnal
code: true
favorit: false
comments: true
---

Reader Bar awalnya dibuat untuk [jQuery](https://jquery.com) yang dipergunakan untuk meng-visualisasikan panjang dan posisi *scroll* halaman melalui garis memanjang horisontal (biasanya ada di pinggir bagian atas halaman) dan sebuah tombol fungsi untuk kembali ke awal halaman.

Di [Eleventy](https://11ty.dev) sendiri sudah ada sebuah *plugin* untuk membantu menampilkan Reader Bar dengan mudah yaitu dengan memasang [Eleventy Reader Bar Plugin](https://github.com/thigoap/eleventy-plugin-reader-bar). Cara pemasangannya sangat mudah, yaitu 

1. *Install package* melalui NPM
```bash
$ npm install eleventy-plugin-reader-bar
```
2. Mengatur *configuration* di *eleventy.js*
```javascript
const ReaderBar = require('eleventy-plugin-reader-bar')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(ReaderBar)
}
```
3. Kemudian di dalam *template/layout* sisipkan blok HTML `div.reader-bar-start`, saya menyisipkan kode ini langsung dibawah baris HTML `<body>` dan menutupnya dibagian bawah sebelum `</body>`. Tujuannya adalah agar blok `reader-bar-start` bisa meng*wrapping* keseluruhan *layout*nya.

 <p class="sidenote">Jika keseluruhan <em>layout</em> tidak masuk ke dalam blok <code>div</code> tersebut, maka tampilan Reader Bar tidak akan akurat. Bisa saja terjadi baru <em>scroll</em> sedikit namun indicator sudah menunjukkan 100%.</p>

4. Terakhir sisipkan kode Nunjucks `{% ReaderBar %}` dibawah *tags* `{% content | safe %}`.

```javascript
{{ content | safe }}
{% ReaderBar "2px", "", "#e63946" %}
```

Kode diatas akan menampilkan Reader Bar dengan tebal `2px` dan warna `merah` seperti di artikel ini. Dokumentasi lebih lengkap bisa dibaca [disini](https://github.com/thigoap/eleventy-plugin-reader-bar).

### Modifikasi

Sayangnya saya tidak suka dengan tampilan *plugin* ini, yaitu dengan adanya *gap* antara tepian atas dan Reader Bar-nya. Setelah dicermati kodenya, ternyata pembuat *plugin* menerapkan aturan di CSS jarak Reader Bar dan pinggiran atas adalah `2px` secara otomatis. Sehingga dari sini muncul *gap* tersebut.

Saya tidak ingin ada *gap* jadi harus memodifikasi nilai di CSSnya. Saya tidak menerapkan CSS baru untuk menimpa aturan *default*nya, namun memilih untuk merubahnya langsung dari kode sumber. Sedikit lebih rumit tapi hasilnya memuaskan.

1. `Clone` kode sumber lewat Git ke lokal, saya menyimpannya di folder `_tmp` di `root` jurnal ini. 
```bash
$ git clone https://github.com/thigoap/eleventy-plugin-reader-bar.git  _tmp
$ cd _tmp
```
Kemudian *edit* CSS yang dimaksud. Dalam hal ini adalah baris berikut :

```html
<!-- reader bar -->
  <div id="readerBarContainer" style="height:${height};width:100%;background-color:${bgColor};position:fixed;top:2px;left:0;z-index:100;transition:0.2s;">

    <div id="readerBar" style="height:${height};width:0;background-color:${fillColor};position:fixed;top:2px;left:0;z-index:200;transition:0.2s;"></div>
  </div>
```

Nilai `top:2px` saya rubah menjadi `0px` agar tidak muncul *gap*, merubah warna *background* untuk tombol *back to top* serta menyesuaikan agar ukurannya sedikit lebih besar.

2. Setelah selesai *edit* saatnya mem*packing* ulang dengan NPM untuk mendapatkan berkas `.tgz`.
```bash
$ npm pack
```

Proses ini akan menghasilkan sebuah *file* dengan akhiran `tgz`. Nama *file* dan versinya bisa disesuaikan dengan mengubahnya di `package.json` sebelum melakukan `pack`.

Saya memindahkan *file* `tgz` tersebut ke direktori `_tmp` di dalam direktori jurnal dan meng*install*nya.

3. *Edit file package.json* dan masukkan secara manual *dependecies*-nya.
```json
"dependencies": {
  "reader-bar": "file:./_tmp/eleventy-plugin-reader-bar-0.2.0.tgz"
}
```
 <p class="sidenote"><i>file package.json</i> yang dimaksud ini adalah yang berada di direktori jurnal, bukan di direktori letak <i>module</i> tadi diunduh.</p>

4. *Install* dengan menjalankan perintah `npm install`.

*Folder* `_tmp` ini harus diikutkan saat `push` ke repository (Github/Gitlab) karena saat di*build* dengan [Netlify](https://netlify.com) akan mencari *eleventy-plugin-reader-bar* di *path* lokal tersebut.

***

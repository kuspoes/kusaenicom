---
title: "11ty: Reader Bar"
ringkasan: "Menambahkan Reader Bar sebagai indikator halaman dan bagaimana cara memodif ikasinya"
date: 2021-04-23
update: false
tags:
  - node
  - 11ty
kategori: jurnal
code: true
favorit: false
comment: false
templateEngine: md, vto
tocx: false
---

 <div class="pentung">
  <p>Artikel ini sudah berusia lebih dari 2 tahun, besar kemungkinan tidak akan bisa dipakai di versi Eleventy terbaru.</p>
 </div>

Reader Bar awalnya dibuat untuk [jQuery](https://jquery.com) yang dipergunakan untuk meng-visualisasikan panjang dan posisi _scroll_ halaman melalui garis memanjang horisontal (biasanya ada di pinggir bagian atas halaman) dan sebuah tombol fungsi untuk kembali ke awal halaman.

Di [Eleventy](https://11ty.dev) sendiri sudah ada sebuah _plugin_ untuk membantu menampilkan Reader Bar dengan mudah yaitu dengan memasang [Eleventy Reader Bar Plugin](https://github.com/thigoap/eleventy-plugin-reader-bar). Cara pemasangannya sangat mudah, yaitu

1. _Install package_ melalui NPM

```bash
$ npm install eleventy-plugin-reader-bar
```

2. Mengatur _configuration_ di _eleventy.js_

```javascript
const ReaderBar = require("eleventy-plugin-reader-bar");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(ReaderBar);
};
```

3. Kemudian di dalam _template/layout_ sisipkan blok HTML `div.reader-bar-start`, saya menyisipkan kode ini langsung dibawah baris HTML `<body>` dan menutupnya dibagian bawah sebelum `</body>`. Tujuannya adalah agar blok `reader-bar-start` bisa meng*wrapping* keseluruhan *layout*nya.

 <p class="sidenote">Jika keseluruhan <em>layout</em> tidak masuk ke dalam blok <code>div</code> tersebut, maka tampilan Reader Bar tidak akan akurat. Bisa saja terjadi baru <em>scroll</em> sedikit namun indicator sudah menunjukkan 100%.</p>

4. Terakhir sisipkan kode Nunjucks `{% ReaderBar %}` dibawah _tags_ `{% content | safe %}`.

```html
{% content | safe %} {% ReaderBar "2px", "", "#e63946" %}
```

Kode diatas akan menampilkan Reader Bar dengan tebal `2px` dan warna `merah` seperti di artikel ini. Dokumentasi lebih lengkap bisa dibaca [disini](https://github.com/thigoap/eleventy-plugin-reader-bar).

### Modifikasi

Sayangnya saya tidak suka dengan tampilan _plugin_ ini, yaitu dengan adanya _gap_ antara tepian atas dan Reader Bar-nya. Setelah dicermati kodenya, ternyata pembuat _plugin_ menerapkan aturan di CSS jarak Reader Bar dan pinggiran atas adalah `2px` secara otomatis. Sehingga dari sini muncul _gap_ tersebut.

Saya tidak ingin ada _gap_ jadi harus memodifikasi nilai di CSSnya. Saya tidak menerapkan CSS baru untuk menimpa aturan *default*nya, namun memilih untuk merubahnya langsung dari kode sumber. Sedikit lebih rumit tapi hasilnya memuaskan.

1. `Clone` kode sumber lewat Git ke lokal, saya menyimpannya di folder `_tmp` di `root` jurnal ini.

```bash
$ git clone https://github.com/thigoap/eleventy-plugin-reader-bar.git  _tmp
$ cd _tmp
```

Kemudian _edit_ CSS yang dimaksud. Dalam hal ini adalah baris berikut :

```html
<!-- reader bar -->
<div
  id="readerBarContainer"
  style="height:${height};width:100%;background-color:${bgColor};position:fixed;top:2px;left:0;z-index:100;transition:0.2s;"
>
  <div
    id="readerBar"
    style="height:${height};width:0;background-color:${fillColor};position:fixed;top:2px;left:0;z-index:200;transition:0.2s;"
  ></div>
</div>
```

Nilai `top:2px` saya rubah menjadi `0px` agar tidak muncul _gap_, merubah warna _background_ untuk tombol _back to top_ serta menyesuaikan agar ukurannya sedikit lebih besar.

2. Setelah selesai _edit_ saatnya mem*packing* ulang dengan NPM untuk mendapatkan berkas `.tgz`.

```bash
$ npm pack
```

Proses ini akan menghasilkan sebuah _file_ dengan akhiran `tgz`. Nama _file_ dan versinya bisa disesuaikan dengan mengubahnya di `package.json` sebelum melakukan `pack`.

Saya memindahkan _file_ `tgz` tersebut ke direktori `_tmp` di dalam direktori jurnal dan meng*install*nya.

3. _Edit file package.json_ dan masukkan secara manual _dependecies_-nya.

```json
"dependencies": {
  "reader-bar": "file:./_tmp/eleventy-plugin-reader-bar-0.2.0.tgz"
}
```

 <p class="sidenote"><i>file package.json</i> yang dimaksud ini adalah yang berada di direktori jurnal, bukan di direktori letak <i>module</i> tadi diunduh.</p>

4. _Install_ dengan menjalankan perintah `npm install`.

_Folder_ `_tmp` ini harus diikutkan saat `push` ke repository (Github/Gitlab) karena saat di*build* dengan [Netlify](https://netlify.com) akan mencari _eleventy-plugin-reader-bar_ di _path_ lokal tersebut.

---

---
title: "11ty: Related Books"
ringkasan: "Shortcode untuk menampilkan related books dengan memanfaatkan JSON data"
date: 2021-05-02
favorit: true
update: true
tags:
  - 11ty
  - node
  - tutorial
  - fave
kategori: jurnal
code: true
keywords: "eleventy, 11ty, json, global data, tutorial, shortcode"
comment: true
tocx: true
---

 <div class="pentung">
  <p>Artikel ini sudah berusia lebih dari 2 tahun, besar kemungkinan tidak akan bisa dipakai di versi Eleventy maupun Lume terbaru.</p>
 </div>

Di halaman [bacaan](/baca) saya ingin menampilkan relasi buku terkait dengan _review_ buku yang saya tulis. Tampilan yang diinginkan adalah seperti [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started) dengan gambar dan deskripsi. Gambarnya nanti bisa diisi `coverImg` dari masing - masing artikel baca yang sudah saya tulis.

### Membuat basis data dalam JSON

Hal pertama yang dilakukan adalah membuat basis data dan menyimpannya dalam format JSON. Caranya adalah dengan membuat _file_ baru & memasuk-kan data `collection` dengan format menyesuaikan bentuk format _valid_ dari JSON.

{% raw %}

```html
---
permalink: /baca/data.json
---

[{% for post in collections.baca %} { "title": "{{ post.data.title }}", "date":
"{{ post.data.date }}", "url": "{{ post.url }}", "ringkasan": "{{
post.data.ringkasan }}", "penulis": "{{ post.data.penulis }}", "coverImg": "{{
post.data.coverImg }}", "resensi": "{{ post.data.resensi }}" }{{ '' if loop.last
else ',' }} {% endfor %}]
```

{% endraw %}

`title`, `date`, `url`, `ringkasan` dan seterusnya adalah _field_ yang sudah saya tulis di YAML/_frontmatter_ pada setiap artikel baca. Tampilan _frontmatter_ seperti ini :

```yaml
---
layout: isi/buku.njk
title: "Sewu Dino"
date: 2020-08-17
ringkasan: "Pertempuran antar keluarga dari Trah Pitu yang memakan banyak korban"
keywords: "Sewu Dino, Janur Ireng, Ranjat Kembang, Trah Pitu, Simpleman, Horor, Santet"
coverImg: "https://ik.imagekit.io/kusaeni/tr:n-cover/buku/sewuDino_lV8ZEwbP7.jpg"
penulis: "Simpleman"
genre:
  - Thriller
  - Mistery
  - Jawa
format: "Papperback - 230 halaman"
bahasa: "Bahasa Indonesia, Bahasa Jawa"
isbn: "978-602-220-348-3"
tahun: 2020
resensi: "Dia adalah Dela Atmojo, anak yang harus kamu rawat sampai waktunya tiba. Ia dikirimi kutukan santet sewu dino. Santet yang sudah merenggut nyawa hampir seluruh anggota keluarga Atmojo."
rating: 3
beli: https://shopee.co.id/bukune
dimana: Bukune
tags: baca
---
```

Saya mengambil beberapa _field_ yang penting dan hendak dipakai nantinya. Sedangkan hasilnya adalah sebagai berikut

```json
{
  "title": "Sewu Dino",
  "date": "Mon Aug 17 2020 07:00:00 GMT+0700 (Western Indonesia Time)",
  "url": "/baca/sewuDino/",
  "ringkasan": "Pertempuran antar keluarga dari Trah Pitu yang memakan banyak korban",
  "penulis": "Simpleman",
  "coverImg": "https://ik.imagekit.io/kusaeni/tr:n-cover/buku/sewuDino_lV8ZEwbP7.jpg",
  "resensi": "Dia adalah Dela Atmojo, anak yang harus kamu rawat sampai waktunya tiba. Ia dikirimi kutukan santet sewu dino. Santet yang sudah merenggut nyawa hampir seluruh anggota keluarga Atmojo."
}
```

Setelah _eleventy_ di `build` maka akan tersedia 1 _file_ baru dengan nama `data.json` dengan _path_ `/baca/data.json`. _File_ inilah yang nanti akan di-jadikan basis data untuk menentukan relasi artikel.

### 11ty Shortcodes

Setelah basis data tersedia, selanjutnya adalah membuat fungsi `javascript` untuk memanggil basis data tersebut. Disini saya memper-gunakan paket `node-fetch`. Namun sebelum itu perlu menentukan bentuk dari _shortcodes_ yang akan dipakai.

1. Bentuk *shortcode*nya.
   Saya ingin agar bentuk *tags*nya adalah sebagai berikut :

{% raw %}

```html
{% related "judul" %}
```

{% endraw %}

dimana `related` akan menjadi fungsi pemanggil _shortcodes_ dan `judul` men-jadi _string query_ untuk mencari _field_ di dalam JSON Array.

Sehingga di _file eleventy.js_ saya menambahkan _syntax_ berikut :

```js
eleventyConfig.addLiquidShortcode("related", async function (judul) {});
```

 <aside>
 Saya sebenarnya adalah pengguna <a href="https://mozilla.github.io/nunjucks/" alt="Nunjucks">Nunjucks</a>, namun karena <i>default render</i> <code>markdown</code> di <i>eleventy</i> mempergunakan <a href="https://shopify.github.io/liquid/" alt="Liquid template Tags">Liquid</a>. Maka <i>shortcodes</i> saya mempergunakan Liquid.<br />
 Namun bisa juga mempergunakan <b>global shortcodes</b> dengan kode <code>eleventyConfig.addShortcode</code> yang bisa jalan di semua <i>template tags</i>

 </aside>

2. Ambil basis data dan buat fungsi _query_

Seperti yang sudah saya sebutkan diatas, saya mempergunakan `node-fetch` untuk membantu mengambil basis data. Maka yang harus dilakukan pertama kali adalah memasang paket `node-fetch`:

```bash
$ yarn add node-fetch

# atau

$ npm install node-fetch
```

 <p class="sidenote">Pengguna <a href="https://github.com/axios/axios">axios</a> bisa mempergunakannya sebagai pengganti <code>fetch</code>. Silakan menyesuaikan kode dibawah dengan fungsi di <code>axios</code>.</p>

kemudian buat fungsi di dalam _shortcodes_ untuk mengambil basis data :

```js
try {
  const response = await fetch("https://kusaeni.com/baca/data.json", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
} catch (reason) {
  console.log(reason);
}
```

hasil dari `response` disimpan sebagai JSON.

<p class="sidenote">Opsi lain adalah mempergunakan <code>JSON.parse</code> dengan <code>fs</code></p>

```js
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("./baca/data.json"));
```

 <aside>Dengan <code>JSON.parse</code>, proses <code>build</code> tidak lagi membutuhkan akses internet karena akan data dibaca dari lokal. Dengan syarat <i>file</i> JSON yang dimaksud adalah <i>file existing</i> yang tidak dibuat pada saat proses <code>build</code>. </aside>

3. Kemudian buat fungsi _query_ untuk mengambil data berdasarkan _value_ `judul` dengan mempergunakan `findIndex`

```js
const relasi = function (buku, judul) {
  const index = buku.findIndex(function (novel, index) {
    return novel.title.toLowerCase() === judul.toLowerCase();
  });
  return buku[index];
};

const hasilData = await relasi(data, judul);
```

<p class="code_cap">Kita sebut ini sebagai kode pertama, silakan lihat di seksi <i>update</i> untuk kode kedua dan ketiga sebagai alternatif.</p>

Disini _string_ `judul` harus diamankan dengan membuat `judul` menjadi huruf kecil semua `toLowerCase()` untuk menghindari kesalahan tipo saat mengetik judul.

#### Update #1 { .merah }

Kode diatas terlihat komplek sekali, ada kode lebih sederhana namun ketika saya coba membuat waktu `build` [sedikit lebih lama](#build).

```js
const response = await fetch("https://kusaeni.com/baca/data.json");
const data = await response.json();
const hasilData = data.find(function (caridata) {
  return caridata.title.toLowerCase() === judul.toLowerCase();
});
```

 <aside>Sebutlah ini sebagai kode kedua.</aside>

Sampai disini jika _tags_ `{% related "judul" %}`dimasukkan ke dalam artikel, maka pada saat `build`/`serve`, _eleventy_ akan mengambil `data.json` dan meng*filter*nya berdasarkan _query_ judul yang dimasukkan. Hasilnya bisa diliat di log di konsol.

4. Untuk menampilkan data tersebut di posisi _tags_ disisipkan, maka perlu ditambahkan kode berikut :

```js
return `<div class="flex">
<img class="shadow-md" src="${hasilData.coverImg}"  >
<div class="flex-1">
  <a href="${hasilData.url}">${hasilData.title}</a>
  <dl>
    <dt>${hasilData.penulis} </d>
    <dd>${rese} ...</dd>
  </dl>
</div>
</div>`;
```

Karena `node-fetch` menghasilkan `promise` maka `return` perlu diakses dengan tambahan `.then()` _callback_, sehingga keseluruhan *shortcodes*nya menjadi seperti ini :

```js
eleventyConfig.addLiquidShortcode("related", async function (judul) {
  try {
    const response = await fetch("https://kusaeni.com/baca/data.json", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    const relasi = function (buku, judul) {
      const index = buku.findIndex(function (novel, index) {
        return novel.title.toLowerCase() === judul.toLowerCase();
      });
      return buku[index];
    };
    const hasilData = await relasi(data, judul);
    var rese = hasilData.resensi.substr(0, 200);
    return `<div class="flex">
    <img class="shadow-md" src="${hasilData.coverImg}">
    <div class="flex-1">
    <a href="${hasilData.url}">${hasilData.title}</a>
    <dl><dt>${hasilData.penulis} </dt>
      <dd>${rese} ...</dd></dl>
    </div></div>`;
  } catch (err) {
    console.log(err);
  }
  const print = async () => {
    const p = await hasilData;
    console.log(p);
  };
  print();
});
```

 <aside>Jika ingin mempergunakan kode kedua, silakan disesuaikan. Saya menambahkan fungsi <code>rese</code> untuk memotong karakter di <code>resensi</code> agar tidak lebih dari 200 karakter</aside>

#### Update #2 { .merah }

Saya menambahkan fungsi yang sama untuk menampilkan relasi artikel di _collection_ jurnal dengan sedikit perbedaan yaitu tanpa `coverImg` dan tanpa mempergunakan `fetch` JSON. Meskipun kode diatas bisa juga diaplikasikan di _collection_ apa saja, namun saya tidak memakainya dengan alasan [performa](#kesimpulan).

Di jurnal saya hanya ingin menampilkan relasi artikel dengan format `judul`, `url`, dan `desk` atau deskripsi. Saya memakai fungsi lain _shortcodes_ yaitu _paired shortcodes_. Seperti diatas, tulis kode berikut di _file .eleventy.js_

```js
eleventyConfig.addPairedShortcode("prelated", function (desk, judul, url) {
  return `<div class="relasi-artikel">
        <h4 class="header-relasi">Artikel terkait</h4>
        <a class="link" href="${url}" title="${judul}">${judul}</a>
        <p class="desk-relasi">${desk}</p>
    </div>`;
});
```

Sesuai namanya _paired_ maka _shortcodes_ ini akan membuat _template tags_ baru dengan _tags_ buka dan tutup.

{% raw %}

```html
{% prelated "11ty Reader Bar", "/jurnal/11tyReaderBar" %} 11ty Reader Bar :
sebuah plugin shortcodes untuk menampilkan readerbar di eleventy {% endprelated
%}
```

{% endraw %}

Dengan catatan :

- "11ty Reader Bar" akan diproses sebagai _variable_ `judul`,
- "/jurnal/11tyReaderBar" sebagai `url`,
- "11ty Reader Bar : sebuah plugin shortcodes untuk menampilkan readerbar di eleventy" sebagai `desk`

Hasil dari _paired shortcode_ diatas adalah sebagai berikut:

_Shortcode_ ini bisa juga dipergunakan untuk menggantikan _shortcodes_ dengan _parse_ JSON. Hanya saja setiap hendak menyisipkan _related books_ harus mengetikkan secara manual setiap data yang ingin ditampilkan.

### Kesimpulan dan catatan {#kesimpulan}

Alhamdulillah dengan fungsi _shortcodes_ ini saya bisa menampilkan relasi bacaan sesuai dengan keinginan, namun ada beberapa hal yang perlu diper-hatikan saat mempergunakan _shortcodes_ ini, diantaranya :

1. Untuk mengurangi kesalahan dalam _query_ data berdasarkan judul, maka judul perlu dibuat `lowerCase` semua. Namun hal ini tidak menjadi solusi <mark>jika penulisan judulnya salah karena salah ketik atau salah spasi</mark>,
2. Proses ini harus mengambil `data.json` dan melakukan `parse` serta _query_ satu per satu artikel yang memiliki _shortcodes_ `related` membuat waktu _build_ menjadi lebih lama, sekitar 19 - 30 ms dimana sebelumnya sekitar 9 - 17 ms. {#build}
   {% endraw %}

Saya melakukan **DEBUG** `build` _eleventy_ dengan hasil sebagai berikut:

- Untuk kode _query_ pertama membutuhkan waktu sekitar 8.02 detik untuk memproses 28 _files_,
- Dan butuh waktu 9,02 detik untuk kode yang kedua.

 <div class="postnotes">
 <p>Uji coba dilakukan dengan mengnonatifkan <i>plugin</i> Eleventy Lazy Images. Jika <i>plugin</i> ini diaktifkan akan membutuhkan waktu sekitar 1 - 2 detik lebih lama. Ini akan menjadi <a href="https://github.com/11ty/eleventy/issues/1346">masalah</a> saat mulai melakukan <code>build</code> dengan jumlah halaman yang banyak.</p>
 </div>

Saat di`build` di [Netlify](https://netlify.com) membutuhkan tambahan waktu untuk proses, rata - rata menjadi sekitar 20 - 30 detik (Netlify biasanya butuh 2,5 kali waktu _build time_) untuk selesai. Jika _build time_ ini konstan, maka jatah `build` di Netlify bisa menjadi sampai dengan 900 kali setiap bulannya.

3. Saya belum menemukannya, namun jika ada perintah untuk mem`build` _files_ tertentu saja atau _files_ ter*update* saja tentu akan memangkas waktu untuk `build` secara signifikan.
4. Jika waktu `build` begitu berharga, maka solusi yang paling mendekati adalah mempergunakan _paired shortcodes_ yang tidak perlu melakukan `fetch` dan proses _query_ data.

```js
eleventyConfig.addPairedShortcode(
  "relatedpair",
  function (resensi, coverImg, judul, url) {
    let coverUrl = "https://ik.imagekit.io/kusaeni/tr:n-cover/buku/";
    return `<div class="flex">
            <img class="shadow-md" src="${coverUrl}${coverImg}">
            <div class="flex-1"> <b><a href="${url}" title="${judul}">${judul}</a></b><dd>${resensi} ...</dd>
            </div>
        </div>`;
  },
);
```

 <aside>Sebutlah sebagai kode ketiga</aside>

Namun kelemahannya adalah harus memasukkan sendiri detil yang ingin ditampilkan di dalam _shortcode_ itu. Sedikit merepotkan tapi terbayar dengan gegasnya saat `build`.

5. Karena harus `fetch JSON` data untuk proses **build** membutuhkan akses internet, jika tidak ada akses internet maka proses `build` akan gagal. Namun saat proses di Netlify bukan menjadi masalah.

Dengan mempergunakan _paired shortcodes_ ini, waktu `build` **dipangkas hampir 300%** yang awalnya sekitar 9 - 10 detik menjadi 2 - 3 detik saja.

 <img src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/chart_9ZDZx1SgM.png" alt="Chart Perbandingan Build Time" />
 <aside>perbandingan waktu build, semakin kecil semakin baik.</aside>

### 🔥 Lume { #lume }

Untuk pengguna [Lume](https://lumeland.github.io) bisa juga mempergunakan fungsi kode diatas. Jika di 11ty dinamakan sebagai `shortcodes` maka di Lume disebut dengan `helper`.

_Edit file_ `/_config.js` dan tambahkan kode berikut :

```js
const site = lume();

site.helper(
  "related",
  async function (judul) {
    try {
      const response = await fetch("https://kusaeni.com/baca/data.json");
      const data = await response.json();
      const result = data.find(function (search) {
        return search.title.toLowerCase() === judul.toLowerCase();
      });
      return `<div class="some">
      <img src="${result.coverImg}"><b>${result.title}</b> ${result.penulis}
            </div>`;
    } catch (err) {
      console.log(err);
    }

    const printResult = async () => {
      const print = await result;
      console.log(print);
    };
    printResult();
  },
  { type: "tag", async: true },
);
```

#### Update

Saya sudah tidak pakai kode diatas untuk menampilkan relasi artikel, tapi mempergunakan metode _shortcode_ karena lebih mudah dan cepat saat _build_.

```js
site.helper(
  "relasi",
  function (desc, coverImg, title, penulis, url) {
    const coverUrl = "https://ik.imagekit.io/kusaeni/tr:n-cover/buku/";
    return `<div class="relasi m-auto">
            <img class="relaimg" src="${coverUrl}${coverImg}">
            <div class="relasi_meta">
            <div class="juduldkk">
            <h4><a class="hRelasi" href="${url}">${title}</a></h4>
            <p class="author">${penulis}</p>
            </div>
            <p>${desc}</p>
            </div>
        </div>`;
  },
  {
    body: !!"true",
    type: "tag",
  },
);
```

<aside>
  jika pakai LSP TSX maka <code>body: "true"</code> akan menyebabkan TSX lint <i>error boolean undefined</i>. Saya kasih <code>!!</code> sebelum boolean true, untuk menyakinkan TSX lint bahwa type tersebut sudah benar dan saya yakin bukan <i>undefined</i>
</aside>

Sedangkan _template tags_ yang dipergunakan sama yaitu `{% related "title" %}`. Untuk `shortcodes prelated` pun sama, ini dikarenakan Lume memang menjadikan 11ty sebagai [patokan atau inspirasi](https://lumeland.github.io/advanced/migrate-from-11ty/).

---

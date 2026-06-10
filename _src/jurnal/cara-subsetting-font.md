---
title: Cara Subsetting font
ringkasan: "Ternyata mudah sekali memilih karakter di font dan buang yang lain sehingga ukuran font jadi lebih ramping"
date: 2026-06-07
tags:
  - kusaeni
  - tutorial
kategori: jurnal
relasi: kusaeni
code: true
favorit: false
comment: true
draft: false
keywords: kusaeni, tutorial, web desain, font
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KTGDTTAVFAJZ1R2SGYYT7HG4
  real: https://sok.egois.org/@poes/statuses/01KTGDTTAVFAJZ1R2SGYYT7HG4
---

*Subsetting font* adalah memilih karakter tertentu di dalam *font table* yang ingin dipertahankan dengan cara menghilangkan atau menghapus karakter - karakter lainnya yang tidak diperlukan. Dalam dunia desain web dan bagi yang mementingkan tentang *page speed* maka *Subsetting font* ini akan membuat ukuran *font* menjadi lebih ramping dan cocok untuk dipakai sebagai *webfont*.

<img class="lebar fuck" src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/Subsetting/SCR-20260607-lrlw_9ss8l-BQF.png" alt="dev insight error pada identifikasi ukuran gambar" image-size>
<p class="ncaption">dev insight error pada identifikasi ukuran gambar</p>

Untuk keperluan menampilkan logo "kusaeni" yang ada di atas halaman ini, sebelumnya ane pakai gambar dengan format `webp` yang ringan, namun seringan apapun ukuran gambar akan jatuh lebih dari 10Kib dan harus memperhatikan [aspek rasio](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_sizing/Aspect_ratios) yang kadang kala membingungkan dan jika salah penanganan akan membuat halaman tidak lolos uji *Core Web Vitals Assessment* terutama di bagian *Best Practise - User Experience*. Oleh karena itu ane putuskan untuk mengatasi masalah ini dengan mengganti *file* gambar dengan *font*.
    
Font yang ane pakai adalah [Sofia](https://fonts.google.com/specimen/Sofia?preview.script=Latn) dari Google Fonts. Ukuran aslinya saat diunduh sekitar 28Kib, dengan setidaknya ada lebih dari 200 karakter. Ane hanya butuh 7 karakter saja yang terdiri dari huruf "<code>k</code> <code>u</code> <code>s</code> <code>a</code> <code>e</code> <code>n</code> <code>i</code>". Untuk itu ane akan melakukan *subsetting* atau *cherry picking* pada karakter - karakter itu.

<img class="display:inline; float:left" src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/Subsetting/SCR-20260607-matg_MwT0D-k09.png" image-size>
<p class="ncaption">Table karakter pada font Sofia (Latin), yang diberi warna biru adalah karakter yang akan dipertahankan.</p>

Untuk melakukan *subsetting* bisa memakai layanan online seperti dari [Font Squirel Web Font Generator](https://www.fontsquirrel.com/tools/webfont-generator) yang memiliki fitur *expert* atau (wild and free tools)[https://wildandfreetools.com/font-tools/font-subsetter/] yang lengkap namun ane akan pakai aplikasi kecil dari Python bernama [FontTools](https://pypi.org/project/fonttools/) yang memiliki fungsi untuk memanipulasi font sekaligus mengkonversinya ke *web font* atau `woff`.

<div class="sidebar_notes sebelah_kanan">
    <p>Ane lebih suka pakai tools dari wild and free tools, lebih mudah daripada font sqiurel. Tapi font squirel lebih lengkap.</p>
</div>


#### Memakai FontTools

Karena ini adalah *Python Library* maka `fonttools` tersedia di hampir semua OS, saat ini ane pakai MacOs maka ane bisa pasang `fonttools` dengan [Homebrew](https://brew.sh/).

```shell-session
$ brew install fonttools brotli
```
<aside>
    <code>brotli</code> dipakai jika ingin mengkonversi font ke format <code>woff2</code>.
</aside>

Setelah selesai dan terpasang dengan baik, maka ane mengunduh font Sofia dari Google Fonts, ane mendapatkan font dalam format `ttf`, lalu ane melakukan *subsetting* sesuai dengan karakter yang ane inginkan.

```shell-session
$ pyftsubset Sofia-Reguler.ttf --text="kusaeni" --output-file="Sofia-Kus-Regular.ttf"
```
<aside>
    <code>--text</code> dipakai untuk menentukan karakter apa saja yang dipilih.
</aside>

Belum sempat meneguk kopi, proses *subsetting* sudah selesai dengan sangat cepat. Ane mendapatkan file baru dengan nama **Sofia-Kus-Regular.ttf** dengan ukuran sekitar 1,9Kib saja. Namun file masih dalam format `ttf` dan ane perlu rubah/konversi ke `woff2` agar maksimal performanya saat dipakai sebagai *webfont*.

```shell-session
$ python3 -m fonttools ttLib.woff2 compress Sofia-Kus-Regular.ttf
```

atau bikin `woff2` barengan saat proses *subsetting* 

```shell-session
$ pyftsubset Sofia-Reguler.ttf --text="kusaeni" --flavor="woff2" --output-file="Sofia-Kus-Regular.woff2"
```
Kedua perintah di atas akan menghasilkan file baru bernama **Sofia-Kus-Regular.woff2**.

<img src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/Subsetting/SCR-20260608-oktm_1O8Vd_s1M.png" alt="SofiaKus" image-size>
<p class="ncaption">hasil dari <i>subsetting</i> hanya ada 7 karakter (<i>glyphs</i>) + 1 blank</p>
    
#### Pengaturan Webfont

Setelah mendapatkan file `woff2` sekarang tinggal pasang di blog. Ane taruh font `Sofia-Kus-Regular.woff2` di `/assets/fonts/Sofia/Sofia-Kus-Regular.woff2` dan kemudian panggil dengan CSS.

```CSS
@font-face {
    font-family: SofiaKus;
    font-style: normal;
    font-weight: normal;
    font-stretch: normal;
    src: url("/assets/fonts/Sofia/Sofia-Kus-Regular.woff2") format("woff2");
}
```

Setelah bisa di-*load* oleh `@font-face`, font SofiaKus akan tersedia dan bisa dipergunakan seperti ini

```css
div.logo .kusaeni {
    font: normal 1.5em SofiaKus, Georgia, serif;
}
```

Hore! sekarang logo ane sudah jadi tanpa gambar.

{{ comp.subs() }}

---
layout: content/post.njk
title: Draft artikel di Eleventy
ringkasan: '11ty tidak memiliki fungsi draft built in, namun dengan cara ini memungkinkan fungsi itu tersedia'
date: 2020-10-17
tags:
    - jurnal
kategori: jurnal
code: false
favorit: false
comments: true
---

Saya baru saja berpindah dari Hugo ke Eleventy, dan salah satu hal yang terasa hilang dari Hugo (dan Jekyll) adalah fitur `draft` artikel.

Sebenarnya karena Eleventy adalah salah satu <a href="https://jamstack.org/generators/">Static Site Generator</a>, penggunaan <code>draft</code> artikel tidak terlalu diperlukan. Karena saya bisa menulis di lokal dan mem<i>preview</i> artikel secara lokal pula sebelum diunggah via <code>GIT</code>.

Namun karena kecerobohan sudah mengalir dalam DNA saya, maka fitur <code>draft</code> artikel ini sangat diperlukan. Terlalu banyak hal yang ingin ditulis namun sedikit waktu dan pikiran untuk mengerjakannya.

 <p class="sidenote">Terburu - buru dan ceroboh saaat <code>GIT PUSH</code>, sehingga perlu revisi dan menyebabkan jatah <b>300 menit build time</b> dari Netlify habis akibat revisi minor.</p>

### Draft di Eleventy

Secara <em>defaultnya</em> fitur <code>draft</code> tidak tersedia di Eleventy, meski jika dibuat <em>plugin</em>nya bisa. Namun ternyata fitur <code>draft</code> tidak perlu sampai mem-pergunakan <em>plugin</em>.

<blockquote>
    <p><a href="https://twitter.com/eleven_ty?ref_src=twsrc%5Etfw">@eleven_ty</a> is nice.
        Really like how you can just add a glob like &quot;posts/*.draft.md&quot; to your .eleventyignore file and
        then just remove &quot;.draft&quot; from the filename when you&#39;re ready to publish. Simple!</p>&mdash;
    <a href="https://twitter.com/bultbrada/status/1317043860036571137?ref_src=twsrc%5Etfw">Mattias Wikström (@bultbrada)</a>
        October 16, 2020</a>
</blockquote>

Jadi menurut Wikström, fitur <code>draft</code> bisa dengan mempergunakan fitur dari <code>.eleventyignore</code>, dengan cara menambahkan baris <em>regular expression</em> ke dalam isian <code>.eleventyignore</code> untuk mengabaikan <em>files</em> apa saja oleh Eleventy saat <strong>build</strong> dilakukan.

```bash

jurnal/*.draft.html

```

Memasukkan teks di atas ke dalam <code>.eleventyignore</code>, kemudian buat artikel baru dengan format <code>nama-artikel.draft.html</code>. Eleventy akan mengabaikan artikel tersebut saat <strong>build</strong>, mudah dan sederhana.

Untuk memandaftarkan atau memposting artikel, cukup menghapus nama <code>draft</code> kemudian mem<strong>build</strong>ulang Eleventy.

***

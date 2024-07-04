---
title: "Lume: Gotosocial comment's "
ringkasan: "Cara menampilkan gotosocial _mentions_ sebagai _comments_"
date: 2024-07-04
tags:
  - lume
  - deno
  - tutorial
  - gotosocial
kategori: jurnal
code: true
favorit: false
comment: false
templateEngine: md
tocx: false
comments:
  src: "https://poestodon.deno.dev/@poes/statuses/01J1YB34JA8DXW98XXQ2KP8WJ2"
---

Di lume tidak perlu memasang _plugin_ untuk bisa memasang mastodon comment’s, cukup dengan web component[^1] saja.

Dokumentasi Lume tidak menyertakan tentang info cara memasangnya, jadi saya akan coba menulis tentang pengalaman memakai mastodon comment’s ini.
Karena memakai web component maka _script_ dibuat dengan Javascript yang bisa di*embed* di dalam HTML.

Tapi sebelum itu saya buat _folder_ khusus untuk menyimpan Javascript, *folder*nya dibuat di dalam _folder_ `_src` sehingga *path*nya kira - kira seperti ini

```txt
/_src
   /js
      - comments.js
      - comments.css
      - main.js
```

Kemudian di dalam _folder_ `js` bikin 1 file dengan nama `main.js` dan isinya adalah

```js
import Comments from "./comments.js";

customElements.define("mastodon-comments", Comments);
```

selanjutnya _script_ tersebut dipanggil saat halaman dibuka dengan cara menambahkan dalam _tag_ `header` di dalam _file_ HTML. Di Lume saya membuat _templates_ `header.vto` dan di dalamnya saya tambahkan

```html
<script src="/js/main.js" type="module"></script>
```

Karena _file_ `main.js` ini mengimport fungsi `Comments` dari _file_ `comments.js` yang saya belum punya, maka saya perlu mengunduh _file_ tersebut. Di Lume ada 2 cara,

1. Mempergunakan fungsi/fitur `site.remote()` [Remote files](https://lume.land/docs/core/remote-files/) untuk mengunduh _file_ saat build atau
2. Mengunduh dan menyimpannya secara manual[^2]

Saya pilih cara yang kedua, jadi saya unduh _file_ `comments.js` dari repositorinya di https://github.com/oom-components/mastodon-comments kemudian disimpan ke dalam _folder_ `js` yang sudah dibuat sebelumnya.

Kemudian di lokasi yang hendak ditampilkan mastodon comment’s (punya saya di dalam _template_ `layout/jurnal.vto` , tambahkan _template tags_ seperti ini

```html
{{ if it.comments?.src }}
<div class="comments-section">
  <header class="comments-header">
    <h2>{{ metadata.comments.title }}</h2>
    <p>{{ metadata.comments.description.replace(":src:", it.comments.src) }}</p>
  </header>
  <mastodon-comments
    src="{{ it.comments.src }}"
    cache="{{ it.comments.cache ?? 60 }}"
    class="comments"
  >
    {{ it.comments.empty }}
  </mastodon-comments>
</div>
{{ /if }}
```

di _frontmatter_ di _file_ artikel, tambahkan _variable_ `comments : src:` agar bisa menjadi _hook_ untuk _template tags_ di atas.

```markdown
---
comments:
	src: 'https://mastodon.social/@monsterpoes/112671781345375943'
---
```

_variable_ ini yang akan dibaca dan ditampilkan isi dari *reply*nya. Terakhir tinggal pasang _stylesheet_ bisa dengan bikin sendiri atau pakai yang sudah jadi seperti dari [mastodon-comments/src/styles.css at main · oom-components/mastodon-comments](https://github.com/oom-components/mastodon-comments/blob/main/src/styles.css).

Selesai gampang dan mudah kalo pakai akun Mastodon tapi untuk [Gotosocial](https://gotosocial.org) oh tunggu dulu, banyak hal yang harus dibenahi.

### Gotosocial

Gotosocial memiliki struktur URL yang berbeda dibandingkan dengan Mastodon[^2]. Strukturnya seperti ini

```txt
https://kauaku.us/@poes/statuses/01J1S8G6667MYN5R2XYVN5D2WG
```

ada _path_ `/statuses` setelah _handler username_. Ini membuat mastodon comment’s tidak bisa langsung mem*parse status ID* untuk melakukan _fetching_ data. Tapi di dalam _file_ `comments.js` sudah disisipkan _script_ yang bisa dipergunakan untuk _instance_ Pleroma yang juga memiliki struktur URL berbeda, sehingga bisa dimanfaatkan dengan sedikit modifikasi sebagai berikut

```js
// Gotosocial with /statuses/ in url
if (pathname.includes("/statuses/")) {
  [, id] = pathname.match(/^\/@poes\/statuses\/([^\/?#]+)/);
} else {
  [, id] = pathname.match(/\/(\d+)$/);
}
```

dengan ini mastodon comment’s bisa meng*parse* `status ID` untuk meng*fetch* data. Bagus!

Eh tapi,

ternyata tidak cukup sampai disini, Gotosocial tidak mengijinkan _fetch_ tanpa _authentification_, harus pakai `token` jadi _request_ dulu `token` dengan cara seperti tutorial [Authentication With API](https://docs.gotosocial.org/en/latest/api/authentication/).

Setelah mendapatkan `token`, maka fungsi `fetch` harus dirubah untuk mengikutkan `token`. Saya menghubungi _developer_ mastodon comments untuk Lume ini dan dia meng*update* kodenya agar bisa memakai `token`.

Dengan ini mastodon comments sudah bisa melakukan _fetch_ dan _display_ data sesuai dengan yang diinginkan. Keren! tapi cara seperti ini cocok untuk pemakaian lokal saja, setelah _push_ dan _live_ ==cara ini sangat beresiko keamanan karena `token` akan kelihatan di _browser_==. Ini adalah resiko jika mempergunakan web component karena berjalan disisi _client_ / _browser_.

### Proxy

Oleh karena itu dibutuhkan semacam proxy sebagai jembatan. Konsepnya kira - kira seperti ini

1. `token` disimpan sebagai `.env` di proxy yang bisa dipakai memanggil API dalam format `JSON`,
2. mastodon comment’s melakukan _fetching_ ke proxy. Dalam proses ini tidak mempergunakan `token`.

Jadi saya akhir bikin proxy sederhana di [Deno Deploy](https://dash.deno.com), *script*nya kira - kira seperti ini

```ts
Deno.serve({ port: 8000 }, async (request) => {
  const { pathname, search } = new URL(request.url);
  const url = new URL("." + pathname, "https://kauaku.us");
  url.search = search;

  const headers = new Headers(request.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Authorization", `Bearer ${Deno.env.get("GTS_TOKEN")}`);

  return fetch(url, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
  });
});
```

untuk `token` saya simpan di _environment variable_ yang disediakan oleh Deno dan dipanggil dengan `Deno.env.get(‘GTS_TOKEN’)`.

Kemudian di _frontmatter_ tinggal dirubah `src`nya menjadi alamat proxy yang dipakai, dalam hal ini saya pakai URL https://poestodon.deno.dev yang akan meng*relay proxy* ke URL asli.

```txt
https://poestodon.deno.dev/@poes/statuses/01J1S8G6667MYN5R2XYVN5D2WG
```

abaikan media yang tidak bisa ditampilkan, itu tak penting yang penting bisa dipakai untuk _fetching data_ dan `token` aman.

Setelah melakukan itu semua akhirnya saya bisa menampilkan gotosocial _threads_ (jika ada) di Lume.

[^1]: Tentang web component bisa dibaca di artikel MDN [MDN: Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)

[^2]: Sehingga saya memiliki file `comments.js`, `main.js`, dan `comment.css`

[^3]: Sebenarnya hampir semua aplikasi fediverse memiliki struktur yang berbeda namun biasanya APInya masih mengikuti API standar dari Mastodon.

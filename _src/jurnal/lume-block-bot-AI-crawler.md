---
title: "Lume: Memblokir bot crawler AI"
ringkasan: "Saya membuat <i>middleware</i> untuk memblock akses <i>bot crawler</i> AI di blog ini."
date: 2024-06-19
tags:
  - lume
  - deno
  - tutorial
kategori: jurnal
code: true
favorit: false
comment: false
templateEngine: vto, md
tocx: true
---

### Apa itu web crawler?

Saya pikir sebagain besar orang sudah paham apa itu Web Crawler, secara garis besar Web Crawler adalah semacam bot/robot yang bertugas untuk melakukan penelusuran dan pengumpulan data. Bot yang paling populer tentu yang dimiliki oleh perusahaan penyedia layanan _search engine_ seperti Google (begitulah cara google melakukan pengindexan).

Sedangkan bot crawler AI adalah Web Crawler yang dibuat oleh perusahaan atau entitas yang mengembangkan AI. Fungsi botnya sama dengan bot Google melakuan penelusuran (pencurian?) data untuk memperkaya atau memperbesar basis data untuk melatih model AInya.

lebih lengkap bisa baca artikel [Open AI Luncurkan GPTBot Sebagai Web Crawler](https://cmlabs.co/id-id/news/gptbot-web-crawler) ini.

### Banyak penentangan

Alih - alih disambut dengan suka cita, banyak pihak yang justru keberatan dengan adanya _bot crawler_ AI ini, bahkan pihak seperti Google pun juga keberatan[^1].

Sedangkan pihak - pihak lain adalah para _content creator_, _blogger_, peneliti, dan sebagainya yang khawatir artikel yang mereka tulis menjadi basis data untuk AI. Dari penentang ini kemudian muncullah layanan seperti [DarkVisitor](https://darkvisitors.com/) yang bertugas untuk melakukan _tracking/stat_ atas aktifitas _scrapping_ yang dilakukan oleh _bot crawler AI_ di sebuah halaman situs.

### Mengontrol bot crawler

#### Dengan robot.txt

Sejak pertama diluncurkan pada tahun 1994 dan kemudian menjadi standar pada 2022 _file_ `robot.txt` sudah menjadi semacam _state of the art_ untuk melakukan pengontrolan terhadap _bot crawler_.

Fungsinya adalah untuk menentukan bot yang mana yang boleh mengakses sebuah halaman tertentu atau spesifik. Contoh bentuk _syntax_ dari `robot.txt` adalah sebagai berikut

```txt
User-agent: *
Allow: /

User-agent: Applebot-Extended
Disallow: /
```

_Syntax_ `User-agent` berfungsi untuk menentukan jenis _user agent_ dari bot atau _browser_. Tanda `*` berarti semua _user agent_ dan _syntax_ `Allow` berarti mengijinkan akses. Sedang `/` adalah direktori `root`. Artinya semua _user agent_ diijinkan untuk mengakses _root directory_ dari sebuah websites.

Sebaliknya, jika `User-agent` berisi nama dari bot (dalam hal ini Applebot-Extended) maka `robot.txt` melarang/`Disallow` akses.

Secara etika, seharusnya semua bot mematuhi aturan yang sudah ditetapkan dalam _file_ `robot.txt` namun dalam kenyataanya tidak. Banyak bot nakal yang justru membaca _file_ `robot.txt` untuk menemukan direktori mana yang dilarang untuk diakses dan kemudian malah mengaksesnya.

Kenapa _file_ `robot.txt` tidak bisa memblokir akses secara paksa?

_File_ `robot.txt` hanyalah sebuah himbauan bagi bot untuk _crawler_ dan himbauan artinya tidak harus dipatuhikan? Sehingga membuat _file_ `robot.txt` pun kadang tidak cukup untuk mengontrol atau menghentikan bot.

#### Dengan .htaccess

Matthew Graybosch membuat sebuah [artikel yang lengkap](https://starbreaker.org/blog/tech/robots-txt-nuclear-option/index.html) untuk menunjukkan cara memblok akses bot _crawler_ AI melalui _file_ `.htaccess`.

Cara ini hanya berlaku jika mempergunakan _web server_ Apache saja. Skemanya adalah `.htaccess` memeriksa _user agent_ yang masuk, jika sama dengan daftar _user agent_ yang di*banned* maka akses tersebut akan diarahkan ke `http status 403: Forbidden`.

Untuk daftar _user agent_ yang di*banned* diambil dari DarkVisitor.

#### Dengan nginx.conf

Untuk pengguna _web server_ [nginx](https://nginx.com), Robb Knight membuat [artikel yang menarik](https://rknight.me/blog/blocking-bots-with-nginx/) tentang cara untuk mengatur `nginx.conf` agar bisa mengenali dan memblokir _user agent_. Caranya diterapkan di Eleventy.

#### Deno Deploy dan Lume

Bagi pengguna Lume yang reponya di*deploy* ke Deno Deploy, maka cara `.htaccess` dan `nginx.conf` tidak lagi bisa dipakai.

Saya tidak tahu _backend_ dari Deno tapi yang pasti tidak ada peluang untuk mengutak atik _file_ `.htaccess` maupun `nginx.conf`, jadi harus mencari cara lain untuk melakukan pemblokiran.

Lume adalah _static site generator_ yang saat di*deploy* ke Deno akan menyertakan sebuah _web server_ sederhana untuk menampilkan _static file_ (dalam HTML). Maka dengan melakukan _by pass_ dan pengecekan di _web server_ ini bisa dipergunakan untuk memblokir bot AI.

Untungnya Lume mendukung [middlewares](https://lume.land/docs/core/server/#middlewares) yang bisa dipakai untuk mengkustomisasi/menangani `request` dan `response` pada Deno HTTP Server.

Jadi saya membuat sebuah _middleware_ sederhana untuk memeriksa _user agent_ dari pengunjung dan jika sesuai dengan daftar yang di*banned* maka tinggal dialihkan ke halaman tertentu dengan _http status_ 403.

Kodenya sebagai berikut:

```ts
import type { Middleware } from "lume/core/server.ts";

export default function noRobotAI(): Middleware {
  return async (request, next) => {
    const response = await next(request);
    const { headers } = request;
    const banUA = [
      "AdsBot-Google",
      "Amazonbot",
      "anthropic-ai",
      "Applebot",
      "Applebot-Extended",
      "AwarioRssBot",
      "AwarioSmartBot",
      "Bytespider",
      "CCBot",
      "ChatGPT-User",
      "ClaudeBot",
      "Claude-Web",
      "cohere-ai",
      "DataForSeoBot",
      "Diffbot",
      "FacebookBot",
      "FriendlyCrawler",
      "Google-Extended",
      "GoogleOther",
      "GPTBot",
      "img2dataset",
      "ImagesiftBot",
      "magpie-crawler",
      "Meltwater",
      "omgili",
      "omgilibot",
      "peer39_crawler",
      "peer39_crawler/1.0",
      "PerplexityBot",
      "PiplBot",
      "scoop.it",
      "Seekr",
      "YouBot",
    ];
    const getUA = headers.get("user-agent") ?? "";
    const cekUA = banUA.includes(getUA);

    if (cekUA === true) {
      return new Response(
        `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>404 - Not found</title>
          <style> body { font-family: sans-serif; max-width: 40em; margin: auto; padding: 2em; line-height: 1.5; }</style>
        </head>
        <body>
          <h1>403 - Forbidden</h1>
        </body></html`,
        {
          status: 403,
          headers: { "Content-type": "text/html" },
        },
      );
    }
    return response;
  };
}
```

<aside>
untuk daftar <code>banUA</code> saya ambil juga dari DarkVisitor tapi versi <i>lite</i>nya.
</aside>

Kemudian simpan[^2] dan _middleware_ ini bisa dipanggil di dalam _file_ `server.ts` seperti ini

```ts
import Server from "lume/core/server.ts";

import noRobotAI from "./_middlewares/no_robotAI.ts";

const s = new Server({
  port: 8080,
  root: `${Deno.cwd()}/_site`,
});

s.use(noRobotAI());
s.start();
```

untuk mencoba bisa dengan cara menjalankan _file_ `server.ts`

```bash
$ deno run -A server.ts
Lume is listening on port: 8080
```

 <div class="postnotes">
  <h4>Apa perbedaan antara pakai deno task dan deno run untuk serving Lume?</h4>
  <p>deno task lume atau lume -s berfungsi untuk membuild lume dan menampilkan secara live dengan web server bawaan lume. Sangat cocok dipakai di lokal.</p>

  <p>Karena tujuannya untuk pemakaian di lokal, maka semua perubahan yang terjadi di file server.ts tidak akan berpengaruh.</p>

  <p>Sedangkan deno run -A server.ts digunakan untuk mengemulasi jika nanti sudah dideploy ke Deno, karena file server.ts inilah yang akan dipakai sebagai web server</p>

  <p>Kelemahannya, karena memang dipergunakan untuk serve static files, maka semua perubahan yang terjadi di dalam folder _src tidak akan berpengaruh atau ditampilkan. Mudahnya tidak ada fitur live reloading seperti di deno task lume -s</p>
 </div>

dan buka browser di alamat http://localhost:8080, kemudian buka _web inspector_ dan klik pada tanda titik 3 di sebelah kanan atas. Pilih **More tools** dan kemudian klik pada **Network Conditions**.

Pada pilihan _checklist_ User agent, buang centang supaya tidak memakai _user agent_ dari browser. Kemudian pilih _user agent custom_ dan isi dengan misalnya "Bytespider" (tanpa tanda "").

Setelah itu _reload_ halaman dan seharusnya akan muncul pesan **403 Forbidden**.

### Penutup

Melakukan pemblokiran terhadap _bot crawler_ AI kembali kepada pilihan masing - masing pemilik situs. Jika mementingkan SEO dan ingin berbagi untuk kemajuan teknologi AI maka mengijinkan _bot crawler_ AI untuk _scrapping data_ adalah pilihan yang bijaksana.

Saya sendiri sebenarnya tidak terlalu membutuhkan untuk blok _bot crawler_ AI ini, karena menurut pengamatan dari DarkVisitor situs saya ini tidak terlalu menarik bagi _bot crawler_ AI untuk diambil datanya. Mungkin karena situs ditulis dalam bahasa Indonesia, entahlah.

### Link menarik untuk dibaca

1. <https://starbreaker.org/blog/tech/robots-txt-nuclear-option/index.html>
2. <https://rknight.me/blog/blocking-bots-with-nginx/>
3. <https://manuelmoreale.com/>
4. <https://ethanmarcotte.com/wrote/blockin-bots/>
5. <https://www.cyberciti.biz/web-developer/block-openai-bard-bing-ai-crawler-bots-using-robots-txt-file/>

---

[^1]: <https://blog.google/technology/ai/ai-web-publisher-controls-sign-up/>. Meski kemudian google pun ikut terjun ke dalam ring pengembangan AI dengan Gemini-nya.

[^2]: Saya menyimpannya di folder `_middlewares` di root folder atau lokasi yang sama dengan file `server.ts`

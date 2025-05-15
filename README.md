# Jurnal Kusaeni

- visit : [kusaicom](https://kusaeni.com)
- build with [deno](https://deno.land) and [lume3](https://lume.land)
- serving by [deno deploy](https://deno.com)

## Cara Install dan Build

1. Install [Deno](https://deno.com)

```bash
curl -fsSL https://deno.land/install.sh | sh
```

atau bisa dengan package manager seperti `brew`, `apt`, dan sebagainya.

2. Clone repo ini

```bash
$ git clone https://github.com/kuspoes/kusaenicom.git blog
```

perintah ini akan menyalin isi repo ini ke folder bernama `blog`

3. Install [Lume](https://lume.land) dan build untuk pertama kali

```bash
$ cd blog
$ deno run -A https://lume.land/init.ts
$ deno task lume -s
```

perintah ini akan menginstall `lume` di sistem dan menjalankan lume untuk build dan serve di `localhost:3000`

kalo ingin membuild saja gunakan

```bash
$ cd blog
$ deno task lume
```

### Kostumisasi

Untuk mengkostumisasi data, silakan edit file `_config.ts`, `_data.yml`, dan `_src/_data/_metadata.json`. Terutama di bagian nama domain, nama author, dan keterangan lainnya.

Untuk merubah tema, silakan edit di `_src/_theme`, di dalamnya ada file `CSS`, template dalam `.vto`.

#### Tags

Di folder `_src` ada juga file `tags.page.js` file ini khusus untuk menggenerate page `/tags` yang berasoisasi dengan file `tags.vto` di folder `_src/_theme/layout/tags.vto`.

### Deno Deploy

Repository ini kemudian di deploy ke Deno Deploy dengan script CI di `.github/workflows` . Silakan edit sesuai dengan preferensi. Untuk serve HTML saat di Deno Deploy mempergunakan file `server.ts`.

Jika ingin mempergunakan layanan lainnya seperti Netlify atau Cloudflare Pages. Silakan merujuk pada [Lume Docs: Deployment](https://lume.land/docs/advanced/deployment/).

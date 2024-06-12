# Jurnal Kusaeni

visit : [kusaicom](https://kusaeni.com)
build with [deno](https://deno.land) and [lume2](https://lume.land)
serving by [deno deploy](https://deno.com)

## Cara Install dan Build

1. Install [Deno](https://deno.com)

```bash
curl -fsSL https://deno.land/install.sh | sh
```

atau bisa dengan package manager seperti `brew`, `apt`, dan sebagainya.

2. Install [Lume](https://lume.land)

```bash
deno run -A https://lume.land/init.ts
```

perintah ini akan menginstall `lume` di sistem

3. Clone repo ini

```bash
$ git clone https://github.com/kuspoes/kusaenicom.git blog
```

perintah ini akan menyalin isi repo ini ke folder bernama `blog`

4. Jalankan

```bash
$ cd blog
$ deno task lume -s
```

perintah ini akan menjalankan lume untuk membuild dan serve blog.
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

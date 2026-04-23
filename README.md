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
jangan lupa untuk _upgrade_ deno ke rilis terbaru `deno upgrade`. Repo ini memakai deno versi 2.7.12 (stable).

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

perintah ini akan menginstall `lume` di sistem dan menjalankan lume untuk build dan serve di `localhost:3000`.
jika sudah punya lume sebelumnya, boleh _upgrade_ ke versi terkini dengan `deno task lume upgrade`. Repo ini mempergunakan lume versi 3.2.4

kalo ingin membuild saja gunakan

```bash
$ cd blog
$ deno task lume
```

### Kostumisasi

Untuk mengkostumisasi data, silakan edit file `_config.ts`, `_data.yml`, dan atau  di `_src/_data/_metadata.json`. Terutama di bagian nama domain, nama author, dan keterangan lainnya.

Untuk merubah tema, silakan edit di `_src/_theme`, folder ini berisi `bagian` untuk template `header`, `menu`, dan `footer`. Folder `images` untuk logo, favicon, dan sebagainya, sedangkan `layout` adalah template layout untuk pelbagai jenis tipe artikel seperti jurnal, baca, dan foto. Template dalam `.vto`.

Folder `assets` di dalamnya ada file `CSS`, `JS`, dan `fonts`. Khusus font diambil sebagian dari Google Fonts namun untuk font berbayar tidak disertakan disini karena masalah lisensi.

#### Tags

Di folder `_src` ada juga file `tags.page.js` file ini khusus untuk meng-generate page `/tags` yang berasoisasi dengan file `tags.vto` di folder `_src/_theme/layout/tags.vto`.

#### Component's

Berisi script untuk reuseable terutama untuk membuat relasi artikel dan buku.
Dokumentasi tersedia di dalam masing - masing component, sebagai contoh untuk menampilkan related article:

```html
{{ comp.relasi_artikel({
    judul: "Judul Artikel",
    teks: "",
    format: "kanan | full",
    heading: "" })
}}
```

Dengan keterangan:
`judul`:  judul artikel (case sensitive)
`format`: defaultnya kiri tapi ada 2 pilihan lainnya yaitu kanan untuk float kanan atau full untuk mode penuh
`teks`: masukkan teks sebagai deskripsi, jika tidak ada maka akan pakai ringkasan
`heading`: jika URL menunjuk ke heading

component ini bisa di-insert ke dalam file markdown pada artikel yang ingin menampilkan relasi ke artikel yang lain. Bedanya dengan related article di layout `jurnal.vto` adalah penempatan component sangat fleksibel bisa ditempatkan di mana saja di dalam artikel.

### Deno Deploy

> Repository ini kemudian di deploy ke Deno Deploy dengan script CI di `.github/workflows` . Silakan edit sesuai dengan preferensi. Untuk serve HTML saat di Deno Deploy mempergunakan file `server.ts`.

Di Deno Deploy terbaru sudah tidak diperlukan lagi Github Actions untuk push ke Deno Deploy namun Deno Deploy yang akan handle semua proses. Cukup tautkan saja repository Github ke Deno Deploy. Sehingga file `main.yaml` bisa saja dihapus atau meng-disable fungsi Github Action. Untuk informasi lebih lanjut silakan baca [Lume migrasi ke Deno Deploy v2](https://kusaeni.com/jurnal/lume-migrasi-ke-deno-deploy-2/).

Jika ingin mempergunakan layanan lainnya seperti Netlify, Vercel, atau Cloudflare Pages. Silakan merujuk pada [Lume Docs: Deployment](https://lume.land/docs/advanced/deployment/).

---
title: Notifikasi Gotosocial dengan Telegram Bot
ringkasan: "Memanfaatkan Bot Telegram untuk mengirimkan notifikasi dari Gotosocial"
date: 2024-07-22
tags:
  - gotosocial
  - telegram
  - deno
kategori: jurnal
code: true
favorit: false
templateEngine: vto, md
tocx: true
comments:
  src: "https://poestodon.deno.dev/@poes/statuses/01J3DDTRT35V5DBZ1J9VB0YW3H"
  real: "https://kauaku.us/@poes/statuses/01J3DDTRT35V5DBZ1J9VB0YW3H"
---

Sampai dengan rilis [v.0.16.0](https://github.com/superseriousbusiness/gotosocial/releases/tag/v0.16.0) Gotosocial masih belum menyertakan fitur _push notification_ ke dalam aplikasinya. Menurut salah satu _developer_-nya pengaktifan notifikasi membutuhkan banyak sumber daya karena harus merubah sebagian besar kode meski sebenarnya Gotosocial sendiri sudah mendukung [API untuk mengirim notifikasi](https://docs.gotosocial.org/en/latest/api/swagger/).

Oleh karena itu mengakses API ini dan sedikit trik memanfaatkan layanan WebPush lainnya bisa dipakai untuk membuat notifikasi Gotosocial. Salah satunya bisa pakai cara yang dibuat oleh Joel Carnat dalam [GoToSocial Push notifications using Pushover](https://www.tumfatig.net/2024/gotosocial-push-notifications-using-pushover/). Joel membuat _shell script_ untuk menarik data notifikasi kemudian menyimpannya dalam bentuk _text file_ dan kemudian dikirim ke layanan [PushOver](https://pushover.net/)[^1].

Selanjutnya PushOver akan mengirim data notifikasi tersebut ke aplikasi PushOver yang sudah terpasang di hape.

Menarik tapi saya tidak ikuti cara ini karena PushOver tidak gratis. Namun ada layanan lain yang mirip dan _Open Source_ seperti [ntfy](https://ntfy.sh) yang merupakan layanan berbasis HTTP pub-sub notifikasi. Syaratnya sama kudu pasang aplikasi khusus di hape.

Pakai ntfy ini mudah, sangat mudah. Namun setelah beberapa jam saya coba ada fitur yang tidak bisa saya temukan (untuk saat ini) yaitu _rich text format_. ntfy memang sudah mendukung penggunaan Markdown namun terbatas di *web app*nya sedangkan di _mobile devices_ belum tersedia.

Alternatif lainnya adalah memakai _messaging services_ seperti Whatsapp, Signal, atau Telegram. Dan saya memilih yang terakhir ini.

## Rencana skema kerja

![skema gts to telegram bot](https://ik.imagekit.io/hjse9uhdjqd/jurnal/gts_telebot/image_WZ8xsRBlY.png?updatedAt=1721656379578)

Jika Joel Carnat mempergunakan _shell script_ maka disini saya akan pakai [Deno](https://deno.com) dengan Typescript, data akan disimpan di database postgresql kemudian dikirim ke Telegram bot.

Skemanya seperti ini:

1. _Script_ di Deno Deploy akan mengirimkan permintaan data (_fetch_) ke API Gotosocial,
2. API Gotosocial akan mengirim data dalam format `JSON` ke Deno Deploy,
3. Deno Deploy kemudian mengolah data dan mengirimkan ke database Postgresql (dilayani oleh [Neon Tech](https://neon.tech))
4. Deno Deploy merubah data yang disimpan di Neon dan dikirim ke Telegram Bot
5. Telegram Bot mengirimkan pesan ke _chat room_ di hape

Sedangkan layanan yang dipakai adalah:

1. [Deno Deploy](https://dash.deno.com) untuk _hosting typescript_ ✅ gratis
2. [Gotosocial](https://gotosocial.org) untuk layanan fediverse (_self host_)
3. Neon Tech untuk layanan _hosting database_ ✅ gratis
4. [Telegram Bot](https://core.telegram.org/bots/api) untuk Bot di Telegram ✅ gratis

Berikut ini yang saya tandai dengan <mark>stabilo warna hijau</mark> adalah hal yang penting untuk disimpan.

### Telegram Bot

Layanan pertama yang saya buat adalah Telegram Bot yang nantinya sebagai perantara pengiriman pesan ke Chat Telegram.

Cara bikin Bot ini mudah sekali, cari **Bot Father** di Telegram dan mulai berbicara dengan dia untuk membuat Bot baru atau ketik `/newbot` , jawab saja semua pertanyaan Bot Father sampai kemudian Bot selesai dibuat. Disini saya beri nama Bot misalnya **BibitBobot** [^2].

Selain itu perlu juga mendapatkan Chat ID, caranya bisa mengikuti [**How to get Telegram Bot Chat ID**](https://gist.github.com/nafiesl/4ad622f344cd1dc3bb1ecbe468ff9f8a)

Jangan lupa <mark>simpan *access token*nya dan nomer Chat ID</mark> karena ini diperlukan untuk berkomunikasi dengan Bot Poestodon.

### Database

Awalnya saya hendak pakai [Deno Kv](https://deno.com/kv) untuk databasenya, namun mengingat pemahaman saya terhadap Kv yang pas - pasan akhirnya saya memutuskan pakai Postgresql[^3].

Untungnya di luar sana banyak layanan Postgresql gratisan diantaranya Supabase, Koyeb, dan Neon Tech. Pilihan saya jatuh antara Supabase dan Neon Tech karena sudah di*support* oleh Deno secara langsung.

Daftar ke Neon Tech dan pilih _Free Tier_ dapat _storage_ 500Gb, 0.25 CPU, RAM 1Gb, dan _bandwidth_ 5Gb sebulan rasanya sudah cukup. Setelah mendaftar <mark>simpan _connection string_</mark> untuk nanti terhubung ke database.

Tidak perlu membuat table dan skemanya karena nanti dibuat melalui _script_ di Deno Deploy.

### Gotosocial API

Untuk mengakses API Gotosocial membutuhkan token khusus, cara bikinnya susah - susah mudah dengan mengikuti tutorial [Authentication With API](https://docs.gotosocial.org/en/latest/api/authentication/) di dokumentasi Gotosocial.

Setelah dapat <mark>_access token_ simpan</mark> karena akan dibutuhkan nanti untuk terhubung ke API Gotosocial.

## Script

Saya membuat script di `localhost` meskipun sebenarnya langsung dari Deno Deploy Playground bisa, namun saya ingin memisahkan antara membuat `table` Postgres dengan _script_ utamanya.

Contoh dibawah hanya diambil sepotong - potong, sedangkan keseluruhan _script_ bisa dilihat di [repo Github poestldn](https://github.com/kuspoes/poestldon)

### Environtment Variabel (.env)

Ingat dengan teks yang diberi stabilo hijau di atas?, Maka disinilah fungsinya untuk diinput ke _environtment files_. Tujuan dimasukkan _file .env_ adalah soal keamanan. Jadi bikin _file_ `.env` kemudian isi seperti contoh berikut

```text
GTS_TOKEN=VX24HKY4XL94FBIYBWC9G76U4F76MJJG
GTS_API=https://domain.tld/api/v1/notifications?limit=10
TELE_BOT=729830130381:hcOJWxaJyhHD1eEVk8zLV1Y-txR5ctt5fE9
TELE_CHATID=6432838383
DB_URL=postgresql://username:password@ep-weathered-snowflake-86743.ap-southeast-1.aws.neon.tech/notidb?sslmode=require
```

Isi dari `.env` ini akan dipanggil ke dalam _script_ dengan `Deno.env.get()` .

### Membuat table database

File `initdb.ts` dibuat khusus untuk membuat table database. Skema *table*nya sendiri seperti ini:

| pk  | name         | type                | null |
| --- | ------------ | ------------------- | ---- |
| ✓   | id           | INTEGER             | ✓    |
|     | inreplyto    | VARCHAR(100)        | ✓    |
|     | post_id      | VARCHAR(100) UNIQUE | ✓    |
|     | created_at   | TIMESTAMP           |      |
|     | handler      | VARCHAR(50)         | ✓    |
|     | display_name | VARCHAR(256)        | ✓    |
|     | type         | VARCHAR(20)         | ✓    |
|     | status       | VARCHAR(10000)      | ✓    |
|     | remark       | VARCHAR(10)         | ✓    |

Isi tabel ini nanti diambil dari _fetch_ data API Gotosocial.

Untuk membuat database dan populasi tabel bisa dengan menjalankan perintah

```shell
$ deno run -A --env initdb.ts
```

### Fetch data dari API Gotosocial

Keseluruhan fungsi ada di _file_ `main.ts` saya membaginya menjadi 3 fungsi berbeda[^4] yaitu

1. `requestNotif()` berfungsi untuk menarik data dari API Gotosocial dan menyimpannya ke dalam database,
   Contoh *script*nya seperti berikut ini:

   ```ts
   const conn = await Pool.connect();

   async function requestNotif() {
     	const f = await fetch(`${Deno.env.get("GTS_API")}`, {
    		method: "GET",
    		headers: {
      		"Content-Type": "Application/json",
      		Authorization: `Bearer ${Deno.env.get("GTS_TOKEN")}`,
    		},
     	});

     	const data = await f.json();
   	console.log(data);

   	for (const d of data) {
   		conn.queryObject`
          INSERT INTO ptldn
          (post_id, created_at, handler, display_name, type, remark)
          VALUES
          (${d.id}, ${d.created_at}, ${d.account.acct},
   		${d.account.display_name}, ${d.type}, ${remark})
          ON CONFLICT (post_id) DO NOTHING
        `;
   	}
   ```

   Fungsi `ON CONFLICT (post_id) DO NOTHING` bertugas memeriksa apakah di tabel kolom `post_id` sudah ada isi yang identik, jika ditemukan maka tidak akan diproses sehingga tidak ada 2 baris yang memiliki `post_id` yang identik.

   Dari hasil `fetch` tidak semua _value_ saya ambil dan simpan, hanya yang penting atau yang diperlukan saja.

2. `sendNotif()` digunakan untuk mengirimkan data notifikasi dari database ke Telegram Bot.
   Contoh _script_ sebagai berikut:

   ```ts
   const query = await conn.queryObject`
    SELECT * FROM ptldn
    WHERE remark = 'USEND'
    ORDER BY created_at ASC
    `;
    const data = query.rows;
    for (const d of data) {
   	await fetch(
          `https://api.telegram.org/bot${Deno.env.get("TELE_BOT")}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "Application/json",
            },
            body: JSON.stringify({
              chat_id: `${Deno.env.get("TELE_CHATID")}`,
              parse_mode: "markdown",
              text: `*${d.display_name}*
   			_${d.handler}_
   			${flag} ${d.type} you!
   			`,
            }),
          };
   ```

   Karena hasil `fetch` berupa javascript _object_ maka perlu merubahnya menjadi text biasa dengan `JSON.stringify`.

   Skemanya adalah Deno akan meng-query data dari database dengan syarat (WHERE) kolom remark berisi ‘USEND’ sebagai tanda notifikasi belum terkirim.

   `parse_mode` di Telegram mendukung HTML dan Markdown, tapi untuk data dari Gotosocial sepertinya lebih pas pakai mode Markdown. Lebih lengkapnya tentang hal ini bisa dibaca di [Style text with message entities](https://core.telegram.org/api/entities). Karena pakai Markdown, maka saya perlu menghilangkan beberapa _entities_ HTML yang ada (karena perbedaan client) dengan fungsi `replace` dan Regex.

3. `markNotif()` setelah semua notifikasi terkirim ke Telegram Bot, maka Deno akan memeriksa semua baris di dalam database dan merubah isi kolom remark dari ‘USEND’ ke ‘SEND’.
   Saya paham kalo fungsi ini _opionated_ banget, tapi ini bekerja untuk saya yang notifikasi Gotosocialnya tidak banyak dan jarang - jarang.

   ```ts
   async function markNotif() {
     await conn.queryObject`
    	UPDATE ptldn
    	SET remark = 'SEND'
    `;
   }
   ```

   Fungsi ini masih bisa dikembangkan lagi ke depannya. Tapi untuk saat ini bisa bekerja dengan baik.

Selanjutnya semua fungsi harus berjalan secara periodik (terskedul), maka [Deno.Cron\(\)](https://docs.deno.com/deploy/kv/manual/cron/) bisa dimanfaatkan. Seperti namanya `Deno.Cron`[^5] dipakai untuk membuat _schedule jobs_ seperti fungsi `cronjob` di _shell_.

Saya membuat skedul untuk masing - masing fungsi dengan jarak sekitar 60 detik antar skedul untuk memastikan proses pertama sudah selesai.

```ts
Deno.cron("Sedot Notification dari Gotosocial", "*/3 * * * *", () => {
  requestNotif();
});
Deno.cron("Lempar Notification ke Telegram Bot", "*/4 * * * *", () => {
  sendNotif();
});
Deno.cron("Tandai Notification yang sudah dilempar", "*/5 * * * *", () => {
  markNotif();
});
```

Skedul diatas akan mengeksekusi perintah `requestNotif()` setiap 3 menit, dilanjutkan perintah lain dengan jeda masing - masing 60 detik.

### Deployment

Setelah semua beres, saya melakukan _deploy script_ ke Deno Deploy sebagai _hosting_ dengan metode [Git Integration](https://docs.deno.com/deploy/manual/ci_github/), yaitu dengan menghubungkan repository Github ke Deno Deploy kemudian mengarahkan agar _file_ `main.ts` menjadi _entry point_ atau _file_ yang akan dijalankan oleh Deno Deploy.

Secara _default_ Deno Deploy sudah mengaktifkan `--unstable-cron --env` sehingga bisa langsung jalan tanpa ada modifikasi perintah. Untuk `.env` bisa mempergunakan Environment Variables yang bisa diakses dari menu Settings. Disini masukkan nama dan _value_ dari varibel sama persis dengan isian di dalam _file_ `.env`.

Setelah repositori Github dihubungkan, secara otomatis Deno Deploy akan mem*build script* yang ada.

## Screenshot hasil

Berikut ini adalah contoh _screenshot_ hasil dari _script_ ini:

![Notifikasi Telegram di iOS](https://ik.imagekit.io/hjse9uhdjqd/jurnal/gts_telebot/IMG_6465_XktHQpVfV.png?updatedAt=1721656402210)
![Notifikasi di chat dengan Telegram Bot](https://ik.imagekit.io/hjse9uhdjqd/jurnal/gts_telebot/IMG_6466_heNhNSLDk.png?updatedAt=1721656383904)

---

[^1]: Pushover adalah aplikasi WebPush yang membantu untuk mengirimkan notifikasi. Berjalan di hampir semua platform dan mengenakan tarif USD 5 per device.

[^2]: Biasanya Bot Father mengsyaratkan untuk mengakhiri nama Bot dengan frasa bot.

[^3]: Pemahaman saya atas Postgresql sebenarnya hampir sama buruknya dengan Deno Kv tapi tutorial SQL banyak bertebaran disana sini. Mongo adalah plan C jika saya bermasalah dengan dua database sebelumnya.

[^4]: Saya sengaja memecahnya menjadi 3 fungsi dengan tujuan mempermudah <i>trace error</i> dan melakukan testing.

[^5]: Meski sebenarnya dibuat sebagai <i>tool</i> untuk Deno.Kv tapi juga bisa dipergunakan secara terpisah. Penggunaan Deno.Cron di Deno Deploy membutuhkan akses Cron(BETA)

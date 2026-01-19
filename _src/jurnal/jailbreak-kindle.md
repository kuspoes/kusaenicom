---
title: Jailbreak Kindle
ringkasan: "supaya bisa sideload ebook dan aman."
date: 2025-06-26
tags:
  - kusaeni
  - kehidupan
  - kindle
kategori: jurnal
relasi: kindle
code: false
favorit: false
comment: true
keywords: jailbreak,e-reader, kindle, winterbreak
templateEngine: md
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01JYRV54QBF4KMG8T0P05Z6X2Z
  real: https://sok.egois.org/@poes/statuses/01JYRV54QBF4KMG8T0P05Z6X2Z
---

Setelah kena tipu, ane masih belum kapok untuk beli Kindle dari _marketplace_, masih tetap Facebook namun ane sekarang [gabung ke grup diskusi](https://www.facebook.com/groups/2673005503023565). Di dalam grup ini ada beberapa _post_ jual beli Kindle. Dari sini ane beranikan untuk beli lagi dan untungnya penjual amanah dan mengajak transaksi lanjutan di Shopee.

_Long story short_.

Ane akhirnya dapat Kindle Papperwhite gen 10 dengan storage 2Gb saja. Sebenarnya harapan ane punya storage 8 - 16 GB (untuk simpan manga) tapi apa daya karena sudah terperdaya sebelumnya sehingga cadangan biaya untuk beli Kindle menyusut dan harus ikhlas dengan apa yang ada (termasuk kekurangannya).

<img src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/kindle/IMG_1466_pGzQh1S4Q.jpeg?updatedAt=1750915358043" />
<img src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/kindle/IMG_1467_QjjBL_Zsc.jpeg?updatedAt=1750915363990" />
<img src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/kindle/IMG_1469_5nedPTtXT.jpeg?updatedAt=1750915354633" />

Kekurangan yang sangat terasa adalah adanya _shadow_ yang muncul saat memakai mode _night mode_.

<img src="https://ik.imagekit.io/hjse9uhdjqd/jurnal/kindle/IMG_1473_WylHV4WXQ.jpeg?updatedAt=1750915362926" />

<p class="sidenote">secara keseluruhan saat <i>night mode</i> aktif, maka muncul <i>shadow</i> yang lumayan jelas.</p>

Sejak awal ane sebenarnya pengen pakai Kobo reader, tujuannya adalah agar ga terikat dengan ekosistem Amazon yang kata orang ruwet dan menyebalkan. Tapi karena ane punyanya Kindle maka pilihan lain adalah melakukan _jailbreak_ ke sistem Kindle agar bisa terlepas dari Amazon. Ane melakukan sedikit riset di internet dan alhamdulillah ada _exploit_ yang bisa dipakai untuk melakukan _jailbreak_ pada Kindle dengan syarat _firmware_ yang terpasang di bawah versi 5.18.1, untungnya Kindle ane punya _firmware_ 5.16.

Metode _jailbreak_-nya pakai cara [Winterbreak](https://kindlemodding.org/jailbreaking/WinterBreak) yang disebut - sebut sebagai metode paling gampang dan terkini untuk Kindle. Kerennya lagi situs Winterbreak memberikan tutorial yang sangat lengkap dan mudah diikuti sehingga proses _jailbreak_ bisa cepat dan aman. Ane tidak membahas proses langkah demi langkah[^1], silakan menuju situs winterbreak karena disana ada tutorial yang sangat lengkap.

Ane pakai metode ini juga dan _install_ Ko Reader sebagai pengganti _reader_ bawaan Amazon. Meski ada beberapa kekurangan tapi bukan masalah yang besar yang terpenting adalah ane bisa _upload_ e-book dan tidak akan tiba - tiba hilang (kasus di Amazon).

## Ko Reader dan Kamus bahasa Inggris ke Bahasa Indonesia

Karena kebanyakan _ebook_ ane dari penerbit luar negeri dan berbahasa Inggris, maka ane sangat butuh kamus (_dictionary_) untuk menjelaskan kata - kata tertentu yang ane tidak paham. Oleh karena itu ane perlu memasang kamus bahasa Inggris ke Bahasa Indonesia.

Ternyata tidak mudah menemukan kamus bahasa Inggris ke bahasa Indonesia, meski Ko Reader memberikan daftar kamus yang bisa diunduh namun pengalaman ane kamus - kamus itu kurang sesuai. Sehingga ane perlu mencari kamus lain. Untungnya Ko Reader mendukung banyak format terutama dari format [Stardict](https://en.wikipedia.org/wiki/StarDict) seperti `*.idx, *.ifo or *.ifo.gz, *.dict or *.dict.dz.`.

Setelah mencari - cari, akhirnya ane menemukan kamus bahasa Inggris ke bahasa Indonesia di [Freedict](https://freedict.org/downloads/). Ane pilih Bahasa Indonesia dan kemudian _download_ English to Indonesian versi 2024.10.10 (_latest_)[^2]. Ekstrak kamus tersebut dan pindahkan ke folder `koreader/data/dict` di perangkat Kindle. Untuk memastikan kamus sudah terpasang, buka Ko Reader dan tap pada ikon kaca pembesar kemudian ke Settings ↣ Dictionary settings ↣ Manage directories. Di sini akan muncul daftar kamus yang sudah terpasang.

![Kindle dengan kamus bahasa Indonesia](https://ik.imagekit.io/hjse9uhdjqd/jurnal/kindle/IMG_1537_3n2bVhpeN.jpeg?updatedAt=1751456181114)

Namun, kamus bahasa Inggris ke bahasa Indonesia ini tidak lengkap sehingga banyak kata yang tidak tersedia. Oleh karena itu ane juga memasang kamus bahasa Inggris (dari GNU Collaborative International) yang lebih lengkap. Supaya kamus bahasa Inggris ke bahasa Indonesia menjadi pilihan utama maka ane perlu atur di Manage directories.

Pilihan lain saat kamus - kamus itu mentok, bisa pakai pencarian di Wikipedia, tapi tentu saja ini butuh akses internet. Pastikan _jailbreak_ Winterbreak telah selesai sempurna sebelum mengaktifkan akses internet.

[^1]: Saat proses _jailbreak_ memang butuh kesabaran karena banyak proses yang harus diselesaikan, termasuk colok lepas dan _reboot_ pada perangkat, tapi secara umum prosesnya sangat mudah.

[^2]: Ada beberapa pilihan perangkat, ane pilih _Stardict for Common Devices_ karena ane pakai Ko Reader di Kindle.

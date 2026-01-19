---
title: 'Migrasi dari Whatsapp'
ringkasan: 'Cara memindahkan data percakapan dari Whatsapp ke Telegram, Signal, atau BIP'
keywords: 'Whatsapp, Signal, Telegram, BIP, migration, migrasi, ekspor, data, export, impor,
pindah'
date: 2021-05-16
update: true
tags:
  - thoughts
  - kusaeni
kategori: jurnal
relasi: kusaeni
code: false
favorit: false
templateEngine: vto, md
comment: true
tocx: true
---

Sesuai dengan pemberitahuan dari Whatsapp mengenai [penundaan penerapan _privacy policy_](https://blog.whatsapp.com/giving-more-time-for-our-recent-update) maka per 16 Mei 2021 rencananya akan diaktifkan.

Bagi yang tidak setuju dengan _privacy policy_ terbaru ini maka resikonya adalah pengguna tersebut tidak akan bisa lagi mengakses atau memper-gunakan layanan Whatsapp.

{{ echo |> terkait("Signal buruk Whatsapp", "/jurnal/signal") }}
Perubahan privacy policy Whatsapp, resiko dan solusi alternatifnya.
{{ /echo }}

Meski begitu sampai saat ini tidak ada pemberitahuan resmi di laman blog Whatsapp. Namun untuk berjaga - jaga, berikut adalah cara untuk me-mindahkan atau _exports_ data percakapan ke penyedia layanan _messaging_ lain seperti Telegram atau Signal.

### Update

25 Mei 2021. Menurut situs [XDA Developer](https://www.xda-developers.com/whatsapp-wont-limit-user-accounts-india/), Whatsapp memperpanjang lagi waktu jeda pengaktifkan _privaci policy_ terbaru untuk pengguna di negara tertentu seperti India sampai dengan 5 bulan setelah jeda terakhir (bulan Pebruari). Tidak diketahui apakah Indonesia termasuk dalam daftar negara pengguna Whatsapp yang ikut dijeda.

Dari [The Verge](https://www.theverge.com/2021/5/28/22458805/whatsapp-privacy-policy-no-plans-limit-functionality) diinfokan bahwa Whatsapp <mark>tidak akan membatasi fitur dan fungsi untuk pengguna yang tidak setuju</mark> dengan _privacy policy_ namun akan terus **menampilkan peringatan** untuk menyetujui _privacy policy_.

### Ekspor

#### Ekspor ke Signal

Sebelum memindahkan data, yang harus dilakukan pertama kali adalah mengekspor data percakapan yang dimaksud, caranya adalah :

**Perhatian!!** cara dibawah ini tidak otomatis memindahkan data secara terstruktur ke dalam Signal. Data yang akan dipindahkan hanya sekedar ekspor data dalam format `ZIP` yang bisa dibuka/dibaca dengan teks editor sederhana atau dari dalam aplikasi Signal.s

1. Buka aplikasi Whatsapp, kemudian pilih pada percakapan yang diinginkan untuk dipindahkan,
2. (Android) tap pada menu `⋮` yang terletak di pojok kanan atas, kemudian pilih opsi `More` dan tap pada `Export Chat`, <span class="code_cap">langsung lompat ke cara nomer 04 jika tidak mempergunakan iPhone</span>
3. (iPhone) : tap pada nama _User_ atau _Group_ kemudian gulir ke bawah dan tap pada `Export
Chat`,
4. Jika ingin mengekspor lengkap dengan media (gambar, video, dokumen, dsb) pilih opsi `Include Media`, jika tidak maka gunakan pilihan `Without Media`,
5. Kemudian pilih aplikasi Signal dan pilih kontak _User_ yang dituju untuk tujuan eksport data tersebut.

Memindahkan data dalam **Grup** pada dasarnya sama dengan cara diatas,

1. Buka aplikasi Signal, dan buat sebuah Grup baru,
2. Tambahkan anggota ke dalam Grup (minimal 1 kontak), kemudian tap pada menu `⋮` pilih `Group
Settings` dan gulir kebawah untuk mengaktifkan `Group Link`,
3. Aktifkan `Share Link` dan mulai membagikan tautan yang tersedia kepada anggota Grup sebelumnya,
4. Gunakan cara ekspor data seperti cara sebelumnya.

Sampai saat ini Signal belum memiliki _tools_ untuk mengimpor data dari Whatsapp maupun dari _messenger_ yang lain, namun sudah ada aplikasi dari pihak ketiga yang bisa membantu proses ini meski dengan pelbagai ke-kurangannya masing - masing.

Contohnya adalah [ChatMove](https://play.google.com/store/apps/details?id=com.imkapps.chatmove) atau skrip Python [ini](https://github.com/gillesvangestel/ConvertWhatsAppToSignal/blob/main/ConvertWhatsAppToSignal.py).

#### Ekspor ke Telegram

Memindahkan data ke Telegram jauh lebih mudah daripada Signal, karena Telegram memiliki _tools_ khusus untuk ini. Yang harus dilakukan adalah sebagai berikut :

1. Ekspor data Whatsapp seperti cara diatas,
2. Pilih tujuan Telegram, kemudian pilih tujuan *User Account*nya,
3. Telegram akan otomatis mengimpor data dan menampilkannya seperti percakapan biasa. Bravo!.

Untuk **Grup** pun sama caranya.

#### Ekspor ke BIP

BIP sebagai pendatang baru ternyata sudah menggarap fungsi impor data ini, targetnya memang jelas <mark>memindahkan pengguna Whatsapp ke BIP</mark>.

Proses ekspor data dari Whatsapp sama mudahnya dengan Telegram. Tinggal ekspor dan pilih aplikasi BIP dan tuju akun kontaknya. Data akan ditampilkan secara `read only` di dalam layar pesan BIP.

---

### Kesimpulan

_Privacy Policy_ Whatsapp terbaru memang menjadi penyakit yang meng-gerogoti privasi penggunanya dan berpindah ke layanan lain jelas menjadi pilihan utama.

Saya pribadi lebih memilih pindah ke Signal meski untuk urusan impor data masih keteteran dibandingkan kompetitor. Harapannya adalah dalam waktu dekat Signal bisa merilis _tools_ untuk impor data dari Whatsapp.

Pilihan kedua yang lebih baik jatuh kepada BIP.

---

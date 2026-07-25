---
title: "FreeBSD migrasi ke pkgbase vol.2: JAIL"
ringkasan: "Migrasi *host* sudah selesai dengan lancar dan baik, lalu bagaimana dengan jail? sedikit ruwet, kadang sampai putus asa, *trial and error*. Agak aneh tapi berhasil"
date: 2026-07-25
tags:
  - tutorial
  - freebsd
  - bsd
  - security
  - jail
kategori: jurnal
relasi: freebsd
code: true
favorit: false
comment: true
keywords: "bsd, freebsd, security, tutorial, cara migrasi pkgbase, belajar freebsd, jail, bastillebsd, bastille"
draft: false
tocx: false
comments:
  src: https://sepoi.deno.dev/@poes/statuses/01KYCBBTWA642B71Y3FK0S4A6G
  real: https://sok.egois.org/@poes/statuses/01KYCBBTWA642B71Y3FK0S4A6G
---

Setelah sukses melakukan migrasi *host* [#FreeBSD](/tags/freebsd) ke metode pkgbase dengan [pkgbasify](https://github.com/FreeBSDFoundation/pkgbasify), maka sekarang saatnya untuk melakukan migrasi jail.

Ane berfikiran kalo caranya pasti sama yaitu dengan masuk ke dalam jail kemudian unduh *file* `pkgbasify.lua`, beri atribut eksekusi, dan jalankan, kemudian tunggu sampai selesai. Ternyata tidak! Saat menjalankan `pkgbasify.lua` dari dalam jail muncul banyak masalah termasuk diantaranya berkaitan dengan atribut, *permission* dan *upgrade* `pkg`.

Melakukan migrasi dari dalam jail tidak bisa dilakukan, apalagi jail ane bertipe *thin jail* yaitu jail yang *system files*nya merupakan *symbolic links* atau *symlinks* dari *system files* di *host* yang didapat dengan proses *bootstraping*. Karena cuma berbentuk *symlinks* maka ukuran jail ini cukup kecil, ringan, dan bisa dibuat dengan cepat.

Selain itu *thin jail* memiliki keterbatasan hanya beberapa *direktory* tertentu yang bisa ditulisi, sehingga proses migrasi tidak akan selesai karena `pkgbasify` tidak bisa menimpa *files* di dalam jail. Ane sudah mencoba beberapa kali namun selalu terkena *error* saat mencoba menimpa *files* di folder `/etc`.

Permasalahan ini bisa diatasi dengan melakukan migrasi dari *host* dengan memanfaatkan opsi `--jail` dari `pkgbasify` namun ada beberapa hal yang harus diperhatikan, ini adalah catatan ane saat melakukan migrasi jail ke pkgbase.

#### Lakukan di host dan sabar

Ane akan migrasi jail dengan nama `postgres` yaitu jail yang didedikasikan sebagai server database postgresql. 

1. **Matikan semua `service` yang penting dan lakukan *backup* data!**. Sebelum memulai ada baiknya untuk mematikan `service` secara "normal" dan melakukan pencadangan *files* maupun data penting. Ini untuk menghindari resiko terjadinya kegagalan saat proses, ingat `pkgbasify` <mark class="pink">masih bersifat eksperimen dan belum tentu selalu sukses!</mark>.

    <div class="sidebar_notes sebelah_kanan">
    <p><code>mdo</code> adalah alat untuk melakukan elevasi ke <i>root user</i>. Mirip seperti <code>sudo</code> dan <code>doas</code></p>
    </div>

    ```shell-session
      $ mkdir -p /tmp/jail
      $ mdo bastille cmd postgres service postgresql stop
      $ mdo bastille stop postgres
      $ mdo bastille export --tgz postgresql /tmp/jail
    ```
    <aside>perintah ini akan mematikan service dan jail kemudian melakukan backup jail dan disimpan di folder <code>/tmp/jail</code></aside>

2. **Rubah konfigurasi jail** `postgres` untuk mengijinkan perubahan dan melunakkan tingkat keamanan atau `security level`.

    ```shell-session
      $ mdo bastille edit postgres
        postgres {
                  ...
                  allow.chflags;
                  securelevel = -1;
                  ...
        }
    ```

    tambahkan atau rubah konfigurasi jail `postgres` seperti kode di atas. Ane rubah `securelevel= -1;` untuk membuka [proteksi](https://docs.freebsd.org/en/books/handbook/security/#security-secure-levels) untuk sementara.

3. **Lakukan *update* `pkg` di jail**. Perintah ini bisa dilakukan di dalam jail atau dari *host*, namun pengalaman ane saat dijalankan dari *host* kemungkinan sukses untuk migrasi lebih besar.

    ```shell-session
      $ mdo pkg -j postgres update -f
      $ mdo pkg -j postgres upgrade -y
    ```

    Biasanya jika `pkg` di dalam jail jarang diperbarui maka, sistem akan melakukan *update* paket `pkg` baru melakukan *update repository*, jadi lakukan berulang sesuai dengan kebutuhan.

4. **Unduh `pkgbasify` dan mulai migrasi**. Unduh aplikasi `pkgbasify.lua` dari *host* dan kemudian lakukan migrasi. Tidak perlu masuk ke dalam jail, peluang untuk sukses dan berhasil menimpa *files* dan folder lebih baik dilakukan dari *host*.

    ```shell-session
      $ mkdir -p /tmp/pkgbasify 
      $ cd /tmp/pkgbasify
      $ fetch https://github.com/FreeBSDFoundation/pkgbasify/raw/refs/heads/main/pkgbasify.lua
      pkgbasify.lua                           21 kB 11MBps    00s
      $ chmod +x pkgbasify.lua
      $ ./pkgbasify.lua --jail postgres
      Running this tool will irreversibly modify your system to use pkgbase.
      This tool and pkgbase are experimental and may result in a broken system.
      It is highly recommended to backup your system before proceeding.
      Do you accept this risk and wish to continue? (y/n) y
    ```
    <aside>perhatikan opsi <code>--jail</code> ditulis karena proses dilakukan dari <i>host</i></aside>

5. **Tunggu sampai selesai dan kemudian *restart* jail**. Namun pastikan apakah isi dari *file* konfigurasi *password, groups*, dan SSH sudah benar. Ane ga pakai konfigurasi ini jadi ane anggap benar saja.
      
      ```shell-session
        --
        After upgrading local-unbound, the configuration file should be regenerated
        by running "service local_unbound setup" before restarting the service.
        Restarting sshd
        Performing sanity check on sshd configuration.
        Stopping sshd.
        Waiting for PIDS: 507212.
        Performing sanity check on sshd configuration.
        Starting sshd.
        Conversion finished.
        
        Please verify that the contents of the following critical files are as expected:
        /etc/master.passwd
        /etc/group
        /etc/ssh/sshd_config
        
        After verifying those files, restart the system.

        $ mdo bastille restart postgres
        $ mdo pkg -j postgres which /bin/ls
          /bin/ls was installed by package FreeBSD-runtime-15.1p1
      ```
        
      pemeriksaan paket `ls` sudah menampilkan kalo paket tersebut dipasang oleh FreeBSD-runtime pkgbase. Sampai disini jail sudah sukses dimigrasi.

6. **Kembalikan konfigurasi jail terutama `securelevel`**. Setelah migrasi benar telah selesai maka perlu mengembalikan pengaturan `securelevel` ketingkat lebih tinggi untuk keamanan. Kemudian *restart* jail untuk mengaplikasikan perubahan.

      ```shell-session
      $ mdo bastille edit postgres
        postgres {
                  ...
                  securelevel = 2;
                  ...
        }
      $ mdo bastille restart postgres
      $ mdo bastille cmd postgress service postgresql start
      ```

---

##### Daftar Pustaka.
1. Dan Langille, *[Running pkgbasify on a FreeBSD 15.0 jail](https://dan.langille.org/2026/06/30/running-pkgbasify-on-a-freebsd-15-0-jail/)*, Dan Langille's Other Diary, 2026
2. BastilleBSD, *[Converting to Pkgbase](https://docs.bastillebsd.org/en/latest/chapters/pkgbase.html#converting-to-pkgbase)*, BastilleBSD Docs, 2025
3. The FreeBSD Foundation, *[pkgbasify convert a FreeBSD system to use pkgbase](https://github.com/FreeBSDFoundation/pkgbasify)*, Github, 2026
4. The FreeBSD Foundation, *[FreeBSD Handbook chapter 16. Security: Secure Level](https://docs.freebsd.org/en/books/handbook/security/#security-secure-levels)*, FreeBSD Handbook, 2026

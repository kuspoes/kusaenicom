---
title: Mengupgrade Jail dengan BastilleBSD
ringkasan: "cara meningkatkan rilis FreeBSD di Jail dengan mudah"
date: 2024-12-14
tags:
  - jurnal
  - bsd
  - tutorial
  - fave
keywords: "freebsd, vps, tutorial, bsd, jail, bastillebsd, bastille"
kategori: jurnal
code: true
favorit: false
comment: true
tocx: false
---

Jika tidak ada yang mendesak, membiarkan Jail memakai _release_ yang lebih lama merupakan pilihan yang bijak. Tapi jika memang dibutuhkan maka melakukan _upgrade release_ bisa dilakukan dengan cara sebagai berikut:

Asumsi dengan mempergunakan BastilleBSD dengan versi _release_ 14.1-RELEASE

## Upgrade Host
Sebelum meng*upgrade jail*, _host_ harus sudah di-*release target*  . Sebagai contoh, *host* sudah di*upgrade* ke FreeBSD 14.2-RELEASE-p0 dengan `freebsd-update`

```shell-session
# freebsd-update fetch install
# freebsd-update -r 14.2-RELEASE upgrade
# reboot
```
<aside>
Ikuti tutorial resmi di <a href="https://docs.freebsd.org/en/books/handbook/cutting-edge/">Handbook: Upgrade FreeBSD</a>
</aside>

## Upgrade Jail
Periksa jail dan versi rilisnya.
```shell-session
# bastille list all
JID    State  IP Address  Published Ports  Hostname  Release
jail1  Up     10.0.0.1    -                jail1     14.1-RELEASE
jail2  Up     10.0.0.2    -                jail2     14.1-RELEASE
```

_Bootstrap release_ terbaru yang dimiliki oleh _host_ agar tersimpan sebagai _release jail_.
```shell-session
# bastille bootstrap 14.2-RELEASE
# bastille list release
14.1-RELEASE
14.2-RELEASE
```

Sehingga sekarang ada 2 _releases_ yang tersedia, rencananya adalah untuk mengupgrade `jail` ke _release_ 14.2-RELEASE. Disini hanya perlu merubah isian dari `fstab` dan mengatur agar menunjuk ke _folder_ dari rilis rerbaru 14.2-RELEASE

```shell-session
# bastille stop jail1
# bastille edit jail1 fstab
```

Isi dari `fstab` seperti berikut:
```txt
/usr/local/bastille/releases/14.1-RELEASE /usr/local/bastille/jails/snac2/root/.bastille nullfs ro 0 0
```

Maka perlu dirubah _path_ `/usr/local/bastille/releases/14.1-RELEASE` ke `/usr/local/bastille/releases/14.2-RELEASE` . Simpan dan kemudian jalankan lagi `jail1`.

Begitu `jail1` berjalan, kemudian lakukan `chroot` ke dalam `jail1` dan lakukan _reinstallation_ atau _upgrade_ paksa ke aplikasi atau _packages_ yang sebelumnya terinstall.
```shell-session
# bastille console jail1
root@jail1: # pkg update
root@jail1: # pkg upgrade -f
root@jail1: # exit
# bastille restart jail1
```

Setelah _restart_ `jail1` seharusnya versi _release_ sudah menjadi yang terbaru.

```shell-session
# bastille list all
JID    State  IP Address  Published Ports  Hostname  Release
jail1  Up     10.0.0.1    -                jail1     14.2-RELEASE
jail2  Up     10.0.0.2    -                jail2     14.1-RELEASE
```

## Cara Downgrade
Ada baiknya  menyimpan versi _release_ beberapa tingkat jika ingin melakukan _downgrade_ (jika diperlukan). Prosesnya mirip dengan cara _upgrade_ hanya merubah versi *release*nya.

Namun jika dirasa tidak perlu dan ingin menghemat _storage_, ada baiknya _file releases_ dihapus. Caranya
```shell-session
# bastille destroy 14.1-RELEASE
```
dengan ini BastilleBSD akan menghapus rilis dan bisa menghemat sekitar 1 Gb _storage space_.

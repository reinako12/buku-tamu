# Bug: isian form hilang saat validasi gagal

Tanggal: 3 November 2026 · Ditemukan oleh pemilik proyek, diverifikasi ulang di
situs demo sebelum diperbaiki.

## Gejala

Tamu mengisi form, satu kolom wajib terlewat, lalu menekan kirim. Muncul pesan
"Periksa lagi isian yang ditandai" — tetapi **kategori instansi** dan **jenis
kelamin** kembali kosong. Tamu mengira hanya perlu melengkapi satu kolom, menekan
kirim lagi, dan mendapat galat berikutnya; akhirnya harus memeriksa ulang seluruh
form dari atas.

## Reproduksi (sebelum perbaikan)

Isi nama, WhatsApp, kategori instansi (`pemda`), nama instansi, jenis kelamin
(`pr`), keterangan — kosongkan tujuan kunjungan — lalu kirim.

```
sebelum : name=Uji Reset Form phone=081298765432 cat=pemda gender=pr purpose="" detail=Keterangan uji reset
sesudah : name=Uji Reset Form phone=081298765432 cat=""    gender="" purpose="" detail=Keterangan uji reset
```

Field teks bertahan, `select` dan `radio` hilang. Form tidak di-mount ulang
(node form yang sama, ditandai lewat properti DOM sebelum submit).

## Penyebab

React 19 mengosongkan form secara otomatis setelah sebuah form action selesai
(`<form action={formAction}>`). Untuk input teks, React menulis ulang nilai dari
state sehingga tampak pulih. Untuk `select` dan `radio`, state React sudah
memegang nilai yang sama seperti sebelumnya, jadi React tidak menulis ulang DOM —
padahal DOM sudah dikosongkan. Hasilnya desinkron: state berisi `pemda`, layar
menampilkan kosong.

## Perbaikan

1. Form tamu (`components/checkin-form.tsx`) dan dialog tamu manual
   (`components/walk-in-dialog.tsx`) tidak lagi memakai atribut `action`.
   Submit ditangani sendiri: `preventDefault()`, ambil `FormData`, jalankan
   action di dalam transisi. Tidak ada reset otomatis, semua nilai tetap.
2. Seluruh kolom form tamu jadi terkontrol, termasuk tujuan kunjungan dan
   keterangan yang sebelumnya hanya `defaultValue`.
3. Tombol kirim memakai status pending dari transisi (`useFormStatus` hanya
   bekerja untuk form action).
4. Isi-otomatis tamu berulang hanya mengisi kolom kosong — sebelumnya menimpa
   nama/instansi yang sudah diketik tamu kalau nomornya pernah dipakai.

## Verifikasi sesudah perbaikan

| Kasus | Hasil |
|---|---|
| Tujuan kunjungan kosong | semua field lain utuh, hanya pesan tujuan yang muncul; setelah dilengkapi, lanjut ke tiket |
| Nama dikosongkan | field lain utuh, pesan "Nama minimal 3 karakter." |
| WhatsApp tidak valid | semua pilihan utuh, termasuk kategori dan jenis kelamin |
| Tamu manual (petugas), WhatsApp tidak valid | semua isian utuh; setelah diperbaiki, tersimpan dan dialog tertutup |
| Nomor berulang + nama sudah diketik | nama tidak ditimpa; kolom kosong lain tetap terisi otomatis |

`tsc --noEmit` bersih, 39 unit test lulus, build sukses, service di-restart,
beranda 200.

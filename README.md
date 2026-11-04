# Buku Tamu BPS Tanah Datar

Aplikasi buku tamu digital untuk BPS Kabupaten Tanah Datar. Tamu mengisi form dari HP
dan langsung dapat nomor antrian harian, petugas memanggil dan mencatat dari dashboard.

Demo: https://bukutamu.grrifixn.my.id

## Stack

Next.js 15.5 (App Router), TypeScript, Tailwind 3.5, Prisma 6.19, Supabase untuk
Postgres, Auth, dan Realtime. Tailwind ditahan di 3.5, jangan diupgrade ke v4.

## Struktur

- `web/` — aplikasi Next.js, panduan dev di `web/README.md`
- `web/prisma/` — `schema.prisma` dan migrasi, sumber kebenaran struktur tabel
- `plan/` — rencana per fase
- `notes/` — catatan keputusan dan hasil uji
- `docs/` — panduan petugas, teknis, deploy
- `design/` — design system BPS dan revisi tampilan
- `assets/` — logo dan tangkapan layar

## Menjalankan

```bash
cd web
npm install
cp .env.example .env      # isi kredensial Supabase + RATE_LIMIT_SALT
npx prisma migrate deploy
npm run dev               # http://localhost:3000
```

```bash
npm run typecheck
npm test                  # 39 unit test
npm run build
```

## Database

Struktur tabel dikelola Prisma. Alokasi nomor antrian, trigger profil, dan RLS ditulis
sebagai SQL manual di migrasi `0001` karena tidak bisa dimodelkan Prisma.

Nomor antrian diambil lewat advisory lock per tanggal WIB, jadi dua tamu yang submit
bersamaan tidak dapat nomor sama, dan nomor balik ke 1 tiap ganti hari. Sudah diuji di
Postgres 16 lokal termasuk submit paralel.

```bash
cd web
npx prisma migrate deploy   # lewat DIRECT_URL, port 5432
npx prisma generate
```

Aplikasi konek lewat pooler port 6543, migrasi lewat koneksi langsung port 5432. Jangan
ditukar, migrasi bisa gagal di pooler.

Kolom `person_count` masih ada dengan default 1 untuk menjaga data lama, tapi sudah
tidak dipakai. Satu entri = satu orang.

## Dokumen

- `docs/CARA-PAKAI.md` — panduan petugas
- `docs/TEKNIS.md` — arsitektur, alur data, otorisasi, test
- `docs/deploy.md` — deploy dan rollback
- `design/DESIGN-v2.md` — keputusan desain

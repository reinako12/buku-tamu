# Buku Tamu BPS Tanah Datar — aplikasi

Next.js 15 (App Router) + Prisma + Supabase. Panduan pemakaian, arsitektur, dan
deploy ada di satu tingkat di atas: `../docs/`, `../design/`.

## Menjalankan

```bash
npm install                     # postinstall menjalankan prisma generate
cp .env.example .env            # isi DATABASE_URL, DIRECT_URL, kunci Supabase
npx prisma migrate deploy       # terapkan migrasi (port 5432 / DIRECT_URL)
npm run dev                     # http://localhost:3000
```

`npm run dev` memakai turbopack. Untuk meniru server produksi: `npm run build &&
npm start` (service `bukutamu` di server memakai cara ini di port 3100).

## Perintah

| Perintah | Guna |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build` / `npm start` | build produksi / jalankan hasil build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | 39 unit test (`node:test` + tsx), tanpa database |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:generate` | `prisma generate` |
| `npm run db:studio` | Prisma Studio |

Urutan sebelum rilis: `typecheck` → `test` → `build` → restart service. Build
wajib sebelum restart karena `next start` menyajikan `.next/`, bukan source.

## Peta kode

```
app/
  page.tsx              form tamu (atau banner tutup)
  t/[token]/page.tsx    tiket kunjungan
  masuk/page.tsx        login petugas
  dashboard/page.tsx    dashboard (memakai components/visit-board.tsx)
  pengaturan/page.tsx   sakelar buka/tutup + jadwal
  api/keluar/route.ts   logout
  actions/              server action per domain (visit, staff, settings, auth, locale)
components/             form, papan antrian, dialog tamu manual, pilihan gender, banner
lib/                    prisma, auth, status, zod, rate limit, i18n, supabase
prisma/                 schema + migrations
```

Aturan singkat yang perlu dipegang saat mengubah kode:

- Data bisnis lewat Prisma; Supabase JS hanya untuk Auth dan Realtime.
- **Prisma tidak terkena RLS** — otorisasi wajib di server action
  (`requireStaff()` atau validasi token).
- Nomor antrian hanya dibuat oleh fungsi database `create_visit()`, jangan
  dihitung di aplikasi.
- Semua teks yang dilihat pengguna masuk `lib/i18n/dict.ts` (ID dan EN).
- Tema Tailwind 3.5; jangan menaikkan ke v4 tanpa mengerjakan ulang token.

## Environment

```
DATABASE_URL                # port 6543 (pgbouncer), runtime
DIRECT_URL                  # port 5432, migrasi
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RATE_LIMIT_SALT
```

Jangan commit `.env`. Service role key setara password database.

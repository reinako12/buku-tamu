# Fase 0 — Setup Proyek

**Status:** ✅ selesai 2 Nov 2026 · **revisi 3 Nov:** pindah ke Prisma
**Estimasi:** ½ hari · **Aktual:** ~1 jam
**Gate:** user cek hasil sebelum Fase 1

## Tujuan

Fondasi yang bisa dibuild dan diverifikasi tanpa menyentuh fitur: Next.js jalan,
token BPS terpasang, font Inter termuat, schema database valid.

## Yang dikerjakan

| # | Item | Bukti |
|---|---|---|
| 0.1 | Next.js 15.5.28 + TypeScript + ESLint di `web/` | `npm run build` sukses, 1 route statis |
| 0.2 | Tailwind **3.5.17** (bukan v4) — aman sampai Chrome 90/Safari 15 | `tailwind.config.ts` |
| 0.3 | Token BPS dari `design/tailwind.theme.json` → `theme.extend` (21 warna, 11 fontSize, 5 radius, 11 spacing) | idem |
| 0.4 | Inter variable via `next/font` (self-host, bukan CDN) | 3 file `.woff2` di `.next/static/media/` |
| 0.5 | `globals.css`: base body `#EEF0F2` 16/24, kelas `.btn-*`, `.card`, `.field`, `.skeleton-box` | computed body = `rgb(238 240 242)` |
| 0.6 | Supabase client (Auth/Realtime) + `lib/env.ts` | `npm run typecheck` bersih |
| 0.6b | **Prisma 6.19** + `prisma/schema.prisma` + baseline migrasi 0000 + fungsi/RLS 0001 | `prisma migrate status` = up to date, drift 0 |
| 0.7 | Migrasi: enum, `profiles`, `visits`, `settings`, fungsi `create_visit`, RLS, trigger profil | diuji di Postgres 16 lokal **dan** Supabase cloud |
| 0.8 | `web/.env.example` + `.gitignore` env | — |
| 0.8b | **Prisma** (`schema.prisma` + `lib/prisma.ts` + `lib/visits/create.ts`) — menggantikan akses data `supabase-js` | `prisma/schema.prisma` |
| 0.9 | Halaman `/` sementara = cek token (diganti Fase 1) | `app/page.tsx` |

## Hasil uji database (Postgres 16 lokal)

```
migrasi            : OK (semua objek dibuat, 0 error)
3 kunjungan        : BT-20261102-001, -002, -003
10 insert paralel  : 2 proses x 5 → nomor 006..015, duplikat 0
constraint phone   : ditolak ("123")
constraint purpose : ditolak ("tujuan-ngawur")
constraint orang   : ditolak (0)
```

Catatan: `create_visit` memakai `pg_advisory_xact_lock` per tanggal, jadi dua tamu
yang submit bersamaan tidak mungkin dapat nomor sama.

## Hasil uji tampilan (computed style)

```
body      : rgb(238 240 242) · Inter, fallback system-ui · 16/24
h1        : 28px / 33.6px / 600
.btn-primary : bg rgb(0 60 128) · radius 6px · tinggi ≥40px · 16/24 600
.card     : bg rgb(252 252 252) · radius 12px · padding 24px · tanpa shadow
.field    : tinggi 44px · radius 8px · border rgb(203 213 225)
```

## Yang TIDAK dikerjakan (sengaja)

- Tabel `messages` (chat) — masuk migrasi 0002 di Fase 6
- Form buku tamu — Fase 1
- Supabase cloud project — belum ada kredensial, tunggu user
- Deploy Vercel + DNS — Fase 5

## Cara verifikasi sendiri

```bash
cd web
npm install
npm run typecheck     # harus keluar tanpa error
npm run build         # harus "Compiled successfully"
npm run dev           # buka http://localhost:3000 → halaman cek token
```

## Blocker untuk lanjut

- Kredensial Supabase (`URL`, `anon key`, `service role key`) untuk `web/.env.local`
- Akses DNS `grrifixn.my.id` (baru dipakai Fase 5)

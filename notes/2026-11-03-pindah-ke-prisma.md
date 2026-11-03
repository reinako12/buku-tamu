# 2026-11-03 — Pindah ke Prisma

## Keputusan
User minta Prisma karena kemungkinan besar proyek dipindah ke Postgres biasa
(bukan Supabase). Supabase Auth + Realtime tetap dipakai untuk sekarang.

## Yang berubah
- `prisma/schema.prisma` jadi sumber kebenaran tabel + enum
- `lib/prisma.ts` (singleton) menggantikan supabase-js untuk data
- `lib/supabase/server.ts` tinggal untuk Auth/Realtime saja
- `lib/supabase/admin.ts` dihapus — service role tidak lagi dipakai untuk data
- `supabase/migrations/001_init.sql` dihapus, diganti:
  - `prisma/migrations/0000_init` (generated dari schema)
  - `prisma/migrations/0001_functions_rls` (fungsi create_visit, RLS, trigger)
- Env: `DATABASE_URL` (pooler 6543) + `DIRECT_URL` (5432) untuk migrasi

## Perubahan manual di DB cloud (di luar migrasi)
DB sudah dibuat oleh SQL lama, jadi disamakan dengan Prisma:

```sql
alter table profiles drop constraint if exists profiles_id_fkey;  -- FK ke auth.users bikin cross-schema error
alter table visits drop constraint if exists visits_handled_by_fkey;
alter table visits add constraint visits_handled_by_fkey
  foreign key (handled_by) references profiles(id) on delete set null on update cascade;
alter index visits_queue_unique rename to visits_queue_date_queue_seq_key;
alter index visits_today_idx rename to visits_queue_date_queue_seq_idx;
```

Hasil `prisma migrate diff` setelah itu: **empty migration (0 drift)**.

## Konsekuensi keamanan
Prisma connect sebagai `postgres` → RLS dilewati. Otorisasi jalur Prisma harus
di server action (validasi token tamu / sesi petugas). RLS tetap aktif untuk
jalur Supabase Auth dan Realtime.

## Verifikasi
- `prisma validate` OK
- `prisma migrate status` → 2 migrasi, "Database schema is up to date"
- Uji nyata via pooler: `create_visit` → `BT-20261103-001`, baca via
  `prisma.visit.findFirst` OK, hapus OK

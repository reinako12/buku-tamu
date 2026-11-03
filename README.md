# Buku Tamu + Live Chat

Proyek magang #1. Aplikasi buku tamu digital BPS Kabupaten Tanah Datar.

**Status:** Fase 0–5 selesai (setup, form + tiket, dashboard petugas, pengaturan + ID/EN, QA & responsif, dokumentasi). Fase 6 (live chat) belum dimulai. Deploy demo sudah jalan.
**Repo:** https://github.com/reinako12/buku-tamu (private)
**Live (demo):** https://bukutamu.grrifixn.my.id
**Stack:** Next.js 15.5 · TypeScript · Tailwind **3.5** · **Prisma** 6.19 · Supabase (Postgres + Auth + Realtime)

## Struktur

| Path | Isi |
|---|---|
| `web/` | Kode aplikasi Next.js — lihat `web/README.md` |
| `web/prisma/` | `schema.prisma` + migrasi (sumber kebenaran skema) |
| `web/prisma/migrations/` | `0000_init` · `0001_functions_rls` · `0002_realtime` · `0003_gender` |
| `plan/` | Rencana: `01-PLAN-buku-tamu.md` (master) + `fase-00` … `fase-06` |
| `notes/` | Log keputusan & catatan uji |
| `docs/` | `CARA-PAKAI.md` (panduan petugas) · `TEKNIS.md` (arsitektur & data) · `deploy.md` |
| `assets/` | Logo, tangkapan layar panduan |
| `design/` | Design system BPS + `DESIGN-v2.md` (revisi tampilan & alasannya) |

## Fase

- ✅ **Fase 0** — setup, token, schema → `plan/fase-00-setup.md`
- ✅ **Fase 1** — form buku tamu + tiket
- ✅ **Fase 2** — login + dashboard petugas
- ✅ **Fase 3** — switch tutup/buka + ID/EN (3A + 3B)
- ✅ **Fase 4** — QA & responsif → `notes/fase-4-qa.md`
- ✅ **Fase 5** — dokumentasi petugas → `docs/CARA-PAKAI.md`
- ⬜ **Fase 6** — live chat (setelah buku tamu rampung)

## Yang sudah jalan

- Form tamu (nama, WhatsApp, instansi, kategori, tujuan, jenis kelamin, keterangan) → tiket dengan nomor antrian harian.
- Nomor antrian aman dari tabrakan: dialokasikan di database lewat advisory lock, reset tiap hari WIB.
- Dashboard petugas realtime: papan meja, antrian aktif, daftar selesai/batal, aksi segaris, 5 baris per halaman.
- Tutup/buka buku tamu + alasan + jadwal buka otomatis.
- Dua bahasa (ID / EN) lewat cookie, tanpa mengubah data.
- Rate limit form 3 pengisian / 30 detik per IP (hash).

## Jalan cepat

```bash
cd web
npm install
cp .env.example .env            # isi kredensial Supabase
npx prisma migrate deploy
npm run dev                     # http://localhost:3000
```

```bash
npm run typecheck               # tsc --noEmit
npm test                        # 39 unit test
npm run build
```

## Database

Skema dikelola Prisma. Nomor antrian, trigger profil, dan RLS ada di migrasi SQL
(`0001`) karena tidak bisa dimodelkan Prisma. Migrasi diuji di Postgres 16 lokal:
nomor tetap unik walau submit paralel, constraint menolak data tidak valid.

```bash
cd web
npx prisma migrate deploy       # pakai DIRECT_URL (port 5432)
npx prisma generate
```

Catatan: `person_count` masih ada di tabel (default 1) untuk kompatibilitas data
lama, tetapi tidak dipakai lagi — satu entri = satu orang.

## Dokumen

- Panduan petugas: `docs/CARA-PAKAI.md`
- Arsitektur, data, otorisasi, test: `docs/TEKNIS.md`
- Deploy & rollback: `docs/deploy.md`
- Keputusan desain: `design/DESIGN-v2.md`

## Blocker

Tidak ada. Kredensial Supabase dan DNS sudah terpasang; sisa pekerjaan adalah
Fase 6 (live chat) yang menunggu keputusan apakah jadi dilanjutkan.

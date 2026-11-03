# Buku Tamu + Live Chat

Proyek magang #1. Aplikasi buku tamu digital BPS Kabupaten Tanah Datar.

**Status:** Fase 0 selesai (setup). Fase 1 belum mulai — menunggu gate user.
**Repo:** https://github.com/reinako12/buku-tamu (private)
**Domain demo:** `bukutamu.grrifixn.my.id` (belum di-deploy).
**Stack:** Next.js 15.5 · TypeScript · Tailwind **3.5** · **Prisma** · Supabase (Postgres + Auth + Realtime).

## Struktur

| Path | Isi |
|---|---|
| `web/` | Kode aplikasi Next.js |
| `web/prisma/` | `schema.prisma` + migrasi (sumber kebenaran skema) |
| `web/prisma/migrations/` | 0000 = tabel (generated), 0001 = fungsi + RLS |
| `plan/` | Rencana: `01-PLAN-buku-tamu.md` (master) + `fase-00` … `fase-06` |
| `notes/` | Log keputusan & catatan uji |
| `docs/` | `CARA-PAKAI.md`, `TEKNIS.md` — untuk diserahkan |
| `assets/` | Logo, screenshot |
| `design/` | Salinan design system BPS (sumber asli di `project-magang/design/`) |

## Fase

- ✅ **Fase 0** — setup, token, schema → `plan/fase-00-setup.md`
- ⬜ **Fase 1** — form buku tamu + tiket
- ⬜ **Fase 2** — login + dashboard
- ⬜ **Fase 3** — switch tutup/buka + ID/EN
- ⬜ **Fase 4** — QA & responsif
- ⬜ **Fase 5** — deploy demo
- ⬜ **Fase 6** — live chat (setelah buku tamu rampung)

## Jalan cepat

```bash
cd web
npm install
cp .env.example .env.local   # isi kredensial Supabase
npm run dev                  # http://localhost:3000
```

```bash
npm run typecheck
npm run build
```

## Database

Migrasi diuji di Postgres 16 lokal: nomor antrian unik walau submit paralel,
constraint phone/purpose/person_count menolak data tidak valid.

```bash
# ke Supabase cloud (butuh project ref + login)
cd ..            # root buku-tamu
supabase link --project-ref <ref>
supabase db push
```

## Blocker

- Kredensial Supabase untuk `.env.local` (URL, anon key, service role key)
- Akses DNS `grrifixn.my.id` (baru dipakai di Fase 5)

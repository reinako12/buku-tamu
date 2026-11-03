# Fase 5 — Deploy Demo

**Estimasi:** ½–1 hari · **Gate:** user coba dari HP di jaringan seluler

## Tujuan

Aplikasi bisa dibuka dari URL publik `bukutamu.grrifixn.my.id`, dipakai untuk demo
ke pembimbing, dan bisa diserahkan kalau nanti disetujui.

## Ruang lingkup

1. Supabase cloud project + push migrasi
2. Buat 1 akun petugas (email + password)
3. Deploy Vercel + domain
4. Dokumentasi petugas & teknis
5. Uji asap (smoke test) dari jaringan seluler

## Task

| # | Task | Detail |
|---|---|---|
| 5.1 | Buat project Supabase `bukutamu-tanahdatar` | region Singapore (terdekat) |
| 5.2 | Push migrasi `0001_init.sql` | `supabase db push` atau SQL editor |
| 5.3 | Buat user petugas | Authentication → Add user, isi `full_name` di metadata |
| 5.4 | Set env di Vercel | `NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `RATE_LIMIT_SALT` |
| 5.5 | Deploy + hubungkan repo GitHub | build command `npm run build` di root `web/` |
| 5.6 | CNAME `bukutamu` → `cname.vercel-dns.com` | di Cloudflare, proxy **DNS only** saat verifikasi |
| 5.7 | Smoke test produksi | check-in, tiket, login, panggil, selesai, switch, EN |
| 5.8 | `docs/CARA-PAKAI.md` | panduan petugas, bahasa awam + screenshot |
| 5.9 | `docs/TEKNIS.md` | arsitektur, ERD, env, **langkah transfer akun** |
| 5.10 | Catat data demo vs produksi | aturan: produksi = project Supabase baru |

## Keputusan teknis yang mengikat

- **`SUPABASE_SERVICE_ROLE_KEY` tidak boleh** punya prefix `NEXT_PUBLIC_`. Kalau
  sampai bocor ke browser, seluruh data tamu bisa dibaca siapa pun.
- **Cloudflare proxy**: saat pertama pasang CNAME, matikan proxy (grey cloud)
  supaya Vercel bisa menerbitkan SSL. Setelah aktif, boleh dinyalakan.
- **Tidak ada `robots` indexing** — halaman sudah `noindex`, jangan diubah.
- **Backup**: Supabase free tier punya backup harian terbatas; untuk demo cukup.
  Kalau naik produksi, tambah `pg_dump` terjadwal.

## Kriteria verifikasi

- [ ] `https://bukutamu.grrifixn.my.id` terbuka dengan SSL valid
- [ ] Buka dari HP dengan data seluler (bukan WiFi kantor) → form tampil normal
- [ ] Submit → nomor muncul, tercatat di dashboard
- [ ] Login petugas dari PC → bisa panggil & selesaikan
- [ ] Toggle EN → tetap berfungsi di produksi
- [ ] Tidak ada error di Vercel logs selama smoke test
- [ ] `docs/CARA-PAKAI.md` bisa diikuti orang non-teknis

## Rollback

Kalau deploy bermasalah: Vercel → Deployments → promote deployment sebelumnya.
Database tidak perlu di-rollback selama migrasi bersifat menambah (tidak ada drop).

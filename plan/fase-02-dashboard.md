# Fase 2 — Login & Dashboard Resepsionis

**Estimasi:** 2–3 hari · **Gate:** user login dan coba kelola tamu sebelum Fase 3

## Tujuan

Resepsionis bisa masuk, melihat tamu yang masuk, mengubah status, dan menginput tamu
manual untuk yang tidak bisa isi sendiri.

## Ruang lingkup

1. Login email+password (Supabase Auth), tanpa registrasi publik
2. Middleware proteksi `/admin/*`
3. Dashboard hari ini: tabel, filter status, pencarian
4. Aksi status: Panggil → Layani → Selesai → Batal
5. Daftar tamu update realtime + bunyi + judul tab berkedip + badge favicon
6. Input tamu manual + salin link tiket

## Task

| # | Task | File |
|---|---|---|
| 2.1 | Halaman login, error generik, rate limit 5/menit | `app/admin/login/page.tsx` |
| 2.2 | Middleware: redirect ke login kalau tidak ada sesi | `middleware.ts` |
| 2.3 | Layout admin (header, tombol keluar, nama petugas) | `app/admin/layout.tsx` |
| 2.4 | Query tamu hari ini (server component, WIB) | `app/admin/page.tsx` |
| 2.5 | Tabel: No · Nama · Instansi · Tujuan · Orang · Masuk · Status · Aksi | `components/visitor-table.tsx` |
| 2.6 | Badge status 5 varian (warna token BPS) | `components/status-badge.tsx` |
| 2.7 | Filter status + pencarian (query param) | `lib/queries/visits.ts` |
| 2.8 | Server action ubah status + isi `check_out_at` saat selesai | `lib/actions/visit-status.ts` |
| 2.9 | Realtime: subscribe INSERT/UPDATE → baris baru + highlight 1 detik | `components/visits-live.tsx` |
| 2.10 | Notifikasi: bunyi + judul berkedip + badge favicon | `lib/notify.ts` |
| 2.11 | Form input manual (field sama + `source='manual'`) + salin link | `app/admin/tamu/baru/page.tsx` |
| 2.12 | Detail tamu + catatan internal | `app/admin/tamu/[id]/page.tsx` |
| 2.13 | E2E: login → tamu baru muncul < 2 detik → panggil → selesai | `tests/e2e/admin.spec.ts` |

## Keputusan teknis yang mengikat

- **Satu akun** petugas. Tidak ada halaman kelola user di MVP.
- **Realtime pakai RLS sesi petugas** (anon key + cookie), bukan service role —
  supaya dashboard aman kalau tab dibiarkan terbuka.
- **Status hanya bisa maju**; `batal` bisa dari `menunggu`/`dipanggil` saja.
- **Bunyi notif** diputar setelah interaksi pertama (syarat autoplay browser).
- **Input manual** tidak boleh mengubah nomor antrian yang sudah ada; tetap dapat
  nomor baru di urutan berikutnya.

## Kriteria verifikasi

- [ ] Buka `/admin` tanpa login → redirect ke login
- [ ] Login salah 5× → diblokir sementara dengan pesan jelas
- [ ] Tamu submit dari HP → muncul di dashboard < 2 detik tanpa refresh + bunyi
- [ ] Klik Panggil → badge berubah, jam tidak berubah
- [ ] Klik Selesai → `check_out_at` terisi, baris keluar dari filter default
- [ ] Pencarian "budi" / "dinas" menemukan baris yang benar
- [ ] Input manual → tamu dapat nomor baru, `source` tercatat manual
- [ ] Salin link → buka di HP lain → tiket tamu tampil
- [ ] Buka dashboard di layar 1366×768 (PC resepsionis) → tabel muat tanpa scroll horizontal

## Yang TIDAK dikerjakan

Chat, switch buka/tutup, export, i18n, halaman pengaturan.

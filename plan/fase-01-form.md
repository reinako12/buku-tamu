# Fase 1 — Form Buku Tamu (fitur inti)

**Estimasi:** 2–3 hari · **Gate:** user coba form sebelum lanjut Fase 2

## Tujuan

Tamu scan QR → isi form → dapat nomor antrian + tiket. Semua jalur buku tamu
(wajib + fallback input manual sudah disiapkan tempatnya), tanpa chat.

## Ruang lingkup

1. Halaman `/` = form check-in mobile-first
2. Validasi (Zod) di server, pesan bahasa Indonesia
3. Simpan ke database lewat server action, nomor antrian otomatis
4. Halaman tiket `/t/[token]`: nomor besar, status, simpan link ke WhatsApp, cetak
5. Banner jam layanan (istirahat / luar jam)
6. Anti-spam: honeypot + rate limit
7. Auto-fill tamu lama berdasarkan nomor HP

## Task

| # | Task | File |
|---|---|---|
| 1.1 | Schema Zod: nama, kategori, instansi, phone (normalisasi `+62`), tujuan, jumlah orang, detail | `lib/schemas/visit.ts` |
| 1.2 | Unit test schema (valid, invalid, normalisasi phone) | `lib/schemas/visit.test.ts` |
| 1.3 | `serviceState()`: dalam jam / istirahat / luar jam / weekend, WIB | `lib/service-hours.ts` |
| 1.4 | Unit test `serviceState` dengan jam dipalsukan (Senin 09.00, 12.30, 17.00, Sabtu) | `lib/service-hours.test.ts` |
| 1.5 | Komponen UI: `Input`, `Select`, `Stepper`, `Button`, `Banner` (token BPS) | `components/ui/*.tsx` |
| 1.6 | Server action `createVisit`: validasi → cek `settings.is_open` → rate limit → `rpc create_visit` → cookie token | `lib/actions/visit.ts` |
| 1.7 | Rate limiter in-memory (hash IP + salt), 1 submit/30 detik | `lib/rate-limit.ts` |
| 1.8 | Halaman form + banner jam layanan | `app/page.tsx` |
| 1.9 | Auto-fill: cari nomor HP terakhir, isi nama+instansi, tampil chip konfirmasi | `lib/actions/visit.ts` |
| 1.10 | Halaman tiket: nomor 64–72px, status, tombol WA, print CSS A6 | `app/t/[token]/page.tsx` |
| 1.11 | Halaman "buku tamu ditutup" | `app/tutup/page.tsx` |
| 1.12 | E2E Playwright: isi form → tiket tampil → nomor sesuai urutan | `tests/e2e/checkin.spec.ts` |

## Keputusan teknis yang mengikat

- **Server action, bukan API route** untuk submit — token & validasi di server.
- **Cookie `visit_token`** httpOnly, 24 jam, `sameSite=lax`, `secure` di produksi.
- **Rate limit in-memory** cukup untuk 1 instance Vercel; kalau nanti multi-instance,
  pindah ke tabel `rate_limits` (jangan pakai Redis, biar tetap 1 layanan).
- **Phone disimpan ternormalisasi** (`+62812...`) supaya auto-fill akurat.
- **Nomor tampil** = `queue_seq` saja (007), bukan string penuh.
- **Tidak ada captcha** di MVP; honeypot + rate limit cukup untuk demo.

## Kriteria verifikasi (user bisa cek sendiri)

- [ ] Buka di HP: form muat 1 layar, tidak perlu zoom
- [ ] Submit kosong → semua pesan error muncul di field yang benar
- [ ] Submit valid → tiket muncul, nomor urut naik (submit 2× → 002, 003)
- [ ] Submit jam 12.30 → banner istirahat, tetap bisa submit
- [ ] Submit jam 20.00 → banner luar jam, tetap bisa submit
- [ ] Tutup browser → buka link tiket lagi → data masih ada
- [ ] Tombol "Simpan ke WhatsApp" membuka WA dengan link tiket
- [ ] Cetak tiket → A6, nomor kebaca
- [ ] Submit 2× dalam 30 detik → ditolak dengan pesan jelas
- [ ] Nama + instansi sama, HP sama, kunjungan kedua → auto-fill jalan

## Yang TIDAK dikerjakan

Chat, dashboard admin, login, switch buka/tutup (halaman `/tutup` dibuat tapi
switch-nya baru aktif di Fase 3), i18n.

# Fase 4 — Polish, Responsif, Aksesibilitas, QA

**Estimasi:** 2 hari · **Gate:** user uji di HP asli sebelum deploy

## Tujuan

Aplikasi layak dipakai tamu sungguhan: tidak ada layar rusak, tidak ada error
di console, bisa dipakai di HP lama, dan lolos uji jaringan lambat.

## Ruang lingkup

1. Responsif 390 / 768 / 1024 / 1440 — dashboard jadi kartu di layar kecil
2. Aksesibilitas: label, fokus, kontras, `aria-live` untuk status
3. State: loading skeleton, empty state, error boundary, toast
4. Print CSS tiket (A6) dirapikan
5. Uji browser lama + jaringan lambat
6. Perbaikan bug hasil uji

## Task

| # | Task | File |
|---|---|---|
| 4.1 | Audit responsif 4 viewport, perbaiki overflow & tabel | `components/visitor-table.tsx` |
| 4.2 | Tabel → daftar kartu di < 768px | `components/visitor-card-list.tsx` |
| 4.3 | `label` untuk semua input + `aria-describedby` untuk error | `components/ui/*` |
| 4.4 | `aria-live="polite"` untuk perubahan status di halaman tiket | `app/t/[token]/page.tsx` |
| 4.5 | Loading skeleton (`.skeleton-box`) di dashboard & tiket | `app/**/loading.tsx` |
| 4.6 | Empty state: belum ada tamu hari ini | `components/empty-state.tsx` |
| 4.7 | Error boundary + halaman 404 kustom | `app/error.tsx`, `app/not-found.tsx` |
| 4.8 | Print CSS: A6, hanya nomor + nama + tanggal + QR teks | `app/globals.css` |
| 4.9 | Cek kontras teks (min 4.5:1) — catat pengecualian | `notes/` |
| 4.10 | Uji HP lama + throttle 3G + keyboard muncul | catat di `notes/` |
| 4.11 | Bersihkan `console.log`, pastikan tanpa error di production | seluruh `web/` |

## Kriteria verifikasi

- [ ] 390px: form & tiket muat, tanpa scroll horizontal
- [ ] 1366px: tabel dashboard muat penuh
- [ ] Tab keyboard: semua elemen bisa dijangkau, fokus terlihat
- [ ] Screen reader (TalkBack/VoiceOver) membaca field dengan benar
- [ ] Throttle 3G: form tetap bisa disubmit < 5 detik
- [ ] Keyboard muncul → composer/tombol tidak tertutup (relevant saat chat)
- [ ] Cetak tiket A6: nomor kebaca, tidak terpotong
- [ ] DevTools console bersih di semua halaman

## Catatan risiko

Browser paling tua yang diuji harus dicatat tanggal + versi. Kalau ada HP yang
tidak bisa dipakai, tulis di `notes/` dan putuskan: perbaiki atau nyatakan
tidak didukung.

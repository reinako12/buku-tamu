# Fase 3 — Switch Buka/Tutup + Dua Bahasa

**Estimasi:** 1–2 hari · **Gate:** user coba tutup/buka dan toggle EN

## Tujuan

Resepsionis bisa menutup buku tamu saat hari libur, dan tamu bisa memakai UI
dalam bahasa Inggris.

## Ruang lingkup

1. Halaman Pengaturan: switch BUKA/TUTUP, alasan, jadwal buka kembali, auto-reopen
2. Halaman publik menyesuaikan status: form vs halaman "ditutup"
3. Banner merah persisten di dashboard saat tutup
4. Auto-reopen jam 08.00 hari kerja berikutnya
5. i18n ID/EN: semua label, pesan validasi, status, banner, halaman tutup

## Task

| # | Task | File |
|---|---|---|
| 3.1 | Server action baca/tulis `settings` (hanya petugas login) | `lib/actions/settings.ts` |
| 3.2 | Halaman pengaturan: switch, alasan, `reopen_at`, `auto_reopen` | `app/admin/pengaturan/page.tsx` |
| 3.3 | Cek `is_open` di halaman `/` → render form atau halaman tutup | `app/page.tsx` |
| 3.4 | Halaman tutup: alasan + kapan dibuka | `app/tutup/page.tsx` |
| 3.5 | Banner merah di dashboard saat tutup | `app/admin/layout.tsx` |
| 3.6 | Auto-reopen: cek `reopen_at` saat halaman diakses + cron harian Vercel 08.00 WIB | `lib/actions/settings.ts`, `vercel.json` |
| 3.7 | Kamus ID + draft EN (label, validasi, status, banner, auto-reply nanti) | `lib/i18n/{id,en}.ts` |
| 3.8 | Toggle bahasa di header, simpan cookie + localStorage | `components/locale-toggle.tsx` |
| 3.9 | Semua teks lewat kamus (tidak ada string Indonesia hardcode) | seluruh `app/` |
| 3.10 | Format tanggal `id-ID` / `en-GB` | `lib/format.ts` |
| 3.11 | E2E: tutup → form hilang; buka → form muncul; toggle EN → label berubah | `tests/e2e/settings.spec.ts` |

## Keputusan teknis yang mengikat

- **Tidak ada kalender hari libur.** Tanggal libur = switch dimatikan manual.
- **`auto_reopen` default aktif**, jam 08.00 WIB hari kerja berikutnya. Kalau
  petugas mematikan, buku tamu tetap tertutup sampai dibuka manual.
- **Auto-reopen dicek dua lapis**: saat halaman diakses (murah, langsung benar)
  dan cron harian (jaring pengaman kalau tidak ada yang buka halaman).
- **i18n manual, bukan library.** Dua bahasa, satu file masing-masing — library
  i18n menambah berat bundle untuk kebutuhan yang sederhana.
- **EN adalah terjemahan penuh**, bukan sebagian. Istilah yang tidak diterjemahkan:
  nama orang, nama instansi, "BPS".

## Kriteria verifikasi

- [ ] Switch TUTUP → buka `/` di HP → form hilang, muncul alasan + jadwal buka
- [ ] Dashboard menampilkan banner merah selama tutup
- [ ] Switch BUKA → form kembali, banner hilang
- [ ] Set `reopen_at` besok 08.00 → ubah jam server → otomatis buka
- [ ] Toggle EN → semua label, pesan error, dan banner berubah bahasa
- [ ] Toggle EN lalu reload → bahasa tetap EN
- [ ] Tanggal di tiket: "2 November 2026" vs "2 November 2026" (en-GB)
- [ ] Tidak ada teks Indonesia yang tersisa saat EN aktif (cek manual semua layar)

## Yang TIDAK dikerjakan

Chat, export CSV, halaman kelola petugas.

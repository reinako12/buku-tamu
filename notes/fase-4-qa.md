# Fase 4 — Catatan QA

Tanggal uji: 3 November 2026
Lingkungan: produksi `https://bukutamu.grrifixn.my.id` (Next.js 15.5.28, Chromium 141
lewat Playwright, viewport emulasi). Perangkat fisik belum diuji — lihat "Yang belum diuji".

## Responsif

| Viewport | Halaman | Scroll horizontal | Catatan |
|---|---|---|---|
| 390×844 | beranda, tiket, dashboard, pengaturan | 0 px | strip statistik membungkus (5 status), tidak terpotong |
| 768×1024 | semua | 0 px | daftar tamu tetap satu kolom |
| 1024×768 | semua | 0 px | aksi baris pindah ke kanan |
| 1440×900 | semua | 0 px | lebar maksimum kontainer terkunci |

Daftar tamu memakai `ul.ledger` (bukan tabel), jadi di layar kecil otomatis
jadi kartu. Tidak ada perubahan struktur yang diperlukan untuk 4.1/4.2.

## Aksesibilitas

- Semua input punya `label` terkait (`htmlFor`); hasil audit: 0 input tanpa label.
- Urutan Tab di beranda: 11 perhentian (EN → nama → WhatsApp → kategori → instansi
  → gender → tujuan → keterangan → kirim → tautan kebijakan → footer). Semua
  punya `:focus-visible` (outline 2px primer, offset 2px).
- Target sentuh: tombol bahasa dinaikkan ke 44 px; tombol aksi lain ≥ 40 px.
- `aria-live="polite"` + `aria-atomic` pada strip statistik dashboard supaya
  perubahan jumlah status dibacakan; `role="status"` pada kerangka muat.
- Radio gender tetap satu grup `fieldset` + `legend`; ikon Mars/Venus `aria-hidden`.

## Kontras (WCAG AA)

Diukur dari warna terhitung (`getComputedStyle`), bukan perkiraan:

- Beranda: 37 elemen teks, 0 gagal (ambang 4.5:1 teks normal, 3:1 teks besar)
- Dashboard: 67 elemen teks, 0 gagal

Warna yang paling mepet: teks sekunder `#5a6572` di atas `#f7f8fa` ≈ 5.1:1,
masih lolos. Tidak ada pengecualian yang perlu dicatat.

## Cetak tiket (A6)

- `@page { size: A6 portrait; margin: 8mm }` — area cetak ± 366×529 px.
- Kartu tiket terukur 348×365 px, semua `.no-print` (tombol, tautan bantu) hilang.
- Tidak ada elemen terpotong; nomor antrian tetap ukuran besar dan terbaca.

## Jaringan lambat (3G: 400 ms RTT, 400 kbps)

- Muat beranda pertama: 4.8 s
- Isi form → tekan kirim → tiket tampil: 5.9 s (target rencana < 5 s)
- Tanpa throttle: muat tiket 0.85–1.13 s; kirim < 1 s

Catatan: 5.9 s masih di atas target. Penyebab utamanya unduhan aset halaman tiket
(± 103 kB JS) setelah pengalihan. Kalau di HP asli terasa lambat, langkah
berikutnya: hilangkan komponen klien dari halaman tiket (tombol bahasa jadi
tautan `?lang=`, tombol cetak tetap) supaya JS halaman itu turun.

## Perbaikan yang dikerjakan di fase ini

1. `loading.tsx` untuk dashboard dan tiket (kerangka `.skeleton`, hormati
   `prefers-reduced-motion`)
2. `error.tsx` (client, dua bahasa) + `not-found.tsx` kustom dua bahasa
3. `aria-live` pada statistik, `role="status"` pada kerangka muat
4. Tombol bahasa 36 → 44 px
5. Middleware: rute publik tidak lagi memanggil Supabase Auth (hemat satu
   perjalanan jaringan tiap kunjungan tamu)
6. `createVisit`: ambil IP dan status buka/tutup bersamaan; pesan batas laju
   dan buku-tamu-tutup jadi kode bahasa, bukan teks Indonesia mentah
7. Statistik dashboard menampilkan `Batal`

## Yang belum diuji (butuh perangkat asli)

- Android lama (mis. Chrome 90–100) dan iOS Safari — emulasi Chromium tidak
  mewakili keduanya. Pemilik proyek akan mencoba di HP sendiri sebelum deploy.
- TalkBack / VoiceOver: struktur sudah siap (label, `aria-live`), pembacaan
  aktual belum diverifikasi di perangkat.
- Keyboard fisik pada HP (tombol muncul/menutup) — relevan nanti saat fitur chat.

## Kesimpulan gate

Layar 390–1440 bersih, kontras lolos, cetak A6 rapi, console produksi tanpa galat.
Satu kriteria belum terpenuhi: submit di 3G 5.9 s (target 5 s) — perlu keputusan
sebelum deploy: optimalkan halaman tiket atau terima angka ini.

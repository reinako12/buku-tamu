# 2026-11-02 — Keputusan awal proyek buku tamu

Diskusi dengan pembimbing (lewat Alixa) selesai. Plan v2 ditulis.

## Yang diputuskan

- **Demo, bukan produksi.** Tidak ada data nyata sampai disetujui.
- Hosting **Vercel + Supabase cloud**, akun pribadi Alixa.
- Domain demo **bukutamu.grrifixn.my.id**.
- Tamu pakai **HP sendiri** (scan QR di meja resepsionis). Tidak ada tablet/kiosk.
- Fallback: **petugas input manual** dari dashboard.
- Panggilan **lisan** oleh resepsionis; aplikasi hanya mencatat status.
- Nomor antrian **untuk verifikasi**, tampil angka besar — bukan urutan panggilan.
- Hari libur = **switch BUKA/TUTUP manual** (bukan kalender tanggal).
- Jam istirahat / di luar jam = form tetap bisa submit + info jam buka.
- **1 akun resepsionis**, notif di tab (bunyi + judul berkedip + badge).
- **Tailwind 3.5**, bukan v4 — karena target browser 5 tahun ke belakang.
- Bahasa ID + toggle EN penuh (draft EN dibuat Alixa/Hermes, direview user).

## Yang dibuang dari scope

Fotokopi KTP, tanda tangan digital, alamat, email, jabatan, survei kepuasan,
display TV/papan antrian, rekap & retensi otomatis, tata letak QR fisik.

## Alasan penting (jangan diubah tanpa diskusi ulang)

1. **Tailwind 4 tidak dipakai** karena baseline-nya Safari 16.4/Chrome 111 (2023),
   sementara target tamu HP lama. Ganti ke v4 = risiko layout rusak di lapangan.
2. **Tidak ada kalender hari libur.** Daftar tanggal manual selalu basi
   (cuti bersama berubah tiap tahun). Switch manual + auto-reopen lebih aman.
3. **Tamu tidak pakai login/anon key.** Semua akses lewat server action + token tiket,
   supaya data tamu lain tidak bisa dibaca dari browser.
4. **Panggilan lisan** berarti chat bukan kanal utama panggilan — jangan tambah fitur
   "nomor dipanggil" tanpa mengubah alur ini.

## Terbuka / nanti

- Transfer akun (Supabase project → organisasi, Vercel project) didokumentasikan
  di `docs/TEKNIS.md` sebelum serah terima.
- Kalau nanti jadi produksi: project Supabase baru, jangan bersih-bersih tabel demo.
- Jam layanan masih hardcode (Senin–Kamis 08–16 istirahat 12–13, Jumat 08–16.30
  istirahat 12–13.30). Kalau berubah, jadi edit config + deploy ulang.

## Prasyarat eksekusi

- Akses DNS `grrifixn.my.id` (buat CNAME ke Vercel).
- Akun Supabase + Vercel aktif.
- Konfirmasi "gas" dari user sebelum Fase 0.

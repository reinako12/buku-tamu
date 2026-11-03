# Evaluasi desain v2 — setelah audit dengan skill `ui-ux-pro-max` + `frontend-design`

Tanggal: 3 November 2026
Cakupan: halaman tamu (`/`), tiket (`/t/[token]`), masuk (`/masuk`), dashboard (`/dashboard`), tutup (`/tutup`)

## Kenapa direvisi

Versi pertama (v1) secara fungsi sudah jalan, tapi bentuknya mengikuti pola yang sama
dengan hampir semua UI hasil generator: kartu putih seragam, sudut membulat, label
huruf besar ber-tracking lebar di atas judul, dan pemisah berupa titik tengah
(`Selasa, 3 November · Petugas`). Pola itu bukan salah secara teknis, tapi tidak
mengatakan apa pun tentang objek yang sedang dibangun: buku tamu kantor BPS.

Arah v2: **formulir kantor dan tiket antrian kertas.** Garis tipis, kolom formulir
yang tegas, nomor antrian seperti angka pada tiket, bukan gradien dan bayangan.

## Temuan audit dan tindakannya

- Label huruf besar ber-tracking lebar ("BADAN PUSAT STATISTIK") di atas setiap judul — dihapus, diganti masthead dua baris dengan garis bawah tipis. Huruf besar semua melemahkan hierarki karena tidak ada beda tinggi huruf.
- Pemisah titik tengah pada baris meta — dihapus. Data dipisah koma atau baris sendiri.
- Kartu putih membulat untuk setiap tamu di dashboard — diganti daftar buku besar (ledger) dengan garis pemisah rambut. Empat kartu identik membuat semua tamu terlihat sama penting.
- Tiga tombol terisi sama kuat per baris (Panggil/Layani/Batalkan) — sekarang satu aksi utama yang terisi, sisanya tautan tenang. Aksi utama ditentukan urutan alur, bukan selera.
- Tiket berbentuk kartu membulat biasa — sekarang berbentuk tiket: garis sobek putus-putus dengan cekungan di kedua sisi, nomor antrian huruf monospace, label status seperti cap.
- Font bawaan Inter — diganti Plus Jakarta Sans (karya Tokotype, dirancang untuk konteks Indonesia) untuk teks, dan JetBrains Mono untuk semua angka antrian/waktu. Angka monospace membuat kolom nomor rata secara alami.
- Radius dan bayangan berlebihan — radius 2px pada input/tombol (formulir resmi memang tajam), tanpa bayangan kecuali lembar tiket.
- Empat belas animasi kecil — disisakan satu: baris tamu baru masuk. Sisanya statis.

## Token yang dipakai

- Warna: `primary #003C80` (biru BPS, tetap), `ink #121A26`, `ink-muted #5A6572`, `paper/surface #FFFFFF`, `canvas #EEF1F4`, `border #D7DDE5`, `warning #9A5B12`, `success #1F630E`, `danger #B7163E`
- Radius: `xs 2px` (input, tombol, tiket), `sm 3px`, `md 6px`
- Spasi: kelipatan 4 (`2xs 4`, `xs 8`, `sm 12`, `md 16`, `lg 24`, `xl 32`, `2xl 48`)
- Tinggi target sentuh minimum: 44px untuk semua tombol dan input
- Tipografi: display 32/38, heading-page 24/30, heading-card 18/26, body-md 15/24, body-sm 13/20, caption 12/18

## Batasan yang dipertahankan

- Biru BPS `#003C80` tetap jadi warna utama karena acuan desain adalah situs BPS resmi.
- Struktur formulir tetap satu kolom: tamu mengisi sambil berdiri di depan meja resepsionis.
- Tidak ada ilustrasi dekoratif atau ikon stok. Satu-satunya unsur grafis adalah garis dan angka.

## Verifikasi

- `npm run typecheck` bersih, `npm run build` sukses
- Uji unit 28 lulus
- Uji browser 390px: tanpa scroll horizontal, tidak ada target sentuh di bawah 40px
- Alur submit → tiket → dashboard realtime diuji ulang setelah perubahan visual

## Perubahan lanjutan (3 November 2026)

- Kolom jadi lebih membulat: 8px (input, lembar, tombol, tiket), mengikuti referensi formulir DKP Jatim yang dipakai pemilik proyek sebagai acuan keterbacaan.
- Label "Kontak WhatsApp" (sebelumnya "Nomor HP / WhatsApp"), tanda wajib tidak boleh jatuh ke baris sendiri (spasi tak-terputus).
- Susunan label-di-kiri hanya aktif di 1024px ke atas; di bawahnya label di atas karena kolom label tidak cukup.
- Tambah **jenis kelamin** (laki-laki / perempuan) sebagai pilihan tunggal bergaya pil, wajib diisi.
- **Jumlah orang dihapus**: satu tamu satu orang. Kolom `person_count` tetap ada di database (default 1) demi kompatibilitas data lama, tapi tidak lagi ditanyakan.

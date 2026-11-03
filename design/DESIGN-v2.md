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

## Bahasa (3B)

- Toggle ID/EN di kepala setiap halaman; pilihan disimpan di cookie `locale`.
- Semua teks lewat `lib/i18n/dict.ts` (dua kamus, kunci sama). Tidak ada string
  bahasa Indonesia yang tersisa di komponen.
- Tanggal memakai `Intl` sesuai bahasa: `id-ID` (Senin, 3 November 2026) dan
  `en-GB` (Monday, 3 November 2026). Zona waktu tetap Asia/Jakarta.
- Pesan validasi dikirim server sebagai kode (`err.nameShort`), diterjemahkan di
  klien — jadi bahasa berganti tanpa perlu mengubah skema.

## Dashboard petugas (3C) — papan meja, bukan dasbor statistik

Tujuan layar ini satu: petugas tahu **siapa yang harus dilayani sekarang** tanpa
membaca satu baris pun dari atas. Semua keputusan di bawah mengikuti itu.

Struktur dari atas ke bawah:

1. **Kop** — nama lembaga, satu baris; tautan bahasa, pengaturan, keluar.
   Nama unit disembunyikan di layar sempit supaya kop tidak jadi dua baris.
2. **Judul + tombol "Tamu manual"** sebaris. Tombol ini satu-satunya aksi
   utama halaman dan tetap terlihat tanpa menggulir.
3. **Papan meja** (`.callboard`) — satu lembar dengan garis atas 3px biru.
   Isinya: label keadaan ("Sedang dilayani" / "Sudah dipanggil" / "Meja
   kosong"), nomor antrian 60px monospace, nama, asal+tujuan, lalu satu tombol
   besar sesuai langkah berikutnya (Layani / Selesaikan / Panggil berikutnya).
   Kalau meja kosong tetapi masih ada yang menunggu, papan menampilkan
   "Berikutnya" + lama menunggu, jadi tombol panggil tidak pernah jauh.
4. **Garis hitung** — Menunggu / Dipanggil / Dilayani / Selesai / Batal, angka
   monospace, ditambah penanda sambungan realtime di ujung kanan.
5. **Antrian aktif** — hanya tamu yang belum selesai. Nomor 20px, waktu masuk
   kecil di bawah nomor, status sebagai cap garis, lama menunggu untuk yang
   masih menunggu.
6. **Selesai dan batal** — `<details>` tertutup. Tamu yang sudah beres tidak
   boleh bersaing dengan yang masih menunggu.

Aturan yang dipegang:

- **Satu aksi utama per baris** (isi penuh). Aksi pendamping memakai `.row-link`
  (teks bergaris, tinggi 40px) — bukan tiga tombol sejajar dengan bobot sama.
- **Tidak ada kartu bertumpuk.** Daftar tetap buku besar bergaris rambut
  (`.ledger`), konsisten dengan halaman tamu.
- **Tanpa label huruf besar.** Label keadaan ditulis sebagai kalimat.
- **Ukuran baris dijaga**: di 1440px satu baris tamu ±102px (sebelumnya 213px),
  di 390px ±175px. Diukur lewat `getBoundingClientRect`, bukan perkiraan.
- **Tanpa gulir mendatar** di 390 / 768 / 1440 (`scrollWidth == clientWidth`).
- Kontras teks diperiksa otomatis: 0 pelanggaran ambang WCAG AA, tidak ada
  sasaran sentuh di bawah 40px.

**Penomoran halaman (3D).** Daftar tamu dipecah **5 baris per halaman**, di
kedua bagian (antrian aktif dan selesai/batal). Penanda: "1–5 dari 12" di kiri,
tombol Sebelumnya/Berikutnya di kanan — di layar sempit keterangan "Halaman 1
dari 2" disembunyikan supaya tetap satu baris. Halaman tidak muncul kalau
daftarnya muat satu halaman. Kalau tamu baru masuk lewat realtime, daftar
otomatis membuka halaman tempat baris baru itu berada; kalau baris di halaman
sekarang habis (mis. semua diselesaikan), halaman mundur sendiri.

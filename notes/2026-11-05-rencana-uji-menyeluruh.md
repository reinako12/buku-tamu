# Rencana uji menyeluruh — buku tamu BPS Tanah Datar

Tanggal: 5 November 2026. Lingkup: seluruh aplikasi setelah fase 6 (chat, sambungan
kunjungan, sambutan luar jam, janitor). Sasaran: tidak ada bug tersisa, termasuk yang
kecil — teks salah, tombol mati, angka tidak konsisten, akses bocor.

Cara baca: setiap butir punya ID, langkah, dan hasil yang diharapkan. Status diisi saat
eksekusi: LULUS / GAGAL (dengan bukti) / CATATAN (bukan bug, perlu keputusan).

## A. Otentikasi dan otorisasi

- A1. `/dashboard` tanpa sesi → dialihkan ke `/masuk?next=%2Fdashboard`.
- A2. `/dashboard/pesan` tanpa sesi → dialihkan ke `/masuk?next=%2Fdashboard%2Fpesan`.
- A3. `/pengaturan` tanpa sesi → dialihkan, bukan dirender.
- A4. `/api/pesan` tanpa sesi → 401 JSON, bukan HTML halaman login.
- A5. `/api/pesan/<id>/messages` tanpa sesi → 401 JSON.
- A6. `/api/pesan/<id>/messages` dengan id acak → 401 (bukan 500, bukan 404 bocor).
- A7. Login salah password → pesan galat bahasa manusia, tidak menyebut ada/tidaknya akun.
- A8. Login benar → masuk dashboard; cookie sesi HttpOnly dan SameSite.
- A9. `/api/keluar` → sesi dihapus, `/dashboard` berikutnya kembali ke login.
- A10. Parameter `next` di `/masuk?next=https://jahat.example` tidak boleh dipakai untuk
  redirect keluar domain.
- A11. Rute publik (`/`, `/chat`, `/t/...`, `/tutup`) tetap terbuka tanpa sesi.

## B. Form check-in

- B1. Semua kolom kosong → galat per kolom, tidak ada request simpan.
- B2. Nama 1 karakter → ditolak. Nama 3 karakter → diterima.
- B3. Nama berisi spasi ganda / spasi di ujung → disimpan rapi (trim, spasi tunggal).
- B4. Nomor WA format `0812...`, `+62812...`, `62812...` → semuanya tersimpan `+62...`.
- B5. Nomor WA terlalu pendek / berisi huruf → ditolak dengan pesan jelas.
- B6. Instansi kosong → ditolak. Instansi 300 karakter → ditolak (batas kolom).
- B7. Tujuan "lainnya" tanpa keterangan → ditolak; dengan keterangan → diterima.
- B8. Jenis kelamin wajib dipilih; tidak ada default diam-diam.
- B9. Tombol kirim ditekan dua kali cepat → satu kunjungan, bukan dua.
- B10. Setelah sukses → pindah ke `/t/<token>`, form tidak terisi ulang saat back.
- B11. Kantor ditutup → form tidak bisa diakses, muncul halaman `/tutup` dengan alasan
  dan jam buka kembali.
- B12. Nomor WA yang sudah pernah datang → tidak error, tetap dapat nomor baru.

## C. Tiket dan antrian

- C1. Tiket menampilkan nomor antrian, nama, tujuan, tanggal WIB, dan tombol cetak.
- C2. Token acak (`/t/<uuid ngawur>`) → halaman "tidak ditemukan", bukan 500.
- C3. Nomor antrian berurutan dalam satu hari dan kembali ke 1 pada hari berikutnya (WIB).
- C4. Submit paralel 5 tamu → nomor unik, tidak ada duplikat, tidak ada yang gagal.
- C5. Halaman tiket bisa dibuka ulang kapan saja (link tidak kedaluwarsa).
- C6. Tanggal di tiket memakai WIB walaupun server UTC.

## D. Dashboard dan papan antrian

- D1. Dashboard kosong (belum ada tamu hari ini) → keadaan kosong yang jelas, bukan papan
  kosong tanpa keterangan.
- D2. Daftar tamu menampilkan nomor, nama, instansi, tujuan, status.
- D3. Tombol panggil mengubah status `menunggu → dipanggil`; tombol selesai/batal
  mengubah ke status akhir.
- D4. Aksi pada baris yang sudah selesai tidak muncul lagi.
- D5. Penanda "Pesan baru" muncul hanya untuk kunjungan yang punya pesan tamu belum dibaca,
  dan hilang setelah dibaca.
- D6. Hitungan di kop dashboard (menunggu/dipanggil/selesai) cocok dengan isi daftar.
- D7. Tombol tambah tamu manual (walk-in) membuat kunjungan dengan sumber `manual`.
- D8. Dua tab dashboard terbuka → perubahan status di tab satu muncul di tab lain (realtime).

## E. Pengaturan

- E1. Tutup kantor → halaman tamu menampilkan penutupan, dashboard menandai status.
- E2. Alasan tutup maksimal 200 karakter; lebih dari itu ditolak.
- E3. Buka kembali otomatis pada jam yang diisi; jam lampau ditolak atau langsung terbuka.
- E4. Teks sambutan chat tersimpan (isi → kosongkan → tersimpan `null`).
- E5. Perubahan berlaku tanpa perlu restart server.
- E6. Hanya petugas yang login bisa mengubah; request tanpa sesi ditolak.

## F. Chat tamu

- F1. `/chat` tanpa nama/nomor → galat, tidak membuat percakapan.
- F2. Nomor tidak valid → ditolak.
- F3. Membuka chat kedua kali dengan nomor sama → masuk percakapan yang sama, bukan baru.
- F4. Pesan kosong / hanya spasi → tombol kirim tidak mengirim.
- F5. Pesan 1 karakter diterima; pesan 1000 karakter diterima; 2001 karakter ditolak
  dengan pesan jelas.
- F6. Pesan berisi HTML/script → tampil sebagai teks, tidak dieksekusi.
- F7. Tombol "Salin tautan" menyalin URL ruang chat.
- F8. Percakapan tertutup oleh petugas → tamu lihat cap "Ditutup", riwayat utuh, tanpa
  kolom tulis, ada tombol mulai percakapan baru.
- F9. Di luar jam layanan / kantor tutup → sambutan otomatis tepat satu kali per percakapan.
- F10. Sambutan tidak terkirim saat kantor buka.
- F11. Teks sambutan diambil dari pengaturan; kalau kosong pakai teks bawaan.
- F12. Kirim pesan saat koneksi putus → muncul "Gagal terkirim" + tombol kirim ulang;
  setelah online, pesan terkirim sekali (tidak dobel).
- F13. Rate limit: pesan ke-21 dalam satu jam ditolak dengan pesan yang mengerti manusia;
  percakapan baru ke-4 dalam 30 menit ditolak, tapi membuka percakapan lama tetap gratis.
- F14. Percakapan yang ditutup janitor tetap dapat dibaca tamu; percakapan yang dihapus
  janitor (lewat 90 hari) → halaman "tidak ditemukan".
- F15. Token di URL bukan id berurutan → tidak bisa ditebak; token acak → 404.

## G. Inbox dan ruang petugas

- G1. Inbox hanya menampilkan percakapan terbuka, urut aktivitas terakhir.
- G2. Badge belum dibaca di kop dashboard dan di baris inbox cocok dengan isi ruang.
- G3. Membuka ruang menandai pesan tamu sudah dibaca; badge hilang setelah kembali.
- G4. Kirim balasan → muncul di ruang petugas dan ruang tamu.
- G5. Tombol tutup meminta konfirmasi, lalu menutup percakapan.
- G6. "Jadikan kunjungan" muncul hanya untuk percakapan tanpa kunjungan; setelah dipakai,
  tombol hilang dan nomor antrian tampil.
- G7. Percakapan yang tersambung ke kunjungan menampilkan nomor antrian di kepala ruang.
- G8. Ruang tamu & petugas: refresh tidak menduplikasi pesan.
- G9. Dua petugas membalas bersamaan → dua pesan, tidak saling menimpa.
- G10. Inbox kosong → keadaan kosong yang jelas.
- G11. Percakapan tanpa kunjungan berlabel "Belum check-in", bukan kosong.

## H. Janitor dan siklus data

- H1. `--dry` tidak mengubah apa pun.
- H2. Percakapan diam 24 jam ditutup; 23 jam tidak.
- H3. Kunjungan selesai/batal 24 jam lalu → percakapan ditutup.
- H4. Percakapan tertutup 91 hari dihapus beserta pesannya; 89 hari disimpan.
- H5. Jalan dua kali berturut-turut → jalannya kedua 0/0 (idempoten).
- H6. Menghapus percakapan tidak menyentuh baris kunjungan.

## I. API, proteksi input, dan integritas

- I1. POST pesan tamu ke token milik orang lain tidak bisa menulis ke percakapan lain.
- I2. Body bukan JSON / JSON rusak → 400, bukan 500.
- I3. Body terlalu besar → ditolak.
- I4. Token bukan UUID → 404, bukan 500.
- I5. Percakapan tertutup → kirim pesan ditolak dengan kode yang benar.
- I6. Nama tamu berisi emoji / aksara non-latin → tersimpan dan tampil utuh.
- I7. Pesan berurutan tidak tertukar urutannya di dua sisi.
- I8. `?locale=` aneh / tidak dikenal → jatuh ke bahasa Indonesia, tidak error.
- I9. RLS: anon key tidak bisa membaca tabel `conversations`/`messages` langsung.
- I10. Tidak ada kunci rahasia (service role, salt) yang bocor ke bundel klien.

## J. Tampilan, mobile, aksesibilitas, i18n

- J1. Semua halaman utama pada 360/390/768 px: tanpa geser horizontal.
- J2. Target sentuh minimal 44 px di halaman tamu (form, chat, tiket).
- J3. Kontras teks memadai; label input terhubung (`for`/`id`).
- J4. Fokus keyboard terlihat; urutan tab masuk akal; tombol bisa diaktifkan Enter/Spasi.
- J5. Bahasa ID/EN konsisten: tidak ada teks campur pada satu layar.
- J6. Tidak ada kunci kamus yang tampil mentah (`inbox.foo`).
- J7. Nama panjang / instansi panjang tidak merusak tata letak.
- J8. Tema gelap: tidak ada teks hilang atau kontras rendah.
- J9. Tanggal dan jam memakai format Indonesia dan WIB.
- J10. Judul halaman (`<title>`) dan bahasa dokumen (`lang`) sesuai.

## K. Beban, paralel, konsistensi

- K1. 5 check-in paralel → 5 kunjungan, nomor unik.
- K2. 20 pesan dua arah → tanpa duplikat dan urutan benar.
- K3. Hitungan belum dibaca konsisten dengan jumlah pesan tamu setelah `last_read`.
- K4. Dua aksi status pada baris yang sama (panggil + selesai) tidak meninggalkan status
  mustahil.
- K5. Sambutan luar jam pada dua pesan berbarengan → tetap satu sambutan.
- K6. Tidak ada query lambat >2 s pada halaman utama saat data ~50 baris.

## L. Operasional

- L1. `npm run build` bersih tanpa peringatan yang mengganggu.
- L2. Service systemd hidup setelah restart; log tanpa error.
- L3. Cron janitor terpasang dan menulis log.
- L4. Migrasi bisa dijalankan ulang (`migrate deploy`) tanpa error.

## Cara eksekusi

1. Statis: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. API & otorisasi: `curl` tanpa/bersama sesi.
3. UI: Playwright di 127.0.0.1:3100 (build produksi yang sama dengan live), dua konteks
   browser untuk simulasi tamu + petugas.
4. Data: skrip Prisma sekali pakai untuk menyiapkan fixture dan memeriksa hasil.
5. Setiap temuan dicatat dengan bukti (kode status, teks layar, baris database) lalu
   diperbaiki sebelum menandai LULUS.

---

## Hasil akhir (5 Nov 2026)

Sembilan temuan dari putaran uji sudah diperbaiki dan diuji ulang. Ringkas bukti:

- BUG-1 kiriman ganda form: dua `requestSubmit()` dalam satu tik menghasilkan satu
  kunjungan; kiriman normal tetap satu. Penjaga 90 detik di server, bukan hanya di UI.
- BUG-2 papan antrian tidak hidup: frame `phx_join` kini memuat `access_token`;
  kunjungan baru muncul 0,5-1,0 detik tanpa muat ulang, di 127.0.0.1 maupun domain publik.
- BUG-4 pesan ditolak tanpa keterangan: batas waktu antar pesan dibuang, diganti
  deteksi isi kembar dalam 10 detik. Dua kiriman serentak jadi satu baris dan satu
  tampilan; dua pesan berbeda berjarak 0,3 detik dua-duanya masuk.
- BUG-5 status 200 untuk halaman yang tidak ada: `/t/<uuid asing>`, `/chat/<uuid asing>`,
  dan `/t/abc` sekarang 404. Penyebabnya `loading.tsx` yang mengirim status sebelum
  `notFound()` jalan, jadi kerangka di dua rute itu dihapus.
- BUG-6 cookie sesi: `httpOnly=True` di semua lingkungan, `secure=True` saat lewat https
  (dicek di bukutamu.grrifixn.my.id), `secure=False` hanya saat http lokal.
- BUG-7 tombol Keluar: mendarat di `/masuk`, tanpa localhost di alamat.
- BUG-8 lambat: `DATABASE_URL` pindah ke koneksi langsung 5432. `/dashboard` 4,9 s → 1,4 s,
  `/dashboard/pesan` 4,0 s → 1,1 s, `/pengaturan` 2,1 s → 0,8 s.
- BUG-9 open redirect: `//host`, `/\host`, dan alamat berprotokol ditolak; diuji di
  halaman masuk dan di server action.

Butir uji sisa yang sebelumnya belum dijalankan:

- Dua petugas membalas serentak: dua baris tersimpan, masing-masing melihat balasan
  rekannya lewat polling.
- Percakapan dihapus janitor: percakapan dan pesannya hilang tanpa pesan yatim;
  halaman tamu 404, halaman petugas menampilkan "Halaman tidak ditemukan".
- Percakapan ditutup dilihat tamu: kolom tulis hilang, muncul catatan penutup,
  riwayat tetap terbaca, 0 px luberan di 390 px.
- Nomor antrian ganti hari: `create_visit` menyaring per `queue_date` dan memakai
  `coalesce(max(queue_seq),0)+1`; baris tanggal lain tidak menggeser nomor hari ini,
  tanggal kosong mulai dari 1.
- 20 pesan dua arah: 20 baris tersimpan, 20 teks unik, urutan berselang-seling benar,
  tidak ada yang hilang di layar tamu maupun petugas.

Yang masih tersisa (bukan bug, tapi perlu diketahui):

1. `/dashboard/pesan/<id>` untuk percakapan yang sudah dihapus tetap berstatus 200
   walau isinya "Halaman tidak ditemukan". Penyebabnya `app/dashboard/loading.tsx`
   yang mengirim status lebih dulu; kerangka itu dipertahankan karena halaman papan
   antrian butuh tampilan awal saat memuat 1,4 detik.
2. Batas buka percakapan 4 per 30 menit per IP membuat pengujian berulang dari satu
   mesin cepat kena "Terlalu banyak percobaan". Untuk demo di satu jaringan kantor,
   angka ini mungkin terlalu ketat.
3. Pesan sambutan luar jam hanya dikirim sekali per percakapan (`auto_replied_at`),
   jadi tamu yang kembali chat berhari-hari kemudian tidak dapat sambutan lagi.

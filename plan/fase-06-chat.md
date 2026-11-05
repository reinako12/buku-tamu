# Fase 6 — Live chat tanpa nomor antrian

Chat tidak lagi menempel ke kunjungan. Tamu cukup isi nama dan nomor WhatsApp,
langsung dapat ruang chat. Kalau nanti dia benar-benar datang dan check-in dengan
nomor yang sama, percakapan itu disambungkan ke kunjungannya.

Keputusan yang mengikat seluruh fase ini:

- Satu percakapan = satu nomor WhatsApp. Satu nomor hanya boleh punya satu
  percakapan terbuka (dijaga partial unique index, bukan cuma dicek di kode).
- Tamu tidak pernah menulis langsung ke database. Semua lewat server action.
- Pindah pesan pakai polling 3 detik. Realtime tidak dipakai di MVP karena tabel
  chat tidak punya policy untuk anon, dan jaringan kantor sering memblokir
  websocket.
- Identitas tamu adalah nomor WA + nama, tanpa OTP. Konsekuensinya nomor yang
  tahu nama bisa membuka percakapan. Untuk demo ini diterima, dicatat sebagai
  batasan.
- Tidak ada lampiran file. Tidak ada chat antar petugas.

Dikerjakan dalam 5 sub-fase. Tiap sub-fase berhenti, diuji, di-commit, di-push,
lalu diberi tag `fase-6a` sampai `fase-6e`. Jangan lanjut sebelum gate lolos.

---

## 6a — Fondasi data (0,5 hari)

Yang dibuat:

1. Migrasi `0004_conversations` lewat `npx prisma migrate dev --name conversations`
   (port 5432, bukan pooler).
2. Tabel `conversations`: token uuid unik, `visit_id` nullable unik, nama, nomor
   ternormalisasi, status, sumber, `last_message_at`, `staff_last_read_at`,
   `guest_last_read_at`, `auto_replied_at`, `closed_at`.
3. Tabel `messages`: `seq bigserial` sebagai kursor, `id uuid`, `conversation_id`,
   `sender`, `staff_id` nullable, `body`, `created_at`.
4. Index: `(status, last_message_at desc)`, `(conversation_id, seq)`,
   `(guest_phone)`, plus partial unique `(guest_phone) where status = 'terbuka'`.
5. RLS aktif tanpa policy untuk dua tabel ini — akses hanya lewat Prisma dari
   server, sama seperti tabel lain di proyek ini.
6. `lib/phone.ts`: normalisasi `08xx`, `+62`, `62`, spasi, dan tanda hubung jadi
   `+62xxxxxxxxxx`, plus validasi panjang 10–15 digit. Bentuknya sengaja ikut
   `visits.phone` yang sudah `+62`, bukan `62`, supaya pencocokan nomor di 6d
   tinggal `where guest_phone = visits.phone`.
7. `lib/actions/chat.ts` — `bukaPercakapan(nama, nomor)`: normalisasi, cari
   percakapan terbuka nomor itu, kalau tidak ada bikin baru, kembalikan token.
   Rate limit 3 percakapan baru per IP per 30 menit.

Gate:

- `npm test` lolos, termasuk test baru untuk normalisasi nomor.
- Coba buka percakapan dua kali dengan nomor sama → token yang dikembalikan sama.
- Coba nomor `0812-3456-7890` dan `+6281234567890` → dianggap satu nomor.

---

## 6b — Chat tamu (1 hari)

Yang dibuat:

1. `/chat` — form nama + nomor WA. Tanpa tiket, tanpa nomor antrian.
2. `/chat/[token]` — ruang chat: riwayat 50 pesan terakhir, autoscroll, muat
   pesan lebih lama, tombol salin link.
3. Server action `kirimPesanTamu(token, body)`: token valid, percakapan masih
   terbuka, body 1–1000 karakter, rate limit 1 pesan per 2 detik dan 20 pesan
   per jam per nomor.
4. `app/api/chat/[token]/messages/route.ts` — `GET ?after=<seq>`, mengembalikan
   pesan baru saja, dipakai polling 3 detik.
5. Komponen `components/chat/*`: bubble tamu/petugas/sistem, waktu, status
   mengirim/gagal, optimistic insert yang diganti baris asli setelah server
   menjawab, dedupe berdasarkan `seq`.

Gate:

- Dari HP sendiri: kirim 20 pesan, refresh halaman → riwayat utuh, tidak dobel.
- Kirim dua pesan beruntun cepat → yang kedua ditolak dengan pesan jelas, bukan
  error mentah.
- Buka link di browser lain → riwayat sama.
- Nomor tidak valid → form menolak sebelum kirim.

---

## 6c — Inbox resepsionis (1 hari)

Yang dibuat:

1. `/dashboard/pesan` — daftar percakapan diurutkan dari pesan terakhir, dengan
   label "Belum check-in" atau "Antrian 12", potongan pesan terakhir, dan badge
   belum dibaca.
2. Room dua kolom di desktop (daftar kiri, chat kanan), satu kolom penuh di HP.
3. Server action `kirimPesanPetugas(conversationId, body)` dan `tandaiDibaca`
   yang mengisi `staff_last_read_at`.
4. Badge unread di nav dashboard, dihitung dari pesan tamu setelah
   `staff_last_read_at`.
5. Tombol "Tutup percakapan" yang mengisi `closed_at` dan mengunci input dua arah.

Gate:

- Kirim dari HP tamu → muncul di PC petugas dalam ≤ 4 detik.
- Badge bertambah saat room tidak dibuka, hilang saat dibuka.
- Buka room yang sama di dua tab → tidak ada pesan ganda, badge tetap benar.
- Percakapan ditutup → tamu melihat keterangan dan input mati.

---

## 6d — Sambung ke kunjungan (0,75 hari)

Yang dibuat:

1. Saat tamu check-in, server mencari percakapan terbuka dengan nomor yang sama
   lalu mengisi `visit_id`. Kalau tidak ada, tidak terjadi apa-apa.
2. Pesan sistem otomatis sekali: "Kunjungan tercatat, nomor antrian N."
3. Di inbox, tombol "Jadikan kunjungan" untuk percakapan tanpa kunjungan:
   membuat baris `visits` (sumber manual, nama dan WA terisi), dapat nomor
   antrian, langsung tersambung ke percakapan.
4. Papan antrian menampilkan penanda kecil kalau kunjungan punya percakapan
   dengan pesan belum dibaca.

Gate:

- Chat dulu, check-in kemudian → percakapan lama tetap ada, ditambah pesan
  nomor antrian, tidak ada percakapan kedua.
- Check-in dulu, chat kemudian → sama, satu percakapan.
- "Jadikan kunjungan" dari inbox → nomor antrian terbit, nama tidak diketik ulang.
- Nomor WA beda saat check-in → percakapan lama tidak ikut tersambung.

---

## 6e — Ketahanan dan penutupan (0,75 hari)

Yang dibuat:

1. Auto-reply di luar jam layanan, sekali per percakapan, teks diambil dari
   `settings`.
2. Penutupan otomatis: percakapan tanpa pesan 24 jam ditutup; percakapan yang
   kunjungannya selesai tetap terbuka 24 jam lalu ditutup. Dijalankan lewat
   perintah berkala tiap 30 menit.
3. Penghapusan percakapan yang sudah ditutup lebih dari 90 hari, beserta
   pesannya (data pribadi).
4. Test E2E dua perangkat: kirim 20 pesan dua arah, latensi, tanpa duplikat
   setelah refresh, perilaku saat koneksi diputus.
5. Catatan batasan di README: tanpa OTP, nomor + nama adalah kunci akses.

Gate:

- Chat di luar jam layanan → auto-reply masuk tepat sekali.
- Diamkan percakapan → tertutup otomatis, tamu bisa mulai percakapan baru.
- Jalankan perintah pembersihan → hanya percakapan lama yang terhapus.

---

## Yang tidak dikerjakan

Lampiran file, emoji picker, typing indicator, status online, notifikasi
WhatsApp, OTP, chat antar petugas, balasan cepat (canned reply).

Typing dan status online bisa ditambah belakangan tanpa mengubah struktur data,
karena keduanya sinyal sementara yang tidak disimpan.

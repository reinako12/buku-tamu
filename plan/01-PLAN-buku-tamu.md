# Rencana Implementasi — Buku Tamu Digital BPS Kabupaten Tanah Datar

> **Status:** v2 — semua keputusan sudah dikonfirmasi. Belum ada kode.
> **Untuk eksekutor:** kerjakan per fase. Tiap task diverifikasi sebelum lanjut.

**Goal:** Tamu BPS Tanah Datar scan QR di meja resepsionis → isi form dari HP sendiri →
dapat nomor verifikasi besar → chat dengan resepsionis sampai dipanggil → status
kunjungan tercatat.

**Scope:** **demo**, bukan produksi lapangan. Tidak ada data nyata sampai disetujui.

**Arsitektur:** Next.js App Router + Supabase (Postgres/Auth/Realtime). Satu codebase,
dua area: `/` publik tanpa login (token tiket), `/admin` untuk resepsionis (login email).

**Stack:** Next.js 15 App Router · TypeScript · **Tailwind 3.5** (bukan v4) · Supabase ·
Zod · Vitest + Playwright.

**Domain demo:** `bukutamu.grrifixn.my.id` (CNAME → Vercel).

---

## 1. Log keputusan (final)

| # | Keputusan | Nilai |
|---|---|---|
| 1 | Hosting | Vercel + Supabase cloud |
| 2 | Data tamu | Disimpan (demo, tanpa masa retensi) |
| 3 | Penerima chat | Resepsionis saja, 1 akun |
| 4 | Device tamu | HP sendiri, tanpa tablet/kiosk |
| 5 | Fallback | Input manual oleh resepsionis |
| 6 | Field opsional | Hanya "keterangan/uraian tujuan" |
| 7 | Nomor antrian | Untuk verifikasi, tampil angka besar (007) |
| 8 | Panggilan | Lisan oleh resepsionis, aplikasi hanya mencatat status |
| 9 | Hari libur | Switch BUKA/TUTUP manual oleh petugas |
| 10 | Jam istirahat | Form tetap bisa submit + info jam buka |
| 11 | Notifikasi petugas | Bunyi + judul tab berkedip + badge angka |
| 12 | Rombongan | Nama ketua + jumlah orang |
| 13 | Kategori instansi | Dropdown kategori + nama instansi bebas |
| 14 | Penanda selesai | Resepsionis |
| 15 | Tampilan nama | Dashboard petugas + HP tamu sendiri |
| 16 | Kembali ke tiket | Link unik + tombol simpan ke WhatsApp (`wa.me`) |
| 17 | Bahasa | ID default + toggle EN penuh |
| 18 | Browser | Chrome 90+ / Safari 15+ (≈5 tahun) |
| 19 | Akun | Pribadi (demo), dokumentasi transfer sebelum serah terima |
| 20 | QR | Tidak diurus (di luar scope aplikasi) |

---

## 2. Jam layanan & status buka-tutup

Dua mekanisme **terpisah**, sengaja dibedakan:

### A. Switch manual "Buku Tamu BUKA/TUTUP" (untuk hari libur)

- Ada di dashboard → **Pengaturan**.
- **TUTUP** = form diblokir total. Halaman publik menampilkan:
  "Buku tamu ditutup" + alasan (opsional, diisi petugas) + kapan dibuka.
- Opsi **buka otomatis**: default **aktif**, jam 08.00 hari kerja berikutnya.
  Bisa dimatikan kalau tutupnya tanpa batas.
- Selama TUTUP, dashboard menampilkan banner merah persisten — pengaman kalau
  petugas lupa membuka kembali.

### B. Jam layanan otomatis (tidak bisa di-toggle)

| Hari | Layanan | Istirahat |
|---|---|---|
| Senin–Kamis | 08.00–16.00 | 12.00–13.00 |
| Jumat | 08.00–16.30 | 12.00–13.30 |
| Sabtu–Minggu | tutup | — |

Perilaku form:

- **Dalam jam layanan** → normal.
- **Jam istirahat** → form **tetap bisa submit**, muncul banner:
  "Kantor sedang istirahat. Layanan dibuka lagi pukul 13.00." (Jumat: 13.30)
- **Di luar jam / akhir pekan** → form **tetap bisa submit**, banner:
  "Di luar jam layanan. Kunjungan diproses [Senin, 3 Nov] pukul 08.00."
- Zona waktu **Asia/Jakarta (WIB)**, dihitung di server, bukan di HP tamu.

**Keputusan gue (yang lu minta dikonfirmasi):** tidak ada halaman kalender libur.
Hari libur cukup switch dimatikan. Alasan: kalender libur manual pasti basi (cuti
bersama berubah tiap tahun), dan satu switch lebih sulit disalahgunakan/dilupakan
daripada daftar tanggal yang tidak pernah di-update. Keduanya tetap dibangun:
switch untuk libur, info jam untuk istirahat/luar jam.

---

## 3. Alur per layar

### L1 — `/` (target QR)

- Mobile-first, satu kolom, maksimal 640px.
- Header BPS (logo + nama instansi), latar `#EEF0F2`, kartu form `#FCFCFC` radius 12.
- Kalau buku tamu TUTUP → langsung halaman L5.
- Kalau buka → form (L2) langsung terlihat, tanpa halaman perantara.
  (Alasan: tamu berdiri di meja resepsionis, jangan suruh klik apa pun.)

### L2 — Form check-in

**Wajib:**
1. Nama lengkap — 2–80 char, huruf/spasi/titik/apostrof
2. Kategori instansi — dropdown: BPS · Pemerintah Daerah · Akademisi · Swasta ·
   Masyarakat/Pribadi · Lainnya
3. Nama instansi — 2–120 char, auto-isi "Pribadi" kalau kategori Masyarakat dipilih
4. No. HP/WA — 8–20 digit, normalisasi ke `+62`
5. Tujuan kunjungan — dropdown: Konsultasi Statistik · Permintaan Data ·
   Kerja Sama · Audiensi · Magang/Penelitian · Lainnya
6. Jumlah orang — stepper 1–50, default 1

**Opsional (collapsed, satu toggle "Tambah keterangan"):**
7. Keterangan/uraian tujuan — 0–500 char

**Tidak ada:** KTP, tanda tangan, alamat, email, jabatan.

**Perilaku:**
- Tamu lama (no. HP cocok) → nama + instansi auto-fill, tampil chip
  "Sepertinya Anda pernah berkunjung. Benar?" dengan tombol koreksi.
- Tombol submit full-width, tinggi 48px, `#003C80`.
- Validasi inline per field, pesan bahasa Indonesia (dan EN kalau toggle aktif).
- Anti-spam: honeypot + rate limit 1 submit / 30 detik per IP.
- Setelah sukses → L3, cookie `visit_token` (httpOnly, 24 jam).

### L3 — `/t/[token]` (tiket tamu)

- **Nomor besar**: angka antrian `007`, font 64–72px weight 700, `#003C80`.
- Di bawahnya: "2 November 2026 · 09.14 WIB".
- Kartu ringkas: nama, instansi, tujuan, jumlah orang.
- **Badge status**: Menunggu (`#EB891B`) · Dipanggil (`#0093DD`) ·
  Dilayani (`#1F630E`) · Selesai (`#575757`) · Batal (`#B7163E`).
- Tombol utama: **Chat Petugas** (badge unread).
- Tombol sekunder: **Simpan tiket ke WhatsApp** → buka `wa.me/?text=<link tiket>`.
- Tombol: **Cetak/screenshot tiket** (print CSS A6).
- Status update realtime tanpa refresh.
- Saat status `Selesai` → tampil "Kunjungan selesai. Terima kasih." + chat read-only.

### L4 — `/t/[token]/chat`

- Header: "Resepsionis BPS Tanah Datar" + titik hijau "online" (presence, best-effort).
- Bubble: tamu kiri `#F1F5F9` teks `#111111`; petugas kanan `#003C80` teks putih.
  Radius 12px, maks lebar 80%, timestamp 12px.
- Composer nempel di bawah, `env(safe-area-inset-bottom)` untuk iPhone.
- Kalau di luar jam layanan: input **tetap aktif**, tapi tampil strip
  "Di luar jam layanan — pesan dibalas pada jam kerja."
- Kalau status `Selesai`: input disabled, placeholder "Percakapan ditutup."
- Fallback polling 5 detik kalau websocket gagal.

### L5 — Halaman buku tamu ditutup

- Ikon, judul "Buku tamu ditutup sementara".
- Alasan dari petugas (kalau diisi).
- "Dibuka kembali: Senin, 3 November 2026 pukul 08.00" (kalau auto-buka aktif).
- Tanpa form. Tanpa link ke dashboard.

### A1 — `/admin/login`

- Email + password, Supabase Auth. Tanpa registrasi publik.
- Error generik ("Email atau password salah"), rate limit 5 percobaan/menit.

### A2 — `/admin` (dashboard hari ini)

- Header: tanggal, jumlah tamu hari ini, jumlah menunggu.
- Banner merah kalau buku tamu TUTUP.
- Tabel tamu hari ini: No · Nama · Instansi · Tujuan · Orang · Masuk · Status · Aksi.
- Default urut: terbaru di atas, filter default "Menunggu + Dipanggil".
- Aksi cepat per baris: Panggil · Layani · Selesai · Batal · Buka chat.
- Pencarian nama/instansi/nomor.
- Baris baru masuk realtime + highlight 1 detik + bunyi + judul tab berkedip.
- Tombol: **+ Input Tamu Manual**.
- Responsif: di layar < 768px tabel jadi daftar kartu.

### A3 — `/admin/tamu/[id]` (detail + chat petugas)

- Data tamu lengkap, tombol ubah status, catatan internal (tidak dilihat tamu).
- Panel chat di kanan (desktop) / bawah (mobile).
- Riwayat pesan, indikator "tamu sedang mengetik…", status dibaca.

### A4 — Input tamu manual

- Form sama dengan L2, plus field "Alasan input manual" (opsional).
- Setelah submit → tampilkan nomor + tombol **salin link tiket** (kirim ke tamu
  via WA manual). Tamu yang diinput manual tetap bisa chat dari HP-nya sendiri
  kalau link dibagikan.
- Ditandai `source = 'manual'` di data untuk membedakan dari self check-in.

### A5 — `/admin/pengaturan`

- Switch BUKA/TUTUP + alasan + tanggal buka (opsional).
- Teks auto-reply (ID dan EN).
- Jam layanan: read-only di MVP (hardcode, tampil sebagai informasi).
- Ganti password.

---

## 4. State kunjungan

```
        submit form
             │
             ▼
        [menunggu] ──petugas panggil──► [dipanggil]
             │                              │
             │                              ├─petugas layani──► [dilayani]
             │                              │                       │
             └──batalkan──► [batal]          └──────selesai──────────┴──► [selesai]
```

- Transisi hanya oleh petugas yang login.
- `check_out_at` diisi otomatis saat status → `selesai`.
- Chat read-only setelah `selesai`. Pesan baru dari tamu → buat kunjungan baru
  (tombol "Kunjungan baru" di halaman tiket).
- `batal` = tamu tidak jadi masuk; tetap tercatat untuk audit.

---

## 5. Nomor antrian

- Format simpan: `BT-20261102-007`
- Format tampil: **007** + tanggal
- Sequence Postgres, reset harian secara logis (bukan drop sequence) —
  nomor dihitung dari `count` hari itu di dalam transaksi, dengan unique index
  `(queue_date, queue_seq)` sebagai penjaga tabrakan.
- Zona waktu WIB untuk menentukan "hari".
- Verifikasi: petugas menanyakan nomor ke tamu saat tamu menghadap.

---

## 6. Chat — aturan

- Satu percakapan per kunjungan.
- Rate limit tamu: 1 pesan / 2 detik, maks 30 pesan / 10 menit.
- Petugas: tanpa rate limit, tapi maks 2000 char/pesan.
- Auto-reply terkirim sekali per kunjungan saat tamu mengirim pesan pertama
  di luar jam layanan. Bisa diedit di Pengaturan.
- Pesan tanpa batas panjang 2000 char.
- Tidak ada lampiran file di MVP.
- Realtime: `postgres_changes` INSERT pada `messages` + `broadcast` untuk `typing`
  + `presence` untuk status online. Fallback polling.
- Sanitasi: teks murni (escape HTML), tidak ada markdown/HTML.

---

## 7. i18n (ID + EN)

- Toggle bahasa di header, tersimpan di cookie + localStorage.
- Cakupan: semua label UI, pesan validasi, status, banner jam layanan, halaman
  ditutup, auto-reply default, judul tab.
- Draft EN gue tulis di `lib/i18n/en.ts`; lu review sebelum demo.
- Istilah yang tidak diterjemahkan: nama instansi, nama orang, "BPS".
- Format tanggal: `id-ID` dan `en-GB`.

---

## 8. Struktur data

File: `supabase/migrations/0001_init.sql`

```sql
create type visit_status as enum ('menunggu','dipanggil','dilayani','selesai','batal');
create type staff_role   as enum ('petugas','admin');
create type visit_source as enum ('mandiri','manual');

create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  full_name  text not null,
  role       staff_role not null default 'petugas',
  created_at timestamptz not null default now()
);

create table visits (
  id             uuid primary key default gen_random_uuid(),
  token          uuid not null default gen_random_uuid() unique,
  queue_date     date not null default (now() at time zone 'Asia/Jakarta')::date,
  queue_seq      int  not null,
  queue_no       text not null unique,          -- BT-20261102-007
  name           text not null,
  institution    text not null,
  institution_cat text not null,                 -- bps|pemda|akademisi|swasta|masyarakat|lainnya
  phone          text not null,
  purpose        text not null,                  -- konsultasi|data|kerjasama|audiensi|magang|lainnya
  detail         text,                           -- keterangan opsional, maks 500
  person_count   smallint not null default 1 check (person_count between 1 and 50),
  status         visit_status not null default 'menunggu',
  source         visit_source not null default 'mandiri',
  handled_by     uuid references profiles,
  internal_note  text,
  check_in_at    timestamptz not null default now(),
  check_out_at   timestamptz,
  unique (queue_date, queue_seq)
);

create index visits_today_idx on visits (queue_date desc, queue_seq desc);
create index visits_status_idx on visits (status);
create index visits_phone_idx  on visits (phone);

create table messages (
  id         bigint generated always as identity primary key,
  visit_id   uuid not null references visits on delete cascade,
  sender     text not null check (sender in ('tamu','petugas')),
  sender_id  uuid references profiles,
  body       text not null check (char_length(body) between 1 and 2000),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index messages_visit_idx on messages (visit_id, created_at);

create table settings (
  id             smallint primary key default 1 check (id = 1),
  is_open        boolean not null default true,
  closed_reason  text,
  reopen_at      timestamptz,                    -- null = buka manual
  auto_reopen    boolean not null default true,
  auto_reply_id  text not null default '...',
  auto_reply_en  text not null default '...',
  updated_at     timestamptz not null default now()
);
insert into settings (id) values (1) on conflict do nothing;
```

**RLS:** `visits`/`messages` hanya bisa dibaca petugas login. Semua akses tamu lewat
**Server Action** dengan service-role yang memvalidasi `token` — anon key tidak dipakai
untuk baca data. Realtime untuk tamu pakai private channel yang diotorisasi server.

---

## 9. Batasan teknis (dari keputusan browser lama)

- **Tailwind 3.5**, bukan v4. Token dari `design/tailwind.theme.json` ditranslate ke
  `tailwind.config.ts` (palette, spacing, radius, fontSize).
- Hindari: `:has()`, container query, `oklch()`, `color-mix()`, `subgrid`,
  `view-transition`, `dialog.showModal()` tanpa fallback.
- Hindari `crypto.randomUUID()` di client (Safari < 15.4). Pakai UUID dari server.
- `inputmode="tel"`/`numeric`, bukan `type="tel"` saja, untuk keyboard HP lama.
- Tidak ada animasi mewah; transisi maksimal `opacity`/`transform` 150ms.
- Polyfill minimal hanya kalau terbukti perlu saat tes.
- Target minimum: Chrome 90 (Apr 2021), Safari 15 (Sep 2021).

---

## 10. Notifikasi petugas (4a)

- Bunyi: satu file `notify.mp3` pendek, diputar setelah interaksi pertama
  (syarat autoplay browser).
- Judul tab berkedip `(1) Tamu baru — Buku Tamu` sampai tab difokuskan.
- Badge angka di favicon (canvas, tanpa library).
- Semua notif berhenti saat tab aktif kembali.

---

## 11. Fase (dokumen terpisah per fase)

Tiap fase punya file sendiri supaya bisa dicek sebelum lanjut. Urutan ini mengikat:
jangan mulai fase berikutnya sebelum user menyetujui hasil fase sebelumnya.

| Fase | Isi | Estimasi | File |
|---|---|---|---|
| 0 | Setup proyek (Next.js + token + schema) | ½ hari | `plan/fase-00-setup.md` |
| 1 | Form buku tamu + tiket + jam layanan | 2–3 hari | `plan/fase-01-form.md` |
| 2 | Login + dashboard + input manual | 2–3 hari | `plan/fase-02-dashboard.md` |
| 3 | Switch buka/tutup + ID/EN | 1–2 hari | `plan/fase-03-settings-i18n.md` |
| 4 | Polish, responsif, a11y, QA | 2 hari | `plan/fase-04-polish-qa.md` |
| 5 | Deploy demo ke domain | ½–1 hari | `plan/fase-05-deploy.md` |
| 6 | **Live chat** — hanya setelah buku tamu rampung | 3–4 hari | `plan/fase-06-chat.md` |

**Catatan penting:** chat dipindah ke Fase 6 atas permintaan user. Buku tamu harus
selesai dan disetujui dulu; chat jangan dikerjakan bersamaan.

## 12. QA

**Unit:** schema, generator queue, `serviceState()` (Senin/Jumat/libur/istirahat/lewat tengah malam), rate limiter, formatter WIB.

**E2E Playwright:** check-in → tiket → chat → petugas balas → selesai; input manual;
switch tutup; toggle EN; submit di jam istirahat.

**Manual:**
- [ ] HP tertua yang ada di kantor (Chrome/Safari bawaan)
- [ ] Throttle 3G: form tetap bisa dipakai, skeleton tampil
- [ ] Websocket diblokir → polling jalan
- [ ] Rotate layar + keyboard muncul (composer tidak tertutup)
- [ ] 30 tamu dummy: dashboard masih enak dipakai
- [ ] Tutup browser → buka link WA → tiket & chat kembali

---

## 13. Risiko

| Risiko | Mitigasi |
|---|---|
| Petugas lupa buka setelah switch TUTUP | Banner merah + auto-reopen default 08.00 |
| Tab dashboard ditutup → tamu tak terlihat | Judul berkedip + bunyi; saran pin tab |
| Websocket diblokir jaringan kantor | Fallback polling wajib |
| HP lama layout rusak | Tailwind 3.5 + larangan CSS modern + tes HP fisik |
| Domain `.my.id` DNS salah | Verifikasi CNAME sebelum demo, tes dari seluler |
| Data demo tercampur data asli nanti | Project Supabase baru saat produksi |
| Akun pribadi hilang | Email permanen + `docs/TEKNIS.md` langkah transfer |

---

## 14. Timeline (6 jam efektif/hari)

| Hari | Fokus |
|---|---|
| 1 | Fase 0 — setup |
| 2–4 | Fase 1 — form + tiket |
| 5–7 | Fase 2 — dashboard |
| 8–9 | Fase 3 — switch + i18n |
| 10–11 | Fase 4 — QA |
| 12 | Fase 5 — deploy demo |
| 13–16 | Fase 6 — chat (setelah buku tamu disetujui) |

Buffer 2 hari untuk perbaikan bug hasil uji HP lama.

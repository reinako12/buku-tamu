# Dokumen Teknis — Buku Tamu Digital BPS Tanah Datar

Versi demo · 3 November 2026
Aplikasi: https://bukutamu.grrifixn.my.id

Dokumen ini untuk pengelola/pengembang. Panduan pemakaian sehari-hari untuk
petugas ada di `docs/CARA-PAKAI.md`; cara deploy ada di `docs/deploy.md`.

---

## 1. Stack

- **Next.js 15.5.28** (App Router, server actions) · React 19.1 · TypeScript
- **Tailwind CSS 3.5** (bukan v4 — konfigurasi token di `web/tailwind.config.ts`)
- **Prisma 6.19.3** — akses database dari server
- **Supabase** — Postgres 16 (region `eu-central-1`), Auth (cookie), Realtime
- `zod` untuk validasi input, `lucide-react` untuk ikon, `tsx` + `node:test` untuk unit test

Tidak ada state manager, tidak ada Redis, tidak ada Vercel. Satu proses Node
(`next start`) di belakang cloudflared.

---

## 2. Arsitektur

```
HP tamu ──HTTPS──> Cloudflare ──> cloudflared tunnel ──> 127.0.0.1:3100 (Next.js)
                                                          │
                                                          ├─ Prisma ──> Supabase Postgres (5432 direct / 6543 pgbouncer)
                                                          ├─ Supabase Auth (cookie petugas)
                                                          └─ Realtime (websocket ke browser dashboard)
```

- **Baca/tulis data bisnis lewat Prisma.** Supabase JS hanya dipakai untuk Auth
  dan Realtime.
- **Realtime tidak lewat server Next.js**: browser petugas berlangganan channel
  Supabase langsung (anon key, read-only sesuai RLS).

---

## 3. Halaman dan rute

| Rute | Akses | Isi |
|---|---|---|
| `/` | publik | Form buku tamu, atau banner "ditutup" kalau sakelar mati |
| `/t/[token]` | publik (token UUID) | Tiket kunjungan: nomor antrian, status, tombol cetak |
| `/tutup` | publik | Halaman penjelasan saat buku tamu ditutup |
| `/masuk` | publik | Login petugas (Supabase Auth, email + sandi) |
| `/dashboard` | wajib login | Papan meja + antrian aktif + daftar selesai/batal |
| `/pengaturan` | wajib login | Sakelar buka/tutup, alasan, jadwal buka kembali |
| `/api/keluar` | wajib login | POST: hapus sesi, redirect ke `/masuk` |

Semua akses di luar daftar publik dijaga `requireStaff()` di `lib/auth.ts`:
baca user dari cookie Supabase, lalu pastikan ada baris `profiles` dengan id yang
sama. Tanpa profil → tendang ke `/masuk`.

---

## 4. Struktur folder

```
web/
  app/                  rute (page.tsx) + server action per domain
    actions/            visit.ts, staff.ts, settings.ts, auth.ts, locale.ts
  components/           checkin-form, visit-board, walk-in-dialog, gender-choice,
                        service-banner, settings-form, login-form, locale-toggle
  lib/
    prisma.ts           singleton PrismaClient
    auth.ts             requireStaff()
    visit-status.ts     daftar status + matriks transisi + util tanggal WIB
    schemas/visit.ts    skema zod + konstanta kategori/gender
    rate-limit.ts       limiter in-memory
    service-hours.ts    jam layanan + auto-reopen
    settings-rules.ts   aturan buka/tutup yang bisa diuji tanpa DB
    i18n/               dict.ts (ID/EN), server.ts, client.tsx
    supabase/           server.ts, browser.ts, client.ts
  prisma/
    schema.prisma
    migrations/         0000_init · 0001_functions_rls · 0002_realtime · 0003_gender
```

---

## 5. Data

### 5.1 Model

| Tabel | Isi |
|---|---|
| `visits` | satu baris = satu kunjungan (satu orang) |
| `profiles` | petugas: `id` = `auth.users.id`, `full_name`, `role` (`petugas`/`admin`) |
| `settings` | satu baris (`id = 1`): `is_open`, `closed_reason`, `reopen_at`, `auto_reopen` |

Kolom penting `visits`: `token` (UUID untuk tiket), `queue_date`, `queue_seq`,
`queue_no` (`BT-20261103-001`), `name`, `institution`, `institution_cat`,
`phone`, `purpose`, `detail`, `gender` (`lk`/`pr`, nullable), `status`, `source`
(`mandiri`/`petugas`), `handled_by`, `internal_note`, `check_in_at`, `check_out_at`.

`person_count` masih ada di tabel dengan default 1 untuk kompatibilitas baris
lama, tetapi **tidak dipakai lagi** di form, tiket, maupun dashboard. Satu entri
= satu orang.

### 5.2 Nomor antrian

Nomor dialokasikan di database, bukan di aplikasi: fungsi `create_visit(...)`
(`migrations/0001` + `0003`) memakai
`pg_advisory_xact_lock(hashtext('visit:' || tanggal))` lalu
`max(queue_seq) + 1` per `queue_date`. Hasilnya dua submit bersamaan tetap dapat
nomor berbeda, dan nomor kembali ke 001 setiap hari.

Tanggal acuan selalu **WIB** (`now() at time zone 'Asia/Jakarta'`), bukan zona
server. Nomor tampilan = tiga digit terakhir; nomor lengkap disimpan di
`queue_no`.

### 5.3 RLS dan otorisasi

RLS aktif di ketiga tabel untuk akses lewat Supabase client (anon/authenticated):
petugas hanya bisa membaca dan mengubah, insert publik tidak diberikan.

**Prisma connect sebagai pemilik tabel, jadi RLS tidak berlaku untuk jalur ini.**
Konsekuensinya otorisasi wajib ada di lapisan aplikasi:

- Tamu membuat entri lewat server action `createVisit` yang memvalidasi input
  (zod), mengecek sakelar buka/tutup, dan menerapkan rate limit.
- Mengubah status hanya lewat server action yang memanggil `requireStaff()` dan
  memeriksa `canTransition()`.
- Tiket `/t/[token]` dibaca dengan token UUID acak — bukan nomor antrian, jadi
  tidak bisa ditebak berurutan.

Kalau nanti menambah jalur akses data baru, jangan lewat Prisma tanpa pengecekan
sesi di server action.

---

## 6. Alur utama

### 6.1 Tamu mengisi form

1. `app/page.tsx` membaca `settings`; kalau tutup → tampilkan banner + `/tutup`.
2. Form (client) validasi dengan zod, kirim ke server action `createVisit`.
3. Server action: rate limit per IP (`3` pengisian / `30` detik, IP di-hash
   SHA-256 dengan `RATE_LIMIT_SALT`), validasi ulang, panggil `create_visit()`
   via `$queryRaw`.
4. Balikan token → redirect ke `/t/[token]`.

Rate limiter bersifat **in-memory per proses**. Satu instance = aman. Kalau
aplikasi dijalankan lebih dari satu instance, ganti ke tabel Postgres (jangan
tambah Redis — cukup satu layanan).

### 6.2 Dashboard realtime

`components/visit-board.tsx` berlangganan
`postgres_changes` pada `public.visits` di channel `visits-today`:

- `INSERT` → baris ditambahkan tanpa refresh, halaman pindah ke tempat baris baru.
- `UPDATE` → status/lama tunggu ikut berubah.
- Indikator "Tersambung" hijau/abu-abu menunjukkan status channel; kalau putus,
  aksi tetap jalan tetapi daftar tidak bertambah sendiri sampai halaman dimuat
  ulang.

Data awal tetap diambil di server (page → Prisma), realtime hanya tambahan.

### 6.3 Status

```
menunggu → dipanggil → dilayani → selesai
    ↘_________↘_________↘_________→ batal
```

Matriks di `lib/visit-status.ts` (`ALLOWED_TRANSITIONS`) menentukan tombol yang
muncul per baris dan sekaligus jadi penjaga di server action. `selesai` dan
`batal` final — tidak ada transisi keluar.

### 6.4 Buka/tutup otomatis

`lib/settings-rules.ts` memutuskan `shouldAutoReopen()`: buku tamu dibuka
otomatis hanya kalau sedang tutup **dan** `auto_reopen` aktif **dan** `reopen_at`
sudah lewat. Input `datetime-local` dibaca sebagai WIB (server berjalan di UTC).

---

## 7. Internasionalisasi

`lib/i18n/dict.ts` memuat seluruh teks ID dan EN dalam satu objek bertipe;
`DictKey` membuat salah ketik kunci gagal saat typecheck. Bahasa disimpan di
cookie `locale` (1 tahun). Komponen server memakai `getT()`, komponen client
memakai `useT()` dari provider di layout. Data tamu tidak pernah diterjemahkan.

---

## 8. Desain

Design system BPS disalin ke `design/` (`DESIGN.md`, `tokens.json`,
`tailwind.theme.json`). Revisi tampilan dan alasannya ada di
`design/DESIGN-v2.md`, termasuk bagian dashboard, pagination, dan kolom aksi.

Prinsip yang dipegang: biru BPS `#003C80`, radius kecil, satu aksi utama per
baris, tanpa kartu-kartu seragam, angka antrian monospace.

---

## 9. Test

```bash
cd web
npm run typecheck            # tsc --noEmit
npm test                     # 39 test, node:test
npm run build
```

Unit test hanya menyentuh logika murni (tanpa DB): transisi status, aturan
buka/tutup, jam layanan, rate limit, skema zod, kamus i18n. Alur nyata diuji
manual di browser pada 390 / 768 / 1024 / 1440 px.

---

## 10. Environment variable

Nama variabel di `web/.env` (isi tidak pernah masuk repo, permission 600):

```
DATABASE_URL            # 6543, pgbouncer, untuk runtime
DIRECT_URL              # 5432, untuk migrasi
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # hanya bila perlu operasi admin
RATE_LIMIT_SALT
```

`web/lib/env.ts` membaca dan memvalidasi variabel publik saat start supaya salah
konfigurasi ketahuan lebih awal.

---

## 11. Batasan yang diketahui

- Rate limit in-memory → hanya benar untuk satu instance.
- Belum ada ekspor rekap (Excel/PDF); data diambil langsung dari Postgres.
- Belum ada fitur ubah data tamu setelah tersimpan (hanya maju status atau batal).
- Tamu manual tidak mendapat halaman tiket.
- Tidak ada notifikasi WhatsApp otomatis; tautan `wa.me` hanya membuka chat.
- `person_count` adalah kolom warisan yang tidak dipakai.

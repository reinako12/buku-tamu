---
version: alpha
name: BPS Indonesia
description: Portal statistik resmi Badan Pusat Statistik — biru institusional, datar, padat data, Inter di seluruh UI.
colors:
  primary: "#003C80"
  primary-dark: "#002B6A"
  primary-light: "#0093DD"
  primary-light-hover: "#0086CA"
  accent-orange: "#E27303"
  accent-green: "#5DAB2C"
  success: "#1F630E"
  success-dark: "#135208"
  danger: "#B7163E"
  danger-dark: "#7A0839"
  warning: "#EB891B"
  warning-dark: "#702905"
  neutral-body: "#EEF0F2"
  surface: "#FCFCFC"
  surface-muted: "#F1F5F9"
  surface-sunken: "#E5E7EB"
  ink: "#111111"
  ink-muted: "#575757"
  ink-inverse: "#FCFCFC"
  border: "#E5E7EB"
  border-strong: "#CBD5E1"
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: 700
    lineHeight: 36px
  heading-page:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 600
    lineHeight: 33.6px
  heading-card:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 28.8px
  heading-detail:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 700
    lineHeight: 32px
  heading-table:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 700
    lineHeight: 28px
  stat-value:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 700
    lineHeight: 20px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 16.8px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  button:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 16px
  wordmark:
    fontFamily: Arial
    fontSize: 20px
    fontWeight: 700
    lineHeight: 24px
rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  "2xs": 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
  "3xl": 56px
  "4xl": 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 8px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.sm}"
  button-accent:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px
    size: 32px
  button-accent-hover:
    backgroundColor: "{colors.primary-light-hover}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.md}"
  button-accent-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.md}"
  nav-item:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.xs}"
    height: 40px
  nav-item-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink-inverse}"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 8px
    height: 48px
    width: 544px
  card-stat:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 16px
    width: 243px
    height: 241px
  card-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 20px
  card-highlight:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.lg}"
    padding: 32px
  card-dark-glass:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.md}"
    padding: 16px
  tab-active:
    backgroundColor: "{colors.neutral-body}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    padding: 16px
    height: 52px
  tab-inactive:
    backgroundColor: "{colors.neutral-body}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-sm}"
    padding: 16px
    height: 52px
  table-header:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 8px
  table-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: 8px
  table-row-alt:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    padding: 8px
  pagination-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.label-sm}"
    rounded: 0px
    height: 38px
    width: 33px
  pagination-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: 0px
    height: 38px
  navbar:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.ink-inverse}"
    height: 80px
  announcement-bar:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.label-sm}"
    height: 70px
  footer:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.ink-inverse}"
    padding: 32px
  section-title:
    textColor: "{colors.ink}"
    typography: "{typography.heading-page}"
  link-inline:
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  badge-category-orange:
    backgroundColor: "{colors.accent-orange}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.heading-card}"
    rounded: "{rounded.lg}"
    padding: 16px
  badge-category-green:
    backgroundColor: "{colors.accent-green}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 4px
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 4px
  badge-success-dark:
    backgroundColor: "{colors.success-dark}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 4px
  badge-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 4px
  badge-danger-dark:
    backgroundColor: "{colors.danger-dark}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 4px
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 4px
  badge-warning-dark:
    backgroundColor: "{colors.warning-dark}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 4px
  divider:
    backgroundColor: "{colors.surface-sunken}"
    height: 1px
---

## Overview

BPS adalah portal statistik pemerintah: audiensnya pejabat, jurnalis, peneliti, dan
mahasiswa yang datang untuk mengambil angka. Karena itu bahasanya visual = **otoritatif,
tenang, dan anti-dekoratif**. Tidak ada gradien ramai, tidak ada ilustrasi berlebihan,
tidak ada animasi yang mengganggu pembacaan tabel. Warna dipakai secara fungsional:
satu biru institusional untuk identitas dan aksi, abu-abu netral untuk kanvas, dan
oranye/hijau hanya sebagai penanda kategori sektor.

Tiga prinsip yang menurun ke semua komponen:

1. **Angka lebih penting dari kemasan.** Nilai statistik dirender besar (28px bold),
   labelnya kecil dan tenang (16px semi-bold biru). Tidak ada drop shadow di kartu angka.
2. **Permukaan putih di atas kanvas abu.** Kanvas `#EEF0F2`, semua konten duduk di
   `#FCFCFC` (bukan putih murni) dengan radius 12px. Ini yang memberi kesan "kertas resmi".
3. **Warna gelap = struktur, warna terang = aksi.** `#002B6A` untuk rangka (navbar,
   footer, header tabel), `#0093DD` untuk elemen yang bisa ditekan (tombol cari,
   indikator tab aktif, tombol navigasi carousel).

## Colors

Palet diambil langsung dari custom properties Tailwind situs (`--info-*`, `--success-*`,
`--danger-*`, `--warning-*`, `--white-*`, `--black-*`) — bukan hasil sampling gambar.

- **Primary `#003C80`** (`--info-default`, kelas `bg-main-primary` / `bg-info`) —
  warna identitas utama. Dipakai untuk tombol solid, tautan tegas, judul artikel,
  item pagination aktif, dan header kartu subjek.
- **Primary-dark `#002B6A`** (`--info-dark`, `bg-main-dark`) — rangka halaman:
  navbar, footer, header tabel data, state hover tombol aksen.
- **Primary-light `#0093DD`** (`--info-light`, `bg-main-light`, `bg-sp`) — satu-satunya
  warna "aksi terang": tombol submit pencarian, garis indikator tab aktif, tombol
  carousel bulat, kartu highlight "Jadwal Jumpa Pers". Hover-nya `#0086CA`.
- **Accent-orange `#E27303`** (`bg-se`) — header kartu sektor (mis. "Statistik Ekonomi").
  Dipakai sebagai blok warna besar, bukan untuk teks kecil.
- **Accent-green `#5DAB2C`** (`bg-st`) — penanda kategori hijau/lingkungan.
- **Success `#1F630E`**, **danger `#B7163E`**, **warning `#EB891B`** — status
  (naik/turun, gagal, peringatan). Masing-masing punya varian dark/light/disabled
  di CSS sumber; jangan bikin turunan sendiri.
- **Surface `#FCFCFC`** (`--white-default`) — semua kartu. **Bukan** `#FFFFFF`.
- **Neutral-body `#EEF0F2`** — kanvas. **Surface-muted `#F1F5F9`** (slate-100) —
  isi panel filter, baris zebra tabel, kartu glass di atas gelap.
- **Ink `#111111`**, **ink-muted** = `rgb(17 17 17 / 0.7)` (di-flatten jadi `#575757`
  di atas `#FCFCFC`). Tidak ada abu-abu tipografi lain: situs konsisten memakai
  hitam 100% untuk teks utama dan hitam 70% untuk sekunder.

Kontras: `#003C80` di atas `#FCFCFC` ≈ 10,6:1 (AAA), `#0093DD` di atas putih ≈ 3,4:1 —
aman untuk elemen grafik/ikon besar, **tidak** untuk body text kecil, jadi biru terang
tidak pernah dipakai untuk paragraf.

**Temuan aksesibilitas (hasil lint WCAG):** pasangan `#FCFCFC` di atas `#0093DD` hanya
**3,29:1**, di bawah WCAG AA 4,5:1. Ini kondisi asli situs — terjadi pada announcement
bar 14px, kartu "Jadwal Jumpa Pers", dan tombol cari. Kalau project turunan wajib lolos
AA: gelapkan latar ke `#0086CA` (hover) / `#003C80`, atau naikkan teks ke ≥ 24px bold.
Teks `rgba(17,17,17,.7)` di atas `#FCFCFC` = 6,9:1 (aman).

## Typography

Satu keluarga font: **Inter** (variable, di-load lewat `next/font` sebagai
`__className_d8ebd1`, weight 100–900, `font-display: swap`, fallback terkalibrasi
`Inter Fallback` → Arial). Tidak ada font kedua di UI.

Satu-satunya pengecualian: **wordmark "BADAN PUSAT STATISTIK"** di navbar memakai
`font-family: Arial`, `font-style: italic`, `text-transform: uppercase`, 20px/24 bold,
putih. Ini disengaja — meniru logotype, bukan teks UI. Jangan pakai Arial di tempat lain.

Tangga ukuran yang benar-benar muncul di produksi (hasil `getComputedStyle`):

- **30px / 36 / 700** — H1 hero. Putih, center, `max-width: 64rem`, line-height 40px di mobile.
- **28px / 33.6 / 600** — judul section (`Informasi Terbaru`, `Statistik menurut Subjek`)
  dan H1 halaman daftar (`Publikasi`, `Berita Resmi Statistik`). Margin bawah 16px
  (24px untuk section "Layanan Lainnya").
- **28px / 20 / 700** — nilai indikator strategis. Line-height sengaja < font-size
  supaya angka dan satuan tetap rapat; satuan (`Persen`, `Juta US$`) dirender 16px/24
  weight 300 di baris berikutnya.
- **24px / 28.8 / 600** — judul panel filter (`Filter Publikasi`) dan judul kartu.
- **24px / 32 / 700** — H1 halaman detail artikel (BRS/berita), warna `#003C80`.
- **20px / 28 / 700** — H1 halaman detail tabel statistik, warna `#003C80`.
- **16px / 24 / 400** — body. Ini 573 dari ~880 elemen teks; ukuran default.
- **14px / 20 / 400** — body kecil: isi tabel, deskripsi kartu, teks pagination.
- **14px / 16.8 / 500** — label UI: item navbar, label filter, tombol.
- **12px / 16 / 400** — caption/metadata (tanggal, sumber, unit kecil).

Aturan praktis: **jangan pernah** memakai weight 700 untuk body, jangan menurunkan
body di bawah 14px, dan jangan memakai letter-spacing — situs ini `letter-spacing: normal`
di seluruh tipografi.

## Layout

- **Kanvas**: `#EEF0F2`, `body { font-size: 16px; line-height: 24px }`.
- **Gutter horizontal responsif** (dipakai identik oleh navbar, section, footer):
  `16px → 32px → 48px → 80px → 144px` pada breakpoint `base → md → lg → xl → 2xl`.
  Lebar konten hasilnya: 358px (390 viewport), 704px (768), 928px (1024), 1280px (1440).
- **Grid konten**: 12 kolom implisit lewat `grid`; area utama memakai 2 kolom
  (konten + sidebar 320px) di halaman daftar/detail, dan 1→2 kolom untuk blok beranda
  (1 kolom < 768px, 2 kolom ≥ 768px, masing-masing 348/460/636px).
- **Ritme vertikal section**: `padding-block: 24px` (`py-6`) per section; section
  yang butuh napas tambahan pakai `padding-top: 48px`. Jarak antar-blok dalam section
  memakai `gap: 16px` (dominan) atau `gap: 8px` untuk elemen rapat (ikon + teks).
- **Hero**: tinggi `80vh` pada ≥ 1024px, `100vh` pada mobile portrait; gambar
  `object-cover object-right-top` sebagai background, judul + search di tengah,
  `padding-block: 24px`, gap antar elemen 48–64px.
- **Sidebar kanan**: lebar tetap 320px, kartu highlight biru di atas, daftar
  "Government Public Relation" di bawahnya.
- **Breakpoint** (Tailwind default, terkonfirmasi di bundle CSS):
  `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.

## Elevation & Depth

Hampir seluruh UI **flat**. Dari seluruh elemen halaman beranda hanya dua shadow
yang dipakai:

- `0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)` (Tailwind `shadow-lg`)
  — untuk panel mengambang/menu.
- `0 5px 15px 0 rgba(37,44,97,.15), 0 2px 4px 0 rgba(93,100,148,.2)` — kartu khusus
  yang butuh pemisahan halus.

Kedalaman utama dibangun dengan **kontras latar dan border**, bukan bayangan:
kanvas abu `#EEF0F2` → kartu `#FCFCFC` → border `#E5E7EB` / `#CBD5E1`. Navbar dan footer
tidak punya shadow sama sekali; navbar cukup `sticky top-0 z-[999]`.

## Shapes

- **4px** — chip kecil, radius item navbar.
- **6px** — tombol (semua ukuran), tabel data (`border-radius: 6px` + `overflow: hidden`).
- **8px** — panel filter, tombol aksen pencarian, kartu glass, tombol btn deprecated.
- **12px** — kartu utama (`rounded-xl`): kartu statistik, kartu artikel, kartu highlight.
  Ini radius paling sering muncul (29 elemen di beranda).
- **16px** — kartu besar / blok media.
- **9999px / 100%** — avatar, tombol carousel bulat (48×48), badge pil.

Ikon memakai Font Awesome 6 (solid + brands). Ukuran ikon mengikuti teksnya
(`1em`), tidak pernah jadi elemen visual dominan.

## Components

**Navbar** — dua lapis, total 150px, `sticky top-0 z-[999]`:
lapisan 1 `#002B6A` tinggi 80px berisi logo 48×48 + wordmark Arial italic uppercase
20px + item menu (14px/16.8 weight 500, putih, radius 4px, tinggi 40px, hover latar
`#003C80`) + tombol CTA solid `#003C80` (radius 6px, 40px, padding 8/16).
Lapisan 2 = **announcement bar** `#0093DD` tinggi 70px berisi running text putih
dengan tombol panah kiri/kanan 16px. Di < 1024px menu diganti hamburger + ikon cari
(`text-white w-10`), announcement bar tetap tampil.

**Search** — pill putih `#FCFCFC`, radius 12px, padding 8px 8px 8px 16px, tinggi 48px,
input transparan tanpa border (placeholder `Cari data statistik...` warna `#111111B3`),
di kanan tombol persegi `#0093DD` radius 8px 32×32 berisi ikon kaca pembesar putih.
Lebar: `80vw` di mobile, 34rem (544px) tetap di ≥ 768px, `mx-auto`.

**Tabs** (`Informasi Terbaru`) — strip horizontal tinggi 52px, item `padding: 16px`,
14px, aktif = `#003C80` weight 600 dengan garis indikator 4px `#0093DD` di bawah,
non-aktif = `rgba(17,17,17,.7)` weight 400. Mobile: strip bisa di-scroll horizontal
(`overflow-x: scroll`, scrollbar disembunyikan).

**Kartu statistik** — 243×241px, `#FCFCFC`, radius 12px, padding 16px, layout kolom
center: label 16px/700 `#003C80` di atas, nilai 28px/700 `rgba(17,17,17,.7)` + satuan
16px/300 di bawah. Disusun sebagai carousel Swiper; panah navigasi bulat 48×48 putih
dengan ikon biru, hanya muncul ≥ 1024px.

**Kartu highlight** — `#0093DD`, radius 12px, padding 32px, teks putih, judul
24px/28.8 weight 600, tombol outline putih. Dipakai untuk "Jadwal Jumpa Pers Terakhir".

**Kartu glass di atas gelap** — `rgba(252,252,252,.1)`, radius 8px, teks putih,
judul 18px/28 weight 600. Hanya dipakai di blok gelap di atas footer.

**Kartu sektor** — header `#E27303` teks putih 24px/600 center padding 16px dengan
radius atas 12px, badan `#F1F5F9` padding 16px berisi daftar tautan 14px yang
di-scroll di dalam `max-height: 13.5rem`.

**Panel filter** — kartu `#FCFCFC` radius 8px, judul `Filter Publikasi` 24px/600,
isi berupa deretan select/dropdown 12px, plus baris "Menampilkan 1-10 dari 5.975".
Di mobile panel disembunyikan dan diganti satu tombol `w-full bg-white rounded-lg p-3`.

**Tabel data** — `border-collapse: separate`, border 1px `#CBD5E1`, radius 6px,
`overflow: hidden`. Header `#002B6A` teks putih 14px weight 700 padding 8px;
sel 14px padding 8px `line-height: 21px`; baris genap `#F1F5F9`; border antar sel
hanya kiri + atas (kanan/bawah 0) sehingga grid terlihat bersih tanpa garis ganda.

**Pagination** — kotak 33–38px, radius 0 (siku) dengan sudut 3px hanya di prev/next.
Aktif: latar `#003C80`, teks putih. Non-aktif: latar `#FCFCFC`, teks `#003C80`,
border 1px `#D1D5DB`. Disabled: `#ECECEC` teks `#808080`.

**Footer** — `#002B6A`, padding 32px 80px, teks putih, grid `1 kolom → baris` di ≥ 768px,
berisi alamat kantor, kolom tautan (14px), dan baris copyright "Hak Cipta © 2023
Badan Pusat Statistik" 14px. Tidak ada logo besar; tidak ada sosial media berwarna.

**Tipografi artikel** — kartu `#FCFCFC` radius 12px padding 32px, H1 `#003C80`
24px/32 weight 700, body 16px/24, list `padding-left: 40px` dengan bullet disc,
paragraf maksimum 5 baris dipotong `line-clamp` pada kartu ringkasan.

## Do's and Don'ts

**Do**

- Pakai `#003C80` untuk keputusan/aksi utama dan `#0093DD` untuk aksi yang butuh
  penekanan visual ringan. Jangan pernah menukar perannya.
- Dudukkan konten di `#FCFCFC` di atas kanvas `#EEF0F2`. Kontras 2 lapis ini adalah
  ciri paling khas dari tampilan BPS.
- Pertahankan angka statistik besar (28px/700) dengan label kecil di atasnya;
  hierarki ini yang membuat halaman terbaca dalam 1 detik.
- Gunakan radius 12px untuk kartu, 6px untuk tombol dan tabel, 8px untuk panel kecil.
- Pertahankan gutter bertingkat 16/32/48/80/144 — jangan pakai satu max-width tetap
  dengan margin auto, karena situs ini full-bleed.
- Biarkan UI datar. Kalau butuh pemisah, pakai border 1px `#E5E7EB`.

**Don't**

- Jangan pakai `#FFFFFF` murni untuk kartu, jangan pakai hitam `#000000` untuk teks
  (situs memakai `#111111`).
- Jangan menambah warna brand baru. Oranye `#E27303` dan hijau `#5DAB2C` hanya untuk
  penanda kategori, bukan untuk tombol atau tautan.
- Jangan memakai biru terang `#0093DD` untuk body text kecil (kontras < 4,5:1).
- Jangan menambahkan gradient dekoratif, glassmorphism, atau shadow berlapis.
  Satu-satunya gradient yang sah adalah overlay gelap di atas foto hero agar judul
  putih terbaca.
- Jangan memakai Inter Italic kecuali pada wordmark (yang memang Arial italic).
- Jangan membungkus tabel dalam kartu dengan radius > 6px — sudut tabel harus mengikuti
  radius tabelnya sendiri.
- Jangan memakai ikon berwarna-warni; ikon selalu `currentColor`.

## Responsive Behavior

Breakpoint Tailwind default: `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
Diukur langsung pada 390 / 768 / 1024 / 1440 px.

- **Gutter konten**: 16px (mobile) → 32px (≥768) → 48px (≥1024) → 80px (≥1280)
  → 144px (≥1536). Lebar konten: 358 → 704 → 928 → 1280.
- **Navbar**: < 1024px hanya logo + hamburger + ikon cari; ≥ 1024px item menu
  horizontal muncul (`hidden lg:flex`) dengan tinggi item 40px. Announcement bar
  `#0093DD` selalu tampil, tinggi 70px, teks 14px.
- **Hero**: mobile portrait `height: 100vh`, ≥ 1024px `height: 80vh`.
  H1 30px dengan line-height 40px di mobile → 36px di desktop; `max-width: 64rem`,
  `text-align: center`.
- **Search**: `width: 80vw` di mobile, 34rem tetap di ≥ 768px. Tinggi selalu 48px.
- **Grid konten**: 1 kolom < 768px, 2 kolom ≥ 768px. Kartu statistik tetap 243px
  dan menjadi carousel horizontal yang di-swipe di mobile (panah navigasi hanya ≥ 1024px).
- **Tabs**: horizontal scroll di mobile (`overflow-x: scroll`, `no-scrollbar`),
  wrap/auto di ≥ 768px. Tinggi item tetap 52px.
- **Panel filter**: tersembunyi di mobile, diganti tombol "Filter" full-width
  (`bg-white rounded-lg p-3`); muncul sebagai sidebar 1/3–1/5 lebar di ≥ 768px.
- **Tabel**: satu-satunya tempat yang boleh overflow — wrapper `overflow-x: auto`
  dengan `min-width` tabel dipertahankan; jangan mengecilkan font di bawah 14px.
- **Footer**: `flex-col` di mobile (copyright di bawah), `md:flex-row` dengan
  `justify-between` di ≥ 768px.
- **Tipografi tidak mengecil di mobile kecuali H1 hero**: body tetap 16px, kartu
  tetap 14–16px. Yang berubah adalah jumlah kolom dan padding, bukan ukuran huruf.

## Sumber Data

Spesifikasi ini diekstrak dari produksi tanggal 2 November 2026:

- `https://www.bps.go.id/id` (beranda), `/id/pressrelease`, `/id/publication`,
  `/id/news`, `/id/statistics-table?subject=519`, halaman detail tabel & detail BRS,
  `/id/term-of-use`.
- Stack terdeteksi: Next.js App Router (`/_next/static/...`), Tailwind CSS
  (compiled bundle `9bfd5c302cf50924.css`), Swiper, rc-pagination, Font Awesome 6,
  Inter via `next/font`.
- Nilai warna/ukuran diambil dari custom properties CSS + `getComputedStyle` pada
  DOM hasil render (bukan estimasi mata), pada viewport 390/768/1024/1440 px.
- Akses langsung diblokir Cloudflare untuk klien non-browser; data diambil melalui
  render browser dengan IP Indonesia.

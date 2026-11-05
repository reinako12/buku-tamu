/**
 * Aturan kedaluwarsa percakapan. Sengaja tanpa Prisma supaya bisa diuji
 * langsung: fungsi di sini hanya menjawab "baris ini sudah waktunya ditutup
 * atau dihapus?", bukan menyentuh database.
 */

const JAM_MS = 60 * 60 * 1000;
const HARI_MS = 24 * JAM_MS;

/** Percakapan yang diam selama ini ditutup otomatis. */
export const JAM_DIAM = 24;

/** Percakapan tertutup disimpan selama ini, lalu dihapus beserta pesannya. */
export const HARI_SIMPAN = 90;

/** Teks sambutan kalau petugas belum mengisi apa pun di pengaturan. */
export const AUTO_REPLY_BAWAAN =
  "Terima kasih sudah menghubungi BPS Kabupaten Tanah Datar. Saat ini di luar jam layanan, jadi balasan petugas menyusul pada jam kerja berikutnya: Senin–Kamis 08.00–16.00, Jumat 08.00–16.30 WIB.";

export type SidangPercakapan = {
  status: "terbuka" | "ditutup";
  lastMessageAt: Date | null;
  createdAt: Date;
  /** Status kunjungan yang tersambung, kalau ada. */
  visitStatus: "menunggu" | "dipanggil" | "dilayani" | "selesai" | "batal" | null;
  /** Saat kunjungan dianggap rampung: waktu keluar, atau terakhir diubah. */
  visitDoneAt: Date | null;
};

/**
 * Dua jalan menuju tutup otomatis:
 *
 * 1. tidak ada pesan sama sekali selama 24 jam;
 * 2. kunjungannya sudah selesai/batal, dan sejak itu lewat 24 jam.
 *
 * Percakapan tanpa kunjungan tetap memakai patokan pesan terakhir, bukan
 * waktu dibuat — tamu yang menulis kemarin malam jangan ditutup pagi ini.
 */
export function harusDitutup(row: SidangPercakapan, now: Date): boolean {
  if (row.status !== "terbuka") return false;

  const diamSejak = row.lastMessageAt ?? row.createdAt;
  if (now.getTime() - diamSejak.getTime() >= JAM_DIAM * JAM_MS) return true;

  const rampung = row.visitStatus === "selesai" || row.visitStatus === "batal";
  if (!rampung || !row.visitDoneAt) return false;
  return now.getTime() - row.visitDoneAt.getTime() >= JAM_DIAM * JAM_MS;
}

/** Yang dihapus hanya percakapan tertutup yang sudah lewat masa simpan. */
export function harusDihapus(closedAt: Date | null, now: Date): boolean {
  if (!closedAt) return false;
  return now.getTime() - closedAt.getTime() >= HARI_SIMPAN * HARI_MS;
}

/**
 * Sambutan luar jam layanan hanya untuk percakapan yang masih terbuka dan
 * belum pernah disapa. Satu percakapan, satu sambutan — seberapa sering pun
 * tamu menulis malam itu.
 */
export function perluSapa(
  row: { status: "terbuka" | "ditutup"; autoRepliedAt: Date | null },
  jamLayananTerbuka: boolean,
): boolean {
  if (jamLayananTerbuka) return false;
  if (row.status !== "terbuka") return false;
  return row.autoRepliedAt === null;
}

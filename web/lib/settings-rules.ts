/**
 * Aturan buka-tutup yang bisa diuji tanpa database.
 * Dipisah dari lib/settings.ts supaya unit test tidak perlu Prisma.
 */

export type ClosedSetting = {
  isOpen: boolean;
  autoReopen: boolean;
  reopenAt: Date | null;
};

/**
 * Buku tamu harus dibuka otomatis kalau sedang tutup, auto-reopen aktif,
 * dan waktu buka kembali sudah lewat.
 */
export function shouldAutoReopen(
  setting: ClosedSetting | null,
  now: Date = new Date(),
): boolean {
  if (!setting) return false;
  if (setting.isOpen) return false;
  if (!setting.autoReopen) return false;
  if (!setting.reopenAt) return false;
  return setting.reopenAt.getTime() <= now.getTime();
}

const JAKARTA_OFFSET_MINUTES = 7 * 60;

/**
 * `datetime-local` mengirim "2026-11-04T08:00" tanpa zona waktu. Nilainya
 * dibaca sebagai WIB (UTC+7) — server ini berjalan di UTC.
 */
export function parseJakartaInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  const utcMs = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  if (Number.isNaN(utcMs)) return null;
  return new Date(utcMs - JAKARTA_OFFSET_MINUTES * 60 * 1000);
}

/** Kebalikan dari parseJakartaInput, untuk mengisi input datetime-local. */
export function toJakartaInputValue(date: Date): string {
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

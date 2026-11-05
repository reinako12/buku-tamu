/**
 * Aturan isi pesan, tanpa database dan tanpa "server-only" — dipakai server
 * action, komponen klien (batas `maxLength`), dan unit test.
 */

export const PESAN_MAKS = 1000;

export type PesanSalah = "empty" | "long";

/** Alasan penolakan isi pesan, atau null kalau sah. */
export function periksaPesan(body: string): PesanSalah | null {
  const isi = body.trim();
  if (!isi) return "empty";
  if (isi.length > PESAN_MAKS) return "long";
  return null;
}

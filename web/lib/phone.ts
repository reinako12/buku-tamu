/**
 * Satu tempat untuk urusan nomor WhatsApp.
 *
 * Nomor disimpan seragam dalam bentuk `+62xxxxxxxxxx`, sama seperti kolom
 * `visits.phone`. Kalau formatnya beda, pencocokan percakapan ke kunjungan
 * tidak akan pernah ketemu walaupun orangnya sama.
 */

export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

/** Buang semua selain angka. */
export function phoneDigits(input: string): string {
  return (input ?? "").replace(/\D/g, "");
}

/**
 * `0812-3456-7890`, `+62 812 3456 7890`, `62812...`, `812...` → `+62812...`
 * Input yang tidak masuk akal dikembalikan seadanya (mis. `+62`), lalu ditolak
 * oleh isValidPhone.
 */
export function normalizePhone(input: string): string {
  const digits = phoneDigits(input);
  if (!digits) return "";

  let local = digits;
  if (local.startsWith("62")) local = local.slice(2);
  else if (local.startsWith("0")) local = local.slice(1);

  if (!local) return "";
  // Nomor yang diawali + tapi bukan 62 (mis. +65) tetap dibiarkan apa adanya
  // supaya kelihatan salah, bukan dipaksa jadi nomor Indonesia.
  if (!digits.startsWith("62") && !digits.startsWith("0") && !digits.startsWith("8")) {
    return `+${digits}`;
  }
  return `+62${local}`;
}

/**
 * Nomor seluler Indonesia yang sah: 62 8 diikuti 8–13 digit lagi, jadi total
 * 10–15 digit. Nomor kantor (021…) sengaja ditolak karena chat dikirim ke
 * WhatsApp.
 */
export function isValidPhone(input: string): boolean {
  const normalized = normalizePhone(input);
  const digits = phoneDigits(normalized);
  if (digits.length < PHONE_MIN_DIGITS || digits.length > PHONE_MAX_DIGITS) return false;
  return /^\+628[1-9][0-9]{6,11}$/.test(normalized);
}

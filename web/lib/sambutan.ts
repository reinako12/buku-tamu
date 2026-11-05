import type { Locale } from "@/lib/i18n/dict";

/**
 * Pesan sistem ditulis ke database, bukan dirender ulang tiap kali dibuka.
 * Karena itu bahasanya ditentukan saat pesan dibuat: bahasa tamu yang berlaku
 * ketika percakapan dimulai (`conversations.locale`), bukan bahasa petugas
 * yang sedang melihat inbox.
 */

export const AUTO_REPLY_BAWAAN =
  "Terima kasih sudah menghubungi BPS Kabupaten Tanah Datar. Saat ini di luar jam layanan, jadi balasan petugas menyusul pada jam kerja berikutnya: Senin–Kamis 08.00–16.00, Jumat 08.00–16.30 WIB.";

export const AUTO_REPLY_BAWAAN_EN =
  "Thank you for contacting BPS Kabupaten Tanah Datar (Statistics Indonesia). We are outside service hours right now, so a staff reply will follow on the next working day: Monday–Thursday 08.00–16.00, Friday 08.00–16.30 WIB (GMT+7).";

export type TeksSambutan = {
  id?: string | null;
  en?: string | null;
};

/** "en" hanya kalau benar-benar "en"; sisanya jatuh ke Indonesia. */
export function keLocale(nilai: unknown): Locale {
  return nilai === "en" ? "en" : "id";
}

/**
 * Sambutan luar jam: isian petugas untuk bahasa tersebut, atau teks bawaan.
 * Isian kosong (atau hanya spasi) dianggap belum diisi.
 */
export function pilihSambutan(
  locale: Locale | string | null | undefined,
  kustom?: TeksSambutan,
): string {
  const inggris = keLocale(locale) === "en";
  const isian = (inggris ? kustom?.en : kustom?.id)?.trim();
  if (isian) return isian;
  return inggris ? AUTO_REPLY_BAWAAN_EN : AUTO_REPLY_BAWAAN;
}

/** Pemberitahuan nomor antrian setelah percakapan tersambung ke kunjungan. */
export function teksKunjungan(
  queueNo: string,
  locale: Locale | string | null | undefined,
): string {
  return keLocale(locale) === "en"
    ? `Visit recorded. Your queue number is ${queueNo}.`
    : `Kunjungan tercatat. Nomor antrian ${queueNo}.`;
}

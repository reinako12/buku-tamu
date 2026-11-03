import { z } from "zod";

export const INSTITUTION_CATEGORIES = [
  "bps",
  "pemda",
  "akademisi",
  "swasta",
  "masyarakat",
  "lainnya",
] as const;

export const INSTITUTION_LABEL: Record<(typeof INSTITUTION_CATEGORIES)[number], string> = {
  bps: "BPS / instansi statistik",
  pemda: "Pemerintah daerah / OPD",
  akademisi: "Akademisi / mahasiswa",
  swasta: "Swasta / perusahaan",
  masyarakat: "Masyarakat umum",
  lainnya: "Lainnya",
};

export const GENDERS = ["lk", "pr"] as const;

export const GENDER_LABEL: Record<(typeof GENDERS)[number], string> = {
  lk: "Laki-laki",
  pr: "Perempuan",
};

export const PURPOSES = [
  "konsultasi",
  "data",
  "kerjasama",
  "audiensi",
  "magang",
  "lainnya",
] as const;

export const PURPOSE_LABEL: Record<(typeof PURPOSES)[number], string> = {
  konsultasi: "Konsultasi statistik",
  data: "Permintaan data",
  kerjasama: "Kerja sama",
  audiensi: "Audiensi",
  magang: "Magang / penelitian",
  lainnya: "Lainnya",
};

/**
 * Normalisasi nomor HP ke format +62.
 * Menerima 0812..., 62812..., +62812..., dengan spasi/strip/titik.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `+62${digits}`;
  return `+${digits}`;
}

const phoneRegex = /^\+628[1-9][0-9]{6,11}$/;

export const visitFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama maksimal 80 karakter."),
  institutionCat: z.enum(INSTITUTION_CATEGORIES, {
    message: "Pilih kategori instansi.",
  }),
  institution: z
    .string()
    .trim()
    .min(2, "Nama instansi minimal 2 karakter.")
    .max(120, "Nama instansi maksimal 120 karakter."),
  phone: z
    .string()
    .trim()
    .min(9, "Nomor HP terlalu pendek.")
    .transform(normalizePhone)
    .refine((value) => phoneRegex.test(value), "Nomor HP tidak valid. Contoh: 0812 3456 7890."),
  purpose: z.enum(PURPOSES, { message: "Pilih tujuan kunjungan." }),
  gender: z.enum(GENDERS, { message: "Pilih jenis kelamin." }),
  detail: z
    .string()
    .trim()
    .max(500, "Keterangan maksimal 500 karakter.")
    .optional()
    .transform((value) => (value ? value : null)),
  /** Honeypot — manusia tidak akan mengisi ini. */
  website: z.string().max(0, "Form tidak valid.").optional(),
});

export type VisitFormInput = z.input<typeof visitFormSchema>;
export type VisitFormParsed = z.output<typeof visitFormSchema>;

/** Ambil error pertama per field supaya bisa ditampilkan di sebelah input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export function formatQueue(seq: number): string {
  return String(seq).padStart(3, "0");
}

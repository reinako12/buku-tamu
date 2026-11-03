import { z } from "zod";

export const INSTITUTION_CATEGORIES = [
  "bps",
  "pemda",
  "akademisi",
  "swasta",
  "masyarakat",
  "lainnya",
] as const;

export const GENDERS = ["lk", "pr"] as const;

export const PURPOSES = [
  "konsultasi",
  "data",
  "kerjasama",
  "audiensi",
  "magang",
  "lainnya",
] as const;

/**
 * Pesan validasi memakai kode, bukan kalimat: teks ditentukan kamus i18n
 * di sisi tampilan, sehingga error ikut berganti bahasa.
 */

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
    .min(2, "err.nameShort")
    .max(80, "err.nameLong"),
  institutionCat: z.enum(INSTITUTION_CATEGORIES, {
    message: "err.catRequired",
  }),
  institution: z
    .string()
    .trim()
    .min(2, "err.institutionShort")
    .max(80, "err.institutionLong"),
  phone: z
    .string()
    .trim()
    .min(9, "err.phoneInvalid")
    .transform(normalizePhone)
    .refine((value) => phoneRegex.test(value), "err.phoneInvalid"),
  purpose: z.enum(PURPOSES, { message: "err.purposeRequired" }),
  gender: z.enum(GENDERS, { message: "err.genderRequired" }),
  detail: z
    .string()
    .trim()
    .max(200, "err.detailLong")
    .optional()
    .transform((value) => (value ? value : null)),
  /** Honeypot — manusia tidak akan mengisi ini. */
  website: z.string().max(0, "err.formInvalid").optional(),
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

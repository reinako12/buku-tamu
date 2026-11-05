import { z } from "zod";
import { isValidPhone, normalizePhone } from "@/lib/phone";

/**
 * Form pembuka percakapan: cukup nama dan nomor WhatsApp.
 * Nomor dinormalkan dulu, validasi memakai aturan yang sama dengan buku tamu.
 */
export const chatStartSchema = z.object({
  name: z.string().trim().min(2, "err.nameShort").max(80, "err.nameLong"),
  phone: z
    .string()
    .trim()
    .min(9, "err.phoneInvalid")
    .transform(normalizePhone)
    .refine(isValidPhone, "err.phoneInvalid"),
  website: z.string().max(0, "err.formInvalid").optional(),
});

export type ChatStartParsed = z.output<typeof chatStartSchema>;

export function chatStartErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

"use server";

import { headers } from "next/headers";
import { bukaPercakapanInti } from "@/lib/chat";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { chatStartErrors, chatStartSchema } from "@/lib/schemas/chat";

export type ChatStartState = {
  errors: Record<string, string>;
  message: string | null;
  values: Record<string, string>;
  ok?: boolean;
  token?: string;
  retryAfterSeconds?: number;
};

/** Tiga percakapan baru per IP per 30 menit. Membuka ulang yang sudah ada gratis. */
const BUKA_LIMIT = 3;
const BUKA_WINDOW_MS = 30 * 60 * 1000;

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Dipakai form `/chat`. Mengembalikan token, bukan redirect: navigasi
 * dilakukan klien supaya tidak kena masalah cookie/redirect di Next 15.
 */
export async function bukaPercakapan(
  _prev: ChatStartState,
  formData: FormData,
): Promise<ChatStartState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { name: raw.name ?? "", phone: raw.phone ?? "" };

  // Honeypot.
  if (raw.website) return { errors: {}, message: "err.formInvalid", values };

  const parsed = chatStartSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: chatStartErrors(parsed.error), message: "err.formInvalid", values };
  }

  const ip = await clientIp();
  const hasil = await bukaPercakapanInti(parsed.data, () =>
    checkRateLimit(`chat-buka:${hashIp(ip)}`, BUKA_LIMIT, BUKA_WINDOW_MS),
  );

  if (!hasil.ok) {
    if (hasil.reason === "rate") {
      return {
        errors: {},
        message: "err.tooMany",
        values,
        retryAfterSeconds: hasil.retryAfterSeconds,
      };
    }
    if (hasil.reason === "phone") {
      return { errors: { phone: "err.phoneInvalid" }, message: "err.formInvalid", values };
    }
    return { errors: {}, message: "err.saveFailed", values };
  }

  return { errors: {}, message: null, values: {}, ok: true, token: hasil.token };
}

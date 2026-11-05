"use server";

import { headers } from "next/headers";
import {
  bukaPercakapanInti,
  kirimPesanPetugasInti,
  kirimPesanTamuInti,
  tandaiDibacaInti,
  tutupPercakapanInti,
  type KirimReason,
} from "@/lib/chat";
import { requireStaff } from "@/lib/auth";
import type { ChatMessage } from "@/lib/chat-types";
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

export type KirimPesanState =
  | { ok: true; message: ChatMessage }
  | { ok: false; code: string; retryAfterSeconds?: number };

/** Alasan dari inti dipetakan ke kunci kamus; klien tidak perlu tahu istilah internal. */
const KODE_GAGAL: Record<KirimReason, string> = {
  notFound: "err.chatNotFound",
  closed: "err.chatClosed",
  empty: "err.messageEmpty",
  long: "err.messageLong",
  fast: "err.chatTooFast",
  hourly: "err.chatHourly",
  failed: "err.saveFailed",
};

/**
 * Kirim pesan tamu. Sengaja mengembalikan objek, bukan melempar error:
 * komponen perlu menandai pesan yang gagal dan menawarkan kirim ulang.
 */
export async function kirimPesanTamu(
  token: string,
  body: string,
): Promise<KirimPesanState> {
  const hasil = await kirimPesanTamuInti(token, body);
  if (hasil.ok) return { ok: true, message: hasil.message };
  return {
    ok: false,
    code: KODE_GAGAL[hasil.reason],
    retryAfterSeconds: hasil.retryAfterSeconds,
  };
}

/* ============================================================
   Sisi petugas — semua lewat requireStaff
   ============================================================ */

/**
 * Balasan petugas tidak memakai kuota tamu: yang menjawab sudah login dan
 * tombol kirim ganda cukup ditahan oleh state `sending` di komponen.
 */
export async function kirimPesanPetugas(
  conversationId: string,
  body: string,
): Promise<KirimPesanState> {
  const { user } = await requireStaff("/dashboard/pesan");
  const hasil = await kirimPesanPetugasInti(conversationId, user.id, body);
  if (hasil.ok) return { ok: true, message: hasil.message };
  return { ok: false, code: KODE_GAGAL[hasil.reason] };
}

/** Dipanggil ruang petugas setiap kali pesan tamu baru masuk ke layar. */
export async function tandaiPesanDibaca(conversationId: string): Promise<void> {
  await requireStaff("/dashboard/pesan");
  await tandaiDibacaInti(conversationId);
}

export type TutupState = { ok: boolean; code?: string };

export async function tutupPercakapan(conversationId: string): Promise<TutupState> {
  await requireStaff("/dashboard/pesan");
  const ok = await tutupPercakapanInti(conversationId);
  return ok ? { ok: true } : { ok: false, code: "err.chatNotFound" };
}


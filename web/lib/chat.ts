import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { checkRateLimit } from "@/lib/rate-limit";
import { periksaPesan } from "@/lib/chat-pesan";
import type { ChatAmbil, ChatMessage } from "@/lib/chat-types";

/**
 * Alur membuka percakapan, dipisah dari server action supaya bisa diuji
 * langsung ke database tanpa lewat Next.
 *
 * Urutannya penting: cari dulu percakapan terbuka nomor itu. Kalau sudah ada,
 * tidak ada yang dibuat dan kuota rate limit tidak terpakai — tamu yang
 * me-refresh halaman tidak boleh dianggap membuat percakapan baru.
 */

export type BukaHasil =
  | { ok: true; token: string; created: boolean }
  | { ok: false; reason: "phone" | "rate" | "failed"; retryAfterSeconds?: number };

export type KuotaCek = () => { allowed: boolean; retryAfterSeconds: number };

function uniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

async function cariTerbuka(phone: string): Promise<{ token: string } | null> {
  return prisma.conversation.findFirst({
    where: { guestPhone: phone, status: "terbuka" },
    select: { token: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function bukaPercakapanInti(
  input: { name: string; phone: string },
  kuota?: KuotaCek,
): Promise<BukaHasil> {
  const phone = normalizePhone(input.phone);
  const name = input.name.trim();
  if (!isValidPhone(phone) || name.length < 2) return { ok: false, reason: "phone" };

  const existing = await cariTerbuka(phone);
  if (existing) return { ok: true, token: existing.token, created: false };

  if (kuota) {
    const check = kuota();
    if (!check.allowed) {
      return { ok: false, reason: "rate", retryAfterSeconds: check.retryAfterSeconds };
    }
  }

  try {
    const created = await prisma.conversation.create({
      data: { guestName: name, guestPhone: phone },
      select: { token: true },
    });
    return { ok: true, token: created.token, created: true };
  } catch (error) {
    // Dua permintaan bersamaan: yang kalah balapan menemukan baris pemenang
    // lewat unique index, bukan membuat ruang chat kedua.
    if (uniqueViolation(error)) {
      const again = await cariTerbuka(phone);
      if (again) return { ok: true, token: again.token, created: false };
    }
    console.error("buka percakapan gagal", error);
    return { ok: false, reason: "failed" };
  }
}

/* ============================================================
   Pesan
   ============================================================ */

export const PESAN_MAKS = 1000;
/** Satu pesan per dua detik — menahan kirim ganda karena tombol tertekan dua kali. */
const CEPAT_MS = 2_000;
const JAM_MS = 60 * 60 * 1000;
const JAM_LIMIT = 20;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type KirimReason =
  | "notFound"
  | "closed"
  | "empty"
  | "long"
  | "fast"
  | "hourly"
  | "failed";

export type KirimHasil =
  | { ok: true; message: ChatMessage }
  | { ok: false; reason: KirimReason; retryAfterSeconds?: number };

/** BigInt dari bigserial; nilainya jauh di bawah Number.MAX_SAFE_INTEGER. */
type BarisPesan = {
  seq: bigint;
  id: string;
  sender: "tamu" | "petugas" | "sistem";
  body: string;
  createdAt: Date;
};

const PILIH_PESAN = {
  seq: true,
  id: true,
  sender: true,
  body: true,
  createdAt: true,
} as const;

function kePesan(row: BarisPesan): ChatMessage {
  return {
    seq: Number(row.seq),
    id: row.id,
    sender: row.sender,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function kirimPesanTamuInti(
  token: string,
  body: string,
  now = Date.now(),
): Promise<KirimHasil> {
  const salah = periksaPesan(body);
  if (salah) return { ok: false, reason: salah };
  if (!UUID_RE.test(token)) return { ok: false, reason: "notFound" };

  const conv = await prisma.conversation.findUnique({
    where: { token },
    select: { id: true, status: true, guestPhone: true },
  });
  if (!conv) return { ok: false, reason: "notFound" };
  if (conv.status !== "terbuka") return { ok: false, reason: "closed" };

  const perJam = checkRateLimit(`chat-jam:${conv.guestPhone}`, JAM_LIMIT, JAM_MS, now);
  if (!perJam.allowed) {
    return {
      ok: false,
      reason: "hourly",
      retryAfterSeconds: perJam.retryAfterSeconds,
    };
  }

  const perDetik = checkRateLimit(`chat-cepat:${conv.id}`, 1, CEPAT_MS, now);
  if (!perDetik.allowed) {
    return {
      ok: false,
      reason: "fast",
      retryAfterSeconds: perDetik.retryAfterSeconds,
    };
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId: conv.id, sender: "tamu", body: body.trim() },
        select: PILIH_PESAN,
      });
      // Daftar percakapan petugas diurutkan dari aktivitas terakhir.
      await tx.conversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: created.createdAt },
      });
      return created;
    });
    return { ok: true, message: kePesan(row) };
  } catch (error) {
    console.error("kirim pesan gagal", error);
    return { ok: false, reason: "failed" };
  }
}

/**
 * Ambil pesan untuk halaman ruang chat maupun polling.
 *
 * `after` untuk pesan baru (polling), `before` untuk memuat yang lebih lama.
 * Tanpa keduanya: jendela terakhir — yang dibutuhkan saat halaman pertama dibuka.
 * `hasMore` hanya bermakna untuk arah `before` dan jendela awal.
 */
export async function ambilPesan(
  token: string,
  opsi: { after?: number; before?: number; limit?: number } = {},
): Promise<ChatAmbil | null> {
  if (!UUID_RE.test(token)) return null;

  const limit = Math.min(Math.max(opsi.limit ?? 50, 1), 100);
  const arahMundur = opsi.after === undefined;

  // Percakapan dan pesannya diambil dalam satu kunjungan database. Dua query
  // terpisah berarti dua kali latar jaringan — terasa sekali saat polling
  // tiga detik ke database yang jauh.
  const conv = await prisma.conversation.findUnique({
    where: { token },
    select: {
      status: true,
      guestName: true,
      messages: {
        where: {
          ...(opsi.after !== undefined ? { seq: { gt: BigInt(opsi.after) } } : {}),
          ...(opsi.before !== undefined ? { seq: { lt: BigInt(opsi.before) } } : {}),
        },
        orderBy: { seq: arahMundur ? "desc" : "asc" },
        take: limit + 1,
        select: PILIH_PESAN,
      },
    },
  });
  if (!conv) return null;

  const rows = conv.messages;
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();
  if (arahMundur) rows.reverse();

  return {
    status: conv.status,
    guestName: conv.guestName,
    messages: rows.map(kePesan),
    hasMore,
  };
}

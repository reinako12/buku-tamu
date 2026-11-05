import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidPhone, normalizePhone } from "@/lib/phone";

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

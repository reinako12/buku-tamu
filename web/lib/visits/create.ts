import "server-only";
import { prisma } from "@/lib/prisma";
import type { Visit } from "@prisma/client";

export type CreateVisitInput = {
  name: string;
  institution: string;
  institutionCat: string;
  phone: string;
  purpose: string;
  detail?: string | null;
  personCount: number;
  source: "mandiri" | "manual";
};

/**
 * Buat kunjungan dengan nomor antrian harian.
 *
 * Nomor diambil di dalam transaksi + advisory lock per tanggal, jadi dua tamu
 * yang submit bersamaan tidak mungkin dapat nomor sama. Logika ini sengaja di
 * kode (bukan fungsi SQL) supaya tetap portabel kalau pindah dari Supabase.
 */
export async function createVisit(input: CreateVisitInput): Promise<Visit> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ today: Date }[]>`
      select (now() at time zone 'Asia/Jakarta')::date as today
    `;
    const today = rows[0].today;

    // Kunci per tanggal; otomatis lepas saat transaksi selesai.
    await tx.$executeRaw`select pg_advisory_xact_lock(hashtext(${"visit:" + today.toISOString().slice(0, 10)}))`;

    const last = await tx.visit.aggregate({
      where: { queueDate: today },
      _max: { queueSeq: true },
    });
    const seq = (last._max.queueSeq ?? 0) + 1;

    const queueNo = `BT-${today.toISOString().slice(0, 10).replace(/-/g, "")}-${String(seq).padStart(3, "0")}`;

    return tx.visit.create({
      data: {
        queueDate: today,
        queueSeq: seq,
        queueNo,
        name: input.name,
        institution: input.institution,
        institutionCat: input.institutionCat,
        phone: input.phone,
        purpose: input.purpose,
        detail: input.detail ?? null,
        personCount: input.personCount,
        source: input.source,
      },
    });
  });
}

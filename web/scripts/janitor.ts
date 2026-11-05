/**
 * Perawatan percakapan berkala: tutup yang sudah kedaluwarsa, hapus yang
 * sudah lewat masa simpan.
 *
 * Dijalankan cron tiap 30 menit (lihat README). Semua keputusan "tutup atau
 * tidak" diambil oleh aturan murni di lib/chat-janitor.ts supaya bisa diuji
 * tanpa database.
 *
 *   npm run chat:janitor           tutup lalu hapus
 *   npm run chat:janitor -- --dry  hanya melapor, tidak mengubah apa pun
 */

import { PrismaClient } from "@prisma/client";
import {
  HARI_SIMPAN,
  JAM_DIAM,
  harusDihapus,
  harusDitutup,
} from "@/lib/chat-janitor";

const prisma = new PrismaClient();
const kering = process.argv.includes("--dry");

async function tutupKedaluwarsa(now: Date): Promise<number> {
  const rows = await prisma.conversation.findMany({
    where: { status: "terbuka" },
    select: {
      id: true,
      status: true,
      lastMessageAt: true,
      createdAt: true,
      visit: { select: { status: true, checkOutAt: true, checkInAt: true } },
    },
  });

  const sasaran = rows
    .filter((row) =>
      harusDitutup(
        {
          status: row.status,
          lastMessageAt: row.lastMessageAt,
          createdAt: row.createdAt,
          visitStatus: row.visit?.status ?? null,
          visitDoneAt: row.visit?.checkOutAt ?? row.visit?.checkInAt ?? null,
        },
        now,
      ),
    )
    .map((row) => row.id);

  if (sasaran.length === 0 || kering) return sasaran.length;

  const hasil = await prisma.conversation.updateMany({
    where: { id: { in: sasaran }, status: "terbuka" },
    data: { status: "ditutup", closedAt: now },
  });
  return hasil.count;
}

async function hapusLama(now: Date): Promise<number> {
  const rows = await prisma.conversation.findMany({
    where: { status: "ditutup", closedAt: { not: null } },
    select: { id: true, closedAt: true },
  });

  const sasaran = rows.filter((row) => harusDihapus(row.closedAt, now)).map((row) => row.id);

  if (sasaran.length === 0 || kering) return sasaran.length;

  // Pesan ikut terhapus lewat onDelete: Cascade di messages.conversation_id.
  const hasil = await prisma.conversation.deleteMany({ where: { id: { in: sasaran } } });
  return hasil.count;
}

async function main() {
  const now = new Date();
  const ditutup = await tutupKedaluwarsa(now);
  const dihapus = await hapusLama(now);
  const tanda = kering ? " (dry run)" : "";
  console.log(
    `[janitor]${tanda} ditutup ${ditutup}, dihapus ${dihapus} · patokan diam ${JAM_DIAM} jam, simpan ${HARI_SIMPAN} hari`,
  );
}

main()
  .catch((error) => {
    console.error("[janitor] gagal", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

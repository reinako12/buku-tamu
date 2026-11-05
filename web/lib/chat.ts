import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { perluSapa } from "@/lib/chat-janitor";
import { keLocale, pilihSambutan, teksKunjungan } from "@/lib/sambutan";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { serviceState } from "@/lib/service-hours";
import { checkRateLimit } from "@/lib/rate-limit";
import { periksaPesan } from "@/lib/chat-pesan";
import type {
  ChatMessage,
  ChatRuang,
  ChatStatus,
  RingkasPercakapan,
} from "@/lib/chat-types";

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
  input: { name: string; phone: string; locale?: string },
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
      data: {
        guestName: name,
        guestPhone: phone,
        // Bahasa tamu saat mulai chat menentukan bahasa pesan sistem nanti.
        locale: keLocale(input.locale),
      },
      select: { id: true, token: true },
    });
    // Tamu yang sudah check-in lebih dulu: tempelkan langsung ke kunjungannya.
    await tautkanKunjunganTerakhir(created.id, phone).catch((error) =>
      console.error("tautkan kunjungan gagal", error),
    );
    // Di luar jam layanan, tamu langsung tahu kapan pesannya akan dibaca.
    await sapaLuarJam(created.id).catch((error) =>
      console.error("sapa luar jam gagal", error),
    );
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
/**
 * Rentang waktu untuk mengenali kiriman ganda: pesan tamu dengan teks sama
 * persis dalam 10 detik terakhir dianggap kiriman yang sama, bukan pesan baru.
 */
const JENDELA_KEMBAR = 10_000;
const JAM_MS = 60 * 60 * 1000;
const JAM_LIMIT = 20;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type KirimReason =
  | "notFound"
  | "closed"
  | "empty"
  | "long"
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
  locale?: string,
): Promise<KirimHasil> {
  const salah = periksaPesan(body);
  if (salah) return { ok: false, reason: salah };
  if (!UUID_RE.test(token)) return { ok: false, reason: "notFound" };

  const conv = await prisma.conversation.findUnique({
    where: { token },
    select: { id: true, status: true, guestPhone: true, locale: true },
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

  // Kiriman ganda dari ketukan yang sama (tombol dua kali atau Enter beruntun)
  // berisi teks identik dan tiba berdekatan. Dibandingkan berdasarkan isi
  // pesan, bukan jeda waktu: dua permintaan yang sama bisa sampai ke server
  // lebih dari satu detik terpisah, sedangkan dua pesan pendek yang berbeda
  // ("assalamualaikum" lalu "mau tanya") tetap sah walaupun cepat.
  const teks = body.trim();
  const kembar = await prisma.message.findFirst({
    where: {
      conversationId: conv.id,
      sender: "tamu",
      body: teks,
      createdAt: { gte: new Date(now - JENDELA_KEMBAR) },
    },
    select: PILIH_PESAN,
  });
  if (kembar) return { ok: true, message: kePesan(kembar) };

  try {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId: conv.id, sender: "tamu", body: teks },
        select: PILIH_PESAN,
      });
      // Daftar percakapan petugas diurutkan dari aktivitas terakhir.
      await tx.conversation.update({
        where: { id: conv.id },
        data: {
          lastMessageAt: created.createdAt,
          // Tamu bisa berganti bahasa di tengah jalan; pesan sistem berikutnya
          // mengikuti pilihan terbaru, bukan pilihan saat percakapan dibuat.
          ...(locale && keLocale(locale) !== conv.locale
            ? { locale: keLocale(locale) }
            : {}),
        },
      });
      return created;
    });
    // Percakapan yang dibuat pada jam kerja lalu ditulis malam tetap disapa,
    // sekali saja.
    await sapaLuarJam(conv.id).catch((error) => console.error("sapa luar jam gagal", error));
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
async function ambilDengan(
  where: { token: string } | { id: string },
  opsi: { after?: number; before?: number; limit?: number } = {},
): Promise<ChatRuang | null> {
  const limit = Math.min(Math.max(opsi.limit ?? 50, 1), 100);
  const arahMundur = opsi.after === undefined;

  // Percakapan dan pesannya diambil dalam satu kunjungan database. Dua query
  // terpisah berarti dua kali latar jaringan — terasa sekali saat polling
  // tiga detik ke database yang jauh.
  const conv = await prisma.conversation.findUnique({
    where,
    select: {
      id: true,
      guestPhone: true,
      status: true,
      guestName: true,
      visit: { select: { queueNo: true } },
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
    id: conv.id,
    guestPhone: conv.guestPhone,
    queueNo: conv.visit?.queueNo ?? null,
    status: conv.status,
    guestName: conv.guestName,
    messages: rows.map(kePesan),
    hasMore,
  };
}

/** Ruang tamu: kunci aksesnya token di URL. */
export async function ambilPesan(
  token: string,
  opsi: { after?: number; before?: number; limit?: number } = {},
): Promise<ChatRuang | null> {
  if (!UUID_RE.test(token)) return null;
  return ambilDengan({ token }, opsi);
}

/** Ruang petugas: dipanggil dari halaman dashboard yang sudah dijaga sesi. */
export async function ambilPesanPetugas(
  id: string,
  opsi: { after?: number; before?: number; limit?: number } = {},
): Promise<ChatRuang | null> {
  if (!UUID_RE.test(id)) return null;
  return ambilDengan({ id }, opsi);
}

/* ============================================================
   Sisi petugas
   ============================================================ */

type BarisRingkas = {
  id: string;
  token: string;
  guest_name: string;
  guest_phone: string;
  status: string;
  last_message_at: Date | null;
  last_body: string | null;
  last_sender: string | null;
  unread: bigint;
  queue_no: string | null;
  visit_status: string | null;
};

/**
 * Daftar percakapan terbuka untuk inbox.
 *
 * Satu query, bukan satu query per percakapan: jumlah belum dibaca butuh
 * membandingkan `created_at` pesan dengan `staff_last_read_at` di baris yang
 * sama, dan itu tidak bisa dilakukan lewat API Prisma biasa. Lateral join
 * dipakai supaya pesan terakhir dan hitungannya dihitung di server database.
 */
export async function daftarPercakapan(limit = 50): Promise<RingkasPercakapan[]> {
  const batas = Math.min(Math.max(limit, 1), 200);
  const rows = await prisma.$queryRaw<BarisRingkas[]>`
    select
      c.id,
      c.token,
      c.guest_name,
      c.guest_phone,
      c.status::text as status,
      c.last_message_at,
      terakhir.body as last_body,
      terakhir.sender::text as last_sender,
      belum.n as unread,
      v.queue_no,
      v.status::text as visit_status
    from conversations c
    left join lateral (
      select m.body, m.sender
      from messages m
      where m.conversation_id = c.id
      order by m.seq desc
      limit 1
    ) terakhir on true
    left join lateral (
      select count(*) as n
      from messages m
      where m.conversation_id = c.id
        and m.sender = 'tamu'
        and (c.staff_last_read_at is null or m.created_at > c.staff_last_read_at)
    ) belum on true
    left join visits v on v.id = c.visit_id
    where c.status = 'terbuka'
    order by c.last_message_at desc nulls last, c.created_at desc
    limit ${batas}
  `;

  return rows.map((row) => ({
    id: row.id,
    token: row.token,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    status: row.status as ChatStatus,
    lastMessageAt: row.last_message_at ? row.last_message_at.toISOString() : null,
    lastBody: row.last_body,
    lastSender: (row.last_sender as RingkasPercakapan["lastSender"]) ?? null,
    unread: Number(row.unread),
    queueNo: row.queue_no,
    visitStatus: row.visit_status,
  }));
}

/** Jumlah percakapan yang punya pesan tamu setelah terakhir dibaca petugas. */
export async function hitungBelumDibaca(): Promise<number> {
  const rows = await prisma.$queryRaw<{ n: bigint }[]>`
    select count(distinct c.id) as n
    from conversations c
    join messages m on m.conversation_id = c.id
    where c.status = 'terbuka'
      and m.sender = 'tamu'
      and (c.staff_last_read_at is null or m.created_at > c.staff_last_read_at)
  `;
  return Number(rows[0]?.n ?? 0);
}

/* ============================================================
   Jam layanan
   ============================================================ */

/** Teks sambutan: isian petugas untuk bahasa tamu, atau teks bawaan. */
export async function teksSambutan(locale: string): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { id: 1 },
    select: { autoReply: true, autoReplyEn: true },
  });
  return pilihSambutan(keLocale(locale), {
    id: setting?.autoReply,
    en: setting?.autoReplyEn,
  });
}

/**
 * Sapa sekali saat tamu menulis di luar jam layanan.
 *
 * Klaim "sudah disapa" dilakukan lewat update bersyarat, bukan baca-lalu-tulis:
 * dua pesan yang masuk berbarengan tetap hanya menghasilkan satu sambutan.
 */
export async function sapaLuarJam(
  conversationId: string,
  now = new Date(),
): Promise<boolean> {
  if (serviceState(now).status === "open") {
    // Jam kerja menurut jadwal; tetap disapa kalau petugas menutup kantor.
    const setting = await prisma.setting.findUnique({
      where: { id: 1 },
      select: { isOpen: true },
    });
    if (setting?.isOpen ?? true) return false;
  }

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { status: true, autoRepliedAt: true, locale: true },
  });
  if (!conv) return false;
  if (!perluSapa({ status: conv.status, autoRepliedAt: conv.autoRepliedAt }, false)) {
    return false;
  }

  const klaim = await prisma.conversation.updateMany({
    where: { id: conversationId, status: "terbuka", autoRepliedAt: null },
    data: { autoRepliedAt: now },
  });
  if (klaim.count === 0) return false;

  await prisma.message.create({
    data: { conversationId, sender: "sistem", body: await teksSambutan(conv.locale) },
  });
  return true;
}

/* ============================================================
   Sambungan ke kunjungan
   ============================================================ */

export { teksKunjungan };

async function kirimSistem(conversationId: string, body: string): Promise<void> {
  const now = new Date();
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: now,
      messages: { create: { sender: "sistem", body } },
    },
  });
}

/**
 * Dipanggil setelah check-in berhasil. Percakapan terbuka dengan nomor yang
 * sama disambungkan ke kunjungan baru, lalu tamu menerima nomor antriannya
 * di ruang chat — satu percakapan, bukan dua.
 *
 * Kegagalan di sini tidak boleh menggagalkan check-in: tamu sudah tercatat,
 * tautan chat hanya pelengkap.
 */
export async function sambungKunjunganInti(input: {
  visitId: string;
  phone: string;
  queueNo: string;
}): Promise<void> {
  const conv = await prisma.conversation.findFirst({
    where: { guestPhone: input.phone, status: "terbuka", visitId: null },
    select: { id: true, locale: true },
  });
  if (!conv) return;

  await prisma.conversation.update({
    where: { id: conv.id },
    data: { visitId: input.visitId },
  });
  await kirimSistem(conv.id, teksKunjungan(input.queueNo, conv.locale));
}

/**
 * Kebalikannya: tamu check-in dulu, baru membuka chat. Percakapan yang baru
 * dibuat ditempelkan ke kunjungan terakhir dengan nomor sama (maksimal 12 jam
 * ke belakang) supaya petugas tidak melihat dua baris untuk satu orang.
 */
export async function tautkanKunjunganTerakhir(
  conversationId: string,
  phone: string,
): Promise<void> {
  const batas = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const visit = await prisma.visit.findFirst({
    where: {
      phone,
      checkInAt: { gte: batas },
      conversation: { is: null },
    },
    orderBy: { checkInAt: "desc" },
    select: { id: true },
  });
  if (!visit) return;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { visitId: visit.id },
  });
}

export type JadikanHasil =
  | { ok: true; queueNo: string }
  | { ok: false; error: "notFound" | "sudahTerkait" | "failed" };

/**
 * "Jadikan kunjungan" dari inbox: tamu datang tanpa mengisi form, petugas
 * menaikkannya jadi baris kunjungan resmi tanpa mengetik ulang nama dan nomor.
 * Nomor antrian tetap terbit dari fungsi `create_visit` yang sama.
 */
export async function jadikanKunjunganInti(
  conversationId: string,
  data: {
    institution: string;
    institutionCat: string;
    purpose: string;
    gender: string;
  },
): Promise<JadikanHasil> {
  if (!UUID_RE.test(conversationId)) return { ok: false, error: "notFound" };

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, guestName: true, guestPhone: true, visitId: true, locale: true },
  });
  if (!conv) return { ok: false, error: "notFound" };
  if (conv.visitId) return { ok: false, error: "sudahTerkait" };

  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; queue_no: string }>>`
      SELECT * FROM create_visit(
        ${conv.guestName}::text,
        ${data.institution}::text,
        ${data.institutionCat}::text,
        ${conv.guestPhone}::text,
        ${data.purpose}::text,
        ${null}::text,
        ${1}::int,
        ${"manual"}::visit_source,
        ${data.gender}::visit_gender
      )`;
    const visit = rows[0];
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { visitId: visit.id },
    });
    await kirimSistem(conv.id, teksKunjungan(visit.queue_no, conv.locale));
    return { ok: true, queueNo: visit.queue_no };
  } catch (error) {
    console.error("jadikan kunjungan gagal", error);
    return { ok: false, error: "failed" };
  }
}

/**
 * Untuk papan antrian: kunjungan mana yang punya pesan tamu belum dibaca.
 * Hasilnya peta `visitId -> conversationId` supaya barisnya bisa ditautkan
 * langsung ke percakapan yang dimaksud.
 */
export async function belumDibacaPerKunjungan(
  visitIds: string[],
): Promise<Map<string, string>> {
  const ids = visitIds.filter((id) => UUID_RE.test(id));
  if (ids.length === 0) return new Map();

  const rows = await prisma.$queryRaw<Array<{ visit_id: string; conversation_id: string }>>`
    select c.visit_id, c.id as conversation_id
    from conversations c
    where c.status = 'terbuka'
      and c.visit_id = any(${ids}::uuid[])
      and exists (
        select 1 from messages m
        where m.conversation_id = c.id
          and m.sender = 'tamu'
          and (c.staff_last_read_at is null or m.created_at > c.staff_last_read_at)
      )
  `;

  return new Map(rows.map((row) => [row.visit_id, row.conversation_id]));
}

export async function kirimPesanPetugasInti(
  conversationId: string,
  staffId: string,
  body: string,
): Promise<KirimHasil> {
  const salah = periksaPesan(body);
  if (salah) return { ok: false, reason: salah };
  if (!UUID_RE.test(conversationId)) return { ok: false, reason: "notFound" };

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, status: true },
  });
  if (!conv) return { ok: false, reason: "notFound" };
  if (conv.status !== "terbuka") return { ok: false, reason: "closed" };

  try {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId: conv.id, sender: "petugas", staffId, body: body.trim() },
        select: PILIH_PESAN,
      });
      await tx.conversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: created.createdAt, staffLastReadAt: created.createdAt },
      });
      return created;
    });
    return { ok: true, message: kePesan(row) };
  } catch (error) {
    console.error("kirim pesan petugas gagal", error);
    return { ok: false, reason: "failed" };
  }
}

/** Menandai seluruh pesan tamu sampai detik ini sudah dibaca petugas. */
export async function tandaiDibacaInti(conversationId: string): Promise<boolean> {
  if (!UUID_RE.test(conversationId)) return false;
  try {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { staffLastReadAt: new Date() },
      select: { id: true },
    });
    return true;
  } catch {
    return false;
  }
}

/** Menutup percakapan. Hanya baris yang masih terbuka yang berubah. */
export async function tutupPercakapanInti(conversationId: string): Promise<boolean> {
  if (!UUID_RE.test(conversationId)) return false;
  const hasil = await prisma.conversation.updateMany({
    where: { id: conversationId, status: "terbuka" },
    data: { status: "ditutup", closedAt: new Date() },
  });
  return hasil.count > 0;
}


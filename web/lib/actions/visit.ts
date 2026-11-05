"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { fieldErrors, normalizePhone, visitFormSchema } from "@/lib/schemas/visit";
import { serviceState } from "@/lib/service-hours";
import { sambungKunjunganInti } from "@/lib/chat";

export type FormState = {
  errors: Record<string, string>;
  message: string | null;
  values: Record<string, string>;
  ok?: boolean;
  token?: string;
};


async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function createVisit(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;

  const keepValues = {
    name: raw.name ?? "",
    institution: raw.institution ?? "",
    institutionCat: raw.institutionCat ?? "",
    phone: raw.phone ?? "",
    purpose: raw.purpose ?? "",
    gender: raw.gender ?? "",
    detail: raw.detail ?? "",
  };

  // Honeypot: field tersembunyi yang hanya diisi bot.
  if (raw.website) {
    return { errors: {}, message: "err.formInvalid", values: keepValues };
  }

  const parsed = visitFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      message: "err.formInvalid",
      values: keepValues,
    };
  }

  // Dua hal ini tidak saling bergantung: ambil bersamaan agar hemat satu
  // putaran jaringan (terasa di koneksi lambat).
  const [ip, setting] = await Promise.all([
    clientIp(),
    prisma.setting.findUnique({ where: { id: 1 } }),
  ]);

  const limit = checkRateLimit(`visit:${hashIp(ip)}`);
  if (!limit.allowed) {
    return { errors: {}, message: "err.tooMany", values: keepValues };
  }
  if (setting && !setting.isOpen) {
    return {
      errors: {},
      message: "err.closed",
      values: keepValues,
    };
  }

  const data = parsed.data;

  let token: string;
  let visitId: string;
  let queueNo: string;
  try {
    const rows = await prisma.$queryRaw<
      Array<{ token: string; id: string; queue_no: string }>
    >`
      SELECT * FROM create_visit(
        ${data.name}::text,
        ${data.institution}::text,
        ${data.institutionCat}::text,
        ${data.phone}::text,
        ${data.purpose}::text,
        ${data.detail}::text,
        ${1}::int,
        ${"mandiri"}::visit_source,
        ${data.gender}::visit_gender
      )`;
    token = rows[0].token;
    visitId = rows[0].id;
    queueNo = rows[0].queue_no;
  } catch (error) {
    console.error("create_visit gagal", error);
    return {
      errors: {},
      message: "err.saveFailed",
      values: keepValues,
    };
  }

  // Percakapan terbuka dengan nomor yang sama ikut tersambung ke kunjungan
  // ini supaya petugas melihat satu orang, bukan dua baris terpisah. Tamu
  // juga menerima nomor antriannya di ruang chat.
  await sambungKunjunganInti({
    visitId,
    phone: normalizePhone(data.phone),
    queueNo,
  }).catch((error: unknown) => console.error("sambung kunjungan gagal", error));

  // Navigasi dilakukan di klien: redirect() setelah cookies().set() tidak
  // selalu terbaca browser pada Next 15, tamu jadi tertahan di form.
  return { errors: {}, message: null, values: {}, ok: true, token };
}

export type RepeatVisitor = {
  name: string;
  institution: string;
  institutionCat: string;
  gender: string | null;
};

/**
 * Auto-fill untuk tamu yang pernah datang: cari kunjungan terakhir dengan
 * nomor HP yang sama. Tidak mengembalikan data tamu lain.
 */
export async function lookupRepeatVisitor(phone: string): Promise<RepeatVisitor | null> {
  const normalized = normalizePhone(phone ?? "");
  if (!/^\+628[1-9][0-9]{6,11}$/.test(normalized)) return null;

  const last = await prisma.visit.findFirst({
    where: { phone: normalized },
    orderBy: { checkInAt: "desc" },
    select: { name: true, institution: true, institutionCat: true, gender: true },
  });

  return last ?? null;
}

/** Dipakai halaman form untuk tahu apakah layanan sedang tutup. */
export async function currentServiceState() {
  return serviceState(new Date());
}

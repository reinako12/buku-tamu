"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { fieldErrors, normalizePhone, visitFormSchema } from "@/lib/schemas/visit";
import { serviceState } from "@/lib/service-hours";

export type FormState = {
  errors: Record<string, string>;
  message: string | null;
  values: Record<string, string>;
  ok?: boolean;
};


const COOKIE_NAME = "visit_token";

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
    return { errors: {}, message: "Form tidak valid.", values: keepValues };
  }

  const parsed = visitFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      message: "Periksa kembali isian yang ditandai.",
      values: keepValues,
    };
  }

  const limit = checkRateLimit(`visit:${hashIp(await clientIp())}`);
  if (!limit.allowed) {
    return {
      errors: {},
      message: `Terlalu banyak percobaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      values: keepValues,
    };
  }

  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  if (setting && !setting.isOpen) {
    return {
      errors: {},
      message:
        setting.closedReason ??
        "Buku tamu sedang ditutup. Silakan datang pada jam layanan.",
      values: keepValues,
    };
  }

  const data = parsed.data;

  let token: string;
  try {
    const rows = await prisma.$queryRaw<Array<{ token: string }>>`
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
  } catch (error) {
    console.error("create_visit gagal", error);
    return {
      errors: {},
      message: "Gagal menyimpan data. Coba lagi sebentar lagi.",
      values: keepValues,
    };
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  redirect(`/t/${token}`);
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

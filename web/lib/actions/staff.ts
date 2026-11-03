"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canTransition, isVisitStatus, type VisitStatus } from "@/lib/visit-status";
import { fieldErrors, visitFormSchema } from "@/lib/schemas/visit";

export type ActionResult = { ok: boolean; error?: string };

async function requireStaff() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("UNAUTHENTICATED");

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) throw new Error("FORBIDDEN");

  return profile;
}

export async function setVisitStatus(
  visitId: string,
  nextStatus: string,
): Promise<ActionResult> {
  let profile;
  try {
    profile = await requireStaff();
  } catch {
    return { ok: false, error: "err.sessionExpired" };
  }

  if (!isVisitStatus(nextStatus)) {
    return { ok: false, error: "err.statusUnknown" };
  }

  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) return { ok: false, error: "err.notFound" };

  if (!canTransition(visit.status as VisitStatus, nextStatus)) {
    return {
      ok: false,
      error: `Tidak bisa mengubah dari "${visit.status}" ke "${nextStatus}".`,
    };
  }

  const now = new Date();

  await prisma.visit.update({
    where: { id: visitId },
    data: {
      status: nextStatus,
      handledBy:
        nextStatus === "dilayani" || nextStatus === "selesai"
          ? profile.id
          : undefined,
      checkOutAt:
        nextStatus === "selesai" || nextStatus === "batal" ? now : undefined,
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export type WalkInState = {
  ok: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
};

/**
 * Input manual oleh petugas: tamu yang datang langsung tanpa mengisi form
 * (misal lupa HP atau tidak bawa gawai).
 */
export async function addWalkIn(
  _prev: WalkInState,
  formData: FormData,
): Promise<WalkInState> {
  try {
    await requireStaff();
  } catch {
    return { ok: false, error: "err.sessionExpired", fieldErrors: {} };
  }

  const parsed = visitFormSchema.safeParse(
    Object.fromEntries(formData) as Record<string, string>,
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: "err.formInvalid",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    await prisma.$queryRaw`
      SELECT * FROM create_visit(
        ${data.name}::text,
        ${data.institution}::text,
        ${data.institutionCat}::text,
        ${data.phone}::text,
        ${data.purpose}::text,
        ${data.detail}::text,
        ${1}::int,
        ${"manual"}::visit_source,
        ${data.gender}::visit_gender
      )`;
  } catch (error) {
    console.error("addWalkIn gagal", error);
    return { ok: false, error: "err.saveFailed", fieldErrors: {} };
  }

  revalidatePath("/dashboard");
  return { ok: true, error: null, fieldErrors: {} };
}

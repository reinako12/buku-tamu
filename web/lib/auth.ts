import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Pastikan pemanggil adalah petugas yang sudah login. Dipakai server action
 * dan halaman yang tidak boleh diakses tamu.
 */
export async function requireStaff(nextPath = "/dashboard") {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) redirect("/masuk");

  return { user, profile };
}

/**
 * Sama seperti requireStaff, tetapi mengembalikan null alih-alih me-redirect.
 * Dipakai rute API: peramban yang memanggil fetch tidak butuh halaman login,
 * cukup jawaban 401.
 */
export async function staffSesi() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, fullName: true },
  });
  return profile ? { user, profile } : null;
}

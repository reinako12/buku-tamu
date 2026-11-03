import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Keluar lewat route handler, bukan server action: action yang menghapus cookie
 * sesi tidak selalu meneruskan redirect ke browser (Next 15), akibatnya tombol
 * Keluar terlihat "tidak bekerja".
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/masuk", request.url), { status: 303 });
}

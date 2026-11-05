import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Keluar lewat route handler, bukan server action: action yang menghapus cookie
 * sesi tidak selalu meneruskan redirect ke browser (Next 15), akibatnya tombol
 * Keluar terlihat "tidak bekerja".
 *
 * Alamat tujuan sengaja ditulis relatif. `request.url` di dalam route handler
 * memakai alamat internal server (localhost:3100), sehingga membangun URL
 * absolut dari situ melempar peramban petugas ke alamat yang tidak ada begitu
 * aplikasi diakses lewat domain publik.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return new Response(null, { status: 303, headers: { location: "/masuk" } });
}

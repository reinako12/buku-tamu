import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Apakah permintaan ini datang lewat https. Dipakai untuk menandai cookie
 * Secure: tanpa tanda itu, peramban masih mau mengirim cookie sesi lewat
 * http:// ke domain yang sama. Di balik Cloudflare, skema asli hanya
 * terlihat dari x-forwarded-proto.
 */
async function lewatHttps(): Promise<boolean> {
  const h = await headers();
  return (
    h.get("x-forwarded-proto")?.split(",")[0].trim() === "https" ||
    h.get("x-forwarded-ssl") === "on"
  );
}

/**
 * Client untuk server component / server action dengan sesi petugas (cookie).
 * Hormati RLS — dipakai dashboard admin.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const aman = await lewatHttps();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // httpOnly: token sesi tidak boleh terbaca JavaScript halaman.
            // Realtime tidak lagi bergantung pada cookie ini — tokennya
            // dikirim server ke komponen papan antrian (lihat VisitBoard).
            cookieStore.set(name, value, { ...options, httpOnly: true, secure: aman });
          });
        } catch {
          // Dipanggil dari server component — cookie tidak bisa ditulis.
          // Middleware yang menangani refresh sesi.
        }
      },
    },
  });
}

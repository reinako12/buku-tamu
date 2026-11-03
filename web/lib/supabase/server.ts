import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Client untuk server component / server action dengan sesi petugas (cookie).
 * Hormati RLS — dipakai dashboard admin.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Dipanggil dari server component — cookie tidak bisa ditulis.
          // Middleware yang menangani refresh sesi.
        }
      },
    },
  });
}

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseServiceKey, supabaseUrl } from "@/lib/env";

/**
 * Client service-role. Melewati RLS.
 *
 * ATURAN PAKAI:
 * - Hanya di server action / route handler.
 * - Wajib memvalidasi `visit_token` atau sesi petugas SEBELUM menyentuh data.
 * - Jangan pernah diimpor dari file yang bisa masuk bundle client.
 */
export function createSupabaseAdminClient() {
  return createClient(supabaseUrl(), supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

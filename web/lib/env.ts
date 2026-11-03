/**
 * Env yang dipakai aplikasi. Semua divalidasi saat dipakai, bukan saat import,
 * supaya `next build` tetap jalan tanpa kredensial (penting untuk CI).
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Env ${name} belum di-set. Lihat web/.env.example`);
  }
  return value;
}

export const supabaseUrl = () => required("NEXT_PUBLIC_SUPABASE_URL");
export const supabaseAnonKey = () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Service role: HANYA untuk server action yang memvalidasi token tamu.
 * Jangan pernah diimpor dari komponen client.
 */
export const supabaseServiceKey = () => required("SUPABASE_SERVICE_ROLE_KEY");

/** Salt untuk hash IP di rate limiter — biar IP mentah tidak tersimpan. */
export const rateLimitSalt = () => process.env.RATE_LIMIT_SALT ?? "dev-only-salt";

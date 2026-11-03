/**
 * Env yang dipakai aplikasi. Divalidasi saat dipakai, bukan saat import,
 * supaya `next build` tetap jalan tanpa kredensial (penting untuk CI).
 *
 * DATABASE_URL / DIRECT_URL dibaca langsung oleh Prisma (lihat prisma/schema.prisma),
 * tidak lewat file ini.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Env ${name} belum diisi. Lihat .env.example.`);
  }
  return value;
}

/** Supabase — sekarang hanya untuk Auth dan Realtime, bukan akses data. */
export const supabaseUrl = () => required("NEXT_PUBLIC_SUPABASE_URL");
export const supabaseAnonKey = () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/** Salt untuk hash IP di rate limiter form publik. */
export const rateLimitSalt = () => required("RATE_LIMIT_SALT");

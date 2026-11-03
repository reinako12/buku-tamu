import { createHash } from "node:crypto";

/**
 * Rate limiter in-memory.
 *
 * Cukup untuk 1 instance (Vercel serverless dengan 1 region tetap). Kalau nanti
 * jalan di lebih dari satu instance, pindah ke tabel `rate_limits` di Postgres —
 * jangan tambah Redis, biar cukup satu layanan.
 */

type Bucket = { hits: number[]; };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5_000;

export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? "dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

function prune(bucket: Bucket, windowMs: number, now: number) {
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
}

/**
 * @returns `retryAfterSeconds` = 0 kalau boleh lanjut.
 */
export function checkRateLimit(
  key: string,
  limit = 3,
  windowMs = 30_000,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  if (buckets.size > MAX_KEYS) buckets.clear();

  const bucket = buckets.get(key) ?? { hits: [] };
  prune(bucket, windowMs, now);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    buckets.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Untuk unit test — jangan dipakai di kode aplikasi. */
export function resetRateLimit() {
  buckets.clear();
}

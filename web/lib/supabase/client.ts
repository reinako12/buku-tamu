"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Client browser — HANYA untuk Auth (sesi petugas) dan Realtime.
 * Jangan pakai untuk query data: semua data lewat Prisma di server.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}

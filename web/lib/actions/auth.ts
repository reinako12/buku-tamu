"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";

export type LoginState = { error: string | null; ok?: boolean; next?: string };

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "err.loginRequired" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Pesan sengaja umum: jangan bocorkan apakah email terdaftar.
    return { error: "err.loginFailed" };
  }

  // Sama seperti form tamu: redirect() setelah cookie sesi ditulis tidak
  // selalu diteruskan ke browser, jadi navigasi dikerjakan di klien.
  return { error: null, ok: true, next };
}

// Keluar ditangani route handler app/api/keluar (lihat catatan di sana).

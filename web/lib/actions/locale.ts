"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/dict";

const LOCALE_COOKIE = "locale";

export async function setLocale(next: string) {
  const locale: Locale = LOCALES.includes(next as Locale)
    ? (next as Locale)
    : DEFAULT_LOCALE;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}

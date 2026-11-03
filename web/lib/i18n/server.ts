import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALES,
  translate,
  type DictKey,
  type Locale,
} from "@/lib/i18n/dict";

export const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

/** Pemakaian di server component: `const t = await getT(); t("home.title")` */
export async function getT() {
  const locale = await getLocale();
  return (key: DictKey, vars?: Record<string, string>) =>
    translate(locale, key, vars);
}

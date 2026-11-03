"use client";

import { createContext, useContext } from "react";
import { translate, type DictKey, type Locale } from "@/lib/i18n/dict";

type T = (key: DictKey, vars?: Record<string, string>) => string;

const I18nContext = createContext<{ locale: Locale; t: T }>({
  locale: "id",
  t: (key) => key,
});

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t: T = (key, vars) => translate(locale, key, vars);
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useT(): T {
  return useContext(I18nContext).t;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}

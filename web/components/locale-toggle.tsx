"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/actions/locale";
import { useLocale, useT } from "@/lib/i18n/client";
import { LOCALES, type Locale } from "@/lib/i18n/dict";

const SHORT: Record<Locale, string> = { id: "ID", en: "EN" };

export function LocaleToggle() {
  const current = useLocale();
  const t = useT();
  const [pending, start] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className="inline-flex items-center overflow-hidden rounded-lg border border-border-strong"
    >
      {LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => start(() => setLocale(locale))}
            disabled={pending || active}
            aria-pressed={active}
            aria-label={
              locale === "id" ? t("common.languageId") : t("common.languageEn")
            }
            className={`min-h-[44px] px-md text-caption font-medium transition-colors ${
              active
                ? "bg-primary text-white"
                : "text-ink-muted hover:bg-surface-muted"
            }`}
          >
            {SHORT[locale]}
          </button>
        );
      })}
    </div>
  );
}

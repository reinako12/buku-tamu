"use client";

import { THEME_COOKIE, THEMES, type Theme } from "@/lib/theme";
import { useT } from "@/lib/i18n/client";

/** Tema yang sedang tampil. Tanpa pilihan tersimpan, berarti terang. */
function currentTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  return THEMES.includes(attr as Theme) ? (attr as Theme) : "light";
}

export function ThemeToggle() {
  const t = useT();

  /**
   * Sengaja tidak lewat server action: mengganti tema cukup mengubah satu
   * atribut di <html>, dan cookie disimpan supaya pilihan itu ikut terbaca
   * saat halaman berikutnya dimuat server.
   */
  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("common.themeToggle")}
      title={t("common.themeToggle")}
      className="inline-flex min-h-[44px] w-[44px] items-center justify-center rounded-lg
                 border border-border-strong text-ink-muted transition-colors
                 hover:bg-surface-muted hover:text-ink"
    >
      {/* Dua ikon, yang tampil diatur CSS lewat atribut tema — tidak ada
          state React, jadi tidak ada kedipan sebelum hidrasi. */}
      <svg
        className="theme-icon theme-icon-light"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        className="theme-icon theme-icon-dark"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
}

/** Nama cookie pilihan tema. Dibaca di server, ditulis di browser. */
export const THEME_COOKIE = "tema";

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

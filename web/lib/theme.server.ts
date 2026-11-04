import "server-only";
import { cookies } from "next/headers";
import { THEME_COOKIE, THEMES, type Theme } from "@/lib/theme";

/**
 * null berarti pengunjung belum pernah memilih. Dalam kondisi itu tampilan
 * ikut setelan perangkat, dan itu diurus CSS (prefers-color-scheme), bukan
 * di sini — supaya tidak ada kedipan tema saat halaman pertama dimuat.
 */
export async function getTheme(): Promise<Theme | null> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return THEMES.includes(value as Theme) ? (value as Theme) : null;
}

import "server-only";
import { cookies } from "next/headers";
import { THEME_COOKIE, THEMES, type Theme } from "@/lib/theme";

/**
 * null berarti pengunjung belum pernah memilih, dan tampilannya terang.
 * Dibiarkan null (bukan diisi "light") supaya CSS yang menentukan, sehingga
 * tidak ada kedipan tema saat halaman pertama dimuat.
 */
export async function getTheme(): Promise<Theme | null> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return THEMES.includes(value as Theme) ? (value as Theme) : null;
}

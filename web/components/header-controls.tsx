import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

/** Bahasa + tema. Dipasang di kop semua halaman; tidak ikut tercetak. */
export function HeaderControls() {
  return (
    <div className="no-print flex items-center gap-xs">
      <LocaleToggle />
      <ThemeToggle />
    </div>
  );
}

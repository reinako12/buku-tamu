"use client";

import { useT } from "@/lib/i18n/client";

export function PrintButton() {
  const t = useT();
  return (
    <button type="button" className="btn-ghost w-full" onClick={() => window.print()}>
      {t("ticket.print")}
    </button>
  );
}

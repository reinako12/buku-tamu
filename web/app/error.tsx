"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";

/**
 * Batas galat per halaman. Jangan menampilkan detail teknis ke tamu:
 * cukup pesan yang bisa ditindaklanjuti dan tombol coba lagi.
 */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    // Satu baris untuk log; tanpa data pribadi tamu.
    console.error("page_error", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-form flex-col justify-center px-md py-xl">
      <h1 className="text-heading-page text-ink">{t("error.title")}</h1>
      <p className="mt-xs text-body-md text-ink-muted">{t("error.body")}</p>
      <button
        type="button"
        onClick={reset}
        className="btn-primary mt-lg w-full sm:w-auto"
      >
        {t("error.retry")}
      </button>
    </main>
  );
}

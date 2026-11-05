import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { HeaderControls } from "@/components/header-controls";
import { ChatStartForm } from "@/components/chat/start-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat — Buku Tamu BPS Kabupaten Tanah Datar",
  robots: { index: false, follow: false },
};

/**
 * Pintu masuk percakapan. Tidak memakai nomor antrian: tamu boleh bertanya
 * sebelum datang, dan percakapan tidak terikat ke satu kunjungan.
 */
export default async function ChatStartPage() {
  const t = await getT();

  return (
    <main className="mx-auto w-full max-w-page px-md py-lg sm:py-xl">
      <header className="masthead mb-lg flex flex-wrap items-start justify-between gap-sm">
        <div>
          <p className="masthead-org">{t("org.name")}</p>
          <p className="masthead-unit">{t("org.unit")}</p>
        </div>
        <HeaderControls />
      </header>

      <h1 className="text-display-hero text-ink">{t("chat.title")}</h1>
      <p className="mt-xs max-w-[52ch] text-body-md text-ink-muted">{t("chat.lead")}</p>

      <div className="sheet sheet-accent mt-md">
        <ChatStartForm />
      </div>

      <p className="mt-md text-body-sm text-ink-muted">
        <Link href="/" className="btn-quiet px-0">
          {t("chat.backHome")}
        </Link>
      </p>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAutoReopen } from "@/lib/settings";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/format";
import { LocaleToggle } from "@/components/locale-toggle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buku tamu ditutup",
  robots: { index: false, follow: false },
};

export default async function ClosedPage() {
  const t = await getT();
  const locale = await getLocale();
  const setting = await ensureAutoReopen();

  // Sudah dibuka (mungkin oleh auto-reopen) — tidak ada gunanya menahan tamu di sini.
  if (setting?.isOpen !== false) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-form flex-col justify-center px-md py-xl">
      <header className="masthead mb-lg flex items-start justify-between gap-sm">
        <div>
          <p className="masthead-org">{t("org.name")}</p>
          <p className="masthead-unit">{t("org.unit")}</p>
        </div>
        <LocaleToggle />
      </header>

      <h1 className="text-heading-page text-ink">{t("closed.title")}</h1>
      <p className="mt-xs text-body-md text-ink-muted">
        {setting?.closedReason ?? t("closed.defaultReason")}
      </p>

      {setting?.reopenAt ? (
        <p className="mt-sm text-body-sm text-ink">
          {t("closed.reopenAt", { time: formatDateTime(setting.reopenAt, locale) })}
        </p>
      ) : null}

      <div className="meta-strip mt-lg">
        <span>{t("home.hoursLabel")}</span>
        <span className="font-medium text-ink">{t("hours.label")}</span>
      </div>

      <Link href="/" className="btn-ghost mt-md w-full">
        {t("closed.tryAgain")}
      </Link>
    </main>
  );
}

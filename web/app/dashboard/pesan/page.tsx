import type { Metadata } from "next";
import Link from "next/link";
import { daftarPercakapan, hitungBelumDibaca } from "@/lib/chat";
import { requireStaff } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { HeaderControls } from "@/components/header-controls";
import { InboxLink } from "@/components/dashboard/inbox-link";
import { InboxList } from "@/components/dashboard/inbox-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pesan tamu",
  robots: { index: false, follow: false },
};

export default async function InboxPage() {
  const { profile } = await requireStaff("/dashboard/pesan");
  const t = await getT();

  const [conversations, belum] = await Promise.all([
    daftarPercakapan(),
    hitungBelumDibaca(),
  ]);

  return (
    <main className="mx-auto w-full max-w-container px-md py-lg">
      <header className="masthead mb-md flex flex-wrap items-end justify-between gap-sm sm:mb-lg">
        <div>
          <p className="masthead-org">{t("org.name")}</p>
          <p className="masthead-unit hidden sm:block">{t("org.unit")}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-xs">
          <HeaderControls />
          <Link href="/dashboard" className="btn-quiet">
            {t("inbox.back")}
          </Link>
          <InboxLink aktif />
          <form action="/api/keluar" method="post">
            <button type="submit" className="btn-quiet">
              {t("common.logout")}
            </button>
          </form>
        </div>
      </header>

      <div className="mb-md">
        <h1 className="text-heading-card text-ink sm:text-heading-page">{t("inbox.title")}</h1>
        <p className="mt-2xs text-caption text-ink-muted sm:text-body-sm">
          {t("inbox.lead")}
          {belum > 0 ? ` ${t("inbox.unread", { n: String(belum) })}.` : ""}
        </p>
        <p className="mt-2xs text-caption text-ink-muted">
          {t("dash.staff")}: {profile.fullName}.
        </p>
      </div>

      <div className="max-w-form">
        <InboxList initial={conversations} />
        <p className="mt-md text-caption text-ink-muted">{t("inbox.pick")}</p>
      </div>
    </main>
  );
}

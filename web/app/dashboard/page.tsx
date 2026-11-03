import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayInJakarta } from "@/lib/visit-status";
import { VisitBoard, type BoardVisit } from "@/components/visit-board";
import { WalkInDialog } from "@/components/walk-in-dialog";
import { ClosedBanner } from "@/components/closed-banner";
import { ensureAutoReopen } from "@/lib/settings";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDate } from "@/lib/format";
import { LocaleToggle } from "@/components/locale-toggle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard petugas",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/masuk");

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) redirect("/masuk");

  const t = await getT();
  const locale = await getLocale();
  const setting = await ensureAutoReopen();
  const today = todayInJakarta();
  const rows = await prisma.visit.findMany({
    where: { queueDate: today },
    orderBy: { queueSeq: "asc" },
  });

  const visits: BoardVisit[] = rows.map((row) => ({
    id: row.id,
    queueSeq: row.queueSeq,
    queueNo: row.queueNo,
    name: row.name,
    institution: row.institution,
    institutionCat: row.institutionCat,
    purpose: row.purpose,
    detail: row.detail,
    gender: row.gender,
    status: row.status,
    phone: row.phone,
    checkInAt: row.checkInAt.toISOString(),
    source: row.source,
  }));

  const todayLabel = formatDate(new Date(), locale);

  return (
    <main className="mx-auto w-full max-w-container px-md py-lg">
      <header className="masthead mb-md flex flex-wrap items-end justify-between gap-sm sm:mb-lg">
        <div>
          <p className="masthead-org">{t("org.name")}</p>
          <p className="masthead-unit hidden sm:block">{t("org.unit")}</p>
        </div>

        <div className="flex items-center gap-xs">
          <LocaleToggle />
          <Link href="/pengaturan" className="btn-quiet">
            {t("common.settings")}
          </Link>
          <form action="/api/keluar" method="post">
            <button type="submit" className="btn-quiet">
              {t("common.logout")}
            </button>
          </form>
        </div>
      </header>

      <div className="mb-md">
        <div className="flex items-center justify-between gap-sm">
          <h1 className="text-heading-card text-ink sm:text-heading-page">{t("dash.title")}</h1>
          <WalkInDialog />
        </div>
        <p className="mt-2xs text-caption text-ink-muted sm:text-body-sm">
          {todayLabel}. {t("dash.staff")}: {profile.fullName}.
        </p>
      </div>

      {setting && !setting.isOpen ? (
        <ClosedBanner reopenAt={setting.reopenAt} />
      ) : null}

      <VisitBoard initialVisits={visits} />
    </main>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayInJakarta } from "@/lib/visit-status";
import { signOut } from "@/lib/actions/auth";
import { VisitBoard, type BoardVisit } from "@/components/visit-board";
import { WalkInDialog } from "@/components/walk-in-dialog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard petugas — Buku Tamu BPS",
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
    personCount: row.personCount,
    status: row.status,
    phone: row.phone,
    checkInAt: row.checkInAt.toISOString(),
    source: row.source,
  }));

  const todayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  return (
    <main className="mx-auto w-full max-w-container px-md py-lg">
      <header className="mb-md flex flex-wrap items-end justify-between gap-sm">
        <div>
          <p className="text-caption uppercase tracking-wide text-ink-muted">
            BPS Kabupaten Tanah Datar
          </p>
          <h1 className="text-heading-page text-primary">Buku tamu hari ini</h1>
          <p className="mt-2xs text-body-sm text-ink-muted">
            {todayLabel} · {profile.fullName}
          </p>
        </div>

        <div className="flex items-center gap-sm">
          <WalkInDialog />
          <form action={signOut}>
            <button type="submit" className="btn-ghost">
              Keluar
            </button>
          </form>
        </div>
      </header>

      <VisitBoard initialVisits={visits} />
    </main>
  );
}

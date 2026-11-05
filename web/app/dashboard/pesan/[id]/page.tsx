import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ambilPesanPetugas, daftarPercakapan } from "@/lib/chat";
import { requireStaff } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { HeaderControls } from "@/components/header-controls";
import { InboxLink } from "@/components/dashboard/inbox-link";
import { InboxList } from "@/components/dashboard/inbox-list";
import { StaffRoom } from "@/components/dashboard/staff-room";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Percakapan tamu",
  robots: { index: false, follow: false },
};

export default async function PercakapanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStaff(`/dashboard/pesan/${id}`);
  const t = await getT();

  const [ruang, conversations] = await Promise.all([
    ambilPesanPetugas(id),
    daftarPercakapan(),
  ]);

  if (!ruang) notFound();

  return (
    <main className="mx-auto w-full max-w-container px-md py-md">
      <header className="masthead mb-md flex flex-wrap items-end justify-between gap-sm">
        <div>
          <p className="masthead-org">{t("org.name")}</p>
          <p className="masthead-unit hidden sm:block">{t("org.unit")}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-xs">
          <HeaderControls />
          <Link href="/dashboard" className="btn-quiet">
            {t("inbox.back")}
          </Link>
          <InboxLink />
        </div>
      </header>

      {/* Desktop: daftar di kiri, ruang di kanan. Di HP daftar disembunyikan —
          ruang chat memakai lebar penuh dan tombol kembali ada di kepalanya. */}
      <div className="grid items-start gap-md md:grid-cols-[minmax(240px,300px)_1fr]">
        <div className="hidden max-h-[calc(100dvh-170px)] overflow-y-auto md:sticky md:top-md md:block">
          <InboxList initial={conversations} selectedId={ruang.id} />
        </div>

        <div className="min-w-0 md:h-[calc(100dvh-170px)]">
          <StaffRoom
            conversationId={ruang.id}
            guestName={ruang.guestName}
            guestPhone={ruang.guestPhone}
            queueNo={ruang.queueNo}
            status={ruang.status}
            initialMessages={ruang.messages}
            initialHasMore={ruang.hasMore}
          />
        </div>
      </div>
    </main>
  );
}

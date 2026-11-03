"use client";

import Link from "next/link";
import { useLocale, useT } from "@/lib/i18n/client";
import { formatDateTime } from "@/lib/format";

/** Banner di dashboard selama buku tamu ditutup. */
export function ClosedBanner({ reopenAt }: { reopenAt: Date | null }) {
  const t = useT();
  const locale = useLocale();

  return (
    <div
      role="status"
      className="mb-md flex flex-wrap items-center gap-x-md gap-y-xs border-l-2 border-warning bg-warning/[0.08] px-sm py-sm"
    >
      <div className="min-w-0">
        <p className="text-label-sm text-warning-dark">{t("closedBanner.title")}</p>
        <p className="mt-2xs text-body-sm text-ink">
          {reopenAt
            ? t("closedBanner.reopenAt", { time: formatDateTime(reopenAt, locale) })
            : t("closedBanner.noSchedule")}
        </p>
      </div>
      <Link href="/pengaturan" className="btn-ghost ml-auto">
        {t("closedBanner.openAgain")}
      </Link>
    </div>
  );
}

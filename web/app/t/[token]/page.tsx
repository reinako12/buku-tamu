import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatQueue } from "@/lib/schemas/visit";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDate, formatTime } from "@/lib/format";
import type { DictKey } from "@/lib/i18n/dict";
import { PrintButton } from "@/components/print-button";
import { LocaleToggle } from "@/components/locale-toggle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tiket kunjungan",
  robots: { index: false, follow: false },
};

const STATUS_STYLE: Record<string, string> = {
  menunggu: "border-warning text-warning-dark",
  dipanggil: "border-primary text-primary",
  dilayani: "border-primary text-primary",
  selesai: "border-success text-success",
  batal: "border-danger text-danger",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!UUID_RE.test(token)) notFound();

  const visit = await prisma.visit.findUnique({ where: { token } });
  if (!visit) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const ticketUrl = `${proto}://${host}/t/${visit.token}`;

  const t = await getT();
  const locale = await getLocale();
  const dateLabel = formatDate(visit.checkInAt, locale);
  const timeLabel = formatTime(visit.checkInAt, locale);

  const waText = encodeURIComponent(
    `${t("ticket.share")}\n${t("ticket.queue")}: ${formatQueue(visit.queueSeq)}\n${t("ticket.checkIn")}: ${dateLabel} ${timeLabel}\n${ticketUrl}`,
  );

  return (
    <main className="mx-auto w-full max-w-ticket px-md py-lg">
      <div className="mb-sm flex items-center justify-between gap-sm">
        <p className="text-body-sm text-ink-muted">{t("ticket.title")}</p>
        <LocaleToggle />
      </div>

      <div className="ticket">
        <div className="px-md pb-md pt-lg text-center">
          <p className="text-caption font-semibold text-primary">
            {t("org.name")} {t("org.unit")}
          </p>
          <p className="mt-md text-caption text-ink-muted">{t("ticket.queue")}</p>
          <p className="queue-number mt-2xs">{formatQueue(visit.queueSeq)}</p>
          <span
            className={`stamp mt-sm ${
              STATUS_STYLE[visit.status] ?? STATUS_STYLE.menunggu
            }`}
          >
            {t(`status.${visit.status}` as DictKey)}
          </span>
        </div>

        <div className="ticket-perf" />

        <dl className="space-y-sm px-md py-md">
          <div className="flex items-baseline justify-between gap-sm">
            <dt className="text-caption text-ink-muted">{t("ticket.name")}</dt>
            <dd className="text-right text-body-sm font-medium text-ink">
              {visit.name}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-sm">
            <dt className="text-caption text-ink-muted">{t("ticket.institution")}</dt>
            <dd className="text-right text-body-sm text-ink">{visit.institution}</dd>
          </div>
          {visit.gender ? (
            <div className="flex items-baseline justify-between gap-sm">
              <dt className="text-caption text-ink-muted">{t("ticket.gender")}</dt>
              <dd className="text-right text-body-sm text-ink">
                {t(`gender.${visit.gender}` as DictKey)}
              </dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-sm">
            <dt className="text-caption text-ink-muted">{t("ticket.checkIn")}</dt>
            <dd className="text-right text-body-sm text-ink">
              {dateLabel}, {timeLabel}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-md space-y-sm no-print">
        <a
          className="btn-ghost w-full"
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noreferrer"
        >
          {t("ticket.saveWa")}
        </a>
        <PrintButton />
      </div>

      <p className="mt-md text-caption text-ink-muted">
        {t("ticket.note")}
      </p>
    </main>
  );
}

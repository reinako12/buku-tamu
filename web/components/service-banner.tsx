"use client";

import type { ServiceState } from "@/lib/service-hours";
import { useLocale, useT } from "@/lib/i18n/client";
import { formatDateTime, formatTime } from "@/lib/format";

/**
 * Pemberitahuan jam layanan. Tidak memblokir pengisian: tamu di luar jam
 * tetap boleh mencatat kedatangan, petugas yang memutuskan.
 */
export function ServiceBanner({ state }: { state: ServiceState }) {
  const t = useT();
  const locale = useLocale();

  if (state.status === "open") return null;

  const title =
    state.status === "break"
      ? t("service.break")
      : state.status === "weekend"
        ? t("service.weekend")
        : t("service.outside");

  const message =
    state.status === "break"
      ? t("service.breakMessage", { time: formatTime(state.until, locale) })
      : state.status === "weekend"
        ? t("service.weekendMessage", { time: formatDateTime(state.nextAt, locale) })
        : t("service.outsideMessage", { time: formatDateTime(state.nextAt, locale) });

  return (
    <div
      role="status"
      className="mb-md border-l-2 border-warning bg-warning/[0.06] px-sm py-sm"
    >
      <p className="text-label-sm text-warning-dark">{title}</p>
      <p className="mt-2xs text-body-sm text-ink">{message}</p>
    </div>
  );
}

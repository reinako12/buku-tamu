"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RingkasPercakapan } from "@/lib/chat-types";
import { useLocale, useT } from "@/lib/i18n/client";
import { formatClock } from "@/lib/format";

const POLL_MS = 5_000;

/**
 * Daftar percakapan di sisi kiri inbox.
 *
 * Daftar ikut menyegarkan diri sendiri supaya badge "belum dibaca" bertambah
 * walau petugas sedang membuka percakapan lain. Intervalnya lebih longgar dari
 * ruang chat (3 detik) karena daftar bukan tempat membaca isi pesan.
 */
export function InboxList({
  initial,
  selectedId,
}: {
  initial: RingkasPercakapan[];
  selectedId?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [rows, setRows] = useState(initial);
  const sibuk = useRef(false);

  useEffect(() => {
    let berhenti = false;

    async function tarik() {
      if (document.visibilityState === "hidden" || sibuk.current) return;
      sibuk.current = true;
      try {
        const res = await fetch("/api/pesan", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { conversations: RingkasPercakapan[] };
        if (!berhenti) setRows(data.conversations);
      } catch {
        // Jaringan kantor putus-putus: percobaan berikutnya lima detik lagi.
      } finally {
        sibuk.current = false;
      }
    }

    const timer = setInterval(tarik, POLL_MS);
    const saatTerlihat = () => {
      if (document.visibilityState === "visible") void tarik();
    };
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      berhenti = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, []);

  if (rows.length === 0) {
    return (
      <div className="border-y border-border bg-surface px-md py-lg">
        <p className="text-body-sm text-ink">{t("inbox.empty")}</p>
        <p className="mt-2xs text-caption text-ink-muted">{t("inbox.emptyHint")}</p>
      </div>
    );
  }

  return (
    <ul aria-label={t("inbox.listLabel")} className="divide-y divide-border border-y border-border">
      {rows.map((row) => {
        const aktif = row.id === selectedId;
        const potongan = row.lastBody ?? t("inbox.noMessage");
        return (
          <li key={row.id}>
            <Link
              href={`/dashboard/pesan/${row.id}`}
              aria-current={aktif ? "page" : undefined}
              className={[
                "block px-sm py-sm transition-colors",
                aktif ? "bg-surface-muted" : "bg-surface hover:bg-surface-muted",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between gap-sm">
                <p className="truncate text-body-sm font-semibold text-ink">{row.guestName}</p>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-muted">
                  {row.lastMessageAt ? formatClock(new Date(row.lastMessageAt), locale) : ""}
                </span>
              </div>

              <p className="mt-2xs truncate text-caption text-ink-muted">
                {row.lastSender === "petugas" ? `${t("inbox.you")}: ${potongan}` : potongan}
              </p>

              <div className="mt-xs flex items-center justify-between gap-sm">
                <span
                  className={`stamp ${
                    row.queueNo
                      ? "border-primary text-primary"
                      : "border-border-strong text-ink-muted"
                  }`}
                >
                  {row.queueNo ? t("inbox.queue", { no: row.queueNo }) : t("inbox.noVisit")}
                </span>

                {row.unread > 0 ? (
                  <span
                    className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-danger px-xs font-mono text-[11px] font-semibold tabular-nums text-ink-inverse"
                    aria-label={t("inbox.unread", { n: String(row.unread) })}
                  >
                    {row.unread}
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

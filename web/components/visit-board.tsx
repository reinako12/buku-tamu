"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { setVisitStatus } from "@/lib/actions/staff";
import { ALLOWED_TRANSITIONS, formatQueueNumber, type VisitStatus } from "@/lib/visit-status";
import { useT } from "@/lib/i18n/client";
import type { DictKey } from "@/lib/i18n/dict";

export type BoardVisit = {
  id: string;
  queueSeq: number;
  queueNo: string;
  name: string;
  institution: string;
  institutionCat: string;
  purpose: string;
  detail: string | null;
  gender: string | null;
  status: VisitStatus;
  phone: string;
  checkInAt: string;
  source: string;
  /** Diisi kalau kunjungan ini punya percakapan dengan pesan tamu belum dibaca. */
  chatConversationId?: string | null;
};

const FINAL: VisitStatus[] = ["selesai", "batal"];
const PAGE_SIZE = 5;

const STATUS_STYLE: Record<VisitStatus, string> = {
  menunggu: "border-accent-orange text-warning-dark",
  dipanggil: "border-primary text-primary",
  dilayani: "border-primary text-primary",
  selesai: "border-success text-success",
  batal: "border-danger text-danger",
};

const ACTION_KEY: Partial<Record<VisitStatus, DictKey>> = {
  dipanggil: "dash.call",
  dilayani: "dash.serve",
  selesai: "dash.done",
  batal: "dash.cancel",
  menunggu: "dash.undo",
};

function fromRow(row: Record<string, unknown>): BoardVisit {
  return {
    id: String(row.id),
    queueSeq: Number(row.queue_seq),
    queueNo: String(row.queue_no),
    name: String(row.name),
    institution: String(row.institution),
    institutionCat: String(row.institution_cat),
    purpose: String(row.purpose),
    detail: (row.detail as string | null) ?? null,
    gender: (row.gender as string | null) ?? null,
    status: row.status as VisitStatus,
    phone: String(row.phone),
    checkInAt: String(row.check_in_at),
    source: String(row.source),
  };
}

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export function VisitBoard({ initialVisits }: { initialVisits: BoardVisit[] }) {
  const t = useT();
  const [visits, setVisits] = useState<BoardVisit[]>(initialVisits);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [page, setPage] = useState(1);
  const [donePage, setDonePage] = useState(1);
  const [jumpToLast, setJumpToLast] = useState(false);
  const [, startTransition] = useTransition();
  const seenIds = useRef(new Set(initialVisits.map((v) => v.id)));

  useEffect(() => {
    if (initialVisits.length > 0) {
      setVisits(initialVisits);
      initialVisits.forEach((v) => seenIds.current.add(v.id));
    }
  }, [initialVisits]);

  // Durasi tunggu bertambah tanpa perlu memuat ulang halaman.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("visits-today")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visits" },
        (payload: unknown) => {
          const event = payload as {
            eventType: "INSERT" | "UPDATE" | "DELETE";
            new: Record<string, unknown>;
          };

          if (event.eventType === "INSERT") {
            const incoming = fromRow(event.new);
            setVisits((prev) => {
              if (prev.some((v) => v.id === incoming.id)) return prev;
              seenIds.current.add(incoming.id);
              return [...prev, incoming];
            });
            setNewId(incoming.id);
            setJumpToLast(true);
          }

          if (event.eventType === "UPDATE") {
            const incoming = fromRow(event.new);
            setVisits((prev) =>
              prev.map((v) => (v.id === incoming.id ? { ...v, ...incoming } : v)),
            );
          }
        },
      )
      .subscribe((status: string) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!newId) return;
    const timer = setTimeout(() => setNewId(null), 4000);
    return () => clearTimeout(timer);
  }, [newId]);

  // Urut sesuai nomor antrian (urutan kedatangan), bukan dikelompokkan per status:
  // petugas membaca layar dari atas ke bawah seperti buku tamu kertas.
  const sorted = useMemo(
    () => [...visits].sort((a, b) => a.queueSeq - b.queueSeq),
    [visits],
  );

  const active = useMemo(() => sorted.filter((v) => !FINAL.includes(v.status)), [sorted]);
  const finished = useMemo(
    () => sorted.filter((v) => FINAL.includes(v.status)).reverse(),
    [sorted],
  );

  // Tamu di meja: yang sedang dilayani, kalau tidak ada pakai yang sudah dipanggil.
  const current =
    active.find((v) => v.status === "dilayani") ??
    active.find((v) => v.status === "dipanggil") ??
    null;

  const queued = current ? active.filter((v) => v.id !== current.id) : active;
  const next = queued.find((v) => v.status === "menunggu") ?? null;

  // Daftar dipecah 5 baris per halaman supaya layar tidak jadi gulungan panjang.
  const activePages = Math.max(1, Math.ceil(queued.length / PAGE_SIZE));
  const activeRows = queued.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const donePages = Math.max(1, Math.ceil(finished.length / PAGE_SIZE));
  const doneRows = finished.slice((donePage - 1) * PAGE_SIZE, donePage * PAGE_SIZE);

  useEffect(() => {
    if (page > activePages) setPage(activePages);
  }, [page, activePages]);

  useEffect(() => {
    if (donePage > donePages) setDonePage(donePages);
  }, [donePage, donePages]);

  // Tamu baru masuk: buka halaman tempat barisnya berada.
  useEffect(() => {
    if (!jumpToLast) return;
    setPage(activePages);
    setJumpToLast(false);
  }, [jumpToLast, activePages]);

  const counts = useMemo(() => {
    const base: Record<string, number> = {
      menunggu: 0,
      dipanggil: 0,
      dilayani: 0,
      selesai: 0,
      batal: 0,
    };
    visits.forEach((v) => {
      base[v.status] = (base[v.status] ?? 0) + 1;
    });
    return base;
  }, [visits]);

  function change(id: string, nextStatus: VisitStatus) {
    const previous = visits;
    setError(null);
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: nextStatus } : v)),
    );

    startTransition(async () => {
      const result = await setVisitStatus(id, nextStatus);
      if (!result.ok) {
        setVisits(previous);
        setError(result.error ?? "err.statusFailed");
      }
    });
  }

  function waitLabel(iso: string) {
    const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
    return minutes < 1 ? t("dash.justIn") : t("dash.waited", { mins: String(minutes) });
  }

  function meta(v: BoardVisit) {
    return [
      v.institution,
      t(`purpose.${v.purpose}` as DictKey),
      v.gender ? t(`gender.${v.gender}` as DictKey) : null,
      v.source === "manual" ? t("dash.recordedByStaff") : null,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return (
    <section aria-label={t("dash.listLabel")}>
      {error ? (
        <div
          role="alert"
          className="mb-sm border-l-2 border-danger bg-danger/[0.04] px-sm py-sm text-body-sm text-danger"
        >
          {t(error as DictKey)}
        </div>
      ) : null}

      {/* Papan meja: satu blok besar, bukan kartu bertumpuk. */}
      <div className="callboard">
        <div className="flex flex-col gap-sm sm:flex-row sm:gap-0">
          {/* Bagian kiri seperti sobekan tiket: label keadaan + nomor. */}
          <div className="shrink-0 sm:pr-md">
            <p className="text-caption text-ink-muted">
              {current
                ? current.status === "dilayani"
                  ? t("dash.boardServe")
                  : t("dash.boardCalled")
                : next
                  ? t("dash.next")
                  : t("dash.boardNone")}
            </p>
            <p
              className={`mt-2xs font-mono text-[44px] font-semibold leading-none tabular-nums sm:text-[60px] ${
                current || next ? "text-primary" : "text-border-strong"
              }`}
            >
              {current
                ? formatQueueNumber(current.queueSeq)
                : next
                  ? formatQueueNumber(next.queueSeq)
                  : "—"}
            </p>
          </div>

          {/* Garis sobek: aksen tiket yang sama dengan halaman tamu. */}
          <div className="flex flex-1 flex-wrap items-start justify-between gap-md border-t border-dashed border-border-strong pt-sm sm:border-l sm:border-t-0 sm:pl-md sm:pt-0">
            <div className="min-w-0">
              {current ? (
                <>
                  <p className="text-heading-card text-ink">{current.name}</p>
                  <p className="mt-2xs text-body-sm text-ink-muted">{meta(current)}</p>
                  <p className="mt-2xs font-mono text-caption text-ink-muted">
                    {t("dash.checkInLine", { time: timeLabel(current.checkInAt) })}
                  </p>
                </>
              ) : next ? (
                <>
                  <p className="text-heading-card text-ink">{next.name}</p>
                  <p className="mt-2xs text-body-sm text-ink-muted">{meta(next)}</p>
                </>
              ) : (
                <p className="text-body-md text-ink-muted">{t("dash.emptyHint")}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-xs">
              {current ? (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() =>
                      change(current.id, current.status === "dilayani" ? "selesai" : "dilayani")
                    }
                  >
                    {t(current.status === "dilayani" ? "dash.done" : "dash.serve")}
                  </button>
                  <button
                    type="button"
                    className="btn-quiet"
                    onClick={() => change(current.id, "batal")}
                  >
                    {t("dash.cancel")}
                  </button>
                </>
              ) : next ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => change(next.id, "dipanggil")}
                >
                  {t("dash.callNext")}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="meta-strip mt-md" aria-live="polite" aria-atomic="true">
          {(["menunggu", "dipanggil", "dilayani", "selesai", "batal"] as VisitStatus[]).map(
            (status) => (
              <span key={status} className="flex items-baseline gap-2xs">
                <span className="font-mono text-body-md font-semibold tabular-nums text-ink">
                  {counts[status]}
                </span>
                <span className="text-caption text-ink-muted">
                  {t(`status.${status}` as DictKey)}
                </span>
              </span>
            ),
          )}

          <span className="ml-auto inline-flex items-center gap-2xs text-caption text-ink-muted">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                live ? "bg-accent-green" : "bg-ink-muted/40"
              }`}
            />
            {live ? t("dash.live") : t("dash.offline")}
          </span>
        </div>
      </div>

      {queued.length === 0 && finished.length === 0 ? (
        <div className="mt-lg border-y border-border py-2xl text-center">
          <p className="text-body-md text-ink">{t("dash.empty")}</p>
          <p className="mt-2xs text-body-sm text-ink-muted">{t("dash.emptyHint")}</p>
        </div>
      ) : null}

      {queued.length > 0 ? (
        <>
          <div className="section-head mt-lg">
            <span className="section-num font-mono tabular-nums">{queued.length}</span>
            <h2 className="text-heading-card text-ink">{t("dash.activeQueue")}</h2>
          </div>

          <ul className="ledger">
            {activeRows.map((visit) => {
              const actions = ALLOWED_TRANSITIONS[visit.status];
              const primary = actions.find((a) => a !== "batal" && a !== "menunggu");
              // "Batalkan" selalu di slot paling kanan supaya sejajar antar baris.
              const secondary = actions
                .filter((a) => a !== primary)
                .sort((a, b) => (a === "batal" ? 1 : 0) - (b === "batal" ? 1 : 0));
              const slots: (VisitStatus | null)[] = [
                ...secondary,
                ...Array.from({ length: Math.max(0, 2 - secondary.length) }, () => null),
              ];
              const called = visit.status === "dipanggil";

              return (
                <li
                  key={visit.id}
                  className={`ledger-row px-2xs py-sm sm:px-sm ${
                    newId === visit.id ? "row-in bg-primary/[0.035]" : ""
                  } ${called ? "border-l-2 border-l-primary" : ""}`}
                >
                  <div className="flex flex-wrap items-start gap-x-sm gap-y-xs">
                    <div className="w-14 shrink-0">
                      <p className="font-mono text-heading-card leading-none tabular-nums text-primary">
                        {formatQueueNumber(visit.queueSeq)}
                      </p>
                      <p
                        className="mt-2xs font-mono text-caption tabular-nums text-ink-muted"
                        title={t("dash.checkInLine", { time: timeLabel(visit.checkInAt) })}
                      >
                        {timeLabel(visit.checkInAt)}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1 basis-[240px]">
                      <div className="flex flex-wrap items-baseline gap-x-sm gap-y-2xs">
                        <p className="text-body-md font-semibold text-ink">{visit.name}</p>
                        <span className={`stamp ${STATUS_STYLE[visit.status]}`}>
                          {t(`status.${visit.status}` as DictKey)}
                        </span>
                        {visit.status === "menunggu" ? (
                          <span className="text-caption text-ink-muted">
                            {waitLabel(visit.checkInAt)}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2xs text-body-sm text-ink-muted">{meta(visit)}</p>


                      {visit.chatConversationId ? (
                        <Link
                          href={`/dashboard/pesan/${visit.chatConversationId}`}
                          className="mt-xs inline-flex min-h-[32px] items-center gap-2xs text-caption text-primary underline decoration-border underline-offset-4 hover:decoration-primary"
                        >
                          {t("dash.chatUnread")}
                        </Link>
                      ) : null}

                      {visit.detail ? (
                        <p className="mt-xs line-clamp-2 max-w-[60ch] text-caption text-ink">
                          {visit.detail}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-x-sm gap-y-2xs sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-x-xs lg:gap-x-sm">
                      {primary ? (
                        <button
                          type="button"
                          className="btn-primary order-first px-sm sm:order-last sm:min-w-[104px] lg:min-w-[112px]"
                          onClick={() => change(visit.id, primary)}
                        >
                          {t(ACTION_KEY[primary] ?? (`status.${primary}` as DictKey))}
                        </button>
                      ) : null}

                      {slots.map((nextStatus, index) =>
                        nextStatus ? (
                          <button
                            key={nextStatus}
                            type="button"
                            className="row-link sm:order-1 sm:w-[72px] sm:justify-center lg:w-[80px]"
                            onClick={() => change(visit.id, nextStatus)}
                          >
                            {t(ACTION_KEY[nextStatus] ?? (`status.${nextStatus}` as DictKey))}
                          </button>
                        ) : (
                          <span
                            key={`slot-${index}`}
                            aria-hidden="true"
                            className="hidden sm:order-1 sm:block sm:w-[72px] lg:w-[80px]"
                          />
                        ),
                      )}

                      <a
                        className="row-link sm:order-2 sm:w-[74px] sm:justify-center lg:w-[80px]"
                        href={`https://wa.me/${visit.phone.replace("+", "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("dash.wa")}
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Pager
            page={page}
            pages={activePages}
            total={queued.length}
            onPage={setPage}
          />
        </>
      ) : null}

      {finished.length > 0 ? (
        <details className="mt-lg">
          <summary className="flex min-h-[40px] cursor-pointer items-center gap-sm border-b border-border pb-xs">
            <span className="section-num font-mono tabular-nums">{finished.length}</span>
            <span className="text-heading-card text-ink">{t("dash.finishedQueue")}</span>
          </summary>

          <ul className="ledger">
            {doneRows.map((visit) => (
              <li key={visit.id} className="ledger-row px-2xs py-xs sm:px-sm">
                <div className="flex flex-wrap items-baseline gap-x-sm gap-y-2xs text-ink-muted">
                  <p className="w-10 shrink-0 font-mono text-body-sm tabular-nums">
                    {formatQueueNumber(visit.queueSeq)}
                  </p>
                  <p className="min-w-0 flex-1 truncate text-body-sm">{visit.name}</p>
                  <span className={`stamp ${STATUS_STYLE[visit.status]}`}>
                    {t(`status.${visit.status}` as DictKey)}
                  </span>
                  <span className="font-mono text-caption tabular-nums">
                    {timeLabel(visit.checkInAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <Pager
            page={donePage}
            pages={donePages}
            total={finished.length}
            onPage={setDonePage}
          />
        </details>
      ) : null}
    </section>
  );
}

/**
 * Penomoran halaman untuk daftar tamu: 5 baris per halaman.
 * Tidak muncul kalau daftarnya memang muat satu halaman.
 */
function Pager({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const t = useT();

  if (total <= PAGE_SIZE) return null;

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <nav
      aria-label={t("dash.pagerLabel")}
      className="flex flex-wrap items-center justify-between gap-x-sm gap-y-2xs border-t border-border pt-xs"
    >
      <p className="text-caption text-ink-muted">
        {t("dash.range", { from: String(from), to: String(to), total: String(total) })}
      </p>

      <div className="flex items-center gap-xs">
        <button
          type="button"
          className="btn-quiet disabled:no-underline disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          {t("dash.prevPage")}
        </button>

        <span className="hidden font-mono text-caption tabular-nums text-ink-muted sm:inline">
          {t("dash.pageOf", { page: String(page), total: String(pages) })}
        </span>

        <button
          type="button"
          className="btn-quiet disabled:no-underline disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          {t("dash.nextPage")}
        </button>
      </div>
    </nav>
  );
}

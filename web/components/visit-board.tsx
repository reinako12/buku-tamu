"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
};

const STATUS_STYLE: Record<VisitStatus, string> = {
  menunggu: "border-warning text-warning-dark",
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
  const [soundOn, setSoundOn] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const seenIds = useRef(new Set(initialVisits.map((v) => v.id)));
  const audioCtx = useRef<AudioContext | null>(null);

  const beep = useCallback(() => {
    if (!soundOn) return;
    try {
      audioCtx.current ??= new AudioContext();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Browser memblokir audio sebelum interaksi user — abaikan.
    }
  }, [soundOn]);

  useEffect(() => {
    if (initialVisits.length > 0) {
      setVisits(initialVisits);
      initialVisits.forEach((v) => seenIds.current.add(v.id));
    }
  }, [initialVisits]);

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
              beep();
              return [...prev, incoming];
            });
            setNewId(incoming.id);
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
  }, [beep]);

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

  function change(id: string, next: VisitStatus) {
    const previous = visits;
    setError(null);
    setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, status: next } : v)));

    startTransition(async () => {
      const result = await setVisitStatus(id, next);
      if (!result.ok) {
        setVisits(previous);
        setError(result.error ?? "err.statusFailed");
      }
    });
  }

  return (
    <section aria-label={t("dash.listLabel")}>
      <div className="mb-md flex flex-wrap items-center gap-x-md gap-y-sm">
        <div className="flex items-center gap-x-lg">
          {(["menunggu", "dipanggil", "dilayani", "selesai", "batal"] as VisitStatus[]).map(
            (status) => (
              <div key={status} className="min-w-[64px]">
                <p className="font-mono text-heading-card tabular-nums text-ink">
                  {counts[status]}
                </p>
                <p className="text-caption text-ink-muted">{t(`status.${status}` as DictKey)}</p>
              </div>
            ),
          )}
        </div>

        <div className="ml-auto flex items-center gap-sm">
          <span
            className={`inline-flex items-center gap-2xs text-caption ${
              live ? "text-success" : "text-ink-muted"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                live ? "bg-success" : "bg-ink-muted/40"
              }`}
            />
            {live ? t("dash.live") : t("dash.offline")}
          </span>

          <button
            type="button"
            className="btn-ghost"
            aria-pressed={soundOn}
            onClick={() => setSoundOn((value) => !value)}
          >
            {soundOn ? t("dash.soundOn") : t("dash.soundOff")}
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-sm border-l-2 border-danger bg-danger/[0.04] px-sm py-sm text-body-sm text-danger"
        >
          {error ? t(error as DictKey) : null}
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <div className="border-y border-border py-2xl text-center">
          <p className="text-body-md text-ink">{t("dash.empty")}</p>
          <p className="mt-2xs text-body-sm text-ink-muted">
            {t("dash.emptyHint")}
          </p>
        </div>
      ) : (
        <ul className="ledger">
          {sorted.map((visit) => {
            const closed = visit.status === "selesai" || visit.status === "batal";
            const actions = ALLOWED_TRANSITIONS[visit.status];
            const primary = actions.find((a) => a !== "batal" && a !== "menunggu");
            const secondary = actions.filter((a) => a !== primary);

            return (
              <li
                key={visit.id}
                className={`ledger-row px-2xs py-sm sm:px-sm ${
                  newId === visit.id ? "row-in bg-primary/[0.035]" : ""
                } ${closed ? "text-ink-muted" : ""}`}
              >
                <div className="flex flex-wrap items-start gap-x-sm gap-y-2xs">
                  <p
                    className={`w-14 shrink-0 font-mono text-heading-page leading-none tabular-nums ${
                      closed ? "text-ink-muted" : "text-primary"
                    }`}
                  >
                    {formatQueueNumber(visit.queueSeq)}
                  </p>

                  <div className="min-w-0 flex-1 basis-[220px]">
                    <div className="flex flex-wrap items-baseline gap-x-sm">
                      <p className="text-body-md font-semibold text-ink">{visit.name}</p>
                      <span
                        className={`stamp ${STATUS_STYLE[visit.status]}`}
                      >
                        {t(`status.${visit.status}` as DictKey)}
                      </span>
                    </div>

                    <p className="mt-2xs text-body-sm text-ink-muted">
                      {visit.institution}
                      {", "}
                      {t(`purpose.${visit.purpose}` as DictKey)}
                      {visit.gender ? `, ${t(`gender.${visit.gender}` as DictKey)}` : ""}
                      {visit.source === "manual" ? `, ${t("dash.recordedByStaff")}` : ""}
                    </p>

                    <p className="mt-2xs font-mono text-caption text-ink-muted">
                      {t("dash.checkInLine", { time: timeLabel(visit.checkInAt) })}
                    </p>

                    {visit.detail ? (
                      <p className="mt-xs max-w-[60ch] text-caption text-ink">
                        {visit.detail}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-x-md gap-y-2xs sm:w-auto sm:flex-col sm:items-end sm:gap-y-2xs">
                    {primary ? (
                      <button
                        type="button"
                        className="btn-primary order-first px-sm sm:order-none"
                        onClick={() => change(visit.id, primary)}
                      >
                        {t(ACTION_KEY[primary] ?? `status.${primary}` as DictKey)}
                      </button>
                    ) : null}

                    {secondary.map((next) => (
                      <button
                        key={next}
                        type="button"
                        className="btn-quiet"
                        onClick={() => change(visit.id, next)}
                      >
                        {t(ACTION_KEY[next] ?? `status.${next}` as DictKey)}
                      </button>
                    ))}

                    <a
                      className="btn-quiet"
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
      )}
    </section>
  );
}

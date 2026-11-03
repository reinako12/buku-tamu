"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { setVisitStatus } from "@/lib/actions/staff";
import {
  ALLOWED_TRANSITIONS,
  STATUS_LABEL,
  formatQueueNumber,
  type VisitStatus,
} from "@/lib/visit-status";

export type BoardVisit = {
  id: string;
  queueSeq: number;
  queueNo: string;
  name: string;
  institution: string;
  institutionCat: string;
  purpose: string;
  detail: string | null;
  personCount: number;
  status: VisitStatus;
  phone: string;
  checkInAt: string;
  source: string;
};

const STATUS_ORDER: Record<VisitStatus, number> = {
  menunggu: 0,
  dipanggil: 1,
  dilayani: 2,
  selesai: 3,
  batal: 4,
};

const STATUS_STYLE: Record<VisitStatus, string> = {
  menunggu: "border-warning/40 bg-warning/10 text-warning-dark",
  dipanggil: "border-primary/30 bg-primary-light/15 text-primary",
  dilayani: "border-primary/30 bg-primary-light/15 text-primary",
  selesai: "border-success/40 bg-success/10 text-success",
  batal: "border-danger/40 bg-danger/5 text-danger",
};

const ACTION_LABEL: Partial<Record<VisitStatus, string>> = {
  dipanggil: "Panggil",
  dilayani: "Layani",
  selesai: "Selesai",
  batal: "Batalkan",
  menunggu: "Kembalikan",
};

const PURPOSE_LABEL: Record<string, string> = {
  konsultasi: "Konsultasi",
  data: "Permintaan data",
  kerjasama: "Kerja sama",
  audiensi: "Audiensi",
  magang: "Magang/penelitian",
  lainnya: "Lainnya",
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
    personCount: Number(row.person_count),
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
  const [visits, setVisits] = useState<BoardVisit[]>(initialVisits);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
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

  const sorted = useMemo(
    () =>
      [...visits].sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.queueSeq - b.queueSeq,
      ),
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
        setError(result.error ?? "Gagal mengubah status.");
      }
    });
  }

  return (
    <div>
      <div className="mb-md flex flex-wrap items-center gap-sm">
        <span className="text-label-sm text-ink-muted">Status</span>
        <span className="rounded-sm bg-warning/10 px-sm py-2xs text-label-sm text-warning-dark">
          Menunggu {counts.menunggu}
        </span>
        <span className="rounded-sm bg-primary-light/15 px-sm py-2xs text-label-sm text-primary">
          Dipanggil {counts.dipanggil}
        </span>
        <span className="rounded-sm bg-primary-light/15 px-sm py-2xs text-label-sm text-primary">
          Dilayani {counts.dilayani}
        </span>
        <span className="rounded-sm bg-success/10 px-sm py-2xs text-label-sm text-success">
          Selesai {counts.selesai}
        </span>
        {counts.batal > 0 ? (
          <span className="rounded-sm bg-danger/5 px-sm py-2xs text-label-sm text-danger">
            Batal {counts.batal}
          </span>
        ) : null}

        <span className="ml-auto flex items-center gap-sm">
          <span
            className={`inline-flex items-center gap-2xs text-caption ${
              live ? "text-success" : "text-ink-muted"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${live ? "bg-success" : "bg-ink-muted/40"}`}
            />
            {live ? "Realtime aktif" : "Menghubungkan…"}
          </span>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => setSoundOn((value) => !value)}
          >
            {soundOn ? "Suara: nyala" : "Aktifkan suara"}
          </button>
        </span>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-sm rounded-md border border-danger/40 bg-danger/5 px-sm py-sm text-body-sm text-danger"
        >
          {error}
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <div className="card text-center">
          <p className="text-body-md text-ink">Belum ada tamu hari ini.</p>
          <p className="mt-2xs text-body-sm text-ink-muted">
            Tamu yang mengisi form akan muncul di sini otomatis.
          </p>
        </div>
      ) : (
        <ul className="space-y-sm">
          {sorted.map((visit) => {
            const dimmed = visit.status === "selesai" || visit.status === "batal";
            return (
              <li
                key={visit.id}
                className={`card ${dimmed ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-sm">
                  <div className="min-w-[64px] text-center">
                    <p className="text-[32px] font-bold leading-none text-primary">
                      {formatQueueNumber(visit.queueSeq)}
                    </p>
                    <p className="mt-2xs text-caption text-ink-muted">
                      {timeLabel(visit.checkInAt)}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md font-semibold text-ink">
                      {visit.name}
                    </p>
                    <p className="truncate text-body-sm text-ink-muted">
                      {visit.institution} · {visit.personCount} orang
                    </p>
                    <p className="mt-2xs text-caption text-ink-muted">
                      {PURPOSE_LABEL[visit.purpose] ?? visit.purpose}
                      {visit.source === "manual" ? " · input petugas" : ""}
                    </p>
                    {visit.detail ? (
                      <p className="mt-2xs text-caption text-ink-muted">
                        “{visit.detail}”
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-2xs">
                    <span
                      className={`rounded-sm border px-sm py-2xs text-caption ${STATUS_STYLE[visit.status]}`}
                    >
                      {STATUS_LABEL[visit.status]}
                    </span>
                    <a
                      className="text-caption text-primary underline"
                      href={`https://wa.me/${visit.phone.replace("+", "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>

                {ALLOWED_TRANSITIONS[visit.status].length > 0 ? (
                  <div className="mt-sm flex flex-wrap gap-2xs">
                    {ALLOWED_TRANSITIONS[visit.status].map((next) => (
                      <button
                        key={next}
                        type="button"
                        className={next === "batal" ? "btn-ghost" : "btn-primary"}
                        onClick={() => change(visit.id, next)}
                      >
                        {ACTION_LABEL[next] ?? STATUS_LABEL[next]}
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { kirimPesanPetugas, tandaiPesanDibaca, tutupPercakapan } from "@/lib/actions/chat";
import { PESAN_MAKS } from "@/lib/chat-pesan";
import type { ChatMessage, ChatStatus } from "@/lib/chat-types";
import { useT } from "@/lib/i18n/client";
import type { DictKey } from "@/lib/i18n/dict";
import { MessageBubble, type UiMessage } from "@/components/chat/message-bubble";
import { VisitFromChat } from "@/components/dashboard/visit-from-chat";

const POLL_MS = 3_000;
const LENGKET_PX = 80;

type Props = {
  conversationId: string;
  guestName: string;
  guestPhone: string;
  queueNo: string | null;
  status: ChatStatus;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
};

/**
 * Gabungkan pesan server dengan yang masih di layar. `seq` jadi kunci tunggal;
 * pesan sementara bertanda `seq` negatif selalu di ujung.
 */
function gabung(sebelum: UiMessage[], masuk: ChatMessage[]): UiMessage[] {
  const nyata = new Map<number, UiMessage>();
  for (const m of sebelum) if (m.seq > 0) nyata.set(m.seq, m);
  for (const m of masuk) nyata.set(m.seq, m);
  const urut = [...nyata.values()].sort((a, b) => a.seq - b.seq);
  return [...urut, ...sebelum.filter((m) => m.seq < 0)];
}

/**
 * Ruang balas petugas.
 *
 * Bedanya dengan ruang tamu: tidak ada kuota kirim (yang mengetik sudah login),
 * ada tombol tutup percakapan, dan begitu pesan tamu masuk layar, percakapan
 * ditandai terbaca supaya badge di daftar ikut turun.
 */
export function StaffRoom({
  conversationId,
  guestName,
  guestPhone,
  queueNo,
  status: statusAwal,
  initialMessages,
  initialHasMore,
}: Props) {
  const t = useT();

  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>(statusAwal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [menutup, setMenutup] = useState(false);
  const [tanyaTutup, setTanyaTutup] = useState(false);
  const [error, setError] = useState<DictKey | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lengketRef = useRef(true);
  const seqTerakhirRef = useRef(0);
  const pollingRef = useRef(false);
  const dibacaRef = useRef(0);

  const keBawah = useCallback((halus = false) => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: halus ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    keBawah();
  }, [keBawah]);

  useEffect(() => {
    let seq = 0;
    for (const m of messages) if (m.seq > seq) seq = m.seq;
    seqTerakhirRef.current = seq;
    if (lengketRef.current) keBawah();
  }, [messages, keBawah]);

  /** Tandai terbaca sekali per kumpulan pesan tamu yang baru terlihat. */
  const tandaiTerbaca = useCallback(
    (daftar: UiMessage[]) => {
      const terakhirTamu = daftar.reduce(
        (n, m) => (m.sender === "tamu" && m.seq > n ? m.seq : n),
        0,
      );
      if (terakhirTamu <= dibacaRef.current) return;
      dibacaRef.current = terakhirTamu;
      void tandaiPesanDibaca(conversationId).catch(() => {
        // Gagal menandai bukan alasan menghentikan percakapan; dicoba lagi
        // saat pesan berikutnya masuk.
        dibacaRef.current = 0;
      });
    },
    [conversationId],
  );

  useEffect(() => {
    tandaiTerbaca(messages);
  }, [messages, tandaiTerbaca]);

  const polling = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      const seq = seqTerakhirRef.current;
      const kueri = seq > 0 ? `?after=${seq}` : "";
      const res = await fetch(`/api/pesan/${conversationId}/messages${kueri}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        status: ChatStatus;
        messages: ChatMessage[];
      };
      setStatus(data.status);
      if (data.messages.length > 0) {
        setMessages((prev) => gabung(prev, data.messages));
      }
    } catch {
      // Diamkan; siklus berikutnya tiga detik lagi.
    } finally {
      pollingRef.current = false;
    }
  }, [conversationId]);

  useEffect(() => {
    const timer = setInterval(polling, POLL_MS);
    const saatTerlihat = () => {
      if (document.visibilityState === "visible") void polling();
    };
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, [polling]);

  async function muatLama() {
    const pertama = messages.find((m) => m.seq > 0)?.seq;
    if (!pertama || loadingOlder) return;

    const el = threadRef.current;
    const tinggiLama = el?.scrollHeight ?? 0;
    const jarakDariAtas = el?.scrollTop ?? 0;

    setLoadingOlder(true);
    try {
      const res = await fetch(
        `/api/pesan/${conversationId}/messages?before=${pertama}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as { messages: ChatMessage[]; hasMore: boolean };
      setHasMore(data.hasMore);
      if (data.messages.length === 0) return;
      setMessages((prev) => gabung(prev, data.messages));
      requestAnimationFrame(() => {
        const ulang = threadRef.current;
        if (ulang) ulang.scrollTop = ulang.scrollHeight - tinggiLama + jarakDariAtas;
      });
    } catch {
      // Tombolnya masih ada untuk dicoba lagi.
    } finally {
      setLoadingOlder(false);
    }
  }

  async function kirim(isi: string, tempId?: string) {
    const body = isi.trim();
    if (!body || sending) return;

    const id = tempId ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setError(null);
    setSending(true);
    lengketRef.current = true;

    setMessages((prev) =>
      tempId
        ? prev.map((m) => (m.id === id ? { ...m, pending: true, failed: false } : m))
        : [
            ...prev,
            {
              seq: -Date.now(),
              id,
              sender: "petugas",
              body,
              createdAt: new Date().toISOString(),
              pending: true,
            },
          ],
    );
    if (!tempId) {
      setDraft("");
      if (inputRef.current) inputRef.current.style.height = "auto";
    }

    try {
      const hasil = await kirimPesanPetugas(conversationId, body);
      if (hasil.ok) {
        setMessages((prev) => gabung(prev.filter((m) => m.id !== id), [hasil.message]));
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, pending: false, failed: true } : m)),
        );
        setError(hasil.code as DictKey);
        if (hasil.code === "err.chatClosed") setStatus("ditutup");
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, pending: false, failed: true } : m)),
      );
      setError("err.saveFailed");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function tutup() {
    setMenutup(true);
    try {
      const hasil = await tutupPercakapan(conversationId);
      if (hasil.ok) {
        setStatus("ditutup");
        setTanyaTutup(false);
      } else {
        setError("err.chatNotFound");
      }
    } catch {
      setError("err.saveFailed");
    } finally {
      setMenutup(false);
    }
  }

  const terbuka = status === "terbuka";

  return (
    <section className="flex h-full min-h-0 flex-col border border-border bg-surface">
      <header className="border-b border-border px-sm py-sm">
        <Link href="/dashboard/pesan" className="row-link min-h-tap text-caption text-ink-muted md:hidden">
          {t("inbox.back")}
        </Link>

        <div className="mt-2xs flex flex-wrap items-start justify-between gap-sm md:mt-0">
          <div className="min-w-0">
            <h2 className="truncate text-heading-card text-ink">{guestName}</h2>
            <p className="mt-2xs font-mono text-caption text-ink-muted">{guestPhone}</p>
            <div className="mt-xs flex flex-wrap items-center gap-xs">
              <span
                className={`stamp ${
                  terbuka
                    ? "border-success text-success"
                    : "border-border-strong text-ink-muted"
                }`}
              >
                {terbuka ? t("chat.open") : t("chat.closed")}
              </span>
              <span className="stamp border-border-strong text-ink-muted">
                {queueNo ? t("inbox.queue", { no: queueNo }) : t("inbox.noVisit")}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-xs">
            {terbuka && !queueNo ? (
              <VisitFromChat
                conversationId={conversationId}
                guestName={guestName}
                guestPhone={guestPhone}
              />
            ) : null}

            {terbuka ? (
              tanyaTutup ? (
                <div className="flex flex-wrap items-center gap-xs">
                  <span className="text-caption text-ink-muted">{t("inbox.closeAsk")}</span>
                  <button
                    type="button"
                    onClick={() => void tutup()}
                    disabled={menutup}
                    className="btn-ghost text-danger"
                  >
                    {menutup ? t("common.saving") : t("inbox.closeYes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTanyaTutup(false)}
                    className="btn-quiet"
                  >
                    {t("inbox.closeNo")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setTanyaTutup(true)}
                  className="btn-quiet shrink-0"
                >
                  {t("inbox.close")}
                </button>
              )
            ) : null}
          </div>
        </div>
      </header>

      <div
        ref={threadRef}
        onScroll={() => {
          const el = threadRef.current;
          if (!el) return;
          lengketRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < LENGKET_PX;
        }}
        className="min-h-[40vh] flex-1 space-y-sm overflow-y-auto overscroll-contain px-sm py-sm"
      >
        {hasMore ? (
          <div className="pb-xs text-center">
            <button
              type="button"
              onClick={muatLama}
              disabled={loadingOlder}
              className="btn-quiet text-caption"
            >
              {loadingOlder ? t("common.loading") : t("chat.loadOlder")}
            </button>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <p className="pt-lg text-center text-body-sm text-ink-muted">{t("inbox.noMessage")}</p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              perspektif="petugas"
              onRetry={(pesan) => void kirim(pesan.body, pesan.id)}
            />
          ))
        )}
      </div>

      {error ? (
        <p
          role="alert"
          className="border-t border-danger/20 bg-danger/[0.04] px-sm py-xs text-caption text-danger"
        >
          {t(error)}
        </p>
      ) : null}

      {terbuka ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void kirim(draft);
          }}
          className="border-t border-border px-sm py-sm"
        >
          <div className="flex items-end gap-xs">
            <label htmlFor="balas" className="sr-only">
              {t("inbox.reply")}
            </label>
            <textarea
              id="balas"
              ref={inputRef}
              rows={1}
              maxLength={PESAN_MAKS}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onInput={(event) => {
                const el = event.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void kirim(draft);
                }
              }}
              placeholder={t("inbox.reply")}
              className="field max-h-[120px] resize-none py-sm"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="btn-primary h-[48px] shrink-0 px-md"
            >
              {sending ? t("chat.sending") : t("chat.send")}
            </button>
          </div>
        </form>
      ) : (
        <p className="border-t border-border px-sm py-sm text-caption text-ink-muted">
          {t("inbox.closedNote")}
        </p>
      )}
    </section>
  );
}

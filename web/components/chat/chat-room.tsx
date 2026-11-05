"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { kirimPesanTamu } from "@/lib/actions/chat";
import { PESAN_MAKS } from "@/lib/chat-pesan";
import type { ChatAmbil, ChatMessage, ChatStatus } from "@/lib/chat-types";
import { useT } from "@/lib/i18n/client";
import type { DictKey } from "@/lib/i18n/dict";
import { HeaderControls } from "@/components/header-controls";
import { MessageBubble, type UiMessage } from "./message-bubble";

const POLL_MS = 3_000;
/** Jarak dari dasar (px) yang masih dianggap "sedang membaca pesan terakhir". */
const LENGKET_PX = 80;

type Props = {
  token: string;
  guestName: string;
  status: ChatStatus;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
  shareUrl: string;
};

/**
 * Gabungkan pesan server dengan yang masih di layar.
 *
 * Kunci utamanya `seq`: pesan yang sama bisa datang dua kali (hasil kirim dan
 * hasil polling). Pesan sementara bertanda `seq` negatif selalu ditaruh di
 * ujung, karena belum punya nomor urut dari database.
 */
function gabung(sebelum: UiMessage[], masuk: ChatMessage[]): UiMessage[] {
  const nyata = new Map<number, UiMessage>();
  for (const m of sebelum) if (m.seq > 0) nyata.set(m.seq, m);
  for (const m of masuk) nyata.set(m.seq, m);
  const urut = [...nyata.values()].sort((a, b) => a.seq - b.seq);
  return [...urut, ...sebelum.filter((m) => m.seq < 0)];
}

export function ChatRoom({
  token,
  guestName,
  status: statusAwal,
  initialMessages,
  initialHasMore,
  shareUrl,
}: Props) {
  const t = useT();

  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>(statusAwal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<DictKey | null>(null);
  const [copy, setCopy] = useState<"idle" | "ok" | "fail">("idle");

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lengketRef = useRef(true);
  const seqTerakhirRef = useRef(0);
  const pollingRef = useRef(false);

  const seqTerakhir = (daftar: UiMessage[]) => {
    let seq = 0;
    for (const m of daftar) if (m.seq > seq) seq = m.seq;
    return seq;
  };

  const keBawah = useCallback((halus = false) => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: halus ? "smooth" : "auto" });
  }, []);

  // Buka ruang chat langsung di pesan terakhir.
  useEffect(() => {
    keBawah();
  }, [keBawah]);

  useEffect(() => {
    seqTerakhirRef.current = seqTerakhir(messages);
    if (lengketRef.current) keBawah();
  }, [messages, keBawah]);

  const polling = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    // Database bisa lebih lambat dari interval. Satu permintaan sekaligus,
    // kalau tidak antreannya menumpuk di jaringan 3G.
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      const seq = seqTerakhirRef.current;
      const kueri = seq > 0 ? `?after=${seq}` : "";
      const res = await fetch(`/api/chat/${token}/messages${kueri}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as ChatAmbil;
      setStatus(data.status);
      if (data.messages.length > 0) {
        setMessages((prev) => gabung(prev, data.messages));
      }
    } catch {
      // Jaringan 3G putus-putus: percobaan berikutnya tiga detik lagi.
    } finally {
      pollingRef.current = false;
    }
  }, [token]);

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
      const res = await fetch(`/api/chat/${token}/messages?before=${pertama}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as ChatAmbil;
      setHasMore(data.hasMore);
      if (data.messages.length === 0) return;
      setMessages((prev) => gabung(prev, data.messages));
      // Isi bertambah di atas; geser supaya pesan yang sedang dibaca tidak melompat.
      requestAnimationFrame(() => {
        const ulang = threadRef.current;
        if (ulang) ulang.scrollTop = ulang.scrollHeight - tinggiLama + jarakDariAtas;
      });
    } catch {
      // Diamkan; tombolnya masih ada untuk dicoba lagi.
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

    if (tempId) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, pending: true, failed: false } : m)),
      );
    } else {
      setMessages((prev) => [
        ...prev,
        {
          seq: -Date.now(),
          id,
          sender: "tamu",
          body,
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ]);
      setDraft("");
      if (inputRef.current) inputRef.current.style.height = "auto";
    }

    try {
      const hasil = await kirimPesanTamu(token, body);
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

  async function salinTautan() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopy("ok");
      setTimeout(() => setCopy("idle"), 2_000);
    } catch {
      setCopy("fail");
    }
  }

  const terbuka = status === "terbuka";

  return (
    <div className="chat-shell bg-neutral-body">
      <div className="mx-auto flex min-h-0 w-full max-w-form flex-1 flex-col sm:border-x sm:border-border">
        <header className="border-b border-border bg-surface">
          <div className="flex items-start justify-between gap-sm px-md py-sm">
            <div className="min-w-0">
              <h1 className="sr-only">{t("chat.roomTitle")}</h1>
              <p className="masthead-org truncate">
                {t("org.name")} {t("org.unit")}
              </p>
              <p className="truncate text-body-sm text-ink">{guestName}</p>
              <span
                className={`stamp mt-2xs ${
                  terbuka ? "border-success text-success" : "border-border-strong text-ink-muted"
                }`}
              >
                {terbuka ? t("chat.open") : t("chat.closed")}
              </span>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2xs">
              <HeaderControls />
              <button type="button" onClick={salinTautan} className="btn-quiet px-0">
                {copy === "ok"
                  ? t("chat.copied")
                  : copy === "fail"
                    ? t("chat.copyFailed")
                    : t("chat.copyLink")}
              </button>
            </div>
          </div>
        </header>

        <div
          ref={threadRef}
          onScroll={() => {
            const el = threadRef.current;
            if (!el) return;
            lengketRef.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < LENGKET_PX;
          }}
          className="min-h-0 flex-1 space-y-sm overflow-y-auto overscroll-contain px-md py-md"
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
            <p className="pt-lg text-center text-body-sm text-ink-muted">{t("chat.empty")}</p>
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onRetry={(pesan) => void kirim(pesan.body, pesan.id)}
              />
            ))
          )}
        </div>

        {error ? (
          <p
            role="alert"
            className="border-t border-danger/20 bg-danger/[0.04] px-md py-xs text-caption text-danger"
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
            className="border-t border-border bg-surface px-md pb-[max(12px,env(safe-area-inset-bottom))] pt-sm"
          >
            <div className="flex items-end gap-xs">
              <label htmlFor="chat-draft" className="sr-only">
                {t("chat.placeholder")}
              </label>
              <textarea
                id="chat-draft"
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
                  // Enter mengirim, Shift+Enter pindah baris — kebiasaan chat.
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void kirim(draft);
                  }
                }}
                placeholder={t("chat.placeholder")}
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
          <div className="border-t border-border bg-surface px-md pb-[max(12px,env(safe-area-inset-bottom))] pt-sm">
            <p className="text-caption text-ink-muted">{t("chat.closedNote")}</p>
            <Link href="/chat" className="btn-ghost mt-xs w-full">
              {t("chat.newChat")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

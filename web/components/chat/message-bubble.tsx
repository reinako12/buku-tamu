"use client";

import type { ChatMessage } from "@/lib/chat-types";
import { useLocale, useT } from "@/lib/i18n/client";
import { formatClock } from "@/lib/format";

/** Pesan yang sudah ada di layar; `seq` negatif = belum tersimpan di server. */
export type UiMessage = ChatMessage & { pending?: boolean; failed?: boolean };

/**
 * Satu pesan dalam percakapan.
 *
 * Arah bicara ditandai posisi dan warna, bukan avatar: tamu di kanan dengan
 * bidang biru, petugas di kiri dengan garis tipis. Pesan sistem membentang
 * penuh sebagai catatan, karena ia bukan ucapan siapa pun.
 */
export function MessageBubble({
  message,
  onRetry,
  perspektif = "tamu",
}: {
  message: UiMessage;
  onRetry?: (message: UiMessage) => void;
  /** Siapa yang sedang melihat: menentukan sisi kanan dan label lawan bicara. */
  perspektif?: "tamu" | "petugas";
}) {
  const t = useT();
  const locale = useLocale();

  if (message.sender === "sistem") {
    return (
      <div className="py-2xs text-center text-caption text-ink-muted">
        {message.body}
        <span className="ml-xs font-mono text-[11px] text-ink-muted/70">
          {formatClock(new Date(message.createdAt), locale)}
        </span>
      </div>
    );
  }

  const milikTamu = message.sender === "tamu";
  const milikSendiri = perspektif === "tamu" ? milikTamu : !milikTamu;

  return (
    <div className={`flex flex-col ${milikSendiri ? "items-end" : "items-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-lg px-sm py-xs sm:max-w-[75%]",
          milikSendiri
            ? "bg-primary-solid text-ink-inverse"
            : "border border-border bg-surface text-ink",
        ].join(" ")}
      >
        {milikSendiri ? null : (
          <p className="mb-2xs text-caption font-semibold text-primary">
            {milikTamu ? t("chat.guest") : t("chat.staff")}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words text-body-sm">{message.body}</p>
        <p
          className={[
            "mt-2xs text-right font-mono text-[11px] tabular-nums",
            milikSendiri ? "text-ink-inverse/70" : "text-ink-muted",
          ].join(" ")}
        >
          {formatClock(new Date(message.createdAt), locale)}
        </p>
      </div>

      {message.pending ? (
        <span className="mt-2xs text-caption text-ink-muted">{t("chat.sending")}</span>
      ) : null}

      {message.failed ? (
        <span className="mt-2xs flex items-center gap-xs">
          <span className="text-caption text-danger">{t("chat.failed")}</span>
          {onRetry ? (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="row-link decoration-danger/40 text-danger"
            >
              {t("chat.retry")}
            </button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

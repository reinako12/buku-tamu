"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bukaPercakapan, type ChatStartState } from "@/lib/actions/chat";
import { useT } from "@/lib/i18n/client";
import type { DictKey } from "@/lib/i18n/dict";

const initialState: ChatStartState = { errors: {}, message: null, values: {} };

/**
 * Mulai percakapan: nama + nomor WhatsApp.
 *
 * Nomor yang masih punya percakapan terbuka akan dibuka kembali, bukan
 * dibuatkan ruang baru — jadi tamu yang kehilangan tautan tetap bisa masuk.
 */
export function ChatStartForm() {
  const router = useRouter();
  const t = useT();
  const [state, formAction] = useActionState(bukaPercakapan, initialState);
  const [pending, startSubmit] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const tr = (code?: string) => (code ? t(code as DictKey) : undefined);

  useEffect(() => {
    if (state.ok && state.token) router.push(`/chat/${state.token}`);
  }, [state.ok, state.token, router]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startSubmit(() => formAction(data));
      }}
      className="space-y-lg"
      noValidate
    >
      {state.message ? (
        <div
          role="alert"
          className="border-l-2 border-danger bg-danger/[0.04] px-sm py-sm text-body-sm text-danger"
        >
          {tr(state.message)}
        </div>
      ) : null}

      <div className="form-row">
        <label htmlFor="chat-name" className="form-label">
          {t("field.name")}
          <span className="text-danger" aria-hidden="true">
            {"\u00A0*"}
          </span>
        </label>
        <div className="form-control">
          <input
            id="chat-name"
            name="name"
            className="field"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(state.errors.name)}
            aria-describedby={state.errors.name ? "err-chat-name" : undefined}
            placeholder={t("field.namePlaceholder")}
          />
          {state.errors.name ? (
            <p id="err-chat-name" className="field-error">
              {tr(state.errors.name)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="chat-phone" className="form-label">
          {t("field.phone")}
          <span className="text-danger" aria-hidden="true">
            {"\u00A0*"}
          </span>
        </label>
        <div className="form-control">
          <input
            id="chat-phone"
            name="phone"
            className="field"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            aria-invalid={Boolean(state.errors.phone)}
            aria-describedby={state.errors.phone ? "err-chat-phone" : undefined}
            placeholder="0812 3456 7890"
          />
          {state.errors.phone ? (
            <p id="err-chat-phone" className="field-error">
              {tr(state.errors.phone)}
            </p>
          ) : (
            <p className="field-hint">{t("field.phoneHint")}</p>
          )}
        </div>
      </div>

      {/* Honeypot — sama seperti formulir buku tamu. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="chat-website">Website</label>
        <input id="chat-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-sm border-t border-border pt-md sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[46ch] text-caption text-ink-muted">{t("chat.privacy")}</p>
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
          {pending ? t("chat.starting") : t("chat.start")}
        </button>
      </div>
    </form>
  );
}

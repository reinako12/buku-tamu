"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { jadikanKunjungan, type JadikanState } from "@/lib/actions/chat";
import { GenderChoice } from "@/components/gender-choice";
import { INSTITUTION_CATEGORIES, PURPOSES } from "@/lib/schemas/visit";
import { useT } from "@/lib/i18n/client";
import type { DictKey } from "@/lib/i18n/dict";

/**
 * Tamu yang mengobrol lewat halaman chat tapi belum mengisi buku tamu.
 * Nama dan nomor WhatsApp sudah dipegang percakapan; petugas hanya melengkapi
 * kolom yang tidak pernah ditanyakan di sana.
 */
export function VisitFromChat({
  conversationId,
  guestName,
  guestPhone,
}: {
  conversationId: string;
  guestName: string;
  guestPhone: string;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<JadikanState | null>(null);
  const [pending, startSubmit] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startSubmit(async () => {
      const hasil = await jadikanKunjungan(conversationId, data);
      setState(hasil);
      if (hasil.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="btn-quiet shrink-0" onClick={() => setOpen(true)}>
        {t("inbox.makeVisit")}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-md py-lg">
      <div className="w-full max-w-form rounded-lg border border-border bg-surface p-md">
        <div className="mb-sm flex items-center justify-between gap-sm">
          <h2 className="text-heading-card text-ink">{t("inbox.visitTitle")}</h2>
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
            {t("walkin.close")}
          </button>
        </div>

        <p className="mb-sm text-caption text-ink-muted">{t("inbox.visitLead")}</p>

        <dl className="mb-sm grid gap-2xs border-y border-border py-xs text-body-sm">
          <div className="flex justify-between gap-sm">
            <dt className="text-ink-muted">{t("walkin.name")}</dt>
            <dd className="text-right font-semibold text-ink">{guestName}</dd>
          </div>
          <div className="flex justify-between gap-sm">
            <dt className="text-ink-muted">{t("walkin.phone")}</dt>
            <dd className="text-right font-mono text-ink">{guestPhone}</dd>
          </div>
        </dl>

        <form onSubmit={handleSubmit} className="space-y-sm">
          {state && !state.ok && state.code ? (
            <p role="alert" className="text-body-sm text-danger">
              {t(state.code as DictKey)}
            </p>
          ) : null}

          <div className="field">
            <label htmlFor="vc-institution" className="field-label">
              {t("walkin.institution")}
            </label>
            <input
              id="vc-institution"
              name="institution"
              className="field"
              maxLength={80}
              required
            />
            {state?.fieldErrors.institution ? (
              <p className="field-error">{t(state.fieldErrors.institution as DictKey)}</p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="vc-cat" className="field-label">
              {t("walkin.institutionCat")}
            </label>
            <select id="vc-cat" name="institutionCat" className="field" required>
              <option value="">{t("field.choose")}</option>
              {INSTITUTION_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {t(`cat.${value}` as DictKey)}
                </option>
              ))}
            </select>
            {state?.fieldErrors.institutionCat ? (
              <p className="field-error">{t(state.fieldErrors.institutionCat as DictKey)}</p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="vc-purpose" className="field-label">
              {t("walkin.purpose")}
            </label>
            <select id="vc-purpose" name="purpose" className="field" required>
              <option value="">{t("field.choose")}</option>
              {PURPOSES.map((value) => (
                <option key={value} value={value}>
                  {t(`purpose.${value}` as DictKey)}
                </option>
              ))}
            </select>
            {state?.fieldErrors.purpose ? (
              <p className="field-error">{t(state.fieldErrors.purpose as DictKey)}</p>
            ) : null}
          </div>

          <div className="field">
            <span className="field-label">{t("walkin.gender")}</span>
            <GenderChoice name="gender" invalid={Boolean(state?.fieldErrors.gender)} />
            {state?.fieldErrors.gender ? (
              <p className="field-error">{t(state.fieldErrors.gender as DictKey)}</p>
            ) : null}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? t("inbox.visitSubmitting") : t("inbox.visitSubmit")}
          </button>
        </form>
      </div>
    </div>
  );
}
